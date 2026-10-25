// GameSetup -> GameState: nations, capitals, garrisons, starting armies.
import { describe, expect, it } from 'vitest';
import { nationDef, unitDef } from '../../src/content';
import { NEUTRAL_SCALES } from '../../src/content/pretenders/scales';
import { ECONOMY } from '../../src/content/rules';
import { createGame } from '../../src/sim/createGame';
import type { GameState } from '../../src/sim/types';
import { commandersIn, nation, nationIds, pretender, twoNationGame } from './fixtures';

describe('createGame', () => {
  const state = twoNationGame(7);
  const [red, green] = nationIds(state);

  it('creates nations in setup order with their capitals', () => {
    expect(nationIds(state)).toEqual(['n0', 'n1']);
    const r = state.nations[red!]!;
    const g = state.nations[green!]!;
    expect([r.def, r.name, r.color, r.capital]).toEqual([
      'cinderHorde',
      'Cinder Horde',
      'R',
      state.map.capitals[0],
    ]);
    expect([g.def, g.name, g.color, g.capital]).toEqual([
      'thornwood',
      'Thornwood',
      'G',
      state.map.capitals[1],
    ]);
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

  it('starts research, gold, and exploration', () => {
    const r = state.nations[red!]!;
    expect(r.research).toEqual({ color: 'R', points: { W: 0, U: 0, B: 0, R: 60, G: 0 } });
    expect(r.gold).toBe(ECONOMY.startGold);
    expect(r.mana).toEqual({ W: 0, U: 0, B: 0, R: 0, G: 0 });
    expect(r.explored).toEqual([r.capital]);
  });

  it('numbers duplicate nations', () => {
    const twin = createGame({
      seed: 3,
      mapSize: 'medium',
      nations: [nation('cinderHorde'), nation('cinderHorde')],
    });
    expect(Object.values(twin.nations).map((n) => n.name)).toEqual([
      'Cinder Horde',
      'Cinder Horde II',
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
