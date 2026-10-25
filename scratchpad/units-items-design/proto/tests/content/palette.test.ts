// Map and mana colors must stay distinct for every player, including the roughly 1 in 12
// men with a red-green color vision deficiency. Red and Green are the two M1 nations.
import { describe, expect, it } from 'vitest';
import {
  COLOR_DEFS,
  COLORS,
  contrastRatio,
  INDEPENDENT_PALETTE,
  keylineFor,
  MAP_KEYLINES,
  NATION_BANNERS,
} from '../../src/content/colors';
import { MAPGEN } from '../../src/content/mapgen';
import { NATIONS } from '../../src/content/nations';
import { TERRAIN, TERRAIN_IDS } from '../../src/content/terrain';
import { closestPair, deltaE2000, labAs, VISIONS, type Lab } from './colorMath';

/** CIEDE2000 minimums: about 2 is just noticeable; 10 and up reads as a different color. */
const MIN_NORMAL = 20;
const MIN_DEFICIENT = 12;

const terrainFills = Object.fromEntries(TERRAIN_IDS.map((id) => [id, TERRAIN[id].fill]));
const manaPrimaries = {
  ...Object.fromEntries(COLORS.map((c) => [c, COLOR_DEFS[c].palette.primary])),
  independent: INDEPENDENT_PALETTE.primary,
};

describe('color math', () => {
  it('matches the CIEDE2000 reference data', () => {
    // Sharma, Wu, Dalal (2005), pairs 1, 7, 13, 17, 25, 34.
    const pairs: [Lab, Lab, number][] = [
      [[50, 2.6772, -79.7751], [50, 0, -82.7485], 2.0425],
      [[50, 0, 0], [50, -1, 2], 2.3669],
      [[50, 2.5, 0], [56, -27, -3], 31.903],
      [[50, 2.5, 0], [73, 25, -18], 27.1492],
      [[60.2574, -34.0099, 36.2677], [60.4626, -34.1751, 39.4387], 1.2644],
      [[2.0776, 0.0795, -1.135], [0.9033, -0.0636, -0.5514], 0.9082],
    ];
    for (const [a, b, want] of pairs) expect(deltaE2000(a, b)).toBeCloseTo(want, 4);
  });

  it('converts sRGB to CIELAB and keeps grays gray under simulation', () => {
    expect(deltaE2000(labAs('#FFFFFF', 'normal'), labAs('#000000', 'normal'))).toBeCloseTo(100, 4);
    const [L, a, b] = labAs('#808080', 'normal');
    expect(L).toBeCloseTo(53.585, 2);
    expect(Math.hypot(a, b)).toBeLessThan(0.01);
    for (const v of VISIONS) expect(Math.hypot(...labAs('#808080', v).slice(1))).toBeLessThan(1);
  });

  it('collapses classic red-green confusion under deuteranopia', () => {
    const normal = deltaE2000(labAs('#CC3333', 'normal'), labAs('#669933', 'normal'));
    const deutan = deltaE2000(labAs('#CC3333', 'deutan'), labAs('#669933', 'deutan'));
    expect(deutan).toBeLessThan(normal / 2);
  });
});

describe.each([
  ['terrain fills', terrainFills],
  ['mana primaries', manaPrimaries],
])('%s', (_, palette) => {
  it.each(VISIONS)('are distinct with %s vision', (vision) => {
    const min = vision === 'normal' ? MIN_NORMAL : MIN_DEFICIENT;
    const { a, b, deltaE } = closestPair(palette, vision);
    expect(deltaE, `${a} vs ${b}`).toBeGreaterThanOrEqual(min);
  });
});

// Banners of every nation that can share a game: all banner entries of the colors M1 nations use.
const NATION_COLORS = [...new Set(Object.values(NATIONS).map((n) => n.colors[0]))];
const banners = Object.fromEntries(
  NATION_COLORS.flatMap((c) => NATION_BANNERS[c].map((hex, k) => [`${c}${k}`, hex])),
);

describe('nation banners', () => {
  it('start with each color primary and cover a full game of one nation', () => {
    for (const c of COLORS) expect(NATION_BANNERS[c][0]).toBe(COLOR_DEFS[c].palette.primary);
    for (const c of NATION_COLORS) {
      expect(NATION_BANNERS[c].length).toBeGreaterThanOrEqual(MAPGEN.maxNations);
    }
  });

  it.each(VISIONS)('are distinct from each other with %s vision', (vision) => {
    const min = vision === 'normal' ? MIN_NORMAL : MIN_DEFICIENT;
    const { a, b, deltaE } = closestPair(banners, vision);
    expect(deltaE, `${a} vs ${b}`).toBeGreaterThanOrEqual(min);
  });
});

describe('ownership bands on terrain', () => {
  it('pick a keyline with at least 3:1 contrast on every fill', () => {
    for (const id of TERRAIN_IDS) {
      expect(contrastRatio(keylineFor(TERRAIN[id].fill), TERRAIN[id].fill)).toBeGreaterThanOrEqual(
        3,
      );
    }
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 9);
    expect(keylineFor('#000000')).toBe(MAP_KEYLINES.light);
    expect(keylineFor('#FFFFFF')).toBe(MAP_KEYLINES.dark);
  });

  it.each(VISIONS)('stand out on every fill with %s vision', (vision) => {
    // A band reads if its banner differs from the fill, or if its keyline differs from both.
    const min = vision === 'normal' ? MIN_NORMAL : MIN_DEFICIENT;
    const dE = (x: string, y: string) => deltaE2000(labAs(x, vision), labAs(y, vision));
    for (const [name, banner] of Object.entries(banners)) {
      for (const id of TERRAIN_IDS) {
        const fill = TERRAIN[id].fill;
        const keyline = keylineFor(fill);
        const direct = dE(banner, fill) >= min;
        const outlined = dE(keyline, fill) >= min && dE(keyline, banner) >= min;
        expect(direct || outlined, `${name} on ${id}`).toBe(true);
      }
    }
  });
});
