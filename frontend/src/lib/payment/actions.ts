'use server';

import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { createCheckoutPreference } from '@/lib/payment/mercadopago';

/**
 * Requiere usuario logged in.
 */
async function requireAuthenticated() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/entrar');
  }
  return user;
}

// =============================================================================
// CREATE SUBSCRIPTION (Premium)
// =============================================================================

export async function createSubscriptionAction(): Promise<{ url: string } | { error: string }> {
  const user = await requireAuthenticated();

  // Get user email for MP
  const email = user.email;
  if (!email) {
    return { error: 'No email found for this account' };
  }

  // Check if already premium
  const svc = createServiceSupabase();
  const { data: subscription } = await svc
    .from('subscriptions')
    .select('status')
    .eq('parent_id', user.id)
    .maybeSingle();

  if (subscription?.status === 'premium_active') {
    return { error: 'Already premium' };
  }

  // Create MP preference
  const checkoutUrl = await createCheckoutPreference(email);

  if (!checkoutUrl) {
    return { error: 'Failed to create checkout. Please try again later.' };
  }

  return { url: checkoutUrl };
}

// =============================================================================
// CANCEL SUBSCRIPTION (Premium)
// =============================================================================

export async function cancelSubscriptionAction(): Promise<{ ok: boolean } | { error: string }> {
  const user = await requireAuthenticated();

  // Solo permitir si es premium
  const svc = createServiceSupabase();
  const { data: subscription } = await svc
    .from('subscriptions')
    .select('status')
    .eq('parent_id', user.id)
    .maybeSingle();

  if (subscription?.status !== 'premium_active') {
    return { error: 'No active subscription to cancel' };
  }

  // Update subscription status
  const { error } = await svc
    .from('subscriptions')
    .update({
      status: 'premium_cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('parent_id', user.id);

  if (error) {
    return { error: 'Failed to cancel subscription' };
  }

  return { ok: true };
}

// =============================================================================
// CHECK SUBSCRIPTION STATUS
// =============================================================================

export async function getSubscriptionStatusAction(): Promise<{
  status: string;
  current_period_end: string | null;
}> {
  const user = await requireAuthenticated();
  const svc = createServiceSupabase();

  const { data: subscription } = await svc
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('parent_id', user.id)
    .maybeSingle();

  return {
    status: (subscription?.status as string) ?? 'free',
    current_period_end: (subscription?.current_period_end as string) ?? null,
  };
}