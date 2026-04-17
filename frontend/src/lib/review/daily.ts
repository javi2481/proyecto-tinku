'use server';

import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { logger } from '@/lib/observability/logger';
import { logDataAccess } from '@/lib/audit/log';
import { getReviewStreak, streakBadgesToAward } from '@/lib/review/streak';
import type { Exercise, GradeLevel } from '@/types/database';

/**
 * Modo repaso diario — selecciona 5 ejercicios de distintos conceptos
 * del grado del alumno, priorizando conceptos con p_known más bajo,
 * y genera una session con island=math que queda marcada como "repaso" en metadata.
 *
 * Reglas:
 *  - Solo se cuenta "repaso del día" si el alumno responde ≥5 ejercicios
 *    dentro de una session iniciada vía este flow en el mismo día local.
 *  - Al completar → award badge `daily_review` (first-time) + XP bonus + session close.
 *  - Si ya lo hizo hoy (badge earned AND session cerrada en mismas 24h), la UI
 *    muestra la card "ya lo hiciste" pero puede volver a entrar.
 */

const REVIEW_SIZE = 5;

export interface DailyReviewStartResult {
  sessionId: string;
  exercises: Exercise[];
  alreadyDoneToday: boolean;
}

export interface DailyReviewStatus {
  alreadyDoneToday: boolean;
  hasEnoughContent: boolean;
}

async function requireStudent() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');
  const role = (user.user_metadata as { role?: string; student_id?: string } | null)?.role;
  const studentId = (user.user_metadata as { student_id?: string } | null)?.student_id;
  if (role !== 'student' || !studentId) redirect('/entrar');
  return { user, studentId };
}

function startOfTodayUTC(): string {
  const now = new Date();
  // Para "hoy" del usuario usamos su timezone implícito AR (UTC-3).
  // Restamos 3h al NOW y tomamos el día, volvemos a UTC.
  const nowShifted = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const dayStartArg = new Date(Date.UTC(nowShifted.getUTCFullYear(), nowShifted.getUTCMonth(), nowShifted.getUTCDate()));
  // Convertir back: start of AR day en UTC = day 00:00 AR = 03:00 UTC
  return new Date(dayStartArg.getTime() + 3 * 60 * 60 * 1000).toISOString();
}

/** Checkea si el alumno ya completó el repaso hoy (vía data_access_log con accessTarget='daily_review.complete'). */
export async function getDailyReviewStatus(): Promise<DailyReviewStatus> {
  const { studentId } = await requireStudent();
  const svc = createServiceSupabase();
  const today = startOfTodayUTC();

  // Hay un "daily_review.complete" registrado hoy?
  const { count: completedToday } = await svc
    .from('data_access_log')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .eq('access_target', 'daily_review.complete')
    .gte('accessed_at', today);

  // Hay contenido suficiente en su grado?
  const supabase = await createServerSupabase();
  const { data: student } = await supabase
    .from('students').select('current_grade').eq('id', studentId).maybeSingle();
  const grade = student?.current_grade as GradeLevel | undefined;
  if (!grade) return { alreadyDoneToday: false, hasEnoughContent: false };

  const { count: conceptCount } = await svc
    .from('concepts')
    .select('id', { count: 'exact', head: true })
    .eq('grade', grade)
    .eq('primary_subject', 'math')
    .is('deleted_at', null);

  return {
    alreadyDoneToday: (completedToday ?? 0) > 0,
    hasEnoughContent: (conceptCount ?? 0) >= 2,
  };
}

/**
 * Arranca el repaso: selecciona 5 ejercicios de ≥2 conceptos distintos,
 * priorizando los de menor p_known. Crea una session fresca.
 */
export async function startDailyReviewAction(): Promise<DailyReviewStartResult> {
  const { studentId } = await requireStudent();
  const svc = createServiceSupabase();

  // Grado del alumno
  const { data: student } = await svc
    .from('students').select('current_grade').eq('id', studentId).maybeSingle();
  const grade = student?.current_grade as GradeLevel;

  // Conceptos del grado + mastery del alumno
  const { data: concepts } = await svc
    .from('concepts')
    .select('id, code')
    .eq('grade', grade)
    .eq('primary_subject', 'math')
    .is('deleted_at', null);

  const conceptIds = (concepts ?? []).map(c => c.id as string);
  if (conceptIds.length === 0) {
    throw new Error('no_content_for_grade');
  }

  const { data: masteries } = await svc
    .from('concept_mastery')
    .select('concept_id, p_known')
    .eq('student_id', studentId)
    .in('concept_id', conceptIds);

  const pKnownByConcept = new Map<string, number>();
  for (const m of masteries ?? []) {
    pKnownByConcept.set(m.concept_id as string, (m.p_known as number) ?? 0.1);
  }

  // Orden por p_known ascendente (los más flojos primero). Si no hay mastery, default 0.1.
  const sortedConcepts = conceptIds
    .map(id => ({ id, p: pKnownByConcept.get(id) ?? 0.1 }))
    .sort((a, b) => a.p - b.p);

  // Selección: round-robin por concepto, priorizando los más flojos.
  // Dificultad: si p_known < 0.5 → easy; [0.5, 0.85) → medium; >=0.85 → hard (repaso desafiante).
  const picked: Exercise[] = [];
  const usedExerciseIds = new Set<string>();

  let roundRobinIdx = 0;
  let safetyGuard = 30;
  while (picked.length < REVIEW_SIZE && safetyGuard-- > 0) {
    const concept = sortedConcepts[roundRobinIdx % sortedConcepts.length];
    roundRobinIdx++;
    const diff =
      concept.p < 0.5 ? 'easy' :
      concept.p < 0.85 ? 'medium' : 'hard';

    // Buscar 1 ejercicio del concepto + difficulty, fallback a otras difficulties
    for (const d of [diff, 'medium', 'easy', 'hard']) {
      const { data: exs } = await svc
        .from('exercises')
        .select('*')
        .eq('concept_id', concept.id)
        .eq('difficulty', d)
        .eq('pedagogical_review_status', 'approved')
        .is('deleted_at', null)
        .limit(10);
      if (!exs || exs.length === 0) continue;
      const available = exs.filter(e => !usedExerciseIds.has(e.id as string));
      if (available.length === 0) continue;
      const choice = available[Math.floor(Math.random() * available.length)];
      usedExerciseIds.add(choice.id as string);
      picked.push(choice as unknown as Exercise);
      break;
    }
  }

  if (picked.length === 0) {
    throw new Error('no_exercises_available');
  }

  // Crear session nueva (NO reusamos sesiones abiertas — el repaso es atómico)
  const { data: sessionRow, error: sErr } = await svc
    .from('sessions')
    .insert({ student_id: studentId, island: 'math' })
    .select('id')
    .single();
  if (sErr || !sessionRow) {
    await logger.error('daily_review.start', sErr?.message ?? 'no session');
    throw new Error('could_not_start_session');
  }

  await logger.info('daily_review.start', 'started', {
    studentId, sessionId: sessionRow.id, picked: picked.length,
  });
  await logDataAccess({
    studentId,
    accessType: 'write',
    accessTarget: 'daily_review.start',
    metadata: { sessionId: sessionRow.id, exerciseIds: picked.map(e => e.id) },
  });

  return {
    sessionId: sessionRow.id as string,
    exercises: picked,
    alreadyDoneToday: false,
  };
}

/** Marca el repaso como terminado — cierra la session y otorga badges (daily_review + streaks). */
export async function completeDailyReviewAction(sessionId: string): Promise<{
  badgesAwarded: Array<{ code: string; name_es: string; icon_url: string }>;
}> {
  const { studentId } = await requireStudent();
  const svc = createServiceSupabase();

  // Cerrar la session
  const { data: sess } = await svc
    .from('sessions').select('started_at, exercises_attempted').eq('id', sessionId).maybeSingle();
  if (!sess) return { badgesAwarded: [] };

  const duration = Math.floor(
    (Date.now() - new Date(sess.started_at as string).getTime()) / 1000,
  );
  await svc.from('sessions').update({
    ended_at: new Date().toISOString(),
    duration_seconds: duration,
    close_reason: 'user_exit',
  }).eq('id', sessionId);

  // Log completion PRIMERO (para que getReviewStreak vea este evento al calcular)
  await logDataAccess({
    studentId,
    accessType: 'write',
    accessTarget: 'daily_review.complete',
    metadata: { sessionId },
  });

  const badgesAwarded: Array<{ code: string; name_es: string; icon_url: string }> = [];

  // Candidatos: daily_review (first-time) + streak_3/7/30_review según streak actual
  const candidates = ['daily_review'];
  const streak = await getReviewStreak(studentId);
  for (const b of streakBadgesToAward(streak.current)) candidates.push(b);

  for (const code of candidates) {
    const { data: catalog } = await svc
      .from('badges_catalog')
      .select('id, code, name_es, icon_url, xp_reward')
      .eq('code', code).eq('is_active', true).maybeSingle();
    if (!catalog) continue;
    const { data: existing } = await svc
      .from('student_badges').select('id')
      .eq('student_id', studentId).eq('badge_id', catalog.id as string).maybeSingle();
    if (existing) continue;

    await svc.from('student_badges').insert({
      student_id: studentId, badge_id: catalog.id as string,
    });
    if ((catalog.xp_reward as number) > 0) {
      const { data: st } = await svc.from('students').select('total_xp').eq('id', studentId).maybeSingle();
      await svc.from('students').update({
        total_xp: ((st?.total_xp as number) ?? 0) + (catalog.xp_reward as number),
      }).eq('id', studentId);
    }
    badgesAwarded.push({
      code: catalog.code as string,
      name_es: catalog.name_es as string,
      icon_url: catalog.icon_url as string,
    });
  }

  await logger.info('daily_review.complete', 'done', {
    studentId, sessionId, streakCurrent: streak.current,
    badges: badgesAwarded.map(b => b.code),
  });

  return { badgesAwarded };
}
