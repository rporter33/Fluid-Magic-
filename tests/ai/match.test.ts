// The AI driver and whole AI matches (docs/06-architecture.md decisions, "The AI driver";
// docs/08-ai.md decisions, "The AI contract", "Cadence", "The headless runner";
// docs/10-milestone-1.md acceptance 15): playDay advances, then lets each AI nation plan on its
// planning days; refusals are logged, never fatal; a match replays from its log without the
// AI; and the headless runner's games with runAi are deterministic and free of refusals. Tests
// that need particular commands use small scripted players.
import { beforeAll, describe, expect, it } from 'vitest';
import { DIFFICULTIES } from '../../src/content/ai';
import { runAi } from '../../src/ai/ai';
import { playDay, replayLog, type Player } from '../../src/ai/driver';
import {
  RUNNER_DEFAULTS,
  runMatch,
  runnerSetup,
  runnerSetups,
  tallyWins,
  type MatchResult,
} from '../../src/ai/match';
import { defaultPreset } from '../../src/content/pretenders/presets';
import type { Command, LoggedCommand } from '../../src/sim/commands';
import { createGame } from '../../src/sim/createGame';
import { stateHash } from '../../src/sim/hash';
import type { NationId, ProvinceId } from '../../src/sim/ids';
import { nationSummary } from '../../src/sim/selectors';
import type { GameState } from '../../src/sim/types';
import { claimBlocker } from '../../src/sim/wellsprings';
import { annex, capitalOf, nation, nationIds, runDays, twoNationGame } from '../sim/fixtures';

/** The human player (n0), a Normal AI (n1), and an Easy AI (n2). */
function threeNations(): GameState {
  return createGame({
    seed: 3,
    mapSize: 'medium',
    nations: [
      nation('cinderHorde'),
      nation('thornwood', { ai: { difficulty: 'normal' } }),
      nation('thornwood', { ai: { difficulty: 'easy' } }),
    ],
  });
}

/** A player that issues nothing and records each call as "day nation". */
function spy(): { calls: string[]; player: Player } {
  const calls: string[] = [];
  return {
    calls,
    player: (state, id) => {
      calls.push(`${String(state.day)} ${id}`);
      return [];
    },
  };
}

/** Sets the capital's tax, High on even planning days and Normal on odd ones, while it is held. */
const taxer: Player = (state, id) => {
  const capital = capitalOf(state, id);
  if (capital.owner !== id) return [];
  const rate = (state.day / DIFFICULTIES.normal.planEveryDays) % 2 === 0 ? 'high' : 'normal';
  return [{ type: 'setTax', nation: id, province: capital.id, rate }];
};

/** runAi, then the taxer: the log always holds commands that change the game. */
const busy: Player = (state, id) => [...runAi(state, id), ...taxer(state, id)];

/** Every idle priest standing in a Wellspring its nation owns and has not claimed claims it. */
const claimer: Player = (state, id) =>
  Object.values(state.commanders)
    .filter((c) => c.owner === id && c.order.kind === 'idle' && claimBlocker(state, c) === null)
    .map((c): Command => ({ type: 'claimWellspring', nation: id, commander: c.id }));

/**
 * A runner game where the second nation holds one claimed Wellspring of the three and its priest
 * stands idle in a second it owns, so the claimer claims it on its first planning day.
 */
function nearWin(): { state: GameState; claimer: NationId } {
  const state = createGame(runnerSetup(1, 0));
  const [, claimer] = nationIds(state) as [NationId, NationId];
  const [first, second] = state.map.wellsprings as [ProvinceId, ProvinceId];
  annex(state, claimer, first).wellspringClaimedBy = claimer;
  annex(state, claimer, second);
  const priest = Object.values(state.commanders).find(
    (c) => c.owner === claimer && c.unit === 'grovePriest',
  )!;
  priest.location = second;
  return { state, claimer };
}

/** Takes every province from a nation, so the next day's tick eliminates it. */
function strip(state: GameState, id: NationId): void {
  for (const p of Object.values(state.provinces)) if (p.owner === id) p.owner = null;
}

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

// Short headless-runner games shared by the tests below: one with runAi, one with busy for the
// replay tests, which need a log of commands that change the game.
const SHORT_DAYS = 240;
let short: MatchResult;
let scripted: MatchResult;
beforeAll(() => {
  short = runMatch(runnerSetup(1, 0), runAi, SHORT_DAYS);
  scripted = runMatch(runnerSetup(1, 0), busy, SHORT_DAYS);
});

describe('replayLog', () => {
  it('replays a match from its log, without the AI, to the same hash', () => {
    expect(scripted.log.length).toBeGreaterThan(40);
    expect(scripted.refused).toEqual([]);
    for (const match of [scripted, short]) {
      const state = createGame(runnerSetup(1, 0));
      replayLog(state, match.log, match.days);
      expect(state.day).toBe(SHORT_DAYS);
      expect(stateHash(state)).toBe(match.finalHash);
    }
  });

  it('applies each command on its day, before that day advances, up to the last day', () => {
    // A day in the middle of the log, with commands on it and after it.
    const cut = scripted.log[Math.floor(scripted.log.length / 2)]!.day;
    expect(scripted.log.some((l) => l.day > cut)).toBe(true);
    const partial = runMatch(runnerSetup(1, 0), busy, cut);
    const state = createGame(runnerSetup(1, 0));
    replayLog(state, scripted.log, cut);
    expect(state.day).toBe(cut);
    expect(stateHash(state)).toBe(partial.finalHash);
    // The commands logged on the last day are part of it.
    const without = createGame(runnerSetup(1, 0));
    replayLog(
      without,
      scripted.log.filter((l) => l.day < cut),
      cut,
    );
    expect(stateHash(without)).not.toBe(partial.finalHash);
  });

  it('needs the log: the game alone drifts from the match', () => {
    const state = createGame(runnerSetup(1, 0));
    replayLog(state, [], scripted.days);
    expect(state.day).toBe(SHORT_DAYS);
    expect(stateHash(state)).not.toBe(scripted.finalHash);
  });

  it('stops when the game ends before the given day', () => {
    const played = nearWin();
    const log: LoggedCommand[] = [];
    while (!played.state.result && played.state.day < 100) {
      log.push(...playDay(played.state, claimer).applied);
    }
    expect(played.state.result).toMatchObject({ winner: played.claimer, reason: 'wellsprings' });
    const claim = log.find((l) => l.command.type === 'claimWellspring');
    expect(claim?.command.nation).toBe(played.claimer);
    const replayed = nearWin().state;
    replayLog(replayed, log, 1000);
    expect(replayed.result).toEqual(played.state.result);
    expect(replayed.day).toBe(played.state.day);
    expect(stateHash(replayed)).toBe(stateHash(played.state));
    // The replayed claim is what won: without it the same days pass with no result.
    const unclaimed = nearWin().state;
    replayLog(
      unclaimed,
      log.filter((l) => l !== claim),
      played.state.day,
    );
    expect(unclaimed.result).toBeNull();
  });
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
  });
});

describe('the headless runner', () => {
  it('plays Cinder Horde against Thornwood on Medium, seeds from the base, order alternating', () => {
    expect(RUNNER_DEFAULTS).toEqual({ games: 20, seed: 1, months: 100 });
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
