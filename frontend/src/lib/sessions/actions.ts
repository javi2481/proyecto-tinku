'use server';

import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { computeXp, updatePKnown, pickDifficulty } from '@/lib/adaptive/engine';
import { logger } from '@/lib/observability/logger';
import { logDataAccess } from '@/lib/audit/log';
import { trackStrugglingFromAttempt } from '@/lib/review/struggling';
import type { AnswerOutcome, Exercise, ExerciseDifficulty } from '@/types/database';

async function requireStudent() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');
  const role = (user.user_metadata as { role?: string; student_id?: string } | null)?.role;
  const studentId = (user.user_metadata as { student_id?: string } | null)?.student_id;
  if (role !== 'student' || !studentId) redirect('/entrar');
  return { user, studentId };
}

// =============================================================================
// START or REUSE SESSION
// =============================================================================

export async function startSessionAction(island: 'math' | 'language' | 'science' | 'social' | 'tech'): Promise<{ sessionId: string }> {
  const { studentId } = await requireStudent();
  const svc = createServiceSupabase();

  // Reutilizar una sesión abierta reciente (< 2h de inactividad) si existe
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const { data: openSession } = await svc
    .from('sessions')
    .select('id, started_at')
    .eq('student_id', studentId)
    .eq('island', island)
    .is('ended_at', null)
    .gte('started_at', cutoff)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (openSession) return { sessionId: openSession.id as string };

  const { data: newSession, error } = await svc
    .from('sessions')
    .insert({ student_id: studentId, island })
    .select('id')
    .single();
  if (error || !newSession) {
    await logger.error('session.start', error?.message ?? 'no session');
    throw new Error('Could not start session');
  }
  return { sessionId: newSession.id as string };
}

// =============================================================================
// GET NEXT EXERCISE for a student+concept
// =============================================================================

export interface NextExerciseResult {
  kind: 'exercise';
  exercise: Exercise;
  pKnown: number;
  attemptsSoFar: number;
}
export interface MasteredResult {
  kind: 'mastered';
  pKnown: number;
}
export interface NoContentResult {
  kind: 'no_content';
  pKnown: number;
}

export async function getNextExerciseAction(
  conceptId: string,
  excludeExerciseId?: string | null,
): Promise<NextExerciseResult | MasteredResult | NoContentResult> {
  const { studentId } = await requireStudent();
  const svc = createServiceSupabase();

  const { data: mastery } = await svc
    .from('concept_mastery')
    .select('p_known, total_attempts')
    .eq('student_id', studentId)
    .eq('concept_id', conceptId)
    .maybeSingle();

  const pKnown = (mastery?.p_known as number | undefined) ?? 0.1;
  const attempts = (mastery?.total_attempts as number | undefined) ?? 0;
  const target = pickDifficulty(pKnown);

  if (target === 'mastered') {
    return { kind: 'mastered', pKnown };
  }

  // Tryecto de difficulty: target primero, luego vecinos para no quedar sin contenido
  const fallbackOrder: ExerciseDifficulty[] =
    target === 'easy' ? ['easy', 'medium', 'hard']
    : target === 'medium' ? ['medium', 'easy', 'hard']
    : ['hard', 'medium', 'easy'];

  for (const diff of fallbackOrder) {
    let query = svc
      .from('exercises')
      .select('*')
      .eq('concept_id', conceptId)
      .eq('difficulty', diff)
      .eq('pedagogical_review_status', 'approved')
      .is('deleted_at', null);
    if (excludeExerciseId) query = query.neq('id', excludeExerciseId);

    const { data: exercises } = await query.limit(20);
    if (exercises && exercises.length > 0) {
      const picked = exercises[Math.floor(Math.random() * exercises.length)];
      return {
        kind: 'exercise',
        exercise: picked as unknown as Exercise,
        pKnown,
        attemptsSoFar: attempts,
      };
    }
  }

  return { kind: 'no_content', pKnown };
}

// =============================================================================
// SUBMIT ATTEMPT — core del ciclo adaptativo
// =============================================================================

export interface SubmitAttemptInput {
  sessionId: string;
  exerciseId: string;
  answer: unknown; // JSON serializable
  timeSpentSeconds: number;
  hintsUsed: number;
}

export interface SubmitAttemptResult {
  correct: boolean;
  outcome: AnswerOutcome;
  xpEarned: number;
  pKnownNew: number;
  delta: number;
  justMastered: boolean;
  newBadges: Array<{ code: string; name_es: string; icon_url: string }>;
}

export async function submitAttemptAction(input: SubmitAttemptInput): Promise<SubmitAttemptResult> {
  const { studentId } = await requireStudent();
  const svc = createServiceSupabase();

  // Fetch exercise + mastery + previous attempts on this exercise (para outcome retry)
  const [{ data: exercise }, { data: mastery }, { data: previousAttempts }] = await Promise.all([
    svc.from('exercises').select('id, concept_id, difficulty, correct_answer').eq('id', input.exerciseId).maybeSingle(),
    svc.from('concept_mastery').select('p_known, total_attempts, is_mastered').eq('student_id', studentId).maybeSingle(),
    svc.from('attempts').select('attempt_number').eq('student_id', studentId).eq('exercise_id', input.exerciseId).order('attempt_number', { ascending: false }).limit(1),
  ]);

  if (!exercise) throw new Error('Exercise not found');

  const conceptId = exercise.concept_id as string;

  // Último attempt previo del alumno sobre este mismo concepto (para "momento de ayuda del grande")
  const { data: lastConceptAttempt } = await svc
    .from('attempts')
    .select('outcome')
    .eq('student_id', studentId)
    .eq('concept_id', conceptId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const previousOutcomeOnConcept = (lastConceptAttempt?.outcome as AnswerOutcome | undefined) ?? null;

  const difficulty = exercise.difficulty as ExerciseDifficulty;
  const correctValue = (exercise.correct_answer as { value: unknown }).value;

  const givenValue = (input.answer as { value?: unknown })?.value ?? input.answer;
  const isCorrect =
    typeof correctValue === 'string' && typeof givenValue === 'string'
      ? correctValue.trim() === givenValue.trim()
      : correctValue === givenValue;

  const attemptNumber = ((previousAttempts?.[0]?.attempt_number as number | undefined) ?? 0) + 1;

  let outcome: AnswerOutcome;
  if (isCorrect) outcome = attemptNumber === 1 ? 'correct_first' : 'correct_retry';
  else outcome = 'incorrect';

  // XP vía xp_rules (si falla, fallback a helper)
  const { data: rule } = await svc
    .from('xp_rules')
    .select('base_xp, hint_penalty')
    .eq('difficulty', difficulty)
    .eq('outcome', outcome)
    .maybeSingle();
  const baseXp = (rule?.base_xp as number | undefined) ?? 0;
  const hintPenalty = (rule?.hint_penalty as number | undefined) ?? 0;
  const xpEarned = computeXp(baseXp, outcome, input.hintsUsed, hintPenalty);

  // Insertar attempt (inmutable)
  const { error: attErr } = await svc.from('attempts').insert({
    session_id: input.sessionId,
    student_id: studentId,
    exercise_id: input.exerciseId,
    concept_id: conceptId,
    attempt_number: attemptNumber,
    outcome,
    answer_given: { value: givenValue } as Record<string, unknown>,
    time_spent_seconds: input.timeSpentSeconds,
    hints_used: input.hintsUsed,
    xp_earned: xpEarned,
  });
  if (attErr) {
    await logger.error('attempt.insert', attErr.message, { sessionId: input.sessionId, exerciseId: input.exerciseId });
    throw new Error('Could not record attempt');
  }

  // Update mastery
  const prevPKnown = (mastery?.p_known as number | undefined) ?? 0.1;
  const { pKnownNew, delta, isMastered } = updatePKnown(prevPKnown, outcome, input.hintsUsed);
  const wasMastered = (mastery?.is_mastered as boolean | undefined) ?? false;
  const justMastered = !wasMastered && isMastered;

  await svc.from('concept_mastery').upsert({
    student_id: studentId,
    concept_id: conceptId,
    p_known: pKnownNew,
    last_p_known_delta: delta,
    total_attempts: ((mastery?.total_attempts as number | undefined) ?? 0) + 1,
    correct_attempts: ((mastery?.total_attempts as number | undefined) ?? 0) + (isCorrect ? 1 : 0),
    is_mastered: isMastered,
    mastered_at: justMastered ? new Date().toISOString() : undefined,
    last_attempt_at: new Date().toISOString(),
  }, { onConflict: 'student_id,concept_id' });

  // Update session counters
  const { data: sess } = await svc
    .from('sessions')
    .select('exercises_attempted, exercises_correct, xp_earned')
    .eq('id', input.sessionId)
    .maybeSingle();
  if (sess) {
    await svc.from('sessions').update({
      exercises_attempted: ((sess.exercises_attempted as number) ?? 0) + 1,
      exercises_correct: ((sess.exercises_correct as number) ?? 0) + (isCorrect ? 1 : 0),
      xp_earned: ((sess.xp_earned as number) ?? 0) + xpEarned,
    }).eq('id', input.sessionId);
  }

  // Update student total_xp
  if (xpEarned > 0) {
    const { data: st } = await svc.from('students').select('total_xp').eq('id', studentId).maybeSingle();
    await svc.from('students').update({
      total_xp: ((st?.total_xp as number) ?? 0) + xpEarned,
    }).eq('id', studentId);
  }

  // Badge evaluation mínima Ola 1
  const newBadges: Array<{ code: string; name_es: string; icon_url: string }> = [];

  const { count: priorAttempts } = await svc
    .from('attempts')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', studentId);
  if ((priorAttempts ?? 0) === 1) {
    const badge = await awardBadge(svc, studentId, 'first_exercise');
    if (badge) newBadges.push(badge);
  }
  if (justMastered) {
    const badge = await awardBadge(svc, studentId, 'concept_mastered');
    if (badge) newBadges.push(badge);
  }

  // Audit log (fire-and-forget)
  void auditAttempt(studentId, {
    session_id: input.sessionId,
    exercise_id: input.exerciseId,
    concept_id: conceptId,
    outcome,
    xp: xpEarned,
    mastered: justMastered,
    badges_awarded: newBadges.map((b) => b.code),
  });

  // "Momento de ayuda del grande" — alerta al padre si hay 2 incorrect seguidos
  void trackStrugglingFromAttempt({
    studentId,
    conceptId,
    currentOutcome: outcome,
    previousOutcomeOnConcept,
  });

  return {
    correct: isCorrect,
    outcome,
    xpEarned,
    pKnownNew,
    delta,
    justMastered,
    newBadges,
  };
}

// Log de auditoría NO bloqueante, fuera del hot path.
async function auditAttempt(studentId: string, data: Record<string, unknown>) {
  await logDataAccess({
    studentId,
    accessType: 'write',
    accessTarget: 'attempts.submit',
    metadata: data,
  });
}

async function awardBadge(
  svc: ReturnType<typeof createServiceSupabase>,
  studentId: string,
  code: string,
): Promise<{ code: string; name_es: string; icon_url: string } | null> {
  const { data: catalog } = await svc
    .from('badges_catalog')
    .select('id, code, name_es, icon_url, xp_reward')
    .eq('code', code)
    .eq('is_active', true)
    .maybeSingle();
  if (!catalog) return null;

  const { data: existing } = await svc
    .from('student_badges')
    .select('id')
    .eq('student_id', studentId)
    .eq('badge_id', catalog.id as string)
    .maybeSingle();
  if (existing) return null;

  await svc.from('student_badges').insert({
    student_id: studentId,
    badge_id: catalog.id as string,
  });
  // Sumar XP del badge
  if ((catalog.xp_reward as number) > 0) {
    const { data: st } = await svc.from('students').select('total_xp').eq('id', studentId).maybeSingle();
    await svc.from('students').update({
      total_xp: ((st?.total_xp as number) ?? 0) + (catalog.xp_reward as number),
    }).eq('id', studentId);
  }
  return {
    code: catalog.code as string,
    name_es: catalog.name_es as string,
    icon_url: catalog.icon_url as string,
  };
}

// =============================================================================
// CLOSE SESSION (al salir de la isla)
// =============================================================================

export async function closeSessionAction(sessionId: string, reason: 'user_exit' | 'parental_limit' = 'user_exit') {
  try {
    const svc = createServiceSupabase();
    const { data: sess } = await svc
      .from('sessions')
      .select('started_at')
      .eq('id', sessionId)
      .maybeSingle();
    if (!sess) return;
    const duration = Math.floor((Date.now() - new Date(sess.started_at as string).getTime()) / 1000);
    await svc.from('sessions').update({
      ended_at: new Date().toISOString(),
      duration_seconds: duration,
      close_reason: reason,
    }).eq('id', sessionId);
  } catch (e) {
    await logger.warn('session.close', 'failed', {
      err: e instanceof Error ? e.message : String(e),
    });
  }
}
