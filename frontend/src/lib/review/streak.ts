import 'server-only';
import { createServiceSupabase } from '@/lib/supabase/service';

/**
 * Calcula el streak de repaso diario del alumno.
 * Usa `data_access_log.access_target='daily_review.complete'` (un row por repaso completado).
 *
 * - current: días consecutivos con repaso completo, terminando hoy o ayer.
 *   (Si hoy no lo hizo pero ayer sí, el streak sigue vivo hasta fin del día de hoy.)
 * - max: streak histórico más alto del alumno.
 *
 * Simple y sin migration: calcula on-the-fly desde el audit log.
 */
export interface ReviewStreak {
  current: number;
  max: number;
  doneToday: boolean;
  daysAgo: number | null;
}

function arDayString(iso: string): string {
  // AR (UTC-3): día del usuario en YYYY-MM-DD
  const d = new Date(iso);
  const shifted = new Date(d.getTime() - 3 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

function arTodayString(): string {
  return arDayString(new Date().toISOString());
}

function daysBetween(a: string, b: string): number {
  // a, b son YYYY-MM-DD
  const aMs = Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10));
  const bMs = Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10));
  return Math.round((aMs - bMs) / (24 * 60 * 60 * 1000));
}

export async function getReviewStreak(studentId: string): Promise<ReviewStreak> {
  const svc = createServiceSupabase();
  // Buscamos hasta 365 rows (1 año) para calcular current + max
  const { data } = await svc
    .from('data_access_log')
    .select('accessed_at')
    .eq('student_id', studentId)
    .eq('access_target', 'daily_review.complete')
    .order('accessed_at', { ascending: false })
    .limit(365);

  const rows = (data ?? []) as Array<{ accessed_at: string }>;
  if (rows.length === 0) return { current: 0, max: 0, doneToday: false, daysAgo: null };

  // Set de días únicos
  const uniqueDays = new Set<string>();
  for (const r of rows) uniqueDays.add(arDayString(r.accessed_at));
  const sortedDays = [...uniqueDays].sort().reverse(); // más reciente primero

  const today = arTodayString();
  const lastDay = sortedDays[0];
  const daysAgo = daysBetween(today, lastDay);

  const doneToday = daysAgo === 0;

  // Current streak: contar desde el día más reciente hacia atrás mientras sean consecutivos.
  // Streak vivo si el último día es hoy (daysAgo=0) o ayer (daysAgo=1).
  let current = 0;
  if (daysAgo === 0 || daysAgo === 1) {
    current = 1;
    for (let i = 1; i < sortedDays.length; i++) {
      const gap = daysBetween(sortedDays[i - 1], sortedDays[i]);
      if (gap === 1) current++;
      else break;
    }
  }

  // Max streak histórico
  let max = 1;
  let run = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const gap = daysBetween(sortedDays[i - 1], sortedDays[i]);
    if (gap === 1) {
      run++;
      if (run > max) max = run;
    } else {
      run = 1;
    }
  }
  max = Math.max(max, current);

  return { current, max, doneToday, daysAgo };
}

/** Devuelve los badge codes de streak que el alumno debería tener con `current`. */
export function streakBadgesToAward(current: number): string[] {
  const out: string[] = [];
  if (current >= 3) out.push('streak_3_review');
  if (current >= 7) out.push('streak_7_review');
  if (current >= 30) out.push('streak_30_review');
  return out;
}
