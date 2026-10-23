import { describe, expect, it } from 'vitest';
import { MAPGEN } from '../../src/content/mapgen';
import { mapDimensions, provinceCount, wellspringCount } from '../../src/mapgen/size';

describe('provinceCount', () => {
  it('uses the size for two nations and adds 25 per extra nation', () => {
    expect(provinceCount('small', 2)).toBe(40);
    expect(provinceCount('medium', 2)).toBe(60);
    expect(provinceCount('large', 2)).toBe(80);
    expect(provinceCount('medium', 3)).toBe(85);
    expect(provinceCount('small', 4)).toBe(90);
  });
});

describe('wellspringCount', () => {
  it('is 3 for two nations and 5 for three or four', () => {
    expect(wellspringCount(2)).toBe(3);
    expect(wellspringCount(3)).toBe(5);
    expect(wellspringCount(4)).toBe(5);
  });
});

describe('mapDimensions', () => {
  it('has the content aspect and one province area per province', () => {
    const { width, height } = mapDimensions(60);
    expect(width / height).toBeCloseTo(MAPGEN.aspect, 10);
    expect(width * height).toBeCloseTo(60 * MAPGEN.provinceArea, 6);
  });
});
