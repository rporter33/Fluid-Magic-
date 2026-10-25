// Commands to commanders: orders, scripts, formations, squad transfers, and building.
import { describe, expect, it } from 'vitest';
import { applyCommand } from '../../../src/sim/commands';
import type { NationId } from '../../../src/sim/ids';
import type { CommanderState, GameState, ScriptSlot, Squad } from '../../../src/sim/types';
import {
  addArmy,
  annex,
  capitalOf,
  commandersIn,
  independentProvince,
  nationIds,
  runDays,
  twoNationGame,
} from '../fixtures';

function setup() {
  const state = twoNationGame();
  const red = nationIds(state)[0]!;
  const capital = capitalOf(state, red);
  const army = commandersIn(state, capital.id);
  const find = (unit: string) => army.find((c) => c.unit === unit)!;
  return {
    state,
    red,
    capital,
    chieftain: find('ashChieftain'),
    scout: find('cinderScout'),
    adept: find('emberAdept'),
    priest: find('pyrePriest'),
    garrison: find('garrison'),
  };
}

function order(state: GameState, nation: NationId, c: CommanderState, kind: string) {
  return applyCommand(state, {
    type: 'setOrder',
    nation,
    commander: c.id,
    order: kind as 'idle',
  });
}

describe('setOrder', () => {
  it('sets idle, pillage, and patrol for anyone', () => {
    const { state, red, chieftain } = setup();
    for (const kind of ['pillage', 'patrol', 'idle'] as const) {
      expect(order(state, red, chieftain, kind)).toEqual({ ok: true });
      expect(chieftain.order).toEqual({ kind });
    }
  });

  it('lets only priests preach and only mages research, in a lab province of their own', () => {
    const { state, red, chieftain, adept, priest } = setup();
    expect(order(state, red, priest, 'preach').ok).toBe(true);
    expect(order(state, red, chieftain, 'preach').ok).toBe(false);
    expect(order(state, red, adept, 'research').ok).toBe(true);
    expect(order(state, red, chieftain, 'research').ok).toBe(false);
    const p = annex(state, red, independentProvince(state).id);
    adept.location = p.id;
    expect(order(state, red, adept, 'research').ok).toBe(false);
    p.buildings.push('lab');
    expect(order(state, red, adept, 'research').ok).toBe(true);
    adept.transit = { from: p.id, to: p.id, progress: 1, totalDays: 4 };
    expect(order(state, red, adept, 'research').ok).toBe(false);
  });

  it('refuses orders that need their own command, and the garrison holder', () => {
    const { state, red, chieftain, garrison } = setup();
    for (const kind of ['move', 'build', 'castRitual', 'claimWellspring', 'nonsense']) {
      expect(order(state, red, chieftain, kind).ok).toBe(false);
    }
    const refused = { ok: false, error: 'The garrison takes no orders' };
    expect(order(state, red, garrison, 'patrol')).toEqual(refused);
    expect(
      applyCommand(state, {
        type: 'setScript',
        nation: red,
        commander: garrison.id,
        slots: Array.from({ length: 5 }, () => ({ kind: 'hold' as const })),
      }),
    ).toEqual(refused);
  });
});

describe('setScript and setFormation', () => {
  it('takes exactly five known slots', () => {
    const { state, red, chieftain } = setup();
    const slots: ScriptSlot[] = [
      { kind: 'attack' },
      { kind: 'hold' },
      { kind: 'cast', spellId: null },
      { kind: 'retreat' },
      { kind: 'hold' },
    ];
    const set = (s: ScriptSlot[]) =>
      applyCommand(state, { type: 'setScript', nation: red, commander: chieftain.id, slots: s });
    expect(set(slots)).toEqual({ ok: true });
    expect(chieftain.script).toEqual(slots);
    expect(chieftain.script[0]).not.toBe(slots[0]);
    expect(set(slots.slice(0, 4)).ok).toBe(false);
    expect(set([...slots, { kind: 'hold' }]).ok).toBe(false);
    expect(set([{ kind: 'dance' } as never, ...slots.slice(1)]).ok).toBe(false);
  });

  it('names battle spells the commander’s pips can cast, research aside', () => {
    const { state, red, chieftain, adept, priest } = setup();
    const named = (c: CommanderState, spellId: string) =>
      applyCommand(state, {
        type: 'setScript',
        nation: red,
        commander: c.id,
        slots: [{ kind: 'cast', spellId }, ...adept.script.slice(1)],
      });
    expect(named(adept, 'emberDart')).toEqual({ ok: true });
    // Pyre Storm needs RRR; Warcry needs only R and level 2 research, checked in battle.
    expect(named(adept, 'pyreStorm')).toEqual({
      ok: false,
      error: 'Ember Adept cannot cast Pyre Storm',
    });
    expect(named(adept, 'warcry')).toEqual({ ok: true });
    expect(named(priest, 'bless')).toEqual({ ok: true });
    expect(named(adept, 'bless').ok).toBe(false);
    expect(named(chieftain, 'emberDart').ok).toBe(false);
    expect(named(adept, 'callFireSprites')).toEqual({
      ok: false,
      error: 'Call Fire Sprites is a ritual',
    });
    expect(named(adept, 'fireworks')).toEqual({ ok: false, error: 'Unknown spell' });
  });

  it('moves a squad to another row', () => {
    const { state, red, chieftain, scout } = setup();
    const squad = chieftain.squads[0]!;
    const set = (commander: CommanderState, formation: string) =>
      applyCommand(state, {
        type: 'setFormation',
        nation: red,
        commander: commander.id,
        squad: squad.id,
        formation: formation as 'rear',
      });
    expect(set(chieftain, 'rear')).toEqual({ ok: true });
    expect(squad.formation).toBe('rear');
    // Moving the archers into the warriors' row keeps two squads: different units.
    const archers = chieftain.squads[1]!;
    applyCommand(state, {
      type: 'setFormation',
      nation: red,
      commander: chieftain.id,
      squad: archers.id,
      formation: 'rear',
    });
    expect(chieftain.squads).toHaveLength(2);
    expect(set(scout, 'front').ok).toBe(false);
    expect(set(chieftain, 'sideways').ok).toBe(false);
  });
});

describe('transferSquad', () => {
  it('moves a whole squad between commanders standing together', () => {
    const { state, red, chieftain, garrison } = setup();
    const squad = chieftain.squads[1]!;
    const result = applyCommand(state, {
      type: 'transferSquad',
      nation: red,
      from: chieftain.id,
      to: garrison.id,
      squad: squad.id,
    });
    expect(result).toEqual({ ok: true });
    expect(garrison.squads).toEqual([squad]);
    expect(chieftain.squads.map((s) => s.unit)).toEqual(['cinderWarrior']);
  });

  it('splits off part of a squad with its share of the HP pool', () => {
    const { state, red, chieftain, priest } = setup();
    const squad = chieftain.squads[0]!;
    squad.hp = 200; // 20 Cinder Warriors, wounded
    squad.starvedDays = 3;
    const result = applyCommand(state, {
      type: 'transferSquad',
      nation: red,
      from: chieftain.id,
      to: priest.id,
      squad: squad.id,
      count: 5,
    });
    expect(result).toEqual({ ok: true });
    expect([squad.count, squad.hp]).toEqual([15, 150]);
    const moved = priest.squads[0]!;
    expect(moved).toMatchObject({ unit: 'cinderWarrior', count: 5, hp: 50, starvedDays: 3 });
    expect(moved.id).not.toBe(squad.id);
  });

  it('merges into a squad of the same unit and row, keeping the hungrier counter', () => {
    const { state, red, chieftain, garrison } = setup();
    const warriors = chieftain.squads[0]!;
    const move = (count: number) =>
      applyCommand(state, {
        type: 'transferSquad',
        nation: red,
        from: chieftain.id,
        to: garrison.id,
        squad: warriors.id,
        count,
      });
    expect(move(5)).toEqual({ ok: true });
    garrison.squads[0]!.starvedDays = 4;
    expect(move(5)).toEqual({ ok: true });
    expect(garrison.squads.map((s) => [s.unit, s.count, s.hp, s.starvedDays])).toEqual([
      ['cinderWarrior', 10, 110, 4],
    ]);
    // A hungrier newcomer raises the counter too.
    warriors.starvedDays = 9;
    expect(move(10)).toEqual({ ok: true });
    expect(chieftain.squads.map((s) => s.unit)).toEqual(['flameArcher']);
    expect(garrison.squads.map((s) => [s.count, s.starvedDays])).toEqual([[20, 9]]);
  });

  it('respects leadership and needs both commanders in one place and standing still', () => {
    const { state, red, chieftain, scout, priest } = setup();
    const squad = chieftain.squads[0]!;
    const transfer = (to: CommanderState, count?: number) =>
      applyCommand(state, {
        type: 'transferSquad',
        nation: red,
        from: chieftain.id,
        to: to.id,
        squad: squad.id,
        ...(count === undefined ? {} : { count }),
      });
    // A Scout leads 10.
    expect(transfer(scout, 11).ok).toBe(false);
    expect(transfer(scout, 10).ok).toBe(true);
    expect(transfer(scout, 1).ok).toBe(false);
    for (const count of [0, 11, 2.5]) expect(transfer(priest, count).ok).toBe(false);
    expect(transfer(chieftain).ok).toBe(false);
    const away = addArmy(state, red, independentProvince(state).id, 'cinderWarrior', 1);
    expect(transfer(away, 1).ok).toBe(false);
    priest.transit = { from: priest.location, to: priest.location, progress: 1, totalDays: 4 };
    expect(transfer(priest, 1).ok).toBe(false);
  });
});

describe('squad bookkeeping', () => {
  it('keeps one squad per unit and row and conserves troops and HP through any shuffle', () => {
    const { state, red, chieftain, garrison, priest } = setup();
    const total = () =>
      [chieftain, garrison, priest].reduce(
        (sum, c) => {
          for (const s of c.squads) {
            sum.count += s.count;
            sum.hp += s.hp;
          }
          return sum;
        },
        { count: 0, hp: 0 },
      );
    const start = total();
    const people = [chieftain, garrison, priest];
    const rows = ['front', 'middle', 'rear'] as const;
    let seed = 7;
    const next = (n: number) => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed % n;
    };
    for (let step = 0; step < 300; step++) {
      const from = people[next(3)]!;
      const squad = from.squads[next(Math.max(1, from.squads.length))];
      if (!squad) continue;
      if (next(2) === 0) {
        applyCommand(state, {
          type: 'transferSquad',
          nation: red,
          from: from.id,
          to: people[next(3)]!.id,
          squad: squad.id,
          count: 1 + next(squad.count),
        });
      } else {
        applyCommand(state, {
          type: 'setFormation',
          nation: red,
          commander: from.id,
          squad: squad.id,
          formation: rows[next(3)]!,
        });
      }
      for (const c of people) {
        const keys = c.squads.map((s) => `${s.unit} ${s.formation}`);
        expect(new Set(keys).size).toBe(keys.length);
        for (const s of c.squads) expect(s.count).toBeGreaterThan(0);
      }
    }
    expect(total().count).toBe(start.count);
    expect(total().hp).toBeCloseTo(start.hp, 6);
  });

  it('merges a squad moved into an occupied row into the squad already there', () => {
    const { state, red, chieftain } = setup();
    const [warriors, archers] = chieftain.squads as [Squad, Squad];
    // Stand in a second squad of warriors in the middle row.
    archers.unit = 'cinderWarrior';
    archers.hp = 110;
    applyCommand(state, {
      type: 'setFormation',
      nation: red,
      commander: chieftain.id,
      squad: archers.id,
      formation: 'front',
    });
    expect(chieftain.squads).toEqual([{ ...warriors, count: 30, hp: 330 }]);
    expect(chieftain.squads[0]!.id).toBe(warriors.id);
  });
});

describe('build', () => {
  it('starts a construction with the commander on the job', () => {
    const { state, red, chieftain } = setup();
    const p = annex(state, red, independentProvince(state).id);
    chieftain.location = p.id;
    const gold = state.nations[red]!.gold;
    const cmd = {
      type: 'build',
      nation: red,
      province: p.id,
      commander: chieftain.id,
      building: 'temple',
    } as const;
    expect(applyCommand(state, cmd)).toEqual({ ok: true });
    expect(state.nations[red]!.gold).toBe(gold - 200);
    expect(chieftain.order).toEqual({ kind: 'build', building: 'temple', province: p.id });
    expect(p.construction).toMatchObject({ building: 'temple', nation: red, daysLeft: 30 });
    expect(applyCommand(state, cmd).ok).toBe(false);
    runDays(state, 30);
    expect(p.buildings).toEqual(['temple']);
    expect(applyCommand(state, cmd).ok).toBe(false);
  });

  it('needs the commander in the province, gold, and a buildable building', () => {
    const { state, red, capital, chieftain, garrison } = setup();
    const p = annex(state, red, independentProvince(state).id);
    const build = (commander: CommanderState, building: string, province = p.id) =>
      applyCommand(state, {
        type: 'build',
        nation: red,
        province,
        commander: commander.id,
        building: building as 'lab',
      });
    expect(build(chieftain, 'lab').ok).toBe(false);
    chieftain.location = p.id;
    expect(build(chieftain, 'fort').ok).toBe(false);
    expect(build(chieftain, 'palace').ok).toBe(false);
    capital.buildings = ['fort'];
    expect(build(garrison, 'lab', capital.id)).toEqual({
      ok: false,
      error: 'The garrison takes no orders',
    });
    state.nations[red]!.gold = 299;
    expect(build(chieftain, 'lab').ok).toBe(false);
    state.nations[red]!.gold = 300;
    expect(build(chieftain, 'lab').ok).toBe(true);
  });
});
