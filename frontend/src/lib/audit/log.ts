import 'server-only';
import { headers } from 'next/headers';
import { createServiceSupabase } from '@/lib/supabase/service';
import { logger } from '@/lib/observability/logger';

/**
 * Helper centralizado para `data_access_log` (inmutable).
 * Úsese en Server Actions sensibles (reads/writes sobre students, parental_consents,
 * attempts, concept_mastery, student_badges, etc.) para trazabilidad de Ley 26.061/25.326.
 *
 * Fallas de logging NUNCA bloquean el flujo principal — se loguean a app_logs vía logger.warn.
 */

export type AccessType =
  | 'read'
  | 'write'
  | 'login'
  | 'signout'
  | 'delete_request'
  | 'delete_cancel'
  | 'code_regenerate'
  | 'consent_granted'
  | 'consent_revoked'
  | 'export';

export interface LogDataAccessArgs {
  studentId: string;
  accessorId?: string | null;
  accessorAuthUid?: string | null;
  accessType: AccessType;
  accessTarget: string; // e.g. 'students', 'attempts', 'parental_consents'
  metadata?: Record<string, unknown>;
}

async function getCtx() {
  try {
    const h = await headers();
    const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    const ua = h.get('user-agent') ?? null;
    return { ip, ua };
  } catch {
    return { ip: null, ua: null };
  }
}

export async function logDataAccess(args: LogDataAccessArgs): Promise<void> {
  try {
    const svc = createServiceSupabase();
    const { ip, ua } = await getCtx();
    const { error } = await svc.from('data_access_log').insert({
      accessor_id: args.accessorId ?? null,
      accessor_auth_uid: args.accessorAuthUid ?? null,
      student_id: args.studentId,
      access_type: args.accessType,
      access_target: args.accessTarget,
      ip_address: ip,
      user_agent: ua,
      metadata: args.metadata ?? {},
    });
    if (error) {
      await logger.warn('audit', 'data_access_log insert failed', {
        err: error.message,
        args: { ...args, metadata: undefined },
      });
    }
  } catch (e) {
    await logger.warn('audit', 'logDataAccess threw', {
      err: e instanceof Error ? e.message : String(e),
    });
  }
}
