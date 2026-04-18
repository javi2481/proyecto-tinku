'use server';

/**
 * "Momento de ayuda del grande"
 *
 * Cuando un alumno falla dos veces seguidas el mismo concepto, escribimos un evento
 * `concept.struggling_alert` en data_access_log (append-only, sin migration).
 * Cuando acierta después, o cuando el padre marca "ya lo ayudé", escribimos
 * `concept.struggling_cleared`. La alerta sigue activa mientras el último evento de
 * ese concepto sea un `struggling_alert`.
 *
 * Filosofía: no reemplazar una buena explicación del padre/madre en el momento justo.
 */

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { logDataAccess } from '@/lib/audit/log';
import type { AnswerOutcome } from '@/types/database';

export interface StrugglingAlert {
  conceptId: string;
  conceptCode: string;
  conceptName: string;
  islaBasePath: string; // '/isla/numeros' | '/isla/palabras' | ...
  lastIncorrectAt: string;
}

const SUBJECT_TO_ISLA: Record<string, string> = {
  math: '/isla/numeros',
  language: '/isla/palabras',
  science: '/isla/ciencias',
  social: '/isla/argentina',
};

/**
 * Lee las alertas activas de un hijo. Una alerta por concepto.
 * Activa = último evento del concepto es `struggling_alert`.
 */
export async function getStrugglingAlerts(studentId: string): Promise<StrugglingAlert[]> {
  const svc = createServiceSupabase();

  const { data: events } = await svc
    .from('data_access_log')
    .select('access_target, metadata, accessed_at')
    .eq('student_id', studentId)
    .in('access_target', ['concept.struggling_alert', 'concept.struggling_cleared'])
    .order('accessed_at', { ascending: false })
    .limit(200);

  if (!events?.length) return [];

  // Tomar el último evento por concept_id
  const latestByConcept = new Map<string, { target: string; at: string }>();
  for (const e of events) {
    const conceptId = (e.metadata as { concept_id?: string } | null)?.concept_id;
    if (!conceptId) continue;
    if (!latestByConcept.has(conceptId)) {
      latestByConcept.set(conceptId, {
        target: e.access_target as string,
        at: e.accessed_at as string,
      });
    }
  }

  const activeConceptIds: string[] = [];
  const lastAtMap = new Map<string, string>();
  for (const [conceptId, { target, at }] of latestByConcept) {
    if (target === 'concept.struggling_alert') {
      activeConceptIds.push(conceptId);
      lastAtMap.set(conceptId, at);
    }
  }
  if (!activeConceptIds.length) return [];

  const { data: concepts } = await svc
    .from('concepts')
    .select('id, code, name_es, primary_subject')
    .in('id', activeConceptIds)
    .is('deleted_at', null);

  return (concepts ?? []).map((c) => ({
    conceptId: c.id as string,
    conceptCode: c.code as string,
    conceptName: c.name_es as string,
    islaBasePath: SUBJECT_TO_ISLA[c.primary_subject as string] ?? '/islas',
    lastIncorrectAt: lastAtMap.get(c.id as string) ?? '',
  }));
}

/**
 * El padre marca "ya lo ayudé" → cerramos la alerta.
 * Validación: el studentId tiene que pertenecer al padre logueado.
 */
export async function acknowledgeStrugglingAction(studentId: string, conceptId: string): Promise<void> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const svc = createServiceSupabase();
  const { data: student } = await svc
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('parent_id', user.id)
    .maybeSingle();
  if (!student) redirect('/dashboard');

  await logDataAccess({
    studentId,
    accessorAuthUid: user.id,
    accessType: 'write',
    accessTarget: 'concept.struggling_cleared',
    metadata: { concept_id: conceptId, cleared_by: 'parent' },
  });

  revalidatePath('/dashboard');
}

/**
 * Helper interno llamado desde submitAttemptAction.
 * Loguea el evento apropiado según el outcome + attempt anterior en el mismo concepto.
 */
export async function trackStrugglingFromAttempt(opts: {
  studentId: string;
  conceptId: string;
  currentOutcome: AnswerOutcome;
  previousOutcomeOnConcept: AnswerOutcome | null;
}): Promise<void> {
  const { studentId, conceptId, currentOutcome, previousOutcomeOnConcept } = opts;

  // Acierto → limpiar si había alerta activa
  if (currentOutcome === 'correct_first' || currentOutcome === 'correct_retry') {
    await logDataAccess({
      studentId,
      accessType: 'write',
      accessTarget: 'concept.struggling_cleared',
      metadata: { concept_id: conceptId, cleared_by: 'correct_answer' },
    });
    return;
  }

  // Falla + falla anterior = alerta
  if (previousOutcomeOnConcept === 'incorrect') {
    await logDataAccess({
      studentId,
      accessType: 'write',
      accessTarget: 'concept.struggling_alert',
      metadata: { concept_id: conceptId },
    });
  }
}
