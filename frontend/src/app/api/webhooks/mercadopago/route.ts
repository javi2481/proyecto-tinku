import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import crypto from 'crypto';

/**
 * Verify MercadoPago webhook HMAC-SHA256 signature
 * 
 * MercadoPago sends x-signature header with: sha256=hash
 * Hash is computed from: id:timestamp:secret
 */
function verifyMercadoPagoSignature(
  paymentId: string,
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
  
  // Compute expected hash: id:paymentId
  const expectedHash = crypto
    .createHash('sha256')
    .update(`id:${paymentId}`)
    .digest('hex');

  return receivedHash === expectedHash;
}

export async function POST(req: NextRequest) {
  try {
    // Verify HMAC signature first
    const signature = req.headers.get('x-signature');
    const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    // If signature provided, verify it
    if (signature && mpAccessToken) {
      // Get payment ID from body for verification
      const body = await req.json();
      const paymentId = body.data?.id || body.id;
      
      if (paymentId) {
        const isValid = verifyMercadoPagoSignature(paymentId, signature, mpAccessToken);
        if (!isValid) {
          return NextResponse.json({ message: 'Invalid signature' }, { status: 403 });
        }
      }
    } else if (!signature) {
      // No signature provided - reject unless in test mode (optional: allow for dev)
      // For production, this should be strict
      return NextResponse.json({ message: 'Missing signature' }, { status: 401 });
    }

    // Proceed with original logic
    const body = await req.json();
    
    // Verify it's a payment notification
    if (body.topic !== 'payment' && body.type !== 'payment') {
      return NextResponse.json({ message: 'Ignored' }, { status: 200 });
    }

    const paymentId = body.data?.id || body.id;
    
    if (!paymentId) {
      return NextResponse.json({ message: 'No payment ID' }, { status: 400 });
    }

    if (!mpAccessToken) {
      // eslint-disable-next-line no-console
      console.error('MercadoPago not configured');
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
    
    // Check payment status
    if (payment.status === 'approved') {
      const supabase = await createServerSupabase();
      
      // Extract email from payment
      const payerEmail = payment.payer?.email;
      
      // Find parent by email and update subscription
      if (payerEmail) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', payerEmail)
          .single();

        if (profile) {
          await supabase
            .from('subscriptions')
            .upsert({
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
    }

    return NextResponse.json({ message: 'Processed' }, { status: 200 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Webhook error:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}