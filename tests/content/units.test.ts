// Unit and nation content against docs/03-nations.md. CLAUDE.md: every new unit joins these
// fixtures, and any change from the docs is recorded in docs/09-balance.md.
import { describe, expect, it } from 'vitest';
import { nationDef, unitDef, validateContent, type UnitTypeId } from '../../src/content';
import { NATIONS } from '../../src/content/nations';
import { BATTLE } from '../../src/content/rules';
import { UNITS } from '../../src/content/units';
import { createGame } from '../../src/sim/createGame';
import { recruitRequirementError } from '../../src/sim/recruitment';
import { nation } from '../sim/fixtures';

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

describe('content registry', () => {
  it('validates with no problems', () => {
    expect(validateContent()).toEqual([]);
  });

  it('holds exactly the fixture units', () => {
    const fixture = [...Object.keys(TROOPS), ...Object.keys(COMMANDERS), ...NOT_RECRUITABLE];
    expect(Object.keys(UNITS).sort()).toEqual([...fixture].sort());
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
