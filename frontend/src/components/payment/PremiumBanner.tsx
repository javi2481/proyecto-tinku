'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createSubscriptionAction } from '@/lib/payment/actions';

export function PremiumBanner() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const result = await createSubscriptionAction();
      if ('url' in result) {
        window.location.href = result.url;
      } else {
        // Fallback: redirect to premium page
        startTransition(() => {
          router.push('/premium');
        });
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Checkout error:', e);
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-gradient-to-r from-tinku-sea to-tinku-leaf p-4 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">🌟 Upgrade a Premium</h3>
          <p className="text-sm text-white/80">
            Hasta 5 hijos, todas las islas, reportes avanzados
          </p>
        </div>
        <button
          onClick={handleUpgrade}
          disabled={isPending || loading}
          className="px-4 py-2 bg-white text-tinku-sea font-medium rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Cargando...' : isPending ? '...' : '¡Upgrade!'}
        </button>
      </div>
    </div>
  );
}