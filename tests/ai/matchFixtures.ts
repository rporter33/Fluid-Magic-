// Shared helpers for the AI driver and match tests (driver.test.ts, driver.replay.test.ts,
// match.test.ts): a three-nation game, small scripted players, a runner game one claim from a
// Wellspring win, and the short headless-runner games several tests read.
import { DIFFICULTIES } from '../../src/content/ai';
import { runAi } from '../../src/ai/ai';
import type { Player } from '../../src/ai/driver';
import { runMatch, runnerSetup, type MatchResult } from '../../src/ai/match';
import type { Command } from '../../src/sim/commands';
import { createGame } from '../../src/sim/createGame';
import type { NationId, ProvinceId } from '../../src/sim/ids';
import type { GameState } from '../../src/sim/types';
import { claimBlocker } from '../../src/sim/wellsprings';
import { annex, capitalOf, nation, nationIds } from '../sim/fixtures';

/** The human player (n0), a Normal AI (n1), and an Easy AI (n2). */
export function threeNations(): GameState {
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
export function spy(): { calls: string[]; player: Player } {
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
export const taxer: Player = (state, id) => {
  const capital = capitalOf(state, id);
  if (capital.owner !== id) return [];
  const rate = (state.day / DIFFICULTIES.normal.planEveryDays) % 2 === 0 ? 'high' : 'normal';
  return [{ type: 'setTax', nation: id, province: capital.id, rate }];
};

/** runAi, then the taxer: the log always holds commands that change the game. */
export const busy: Player = (state, id) => [...runAi(state, id), ...taxer(state, id)];

/** Every idle priest standing in a Wellspring its nation owns and has not claimed claims it. */
export const claimer: Player = (state, id) =>
  Object.values(state.commanders)
    .filter((c) => c.owner === id && c.order.kind === 'idle' && claimBlocker(state, c) === null)
    .map((c): Command => ({ type: 'claimWellspring', nation: id, commander: c.id }));

/**
 * A runner game where the second nation holds one claimed Wellspring of the three and its priest
 * stands idle in a second it owns, so the claimer claims it on its first planning day.
 */
export function nearWin(): { state: GameState; claimer: NationId } {
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
export function strip(state: GameState, id: NationId): void {
  for (const p of Object.values(state.provinces)) if (p.owner === id) p.owner = null;
}

/** Days of the short headless-runner games. */
export const SHORT_DAYS = 240;

/** A short runner game with runAi. */
export function shortMatch(): MatchResult {
  return runMatch(runnerSetup(1, 0), runAi, SHORT_DAYS);
}

/** The same game with busy, for the replay tests, which need a log of commands that change it. */
export function scriptedMatch(): MatchResult {
  return runMatch(runnerSetup(1, 0), busy, SHORT_DAYS);
}
