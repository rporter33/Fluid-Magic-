// The bless (docs/02-magic.md section 8; docs/05-pretender.md Step 6): bless points per color,
// the default picks that keep the fixed bless of Phase 5, the fold of every effect, incarnate
// blessings, the menu's validation, and the bounds any selection reaches.
import { describe, expect, it } from 'vitest';
import { nationDef } from '../../src/content';
import { COLORS, type Color } from '../../src/content/colors';
import { BLESSING_LIST, BLESSINGS } from '../../src/content/pretenders/blessings';
import { NEUTRAL_SCALES } from '../../src/content/pretenders/scales';
import type { PretenderDesign } from '../../src/content/pretenders/types';
import { BLESS } from '../../src/content/rules';
import {
  blessingProblem,
  blessOf,
  blessPoints,
  chosenBlessings,
  defaultBlessings,
  nationBless,
  NO_BLESS,
  type Bless,
} from '../../src/sim/bless';
import type { NationId } from '../../src/sim/ids';
import { settlePretender, validatePretender } from '../../src/sim/pretender';
import type { Pips } from '../../src/sim/types';
import { nationIds, pretender, twoNationGame } from './fixtures';

/** A Titan of these pips and blessings, neutral scales, awake. */
function god(pips: Pips, blessings?: readonly string[]): PretenderDesign {
  const d = pretender({ chassis: 'titan', pips, dominion: 2, awakening: 'awake' });
  return blessings === undefined ? d : { ...d, blessings };
}

/** The fixed bless of Phase 5, written out from its rule: each color at 4, doubled at 6. */
function fixedBless(pips: Pips): Bless {
  const bless: Bless = { ...NO_BLESS };
  for (const color of COLORS) {
    const n = pips[color] ?? 0;
    if (n < BLESS.minPips) continue;
    const factor = n >= BLESS.doubleAt ? 2 : 1;
    for (const [key, value] of Object.entries(BLESS[color])) {
      bless[key as 'att'] += value * factor;
    }
  }
  return bless;
}

/** Every pip vector with 0 to 6 pips in each of the five colors: 7^5 = 16,807. */
function* allPipVectors(): Generator<Pips> {
  for (let i = 0; i < 7 ** COLORS.length; i++) {
    const pips: Pips = {};
    let rest = i;
    for (const color of COLORS) {
      const n = rest % 7;
      rest = Math.floor(rest / 7);
      if (n > 0) pips[color] = n;
    }
    yield pips;
  }
}

describe('bless points', () => {
  it('are pips minus one per color, and a lone pip gives none', () => {
    expect(blessPoints({ R: 4 })).toEqual({ R: 3 });
    expect(blessPoints({ R: 4, G: 2 })).toEqual({ R: 3, G: 1 });
    expect(blessPoints({ R: 1, W: 6 })).toEqual({ W: 5, R: 0 });
    expect(blessPoints({})).toEqual({});
    expect(blessPoints({ U: 0 })).toEqual({});
  });
});

describe('the default picks', () => {
  it('are each color’s standard blessing at 4 or 5 pips and its greater one at 6', () => {
    expect(defaultBlessings({ R: 3, G: 3 })).toEqual([]);
    expect(defaultBlessings({ R: 4 })).toEqual(['emberWrath']);
    expect(defaultBlessings({ R: 5 })).toEqual(['emberWrath']);
    expect(defaultBlessings({ R: 6 })).toEqual(['greaterEmberWrath']);
    expect(defaultBlessings({ W: 4, U: 6, B: 5, R: 6, G: 4 })).toEqual([
      'steadfast',
      'greaterClearSight',
      'bloodThirst',
      'greaterEmberWrath',
      'evergreen',
    ]);
    expect(chosenBlessings(god({ R: 4 }))).toEqual(['emberWrath']);
    expect(chosenBlessings(god({ R: 4 }, []))).toEqual([]);
  });

  it('give exactly the fixed bless for every pip vector, and always fit their points', () => {
    let cases = 0;
    for (const pips of allPipVectors()) {
      const design = god(pips);
      const fixed = fixedBless(pips);
      // Never incarnate: the same whether the god is on the map or not.
      expect(blessOf(design, true)).toEqual(fixed);
      expect(blessOf(design, false)).toEqual(fixed);
      const picks = defaultBlessings(pips);
      expect(blessingProblem({ ...design, blessings: picks })).toBeNull();
      expect(blessOf({ ...design, blessings: picks }, true)).toEqual(fixed);
      cases++;
    }
    expect(cases).toBe(16807);
  });

  it('match the Phase 5 numbers color by color', () => {
    expect(blessOf(god({ R: 3, G: 3 }), true)).toEqual(NO_BLESS);
    expect(blessOf(god({ W: 4 }), true)).toMatchObject({ mor: 2, prot: 1 });
    expect(blessOf(god({ U: 4 }), true)).toMatchObject({ def: 2, prec: 2 });
    expect(blessOf(god({ B: 4 }), true)).toMatchObject({ lifeDrain: 2, att: 1 });
    expect(blessOf(god({ R: 4 }), true)).toMatchObject({ att: 2, str: 2 });
    expect(blessOf(god({ G: 4 }), true)).toMatchObject({ regeneration: 0.1, prot: 1 });
    expect(blessOf(god({ R: 6 }), true)).toMatchObject({ att: 4, str: 4 });
    expect(blessOf(god({ G: 6 }), true)).toMatchObject({ regeneration: 0.2, prot: 2 });
    expect(blessOf(god({ R: 4, G: 5 }), true)).toEqual({
      ...NO_BLESS,
      att: 2,
      str: 2,
      regeneration: 0.1,
      prot: 1,
    });
  });
});

describe('blessOf with chosen blessings', () => {
  it('folds every kind of effect', () => {
    expect(blessOf(god({ R: 4 }, ['cinderSkin']), true)).toEqual({
      ...NO_BLESS,
      shields: [{ element: 'fire', amount: 3 }],
    });
    expect(blessOf(god({ R: 5 }, ['flamingWeapons']), true)).toEqual({
      ...NO_BLESS,
      meleeDmg: 3,
      meleeElement: 'fire',
      meleeArmorPiercing: true,
    });
    expect(blessOf(god({ R: 4 }, ['blazingCharge']), true)).toEqual({
      ...NO_BLESS,
      firstRoundBonus: 5,
      mor: 1,
    });
    expect(blessOf(god({ R: 5 }, ['furyUnbound']), true)).toEqual({
      ...NO_BLESS,
      berserk: true,
      att: 1,
    });
    expect(blessOf(god({ R: 6 }, ['livingPyre']), true)).toEqual({
      ...NO_BLESS,
      shields: [{ element: 'fire', amount: 5 }],
      att: 2,
    });
    expect(blessOf(god({ G: 5 }, ['vigor', 'strengthOfEarth']), true)).toEqual({
      ...NO_BLESS,
      regeneration: 0.05,
      str: 2,
    });
  });

  it('adds blessings of several colors, whatever the order of the list', () => {
    const a = blessOf(god({ R: 4, G: 4 }, ['keenEdge', 'emberMight', 'deepRoots']), true);
    const b = blessOf(god({ R: 4, G: 4 }, ['deepRoots', 'emberMight', 'keenEdge']), true);
    expect(a).toEqual({ ...NO_BLESS, att: 1, str: 2, mor: 3, prot: 1 });
    expect(b).toEqual(a);
  });

  it('drops incarnate blessings while the god is off the map, and keeps the rest', () => {
    const design = god({ R: 6, G: 6 }, ['ironbark', 'greaterEmberWrath']);
    expect(blessOf(design, true)).toEqual({ ...NO_BLESS, att: 4, str: 6, prot: 5 });
    expect(blessOf(design, false)).toEqual({ ...NO_BLESS, att: 4, str: 4 });
  });

  it('flags the incarnate effects of docs/05 and no default pick', () => {
    expect(BLESSING_LIST.filter((bl) => bl.incarnate).map((bl) => bl.id)).toEqual([
      'furyUnbound',
      'flamingWeapons',
      'livingPyre',
      'wildVigor',
      'ironbark',
    ]);
  });
});

describe('a nation’s bless in play', () => {
  /** Thornwood's god: a dormant Titan G6 with the incarnate Ironbark. */
  function game() {
    const design = pretender({
      chassis: 'titan',
      pips: { G: 6 },
      dominion: 2,
      awakening: 'dormant',
      blessings: ['ironbark'],
    });
    const state = twoNationGame(1, {}, { pretender: design });
    const green = nationIds(state)[1]!;
    return { state, green };
  }

  it('lacks an incarnate blessing before the god arrives and has it once it stands', () => {
    const { state, green } = game();
    expect(state.nations[green]!.pretenderId).toBeNull();
    expect(nationBless(state, green)).toEqual(NO_BLESS);
    state.day = 330;
    settlePretender(state, green);
    expect(state.nations[green]!.pretenderId).not.toBeNull();
    expect(nationBless(state, green)).toEqual({ ...NO_BLESS, prot: 5, str: 2 });
  });

  it('loses it while the nation is Godless and the god recalled, and after the god dies', () => {
    const { state, green } = game();
    state.day = 330;
    settlePretender(state, green);
    const nation = state.nations[green]!;
    nation.godless = true;
    settlePretender(state, green);
    expect(nation.pretenderId).toBeNull();
    expect(nationBless(state, green)).toEqual(NO_BLESS);
    nation.godless = false;
    settlePretender(state, green);
    expect(nationBless(state, green)).toMatchObject({ prot: 5 });
    nation.pretenderId = null;
    nation.pretenderDead = true;
    settlePretender(state, green);
    expect(nationBless(state, green)).toEqual(NO_BLESS);
  });

  it('follows the design, so a changed design changes the bless', () => {
    const state = twoNationGame(1, {
      pretender: pretender({ chassis: 'titan', pips: { R: 4 }, dominion: 2, awakening: 'awake' }),
    });
    const red = nationIds(state)[0] as NationId;
    expect(nationBless(state, red)).toMatchObject({ att: 2, str: 2 });
    state.nations[red]!.pretender.pips = { R: 6 };
    expect(nationBless(state, red)).toMatchObject({ att: 4, str: 4 });
  });
});

describe('blessingProblem', () => {
  it('accepts no choice, an empty choice, and the default picks', () => {
    expect(blessingProblem(god({ R: 4 }))).toBeNull();
    expect(blessingProblem(god({ R: 4 }, []))).toBeNull();
    expect(blessingProblem(god({ R: 4 }, ['emberWrath']))).toBeNull();
  });

  it('refuses each broken rule with its own reason', () => {
    const problem = (pips: Pips, ids: string[], scales = {}) =>
      blessingProblem({ ...god(pips, ids), scales: { ...NEUTRAL_SCALES, ...scales } });
    expect(problem({ R: 4 }, ['ember'])).toBe('Unknown blessing ember');
    expect(problem({ R: 4 }, ['toString'])).toBe('Unknown blessing toString');
    expect(problem({ R: 6 }, ['emberWrath', 'emberWrath'])).toBe('Ember Wrath is chosen twice');
    expect(problem({ R: 4 }, ['flamingWeapons'])).toBe('Flaming Weapons needs R5');
    expect(problem({ G: 6 }, ['fervor'])).toBe('Fervor needs R2');
    expect(problem({ R: 5 }, ['furyUnbound'])).toBe('Fury Unbound needs Fury 1');
    expect(problem({ R: 5 }, ['furyUnbound'], { lore: 1 })).toBe('Fury Unbound needs Fury 1');
    expect(problem({ R: 5 }, ['furyUnbound'], { lore: -1 })).toBeNull();
    expect(problem({ G: 5 }, ['wildVigor'])).toBe('Wild Vigor needs Growth 1');
    expect(problem({ G: 5 }, ['wildVigor'], { growth: 2 })).toBeNull();
    expect(problem({ R: 6 }, ['cinderSkin', 'livingPyre'])).toBe(
      'Cinder Skin and Living Pyre exclude each other',
    );
    expect(problem({ G: 6 }, ['vigor', 'evergreen'])).toBe(
      'Vigor and Evergreen exclude each other',
    );
    expect(problem({ R: 4 }, ['fervor', 'keenEdge', 'emberMight'])).toBe(
      'Red blessings cost 4 of 3 bless points',
    );
    expect(problem({ R: 4, G: 2 }, ['emberWrath', 'thickSkin'])).toBeNull();
    expect(problem({ R: 4, G: 2 }, ['emberWrath', 'thickSkin', 'vigor'])).toBe(
      'Green blessings cost 2 of 1 bless points',
    );
  });

  it('keeps each color’s points for its own blessings', () => {
    // White's 5 points cannot pay for Red: R2 gives Red one point only.
    expect(blessingProblem(god({ W: 6, R: 2 }, ['keenEdge']))).toBeNull();
    expect(blessingProblem(god({ W: 6, R: 2 }, ['keenEdge', 'fervor']))).toBe(
      'Red blessings cost 2 of 1 bless points',
    );
  });

  it('lets a god exactly at a blessing’s requirement afford it, for every blessing', () => {
    for (const bl of BLESSING_LIST) {
      const scales = { ...NEUTRAL_SCALES };
      const need = bl.requiresScale;
      if (need) scales[need.axis] = need.toward === 'positive' ? need.steps : -need.steps;
      const design = { ...god({ [bl.color]: bl.requires }, [bl.id]), scales };
      expect(blessingProblem(design), bl.id).toBeNull();
      const below = { ...god({ [bl.color]: bl.requires - 1 }, [bl.id]), scales };
      expect(blessingProblem(below), bl.id).toBe(
        `${bl.name} needs ${bl.color}${String(bl.requires)}`,
      );
    }
  });

  it('is part of validatePretender, after the pips and before the budget', () => {
    const red = nationDef('cinderHorde');
    expect(validatePretender(red, god({ R: 4 }, ['flamingWeapons']))).toBe(
      'Flaming Weapons needs R5',
    );
    expect(validatePretender(red, god({ R: 4 }, ['cinderSkin']))).toBeNull();
    expect(validatePretender(red, god({ R: 7 }, ['ember']))).toBe('Pips must be 0 to 6 per color');
    // Titan R4 at dominion 10 costs 435 of 400: the blessing is still reported first.
    const over = { ...god({ R: 4 }, ['flamingWeapons']), dominion: 10 };
    expect(validatePretender(red, over)).toBe('Flaming Weapons needs R5');
    expect(validatePretender(red, { ...over, blessings: [] })).toBe(
      'The design costs 435 of 400 points',
    );
  });
});

/** The strongest value each stat reaches over every valid selection, per pip set. */
function bounds(pips: Pips): Record<string, number> {
  const scales = { ...NEUTRAL_SCALES, lore: -3, growth: 3 };
  const stats = (b: Bless): Record<string, number> => ({
    att: b.att,
    str: b.str,
    def: b.def,
    prot: b.prot,
    mor: b.mor,
    prec: b.prec,
    regeneration: b.regeneration,
    fireShield: b.shields.find((s) => s.element === 'fire')?.amount ?? 0,
    meleeDmg: b.meleeDmg,
    firstRound: b.firstRoundBonus,
  });
  const best = stats(NO_BLESS);
  // Colors are independent, so each stat's bound is the sum of its per-color bounds.
  for (const color of Object.keys(pips) as Color[]) {
    const menu = BLESSING_LIST.filter((bl) => bl.color === color);
    const top = stats(NO_BLESS);
    for (let mask = 0; mask < 1 << menu.length; mask++) {
      const ids = menu.filter((_, i) => (mask >> i) & 1).map((bl) => bl.id);
      const design = { ...god({ [color]: pips[color] }, ids), scales };
      if (blessingProblem(design) !== null) continue;
      for (const [key, value] of Object.entries(stats(blessOf(design, true)))) {
        top[key] = Math.max(top[key] ?? 0, value);
      }
    }
    for (const [key, value] of Object.entries(top)) best[key] = (best[key] ?? 0) + value;
  }
  return best;
}

describe('blessing bounds', () => {
  it('match the design table (the nature shield column arrives with Thornhide in 6b.2)', () => {
    const row = (pips: Pips) => {
      const b = bounds(pips);
      return [b.att, b.str, b.prot, b.mor, b.regeneration, b.fireShield, b.meleeDmg, b.firstRound];
    };
    expect(row({ R: 4 })).toEqual([2, 2, 0, 1, 0, 3, 0, 5]);
    expect(row({ R: 6 })).toEqual([4, 4, 0, 2, 0, 5, 3, 5]);
    expect(row({ G: 4 })).toEqual([0, 2, 3, 3, 0.1, 0, 0, 0]);
    expect(row({ G: 6 })).toEqual([0, 2, 5, 3, 0.2, 0, 0, 0]);
    expect(row({ R: 6, G: 6 })).toEqual([4, 6, 5, 5, 0.2, 5, 3, 5]);
    expect(row({ W: 6, U: 6, B: 6, R: 6, G: 6 })).toEqual([6, 6, 7, 10, 0.2, 5, 3, 5]);
  });

  it('reach def and prec through Blue only, and add a minor to a standard at 5 pips', () => {
    const row = (pips: Pips) => {
      const b = bounds(pips);
      return [b.att, b.str, b.def, b.prot, b.mor, b.prec, b.regeneration, b.fireShield];
    };
    // R and G give no def or prec; the greater Clear Sight gives 4 of each at U6.
    expect(row({ R: 6, G: 6 })).toEqual([4, 6, 0, 5, 5, 0, 0.2, 5]);
    expect(row({ W: 6, U: 6, B: 6, R: 6, G: 6 })).toEqual([6, 6, 4, 7, 10, 4, 0.2, 5]);
    // At 5 pips (4 points) each color buys its standard and one minor: Steadfast with Resolve
    // or Warding, Clear Sight with Keen Eye or Wariness, Blood Thirst with Cruelty or Grim
    // Resolve.
    expect(row({ W: 5 })).toEqual([0, 0, 0, 2, 3, 0, 0, 0]);
    expect(row({ U: 5 })).toEqual([0, 0, 3, 0, 0, 3, 0, 0]);
    expect(row({ B: 5 })).toEqual([2, 0, 0, 0, 1, 0, 0, 0]);
  });

  it('cap Green at one regeneration blessing: 20%, never Vigor, Evergreen and Wild Vigor at once', () => {
    expect(BLESSINGS.vigor.group).toBe(BLESSINGS.wildVigor.group);
    expect(BLESSINGS.evergreen.group).toBe(BLESSINGS.wildVigor.group);
    expect(bounds({ G: 6 }).regeneration).toBe(0.2);
  });
});
