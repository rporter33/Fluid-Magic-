// Ranged fire and melee (docs/04-battle.md, round steps 2 and 3). Within a phase every attack
// is rolled against the field as it stood when the phase began, then all damage lands, so no
// unit gains by acting first. Rolls go attacker side first, in setup order. Every roll is
// bound to a local in the same order with or without a detail sink, so the sink only watches.
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

/** A group's melee weapons with their slots in base.weapons; unarmed (-1) if it has none. */
function swingsOf(g: Group): { w: WeaponDef; slot: number }[] {
  const swings: { w: WeaponDef; slot: number }[] = [];
  g.base.weapons.forEach((w, slot) => {
    if (w.range === undefined) swings.push({ w, slot });
  });
  if (swings.length === 0) swings.push({ w: UNARMED, slot: -1 });
  return swings;
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
      const swings = swingsOf(g);
      for (const m of g.members) {
        if (!m.alive) continue;
        for (const { w, slot } of swings) {
          const target = targets[randBelow(rng, targets.length)];
          if (!target) continue;
          const attack = statOf(m, 'att');
          const attackDrn = drn(rng);
          const defense = statOf(target, 'def');
          const defenseDrn = drn(rng);
          const hit = attack + attackDrn > defense + defenseDrn;
          const bonus = firstRound ? (w.firstRoundBonus ?? 0) : 0;
          const roll = hit
            ? weaponRoll(rng, statOf(m, 'str'), w, statOf(target, 'prot'), bonus)
            : null;
          hits.push({
            by: g,
            from: m,
            weapon: w,
            target,
            roll,
            strike: field.detail
              ? strikeOf(
                  field,
                  g,
                  m,
                  slot,
                  target,
                  { attack, attackDrn, defense, defenseDrn },
                  roll,
                  firstRound,
                )
              : null,
          });
        }
      }
    }
  }
  land(field, hits, 'melee', log);
}
