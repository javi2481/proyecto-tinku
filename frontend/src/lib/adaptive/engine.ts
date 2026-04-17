import type { AnswerOutcome, ExerciseDifficulty } from '@/types/database';

/**
 * Scoring: outcome → factor [0..1] aplicado sobre base_xp.
 */
const OUTCOME_FACTOR: Record<AnswerOutcome, number> = {
  correct_first: 1.0,
  correct_retry: 0.6,
  incorrect: 0,
  skipped: 0,
};

/**
 * Computa XP en función de difficulty/outcome/hints. Mantener alineado con xp_rules.
 * Si querés ajustar sin deploy, editá xp_rules en la DB y este helper solo se usa si
 * la consulta a xp_rules falla.
 */
export function computeXp(
  base_xp: number,
  outcome: AnswerOutcome,
  hints_used: number,
  hint_penalty: number,
): number {
  const factor = OUTCOME_FACTOR[outcome];
  const raw = Math.round(base_xp * factor) - hints_used * hint_penalty;
  return Math.max(0, Math.min(base_xp, raw));
}

/**
 * BKT simplificado Ola 1.
 * p_known_new = clamp(p_known + learn_rate * (outcome_score - p_known), 0, 1)
 * learn_rate fijo 0.15. outcome_score = OUTCOME_FACTOR del outcome.
 */
export function updatePKnown(
  p_known: number,
  outcome: AnswerOutcome,
  hints_used: number,
): { pKnownNew: number; delta: number; isMastered: boolean } {
  const learnRate = 0.15;
  const outcomeScore = OUTCOME_FACTOR[outcome];
  // Pequeña penalidad por hints: reduce outcome efectivo 10% por hint, cap 50%.
  const hintAdjust = Math.min(0.5, hints_used * 0.1);
  const effective = Math.max(0, outcomeScore - hintAdjust);

  const raw = p_known + learnRate * (effective - p_known);
  const pKnownNew = Math.max(0, Math.min(1, Number(raw.toFixed(3))));
  const delta = Number((pKnownNew - p_known).toFixed(3));
  const isMastered = pKnownNew >= 0.85;
  return { pKnownNew, delta, isMastered };
}

/**
 * Selector de dificultad según p_known. Umbrales del fundacional.
 */
export function pickDifficulty(p_known: number): ExerciseDifficulty | 'mastered' {
  if (p_known < 0.4) return 'easy';
  if (p_known < 0.65) return 'medium';
  if (p_known < 0.85) return 'hard';
  return 'mastered';
}
