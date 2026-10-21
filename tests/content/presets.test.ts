// The six presets of Phase 6 stay exactly as they were through Phase 6b.1 (the 2026-10-21
// pretender build spec, A.8): byte for byte, in cost, in bless, and in behavior. The behavior
// pins were computed on the Phase 6 code before Phase 6b.1 (presetPins.ts says how).
import { describe, expect, it } from 'vitest';
import { nationDef, type NationDefId } from '../../src/content';
import { NATIONS } from '../../src/content/nations';
import { defaultPreset, PRESETS } from '../../src/content/pretenders/presets';
import { blessOf, defaultBlessings, NO_BLESS } from '../../src/sim/bless';
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

describe('the Phase 6 presets', () => {
  it('are unchanged byte for byte, with no blessings or boons field', () => {
    expect(JSON.stringify(PRESETS.slice(0, 6))).toBe(JSON.stringify(PHASE_6_PRESETS));
    for (const p of PRESETS) {
      expect(Object.keys(p.design), p.id).not.toContain('blessings');
      expect(Object.keys(p.design), p.id).not.toContain('boons');
    }
  });

  it('cost what they cost, and still validate', () => {
    const priced = PRESETS.map((p) => {
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
    const bless = PRESETS.map((p) => [p.id, defaultBlessings(p.design.pips)]);
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
    PRESETS.forEach((p, i) => {
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
    for (const p of PRESETS) expect(setupPin(p.id), p.id).toBe(PINS[p.id]?.setups);
  });

  it('play 360 days of the AI exactly as before, new fields aside', () => {
    for (const p of PRESETS) expect(gamePin(p.id, 360), p.id).toBe(PINS[p.id]?.game);
  }, 120_000);
});
