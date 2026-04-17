import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { logger } from '@/lib/observability/logger';
import { logDataAccess } from '@/lib/audit/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cron endpoint — anonimización de estudiantes con baja pedida hace >= 30 días.
 * Debe llamarse con header `Authorization: Bearer <CRON_SECRET>` desde un scheduler
 * (Supabase Scheduled Function, Vercel Cron, GitHub Action, etc.).
 *
 * Pasos por student candidato:
 *  1. Anonimiza PII en `students` (first_name, login_code, avatar_id, auth_user_id).
 *  2. Marca `deleted_at`.
 *  3. Borra user de auth (anonymous) via admin.deleteUser si había auth_user_id.
 *  4. Deja attempts/sessions/concept_mastery/parental_consents intactos (histórico agregado anónimo).
 *  5. Escribe event 'erased' en parental_consents + data_access_log.
 *
 * NO toca parents (profiles) — esos se gestionan aparte.
 */

const RETENTION_DAYS = 30;

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  const expected = `Bearer ${process.env.CRON_SECRET ?? ''}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const svc = createServiceSupabase();
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: candidates, error } = await svc
    .from('students')
    .select('id, parent_id, auth_user_id')
    .is('deleted_at', null)
    .not('deletion_requested_at', 'is', null)
    .lte('deletion_requested_at', cutoff);

  if (error) {
    await logger.error('cron.anonymize', error.message);
    return NextResponse.json({ ok: false, error: 'query_failed' }, { status: 500 });
  }

  const list = (candidates ?? []) as Array<{ id: string; parent_id: string; auth_user_id: string | null }>;
  const results: Array<{ studentId: string; ok: boolean; err?: string }> = [];

  for (const s of list) {
    try {
      const nowIso = new Date().toISOString();
      // Generar login_code "anónimo" único (placeholder uppercase + dígitos)
      const anonCode = generateAnonCode(s.id);

      const { error: uErr } = await svc
        .from('students')
        .update({
          first_name: 'Anónimo',
          login_code: anonCode,
          avatar_id: 'avatar_01',
          auth_user_id: null,
          deleted_at: nowIso,
        })
        .eq('id', s.id);
      if (uErr) throw uErr;

      if (s.auth_user_id) {
        await svc.auth.admin.deleteUser(s.auth_user_id).catch(() => undefined);
      }

      await svc.from('parental_consents').insert({
        student_id: s.id,
        parent_id: s.parent_id,
        event_type: 'erased',
        consent_text_version: 'v1',
        notes: `Automatic anonymization after ${RETENTION_DAYS}d grace period`,
      });

      await logDataAccess({
        studentId: s.id,
        accessorId: null,
        accessorAuthUid: null,
        accessType: 'write',
        accessTarget: 'students.anonymized',
        metadata: { retention_days: RETENTION_DAYS },
      });

      results.push({ studentId: s.id, ok: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await logger.error('cron.anonymize.student', msg, { studentId: s.id });
      results.push({ studentId: s.id, ok: false, err: msg });
    }
  }

  await logger.info('cron.anonymize', 'run completed', {
    processed: results.length,
    ok: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
  });

  return NextResponse.json({
    ok: true,
    processed: results.length,
    results,
  });
}

function generateAnonCode(studentId: string): string {
  // Base36 del uuid sin guiones, padded y truncado a 6. Colisión extremadamente baja.
  const raw = studentId.replace(/-/g, '').toUpperCase();
  // Excluir chars 'I', 'O', '0', '1' (consistente con login_code regex)
  const filtered = raw.replace(/[IO01]/g, 'X');
  return filtered.slice(0, 6).padEnd(6, 'X');
}

// Allow GET solo para health-check (no ejecuta)
export async function GET() {
  return NextResponse.json({ ok: true, hint: 'POST with Authorization: Bearer CRON_SECRET' });
}
