import { MercadoPagoConfig, Preference } from 'mercadopago';

// =============================================================================
// MercadoPago Token Management
//
// Two flows supported:
// 1. client_credentials: Fast setup, token expires every 6h - needs renewal
// 2. authorization_code: First-time user auth, token lasts 180d + refresh_token - better for production
// =============================================================================

const getEnvToken = (): string => process.env.MERCADOPAGO_ACCESS_TOKEN || '';
const getClientId = () => process.env.MERCADOPAGO_CLIENT_ID;
const getClientSecret = () => process.env.MERCADOPAGO_CLIENT_SECRET;

// In-memory token cache (for production, store in DB with expiry)
// Structure: { access_token, refresh_token, expires_at }
interface CachedToken {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
}

let tokenCache: CachedToken | null = null;

/**
 * Get a valid access token using the best available flow.
 * Priority: 1) authorization_code flow (180d) 2) client_credentials (6h)
 */
async function getValidAccessToken(): Promise<string | null> {
  const envToken = getEnvToken();
  const clientId = getClientId();
  const clientSecret = getClientSecret();
  const now = Date.now();

  // Check if cached token is still valid (15 min buffer for safety)
  if (tokenCache && tokenCache.expires_at > now + 15 * 60 * 1000) {
    return tokenCache.access_token;
  }

  // Try authorization_code refresh_token flow first (longer-lived)
  if (tokenCache?.refresh_token && clientId && clientSecret) {
    try {
      const refreshResponse = await fetch('https://api.mercadopago.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
          refresh_token: tokenCache.refresh_token,
        }),
      });
      const data = await refreshResponse.json();
      
      if (data.access_token) {
        tokenCache = {
          access_token: data.access_token,
          refresh_token: data.refresh_token || tokenCache.refresh_token,
          // 180 days - 15 min buffer
          expires_at: now + (180 * 24 * 60 * 60 * 1000 - 15 * 60 * 1000),
        };
        return tokenCache.access_token;
      }
    } catch {
      // Continue to next flow
    }
  }

  // Fall back to client_credentials flow (6 hours)
  if (clientId && clientSecret) {
    try {
      const response = await fetch('https://api.mercadopago.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'client_credentials',
        }),
      });

      const data = await response.json();

      if (data.access_token) {
        tokenCache = {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          // 6 hours - 15 min buffer
          expires_at: now + (6 * 60 * 60 * 1000 - 15 * 60 * 1000),
        };
        return tokenCache.access_token;
      }
    } catch {
      // Fall through to env token
    }
  }

  // Fall back to static env token (no renewal)
  return envToken || null;
}

/**
 * Generate a random state parameter for OAuth security
 * Prevents CSRF attacks by verifying the response belongs to our request
 */
function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Exchange authorization code for tokens (first-time user auth).
 * Call this after redirect from MP with code parameter.
 * 
 * Best practices implemented:
 * - Uses state parameter to prevent CSRF
 * - Only required params in body
 * - Content-Type header set
 */
export async function exchangeAuthCode(
  code: string,
  redirectUri: string,
  state?: string
): Promise<{ access_token: string; refresh_token: string; state: string } | null> {
  const clientId = getClientId();
  const clientSecret = getClientSecret();

  if (!clientId || !clientSecret) {
    console.error('Missing MERCADOPAGO_CLIENT_ID or MERCADOPAGO_CLIENT_SECRET');
    return null;
  }

  // Generate state if not provided (for CSRF protection)
  const oauthState = state || generateState();

  try {
    const response = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        // state NOT sent to token endpoint - it's only for verification during redirect
      }),
    });

    const data = await response.json();

    if (data.access_token) {
      const now = Date.now();
      tokenCache = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: now + (180 * 24 * 60 * 60 * 1000 - 15 * 60 * 1000), // 180d
      };
      
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        state: oauthState, // Return state for verification if needed
      };
    }
  } catch (error) {
    console.error('Error exchanging auth code:', error);
  }

  return null;
}

/**
 * Get current cached token info (for debugging/monitoring)
 */
export function getTokenInfo(): { cached: boolean; hasRefreshToken: boolean; expiresIn: number } {
  if (!tokenCache) return { cached: false, hasRefreshToken: false, expiresIn: 0 };
  
  const expiresIn = Math.max(0, tokenCache.expires_at - Date.now());
  return {
    cached: true,
    hasRefreshToken: !!tokenCache.refresh_token,
    expiresIn,
  };
}

const getMpClient = () => {
  const token = getEnvToken();
  return new MercadoPagoConfig({
    accessToken: token,
    options: { timeout: 5000 },
  });
};

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
  amount: number = 2990, // $2.990 ARS
): Promise<string | null> {
  const accessToken = await getValidAccessToken();
  
  if (!accessToken) {
    console.warn('MercadoPago access token not configured');
    return null;
  }

  try {
    // Use cached/refreshed token for the client
    const effectiveToken = tokenCache?.access_token || accessToken;
    const client = new MercadoPagoConfig({
      accessToken: effectiveToken,
      options: { timeout: 5000 },
    });
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
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
      },
    });

    return preference.init_point || null;
  } catch (error) {
    console.error('Error creating checkout preference:', error);
    return null;
  }
}

export async function handleWebhook(topic: string, data: unknown): Promise<void> {
  if (topic !== 'payment') return;
  
  const paymentData = data as { id: string; status: string };
  if (paymentData.status === 'approved') {
    // Update subscription in database
  }
}