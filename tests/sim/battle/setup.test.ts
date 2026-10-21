// Battle setups from the game, with every modifier folded in (docs/04-battle.md, "Province
// modifiers"; Phase 2 morale penalties).
import { describe, expect, it } from 'vitest';
import { NEUTRAL_SCALES } from '../../../src/content/pretenders/scales';
import type { TerrainId } from '../../../src/content/terrain';
import { buildBattle, type SideForces } from '../../../src/sim/battle/setup';
import type { NationId, ProvinceId } from '../../../src/sim/ids';
import type { CommanderState, GameState } from '../../../src/sim/types';
import { addArmy, independentProvince, redField } from '../fixtures';

function forces(nation: NationId | null, commanders: CommanderState[], pd = false): SideForces {
  return { nation, commanders, garrison: null, pd };
}

/** One Red warrior squad attacking one Green warden squad in a province of some terrain. */
function stage(terrain?: TerrainId) {
  const s = redField();
  const p = independentProvince(s.state, terrain);
  const atk = addArmy(s.state, s.red, p.id, 'cinderWarrior', 10);
  const def = addArmy(s.state, s.green, p.id, 'warden', 10, 'wardenCaptain');
  p.owner = s.green;
  const build = (storm: { wallsStanding: boolean } | null = null) =>
    buildBattle(s.state, p.id, forces(s.red, [atk]), forces(s.green, [def]), storm);
  return { ...s, p, atk, def, build };
}

function setScales(
  state: GameState,
  nation: NationId,
  p: ProvinceId,
  scales: Partial<typeof NEUTRAL_SCALES>,
) {
  state.nations[nation]!.pretender.scales = { ...NEUTRAL_SCALES, ...scales };
  state.provinces[p]!.dominion = { nation, strength: 10 };
}

describe('buildBattle', () => {
  it('lists commanders in the rear with their squads in their rows', () => {
    const { atk, build } = stage();
    const setup = build();
    expect(setup.attacker.commanders.map((c) => [c.ref, c.row, c.hp])).toEqual([
      [atk.id, 'rear', 14],
    ]);
    expect(setup.attacker.squads.map((s) => [s.ref, s.commander, s.count, s.row])).toEqual([
      [atk.squads[0]!.id, atk.id, 10, 'front'],
    ]);
    expect(setup.attacker.research).toMatchObject({ R: 1, G: 0 });
  });

  it('gives defenders their terrain bonus and Thornwood its forest on either side', () => {
    const plains = stage('plains').build();
    expect(plains.defender.squads[0]!.stats.def).toBe(11);
    const forest = stage('forest').build();
    // Wardens defend at 11, +1 for the forest, +1 for Thornwood's home terrain.
    expect(forest.defender.squads[0]!.stats.def).toBe(13);
    expect(forest.attacker.squads[0]!.stats.def).toBe(9);
    const mountains = stage('mountains').build();
    expect(mountains.defender.squads[0]!.stats.def).toBe(13);
  });

  it('slows attackers in swamps unless they are swamp walkers', () => {
    const swamp = stage('swamp');
    expect(swamp.build().attacker.squads[0]!.stats.att).toBe(10);
    const walkers = addArmy(swamp.state, swamp.red, swamp.p.id, 'swampFighter', 3);
    const setup = buildBattle(
      swamp.state,
      swamp.p.id,
      forces(swamp.red, [walkers]),
      forces(swamp.green, [swamp.def]),
    );
    expect(setup.attacker.squads[0]!.stats.att).toBe(10);
  });

  it('applies the dominating nation’s Fury, Lore, and Sanctity, and its Dread to enemies', () => {
    const { state, red, p, build } = stage('plains');
    setScales(state, red, p.id, { lore: -3, sanctity: -3 });
    const fury = build();
    expect(fury.attacker.squads[0]!.stats).toMatchObject({ att: 14, mor: 14 });
    // Dread 3: Thornwood's units lose 3 morale.
    expect(fury.defender.squads[0]!.stats.mor).toBe(8);
    setScales(state, red, p.id, { lore: 3, sanctity: 3 });
    const lore = build();
    expect(lore.attacker.squads[0]!.stats.prec).toBe(13);
    expect(lore.defender.squads[0]!.stats.mor).toBe(11);
  });

  it('adds storm bonuses for the fort’s defenders, more while the walls stand', () => {
    const { build } = stage('plains');
    expect(build({ wallsStanding: true }).defender.squads[0]!.stats).toMatchObject({
      prot: 12,
      mor: 13,
    });
    expect(build({ wallsStanding: false }).defender.squads[0]!.stats).toMatchObject({
      prot: 9,
      mor: 13,
    });
    expect(build({ wallsStanding: true }).attacker.squads[0]!.stats.prot).toBe(3);
  });

  it('takes morale for starvation and unpaid upkeep', () => {
    const { state, red, atk, build } = stage('plains');
    atk.squads[0]!.starvedDays = 10;
    state.nations[red]!.unpaidDays = 30;
    expect(build().attacker.squads[0]!.stats.mor).toBe(11 - 2 - 1);
    expect(build().attacker.commanders[0]!.stats.mor).toBe(13 - 1);
  });

  it('fields PD and garrison troops without a commander', () => {
    const { state, red, capital } = redField();
    const p = state.provinces[capital]!;
    p.pd = 6;
    const holder = state.commanders[p.garrison!]!;
    holder.squads.push(...addArmy(state, red, capital, 'ashMilitia', 4).squads);
    const setup = buildBattle(state, capital, forces(null, []), {
      nation: red,
      commanders: [],
      garrison: holder,
      pd: true,
    });
    expect(setup.defender.squads.map((s) => [s.ref, s.commander, s.unit, s.count])).toEqual([
      [holder.squads[0]!.id, null, 'ashMilitia', 4],
      ['pd0', null, 'ashMilitia', 12],
      ['pd1', null, 'flameArcher', 1],
    ]);
  });
});
