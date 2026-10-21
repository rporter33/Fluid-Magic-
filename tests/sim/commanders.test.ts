// Commanders and squads: creation, defaults, upkeep, and supply (docs/01-core-rules.md
// section 4, docs/04-battle.md "Scripts").
import { describe, expect, it } from 'vitest';
import { unitDef } from '../../src/content';
import {
  commanderSupply,
  commanderUpkeep,
  createCommander,
  createSquad,
  defaultFormation,
  defaultScript,
  troopSupply,
  unitUpkeep,
} from '../../src/sim/commanders';
import { capitalOf, nationIds, twoNationGame } from './fixtures';

describe('upkeep', () => {
  it('is gold cost / 15 a month, half for sacred units, nothing without a cost', () => {
    expect(unitUpkeep(unitDef('cinderWarrior'))).toBeCloseTo(12 / 15, 12);
    expect(unitUpkeep(unitDef('ashChieftain'))).toBeCloseTo(40 / 15, 12);
    expect(unitUpkeep(unitDef('flamebrand'))).toBeCloseTo((32 / 15) * 0.5, 12);
    expect(unitUpkeep(unitDef('fireSprite'))).toBe(0);
    expect(unitUpkeep(unitDef('garrison'))).toBe(0);
  });

  it('sums a commander and every troop it leads', () => {
    const state = twoNationGame();
    const red = nationIds(state)[0]!;
    const c = createCommander(state, 'ashChieftain', red, capitalOf(state, red).id);
    c.squads.push(createSquad(state, 'cinderWarrior', 10), createSquad(state, 'flamebrand', 4));
    expect(commanderUpkeep(c)).toBeCloseTo((40 + 10 * 12 + 4 * 32 * 0.5) / 15, 12);
  });
});

describe('supply eaten', () => {
  it('is 1 a troop, 3 for size 3 and up, 0 for undead and constructs', () => {
    expect(troopSupply(unitDef('cinderWarrior'))).toBe(1);
    expect(troopSupply(unitDef('salamander'))).toBe(3);
    expect(troopSupply(unitDef('giant'))).toBe(3);
    expect(troopSupply(unitDef('fireSprite'))).toBe(0);
    expect(troopSupply({ ...unitDef('cinderWarrior'), tags: ['undead'] })).toBe(0);
  });

  it('adds 1 for the commander, but nothing for the garrison holder', () => {
    const state = twoNationGame();
    const red = nationIds(state)[0]!;
    const capital = capitalOf(state, red);
    const c = createCommander(state, 'ashChieftain', red, capital.id);
    expect(commanderSupply(c)).toBe(1);
    c.squads.push(createSquad(state, 'cinderWarrior', 10));
    expect(commanderSupply(c)).toBe(11);
    const garrison = state.commanders[capital.garrison!]!;
    expect(commanderSupply(garrison)).toBe(0);
    garrison.squads.push(createSquad(state, 'cinderWarrior', 5));
    expect(commanderSupply(garrison)).toBe(5);
  });
});

describe('defaults', () => {
  it('puts ranged troops in the middle row and the rest in front', () => {
    expect(defaultFormation(unitDef('flameArcher'))).toBe('middle');
    expect(defaultFormation(unitDef('emberSkirmisher'))).toBe('middle');
    expect(defaultFormation(unitDef('cinderWarrior'))).toBe('front');
  });

  it('gives mages five cast-best slots, priests five Bless slots, and everyone else holds', () => {
    const script = (unit: 'emberAdept' | 'pyrePriest' | 'cinderMagus' | 'ashChieftain') => {
      const d = unitDef(unit);
      return defaultScript(d, d.commander?.pips ?? {}, d.commander?.holy ?? 0);
    };
    for (const unit of ['emberAdept', 'cinderMagus'] as const) {
      expect(script(unit)).toEqual(
        Array.from({ length: 5 }, () => ({ kind: 'cast', spellId: null })),
      );
    }
    expect(script('pyrePriest')).toEqual(
      Array.from({ length: 5 }, () => ({ kind: 'cast', spellId: 'bless' })),
    );
    expect(script('ashChieftain')).toEqual(Array.from({ length: 5 }, () => ({ kind: 'hold' })));
    // A commander's own pips decide: an Ash Chieftain given a pip casts.
    expect(defaultScript(unitDef('ashChieftain'), { R: 1 }, 0)[0]).toEqual({
      kind: 'cast',
      spellId: null,
    });
    // Each slot is its own object, so editing one leaves the rest alone.
    const slots = script('pyrePriest');
    expect(slots[0]).not.toBe(slots[1]);
  });
});

describe('createSquad and createCommander', () => {
  it('builds a full-strength squad with a fresh id', () => {
    const state = twoNationGame();
    const before = state.nextId;
    const squad = createSquad(state, 'cinderWarrior', 7);
    expect(squad).toEqual({
      id: `sq${before}`,
      unit: 'cinderWarrior',
      count: 7,
      hp: 77,
      formation: 'front',
      starvedDays: 0,
    });
    expect(state.nextId).toBe(before + 1);
  });

  it('refuses a commander as a troop and a troop as a commander', () => {
    const state = twoNationGame();
    const red = nationIds(state)[0]!;
    expect(() => createSquad(state, 'ashChieftain', 1)).toThrow();
    expect(() => createCommander(state, 'cinderWarrior', red, capitalOf(state, red).id)).toThrow();
  });

  it('registers an idle commander at full HP with its unit pips', () => {
    const state = twoNationGame();
    const red = nationIds(state)[0]!;
    const capital = capitalOf(state, red).id;
    const c = createCommander(state, 'emberAdept', red, capital);
    expect(state.commanders[c.id]).toBe(c);
    expect(c).toMatchObject({
      unit: 'emberAdept',
      owner: red,
      location: capital,
      transit: null,
      cameFrom: null,
      hp: 10,
      squads: [],
      order: { kind: 'idle' },
      pips: { R: 1 },
      holy: 0,
      starvedDays: 0,
    });
  });

  it('rolls the Cinder Magus extra pip about a quarter of the time, from the game rng', () => {
    const state = twoNationGame(5);
    const red = nationIds(state)[0]!;
    const capital = capitalOf(state, red).id;
    let extra = 0;
    const trials = 2000;
    for (let k = 0; k < trials; k++) {
      const pips = createCommander(state, 'cinderMagus', red, capital).pips;
      expect([2, 3]).toContain(pips.R);
      if (pips.R === 3) extra++;
    }
    expect(extra / trials).toBeGreaterThan(0.22);
    expect(extra / trials).toBeLessThan(0.28);
    // The same seed rolls the same pips.
    const a = twoNationGame(9);
    const b = twoNationGame(9);
    const roll = (s: typeof a) => {
      const home = capitalOf(s, red).id;
      return Array.from({ length: 20 }, () => createCommander(s, 'cinderMagus', red, home).pips.R);
    };
    expect(roll(a)).toEqual(roll(b));
  });
});
