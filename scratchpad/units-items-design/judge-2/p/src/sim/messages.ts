// The player-facing event log (docs/07-ui.md, Messages).
import { MESSAGES } from '../content/rules';
import { newId, type BattleId, type NationId, type ProvinceId } from './ids';
import type { GameState, MessageKind } from './types';

export function postMessage(
  state: GameState,
  nation: NationId,
  kind: MessageKind,
  text: string,
  province: ProvinceId | null = null,
  battle: BattleId | null = null,
): void {
  state.messages.push({
    id: newId(state, 'message'),
    day: state.day,
    nation,
    kind,
    text,
    province,
    battle,
  });
  // Each nation keeps its own most recent messages, so AI chatter never pushes out the player's.
  let count = 0;
  for (const m of state.messages) if (m.nation === nation) count++;
  if (count > MESSAGES.keep) {
    state.messages.splice(
      state.messages.findIndex((m) => m.nation === nation),
      1,
    );
  }
}
