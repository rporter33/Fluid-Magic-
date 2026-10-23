// Blessings folded into battle setups (docs/02-magic.md decisions, "Blessing folds";
// docs/05-pretender.md Steps 6 and 7): shields, weapon blessings, the first-round bonus and
// berserk on sacred units, the prophet and an Avatar god; incarnate blessings only while the
// god stands; and Avatar, which blesses the god itself only in its own dominion, attacking or
// defending.
import { describe, expect, it } from 'vitest';
import { unitDef, type UnitTypeId } from '../../../src/content';
import { NEUTRAL_SCALES } from '../../../src/content/pretenders/scales';
import type { PretenderDesign } from '../../../src/content/pretenders/types';
import type { WeaponDef } from '../../../src/content/types';
import { buildBattle, type SideForces } from '../../../src/sim/battle/setup';
import type { NationId, ProvinceId } from '../../../src/sim/ids';
import type { CommanderState, GameState } from '../../../src/sim/types';
import { patched } from '../../content/patched';
import { addArmy, independentProvince, nationIds, pretender, twoNationGame } from '../fixtures';

/** A fire shield of this amount, as CombatStats.shields holds it. */
const fire = (amount: number) => [{ element: 'fire', amount }];

function forces(nation: NationId | null, commanders: CommanderState[]): SideForces {
  return { nation, commanders, garrison: null, pd: false };
}

/** An awake Titan of these pips and choices, for the nation in `slot`. */
function titan(pips: PretenderDesign['pips'], extra: Partial<PretenderDesign> = {}) {
  return pretender({ chassis: 'titan', pips, dominion: 2, awakening: 'awake', ...extra });
}

function gameWith(slot: 0 | 1, design: PretenderDesign) {
  const state =
    slot === 0
      ? twoNationGame(1, { pretender: design })
      : twoNationGame(1, {}, { pretender: design });
  const nation = nationIds(state)[slot]!;
  return { state, nation, capital: state.nations[nation]!.capital };
}

/** The stats of a squad of `unit` defending in `at`, led by an Ash Chieftain. */
function squadStats(state: GameState, nation: NationId, at: ProvinceId, unit: UnitTypeId) {
  const army = addArmy(state, nation, at, unit, 5);
  const setup = buildBattle(state, at, forces(null, []), forces(nation, [army]));
  return setup.defender.squads[0]!.stats;
}

/**
 * The stats of the nation's awake god and of its prophet (an Ash Chieftain leading Cinder
 * Warriors) defending together in `at`.
 */
function godAndProphet(state: GameState, nation: NationId, at: ProvinceId) {
  const god = state.commanders[state.nations[nation]!.pretenderId!]!;
  god.location = at;
  const prophet = addArmy(state, nation, at, 'cinderWarrior', 5);
  state.nations[nation]!.prophetId = prophet.id;
  const setup = buildBattle(state, at, forces(null, []), forces(nation, [god, prophet]));
  const [g, p] = setup.defender.commanders;
  return { god: g!.stats, prophet: p!.stats };
}

/** A unit's melee weapons with these changes, its ranged ones as they are. */
function meleeWith(unit: UnitTypeId, change: (w: WeaponDef) => WeaponDef): WeaponDef[] {
  const weapons = unitDef(unit).weapons;
  expect(weapons.some((w) => w.range === undefined)).toBe(true);
  return weapons.map((w) => (w.range === undefined ? change(w) : w));
}

function godStats(state: GameState, nation: NationId, at: ProvinceId) {
  const god = state.commanders[state.nations[nation]!.pretenderId!]!;
  god.location = at;
  const setup = buildBattle(state, at, forces(null, []), forces(nation, [god]));
  return setup.defender.commanders[0]!.stats;
}

describe('blessing folds on sacred units', () => {
  it('leave the unit’s own weapon and tag lists untouched when no blessing changes them', () => {
    const { state, nation, capital } = gameWith(0, titan({ R: 6 }));
    const stats = squadStats(state, nation, capital, 'flamebrand');
    expect(stats.weapons).toBe(unitDef('flamebrand').weapons);
    expect(stats.tags).toBe(unitDef('flamebrand').tags);
    expect(stats.shields).toEqual([]);
    expect(stats).toMatchObject({ att: unitDef('flamebrand').att + 4 });
  });

  it('give Cinder Skin’s fire shield 3 to sacreds and to nobody else', () => {
    const { state, nation, capital } = gameWith(0, titan({ R: 4 }, { blessings: ['cinderSkin'] }));
    expect(squadStats(state, nation, capital, 'flamebrand').shields).toEqual(fire(3));
    expect(squadStats(state, nation, capital, 'cinderWarrior').shields).toEqual([]);
  });

  it('give Flaming Weapons +3 fire armor piercing: a fire blade stays fire, a maul becomes fire', () => {
    const red = gameWith(0, titan({ R: 5 }, { blessings: ['flamingWeapons'] }));
    const blade = squadStats(red.state, red.nation, red.capital, 'flamebrand').weapons;
    expect(blade).toEqual([
      { name: 'Burning Blade', dmg: 9, element: 'fire', armorPiercing: true },
    ]);
    // Thornwood's god with Red pips: the Oak Maul takes fire.
    const green = gameWith(1, titan({ G: 1, R: 5 }, { blessings: ['flamingWeapons'] }));
    const maul = squadStats(green.state, green.nation, green.capital, 'oakheart').weapons;
    expect(maul).toEqual([{ name: 'Oak Maul', dmg: 12, element: 'fire', armorPiercing: true }]);
    // The content records are never changed.
    expect(unitDef('oakheart').weapons).toEqual([{ name: 'Oak Maul', dmg: 9 }]);
  });

  it('give Blazing Charge +5 in the first melee round to melee weapons only', () => {
    const { state, nation, capital } = gameWith(
      0,
      titan({ R: 4 }, { blessings: ['blazingCharge'] }),
    );
    const bow: WeaponDef = { name: 'Fire Bow', dmg: 5, range: 6, ammo: 4 };
    const lance: WeaponDef = { name: 'Lance', dmg: 4, firstRoundBonus: 3 };
    patched(unitDef('flamebrand'), 'weapons', [bow, lance], () => {
      const stats = squadStats(state, nation, capital, 'flamebrand');
      expect(stats.weapons).toEqual([bow, { ...lance, firstRoundBonus: 8 }]);
      expect(stats.weapons[0]).toBe(bow);
      expect(stats.mor).toBe(unitDef('flamebrand').mor + 1);
    });
  });

  it('give Fury Unbound the berserk tag, once', () => {
    const design = titan(
      { R: 5 },
      { blessings: ['furyUnbound'], scales: { ...NEUTRAL_SCALES, lore: -1 } },
    );
    const { state, nation, capital } = gameWith(0, design);
    expect(squadStats(state, nation, capital, 'flamebrand').tags).toEqual(['sacred', 'berserk']);
    patched(unitDef('flamebrand'), 'tags', ['sacred', 'berserk'], () => {
      expect(squadStats(state, nation, capital, 'flamebrand').tags).toEqual(['sacred', 'berserk']);
    });
  });

  it('drop an incarnate blessing while the god is away, keeping the others', () => {
    const design = titan({ R: 6 }, { blessings: ['livingPyre'], awakening: 'dormant' });
    const { state, nation, capital } = gameWith(0, design);
    expect(state.nations[nation]!.pretenderId).toBeNull();
    const base = unitDef('flamebrand');
    expect(squadStats(state, nation, capital, 'flamebrand')).toMatchObject({
      att: base.att,
      shields: [],
    });
    const awake = gameWith(0, { ...design, awakening: 'awake' });
    expect(squadStats(awake.state, awake.nation, awake.capital, 'flamebrand')).toMatchObject({
      att: base.att + 2,
      shields: fire(5),
    });
  });
});

describe('Avatar', () => {
  const avatar = { boons: [{ id: 'avatar' as const }] };

  it('blesses the god in a province its nation dominates, and nowhere else', () => {
    const { state, nation, capital } = gameWith(0, titan({ R: 4 }, avatar));
    const body = unitDef('titan');
    expect(godStats(state, nation, capital)).toMatchObject({
      att: body.att + 2,
      str: body.str + 2,
    });
    const wild = independentProvince(state);
    expect(wild.dominion.nation).toBeNull();
    expect(godStats(state, nation, wild.id)).toMatchObject({ att: body.att, str: body.str });
    // Dominion at strength 0 is no dominion; the enemy's never blesses.
    wild.dominion = { nation, strength: 0 };
    expect(godStats(state, nation, wild.id)).toMatchObject({ att: body.att });
    wild.dominion = { nation: nationIds(state)[1]!, strength: 5 };
    expect(godStats(state, nation, wild.id)).toMatchObject({ att: body.att });
    wild.dominion = { nation, strength: 1 };
    expect(godStats(state, nation, wild.id)).toMatchObject({ att: body.att + 2 });
  });

  it('carries incarnate blessings too, while the god without it stays unblessed', () => {
    const pyre = { blessings: ['livingPyre'] };
    const blessed = gameWith(0, titan({ R: 6 }, { ...pyre, ...avatar }));
    expect(godStats(blessed.state, blessed.nation, blessed.capital)).toMatchObject({
      att: unitDef('titan').att + 2,
      shields: fire(5),
    });
    const plain = gameWith(0, titan({ R: 6 }, pyre));
    expect(godStats(plain.state, plain.nation, plain.capital)).toMatchObject({
      att: unitDef('titan').att,
      shields: [],
    });
  });
});

describe('the Ascended Hero’s built-in Avatar (Phase 6b.3)', () => {
  it('blesses the Hero in its own dominion without the boon, and nowhere else', () => {
    const hero = pretender({
      chassis: 'ascendedHero',
      pips: { R: 4 },
      dominion: 1,
      awakening: 'awake',
    });
    const { state, nation, capital } = gameWith(0, hero);
    const body = unitDef('ascendedHero');
    expect(godStats(state, nation, capital)).toMatchObject({
      att: body.att + 2,
      str: body.str + 2,
    });
    const wild = independentProvince(state);
    expect(godStats(state, nation, wild.id)).toMatchObject({ att: body.att, str: body.str });
  });
});

describe('the prophet and an Avatar god', () => {
  const avatar = { boons: [{ id: 'avatar' as const }] };

  it('take the weapon blessings: Flaming Weapons and Blazing Charge', () => {
    const flaming = gameWith(0, titan({ R: 5 }, { blessings: ['flamingWeapons'], ...avatar }));
    const fire = godAndProphet(flaming.state, flaming.nation, flaming.capital);
    expect(fire.god.weapons).toEqual([
      { name: 'Great Sword', dmg: 11, element: 'fire', armorPiercing: true },
    ]);
    expect(fire.prophet.weapons).toEqual(
      meleeWith('ashChieftain', (w) => ({
        ...w,
        dmg: w.dmg + 3,
        element: 'fire',
        armorPiercing: true,
      })),
    );
    const charge = gameWith(0, titan({ R: 4 }, { blessings: ['blazingCharge'], ...avatar }));
    const first = godAndProphet(charge.state, charge.nation, charge.capital);
    expect(first.god.weapons).toEqual([{ name: 'Great Sword', dmg: 8, firstRoundBonus: 5 }]);
    expect(first.prophet.weapons).toEqual(
      meleeWith('ashChieftain', (w) => ({ ...w, firstRoundBonus: (w.firstRoundBonus ?? 0) + 5 })),
    );
  });

  it('take a blessing’s shield: Cinder Skin gives the prophet fire shield 3', () => {
    const plain = gameWith(0, titan({ R: 4 }, { blessings: ['cinderSkin'] }));
    const without = godAndProphet(plain.state, plain.nation, plain.capital);
    expect(without.prophet.shields).toEqual(fire(3));
    // The god without Avatar stays unblessed; with it, it is shielded too.
    expect(without.god.shields).toEqual([]);
    const blessed = gameWith(0, titan({ R: 4 }, { blessings: ['cinderSkin'], ...avatar }));
    expect(godAndProphet(blessed.state, blessed.nation, blessed.capital).god.shields).toEqual(
      fire(3),
    );
  });

  it('take Fury Unbound’s berserk tag', () => {
    const design = titan(
      { R: 5 },
      { blessings: ['furyUnbound'], scales: { ...NEUTRAL_SCALES, lore: -1 }, ...avatar },
    );
    const { state, nation, capital } = gameWith(0, design);
    const { god, prophet } = godAndProphet(state, nation, capital);
    expect(god.tags).toContain('berserk');
    expect(prophet.tags).toContain('berserk');
  });

  it('bless an Avatar god that attacks into its dominion as one that defends there', () => {
    const { state, nation } = gameWith(0, titan({ R: 4 }, avatar));
    const wild = independentProvince(state);
    const god = state.commanders[state.nations[nation]!.pretenderId!]!;
    god.location = wild.id;
    const attackerAtt = (strength: number) => {
      wild.dominion = { nation, strength };
      const setup = buildBattle(state, wild.id, forces(nation, [god]), forces(null, []));
      return setup.attacker.commanders[0]!.stats.att;
    };
    // The terrain's attacker modifier applies both times, so compare the two strengths.
    expect(attackerAtt(1) - attackerAtt(0)).toBe(2);
  });
});
