// Map and mana colors must stay distinct for every player, including the roughly 1 in 12
// men with a red-green color vision deficiency. Red and Green are the two M1 nations.
import { describe, expect, it } from 'vitest';
import { COLOR_DEFS, COLORS, INDEPENDENT_PALETTE } from '../../src/content/colors';
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
