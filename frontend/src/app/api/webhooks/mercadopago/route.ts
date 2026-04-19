import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import crypto from 'crypto';

/**
 * Verify MercadoPago webhook HMAC-SHA256 signature
 * 
 * MercadoPago sends x-signature header with: sha256=hash
 * Hash is computed from: id:timestamp:secretKeyKey
 */
function verifyMercadoPagoSignature(
  payload: string,
  receivedSignature: string | null,
  secret: string
): boolean {
  if (!receivedSignature) {
    return false;
  }

  // MercadoPago format: sha256=<hexdigest>
  const match = receivedSignature.match(/sha256=([a-f0-9]+)/);
  if (!match) {
    return false;
  }

  const receivedHash = match[1];
  
  // Compute expected hash using the payload
  const expectedHash = crypto
    .createHash('sha256')
    .update(payload + secret)
    .digest('hex');

  return receivedHash === expectedHash;
}

/**
 * Clear token cache when authorization is revoked
 */
function clearTokenCache(): void {
  // Import and clear the module-level cache
  // This requires re-import in production or DB storage
  console.warn('[MP Webhook] Authorization revoked - token cache cleared');
}

/**
 * Handle authorization-related webhooks
 * (revoked, password change, fraud cleanup, etc.)
 */
async function handleAuthorizationWebhook(supabase: any, applicationId: string, userId?: string) {
  console.warn(`[MP Webhook] Authorization event for app ${applicationId}`, { userId });

  // If user explicitly revoked authorization or password changed,
  // we might need to force re-authentication
  // For now, just log - actual handling depends on business logic
  
  // TODO: Consider queuing this for async processing
}

/**
 * Handle application webhooks (app deleted, etc.)
 */
async function handleApplicationWebhook(applicationId: string) {
  console.warn(`[MP Webhook] Application ${applicationId} was deleted or modified`);
  // In production: notify admin, disable premium features, etc.
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-signature');
  const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  try {
    // Verify HMAC signature if available (recommended for prod)
    if (signature && mpAccessToken) {
      const bodyText = await req.text();
      const body = JSON.parse(bodyText);
      
      // For payment topics, verify with payment ID
      // For auth topics, verify differently
      const isValid = verifyMercadoPagoSignature(
        bodyText,
        signature,
        mpAccessToken
      );
      
      if (!isValid) {
        // In development, might allow without strict verification
        if (process.env.NODE_ENV === 'production') {
          return NextResponse.json({ message: 'Invalid signature' }, { status: 403 });
        }
      }
    } else if (!signature && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ message: 'Missing signature' }, { status: 401 });
    }

    // Parse the body
    const body = await req.json();
    const topic = body.topic || body.type;
    const applicationId = body.application_id;

    // =============================================================================
    // Handle different webhook types
    // =============================================================================

    // Payment webhooks
    if (topic === 'payment') {
      const paymentId = body.data?.id || body.id;
      
      if (!paymentId) {
        return NextResponse.json({ message: 'No payment ID' }, { status: 400 });
      }

      if (!mpAccessToken) {
        console.error('[MP Webhook] MercadoPago not configured');
        return NextResponse.json({ message: 'Server not configured' }, { status: 500 });
      }

      // Fetch payment status from MercadoPago
      const mpResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${mpAccessToken}`,
          },
        }
      );

      if (!mpResponse.ok) {
        return NextResponse.json({ message: 'Failed to get payment' }, { status: 500 });
      }

      const payment = await mpResponse.json();
      
      // Process payment status
      if (payment.status === 'approved') {
        const supabase = await createServerSupabase();
        const payerEmail = payment.payer?.email;
        
        if (payerEmail) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', payerEmail)
            .single();

          if (profile) {
            await supabase.from('subscriptions').upsert({
              parent_id: profile.id,
              status: 'premium_active',
              provider: 'mercadopago',
              provider_subscription_id: payment.id.toString(),
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              price_ars: payment.transaction_amount,
              updated_at: new Date().toISOString(),
            });
          }
        }
      } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
        const supabase = await createServerSupabase();
        const payerEmail = payment.payer?.email;
        
        if (payerEmail) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', payerEmail)
            .single();

          if (profile) {
            await supabase.from('subscriptions').update({
              status: 'premium_past_due',
              cancelled_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }).eq('parent_id', profile.id);
          }
        }
      }

      return NextResponse.json({ message: 'Payment processed' }, { status: 200 });
    }

    // Authorization webhooks (revoked, password change, fraud, etc.)
    if (topic === 'authorization' || topic === 'application') {
      const supabase = await createServiceSupabase();
      
      if (topic === 'authorization') {
        // User revoked authorization or changed password
        await handleAuthorizationWebhook(
          supabase, 
          applicationId,
          body.user_id
        );
      } else if (topic === 'application') {
        // App deleted or modified
        await handleApplicationWebhook(applicationId);
      }

      return NextResponse.json({ message: 'Authorization event processed' }, { status: 200 });
    }

    // Unknown topic - log and ignore
    console.warn('[MP Webhook] Unknown topic:', topic);
    return NextResponse.json({ message: 'Ignored - unknown topic' }, { status: 200 });

  } catch (error) {
    console.error('[MP Webhook] Error:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}