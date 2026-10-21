import { describe, expect, it } from 'vitest';
import { TERRAIN_SHARES } from '../../src/content/mapgen';
import { TERRAIN_IDS } from '../../src/content/terrain';
import { apportion, assignTerrain } from '../../src/mapgen/terrain';

describe('apportion', () => {
  it('sums to the total for every size', () => {
    for (let n = 0; n <= 200; n++) {
      const counts = apportion(TERRAIN_SHARES, n);
      expect(TERRAIN_IDS.reduce((s, id) => s + counts[id], 0)).toBe(n);
    }
  });

  it('stays within one of the exact share', () => {
    const counts = apportion(TERRAIN_SHARES, 60);
    for (const id of TERRAIN_IDS) {
      expect(Math.abs(counts[id] - TERRAIN_SHARES[id] * 60)).toBeLessThan(1);
    }
  });
});

describe('assignTerrain', () => {
  const n = 100;
  // Elevation rises with index; moisture alternates high and low.
  const elevation = Array.from({ length: n }, (_, i) => i / n);
  const moisture = Array.from({ length: n }, (_, i) => (i % 2 === 0 ? 0.9 : 0.1) - i / 1000);
  const terrains = assignTerrain(elevation, moisture);

  it('hands out exactly the apportioned count of each terrain', () => {
    const counts = apportion(TERRAIN_SHARES, n);
    for (const id of TERRAIN_IDS) {
      expect(terrains.filter((t) => t === id)).toHaveLength(counts[id]);
    }
  });

  it('puts mountains on the highest ground, then hills', () => {
    const { mountains, hills } = apportion(TERRAIN_SHARES, n);
    for (let i = n - mountains; i < n; i++) expect(terrains[i]).toBe('mountains');
    for (let i = n - mountains - hills; i < n - mountains; i++) expect(terrains[i]).toBe('hills');
  });

  it('puts forest and swamp on wet ground and wasteland on dry ground', () => {
    terrains.forEach((t, i) => {
      if (t === 'forest' || t === 'swamp') expect(i % 2).toBe(0);
      if (t === 'wasteland') expect(i % 2).toBe(1);
    });
  });

  it('is a pure function of its inputs', () => {
    expect(assignTerrain(elevation, moisture)).toEqual(terrains);
  });
});
