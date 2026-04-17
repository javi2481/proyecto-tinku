import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/server';
import { signOutAction } from '@/lib/auth/actions';
import { strings } from '@/content/strings/es-AR';

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const role = (user.user_metadata as { role?: string } | undefined)?.role;
  if (role === 'student') redirect('/islas');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, email_double_opt_in_completed')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-tinku-mist">
      <header className="bg-white border-b border-tinku-ink/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="font-semibold text-tinku-ink">
            {strings.common.appName}
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span data-testid="user-email" className="text-tinku-ink/60 hidden sm:inline">
              {(profile?.email as string) ?? user.email ?? ''}
            </span>
            <form action={signOutAction}>
              <button
                type="submit"
                data-testid="signout-btn"
                className="h-9 px-3 rounded-lg border border-tinku-ink/15 text-tinku-ink hover:bg-tinku-ink/5"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
