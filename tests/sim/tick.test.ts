// advance(): day counting, step order, effect expiry, and determinism (acceptance criterion 4).
import { describe, expect, it } from 'vitest';
import { startConstruction } from '../../src/sim/buildings';
import { createCommander } from '../../src/sim/commanders';
import { createGame } from '../../src/sim/createGame';
import { newId, type NationId } from '../../src/sim/ids';
import { findPath } from '../../src/sim/movement';
import { provinceEconomy } from '../../src/sim/selectors';
import { advance } from '../../src/sim/tick';
import type { GameState } from '../../src/sim/types';
import { expectPerformance, measure } from '../helpers/performance';
import {
  addArmy,
  annex,
  capitalOf,
  castRitual,
  independentProvince,
  move,
  nation,
  nationIds,
  redField,
  ritualCaster,
  runDays,
  twoNationGame,
} from './fixtures';

describe('advance', () => {
  it('moves one day at a time', () => {
    const state = twoNationGame();
    advance(state);
    advance(state);
    expect(state.day).toBe(2);
  });

  it('applies a province effect before its until day and drops it at the end of the day before', () => {
    const state = twoNationGame();
    const red = nationIds(state)[0]!;
    const capital = capitalOf(state, red).id;
    const supply = provinceEconomy(state, capital).supply;
    state.provinceEffects.push({
      id: 'fx99' as never,
      province: capital,
      nation: red,
      source: 'test',
      untilDay: 3,
      kind: 'supply',
      deltaPct: 1,
    });
    // In force on days 0, 1, and 2.
    runDays(state, 2);
    expect(state.day).toBe(2);
    expect(state.provinceEffects).toHaveLength(1);
    expect(provinceEconomy(state, capital).supply).toBeGreaterThan(supply * 1.9);
    // A stored effect past its day is ignored even before the tick drops it.
    state.day = 3;
    expect(provinceEconomy(state, capital).supply).toBeLessThan(supply * 1.1);
    state.day = 2;
    runDays(state, 1);
    expect(state.provinceEffects).toHaveLength(0);
  });

  it('runs step 3’s rituals before research, so a ritual lands first on a shared day', () => {
    const { state, red, capital } = redField();
    const r = ritualCaster(state, red);
    createCommander(state, 'emberAdept', red, capital).order = { kind: 'research' };
    state.nations[red]!.research.color = 'R';
    expect(castRitual(state, red, r, 'callFireSprites')).toEqual({ ok: true });
    runDays(state, 4);
    // Level 2 is 150 points: one more day of research reaches it as the ritual completes.
    state.nations[red]!.research.points.R = 150 - 1e-6;
    const day = state.day;
    advance(state);
    const today = state.messages.filter(
      (m) => m.day === day && m.nation === red && (m.kind === 'ritual' || m.kind === 'research'),
    );
    expect(today.map((m) => m.kind)).toEqual(['ritual', 'research']);
  });

  it('stops once the game has a result', () => {
    const state = twoNationGame();
    state.result = { day: 0, winner: null, reason: 'playerDefeated' };
    advance(state);
    expect(state.day).toBe(0);
  });

  it('is deterministic: the same seed gives the same state after 365 days', () => {
    const a = twoNationGame(11);
    const b = twoNationGame(11);
    runDays(a, 365);
    runDays(b, 365);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('continues identically after a save and load in the middle of everything', () => {
    const a = busyGame();
    runDays(a, 12);
    // Mid-construction, mid-pillage, starving, with an effect that outlives the save.
    expect(Object.values(a.provinces).some((p) => p.construction !== null)).toBe(true);
    expect(a.provinceEffects).toHaveLength(1);
    expect(a.messages.some((m) => m.kind === 'starvation')).toBe(true);
    expect(a.nations[nationIds(a)[3]!]!.unpaidDays).toBeGreaterThan(0);
    expect(Object.values(a.commanders).some((c) => c.order.kind === 'pillage')).toBe(true);
    const b = JSON.parse(JSON.stringify(a)) as GameState;
    runDays(a, 60);
    runDays(b, 60);
    expect(JSON.stringify(b)).toBe(JSON.stringify(a));
    expect(a.provinceEffects).toHaveLength(0);
  });

  // 6.24 s with 36 CPU burners on 9 logical CPUs (Task 3); 15 s gives >2x measured
  // scheduling headroom. The claim is byte-identical state, not a gameplay speed budget.
  it('runs a busy game the same way twice', () => {
    const a = busyGame();
    const b = busyGame();
    runDays(a, 90);
    runDays(b, 90);
    expect(JSON.stringify(b)).toBe(JSON.stringify(a));
  }, 15_000);

  it('keeps a heavy marching day near the 2 ms budget (docs/06)', () => {
    const base = marchingGame();
    const marching = (state: GameState) =>
      Object.values(state.commanders).filter((c) => c.order.kind === 'move').length;
    runDays(base, 5);
    expect(marching(base)).toBeGreaterThan(150);
    // Warm the full measured workload (five days do not reach the same JIT paths).
    runDays(structuredClone(base), 60);
    // Five identical 60-day batches; clone outside the measurement, check every result.
    // Quiet wall acceptance enforces docs/06's 2 ms. Process CPU includes parallel V8:
    // measured CPU/wall ~1.6x; allow up to 2x CPU ONLY (4 ms, tighter than the old 10 ms
    // guard), without raising the 2 ms elapsed target. See docs/qa/task3-results.md.
    const samples = Array.from({ length: 5 }, () => {
      const state = structuredClone(base);
      const timing = measure(() => {
        runDays(state, 60);
      }, 60);
      expect(state.battles).toEqual([]);
      expect(state.day).toBe(base.day + 60);
      return timing;
    });
    expectPerformance('heavy marching day', samples, 2, { cpuOnlyHeadroomMs: 2 });
  });

  it('continues identically after a save and load', () => {
    const a = twoNationGame(12);
    runDays(a, 100);
    const b = JSON.parse(JSON.stringify(a)) as GameState;
    runDays(a, 100);
    runDays(b, 100);
    expect(JSON.stringify(b)).toBe(JSON.stringify(a));
  });
});

/**
 * Four nations, one an easy AI, with a construction under way, a pillaging army, a starving
 * army, an unpaid treasury, and a timed effect.
 */
function busyGame(): GameState {
  const state = createGame({
    seed: 21,
    mapSize: 'medium',
    nations: [
      nation('cinderHorde'),
      nation('thornwood', { ai: { difficulty: 'easy' } }),
      nation('cinderHorde', { ai: { difficulty: 'normal' } }, { order: -2, growth: -3 }),
      nation('thornwood', { ai: { difficulty: 'normal' } }, { wild: 3, sanctity: -2 }),
    ],
  });
  const [red, green, red2, green2] = nationIds(state) as [NationId, NationId, NationId, NationId];
  const site = independentProvince(state);
  site.owner = red;
  const builder = addArmy(state, red, site.id, 'cinderWarrior', 3);
  builder.order = { kind: 'build', building: 'temple', province: site.id };
  startConstruction(state, site.id, 'temple', red, builder.id);
  addArmy(state, green, independentProvince(state).id, 'warden', 30, 'wardenCaptain').order = {
    kind: 'pillage',
  };
  addArmy(state, red2, independentProvince(state, 'mountains').id, 'cinderWarrior', 250);
  state.nations[green2]!.gold = 0;
  for (let k = 0; k < 4; k++) {
    addArmy(state, green2, state.nations[green2]!.capital, 'oakheart', 60, 'wardenCaptain');
  }
  state.provinceEffects.push({
    id: newId(state, 'effect'),
    province: state.nations[red2]!.capital,
    nation: red2,
    source: 'test',
    untilDay: 40,
    kind: 'growth',
    deltaScale: 1,
  });
  return state;
}

/**
 * Four nations that split the whole map between them, with 200 commanders marching long paths
 * through their own land and no battles to fight.
 */
function marchingGame(): GameState {
  const state = createGame({
    seed: 7,
    mapSize: 'medium',
    nations: [
      nation('cinderHorde'),
      nation('thornwood'),
      nation('cinderHorde'),
      nation('thornwood'),
    ],
  });
  const nations = nationIds(state);
  const queue = nations.map((n) => [state.nations[n]!.capital, n] as const);
  const owner = new Map(queue);
  for (const [p, n] of queue) {
    for (const q of state.map.provinces[p]!.neighbors) {
      if (owner.has(q)) continue;
      owner.set(q, n);
      queue.push([q, n]);
    }
  }
  for (const [p, n] of owner) annex(state, n, p);
  const provinces = [...owner.keys()];
  for (let k = 0; Object.keys(state.commanders).length < 200; k++) {
    const n = nations[k % nations.length]!;
    const mine = provinces.filter((p) => owner.get(p) === n);
    const troops = state.nations[n]!.def === 'cinderHorde' ? 'ashMilitia' : 'thornMilitia';
    addArmy(state, n, mine[k % mine.length]!, troops, 20);
  }
  let k = 0;
  for (const c of Object.values(state.commanders)) {
    if (c.owner === null || c.unit === 'garrison') continue;
    const mine = provinces.filter((p) => owner.get(p) === c.owner);
    const to = mine[(k++ * 7) % mine.length]!;
    const path = findPath(state, c.owner, c.location, to, 2);
    if (path && path.length > 0) move(state, c.owner, [c], path);
  }
  return state;
}
