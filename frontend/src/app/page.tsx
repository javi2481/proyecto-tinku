import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { strings } from '@/content/strings/es-AR';

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');

  return (
    <main className="min-h-screen bg-gradient-to-br from-tinku-mist via-white to-tinku-sand/30">
      <header className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <span className="font-semibold text-tinku-ink text-lg">{strings.common.appName}</span>
        <Link
          href="/login"
          data-testid="header-login"
          className="text-sm text-tinku-ink/70 hover:text-tinku-ink"
        >
          {strings.marketing.ctaLogin}
        </Link>
      </header>

      <section className="max-w-4xl mx-auto px-6 py-16 sm:py-24 text-center space-y-8">
        <p className="text-xs uppercase tracking-widest text-tinku-sea/80">
          {strings.common.tagline}
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold text-tinku-ink leading-tight">
          {strings.marketing.heroTitle}
        </h1>
        <p className="text-lg text-tinku-ink/70 max-w-2xl mx-auto">
          {strings.marketing.heroSub}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/signup"
            data-testid="hero-signup"
            className="inline-flex items-center justify-center h-12 px-6 rounded-xl bg-tinku-sea text-white font-medium hover:bg-tinku-sea/90 transition-colors"
          >
            {strings.marketing.ctaSignup}
          </Link>
          <Link
            href="/login"
            data-testid="hero-login"
            className="inline-flex items-center justify-center h-12 px-6 rounded-xl border border-tinku-ink/15 text-tinku-ink font-medium hover:bg-white"
          >
            {strings.marketing.ctaLogin}
          </Link>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-8 text-xs text-tinku-ink/40 text-center">
        Para chicos argentinos de 6 a 12. Contenido alineado al NAP.
      </footer>
    </main>
  );
}
