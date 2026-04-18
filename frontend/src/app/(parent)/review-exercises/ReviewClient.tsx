'use client';

import { useState, useTransition } from 'react';
import { reviewExerciseAction, bulkApproveByConceptAction, resetUnreviewedToPendingAction, setExerciseQualityAction, type ReviewStatus } from '@/lib/review/actions';
import { cn } from '@/lib/utils/cn';

interface ExerciseRow {
  id: string;
  difficulty: string;
  exercise_type: string;
  prompt_es: string;
  correct_answer: { value: string };
  content: { options?: string[]; placeholder?: string; quality_score?: number };
  pedagogical_review_status: ReviewStatus;
  pedagogical_notes: string | null;
  pedagogical_reviewed_at: string | null;
}

interface ConceptSection {
  concept_id: string;
  concept_code: string;
  concept_name: string;
  exercises: ExerciseRow[];
}

interface Props {
  sections: ConceptSection[];
  counts: Record<ReviewStatus, number>;
  totalReviewed: number;
  totalAll: number;
}

const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: 'Sin revisar',
  approved: 'Aprobado',
  needs_revision: 'Necesita revisión',
  rejected: 'Rechazado',
};

const STATUS_STYLES: Record<ReviewStatus, string> = {
  pending: 'bg-tinku-ink/10 text-tinku-ink/70',
  approved: 'bg-tinku-leaf/20 text-tinku-leaf',
  needs_revision: 'bg-tinku-warn/20 text-tinku-warn',
  rejected: 'bg-red-100 text-red-700',
};

const DIFF_LABELS: Record<string, string> = {
  easy: 'Fácil',
  medium: 'Media',
  hard: 'Difícil',
};

export function ReviewClient({ sections, counts, totalReviewed, totalAll }: Props) {
  const [filter, setFilter] = useState<ReviewStatus | 'all'>('all');
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [flash, setFlash] = useState<string | null>(null);

  const showFlash = (msg: string) => {
    setFlash(msg);
    window.setTimeout(() => setFlash(null), 2200);
  };

  const onReview = (exerciseId: string, status: ReviewStatus) => {
    startTransition(async () => {
      const res = await reviewExerciseAction(exerciseId, status, notes[exerciseId] ?? null);
      if (res.ok) showFlash(`${STATUS_LABELS[status]}: listo`);
      else showFlash('No se pudo guardar, probá de nuevo');
    });
  };

  const onBulkApprove = (conceptId: string) => {
    if (!confirm('¿Aprobar todos los pendientes de este concepto? Podés revocar uno por uno después si hace falta.')) return;
    startTransition(async () => {
      const res = await bulkApproveByConceptAction(conceptId, 'pending');
      if (res.ok) showFlash(`Aprobaste ${res.updated} ejercicios`);
      else showFlash('Error al aprobar en batch');
    });
  };

  const onResetAll = () => {
    if (!confirm('¿Marcar como "sin revisar" todos los ejercicios que nunca tuvieron review humano? (los seedeados automáticamente)')) return;
    startTransition(async () => {
      const res = await resetUnreviewedToPendingAction();
      if (res.ok) showFlash(`${res.updated} ejercicios marcados como pendientes`);
    });
  };

  const onSetQuality = (exerciseId: string, score: number | null) => {
    startTransition(async () => {
      const res = await setExerciseQualityAction(exerciseId, score);
      if (res.ok) showFlash(score === null ? 'Calidad borrada' : `Calidad: ${score} ⭐`);
      else showFlash('Error al guardar calidad');
    });
  };

  const toggleNotes = (id: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header stats + acciones globales */}
      <div className="rounded-2xl bg-white border border-tinku-ink/10 p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <p data-testid="review-progress" className="text-lg font-semibold text-tinku-ink">
            {totalReviewed} / {totalAll} revisados
          </p>
          <p className="text-sm text-tinku-ink/60">
            <span data-testid="count-approved" className="text-tinku-leaf font-medium">{counts.approved} aprobados</span>
            {' · '}
            <span data-testid="count-pending" className="font-medium">{counts.pending} pendientes</span>
            {' · '}
            <span data-testid="count-revision" className="text-tinku-warn font-medium">{counts.needs_revision} a revisar</span>
            {' · '}
            <span data-testid="count-rejected" className="text-red-600 font-medium">{counts.rejected} rechazados</span>
          </p>
        </div>

        {/* Filter tabs */}
        <div data-testid="review-filters" className="flex flex-wrap gap-2">
          {(['all', 'pending', 'approved', 'needs_revision', 'rejected'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              data-testid={`filter-${f}`}
              className={cn(
                'h-9 px-3 rounded-full text-xs font-medium border-2 transition-colors',
                filter === f
                  ? 'bg-tinku-sea text-white border-tinku-sea'
                  : 'bg-white text-tinku-ink/70 border-tinku-ink/10 hover:border-tinku-sea/50',
              )}
            >
              {f === 'all' ? `Todos (${totalAll})` : `${STATUS_LABELS[f]} (${counts[f]})`}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onResetAll}
          data-testid="reset-unreviewed"
          disabled={isPending}
          className="text-xs text-tinku-ink/60 hover:text-tinku-ink underline disabled:opacity-50"
        >
          Marcar como &quot;sin revisar&quot; los que nunca tuvieron review humano
        </button>
      </div>

      {flash && (
        <div data-testid="review-flash" className="fixed bottom-6 right-6 z-40 rounded-2xl bg-tinku-ink text-white px-4 py-2.5 shadow-lg text-sm font-medium">
          {flash}
        </div>
      )}

      {/* Secciones por concepto */}
      {sections.map((sec) => {
        const filtered = filter === 'all'
          ? sec.exercises
          : sec.exercises.filter((e) => e.pedagogical_review_status === filter);
        if (filtered.length === 0 && filter !== 'all') return null;
        const pendingInConcept = sec.exercises.filter(e => e.pedagogical_review_status === 'pending').length;

        return (
          <section
            key={sec.concept_id}
            data-testid={`concept-section-${sec.concept_code}`}
            className="rounded-2xl bg-white border border-tinku-ink/10 p-5 sm:p-6 space-y-4"
          >
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-tinku-ink">{sec.concept_name}</h2>
                <p className="text-xs text-tinku-ink/60 font-mono">{sec.concept_code}</p>
              </div>
              {pendingInConcept > 0 && (
                <button
                  type="button"
                  onClick={() => onBulkApprove(sec.concept_id)}
                  data-testid={`bulk-approve-${sec.concept_code}`}
                  disabled={isPending}
                  className="h-10 px-4 rounded-xl bg-tinku-leaf/15 text-tinku-leaf font-semibold text-sm hover:bg-tinku-leaf/25 disabled:opacity-50"
                >
                  ✓ Aprobar los {pendingInConcept} pendientes
                </button>
              )}
            </header>

            <ul className="divide-y divide-tinku-ink/10">
              {filtered.map((e) => {
                const isNumeric = e.exercise_type === 'numeric_input';
                const notesOpen = expandedNotes.has(e.id);
                return (
                  <li
                    key={e.id}
                    data-testid={`exercise-${e.id}`}
                    data-status={e.pedagogical_review_status}
                    className="py-4 first:pt-0 last:pb-0 space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className={cn('px-2 py-0.5 rounded-full font-medium', STATUS_STYLES[e.pedagogical_review_status])}>
                            {STATUS_LABELS[e.pedagogical_review_status]}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-tinku-sand/60 text-tinku-ink/80 font-medium">
                            {DIFF_LABELS[e.difficulty] ?? e.difficulty}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-tinku-sea/10 text-tinku-sea font-medium">
                            {isNumeric ? 'Numérico' : 'Opción múltiple'}
                          </span>
                          {e.pedagogical_reviewed_at && (
                            <span className="text-tinku-ink/50">
                              Revisado {new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' }).format(new Date(e.pedagogical_reviewed_at))}
                            </span>
                          )}
                        </div>
                        <p data-testid="exercise-prompt-review" className="text-base text-tinku-ink leading-snug">
                          {e.prompt_es}
                        </p>
                        <p className="text-sm text-tinku-ink/70">
                          <span className="font-medium">Respuesta correcta:</span>{' '}
                          <code className="font-mono bg-tinku-leaf/10 px-1.5 py-0.5 rounded text-tinku-leaf">{e.correct_answer.value}</code>
                          {!isNumeric && e.content.options && (
                            <>
                              {' · '}
                              <span className="font-medium">Opciones:</span>{' '}
                              <span className="text-tinku-ink/60">{e.content.options.join(' · ')}</span>
                            </>
                          )}
                          {isNumeric && e.content.placeholder && (
                            <>
                              {' · '}
                              <span className="text-tinku-ink/60">placeholder: {e.content.placeholder}</span>
                            </>
                          )}
                        </p>
                        {e.pedagogical_notes && !notesOpen && (
                          <p className="text-xs text-tinku-ink/60 italic bg-tinku-mist/50 rounded px-2 py-1 inline-block">
                            Nota: {e.pedagogical_notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {notesOpen && (
                      <textarea
                        data-testid={`notes-input-${e.id}`}
                        defaultValue={e.pedagogical_notes ?? ''}
                        onChange={(ev) => setNotes((prev) => ({ ...prev, [e.id]: ev.target.value }))}
                        placeholder="Comentario pedagógico (opcional): qué habría que cambiar, por qué, etc."
                        rows={2}
                        className="w-full rounded-xl border-2 border-tinku-ink/10 focus:border-tinku-sea outline-none p-3 text-sm resize-none"
                      />
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onReview(e.id, 'approved')}
                        disabled={isPending || e.pedagogical_review_status === 'approved'}
                        data-testid={`btn-approve-${e.id}`}
                        className={cn(
                          'h-10 px-4 rounded-xl text-sm font-semibold transition-colors',
                          e.pedagogical_review_status === 'approved'
                            ? 'bg-tinku-leaf/15 text-tinku-leaf cursor-default'
                            : 'bg-tinku-leaf/20 text-tinku-leaf hover:bg-tinku-leaf/30',
                          'disabled:opacity-50',
                        )}
                      >
                        ✓ Aprobar
                      </button>
                      <button
                        type="button"
                        onClick={() => onReview(e.id, 'needs_revision')}
                        disabled={isPending}
                        data-testid={`btn-revision-${e.id}`}
                        className="h-10 px-4 rounded-xl text-sm font-semibold bg-tinku-warn/15 text-tinku-warn hover:bg-tinku-warn/25 disabled:opacity-50"
                      >
                        ↻ Revisar
                      </button>
                      <button
                        type="button"
                        onClick={() => onReview(e.id, 'rejected')}
                        disabled={isPending}
                        data-testid={`btn-reject-${e.id}`}
                        className="h-10 px-4 rounded-xl text-sm font-semibold bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        ✕ Rechazar
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleNotes(e.id)}
                        data-testid={`btn-notes-${e.id}`}
                        className="h-10 px-4 rounded-xl text-sm font-medium text-tinku-ink/70 hover:bg-tinku-mist/50"
                      >
                        {notesOpen ? 'Ocultar nota' : (e.pedagogical_notes ? 'Editar nota' : 'Agregar nota')}
                      </button>
                      <div
                        data-testid={`quality-stars-${e.id}`}
                        className="flex items-center gap-0.5 ml-auto pl-2 border-l border-tinku-ink/10"
                        title="Calidad pedagógica (1-5). El motor prioriza los de mayor puntaje."
                      >
                        {[1, 2, 3, 4, 5].map((n) => {
                          const active = (e.content.quality_score ?? 0) >= n;
                          return (
                            <button
                              key={n}
                              type="button"
                              disabled={isPending}
                              onClick={() => onSetQuality(e.id, e.content.quality_score === n ? null : n)}
                              data-testid={`quality-${e.id}-${n}`}
                              aria-label={`Calidad ${n}`}
                              className={cn(
                                'w-7 h-7 rounded-md flex items-center justify-center text-base transition-colors disabled:opacity-50',
                                active ? 'text-amber-400' : 'text-tinku-ink/20 hover:text-amber-300',
                              )}
                            >
                              ★
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
