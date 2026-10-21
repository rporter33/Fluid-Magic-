// Command entry point (docs/06-architecture.md, "Commands"). Every command is validated
// before it is applied; an invalid one changes nothing. The UI and the AI both come here.
import {
  applyBuild,
  applyMove,
  applyReverse,
  applySetFormation,
  applySetOrder,
  applySetScript,
  applyTransferSquad,
  validateBuild,
  validateMove,
  validateReverse,
  validateSetFormation,
  validateSetOrder,
  validateSetScript,
  validateTransferSquad,
} from './army';
import {
  applyBuyPd,
  applyCancelRecruit,
  applyRecruit,
  applySetTax,
  validateBuyPd,
  validateCancelRecruit,
  validateRecruit,
  validateSetTax,
} from './province';
import type { GameState } from '../types';
import type { Command, CommandResult } from './types';

export type { Command, CommandResult, CommandType, SimpleOrder } from './types';

/** Why a command cannot be applied now, or null when it can. */
export function validateCommand(state: GameState, cmd: Command): string | null {
  if (state.result) return 'The game is over';
  const nation = state.nations[cmd.nation];
  if (!nation || nation.eliminated) return 'No such nation';
  switch (cmd.type) {
    case 'move':
      return validateMove(state, cmd);
    case 'reverse':
      return validateReverse(state, cmd);
    case 'setOrder':
      return validateSetOrder(state, cmd);
    case 'setScript':
      return validateSetScript(state, cmd);
    case 'setFormation':
      return validateSetFormation(state, cmd);
    case 'transferSquad':
      return validateTransferSquad(state, cmd);
    case 'build':
      return validateBuild(state, cmd);
    case 'recruit':
      return validateRecruit(state, cmd);
    case 'cancelRecruit':
      return validateCancelRecruit(state, cmd);
    case 'buyPd':
      return validateBuyPd(state, cmd);
    case 'setTax':
      return validateSetTax(state, cmd);
    default:
      return 'Unknown command';
  }
}

/** Validates, then applies. Commands take effect at once; the next tick sees them. */
export function applyCommand(state: GameState, cmd: Command): CommandResult {
  const error = validateCommand(state, cmd);
  if (error !== null) return { ok: false, error };
  switch (cmd.type) {
    case 'move':
      applyMove(state, cmd);
      break;
    case 'reverse':
      applyReverse(state, cmd);
      break;
    case 'setOrder':
      applySetOrder(state, cmd);
      break;
    case 'setScript':
      applySetScript(state, cmd);
      break;
    case 'setFormation':
      applySetFormation(state, cmd);
      break;
    case 'transferSquad':
      applyTransferSquad(state, cmd);
      break;
    case 'build':
      applyBuild(state, cmd);
      break;
    case 'recruit':
      applyRecruit(state, cmd);
      break;
    case 'cancelRecruit':
      applyCancelRecruit(state, cmd);
      break;
    case 'buyPd':
      applyBuyPd(state, cmd);
      break;
    case 'setTax':
      applySetTax(state, cmd);
      break;
  }
  return { ok: true };
}
