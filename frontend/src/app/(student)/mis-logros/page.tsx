import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { strings } from '@/content/strings/es-AR';
import { ShareAchievementsButton } from './ShareAchievementsButton';

export const dynamic = 'force-dynamic';

interface CatalogRow {
  id: string;
  code: string;
  name_es: string;
  description_es: string;
  icon_url: string;
  xp_reward: number;
}

export default async function MisLogrosPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');

  const { data: student } = await supabase
    .from('students')
    .select('id, first_name, total_xp')
    .eq('auth_user_id', user.id)
    .maybeSingle();
  if (!student) redirect('/entrar');

  // Catálogo completo (RLS permite a authenticated leer is_active=true)
  const { data: catalog } = await supabase
    .from('badges_catalog')
    .select('id, code, name_es, description_es, icon_url, xp_reward')
    .eq('is_active', true);

  const { data: earned } = await supabase
    .from('student_badges')
    .select('badge_id, earned_at')
    .eq('student_id', student.id as string);

  const earnedMap = new Map<string, string>();
  for (const r of earned ?? []) {
    earnedMap.set(r.badge_id as string, r.earned_at as string);
  }

  const rows = (catalog ?? []) as unknown as CatalogRow[];
  const earnedRows = rows.filter((b) => earnedMap.has(b.id));
  const lockedRows = rows.filter((b) => !earnedMap.has(b.id));

  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long' }).format(new Date(iso));

  return (
    <div className="min-h-screen px-5 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href="/islas"
          data-testid="logros-back"
          className="inline-flex items-center h-12 px-4 rounded-2xl bg-white/70 text-tinku-ink font-medium hover:bg-white border-2 border-tinku-ink/10"
        >
          ← {strings.common.back}
        </Link>

        <header className="text-center space-y-3 pt-4">
          <div className="text-6xl" aria-hidden>🏅</div>
          <h1 className="text-3xl font-bold text-tinku-ink">Mis medallas</h1>
          <p className="text-tinku-ink/70">
            Ganaste <strong data-testid="logros-earned-count">{earnedRows.length}</strong> de {rows.length} medallas.
          </p>
          {earnedRows.length > 0 && (
            <div className="pt-3 flex justify-center">
              <ShareAchievementsButton
                studentName={(student.first_name as string) ?? 'tu hijo/a'}
                totalXp={(student.total_xp as number) ?? 0}
                earnedBadges={earnedRows.map((b) => ({
                  name_es: b.name_es,
                  earned_at: earnedMap.get(b.id) as string,
                }))}
              />
            </div>
          )}
        </header>

        <section data-testid="logros-earned" className="space-y-3">
          <h2 className="text-xl font-semibold text-tinku-ink">Ganadas</h2>
          {earnedRows.length === 0 ? (
            <p data-testid="logros-earned-empty" className="text-tinku-ink/60 bg-white/60 rounded-2xl p-5 text-center">
              Todavía no ganaste medallas. ¡Seguí jugando y vas a desbloquear la primera!
            </p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {earnedRows.map((b) => (
                <li
                  key={b.id}
                  data-testid={`logro-earned-${b.code}`}
                  className="rounded-3xl bg-white p-5 border-2 border-tinku-leaf/40 flex items-start gap-4"
                >
                  <div className="w-14 h-14 rounded-2xl bg-tinku-leaf/15 flex items-center justify-center text-3xl shrink-0" aria-hidden>
                    🏅
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-tinku-ink">{b.name_es}</h3>
                    <p className="text-sm text-tinku-ink/70 leading-snug">{b.description_es}</p>
                    <p className="text-xs text-tinku-leaf mt-1">Ganada el {fmtDate(earnedMap.get(b.id) as string)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section data-testid="logros-locked" className="space-y-3">
          <h2 className="text-xl font-semibold text-tinku-ink">Para desbloquear</h2>
          {lockedRows.length === 0 ? (
            <p data-testid="logros-locked-empty" className="text-tinku-ink/60 bg-white/60 rounded-2xl p-5 text-center">
              ¡Las conseguiste todas! Sos una leyenda 🌟
            </p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {lockedRows.map((b) => (
                <li
                  key={b.id}
                  data-testid={`logro-locked-${b.code}`}
                  className="rounded-3xl bg-white/70 p-5 border-2 border-tinku-ink/10 flex items-start gap-4 grayscale opacity-80"
                >
                  <div className="w-14 h-14 rounded-2xl bg-tinku-ink/5 flex items-center justify-center text-3xl shrink-0" aria-hidden>
                    🔒
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-tinku-ink/80">{b.name_es}</h3>
                    <p className="text-sm text-tinku-ink/60 leading-snug">{b.description_es}</p>
                    {b.xp_reward > 0 && (
                      <p className="text-xs text-tinku-ink/50 mt-1">Recompensa: +{b.xp_reward} XP</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
