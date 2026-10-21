// Sieges and storms (docs/01-core-rules.md section 11).
import { describe, expect, it } from 'vitest';
import { applyCommand } from '../../src/sim/commands';
import { engage } from '../../src/sim/conflict';
import { siegeRates } from '../../src/sim/siege';
import { createGame } from '../../src/sim/createGame';
import type { NationId } from '../../src/sim/ids';
import {
  addArmy,
  annex,
  besiege,
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

  it('takes the fort once no defenders are left', () => {
    const { state, red, green, deepmoss, fort } = siege();
    for (const c of Object.values(state.commanders)) {
      if (c.owner === green && c.location === deepmoss) c.squads = [];
    }
    for (const c of Object.values(state.commanders)) {
      if (c.owner === green && c.location === deepmoss && c.unit !== 'garrison') {
        c.location = state.nations[red]!.capital;
      }
    }
    runDays(state, 1);
    expect(fort.owner).toBe(red);
    expect(fort.siege).toBeNull();
    const holder = state.commanders[fort.garrison!]!;
    expect(holder.owner).toBe(red);
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
