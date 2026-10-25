// Checks every spell record: requirements parse, numbers are in range, and every primitive is
// one the resolver and the ritual code implement (docs/06-architecture.md, "Content
// validation").
import { isColor } from '../colors';
import { ELEMENTS, type UnitDef } from '../types';
import { isUnitTypeId, UNITS } from '../units';
import { parseRequirement } from './index';
import {
  FIELD_EFFECT_KINDS,
  SPELL_STATS,
  type BattleEffect,
  type ManaAmounts,
  type RitualEffect,
  type SpellDef,
} from './types';

const whole = (n: number, min: number) => Number.isInteger(n) && n >= min;
const unitOf = (id: string): UnitDef | undefined => (isUnitTypeId(id) ? UNITS[id] : undefined);

function manaProblems(where: string, mana: ManaAmounts): string[] {
  return Object.entries(mana).flatMap(([color, n]) =>
    isColor(color) && whole(n, 1) ? [] : [`${where} bad mana ${color}${String(n)}`],
  );
}

function battleEffectProblems(where: string, e: BattleEffect): string[] {
  switch (e.kind) {
    case 'damage': {
      const area = e.targets.kind !== 'area' || whole(e.targets.count, 1);
      return e.amount > 0 && ELEMENTS.includes(e.element) && area ? [] : [`${where} bad damage`];
    }
    case 'buff':
    case 'debuff': {
      const rounds = e.duration.kind === 'battle' || whole(e.duration.rounds, 1);
      const area = e.targets.kind !== 'area' || whole(e.targets.count, 1);
      const ok = SPELL_STATS.includes(e.stat) && e.delta !== 0 && rounds && area;
      return ok ? [] : [`${where} bad ${e.kind}`];
    }
    case 'summon': {
      const unit = unitOf(e.unit);
      return unit && !unit.commander && whole(e.count, 1) ? [] : [`${where} bad summon`];
    }
    case 'heal':
      return e.amount > 0 && whole(e.removeDebuffs ?? 0, 0) ? [] : [`${where} bad heal`];
    case 'fatigueDrain':
      return e.amount > 0 ? [] : [`${where} bad fatigue drain`];
    case 'moraleShock':
      return e.amount !== 0 ? [] : [`${where} bad morale shock`];
    case 'fieldEffect':
      return FIELD_EFFECT_KINDS.includes(e.effect) && whole(e.rounds, 1)
        ? []
        : [`${where} bad field effect`];
  }
}

function ritualEffectProblems(where: string, e: RitualEffect): string[] {
  switch (e.kind) {
    case 'summonToProvince': {
      const unit = unitOf(e.unit);
      const ok = e.commander
        ? unit?.commander !== undefined && e.count === 1
        : unit !== undefined && !unit.commander && whole(e.count, 1);
      return ok ? [] : [`${where} bad summon`];
    }
    case 'provincePop':
      return e.deltaPct > -1 ? [] : [`${where} bad population change`];
    case 'provinceUnrest':
      return Number.isFinite(e.delta) ? [] : [`${where} bad unrest`];
    case 'provinceGrowth':
    case 'provinceSupply':
    case 'provinceMaterials':
    case 'provinceDefenseBuff':
      return whole(e.months, 1) ? [] : [`${where} bad months`];
    case 'remoteDamage':
      return whole(e.dice, 1) && ELEMENTS.includes(e.element) ? [] : [`${where} bad damage`];
    case 'scry':
      return [];
    case 'dominionPush':
      return whole(e.strength, 1) ? [] : [`${where} bad dominion push`];
    case 'manaConvert':
      return isColor(e.from) && isColor(e.to) && e.from !== e.to && e.ratio > 0
        ? []
        : [`${where} bad mana conversion`];
  }
}

export function validateSpell(key: string, s: SpellDef): string[] {
  const where = `spell ${key}`;
  const problems: string[] = [];
  if (s.id !== key) problems.push(`${where} has id ${s.id}`);
  let slots: string[][] = [];
  try {
    slots = parseRequirement(s.requirement);
  } catch {
    problems.push(`${where} bad requirement ${s.requirement}`);
  }
  if (s.color === null) {
    if (slots.length > 0 || !whole(s.holy, 1) || s.level !== 0) {
      problems.push(`${where} a holy spell needs holy pips only and no research level`);
    }
  } else {
    if (!slots.some((slot) => slot.includes(s.color ?? ''))) {
      problems.push(`${where} requirement lacks its color`);
    }
    if (!whole(s.level, 1) || s.level > 6) problems.push(`${where} bad level`);
    if (!whole(s.holy, 0)) problems.push(`${where} bad holy`);
  }
  if (s.effects.length === 0) problems.push(`${where} has no effects`);
  if (s.kind === 'battle') {
    if (!(s.fatigue > 0)) problems.push(`${where} bad fatigue`);
    problems.push(...manaProblems(where, s.carriedMana));
    for (const e of s.effects) problems.push(...battleEffectProblems(where, e));
  } else {
    problems.push(...manaProblems(where, s.cost.mana));
    if (!whole(s.cost.generic, 0)) problems.push(`${where} bad generic cost`);
    if (!whole(s.castDays, 1)) problems.push(`${where} bad cast days`);
    if ((s.target.kind === 'any' || s.target.kind === 'owned') && !whole(s.target.hops, 0)) {
      problems.push(`${where} bad range`);
    }
    for (const e of s.effects) problems.push(...ritualEffectProblems(where, e));
  }
  return problems;
}
