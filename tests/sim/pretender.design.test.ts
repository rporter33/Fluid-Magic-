// The design rules of Phase 6b.1 (docs/05-pretender.md; the 2026-10-21 pretender build spec,
// A.3 and A.7): realms (D1), per-chassis new-color prices (D2), scale attunement (D3), the
// minimum awakening (D4), the boons, and the god's name (D7). Older costs and limits are in
// pretender.test.ts; the bless in bless.test.ts; springs in createGame and selectors tests.
import { describe, expect, it } from 'vitest';
import { nationDef } from '../../src/content';
import { CHASSIS, type ChassisDef } from '../../src/content/pretenders/chassis';
import { PRETENDER_COSTS } from '../../src/content/pretenders/costs';
import { NEUTRAL_SCALES, type Scales } from '../../src/content/pretenders/scales';
import type { Awakening, PretenderDesign } from '../../src/content/pretenders/types';
import {
  availableChassis,
  designCost,
  hasAvatar,
  offersChassis,
  pipStepCost,
  scaleStepCost,
  startingSprings,
  validatePretender,
  validatePretenderName,
} from '../../src/sim/pretender';
import { patched } from '../content/patched';
import { pretender, twoNationGame } from './fixtures';

const RED = nationDef('cinderHorde');
const GREEN = nationDef('thornwood');
const TITAN: ChassisDef = CHASSIS.titan;
const WILD_SPIRIT: ChassisDef = CHASSIS.wildSpirit;

function design(overrides: Partial<PretenderDesign>): PretenderDesign {
  return pretender({ awakening: 'awake', ...overrides });
}

function scales(s: Partial<Scales>): Scales {
  return { ...NEUTRAL_SCALES, ...s };
}

const TITAN_R4 = design({ chassis: 'titan', pips: { R: 4 }, dominion: 2 });

describe('realms (D1)', () => {
  it('offer each nation the generic chassis and those of its color, in content order', () => {
    const generic = [
      'oracle',
      'titan',
      'greatWyrm',
      'livingMonolith',
      'ascendedHero',
      'primordial',
    ];
    expect(availableChassis(RED).map((c) => c.id)).toEqual([
      ...generic,
      'ashColossus',
      'ashPhoenix',
      'pyreLord',
      'cinderIdol',
      'emberHierophant',
    ]);
    expect(availableChassis(GREEN).map((c) => c.id)).toEqual([
      ...generic,
      'wildSpirit',
      'worldTree',
      'hornedHunter',
      'elderWyrm',
      'motherOfBeasts',
    ]);
    // Eleven each (build spec D1).
    expect(availableChassis(RED)).toHaveLength(11);
    expect(availableChassis(GREEN)).toHaveLength(11);
    expect(offersChassis(RED, CHASSIS.wildSpirit)).toBe(false);
    expect(offersChassis(GREEN, CHASSIS.ashColossus)).toBe(false);
  });

  it('refuse the new chassis of the other realm by name (Phase 6b.3)', () => {
    const pyre = design({ chassis: 'pyreLord', pips: { R: 2 }, dominion: 2 });
    expect(validatePretender(GREEN, pyre)).toBe('Pyre Lord is not offered to Thornwood');
    expect(validatePretender(RED, pyre)).toBeNull();
    const mother = design({ chassis: 'motherOfBeasts', pips: { G: 1 }, dominion: 2 });
    expect(validatePretender(RED, mother)).toBe('Mother of Beasts is not offered to Cinder Horde');
    expect(validatePretender(GREEN, mother)).toBeNull();
    // The generic ones go to both.
    const hero = design({ chassis: 'ascendedHero', pips: { R: 1 }, dominion: 1 });
    expect(validatePretender(RED, hero)).toBeNull();
    expect(validatePretender(GREEN, { ...hero, pips: { G: 1 } })).toBeNull();
  });

  it('refuse a chassis of another realm by name, before anything else is checked', () => {
    const colossus = design({ chassis: 'ashColossus', pips: { R: 1 }, dominion: 1 });
    expect(validatePretender(GREEN, colossus)).toBe('Ash Colossus is not offered to Thornwood');
    expect(validatePretender(RED, colossus)).toBeNull();
    const spirit = design({ chassis: 'wildSpirit', pips: { G: 1 }, dominion: 2 });
    expect(validatePretender(RED, spirit)).toBe('Wild Spirit is not offered to Cinder Horde');
    expect(validatePretender(RED, { ...spirit, dominion: 99 })).toBe(
      'Wild Spirit is not offered to Cinder Horde',
    );
    // Before the awakening too, whether it is unknown or below the chassis's minimum.
    expect(validatePretender(RED, { ...spirit, awakening: 'asleep' as Awakening })).toBe(
      'Wild Spirit is not offered to Cinder Horde',
    );
    patched(WILD_SPIRIT, 'minAwakening', 'dormant', () => {
      expect(validatePretender(GREEN, spirit)).toBe('Wild Spirit must start at least dormant');
      expect(validatePretender(RED, spirit)).toBe('Wild Spirit is not offered to Cinder Horde');
    });
    expect(() => twoNationGame(1, { pretender: spirit })).toThrow(
      'Wild Spirit is not offered to Cinder Horde',
    );
  });

  it('follow the realm field, so a patched realm opens or closes a chassis', () => {
    patched(TITAN, 'realm', 'G', () => {
      expect(validatePretender(RED, TITAN_R4)).toBe('Titan is not offered to Cinder Horde');
      expect(availableChassis(GREEN).map((c) => c.id)).toContain('titan');
    });
  });
});

describe('new-color prices (D2)', () => {
  it('are per chassis: 40 for the Oracle (30 after its discount), 50 to 80 for the others', () => {
    expect(PRETENDER_COSTS).not.toHaveProperty('newColorFirstPip');
    expect(pipStepCost(RED, CHASSIS.oracle, 'U', 1)).toBe(30);
    expect(pipStepCost(RED, CHASSIS.titan, 'U', 1)).toBe(60);
    expect(pipStepCost(RED, CHASSIS.greatWyrm, 'U', 1)).toBe(80);
    expect(pipStepCost(RED, CHASSIS.livingMonolith, 'U', 1)).toBe(50);
    expect(pipStepCost(RED, CHASSIS.ashColossus, 'G', 1)).toBe(60);
    expect(pipStepCost(GREEN, CHASSIS.wildSpirit, 'R', 1)).toBe(80);
  });

  it('apply to the first pip of a new color only; own colors and later pips keep the table', () => {
    expect(pipStepCost(RED, CHASSIS.greatWyrm, 'R', 1)).toBe(40);
    expect(pipStepCost(RED, CHASSIS.greatWyrm, 'U', 2)).toBe(20);
    expect(pipStepCost(RED, CHASSIS.oracle, 'U', 2)).toBe(10);
    // Great Wyrm R2 G2: 220 + 80 + 20.
    const wyrm = design({ chassis: 'greatWyrm', pips: { R: 2, G: 2 }, dominion: 2 });
    expect(designCost(RED, wyrm)).toBe(320);
    // Living Monolith with a Red pip for Thornwood: 60 + 50.
    const monolith = design({ chassis: 'livingMonolith', pips: { R: 1 }, dominion: 4 });
    expect(designCost(GREEN, monolith)).toBe(110);
  });
});

describe('the new chassis records (Phase 6b.3, build spec A.3 and A.4)', () => {
  it('price a new color per chassis: 40, 50, 60 or 80 before the discount', () => {
    const firsts = (Object.keys(CHASSIS) as (keyof typeof CHASSIS)[]).map((id) => [
      id,
      pipStepCost(CHASSIS[id].realm === 'G' ? GREEN : RED, CHASSIS[id], 'U', 1),
    ]);
    expect(Object.fromEntries(firsts)).toEqual({
      oracle: 30,
      titan: 60,
      greatWyrm: 80,
      livingMonolith: 50,
      ascendedHero: 50,
      primordial: 80,
      ashColossus: 60,
      ashPhoenix: 80,
      pyreLord: 60,
      cinderIdol: 50,
      emberHierophant: 40,
      wildSpirit: 80,
      worldTree: 50,
      hornedHunter: 60,
      elderWyrm: 80,
      motherOfBeasts: 60,
    });
  });

  it('attune the Phoenix to Growth, the Idol to Dread, the Tree to Sanctity, the Hunter to Fury', () => {
    expect(scaleStepCost(RED, CHASSIS.ashPhoenix, 'growth', 'positive')).toBe(20);
    // A Phoenix's Rot step still costs 40.
    expect(scaleStepCost(RED, CHASSIS.ashPhoenix, 'growth', 'negative')).toBe(40);
    expect(scaleStepCost(RED, CHASSIS.cinderIdol, 'sanctity', 'negative')).toBe(20);
    expect(scaleStepCost(RED, CHASSIS.cinderIdol, 'sanctity', 'positive')).toBe(40);
    expect(scaleStepCost(GREEN, CHASSIS.worldTree, 'sanctity', 'positive')).toBe(20);
    expect(scaleStepCost(GREEN, CHASSIS.worldTree, 'sanctity', 'negative')).toBe(40);
    expect(scaleStepCost(GREEN, CHASSIS.hornedHunter, 'lore', 'negative')).toBe(20);
    expect(scaleStepCost(GREEN, CHASSIS.hornedHunter, 'lore', 'positive')).toBe(40);
    // Without the attunement the same steps cost 40.
    expect(scaleStepCost(RED, CHASSIS.pyreLord, 'growth', 'positive')).toBe(40);
    expect(scaleStepCost(GREEN, CHASSIS.motherOfBeasts, 'lore', 'negative')).toBe(40);
  });

  it('make the Primordial sleep: refused awake, valid dormant or imprisoned', () => {
    const primordial = design({ chassis: 'primordial', pips: { R: 2 }, dominion: 3 });
    expect(validatePretender(RED, primordial)).toBe('Primordial must start at least dormant');
    expect(validatePretender(RED, { ...primordial, awakening: 'dormant' })).toBeNull();
    expect(validatePretender(RED, { ...primordial, awakening: 'imprisoned' })).toBeNull();
    expect(designCost(RED, primordial)).toBe(220);
  });

  it('give the World Tree one Green spring at the capital, before any Sacred Spring', () => {
    const tree = design({ chassis: 'worldTree', pips: { G: 2 }, dominion: 4 });
    expect(startingSprings(GREEN, tree)).toEqual(['G']);
    const both = { ...tree, boons: [{ id: 'sacredSpring', color: 'G' }] } as const;
    expect(startingSprings(GREEN, both)).toEqual(['G', 'G']);
    expect(designCost(GREEN, both)).toBe(190);
  });

  it('build Avatar into the Ascended Hero, which refuses the boon', () => {
    const hero = design({ chassis: 'ascendedHero', pips: { R: 1 }, dominion: 1 });
    expect(hasAvatar(hero)).toBe(true);
    expect(designCost(RED, hero)).toBe(100);
    expect(validatePretender(RED, { ...hero, boons: [{ id: 'avatar' }] })).toBe(
      'Ascended Hero already has Avatar',
    );
    expect(hasAvatar(design({ chassis: 'titan', pips: { R: 1 }, dominion: 2 }))).toBe(false);
  });

  it('price the base pips and dominion of each new chassis into its cost', () => {
    // Base pips are free and dominion at the base costs nothing, so each bare design costs
    // exactly its chassis.
    const bare = (Object.keys(CHASSIS) as (keyof typeof CHASSIS)[]).map((id) => {
      const c = CHASSIS[id];
      const def = c.realm === 'G' ? GREEN : RED;
      const count = c.basePips?.count ?? 0;
      const d = design({
        chassis: id,
        pips: count > 0 ? { [def.colors[0]]: count } : {},
        dominion: c.baseDominion,
        awakening: c.id === 'primordial' ? 'dormant' : 'awake',
      });
      expect(validatePretender(def, d), id).toBeNull();
      return designCost(def, d) === c.cost;
    });
    expect(bare.every(Boolean)).toBe(true);
  });
});

describe('scale attunement (D3)', () => {
  const attuned: ChassisDef = { ...TITAN, attunement: [{ axis: 'growth', toward: 'positive' }] };

  it('prices a step toward an attuned pole at the own-color 20, whatever its color', () => {
    expect(scaleStepCost(RED, attuned, 'growth', 'positive')).toBe(20);
    // The other pole of the axis keeps its price.
    expect(scaleStepCost(RED, attuned, 'growth', 'negative')).toBe(40);
    expect(scaleStepCost(RED, attuned, 'lore', 'positive')).toBe(40);
    // Toward an own-color pole it is 20 anyway; nothing is refunded below that.
    expect(scaleStepCost(GREEN, attuned, 'growth', 'positive')).toBe(20);
    expect(scaleStepCost(RED, TITAN, 'growth', 'positive')).toBe(40);
  });

  it('reaches designCost and validation through the chassis record', () => {
    const grower = { ...TITAN_R4, scales: scales({ growth: 3 }) };
    expect(designCost(RED, grower)).toBe(195 + 120);
    patched(TITAN, 'attunement', [{ axis: 'growth', toward: 'positive' }], () => {
      expect(designCost(RED, grower)).toBe(195 + 60);
      expect(designCost(RED, { ...grower, scales: scales({ growth: -2 }) })).toBe(195 + 80);
      expect(validatePretender(RED, { ...grower, scales: scales({ growth: 4 }) })).toBe(
        'Scales run from -3 to 3',
      );
    });
  });
});

describe('minimum awakening (D4)', () => {
  it('refuses a chassis awake below its minimum, and allows it at or beyond', () => {
    patched(TITAN, 'minAwakening', 'dormant', () => {
      expect(validatePretender(RED, TITAN_R4)).toBe('Titan must start at least dormant');
      expect(validatePretender(RED, { ...TITAN_R4, awakening: 'dormant' })).toBeNull();
      expect(validatePretender(RED, { ...TITAN_R4, awakening: 'imprisoned' })).toBeNull();
      // Not a price: the design costs the same, and the refund is the awakening's as always.
      expect(designCost(RED, { ...TITAN_R4, awakening: 'dormant' })).toBe(195);
    });
    patched(TITAN, 'minAwakening', 'imprisoned', () => {
      expect(validatePretender(RED, { ...TITAN_R4, awakening: 'dormant' })).toBe(
        'Titan must start at least imprisoned',
      );
    });
    expect(validatePretender(RED, TITAN_R4)).toBeNull();
  });
});

describe('boons', () => {
  const spring = { id: 'sacredSpring', color: 'R' } as const;
  const avatar = { id: 'avatar' } as const;

  it('cost 40 design points each', () => {
    expect(designCost(RED, { ...TITAN_R4, boons: [spring] })).toBe(235);
    expect(designCost(RED, { ...TITAN_R4, boons: [avatar] })).toBe(235);
    expect(designCost(RED, { ...TITAN_R4, boons: [spring, avatar] })).toBe(275);
    expect(designCost(RED, { ...TITAN_R4, boons: [] })).toBe(195);
  });

  it('are refused unknown, twice, a spring without a pip in its color, or Avatar built in', () => {
    const withBoons = (boons: unknown) =>
      validatePretender(RED, { ...TITAN_R4, boons } as PretenderDesign);
    expect(withBoons([spring, avatar])).toBeNull();
    expect(withBoons([{ id: 'ironWill' }])).toBe('Unknown boon ironWill');
    expect(withBoons([avatar, avatar])).toBe('Avatar is chosen twice');
    expect(withBoons([spring, { id: 'sacredSpring', color: 'R' }])).toBe(
      'Sacred Spring is chosen twice',
    );
    expect(withBoons([{ id: 'sacredSpring', color: 'G' }])).toBe(
      'A Sacred Spring needs a pip in its color',
    );
    expect(withBoons([{ id: 'sacredSpring', color: 'X' }])).toBe(
      'A Sacred Spring needs a pip in its color',
    );
    patched(TITAN, 'avatar', true, () => {
      expect(withBoons([avatar])).toBe('Titan already has Avatar');
      expect(hasAvatar(TITAN_R4)).toBe(true);
      // A built-in Avatar is priced in the chassis: the design pays no boon for it.
      expect(designCost(RED, TITAN_R4)).toBe(195);
    });
  });

  it('are checked after the blessings', () => {
    expect(
      validatePretender(RED, {
        ...TITAN_R4,
        blessings: ['flamingWeapons'],
        boons: [avatar, avatar],
      }),
    ).toBe('Flaming Weapons needs R5');
  });

  it('count against the budget', () => {
    // Titan R5 at dominion 7 with Fury 1 costs exactly 400; a boon tips it over.
    const exact = design({
      chassis: 'titan',
      pips: { R: 5 },
      dominion: 7,
      scales: scales({ lore: -1 }),
    });
    expect(validatePretender(RED, exact)).toBeNull();
    expect(validatePretender(RED, { ...exact, boons: [avatar] })).toBe(
      'The design costs 440 of 400 points',
    );
  });

  it('are the only choice that costs design points: blessings are paid in bless points', () => {
    expect(designCost(RED, { ...TITAN_R4, blessings: ['emberWrath'] })).toBe(195);
    expect(designCost(RED, { ...TITAN_R4, blessings: ['emberMight', 'fervor'] })).toBe(195);
    expect(designCost(RED, { ...TITAN_R4, blessings: [] })).toBe(195);
    expect(designCost(RED, TITAN_R4)).toBe(195);
    // A design at exactly the budget still validates with a chosen blessing.
    const exact = design({
      chassis: 'titan',
      pips: { R: 5 },
      dominion: 7,
      scales: scales({ lore: -1 }),
      blessings: ['furyUnbound'],
    });
    expect(designCost(RED, exact)).toBe(400);
    expect(validatePretender(RED, exact)).toBeNull();
  });

  it('give Avatar through the boon or the chassis, and springs at the capital', () => {
    expect(hasAvatar(TITAN_R4)).toBe(false);
    expect(hasAvatar({ ...TITAN_R4, boons: [avatar] })).toBe(true);
    expect(startingSprings(RED, TITAN_R4)).toEqual([]);
    expect(startingSprings(RED, { ...TITAN_R4, boons: [spring] })).toEqual(['R']);
    // The chassis's springs come first, then the boon's; 'nation' is the primary color.
    patched(TITAN, 'startSprings', { color: 'nation', count: 2 }, () => {
      expect(startingSprings(GREEN, { ...TITAN_R4, boons: [spring] })).toEqual(['G', 'G', 'R']);
    });
  });
});

describe('the god’s name (D7)', () => {
  it('accepts 1 to 24 Latin letters, spaces, apostrophes, hyphens and periods', () => {
    for (const name of [
      'V',
      'Vulkra',
      "Ysolde d'Ash",
      'Old Mother Oak-Heart',
      'St. Ember',
      'x'.repeat(24),
    ]) {
      expect(validatePretenderName(name), name).toBeNull();
    }
  });

  it('refuses an empty or long name, another symbol, a bad start, end, or double space', () => {
    const LENGTH =
      "A god's name has 1 to 24 symbols (letters, spaces, apostrophes, hyphens, periods)";
    const SYMBOLS =
      "A god's name may use only Latin letters, spaces, apostrophes, hyphens and periods";
    expect(validatePretenderName('')).toBe(LENGTH);
    expect(validatePretenderName('x'.repeat(25))).toBe(LENGTH);
    // The limit counts symbols, not letters: 23 letters and 2 spaces are 25.
    expect(validatePretenderName('Abcdefghij Klmnopqrst Uvw')).toBe(LENGTH);
    expect(validatePretenderName('Abcdefghij Klmnopqrst Uv')).toBeNull();
    // Another script is refused for its symbols, whatever its length in UTF-16 units.
    expect(validatePretenderName('\u{1D400}'.repeat(13))).toBe(SYMBOLS);
    expect(validatePretenderName('Ы'.repeat(30))).toBe(SYMBOLS);
    for (const bad of ['Vulkra2', 'Vül', 'Ысольда', 'A_B', 'Fire!', 'Tab\tName', 'Me😀']) {
      expect(validatePretenderName(bad), bad).toBe(SYMBOLS);
    }
    expect(validatePretenderName(' Vulkra')).toBe("A god's name must start with a letter");
    expect(validatePretenderName("'Vulkra")).toBe("A god's name must start with a letter");
    expect(validatePretenderName('-')).toBe("A god's name must start with a letter");
    expect(validatePretenderName('Vulkra ')).toBe("A god's name may not end with a space");
    expect(validatePretenderName('Vulkra  the')).toBe(
      "A god's name may not hold two spaces in a row",
    );
  });
});
