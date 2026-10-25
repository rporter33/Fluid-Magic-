// Ranged fire and melee (docs/04-battle.md, round steps 2 and 3). Within a phase every attack
// is rolled against the field as it stood when the phase began, then all damage lands, so no
// unit gains by acting first. Rolls go attacker side first, in setup order.
import { BATTLE, FIELD_EFFECTS } from '../../content/rules';
import { UNARMED } from '../../content/units/base';
import type { WeaponDef } from '../../content/types';
import type { Formation } from '../types';
import { drn } from '../drn';
import { randBelow, type RngState } from '../rng';
import type { BattleEvent } from './events';
import {
  active,
  closingRound,
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

/** One attack: a miss has no amount. Misses are kept so the log shows every volley. */
interface Hit {
  by: Group;
  /** The troop that struck, which life drain heals. */
  from: Fighter;
  weapon: WeaponDef;
  target: Fighter;
  amount: number | null;
}

/**
 * One blow: base + DRN - protection - DRN, never below 0. Armor piercing keeps half the
 * protection (rounded down); armor negating ignores it. Weapons and damage spells both roll it.
 */
export function rollDamage(
  rng: RngState,
  base: number,
  prot: number,
  piercing: boolean,
  negating: boolean,
): number {
  const armor = negating ? 0 : piercing ? Math.floor(prot * BATTLE.armorPiercingFactor) : prot;
  return Math.max(0, base + drn(rng) - armor - drn(rng));
}

/** Weapon damage: str + dmg + bonus as the base; ranged shots pass str 0. */
export function weaponDamage(
  rng: RngState,
  str: number,
  w: WeaponDef,
  prot: number,
  bonus: number,
): number {
  return rollDamage(
    rng,
    str + w.dmg + bonus,
    prot,
    w.armorPiercing === true,
    w.armorNegating === true,
  );
}

/**
 * Life drain owed for the phase's damaging hits, paid only once every hit has landed, to
 * strikers still alive, so neither side gains by rolling first.
 */
function drainLife(hits: Hit[], log: BattleEvent[]): void {
  const owed = new Map<Fighter, number>();
  for (const h of hits) {
    const drain = h.by.base.lifeDrain;
    if (drain > 0 && h.amount !== null && h.amount > 0) {
      owed.set(h.from, (owed.get(h.from) ?? 0) + drain);
    }
  }
  const healed = new Map<Group, number>();
  for (const [f, amount] of owed) {
    if (!f.alive) continue;
    const gain = Math.min(f.maxHp - f.hp, amount);
    if (gain <= 0) continue;
    f.hp += gain;
    healed.set(f.group, (healed.get(f.group) ?? 0) + gain);
  }
  for (const [g, amount] of healed) log.push({ kind: 'heal', target: g.ref, amount });
}

/**
 * Fire shields burn every melee striker that hit them, once all of the phase's hits have
 * landed: fire damage per hit, no armor.
 */
function burnStrikers(hits: Hit[], log: BattleEvent[]): void {
  const owed = new Map<Fighter, number>();
  for (const h of hits) {
    const shield = h.target.group.base.fireShield;
    if (shield > 0 && h.amount !== null && h.amount > 0) {
      owed.set(h.from, (owed.get(h.from) ?? 0) + shield);
    }
  }
  const tally = new Map<Group, { amount: number; kills: number }>();
  for (const [f, amount] of owed) {
    if (!f.alive) continue;
    let t = tally.get(f.group);
    if (!t) {
      t = { amount: 0, kills: 0 };
      tally.set(f.group, t);
    }
    t.amount += Math.min(amount, f.hp);
    f.hp -= amount;
    if (f.hp <= 0) {
      f.hp = 0;
      f.alive = false;
      f.group.deathsThisRound += 1;
      t.kills += 1;
    }
  }
  for (const [g, { amount, kills }] of tally) {
    log.push({ kind: 'damage', target: g.ref, amount, element: 'fire', kills, by: 'c0' } as never);
  }
}

/** Lands the phase's hits in order and logs one event per attacking and target group. */
function land(hits: Hit[], kind: 'volley' | 'melee', log: BattleEvent[]): void {
  const tally = new Map<string, { by: Group; target: Group; attacks: number; hits: number; blocked: number; onFallen: number; kills: number; dmg: number }>();
  for (const h of hits) {
    const key = `${h.by.ref} ${h.target.group.ref}`;
    let t = tally.get(key);
    if (!t) {
      t = { by: h.by, target: h.target.group, attacks: 0, hits: 0, blocked: 0, onFallen: 0, kills: 0, dmg: 0 };
      tally.set(key, t);
    }
    t.attacks += 1;
    if (h.amount === null) continue;
    t.hits += 1;
    if (!h.target.alive) { t.onFallen += 1; continue; }
    if (h.amount === 0) t.blocked += 1;
    t.dmg += Math.min(h.amount, h.target.hp);
    h.target.hp -= h.amount;
    const killed = h.target.hp <= 0;
    if (killed) {
      h.target.alive = false;
      h.target.hp = 0;
      h.target.group.deathsThisRound += 1;
      t.kills += 1;
    }
    if (h.target.group.isCommander && h.amount > 0) {
      log.push({
        kind: 'damage',
        target: h.target.group.ref,
        amount: h.amount,
        element: h.weapon.element ?? 'physical',
        kills: killed ? 1 : 0,
        by: h.by.ref,
      } as never);
    }
  }
  for (const t of tally.values()) {
    log.push({ kind, squad: t.by.ref, target: t.target.ref, attacks: t.attacks, hits: t.hits, blocked: t.blocked, onFallen: t.onFallen, kills: t.kills, dmg: t.dmg } as never);
  }
  drainLife(hits, log);
  if (kind === 'melee') burnStrikers(hits, log);
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

export function rangedPhase(field: Field, round: number, rng: RngState, log: BattleEvent[]): void {
  // A storm grounds every shot.
  if (fieldHas(field, (e) => FIELD_EFFECTS[e.kind].noRanged)) return;
  const hits: Hit[] = [];
  const contact = engaged(field, round);
  for (const side of SIDES) {
    const enemy = OTHER[side];
    const row = frontRow(field, enemy);
    if (row === null) continue;
    const targets = targetsUpTo(field, enemy, row);
    for (const g of field.sides[side]) {
      if (!active(g) || exhausted(g) || contact.has(g)) continue;
      g.base.weapons.forEach((w, i) => {
        const range = w.range;
        if (range === undefined || (g.ammo[i] ?? 0) <= 0 || !reaches(range, row)) return;
        g.ammo[i] = (g.ammo[i] ?? 0) - 1;
        const prec = groupStat(g, 'prec');
        for (const m of g.members) {
          if (!m.alive) continue;
          const target = targets[randBelow(rng, targets.length)];
          if (!target) continue;
          const hit = prec + drn(rng) >= BATTLE.ranged.toHit + drn(rng);
          // A shot's damage is the weapon's alone: the wielder's strength counts only in melee.
          const amount = hit ? weaponDamage(rng, 0, w, statOf(target, 'prot'), 0) : null;
          hits.push({ by: g, from: m, weapon: w, target, amount });
        }
      });
    }
  }
  land(hits, 'volley', log);
}

export function meleePhase(field: Field, round: number, rng: RngState, log: BattleEvent[]): void {
  const hits: Hit[] = [];
  const contact = engaged(field, round);
  for (const side of SIDES) {
    const enemy = OTHER[side];
    const row = frontRow(field, enemy);
    if (row === null) continue;
    const targets = targetsUpTo(field, enemy, row);
    for (const g of field.sides[side]) {
      if (!contact.has(g) || exhausted(g)) continue;
      g.firstMelee ??= round;
      const melee = g.base.weapons.filter((w) => w.range === undefined);
      const swings = melee.length > 0 ? melee : [UNARMED];
      for (const m of g.members) {
        if (!m.alive) continue;
        for (const w of swings) {
          const target = targets[randBelow(rng, targets.length)];
          if (!target) continue;
          const hit = statOf(m, 'att') + drn(rng) > statOf(target, 'def') + drn(rng);
          const bonus = g.firstMelee === round ? (w.firstRoundBonus ?? 0) : 0;
          const amount = hit
            ? weaponDamage(rng, statOf(m, 'str'), w, statOf(target, 'prot'), bonus)
            : null;
          hits.push({ by: g, from: m, weapon: w, target, amount });
        }
      }
    }
  }
  land(hits, 'melee', log);
}
