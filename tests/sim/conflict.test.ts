// Arrival battles, capture, and retreat (docs/01-core-rules.md sections 6, 9-11).
import { describe, expect, it } from 'vitest';
import { removeCommander } from '../../src/sim/commanders';
import { engage } from '../../src/sim/conflict';
import type { NationId, ProvinceId } from '../../src/sim/ids';
import { legDays } from '../../src/sim/movement';
import type { CommanderState, GameState } from '../../src/sim/types';
import { addArmy, annex, commandersIn, move, neighbors, redField, runDays } from './fixtures';

/** Independent defenders standing in a province. */
function guards(state: GameState, p: ProvinceId): CommanderState[] {
  return Object.values(state.commanders).filter((c) => c.owner === null && c.location === p);
}

/** Marches an army into a neighbor and lets it arrive. */
function attack(state: GameState, nation: NationId, army: CommanderState, to: ProvinceId): void {
  expect(move(state, nation, [army], [to])).toEqual({ ok: true });
  runDays(state, legDays(state, to, 2));
}

describe('an arrival among independents', () => {
  it('fights, and a win takes the province', () => {
    const { state, red, capital, army } = redField();
    army.squads[0]!.count = 120;
    army.squads[0]!.hp = 120 * 11;
    const target = neighbors(state, capital)[0]!;
    attack(state, red, army, target);
    const record = state.battles.at(-1)!;
    expect(record).toMatchObject({
      province: target,
      attacker: red,
      defender: null,
      winner: 'attacker',
    });
    expect(record.roster.defender.squads.length).toBeGreaterThan(0);
    expect(state.provinces[target]!.owner).toBe(red);
    expect(guards(state, target)).toEqual([]);
    expect(army.location).toBe(target);
    expect(army.order).toEqual({ kind: 'idle' });
    expect(state.nations[red]!.stats).toMatchObject({ battlesWon: 1, provincesTaken: 1 });
    const kinds = state.messages.filter((m) => m.nation === red).map((m) => m.kind);
    expect(kinds).toContain('battle');
    expect(kinds).toContain('captured');
  });

  it('sends a beaten attacker back where it came from', () => {
    const { state, red, capital } = redField();
    const target = neighbors(state, capital)[0]!;
    const weak = addArmy(state, red, capital, 'ashMilitia', 1);
    attack(state, red, weak, target);
    expect(state.battles.at(-1)?.winner).toBe('defender');
    expect(state.provinces[target]!.owner).toBeNull();
    if (state.commanders[weak.id]) {
      expect(weak.location).toBe(capital);
      expect(weak.cameFrom).toBe(target);
      expect(weak.transit).toBeNull();
    }
    expect(state.nations[red]!.stats.battlesLost).toBe(1);
  });

  it('takes an undefended province without a battle', () => {
    const { state, red, capital, army } = redField();
    const target = neighbors(state, capital)[0]!;
    for (const g of guards(state, target)) g.squads = [];
    for (const g of guards(state, target)) removeCommander(state, g.id);
    attack(state, red, army, target);
    expect(state.provinces[target]!.owner).toBe(red);
    expect(state.battles).toEqual([]);
  });
});

describe('an arrival in an enemy province', () => {
  function setupEnemy() {
    const s = redField();
    const target = neighbors(s.state, s.capital)[0]!;
    annex(s.state, s.green, target);
    return { ...s, target };
  }

  it('fights its defenders, and the beaten defenders flee to a friendly neighbor or die', () => {
    const { state, red, green, army, target } = setupEnemy();
    army.squads[0]!.count = 150;
    army.squads[0]!.hp = 150 * 11;
    const haven = neighbors(state, target).find((n) => n !== army.location)!;
    annex(state, green, haven);
    const defender = addArmy(state, green, target, 'thornMilitia', 10, 'wardenCaptain');
    attack(state, red, army, target);
    expect(state.provinces[target]!.owner).toBe(red);
    expect(state.provinces[target]!.unrest).toBeGreaterThanOrEqual(10 - 1);
    if (state.commanders[defender.id]) {
      expect(state.provinces[defender.location]!.owner).toBe(green);
      expect(neighbors(state, target)).toContain(defender.location);
    }
    expect(state.messages.some((m) => m.nation === green && m.kind === 'lost')).toBe(true);
  });

  it('fights PD, which shrinks with its losses when it holds', () => {
    const { state, red, army, target } = setupEnemy();
    state.provinces[target]!.pd = 20;
    army.squads = army.squads.slice(0, 1);
    army.squads[0]!.count = 6;
    army.squads[0]!.hp = 66;
    attack(state, red, army, target);
    const record = state.battles.at(-1)!;
    expect(record.roster.defender.squads.map((s) => s.ref)).toEqual(['pd0', 'pd1']);
    expect(record.winner).toBe('defender');
    expect(state.provinces[target]!.pd).toBeLessThanOrEqual(20);
    expect(state.provinces[target]!.pd).toBeGreaterThan(0);
  });

  it('lays siege to a defended fort instead of fighting', () => {
    const { state, red, green, army } = redField();
    const deepmoss = state.nations[green]!.capital;
    army.location = neighbors(state, deepmoss)[0]!;
    annex(state, red, army.location);
    attack(state, red, army, deepmoss);
    expect(state.battles).toEqual([]);
    expect(state.provinces[deepmoss]!.siege).toMatchObject({ attacker: red, storm: false });
    expect(state.provinces[deepmoss]!.owner).toBe(green);
  });
});

describe('a third army and a relief army', () => {
  it('fights a third nation present before the owner', () => {
    const { state, red, green, capital, army } = redField();
    const target = neighbors(state, capital)[0]!;
    for (const g of guards(state, target)) removeCommander(state, g.id);
    state.provinces[target]!.owner = null;
    const intruder = addArmy(state, green, target, 'thornMilitia', 3, 'wardenCaptain');
    army.squads[0]!.count = 120;
    army.squads[0]!.hp = 1320;
    attack(state, red, army, target);
    expect(state.battles[0]).toMatchObject({ attacker: red, defender: green });
    expect(state.commanders[intruder.id]?.location ?? null).not.toBe(target);
    expect(state.provinces[target]!.owner).toBe(red);
  });

  it('attacks an enemy army standing in its own province', () => {
    const { state, red, green, capital, army } = redField();
    const own = neighbors(state, capital)[0]!;
    annex(state, red, own);
    addArmy(state, green, own, 'thornMilitia', 3, 'wardenCaptain');
    attack(state, red, army, own);
    expect(state.battles[0]).toMatchObject({ attacker: red, defender: green, province: own });
    expect(state.provinces[own]!.owner).toBe(red);
  });

  it('does nothing when nobody hostile is there', () => {
    const { state, red, capital } = redField();
    const before = JSON.stringify(state);
    engage(state, red, capital);
    expect(JSON.stringify(state)).toBe(before);
    expect(commandersIn(state, capital).length).toBeGreaterThan(0);
  });
});
