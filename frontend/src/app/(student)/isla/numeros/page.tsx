import Link from 'next/link';
import { strings } from '@/content/strings/es-AR';

export const dynamic = 'force-dynamic';

/**
 * /isla/numeros — placeholder de Fase 5.
 * El auth + guard vive en (student)/layout. Esta ruta NO está bajo (student)
 * porque necesita una URL corta (/isla/numeros) — el layout path sigue
 * aplicando el guard porque /isla/* está en middleware matcher de student area.
 *
 * Pero entonces el .student-scope no se aplica. Aplicamos scope local.
 */
export default async function IslaNumerosPage() {
  return (
    <div className="min-h-screen px-5 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          href="/islas"
          data-testid="back-to-islas"
          className="inline-flex items-center h-12 px-4 rounded-2xl bg-white/70 text-tinku-ink font-medium hover:bg-white border-2 border-tinku-ink/10"
        >
          {strings.student.islaNumeros.back}
        </Link>

        <header className="text-center space-y-3 pt-4">
          <div className="text-7xl" aria-hidden>🏝️</div>
          <h1 className="text-3xl font-bold text-tinku-ink">{strings.student.islaNumeros.title}</h1>
          <p className="text-tinku-ink/70">{strings.student.islaNumeros.subtitle}</p>
        </header>

        <section
          data-testid="isla-numeros-soon"
          className="rounded-3xl bg-white/90 p-8 text-center space-y-3 border-2 border-tinku-sea/20"
        >
          <div className="text-5xl" aria-hidden>✨</div>
          <h2 className="text-2xl font-semibold text-tinku-ink">
            {strings.student.islaNumeros.comingSoonTitle}
          </h2>
          <p className="text-tinku-ink/70">{strings.student.islaNumeros.comingSoonBody}</p>
        </section>
      </div>
    </div>
  );
}
