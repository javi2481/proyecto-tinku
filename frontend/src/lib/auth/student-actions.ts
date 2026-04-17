'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { loginCodeSchema } from '@/lib/schemas/student-login';
import { logger } from '@/lib/observability/logger';
import { rateLimit } from '@/lib/utils/rate-limit';

export type StudentAuthResult =
  | { ok: true }
  | { ok: false; error: string };

async function getClientInfo() {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const userAgent = h.get('user-agent') ?? null;
  return { ip, userAgent };
}

// =============================================================================
// STUDENT LOGIN (con login_code)
// =============================================================================

export async function studentLoginAction(
  _prev: StudentAuthResult | null,
  formData: FormData,
): Promise<StudentAuthResult> {
  const rawCode = String(formData.get('login_code') ?? '').trim().toUpperCase();
  const parsed = loginCodeSchema.safeParse({ login_code: rawCode });
  if (!parsed.success) {
    return { ok: false, error: 'invalid_format' };
  }

  const code = parsed.data.login_code;
  const { ip, userAgent } = await getClientInfo();

  // Rate limit: 5 intentos fallidos por IP / 10 min.
  const ipRl = rateLimit(`student-login:ip:${ip ?? 'unknown'}`, 5, 600);
  if (!ipRl.allowed) {
    await logger.warn('student.login', 'ip rate limited', { ip });
    return { ok: false, error: 'rate_limited' };
  }

  const svc = createServiceSupabase();

  // Buscar student activo con ese código
  const { data: student, error: qErr } = await svc
    .from('students')
    .select('id, first_name, consent_revoked_at, deletion_requested_at, parent_id, auth_user_id')
    .eq('login_code', code)
    .is('deleted_at', null)
    .maybeSingle();

  if (qErr) {
    await logger.error('student.login', qErr.message);
    return { ok: false, error: 'generic' };
  }
  if (!student || student.consent_revoked_at || student.deletion_requested_at) {
    await logger.warn('student.login', 'invalid or revoked code', {
      codePrefix: code.slice(0, 2) + '****',
      ip,
    });
    return { ok: false, error: 'invalid_code' };
  }

  // Anonymous sign-in con metadata. El trigger handle_new_user detecta
  // role='student' y NO crea profile/subscription para este auth.users.
  const supabase = await createServerSupabase();
  const { data: anon, error: anonErr } = await supabase.auth.signInAnonymously({
    options: {
      data: {
        role: 'student',
        student_id: student.id,
        first_name: student.first_name,
      },
    },
  });

  if (anonErr || !anon.user) {
    await logger.error('student.login', 'anonymous sign-in failed', {
      err: anonErr?.message ?? 'no user',
    });
    return { ok: false, error: 'generic' };
  }

  const authUserId = anon.user.id;

  // Vincular auth_user_id al student. Si había uno previo, lo pisamos —
  // Ola 1 permite una sola sesión activa por student.
  await svc
    .from('students')
    .update({
      auth_user_id: authUserId,
      last_active_at: new Date().toISOString(),
    })
    .eq('id', student.id as string);

  await svc.from('data_access_log').insert({
    accessor_id: student.parent_id as string,
    accessor_auth_uid: authUserId,
    student_id: student.id as string,
    access_type: 'student_login',
    access_target: 'auth.anonymous_signin',
    ip_address: ip,
    user_agent: userAgent,
  });

  await logger.info('student.login', 'student logged in', {
    studentId: student.id,
    authUid: authUserId,
  });

  redirect('/islas');
}

// =============================================================================
// STUDENT SIGN OUT
// =============================================================================

export async function studentSignOutAction() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect('/entrar');
}
