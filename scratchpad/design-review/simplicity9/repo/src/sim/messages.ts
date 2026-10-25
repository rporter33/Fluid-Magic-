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
  const excess = state.messages.length - MESSAGES.keep;
  if (excess > 0) state.messages.splice(0, excess);
}
