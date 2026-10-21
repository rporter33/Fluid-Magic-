// Commands to provinces: recruitment, provincial defense, and tax.
import { isUnitTypeId, unitDef } from '../../content';
import { PD, RECRUITMENT, TAX_RATE_IDS } from '../../content/rules';
import { newId } from '../ids';
import { pdCost } from '../pd';
import { fortMaterials } from '../selectors';
import {
  recruitBlock,
  recruitDays,
  recruitGold,
  recruitMaterials,
  recruitRequirementError,
} from '../recruitment';
import { getNation, getProvince } from '../state';
import type { GameState } from '../types';
import { isIntegerIn, ownProvince } from './check';
import type { CommandOf } from './types';

const NOT_YOURS = 'That province is not yours';

export function validateRecruit(state: GameState, cmd: CommandOf<'recruit'>): string | null {
  const p = ownProvince(state, cmd.nation, cmd.province);
  if (!p) return NOT_YOURS;
  if (!p.buildings.includes('fort')) return 'Recruiting needs a fort';
  const blocked = recruitBlock(p);
  if (blocked !== null) return `Cannot recruit: ${blocked}`;
  if (!isUnitTypeId(cmd.unit)) return 'Unknown unit';
  const requirement = recruitRequirementError(state, cmd.nation, p.id, cmd.unit);
  if (requirement !== null) return requirement;
  const most = unitDef(cmd.unit).commander ? 1 : RECRUITMENT.maxBatch;
  if (!isIntegerIn(cmd.count, 1, most)) return `Recruit 1 to ${most} at a time`;
  if (getNation(state, cmd.nation).gold < recruitGold(state, p.id, cmd.unit, cmd.count)) {
    return 'Not enough gold';
  }
  if (p.materials < recruitMaterials(cmd.unit, cmd.count)) return 'Not enough materials';
  return null;
}

export function applyRecruit(state: GameState, cmd: CommandOf<'recruit'>): void {
  const p = getProvince(state, cmd.province);
  const gold = recruitGold(state, p.id, cmd.unit, cmd.count);
  const materials = recruitMaterials(cmd.unit, cmd.count);
  getNation(state, cmd.nation).gold -= gold;
  p.materials -= materials;
  p.recruitQueue.push({
    id: newId(state, 'recruit'),
    unit: cmd.unit,
    count: cmd.count,
    nation: cmd.nation,
    daysLeft: recruitDays(state, p.id, cmd.unit, cmd.count),
    paid: { gold, materials },
  });
}

export function validateCancelRecruit(
  state: GameState,
  cmd: CommandOf<'cancelRecruit'>,
): string | null {
  const p = ownProvince(state, cmd.nation, cmd.province);
  if (!p) return NOT_YOURS;
  // A besieged fort's queue is frozen, and its pool has no cap to refund into.
  if (p.siege !== null) return 'Cannot change the queue during a siege';
  if (!p.recruitQueue.some((r) => r.id === cmd.recruit && r.nation === cmd.nation)) {
    return 'No such queue item';
  }
  return null;
}

/**
 * Removes a queued item. Gold comes back in full; materials return to the fort's pool only up
 * to its cap, so the queue cannot bank materials past the cap (docs/01 section 4).
 */
export function applyCancelRecruit(state: GameState, cmd: CommandOf<'cancelRecruit'>): void {
  const p = getProvince(state, cmd.province);
  const index = p.recruitQueue.findIndex((r) => r.id === cmd.recruit);
  if (index < 0) return;
  const [item] = p.recruitQueue.splice(index, 1);
  if (!item) return;
  getNation(state, cmd.nation).gold += item.paid.gold;
  const { cap } = fortMaterials(state, p.id);
  p.materials = Math.max(p.materials, Math.min(cap, p.materials + item.paid.materials));
}

export function validateBuyPd(state: GameState, cmd: CommandOf<'buyPd'>): string | null {
  const p = ownProvince(state, cmd.nation, cmd.province);
  if (!p) return NOT_YOURS;
  if (p.siege !== null) return 'Cannot raise defenses during a siege';
  if (!isIntegerIn(cmd.levels, 1, PD.maxLevel - p.pd)) {
    return `Defense goes up to level ${PD.maxLevel}`;
  }
  if (getNation(state, cmd.nation).gold < pdCost(p.pd, cmd.levels)) return 'Not enough gold';
  return null;
}

export function applyBuyPd(state: GameState, cmd: CommandOf<'buyPd'>): void {
  const p = getProvince(state, cmd.province);
  getNation(state, cmd.nation).gold -= pdCost(p.pd, cmd.levels);
  p.pd += cmd.levels;
}

export function validateSetTax(state: GameState, cmd: CommandOf<'setTax'>): string | null {
  if (!ownProvince(state, cmd.nation, cmd.province)) return NOT_YOURS;
  if (!TAX_RATE_IDS.includes(cmd.rate)) return 'Unknown tax rate';
  return null;
}

export function applySetTax(state: GameState, cmd: CommandOf<'setTax'>): void {
  getProvince(state, cmd.province).taxRate = cmd.rate;
}
