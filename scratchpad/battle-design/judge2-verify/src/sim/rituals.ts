// Rituals (docs/02-magic.md sections 3, 5, 6): cast on the map by a mage standing in a lab
// province, paid from the national mana pool when begun, finished after castDays. One
// predicate says why a ritual cannot be cast, so the command, the daily check at completion,
// the Ritual panel, and the AI agree.
import { COLORS, type Color } from '../content/colors';
import { isSpellId, spellDef } from '../content/spells';
import type { ManaAmounts, RitualEffect, RitualSpellDef } from '../content/spells/types';
import { isGarrisonHolder } from './commanders';
import type { ProvinceId } from './ids';
import { postMessage } from './messages';
import { meetsRequirement } from './pips';
import { researchLevel } from './research';
import { applyRitualEffect } from './ritualEffects';
import { activeEffects, getMapProvince, getNation, getProvince } from './state';
import type { ColorAmounts, CommanderState, GameState } from './types';

/** Mana is compared with this slack, as pools grow by fractions each day. */
const MANA_SLACK = 1e-9;

const TIMED: ReadonlySet<RitualEffect['kind']> = new Set([
  'provinceGrowth',
  'provinceSupply',
  'provinceMaterials',
  'provinceDefenseBuff',
  'scry',
]);

/** Provinces within `hops` of a province, itself included. */
export function withinHops(state: GameState, from: ProvinceId, hops: number): Set<ProvinceId> {
  const seen = new Set<ProvinceId>([from]);
  let frontier = [from];
  for (let step = 0; step < hops; step++) {
    const next: ProvinceId[] = [];
    for (const p of frontier) {
      for (const n of getMapProvince(state, p).neighbors) {
        if (seen.has(n)) continue;
        seen.add(n);
        next.push(n);
      }
    }
    frontier = next;
  }
  return seen;
}

/** The province a ritual lands on: its target, or the caster's own province. */
export function ritualProvince(caster: CommanderState, target: ProvinceId | null): ProvinceId {
  return target ?? caster.location;
}

/** Why a target does not fit the spell, or null. */
function targetBlocker(
  state: GameState,
  caster: CommanderState,
  spell: RitualSpellDef,
  target: ProvinceId | null,
): string | null {
  const t = spell.target;
  if (t.kind === 'caster' || t.kind === 'casterFort') {
    if (target !== null) return `${spell.name} is cast on the caster's own province`;
    if (
      t.kind === 'casterFort' &&
      !getProvince(state, caster.location).buildings.includes('fort')
    ) {
      return `${spell.name} needs a fort where the caster stands`;
    }
    return null;
  }
  if (target === null || !state.provinces[target]) return `${spell.name} needs a target province`;
  if (!withinHops(state, caster.location, t.hops).has(target)) {
    return `${spell.name} reaches only ${String(t.hops)} provinces away`;
  }
  if (t.kind === 'owned' && getProvince(state, target).owner !== caster.owner) {
    return `${spell.name} needs a province you own`;
  }
  return null;
}

/**
 * Why this commander cannot cast this ritual on this target now, or null: a godless nation, a
 * caster that is not standing in a lab province of its own, pips, research, the target, and a
 * timed effect of the same spell still on the target.
 */
export function ritualBlocker(
  state: GameState,
  caster: CommanderState,
  spell: RitualSpellDef,
  target: ProvinceId | null,
): string | null {
  if (caster.owner === null || isGarrisonHolder(caster)) return `${caster.name} casts no rituals`;
  const nation = getNation(state, caster.owner);
  if (nation.godless) return `${nation.name} is godless and cannot cast rituals`;
  if (caster.transit) return `${caster.name} is on the move`;
  const here = getProvince(state, caster.location);
  if (here.owner !== caster.owner || !here.buildings.includes('lab')) {
    return 'Rituals need a lab in a province you own';
  }
  if (!meetsRequirement(caster.pips, caster.holy, spell)) {
    return `${caster.name} cannot cast ${spell.name}`;
  }
  if (spell.color !== null && researchLevel(state, caster.owner, spell.color) < spell.level) {
    return `${spell.name} needs level ${String(spell.level)} research`;
  }
  const blocked = targetBlocker(state, caster, spell, target);
  if (blocked !== null) return blocked;
  const province = ritualProvince(caster, target);
  if (
    spell.effects.some((e) => TIMED.has(e.kind)) &&
    activeEffects(state, province).some((e) => e.source === spell.id)
  ) {
    return `${spell.name} is already at work there`;
  }
  return null;
}

/** Every province this commander could cast the ritual on now. */
export function ritualTargets(
  state: GameState,
  caster: CommanderState,
  spell: RitualSpellDef,
): (ProvinceId | null)[] {
  const t = spell.target;
  const options: (ProvinceId | null)[] =
    t.kind === 'caster' || t.kind === 'casterFort'
      ? [null]
      : [...withinHops(state, caster.location, t.hops)];
  return options.filter((p) => ritualBlocker(state, caster, spell, p) === null);
}

/**
 * What a ritual takes from each pool: its colored cost, then the generic part as split by the
 * caster's nation, or by default from the spell's color first and then the largest other
 * pools (ties in WUBRG order). A string says why it cannot be paid.
 */
export function ritualPayment(
  pool: Readonly<ColorAmounts>,
  spell: RitualSpellDef,
  split?: ManaAmounts,
): ColorAmounts | string {
  const pay: ColorAmounts = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  for (const c of COLORS) pay[c] = spell.cost.mana[c] ?? 0;
  if (split) {
    let total = 0;
    for (const [key, value] of Object.entries(split)) {
      if (!COLORS.includes(key as Color)) return `Unknown color ${key}`;
      if (!Number.isInteger(value) || value < 0) return 'Pay generic mana in whole amounts';
      pay[key as Color] += value;
      total += value;
    }
    if (total !== spell.cost.generic) {
      return `${spell.name} takes ${String(spell.cost.generic)} generic mana`;
    }
  } else {
    let left = spell.cost.generic;
    const order = [...COLORS].sort((a, b) => {
      if (a === spell.color) return -1;
      if (b === spell.color) return 1;
      return pool[b] - pay[b] - (pool[a] - pay[a]);
    });
    for (const c of order) {
      const take = Math.min(left, Math.max(0, pool[c] - pay[c]));
      pay[c] += take;
      left -= take;
    }
    if (left > MANA_SLACK) return 'Not enough mana';
  }
  for (const c of COLORS) if (pool[c] + MANA_SLACK < pay[c]) return 'Not enough mana';
  return pay;
}

/** Begins a ritual: the mana is paid now, and the caster is busy for castDays. */
export function beginRitual(
  state: GameState,
  caster: CommanderState,
  spell: RitualSpellDef,
  target: ProvinceId | null,
  pay: ColorAmounts,
): void {
  if (caster.owner === null) return;
  const nation = getNation(state, caster.owner);
  for (const c of COLORS) {
    nation.mana[c] = Math.max(0, nation.mana[c] - pay[c]);
    nation.stats.manaSpent[c] += pay[c];
  }
  caster.order = { kind: 'castRitual', spellId: spell.id, target, daysLeft: spell.castDays };
}

/**
 * Tick step 3: every ritual under way comes a day closer; a finished one is checked again and
 * lands, or fails with no refund. Either way the caster is free again.
 */
export function progressRituals(state: GameState): void {
  for (const c of Object.values(state.commanders)) {
    const order = c.order;
    if (order.kind !== 'castRitual' || c.owner === null) continue;
    order.daysLeft -= 1;
    if (order.daysLeft > 0) continue;
    c.order = { kind: 'idle' };
    const spell = isSpellId(order.spellId) ? spellDef(order.spellId) : null;
    if (spell?.kind !== 'ritual') continue;
    const blocked = ritualBlocker(state, c, spell, order.target);
    const province = ritualProvince(c, order.target);
    const name = getMapProvince(state, province).name;
    if (blocked !== null) {
      postMessage(state, c.owner, 'ritual', `${spell.name} failed: ${blocked}.`, province);
      continue;
    }
    for (const e of spell.effects) {
      applyRitualEffect(state, { nation: c.owner, caster: c, spell, province }, e);
    }
    postMessage(state, c.owner, 'ritual', `${spell.name} is complete at ${name}.`, province);
  }
}
