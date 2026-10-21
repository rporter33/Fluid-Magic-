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
