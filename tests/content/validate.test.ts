// Content validation (docs/06-architecture.md, "Content validation"): colors, terrain, scales,
// buildings, map generation, names, the pretender chassis and design point costs
// (docs/05-pretender.md steps 1 to 5), and the presets (docs/05 "Presets": every preset fits
// its budget). Unit and nation fixtures live in units.test.ts, spells in spells.test.ts, map
// palette checks in palette.test.ts.
import { describe, expect, it } from 'vitest';
import { nationDef, unitDef, validateContent, type NationDefId } from '../../src/content';
import {
  BUILDING_IDS,
  BUILDINGS,
  CAPITAL_BUILDINGS,
  isBuildingId,
} from '../../src/content/buildings';
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
import { NATIONS } from '../../src/content/nations';
import { CHASSIS, isChassisId, type ChassisDef } from '../../src/content/pretenders/chassis';
import { AWAKENING, PRETENDER_COSTS } from '../../src/content/pretenders/costs';
import { defaultPreset, PRESETS, type PresetDef } from '../../src/content/pretenders/presets';
import {
  NEUTRAL_SCALES,
  SCALE_AXES,
  SCALE_DEFS,
  type Scales,
} from '../../src/content/pretenders/scales';
import type { PretenderDesign } from '../../src/content/pretenders/types';
import { isTerrainId, TERRAIN, TERRAIN_IDS } from '../../src/content/terrain';
import { designBudget, designCost, validatePretender } from '../../src/sim/pretender';

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

describe('scale effects', () => {
  it('match the docs/05-pretender.md table per step, with formula effects both ways', () => {
    const effects = Object.fromEntries(
      SCALE_AXES.flatMap((a) => [
        [SCALE_DEFS[a].positive.name, SCALE_DEFS[a].positive.effects],
        [SCALE_DEFS[a].negative.name, SCALE_DEFS[a].negative.effects],
      ]),
    );
    expect(effects).toEqual({
      Order: { goldPct: 0.07, unrestPerMonth: -2, recruitTimePct: 0.05 },
      Turmoil: { goldPct: -0.07, unrestPerMonth: 2, recruitTimePct: -0.1, eventChancePct: 0.05 },
      Lore: { researchPct: 0.1, precision: 1 },
      Fury: { attack: 1, morale: 1, researchPct: -0.1 },
      Growth: { popGrowth: 0.003, supplyPct: 0.1 },
      Rot: { popGrowth: -0.003, supplyPct: -0.1, tintManaB: 1 },
      Wild: { supplyPct: 0.15, beastCostPct: -0.1, buildTimePct: 0.15, materialsPct: -0.1 },
      Artifice: { materialsPct: 0.1, buildTimePct: -0.15, supplyPct: -0.1 },
      Sanctity: { templeChecks: 1, sacredMorale: 1, templeCostPct: -0.25 },
      Dread: { enemyUnrestPerMonth: 2, undeadUpkeepPct: -0.25, enemyMorale: -1 },
    });
  });
});

describe('buildings', () => {
  it('lists every building once, keyed by its own id', () => {
    expect(Object.keys(BUILDINGS).sort()).toEqual([...BUILDING_IDS].sort());
    for (const id of BUILDING_IDS) expect(BUILDINGS[id].id).toBe(id);
  });

  it('match docs/01-core-rules.md section 7', () => {
    const table = BUILDING_IDS.map((id) => {
      const b = BUILDINGS[id];
      return [id, b.gold, b.materials, b.days, b.buildable];
    });
    expect(table).toEqual([
      ['temple', 200, 0, 30, true],
      ['lab', 300, 0, 30, true],
      ['fort', 600, 300, 150, false],
    ]);
    expect(CAPITAL_BUILDINGS).toEqual(['fort', 'temple', 'lab']);
  });

  it('isBuildingId accepts only building ids', () => {
    for (const id of BUILDING_IDS) expect(isBuildingId(id)).toBe(true);
    for (const bad of ['Temple', 'toString', 'constructor', '', 3, null, undefined]) {
      expect(isBuildingId(bad)).toBe(false);
    }
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

/** Sets obj[key] to value while `run` runs, then puts the old value back. */
function patched<T extends object, K extends keyof T>(
  obj: T,
  key: K,
  value: T[K],
  run: () => void,
): void {
  const saved = obj[key];
  obj[key] = value;
  try {
    run();
  } finally {
    obj[key] = saved;
  }
}

describe('pretender chassis', () => {
  const chassis: ChassisDef[] = Object.values(CHASSIS);

  it('lists the six chassis of docs/05 step 1 in order, keyed by their own ids', () => {
    expect(Object.keys(CHASSIS)).toEqual([
      'oracle',
      'titan',
      'greatWyrm',
      'livingMonolith',
      'wildSpirit',
      'ashColossus',
    ]);
    expect(chassis.map((c) => c.name)).toEqual([
      'Oracle of the Flux',
      'Titan',
      'Great Wyrm',
      'Living Monolith',
      'Wild Spirit',
      'Ash Colossus',
    ]);
    for (const [key, c] of Object.entries(CHASSIS)) {
      expect(c.id).toBe(key);
      expect(isChassisId(key)).toBe(true);
    }
    for (const bad of ['Titan', 'toString', 'constructor', '', 3, null, undefined]) {
      expect(isChassisId(bad)).toBe(false);
    }
  });

  it('match the docs/05 table: cost, base pips, and base dominion', () => {
    expect(chassis.map((c) => [c.id, c.cost, c.basePips, c.baseDominion])).toEqual([
      ['oracle', 20, null, 1],
      ['titan', 120, { color: 'nation', count: 1 }, 2],
      ['greatWyrm', 220, { color: 'nation', count: 2 }, 2],
      ['livingMonolith', 60, null, 4],
      ['wildSpirit', 80, { color: 'G', count: 1 }, 2],
      ['ashColossus', 100, { color: 'R', count: 1 }, 1],
    ]);
  });

  it('give only the Oracle a pip discount and only the Monolith doubled dominion checks', () => {
    expect(chassis.map((c) => [c.id, c.pipDiscount, c.dominionFactor])).toEqual([
      ['oracle', 10, 1],
      ['titan', 0, 1],
      ['greatWyrm', 0, 1],
      ['livingMonolith', 0, 2],
      ['wildSpirit', 0, 1],
      ['ashColossus', 0, 1],
    ]);
  });

  it('each walk the map as their own body: a commander nobody can recruit', () => {
    for (const c of chassis) {
      expect(c.body, c.id).toBe(c.id);
      const body = unitDef(c.body);
      expect(body.commander, c.id).toBeDefined();
      expect(body.cost, c.id).toBeNull();
      expect(body.recruitDays, c.id).toBe(0);
      expect(body.requires, c.id).toEqual([]);
      expect(body.name, c.id).toBe(c.name);
    }
  });

  it('pair each nation with the two chassis that fit it (docs/03)', () => {
    expect(nationDef('cinderHorde').chassis).toEqual(['titan', 'ashColossus']);
    expect(nationDef('thornwood').chassis).toEqual(['wildSpirit', 'livingMonolith']);
  });
});

describe('design point costs', () => {
  it('match docs/05 steps 2 to 5', () => {
    expect(PRETENDER_COSTS).toEqual({
      budget: 400,
      pipLevel: [40, 20, 25, 30, 35, 40],
      newColorFirstPip: 60,
      dominionPoint: 30,
      scaleStep: { own: 20, other: 40 },
    });
  });

  it('refund awakening points and bring the pretender on day 0, Month 12, or Month 36', () => {
    expect(AWAKENING).toEqual({
      awake: { refund: 0, arrivalDay: 0 },
      dormant: { refund: 150, arrivalDay: 330 },
      imprisoned: { refund: 350, arrivalDay: 1050 },
    });
  });
});

/** A design with the given scale steps and neutral elsewhere. */
function preset(
  chassis: string,
  pips: PretenderDesign['pips'],
  dominion: number,
  scales: Partial<Scales>,
  awakening: PretenderDesign['awakening'],
): PretenderDesign {
  return { chassis, pips, dominion, scales: { ...NEUTRAL_SCALES, ...scales }, awakening };
}

/**
 * docs/05 "Presets", with the scale poles as signed steps: Fury is lore −, Turmoil order −,
 * Growth growth +, Wild wild +, Sanctity sanctity +. Deep Root is the one deviation: dominion
 * 7, not 8 (docs/09-balance.md).
 */
const DOCS_PRESETS: readonly [NationDefId, string, string, PretenderDesign][] = [
  [
    'cinderHorde',
    'warlord',
    'Warlord',
    preset('titan', { R: 4 }, 5, { lore: -3, order: -2 }, 'awake'),
  ],
  [
    'cinderHorde',
    'emberOracle',
    'Ember Oracle',
    preset('oracle', { R: 6 }, 4, { lore: -2 }, 'dormant'),
  ],
  [
    'cinderHorde',
    'wildfire',
    'Wildfire',
    preset('ashColossus', { R: 3 }, 6, { order: -3, lore: -3 }, 'imprisoned'),
  ],
  [
    'thornwood',
    'elderOak',
    'Elder Oak',
    preset('titan', { G: 4 }, 5, { growth: 3, wild: 2 }, 'awake'),
  ],
  [
    'thornwood',
    'deepRoot',
    'Deep Root',
    preset('livingMonolith', { G: 3 }, 7, { growth: 3, wild: 3, sanctity: 1 }, 'awake'),
  ],
  [
    'thornwood',
    'wyrmOfTheLoam',
    'Wyrm of the Loam',
    preset('greatWyrm', { G: 4 }, 4, { growth: 2 }, 'dormant'),
  ],
];

function presetById(id: string): PresetDef {
  const found = PRESETS.find((p) => p.id === id);
  if (!found) throw new Error(`no preset ${id}`);
  return found;
}

describe('pretender presets', () => {
  it('are three per nation with unique ids', () => {
    expect(new Set(PRESETS.map((p) => p.id)).size).toBe(PRESETS.length);
    for (const key of Object.keys(NATIONS)) {
      expect(
        PRESETS.filter((p) => p.nation === key),
        key,
      ).toHaveLength(3);
    }
  });

  it('match the docs/05 descriptions: chassis, pips, dominion, scales, awakening', () => {
    expect(PRESETS.map((p) => [p.nation, p.id, p.name, p.design])).toEqual(DOCS_PRESETS);
  });

  it('use one of the six chassis and a color of their own nation', () => {
    for (const p of PRESETS) {
      expect(isChassisId(p.design.chassis), p.id).toBe(true);
      expect(Object.keys(p.design.pips), p.id).toEqual([...nationDef(p.nation).colors]);
    }
  });

  it('each pass validatePretender and cost what docs/05 prices them at', () => {
    // Worked by hand from docs/05 (Red's own poles are Fury and Turmoil, Green's Growth and
    // Wild; Sanctity is White, so 40 a step for Thornwood):
    //   Warlord        Titan 120 + R2..R4 (20+25+30) + 3 dominion (90) + 5 own steps (100)
    //   Ember Oracle   Oracle 20 + R1..R6 (190 - 6 x 10) + 3 dominion (90) + 2 own steps (40)
    //   Wildfire       Colossus 100 + R2..R3 (45) + 5 dominion (150) + 6 own steps (120)
    //   Elder Oak      Titan 120 + G2..G4 (75) + 3 dominion (90) + 5 own steps (100)
    //   Deep Root      Monolith 60 + G1..G3 (85) + 3 dominion (90) + 6 own (120) + Sanctity 40
    //   Wyrm of Loam   Wyrm 220 + G3..G4 (55) + 2 dominion (60) + 2 own steps (40)
    const priced = PRESETS.map((p) => {
      const def = nationDef(p.nation);
      expect(validatePretender(def, p.design), p.id).toBeNull();
      return [p.id, designCost(def, p.design), designBudget(p.design.awakening)];
    });
    expect(priced).toEqual([
      ['warlord', 385, 400],
      ['emberOracle', 280, 550],
      ['wildfire', 415, 750],
      ['elderOak', 385, 400],
      ['deepRoot', 395, 400],
      ['wyrmOfTheLoam', 375, 550],
    ]);
  });

  it('give Deep Root dominion 7, because the docs’ 8 costs 425 of its 400 points', () => {
    const deepRoot = presetById('deepRoot').design;
    expect(deepRoot.dominion).toBe(7);
    const asDocumented = { ...deepRoot, dominion: 8 };
    const green = nationDef('thornwood');
    expect(designCost(green, asDocumented)).toBe(425);
    expect(validatePretender(green, asDocumented)).toBe('The design costs 425 of 400 points');
  });

  it('fit Wildfire only through its imprisonment refund', () => {
    const wildfire = presetById('wildfire').design;
    expect(validatePretender(nationDef('cinderHorde'), { ...wildfire, awakening: 'awake' })).toBe(
      'The design costs 415 of 400 points',
    );
  });

  it('make each nation’s first preset its default', () => {
    expect(defaultPreset('cinderHorde')).toBe(presetById('warlord'));
    expect(defaultPreset('thornwood')).toBe(presetById('elderOak'));
    for (const key of Object.keys(NATIONS) as NationDefId[]) {
      expect(defaultPreset(key)).toBe(PRESETS.find((p) => p.nation === key));
    }
  });
});

describe('content validation of chassis and presets', () => {
  const titan: ChassisDef = CHASSIS.titan;

  it('finds nothing wrong with the shipped content', () => {
    expect(validateContent()).toEqual([]);
  });

  it('reports a chassis whose body is missing, not a commander, or recruitable', () => {
    patched(titan, 'body', 'ashMilitia', () => {
      expect(validateContent()).toEqual(['chassis titan body ashMilitia is not a commander']);
    });
    patched(titan, 'body', 'ashChieftain', () => {
      expect(validateContent()).toEqual(['chassis titan body ashChieftain is recruitable']);
    });
  });

  it('reports a chassis with a wrong id, cost, base pips, base dominion, or modifiers', () => {
    const check = <K extends keyof ChassisDef>(key: K, value: ChassisDef[K], problem: string) => {
      patched(titan, key, value, () => {
        expect(validateContent(), key).toEqual([problem]);
      });
    };
    check('id', 'oracle', 'chassis titan has id oracle');
    check('cost', -1, 'chassis titan bad cost');
    check('basePips', { color: 'nation', count: 0 }, 'chassis titan bad base pips');
    check('baseDominion', 0, 'chassis titan bad base dominion');
    check('baseDominion', 11, 'chassis titan bad base dominion');
    check('pipDiscount', -10, 'chassis titan bad modifiers');
    check('dominionFactor', 0.5, 'chassis titan bad modifiers');
  });

  it('reports presets with a repeated id or an unknown chassis', () => {
    const warlord = presetById('warlord');
    patched(warlord, 'id', 'elderOak', () => {
      expect(validateContent()).toEqual(['preset ids repeat']);
    });
    patched(warlord.design, 'chassis', 'dragon', () => {
      expect(validateContent()).toEqual(['preset warlord chassis']);
    });
  });

  it('reports a nation without exactly three presets', () => {
    patched(presetById('warlord'), 'nation', 'thornwood', () => {
      expect(validateContent()).toEqual([
        'nation cinderHorde needs three presets',
        'nation thornwood needs three presets',
      ]);
    });
  });
});
