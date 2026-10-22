// Whole AI matches (docs/08-ai.md decisions, "The headless runner"; docs/10-milestone-1.md
// acceptance 15): the headless runner's games with runAi are deterministic and free of refusals.
// The driver's day is in driver.test.ts and replays in driver.replay.test.ts; shared helpers are
// in matchFixtures.ts.
import { beforeAll, describe, expect, it } from 'vitest';
import { DIFFICULTIES } from '../../src/content/ai';
import { runAi } from '../../src/ai/ai';
import type { Player } from '../../src/ai/driver';
import {
  RUNNER_DEFAULTS,
  runMatch,
  runnerSetup,
  runnerSetups,
  tallyWins,
  type MatchResult,
} from '../../src/ai/match';
import { defaultPreset } from '../../src/content/pretenders/presets';
import { createGame } from '../../src/sim/createGame';
import { stateHash } from '../../src/sim/hash';
import { nationSummary } from '../../src/sim/selectors';
import { capitalOf, nationIds } from '../sim/fixtures';
import { SHORT_DAYS, shortMatch } from './matchFixtures';

// The short headless-runner game with runAi that the runMatch tests read.
let short: MatchResult;
beforeAll(() => {
  short = shortMatch();
});

describe('runMatch', () => {
  it('plays the same game from the same setup', () => {
    const again = runMatch(runnerSetup(1, 0), runAi, SHORT_DAYS);
    expect(again.finalHash).toBe(short.finalHash);
    expect(again.log).toEqual(short.log);
    expect(again.summaries).toEqual(short.summaries);
    expect(again.days).toBe(short.days);
  });

  it('keeps refused commands out of the log', () => {
    // Each nation tries to tax the other's capital, then sets its own.
    const player: Player = (state, id) => {
      const other = nationIds(state).find((n) => n !== id)!;
      return [
        { type: 'setTax', nation: id, province: capitalOf(state, other).id, rate: 'high' },
        { type: 'setTax', nation: id, province: capitalOf(state, id).id, rate: 'low' },
      ];
    };
    const match = runMatch(runnerSetup(1, 0), player, 20);
    expect(match.days).toBe(20);
    const days = [5, 10, 15, 20];
    expect(match.refused.map((r) => [r.day, r.command.nation, r.error])).toEqual(
      days.flatMap((d) => [
        [d, 'n0', 'That province is not yours'],
        [d, 'n1', 'That province is not yours'],
      ]),
    );
    expect(match.log.map((l) => [l.day, l.command.nation])).toEqual(
      days.flatMap((d) => [
        [d, 'n0'],
        [d, 'n1'],
      ]),
    );
    expect(match.log.every((l) => l.command.type === 'setTax' && l.command.rate === 'low')).toBe(
      true,
    );
  });

  it('runs to maxDays without a result or a refusal, logging Normal planning days only', () => {
    expect(short.result).toBeNull();
    expect(short.reason).toBe('timeout');
    expect(short.days).toBe(SHORT_DAYS);
    expect(short.state.day).toBe(SHORT_DAYS);
    expect(short.refused).toEqual([]);
    expect(short.finalHash).toBe(stateHash(short.state));
    const every = DIFFICULTIES.normal.planEveryDays;
    for (const [i, entry] of short.log.entries()) {
      expect(entry.day % every).toBe(0);
      expect(entry.day).toBeGreaterThan(0);
      expect(entry.day).toBeLessThanOrEqual(SHORT_DAYS);
      expect(entry.day).toBeGreaterThanOrEqual(short.log[i - 1]?.day ?? 0);
    }
  });

  it('summarizes each nation in nation order', () => {
    const ids = nationIds(short.state);
    expect(short.summaries.map((s) => s.nation)).toEqual(ids);
    for (const [i, id] of ids.entries()) {
      const owned = Object.values(short.state.provinces).filter((p) => p.owner === id);
      expect(short.summaries[i]).toEqual(nationSummary(short.state, id));
      expect(short.summaries[i]!.provinces).toBe(owned.length);
      expect(owned.length).toBeGreaterThan(0);
    }
  });

  it('plays a different game from another seed or nation order', () => {
    const otherSeed = runMatch(runnerSetup(1, 2), runAi, SHORT_DAYS);
    const otherOrder = runMatch(runnerSetup(1, 1), runAi, SHORT_DAYS);
    expect(runnerSetup(1, 2).nations).toEqual(runnerSetup(1, 0).nations);
    expect(otherSeed.finalHash).not.toBe(short.finalHash);
    expect(otherOrder.finalHash).not.toBe(short.finalHash);
    expect(otherOrder.finalHash).not.toBe(otherSeed.finalHash);
  });

  it("plays the headless runner's games for three years without a refusal (acceptance 15)", () => {
    const maxDays = 1080;
    const hashes = new Set<string>();
    for (const game of [0, 1]) {
      const match = runMatch(runnerSetup(1, game), runAi, maxDays);
      expect(match.refused).toEqual([]);
      expect(match.reason).not.toBe('playerDefeated');
      expect(match.summaries).toHaveLength(2);
      if (match.result === null) {
        expect(match.reason).toBe('timeout');
        expect(match.days).toBe(maxDays);
      } else {
        expect(match.reason).toBe(match.result.reason);
        expect(match.days).toBeLessThanOrEqual(maxDays);
        expect(match.result.winner).not.toBeNull();
      }
      hashes.add(match.finalHash);
    }
    expect(hashes.size).toBe(2);
    // Two games of three years take seconds: past vitest's 5 s default on a loaded machine.
  }, 60_000);
});

describe('the headless runner', () => {
  it('plays Cinder Horde against Thornwood on Medium, seeds from the base, order alternating', () => {
    expect(RUNNER_DEFAULTS).toEqual({ games: 20, seed: 1, months: 100, wilds: true });
    const setups = runnerSetups(7, 3);
    expect(setups).toHaveLength(3);
    expect(setups.map((s) => s.seed)).toEqual([7, 8, 9]);
    expect(setups.map((s) => s.nations.map((n) => n.nation))).toEqual([
      ['cinderHorde', 'thornwood'],
      ['thornwood', 'cinderHorde'],
      ['cinderHorde', 'thornwood'],
    ]);
    for (const setup of setups) {
      expect(setup.mapSize).toBe('medium');
      expect(setup.wilds).toBe(true);
      for (const n of setup.nations) {
        expect(n.ai).toEqual({ difficulty: 'normal' });
        expect(n.pretender).toEqual(defaultPreset(n.nation).design);
      }
    }
    expect(runnerSetup(7, 1)).toEqual(setups[1]);
  });

  it('tallies wins for every nation, and games without a winner apart', () => {
    const timeout = runMatch(runnerSetup(1, 0), () => [], 1);
    const [red] = nationIds(timeout.state);
    const won: MatchResult = {
      ...timeout,
      result: { day: 1, winner: red!, reason: 'wellsprings' },
    };
    expect(tallyWins([])).toEqual({ wins: { 'Cinder Horde': 0, Thornwood: 0 }, noWinner: 0 });
    expect(tallyWins([won, timeout, won])).toEqual({
      wins: { 'Cinder Horde': 2, Thornwood: 0 },
      noWinner: 1,
    });
  });

  it('reports mana spent per color, as the victory screen shows it (docs/07)', () => {
    const state = createGame(runnerSetup(1, 0));
    const [red] = nationIds(state);
    state.nations[red!]!.stats.manaSpent = { W: 0, U: 0, B: 0, R: 7, G: 3 };
    const summary = nationSummary(state, red!);
    expect(summary.manaSpent).toEqual({ W: 0, U: 0, B: 0, R: 7, G: 3 });
    state.nations[red!]!.stats.manaSpent.R = 9;
    expect(summary.manaSpent.R).toBe(7);
  });
});
