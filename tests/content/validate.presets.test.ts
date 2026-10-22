// Content validation of the pretender presets (docs/06-architecture.md, "Content validation";
// docs/05-pretender.md "Presets"): six per nation, the Phase 6 six as docs/05 describes them,
// each of its nation's realm and colors, each valid and within its budget, and validateContent's
// preset checks. tests/content/presets.test.ts pins their behavior.
import { describe, expect, it } from 'vitest';
import { nationDef, validateContent, type NationDefId } from '../../src/content';
import { NATIONS } from '../../src/content/nations';
import { CHASSIS, isChassisId } from '../../src/content/pretenders/chassis';
import { defaultPreset, PRESETS, type PresetDef } from '../../src/content/pretenders/presets';
import { NEUTRAL_SCALES, type Scales } from '../../src/content/pretenders/scales';
import type { PretenderDesign } from '../../src/content/pretenders/types';
import { designBudget, designCost, validatePretender } from '../../src/sim/pretender';
import { patched } from './patched';

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
  it('are six per nation with unique ids', () => {
    expect(new Set(PRESETS.map((p) => p.id)).size).toBe(PRESETS.length);
    for (const key of Object.keys(NATIONS)) {
      expect(
        PRESETS.filter((p) => p.nation === key),
        key,
      ).toHaveLength(6);
    }
  });

  it('match the docs/05 descriptions: chassis, pips, dominion, scales, awakening', () => {
    // The six of Phase 6 come first; tests/content/presets.test.ts pins the six of Phase 6b.3.
    expect(PRESETS.slice(0, 6).map((p) => [p.nation, p.id, p.name, p.design])).toEqual(
      DOCS_PRESETS,
    );
  });

  it('use a chassis of their nation’s realm and a color of their own nation', () => {
    for (const p of PRESETS) {
      expect(isChassisId(p.design.chassis), p.id).toBe(true);
      const realm = isChassisId(p.design.chassis) ? CHASSIS[p.design.chassis].realm : 'none';
      expect(['generic', ...nationDef(p.nation).colors], p.id).toContain(realm);
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
    // And for Phase 6b.3 (attuned poles at 20: Growth for the Phoenix, Dread for the Idol,
    // Sanctity for the Tree, Fury for the Hunter):
    //   Undying Flame  Phoenix 120 + R2..R4 (75) + 3 dominion (90) + 5 steps (100)
    //   Pyre Host      Pyre Lord 140 + R3..R4 (55) + 3 dominion (90) + 5 own steps (100)
    //   Dread Idol     Idol 110 + R3..R4 (55) + 5 dominion (150) + 4 steps (80)
    //   Heartwood      Tree 150 + G3..G4 (55) + 3 dominion (90) + 5 steps (100)
    //   Hunt Lord      Hunter 140 + G3..G4 (55) + 2 dominion (60) + 7 steps (140)
    //   Mother of Pack Mother 130 + G2..G4 (75) + 3 dominion (90) + 5 own steps (100)
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
      ['undyingFlame', 385, 400],
      ['pyreHost', 385, 400],
      ['dreadIdol', 395, 400],
      ['heartwood', 395, 400],
      ['huntLord', 395, 400],
      ['motherOfThePack', 395, 400],
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

describe('content validation of presets', () => {
  it('reports presets with a repeated id or an unknown chassis', () => {
    const warlord = presetById('warlord');
    patched(warlord, 'id', 'elderOak', () => {
      expect(validateContent()).toEqual(['preset ids repeat']);
    });
    patched(warlord.design, 'chassis', 'dragon', () => {
      expect(validateContent()).toEqual(['preset warlord chassis']);
    });
  });

  it('reports a nation without exactly six presets', () => {
    patched(presetById('warlord'), 'nation', 'thornwood', () => {
      expect(validateContent()).toEqual([
        'nation cinderHorde needs 6 presets',
        'nation thornwood needs 6 presets',
      ]);
    });
  });
});
