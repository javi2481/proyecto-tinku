'use server';

import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { logger } from '@/lib/observability/logger';
import type { StudentProgressStats, DailyStats, DataExport } from '@/types/api';

/**
 * Requiere que el usuario sea padre y que el hijo pertenezca a ese padre.
 */
async function requireParentOf(studentId: string) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');

  const svc = createServiceSupabase();
  const { data: student, error } = await svc
    .from('students')
    .select('parent_id')
    .eq('id', studentId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    await logger.error('requireParentOf', error.message);
    throw new Error('Database error');
  }

  if (!student || student.parent_id !== user.id) {
    throw new Error('Unauthorized');
  }

  return { user, studentId };
}

// =============================================================================
// GET STUDENT PROGRESS STATS
// =============================================================================

export async function getStudentProgressStats(
  studentId: string,
): Promise<StudentProgressStats> {
  await requireParentOf(studentId);
  const svc = createServiceSupabase();

  // Get student info
  const { data: student, error: studentError } = await svc
    .from('students')
    .select('total_xp, streak_current, streak_max, last_active_at')
    .eq('id', studentId)
    .maybeSingle();

  if (studentError) {
    await logger.error('getStudentProgressStats.student', studentError.message);
  }

  // Get ALL sessions (completed too)
  const { data: sessions, error: sessionsError } = await svc
    .from('sessions')
    .select('exercises_attempted, exercises_correct')
    .eq('student_id', studentId);

  if (sessionsError) {
    await logger.error('getStudentProgressStats.sessions', sessionsError.message);
  }

  // Get mastery
  const { data: masteries, error: masteryError } = await svc
    .from('concept_mastery')
    .select('is_mastered, total_attempts')
    .eq('student_id', studentId);

  if (masteryError) {
    await logger.error('getStudentProgressStats.mastery', masteryError.message);
  }

  const masteredCount = (masteries ?? []).filter(
    (m) => Boolean(m.is_mastered) === true,
  ).length;
  const inProgressCount = (masteries ?? []).filter(
    (m) => Boolean(m.is_mastered) !== true && Number(m.total_attempts ?? 0) > 0,
  ).length;

  const totalExercises = (sessions ?? []).reduce(
    (sum, s) => sum + Number(s.exercises_attempted ?? 0),
    0,
  );
  const correctExercises = (sessions ?? []).reduce(
    (sum, s) => sum + Number(s.exercises_correct ?? 0),
    0,
  );

  return {
    total_xp: Number(student?.total_xp ?? 0),
    streak_current: Number(student?.streak_current ?? 0),
    streak_max: Number(student?.streak_max ?? 0),
    mastered_count: masteredCount,
    concepts_in_progress: inProgressCount,
    last_active_at: typeof student?.last_active_at === 'string' ? student.last_active_at : null,
    exercises_total: totalExercises,
    exercises_correct: correctExercises,
  };
}

// =============================================================================
// GET DAILY STATS
// =============================================================================

export async function getDailyStats(studentId: string): Promise<DailyStats> {
  await requireParentOf(studentId);
  const svc = createServiceSupabase();

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data: sessions, error } = await svc
    .from('sessions')
    .select('exercises_attempted, exercises_correct, xp_earned, duration_seconds')
    .eq('student_id', studentId)
    .gte('started_at', today)
    .lt('started_at', tomorrow);

  if (error) {
    await logger.error('getDailyStats', error.message);
  }

  const stats = sessions ?? [];
  return {
    date: today,
    exercises_attempted: stats.reduce((sum, s) => sum + Number(s.exercises_attempted ?? 0), 0),
    exercises_correct: stats.reduce((sum, s) => sum + Number(s.exercises_correct ?? 0), 0),
    xp_earned: stats.reduce((sum, s) => sum + Number(s.xp_earned ?? 0), 0),
    time_spent_seconds: stats.reduce((sum, s) => sum + Number(s.duration_seconds ?? 0), 0),
  };
}

// =============================================================================
// EXPORT STUDENT DATA (GDPR)
// =============================================================================

export async function exportStudentData(studentId: string): Promise<DataExport> {
  await requireParentOf(studentId);
  const svc = createServiceSupabase();

  const studentResult = await svc
    .from('students')
    .select('first_name, birth_year')
    .eq('id', studentId)
    .maybeSingle();

  const sessionsResult = await svc
    .from('sessions')
    .select('*')
    .eq('student_id', studentId)
    .order('started_at', { ascending: false })
    .limit(100);

  const attemptsResult = await svc
    .from('attempts')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(500);

  const badgesResult = await svc
    .from('student_badges')
    .select('*, badges_catalog!inner(code, name_es, icon_url)')
    .eq('student_id', studentId)
    .order('earned_at', { ascending: false });

  const masteryResult = await svc
    .from('concept_mastery')
    .select('*')
    .eq('student_id', studentId);

  // Log any errors
  if (studentResult.error) {
    await logger.error('exportStudentData.student', studentResult.error.message);
  }
  if (sessionsResult.error) {
    await logger.error('exportStudentData.sessions', sessionsResult.error.message);
  }
  if (attemptsResult.error) {
    await logger.error('exportStudentData.attempts', attemptsResult.error.message);
  }
  if (badgesResult.error) {
    await logger.error('exportStudentData.badges', badgesResult.error.message);
  }
  if (masteryResult.error) {
    await logger.error('exportStudentData.mastery', masteryResult.error.message);
  }

  return {
    exported_at: new Date().toISOString(),
    student: {
      first_name: typeof studentResult.data?.first_name === 'string' ? studentResult.data.first_name : '',
      birth_year: typeof studentResult.data?.birth_year === 'number' ? studentResult.data.birth_year : 0,
    },
    sessions: (sessionsResult.data ?? []) as Record<string, unknown>[],
    attempts: (attemptsResult.data ?? []) as Record<string, unknown>[],
    badges: (badgesResult.data ?? []) as Record<string, unknown>[],
    mastery: (masteryResult.data ?? []) as Record<string, unknown>[],
  };
}