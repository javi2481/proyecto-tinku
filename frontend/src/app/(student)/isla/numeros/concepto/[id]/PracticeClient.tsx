'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getNextExerciseAction, submitAttemptAction, closeSessionAction } from '@/lib/sessions/actions';
import type { Exercise } from '@/types/database';
import { cn } from '@/lib/utils/cn';

interface Props {
  conceptId: string;
  conceptName: string;
  sessionId: string;
  initialExercise: Exercise;
  initialPKnown: number;
}

type Feedback = {
  correct: boolean;
  xp: number;
  justMastered: boolean;
  newBadges: Array<{ code: string; name_es: string; icon_url: string }>;
} | null;

export function PracticeClient({
  conceptId,
  conceptName,
  sessionId,
  initialExercise,
  initialPKnown,
}: Props) {
  const router = useRouter();
  const [exercise, setExercise] = useState<Exercise>(initialExercise);
  const [pKnown, setPKnown] = useState(initialPKnown);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [showHint, setShowHint] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [mastered, setMastered] = useState(false);
  const [isPending, startTransition] = useTransition();
  const startedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    startedAtRef.current = Date.now();
    setSelected(null);
    setFeedback(null);
    setShowHint(false);
    setHintsUsed(0);
  }, [exercise.id]);

  const options = (exercise.content as { options?: string[] }).options ?? [];
  const hints = (exercise.hints as Array<{ text: string }>) ?? [];
  const firstHint = hints[0]?.text;

  const onSubmit = () => {
    if (!selected) return;
    const timeSpent = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
    startTransition(async () => {
      const res = await submitAttemptAction({
        sessionId,
        exerciseId: exercise.id,
        answer: { value: selected },
        timeSpentSeconds: timeSpent,
        hintsUsed,
      });
      setFeedback({
        correct: res.correct,
        xp: res.xpEarned,
        justMastered: res.justMastered,
        newBadges: res.newBadges,
      });
      setPKnown(res.pKnownNew);
    });
  };

  const onNext = () => {
    startTransition(async () => {
      const next = await getNextExerciseAction(conceptId, exercise.id);
      if (next.kind === 'exercise') {
        setExercise(next.exercise);
        setPKnown(next.pKnown);
      } else if (next.kind === 'mastered') {
        setMastered(true);
      } else {
        setMastered(true);
      }
    });
  };

  const onExit = async () => {
    await closeSessionAction(sessionId, 'user_exit');
    router.push('/isla/numeros');
  };

  if (mastered) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div
          data-testid="concept-mastered"
          className="max-w-md w-full rounded-3xl bg-white p-8 text-center space-y-4 border-2 border-tinku-leaf/40 animate-celebrate"
        >
          <div className="text-6xl" aria-hidden>🌟</div>
          <h1 className="text-2xl font-bold text-tinku-ink">¡Gran trabajo!</h1>
          <p className="text-tinku-ink/70">
            Completaste una tanda de <strong>{conceptName}</strong>. Seguí con otra actividad cuando quieras.
          </p>
          <Link
            href="/isla/numeros"
            data-testid="done-back"
            className="inline-flex items-center justify-center h-12 px-5 rounded-2xl bg-tinku-sea text-white font-medium hover:bg-tinku-sea/90 exercise-target"
          >
            Elegir otra actividad
          </Link>
        </div>
      </div>
    );
  }

  const pct = Math.round(pKnown * 100);

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header con progreso + salir */}
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExit}
            data-testid="exit-practice"
            className="h-12 px-4 rounded-2xl bg-white/70 text-tinku-ink font-medium border-2 border-tinku-ink/10 hover:bg-white exercise-target"
          >
            ← Salir
          </button>
          <div className="flex-1">
            <p className="text-sm text-tinku-ink/70 mb-1 font-medium">{conceptName}</p>
            <div className="h-3 rounded-full bg-tinku-ink/10 overflow-hidden">
              <div
                data-testid="practice-progress"
                className="h-full bg-tinku-sea transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </header>

        {/* Ejercicio */}
        <section data-testid="exercise-card" className="rounded-3xl bg-white p-6 sm:p-8 space-y-6 border-2 border-tinku-ink/5">
          <p data-testid="exercise-prompt" className="text-2xl font-semibold text-tinku-ink leading-snug">
            {exercise.prompt_es}
          </p>

          <div data-testid="exercise-options" className="grid grid-cols-2 gap-3">
            {options.map((opt, idx) => {
              const isSelected = selected === opt;
              const disabled = Boolean(feedback) || isPending;
              return (
                <button
                  key={`${exercise.id}-${idx}`}
                  type="button"
                  onClick={() => !disabled && setSelected(opt)}
                  disabled={disabled}
                  data-testid={`option-${idx}`}
                  className={cn(
                    'exercise-target rounded-2xl h-16 text-2xl font-semibold border-2 transition-all',
                    isSelected
                      ? 'border-tinku-sea bg-tinku-sea/10 text-tinku-ink scale-[1.02]'
                      : 'border-tinku-ink/10 bg-tinku-mist/50 text-tinku-ink hover:border-tinku-sea/50',
                    feedback && feedback.correct && isSelected && 'border-tinku-leaf bg-tinku-leaf/15',
                    feedback && !feedback.correct && isSelected && 'border-tinku-warn bg-tinku-warn/10',
                    disabled && 'cursor-not-allowed',
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {firstHint && !feedback && (
            <div>
              {!showHint ? (
                <button
                  type="button"
                  onClick={() => { setShowHint(true); setHintsUsed((h) => h + 1); }}
                  data-testid="hint-btn"
                  className="text-sm text-tinku-sea font-medium hover:underline"
                >
                  💡 Mostrar una pista
                </button>
              ) : (
                <p data-testid="hint-text" className="text-sm text-tinku-ink/80 bg-tinku-sand/40 rounded-xl p-3">
                  💡 {firstHint}
                </p>
              )}
            </div>
          )}

          {!feedback && (
            <button
              type="button"
              onClick={onSubmit}
              disabled={!selected || isPending}
              data-testid="submit-answer"
              className={cn(
                'w-full h-14 rounded-2xl text-lg font-semibold transition-all exercise-target',
                'bg-tinku-sea text-white hover:bg-tinku-sea/90 active:scale-[0.98]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {isPending ? 'Enviando…' : '¡Listo!'}
            </button>
          )}

          {feedback && (
            <div
              data-testid="feedback"
              className={cn(
                'rounded-2xl p-5 space-y-3 animate-celebrate',
                feedback.correct ? 'bg-tinku-leaf/10 border-2 border-tinku-leaf/40' : 'bg-tinku-warn/10 border-2 border-tinku-warn/40',
              )}
              aria-live="polite"
            >
              <div className="text-4xl" aria-hidden>
                {feedback.correct ? '🎉' : '💭'}
              </div>
              <p className="text-xl font-semibold text-tinku-ink">
                {feedback.correct ? '¡Muy bien!' : 'Casi. ¿Probamos otra?'}
              </p>
              {feedback.correct && feedback.xp > 0 && (
                <p data-testid="feedback-xp" className="text-sm text-tinku-ink/80">
                  Ganaste <strong>+{feedback.xp} XP</strong> 🌟
                </p>
              )}
              {feedback.justMastered && (
                <p data-testid="feedback-mastered" className="text-sm text-tinku-leaf font-medium">
                  ¡Dominaste este concepto!
                </p>
              )}
              {feedback.newBadges.length > 0 && (
                <ul data-testid="feedback-badges" className="space-y-1">
                  {feedback.newBadges.map((b) => (
                    <li key={b.code} className="text-sm text-tinku-ink/80">
                      🏅 Ganaste el badge <strong>{b.name_es}</strong>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={onNext}
                disabled={isPending}
                data-testid="next-exercise"
                className="w-full h-12 rounded-2xl bg-tinku-sea text-white font-semibold hover:bg-tinku-sea/90 disabled:opacity-60 exercise-target"
              >
                {isPending ? 'Cargando…' : 'Siguiente ejercicio →'}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
