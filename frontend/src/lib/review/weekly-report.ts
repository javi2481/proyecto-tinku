'use server';

/**
 * Mini-reporte semanal del padre.
 *
 * Arma un texto rioplatense con la actividad del hijo de los últimos 7 días,
 * listo para que el padre lo copie y lo pegue en WhatsApp familiar.
 *
 * Lee directamente:
 *  - sessions (minutos totales + días activos)
 *  - attempts (correct + total + XP)
 *  - concept_mastery (conceptos dominados en la semana)
 *  - data_access_log (struggling alerts activas)
 *
 * No escribe nada: pura lectura. Sin cache para siempre tener la data fresca.
 */

import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { getStrugglingAlerts } from './struggling';

const DAY_MS = 24 * 60 * 60 * 1000;

async function requireParentOwnsStudent(studentId: string): Promise<{ parentId: string; studentName: string }> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const svc = createServiceSupabase();
  const { data: student } = await svc
    .from('students')
    .select('id, first_name, parent_id')
    .eq('id', studentId)
    .eq('parent_id', user.id)
    .maybeSingle();
  if (!student) redirect('/dashboard');

  return { parentId: user.id, studentName: student.first_name as string };
}

export async function getWeeklyReportAction(studentId: string): Promise<{ message: string }> {
  const { studentName } = await requireParentOwnsStudent(studentId);
  const svc = createServiceSupabase();

  const since = new Date(Date.now() - 7 * DAY_MS).toISOString();

  const [
    { data: sessions },
    { data: attempts },
    { data: masteries },
    strugglingAlerts,
  ] = await Promise.all([
    svc.from('sessions')
      .select('duration_seconds, started_at')
      .eq('student_id', studentId)
      .gte('started_at', since),
    svc.from('attempts')
      .select('outcome, xp_earned, created_at')
      .eq('student_id', studentId)
      .gte('created_at', since),
    svc.from('concept_mastery')
      .select('concept_id, mastered_at, is_mastered, concepts(name_es)')
      .eq('student_id', studentId)
      .eq('is_mastered', true)
      .gte('mastered_at', since),
    getStrugglingAlerts(studentId),
  ]);

  // Minutos totales
  const totalMin = Math.round(
    (sessions ?? []).reduce((acc, s) => acc + ((s.duration_seconds as number | null) ?? 0), 0) / 60,
  );

  // Días activos distintos
  const activeDays = new Set(
    (sessions ?? []).map((s) => new Date(s.started_at as string).toISOString().slice(0, 10)),
  ).size;

  // Ejercicios + accuracy
  const totalAttempts = attempts?.length ?? 0;
  const correctAttempts = (attempts ?? []).filter(
    (a) => a.outcome === 'correct_first' || a.outcome === 'correct_retry',
  ).length;
  const xpWeek = (attempts ?? []).reduce((acc, a) => acc + ((a.xp_earned as number | null) ?? 0), 0);

  const masteredNames = (masteries ?? [])
    .map((m) => (m as unknown as { concepts: { name_es: string } | null }).concepts?.name_es)
    .filter(Boolean) as string[];

  // Construir mensaje rioplatense
  const lines: string[] = [];
  lines.push(`📚 Resumen de la semana — ${studentName}`);
  lines.push('');

  if (totalAttempts === 0) {
    lines.push(`${studentName} no jugó esta semana. ¿Le damos un empujón?`);
    lines.push('');
    lines.push('Está esperándote en tinku.app 💛');
    return { message: lines.join('\n') };
  }

  lines.push(`⏱️ ${totalMin} minuto${totalMin === 1 ? '' : 's'} en total`);
  lines.push(`📅 Entró ${activeDays} día${activeDays === 1 ? '' : 's'} distinto${activeDays === 1 ? '' : 's'}`);
  lines.push(`✏️ Resolvió ${totalAttempts} ejercicio${totalAttempts === 1 ? '' : 's'} (${correctAttempts} bien al primer intento)`);
  lines.push(`⭐ Sumó ${xpWeek} XP esta semana`);
  lines.push('');

  if (masteredNames.length > 0) {
    lines.push(`🌟 ¡Dominó conceptos nuevos!`);
    for (const name of masteredNames) lines.push(`   • ${name}`);
    lines.push('');
  }

  if (strugglingAlerts.length > 0) {
    lines.push(`🔔 Le está costando:`);
    for (const a of strugglingAlerts) lines.push(`   • ${a.conceptName}`);
    lines.push(`   (3 minutos con vos ayudan un montón)`);
    lines.push('');
  }

  lines.push('Hecho con Tinkú 💛 tinku.app');

  return { message: lines.join('\n') };
}
