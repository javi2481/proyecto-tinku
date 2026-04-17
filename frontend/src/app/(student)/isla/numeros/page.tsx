import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { strings } from '@/content/strings/es-AR';
import { getDailyReviewStatus } from '@/lib/review/daily';
import { DailyReviewCard } from './DailyReviewCard';
import type { GradeLevel } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function IslaNumerosPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');

  const { data: student } = await supabase
    .from('students')
    .select('id, first_name, current_grade, total_xp')
    .eq('auth_user_id', user.id)
    .maybeSingle();
  if (!student) redirect('/entrar');

  const grade = student.current_grade as GradeLevel;

  const [{ data: concepts }, reviewStatus] = await Promise.all([
    supabase.from('concepts')
      .select('id, code, name_es, description_es, display_order')
      .eq('primary_subject', 'math')
      .eq('grade', grade)
      .is('deleted_at', null)
      .order('display_order', { ascending: true }),
    getDailyReviewStatus(),
  ]);

  const conceptsList = concepts ?? [];
  const conceptIds = conceptsList.map((c) => c.id as string);

  // Mastery por concepto para este student
  const { data: masteries } = conceptIds.length
    ? await supabase
        .from('concept_mastery')
        .select('concept_id, p_known, is_mastered, total_attempts')
        .eq('student_id', student.id as string)
        .in('concept_id', conceptIds)
    : { data: [] as never[] };

  const masteryByConcept = new Map<string, { p_known: number; is_mastered: boolean; total_attempts: number }>();
  for (const m of masteries ?? []) {
    masteryByConcept.set(m.concept_id as string, {
      p_known: (m.p_known as number) ?? 0.1,
      is_mastered: (m.is_mastered as boolean) ?? false,
      total_attempts: (m.total_attempts as number) ?? 0,
    });
  }

  return (
    <div className="min-h-screen px-5 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href="/islas"
          data-testid="back-to-islas"
          className="inline-flex items-center h-12 px-4 rounded-2xl bg-white/70 text-tinku-ink font-medium hover:bg-white border-2 border-tinku-ink/10"
        >
          {strings.student.islaNumeros.back}
        </Link>

        <header className="text-center space-y-3 pt-4">
          <div className="text-6xl" aria-hidden>🏝️</div>
          <h1 className="text-3xl font-bold text-tinku-ink">{strings.student.islaNumeros.title}</h1>
          <p className="text-tinku-ink/70">{strings.student.islaNumeros.subtitle}</p>
        </header>

        {conceptsList.length === 0 ? (
          <section data-testid="isla-numeros-no-content" className="rounded-3xl bg-white/90 p-8 text-center space-y-3 border-2 border-tinku-sea/20">
            <div className="text-5xl" aria-hidden>✨</div>
            <h2 className="text-2xl font-semibold text-tinku-ink">{strings.student.islaNumeros.comingSoonTitle}</h2>
            <p className="text-tinku-ink/70">{strings.student.islaNumeros.comingSoonBody}</p>
          </section>
        ) : (
          <>
            {reviewStatus.hasEnoughContent && (
              <DailyReviewCard alreadyDoneToday={reviewStatus.alreadyDoneToday} />
            )}
            <section data-testid="concepts-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {conceptsList.map((c) => {
              const id = c.id as string;
              const m = masteryByConcept.get(id);
              const pct = Math.round((m?.p_known ?? 0.1) * 100);
              const mastered = m?.is_mastered ?? false;
              return (
                <Link
                  key={id}
                  href={`/isla/numeros/concepto/${id}`}
                  data-testid={`concept-tile-${c.code}`}
                  className="block rounded-3xl bg-white p-5 border-2 border-tinku-ink/10 hover:border-tinku-sea/50 hover:shadow-md transition-all exercise-target"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${
                        mastered ? 'bg-tinku-leaf/20' : 'bg-tinku-sea/15'
                      }`}
                    >
                      <span aria-hidden>{mastered ? '🌟' : '🎯'}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-tinku-ink">{c.name_es as string}</h3>
                      <p className="text-sm text-tinku-ink/60 mt-1">{c.description_es as string}</p>
                      <div className="mt-3">
                        <div className="h-2 rounded-full bg-tinku-ink/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${mastered ? 'bg-tinku-leaf' : 'bg-tinku-sea'}`}
                            style={{ width: `${pct}%` }}
                            data-testid={`concept-progress-${c.code}`}
                          />
                        </div>
                        <p className="text-xs text-tinku-ink/50 mt-1">
                          {mastered ? '¡Dominado!' : `${pct}% aprendido`}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </section>
          </>
        )}
      </div>
    </div>
  );
}
