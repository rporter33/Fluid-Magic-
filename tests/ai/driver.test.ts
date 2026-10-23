// The AI driver's day (docs/06-architecture.md decisions, "The AI driver"; docs/08-ai.md
// decisions, "The AI contract", "Cadence"): playDay advances, then lets each AI nation plan on
// its planning days; refusals are logged, never fatal. Tests that need particular commands use
// small scripted players (matchFixtures.ts). Replays are in driver.replay.test.ts, whole matches
// and the headless runner in match.test.ts.
import { describe, expect, it } from 'vitest';
import { DIFFICULTIES } from '../../src/content/ai';
import { playDay, type Player } from '../../src/ai/driver';
import type { Command } from '../../src/sim/commands';
import type { NationId } from '../../src/sim/ids';
import { capitalOf, nationIds, runDays, twoNationGame } from '../sim/fixtures';
import { spy, strip, taxer, threeNations } from './matchFixtures';

describe('playDay', () => {
  it('advances one day, then lets each AI nation plan only on its planning days', () => {
    const state = threeNations();
    const { calls, player } = spy();
    const expected: string[] = [];
    for (let i = 0; i < 40; i++) {
      const before = state.day;
      const log = playDay(state, player);
      expect(state.day).toBe(before + 1);
      expect(log).toEqual({ applied: [], refused: [] });
      for (const n of Object.values(state.nations)) {
        if (n.ai && state.day % DIFFICULTIES[n.ai.difficulty].planEveryDays === 0) {
          expected.push(`${String(state.day)} ${n.id}`);
        }
      }
    }
    expect(calls).toEqual(expected);
    // Normal plans every 5 days and Easy every 10, counted after the advance, in nation order;
    // the human never.
    expect(calls.slice(0, 6)).toEqual(['5 n1', '10 n1', '10 n2', '15 n1', '20 n1', '20 n2']);
    expect(calls).toHaveLength(12);
    expect(calls.some((c) => c.endsWith('n0'))).toBe(false);
  });

  it('applies the commands in the order returned and logs them with the new day', () => {
    const state = twoNationGame();
    const [, green] = nationIds(state) as [NationId, NationId];
    const capital = capitalOf(state, green).id;
    const high: Command = { type: 'setTax', nation: green, province: capital, rate: 'high' };
    const low: Command = { type: 'setTax', nation: green, province: capital, rate: 'low' };
    const player: Player = (_, id) => (id === green ? [high, low] : []);
    for (let day = 1; day < 5; day++) {
      expect(playDay(state, player)).toEqual({ applied: [], refused: [] });
    }
    expect(capitalOf(state, green).taxRate).toBe('normal');
    expect(playDay(state, player)).toEqual({
      applied: [
        { day: 5, command: high },
        { day: 5, command: low },
      ],
      refused: [],
    });
    expect(state.day).toBe(5);
    expect(capitalOf(state, green).taxRate).toBe('low');
  });

  it('refuses a command an earlier one made invalid, records why, and goes on', () => {
    const state = twoNationGame();
    const [red, green] = nationIds(state) as [NationId, NationId];
    runDays(state, 4);
    const capital = capitalOf(state, green);
    const holder = capital.garrison!;
    const captain = Object.values(state.commanders).find(
      (c) => c.owner === green && c.unit === 'wardenCaptain',
    )!;
    const redArmy = Object.values(state.commanders).find(
      (c) => c.owner === red && c.unit === 'ashChieftain',
    )!;
    const squad = captain.squads[0]!;
    const give: Command = {
      type: 'transferSquad',
      nation: green,
      from: captain.id,
      to: holder,
      squad: squad.id,
    };
    const foreign: Command = {
      type: 'setOrder',
      nation: green,
      commander: redArmy.id,
      order: 'patrol',
    };
    const tax: Command = { type: 'setTax', nation: green, province: capital.id, rate: 'high' };
    const player: Player = (_, id) => (id === green ? [give, give, foreign, tax] : []);
    const log = playDay(state, player);
    expect(log.applied).toEqual([
      { day: 5, command: give },
      { day: 5, command: tax },
    ]);
    expect(log.refused).toEqual([
      { day: 5, command: give, error: 'That squad is not under this commander' },
      { day: 5, command: foreign, error: 'That commander is not yours' },
    ]);
    expect(state.commanders[holder]!.squads.map((s) => s.id)).toContain(squad.id);
    expect(redArmy.order.kind).toBe('idle');
    expect(capital.taxRate).toBe('high');
  });

  it('never plans for the human nation', () => {
    const state = twoNationGame();
    const [red, green] = nationIds(state) as [NationId, NationId];
    const applied: Command[] = [];
    for (let day = 0; day < 60; day++) {
      const log = playDay(state, taxer);
      expect(log.refused).toEqual([]);
      applied.push(...log.applied.map((l) => l.command));
    }
    expect(applied.length).toBeGreaterThan(0);
    expect(applied.filter((c) => c.nation === red)).toEqual([]);
    expect(applied.every((c) => c.nation === green)).toBe(true);
  });

  it('skips an eliminated nation', () => {
    const state = threeNations();
    strip(state, 'n2' as NationId);
    const { calls, player } = spy();
    for (let day = 0; day < 20; day++) playDay(state, player);
    expect(state.nations['n2' as NationId]!.eliminated).toBe(true);
    expect(state.result).toBeNull();
    expect(calls).toEqual(['5 n1', '10 n1', '15 n1', '20 n1']);
  });

  it('stops planning once the game is over', () => {
    const state = threeNations();
    runDays(state, 9);
    strip(state, 'n0' as NationId);
    const { calls, player } = spy();
    // Day 10 is a planning day for both AI nations, but the player fell in its tick.
    expect(playDay(state, player)).toEqual({ applied: [], refused: [] });
    expect(state.result).toEqual({ day: 9, winner: null, reason: 'playerDefeated' });
    expect(state.day).toBe(10);
    playDay(state, player);
    expect(state.day).toBe(10);
    expect(calls).toEqual([]);
  });
});
