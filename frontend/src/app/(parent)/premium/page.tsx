import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/server';
import { strings } from '@/content/strings/es-AR';

export const dynamic = 'force-dynamic';

export default async function PremiumPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  // Get subscription status
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('parent_id', user?.id)
    .single();

  const isPremium = subscription?.status === 'premium_active';

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
          <div className="rounded-2xl bg-tinku-leaf/10 border-2 border-tinku-leaf p-6 text-center">
            <div className="text-4xl mb-2">✅</div>
            <h2 className="text-xl font-semibold text-tinku-leaf">¡Ya sos Premium!</h2>
            <p className="text-tinku-ink/70 mt-2">
              Gracias por apoyar Tinkú. Tenés acceso completo a todas las funciones.
            </p>
          </div>
        ) : (
          <>
            <section className="rounded-2xl bg-white p-6 border-2 border-tinku-ink/10 space-y-4">
              <h2 className="text-lg font-semibold text-tinku-ink">¿Qué incluye Premium?</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-tinku-leaf">✓</span>
                  <span className="text-tinku-ink/80">Hasta <strong>5 hijos</strong> por cuenta</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-tinku-leaf">✓</span>
                  <span className="text-tinku-ink/80">Acceso a <strong>todas las islas</strong> (Números, Palabras, Ciencias, Argentina)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-tinku-leaf">✓</span>
                  <span className="text-tinku-ink/80"><strong>Reportes avanzados</strong> de progreso</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-tinku-leaf">✓</span>
                  <span className="text-tinku-ink/80">Soporte prioritario</span>
                </li>
              </ul>
            </section>

            <section className="rounded-2xl bg-tinku-sea text-white p-6 text-center space-y-4">
              <div className="text-4xl font-bold">$2.990<span className="text-lg font-normal">/mes</span></div>
              <p className="text-white/80">
                Menos de $1 por hijo por día
              </p>
              <button
                className="w-full py-3 bg-white text-tinku-sea font-semibold rounded-xl hover:bg-white/90 transition-colors"
                disabled
              >
                Próximamente
              </button>
              <p className="text-xs text-white/60">
                MercadoPago se integra pronto
              </p>
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