// The one place AI players act (docs/06-architecture.md, game loop): after each day's advance,
// every AI nation whose planning day it is gets its commands applied in order through
// applyCommand. The headless runner and the browser loop both drive games through here, so
// the same seed plays the same either way. A game replays from its log without the AI.
import { DIFFICULTIES } from '../content/ai';
import { applyCommand, type Command, type LoggedCommand } from '../sim/commands';
import type { NationId } from '../sim/ids';
import { advance } from '../sim/tick';
import type { GameState } from '../sim/types';

/** An AI player: reads the state, never changes it, and returns commands to apply in order. */
export type Player = (state: GameState, nation: NationId) => Command[];

export interface Refusal extends LoggedCommand {
  error: string;
}

export interface DayLog {
  applied: LoggedCommand[];
  refused: Refusal[];
}

/** One day: advance, then each AI nation plans on its planning days. */
export function playDay(state: GameState, player: Player): DayLog {
  advance(state);
  const log: DayLog = { applied: [], refused: [] };
  for (const nation of Object.values(state.nations)) {
    if (state.result || nation.ai === null || nation.eliminated) continue;
    if (state.day % DIFFICULTIES[nation.ai.difficulty].planEveryDays !== 0) continue;
    for (const command of player(state, nation.id)) {
      const r = applyCommand(state, command);
      if (r.ok) log.applied.push({ day: state.day, command });
      else log.refused.push({ day: state.day, command, error: r.error });
    }
  }
  return log;
}

/**
 * Plays a command log back: each logged command is applied on its day, before that day's
 * advance, until `days` have passed or the game ends.
 */
export function replayLog(state: GameState, log: readonly LoggedCommand[], days: number): void {
  let next = 0;
  for (;;) {
    while (next < log.length && log[next]?.day === state.day) {
      const entry = log[next];
      if (entry) applyCommand(state, entry.command);
      next++;
    }
    if (state.day >= days || state.result) return;
    advance(state);
  }
}
