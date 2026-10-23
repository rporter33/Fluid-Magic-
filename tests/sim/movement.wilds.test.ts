// Movement around impassable wilds (Phase 1b; war-table design 1.7): a wild is never in
// MapProvince.neighbors, so two provinces across one are not neighbors, a move that steps
// across is refused, and paths go around, every step crossing a drawn border between provinces.
import { describe, expect, it } from 'vitest';
import { validateCommand, type Command } from '../../src/sim/commands';
import type { ProvinceId } from '../../src/sim/ids';
import { findPath, pathDays, pathsFrom } from '../../src/sim/movement';
import { addArmy } from './fixtures';
import {
  acrossWild,
  bordersMeet,
  ownEverything,
  pair,
  provinceHops,
  wildGame,
} from './wildFixtures';

describe('movement around wilds', () => {
  const state = wildGame();
  const [red] = pair(state);
  ownEverything(state, red);
  const { a, b, hops } = acrossWild(state);

  it('keeps wilds out of every neighbor list, so provinces across one are not neighbors', () => {
    const wildIds = new Set<string>(state.map.wilds.map((w) => w.id));
    expect(wildIds.size).toBeGreaterThan(0);
    for (const p of Object.values(state.map.provinces)) {
      for (const n of p.neighbors) {
        expect(wildIds.has(n)).toBe(false);
        expect(bordersMeet(state, p.id, n)).toBe(true);
      }
    }
    expect(state.map.provinces[a]!.neighbors).not.toContain(b);
    expect(hops).toBeGreaterThanOrEqual(3);
  });

  it('finds a path around the wild, each step across a drawn border', () => {
    const path = findPath(state, red, a, b, 2)!;
    expect(path.at(-1)).toBe(b);
    expect(path.length).toBeGreaterThanOrEqual(hops);
    let at = a;
    for (const next of path) {
      expect(bordersMeet(state, at, next)).toBe(true);
      at = next;
    }
  });

  it('gives pathsFrom the same way around, and the days it takes', () => {
    const army = addArmy(state, red, a, 'cinderWarrior', 5);
    const paths = pathsFrom(state, [army]);
    const path = paths.pathTo(b)!;
    expect(path).toEqual(findPath(state, red, a, b, 2));
    expect(paths.days(b)).toBe(pathDays(state, path, 2));
    for (const [p, d] of provinceHops(state, a)) {
      expect((paths.pathTo(p) ?? []).length).toBeGreaterThanOrEqual(d);
    }
  });

  it('refuses a move that steps across the wild', () => {
    const army = addArmy(state, red, a, 'cinderWarrior', 5);
    const order = (path: ProvinceId[]): Command => ({
      type: 'move',
      nation: red,
      commanders: [army.id],
      path,
    });
    expect(validateCommand(state, order([b]))).toBe('The path is not connected');
    expect(validateCommand(state, order(findPath(state, red, a, b, 2)!))).toBeNull();
  });
});
