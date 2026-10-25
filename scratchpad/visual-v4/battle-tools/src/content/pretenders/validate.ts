// Content validation of the pretender records (docs/06-architecture.md, "Content validation";
// docs/05-pretender.md): chassis, blessings and boons. validateContent (content/index.ts) runs
// these with the rest.
import { COLORS, isColor, type Color } from '../colors';
import { BLESS, BLESSING_MENU, MAX_PIPS } from '../rules';
import { ELEMENTS, type UnitDef } from '../types';
import { isUnitTypeId, UNITS } from '../units';
import { BLESSINGS, type BlessingDef, type BlessingEffect } from './blessings';
import { BOON_IDS, BOONS } from './boons';
import { CHASSIS_ROLES, type ChassisDef } from './chassis';
import { SCALE_AXES, SCALE_MAX } from './scales';

const POLES: readonly string[] = ['positive', 'negative'];

function validPole(axis: string, toward: string): boolean {
  return (SCALE_AXES as readonly string[]).includes(axis) && POLES.includes(toward);
}

export function validateChassis(key: string, c: ChassisDef): string[] {
  const problems: string[] = [];
  const where = `chassis ${key}`;
  if (c.id !== key) problems.push(`${where} has id ${c.id}`);
  if (!(c.cost >= 0)) problems.push(`${where} bad cost`);
  if (c.basePips) {
    const { color, count } = c.basePips;
    if ((color !== 'nation' && !isColor(color)) || !Number.isInteger(count) || count < 1) {
      problems.push(`${where} bad base pips`);
    }
  }
  if (!Number.isInteger(c.baseDominion) || c.baseDominion < 1 || c.baseDominion > 10) {
    problems.push(`${where} bad base dominion`);
  }
  const body: UnitDef | undefined = isUnitTypeId(c.body) ? UNITS[c.body] : undefined;
  if (!body?.commander) problems.push(`${where} body ${c.body} is not a commander`);
  else if (body.cost !== null) problems.push(`${where} body ${c.body} is recruitable`);
  if (!(c.pipDiscount >= 0) || !(c.dominionFactor >= 1)) problems.push(`${where} bad modifiers`);
  if (c.realm !== 'generic' && !isColor(c.realm)) problems.push(`${where} bad realm`);
  if (!CHASSIS_ROLES.includes(c.role)) problems.push(`${where} bad role`);
  // The discount may not make a new color free or cheaper than nothing.
  if (!Number.isInteger(c.newColorFirstPip) || c.newColorFirstPip <= c.pipDiscount) {
    problems.push(`${where} bad new-color price`);
  }
  const axes = (c.attunement ?? []).map((p) => p.axis);
  if (
    (c.attunement ?? []).some((p) => !validPole(p.axis, p.toward)) ||
    new Set(axes).size !== axes.length
  ) {
    problems.push(`${where} bad attunement`);
  }
  if (c.minAwakening !== undefined && !['dormant', 'imprisoned'].includes(c.minAwakening)) {
    problems.push(`${where} bad minimum awakening`);
  }
  if (c.startSprings) {
    const { color, count } = c.startSprings;
    if ((color !== 'nation' && !isColor(color)) || !Number.isInteger(count) || count < 1) {
      problems.push(`${where} bad start springs`);
    }
  }
  if (c.monthlySummon) {
    const { unit, count, cap } = c.monthlySummon;
    const summoned: UnitDef | undefined = isUnitTypeId(unit) ? UNITS[unit] : undefined;
    if (!summoned || summoned.commander)
      problems.push(`${where} monthly summon ${unit} is not a troop`);
    if (!Number.isInteger(count) || count < 1 || !Number.isInteger(cap) || cap < count) {
      problems.push(`${where} bad monthly summon numbers`);
    }
    // N7: leadership bounds each month's summons, so a body that could never lead one is wrong.
    if (body?.commander && count > body.commander.leadership) {
      problems.push(`${where} monthly summon exceeds its body's leadership`);
    }
  }
  if (c.reform && (!Number.isInteger(c.reform.days) || c.reform.days < 1)) {
    problems.push(`${where} bad reform days`);
  }
  // The AI reads the role (docs/08 step 10): an idol stays where it stands, so it must be the
  // immobile kind, and every immobile body is an idol.
  if (body && (c.role === 'idol') !== body.tags.includes('immobile')) {
    problems.push(`${where} is an idol exactly when its body is immobile`);
  }
  if (!(c.aiPower >= 0)) problems.push(`${where} bad AI power`);
  return problems;
}

const EFFECT_NUMBERS = [
  'att',
  'str',
  'def',
  'prot',
  'mor',
  'prec',
  'regeneration',
  'lifeDrain',
  'firstRoundBonus',
] as const;

/** Why an effect is malformed, or null: every number positive, at least one field set. */
function effectProblem(e: BlessingEffect): string | null {
  const fields = Object.keys(e).length;
  if (fields === 0) return 'has no effect';
  for (const key of EFFECT_NUMBERS) {
    const v = e[key];
    if (v !== undefined && !(v > 0 && Number.isFinite(v))) return `bad ${key}`;
  }
  if ((e.regeneration ?? 0) > 1) return 'bad regeneration';
  if (e.shield) {
    const { element, amount } = e.shield;
    if (!Number.isInteger(amount) || amount < 1) return 'bad shield';
    if (!ELEMENTS.includes(element)) return 'bad shield element';
  }
  if (e.melee) {
    const { dmg, element } = e.melee;
    if (!Number.isInteger(dmg) || dmg < 0) return 'bad melee damage';
    if (element !== undefined && !ELEMENTS.includes(element)) return 'bad melee element';
  }
  return null;
}

export function validateBlessing(key: string, bl: BlessingDef): string[] {
  const problems: string[] = [];
  const where = `blessing ${key}`;
  const { minRequires, maxRequires, minCost, freePips } = BLESSING_MENU;
  if (bl.id !== key) problems.push(`${where} has id ${bl.id}`);
  if (!isColor(bl.color)) problems.push(`${where} bad color`);
  if (!Number.isInteger(bl.requires) || bl.requires < minRequires || bl.requires > maxRequires) {
    problems.push(`${where} must require ${String(minRequires)} to ${String(maxRequires)} pips`);
  } else if (bl.requires > MAX_PIPS) {
    problems.push(`${where} requires more than the pip cap`);
  } else {
    const cost = Math.max(minCost, bl.requires - freePips);
    if (bl.cost !== cost) problems.push(`${where} must cost ${String(cost)}`);
  }
  if (!bl.group.startsWith(`${bl.color}.`) || bl.group.length <= 2) {
    problems.push(`${where} group must start with ${bl.color}.`);
  }
  const effect = effectProblem(bl.effect);
  if (effect !== null) problems.push(`${where} ${effect}`);
  const scale = bl.requiresScale;
  if (
    scale &&
    (!validPole(scale.axis, scale.toward) ||
      !Number.isInteger(scale.steps) ||
      scale.steps < 1 ||
      scale.steps > SCALE_MAX)
  ) {
    problems.push(`${where} bad scale requirement`);
  }
  if (bl.tier !== undefined && (bl.incarnate || scale)) {
    problems.push(`${where} is a default pick, so it may be neither incarnate nor need a scale`);
  }
  return problems;
}

/** The effect's numbers equal the fixed bless of the color times `factor`, and nothing else. */
function isFixedBless(e: BlessingEffect, color: Color, factor: number): boolean {
  const fixed: Partial<Record<(typeof EFFECT_NUMBERS)[number], number>> = BLESS[color];
  return (
    e.shield === undefined &&
    e.melee === undefined &&
    e.berserk === undefined &&
    EFFECT_NUMBERS.every((k) => (e[k] ?? 0) === (fixed[k] ?? 0) * factor)
  );
}

/**
 * Each color has exactly one standard and one greater blessing, in one group, at the fixed
 * bless's thresholds and with its numbers: the default picks are the fixed bless of Phase 5.
 */
export function validateBlessingTiers(): string[] {
  const problems: string[] = [];
  const all: readonly BlessingDef[] = Object.values(BLESSINGS);
  for (const color of COLORS) {
    const where = `blessings ${color}`;
    const standard = all.filter((bl) => bl.color === color && bl.tier === 'standard');
    const greater = all.filter((bl) => bl.color === color && bl.tier === 'greater');
    const [s] = standard;
    const [g] = greater;
    if (standard.length !== 1 || greater.length !== 1 || !s || !g) {
      problems.push(`${where} need one standard and one greater`);
      continue;
    }
    if (s.group !== g.group) problems.push(`${where} standard and greater must share a group`);
    if (s.requires !== BLESS.minPips || !isFixedBless(s.effect, color, 1)) {
      problems.push(`${where} standard ${s.id} differs from the fixed bless`);
    }
    if (g.requires !== BLESS.doubleAt || !isFixedBless(g.effect, color, 2)) {
      problems.push(`${where} greater ${g.id} differs from the doubled fixed bless`);
    }
  }
  return problems;
}

export function validateBoons(): string[] {
  const problems: string[] = [];
  for (const id of BOON_IDS) {
    const boon = BOONS[id];
    if (boon.id !== id) problems.push(`boon ${id} has id ${boon.id}`);
    if (!Number.isInteger(boon.cost) || boon.cost < 0) problems.push(`boon ${id} bad cost`);
  }
  return problems;
}
