// Supply, starvation, and healing (docs/01-core-rules.md section 4, Supply).
import { describe, expect, it } from 'vitest';
import { provinceEconomy, starvationMoralePenalty } from '../../src/sim/selectors';
import { STARVED_DAYS_CAP } from '../../src/sim/supply';
import {
  addArmy,
  capitalOf,
  independentProvince,
  nationIds,
  runDays,
  twoNationGame,
} from './fixtures';

describe('supply', () => {
  it('is terrain base plus pop / 50 per day', () => {
    const state = twoNationGame();
    const [red, green] = nationIds(state);
    // Kharnath: Plains 60 + 25000 / 50. Deepmoss: Forest 50 + 25000 / 50.
    expect(provinceEconomy(state, capitalOf(state, red!).id).supply).toBeCloseTo(560, 9);
    expect(provinceEconomy(state, capitalOf(state, green!).id).supply).toBeCloseTo(550, 9);
  });

  it('counts 1 per troop and commander, 3 for size 3 and up, 0 for constructs', () => {
    const state = twoNationGame();
    const [red] = nationIds(state);
    const p = independentProvince(state);
    addArmy(state, red!, p.id, 'cinderWarrior', 10); // 1 + 10
    addArmy(state, red!, p.id, 'giant', 4); // 1 + 4 * 3
    addArmy(state, red!, p.id, 'fireSprite', 20); // 1 + 0
    expect(provinceEconomy(state, p.id).supplyUsed).toBe(11 + 13 + 1);
  });

  it('counts a commander in transit where it set out from', () => {
    const state = twoNationGame();
    const [red] = nationIds(state);
    const p = independentProvince(state);
    const q = state.map.provinces[p.id]!.neighbors[0]!;
    const army = addArmy(state, red!, p.id, 'cinderWarrior', 10);
    army.transit = { from: p.id, to: q, progress: 1, totalDays: 4 };
    expect(provinceEconomy(state, p.id).supplyUsed).toBe(11);
    expect(provinceEconomy(state, q).supplyUsed).toBe(0);
  });

  it('is shared by every army in the province and halved by a siege', () => {
    const state = twoNationGame();
    const [red, green] = nationIds(state);
    const p = independentProvince(state);
    addArmy(state, red!, p.id, 'cinderWarrior', 10);
    addArmy(state, green!, p.id, 'warden', 10, 'wardenCaptain');
    expect(provinceEconomy(state, p.id).supplyUsed).toBe(22);
    const full = provinceEconomy(state, p.id).supply;
    state.provinces[p.id]!.siege = { attacker: red!, wallHp: 300 };
    expect(provinceEconomy(state, p.id).supply).toBeCloseTo(full / 2, 9);
  });
});

describe('starvation', () => {
  function starvingArmy() {
    const state = twoNationGame();
    const [red] = nationIds(state);
    const p = independentProvince(state, 'mountains');
    const army = addArmy(state, red!, p.id, 'cinderWarrior', 200);
    expect(provinceEconomy(state, p.id).supplyUsed).toBeGreaterThan(
      provinceEconomy(state, p.id).supply,
    );
    return { state, army, province: p.id, red: red! };
  }

  it('drains 2% of max HP a day and kills troops the pool no longer covers', () => {
    const { state, army } = starvingArmy();
    const squad = army.squads[0]!;
    runDays(state, 1);
    // 200 Cinder Warriors have 2200 HP; 2% is 44, leaving 2156 = 196 troops.
    expect(squad.hp).toBeCloseTo(2156, 9);
    expect(squad.count).toBe(196);
    expect(squad.starvedDays).toBe(1);
    runDays(state, 9);
    expect(squad.starvedDays).toBe(10);
    expect(starvationMoralePenalty(squad.starvedDays)).toBe(2);
    expect(squad.count).toBeLessThan(196);
  });

  it('caps the morale loss at 3', () => {
    expect(STARVED_DAYS_CAP).toBe(19);
    expect(starvationMoralePenalty(4)).toBe(0);
    expect(starvationMoralePenalty(5)).toBe(1);
    expect(starvationMoralePenalty(100)).toBe(3);
  });

  it('counts troops as the HP pool rounded up to whole troops', () => {
    const { state, red, province } = starvingArmy();
    const whole = addArmy(state, red, province, 'cinderWarrior', 7).squads[0]!;
    const wounded = addArmy(state, red, province, 'cinderWarrior', 7).squads[0]!;
    wounded.hp = 66.5;
    runDays(state, 1);
    // 77 - 2% of 77 = 75.46, still 7 troops; 66.5 - 1.54 = 64.96 is 6 troops' worth.
    expect(whole.hp).toBeCloseTo(75.46, 9);
    expect(whole.count).toBe(7);
    expect(wounded.hp).toBeCloseTo(64.96, 9);
    expect(wounded.count).toBe(6);
  });

  it('drains and heals commanders by 2% of max HP, never above max', () => {
    const { state, army, red } = starvingArmy();
    // Ash Chieftain: 14 HP.
    runDays(state, 1);
    expect(army.hp).toBeCloseTo(14 - 0.28, 9);
    expect(army.starvedDays).toBe(1);
    army.location = state.nations[red]!.capital;
    runDays(state, 1);
    expect(army.hp).toBe(14);
    expect(army.starvedDays).toBe(0);
    runDays(state, 1);
    expect(army.hp).toBe(14);
  });

  it('starves commanders to no less than 1 HP', () => {
    const { state, army } = starvingArmy();
    army.hp = 1.1;
    runDays(state, 1);
    expect(army.hp).toBe(1);
    runDays(state, 1);
    expect(army.hp).toBe(1);
  });

  it('removes a squad that starves to nothing', () => {
    const { state, red, province } = starvingArmy();
    const straggler = addArmy(state, red, province, 'cinderWarrior', 1);
    straggler.squads[0]!.hp = 0.2;
    runDays(state, 1);
    expect(straggler.squads).toEqual([]);
  });

  it('shrinks an army until the province can feed it', () => {
    const { state, army, province } = starvingArmy();
    runDays(state, 150);
    const e = provinceEconomy(state, province);
    expect(e.supplyUsed).toBeLessThanOrEqual(e.supply);
    expect(army.squads[0]!.count).toBeGreaterThan(0);
    expect(army.squads[0]!.count).toBeLessThan(200);
  });

  it('posts one message when starvation begins', () => {
    const { state, red, province } = starvingArmy();
    runDays(state, 3);
    const notes = state.messages.filter((m) => m.kind === 'starvation' && m.nation === red);
    expect(notes).toHaveLength(1);
    expect(notes[0]!.province).toBe(province);
  });

  it('posts one message per nation, however many of its armies starve', () => {
    const { state, red, province } = starvingArmy();
    addArmy(state, red, province, 'cinderWarrior', 50);
    addArmy(state, red, province, 'cinderWarrior', 50);
    runDays(state, 1);
    const notes = state.messages.filter((m) => m.kind === 'starvation' && m.nation === red);
    expect(notes).toHaveLength(1);
  });

  it('heals wounded troops at 2% of max HP a day', () => {
    const state = twoNationGame();
    const [red] = nationIds(state);
    const army = addArmy(state, red!, state.nations[red!]!.capital, 'cinderWarrior', 10);
    const squad = army.squads[0]!;
    squad.hp = 55;
    runDays(state, 1);
    expect(squad.hp).toBeCloseTo(55 + 110 * 0.02, 9);
    expect(squad.count).toBe(10);
  });

  it('heals 2% of max HP a day once fed, and the counter falls', () => {
    const { state, army, red } = starvingArmy();
    runDays(state, 5);
    const squad = army.squads[0]!;
    const count = squad.count;
    const hp = squad.hp;
    army.location = state.nations[red]!.capital;
    runDays(state, 1);
    expect(squad.hp).toBeCloseTo(Math.min(count * 11, hp + count * 11 * 0.02), 9);
    expect(squad.starvedDays).toBe(4);
    runDays(state, 30);
    expect(squad.hp).toBe(count * 11);
    expect(squad.starvedDays).toBe(0);
    expect(squad.count).toBe(count);
  });

  it('caps the counter so morale returns at the rate it was lost', () => {
    const { state, army, red } = starvingArmy();
    runDays(state, 40);
    const squad = army.squads[0]!;
    expect(squad.starvedDays).toBe(STARVED_DAYS_CAP);
    expect(starvationMoralePenalty(squad.starvedDays)).toBe(3);
    army.location = state.nations[red]!.capital;
    runDays(state, 4);
    expect(starvationMoralePenalty(squad.starvedDays)).toBe(3);
    runDays(state, 1);
    expect(starvationMoralePenalty(squad.starvedDays)).toBe(2);
    runDays(state, 10);
    expect(starvationMoralePenalty(squad.starvedDays)).toBe(0);
  });

  it('leaves independents fed: they neither eat nor starve', () => {
    const state = twoNationGame();
    const [red] = nationIds(state);
    const p = independentProvince(state, 'mountains');
    const supply = provinceEconomy(state, p.id).supply;
    const guards = addArmy(
      state,
      null,
      p.id,
      'lightInfantry',
      Math.ceil(supply) + 20,
      'independentCaptain',
    );
    expect(provinceEconomy(state, p.id).supplyUsed).toBe(0);
    const intruders = addArmy(state, red!, p.id, 'cinderWarrior', Math.ceil(supply) + 20);
    runDays(state, 30);
    expect(guards.squads[0]!.count).toBe(Math.ceil(supply) + 20);
    expect(guards.squads[0]!.starvedDays).toBe(0);
    expect(intruders.squads[0]!.count).toBeLessThan(Math.ceil(supply) + 20);
  });

  it('never starves units that eat nothing', () => {
    const state = twoNationGame();
    const [red] = nationIds(state);
    const p = independentProvince(state, 'mountains');
    addArmy(state, red!, p.id, 'cinderWarrior', 200);
    const sprites = addArmy(state, red!, p.id, 'fireSprite', 20);
    runDays(state, 10);
    expect(sprites.squads[0]!.count).toBe(20);
    expect(sprites.squads[0]!.starvedDays).toBe(0);
  });
});
