import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { strings } from '@/content/strings/es-AR';
import { LoginCodeForm } from './LoginCodeForm';

export const dynamic = 'force-dynamic';

/**
 * /entrar — página de login del alumno. Pública, sin `.student-scope`
 * porque el padre puede estar al lado leyendo. Sí usamos tap targets grandes.
 */
export default async function EntrarPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const role = (user?.user_metadata as { role?: string } | undefined)?.role;
  if (user && role === 'student') redirect('/islas');
  if (user && role !== 'student') redirect('/dashboard');

  return (
    <main className="student-scope min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-tinku-sea/20 via-tinku-mist to-tinku-sand/30">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="text-5xl mb-3" aria-hidden>🏝️</div>
          <h1 className="text-3xl font-bold text-tinku-ink">{strings.student.entrar.title}</h1>
          <p className="text-tinku-ink/70">{strings.student.entrar.subtitle}</p>
        </div>

        <div data-testid="entrar-page" className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm space-y-5">
          <LoginCodeForm />
        </div>

        <p className="text-center text-sm text-tinku-ink/60">
          {strings.student.entrar.help}
        </p>

        <p className="text-center text-xs">
          <Link href="/" className="text-tinku-ink/40 hover:text-tinku-ink/70">
            Ir al sitio de Tinkú
          </Link>
        </p>
      </div>
    </main>
  );
}
