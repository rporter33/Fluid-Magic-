// The monthly dominion spread through the tick (docs/01-core-rules.md section 12 and its Phase 6
// decisions): month ends, growth from the capital, the cap, and flip messages.
import { describe, expect, it } from 'vitest';
import { createCommander } from '../../src/sim/commanders';
import { spreadDominion } from '../../src/sim/dominion';
import type { NationId } from '../../src/sim/ids';
import { dominionScore } from '../../src/sim/selectors';
import { advance } from '../../src/sim/tick';
import type { GameState, ProvinceState } from '../../src/sim/types';
import { annex, capitalOf, nationIds, neighbors, redGame, runDays } from './fixtures';
import { checksBy, farProvince, preach } from './dominionFixtures';

function ids(state: GameState): [NationId, NationId] {
  return nationIds(state) as [NationId, NationId];
}

/** An independent province next to a nation's capital. */
function independentNeighbor(state: GameState, nation: NationId): ProvinceState {
  const id = neighbors(state, capitalOf(state, nation).id).find(
    (n) => state.provinces[n]!.owner === null,
  );
  if (id === undefined) throw new Error('no independent neighbor');
  return state.provinces[id]!;
}

/** Every province's dominion, for comparing before and after. */
function dominionMap(state: GameState): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of Object.values(state.provinces)) {
    out[p.id] = `${p.dominion.nation ?? '-'}:${String(p.dominion.strength)}`;
  }
  return out;
}

function expectWithinScores(state: GameState): void {
  for (const p of Object.values(state.provinces)) {
    const { nation, strength } = p.dominion;
    expect(strength).toBeGreaterThanOrEqual(0);
    if (nation === null) expect(strength).toBe(0);
    else expect(strength).toBeLessThanOrEqual(dominionScore(state, nation));
  }
}

describe('spreadDominion through the tick', () => {
  it('spreads nothing before the last day of the month', () => {
    const state = redGame(10);
    const start = dominionMap(state);
    runDays(state, 29);
    expect(state.day).toBe(29);
    expect(dominionMap(state)).toEqual(start);
    advance(state);
    expect(state.day).toBe(30);
    expect(dominionMap(state)).not.toEqual(start);
    // Nothing moves again until the next month's last day.
    const afterFirst = dominionMap(state);
    runDays(state, 29);
    expect(dominionMap(state)).toEqual(afterFirst);
  });

  it('holds the capital and spreads to its neighbors over 6 months, never above the score', () => {
    const state = redGame(10);
    const [red, green] = ids(state);
    const capital = capitalOf(state, red).id;
    const around = neighbors(state, capital);
    expect(around.some((n) => state.provinces[n]!.dominion.nation === red)).toBe(false);
    for (let day = 0; day < 6 * 30; day++) {
      advance(state);
      expectWithinScores(state);
      expect(state.provinces[capital]!.dominion.nation).toBe(red);
    }
    expect(around.some((n) => state.provinces[n]!.dominion.nation === red)).toBe(true);
    expect(capitalOf(state, green).dominion.nation).toBe(green);
  });

  it('lands 40% on its own province, else a neighbor, and pushes on 1d10 ≤ the score', () => {
    // Five red priests preach in a far province; it and its neighbors are green's at strength
    // 10, so every successful check takes exactly 1 off somewhere in that area.
    const spread = (score: number) => {
      const state = redGame(score);
      const [red, green] = ids(state);
      const p = farProvince(state);
      const area = [p.id, ...neighbors(state, p.id)];
      for (let i = 0; i < 5; i++) preach(createCommander(state, 'pyrePriest', red, p.id));
      expect(checksBy(state, red)[p.id]).toBe(10);
      let total = 0;
      let own = 0;
      for (let month = 0; month < 3; month++) {
        for (const id of area) state.provinces[id]!.dominion = { nation: green, strength: 10 };
        state.day = 30 * month + 29;
        spreadDominion(state);
        for (const id of area) {
          const d = state.provinces[id]!.dominion;
          expect(d.nation).toBe(green);
          total += 10 - d.strength;
          if (id === p.id) own += 10 - d.strength;
        }
      }
      return { total, own };
    };
    // Score 10 never fails: all 30 checks of three months land in the area, about 40% on p.
    const sure = spread(10);
    expect(sure.total).toBe(30);
    expect(sure.own).toBeGreaterThanOrEqual(6);
    expect(sure.own).toBeLessThanOrEqual(18);
    // Score 1 succeeds on a 1 only: about 3 of 30.
    expect(spread(1).total).toBeLessThan(10);
  });

  it('tells the owner when a province’s dominating nation changes, and only then', () => {
    const state = redGame(10);
    const [red, green] = ids(state);
    const capital = capitalOf(state, red);
    // A red province next to the capital, held by green's dominion at strength 1, with ten
    // priests preaching in it; the capital's own dominion sits low, so it grows without
    // changing hands.
    const p = annex(state, red, independentNeighbor(state, red).id);
    p.dominion = { nation: green, strength: 1 };
    capital.dominion = { nation: red, strength: 3 };
    for (let i = 0; i < 10; i++) preach(createCommander(state, 'pyrePriest', red, p.id));
    const before = Object.fromEntries(
      Object.values(state.provinces).map((x) => [x.id, x.dominion.nation] as const),
    );
    state.day = 29;
    const firstMessage = state.messages.length;
    spreadDominion(state);

    expect(p.dominion.nation).toBe(red);
    expect(capital.dominion.nation).toBe(red);
    expect(capital.dominion.strength).toBeGreaterThan(3);
    const posted = state.messages.slice(firstMessage);
    expect(posted.length).toBeGreaterThan(0);
    for (const m of posted) expect(m.kind).toBe('dominion');
    const changedOwned = Object.values(state.provinces)
      .filter((x) => x.owner !== null && x.dominion.nation !== before[x.id])
      .map((x) => x.id);
    expect(changedOwned).toContain(p.id);
    expect(posted.map((m) => m.province)).toEqual(changedOwned);
    const name = state.map.provinces[p.id]!.name;
    const mine = posted.find((m) => m.province === p.id)!;
    expect(mine).toMatchObject({
      nation: red,
      day: 29,
      text: `${name} is now under the dominion of ${state.nations[red]!.name}.`,
    });
    // Independent provinces that changed hands tell no one.
    const changedFree = Object.values(state.provinces).filter(
      (x) => x.owner === null && x.dominion.nation !== before[x.id],
    );
    expect(changedFree.length).toBeGreaterThan(0);
    for (const x of changedFree) expect(posted.some((m) => m.province === x.id)).toBe(false);
  });

  it('tells the owner, not the pushing nation, naming no one when dominion empties', () => {
    const state = redGame(10);
    const [red, green] = ids(state);
    // Green owns a province far from both capitals, under its own dominion at strength 1, where
    // a red priest with 3 holy pips preaches and no other check can land. Month by month the
    // province is set back and the outcome read: no hit, one hit (empty), or more (red).
    const p = annex(state, green, farProvince(state).id);
    const priest = preach(createCommander(state, 'pyrePriest', red, p.id));
    priest.holy = 3;
    const name = state.map.provinces[p.id]!.name;
    const seen = new Set<string>();
    for (let month = 0; month < 60 && seen.size < 3; month++) {
      p.dominion = { nation: green, strength: 1 };
      state.day = 30 * month + 29;
      const first = state.messages.length;
      spreadDominion(state);
      const posted = state.messages.slice(first).filter((m) => m.province === p.id);
      const now = p.dominion.nation;
      seen.add(now ?? 'none');
      if (now === green) {
        expect(posted).toEqual([]);
        continue;
      }
      expect(posted).toHaveLength(1);
      const who = now === null ? 'no one' : state.nations[red]!.name;
      expect(posted[0]).toMatchObject({
        nation: green,
        kind: 'dominion',
        day: state.day,
        text: `${name} is now under the dominion of ${who}.`,
      });
      expect(state.messages.slice(first).some((m) => m.nation === red)).toBe(false);
    }
    expect([...seen].sort()).toEqual([green, red, 'none'].sort());
  });

  it('makes no checks for an eliminated nation', () => {
    const state = redGame(5);
    const [, green] = ids(state);
    const greenCapital = capitalOf(state, green);
    greenCapital.dominion = { nation: green, strength: 1 };
    for (let i = 0; i < 10; i++) {
      preach(createCommander(state, 'grovePriest', green, greenCapital.id));
    }
    const greenTotal = () =>
      Object.values(state.provinces).reduce(
        (sum, p) => sum + (p.dominion.nation === green ? p.dominion.strength : 0),
        0,
      );
    state.nations[green]!.eliminated = true;
    state.day = 29;
    spreadDominion(state);
    expect(greenTotal()).toBe(1);
    expect(greenCapital.dominion).toEqual({ nation: green, strength: 1 });
    // The same 34 checks build green's dominion once it is back in the game.
    state.nations[green]!.eliminated = false;
    spreadDominion(state);
    expect(greenTotal()).toBeGreaterThan(5);
  });
});
