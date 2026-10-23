// What Phase 6b.2 adds to the battle setup (pretender build spec N1 to N5; docs/04-battle.md
// decisions): a commander's abilities and the stats of what they summon, the body's size and
// spell power, shields merged by element, and bound squads of the pretender's monthly-summon
// unit. No shipped unit or chassis uses any of these until Phase 6b.3, so they are shown on
// patched content.
import { describe, expect, it } from 'vitest';
import { unitDef } from '../../../src/content';
import { ABILITIES } from '../../../src/content/abilities';
import { CHASSIS, type ChassisDef } from '../../../src/content/pretenders/chassis';
import type { PretenderDesign } from '../../../src/content/pretenders/types';
import { toSetupRecord } from '../../../src/sim/battle/rerun';
import { buildBattle, type SideForces } from '../../../src/sim/battle/setup';
import { createSquad } from '../../../src/sim/commanders';
import type { NationId, ProvinceId } from '../../../src/sim/ids';
import type { CommanderState, GameState } from '../../../src/sim/types';
import { patched } from '../../content/patched';
import { addArmy, nationIds, pretender, twoNationGame } from '../fixtures';

function forces(nation: NationId | null, commanders: CommanderState[]): SideForces {
  return { nation, commanders, garrison: null, pd: false };
}

/** A game whose nation in `slot` has this awake god, and the god standing at the capital. */
function withGod(slot: 0 | 1, design: Partial<PretenderDesign>) {
  const full = pretender({ awakening: 'awake', dominion: 2, ...design });
  const state =
    slot === 0 ? twoNationGame(1, { pretender: full }) : twoNationGame(1, {}, { pretender: full });
  const nation = nationIds(state)[slot]!;
  const capital = state.nations[nation]!.capital;
  const god = state.commanders[state.nations[nation]!.pretenderId!]!;
  return { state, nation, capital, god };
}

/** The setup of these commanders defending `at` against nobody. */
function defending(state: GameState, nation: NationId, at: ProvinceId, cs: CommanderState[]) {
  return buildBattle(state, at, forces(null, []), forces(nation, cs)).defender;
}

const avatar = { boons: [{ id: 'avatar' as const }] };

describe('a commander’s abilities', () => {
  it('come from its body, by catalog entry, with the stats of what they summon', () => {
    const { state, nation, capital, god } = withGod(0, { chassis: 'titan', pips: { R: 1 } });
    patched(unitDef('titan'), 'abilities', ['kindleTheHost', 'primordialFear'], () => {
      const side = defending(state, nation, capital, [god]);
      expect(side.commanders[0]!.abilities).toEqual([
        ABILITIES.kindleTheHost,
        ABILITIES.primordialFear,
      ]);
      // The sprites fight with this side's modifiers, as a spell's summons do.
      expect(side.summons.fireSprite).toMatchObject({ size: 1, mor: unitDef('fireSprite').mor });
      expect(
        toSetupRecord(buildBattle(state, capital, forces(null, []), forces(nation, [god]))).defender
          .commanders[0]!.abilities,
      ).toEqual(['kindleTheHost', 'primordialFear']);
    });
    // Without abilities on the body there is nothing to summon.
    const plain = defending(state, nation, capital, [god]);
    expect(plain.commanders[0]!.abilities).toEqual([]);
    expect(plain.summons).toEqual({});
  });
});

describe('combat stats', () => {
  it('carry the body’s size and spell power, 0 without one', () => {
    const { state, nation, capital, god } = withGod(0, { chassis: 'titan', pips: { R: 1 } });
    const army = addArmy(state, nation, capital, 'cinderWarrior', 5, 'cinderMagus');
    const side = defending(state, nation, capital, [god, army]);
    expect(side.commanders.map((c) => [c.unit, c.stats.size, c.stats.spellPower])).toEqual([
      ['titan', 4, 0],
      ['cinderMagus', unitDef('cinderMagus').size, 0],
    ]);
    expect(side.squads[0]!.stats.size).toBe(unitDef('cinderWarrior').size);
    patched(unitDef('cinderMagus'), 'spellPower', 3, () => {
      expect(defending(state, nation, capital, [army]).commanders[0]!.stats.spellPower).toBe(3);
    });
  });

  it('merge the body’s fire shield with a blessing’s: 5 and 3 make fire 8', () => {
    const { state, nation, capital, god } = withGod(0, {
      chassis: 'ashColossus',
      pips: { R: 4 },
      blessings: ['cinderSkin'],
      ...avatar,
    });
    expect(defending(state, nation, capital, [god]).commanders[0]!.stats.shields).toEqual([
      { element: 'fire', amount: 8 },
    ]);
  });

  it('list a nature shield after a fire one: Thornhide on a god with a fire shield of its own', () => {
    const { state, nation, capital, god } = withGod(1, {
      chassis: 'wildSpirit',
      pips: { G: 5 },
      blessings: ['thornhide'],
      ...avatar,
    });
    expect(defending(state, nation, capital, [god]).commanders[0]!.stats.shields).toEqual([
      { element: 'nature', amount: 4 },
    ]);
    patched(unitDef('wildSpirit'), 'fireShield', 2, () => {
      expect(defending(state, nation, capital, [god]).commanders[0]!.stats.shields).toEqual([
        { element: 'fire', amount: 2 },
        { element: 'nature', amount: 4 },
      ]);
    });
  });
});

describe('bound squads', () => {
  const brood = { unit: 'wolf' as const, count: 2, cap: 24 };

  it('are the pretender’s squads of its chassis’s monthly-summon unit, whatever their source', () => {
    const { state, nation, capital, god } = withGod(1, { chassis: 'titan', pips: { G: 1 } });
    god.squads.push(createSquad(state, 'wolf', 6), createSquad(state, 'warden', 5));
    const other = addArmy(state, nation, capital, 'wolf', 4, 'wardenCaptain');
    patched(CHASSIS.titan as ChassisDef, 'monthlySummon', brood, () => {
      const side = defending(state, nation, capital, [god, other]);
      expect(side.squads.map((s) => [s.unit, s.commander === god.id, s.bound])).toEqual([
        ['wolf', true, true],
        ['warden', true, undefined],
        ['wolf', false, undefined],
      ]);
    });
    // Without a monthly summon nobody is bound.
    const side = defending(state, nation, capital, [god, other]);
    expect(side.squads.every((s) => s.bound === undefined)).toBe(true);
  });
});
