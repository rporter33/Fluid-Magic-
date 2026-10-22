// Dominion spread around impassable wilds (Phase 1b; war-table design 1.7): a check lands on
// its own province or a neighbor from MapProvince.neighbors, so spread never lands on a wild
// and never reaches across one.
import { describe, expect, it } from 'vitest';
import { createCommander } from '../../src/sim/commanders';
import { spreadDominion } from '../../src/sim/dominion';
import { checksBy, preach } from './dominionFixtures';
import { acrossWild, pair, provinceHops, wildGame } from './wildFixtures';

describe('dominion spread around wilds', () => {
  it("lands only on the checks' provinces and their neighbors, never across the wild", () => {
    const state = wildGame();
    const [red, green] = pair(state);
    const { a, b } = acrossWild(state);
    // Each nation spreads from its capital; red also from twenty priests preaching in a.
    for (const p of Object.values(state.provinces)) p.dominion = { nation: null, strength: 0 };
    for (let i = 0; i < 20; i++) preach(createCommander(state, 'pyrePriest', red, a));
    expect(checksBy(state, red)[a]).toBe(40);
    const near = (nation: typeof red, from: (typeof a)[]) => {
      const out = new Set<string>();
      for (const f of from) for (const [p, d] of provinceHops(state, f)) if (d <= 1) out.add(p);
      return { nation, out };
    };
    const reach = [
      near(red, [a, state.nations[red]!.capital]),
      near(green, [state.nations[green]!.capital]),
    ];
    for (let month = 0; month < 12; month++) {
      state.day = 30 * month + 29;
      spreadDominion(state);
    }
    const reached = Object.values(state.provinces).filter((p) => p.dominion.strength > 0);
    expect(reached.filter((p) => p.dominion.nation === red).length).toBeGreaterThan(2);
    for (const p of reached) {
      const from = reach.find((r) => r.nation === p.dominion.nation)!;
      expect(from.out.has(p.id)).toBe(true);
    }
    // b is 2 cells from a through the wild, 3 or more provinces around it.
    expect(provinceHops(state, a).get(b)!).toBeGreaterThanOrEqual(3);
    expect(state.provinces[b]!.dominion.strength).toBe(0);
  });
});
