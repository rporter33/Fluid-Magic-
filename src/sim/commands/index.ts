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
  applyStorm,
  validateBuyPd,
  validateCancelRecruit,
  validateRecruit,
  validateSetTax,
  validateStorm,
} from './province';
import {
  applyCastRitual,
  applyGiveMana,
  applySetResearchColor,
  validateCastRitual,
  validateGiveMana,
  validateSetResearchColor,
} from './magic';
import {
  applyClaimWellspring,
  applyMakeProphet,
  validateClaimWellspring,
  validateMakeProphet,
} from './pretender';
import type { GameState } from '../types';
import type { Command, CommandResult } from './types';

export type { Command, CommandResult, CommandType, LoggedCommand, SimpleOrder } from './types';

/** Why a command cannot be applied now, or null when it can. */
export function validateCommand(state: GameState, cmd: Command): string | null {
  if (state.result) return 'The game is over';
  // An own-property lookup: a crafted log's "constructor" or "__proto__" is not a nation.
  const nation = Object.hasOwn(state.nations, cmd.nation) ? state.nations[cmd.nation] : undefined;
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
    case 'storm':
      return validateStorm(state, cmd);
    case 'setResearchColor':
      return validateSetResearchColor(cmd);
    case 'castRitual':
      return validateCastRitual(state, cmd);
    case 'giveMana':
      return validateGiveMana(state, cmd);
    case 'makeProphet':
      return validateMakeProphet(state, cmd);
    case 'claimWellspring':
      return validateClaimWellspring(state, cmd);
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
    case 'storm':
      applyStorm(state, cmd);
      break;
    case 'setResearchColor':
      applySetResearchColor(state, cmd);
      break;
    case 'castRitual':
      applyCastRitual(state, cmd);
      break;
    case 'giveMana':
      applyGiveMana(state, cmd);
      break;
    case 'makeProphet':
      applyMakeProphet(state, cmd);
      break;
    case 'claimWellspring':
      applyClaimWellspring(state, cmd);
      break;
  }
  return { ok: true };
}
