// Magic commands (docs/06-architecture.md, "Commands"): the research color, rituals, and mana
// handed to a commander (docs/02-magic.md sections 3, 4, 7).
import { COLORS } from '../../content/colors';
import { isSpellId, spellDef } from '../../content/spells';
import type { RitualSpellDef } from '../../content/spells/types';
import { isGarrisonHolder } from '../commanders';
import { inOwnLab } from '../research';
import { beginRitual, castBlocker, ritualPayment } from '../rituals';
import { getCommander, getNation } from '../state';
import type { GameState } from '../types';
import { isIntegerIn, ownCommander } from './check';
import type { CommandOf } from './types';

const NOT_YOURS = 'That commander is not yours';

export function validateSetResearchColor(cmd: CommandOf<'setResearchColor'>): string | null {
  return COLORS.includes(cmd.color) ? null : 'Unknown color';
}

export function applySetResearchColor(state: GameState, cmd: CommandOf<'setResearchColor'>): void {
  getNation(state, cmd.nation).research.color = cmd.color;
}

function ritualOf(id: string): RitualSpellDef | string {
  if (!isSpellId(id)) return 'Unknown spell';
  const spell = spellDef(id);
  return spell.kind === 'ritual' ? spell : `${spell.name} is cast in battle`;
}

export function validateCastRitual(state: GameState, cmd: CommandOf<'castRitual'>): string | null {
  const c = ownCommander(state, cmd.nation, cmd.commander);
  if (!c) return NOT_YOURS;
  const spell = ritualOf(cmd.spell);
  if (typeof spell === 'string') return spell;
  return castBlocker(state, c, spell, cmd.target, cmd.generic);
}

export function applyCastRitual(state: GameState, cmd: CommandOf<'castRitual'>): void {
  const spell = ritualOf(cmd.spell);
  if (typeof spell === 'string') return;
  const pay = ritualPayment(getNation(state, cmd.nation).mana, spell, cmd.generic);
  if (typeof pay === 'string') return;
  beginRitual(state, getCommander(state, cmd.commander), spell, cmd.target, pay);
}

export function validateGiveMana(state: GameState, cmd: CommandOf<'giveMana'>): string | null {
  const c = ownCommander(state, cmd.nation, cmd.commander);
  if (!c) return NOT_YOURS;
  if (isGarrisonHolder(c)) return 'The garrison takes no orders';
  if (!COLORS.includes(cmd.color)) return 'Unknown color';
  if (c.transit) return `${c.name} is on the move`;
  if (!inOwnLab(state, c)) return 'Mana is handed over in a lab in a province you own';
  const pool = Math.floor(getNation(state, cmd.nation).mana[cmd.color]);
  if (!isIntegerIn(cmd.amount, 1, pool)) return `Give 1 to ${String(pool)} mana`;
  return null;
}

export function applyGiveMana(state: GameState, cmd: CommandOf<'giveMana'>): void {
  const c = getCommander(state, cmd.commander);
  getNation(state, cmd.nation).mana[cmd.color] -= cmd.amount;
  c.carriedMana[cmd.color] = (c.carriedMana[cmd.color] ?? 0) + cmd.amount;
}
