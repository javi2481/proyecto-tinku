import Link from 'next/link';
import { signOutAction } from '@/lib/auth/actions';

interface Props {
  email: string;
}

/**
 * Pantalla que se muestra cuando un padre loggeado llega a /entrar.
 * Evita el redirect silencioso a /dashboard y le explica las 2 opciones:
 *  1. Abrir una pestaña de incógnito con el link directo (recomendado).
 *  2. Salir de su sesión acá para que el chico ingrese con su código.
 */
export function ParentSessionPrompt({ email }: Props) {
  return (
    <div
      data-testid="parent-session-prompt"
      className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm space-y-5"
    >
      <div className="space-y-2">
        <div className="text-4xl" aria-hidden>👋</div>
        <h2 className="text-xl font-semibold text-tinku-ink">Estás usando tu cuenta de padre/madre</h2>
        <p className="text-sm text-tinku-ink/70 leading-relaxed">
          Entraste con <strong>{email}</strong>. Para que tu hijo/a ingrese con su código, hacé <strong>una</strong> de estas dos cosas:
        </p>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl bg-tinku-sea/5 border border-tinku-sea/20 p-4 space-y-2">
          <p className="font-semibold text-tinku-ink flex items-center gap-2">
            <span aria-hidden>🕵️</span> Opción 1 — ventana de incógnito
          </p>
          <p className="text-sm text-tinku-ink/75 leading-relaxed">
            Abrí una ventana privada (<code className="bg-white px-1.5 py-0.5 rounded text-xs">Ctrl+Shift+N</code> en Chrome)
            y pegá la URL de Tinkú. Así tu sesión queda intacta mientras el chico juega.
          </p>
        </div>

        <div className="rounded-2xl bg-tinku-sand/40 border border-tinku-sand p-4 space-y-3">
          <p className="font-semibold text-tinku-ink flex items-center gap-2">
            <span aria-hidden>🚪</span> Opción 2 — cerrar mi sesión acá
          </p>
          <p className="text-sm text-tinku-ink/75 leading-relaxed">
            Salís de tu cuenta y dejás la pantalla lista para que el chico escriba el código.
          </p>
          <form action={signOutAction}>
            <button
              type="submit"
              data-testid="parent-signout-and-continue"
              className="w-full h-12 rounded-2xl bg-tinku-ink text-white font-semibold hover:bg-tinku-ink/90 transition-colors exercise-target"
            >
              Cerrar sesión y continuar
            </button>
          </form>
        </div>
      </div>

      <div className="text-center pt-2">
        <Link
          href="/dashboard"
          data-testid="parent-back-to-dashboard"
          className="text-sm text-tinku-sea font-medium hover:underline"
        >
          ← Volver a mi panel de padre/madre
        </Link>
      </div>
    </div>
  );
}
