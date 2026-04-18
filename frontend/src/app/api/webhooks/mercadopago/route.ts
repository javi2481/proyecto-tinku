import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Verify it's a payment notification
    if (body.topic !== 'payment' && body.type !== 'payment') {
      return NextResponse.json({ message: 'Ignored' }, { status: 200 });
    }

    const paymentId = body.data?.id || body.id;
    
    if (!paymentId) {
      return NextResponse.json({ message: 'No payment ID' }, { status: 400 });
    }

    // Get payment details from MercadoPago
    const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
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