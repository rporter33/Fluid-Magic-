// Movement (docs/01-core-rules.md section 6). Expected days come from the terrain table in
// section 2 and the speed factors 1.5 / 1.0 / 0.7, rounded to whole days. pathsFrom (Phase 7)
// gives every target the path findPath finds, in one search.
import { describe, expect, it } from 'vitest';
import type { UnitTypeId } from '../../src/content';
import { TERRAIN_IDS, type TerrainId } from '../../src/content/terrain';
import { applyCommand } from '../../src/sim/commands';
import type { NationId, ProvinceId } from '../../src/sim/ids';
import {
  advanceTransits,
  canMove,
  commanderMapSpeed,
  etaDays,
  findPath,
  findPathFor,
  hostileProvinces,
  isHostile,
  legDays,
  pathDays,
  pathEta,
  pathsFrom,
} from '../../src/sim/movement';
import { withinHops } from '../../src/sim/rituals';
import type { CommanderState, GameState } from '../../src/sim/types';
import {
  addArmy,
  annex,
  commandersIn,
  move,
  nationIds,
  neighbors,
  redField,
  runDays,
  twoNationGame,
} from './fixtures';

const LEG_DAYS: Record<TerrainId, [number, number, number]> = {
  // [speed 1, speed 2, speed 3]
  plains: [6, 4, 3],
  farmland: [6, 4, 3],
  forest: [9, 6, 4],
  hills: [9, 6, 4],
  mountains: [14, 9, 6],
  swamp: [12, 8, 6],
  wasteland: [8, 5, 4],
};

function provinceOn(state: GameState, terrain: TerrainId): ProvinceId {
  const mp = Object.values(state.map.provinces).find((p) => p.terrain === terrain);
  if (!mp) throw new Error(`no ${terrain}`);
  return mp.id;
}

const setup = redField;

describe('leg days', () => {
  it('match the terrain table at every map speed', () => {
    const state = twoNationGame(2, {}, {});
    for (const terrain of TERRAIN_IDS) {
      const p = provinceOn(state, terrain);
      expect([1, 2, 3].map((speed) => legDays(state, p, speed))).toEqual(LEG_DAYS[terrain]);
    }
  });

  it('refuse speeds that cannot move', () => {
    const state = twoNationGame();
    expect(() => legDays(state, provinceOn(state, 'plains'), 0)).toThrow();
  });

  it('use the slowest of a commander and its squads', () => {
    const { state, red, capital, army } = setup();
    expect(commanderMapSpeed(army)).toBe(2);
    const riders = addArmy(state, red, capital, 'ashRider', 5, 'cinderScout');
    expect(commanderMapSpeed(riders)).toBe(3);
    riders.squads.push(...addArmy(state, red, capital, 'cinderWarrior', 1).squads);
    expect(commanderMapSpeed(riders)).toBe(2);
    const garrison = state.commanders[state.provinces[capital]!.garrison!]!;
    expect(commanderMapSpeed(garrison)).toBe(0);
  });
});

describe('moving', () => {
  it('arrives after the leg days of the destination terrain', () => {
    const { state, red, capital, army } = setup();
    const next = neighbors(state, capital)[0]!;
    const days = legDays(state, next, 2);
    expect(move(state, red, [army], [next])).toEqual({ ok: true });
    expect(army.transit).toEqual({ from: capital, to: next, progress: 0, totalDays: days });
    expect(etaDays(state, army)).toBe(days);
    runDays(state, days - 1);
    expect(army.location).toBe(capital);
    expect(army.transit?.progress).toBe(days - 1);
    expect(etaDays(state, army)).toBe(1);
    runDays(state, 1);
    expect(army.transit).toBeNull();
    expect(army.location).toBe(next);
    expect(army.cameFrom).toBe(capital);
    expect(army.order).toEqual({ kind: 'idle' });
  });

  it('walks a path through its own provinces leg after leg, ETA the sum of legs', () => {
    const { state, red, capital, army } = setup();
    const a = neighbors(state, capital)[0]!;
    const b = neighbors(state, a).find((n) => n !== capital)!;
    const c = neighbors(state, b).find((n) => n !== a && n !== capital)!;
    for (const p of [a, b]) annex(state, red, p);
    const total = pathDays(state, [a, b, c], 2);
    move(state, red, [army], [a, b, c]);
    expect(etaDays(state, army)).toBe(total);
    runDays(state, legDays(state, a, 2));
    expect(army.location).toBe(a);
    expect(army.transit).toMatchObject({ from: a, to: b, progress: 0 });
    expect(etaDays(state, army)).toBe(total - legDays(state, a, 2));
    runDays(state, total - legDays(state, a, 2));
    expect(army.location).toBe(c);
    expect(army.transit).toBeNull();
    expect(army.cameFrom).toBe(b);
  });

  it('stops where it meets hostiles: a lost province or a foreign army', () => {
    const { state, red, green, capital, army } = setup();
    const a = neighbors(state, capital)[0]!;
    const b = neighbors(state, a).find((n) => n !== capital)!;
    const c = neighbors(state, b).find((n) => n !== a && n !== capital)!;
    for (const p of [a, b]) annex(state, red, p);
    move(state, red, [army], [a, b, c]);
    state.provinces[a]!.owner = green;
    runDays(state, legDays(state, a, 2));
    expect(army.location).toBe(a);
    expect(army.transit).toBeNull();
    expect(army.order).toEqual({ kind: 'idle' });
    runDays(state, 20);
    expect(army.location).toBe(a);

    state.provinces[a]!.owner = red;
    move(state, red, [army], [b, c]);
    addArmy(state, green, b, 'warden', 5, 'wardenCaptain');
    runDays(state, legDays(state, b, 2));
    expect(army.location).toBe(b);
    expect(army.order).toEqual({ kind: 'idle' });
  });

  it('keeps a non-move order given while marching', () => {
    const { state, red, capital, army } = setup();
    const a = neighbors(state, capital)[0]!;
    move(state, red, [army], [a]);
    applyCommand(state, { type: 'setOrder', nation: red, commander: army.id, order: 'pillage' });
    runDays(state, legDays(state, a, 2));
    expect(army.location).toBe(a);
    expect(army.order).toEqual({ kind: 'pillage' });
  });

  it('moves fast troops at speed 3 under any national commander', () => {
    const { state, red, capital } = setup();
    const riders = addArmy(state, red, capital, 'ashRider', 10);
    const plains = neighbors(state, capital).find(
      (p) => state.map.provinces[p]!.terrain === 'plains',
    );
    const target = plains ?? neighbors(state, capital)[0]!;
    move(state, red, [riders], [target]);
    expect(riders.order).toMatchObject({ mapSpeed: 3 });
    expect(riders.transit?.totalDays).toBe(LEG_DAYS[state.map.provinces[target]!.terrain][2]);
    if (plains) expect(riders.transit?.totalDays).toBe(3);
  });

  it('previews the ETA of a path before ordering it', () => {
    const { state, red, capital, army } = setup();
    const a = neighbors(state, capital)[0]!;
    annex(state, red, a);
    const b = neighbors(state, a).find((n) => n !== capital)!;
    expect(pathEta(state, [army], [a, b])).toBe(pathDays(state, [a, b], 2));
    move(state, red, [army], [a]);
    runDays(state, 1);
    expect(pathEta(state, [army], [b])).toBe(legDays(state, a, 2) - 1 + legDays(state, b, 2));
  });

  it('keeps a group together at its slowest speed on every leg', () => {
    const { state, red, capital, army } = setup();
    const wardens = addArmy(state, red, capital, 'cinderWarrior', 5);
    wardens.squads[0]!.unit = 'warden';
    const a = neighbors(state, capital)[0]!;
    annex(state, red, a);
    const b = neighbors(state, a).find((n) => n !== capital)!;
    expect(pathEta(state, [army, wardens], [a, b])).toBe(pathDays(state, [a, b], 1));
    move(state, red, [army, wardens], [a, b]);
    for (const c of [army, wardens]) {
      expect(c.order).toEqual({ kind: 'move', path: [b], mapSpeed: 1 });
      expect(c.transit?.totalDays).toBe(legDays(state, a, 1));
      expect(etaDays(state, c)).toBe(pathDays(state, [a, b], 1));
    }
    runDays(state, legDays(state, a, 1));
    for (const c of [army, wardens]) {
      expect(c.transit).toEqual({ from: a, to: b, progress: 0, totalDays: legDays(state, b, 1) });
    }
    runDays(state, legDays(state, b, 1) - 1);
    expect([army.transit, wardens.transit]).not.toContain(null);
    runDays(state, 1);
    expect([army.location, wardens.location]).toEqual([b, b]);
  });

  it('lets a moving commander take a new path from the end of its leg', () => {
    const { state, red, capital, army } = setup();
    const [a, other] = neighbors(state, capital) as [ProvinceId, ProvinceId];
    annex(state, red, a);
    move(state, red, [army], [a]);
    runDays(state, 1);
    expect(move(state, red, [army], [capital, other])).toEqual({ ok: true });
    expect(army.transit).toMatchObject({ from: capital, to: a, progress: 1 });
    runDays(state, legDays(state, a, 2) - 1);
    expect(army.location).toBe(a);
    expect(army.transit).toMatchObject({ from: a, to: capital });
  });

  it("returns each day's arrivals grouped by province in arrival order, then by nation", () => {
    const { state, red, green, capital } = setup();
    const [p1, p2] = neighbors(state, capital) as [ProvinceId, ProvinceId];
    // Created red, red, green, red, so grouping cannot lean on creation order.
    const r1 = addArmy(state, red, capital, 'cinderWarrior', 1);
    const r2 = addArmy(state, red, capital, 'cinderWarrior', 1);
    const g1 = addArmy(state, green, capital, 'warden', 1, 'wardenCaptain');
    const r3 = addArmy(state, red, capital, 'cinderWarrior', 1);
    for (const [c, to] of [
      [r1, p1],
      [r2, p2],
      [g1, p1],
      [r3, p1],
    ] as const) {
      c.transit = { from: capital, to, progress: 0, totalDays: 1 };
    }
    const arrivals = advanceTransits(state);
    expect(arrivals.map((x) => [x.province, x.nation, x.commanders.map((c) => c.id)])).toEqual([
      [p1, red, [r1.id, r3.id]],
      [p1, green, [g1.id]],
      [p2, red, [r2.id]],
    ]);
  });

  it('stops a stealthy scout like any army when its next province turns hostile', () => {
    const { state, red, capital } = setup();
    const scout = commandersIn(state, capital).find((c) => c.unit === 'cinderScout')!;
    const a = neighbors(state, capital)[0]!;
    const b = neighbors(state, a).find((n) => n !== capital)!;
    const c = neighbors(state, b).find((n) => n !== a && n !== capital)!;
    for (const p of [a, b]) annex(state, red, p);
    move(state, red, [scout], [a, b, c]);
    runDays(state, legDays(state, a, 3));
    state.provinces[b]!.owner = null;
    runDays(state, legDays(state, b, 3));
    expect(scout.location).toBe(b);
    expect(scout.transit).toBeNull();
    expect(scout.order).toEqual({ kind: 'idle' });
  });
});

describe('hostile provinces', () => {
  it('include an own province with a foreign army in it, marching or not, but not a hidden one', () => {
    const { state, red, green, capital } = setup();
    const a = neighbors(state, capital)[0]!;
    annex(state, red, a);
    expect(isHostile(state, red, a)).toBe(false);
    const scout = addArmy(state, green, a, 'warden', 1, 'thornScout');
    scout.squads = [];
    expect(isHostile(state, red, a)).toBe(false);
    const foe = addArmy(state, green, a, 'warden', 5, 'wardenCaptain');
    expect(isHostile(state, red, a)).toBe(true);
    foe.transit = { from: a, to: capital, progress: 1, totalDays: 6 };
    expect(isHostile(state, red, a)).toBe(true);
    expect(hostileProvinces(state, red).has(a)).toBe(true);
    expect(hostileProvinces(state, red).has(capital)).toBe(false);
  });

  it('may only end a path', () => {
    const { state, red, capital, army } = setup();
    const a = neighbors(state, capital)[0]!;
    const b = neighbors(state, a).find((n) => n !== capital)!;
    const result = move(state, red, [army], [a, b]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/hostile/);
    expect(move(state, red, [army], [a]).ok).toBe(true);
    runDays(state, 1);
    // Its leg ends in a hostile province, so a new path from there is refused.
    expect(move(state, red, [army], [b]).ok).toBe(false);
  });

  it('stop a march home into a besieged fort', () => {
    const { state, red, green, capital, army } = setup();
    const a = neighbors(state, capital)[0]!;
    annex(state, red, a);
    army.location = a;
    move(state, red, [army], [capital, a]);
    addArmy(state, green, capital, 'warden', 30, 'wardenCaptain');
    state.provinces[capital]!.siege = { attacker: green, wallHp: 300, storm: false };
    runDays(state, legDays(state, capital, 2));
    expect(army.location).toBe(capital);
    expect(army.order).toEqual({ kind: 'idle' });
  });
});

describe('reverse', () => {
  it('turns back with the days walked as the days home, then stops', () => {
    const { state, red, capital, army } = setup();
    const a = neighbors(state, capital)[0]!;
    const days = legDays(state, a, 2);
    move(state, red, [army], [a]);
    runDays(state, 2);
    expect(applyCommand(state, { type: 'reverse', nation: red, commander: army.id })).toEqual({
      ok: true,
    });
    expect(army.transit).toEqual({ from: a, to: capital, progress: days - 2, totalDays: days });
    // It never reached the far end: it still stands, eats, and sees from home.
    expect(army.location).toBe(capital);
    expect(commandersIn(state, capital)).toContain(army);
    expect(etaDays(state, army)).toBe(2);
    runDays(state, 2);
    expect(army.location).toBe(capital);
    expect(army.cameFrom).toBeNull();
    expect(army.transit).toBeNull();
    expect(army.order).toEqual({ kind: 'idle' });
  });

  it('drops the rest of a longer path, so the commander stops once home', () => {
    const { state, red, capital, army } = setup();
    const a = neighbors(state, capital)[0]!;
    annex(state, red, a);
    const b = neighbors(state, a).find(
      (n) => n !== capital && !neighbors(state, capital).includes(n),
    )!;
    move(state, red, [army], [a, b]);
    runDays(state, 2);
    applyCommand(state, { type: 'reverse', nation: red, commander: army.id });
    expect(army.order).toEqual({ kind: 'move', path: [], mapSpeed: 2 });
    runDays(state, 10);
    expect(army.location).toBe(capital);
    expect(army.transit).toBeNull();
    expect(army.order).toEqual({ kind: 'idle' });
  });

  it('cancels a leg not yet begun', () => {
    const { state, red, capital, army } = setup();
    move(state, red, [army], [neighbors(state, capital)[0]!]);
    applyCommand(state, { type: 'reverse', nation: red, commander: army.id });
    expect(army.transit).toBeNull();
    expect(army.location).toBe(capital);
    expect(army.order).toEqual({ kind: 'idle' });
  });

  it('is refused for a commander standing still', () => {
    const { state, red, army } = setup();
    expect(applyCommand(state, { type: 'reverse', nation: red, commander: army.id }).ok).toBe(
      false,
    );
  });
});

describe('pathsFrom', () => {
  /**
   * A game in play: each nation owns what lies within 2 hops of its capital, the rest stays
   * independent; each nation has an army standing in the other's land, a fast army, and two
   * armies on the move, one of them into an independent province.
   */
  function contested(seed: number): GameState {
    const state = twoNationGame(seed);
    const [red, green] = nationIds(state) as [NationId, NationId];
    const kits: Record<string, Record<'troop' | 'fast' | 'leader', UnitTypeId>> = {
      [red]: { troop: 'ashMilitia', fast: 'ashRider', leader: 'ashChieftain' },
      [green]: { troop: 'thornMilitia', fast: 'wolfRider', leader: 'wardenCaptain' },
    };
    for (const n of [red, green]) {
      for (const p of withinHops(state, state.nations[n]!.capital, 2)) {
        if (state.provinces[p]!.owner === null) annex(state, n, p);
      }
    }
    for (const [n, other] of [
      [red, green],
      [green, red],
    ] as const) {
      const { troop, fast, leader } = kits[n]!;
      const capital = state.nations[n]!.capital;
      const owned = (p: ProvinceId) => state.provinces[p]!.owner === n;
      const theirs = Object.values(state.provinces).find(
        (p) => p.owner === other && p.id !== state.nations[other]!.capital,
      )!;
      addArmy(state, n, theirs.id, troop, 5, leader);
      addArmy(state, n, capital, fast, 5, leader);
      const home = addArmy(state, n, capital, troop, 5, leader);
      move(state, n, [home], [neighbors(state, capital).find(owned)!]);
      const border = Object.keys(state.provinces).find(
        (p) =>
          owned(p as ProvinceId) &&
          neighbors(state, p as ProvinceId).some((q) => state.provinces[q]!.owner === null),
      ) as ProvinceId;
      const out = addArmy(state, n, border, troop, 5, leader);
      move(state, n, [out], [neighbors(state, border).find((q) => !owned(q))!]);
    }
    return state;
  }

  /** findPathFor as it was before pathsFrom: findPath from where the leg ends. */
  function oldFindPathFor(
    state: GameState,
    group: readonly CommanderState[],
    to: ProvinceId,
  ): ProvinceId[] | null {
    const lead = group[0]!;
    const start = lead.transit ? lead.transit.to : lead.location;
    if (lead.transit && isHostile(state, lead.owner!, start)) return null;
    return findPath(state, lead.owner!, start, to, Math.min(...group.map(commanderMapSpeed)));
  }

  it('gives every target the path findPath finds, and its days, on several seeds', () => {
    const seen = { standing: 0, marching: 0, stopping: 0, groups: 0 };
    for (const seed of [1, 2, 3, 4]) {
      for (const state of [twoNationGame(seed), contested(seed)]) {
        const ids = Object.keys(state.map.provinces) as ProvinceId[];
        const movers = Object.values(state.commanders).filter(
          (c) => c.owner !== null && canMove(c),
        );
        const groups = movers.map((c) => [c]);
        // Commanders standing together also move as one group, at the slowest one's pace.
        for (const c of movers) {
          const mates = movers.filter((m) => m.location === c.location && !m.transit && !c.transit);
          if (mates.length > 1 && mates[0] === c) groups.push(mates);
        }
        for (const group of groups) {
          const lead = group[0]!;
          const start = lead.transit ? lead.transit.to : lead.location;
          const stops = lead.transit !== null && isHostile(state, lead.owner!, start);
          const speed = Math.min(...group.map(commanderMapSpeed));
          seen.groups += group.length > 1 ? 1 : 0;
          if (stops) seen.stopping++;
          else if (lead.transit) seen.marching++;
          else seen.standing++;
          const paths = pathsFrom(state, group);
          for (const to of ids) {
            const old = oldFindPathFor(state, group, to);
            expect(paths.pathTo(to)).toEqual(old);
            expect(findPathFor(state, group, to)).toEqual(old);
            const days = old ? pathDays(state, old, speed) : to === start && !stops ? 0 : undefined;
            expect(paths.days(to)).toBe(days);
          }
          // Every province a path leads to, nearest first, ties to the lower index.
          const reachable = ids.filter((to) => paths.pathTo(to) !== null);
          const order = (a: ProvinceId, b: ProvinceId) =>
            paths.days(a)! - paths.days(b)! || ids.indexOf(a) - ids.indexOf(b);
          expect(paths.reached).toEqual([...reachable].sort(order));
        }
      }
    }
    // The sample covers standing groups, legs ending in friendly and in hostile provinces.
    expect(seen.standing).toBeGreaterThan(20);
    expect(seen.marching).toBeGreaterThanOrEqual(8);
    expect(seen.stopping).toBeGreaterThanOrEqual(8);
    expect(seen.groups).toBeGreaterThanOrEqual(8);
    // findPath for every province on several seeds: past vitest's 5 s default under load.
  }, 30_000);

  it('gives nothing to a group that cannot move or that stops at the end of its leg', () => {
    const state = contested(1);
    const [red] = nationIds(state) as [NationId];
    const capital = state.nations[red]!.capital;
    const garrison = state.commanders[state.provinces[capital]!.garrison!]!;
    const army = commandersIn(state, capital).find((c) => c.unit === 'ashChieftain')!;
    const stopping = Object.values(state.commanders).find(
      (c) => c.owner === red && c.transit && isHostile(state, red, c.transit.to),
    )!;
    for (const group of [[garrison], [army, garrison], [stopping], []]) {
      const paths = pathsFrom(state, group);
      expect(paths.reached).toEqual([]);
      for (const to of [capital, ...neighbors(state, capital)]) {
        expect(paths.days(to)).toBeUndefined();
        expect(paths.pathTo(to)).toBeNull();
      }
    }
  });
});
