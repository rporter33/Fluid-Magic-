// Unit and nation content against docs/03-nations.md. CLAUDE.md: every new unit joins these
// fixtures, and any change from the docs is recorded in docs/09-balance.md.
import { describe, expect, it } from 'vitest';
import { nationDef, unitDef, validateContent, type UnitTypeId } from '../../src/content';
import { NATIONS } from '../../src/content/nations';
import { BATTLE } from '../../src/content/rules';
import type { UnitDef } from '../../src/content/types';
import { UNITS } from '../../src/content/units';
import { PRETENDER_UNITS } from '../../src/content/units/pretenders';
import { createGame } from '../../src/sim/createGame';
import { recruitRequirementError } from '../../src/sim/recruitment';
import { nation } from '../sim/fixtures';
import { patched } from './patched';

/** [hp, str, att, def, prot, mor, mapSpeed, gold, materials, pop, recruitDays] per docs/03. */
const TROOPS: Record<string, readonly number[]> = {
  ashMilitia: [10, 10, 9, 8, 1, 9, 2, 8, 3, 10, 8],
  cinderWarrior: [11, 11, 11, 9, 3, 11, 2, 12, 8, 10, 10],
  emberSkirmisher: [10, 10, 10, 11, 1, 10, 3, 11, 4, 10, 10],
  flameArcher: [10, 10, 9, 9, 2, 10, 2, 13, 6, 10, 10],
  berserker: [13, 13, 12, 7, 2, 14, 2, 18, 10, 10, 12],
  ashRider: [12, 11, 11, 11, 4, 11, 3, 28, 18, 20, 14],
  flamebrand: [13, 12, 13, 11, 6, 13, 2, 32, 14, 10, 16],
  thornMilitia: [10, 10, 9, 9, 2, 10, 2, 8, 4, 10, 8],
  warden: [11, 11, 10, 11, 6, 11, 1, 14, 14, 10, 12],
  longbowHunter: [10, 10, 9, 10, 2, 10, 2, 14, 8, 10, 10],
  briarGuard: [12, 12, 11, 10, 9, 12, 1, 24, 26, 10, 14],
  wolfRider: [12, 11, 11, 12, 3, 11, 3, 26, 12, 20, 14],
  oakheart: [16, 14, 11, 9, 10, 13, 1, 36, 22, 10, 18],
};

/** [hp, prot, mor, leadership, holy, gold, materials, pop, recruitDays] per docs/03. */
const COMMANDERS: Record<string, readonly number[]> = {
  cinderScout: [10, 1, 10, 10, 0, 20, 2, 50, 10],
  ashChieftain: [14, 4, 13, 80, 0, 40, 10, 50, 15],
  pyrePriest: [10, 2, 11, 20, 2, 60, 4, 50, 20],
  emberAdept: [10, 1, 10, 10, 0, 70, 2, 50, 20],
  cinderMagus: [11, 2, 11, 20, 1, 160, 4, 50, 30],
  thornScout: [10, 1, 10, 10, 0, 20, 2, 50, 10],
  wardenCaptain: [14, 7, 12, 80, 0, 45, 16, 50, 15],
  grovePriest: [10, 2, 11, 20, 2, 60, 4, 50, 20],
  saplingDruid: [10, 1, 10, 10, 0, 70, 2, 50, 20],
  elderDruid: [11, 2, 11, 20, 1, 160, 4, 50, 30],
};

/** Units that exist but cannot be recruited: summons, independents, the garrison holder. */
const NOT_RECRUITABLE = [
  'fireSprite',
  'salamander',
  'hornetSwarm',
  'treant',
  'wolf',
  'lightInfantry',
  'heavyInfantry',
  'archer',
  'swampFighter',
  'giant',
  'independentCaptain',
  'garrison',
];

/**
 * Pretender bodies per docs/05 (the ten after the Ash Colossus per the build spec's A.4, Phase
 * 6b.3): [hp, str, att, def, prot, mor, size, mapSpeed, leadership].
 */
const BODIES: Record<string, readonly number[]> = {
  oracle: [12, 10, 10, 10, 2, 14, 2, 2, 20],
  titan: [60, 20, 14, 12, 10, 18, 4, 2, 100],
  greatWyrm: [120, 24, 15, 10, 16, 20, 6, 2, 20],
  livingMonolith: [200, 10, 10, 10, 25, 50, 1, 0, 20],
  wildSpirit: [30, 10, 10, 16, 4, 10, 2, 2, 20],
  ashColossus: [80, 22, 10, 10, 14, 10, 5, 2, 20],
  ascendedHero: [32, 15, 15, 15, 8, 20, 2, 3, 100],
  primordial: [150, 22, 12, 6, 14, 30, 6, 1, 20],
  ashPhoenix: [50, 14, 15, 16, 8, 18, 3, 3, 40],
  pyreLord: [55, 18, 13, 12, 8, 18, 4, 2, 80],
  cinderIdol: [180, 14, 10, 6, 22, 50, 6, 0, 40],
  emberHierophant: [14, 10, 10, 11, 2, 14, 2, 2, 30],
  worldTree: [250, 20, 10, 4, 20, 50, 6, 0, 40],
  hornedHunter: [60, 18, 14, 13, 6, 18, 4, 3, 60],
  elderWyrm: [130, 21, 12, 8, 12, 22, 6, 1, 20],
  motherOfBeasts: [70, 18, 12, 11, 8, 20, 4, 2, 60],
};

/** N2's trample, on the Primordial and the Elder Wyrm. */
const TRAMPLE = { name: 'Trample', dmg: 2, strikes: 2, maxTargetSize: 2 };

describe('pretender bodies', () => {
  it.each(Object.entries(BODIES))('%s matches docs/05 and cannot be recruited', (id, stats) => {
    const u = unitDef(id as UnitTypeId);
    expect([u.hp, u.str, u.att, u.def, u.prot, u.mor, u.size, u.mapSpeed]).toEqual(
      stats.slice(0, 8),
    );
    expect(u.commander?.leadership).toBe(stats[8]);
    expect(u.cost).toBeNull();
    // Only the Oracle researches.
    expect(u.commander?.research === false).toBe(id !== 'oracle');
    for (const n of Object.values(NATIONS))
      expect(n.commanders as readonly string[]).not.toContain(id);
  });

  it('give each body its listed traits', () => {
    expect(unitDef('greatWyrm').tags).toContain('flying');
    expect(unitDef('greatWyrm').weapons.find((w) => w.range !== undefined)).toMatchObject({
      dmg: 12,
      range: 3,
      ammo: 5,
    });
    expect(unitDef('livingMonolith').tags).toContain('immobile');
    expect(unitDef('wildSpirit').tags).toContain('stealthy');
    expect(unitDef('wildSpirit').regeneration).toBe(0.1);
    expect(unitDef('ashColossus').fireShield).toBe(5);
    // Phase 6b.3's bodies (A.4).
    expect(unitDef('ashPhoenix').tags).toEqual(['flying']);
    expect(unitDef('ashPhoenix').fireShield).toBe(5);
    expect(unitDef('cinderIdol').tags).toEqual(['immobile']);
    expect(unitDef('worldTree').tags).toEqual(['immobile']);
    expect(unitDef('worldTree').regeneration).toBe(0.1);
    expect(unitDef('elderWyrm').regeneration).toBe(0.1);
    expect(unitDef('emberHierophant').spellPower).toBe(3);
  });

  it('give each new body the abilities of A.4, and no other unit any', () => {
    const all: readonly UnitDef[] = Object.values(UNITS);
    const listing = all
      .filter((u) => (u.abilities ?? []).length > 0)
      .map((u) => [u.id, u.abilities]);
    expect(listing).toEqual([
      ['primordial', ['primordialFear']],
      ['pyreLord', ['kindleTheHost']],
      ['hornedHunter', ['callTheHunt']],
    ]);
    const spellPower = all.filter((u) => u.spellPower !== undefined);
    expect(spellPower.map((u) => u.id)).toEqual(['emberHierophant']);
  });

  it('bring no pips or holy of their own and carry the docs/09 weapons', () => {
    // A pretender's pips come from its design, and its holy pips are 0 (docs/05 decisions).
    for (const id of Object.keys(BODIES)) {
      expect(unitDef(id as UnitTypeId).commander, id).toMatchObject({ pips: {}, holy: 0 });
    }
    // Every body but the Monolith has a melee weapon; only the Wyrm has a ranged one.
    const arms = Object.keys(BODIES).map((id) => [
      id,
      unitDef(id as UnitTypeId).weapons.map((w) => [w.name, w.dmg, w.range ?? null]),
    ]);
    expect(arms).toEqual([
      ['oracle', [['Staff', 2, null]]],
      ['titan', [['Great Sword', 8, null]]],
      [
        'greatWyrm',
        [
          ['Breath', 12, 3],
          ['Bite', 10, null],
        ],
      ],
      ['livingMonolith', []],
      ['wildSpirit', [['Claws', 5, null]]],
      ['ashColossus', [['Burning Fists', 6, null]]],
      ['ascendedHero', [["Hero's Blade", 7, null]]],
      [
        'primordial',
        [
          ['Crushing Blow', 11, null],
          ['Trample', 2, null],
        ],
      ],
      ['ashPhoenix', [['Burning Talons', 8, null]]],
      ['pyreLord', [['Flaming Glaive', 7, null]]],
      ['cinderIdol', []],
      ['emberHierophant', [['Staff', 2, null]]],
      ['worldTree', [['Lashing Boughs', 8, null]]],
      ['hornedHunter', [['Hunting Spear', 7, null]]],
      [
        'elderWyrm',
        [
          ['Bite', 10, null],
          ['Trample', 2, null],
        ],
      ],
      ['motherOfBeasts', [['Maul', 9, null]]],
    ]);
    // The weapons' properties: fire, armor piercing, and trample's strikes and size limit.
    expect(unitDef('primordial').weapons[1]).toEqual(TRAMPLE);
    expect(unitDef('elderWyrm').weapons[1]).toEqual(TRAMPLE);
    expect(unitDef('ashPhoenix').weapons[0]).toEqual({
      name: 'Burning Talons',
      dmg: 8,
      element: 'fire',
      armorPiercing: true,
    });
    expect(unitDef('pyreLord').weapons[0]).toEqual({
      name: 'Flaming Glaive',
      dmg: 7,
      element: 'fire',
    });
    const units: readonly UnitDef[] = Object.values(UNITS);
    const multi = units.filter((u) =>
      u.weapons.some((w) => w.strikes !== undefined || w.maxTargetSize !== undefined),
    );
    expect(multi.map((u) => u.id)).toEqual(['primordial', 'elderWyrm']);
  });

  it('keep each special trait to the bodies docs/05 gives it', () => {
    const has = (id: string, list: readonly string[]) => list.includes(id);
    for (const id of Object.keys(BODIES)) {
      const u = unitDef(id as UnitTypeId);
      expect(u.fireShield ?? 0, id).toBe(has(id, ['ashColossus', 'ashPhoenix']) ? 5 : 0);
      expect(u.regeneration ?? 0, id).toBe(
        has(id, ['wildSpirit', 'worldTree', 'elderWyrm']) ? 0.1 : 0,
      );
      // The color pie (docs/02 section 1): Green never flies, so the Elder Wyrm is wingless.
      expect(u.tags.includes('flying'), id).toBe(has(id, ['greatWyrm', 'ashPhoenix']));
      expect(u.tags.includes('immobile'), id).toBe(
        has(id, ['livingMonolith', 'cinderIdol', 'worldTree']),
      );
      expect(u.tags.includes('stealthy'), id).toBe(id === 'wildSpirit');
      // Immobile bodies have map speed 0, and only they.
      expect(u.mapSpeed === 0, id).toBe(u.tags.includes('immobile'));
    }
  });

  it('are none of them sacred, so the bless never reaches the pretender (docs/05 decisions)', () => {
    for (const u of Object.values(PRETENDER_UNITS)) expect(u.tags, u.id).not.toContain('sacred');
  });
});

describe('content registry', () => {
  it('validates with no problems', () => {
    expect(validateContent()).toEqual([]);
  });

  it('holds exactly the fixture units', () => {
    const fixture = [
      ...Object.keys(TROOPS),
      ...Object.keys(COMMANDERS),
      ...NOT_RECRUITABLE,
      ...Object.keys(BODIES),
    ];
    expect(Object.keys(UNITS).sort()).toEqual([...fixture].sort());
  });

  it('refuses an empty or blank plural (messages name more than one troop with it)', () => {
    expect(unitDef('wolf').plural).toBe('Wolves');
    for (const blank of ['', '  ']) {
      patched(UNITS.wolf, 'plural', blank, () => {
        expect(validateContent(), JSON.stringify(blank)).toEqual(['unit wolf has an empty plural']);
      });
    }
  });
});

describe.each(Object.entries(TROOPS))('troop %s', (id, stats) => {
  it('matches docs/03-nations.md', () => {
    const u = unitDef(id as UnitTypeId);
    expect([u.hp, u.str, u.att, u.def, u.prot, u.mor, u.mapSpeed]).toEqual(stats.slice(0, 7));
    expect([u.cost?.gold, u.cost?.materials, u.cost?.pop, u.recruitDays]).toEqual(stats.slice(7));
    expect(u.commander).toBeUndefined();
  });
});

describe.each(Object.entries(COMMANDERS))('commander %s', (id, stats) => {
  it('matches docs/03-nations.md', () => {
    const u = unitDef(id as UnitTypeId);
    const c = u.commander!;
    expect([u.hp, u.prot, u.mor, c.leadership, c.holy]).toEqual(stats.slice(0, 5));
    expect([u.cost?.gold, u.cost?.materials, u.cost?.pop, u.recruitDays]).toEqual(stats.slice(5));
  });
});

describe('special unit details', () => {
  it('records weapons, tags, pips, and requirements from the tables', () => {
    expect(unitDef('flameArcher').weapons).toEqual([
      { name: 'Fire Arrows', dmg: 6, range: 6, ammo: 10, element: 'fire' },
    ]);
    expect(unitDef('ashRider').weapons[0]).toEqual({ name: 'Lance', dmg: 6, firstRoundBonus: 3 });
    expect(unitDef('hornetSwarm').weapons[0]?.armorNegating).toBe(true);
    expect(unitDef('fireSprite').weapons[0]?.armorPiercing).toBe(true);
    expect(unitDef('berserker').tags).toEqual(['berserk']);
    expect(unitDef('wolfRider').tags).toEqual(['mounted', 'beast']);
    expect(unitDef('oakheart').size).toBe(2);
    expect(unitDef('cinderMagus').commander?.pips).toEqual({ R: 2 });
    expect(unitDef('cinderMagus').commander?.extraPip).toEqual({ color: 'R', chance: 0.25 });
    expect(unitDef('elderDruid').requires).toEqual(['fort', 'lab', 'capital']);
    expect(unitDef('grovePriest').requires).toEqual(['fort', 'temple']);
    expect(unitDef('treant').regeneration).toBe(0.05);
    expect(unitDef('salamander').size).toBe(3);
    expect(unitDef('giant')).toMatchObject({ hp: 40, str: 18, prot: 4, size: 4 });
  });
});

describe('nations', () => {
  it('have one color each in M1', () => {
    for (const n of Object.values(NATIONS)) expect(n.colors).toHaveLength(1);
  });

  it('match their starting armies, research, and AI weights', () => {
    expect(Object.keys(NATIONS)).toEqual(['cinderHorde', 'thornwood']);
    expect(nationDef('cinderHorde')).toMatchObject({
      colors: ['R'],
      homeTerrain: null,
      capitalName: 'Kharnath',
      capitalTerrain: 'plains',
      startingResearch: { color: 'R', level: 1 },
      ai: { aggression: 0.8, expansion: 0.8, research: 0.4, pillage: 0.6 },
    });
    expect(nationDef('thornwood')).toMatchObject({
      colors: ['G'],
      homeTerrain: { terrain: 'forest', def: 1 },
      capitalName: 'Deepmoss',
      capitalTerrain: 'forest',
      startingResearch: { color: 'G', level: 1 },
      ai: { aggression: 0.4, expansion: 0.6, research: 0.7, pillage: 0.1 },
    });
    expect(nationDef('cinderHorde').startingArmy.map((s) => s.commander)).toEqual([
      'ashChieftain',
      'cinderScout',
      'emberAdept',
      'pyrePriest',
    ]);
    expect(nationDef('thornwood').startingArmy[0]?.squads).toEqual([
      { unit: 'warden', count: 20 },
      { unit: 'longbowHunter', count: 10 },
    ]);
  });
});

describe('day-one recruitment', () => {
  it('every nation can recruit its whole unit list at its capital (docs/06 Content validation)', () => {
    const state = createGame({
      seed: 1,
      mapSize: 'medium',
      nations: [nation('cinderHorde'), nation('thornwood')],
    });
    for (const n of Object.values(state.nations)) {
      const def = nationDef(n.def);
      for (const unit of [...def.troops, ...def.commanders]) {
        expect(recruitRequirementError(state, n.id, n.capital, unit), unit).toBeNull();
      }
    }
  });
});

describe('map speeds', () => {
  it('give national commanders speed 3, so troops set the pace', () => {
    for (const n of Object.values(NATIONS)) {
      for (const id of n.commanders) expect(unitDef(id).mapSpeed, id).toBe(3);
    }
    expect(unitDef('ashRider').mapSpeed).toBe(3);
    expect(unitDef('warden').mapSpeed).toBe(1);
  });

  it('each have a closing round in battle, flyers as the fastest', () => {
    for (const u of Object.values(UNITS)) {
      expect(BATTLE.closingRound[u.mapSpeed], u.id).toBeDefined();
    }
    expect(BATTLE.closingRound[BATTLE.flyingSpeed]).toBeDefined();
    expect(BATTLE.closingRound[0]).toBe(BATTLE.closingRound[1]);
  });
});
