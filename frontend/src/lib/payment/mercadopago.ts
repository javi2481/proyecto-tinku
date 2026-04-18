import { MercadoPagoConfig, Preference } from 'mercadopago';

const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || '';

// Create client with config
const client = new MercadoPagoConfig({
  accessToken: MP_ACCESS_TOKEN,
  options: { timeout: 5000 }
});

export interface CheckoutPreference {
  items: Array<{
    title: string;
    description: string;
    quantity: number;
    unit_price: number;
    currency_id: string;
  }>;
  payer: {
    email: string;
  };
  back_urls: {
    success: string;
    pending: string;
    failure: string;
  };
  notification_url?: string;
}

export async function createCheckoutPreference(
  payerEmail: string,
  amount: number = 2990 // $2.990 ARS
): Promise<string | null> {
  if (!MP_ACCESS_TOKEN) {
    // eslint-disable-next-line no-console
    console.warn('MercadoPago access token not configured');
    return null;
  }

  try {
    const preferenceClient = new Preference(client);
    
    const preference = await preferenceClient.create({
      body: {
        items: [
          {
            id: 'tinku-premium-monthly',
            title: 'Tinkú Premium - Plan Mensual',
            description: 'Hasta 5 hijos, todas las islas, reportes avanzados',
            quantity: 1,
            unit_price: amount,
            currency_id: 'ARS',
          },
        ],
        payer: {
          email: payerEmail,
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/premium/success`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/premium/pending`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/premium/failure`,
        },
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/webhooks/mercadopago`,
      },
    });

    return preference.init_point || null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error creating checkout preference:', error);
    return null;
  }
}

export async function initiateCheckout(): Promise<string | null> {
  // This will be called from client, so we need to get user email from session
  // For now, return null and show premium page
  return null;
}

export async function handleWebhook(topic: string, data: unknown): Promise<void> {
  if (topic !== 'payment') {
    return;
  }

  const paymentData = data as { id: string; status: string };
  
  if (paymentData.status === 'approved') {
    // Update subscription in database
    // TODO: Update subscription status via Supabase
  }
}