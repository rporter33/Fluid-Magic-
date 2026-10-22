// A whole game played by AI players, for the headless runner (docs/10-milestone-1.md acceptance
// 15) and tests.
import { nationDef, type NationDefId } from '../content';
import { defaultPreset, type PresetDef } from '../content/pretenders/presets';
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

/** The headless runner's defaults (docs/08 decisions, "The headless runner"). */
export const RUNNER_DEFAULTS = { games: 20, seed: 1, months: 100 } as const;

/** The headless runner's two nations, in the order of its even-numbered games. */
export const RUNNER_NATIONS: readonly NationDefId[] = ['cinderHorde', 'thornwood'];

/**
 * A runner game's setup: the runner nations in this order on Medium, both Normal AI, each with
 * the preset listed for it in `presets` (`sim:aivai --presets`, Phase 6b.3) or else its default.
 */
export function playedSetup(
  seed: number,
  order: readonly NationDefId[],
  presets: readonly PresetDef[] = [],
): GameSetup {
  return {
    seed,
    mapSize: 'medium',
    nations: order.map((nation) => ({
      nation,
      pretender: (presets.find((p) => p.nation === nation) ?? defaultPreset(nation)).design,
      ai: { difficulty: 'normal' },
    })),
  };
}

/** The runner nations in the order of game `game`: alternating, Cinder Horde first in game 0. */
export function runnerOrder(game: number): readonly NationDefId[] {
  return game % 2 === 0 ? RUNNER_NATIONS : [...RUNNER_NATIONS].reverse();
}

/**
 * The headless runner's game number `game` from base seed `seed` (docs/08 decisions): Cinder
 * Horde against Thornwood on Medium with their default presets (or those `presets` names), both
 * Normal AI, the nation order alternating by game.
 */
export function runnerSetup(
  seed: number,
  game: number,
  presets: readonly PresetDef[] = [],
): GameSetup {
  return playedSetup(seed + game, runnerOrder(game), presets);
}

/** The setups of a runner session: games 0 to games - 1 from base seed `seed`. */
export function runnerSetups(
  seed: number,
  games: number,
  presets: readonly PresetDef[] = [],
): GameSetup[] {
  return Array.from({ length: games }, (_, game) => runnerSetup(seed, game, presets));
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

/** Wins per runner nation (every nation listed, at 0 if it never won) and games with no winner. */
export function tallyWins(results: readonly MatchResult[]): {
  wins: Record<string, number>;
  noWinner: number;
} {
  const wins: Record<string, number> = {};
  for (const id of RUNNER_NATIONS) wins[nationDef(id).name] = 0;
  let noWinner = 0;
  for (const m of results) {
    const winner = m.result?.winner;
    const name = winner ? m.state.nations[winner]?.name : undefined;
    if (name === undefined) noWinner += 1;
    else wins[name] = (wins[name] ?? 0) + 1;
  }
  return { wins, noWinner };
}
