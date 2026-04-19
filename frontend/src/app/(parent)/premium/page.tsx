import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { PremiumContent } from './PremiumContent';

export const dynamic = 'force-dynamic';

export default async function PremiumPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  // Get subscription status
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('parent_id', user?.id)
    .maybeSingle();

  const isPremium = subscription?.status === 'premium_active';
  const currentPeriodEnd = subscription?.current_period_end;

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/entrar');
  }

  return (
    <PremiumContent
      userEmail={user.email}
      isPremium={isPremium}
      currentPeriodEnd={currentPeriodEnd}
    />
  );
}