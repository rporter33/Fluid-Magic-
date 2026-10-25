// Commands of the faith (docs/06-architecture.md, "Commands"): naming a prophet and claiming a
// Wellspring (docs/05-pretender.md "Prophet"; docs/01-core-rules.md section 13).
import { PROPHET, WELLSPRING } from '../../content/rules';
import { isGarrisonHolder } from '../commanders';
import { getCommander, getNation } from '../state';
import type { GameState } from '../types';
import { claimBlocker } from '../wellsprings';
import { ownCommander } from './check';
import type { CommandOf } from './types';

const NOT_YOURS = 'That commander is not yours';

export function validateMakeProphet(
  state: GameState,
  cmd: CommandOf<'makeProphet'>,
): string | null {
  const c = ownCommander(state, cmd.nation, cmd.commander);
  if (!c) return NOT_YOURS;
  const nation = getNation(state, cmd.nation);
  if (isGarrisonHolder(c)) return 'The garrison cannot be a prophet';
  if (nation.pretenderId === c.id) return 'The pretender cannot be its own prophet';
  if (nation.prophetId !== null) return `${nation.name} already has a prophet`;
  if (state.day < nation.prophetAvailableDay) {
    return `A new prophet may be named on day ${String(nation.prophetAvailableDay)}`;
  }
  return null;
}

/** The commander becomes the prophet: holy pips raised to 3 (docs/05). */
export function applyMakeProphet(state: GameState, cmd: CommandOf<'makeProphet'>): void {
  const c = getCommander(state, cmd.commander);
  getNation(state, cmd.nation).prophetId = c.id;
  c.holy = Math.max(c.holy, PROPHET.holy);
}

export function validateClaimWellspring(
  state: GameState,
  cmd: CommandOf<'claimWellspring'>,
): string | null {
  const c = ownCommander(state, cmd.nation, cmd.commander);
  if (!c) return NOT_YOURS;
  return claimBlocker(state, c);
}

export function applyClaimWellspring(state: GameState, cmd: CommandOf<'claimWellspring'>): void {
  getCommander(state, cmd.commander).order = {
    kind: 'claimWellspring',
    daysLeft: WELLSPRING.claimDays,
  };
}
