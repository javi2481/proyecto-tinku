import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/server';
import { strings } from '@/content/strings/es-AR';
import { getAvatar } from '@/lib/students/avatars';
import { studentSignOutAction } from '@/lib/auth/student-actions';
import { cn } from '@/lib/utils/cn';

export const dynamic = 'force-dynamic';

interface IslandTile {
  key: 'math' | 'language' | 'science' | 'social' | 'tech';
  emoji: string;
  gradient: string;
  href?: string;
}

const ISLANDS: IslandTile[] = [
  { key: 'math',     emoji: '🏝️', gradient: 'from-tinku-sea/30 to-tinku-sand/40', href: '/isla/numeros' },
  { key: 'language', emoji: '📚', gradient: 'from-pink-100 to-pink-50' },
  { key: 'science',  emoji: '🌿', gradient: 'from-green-100 to-green-50' },
  { key: 'social',   emoji: '⏳', gradient: 'from-amber-100 to-amber-50' },
  { key: 'tech',     emoji: '🔧', gradient: 'from-sky-100 to-sky-50' },
];

export default async function IslasPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');
  const meta = (user.user_metadata as { first_name?: string; student_id?: string } | null) ?? {};
  const firstName = meta.first_name ?? 'amigo/a';

  // Traer el student (incluye avatar, XP, streak) para mostrar saludo y status
  const { data: student } = await supabase
    .from('students')
    .select('first_name, avatar_id, total_xp, streak_current')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  const avatar = getAvatar((student?.avatar_id as string | undefined) ?? null);
  const displayName = (student?.first_name as string | undefined) ?? firstName;

  return (
    <div data-testid="islas-page" className="min-h-screen">
      <header className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full ${avatar.bgClass} flex items-center justify-center text-2xl`}>
            <span aria-hidden>{avatar.emoji}</span>
          </div>
          <div className="leading-tight">
            <p data-testid="islas-greeting" className="text-lg font-semibold text-tinku-ink">
              ¡Hola, {displayName}!
            </p>
            <p className="text-sm text-tinku-ink/70">
              {(student?.total_xp as number | undefined) ?? 0} XP
              {(student?.streak_current as number | undefined) ? (
                <span className="ml-2">🔥 {student?.streak_current as number} días</span>
              ) : null}
            </p>
          </div>
        </div>
        <form action={studentSignOutAction}>
          <button
            type="submit"
            data-testid="islas-signout"
            className="h-12 min-w-[48px] px-4 rounded-2xl bg-white/70 text-tinku-ink font-medium border-2 border-tinku-ink/10 hover:bg-white"
          >
            {strings.student.islas.salir}
          </button>
        </form>
      </header>

      <section className="max-w-4xl mx-auto px-5 py-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-tinku-ink">{strings.student.islas.title}</h1>
          <p className="text-tinku-ink/70">
            {strings.student.islas.subtitle.replace('{name}', displayName)}
          </p>
        </div>

        <div data-testid="islas-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ISLANDS.map((isl) => {
            const info = strings.student.islas.islands[isl.key];
            const active = Boolean(isl.href);
            const content = (
              <div
                className={cn(
                  'rounded-3xl p-6 bg-gradient-to-br transition-all h-full',
                  isl.gradient,
                  active
                    ? 'hover:scale-[1.02] hover:shadow-lg cursor-pointer border-2 border-transparent hover:border-tinku-sea/40'
                    : 'opacity-60 grayscale',
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="text-5xl" aria-hidden>{isl.emoji}</div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-tinku-ink">{info.name}</h2>
                    {!active && (
                      <p data-testid={`island-soon-${isl.key}`} className="text-sm text-tinku-ink/60 mt-1">
                        {strings.student.islas.comingSoon}
                      </p>
                    )}
                    {active && (
                      <p className="text-sm text-tinku-ink/70 mt-1">¡Tocá para entrar!</p>
                    )}
                  </div>
                </div>
              </div>
            );

            return active && isl.href ? (
              <Link
                key={isl.key}
                href={isl.href}
                data-testid={`island-${isl.key}`}
                className="block exercise-target"
              >
                {content}
              </Link>
            ) : (
              <div key={isl.key} data-testid={`island-${isl.key}`} aria-disabled>
                {content}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
