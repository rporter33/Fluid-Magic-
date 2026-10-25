// Content validation of the pretender (docs/06-architecture.md, "Content validation";
// docs/05-pretender.md steps 1 to 5 and "Presets"): the chassis, design point costs, the presets
// (every preset fits its budget), and validateContent's chassis and preset checks.
import { describe, expect, it } from 'vitest';
import { nationDef, unitDef, validateContent, type NationDefId } from '../../src/content';
import { NATIONS } from '../../src/content/nations';
import { CHASSIS, isChassisId, type ChassisDef } from '../../src/content/pretenders/chassis';
import { AWAKENING, PRETENDER_COSTS } from '../../src/content/pretenders/costs';
import { defaultPreset, PRESETS, type PresetDef } from '../../src/content/pretenders/presets';
import { NEUTRAL_SCALES, type Scales } from '../../src/content/pretenders/scales';
import type { PretenderDesign } from '../../src/content/pretenders/types';
import { designBudget, designCost, validatePretender } from '../../src/sim/pretender';
import { patched } from './patched';

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
