// A whole game played by AI players, for the headless runner (docs/10-milestone-1.md acceptance
// 15) and tests.
import type { NationDefId } from '../content';
import { defaultPreset } from '../content/pretenders/presets';
import { stateHash } from '../sim/hash';
import { createGame } from '../sim/createGame';
import type { LoggedCommand } from '../sim/commands';
import { nationSummary, type NationSummary } from '../sim/selectors';
import type { NationId } from '../sim/ids';
import type { GameResult, GameSetup, GameState } from '../sim/types';
import { playDay, type Player, type Refusal } from './driver';

export interface MatchResult {
  result: GameResult | null;
  /** The result's reason, or 'timeout' when maxDays passed without one. */
  reason: GameResult['reason'] | 'timeout';
  days: number;
  log: LoggedCommand[];
  refused: Refusal[];
  finalHash: string;
  summaries: NationSummary[];
  state: GameState;
}

/** The headless runner's two nations, in the order of its even-numbered games. */
export const RUNNER_NATIONS: readonly NationDefId[] = ['cinderHorde', 'thornwood'];

/**
 * The headless runner's game number `game` from base seed `seed` (docs/08 decisions): Cinder
 * Horde against Thornwood on Medium with their default presets, both Normal AI, the nation
 * order alternating by game.
 */
export function runnerSetup(seed: number, game: number): GameSetup {
  const order = game % 2 === 0 ? RUNNER_NATIONS : [...RUNNER_NATIONS].reverse();
  return {
    seed: seed + game,
    mapSize: 'medium',
    nations: order.map((nation) => ({
      nation,
      pretender: defaultPreset(nation).design,
      ai: { difficulty: 'normal' },
    })),
  };
}

/** Plays a game with every AI nation driven by `player` until it ends or `maxDays` pass. */
export function runMatch(setup: GameSetup, player: Player, maxDays: number): MatchResult {
  const state = createGame(setup);
  const log: LoggedCommand[] = [];
  const refused: Refusal[] = [];
  while (!state.result && state.day < maxDays) {
    const day = playDay(state, player);
    log.push(...day.applied);
    refused.push(...day.refused);
  }
  return {
    result: state.result,
    reason: state.result?.reason ?? 'timeout',
    days: state.day,
    log,
    refused,
    finalHash: stateHash(state),
    summaries: (Object.keys(state.nations) as NationId[]).map((id) => nationSummary(state, id)),
    state,
  };
}
