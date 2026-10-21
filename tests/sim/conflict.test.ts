// Arrival battles, capture, and retreat (docs/01-core-rules.md sections 6, 9-11).
import { describe, expect, it } from 'vitest';
import { removeCommander } from '../../src/sim/commanders';
import { captureIfHeld, engage } from '../../src/sim/conflict';
import { createGame } from '../../src/sim/createGame';
import { createRng } from '../../src/sim/rng';
import type { NationId, ProvinceId } from '../../src/sim/ids';
import { legDays } from '../../src/sim/movement';
import type { CommanderState, GameState } from '../../src/sim/types';
import {
  addArmy,
  annex,
  commandersIn,
  move,
  nation,
  nationIds,
  neighbors,
  redField,
  runDays,
} from './fixtures';

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

describe('hidden commanders', () => {
  it('neither fight, nor besiege, nor take a province', () => {
    const { state, red, green, capital } = redField();
    const scout = commandersIn(state, capital).find((c) => c.unit === 'cinderScout')!;
    const empty = neighbors(state, capital)[0]!;
    for (const g of guards(state, empty)) removeCommander(state, g.id);
    annex(state, green, empty);
    attack(state, red, scout, empty);
    expect(scout.location).toBe(empty);
    expect(state.provinces[empty]!.owner).toBe(green);
    expect(state.battles).toEqual([]);
    const deepmoss = state.nations[green]!.capital;
    scout.location = deepmoss;
    engage(state, red, deepmoss);
    expect(state.provinces[deepmoss]!.siege).toBeNull();
  });
});

describe('after a battle', () => {
  it('leaves winners caught on the march standing idle where they fought', () => {
    const { state, red, green, capital } = redField();
    const own = neighbors(state, capital)[0]!;
    annex(state, red, own);
    const walker = addArmy(state, red, own, 'cinderWarrior', 150);
    const onward = neighbors(state, own).find((n) => n !== capital)!;
    walker.transit = { from: own, to: capital, progress: 1, totalDays: 4 };
    walker.order = { kind: 'move', path: [onward], mapSpeed: 2 };
    const raider = addArmy(state, green, own, 'thornMilitia', 2, 'wardenCaptain');
    raider.cameFrom = onward;
    engage(state, green, own);
    expect(state.battles.at(-1)?.winner).toBe('defender');
    expect(walker).toMatchObject({ location: own, transit: null, order: { kind: 'idle' } });
  });

  it('keeps no replay of a battle with no player in it', () => {
    const { state, green } = redField();
    const target = neighbors(state, state.nations[green]!.capital)[0]!;
    const army = addArmy(state, green, target, 'warden', 60, 'wardenCaptain');
    engage(state, green, target);
    expect(state.battles).toEqual([]);
    const note = state.messages.find((m) => m.nation === green && m.kind === 'battle');
    expect(note?.battle).toBeNull();
    expect(state.provinces[target]!.owner).toBe(green);
    expect(army.location).toBe(target);
  });
});

describe('retreats', () => {
  const retreating = Array.from({ length: 5 }, () => ({ kind: 'retreat' as const }));

  /** An independent province next to Red's capital, with every neighbor given to Red. */
  function ringed() {
    const s = redField();
    const target = neighbors(s.state, s.capital).find(
      (n) => s.state.provinces[n]!.owner === null && guards(s.state, n).length > 0,
    )!;
    for (const n of neighbors(s.state, target)) {
      if (s.state.provinces[n]!.owner === null) annex(s.state, s.red, n);
    }
    const others = neighbors(s.state, target).filter(
      (n) => n !== s.capital && s.state.provinces[n]!.owner === s.red,
    );
    const loser = addArmy(s.state, s.red, target, 'ashMilitia', 1);
    loser.script = retreating;
    return { ...s, target, others, loser };
  }

  it('go back where they came from when it is friendly, even with other friends near', () => {
    for (let seed = 1; seed <= 6; seed++) {
      const { state, red, target, others, loser } = ringed();
      if (others.length === 0) continue;
      state.rng = createRng(seed);
      loser.cameFrom = others[0]!;
      loser.order = { kind: 'pillage' };
      engage(state, red, target);
      expect(loser.location).toBe(others[0]);
      expect(loser.order).toEqual({ kind: 'idle' });
    }
  });

  it('never into a province another nation’s army stands in', () => {
    const { state, red, green, target, others, loser } = ringed();
    const occupied = others[0]!;
    addArmy(state, green, occupied, 'warden', 30, 'wardenCaptain');
    loser.cameFrom = occupied;
    engage(state, red, target);
    expect(state.commanders[loser.id]).toBeDefined();
    expect(loser.location).not.toBe(occupied);
    expect(loser.location).not.toBe(target);
  });

  it('end in death with nowhere friendly to go, prophets included', () => {
    const { state, red, green, capital } = redField();
    const far = Object.values(state.provinces).find(
      (p) =>
        p.owner === null &&
        guards(state, p.id).length > 0 &&
        !neighbors(state, p.id).includes(capital) &&
        neighbors(state, p.id).every((n) => state.provinces[n]!.owner !== red),
    )!;
    // Its one Red neighbor holds a Green army, so it is no refuge.
    const refuge = neighbors(state, far.id)[0]!;
    annex(state, red, refuge);
    addArmy(state, green, refuge, 'warden', 30, 'wardenCaptain');
    const prophet = addArmy(state, red, far.id, 'ashMilitia', 1);
    prophet.script = retreating;
    state.nations[red]!.prophetId = prophet.id;
    state.day = 100;
    engage(state, red, far.id);
    expect(state.commanders[prophet.id]).toBeUndefined();
    expect(state.nations[red]).toMatchObject({ prophetId: null, prophetAvailableDay: 820 });
  });
});

describe('capture', () => {
  it('needs one of the winners still standing in the province', () => {
    const { state, red, capital } = redField();
    const target = neighbors(state, capital)[0]!;
    const fallen = addArmy(state, red, target, 'cinderWarrior', 5);
    const winners = { nation: red, commanders: [fallen], garrison: null, pd: false };
    removeCommander(state, fallen.id);
    captureIfHeld(state, target, winners);
    expect(state.provinces[target]!.owner).toBeNull();
  });

  it('besieges an enemy fort even when nobody defends it', () => {
    const { state, red, green } = redField();
    const deepmoss = state.nations[green]!.capital;
    for (const c of Object.values(state.commanders)) {
      if (c.location === deepmoss && c.unit !== 'garrison') removeCommander(state, c.id);
    }
    state.provinces[deepmoss]!.pd = 0;
    addArmy(state, red, deepmoss, 'cinderWarrior', 10);
    engage(state, red, deepmoss);
    expect(state.provinces[deepmoss]).toMatchObject({
      owner: green,
      siege: { attacker: red, wallHp: 300, storm: false },
    });
  });

  it('starts fresh walls for a newcomer when the old besiegers left without a fight', () => {
    const state = createGame({
      seed: 2,
      mapSize: 'medium',
      nations: [nation('cinderHorde'), nation('thornwood'), nation('cinderHorde')],
    });
    const [red, green, red2] = nationIds(state) as [NationId, NationId, NationId];
    const deepmoss = state.nations[green]!.capital;
    state.provinces[deepmoss]!.siege = { attacker: red, wallHp: 40, storm: false };
    addArmy(state, red2, deepmoss, 'cinderWarrior', 10);
    engage(state, red2, deepmoss);
    expect(state.provinces[deepmoss]!.siege).toEqual({ attacker: red2, wallHp: 300, storm: false });
  });
});
