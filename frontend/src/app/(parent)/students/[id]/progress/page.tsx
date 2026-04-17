import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { getAvatar } from '@/lib/students/avatars';
import { getReviewStreak } from '@/lib/review/streak';
import type { GradeLevel } from '@/types/database';
import { ProgressContent } from './ProgressContent';

export const dynamic = 'force-dynamic';

const GRADE_LABEL: Record<GradeLevel, string> = {
  grade_1: '1° grado', grade_2: '2° grado', grade_3: '3° grado',
  grade_4: '4° grado', grade_5: '5° grado', grade_6: '6° grado', grade_7: '7° grado',
};

export default async function StudentProgressPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: studentId } = await params;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: student } = await supabase
    .from('students')
    .select('id, first_name, current_grade, avatar_id, total_xp, streak_current, streak_max, parent_id')
    .eq('id', studentId)
    .is('deleted_at', null)
    .maybeSingle();
  if (!student || student.parent_id !== user.id) notFound();

  const svc = createServiceSupabase();

  const [concepts, masteries, sessions, reviewStreak] = await Promise.all([
    svc.from('concepts')
      .select('id, code, name_es, grade, display_order')
      .eq('primary_subject', 'math')
      .eq('grade', student.current_grade as GradeLevel)
      .is('deleted_at', null)
      .order('display_order', { ascending: true }),
    svc.from('concept_mastery')
      .select('concept_id, p_known, total_attempts, correct_attempts, is_mastered, last_attempt_at')
      .eq('student_id', studentId),
    svc.from('sessions')
      .select('started_at, duration_seconds, exercises_attempted, exercises_correct')
      .eq('student_id', studentId)
      .not('duration_seconds', 'is', null)
      .gte('started_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
      .order('started_at', { ascending: true }),
    getReviewStreak(studentId),
  ]);

  const conceptsArr = (concepts.data ?? []) as Array<{
    id: string; code: string; name_es: string; display_order: number;
  }>;
  const masteryMap = new Map<string, {
    p_known: number; total_attempts: number; correct_attempts: number;
    is_mastered: boolean; last_attempt_at: string | null;
  }>();
  for (const m of (masteries.data ?? [])) {
    masteryMap.set(m.concept_id as string, {
      p_known: (m.p_known as number) ?? 0,
      total_attempts: (m.total_attempts as number) ?? 0,
      correct_attempts: (m.correct_attempts as number) ?? 0,
      is_mastered: (m.is_mastered as boolean) ?? false,
      last_attempt_at: (m.last_attempt_at as string) ?? null,
    });
  }

  const conceptStats = conceptsArr.map(c => {
    const m = masteryMap.get(c.id) ?? { p_known: 0, total_attempts: 0, correct_attempts: 0, is_mastered: false, last_attempt_at: null };
    const accuracy = m.total_attempts > 0 ? m.correct_attempts / m.total_attempts : null;
    return {
      id: c.id, code: c.code, name: c.name_es,
      pKnown: m.p_known,
      attempts: m.total_attempts,
      accuracy,
      mastered: m.is_mastered,
      status: m.is_mastered ? 'mastered' as const
            : m.p_known >= 0.5 ? 'progress' as const
            : m.total_attempts > 0 ? 'struggling' as const
            : 'not_started' as const,
    };
  });

  // Agregado semanal: minutos por día (últimos 7 días)
  const now = new Date();
  const days: Array<{ date: string; label: string; minutes: number; exercises: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const shifted = new Date(d.getTime() - 3 * 60 * 60 * 1000); // AR
    const dateKey = shifted.toISOString().slice(0, 10);
    days.push({
      date: dateKey,
      label: new Intl.DateTimeFormat('es-AR', { weekday: 'short' }).format(d).slice(0, 2).toUpperCase(),
      minutes: 0,
      exercises: 0,
    });
  }
  const dayMap = new Map(days.map(d => [d.date, d]));
  for (const s of (sessions.data ?? [])) {
    const ts = s.started_at as string;
    const shifted = new Date(new Date(ts).getTime() - 3 * 60 * 60 * 1000);
    const key = shifted.toISOString().slice(0, 10);
    const bucket = dayMap.get(key);
    if (!bucket) continue;
    bucket.minutes += Math.round(((s.duration_seconds as number) ?? 0) / 60);
    bucket.exercises += (s.exercises_attempted as number) ?? 0;
  }

  const totalMinutesWeek = days.reduce((sum, d) => sum + d.minutes, 0);
  const activeDaysWeek = days.filter(d => d.exercises > 0).length;
  const masteredCount = conceptStats.filter(c => c.mastered).length;
  const avatar = getAvatar(student.avatar_id as string);

  return (
    <div data-testid="progress-page" className="space-y-6">
      <header className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/students/${studentId}`}
            data-testid="progress-back"
            className="h-10 px-4 rounded-xl bg-white border-2 border-tinku-ink/10 text-tinku-ink/80 font-medium hover:bg-tinku-mist/50 inline-flex items-center"
          >
            ←
          </Link>
          <div className={`w-12 h-12 rounded-full ${avatar.bgClass} flex items-center justify-center text-2xl`}>
            <span aria-hidden>{avatar.emoji}</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-tinku-ink">Progreso de {student.first_name as string}</h1>
            <p className="text-sm text-tinku-ink/60">
              {GRADE_LABEL[student.current_grade as GradeLevel]} · Matemática
            </p>
          </div>
        </div>
      </header>

      <ProgressContent
        totalXp={(student.total_xp as number) ?? 0}
        generalStreak={(student.streak_current as number) ?? 0}
        reviewStreak={reviewStreak}
        totalMinutesWeek={totalMinutesWeek}
        activeDaysWeek={activeDaysWeek}
        masteredCount={masteredCount}
        totalConcepts={conceptStats.length}
        concepts={conceptStats}
        days={days}
      />
    </div>
  );
}
