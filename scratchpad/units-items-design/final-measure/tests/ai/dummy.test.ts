// The Phase 6 dummy AI and its random stream (docs/08-ai.md decisions, "The AI contract" and
// "The Phase 6 dummy"; docs/10-milestone-1.md Phase 6): it reads the state and never changes
// it, draws only from aiRng, offers only commands that apply in order, and follows the
// dummy's recruit, garrison, research, Wellspring, march, and go-home rules.
import { beforeAll, describe, expect, it } from 'vitest';
import { nationDef, type NationDefId } from '../../src/content';
import { defaultPreset } from '../../src/content/pretenders/presets';
import { playDay } from '../../src/ai/driver';
import { dummyPlayer } from '../../src/ai/dummy';
import { aiRng } from '../../src/ai/rng';
import { createCommander, createSquad } from '../../src/sim/commanders';
import { applyCommand, type Command } from '../../src/sim/commands';
import type { CommandOf, CommandType } from '../../src/sim/commands/types';
import { createGame } from '../../src/sim/createGame';
import { stateHash } from '../../src/sim/hash';
import { findPathFor } from '../../src/sim/movement';
import type { CommanderId, NationId, ProvinceId } from '../../src/sim/ids';
import { cloneRng, nextU32 } from '../../src/sim/rng';
import type { GameSetup, GameState } from '../../src/sim/types';
import { annex, nationIds, neighbors, redField } from '../sim/fixtures';

/** A runner-style game (src/ai/match.ts runnerSetup) with the nation order given. */
function runnerSetup(seed: number, order: readonly NationDefId[]): GameSetup {
  return {
    seed,
    mapSize: 'medium',
    nations: order.map((nation) => ({
      nation,
      pretender: defaultPreset(nation).design,
      ai: { difficulty: 'normal' },
    })),
  };
}

function runnerGame(seed = 1): GameState {
  return createGame(runnerSetup(seed, ['cinderHorde', 'thornwood']));
}

function ofType<T extends CommandType>(commands: readonly Command[], type: T): CommandOf<T>[] {
  return commands.filter((c): c is CommandOf<T> => c.type === type);
}

/** The commands naming this commander as the one acting. */
function commandsFor(commands: readonly Command[], id: CommanderId): Command[] {
  return commands.filter(
    (c) =>
      ('commander' in c && c.commander === id) || ('commanders' in c && c.commanders.includes(id)),
  );
}

/** Applies the commands in order on the state; returns each one's result. */
function applyAll(state: GameState, commands: readonly Command[]) {
  return commands.map((c) => applyCommand(state, c));
}

describe('aiRng', () => {
  it('depends on the seed, the day, and the slot, not on state.rng or anything else', () => {
    const state = runnerGame();
    const [first] = nationIds(state) as [NationId];
    const before = cloneRng(state.rng);
    const stream = aiRng(state, first);
    expect(stream).not.toBe(state.rng);
    expect(state.rng).toEqual(before);
    nextU32(state.rng);
    state.nations[first]!.gold += 1000;
    state.provinces[state.nations[first]!.capital]!.pop += 5000;
    expect(aiRng(state, first)).toEqual(stream);
  });

  it('gives each nation, day, and seed its own stream', () => {
    const state = runnerGame();
    const [a, b] = nationIds(state) as [NationId, NationId];
    const draw = (s: GameState, n: NationId) => nextU32(aiRng(s, n));
    const today = draw(state, a);
    expect(draw(state, b)).not.toBe(today);
    state.day += 1;
    expect(draw(state, a)).not.toBe(today);
    state.day -= 1;
    expect(draw(state, a)).toBe(today);
    expect(draw(runnerGame(2), a)).not.toBe(today);
  });

  it('follows the slot, not the nation definition in it', () => {
    const forward = createGame(runnerSetup(5, ['cinderHorde', 'thornwood']));
    const reverse = createGame(runnerSetup(5, ['thornwood', 'cinderHorde']));
    const [slot0, slot1] = nationIds(forward) as [NationId, NationId];
    expect(reverse.nations[slot0]!.def).toBe('thornwood');
    expect(aiRng(reverse, slot0)).toEqual(aiRng(forward, slot0));
    expect(aiRng(reverse, slot1)).toEqual(aiRng(forward, slot1));
  });
});

describe('dummyPlayer contract', () => {
  /** Snapshots of a runner game every 3 days of its first five months of driver play. */
  const snapshots: GameState[] = [];
  beforeAll(() => {
    const state = runnerGame(3);
    while (state.day <= 150) {
      if (state.day % 3 === 0) snapshots.push(structuredClone(state));
      playDay(state, dummyPlayer);
    }
  });

  /** Every snapshot with each of its nations. */
  function cases(): [GameState, NationId][] {
    return snapshots.flatMap((s) => nationIds(s).map((n): [GameState, NationId] => [s, n]));
  }

  it('reads the state and never changes it, state.rng included', () => {
    expect(snapshots).toHaveLength(51);
    for (const [state, nation] of cases()) {
      const hash = stateHash(state);
      const rng = cloneRng(state.rng);
      dummyPlayer(state, nation);
      expect(stateHash(state)).toBe(hash);
      expect(state.rng).toEqual(rng);
    }
  });

  it('gives the same commands for the same state, whatever state.rng holds', () => {
    for (const [state, nation] of cases()) {
      const commands = dummyPlayer(state, nation);
      expect(dummyPlayer(state, nation)).toEqual(commands);
      const copy = structuredClone(state);
      nextU32(copy.rng);
      expect(dummyPlayer(copy, nation)).toEqual(commands);
    }
  });

  it('offers only commands that apply in the order given', () => {
    const offered = new Set<CommandType>();
    for (const [state, nation] of cases()) {
      const copy = structuredClone(state);
      const commands = dummyPlayer(copy, nation);
      for (const [i, r] of applyAll(copy, commands).entries()) {
        expect(r, `day ${String(state.day)} ${nation} command ${String(i)}`).toEqual({ ok: true });
        offered.add(commands[i]!.type);
      }
    }
    // The sample covers recruits, garrison transfers, research orders, and marches.
    expect([...offered].sort()).toEqual(['move', 'recruit', 'setOrder', 'transferSquad']);
  });

  it('commands only its own nation and its own commanders', () => {
    let seen = 0;
    for (const [state, nation] of cases()) {
      for (const command of dummyPlayer(state, nation)) {
        seen++;
        expect(command.nation).toBe(nation);
        const ids = [
          ...('commander' in command ? [command.commander] : []),
          ...('commanders' in command ? command.commanders : []),
          ...('from' in command ? [command.from, command.to] : []),
        ];
        for (const id of ids) expect(state.commanders[id]!.owner).toBe(nation);
      }
    }
    expect(seen).toBeGreaterThan(20);
  });
});

describe('dummyPlayer research color', () => {
  it("sets research to the nation's primary color first, and only when it is elsewhere", () => {
    const { state, red } = redField();
    expect(ofType(dummyPlayer(state, red), 'setResearchColor')).toEqual([]);
    state.nations[red]!.research.color = 'W';
    expect(dummyPlayer(state, red)[0]).toEqual({
      type: 'setResearchColor',
      nation: red,
      color: 'R',
    });
  });
});

describe('dummyPlayer recruiting', () => {
  /** Red's capital with a full treasury and materials pool. */
  function rich() {
    const field = redField();
    field.state.nations[field.red]!.gold = 10_000;
    field.state.provinces[field.capital]!.materials = 10_000;
    return field;
  }

  it('recruits one general while it has fewer than 2 + provinces / 6 of them', () => {
    const { state, red, capital } = rich();
    expect(ofType(dummyPlayer(state, red), 'recruit')).toEqual([
      { type: 'recruit', nation: red, province: capital, unit: 'ashChieftain', count: 1 },
    ]);
  });

  it('recruits one batch of 10 troops once it has enough generals', () => {
    const { state, red, capital } = rich();
    createCommander(state, 'ashChieftain', red, capital);
    const recruits = ofType(dummyPlayer(state, red), 'recruit');
    expect(recruits).toHaveLength(1);
    expect(recruits[0]).toMatchObject({ nation: red, province: capital, count: 10 });
    // The troop is a random one, so it changes from day to day.
    const units = new Set<string>();
    for (let day = 0; day < 30; day++) {
      state.day = day;
      for (const r of ofType(dummyPlayer(state, red), 'recruit')) units.add(r.unit);
    }
    expect(units.size).toBeGreaterThan(1);
    for (const unit of units) expect(nationDef('cinderHorde').troops).toContain(unit);
  });

  it('wants one more general for every 6 provinces it owns', () => {
    const { state, red, capital } = rich();
    createCommander(state, 'ashChieftain', red, capital);
    const free = Object.values(state.provinces).filter((p) => p.owner === null);
    for (const p of free.slice(0, 4)) annex(state, red, p.id);
    // 5 provinces: 2 generals are enough.
    expect(ofType(dummyPlayer(state, red), 'recruit')[0]?.count).toBe(10);
    annex(state, red, free[4]!.id);
    // 6 provinces: it wants a third.
    expect(ofType(dummyPlayer(state, red), 'recruit')).toEqual([
      { type: 'recruit', nation: red, province: capital, unit: 'ashChieftain', count: 1 },
    ]);
  });

  it('counts only commanders that lead 40 or more and are not the garrison', () => {
    const { state, red, capital } = rich();
    createCommander(state, 'pyrePriest', red, capital);
    createCommander(state, 'cinderMagus', red, capital);
    expect(ofType(dummyPlayer(state, red), 'recruit')[0]?.unit).toBe('ashChieftain');
  });

  it('picks a troop it can afford', () => {
    const { state, red, capital } = redField();
    createCommander(state, 'ashChieftain', red, capital);
    state.provinces[capital]!.materials = 10_000;
    // 10 Ash Militia cost 80 gold; every other Cinder Horde troop costs over 100.
    state.nations[red]!.gold = 100;
    for (let day = 0; day < 20; day++) {
      state.day = day;
      expect(ofType(dummyPlayer(state, red), 'recruit')).toEqual([
        { type: 'recruit', nation: red, province: capital, unit: 'ashMilitia', count: 10 },
      ]);
    }
    state.nations[red]!.gold = 79;
    expect(ofType(dummyPlayer(state, red), 'recruit')).toEqual([]);
  });

  it('waits while the capital queue holds two items', () => {
    const { state, red, capital } = rich();
    createCommander(state, 'ashChieftain', red, capital);
    const order: Command = {
      type: 'recruit',
      nation: red,
      province: capital,
      unit: 'ashMilitia',
      count: 10,
    };
    expect(applyCommand(state, order).ok).toBe(true);
    expect(ofType(dummyPlayer(state, red), 'recruit')).toHaveLength(1);
    expect(applyCommand(state, order).ok).toBe(true);
    expect(ofType(dummyPlayer(state, red), 'recruit')).toEqual([]);
  });
});

describe('dummyPlayer garrison', () => {
  it("hands the capital garrison's troops to the generals there, as many as each can lead", () => {
    const { state, red, capital, army } = redField();
    const holder = state.commanders[state.provinces[capital]!.garrison!]!;
    const squad = createSquad(state, 'ashMilitia', 70);
    holder.squads.push(squad);
    const second = createCommander(state, 'ashChieftain', red, capital);
    const away = createCommander(state, 'ashChieftain', red, neighbors(state, capital)[0]!);
    const transfers = ofType(dummyPlayer(state, red), 'transferSquad');
    // The army leads 30 of 80; the new general leads none.
    expect(transfers).toEqual([
      {
        type: 'transferSquad',
        nation: red,
        from: holder.id,
        to: army.id,
        squad: squad.id,
        count: 50,
      },
      {
        type: 'transferSquad',
        nation: red,
        from: holder.id,
        to: second.id,
        squad: squad.id,
        count: 20,
      },
    ]);
    expect(applyAll(state, dummyPlayer(state, red)).every((r) => r.ok)).toBe(true);
    expect(holder.squads).toEqual([]);
    const troops = (id: CommanderId) =>
      state.commanders[id]!.squads.reduce((n, s) => n + s.count, 0);
    expect([troops(army.id), troops(second.id), troops(away.id)]).toEqual([80, 20, 0]);
  });

  it('gives nothing to a general without room or to commanders that are not generals', () => {
    const { state, red, capital, army } = redField();
    const holder = state.commanders[state.provinces[capital]!.garrison!]!;
    holder.squads.push(createSquad(state, 'ashMilitia', 30));
    army.squads.push(createSquad(state, 'cinderWarrior', 50));
    expect(ofType(dummyPlayer(state, red), 'transferSquad')).toEqual([]);
  });
});

describe('dummyPlayer mages and priests', () => {
  function faithful() {
    const field = redField();
    const own = Object.values(field.state.commanders).filter((c) => c.owner === field.red);
    const adept = own.find((c) => c.unit === 'emberAdept')!;
    const priest = own.find((c) => c.unit === 'pyrePriest')!;
    return { ...field, adept, priest };
  }

  it('sets idle mages in a lab to research, and priests to their faith first', () => {
    const { state, red, adept, priest } = faithful();
    const commands = dummyPlayer(state, red);
    expect(commandsFor(commands, adept.id)).toEqual([
      { type: 'setOrder', nation: red, commander: adept.id, order: 'research' },
    ]);
    // The Pyre Priest has a Red pip and stands in the capital lab, but preaches.
    expect(commandsFor(commands, priest.id)).toEqual([
      { type: 'setOrder', nation: red, commander: priest.id, order: 'preach' },
    ]);
  });

  it('leaves an idle mage outside a lab alone', () => {
    const { state, red, capital, adept } = faithful();
    adept.location = annex(state, red, neighbors(state, capital)[0]!).id;
    expect(commandsFor(dummyPlayer(state, red), adept.id)).toEqual([]);
  });

  it('has an idle priest claim the Wellspring where it stands', () => {
    const { state, red, priest } = faithful();
    priest.location = annex(state, red, state.map.wellsprings[0]!).id;
    expect(commandsFor(dummyPlayer(state, red), priest.id)).toEqual([
      { type: 'claimWellspring', nation: red, commander: priest.id },
    ]);
  });

  it('has an idle priest preach where it cannot claim', () => {
    const { state, red, priest } = faithful();
    const preach = [{ type: 'setOrder', nation: red, commander: priest.id, order: 'preach' }];
    // An owned province without a Wellspring or a lab.
    const plain = Object.values(state.provinces).find(
      (p) =>
        p.owner === null && !state.map.provinces[p.id]!.wellspring && !p.buildings.includes('lab'),
    )!;
    priest.location = annex(state, red, plain.id).id;
    expect(commandsFor(dummyPlayer(state, red), priest.id)).toEqual(preach);
    // A Wellspring it has already claimed.
    const spring = annex(state, red, state.map.wellsprings[0]!);
    spring.wellspringClaimedBy = red;
    priest.location = spring.id;
    expect(commandsFor(dummyPlayer(state, red), priest.id)).toEqual(preach);
    // A Wellspring it does not own.
    priest.location = state.map.wellsprings[1]!;
    expect(state.provinces[priest.location]!.owner).not.toBe(red);
    expect(commandsFor(dummyPlayer(state, red), priest.id)).toEqual(preach);
  });

  it('walks a priest to a Wellspring its nation owns and has not claimed', () => {
    const { state, red, capital, priest } = faithful();
    // Red owns the shortest route from its capital to the Wellspring, so the priest can walk it.
    const spring = state.map.wellsprings[0]!;
    const cameFrom = new Map<ProvinceId, ProvinceId>();
    const queue: ProvinceId[] = [capital];
    while (queue.length > 0 && !cameFrom.has(spring)) {
      const at = queue.shift()!;
      for (const next of neighbors(state, at)) {
        if (next === capital || cameFrom.has(next)) continue;
        cameFrom.set(next, at);
        queue.push(next);
      }
    }
    for (let at = spring; at !== capital; at = cameFrom.get(at)!) annex(state, red, at);
    const path = findPathFor(state, [priest], spring)!;
    expect(path.at(-1)).toBe(spring);
    const walk = [{ type: 'move', nation: red, commanders: [priest.id], path }];
    expect(commandsFor(dummyPlayer(state, red), priest.id)).toEqual(walk);
    // A priest already preaching is called away too; once the spring is claimed it stays.
    priest.order = { kind: 'preach' };
    expect(commandsFor(dummyPlayer(state, red), priest.id)).toEqual(walk);
    state.provinces[spring]!.wellspringClaimedBy = red;
    expect(commandsFor(dummyPlayer(state, red), priest.id)).toEqual([]);
  });

  it('leaves a priest that is already busy alone', () => {
    const { state, red, priest } = faithful();
    priest.location = annex(state, red, state.map.wellsprings[0]!).id;
    priest.order = { kind: 'claimWellspring', daysLeft: 4 };
    expect(commandsFor(dummyPlayer(state, red), priest.id)).toEqual([]);
  });
});

describe('dummyPlayer armies', () => {
  it('marches an idle army of 10 or more troops to a neighboring province', () => {
    const { state, red, capital, army } = redField();
    army.squads = [createSquad(state, 'cinderWarrior', 10)];
    const moves = commandsFor(dummyPlayer(state, red), army.id);
    expect(moves).toEqual([
      { type: 'move', nation: red, commanders: [army.id], path: [expect.any(String)] },
    ]);
    const path = (moves[0] as CommandOf<'move'>).path;
    expect(neighbors(state, capital)).toContain(path[0]);
  });

  it('keeps an army of 9 troops at home', () => {
    const { state, red, army } = redField();
    army.squads = [createSquad(state, 'cinderWarrior', 9)];
    expect(commandsFor(dummyPlayer(state, red), army.id)).toEqual([]);
  });

  it('picks the march target from its own stream: it varies by day, never by state.rng', () => {
    const { state, red, army } = redField();
    const target = () =>
      (commandsFor(dummyPlayer(state, red), army.id)[0] as CommandOf<'move'>).path[0];
    const targets = new Set<string | undefined>();
    for (let day = 0; day < 30; day++) {
      state.day = day;
      const t = target();
      nextU32(state.rng);
      expect(target()).toBe(t);
      targets.add(t);
    }
    expect(targets.size).toBeGreaterThan(1);
  });

  it('sends a general with fewer than 10 troops home to the capital', () => {
    const { state, red, capital, army } = redField();
    const out = neighbors(state, capital)[0]!;
    annex(state, red, out);
    army.location = out;
    army.squads = [createSquad(state, 'cinderWarrior', 5)];
    expect(commandsFor(dummyPlayer(state, red), army.id)).toEqual([
      { type: 'move', nation: red, commanders: [army.id], path: [capital] },
    ]);
  });

  it('sends no small band home unless a general leads it', () => {
    const { state, red, capital } = redField();
    const scout = Object.values(state.commanders).find(
      (c) => c.owner === red && c.unit === 'cinderScout',
    )!;
    scout.location = annex(state, red, neighbors(state, capital)[0]!).id;
    expect(commandsFor(dummyPlayer(state, red), scout.id)).toEqual([]);
  });

  it('leaves armies on the move or under orders alone', () => {
    const { state, red, capital, army } = redField();
    const to = neighbors(state, capital)[0]!;
    expect(
      applyCommand(state, { type: 'move', nation: red, commanders: [army.id], path: [to] }).ok,
    ).toBe(true);
    expect(commandsFor(dummyPlayer(state, red), army.id)).toEqual([]);

    const other = redField();
    expect(
      applyCommand(other.state, {
        type: 'setOrder',
        nation: other.red,
        commander: other.army.id,
        order: 'patrol',
      }).ok,
    ).toBe(true);
    expect(commandsFor(dummyPlayer(other.state, other.red), other.army.id)).toEqual([]);
  });
});
