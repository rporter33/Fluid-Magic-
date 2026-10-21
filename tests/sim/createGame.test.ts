// GameSetup -> GameState: nations, capitals, garrisons, starting armies.
import { describe, expect, it } from 'vitest';
import { nationDef, unitDef } from '../../src/content';
import { NATION_BANNERS } from '../../src/content/colors';
import { CHASSIS, type ChassisDef } from '../../src/content/pretenders/chassis';
import { NEUTRAL_SCALES } from '../../src/content/pretenders/scales';
import { ECONOMY } from '../../src/content/rules';
import { createGame } from '../../src/sim/createGame';
import type { GameState } from '../../src/sim/types';
import { patched } from '../content/patched';
import { commandersIn, nation, nationIds, pretender, twoNationGame } from './fixtures';

describe('createGame', () => {
  const state = twoNationGame(7);
  const [red, green] = nationIds(state);

  it('creates nations in setup order with their capitals', () => {
    expect(nationIds(state)).toEqual(['n0', 'n1']);
    const r = state.nations[red!]!;
    const g = state.nations[green!]!;
    expect([r.def, r.name, r.colors, r.capital]).toEqual([
      'cinderHorde',
      'Cinder Horde',
      ['R'],
      state.map.capitals[0],
    ]);
    expect([g.def, g.name, g.colors, g.capital]).toEqual([
      'thornwood',
      'Thornwood',
      ['G'],
      state.map.capitals[1],
    ]);
    expect([r.banner, g.banner]).toEqual([NATION_BANNERS.R[0], NATION_BANNERS.G[0]]);
    expect(r.ai).toBeNull();
    expect(g.ai).toEqual({ difficulty: 'normal', memory: { target: null, lastPlanDay: -1 } });
  });

  it('gives each capital its buildings, garrison, owner, and dominion', () => {
    for (const id of [red!, green!]) {
      const n = state.nations[id]!;
      const capital = state.provinces[n.capital]!;
      expect(capital.owner).toBe(id);
      expect(capital.buildings).toEqual(['fort', 'temple', 'lab']);
      expect(capital.dominion).toEqual({ nation: id, strength: n.pretender.dominion });
      const garrison = state.commanders[capital.garrison!]!;
      expect(garrison.unit).toBe('garrison');
      expect(garrison.owner).toBe(id);
      expect(garrison.location).toBe(capital.id);
    }
  });

  it('leaves every other province independent and undominated', () => {
    const others = Object.values(state.provinces).filter((p) => !state.map.capitals.includes(p.id));
    for (const p of others) {
      expect(p.owner).toBeNull();
      expect(p.dominion).toEqual({ nation: null, strength: 0 });
      expect(p.buildings).toEqual([]);
      expect(p.pop).toBe(state.map.provinces[p.id]!.startPop);
    }
  });

  it('stands each starting army in its capital', () => {
    for (const id of [red!, green!]) {
      const n = state.nations[id]!;
      const def = nationDef(n.def);
      const army = commandersIn(state, n.capital).filter((c) => c.unit !== 'garrison');
      expect(army.map((c) => c.unit)).toEqual(def.startingArmy.map((s) => s.commander));
      army.forEach((c, i) => {
        const squads = def.startingArmy[i]!.squads;
        expect(c.squads.map((s) => [s.unit, s.count])).toEqual(
          squads.map((s) => [s.unit, s.count]),
        );
        for (const s of c.squads) expect(s.hp).toBe(s.count * unitDef(s.unit).hp);
        expect(c.hp).toBe(unitDef(c.unit).hp);
        expect(c.script).toHaveLength(5);
        expect(c.cameFrom).toBeNull();
      });
    }
  });

  it('puts ranged squads in the middle row and melee in front', () => {
    const chieftain = commandersIn(state, state.nations[red!]!.capital).find(
      (c) => c.unit === 'ashChieftain',
    )!;
    expect(chieftain.squads.map((s) => [s.unit, s.formation])).toEqual([
      ['cinderWarrior', 'front'],
      ['flameArcher', 'middle'],
    ]);
  });

  it('gives mages a cast-best script, priests Bless, and others a hold script', () => {
    const army = commandersIn(state, state.nations[red!]!.capital);
    const script = (unit: string) => army.find((c) => c.unit === unit)!.script;
    expect(script('emberAdept')[0]).toEqual({ kind: 'cast', spellId: null });
    expect(script('pyrePriest')[0]).toEqual({ kind: 'cast', spellId: 'bless' });
    expect(script('ashChieftain')[0]).toEqual({ kind: 'hold' });
  });

  it('starts research, gold, and exploration', () => {
    const r = state.nations[red!]!;
    expect(r.research).toEqual({ color: 'R', points: { W: 0, U: 0, B: 0, R: 60, G: 0 } });
    expect(r.gold).toBe(ECONOMY.startGold);
    expect(r.mana).toEqual({ W: 0, U: 0, B: 0, R: 0, G: 0 });
    // The capital, then everything within 2 of it, seen by the starting scout.
    const near = new Set([r.capital]);
    for (let step = 0; step < 2; step++) {
      for (const p of [...near]) for (const n of state.map.provinces[p]!.neighbors) near.add(n);
    }
    expect(r.explored[0]).toBe(r.capital);
    expect(new Set(r.explored)).toEqual(near);
    expect([r.pretenderId, r.prophetId]).toEqual([null, null]);
  });

  it('numbers duplicate nations and gives each its own banner', () => {
    const four = createGame({
      seed: 3,
      mapSize: 'medium',
      nations: [
        nation('cinderHorde'),
        nation('thornwood'),
        nation('cinderHorde'),
        nation('cinderHorde'),
      ],
    });
    const nations = Object.values(four.nations);
    expect(nations.map((n) => n.name)).toEqual([
      'Cinder Horde',
      'Thornwood',
      'Cinder Horde II',
      'Cinder Horde III',
    ]);
    expect(nations.map((n) => n.banner)).toEqual([
      NATION_BANNERS.R[0],
      NATION_BANNERS.G[0],
      NATION_BANNERS.R[1],
      NATION_BANNERS.R[2],
    ]);
  });

  it('is deterministic and JSON round-trips', () => {
    const again = twoNationGame(7);
    expect(again).toEqual(state);
    expect(JSON.parse(JSON.stringify(state)) as GameState).toEqual(state);
    expect(twoNationGame(8).map).not.toEqual(state.map);
  });

  it('rejects bad setups', () => {
    const base = { seed: 1, mapSize: 'medium' as const };
    expect(() => createGame({ ...base, nations: [nation('thornwood')] })).toThrow(RangeError);
    expect(() =>
      createGame({ ...base, nations: [nation('thornwood'), nation('nope' as never)] }),
    ).toThrow(RangeError);
    expect(() =>
      createGame({
        ...base,
        nations: [
          nation('thornwood'),
          { ...nation('cinderHorde'), pretender: pretender({ dominion: 11 }) },
        ],
      }),
    ).toThrow(RangeError);
    expect(() =>
      createGame({
        ...base,
        nations: [
          nation('thornwood'),
          {
            ...nation('cinderHorde'),
            pretender: pretender({ scales: { ...NEUTRAL_SCALES, wild: 4 } }),
          },
        ],
      }),
    ).toThrow(RangeError);
  });
});

describe('createGame and the design of Phase 6b.1', () => {
  const titan = pretender({ chassis: 'titan', pips: { R: 4 }, dominion: 2, awakening: 'awake' });

  it('starts every province without added springs, the god unnamed and not reforming', () => {
    const state = twoNationGame(7);
    for (const p of Object.values(state.provinces)) expect(p.extraSprings, p.id).toEqual([]);
    for (const n of Object.values(state.nations)) {
      expect([n.pretenderName, n.pretenderReturnDay]).toEqual([null, null]);
    }
  });

  it('adds a Sacred Spring of its color to the capital, after the map’s springs', () => {
    const state = twoNationGame(7, {
      pretender: { ...titan, boons: [{ id: 'sacredSpring', color: 'R' }] },
    });
    const [red, green] = nationIds(state);
    const capital = state.provinces[state.nations[red!]!.capital]!;
    expect(capital.extraSprings).toEqual(['R']);
    expect(state.provinces[state.nations[green!]!.capital]!.extraSprings).toEqual([]);
    // Mapgen data is never edited.
    expect(state.map).toEqual(twoNationGame(7).map);
  });

  it('adds a chassis’s starting springs before the boon’s', () => {
    const chassis: ChassisDef = CHASSIS.titan;
    patched(chassis, 'startSprings', { color: 'nation', count: 1 }, () => {
      const state = twoNationGame(7, {
        pretender: { ...titan, pips: { R: 4, G: 1 }, boons: [{ id: 'sacredSpring', color: 'G' }] },
      });
      const red = nationIds(state)[0]!;
      expect(state.provinces[state.nations[red]!.capital]!.extraSprings).toEqual(['R', 'G']);
    });
  });

  it('copies the design, so the setup’s lists never alias the game’s', () => {
    const blessings = ['emberWrath'];
    const boons = [{ id: 'avatar' as const }];
    const setup = { ...titan, blessings, boons };
    const state = twoNationGame(7, { pretender: setup });
    const kept = state.nations[nationIds(state)[0]!]!.pretender;
    expect(kept).toEqual(setup);
    expect(kept.blessings).not.toBe(blessings);
    expect(kept.boons).not.toBe(boons);
    expect(kept.boons![0]).not.toBe(boons[0]);
    // A design without the lists gets none: absent means the default picks and no boons.
    const other = twoNationGame(7, { pretender: titan });
    const plain = other.nations[nationIds(other)[0]!]!.pretender;
    expect(Object.keys(plain)).not.toContain('blessings');
    expect(Object.keys(plain)).not.toContain('boons');
  });

  it('refuses a design with a bad blessing or boon', () => {
    expect(() =>
      twoNationGame(7, { pretender: { ...titan, blessings: ['flamingWeapons'] } }),
    ).toThrow('Flaming Weapons needs R5');
    expect(() =>
      twoNationGame(7, { pretender: { ...titan, boons: [{ id: 'sacredSpring', color: 'U' }] } }),
    ).toThrow('A Sacred Spring needs a pip in its color');
  });
});
