'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { exportUserData, downloadAsJson } from '@/lib/data-export';
import Link from 'next/link';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ExportDataPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await exportUserData();
      if (data) {
        downloadAsJson(data);
      } else {
        setError('No se pudieron obtener los datos');
      }
    } catch (err) {
      setError('Error al exportar datos');
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-xl mx-auto space-y-6">
        <header className="space-y-2">
          <Link href="/dashboard" className="text-tinku-sea text-sm hover:underline">
            ← Volver
          </Link>
          <h1 className="text-2xl font-bold text-tinku-ink">Exportar mis datos</h1>
          <p className="text-tinku-ink/70">
            Descargá una copia de todos tus datos personales (Ley 25.326)
          </p>
        </header>

        <div className="rounded-2xl bg-white p-6 border-2 border-tinku-ink/10 space-y-4">
          <h2 className="font-medium text-tinku-ink">¿Qué datos se incluyen?</h2>
          <ul className="text-sm text-tinku-ink/70 space-y-2">
            <li>• Tu perfil (email, nombre, fecha de registro)</li>
            <li>• Tus hijos (nombre, grado, XP total)</li>
            <li>• Tu suscripción (estado, fecha de inicio)</li>
          </ul>
        </div>

        {error && (
          <div className="rounded-xl bg-tinku-warn/10 border border-tinku-warn p-4 text-tinku-warn text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleExport}
          disabled={loading}
          className="w-full py-3 bg-tinku-sea text-white font-medium rounded-xl hover:bg-tinku-sea/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Exportando...' : 'Descargar mis datos (.json)'}
        </button>

        <p className="text-xs text-tinku-ink/50 text-center">
          Los datos se descargan en formato JSON. Podés abrirlos con cualquier editor de texto.
        </p>
      </div>
    </div>
  );
}