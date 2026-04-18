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
    <main data-testid="landing-page" className="min-h-screen bg-tinku-mist">
      <div className="bg-gradient-to-br from-tinku-sea/10 via-tinku-mist to-tinku-sand/40">
        {/* Header */}
        <header className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-tinku-ink text-lg">
            <span aria-hidden className="text-2xl">🏝️</span>
            <span>{strings.common.appName}</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              data-testid="header-login"
              className="text-sm text-tinku-ink/70 hover:text-tinku-ink"
            >
              Ingresar
            </Link>
            <Link
              href="/signup"
              data-testid="header-signup"
              className="h-9 px-4 rounded-xl bg-tinku-ink text-white text-sm font-medium hover:bg-tinku-ink/90 inline-flex items-center"
            >
              Crear cuenta
            </Link>
          </nav>
        </header>

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 pt-10 sm:pt-16 pb-16 sm:pb-24">
          <div className="text-center space-y-6 sm:space-y-8">
            <span
              data-testid="hero-pill"
              className="inline-block text-xs uppercase tracking-widest text-tinku-sea font-semibold bg-white/80 px-3 py-1.5 rounded-full"
            >
              Aprender jugando · 6 a 12 años
            </span>
            <h1 data-testid="hero-title" className="text-4xl sm:text-5xl lg:text-6xl font-bold text-tinku-ink leading-[1.1] max-w-3xl mx-auto">
              Matemática argentina,{' '}
              <span className="text-tinku-sea">contada como una aventura</span>.
            </h1>
            <p data-testid="hero-sub" className="text-lg sm:text-xl text-tinku-ink/75 max-w-2xl mx-auto leading-relaxed">
              Tinkú acompaña a tu hijo o hija todos los días, adaptando cada ejercicio a su ritmo. Sin distracciones, sin anuncios, sin compartir sus datos con nadie.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link
                href="/signup"
                data-testid="hero-signup"
                className="inline-flex items-center justify-center h-14 px-7 rounded-2xl bg-tinku-sea text-white font-semibold text-base hover:bg-tinku-sea/90 transition-colors shadow-sm"
              >
                Crear cuenta gratis →
              </Link>
              <Link
                href="/entrar"
                data-testid="hero-student"
                className="inline-flex items-center justify-center h-14 px-7 rounded-2xl bg-white border-2 border-tinku-ink/10 text-tinku-ink font-semibold hover:border-tinku-ink/20"
              >
                Soy chico y tengo código
              </Link>
            </div>
            <p className="text-xs text-tinku-ink/50 pt-2">
              Gratis. Sin tarjeta de crédito. 1 hijo/a incluido en el plan free.
            </p>
          </div>
        </section>
      </div>

      {/* Beneficios */}
      <section data-testid="benefits" className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
        <h2 className="text-center text-2xl sm:text-3xl font-semibold text-tinku-ink mb-12">
          Tres cosas que hacen distinto a Tinkú
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <BenefitCard
            icon="🧠"
            title="Motor adaptativo"
            body="Cada ejercicio se calibra al nivel real del chico: si le cuesta, afloja; si lo domina, sube la vara. Nunca aburre, nunca frustra."
          />
          <BenefitCard
            icon="🛡️"
            title="Privacidad primero"
            body="Cumplimos Ley 26.061 y 25.326. No pedimos datos del menor más allá del nombre. Sin redes sociales, sin publicidad, sin tracking."
          />
          <BenefitCard
            icon="📊"
            title="Vos ves su progreso"
            body="Un panel claro con lo que domina, lo que flojea, y minutos reales de juego. No vanity metrics: aprendizaje real."
          />
        </div>
      </section>

      {/* Cómo funciona */}
      <section data-testid="how-it-works" className="bg-white border-y border-tinku-ink/5 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-center text-2xl sm:text-3xl font-semibold text-tinku-ink mb-12">
            Empezá en 3 minutos
          </h2>
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-5">
            <StepCard num={1} title="Creás tu cuenta" body="Con Google o email. Nos importa tu identidad real porque sos la persona responsable legal del chico." />
            <StepCard num={2} title="Creás a tu hijo/a" body="Nombre, grado y avatar. Le generamos un código de 6 letras. Sin email, sin teléfono, sin datos personales." />
            <StepCard num={3} title="Le das el código" body="El chico entra en tinku.app/entrar con ese código. Empieza a jugar y vos ves todo desde tu panel." />
          </ol>
        </div>
      </section>

      {/* Filosofía / trust */}
      <section data-testid="philosophy" className="max-w-4xl mx-auto px-6 py-16 sm:py-20">
        <div className="rounded-3xl bg-gradient-to-br from-tinku-ink to-tinku-ink/85 text-white p-8 sm:p-12 text-center space-y-5">
          <p className="text-sm uppercase tracking-widest text-tinku-sand font-medium">Cómo pensamos Tinkú</p>
          <h2 className="text-2xl sm:text-3xl font-semibold leading-tight">
            &quot;Un minuto en Tinkú vale más que 20 copiando del pizarrón.&quot;
          </h2>
          <p className="text-white/80 max-w-xl mx-auto leading-relaxed">
            No queremos que tu hijo/a pase horas con la pantalla. Queremos que los 10 minutos que pase, le muevan la aguja. Tinkú complementa la escuela — no la reemplaza.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer data-testid="landing-footer" className="border-t border-tinku-ink/10 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-tinku-ink/60">
            © {new Date().getFullYear()} Tinkú · Hecho en Argentina 🇦🇷
          </p>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-tinku-ink/60">
            <Link href="/privacidad" data-testid="footer-privacy" className="hover:text-tinku-ink">Privacidad</Link>
            <Link href="/terminos" data-testid="footer-terms" className="hover:text-tinku-ink">Términos</Link>
            <Link href="/login" className="hover:text-tinku-ink">Ingresar</Link>
            <Link href="/signup" className="hover:text-tinku-ink">Crear cuenta</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

function BenefitCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-white border border-tinku-ink/10 p-6 space-y-3 hover:shadow-sm transition-shadow">
      <div className="w-14 h-14 rounded-2xl bg-tinku-sea/10 flex items-center justify-center text-3xl" aria-hidden>{icon}</div>
      <h3 className="text-xl font-semibold text-tinku-ink">{title}</h3>
      <p className="text-sm text-tinku-ink/70 leading-relaxed">{body}</p>
    </div>
  );
}

function StepCard({ num, title, body }: { num: number; title: string; body: string }) {
  return (
    <li className="space-y-3">
      <div className="w-12 h-12 rounded-full bg-tinku-sea text-white flex items-center justify-center text-xl font-bold" aria-hidden>{num}</div>
      <h3 className="text-lg font-semibold text-tinku-ink">{title}</h3>
      <p className="text-sm text-tinku-ink/70 leading-relaxed">{body}</p>
    </li>
  );
}
