// The pretender design (docs/05-pretender.md steps 1 to 5 and "Presets"): design prices and
// budgets, and validation. The pretender on the map is in pretender.play.test.ts.
import { describe, expect, it } from 'vitest';
import { nationDef } from '../../src/content';
import { CHASSIS } from '../../src/content/pretenders/chassis';
import { PRESETS } from '../../src/content/pretenders/presets';
import { NEUTRAL_SCALES, type Scales } from '../../src/content/pretenders/scales';
import type { Awakening, PretenderDesign } from '../../src/content/pretenders/types';
import { MAX_PIPS } from '../../src/content/rules';
import type { NationId } from '../../src/sim/ids';
import {
  basePips,
  designBudget,
  designCost,
  pipStepCost,
  scaleStepCost,
  validatePretender,
} from '../../src/sim/pretender';
import { nationIds, pretender, twoNationGame } from './fixtures';

const RED = nationDef('cinderHorde');
const GREEN = nationDef('thornwood');

/** A design: neutral scales, awake, unless overridden. */
function design(overrides: Partial<PretenderDesign>): PretenderDesign {
  return pretender({ awakening: 'awake', ...overrides });
}

function scales(s: Partial<Scales>): Scales {
  return { ...NEUTRAL_SCALES, ...s };
}

/** Titan R4 at base dominion: 120 + 20 + 25 + 30 = 195 for Cinder Horde. */
const TITAN_R4 = design({ chassis: 'titan', pips: { R: 4 }, dominion: 2 });
const MONOLITH = design({ chassis: 'livingMonolith', pips: {}, dominion: 4 });

/** A game where Cinder Horde's pretender has this design. */
function redWith(d: PretenderDesign, seed = 1) {
  const state = twoNationGame(seed, { pretender: d });
  const [red, green] = nationIds(state) as [NationId, NationId];
  return { state, red, green, capital: state.nations[red]!.capital };
}

describe('design costs', () => {
  it('a mono-color pretender reaches 4 pips for 115 points, then 35 and 40', () => {
    const steps = [1, 2, 3, 4, 5, 6].map((l) => pipStepCost(RED, CHASSIS.titan, 'R', l));
    expect(steps).toEqual([40, 20, 25, 30, 35, 40]);
    expect(steps.slice(0, 4).reduce((a, b) => a + b, 0)).toBe(115);
    expect(pipStepCost(RED, CHASSIS.titan, 'R', 7)).toBe(Infinity);
  });

  it('opening a color outside the nation costs the Titan 60, so a second color at 2 costs 80', () => {
    expect(pipStepCost(RED, CHASSIS.titan, 'G', 1)).toBe(60);
    expect(pipStepCost(RED, CHASSIS.titan, 'G', 2)).toBe(20);
    expect(pipStepCost(RED, CHASSIS.titan, 'G', 3)).toBe(25);
    // Green is Thornwood's own color, Red is new to it.
    expect(pipStepCost(GREEN, CHASSIS.titan, 'G', 1)).toBe(40);
    expect(pipStepCost(GREEN, CHASSIS.titan, 'R', 1)).toBe(60);
    const titanR1G2 = design({ chassis: 'titan', pips: { R: 1, G: 2 }, dominion: 2 });
    expect(designCost(RED, titanR1G2)).toBe(120 + 80);
  });

  it('the Oracle pays 10 less for every pip', () => {
    const steps = [1, 2, 3, 4, 5, 6].map((l) => pipStepCost(RED, CHASSIS.oracle, 'R', l));
    expect(steps).toEqual([30, 10, 15, 20, 25, 30]);
    // The Oracle's new-color price is 40, less its discount (D2).
    expect(pipStepCost(RED, CHASSIS.oracle, 'G', 1)).toBe(30);
    expect(designCost(RED, design({ chassis: 'oracle', pips: { R: 6 }, dominion: 1 }))).toBe(
      20 + 130,
    );
  });

  it('base pips are free: their color comes from the nation or the chassis', () => {
    expect(basePips(RED, CHASSIS.titan)).toEqual({ R: 1 });
    expect(basePips(GREEN, CHASSIS.titan)).toEqual({ G: 1 });
    expect(basePips(RED, CHASSIS.greatWyrm)).toEqual({ R: 2 });
    expect(basePips(RED, CHASSIS.wildSpirit)).toEqual({ G: 1 });
    expect(basePips(GREEN, CHASSIS.ashColossus)).toEqual({ R: 1 });
    expect(basePips(RED, CHASSIS.oracle)).toEqual({});
    expect(basePips(RED, CHASSIS.livingMonolith)).toEqual({});

    expect(designCost(RED, TITAN_R4)).toBe(195);
    expect(designCost(GREEN, design({ chassis: 'titan', pips: { G: 4 }, dominion: 2 }))).toBe(195);
    expect(designCost(RED, design({ chassis: 'titan', pips: { R: 1 }, dominion: 2 }))).toBe(120);
    expect(designCost(RED, design({ chassis: 'greatWyrm', pips: { R: 3 }, dominion: 2 }))).toBe(
      220 + 25,
    );
    // A Wild Spirit's free G pip makes Green's second pip a level-2 step; Red is new to
    // Thornwood, at the Wild Spirit's new-color price of 80.
    expect(designCost(GREEN, design({ chassis: 'wildSpirit', pips: { G: 2 }, dominion: 2 }))).toBe(
      80 + 20,
    );
    expect(
      designCost(GREEN, design({ chassis: 'wildSpirit', pips: { G: 1, R: 1 }, dominion: 2 })),
    ).toBe(80 + 80);
    expect(designCost(RED, design({ chassis: 'oracle', pips: {}, dominion: 1 }))).toBe(20);
    expect(designCost(RED, MONOLITH)).toBe(60);
  });

  it('dominion costs 30 per point above the chassis base', () => {
    for (let d = 2; d <= 10; d++) {
      const titan = design({ chassis: 'titan', pips: { R: 1 }, dominion: d });
      expect(designCost(RED, titan)).toBe(120 + 30 * (d - 2));
    }
    expect(designCost(RED, design({ chassis: 'oracle', pips: {}, dominion: 5 }))).toBe(20 + 120);
    expect(designCost(RED, design({ chassis: 'livingMonolith', pips: {}, dominion: 7 }))).toBe(
      60 + 90,
    );
  });

  it('a scale step costs 20 toward a pole of the nation color and 40 otherwise', () => {
    const titan = CHASSIS.titan;
    expect(scaleStepCost(RED, titan, 'order', 'negative')).toBe(20); // Turmoil, R
    expect(scaleStepCost(RED, titan, 'lore', 'negative')).toBe(20); // Fury, R
    expect(scaleStepCost(RED, titan, 'order', 'positive')).toBe(40); // Order, W
    expect(scaleStepCost(RED, titan, 'lore', 'positive')).toBe(40); // Lore, U
    expect(scaleStepCost(RED, titan, 'growth', 'positive')).toBe(40); // Growth, G
    expect(scaleStepCost(GREEN, titan, 'growth', 'positive')).toBe(20);
    expect(scaleStepCost(GREEN, titan, 'wild', 'positive')).toBe(20);
    expect(scaleStepCost(GREEN, titan, 'growth', 'negative')).toBe(40); // Rot, B
    expect(scaleStepCost(GREEN, titan, 'wild', 'negative')).toBe(40); // Artifice, U
    expect(scaleStepCost(GREEN, titan, 'order', 'negative')).toBe(40); // Turmoil, R
  });

  it('every scale step from 0 counts, in both directions', () => {
    const titan = (s: Partial<Scales>) =>
      designCost(RED, design({ chassis: 'titan', pips: { R: 1 }, dominion: 2, scales: scales(s) }));
    expect(titan({})).toBe(120);
    expect(titan({ order: -1 })).toBe(140);
    expect(titan({ order: -2 })).toBe(160);
    expect(titan({ order: -3 })).toBe(180);
    expect(titan({ order: 3 })).toBe(240);
    expect(titan({ order: -3, lore: -3 })).toBe(240);
    expect(titan({ order: 1, lore: -1, sanctity: -2 })).toBe(120 + 40 + 20 + 80);
  });

  it('the budget is 400, plus 150 dormant or 350 imprisoned', () => {
    const budgets = (['awake', 'dormant', 'imprisoned'] as const).map(designBudget);
    expect(budgets).toEqual([400, 550, 750]);
  });

  it('an unknown chassis costs Infinity', () => {
    expect(designCost(RED, design({ chassis: 'dragon' }))).toBe(Infinity);
  });

  it('every preset is priced exactly and fits its budget', () => {
    const priced = PRESETS.map((p) => [p.id, designCost(nationDef(p.nation), p.design)]);
    expect(priced).toEqual([
      ['warlord', 385],
      ['emberOracle', 280],
      ['wildfire', 415],
      ['elderOak', 385],
      ['deepRoot', 395],
      ['wyrmOfTheLoam', 375],
    ]);
    for (const p of PRESETS) {
      expect(validatePretender(nationDef(p.nation), p.design), p.id).toBeNull();
    }
  });
});

describe('validatePretender', () => {
  it('accepts a design inside every limit', () => {
    expect(validatePretender(RED, TITAN_R4)).toBeNull();
    const titanAtCap = design({ chassis: 'titan', pips: { R: MAX_PIPS }, dominion: 2 });
    expect(validatePretender(RED, titanAtCap)).toBeNull();
    const plainOracle = design({ chassis: 'oracle', pips: { R: 0 }, dominion: 1 });
    expect(validatePretender(RED, plainOracle)).toBeNull();
  });

  it('refuses an unknown chassis or awakening', () => {
    expect(validatePretender(RED, design({ chassis: 'dragon' }))).toBe('Unknown chassis dragon');
    const asleep: string = 'asleep';
    expect(validatePretender(RED, { ...TITAN_R4, awakening: asleep as Awakening })).toBe(
      'Unknown awakening',
    );
  });

  it('refuses pips outside 0 to 6, fractional pips, and unknown colors', () => {
    const PIPS = 'Pips must be 0 to 6 per color';
    expect(MAX_PIPS).toBe(6);
    const titan = (pips: PretenderDesign['pips']) => validatePretender(RED, { ...TITAN_R4, pips });
    expect(titan({ R: MAX_PIPS + 1 })).toBe(PIPS);
    expect(titan({ R: 1, G: -1 })).toBe(PIPS);
    expect(titan({ R: 1.5 })).toBe(PIPS);
    expect(titan({ R: 1, ...Object.fromEntries([['X', 1]]) })).toBe(PIPS);
  });

  it('refuses fewer pips than the chassis comes with', () => {
    expect(validatePretender(RED, { ...TITAN_R4, pips: {} })).toBe('Titan comes with 1 R pips');
    expect(validatePretender(RED, { ...TITAN_R4, pips: { G: 1 } })).toBe(
      'Titan comes with 1 R pips',
    );
    expect(validatePretender(GREEN, { ...TITAN_R4, pips: { G: 1 } })).toBeNull();
    expect(validatePretender(RED, { ...TITAN_R4, chassis: 'greatWyrm', pips: { R: 1 } })).toBe(
      'Great Wyrm comes with 2 R pips',
    );
    // The Wild Spirit's pip is Green, its realm's color.
    const spirit = design({ chassis: 'wildSpirit', pips: { R: 1 }, dominion: 2 });
    expect(validatePretender(GREEN, spirit)).toBe('Wild Spirit comes with 1 G pips');
    expect(validatePretender(GREEN, { ...spirit, pips: { R: 1, G: 1 } })).toBeNull();
  });

  it('refuses dominion below the chassis base, above 10, or fractional', () => {
    expect(validatePretender(RED, { ...MONOLITH, dominion: 3 })).toBe('Dominion must be 4 to 10');
    expect(validatePretender(RED, { ...MONOLITH, dominion: 10 })).toBeNull();
    expect(validatePretender(RED, { ...TITAN_R4, dominion: 11 })).toBe('Dominion must be 2 to 10');
    expect(validatePretender(RED, { ...TITAN_R4, dominion: 4.5 })).toBe('Dominion must be 2 to 10');
    const oracle = design({ chassis: 'oracle', pips: {}, dominion: 1 });
    expect(validatePretender(RED, oracle)).toBeNull();
    expect(validatePretender(RED, { ...oracle, dominion: 0 })).toBe('Dominion must be 1 to 10');
  });

  it('refuses scales outside -3 to 3', () => {
    const SCALES = 'Scales run from -3 to 3';
    const titan = (s: Partial<Scales>) =>
      validatePretender(RED, { ...TITAN_R4, scales: scales(s) });
    expect(titan({ order: -3, lore: -3 })).toBeNull();
    expect(titan({ order: 4 })).toBe(SCALES);
    expect(titan({ lore: -4 })).toBe(SCALES);
    expect(titan({ growth: 0.5 })).toBe(SCALES);
  });

  it('refuses a design over budget, naming its cost and budget', () => {
    // Titan R5 at dominion 7 with Fury 1: 120 + (20 + 25 + 30 + 35) + 150 + 20 = 400, the budget.
    const exact = design({
      chassis: 'titan',
      pips: { R: 5 },
      dominion: 7,
      scales: scales({ lore: -1 }),
    });
    expect(designCost(RED, exact)).toBe(400);
    expect(validatePretender(RED, exact)).toBeNull();
    const over = { ...exact, scales: scales({ lore: -2 }) };
    expect(validatePretender(RED, over)).toBe('The design costs 420 of 400 points');
    expect(validatePretender(RED, { ...over, awakening: 'dormant' })).toBeNull();
    expect(validatePretender(RED, { ...over, awakening: 'imprisoned' })).toBeNull();
  });

  it('holds an imprisoned design to 750', () => {
    // Great Wyrm R6, dominion 10, Turmoil 3, Fury 3, Growth 1: 220 + 130 + 240 + 120 + 40 = 750.
    const wyrm = design({
      chassis: 'greatWyrm',
      pips: { R: 6 },
      dominion: 10,
      scales: scales({ order: -3, lore: -3, growth: 1 }),
      awakening: 'imprisoned',
    });
    expect(validatePretender(RED, wyrm)).toBeNull();
    const greedy = { ...wyrm, scales: scales({ order: -3, lore: -3, growth: 2 }) };
    expect(validatePretender(RED, greedy)).toBe('The design costs 790 of 750 points');
  });

  it('makes createGame throw a RangeError for either nation', () => {
    expect(() => redWith(design({ chassis: 'dragon' }))).toThrow(RangeError);
    expect(() => redWith(design({ chassis: 'dragon' }))).toThrow('Unknown chassis dragon');
    const over = design({ chassis: 'titan', pips: { R: 6 }, dominion: 10 });
    expect(() => redWith(over)).toThrow('The design costs 510 of 400 points');
    expect(() => twoNationGame(1, {}, { pretender: { ...TITAN_R4, pips: { R: 4 } } })).toThrow(
      'Titan comes with 1 G pips',
    );
  });
});
