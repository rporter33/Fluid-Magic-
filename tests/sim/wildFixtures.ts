// Games on maps with impassable wild ranges (Phase 1b), for the tests that check every reader
// of adjacency goes around a wild. Two provinces "across a wild" both share a drawn border with
// the same wild cell, so the cell graph puts them 2 apart through it; on the province graph
// they are 3 or more apart. The drawn borders are measured from the polygons with
// tests/mapgen/fixtures.ts, independently of MapProvince.neighbors.
import { removeCommander } from '../../src/sim/commanders';
import { createGame } from '../../src/sim/createGame';
import type { NationId, ProvinceId } from '../../src/sim/ids';
import type { MapWild } from '../../src/mapgen/types';
import type { GameState } from '../../src/sim/types';
import { touchingLength } from '../mapgen/fixtures';
import { annex, nation, nationIds } from './fixtures';

/** A Medium game of Cinder Horde (player) against Thornwood (AI) on a map with wilds. */
export function wildGame(seed = 1): GameState {
  return createGame({
    seed,
    mapSize: 'medium',
    nations: [nation('cinderHorde'), nation('thornwood', { ai: { difficulty: 'normal' } })],
    wilds: true,
  });
}

/** Hop distances from `from` over MapProvince.neighbors, by a search written for the test. */
export function provinceHops(state: GameState, from: ProvinceId): Map<ProvinceId, number> {
  const dist = new Map<ProvinceId, number>([[from, 0]]);
  const queue = [from];
  while (queue.length > 0) {
    const at = queue.shift()!;
    for (const n of state.map.provinces[at]!.neighbors) {
      if (!dist.has(n)) {
        dist.set(n, dist.get(at)! + 1);
        queue.push(n);
      }
    }
  }
  return dist;
}

/** True when the two provinces' drawn polygons share a stretch of border. */
export function bordersMeet(state: GameState, a: ProvinceId, b: ProvinceId): boolean {
  return touchingLength(state.map.provinces[a]!.polygon, state.map.provinces[b]!.polygon) > 1e-3;
}

export interface AcrossWild {
  wild: MapWild;
  /** Two provinces bordering the same wild cell, as far apart on the province graph as any. */
  a: ProvinceId;
  b: ProvinceId;
  /** Their distance on the province graph: at least 3. */
  hops: number;
}

/** The pair of provinces across one wild cell that are farthest apart on the province graph. */
export function acrossWild(state: GameState): AcrossWild {
  let best: AcrossWild | null = null;
  for (const wild of state.map.wilds) {
    for (const cell of wild.cells) {
      const touching = Object.values(state.map.provinces)
        .filter((p) => touchingLength(p.polygon, cell) > 1e-3)
        .map((p) => p.id);
      for (const a of touching) {
        const dist = provinceHops(state, a);
        for (const b of touching) {
          const hops = dist.get(b)!;
          if (hops >= 3 && (best === null || hops > best.hops)) best = { wild, a, b, hops };
        }
      }
    }
  }
  if (best === null) throw new Error('no provinces across a wild');
  return best;
}

/** Gives every province to `nation` and removes every other nation's and independent commander. */
export function ownEverything(state: GameState, nation: NationId): void {
  for (const id of Object.keys(state.provinces) as ProvinceId[]) annex(state, nation, id);
  for (const c of Object.values(state.commanders)) {
    if (c.owner !== nation) removeCommander(state, c.id);
  }
}

/** The game's nations as a pair. */
export function pair(state: GameState): [NationId, NationId] {
  return nationIds(state) as [NationId, NationId];
}
