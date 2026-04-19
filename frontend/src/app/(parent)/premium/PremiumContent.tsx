'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { createSubscriptionAction } from '@/lib/payment/actions';
import { strings } from '@/content/strings/es-AR';

interface Props {
  userEmail: string | undefined;
  isPremium: boolean;
  currentPeriodEnd?: string;
}

export function PremiumContent({ userEmail, isPremium, currentPeriodEnd }: Props) {
  const [loading, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setError(null);
    startTransition(async () => {
      const result = await createSubscriptionAction();
      if ('url' in result) {
        // Redirect to MercadoPago
        window.location.href = result.url;
      } else if ('error' in result) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-tinku-sea/10 to-white p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-tinku-ink">🌟 Tinkú Premium</h1>
          <p className="text-tinku-ink/70">
            Desbloqueá todo el potencial de aprendizaje
          </p>
        </header>

        {isPremium ? (
          <div className="rounded-2xl bg-tinku-leaf/10 border-2 border-tinku-leaf p-6 text-center space-y-4">
            <div className="text-4xl mb-2">✅</div>
            <h2 className="text-xl font-semibold text-tinku-leaf">¡Ya sos Premium!</h2>
            <p className="text-tinku-ink/70">
              Gracias por apoyar Tinkú. Tenés acceso completo a todas las funciones.
            </p>
            {currentPeriodEnd && (
              <p className="text-sm text-tinku-ink/60">
                Tu plan vence el{' '}
                {new Date(currentPeriodEnd).toLocaleDateString('es-AR', {
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
            )}
          </div>
        ) : (
          <>
            <section className="rounded-2xl bg-white p-6 border-2 border-tinku-ink/10 space-y-4">
              <h2 className="text-lg font-semibold text-tinku-ink">¿Qué incluye Premium?</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-tinku-leaf">✓</span>
                  <span className="text-tinku-ink/80">
                    Hasta <strong>5 hijos</strong> por cuenta
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-tinku-leaf">✓</span>
                  <span className="text-tinku-ink/80">
                    Acceso a <strong>todas las islas</strong> (Números, Palabras, Ciencias,
                    Argentina)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-tinku-leaf">✓</span>
                  <span className="text-tinku-ink/80">
                    <strong>Reportes avanzados</strong> de progreso
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-tinku-leaf">✓</span>
                  <span className="text-tinku-ink/80">Soporte prioritario</span>
                </li>
              </ul>
            </section>

            <section className="rounded-2xl bg-tinku-sea text-white p-6 text-center space-y-4">
              <div className="text-4xl font-bold">
                $2.990<span className="text-lg font-normal">/mes</span>
              </div>
              <p className="text-white/80">Menos de $1 por hijo por día</p>
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full py-3 bg-white text-tinku-sea font-semibold rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Redirigiendo...' : 'Suscribirse'}
              </button>
              {error && (
                <p className="text-tinku-warn text-sm">{error}</p>
              )}
            </section>
          </>
        )}

        <div className="text-center">
          <Link href="/dashboard" className="text-tinku-sea font-medium hover:underline">
            ← Volver al dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}