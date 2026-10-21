// The AI's numbers (docs/08-ai.md; the Phase 7 design's Numbers list): every value the AI
// plays by lives in content, and content validation keeps them positive and consistent.
import { describe, expect, it } from 'vitest';
import { validateContent } from '../../src/content';
import { AI, DIFFICULTIES, type AiNumbers } from '../../src/content/ai';

/** Runs `run` with AI's numbers changed by `patch` (shallow, by top-level key), then restores. */
function withAi(patch: Partial<Record<keyof AiNumbers, unknown>>, run: () => void): void {
  const live = AI as unknown as Record<string, unknown>;
  const saved = { ...live };
  Object.assign(live, patch);
  try {
    run();
  } finally {
    Object.assign(live, saved);
  }
}

describe('AI numbers', () => {
  it('hold the docs/08 values and the Phase 7 design starting values', () => {
    expect(AI).toEqual({
      leaderLeadership: 60,
      batch: { large: 20, small: 10 },
      queue: { min: 1, max: 2 },
      provincesPerLeader: 6,
      baseLeaders: 2,
      provincesPerMage: 4,
      minMages: 2,
      provincesPerPriest: 5,
      scouts: 1,
      meleeRangedRatio: 2,
      fieldArmyTroops: 15,
      expansionRatio: 1.5,
      warRatio: 1.2,
      reliefRatio: 1.2,
      stormRatio: 1.3,
      capitalGarrison: 20,
      threatHops: 1,
      warHops: 2,
      independentStrength: 20,
      rangedBonus: 0.1,
      score: { popPer: 1000, spring: 3, wellspring: 10 },
      distancePenalty: 0.05,
      pd: { border: 5, enemy: 10 },
      wellspringPd: 10,
      goldReserve: 150,
      labGold: 500,
      templeGold: 300,
      templePop: 8000,
      taxHighBelowGold: 50,
      taxHighMaxUnrest: 20,
      ritualCostFactor: 2,
      pretenderJoinDay: 90,
      battleMagesPerArmy: 1,
      carriedMana: 2,
      godlessAlarm: 2,
    });
    expect(DIFFICULTIES).toEqual({
      easy: { incomeFactor: 0.8, planEveryDays: 10, warFromMonth: 12 },
      normal: { incomeFactor: 1, planEveryDays: 5, warFromMonth: 0 },
    });
  });

  it('pass content validation', () => {
    expect(validateContent()).toEqual([]);
  });

  it('are caught by validation when not positive, not whole, or out of line', () => {
    const cases: [Partial<Record<keyof AiNumbers, unknown>>, string][] = [
      [{ labGold: 0 }, 'AI labGold must be a positive number'],
      [{ goldReserve: Number.NaN }, 'AI goldReserve must be a positive number'],
      [
        { score: { popPer: 1000, spring: -3, wellspring: 10 } },
        'AI score.spring must be a positive number',
      ],
      [{ capitalGarrison: 20.5 }, 'AI capitalGarrison must be whole'],
      [
        { batch: { large: 10, small: 20 } },
        'AI batches must be small <= large <= the largest recruit order',
      ],
      [
        { batch: { large: 60, small: 10 } },
        'AI batches must be small <= large <= the largest recruit order',
      ],
      [{ queue: { min: 3, max: 2 } }, 'AI queue min must not exceed max'],
      [{ fieldArmyTroops: 61 }, 'AI field armies must fit under one leader'],
      [{ stormRatio: 0.9 }, 'AI stormRatio must be at least 1'],
      [{ ritualCostFactor: 0.5 }, 'AI ritualCostFactor must be at least 1'],
      [{ distancePenalty: 1 }, 'AI rangedBonus and distancePenalty must be below 1'],
      [
        { pd: { border: 12, enemy: 10 } },
        'AI PD levels must be border <= enemy, all within the PD maximum',
      ],
      [{ wellspringPd: 31 }, 'AI PD levels must be border <= enemy, all within the PD maximum'],
      [{ godlessAlarm: 11 }, 'AI godlessAlarm must be a dominion strength'],
      [{ taxHighMaxUnrest: 101 }, 'AI taxHighMaxUnrest above the unrest cap'],
    ];
    for (const [patch, problem] of cases) {
      withAi(patch, () => {
        expect(validateContent(), JSON.stringify(patch)).toEqual([problem]);
      });
    }
    expect(validateContent()).toEqual([]);
  });

  it('catch a broken difficulty level', () => {
    const normal = DIFFICULTIES.normal as { planEveryDays: number; warFromMonth: number };
    normal.planEveryDays = 0;
    normal.warFromMonth = -1;
    try {
      expect(validateContent()).toEqual([
        'difficulty normal bad income or planning interval',
        'difficulty normal bad war month',
      ]);
    } finally {
      normal.planEveryDays = 5;
      normal.warFromMonth = 0;
    }
  });
});
