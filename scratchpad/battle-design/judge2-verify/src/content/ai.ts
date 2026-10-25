// AI difficulty levels (docs/08-ai.md, "Difficulty").
export type Difficulty = 'easy' | 'normal';

export interface DifficultyDef {
  /** Multiplier on the AI nation's gold income. */
  incomeFactor: number;
  /** Days between AI planning calls. */
  planEveryDays: number;
  /** The War step is skipped before this month. */
  warFromMonth: number;
}

export const DIFFICULTIES: Readonly<Record<Difficulty, DifficultyDef>> = {
  easy: { incomeFactor: 0.8, planEveryDays: 10, warFromMonth: 12 },
  normal: { incomeFactor: 1, planEveryDays: 5, warFromMonth: 0 },
};
