import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos y Condiciones · Tinkú',
  description: 'Términos de uso de Tinkú. Leelos antes de crear tu cuenta.',
};

export const dynamic = 'force-dynamic';

export default function TerminosPage() {
  const LAST_UPDATE = '17 de abril de 2026';
  const VERSION = 'v1';

  return (
    <main data-testid="terms-page" className="min-h-screen bg-tinku-mist">
      <header className="max-w-3xl mx-auto px-6 py-5">
        <Link href="/" data-testid="terms-back" className="text-sm text-tinku-ink/60 hover:text-tinku-ink">
          ← Volver al inicio
        </Link>
      </header>
      <article className="max-w-3xl mx-auto px-6 pb-16 space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-semibold text-tinku-ink">Términos y Condiciones</h1>
          <p className="text-sm text-tinku-ink/60">Versión {VERSION} · Última actualización: {LAST_UPDATE}</p>
        </header>

        <section className="prose-tinku space-y-4 text-tinku-ink/85 leading-relaxed">
          <p className="text-lg">
            Estos términos son el acuerdo entre vos (padre, madre o tutor legal) y Tinkú. Son simples y en castellano, sin trampas.
          </p>

          <h2 className="text-xl font-semibold text-tinku-ink pt-4">1. ¿Quién puede usar Tinkú?</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Personas mayores de edad con responsabilidad parental o tutorial sobre un niño o niña de 6 a 12 años.</li>
            <li>Los chicos menores de edad <strong>no pueden crear cuenta propia</strong>. Acceden solo vía un código generado por vos.</li>
            <li>Educadores y escuelas: a partir de Ola 2 tendremos un plan específico.</li>
          </ul>

          <h2 className="text-xl font-semibold text-tinku-ink pt-4">2. Tu cuenta</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Sos responsable de mantener tu contraseña (o tu sesión Google) segura.</li>
            <li>Nos tenés que avisar si detectás un acceso no autorizado.</li>
            <li>Podés tener un hijo o hija en el plan gratuito; más en el plan premium (cuando esté disponible).</li>
          </ul>

          <h2 className="text-xl font-semibold text-tinku-ink pt-4">3. Consentimiento parental</h2>
          <p>
            Al crear una cuenta de hijo/a declarás que sos su padre, madre o tutor legal. Tu consentimiento queda registrado con tu identidad, dirección IP, user-agent y marca temporal como prueba legal (Ley 26.061, art. 24). Podés revocarlo en cualquier momento, y eso dispara el borrado de los datos.
          </p>

          <h2 className="text-xl font-semibold text-tinku-ink pt-4">4. Uso aceptable</h2>
          <p>Está prohibido:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Crear cuentas fraudulentas o suplantar la identidad de un menor que no esté a tu cargo.</li>
            <li>Intentar romper la seguridad de la plataforma.</li>
            <li>Usar Tinkú para fines ilegales o dañinos.</li>
            <li>Compartir el código de acceso del chico en redes públicas.</li>
          </ul>

          <h2 className="text-xl font-semibold text-tinku-ink pt-4">5. Contenido y propiedad</h2>
          <p>
            Los ejercicios, textos, iconos y diseño son propiedad de Tinkú. El progreso del chico, las respuestas y las medallas son tuyos (y del chico). Podés exportarlos cuando quieras.
          </p>

          <h2 className="text-xl font-semibold text-tinku-ink pt-4">6. Modificaciones y cancelación</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Podemos cambiar los ejercicios, las islas y el diseño cuando haga falta para mejorar el producto.</li>
            <li>Si cambiamos algo crítico de la experiencia o los precios, te avisaremos por email con antelación razonable.</li>
            <li>Podés cancelar tu cuenta cuando quieras desde el panel. Te confirmamos por email.</li>
          </ul>

          <h2 className="text-xl font-semibold text-tinku-ink pt-4">7. Garantías y responsabilidad</h2>
          <p>
            Tinkú se ofrece &quot;como está&quot;. Hacemos todo lo posible para que funcione bien, pero no podemos garantizar disponibilidad 100%. Tinkú es una herramienta complementaria y no reemplaza a la escuela ni al rol de la familia en la educación del chico.
          </p>

          <h2 className="text-xl font-semibold text-tinku-ink pt-4">8. Privacidad</h2>
          <p>
            Tu privacidad está regida por nuestra{' '}
            <Link href="/privacidad" className="text-tinku-sea hover:underline">Política de Privacidad</Link>,
            que es parte de estos términos.
          </p>

          <h2 className="text-xl font-semibold text-tinku-ink pt-4">9. Ley aplicable</h2>
          <p>
            Estos términos se rigen por la ley argentina. Cualquier disputa se resuelve en los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires.
          </p>

          <h2 className="text-xl font-semibold text-tinku-ink pt-4">10. Contacto</h2>
          <p>
            <a href="mailto:hola@tinku.app" className="text-tinku-sea hover:underline">hola@tinku.app</a>
          </p>
        </section>
      </article>

      <footer className="border-t border-tinku-ink/10 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-tinku-ink/60">
          <Link href="/privacidad" className="hover:text-tinku-ink">← Privacidad</Link>
          <Link href="/">Volver a Tinkú →</Link>
        </div>
      </footer>
    </main>
  );
}
