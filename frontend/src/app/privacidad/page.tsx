import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacidad · Tinkú',
  description: 'Cómo cuidamos los datos de tu hijo o hija en Tinkú. Cumple Ley 26.061 y 25.326.',
};

export const dynamic = 'force-dynamic';

/**
 * Página pública de política de privacidad.
 * Versionada en copy (v1 · 2026-04-17). Si cambia, incrementar `version` y
 * agregar un resumen de cambios al tope.
 */
export default function PrivacidadPage() {
  const LAST_UPDATE = '17 de abril de 2026';
  const VERSION = 'v1';

  return (
    <main data-testid="privacy-page" className="min-h-screen bg-tinku-mist">
      <header className="max-w-3xl mx-auto px-6 py-5">
        <Link href="/" data-testid="privacy-back" className="text-sm text-tinku-ink/60 hover:text-tinku-ink">
          ← Volver al inicio
        </Link>
      </header>
      <article className="max-w-3xl mx-auto px-6 pb-16 space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-semibold text-tinku-ink">Política de Privacidad</h1>
          <p className="text-sm text-tinku-ink/60">Versión {VERSION} · Última actualización: {LAST_UPDATE}</p>
        </header>

        <section className="prose-tinku space-y-4 text-tinku-ink/85 leading-relaxed">
          <p className="text-lg">
            <strong>Lo importante en 30 segundos:</strong> Tinkú no vende datos, no muestra anuncios y guarda lo mínimo indispensable para que tu hijo o hija pueda aprender. Vos sos dueño de esos datos y podés pedir que los borremos cuando quieras.
          </p>

          <h2 className="text-xl font-semibold text-tinku-ink pt-4">¿Quiénes somos?</h2>
          <p>
            Tinkú es una plataforma educativa operada desde Argentina. Cumplimos la Ley Nacional 26.061 (Protección Integral de los Derechos de las Niñas, Niños y Adolescentes) y la Ley 25.326 (Protección de Datos Personales).
          </p>

          <h2 className="text-xl font-semibold text-tinku-ink pt-4">¿Qué datos recolectamos?</h2>

          <h3 className="font-semibold text-tinku-ink">De vos (padre, madre o tutor)</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Nombre completo y email (para tu cuenta).</li>
            <li>Dirección IP y user-agent del navegador (para seguridad y compliance legal del consentimiento).</li>
            <li>Si iniciás sesión con Google: tu email verificado y tu nombre de perfil.</li>
          </ul>

          <h3 className="font-semibold text-tinku-ink">De tu hijo o hija</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Solo <strong>primer nombre</strong>, <strong>año de nacimiento</strong>, <strong>grado escolar</strong> y un avatar elegido.</li>
            <li>No pedimos apellido, foto, email, teléfono ni dirección.</li>
            <li>Los chicos no crean cuenta propia: acceden con un código de 6 caracteres que vos le compartís.</li>
            <li>Guardamos su progreso educativo (qué ejercicios hizo, cuáles acertó, cuánto tiempo jugó).</li>
          </ul>

          <h2 className="text-xl font-semibold text-tinku-ink pt-4">¿Para qué usamos estos datos?</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Hacer funcionar la plataforma (motor adaptativo, progreso, gamificación).</li>
            <li>Mostrarte a vos el progreso de tu hijo o hija.</li>
            <li>Cumplir obligaciones legales (log inmutable de consentimiento parental).</li>
            <li>Mejorar el producto de forma agregada y anónima.</li>
          </ul>

          <h2 className="text-xl font-semibold text-tinku-ink pt-4">Lo que NO hacemos</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>No vendemos</strong> datos personales a ningún tercero.</li>
            <li><strong>No mostramos</strong> publicidad dirigida.</li>
            <li><strong>No usamos</strong> cookies de terceros para tracking.</li>
            <li><strong>No compartimos</strong> datos del menor con redes sociales.</li>
            <li><strong>No guardamos</strong> fotos, videos ni audio del chico.</li>
          </ul>

          <h2 className="text-xl font-semibold text-tinku-ink pt-4">Proveedores que usamos</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Supabase</strong> (infraestructura de base de datos y autenticación) — datos cifrados en tránsito y en reposo.</li>
            <li><strong>Google OAuth</strong> (opcional, si elegís iniciar sesión con Google).</li>
            <li><strong>Resend</strong> (envío de emails de verificación).</li>
          </ul>
          <p>Todos operan bajo estándares de seguridad SOC 2 o equivalentes.</p>

          <h2 className="text-xl font-semibold text-tinku-ink pt-4">Tus derechos</h2>
          <p>Como titular de los datos (o responsable parental), podés en todo momento:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Acceder</strong> a los datos que tenemos de vos y de tu hijo o hija.</li>
            <li><strong>Modificar</strong> el nombre, grado o avatar del chico desde el panel.</li>
            <li><strong>Borrar</strong> la cuenta de tu hijo o hija. A los 30 días los datos se anonimizan automáticamente.</li>
            <li><strong>Revocar</strong> tu consentimiento cuando quieras.</li>
          </ul>
          <p>
            Para ejercer estos derechos, escribinos a{' '}
            <a href="mailto:privacidad@tinku.app" className="text-tinku-sea hover:underline">privacidad@tinku.app</a>.
            También podés presentar un reclamo ante la Agencia de Acceso a la Información Pública (AAIP).
          </p>

          <h2 className="text-xl font-semibold text-tinku-ink pt-4">Retención</h2>
          <p>
            Guardamos los datos mientras la cuenta esté activa. Si pedís la baja, tenemos 30 días de período de gracia (por si te arrepentís) y después los datos personales se anonimizan irreversiblemente. Los datos agregados de aprendizaje (sin vínculo con el chico) pueden conservarse para investigación pedagógica.
          </p>

          <h2 className="text-xl font-semibold text-tinku-ink pt-4">Cambios a esta política</h2>
          <p>
            Si cambiamos algo sustancial de esta política, te avisaremos por email y te pediremos re-confirmar el consentimiento. Podés ver el historial de versiones en el repositorio del producto.
          </p>

          <h2 className="text-xl font-semibold text-tinku-ink pt-4">Contacto</h2>
          <p>
            Cualquier duda:{' '}
            <a href="mailto:hola@tinku.app" className="text-tinku-sea hover:underline">hola@tinku.app</a>{' '}
            · para temas de privacidad específicamente:{' '}
            <a href="mailto:privacidad@tinku.app" className="text-tinku-sea hover:underline">privacidad@tinku.app</a>.
          </p>
        </section>
      </article>

      <footer className="border-t border-tinku-ink/10 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-tinku-ink/60">
          <Link href="/">← Volver a Tinkú</Link>
          <Link href="/terminos" className="hover:text-tinku-ink">Términos →</Link>
        </div>
      </footer>
    </main>
  );
}
