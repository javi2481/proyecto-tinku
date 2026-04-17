import { cn } from '@/lib/utils/cn';
import type { ReviewStreak } from '@/lib/review/streak';

type ConceptStat = {
  id: string; code: string; name: string;
  pKnown: number; attempts: number; accuracy: number | null;
  mastered: boolean;
  status: 'mastered' | 'progress' | 'struggling' | 'not_started';
};

type Day = { date: string; label: string; minutes: number; exercises: number };

interface Props {
  totalXp: number;
  generalStreak: number;
  reviewStreak: ReviewStreak;
  totalMinutesWeek: number;
  activeDaysWeek: number;
  masteredCount: number;
  totalConcepts: number;
  concepts: ConceptStat[];
  days: Day[];
}

const STATUS_META: Record<ConceptStat['status'], { label: string; className: string; emoji: string }> = {
  mastered:     { label: 'Dominado',       className: 'bg-tinku-leaf/15 text-tinku-leaf border-tinku-leaf/30', emoji: '🌟' },
  progress:     { label: 'En progreso',    className: 'bg-tinku-sea/15 text-tinku-sea border-tinku-sea/30',    emoji: '📈' },
  struggling:   { label: 'Necesita ayuda', className: 'bg-tinku-warn/15 text-tinku-warn border-tinku-warn/40', emoji: '💪' },
  not_started:  { label: 'Sin empezar',    className: 'bg-tinku-ink/5 text-tinku-ink/60 border-tinku-ink/10',  emoji: '🌱' },
};

export function ProgressContent(props: Props) {
  const {
    totalXp, generalStreak, reviewStreak,
    totalMinutesWeek, activeDaysWeek,
    masteredCount, totalConcepts,
    concepts, days,
  } = props;

  const maxMinutes = Math.max(1, ...days.map(d => d.minutes));
  const strugglingConcepts = concepts.filter(c => c.status === 'struggling');

  return (
    <div className="space-y-6">
      {/* Stats overview */}
      <section data-testid="progress-stats" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="XP total" value={totalXp} icon="⭐" />
        <StatCard
          label="Racha de repaso"
          value={reviewStreak.current}
          suffix={reviewStreak.current === 1 ? 'día' : 'días'}
          icon="🔥"
          hint={reviewStreak.max > reviewStreak.current ? `Máx ${reviewStreak.max}` : undefined}
        />
        <StatCard
          label="Esta semana"
          value={totalMinutesWeek}
          suffix={totalMinutesWeek === 1 ? 'min' : 'min'}
          icon="⏱️"
          hint={`${activeDaysWeek} día${activeDaysWeek === 1 ? '' : 's'} activo${activeDaysWeek === 1 ? '' : 's'}`}
        />
        <StatCard
          label="Conceptos"
          value={`${masteredCount}/${totalConcepts}`}
          suffix="dominados"
          icon="📚"
        />
      </section>

      {/* Struggling alert (si hay) */}
      {strugglingConcepts.length > 0 && (
        <section
          data-testid="progress-alert"
          className="rounded-2xl border-2 border-tinku-warn/30 bg-tinku-warn/5 p-5 space-y-2"
        >
          <h2 className="text-base font-semibold text-tinku-ink flex items-center gap-2">
            <span aria-hidden>💡</span> Le está costando
          </h2>
          <p className="text-sm text-tinku-ink/75">
            {strugglingConcepts.length === 1 ? (
              <>Hay 1 concepto donde <strong>{strugglingConcepts[0].name}</strong> necesita más práctica. Tranquilo, es parte del proceso.</>
            ) : (
              <>Hay <strong>{strugglingConcepts.length} conceptos</strong> que podrían necesitar un refuerzo: {strugglingConcepts.map(c => c.name).join(', ')}.</>
            )}
          </p>
        </section>
      )}

      {/* Weekly activity chart */}
      <section data-testid="progress-chart" className="rounded-2xl border border-tinku-ink/10 bg-white p-5 sm:p-6 space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-tinku-ink">Actividad últimos 7 días</h2>
          <p className="text-xs text-tinku-ink/60">Minutos por día</p>
        </div>
        {totalMinutesWeek === 0 ? (
          <p data-testid="no-activity" className="text-sm text-tinku-ink/60 py-6 text-center">
            Todavía no hay actividad esta semana.
          </p>
        ) : (
          <ol className="flex items-end gap-2 h-40">
            {days.map((d) => {
              const pct = maxMinutes > 0 ? (d.minutes / maxMinutes) * 100 : 0;
              return (
                <li key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="flex-1 w-full flex items-end">
                    <div
                      data-testid={`bar-${d.date}`}
                      className={cn(
                        'w-full rounded-t-md transition-all',
                        d.minutes > 0 ? 'bg-tinku-sea' : 'bg-tinku-ink/5',
                      )}
                      style={{ height: `${Math.max(4, pct)}%` }}
                      title={`${d.label}: ${d.minutes} min, ${d.exercises} ejercicios`}
                    />
                  </div>
                  <p className="text-[11px] font-medium text-tinku-ink/60">{d.label}</p>
                  <p className="text-[11px] text-tinku-ink font-semibold leading-none">{d.minutes > 0 ? d.minutes : '·'}</p>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* Concept breakdown */}
      <section data-testid="progress-concepts" className="rounded-2xl border border-tinku-ink/10 bg-white p-5 sm:p-6 space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-tinku-ink">Por concepto</h2>
          <p className="text-xs text-tinku-ink/60">Barra = dominio estimado</p>
        </div>
        {concepts.length === 0 ? (
          <p className="text-sm text-tinku-ink/60 py-4 text-center">Todavía no hay conceptos cargados para este grado.</p>
        ) : (
          <ul className="space-y-3">
            {concepts.map((c) => {
              const pct = Math.round(c.pKnown * 100);
              const meta = STATUS_META[c.status];
              return (
                <li
                  key={c.id}
                  data-testid={`concept-stat-${c.code}`}
                  className="rounded-xl border border-tinku-ink/10 p-4 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span aria-hidden className="text-lg">{meta.emoji}</span>
                      <p className="font-medium text-tinku-ink">{c.name}</p>
                    </div>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', meta.className)}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-tinku-ink/10 overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all',
                        c.mastered ? 'bg-tinku-leaf' :
                        c.pKnown >= 0.5 ? 'bg-tinku-sea' :
                        c.attempts > 0 ? 'bg-tinku-warn' : 'bg-tinku-ink/20',
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-tinku-ink/60">
                    {c.attempts === 0 ? (
                      <>Sin intentos todavía</>
                    ) : (
                      <>
                        {pct}% de dominio · {c.attempts} intento{c.attempts === 1 ? '' : 's'}
                        {c.accuracy !== null && <> · {Math.round(c.accuracy * 100)}% acierto</>}
                      </>
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, suffix, icon, hint }: {
  label: string; value: string | number; suffix?: string; icon: string; hint?: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-tinku-ink/10 p-4 space-y-1">
      <p className="text-xs text-tinku-ink/60 flex items-center gap-1.5">
        <span aria-hidden>{icon}</span> {label}
      </p>
      <p className="text-2xl font-bold text-tinku-ink leading-tight">
        {value}
        {suffix && <span className="text-sm font-medium text-tinku-ink/60 ml-1">{suffix}</span>}
      </p>
      {hint && <p className="text-[11px] text-tinku-ink/50">{hint}</p>}
    </div>
  );
}
