// Movement (docs/01-core-rules.md section 6). Expected days come from the terrain table in
// section 2 and the speed factors 1.5 / 1.0 / 0.7, rounded to whole days.
import { describe, expect, it } from 'vitest';
import { TERRAIN_IDS, type TerrainId } from '../../src/content/terrain';
import { applyCommand } from '../../src/sim/commands';
import type { CommanderId, NationId, ProvinceId } from '../../src/sim/ids';
import {
  advanceTransits,
  commanderMapSpeed,
  etaDays,
  findPath,
  legDays,
  pathDays,
  pathEta,
} from '../../src/sim/movement';
import type { CommanderState, GameState } from '../../src/sim/types';
import {
  addArmy,
  annex,
  capitalOf,
  commandersIn,
  nationIds,
  runDays,
  twoNationGame,
} from './fixtures';

const LEG_DAYS: Record<TerrainId, [number, number, number]> = {
  // [speed 1, speed 2, speed 3]
  plains: [6, 4, 3],
  farmland: [6, 4, 3],
  forest: [9, 6, 4],
  hills: [9, 6, 4],
  mountains: [14, 9, 6],
  swamp: [12, 8, 6],
  wasteland: [8, 5, 4],
};

function provinceOn(state: GameState, terrain: TerrainId): ProvinceId {
  const mp = Object.values(state.map.provinces).find((p) => p.terrain === terrain);
  if (!mp) throw new Error(`no ${terrain}`);
  return mp.id;
}

/** A field army of Red's in its capital, and a chain of Red-owned provinces leading away. */
function setup(seed = 1) {
  const state = twoNationGame(seed);
  const red = nationIds(state)[0]!;
  const capital = capitalOf(state, red).id;
  const army = commandersIn(state, capital).find((c) => c.unit === 'ashChieftain')!;
  return { state, red, capital, army };
}

function neighbors(state: GameState, id: ProvinceId): ProvinceId[] {
  return state.map.provinces[id]!.neighbors;
}

function move(
  state: GameState,
  nation: NationId,
  commanders: CommanderState[],
  path: ProvinceId[],
) {
  return applyCommand(state, {
    type: 'move',
    nation,
    commanders: commanders.map((c) => c.id),
    path,
  });
}

describe('leg days', () => {
  it('match the terrain table at every map speed', () => {
    const state = twoNationGame(2, {}, {});
    for (const terrain of TERRAIN_IDS) {
      const p = provinceOn(state, terrain);
      expect([1, 2, 3].map((speed) => legDays(state, p, speed))).toEqual(LEG_DAYS[terrain]);
    }
  });

  it('refuse speeds that cannot move', () => {
    const state = twoNationGame();
    expect(() => legDays(state, provinceOn(state, 'plains'), 0)).toThrow();
  });

  it('use the slowest of a commander and its squads', () => {
    const { state, red, capital, army } = setup();
    expect(commanderMapSpeed(army)).toBe(2);
    const riders = addArmy(state, red, capital, 'ashRider', 5, 'cinderScout');
    expect(commanderMapSpeed(riders)).toBe(3);
    riders.squads.push(...addArmy(state, red, capital, 'cinderWarrior', 1).squads);
    expect(commanderMapSpeed(riders)).toBe(2);
    const garrison = state.commanders[state.provinces[capital]!.garrison!]!;
    expect(commanderMapSpeed(garrison)).toBe(0);
  });
});

describe('moving', () => {
  it('arrives after the leg days of the destination terrain', () => {
    const { state, red, capital, army } = setup();
    const next = neighbors(state, capital)[0]!;
    const days = legDays(state, next, 2);
    expect(move(state, red, [army], [next])).toEqual({ ok: true });
    expect(army.transit).toEqual({ from: capital, to: next, progress: 0, totalDays: days });
    expect(etaDays(state, army)).toBe(days);
    runDays(state, days - 1);
    expect(army.location).toBe(capital);
    expect(army.transit?.progress).toBe(days - 1);
    expect(etaDays(state, army)).toBe(1);
    runDays(state, 1);
    expect(army.transit).toBeNull();
    expect(army.location).toBe(next);
    expect(army.cameFrom).toBe(capital);
    expect(army.order).toEqual({ kind: 'idle' });
  });

  it('walks a path through its own provinces leg after leg, ETA the sum of legs', () => {
    const { state, red, capital, army } = setup();
    const a = neighbors(state, capital)[0]!;
    const b = neighbors(state, a).find((n) => n !== capital)!;
    const c = neighbors(state, b).find((n) => n !== a && n !== capital)!;
    for (const p of [a, b]) annex(state, red, p);
    const total = pathDays(state, [a, b, c], 2);
    move(state, red, [army], [a, b, c]);
    expect(etaDays(state, army)).toBe(total);
    runDays(state, legDays(state, a, 2));
    expect(army.location).toBe(a);
    expect(army.transit).toMatchObject({ from: a, to: b, progress: 0 });
    expect(etaDays(state, army)).toBe(total - legDays(state, a, 2));
    runDays(state, total - legDays(state, a, 2));
    expect(army.location).toBe(c);
    expect(army.transit).toBeNull();
    expect(army.cameFrom).toBe(b);
  });

  it('stops where it meets hostiles: a lost province or a foreign army', () => {
    const { state, red, capital, army } = setup();
    const green = nationIds(state)[1]!;
    const a = neighbors(state, capital)[0]!;
    const b = neighbors(state, a).find((n) => n !== capital)!;
    const c = neighbors(state, b).find((n) => n !== a && n !== capital)!;
    for (const p of [a, b]) annex(state, red, p);
    move(state, red, [army], [a, b, c]);
    state.provinces[a]!.owner = green;
    runDays(state, legDays(state, a, 2));
    expect(army.location).toBe(a);
    expect(army.transit).toBeNull();
    expect(army.order).toEqual({ kind: 'idle' });
    runDays(state, 20);
    expect(army.location).toBe(a);

    state.provinces[a]!.owner = red;
    move(state, red, [army], [b, c]);
    addArmy(state, green, b, 'warden', 5, 'wardenCaptain');
    runDays(state, legDays(state, b, 2));
    expect(army.location).toBe(b);
    expect(army.order).toEqual({ kind: 'idle' });
  });

  it('keeps a non-move order given while marching', () => {
    const { state, red, capital, army } = setup();
    const a = neighbors(state, capital)[0]!;
    move(state, red, [army], [a]);
    applyCommand(state, { type: 'setOrder', nation: red, commander: army.id, order: 'pillage' });
    runDays(state, legDays(state, a, 2));
    expect(army.location).toBe(a);
    expect(army.order).toEqual({ kind: 'pillage' });
  });

  it('moves fast troops at speed 3 under any national commander', () => {
    const { state, red, capital } = setup();
    const riders = addArmy(state, red, capital, 'ashRider', 10);
    const plains = neighbors(state, capital).find(
      (p) => state.map.provinces[p]!.terrain === 'plains',
    );
    const target = plains ?? neighbors(state, capital)[0]!;
    move(state, red, [riders], [target]);
    expect(riders.order).toMatchObject({ mapSpeed: 3 });
    expect(riders.transit?.totalDays).toBe(LEG_DAYS[state.map.provinces[target]!.terrain][2]);
    if (plains) expect(riders.transit?.totalDays).toBe(3);
  });

  it('previews the ETA of a path before ordering it', () => {
    const { state, red, capital, army } = setup();
    const a = neighbors(state, capital)[0]!;
    annex(state, red, a);
    const b = neighbors(state, a).find((n) => n !== capital)!;
    expect(pathEta(state, [army], [a, b])).toBe(pathDays(state, [a, b], 2));
    move(state, red, [army], [a]);
    runDays(state, 1);
    expect(pathEta(state, [army], [b])).toBe(legDays(state, a, 2) - 1 + legDays(state, b, 2));
  });

  it('keeps a group together at its slowest speed on every leg', () => {
    const { state, red, capital, army } = setup();
    const wardens = addArmy(state, red, capital, 'cinderWarrior', 5);
    wardens.squads[0]!.unit = 'warden';
    const a = neighbors(state, capital)[0]!;
    annex(state, red, a);
    const b = neighbors(state, a).find((n) => n !== capital)!;
    move(state, red, [army, wardens], [a, b]);
    for (const c of [army, wardens]) {
      expect(c.order).toEqual({ kind: 'move', path: [b], mapSpeed: 1 });
      expect(c.transit?.totalDays).toBe(legDays(state, a, 1));
    }
    runDays(state, pathDays(state, [a, b], 1));
    expect([army.location, wardens.location]).toEqual([b, b]);
  });

  it('lets a moving commander take a new path from the end of its leg', () => {
    const { state, red, capital, army } = setup();
    const [a, other] = neighbors(state, capital) as [ProvinceId, ProvinceId];
    annex(state, red, a);
    move(state, red, [army], [a]);
    runDays(state, 1);
    expect(move(state, red, [army], [capital, other])).toEqual({ ok: true });
    expect(army.transit).toMatchObject({ from: capital, to: a, progress: 1 });
    runDays(state, legDays(state, a, 2) - 1);
    expect(army.location).toBe(a);
    expect(army.transit).toMatchObject({ from: a, to: capital });
  });

  it('returns each day’s arrivals grouped by province, then nation', () => {
    const { state, red, capital, army } = setup();
    const green = nationIds(state)[1]!;
    const a = neighbors(state, capital)[0]!;
    const scout = commandersIn(state, capital).find((c) => c.unit === 'cinderScout')!;
    const foe = addArmy(state, green, a, 'warden', 5, 'wardenCaptain');
    move(state, red, [army, scout], [a]);
    foe.location = capital;
    foe.transit = { from: capital, to: a, progress: 0, totalDays: legDays(state, a, 2) };
    foe.order = { kind: 'move', path: [], mapSpeed: 2 };
    runDays(state, legDays(state, a, 2) - 1);
    const arrivals = advanceTransits(state);
    expect(arrivals.map((x) => [x.province, x.nation, x.commanders.map((c) => c.id)])).toEqual([
      [a, red, [army.id, scout.id]],
      [a, green, [foe.id]],
    ]);
  });
});

describe('reverse', () => {
  it('turns back with the days walked as the days home, then stops', () => {
    const { state, red, capital, army } = setup();
    const a = neighbors(state, capital)[0]!;
    const days = legDays(state, a, 2);
    move(state, red, [army], [a]);
    runDays(state, 2);
    expect(applyCommand(state, { type: 'reverse', nation: red, commander: army.id })).toEqual({
      ok: true,
    });
    expect(army.transit).toEqual({ from: a, to: capital, progress: days - 2, totalDays: days });
    // It never reached the far end: it still stands, eats, and sees from home.
    expect(army.location).toBe(capital);
    expect(etaDays(state, army)).toBe(2);
    runDays(state, 2);
    expect(army.location).toBe(capital);
    expect(army.cameFrom).toBeNull();
    expect(army.transit).toBeNull();
    expect(army.order).toEqual({ kind: 'idle' });
  });

  it('cancels a leg not yet begun', () => {
    const { state, red, capital, army } = setup();
    move(state, red, [army], [neighbors(state, capital)[0]!]);
    applyCommand(state, { type: 'reverse', nation: red, commander: army.id });
    expect(army.transit).toBeNull();
    expect(army.location).toBe(capital);
    expect(army.order).toEqual({ kind: 'idle' });
  });

  it('is refused for a commander standing still', () => {
    const { state, red, army } = setup();
    expect(applyCommand(state, { type: 'reverse', nation: red, commander: army.id }).ok).toBe(
      false,
    );
  });
});

describe('move validation', () => {
  it('refuses broken paths, separated groups, and commanders that cannot move', () => {
    const { state, red, capital, army } = setup();
    const a = neighbors(state, capital)[0]!;
    const far = Object.keys(state.map.provinces).find(
      (p) => p !== capital && !neighbors(state, capital).includes(p as ProvinceId),
    ) as ProvinceId;
    const garrison = state.commanders[state.provinces[capital]!.garrison!]!;
    const elsewhere = addArmy(state, red, a, 'cinderWarrior', 1);
    const tries: [CommanderId[], ProvinceId[]][] = [
      [[], [a]],
      [[army.id], []],
      [[army.id], [far]],
      [[army.id], [a, a]],
      [[army.id], ['p9999' as ProvinceId]],
      [[army.id, army.id], [a]],
      [[army.id, elsewhere.id], [a]],
      [[garrison.id], [a]],
    ];
    for (const [commanders, path] of tries) {
      const before = JSON.stringify(state);
      expect(applyCommand(state, { type: 'move', nation: red, commanders, path }).ok).toBe(false);
      expect(JSON.stringify(state)).toBe(before);
    }
  });
});

describe('findPath', () => {
  /** Bellman-Ford over the same leg costs, independent of the Dijkstra under test. */
  function shortest(state: GameState, from: ProvinceId, speed: number): Map<ProvinceId, number> {
    const dist = new Map<ProvinceId, number>([[from, 0]]);
    for (let round = 0; round < Object.keys(state.map.provinces).length; round++) {
      for (const mp of Object.values(state.map.provinces)) {
        const d = dist.get(mp.id);
        if (d === undefined) continue;
        for (const n of mp.neighbors) {
          const via = d + legDays(state, n, speed);
          if (via < (dist.get(n) ?? Infinity)) dist.set(n, via);
        }
      }
    }
    return dist;
  }

  /** Red owns every province and nobody else has armies, so no province is hostile. */
  function openMap(seed: number) {
    const s = setup(seed);
    for (const p of Object.values(s.state.provinces)) p.owner = s.red;
    for (const c of Object.values(s.state.commanders))
      if (c.owner !== s.red) c.location = s.capital;
    for (const c of Object.values(s.state.commanders)) if (c.owner !== s.red) c.owner = s.red;
    return s;
  }

  it('finds a connected path of least days to every province', () => {
    const { state, red, capital } = openMap(4);
    for (const speed of [1, 2, 3]) {
      const best = shortest(state, capital, speed);
      for (const target of Object.keys(state.map.provinces) as ProvinceId[]) {
        const path = findPath(state, red, capital, target, speed);
        if (target === capital) {
          expect(path).toBeNull();
          continue;
        }
        expect(path).not.toBeNull();
        let at = capital;
        for (const p of path!) {
          expect(neighbors(state, at)).toContain(p);
          at = p;
        }
        expect(at).toBe(target);
        expect(pathDays(state, path!, speed)).toBe(best.get(target));
      }
    }
  });

  it('goes through hostile provinces only at the end', () => {
    const { state, red, capital } = setup(4);
    const hostile = (p: ProvinceId) => state.provinces[p]!.owner !== red;
    for (const target of Object.keys(state.map.provinces) as ProvinceId[]) {
      const path = findPath(state, red, capital, target, 2);
      if (!path) continue;
      expect(path.slice(0, -1).some(hostile)).toBe(false);
    }
    // Every neighbor of the capital is independent at the start, so nothing beyond is reachable.
    const beyond = Object.keys(state.map.provinces).find(
      (p) => p !== capital && !neighbors(state, capital).includes(p as ProvinceId),
    ) as ProvinceId;
    expect(findPath(state, red, capital, beyond, 2)).toBeNull();
    expect(findPath(state, red, capital, neighbors(state, capital)[0]!, 2)).toEqual([
      neighbors(state, capital)[0],
    ]);
  });

  it('is deterministic', () => {
    const a = openMap(5);
    const b = openMap(5);
    const targets = Object.keys(a.state.map.provinces) as ProvinceId[];
    for (const t of targets) {
      expect(findPath(a.state, a.red, a.capital, t, 2)).toEqual(
        findPath(b.state, b.red, b.capital, t, 2),
      );
    }
  });
});
