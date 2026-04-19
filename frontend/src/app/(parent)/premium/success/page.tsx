import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function SuccessPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  // Get latest subscription status
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('parent_id', user?.id)
    .maybeSingle();

  const isPremium = subscription?.status === 'premium_active';

  return (
    <div className="min-h-screen bg-gradient-to-b from-tinku-leaf/10 to-white p-6 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center space-y-6">
        <div className="text-6xl">🎉</div>
        
        <h1 className="text-3xl font-bold text-tinku-ink">
          {isPremium ? '¡Bienvenido a Premium!' : 'Payment Received'}
        </h1>
        
        <p className="text-tinku-ink/70">
          {isPremium
            ? 'Gracias por suscribirte a Tinkú Premium. Ya tenés acceso a todas las funciones.'
            : 'Tu pago está siendo procesado. En breve tendrás acceso a Premium.'}
        </p>

        {subscription?.current_period_end && isPremium && (
          <p className="text-sm text-tinku-ink/60">
            Tu plan vence el{' '}
            {new Date(subscription.current_period_end).toLocaleDateString('es-AR', {
              day: 'numeric',
              month: 'long',
            })}
          </p>
        )}

        <div className="space-y-3 pt-4">
          <Link
            href="/dashboard"
            className="block w-full py-3 bg-tinku-sea text-white font-semibold rounded-xl hover:bg-tinku-sea/90 transition-colors"
          >
            Ir al Dashboard
          </Link>
          
          <Link
            href="/premium"
            className="block w-full py-3 bg-white text-tinku-sea border-2 border-tinku-sea font-semibold rounded-xl hover:bg-tinku-sea/5 transition-colors"
          >
            Ver Plan Premium
          </Link>
        </div>
      </div>
    </div>
  );
}