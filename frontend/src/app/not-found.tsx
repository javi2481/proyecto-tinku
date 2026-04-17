import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-tinku-mist flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl" aria-hidden>🧭</div>
        <div className="space-y-2">
          <h1 data-testid="not-found-title" className="text-2xl font-semibold text-tinku-ink">
            ¡Uy! No encontramos esa página
          </h1>
          <p className="text-sm text-tinku-ink/70">
            Tal vez se mudó de isla, o el link está un poco torcido. Volvamos al panel.
          </p>
        </div>
        <Link
          href="/dashboard"
          data-testid="not-found-cta"
          className="inline-flex items-center justify-center h-11 px-5 rounded-xl bg-tinku-sea text-white font-medium hover:bg-tinku-sea/90"
        >
          Ir al panel
        </Link>
      </div>
    </main>
  );
}
