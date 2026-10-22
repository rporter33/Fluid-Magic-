// Sight around impassable wilds (Phase 1b; war-table design 1.7): vision walks
// MapProvince.neighbors, so sight 1 and 2 count steps around a wild and never see across one
// in fewer steps than the province graph gives.
import { describe, expect, it } from 'vitest';
import { removeCommander } from '../../src/sim/commanders';
import { visionOf } from '../../src/sim/visibility';
import { addArmy } from './fixtures';
import { acrossWild, pair, provinceHops, wildGame } from './wildFixtures';

describe('sight around wilds', () => {
  const state = wildGame();
  const [red] = pair(state);
  // Red owns nothing and has no one on the map but the commanders each test places.
  for (const p of Object.values(state.provinces)) p.owner = null;
  for (const c of Object.values(state.commanders)) removeCommander(state, c.id);
  const { a, b, hops } = acrossWild(state);
  const fromA = provinceHops(state, a);
  const wildIds = new Set<string>(state.map.wilds.map((w) => w.id));

  it.each([
    ['an army', 'ashChieftain', 1],
    ['a scout', 'cinderScout', 2],
  ] as const)('%s sees the provinces within its sight around the wild', (_, unit, sight) => {
    const c = addArmy(state, red, a, 'cinderWarrior', 1, unit);
    const vision = visionOf(state, red);
    const expected = [...fromA].filter(([, d]) => d <= sight).map(([p]) => p);
    expect([...vision].sort()).toEqual(expected.sort());
    for (const p of vision) expect(wildIds.has(p)).toBe(false);
    // b is 2 cells away through the wild, so a sight of 2 would reach it straight across.
    expect(hops).toBeGreaterThan(2);
    expect(vision.has(b)).toBe(false);
    removeCommander(state, c.id);
  });
});
