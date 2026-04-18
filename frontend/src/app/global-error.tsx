'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Global error caught:', error);
    }
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-screen bg-tinka-mist flex items-center justify-center">
        <div className="text-center space-y-4 p-8 max-w-md">
          <div className="text-6xl" aria-hidden>
            😵
          </div>
          <h2 className="text-2xl font-bold text-tinku-ink">
            Algo salió mal
          </h2>
          <p className="text-tinku-ink/70">
            Encontramos un error inesperado. Por favor, intentá de nuevo.
          </p>
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-tinku-sea text-white font-medium rounded-xl hover:bg-tinku-sea/90 transition-colors"
          >
            Intentar de nuevo
          </button>
          <p className="text-xs text-tinku-ink/50">
            Si el problema persiste, contactá a soporte.
          </p>
        </div>
      </body>
    </html>
  );
}