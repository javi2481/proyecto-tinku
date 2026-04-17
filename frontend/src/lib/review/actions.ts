'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/auth/admin';
import { logger } from '@/lib/observability/logger';

export type ReviewStatus = 'approved' | 'needs_revision' | 'rejected' | 'pending';

export type ReviewActionResult =
  | { ok: true; updated: number }
  | { ok: false; error: string };

async function requireAdmin() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  if (!isAdminEmail(user.email)) redirect('/dashboard');
  return user;
}

/**
 * Revisa un ejercicio: setea status + reviewer + reviewed_at + notes.
 * Si status='rejected', también soft-delete el ejercicio para que el engine lo excluya.
 * Si status='approved', limpia el deleted_at por si venía rejected antes.
 */
export async function reviewExerciseAction(
  exerciseId: string,
  status: ReviewStatus,
  notes: string | null,
): Promise<ReviewActionResult> {
  const user = await requireAdmin();
  const svc = createServiceSupabase();

  const now = new Date().toISOString();
  const update: Record<string, unknown> = {
    pedagogical_review_status: status,
    pedagogical_reviewer_id: user.id,
    pedagogical_reviewed_at: now,
    pedagogical_notes: notes && notes.trim() ? notes.trim() : null,
  };
  if (status === 'rejected') {
    update.deleted_at = now;
  } else if (status === 'approved') {
    update.deleted_at = null;
  }

  const { error } = await svc
    .from('exercises')
    .update(update)
    .eq('id', exerciseId);

  if (error) {
    await logger.error('review.exercise', error.message, { exerciseId, status });
    return { ok: false, error: 'generic' };
  }

  await logger.info('review.exercise', 'reviewed', {
    exerciseId,
    status,
    reviewerId: user.id,
    hasNotes: Boolean(notes),
  });

  revalidatePath('/review-exercises');
  return { ok: true, updated: 1 };
}

/**
 * Aprueba en batch todos los ejercicios pending de un concepto. Útil para confirmar
 * "todos los easy/medium/hard están bien" de una tanda generada.
 */
export async function bulkApproveByConceptAction(
  conceptId: string,
  currentStatus: ReviewStatus = 'pending',
): Promise<ReviewActionResult> {
  const user = await requireAdmin();
  const svc = createServiceSupabase();

  const now = new Date().toISOString();
  const { data, error } = await svc
    .from('exercises')
    .update({
      pedagogical_review_status: 'approved',
      pedagogical_reviewer_id: user.id,
      pedagogical_reviewed_at: now,
    })
    .eq('concept_id', conceptId)
    .eq('pedagogical_review_status', currentStatus)
    .is('deleted_at', null)
    .select('id');

  if (error) {
    await logger.error('review.bulk_approve', error.message, { conceptId });
    return { ok: false, error: 'generic' };
  }

  await logger.info('review.bulk_approve', 'approved batch', {
    conceptId,
    count: data?.length ?? 0,
    reviewerId: user.id,
  });

  revalidatePath('/review-exercises');
  return { ok: true, updated: data?.length ?? 0 };
}

/**
 * Resetea a 'pending' todos los ejercicios del seed automático (los que nunca
 * tuvieron pedagogical_reviewer_id). Para forzar revisión real de Javier.
 */
export async function resetUnreviewedToPendingAction(): Promise<ReviewActionResult> {
  await requireAdmin();
  const svc = createServiceSupabase();

  const { data, error } = await svc
    .from('exercises')
    .update({ pedagogical_review_status: 'pending' })
    .is('pedagogical_reviewer_id', null)
    .eq('pedagogical_review_status', 'approved')
    .is('deleted_at', null)
    .select('id');

  if (error) {
    await logger.error('review.reset', error.message);
    return { ok: false, error: 'generic' };
  }

  await logger.info('review.reset', 'reset to pending', { count: data?.length ?? 0 });
  revalidatePath('/review-exercises');
  return { ok: true, updated: data?.length ?? 0 };
}
