// Independent defenders (docs/01-core-rules.md section 9).
import { describe, expect, it } from 'vitest';
import {
  independentCount,
  independentTroops,
  splitByWeight,
  strengthWord,
} from '../../src/sim/independents';
import type { ProvinceId } from '../../src/sim/ids';
import { createGame } from '../../src/sim/createGame';
import { nation, twoNationGame } from './fixtures';

describe('splitByWeight', () => {
  it('sums exactly and gives remainders to the largest fractions, ties to the earlier', () => {
    expect(splitByWeight(12, [2, 1])).toEqual([8, 4]);
    expect(splitByWeight(16, [2, 1])).toEqual([11, 5]);
    expect(splitByWeight(20, [2, 1])).toEqual([13, 7]);
    expect(splitByWeight(3, [1, 1])).toEqual([2, 1]);
    expect(splitByWeight(7, [1])).toEqual([7]);
    expect(splitByWeight(0, [2, 1])).toEqual([0, 0]);
  });
});

describe('independent forces', () => {
  const state = twoNationGame(3);
  const provinces = Object.values(state.map.provinces);

  it('stand in every non-capital province: one captain, 8 + 4d troops (30 on Wellsprings)', () => {
    for (const mp of provinces) {
      const force = Object.values(state.commanders).filter(
        (c) => c.owner === null && c.location === mp.id,
      );
      if (mp.capitalSlot !== undefined) {
        expect(force).toEqual([]);
        continue;
      }
      expect(force.map((c) => c.unit)).toEqual(['independentCaptain']);
      const expected = mp.wellspring ? 30 : 8 + 4 * mp.capitalDistance;
      expect(independentCount(state, mp.id)).toBe(expected);
      expect(force[0]!.order).toEqual({ kind: 'idle' });
    }
  });

  it('draw troops from the terrain pool', () => {
    const units: Record<string, string[]> = {
      plains: ['lightInfantry', 'archer'],
      farmland: ['lightInfantry', 'archer'],
      wasteland: ['lightInfantry', 'archer'],
      forest: ['wolf', 'archer'],
      hills: ['heavyInfantry'],
      swamp: ['swampFighter'],
    };
    for (const mp of provinces) {
      if (mp.capitalSlot !== undefined) continue;
      const troops = independentTroops(state, mp.id);
      const n = mp.independentStrength;
      if (mp.terrain === 'mountains') {
        const giant = mp.capitalDistance >= 3 ? [{ unit: 'giant', count: 1 }] : [];
        expect(troops).toEqual([...giant, { unit: 'heavyInfantry', count: n - giant.length }]);
      } else if (units[mp.terrain]!.length === 2) {
        const ranged = Math.floor(n / 3) + (n % 3 === 2 ? 1 : 0);
        expect(troops).toEqual([
          { unit: units[mp.terrain]![0], count: n - ranged },
          { unit: units[mp.terrain]![1], count: ranged },
        ]);
      } else {
        expect(troops).toEqual([{ unit: units[mp.terrain]![0], count: n }]);
      }
    }
  });

  it('put a giant in mountains 3 or more from a capital, and only there', () => {
    const big = createGame({
      seed: 8,
      mapSize: 'large',
      nations: [nation('cinderHorde'), nation('thornwood')],
    });
    const giants = Object.values(big.commanders).filter((c) =>
      c.squads.some((s) => s.unit === 'giant'),
    );
    expect(giants.length).toBeGreaterThan(0);
    for (const c of giants) {
      const mp = big.map.provinces[c.location]!;
      expect(mp.terrain).toBe('mountains');
      expect(mp.capitalDistance).toBeGreaterThanOrEqual(3);
    }
  });

  it('never eat or starve, and are counted only where they stand', () => {
    const p = provinces.find((mp) => mp.capitalSlot === undefined)!.id;
    expect(independentCount(state, p)).toBeGreaterThan(0);
    expect(independentCount(state, 'p9999' as ProvinceId)).toBe(0);
  });
});

describe('strengthWord', () => {
  it('reads weak, moderate, strong, fortress', () => {
    expect([12, 15, 16, 23, 24, 29, 30, 60].map(strengthWord)).toEqual([
      'weak',
      'weak',
      'moderate',
      'moderate',
      'strong',
      'strong',
      'fortress',
      'fortress',
    ]);
  });
});
