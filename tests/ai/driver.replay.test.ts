// Replaying a match from its command log (docs/06-architecture.md decisions, "The AI driver";
// docs/08-ai.md decisions, "The headless runner"): a match replays from its log without the AI,
// each command on its day, and stops when the game ends.
import { beforeAll, describe, expect, it } from 'vitest';
import { playDay, replayLog } from '../../src/ai/driver';
import { runMatch, runnerSetup, type MatchResult } from '../../src/ai/match';
import type { LoggedCommand } from '../../src/sim/commands';
import { createGame } from '../../src/sim/createGame';
import { stateHash } from '../../src/sim/hash';
import { busy, claimer, nearWin, scriptedMatch, SHORT_DAYS, shortMatch } from './matchFixtures';

// Short headless-runner games shared by the tests below: one with runAi, one with busy, whose
// log always holds commands that change the game.
let short: MatchResult;
let scripted: MatchResult;
beforeAll(() => {
  short = shortMatch();
  scripted = scriptedMatch();
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
