// Paths and move validation (docs/01-core-rules.md section 6, and the Phase 3 decisions: a
// path may only end in a hostile province; ties go to the lower province index).
import { describe, expect, it } from 'vitest';
import { applyCommand } from '../../src/sim/commands';
import type { CommanderId, ProvinceId } from '../../src/sim/ids';
import { findPath, findPathFor, legDays, pathDays } from '../../src/sim/movement';
import type { GameState } from '../../src/sim/types';
import { addArmy, annex, move, neighbors, redField, runDays } from './fixtures';

/** Red owns every province and every commander, so no province is hostile to Red. */
function openMap(seed: number) {
  const s = redField(seed);
  for (const p of Object.values(s.state.provinces)) p.owner = s.red;
  for (const c of Object.values(s.state.commanders)) {
    if (c.owner !== s.red) c.location = s.capital;
    c.owner = s.red;
  }
  return s;
}

function ids(state: GameState): ProvinceId[] {
  return Object.keys(state.map.provinces) as ProvinceId[];
}

describe('move validation', () => {
  it('refuses broken paths, separated groups, and commanders that cannot move', () => {
    const { state, red, capital, army } = redField();
    const a = neighbors(state, capital)[0]!;
    annex(state, red, a);
    const far = ids(state).find((p) => p !== a && !neighbors(state, a).includes(p))!;
    const garrison = state.commanders[state.provinces[capital]!.garrison!]!;
    const elsewhere = addArmy(state, red, a, 'cinderWarrior', 1);
    const marching = addArmy(state, red, capital, 'cinderWarrior', 1);
    marching.transit = { from: capital, to: a, progress: 1, totalDays: 4 };
    const tries: [CommanderId[], ProvinceId[], string][] = [
      [[], [a], 'No commander selected'],
      [[army.id], [], 'The path is empty'],
      [[army.id], [far], 'The path is not connected'],
      [[army.id], [a, far], 'The path is not connected'],
      [[army.id], ['p9999' as ProvinceId], 'The path leaves the map'],
      [[army.id, army.id], [a], 'A commander is listed twice'],
      [[army.id, elsewhere.id], [a], 'The commanders are not together'],
      [[army.id, marching.id], [a], 'The commanders are not together'],
      [[garrison.id], [a], 'Garrison cannot move'],
    ];
    for (const [commanders, path, error] of tries) {
      const before = JSON.stringify(state);
      expect(applyCommand(state, { type: 'move', nation: red, commanders, path })).toEqual({
        ok: false,
        error,
      });
      expect(JSON.stringify(state)).toBe(before);
    }
  });
});

describe('findPath', () => {
  /** Bellman-Ford over the same leg costs, independent of the Dijkstra under test. */
  function shortest(state: GameState, from: ProvinceId, speed: number): Map<ProvinceId, number> {
    const dist = new Map<ProvinceId, number>([[from, 0]]);
    for (let round = 0; round < ids(state).length; round++) {
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

  it('finds a connected path of least days to every province', () => {
    const { state, red, capital } = openMap(4);
    for (const speed of [1, 2, 3]) {
      const best = shortest(state, capital, speed);
      for (const target of ids(state)) {
        const path = findPath(state, red, capital, target, speed);
        if (target === capital) {
          expect(path).toBeNull();
          continue;
        }
        let at = capital;
        for (const p of path ?? []) {
          expect(neighbors(state, at)).toContain(p);
          at = p;
        }
        expect(at).toBe(target);
        expect(pathDays(state, path ?? [], speed)).toBe(best.get(target));
      }
    }
  });

  it('breaks ties toward the lower province index', () => {
    const { state, red, capital } = openMap(4);
    // A province two steps out with several equally cheap ways in.
    const index = (p: ProvinceId) => ids(state).indexOf(p);
    const near = neighbors(state, capital);
    const target = ids(state).find(
      (t) =>
        t !== capital &&
        !near.includes(t) &&
        near.filter((n) => neighbors(state, t).includes(n)).length >= 2,
    )!;
    const ways = near.filter((n) => neighbors(state, target).includes(n));
    for (const p of [...ways, target]) state.map.provinces[p]!.terrain = 'plains';
    const lowest = ways.reduce((a, b) => (index(a) < index(b) ? a : b));
    expect(findPath(state, red, capital, target, 2)).toEqual([lowest, target]);
  });

  it('goes through hostile provinces only at the end', () => {
    const { state, red, capital } = redField(4);
    const hostile = (p: ProvinceId) => state.provinces[p]!.owner !== red;
    for (const target of ids(state)) {
      const path = findPath(state, red, capital, target, 2);
      if (path) expect(path.slice(0, -1).some(hostile)).toBe(false);
    }
    // Every neighbor of the capital is independent at the start, so nothing beyond is reachable.
    const beyond = ids(state).find((p) => p !== capital && !neighbors(state, capital).includes(p))!;
    expect(findPath(state, red, capital, beyond, 2)).toBeNull();
    expect(findPath(state, red, capital, neighbors(state, capital)[0]!, 2)).toEqual([
      neighbors(state, capital)[0],
    ]);
  });

  it('walks around an own province with a foreign army in it', () => {
    const { state, red, green, capital } = openMap(4);
    const target = ids(state).find((t) => (findPath(state, red, capital, t, 2)?.length ?? 0) >= 3)!;
    const blocked = findPath(state, red, capital, target, 2)![0]!;
    addArmy(state, green, blocked, 'warden', 5, 'wardenCaptain');
    const detour = findPath(state, red, capital, target, 2);
    expect(detour?.slice(0, -1)).not.toContain(blocked);
  });
});

describe('findPathFor', () => {
  it('starts where the current leg ends, at the group speed, and agrees with validation', () => {
    const { state, red, capital, army } = redField();
    const a = neighbors(state, capital)[0]!;
    annex(state, red, a);
    const b = neighbors(state, a).find((n) => n !== capital)!;
    expect(findPathFor(state, [army], b)).toEqual(findPath(state, red, capital, b, 2));
    move(state, red, [army], [a]);
    runDays(state, 1);
    const path = findPathFor(state, [army], b);
    expect(path).toEqual(findPath(state, red, a, b, 2));
    expect(move(state, red, [army], path!)).toEqual({ ok: true });
  });

  it('offers nothing to a group whose leg ends among hostiles, as validation refuses it', () => {
    const { state, red, capital, army } = redField();
    const a = neighbors(state, capital)[0]!;
    const b = neighbors(state, a).find((n) => n !== capital)!;
    move(state, red, [army], [a]);
    runDays(state, 1);
    expect(findPath(state, red, a, b, 2)).toEqual([b]);
    expect(findPathFor(state, [army], b)).toBeNull();
    expect(move(state, red, [army], [b]).ok).toBe(false);
    const garrison = state.commanders[state.provinces[capital]!.garrison!]!;
    expect(findPathFor(state, [garrison], a)).toBeNull();
  });
});
