// The six presets of Phase 6 stay exactly as they were through Phase 6b (the 2026-10-21
// pretender build spec, A.8): byte for byte, in cost, in bless, and in behavior. The behavior
// pins were computed on the Phase 6 code before Phase 6b.1 (presetPins.ts says how). The six
// presets Phase 6b.3 added follow them: each validates, costs what A.8 says, picks its blessing,
// and plays a year deterministically, on the pins' map without wilds and on one with them.
import { describe, expect, it } from 'vitest';
import { runAi } from '../../src/ai/ai';
import { playedSetup, RUNNER_NATIONS, runMatch } from '../../src/ai/match';
import { nationDef, type NationDefId } from '../../src/content';
import { NATIONS } from '../../src/content/nations';
import { defaultPreset, PRESETS } from '../../src/content/pretenders/presets';
import { blessOf, chosenBlessings, defaultBlessings, NO_BLESS } from '../../src/sim/bless';
import { designBudget, designCost, validatePretender } from '../../src/sim/pretender';
import { gamePin, setupPin } from './presetPins';

/** Today's six designs, as Phase 6 shipped them. */
const PHASE_6_PRESETS = [
  {
    id: 'warlord',
    name: 'Warlord',
    nation: 'cinderHorde',
    design: {
      chassis: 'titan',
      pips: { R: 4 },
      dominion: 5,
      scales: { order: -2, lore: -3, growth: 0, wild: 0, sanctity: 0 },
      awakening: 'awake',
    },
  },
  {
    id: 'emberOracle',
    name: 'Ember Oracle',
    nation: 'cinderHorde',
    design: {
      chassis: 'oracle',
      pips: { R: 6 },
      dominion: 4,
      scales: { order: 0, lore: -2, growth: 0, wild: 0, sanctity: 0 },
      awakening: 'dormant',
    },
  },
  {
    id: 'wildfire',
    name: 'Wildfire',
    nation: 'cinderHorde',
    design: {
      chassis: 'ashColossus',
      pips: { R: 3 },
      dominion: 6,
      scales: { order: -3, lore: -3, growth: 0, wild: 0, sanctity: 0 },
      awakening: 'imprisoned',
    },
  },
  {
    id: 'elderOak',
    name: 'Elder Oak',
    nation: 'thornwood',
    design: {
      chassis: 'titan',
      pips: { G: 4 },
      dominion: 5,
      scales: { order: 0, lore: 0, growth: 3, wild: 2, sanctity: 0 },
      awakening: 'awake',
    },
  },
  {
    id: 'deepRoot',
    name: 'Deep Root',
    nation: 'thornwood',
    design: {
      chassis: 'livingMonolith',
      pips: { G: 3 },
      dominion: 7,
      scales: { order: 0, lore: 0, growth: 3, wild: 3, sanctity: 1 },
      awakening: 'awake',
    },
  },
  {
    id: 'wyrmOfTheLoam',
    name: 'Wyrm of the Loam',
    nation: 'thornwood',
    design: {
      chassis: 'greatWyrm',
      pips: { G: 4 },
      dominion: 4,
      scales: { order: 0, lore: 0, growth: 2, wild: 0, sanctity: 0 },
      awakening: 'dormant',
    },
  },
] as const;

/**
 * Pins computed before Phase 6b.1 changed anything: the setups on commit 09fcaae, the games with
 * the Phase 7 AI on commit 7a524b8 (the dummy AI they first used is gone).
 */
const PINS: Record<string, { setups: string; game: string }> = {
  warlord: { setups: '1f90d944e54455', game: '0e1f924718e116' },
  emberOracle: { setups: '1265855d4c0d45', game: '1857f1af6d2cb6' },
  wildfire: { setups: '19a0878c040126', game: '0191305ea2cddd' },
  elderOak: { setups: '1b837cc9371140', game: '0e1f924718e116' },
  deepRoot: { setups: '155c5c04b42ccc', game: '12c4a327595f8f' },
  wyrmOfTheLoam: { setups: '179f526170fca4', game: '1d94c39c993dd8' },
};

/** The six presets of Phase 6, which come first in the list. */
const OLD = PRESETS.slice(0, PHASE_6_PRESETS.length);

describe('the Phase 6 presets', () => {
  it('are unchanged byte for byte, with no blessings or boons field', () => {
    expect(JSON.stringify(OLD)).toBe(JSON.stringify(PHASE_6_PRESETS));
    for (const p of OLD) {
      expect(Object.keys(p.design), p.id).not.toContain('blessings');
      expect(Object.keys(p.design), p.id).not.toContain('boons');
    }
  });

  it('cost what they cost, and still validate', () => {
    const priced = OLD.map((p) => {
      const def = nationDef(p.nation);
      expect(validatePretender(def, p.design), p.id).toBeNull();
      return [p.id, designCost(def, p.design), designBudget(p.design.awakening)];
    });
    expect(priced).toEqual([
      ['warlord', 385, 400],
      ['emberOracle', 280, 550],
      ['wildfire', 415, 750],
      ['elderOak', 385, 400],
      ['deepRoot', 395, 400],
      ['wyrmOfTheLoam', 375, 550],
    ]);
  });

  it('keep the fixed bless: the default picks, never incarnate', () => {
    const bless = OLD.map((p) => [p.id, defaultBlessings(p.design.pips)]);
    expect(bless).toEqual([
      ['warlord', ['emberWrath']],
      ['emberOracle', ['greaterEmberWrath']],
      ['wildfire', []],
      ['elderOak', ['evergreen']],
      ['deepRoot', []],
      ['wyrmOfTheLoam', ['evergreen']],
    ]);
    const evergreen = { ...NO_BLESS, regeneration: 0.1, prot: 1 };
    const expected = [
      { ...NO_BLESS, att: 2, str: 2 },
      { ...NO_BLESS, att: 4, str: 4 },
      NO_BLESS,
      evergreen,
      NO_BLESS,
      evergreen,
    ];
    OLD.forEach((p, i) => {
      expect(blessOf(p.design, true), p.id).toEqual(expected[i]);
      expect(blessOf(p.design, false), p.id).toEqual(expected[i]);
    });
  });

  it('keep each nation’s first preset as its default, for the AI and the runner', () => {
    expect(defaultPreset('cinderHorde').id).toBe('warlord');
    expect(defaultPreset('thornwood').id).toBe('elderOak');
    for (const key of Object.keys(NATIONS) as NationDefId[]) {
      expect(defaultPreset(key)).toBe(PRESETS.find((p) => p.nation === key));
    }
  });

  it('give every battle setup the bless reaches exactly as before', () => {
    expect(Object.keys(PINS)).toEqual(OLD.map((p) => p.id));
    for (const p of OLD) expect(setupPin(p.id), p.id).toBe(PINS[p.id]?.setups);
  });

  it('play 360 days of the AI exactly as before, new fields aside', () => {
    for (const p of OLD) expect(gamePin(p.id, 360), p.id).toBe(PINS[p.id]?.game);
  }, 120_000);
});

/** The six presets of Phase 6b.3, after the old six. */
const NEW = PRESETS.slice(PHASE_6_PRESETS.length);

describe('the Phase 6b.3 presets (build spec A.8)', () => {
  it('follow the old six, three per nation, each on a new chassis of its realm', () => {
    expect(NEW.map((p) => [p.id, p.name, p.nation, p.design.chassis])).toEqual([
      ['undyingFlame', 'Undying Flame', 'cinderHorde', 'ashPhoenix'],
      ['pyreHost', 'Pyre Host', 'cinderHorde', 'pyreLord'],
      ['dreadIdol', 'Dread Idol', 'cinderHorde', 'cinderIdol'],
      ['heartwood', 'Heartwood', 'thornwood', 'worldTree'],
      ['huntLord', 'Hunt Lord', 'thornwood', 'hornedHunter'],
      ['motherOfThePack', 'Mother of the Pack', 'thornwood', 'motherOfBeasts'],
    ]);
  });

  it('carry the A.8 designs: pips, dominion, scales, awakening, blessings, no boons', () => {
    const N = { order: 0, lore: 0, growth: 0, wild: 0, sanctity: 0 };
    expect(NEW.map((p) => p.design)).toEqual([
      {
        chassis: 'ashPhoenix',
        pips: { R: 4 },
        dominion: 5,
        scales: { ...N, growth: 2, lore: -2, order: -1 },
        awakening: 'awake',
        blessings: ['emberWrath'],
      },
      {
        chassis: 'pyreLord',
        pips: { R: 4 },
        dominion: 5,
        scales: { ...N, lore: -3, order: -2 },
        awakening: 'awake',
        blessings: ['emberWrath'],
      },
      {
        chassis: 'cinderIdol',
        pips: { R: 4 },
        dominion: 9,
        scales: { ...N, sanctity: -3, order: -1 },
        awakening: 'awake',
        blessings: ['cinderSkin'],
      },
      {
        chassis: 'worldTree',
        pips: { G: 4 },
        dominion: 7,
        scales: { ...N, growth: 3, wild: 1, sanctity: 1 },
        awakening: 'awake',
        blessings: ['deepRoots'],
      },
      {
        chassis: 'hornedHunter',
        pips: { G: 4 },
        dominion: 4,
        scales: { ...N, lore: -2, wild: 2, growth: 3 },
        awakening: 'awake',
        blessings: ['oakhide'],
      },
      {
        chassis: 'motherOfBeasts',
        pips: { G: 4 },
        dominion: 5,
        scales: { ...N, growth: 3, wild: 2 },
        awakening: 'awake',
        blessings: ['evergreen'],
      },
    ]);
  });

  it('validate and fit their budgets at the A.8 costs', () => {
    const priced = NEW.map((p) => {
      const def = nationDef(p.nation);
      expect(validatePretender(def, p.design), p.id).toBeNull();
      return [p.id, designCost(def, p.design), designBudget(p.design.awakening)];
    });
    expect(priced).toEqual([
      ['undyingFlame', 385, 400],
      ['pyreHost', 385, 400],
      ['dreadIdol', 395, 400],
      ['heartwood', 395, 400],
      ['huntLord', 395, 400],
      ['motherOfThePack', 395, 400],
    ]);
  });

  it('spend their 3 bless points on the chosen blessing, folded in as A.6 says', () => {
    expect(NEW.map((p) => chosenBlessings(p.design))).toEqual([
      ['emberWrath'],
      ['emberWrath'],
      ['cinderSkin'],
      ['deepRoots'],
      ['oakhide'],
      ['evergreen'],
    ]);
    const bless = NEW.map((p) => blessOf(p.design, true));
    expect(bless[0]).toEqual({ ...NO_BLESS, att: 2, str: 2 });
    expect(bless[2]).toEqual({ ...NO_BLESS, shields: [{ element: 'fire', amount: 3 }] });
    expect(bless[3]).toEqual({ ...NO_BLESS, mor: 3, prot: 1 });
    expect(bless[4]).toEqual({ ...NO_BLESS, prot: 3 });
    expect(bless[5]).toEqual({ ...NO_BLESS, regeneration: 0.1, prot: 1 });
  });

  it('play 365 days of the AI deterministically, each against the opposing default', () => {
    // gamePin plays the pins' setup, on a map without wilds (presetPins.ts, since the six pins
    // above were computed before Phase 1b), as this check did when Phase 6b.3 wrote it; the next
    // test plays the same games on maps with wilds.
    for (const p of NEW) expect(gamePin(p.id, 365), p.id).toBe(gamePin(p.id, 365));
  }, 240_000);

  it('play the same 365 days deterministically on maps with wilds, as New Game makes them', () => {
    // gamePin's setup (seed 11, Cinder Horde first, both Normal AI) with the switch on.
    for (const p of NEW) {
      const play = () => runMatch(playedSetup(11, RUNNER_NATIONS, [p], true), runAi, 365);
      const [a, b] = [play(), play()];
      expect(a.state.map.wilds.length, p.id).toBeGreaterThan(0);
      expect(a.finalHash, p.id).toBe(b.finalHash);
      expect(a.log, p.id).toEqual(b.log);
    }
  }, 240_000);
});
