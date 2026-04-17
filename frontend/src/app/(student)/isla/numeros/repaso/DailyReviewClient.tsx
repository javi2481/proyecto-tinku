'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { submitAttemptAction } from '@/lib/sessions/actions';
import { completeDailyReviewAction } from '@/lib/review/daily';
import { CelebrationModal, type CelebrationPayload } from '@/components/celebration/CelebrationModal';
import { cn } from '@/lib/utils/cn';
import { strings } from '@/content/strings/es-AR';
import type { Exercise } from '@/types/database';

interface Props {
  sessionId: string;
  exercises: Exercise[];
  studentName: string;
}

export function DailyReviewClient({ sessionId, exercises, studentName }: Props) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; xp: number } | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [done, setDone] = useState(false);
  const [celebration, setCelebration] = useState<Omit<CelebrationPayload, 'onClose'> | null>(null);
  const [isPending, startTransition] = useTransition();
  const startedAtRef = useRef<number>(Date.now());

  const exercise = exercises[idx];
  const total = exercises.length;
  const options = (exercise?.content as { options?: string[] })?.options ?? [];
  const isNumeric = exercise?.exercise_type === 'numeric_input';
  const numericPlaceholder =
    (exercise?.content as { placeholder?: string })?.placeholder ?? '0';

  useEffect(() => {
    startedAtRef.current = Date.now();
    setSelected(null);
    setFeedback(null);
  }, [idx]);

  const onSubmit = () => {
    if (!selected || !exercise) return;
    if (isNumeric && !/^-?\d+$/.test(selected)) return;
    const timeSpent = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
    startTransition(async () => {
      const res = await submitAttemptAction({
        sessionId,
        exerciseId: exercise.id,
        answer: { value: selected },
        timeSpentSeconds: timeSpent,
        hintsUsed: 0,
      });
      setFeedback({ correct: res.correct, xp: res.xpEarned });
      if (res.correct) setCorrectCount(c => c + 1);
      setTotalXp(xp => xp + res.xpEarned);
    });
  };

  const onNext = () => {
    if (idx < total - 1) {
      setIdx(idx + 1);
      return;
    }
    // Última — cerrar session + award badge + celebración final
    startTransition(async () => {
      const res = await completeDailyReviewAction(sessionId);
      setDone(true);
      const firstBadge = res.badgesAwarded[0];
      if (firstBadge) {
        setCelebration({
          variant: 'badge',
          title: firstBadge.code.startsWith('streak_')
            ? strings.student.dailyReview.streakBadgeTitle
            : strings.student.dailyReview.firstBadgeTitle,
          body: firstBadge.code.startsWith('streak_')
            ? strings.student.dailyReview.streakBadgeBody
            : strings.student.dailyReview.firstBadgeBody,
          badgeName: firstBadge.name_es,
          ctaLabel: '¡Dale!',
        });
      } else {
        setCelebration({
          variant: 'mastered',
          title: strings.student.dailyReview.completeTitle,
          body: strings.student.dailyReview.completeBody.replace('{correct}', String(correctCount + (feedback?.correct ? 1 : 0))).replace('{total}', String(total)),
          xpEarned: totalXp + (feedback?.xp ?? 0),
          ctaLabel: strings.student.dailyReview.completeCta,
        });
      }
    });
  };

  const dismissCelebration = () => {
    setCelebration(null);
    router.push('/isla/numeros');
  };

  if (done && !celebration) {
    // Caso raro: done sin celebration — redirigimos
    router.push('/isla/numeros');
    return null;
  }

  const progressPct = Math.round(((idx + (feedback ? 1 : 0)) / total) * 100);

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header: progress + salir */}
        <header className="flex items-center gap-3">
          <Link
            href="/isla/numeros"
            data-testid="exit-review"
            className="h-12 px-4 rounded-2xl bg-white/70 text-tinku-ink font-medium border-2 border-tinku-ink/10 hover:bg-white exercise-target inline-flex items-center"
          >
            ← Salir
          </Link>
          <div className="flex-1">
            <p className="text-sm text-tinku-ink/70 mb-1 font-medium flex items-center gap-2">
              <span aria-hidden>⏱️</span> {strings.student.dailyReview.progressLabel.replace('{idx}', String(idx + 1)).replace('{total}', String(total))}
            </p>
            <div className="h-3 rounded-full bg-tinku-ink/10 overflow-hidden">
              <div
                data-testid="review-progress"
                className="h-full bg-tinku-sea transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </header>

        {exercise && !done && (
          <section data-testid="review-exercise-card" className="rounded-3xl bg-white p-6 sm:p-8 space-y-6 border-2 border-tinku-ink/5">
            <p data-testid="review-exercise-prompt" className="text-2xl font-semibold text-tinku-ink leading-snug">
              {exercise.prompt_es}
            </p>

            {isNumeric ? (
              <div data-testid="review-numeric" className="space-y-3">
                <label htmlFor="review-num-answer" className="block text-sm text-tinku-ink/70 font-medium">
                  Escribí el número
                </label>
                <input
                  id="review-num-answer"
                  type="text"
                  inputMode="numeric"
                  pattern="-?[0-9]*"
                  autoComplete="off"
                  data-testid="review-numeric-input"
                  value={selected ?? ''}
                  placeholder={numericPlaceholder}
                  onChange={(e) => {
                    if (feedback || isPending) return;
                    setSelected(e.target.value.replace(/[^0-9-]/g, ''));
                  }}
                  disabled={Boolean(feedback) || isPending}
                  className={cn(
                    'exercise-target w-full h-20 rounded-2xl border-2 bg-tinku-mist/40 text-tinku-ink text-center text-5xl font-bold tracking-wider transition-all',
                    'border-tinku-ink/10 focus:outline-none focus:border-tinku-sea',
                    feedback?.correct && 'border-tinku-leaf bg-tinku-leaf/15',
                    feedback && !feedback.correct && 'border-tinku-warn bg-tinku-warn/10',
                  )}
                />
              </div>
            ) : (
              <div data-testid="review-options" className="grid grid-cols-2 gap-3">
                {options.map((opt, oidx) => {
                  const isSelected = selected === opt;
                  const disabled = Boolean(feedback) || isPending;
                  return (
                    <button
                      key={`${exercise.id}-${oidx}`}
                      type="button"
                      onClick={() => !disabled && setSelected(opt)}
                      disabled={disabled}
                      data-testid={`review-option-${oidx}`}
                      className={cn(
                        'exercise-target rounded-2xl h-16 text-2xl font-semibold border-2 transition-all',
                        isSelected
                          ? 'border-tinku-sea bg-tinku-sea/10 text-tinku-ink scale-[1.02]'
                          : 'border-tinku-ink/10 bg-tinku-mist/50 text-tinku-ink hover:border-tinku-sea/50',
                        feedback?.correct && isSelected && 'border-tinku-leaf bg-tinku-leaf/15',
                        feedback && !feedback.correct && isSelected && 'border-tinku-warn bg-tinku-warn/10',
                        disabled && 'cursor-not-allowed',
                      )}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {!feedback && (
              <button
                type="button"
                onClick={onSubmit}
                disabled={!selected || isPending}
                data-testid="review-submit"
                className="w-full h-14 rounded-2xl text-lg font-semibold bg-tinku-sea text-white hover:bg-tinku-sea/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed exercise-target"
              >
                {isPending ? 'Enviando…' : '¡Listo!'}
              </button>
            )}

            {feedback && (
              <div
                data-testid="review-feedback"
                className={cn(
                  'rounded-2xl p-5 space-y-3 animate-celebrate',
                  feedback.correct ? 'bg-tinku-leaf/10 border-2 border-tinku-leaf/40' : 'bg-tinku-warn/10 border-2 border-tinku-warn/40',
                )}
                aria-live="polite"
              >
                <div className="text-4xl" aria-hidden>{feedback.correct ? '🎉' : '💭'}</div>
                <p className="text-xl font-semibold text-tinku-ink">
                  {feedback.correct ? '¡Muy bien!' : 'Casi.'}
                </p>
                {feedback.correct && feedback.xp > 0 && (
                  <p data-testid="review-feedback-xp" className="text-sm text-tinku-ink/80">
                    Ganaste <strong>+{feedback.xp} XP</strong> 🌟
                  </p>
                )}
                {!feedback.correct && (exercise.content as { explanation?: string }).explanation && (
                  <div data-testid="review-feedback-explanation" className="text-sm text-tinku-ink/85 bg-white/80 rounded-xl p-3 border border-tinku-ink/10">
                    <span className="font-semibold">Mirá: </span>
                    {(exercise.content as { explanation?: string }).explanation}
                  </div>
                )}
                <button
                  type="button"
                  onClick={onNext}
                  disabled={isPending}
                  data-testid="review-next"
                  className="w-full h-12 rounded-2xl bg-tinku-sea text-white font-semibold hover:bg-tinku-sea/90 disabled:opacity-60 exercise-target"
                >
                  {isPending ? 'Cargando…' : (idx < total - 1 ? 'Siguiente →' : '¡Terminar repaso!')}
                </button>
              </div>
            )}
          </section>
        )}

        {idx === 0 && !feedback && (
          <p data-testid="review-intro-hint" className="text-center text-sm text-tinku-ink/60">
            Hola {studentName}, son {total} ejercicios cortitos. ¡Dale con todo!
          </p>
        )}
      </div>

      {celebration && (
        <CelebrationModal {...celebration} onClose={dismissCelebration} />
      )}
    </div>
  );
}
