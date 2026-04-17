'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { createStudentSchema, updateStudentSchema } from '@/lib/schemas/student';
import { logger } from '@/lib/observability/logger';
import { logDataAccess } from '@/lib/audit/log';
import { getStudentCapacity } from '@/lib/students/limits';

export type StudentActionResult =
  | { ok: true; studentId?: string; redirectTo?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

const CONSENT_TEXT_VERSION = 'v1';

async function requireUser() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return user;
}

async function getClientInfo() {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const userAgent = h.get('user-agent') ?? null;
  return { ip, userAgent };
}

/**
 * Genera un login_code único de 6 chars sin ambigüedad.
 * Reintenta hasta 5 veces ante colisión en el UNIQUE constraint.
 */
async function generateUniqueLoginCode(svc: ReturnType<typeof createServiceSupabase>): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const { data, error } = await svc.rpc('generate_login_code');
    if (error || !data) continue;
    const code = data as string;
    // Verificar colisión incluyendo soft-deleted para evitar confusión histórica
    const { count } = await svc
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('login_code', code);
    if ((count ?? 0) === 0) return code;
  }
  throw new Error('Could not generate unique login_code after 5 attempts');
}

// =============================================================================
// CREATE STUDENT
// =============================================================================

export async function createStudentAction(
  _prev: StudentActionResult | null,
  formData: FormData,
): Promise<StudentActionResult> {
  const user = await requireUser();

  const parsed = createStudentSchema.safeParse({
    first_name: formData.get('first_name'),
    birth_year: formData.get('birth_year'),
    current_grade: formData.get('current_grade'),
    avatar_id: formData.get('avatar_id'),
    consent_accepted: formData.get('consent_accepted'),
  });

  if (!parsed.success) {
    return { ok: false, error: 'validation', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { first_name, birth_year, current_grade, avatar_id } = parsed.data;
  const { ip, userAgent } = await getClientInfo();

  const capacity = await getStudentCapacity(user.id);
  if (!capacity.canAddMore) {
    return { ok: false, error: 'plan_limit_reached' };
  }

  const svc = createServiceSupabase();

  let loginCode: string;
  try {
    loginCode = await generateUniqueLoginCode(svc);
  } catch (e) {
    await logger.error('students.create', 'login_code generation failed', {
      err: e instanceof Error ? e.message : String(e),
    });
    return { ok: false, error: 'generic' };
  }

  const nowIso = new Date().toISOString();
  // service_role: bypass RLS para INSERT atómico de students + parental_consents.
  // Razón: el consentimiento es acto legal + debemos garantizar ambas rows o ninguna.
  const { data: student, error: insertErr } = await svc
    .from('students')
    .insert({
      parent_id: user.id,
      first_name,
      birth_year,
      current_grade,
      avatar_id,
      login_code: loginCode,
      parental_consent_given: true,
      parental_consent_at: nowIso,
      parental_consent_ip: ip,
      parental_consent_user_agent: userAgent,
    })
    .select('id')
    .single();

  if (insertErr || !student) {
    await logger.error('students.create', 'insert failed', { err: insertErr?.message });
    return { ok: false, error: 'generic' };
  }

  // Event log inmutable de consentimiento (Ley 26.061 / 25.326)
  await svc.from('parental_consents').insert({
    student_id: student.id,
    parent_id: user.id,
    event_type: 'granted',
    consent_text_version: CONSENT_TEXT_VERSION,
    ip,
    user_agent: userAgent,
  });

  // Audit log
  await svc.from('data_access_log').insert({
    accessor_id: user.id,
    accessor_auth_uid: user.id,
    student_id: student.id,
    access_type: 'write_student',
    access_target: 'students.create',
    ip_address: ip,
    user_agent: userAgent,
    metadata: { first_name_set: true, consent_version: CONSENT_TEXT_VERSION },
  });

  await logger.info('students.create', 'student created', {
    parentId: user.id,
    studentId: student.id,
  });

  revalidatePath('/dashboard');
  redirect(`/students/${student.id}`);
}

// =============================================================================
// UPDATE STUDENT
// =============================================================================

export async function updateStudentAction(
  studentId: string,
  _prev: StudentActionResult | null,
  formData: FormData,
): Promise<StudentActionResult> {
  const user = await requireUser();

  const parsed = updateStudentSchema.safeParse({
    first_name: formData.get('first_name'),
    current_grade: formData.get('current_grade'),
    avatar_id: formData.get('avatar_id'),
  });

  if (!parsed.success) {
    return { ok: false, error: 'validation', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createServerSupabase();
  // RLS bloquea update si no es del padre. No necesita service_role.
  const { error } = await supabase
    .from('students')
    .update(parsed.data)
    .eq('id', studentId);

  if (error) {
    await logger.error('students.update', error.message, { studentId });
    return { ok: false, error: 'generic' };
  }

  await logger.info('students.update', 'student updated', { studentId });
  await logDataAccess({
    studentId,
    accessorId: user.id,
    accessorAuthUid: user.id,
    accessType: 'write',
    accessTarget: 'students.update',
    metadata: { fields: Object.keys(parsed.data) },
  });
  revalidatePath('/dashboard');
  revalidatePath(`/students/${studentId}`);
  redirect(`/students/${studentId}`);
}

// =============================================================================
// REGENERATE LOGIN CODE
// =============================================================================

export async function regenerateLoginCodeAction(
  studentId: string,
): Promise<StudentActionResult> {
  const user = await requireUser();
  const svc = createServiceSupabase();

  // Verificar ownership antes de regenerar
  const { data: owned } = await svc
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('parent_id', user.id)
    .is('deleted_at', null)
    .maybeSingle();
  if (!owned) return { ok: false, error: 'not_found' };

  let newCode: string;
  try {
    newCode = await generateUniqueLoginCode(svc);
  } catch (e) {
    await logger.error('students.regen', 'code gen failed', {
      err: e instanceof Error ? e.message : String(e),
    });
    return { ok: false, error: 'generic' };
  }

  const { error } = await svc
    .from('students')
    .update({ login_code: newCode })
    .eq('id', studentId);

  if (error) {
    await logger.error('students.regen', error.message, { studentId });
    return { ok: false, error: 'generic' };
  }

  await logger.info('students.regen', 'login_code regenerated', { studentId });
  revalidatePath(`/students/${studentId}`);
  return { ok: true };
}

// =============================================================================
// REQUEST DELETION (soft) / CANCEL
// =============================================================================

export async function requestDeleteStudentAction(
  studentId: string,
): Promise<StudentActionResult> {
  const user = await requireUser();
  const { ip, userAgent } = await getClientInfo();
  const svc = createServiceSupabase();

  // Ownership
  const { data: owned } = await svc
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('parent_id', user.id)
    .is('deleted_at', null)
    .maybeSingle();
  if (!owned) return { ok: false, error: 'not_found' };

  const now = new Date().toISOString();
  await svc
    .from('students')
    .update({ deletion_requested_at: now, consent_revoked_at: now })
    .eq('id', studentId);

  await svc.from('parental_consents').insert({
    student_id: studentId,
    parent_id: user.id,
    event_type: 'revoked',
    consent_text_version: CONSENT_TEXT_VERSION,
    ip,
    user_agent: userAgent,
    notes: 'Deletion requested by parent',
  });

  await svc.from('data_access_log').insert({
    accessor_id: user.id,
    accessor_auth_uid: user.id,
    student_id: studentId,
    access_type: 'consent_revoke',
    access_target: 'students.deletion_requested',
    ip_address: ip,
    user_agent: userAgent,
  });

  await logger.info('students.delete_request', 'deletion requested', { studentId });
  revalidatePath('/dashboard');
  redirect('/dashboard');
}

export async function cancelDeleteStudentAction(
  studentId: string,
): Promise<StudentActionResult> {
  const user = await requireUser();
  const { ip, userAgent } = await getClientInfo();
  const svc = createServiceSupabase();

  const { data: owned } = await svc
    .from('students')
    .select('id, deletion_requested_at')
    .eq('id', studentId)
    .eq('parent_id', user.id)
    .is('deleted_at', null)
    .maybeSingle();
  if (!owned) return { ok: false, error: 'not_found' };

  await svc
    .from('students')
    .update({ deletion_requested_at: null, consent_revoked_at: null })
    .eq('id', studentId);

  await svc.from('parental_consents').insert({
    student_id: studentId,
    parent_id: user.id,
    event_type: 'reconfirmed',
    consent_text_version: CONSENT_TEXT_VERSION,
    ip,
    user_agent: userAgent,
    notes: 'Deletion cancelled by parent',
  });

  await logger.info('students.delete_cancel', 'deletion cancelled', { studentId });
  await logDataAccess({
    studentId,
    accessorId: user.id,
    accessorAuthUid: user.id,
    accessType: 'delete_cancel',
    accessTarget: 'students.deletion_cancelled',
  });
  revalidatePath('/dashboard');
  revalidatePath(`/students/${studentId}`);
  return { ok: true };
}
