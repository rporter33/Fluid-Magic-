// The monthly spread's draws (docs/01-core-rules.md section 12 and its Phase 6 decisions
// "Spread", "Sources" and "Godless"; docs/09-balance.md): the 1d10 against the score, a
// uniform neighbor, every nation's checks shuffled together, a pretender's and a prophet's
// checks on the march, and Godless settled right after the spread. dominion.test.ts covers
// pushes, the sources standing still, and the rest of Godless.
import { describe, expect, it } from 'vitest';
import { DOMINION } from '../../src/content/rules';
import { createCommander } from '../../src/sim/commanders';
import { applyCommand } from '../../src/sim/commands';
import { isGodless, spreadDominion } from '../../src/sim/dominion';
import type { NationId, ProvinceId } from '../../src/sim/ids';
import { legDays } from '../../src/sim/movement';
import { advance } from '../../src/sim/tick';
import type { GameState } from '../../src/sim/types';
import {
  capitalOf,
  commandersIn,
  move,
  nationIds,
  neighbors,
  pretender,
  redGame,
  runDays,
  twoNationGame,
} from './fixtures';
import { checksBy, farProvince, preach } from './dominionFixtures';

function ids(state: GameState): [NationId, NationId] {
  return nationIds(state) as [NationId, NationId];
}

/** Far more of Green's dominion than any month of pushes can wear away. */
const DEEP = 1000;

/**
 * Ten red priests (20 checks a month) preach in a far province for some months. It and its
 * neighbors are Green's at DEEP strength, so each successful check takes exactly 1 off the
 * province it lands on: the result is the pushes per province.
 */
function spread(score: number, months: number) {
  const state = redGame(score);
  const [red, green] = ids(state);
  const p = farProvince(state);
  const area = [p.id, ...neighbors(state, p.id)];
  for (let i = 0; i < 10; i++) preach(createCommander(state, 'pyrePriest', red, p.id));
  expect(checksBy(state, red)[p.id]).toBe(20);
  for (const id of area) state.provinces[id]!.dominion = { nation: green, strength: DEEP };
  for (let month = 0; month < months; month++) {
    state.day = 30 * month + 29;
    spreadDominion(state);
  }
  const pushes = new Map<ProvinceId, number>();
  for (const id of area) {
    const d = state.provinces[id]!.dominion;
    expect(d.nation).toBe(green);
    pushes.set(id, DEEP - d.strength);
  }
  const total = [...pushes.values()].reduce((a, b) => a + b, 0);
  return { p: p.id, around: neighbors(state, p.id), pushes, total, checks: 20 * months };
}

describe('a spread check', () => {
  it('pushes on 1d10 ≤ the score: 1 in 10 at score 1, and 9 fails 1 in 10', () => {
    const one = spread(1, 15);
    expect(one.checks).toBe(300);
    // About 30 of 300; a roll of 0..9 would push about 60.
    expect(one.total).toBeGreaterThanOrEqual(15);
    expect(one.total).toBeLessThanOrEqual(45);
    // About 270 of 300; a die that never rolls 10 would never fail.
    const nine = spread(9, 15);
    expect(nine.total).toBeGreaterThanOrEqual(240);
    expect(nine.total).toBeLessThan(nine.checks);
  });

  it('lands 40% on its own province and spreads the rest evenly over every neighbor', () => {
    const { p, around, pushes, total, checks } = spread(DOMINION.checkDie, 15);
    // Score 10 never fails.
    expect(total).toBe(checks);
    const own = pushes.get(p) ?? 0;
    expect(own).toBeGreaterThanOrEqual(0.3 * checks);
    expect(own).toBeLessThanOrEqual(0.5 * checks);
    // Each neighbor gets at least half of an even share of the rest.
    const even = (checks - own) / around.length;
    expect(around.length).toBeGreaterThan(1);
    for (const n of around) expect(pushes.get(n), n).toBeGreaterThanOrEqual(even / 2);
  });
});

describe('the order of the checks', () => {
  it('mixes every nation’s checks, so neither nation always pushes last', () => {
    // Fifteen priests a side preach in one far province, both at score 3, and it starts each
    // month empty: the last push of the month decides who holds it.
    const state = twoNationGame(
      1,
      { pretender: pretender({ dominion: 3 }) },
      { pretender: pretender({ dominion: 3 }) },
    );
    const [red, green] = ids(state);
    const p = farProvince(state);
    for (let i = 0; i < 15; i++) {
      preach(createCommander(state, 'pyrePriest', red, p.id));
      preach(createCommander(state, 'grovePriest', green, p.id));
    }
    const held = new Map<NationId | null, number>();
    for (let month = 0; month < 300; month++) {
      p.dominion = { nation: null, strength: 0 };
      state.day = 30 * month + 29;
      spreadDominion(state);
      held.set(p.dominion.nation, (held.get(p.dominion.nation) ?? 0) + 1);
    }
    const first = held.get(red) ?? 0;
    const second = held.get(green) ?? 0;
    expect(first).toBeGreaterThan(0);
    expect(first).toBeGreaterThanOrEqual(0.7 * second);
    expect(second).toBeGreaterThanOrEqual(0.7 * first);
  });
});

describe('checks on the march', () => {
  it('come from the pretender and the prophet in transit, where they still stand', () => {
    const state = twoNationGame(1, { pretender: pretender({ awakening: 'awake' }) });
    const [red] = ids(state);
    const capital = capitalOf(state, red).id;
    const god = state.commanders[state.nations[red]!.pretenderId!]!;
    const chief = commandersIn(state, capital).find((c) => c.unit === 'ashChieftain')!;
    expect(applyCommand(state, { type: 'makeProphet', nation: red, commander: chief.id })).toEqual({
      ok: true,
    });
    const before = checksBy(state, red);
    expect(before).toEqual({
      [capital]: 4 + DOMINION.pretenderChecks + DOMINION.prophetChecks,
    });
    // The neighbor with the longest leg, so one day leaves both on the road.
    const to = neighbors(state, capital).reduce((a, b) =>
      legDays(state, b, 2) > legDays(state, a, 2) ? b : a,
    );
    expect(move(state, red, [god], [to])).toEqual({ ok: true });
    expect(move(state, red, [chief], [to])).toEqual({ ok: true });
    advance(state);
    for (const c of [god, chief]) {
      expect(c.transit, c.unit).not.toBeNull();
      expect(c.location, c.unit).toBe(capital);
    }
    expect(checksBy(state, red)).toEqual(before);
  });
});

describe('Godless after the spread', () => {
  it('falls in the tick whose spread takes the capital, not a month later', () => {
    // Red holds its capital at strength 1, with no temple and score 1; thirty Green priests
    // at score 10 preach there.
    const state = twoNationGame(
      1,
      { pretender: pretender({ dominion: 1 }) },
      { pretender: pretender({ dominion: 10 }) },
    );
    const [red, green] = ids(state);
    const capital = capitalOf(state, red);
    capital.buildings = capital.buildings.filter((b) => b !== 'temple');
    capital.dominion = { nation: red, strength: 1 };
    for (let i = 0; i < 30; i++) preach(createCommander(state, 'grovePriest', green, capital.id));
    runDays(state, 29);
    expect(capital.dominion).toEqual({ nation: red, strength: 1 });
    expect(isGodless(state, red)).toBe(false);
    advance(state); // Day 29, the month's last.
    expect(capital.dominion.nation).toBe(green);
    expect(state.nations[red]!.godless).toBe(true);
  });
});
