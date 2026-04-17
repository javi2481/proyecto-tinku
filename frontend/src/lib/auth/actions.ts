'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import crypto from 'node:crypto';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { signupSchema, loginSchema } from '@/lib/schemas/auth';
import { sendEmail, emailVerifyTemplate } from '@/lib/email/stub';
import { logger } from '@/lib/observability/logger';
import { rateLimit } from '@/lib/utils/rate-limit';

export type ActionResult =
  | { ok: true; redirectTo?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

async function getAppUrl(): Promise<string> {
  const h = await headers();
  const proto = h.get('x-forwarded-proto') ?? 'https';
  const host = h.get('host') ?? 'localhost:3000';
  return `${proto}://${host}`;
}

async function getClientInfo() {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const userAgent = h.get('user-agent') ?? null;
  return { ip, userAgent };
}

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

// =============================================================================
// SIGNUP
// =============================================================================

export async function signupAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = signupSchema.safeParse({
    full_name: formData.get('full_name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { ok: false, error: 'validation', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { email, password, full_name } = parsed.data;
  const { ip } = await getClientInfo();

  const rl = rateLimit(`signup:${ip ?? 'unknown'}`, 10, 3600);
  if (!rl.allowed) {
    return { ok: false, error: 'rate_limited' };
  }

  const svc = createServiceSupabase();

  // service_role: bypass RLS, crea auth.users con email_confirm=true para
  // saltear el flujo built-in de Supabase (manejamos double opt-in propio).
  const { data: created, error: createErr } = await svc.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role: 'parent' },
  });

  if (createErr) {
    const msg = createErr.message.toLowerCase();
    if (msg.includes('already') || msg.includes('registered') || msg.includes('duplicate')) {
      return { ok: false, error: 'email_taken' };
    }
    await logger.error('auth.signup', createErr.message, { email });
    return { ok: false, error: 'generic' };
  }

  const userId = created.user?.id;
  if (!userId) {
    await logger.error('auth.signup', 'No user id returned from admin.createUser', { email });
    return { ok: false, error: 'generic' };
  }

  // Emitir token de doble opt-in (propio, no Supabase)
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { error: verifInsertErr } = await svc.from('email_verifications').insert({
    profile_id: userId,
    token_hash: tokenHash,
    purpose: 'signup',
    expires_at: expiresAt,
    ip_sent: ip,
  });

  if (verifInsertErr) {
    await logger.warn('auth.signup', 'email_verifications insert failed', { email, err: verifInsertErr.message });
    // No bloqueamos al usuario — puede pedir resend después.
  }

  const appUrl = await getAppUrl();
  const verifyUrl = `${appUrl}/verify-email?token=${rawToken}`;
  const tpl = emailVerifyTemplate(verifyUrl, full_name);
  await sendEmail({ to: email, subject: tpl.subject, text: tpl.text, tag: 'signup' });

  // Iniciar sesión: crea cookie de sesión en este response
  const supabase = await createServerSupabase();
  const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
  if (signErr) {
    await logger.error('auth.signup_login', signErr.message, { email });
    return { ok: false, error: 'generic' };
  }

  await logger.info('auth.signup', 'signup completed', { email, userId });
  redirect('/dashboard');
}

// =============================================================================
// LOGIN
// =============================================================================

export async function loginAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { ok: false, error: 'validation', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { email, password } = parsed.data;
  const { ip } = await getClientInfo();

  // Rate limit: 8 intentos / 10 min por IP
  const rl = rateLimit(`login:${ip ?? 'unknown'}`, 8, 600);
  if (!rl.allowed) {
    return { ok: false, error: 'rate_limited' };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    await logger.warn('auth.login', 'failed login', { email, reason: error.message });
    return { ok: false, error: 'invalid_credentials' };
  }

  await logger.info('auth.login', 'login success', { email });
  redirect('/dashboard');
}

// =============================================================================
// VERIFY EMAIL
// =============================================================================

export interface VerifyEmailResult {
  status: 'ok' | 'invalid' | 'expired' | 'error';
}

export async function verifyEmailToken(token: string): Promise<VerifyEmailResult> {
  if (!token || typeof token !== 'string' || token.length < 16) {
    return { status: 'invalid' };
  }

  const svc = createServiceSupabase();
  const hash = hashToken(token);
  const { ip } = await getClientInfo();

  const { data: row, error } = await svc
    .from('email_verifications')
    .select('id, profile_id, expires_at, verified_at, purpose')
    .eq('token_hash', hash)
    .maybeSingle();

  if (error) {
    await logger.error('auth.verify', error.message);
    return { status: 'error' };
  }
  if (!row) return { status: 'invalid' };
  if (row.verified_at) return { status: 'ok' }; // idempotente
  if (new Date(row.expires_at as string).getTime() < Date.now()) return { status: 'expired' };

  const profileId = row.profile_id as string;
  const verifId = row.id as string;

  await svc.from('email_verifications')
    .update({ verified_at: new Date().toISOString(), ip_verified: ip })
    .eq('id', verifId);

  await svc.from('profiles')
    .update({ email_double_opt_in_completed: true })
    .eq('id', profileId);

  await logger.info('auth.verify', 'email verified', { profileId });
  return { status: 'ok' };
}

// =============================================================================
// RESEND VERIFICATION
// =============================================================================

export async function resendVerifyAction(_prev: ActionResult | null): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) return { ok: false, error: 'not_authenticated' };

  const { ip } = await getClientInfo();
  const rl = rateLimit(`resend:${user.id}`, 3, 600);
  if (!rl.allowed) return { ok: false, error: 'rate_limited' };

  const svc = createServiceSupabase();
  const { data: profile } = await svc
    .from('profiles')
    .select('full_name, email, email_double_opt_in_completed')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) return { ok: false, error: 'profile_missing' };
  if (profile.email_double_opt_in_completed) return { ok: true };

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  await svc.from('email_verifications').insert({
    profile_id: user.id,
    token_hash: tokenHash,
    purpose: 'signup',
    expires_at: expiresAt,
    ip_sent: ip,
  });

  const appUrl = await getAppUrl();
  const verifyUrl = `${appUrl}/verify-email?token=${rawToken}`;
  const tpl = emailVerifyTemplate(verifyUrl, (profile.full_name as string) ?? 'padre/madre');
  await sendEmail({
    to: profile.email as string,
    subject: tpl.subject,
    text: tpl.text,
    tag: 'resend',
  });

  await logger.info('auth.resend', 'verify email resent', { userId: user.id });
  return { ok: true };
}

// =============================================================================
// SIGN OUT
// =============================================================================

export async function signOutAction() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect('/login');
}
