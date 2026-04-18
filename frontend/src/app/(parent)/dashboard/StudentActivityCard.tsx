// Fix: mover la importación del componente cliente arriba (los 'use client' deben ser importados limpios).
import { CopyButton } from './CopyActivityLinkButton';
import { AcknowledgeStrugglingButton } from './AcknowledgeStrugglingButton';
import Link from 'next/link';
import { createServiceSupabase } from '@/lib/supabase/service';
import { getReviewStreak } from '@/lib/review/streak';
import { getStrugglingAlerts } from '@/lib/review/struggling';

interface Props {
  studentId: string;
  studentName: string;
  loginCode: string;
}

/**
 * Card debajo de cada hijo en el dashboard del padre:
 *  - "Hizo su repaso hoy" (verde)
 *  - "Pendiente" (amarillo) cuando no lo hizo hoy pero jugó en los últimos 2 días
 *  - "Hace N días que no entra" (rojo suave) cuando no hay actividad reciente
 *  - "Sin actividad todavía" (gris) cuando el chico nunca jugó
 *
 * Copia rápida: botón "Enviar link para WhatsApp" → copia el link directo a /entrar
 * + código al portapapeles con un mensaje armado.
 */
export async function StudentActivityCard({ studentId, studentName, loginCode }: Props) {
  const svc = createServiceSupabase();

  const [{ data: lastSession }, streak, strugglingAlerts] = await Promise.all([
    svc.from('sessions')
      .select('started_at, exercises_attempted')
      .eq('student_id', studentId)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    getReviewStreak(studentId),
    getStrugglingAlerts(studentId),
  ]);

  const lastActivityAt = lastSession?.started_at as string | undefined;
  const daysSinceActivity = lastActivityAt
    ? Math.floor((Date.now() - new Date(lastActivityAt).getTime()) / (24 * 60 * 60 * 1000))
    : null;

  const state =
    streak.doneToday ? 'done' :
    daysSinceActivity === null ? 'never' :
    daysSinceActivity <= 1 ? 'pending' :
    daysSinceActivity <= 3 ? 'soft_alert' :
    'alert';

  const meta = getStateMeta(state, studentName, daysSinceActivity);

  return (
    <div
      data-testid={`activity-card-${studentId}`}
      data-state={state}
      className={`rounded-2xl border-2 p-4 space-y-3 ${meta.bg} ${meta.border}`}
    >
      <div className="flex items-start gap-3">
        <div aria-hidden className="text-2xl leading-none mt-0.5">{meta.icon}</div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${meta.titleColor}`}>{meta.title}</p>
          <p className="text-xs text-tinku-ink/70 mt-0.5">{meta.body}</p>
          {streak.current > 0 && (
            <p className="text-xs text-tinku-ink/60 mt-1">
              🔥 Racha actual: {streak.current} día{streak.current === 1 ? '' : 's'}
              {streak.max > streak.current && <> (máx {streak.max})</>}
            </p>
          )}
        </div>
      </div>
      {(state === 'pending' || state === 'soft_alert' || state === 'alert') && (
        <ShareLinkButton studentName={studentName} loginCode={loginCode} />
      )}
      {strugglingAlerts.length > 0 && (
        <div
          data-testid={`struggling-alerts-${studentId}`}
          className="rounded-2xl bg-tinku-warn/15 border-2 border-tinku-warn/40 p-3 space-y-2"
        >
          <div className="flex items-start gap-2">
            <span aria-hidden className="text-xl leading-none">🔔</span>
            <p className="text-sm font-semibold text-tinku-warn">
              {studentName} necesita una manito
            </p>
          </div>
          <ul className="space-y-2">
            {strugglingAlerts.map((a) => (
              <li
                key={a.conceptId}
                data-testid={`struggling-item-${a.conceptCode}`}
                className="flex flex-wrap items-center justify-between gap-2 text-xs text-tinku-ink/85"
              >
                <span className="font-medium">
                  Se está trabando con <strong>{a.conceptName}</strong>. 3 minutos tuyos acá ayudan un montón.
                </span>
                <AcknowledgeStrugglingButton
                  studentId={studentId}
                  conceptId={a.conceptId}
                  conceptName={a.conceptName}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-[11px]">
        <Link
          href={`/students/${studentId}/progress`}
          data-testid={`progress-link-${studentId}`}
          className="text-tinku-sea font-medium hover:underline"
        >
          Ver progreso detallado →
        </Link>
      </p>
    </div>
  );
}

function getStateMeta(state: string, name: string, daysSince: number | null) {
  switch (state) {
    case 'done':
      return {
        icon: '✅', title: `${name} hizo su repaso de hoy`,
        body: 'Se portó como una campeona. Volvé mañana para la siguiente racha.',
        bg: 'bg-tinku-leaf/10', border: 'border-tinku-leaf/30',
        titleColor: 'text-tinku-ink',
      };
    case 'pending':
      return {
        icon: '⏰', title: `${name} no hizo su repaso hoy`,
        body: 'Todavía puede hacerlo: son 5 minutos. ¿Le avisás?',
        bg: 'bg-tinku-sand/30', border: 'border-tinku-sand',
        titleColor: 'text-tinku-ink',
      };
    case 'soft_alert':
      return {
        icon: '👀', title: `Hace ${daysSince} días que ${name} no entra`,
        body: 'Un par de días es normal. Más de una semana y pierde el envión.',
        bg: 'bg-tinku-warn/5', border: 'border-tinku-warn/20',
        titleColor: 'text-tinku-ink',
      };
    case 'alert':
      return {
        icon: '🔔', title: `${name} no entra hace ${daysSince} días`,
        body: 'Un empujón chico ahora evita que se despegue del hábito.',
        bg: 'bg-tinku-warn/15', border: 'border-tinku-warn/40',
        titleColor: 'text-tinku-warn',
      };
    case 'never':
    default:
      return {
        icon: '🌱', title: `${name} todavía no jugó`,
        body: 'Compartile el código y que arranque cuando quiera.',
        bg: 'bg-tinku-ink/5', border: 'border-tinku-ink/10',
        titleColor: 'text-tinku-ink',
      };
  }
}

function ShareLinkButton({ studentName, loginCode }: { studentName: string; loginCode: string }) {
  return (
    <CopyButton
      studentName={studentName}
      loginCode={loginCode}
    />
  );
}
