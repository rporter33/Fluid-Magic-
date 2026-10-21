// Ranged fire and melee (docs/04-battle.md, round steps 2 and 3). Within a phase every attack
// is rolled against the field as it stood when the phase began, then all damage lands, so no
// unit gains by acting first. Rolls go attacker side first, in setup order.
import { BATTLE } from '../../content/rules';
import type { WeaponDef } from '../../content/types';
import { drn } from '../drn';
import { randBelow, type RngState } from '../rng';
import type { BattleEvent } from './events';
import {
  active,
  closingRound,
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
  weapon: WeaponDef;
  target: Fighter;
  amount: number | null;
}

/**
 * Weapon damage: str + dmg + bonus + DRN - protection - DRN, never below 0. Armor piercing
 * halves protection (rounded down); armor negating ignores it.
 */
export function weaponDamage(
  rng: RngState,
  str: number,
  w: WeaponDef,
  prot: number,
  bonus: number,
): number {
  const armor = w.armorNegating ? 0 : w.armorPiercing ? Math.floor(prot / 2) : prot;
  return Math.max(0, str + w.dmg + bonus + drn(rng) - armor - drn(rng));
}

/** Lands the phase's hits in order and logs one event per attacking and target group. */
function land(hits: Hit[], kind: 'volley' | 'melee', log: BattleEvent[]): void {
  const tally = new Map<string, { by: Group; target: Group; hits: number; kills: number }>();
  for (const h of hits) {
    const key = `${h.by.ref} ${h.target.group.ref}`;
    let t = tally.get(key);
    if (!t) {
      t = { by: h.by, target: h.target.group, hits: 0, kills: 0 };
      tally.set(key, t);
    }
    if (h.amount === null) continue;
    t.hits += 1;
    if (!h.target.alive) continue;
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
      });
    }
  }
  for (const t of tally.values()) {
    log.push({ kind, squad: t.by.ref, target: t.target.ref, hits: t.hits, kills: t.kills });
  }
}

/** Can still shoot: a ranged weapon with ammunition left. */
function armed(g: Group): boolean {
  return g.base.weapons.some((w, i) => w.range !== undefined && (g.ammo[i] ?? 0) > 0);
}

/**
 * Who fights hand to hand this phase, fixed when the phase begins. A group in its side's front
 * closes on the enemy front from its closing round, unless it can still shoot: archers hold
 * back and keep firing. A group the enemy has closed on is in contact and fights back.
 */
function engaged(field: Field, round: number): Set<Group> {
  const fronts = { attacker: frontRow(field, 'attacker'), defender: frontRow(field, 'defender') };
  const closing = new Set<Group>();
  for (const side of SIDES) {
    if (fronts[OTHER[side]] === null) continue;
    for (const g of field.sides[side]) {
      if (active(g) && g.row === fronts[side] && !armed(g) && round >= closingRound(g.base)) {
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
  const hits: Hit[] = [];
  const contact = engaged(field, round);
  for (const side of SIDES) {
    const enemy = OTHER[side];
    const row = frontRow(field, enemy);
    if (row === null) continue;
    const depth = ROWS.indexOf(row);
    const targets = targetsUpTo(field, enemy, row);
    for (const g of field.sides[side]) {
      if (!active(g) || contact.has(g)) continue;
      g.base.weapons.forEach((w, i) => {
        const range = w.range;
        if (range === undefined || (g.ammo[i] ?? 0) <= 0) return;
        if (depth > (range >= BATTLE.rearReach ? 2 : 1)) return;
        g.ammo[i] = (g.ammo[i] ?? 0) - 1;
        const prec = groupStat(g, 'prec');
        for (const m of g.members) {
          if (!m.alive) continue;
          const target = targets[randBelow(rng, targets.length)];
          if (!target) continue;
          const hit = prec + drn(rng) >= BATTLE.ranged.toHit + drn(rng);
          const amount = hit
            ? weaponDamage(rng, statOf(m, 'str'), w, statOf(target, 'prot'), 0)
            : null;
          hits.push({ by: g, weapon: w, target, amount });
        }
      });
    }
  }
  land(hits, 'volley', log);
}

/** Units with no melee weapon strike once, unarmed. */
const UNARMED: WeaponDef = { name: 'Unarmed', dmg: 0 };

export function meleePhase(field: Field, round: number, rng: RngState, log: BattleEvent[]): void {
  const hits: Hit[] = [];
  const contact = engaged(field, round);
  for (const side of SIDES) {
    const enemy = OTHER[side];
    const row = frontRow(field, enemy);
    if (row === null) continue;
    const targets = targetsUpTo(field, enemy, row);
    for (const g of field.sides[side]) {
      if (!contact.has(g)) continue;
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
          hits.push({ by: g, weapon: w, target, amount });
        }
      }
    }
  }
  land(hits, 'melee', log);
}
