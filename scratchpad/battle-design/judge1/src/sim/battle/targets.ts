// Who a battle spell lands on (docs/02-magic.md section 5). Each target kind is chosen once per
// cast, so every effect of one spell lands on the same group. Groups are compared by living
// troops; ties go to setup order.
import type { BattleSpellDef } from '../../content/spells/types';
import { randBelow, type RngState } from '../rng';
import {
  active,
  frontRow,
  living,
  OTHER,
  present,
  ROWS,
  type Field,
  type Fighter,
  type Group,
} from './field';
import type { Formation } from '../types';

/** A side's rows in the order spells look for targets: its front, the rows behind, then before. */
function rowOrder(field: Field, side: Group['side']): Formation[] {
  const front = frontRow(field, side);
  if (front === null) return [...ROWS];
  const i = ROWS.indexOf(front);
  return [...ROWS.slice(i), ...ROWS.slice(0, i)];
}

/** The largest group passing the test, looking row by row from the side's front. */
export function largestGroup(
  field: Field,
  side: Group['side'],
  test: (g: Group) => boolean,
): Group | null {
  for (const row of rowOrder(field, side)) {
    let best: Group | null = null;
    for (const g of field.sides[side]) {
      if (g.row !== row || !test(g)) continue;
      if (!best || living(g) > living(best)) best = g;
    }
    if (best) return best;
  }
  return null;
}

/** It carries a change from this spell. */
export function hasSource(g: Group, source: string): boolean {
  return g.mods.some((m) => m.source === source);
}

/** Debuff spells it carries, newest first. */
export function debuffSources(g: Group): string[] {
  const out: string[] = [];
  for (let i = g.mods.length - 1; i >= 0; i--) {
    const m = g.mods[i];
    if (m?.debuff && !out.includes(m.source)) out.push(m.source);
  }
  return out;
}

export function wounded(g: Group): boolean {
  return g.members.some((m) => m.alive && m.hp < m.maxHp);
}

/** A group whose morale a shock can break: present, steady, and not fearless. */
export function canBeShaken(g: Group, fearless: (g: Group) => boolean): boolean {
  return !g.isCommander && present(g) && g.routingSince === null && !fearless(g);
}

/** A caster an enemy can tire: a present commander with color or holy pips. */
export function isCaster(g: Group): boolean {
  return g.isCommander && present(g) && (Object.values(g.pips).some((n) => n > 0) || g.holy > 0);
}

export function pipCount(g: Group): number {
  let n = 0;
  for (const v of Object.values(g.pips)) n += v;
  return n;
}

/** Up to n distinct living troops at random among every present group of a row. */
export function troopsInRow(
  field: Field,
  side: Group['side'],
  row: Formation,
  n: number,
  rng: RngState,
): Fighter[] {
  const pool: Fighter[] = [];
  for (const g of field.sides[side]) {
    if (g.row !== row || !present(g)) continue;
    for (const m of g.members) if (m.alive) pool.push(m);
  }
  const picks = Math.min(n, pool.length);
  // A partial Fisher-Yates shuffle: the first picks entries end up chosen.
  for (let i = 0; i < picks; i++) {
    const j = i + randBelow(rng, pool.length - i);
    const a = pool[i];
    const b = pool[j];
    if (a && b) {
      pool[i] = b;
      pool[j] = a;
    }
  }
  return pool.slice(0, picks);
}

/** A random living troop of a group. */
export function oneTroop(g: Group, rng: RngState): Fighter[] {
  const alive = g.members.filter((m) => m.alive);
  const pick = alive[randBelow(rng, alive.length)];
  return pick ? [pick] : [];
}

/** The enemy group a single-target or squad spell aims at. */
export function enemyTarget(field: Field, caster: Group): Group | null {
  return largestGroup(field, OTHER[caster.side], present);
}

/** The friendly squad a one-squad support spell picks, if any needs it. */
export function friendlySquad(
  field: Field,
  caster: Group,
  needs: (g: Group) => boolean,
): Group | null {
  return largestGroup(field, caster.side, (g) => !g.isCommander && active(g) && needs(g));
}

/** Present groups of a side. */
export function presentGroups(field: Field, side: Group['side']): Group[] {
  return field.sides[side].filter(present);
}

/** A spell deals damage: the heuristic puts these first against large enemy armies. */
export function isDamageSpell(spell: BattleSpellDef): boolean {
  return spell.effects.some((e) => e.kind === 'damage');
}
