// Ritual reach around impassable wilds (Phase 1b; war-table design 1.7): withinHops walks
// MapProvince.neighbors, so reach is counted around a wild, never through it, and a ritual's
// targets are the provinces the province graph puts in reach.
import { describe, expect, it } from 'vitest';
import { RITUALS } from '../../src/content/spells';
import { ritualTargets, withinHops } from '../../src/sim/rituals';
import { ritualCaster } from './fixtures';
import { acrossWild, ownEverything, pair, provinceHops, wildGame } from './wildFixtures';

describe('ritual reach around wilds', () => {
  const state = wildGame();
  const [, green] = pair(state);
  ownEverything(state, green);
  const { a, b, hops } = acrossWild(state);
  const fromA = provinceHops(state, a);
  const wildIds = new Set<string>(state.map.wilds.map((w) => w.id));

  it('counts hops around the wild: the province graph, never fewer steps', () => {
    for (let h = 0; h <= hops + 1; h++) {
      const reach = withinHops(state, a, h);
      const expected = [...fromA].filter(([, d]) => d <= h).map(([p]) => p);
      expect([...reach].sort()).toEqual(expected.sort());
      for (const p of reach) expect(wildIds.has(p)).toBe(false);
      // b is 2 cells away through the wild, but only `hops` provinces away around it.
      expect(reach.has(b)).toBe(h >= hops);
    }
  });

  it('offers a ritual only the targets in reach around the wild', () => {
    const caster = ritualCaster(state, green);
    caster.location = a;
    state.provinces[a]!.buildings.push('lab');
    const spell = RITUALS.find((s) => s.id === 'fertileSeason')!;
    expect(spell.target).toEqual({ kind: 'owned', hops: 2 });
    const targets = ritualTargets(state, caster, spell);
    const expected = [...fromA].filter(([, d]) => d <= 2).map(([p]) => p);
    expect([...targets].sort()).toEqual(expected.sort());
    expect(targets).not.toContain(b);
  });
});
