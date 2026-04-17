'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import crypto from 'node:crypto';
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

  // -------------------------------------------------------------------------
  // Anonymous sign-in de Supabase está OFF en el proyecto por default y no
  // podemos activarlo sin Personal Access Token. Workaround equivalente:
  //   - email sintético derivado de student.id (no routeable: tinku.local)
  //   - password rotado en cada login (nunca persiste en DB)
  //   - admin.createUser con email_confirm=true (bypass SMTP) la primera vez
  //   - admin.updateUserById para rotar password en logins siguientes
  //   - signInWithPassword desde el server client para setear cookie
  // El trigger handle_new_user detecta role='student' y skippea profile.
  // -------------------------------------------------------------------------

  const synthEmail = `student-${student.id}@tinku.local`;
  const tempPassword = crypto.randomBytes(32).toString('hex');
  const studentMetadata = {
    role: 'student' as const,
    student_id: student.id,
    first_name: student.first_name,
  };

  let authUserId = student.auth_user_id as string | null;

  if (authUserId) {
    // Login recurrente: rotar password del auth.users existente
    const { error: updErr } = await svc.auth.admin.updateUserById(authUserId, {
      password: tempPassword,
      user_metadata: studentMetadata,
    });
    if (updErr) {
      // Si el auth.users fue borrado externamente, reintentamos creación
      if (updErr.message.toLowerCase().includes('not found') || updErr.status === 404) {
        authUserId = null;
      } else {
        await logger.error('student.login', 'updateUserById failed', { err: updErr.message });
        return { ok: false, error: 'generic' };
      }
    }
  }

  if (!authUserId) {
    // Primera vez: crear auth.users con email sintético
    const { data: created, error: createErr } = await svc.auth.admin.createUser({
      email: synthEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: studentMetadata,
    });
    if (createErr || !created.user) {
      await logger.error('student.login', 'admin.createUser failed', {
        err: createErr?.message ?? 'no user',
      });
      return { ok: false, error: 'generic' };
    }
    authUserId = created.user.id;

    // Linkeamos antes de signIn para que cualquier query RLS vea el vínculo
    await svc.from('students')
      .update({ auth_user_id: authUserId })
      .eq('id', student.id as string);
  }

  // Sign in (crea cookie de sesión)
  const supabase = await createServerSupabase();
  const { error: signErr } = await supabase.auth.signInWithPassword({
    email: synthEmail,
    password: tempPassword,
  });

  if (signErr) {
    await logger.error('student.login', 'signInWithPassword failed', { err: signErr.message });
    return { ok: false, error: 'generic' };
  }

  // Actualizar last_active_at y auditar
  await svc
    .from('students')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', student.id as string);

  await svc.from('data_access_log').insert({
    accessor_id: student.parent_id as string,
    accessor_auth_uid: authUserId,
    student_id: student.id as string,
    access_type: 'student_login',
    access_target: 'auth.synthetic_login',
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
