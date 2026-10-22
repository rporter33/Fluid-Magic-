// Ranged fire and melee (docs/04-battle.md, round steps 2 and 3). Within a phase every attack
// is rolled against the field as it stood when the phase began, then all damage lands, so no
// unit gains by acting first. Rolls go attacker side first, in setup order. Every roll is
// bound to a local in the same order with or without a detail sink, so the sink only watches.
// A multi-strike weapon swings several times per troop, and a trampling one strikes only bodies
// up to its size limit (N2); weapons without those fields swing and draw exactly as before.
import { BATTLE, FIELD_EFFECTS } from '../../content/rules';
import { UNARMED } from '../../content/units/base';
import type { WeaponDef } from '../../content/types';
import type { Formation } from '../types';
import { drn } from '../drn';
import { randBelow, type RngState } from '../rng';
import type { DamageRoll } from './detail';
import type { BattleEvent } from './events';
import {
  active,
  closingRound,
  detailAt,
  exhausted,
  fieldHas,
  frontRow,
  groupStat,
  OTHER,
  ROWS,
  SIDES,
  statOf,
  targetsUpTo,
  type Field,
  type Fighter,
  type Group,
} from './field';
import { land, strikeOf, type Hit } from './landing';

/**
 * One blow: base + DRN - protection - DRN, never below 0. Armor piercing keeps half the
 * protection (rounded down); armor negating ignores it. Weapons and damage spells both roll it.
 * The attack DRN is drawn first.
 */
export function rollDamageParts(
  rng: RngState,
  base: number,
  prot: number,
  piercing: boolean,
  negating: boolean,
): DamageRoll {
  const armor = negating ? 0 : piercing ? Math.floor(prot * BATTLE.armorPiercingFactor) : prot;
  const attackDrn = drn(rng);
  const armorDrn = drn(rng);
  return {
    base,
    prot,
    armor,
    attackDrn,
    armorDrn,
    rolled: Math.max(0, base + attackDrn - armor - armorDrn),
  };
}

/** The damage of one blow (rollDamageParts without the parts). */
export function rollDamage(...args: Parameters<typeof rollDamageParts>): number {
  return rollDamageParts(...args).rolled;
}

/** A weapon blow: str + dmg + bonus as the base; ranged shots pass str 0. */
function weaponRoll(
  rng: RngState,
  str: number,
  w: WeaponDef,
  prot: number,
  bonus: number,
): DamageRoll {
  return rollDamageParts(
    rng,
    str + w.dmg + bonus,
    prot,
    w.armorPiercing === true,
    w.armorNegating === true,
  );
}

/** Weapon damage: str + dmg + bonus as the base; ranged shots pass str 0. */
export function weaponDamage(
  rng: RngState,
  str: number,
  w: WeaponDef,
  prot: number,
  bonus: number,
): number {
  return weaponRoll(rng, str, w, prot, bonus).rolled;
}

/** A ranged weapon reaches a row this deep: the rear needs BATTLE.rearReach, else the middle. */
function reaches(range: number, row: Formation): boolean {
  return ROWS.indexOf(row) <= ROWS.indexOf(range >= BATTLE.rearReach ? 'rear' : 'middle');
}

/** Can still shoot at the enemy's front: a ranged weapon with ammunition that reaches it. */
function armed(g: Group, enemyFront: Formation): boolean {
  return g.base.weapons.some(
    (w, i) => w.range !== undefined && (g.ammo[i] ?? 0) > 0 && reaches(w.range, enemyFront),
  );
}

/**
 * Who fights hand to hand this phase, fixed when the phase begins. A group in its side's front
 * closes on the enemy front from its closing round, unless it can still shoot: archers hold
 * back and keep firing. In a storm nobody can shoot, so archers close too. A group the enemy
 * has closed on is in contact and fights back.
 */
function engaged(field: Field, round: number): Set<Group> {
  // A wall between the armies keeps them apart.
  if (fieldHas(field, (e) => FIELD_EFFECTS[e.kind].noMelee)) return new Set();
  const grounded = fieldHas(field, (e) => FIELD_EFFECTS[e.kind].noRanged);
  const fronts = { attacker: frontRow(field, 'attacker'), defender: frontRow(field, 'defender') };
  const closing = new Set<Group>();
  for (const side of SIDES) {
    const enemyFront = fronts[OTHER[side]];
    if (enemyFront === null) continue;
    for (const g of field.sides[side]) {
      if (
        active(g) &&
        !exhausted(g) &&
        g.row === fronts[side] &&
        (grounded || !armed(g, enemyFront)) &&
        round >= closingRound(g.base)
      ) {
        closing.add(g);
      }
    }
  }
  const result = new Set(closing);
  for (const side of SIDES) {
    if (!field.sides[OTHER[side]].some((e) => closing.has(e))) continue;
    for (const g of field.sides[side]) if (active(g) && g.row === fronts[side]) result.add(g);
  }
  return result;
}

/** Detail: the fronts and who is in contact as a ranged or melee phase begins. */
function engage(field: Field, contact: Set<Group>, log: BattleEvent[]): void {
  field.detail?.push({
    kind: 'engage',
    ...detailAt(field, log),
    fronts: { attacker: frontRow(field, 'attacker'), defender: frontRow(field, 'defender') },
    contact: [...field.sides.attacker, ...field.sides.defender]
      .filter((g) => contact.has(g))
      .map((g) => g.ref),
  });
}

export function rangedPhase(field: Field, round: number, rng: RngState, log: BattleEvent[]): void {
  // A storm grounds every shot.
  if (fieldHas(field, (e) => FIELD_EFFECTS[e.kind].noRanged)) return;
  const hits: Hit[] = [];
  const contact = engaged(field, round);
  if (field.detail) engage(field, contact, log);
  const toHit = BATTLE.ranged.toHit;
  for (const side of SIDES) {
    const enemy = OTHER[side];
    const row = frontRow(field, enemy);
    if (row === null) continue;
    const targets = targetsUpTo(field, enemy, row);
    for (const g of field.sides[side]) {
      if (!active(g) || exhausted(g) || contact.has(g)) continue;
      g.base.weapons.forEach((w, slot) => {
        const range = w.range;
        if (range === undefined || (g.ammo[slot] ?? 0) <= 0 || !reaches(range, row)) return;
        g.ammo[slot] = (g.ammo[slot] ?? 0) - 1;
        const prec = groupStat(g, 'prec');
        for (const m of g.members) {
          if (!m.alive) continue;
          const target = targets[randBelow(rng, targets.length)];
          if (!target) continue;
          const attackDrn = drn(rng);
          const defenseDrn = drn(rng);
          const hit = prec + attackDrn >= toHit + defenseDrn;
          // A shot's damage is the weapon's alone: the wielder's strength counts only in melee.
          const roll = hit ? weaponRoll(rng, 0, w, statOf(target, 'prot'), 0) : null;
          const rolls = { attack: prec, attackDrn, defense: toHit, defenseDrn };
          hits.push({
            by: g,
            from: m,
            weapon: w,
            target,
            roll,
            strike: field.detail ? strikeOf(field, g, m, slot, target, rolls, roll, false) : null,
          });
        }
      });
    }
  }
  land(field, hits, 'volley', log);
}

/** One melee weapon of a group: its slot in base.weapons (-1 unarmed), and whom it can strike. */
interface Swing {
  w: WeaponDef;
  slot: number;
  /** Swings per troop this phase (N2): the weapon's strikes, 1 by default. */
  strikes: number;
  /** The phase's targets it can reach: all of them, or only bodies up to its size limit. */
  candidates: readonly Fighter[];
}

/**
 * A group's melee weapons, unarmed if it has none. A weapon with a size limit (trample) is
 * filtered once per group and phase to the targets of that size or smaller (N2).
 */
function swingsOf(g: Group, targets: readonly Fighter[]): Swing[] {
  const swings: Swing[] = [];
  const add = (w: WeaponDef, slot: number) => {
    const limit = w.maxTargetSize;
    const candidates =
      limit === undefined ? targets : targets.filter((t) => t.group.base.size <= limit);
    swings.push({ w, slot, strikes: w.strikes ?? 1, candidates });
  };
  g.base.weapons.forEach((w, slot) => {
    if (w.range === undefined) add(w, slot);
  });
  if (swings.length === 0) add(UNARMED, -1);
  return swings;
}

/** One melee swing of a troop: target, attack and defense DRNs, then on a hit the damage. */
function swingAt(
  field: Field,
  rng: RngState,
  g: Group,
  m: Fighter,
  swing: Swing,
  firstRound: boolean,
): Hit | null {
  const { w, slot, candidates } = swing;
  const target = candidates[randBelow(rng, candidates.length)];
  if (!target) return null;
  const attack = statOf(m, 'att');
  const attackDrn = drn(rng);
  const defense = statOf(target, 'def');
  const defenseDrn = drn(rng);
  const hit = attack + attackDrn > defense + defenseDrn;
  const bonus = firstRound ? (w.firstRoundBonus ?? 0) : 0;
  const roll = hit ? weaponRoll(rng, statOf(m, 'str'), w, statOf(target, 'prot'), bonus) : null;
  const rolls = { attack, attackDrn, defense, defenseDrn };
  return {
    by: g,
    from: m,
    weapon: w,
    target,
    roll,
    strike: field.detail ? strikeOf(field, g, m, slot, target, rolls, roll, firstRound) : null,
  };
}

export function meleePhase(field: Field, round: number, rng: RngState, log: BattleEvent[]): void {
  const hits: Hit[] = [];
  const contact = engaged(field, round);
  if (field.detail) engage(field, contact, log);
  for (const side of SIDES) {
    const enemy = OTHER[side];
    const row = frontRow(field, enemy);
    if (row === null) continue;
    const targets = targetsUpTo(field, enemy, row);
    for (const g of field.sides[side]) {
      if (!contact.has(g) || exhausted(g)) continue;
      g.firstMelee ??= round;
      const firstRound = g.firstMelee === round;
      const swings = swingsOf(g, targets);
      for (const m of g.members) {
        if (!m.alive) continue;
        // Each weapon's swings in a row (N2). With no target in reach a weapon swings at
        // nothing and draws nothing, since randBelow refuses a bound of 0.
        for (const swing of swings) {
          if (swing.candidates.length === 0) continue;
          for (let n = 0; n < swing.strikes; n++) {
            const h = swingAt(field, rng, g, m, swing, firstRound);
            if (h) hits.push(h);
          }
        }
      }
    }
  }
  land(field, hits, 'melee', log);
}
