// Content validation (docs/06-architecture.md, "Content validation"). Grows with each phase:
// units, nations, spells, chassis, and presets join these fixtures as they are added.
import { describe, expect, it } from 'vitest';
import {
  ALLIED_PAIRS,
  areAllies,
  areEnemies,
  COLOR_DEFS,
  COLORS,
  ENEMY_PAIRS,
  INDEPENDENT_PALETTE,
  isColor,
  type ColorPair,
  type Palette,
} from '../../src/content/colors';
import {
  MAP_SIZE_IDS,
  MAP_SIZES,
  MAPGEN,
  TERRAIN_SHARES,
  TERRAIN_SPRING_COLORS,
} from '../../src/content/mapgen';
import { NAME_MIDDLES, NAME_SYLLABLES } from '../../src/content/names';
import { SCALE_AXES, SCALE_DEFS } from '../../src/content/pretenders/scales';
import { isTerrainId, TERRAIN, TERRAIN_IDS } from '../../src/content/terrain';

const HEX = /^#[0-9A-F]{6}$/;

function expectPalette(palette: Palette): void {
  expect(palette.primary).toMatch(HEX);
  expect(palette.secondary).toMatch(HEX);
  expect(palette.accent).toMatch(HEX);
}

function pairKey([x, y]: ColorPair): string {
  return [x, y].sort().join('');
}

describe('colors', () => {
  it('keys are exactly W U B R G in color-pie order', () => {
    expect(COLORS).toEqual(['W', 'U', 'B', 'R', 'G']);
    expect(Object.keys(COLOR_DEFS).sort()).toEqual([...COLORS].sort());
  });

  it('each definition is keyed by its own letter with a full palette', () => {
    for (const key of COLORS) {
      const def = COLOR_DEFS[key];
      expect(def.key).toBe(key);
      expect(def.element.length).toBeGreaterThan(0);
      expect(def.symbol.length).toBeGreaterThan(0);
      expectPalette(def.palette);
    }
    expectPalette(INDEPENDENT_PALETTE);
  });

  it('uses the glossary element names', () => {
    const elements = COLORS.map((key) => COLOR_DEFS[key].element);
    expect(elements).toEqual(['Radiance', 'Tide', 'Umbra', 'Ember', 'Loam']);
  });

  it('enemy and allied pairs partition all ten pairs of distinct colors', () => {
    const all = [...ENEMY_PAIRS, ...ALLIED_PAIRS];
    for (const [x, y] of all) {
      expect(isColor(x) && isColor(y)).toBe(true);
      expect(x).not.toBe(y);
    }
    expect(new Set(all.map(pairKey)).size).toBe(10);
  });

  it('every color has two enemies and two allies', () => {
    for (const c of COLORS) {
      const others = COLORS.filter((o) => o !== c);
      expect(others.filter((o) => areEnemies(c, o))).toHaveLength(2);
      expect(others.filter((o) => areAllies(c, o))).toHaveLength(2);
    }
  });

  it('pair lookups are symmetric', () => {
    expect(areEnemies('U', 'R')).toBe(true);
    expect(areEnemies('R', 'U')).toBe(true);
    expect(areAllies('R', 'G')).toBe(true);
    expect(areAllies('G', 'R')).toBe(true);
    expect(areEnemies('R', 'G')).toBe(false);
    expect(areEnemies('R', 'R')).toBe(false);
  });

  it('isColor accepts only the five letters', () => {
    for (const c of COLORS) expect(isColor(c)).toBe(true);
    for (const bad of ['w', 'X', 'RG', '', null, 3]) expect(isColor(bad)).toBe(false);
  });
});

describe('terrain', () => {
  it('defines every terrain id, keyed by its own id', () => {
    expect(Object.keys(TERRAIN).sort()).toEqual([...TERRAIN_IDS].sort());
    for (const id of TERRAIN_IDS) {
      expect(TERRAIN[id].id).toBe(id);
      expect(isTerrainId(id)).toBe(true);
    }
    expect(isTerrainId('sea')).toBe(false);
  });

  it('has sane base values', () => {
    for (const id of TERRAIN_IDS) {
      const t = TERRAIN[id];
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.materialsBase).toBeGreaterThan(0);
      expect(t.supplyBase).toBeGreaterThan(0);
      expect(Number.isInteger(t.moveDays) && t.moveDays > 0).toBe(true);
      expect(Number.isInteger(t.startPop.min) && t.startPop.min > 0).toBe(true);
      expect(t.startPop.max).toBeGreaterThanOrEqual(t.startPop.min);
      expect(t.battle.defenderDef).toBeGreaterThanOrEqual(0);
      expect(t.battle.attackerAtt).toBeLessThanOrEqual(0);
      expect(t.fill).toMatch(HEX);
    }
  });
});

describe('scales', () => {
  it('each axis joins two enemy colors, covering all five enemy pairs', () => {
    expect(Object.keys(SCALE_DEFS).sort()).toEqual([...SCALE_AXES].sort());
    const pairs = SCALE_AXES.map((axis) => {
      const def = SCALE_DEFS[axis];
      expect(def.id).toBe(axis);
      expect(areEnemies(def.positive.color, def.negative.color)).toBe(true);
      return pairKey([def.positive.color, def.negative.color]);
    });
    expect(new Set(pairs)).toEqual(new Set(ENEMY_PAIRS.map(pairKey)));
  });

  it('uses the pole names from the pretender doc', () => {
    const poles = SCALE_AXES.map(
      (a) => `${SCALE_DEFS[a].positive.name}/${SCALE_DEFS[a].negative.name}`,
    );
    expect(poles).toEqual([
      'Order/Turmoil',
      'Lore/Fury',
      'Growth/Rot',
      'Wild/Artifice',
      'Sanctity/Dread',
    ]);
  });
});

describe('map generation content', () => {
  it('defines the three map sizes from the New Game screen', () => {
    expect(MAP_SIZE_IDS.map((id) => MAP_SIZES[id].provinces)).toEqual([40, 60, 80]);
    for (const id of MAP_SIZE_IDS) expect(MAP_SIZES[id].id).toBe(id);
  });

  it('terrain shares cover every terrain and sum to 1', () => {
    expect(Object.keys(TERRAIN_SHARES).sort()).toEqual([...TERRAIN_IDS].sort());
    const total = TERRAIN_IDS.reduce((sum, id) => sum + TERRAIN_SHARES[id], 0);
    expect(total).toBeCloseTo(1, 10);
    for (const id of TERRAIN_IDS) expect(TERRAIN_SHARES[id]).toBeGreaterThan(0);
  });

  it('every terrain can hold springs and every color has a home terrain', () => {
    for (const id of TERRAIN_IDS) {
      const colors = TERRAIN_SPRING_COLORS[id];
      expect(colors.length).toBeGreaterThan(0);
      for (const c of colors) expect(isColor(c)).toBe(true);
    }
    for (const c of COLORS) {
      expect(TERRAIN_IDS.some((id) => TERRAIN_SPRING_COLORS[id].includes(c))).toBe(true);
    }
  });

  it('has consistent placement numbers', () => {
    expect(MAPGEN.springCountWeights.every((w) => w >= 0)).toBe(true);
    expect(MAPGEN.springCountWeights.some((w) => w > 0)).toBe(true);
    expect(MAPGEN.minNations).toBeGreaterThanOrEqual(2);
    expect(MAPGEN.maxNations).toBeGreaterThanOrEqual(MAPGEN.minNations);
    expect(MAPGEN.baseNations).toBeGreaterThanOrEqual(MAPGEN.minNations);
    expect(MAPGEN.baseNations).toBeLessThanOrEqual(MAPGEN.maxNations);
    expect(MAPGEN.capitalBalanceRatio).toBeGreaterThanOrEqual(1);
    expect(MAPGEN.balanceCandidates).toBeGreaterThanOrEqual(1);
    expect(MAPGEN.wellspringSearchStarts).toBeGreaterThanOrEqual(1);
    expect(MAPGEN.wellspringMinSeparation).toBeGreaterThanOrEqual(2);
    expect(MAPGEN.capitalPop % MAPGEN.popRounding).toBe(0);
  });
});

describe('province names', () => {
  it('every terrain has onsets and suffixes, with no repeats within a list', () => {
    for (const id of TERRAIN_IDS) {
      const { onsets, suffixes } = NAME_SYLLABLES[id];
      expect(onsets.length).toBeGreaterThanOrEqual(8);
      expect(suffixes.length).toBeGreaterThanOrEqual(6);
      expect(new Set(onsets).size).toBe(onsets.length);
      expect(new Set(suffixes).size).toBe(suffixes.length);
      for (const o of onsets) expect(o).toMatch(/^[A-Z][a-z]+$/);
      for (const x of suffixes) expect(x).toMatch(/^[a-z]+$/);
    }
    for (const m of NAME_MIDDLES) expect(m).toMatch(/^[a-z]+$/);
  });
});
