import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { strings } from '@/content/strings/es-AR';
import type { GradeLevel } from '@/types/database';

export const dynamic = 'force-dynamic';

/**
 * Factory de page de isla genérica — reutilizada por palabras, ciencias, argentina.
 * Recibe subject + copy + basePath para generar la lista de conceptos.
 */
export async function renderIslaPage(opts: {
  subject: 'language' | 'science' | 'social';
  title: string;
  subtitle: string;
  emoji: string;
  bgGradient: string;
  basePath: string; // ej '/isla/palabras'
}) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');

  const { data: student } = await supabase
    .from('students')
    .select('id, current_grade')
    .eq('auth_user_id', user.id)
    .maybeSingle();
  if (!student) redirect('/entrar');

  const { data: concepts } = await supabase
    .from('concepts')
    .select('id, code, name_es, description_es')
    .eq('primary_subject', opts.subject)
    .eq('grade', student.current_grade as GradeLevel)
    .is('deleted_at', null)
    .order('display_order', { ascending: true });

  const conceptIds = (concepts ?? []).map(c => c.id as string);
  const { data: masteries } = conceptIds.length > 0
    ? await supabase.from('concept_mastery')
        .select('concept_id, p_known, is_mastered')
        .eq('student_id', student.id as string)
        .in('concept_id', conceptIds)
    : { data: [] };

  const masteryMap = new Map<string, { p: number; mastered: boolean }>();
  for (const m of masteries ?? []) {
    masteryMap.set(m.concept_id as string, {
      p: (m.p_known as number) ?? 0,
      mastered: (m.is_mastered as boolean) ?? false,
    });
  }

  return (
    <div data-testid={`isla-${opts.subject}-page`} className={`min-h-screen ${opts.bgGradient}`}>
      <div className="max-w-3xl mx-auto px-5 py-6 space-y-6">
        <Link
          href="/islas"
          data-testid="isla-back"
          className="inline-flex items-center h-12 px-4 rounded-2xl bg-white/80 text-tinku-ink font-medium border-2 border-tinku-ink/10 hover:bg-white"
        >
          ← {strings.student.islaNumeros.back}
        </Link>
        <header className="text-center space-y-2">
          <div className="text-6xl" aria-hidden>{opts.emoji}</div>
          <h1 className="text-3xl font-bold text-tinku-ink">{opts.title}</h1>
          <p className="text-tinku-ink/75">{opts.subtitle}</p>
        </header>
        {(concepts ?? []).length === 0 ? (
          <section data-testid={`isla-${opts.subject}-no-content`} className="rounded-3xl bg-white/90 p-8 text-center space-y-3 border-2 border-tinku-sea/20">
            <div className="text-5xl" aria-hidden>✨</div>
            <h2 className="text-2xl font-semibold text-tinku-ink">{strings.student.islaNumeros.comingSoonTitle}</h2>
            <p className="text-tinku-ink/70">{strings.student.islaNumeros.comingSoonBody}</p>
          </section>
        ) : (
          <section data-testid="concepts-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(concepts ?? []).map((c) => {
              const m = masteryMap.get(c.id as string);
              const pct = m ? Math.round(m.p * 100) : 0;
              return (
                <Link
                  key={c.id as string}
                  href={`${opts.basePath}/concepto/${c.id}`}
                  data-testid={`concept-tile-${c.code}`}
                  className="block exercise-target rounded-3xl bg-white p-5 hover:scale-[1.01] hover:shadow-md transition-all border-2 border-tinku-ink/10"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-tinku-ink">{c.name_es as string}</h3>
                      <p className="text-sm text-tinku-ink/70 mt-1 line-clamp-2">{c.description_es as string}</p>
                    </div>
                    {m?.mastered && <span aria-hidden className="text-2xl shrink-0">🌟</span>}
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-tinku-ink/10 overflow-hidden">
                    <div className="h-full bg-tinku-sea transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-tinku-ink/60 mt-1">{pct}% de dominio</p>
                </Link>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}
