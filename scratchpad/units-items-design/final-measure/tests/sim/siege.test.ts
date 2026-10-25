// Sieges and storms (docs/01-core-rules.md section 11).
import { describe, expect, it } from 'vitest';
import { applyCommand } from '../../src/sim/commands';
import { engage } from '../../src/sim/conflict';
import { createSquad } from '../../src/sim/commanders';
import { createRng } from '../../src/sim/rng';
import { siegeRates, stormState, wallsDown } from '../../src/sim/siege';
import { createGame } from '../../src/sim/createGame';
import type { NationId } from '../../src/sim/ids';
import {
  addArmy,
  annex,
  besiege,
  move,
  nation,
  nationIds,
  neighbors,
  redField,
  runDays,
} from './fixtures';

/** Red besieges Thornwood's capital with an army of `count` Cinder Warriors. */
function siege(count = 40) {
  const s = redField();
  const deepmoss = s.state.nations[s.green]!.capital;
  const army = besiege(s.state, s.red, deepmoss);
  army.squads[0]!.count = count;
  army.squads[0]!.hp = count * 11;
  const fort = s.state.provinces[deepmoss]!;
  return { ...s, deepmoss, army, fort };
}

/**
 * Deepmoss's defenders' str: Warden Captain 10, 20 Wardens 11, 10 Longbow Hunters 10, Sapling
 * Druid and Grove Priest 10. The stealthy Scout stays hidden and does not man the walls.
 */
const DEFENDER_STR = 10 + 20 * 11 + 10 * 10 + 10 * 2;

describe('siege', () => {
  it('batters the walls by attacker str / 10 and repairs them by defender str / 20 a day', () => {
    const { state, deepmoss, fort } = siege(100);
    const attack = (10 + 100 * 11) / 10;
    const repair = DEFENDER_STR / 20;
    expect(siegeRates(state, deepmoss)).toEqual({
      damage: attack,
      repair,
      daysToBreach: Math.ceil(300 / (attack - repair)),
    });
    runDays(state, 1);
    expect(fort.siege?.wallHp).toBeCloseTo(300 - attack + repair, 9);
    runDays(state, 30);
    expect(fort.siege?.wallHp).toBe(0);
  });

  it('counts PD and garrison troops among the repairers', () => {
    const { state, deepmoss, fort } = siege(100);
    fort.pd = 10;
    const holder = state.commanders[fort.garrison!]!;
    holder.squads.push(createSquad(state, 'warden', 10));
    // PD 10: 20 Thorn Militia and 2 Longbow Hunters, str 10 each; 10 Wardens, str 11.
    expect(siegeRates(state, deepmoss).repair).toBeCloseTo((DEFENDER_STR + 220 + 110) / 20, 9);
  });

  it('batters the walls on the day the besiegers arrive', () => {
    const { state, red, green } = redField();
    const deepmoss = state.nations[green]!.capital;
    const camp = neighbors(state, deepmoss).find((n) => state.provinces[n]!.owner === null)!;
    annex(state, red, camp);
    const army = addArmy(state, red, camp, 'cinderWarrior', 100);
    expect(move(state, red, [army], [deepmoss])).toEqual({ ok: true });
    const fort = state.provinces[deepmoss]!;
    for (let day = 0; day < 20 && !fort.siege; day++) runDays(state, 1);
    const { damage, repair } = siegeRates(state, deepmoss);
    expect(fort.siege?.wallHp).toBeCloseTo(300 - damage + repair, 9);
  });

  it('counts walls under 1 HP as down', () => {
    expect([wallsDown(0), wallsDown(0.5), wallsDown(1), wallsDown(300)]).toEqual([
      true,
      true,
      false,
      false,
    ]);
    const at = (wallHp: number) => stormState({ attacker: 'n0' as NationId, wallHp, storm: true });
    expect([at(300), at(1), at(0.5)].map((x) => x.wallsStanding)).toEqual([true, true, false]);
  });

  it('cannot gain on walls that are repaired faster than they fall', () => {
    const { state, deepmoss, fort } = siege(5);
    expect(siegeRates(state, deepmoss).daysToBreach).toBeNull();
    runDays(state, 10);
    expect(fort.siege?.wallHp).toBe(300);
  });

  it('ends when the besiegers leave', () => {
    const { state, red, army, fort } = siege();
    const home = neighbors(state, fort.id).find((n) => n !== fort.id)!;
    annex(state, red, home);
    army.location = home;
    runDays(state, 1);
    expect(fort.siege).toBeNull();
  });

  it('takes an empty fort once its walls are down, with nobody to repair them', () => {
    const { state, red, green, deepmoss, fort } = siege(40);
    for (const c of Object.values(state.commanders)) {
      if (c.owner === green && c.location === deepmoss && c.unit !== 'garrison') {
        c.location = state.nations[red]!.capital;
      }
    }
    expect(siegeRates(state, deepmoss).repair).toBe(0);
    const days = siegeRates(state, deepmoss).daysToBreach!;
    runDays(state, days - 1);
    expect(fort.owner).toBe(green);
    runDays(state, 1);
    expect(fort.owner).toBe(red);
    expect(fort.siege).toBeNull();
    expect(state.commanders[fort.garrison!]!.owner).toBe(red);
  });

  it('falls at once to a storm when nobody holds it', () => {
    const { state, red, green, deepmoss, fort } = siege(5);
    for (const c of Object.values(state.commanders)) {
      if (c.owner === green && c.location === deepmoss && c.unit !== 'garrison') {
        c.location = state.nations[red]!.capital;
      }
    }
    applyCommand(state, { type: 'storm', nation: red, province: deepmoss });
    runDays(state, 1);
    expect(fort.owner).toBe(red);
    expect(state.battles).toEqual([]);
  });

  it('keeps battered walls and a pending storm when reinforcements arrive', () => {
    const { state, red, fort } = siege(100);
    runDays(state, 3);
    const walls = fort.siege!.wallHp;
    expect(walls).toBeLessThan(300);
    applyCommand(state, { type: 'storm', nation: red, province: fort.id });
    addArmy(state, red, fort.id, 'cinderWarrior', 1);
    engage(state, red, fort.id);
    expect(fort.siege).toMatchObject({ attacker: red, wallHp: walls, storm: true });
  });

  it('passes battered walls to a third nation that beats the besiegers', () => {
    const state = createGame({
      seed: 2,
      mapSize: 'medium',
      nations: [nation('cinderHorde'), nation('thornwood'), nation('cinderHorde')],
    });
    const [red, green, red2] = nationIds(state) as [NationId, NationId, NationId];
    const deepmoss = state.nations[green]!.capital;
    const fort = state.provinces[deepmoss]!;
    const besiegers = besiege(state, red, deepmoss);
    besiegers.squads[0]!.count = 100;
    besiegers.squads[0]!.hp = 1100;
    runDays(state, 3);
    const walls = fort.siege!.wallHp;
    const newcomer = addArmy(state, red2, deepmoss, 'cinderWarrior', 400);
    newcomer.squads[0]!.hp = 400 * 11;
    engage(state, red2, deepmoss);
    expect(state.battles.at(-1)).toMatchObject({
      attacker: red2,
      defender: red,
      winner: 'attacker',
    });
    expect(fort.siege).toEqual({ attacker: red2, wallHp: walls, storm: false });
  });
});

describe('storm', () => {
  it('needs the besieger with an army there', () => {
    const { state, red, green, fort } = siege();
    expect(applyCommand(state, { type: 'storm', nation: green, province: fort.id }).ok).toBe(false);
    expect(applyCommand(state, { type: 'storm', nation: red, province: fort.id })).toEqual({
      ok: true,
    });
    expect(fort.siege?.storm).toBe(true);
    const other = state.nations[red]!.capital;
    expect(applyCommand(state, { type: 'storm', nation: red, province: other }).ok).toBe(false);
  });

  it('is refused once the besieger’s army has gone', () => {
    const { state, red, army, fort } = siege();
    army.location = state.nations[red]!.capital;
    expect(applyCommand(state, { type: 'storm', nation: red, province: fort.id })).toEqual({
      ok: false,
      error: 'No army is there',
    });
    expect(fort.siege?.storm).toBe(false);
  });

  it('won with no one left standing takes nothing, and the garrison is still lost', () => {
    let pyrrhic = 0;
    for (let seed = 0; seed < 60; seed++) {
      const { state, red, green, deepmoss, fort, army } = siege(60);
      state.rng = createRng(seed);
      for (const c of Object.values(state.commanders)) {
        if (c.owner === green && c.location === deepmoss && c.unit !== 'garrison') {
          c.location = state.nations[red]!.capital;
        }
      }
      const holder = state.commanders[fort.garrison!]!;
      holder.squads.push(createSquad(state, 'longbowHunter', 20));
      fort.siege!.wallHp = 0;
      army.hp = 0.01;
      army.script = Array.from({ length: 5 }, () => ({ kind: 'attack' as const }));
      applyCommand(state, { type: 'storm', nation: red, province: deepmoss });
      runDays(state, 1);
      if (state.battles.at(-1)?.winner !== 'attacker' || state.commanders[army.id]) continue;
      pyrrhic += 1;
      expect(fort.owner).toBe(green);
      expect(fort.siege).toBeNull();
      expect(holder.squads).toEqual([]);
    }
    expect(pyrrhic).toBeGreaterThan(0);
  });

  it('is fought in the next tick, with the walls in the defenders’ favor', () => {
    const { state, red, fort } = siege(40);
    applyCommand(state, { type: 'storm', nation: red, province: fort.id });
    runDays(state, 1);
    const record = state.battles.at(-1)!;
    expect(record.province).toBe(fort.id);
    expect(fort.siege).toBeNull();
    if (record.winner === 'attacker') expect(fort.owner).toBe(red);
    else expect(fort.owner).not.toBe(red);
  });

  it('takes the fort when an overwhelming army storms breached walls', () => {
    const { state, red, fort } = siege(400);
    runDays(state, 30);
    expect(fort.siege?.wallHp).toBe(0);
    applyCommand(state, { type: 'storm', nation: red, province: fort.id });
    runDays(state, 1);
    expect(state.battles.at(-1)?.winner).toBe('attacker');
    expect(fort.owner).toBe(red);
    expect(fort.pd).toBe(0);
  });
});
