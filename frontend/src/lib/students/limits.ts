import 'server-only';
import { createServiceSupabase } from '@/lib/supabase/service';

export const PLAN_LIMITS = {
  free: 1,
  premium_active: 3,
  premium_cancelled: 1,
  premium_past_due: 1,
} as const;

export interface StudentCapacity {
  current: number;
  limit: number;
  canAddMore: boolean;
  planStatus: keyof typeof PLAN_LIMITS;
}

/**
 * Computa capacidad de alumnos para un padre. Usa service_role para evitar
 * que un RLS cambio de policy rompa este cálculo en el futuro.
 */
export async function getStudentCapacity(parentId: string): Promise<StudentCapacity> {
  const svc = createServiceSupabase();

  const [{ count: current }, subRes] = await Promise.all([
    svc.from('students')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', parentId)
      .is('deleted_at', null),
    svc.from('subscriptions')
      .select('status')
      .eq('parent_id', parentId)
      .maybeSingle(),
  ]);

  const planStatus = ((subRes.data?.status as keyof typeof PLAN_LIMITS) ?? 'free');
  const limit = PLAN_LIMITS[planStatus] ?? 1;
  const curr = current ?? 0;

  return {
    current: curr,
    limit,
    canAddMore: curr < limit,
    planStatus,
  };
}
