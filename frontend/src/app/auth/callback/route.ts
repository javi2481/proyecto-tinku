import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { logger } from '@/lib/observability/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * OAuth callback — Supabase redirige a esta URL después del login con Google.
 * Recibe ?code=... (PKCE) + opcional ?next=... (redirect post-login).
 * Intercambia el code por session cookies vía exchangeCodeForSession.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/dashboard';
  const errorParam = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  // Proxy-safe origin: el ingress k8s reescribe x-forwarded-host;
  // trust forwarded if present, fall back al url.origin.
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const forwardedHost = request.headers.get('x-forwarded-host');
  const origin = forwardedHost
    ? `${forwardedProto ?? 'https'}://${forwardedHost}`
    : url.origin;

  if (errorParam) {
    await logger.warn('auth.oauth_callback', 'provider error', {
      error: errorParam,
      description: errorDescription,
    });
    return NextResponse.redirect(`${origin}/login?error=oauth_${errorParam}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=oauth_no_code`);
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    await logger.warn('auth.oauth_callback', 'code exchange failed', { err: error.message });
    return NextResponse.redirect(`${origin}/login?error=oauth_exchange`);
  }

  await logger.info('auth.oauth_callback', 'login success', {
    email: data.user?.email ?? 'unknown',
    provider: data.user?.app_metadata?.provider ?? 'unknown',
  });

  // Prevenir open-redirect: solo paths internos
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
  return NextResponse.redirect(`${origin}${safeNext}`);
}
