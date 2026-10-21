// Landing a ranged or melee phase's attacks (docs/04-battle.md, round steps 2 and 3): damage
// and kills in roll order, the attack tallies of the log, then life drain and fire-shield
// burns once every blow has landed. Nothing here draws from the rng; with a detail sink set,
// every attack, drain, and burn is also reported there.
import type { WeaponDef } from '../../content/types';
import type { DamageRoll, DetailEvent, Landing } from './detail';
import type { AttackTally, BattleEvent, BattleUnitRef } from './events';
import { detailAt, raging, type Field, type Fighter, type Group } from './field';

type Strike = Extract<DetailEvent, { kind: 'strike' }>;

/** One attack, rolled against the field as the phase began. A miss has no damage roll. */
export interface Hit {
  by: Group;
  /** The troop that struck, which life drain heals and fire shields burn. */
  from: Fighter;
  weapon: WeaponDef;
  target: Fighter;
  roll: DamageRoll | null;
  /** Only with a detail sink: the strike as rolled; land() adds where and how it landed. */
  strike: Strike | null;
}

/**
 * The strike a detail sink receives for an attack, built from rolls already made. weapon is the
 * slot in the striker's weapons, -1 for an unarmed blow.
 */
export function strikeOf(
  field: Field,
  by: Group,
  from: Fighter,
  slot: number,
  target: Fighter,
  rolls: { attack: number; attackDrn: number; defense: number; defenseDrn: number },
  damage: DamageRoll | null,
  firstRound: boolean,
): Strike {
  return {
    kind: 'strike',
    at: 0,
    round: field.round,
    phase: field.phase,
    attacker: by.ref,
    attackerMember: from.index,
    weapon: slot,
    target: target.group.ref,
    targetMember: target.index,
    ...rolls,
    hit: damage !== null,
    // Rage adds to melee blows only.
    berserk: field.phase === 'melee' && raging(from),
    firstRound,
    damage,
    landing: null,
  };
}

/** Fire owed by shielded targets to one striker or one group, by the shield's group. */
interface Owed {
  amount: number;
  shields: Map<Group, number>;
  /** The first shield that contributed: ties go to it. */
  first: Group;
}

function owe(o: Owed, shield: Group, amount: number): void {
  o.amount += amount;
  o.shields.set(shield, (o.shields.get(shield) ?? 0) + amount);
}

/** The shield that contributed most; ties go to the earliest. */
function mainShield(o: Owed): BattleUnitRef {
  let best = o.first;
  let most = o.shields.get(best) ?? 0;
  for (const [g, amount] of o.shields) {
    if (amount > most) {
      best = g;
      most = amount;
    }
  }
  return best.ref;
}

/** Reports a landed attack to the detail sink: after the stored events logged so far. */
function report(field: Field, log: BattleEvent[], s: Strike, landing: Landing | null): void {
  s.at = log.length;
  s.landing = landing;
  field.detail?.push(s);
}

/**
 * Life drain owed for the phase's damaging hits, paid only once every hit has landed, to
 * strikers still alive, so neither side gains by rolling first.
 */
function drainLife(field: Field, hits: Hit[], log: BattleEvent[]): void {
  const owed = new Map<Fighter, number>();
  for (const h of hits) {
    const drain = h.by.base.lifeDrain;
    if (drain > 0 && h.roll !== null && h.roll.rolled > 0) {
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
    field.detail?.push({
      kind: 'drain',
      ...detailAt(field, log),
      unit: f.group.ref,
      member: f.index,
      gained: gain,
    });
  }
  for (const [g, amount] of healed) log.push({ kind: 'heal', target: g.ref, amount });
}

/**
 * Fire shields burn every melee striker that hit them, once all of the phase's hits have
 * landed: fire damage per hit, no armor. The log names the shield that burned a group most.
 */
function burnStrikers(field: Field, hits: Hit[], log: BattleEvent[]): void {
  const owed = new Map<Fighter, Owed>();
  for (const h of hits) {
    const shield = h.target.group;
    const amount = shield.base.fireShield;
    if (amount > 0 && h.roll !== null && h.roll.rolled > 0) {
      let o = owed.get(h.from);
      if (!o) {
        o = { amount: 0, shields: new Map(), first: shield };
        owed.set(h.from, o);
      }
      owe(o, shield, amount);
    }
  }
  const tally = new Map<Group, Owed & { dealt: number; kills: number }>();
  for (const [f, o] of owed) {
    if (!f.alive) continue;
    let t = tally.get(f.group);
    if (!t) {
      t = { amount: 0, shields: new Map(), first: o.first, dealt: 0, kills: 0 };
      tally.set(f.group, t);
    }
    for (const [shield, amount] of o.shields) owe(t, shield, amount);
    const hpBefore = f.hp;
    t.dealt += Math.min(o.amount, f.hp);
    f.hp -= o.amount;
    const killed = f.hp <= 0;
    if (killed) {
      f.hp = 0;
      f.alive = false;
      f.group.deathsThisRound += 1;
      t.kills += 1;
    }
    field.detail?.push({
      kind: 'burn',
      ...detailAt(field, log),
      unit: f.group.ref,
      member: f.index,
      shield: mainShield(o),
      owed: o.amount,
      landing: { hpBefore, dealt: Math.min(o.amount, hpBefore), killed },
    });
  }
  for (const [g, t] of tally) {
    log.push({
      kind: 'damage',
      target: g.ref,
      amount: t.dealt,
      element: 'fire',
      kills: t.kills,
      by: mainShield(t),
    });
  }
}

/**
 * Lands the phase's hits in roll order and logs one tally per attacking and target group
 * (docs/04 decisions, "Attack tallies"), then pays life drain and, in melee, fire shields.
 */
export function land(
  field: Field,
  hits: Hit[],
  kind: 'volley' | 'melee',
  log: BattleEvent[],
): void {
  const tally = new Map<string, AttackTally>();
  for (const h of hits) {
    const target = h.target;
    const key = `${h.by.ref} ${target.group.ref}`;
    let t = tally.get(key);
    if (!t) {
      t = {
        squad: h.by.ref,
        target: target.group.ref,
        attacks: 0,
        hits: 0,
        blocked: 0,
        onFallen: 0,
        kills: 0,
        dmg: 0,
      };
      tally.set(key, t);
    }
    t.attacks += 1;
    const roll = h.roll;
    if (roll === null) {
      if (h.strike) report(field, log, h.strike, null);
      continue;
    }
    t.hits += 1;
    if (!target.alive) {
      t.onFallen += 1;
      if (h.strike) report(field, log, h.strike, { hpBefore: 0, dealt: 0, killed: false });
      continue;
    }
    const hpBefore = target.hp;
    const dealt = Math.min(roll.rolled, hpBefore);
    if (roll.rolled === 0) t.blocked += 1;
    t.dmg += dealt;
    target.hp -= roll.rolled;
    const killed = target.hp <= 0;
    if (killed) {
      target.alive = false;
      target.hp = 0;
      target.group.deathsThisRound += 1;
      t.kills += 1;
    }
    // The strike comes before the commander damage it caused.
    if (h.strike) report(field, log, h.strike, { hpBefore, dealt, killed });
    if (target.group.isCommander && roll.rolled > 0) {
      log.push({
        kind: 'damage',
        target: target.group.ref,
        amount: roll.rolled,
        element: h.weapon.element ?? 'physical',
        kills: killed ? 1 : 0,
        by: h.by.ref,
      });
    }
  }
  for (const t of tally.values()) log.push({ kind, ...t });
  drainLife(field, hits, log);
  if (kind === 'melee') burnStrikers(field, hits, log);
}
