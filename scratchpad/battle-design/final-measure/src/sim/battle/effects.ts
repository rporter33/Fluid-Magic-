// Battle effect primitives (docs/02-magic.md section 5): what each one does once its targets
// are chosen. Effects land at once, in cast order.
import { unitDef } from '../../content';
import { FIELD_EFFECTS } from '../../content/rules';
import type { BattleEffect, BattleSpellDef, Duration } from '../../content/spells/types';
import { defaultFormation } from '../commanders';
import type { RngState } from '../rng';
import { rollDamage } from './attacks';
import type { BattleEvent, StatKey } from './events';
import {
  group,
  present,
  SIDES,
  statOf,
  type Field,
  type Fighter,
  type Group,
  type StatMod,
} from './field';
import { debuffSources } from './targets';

/** What one effect of a cast lands on. */
export interface Plan {
  effect: BattleEffect;
  groups: Group[];
  /** Troops hit, for damage. */
  troops: Fighter[];
}

/** Last round a change lasts, or null for the whole battle. */
export function untilRound(duration: { kind: 'rounds'; rounds: number }, round: number): number;
export function untilRound(duration: Duration, round: number): number | null;
export function untilRound(duration: Duration, round: number): number | null {
  return duration.kind === 'battle' ? null : round + duration.rounds - 1;
}

/**
 * Takes away a group's changes that pass the test; logs one 'expire' per source of logged
 * changes, in the order they were made (a field effect's end is its 'fieldEnd').
 */
export function dropMods(g: Group, test: (m: StatMod) => boolean, log: BattleEvent[]): void {
  const dropped = g.mods.filter(test);
  if (dropped.length === 0) return;
  g.mods = g.mods.filter((m) => !dropped.includes(m));
  for (const source of new Set(dropped.filter((m) => m.logged).map((m) => m.source))) {
    log.push({ kind: 'expire', target: g.ref, source });
  }
}

/** Takes away every change a source made on a group; one 'expire' if a 'buff' announced them. */
export function removeSource(g: Group, source: string, log: BattleEvent[]): void {
  dropMods(g, (m) => m.source === source, log);
}

/** Adds a change and logs it; with no log (a field effect's change) its end goes unlogged too. */
function addMod(
  g: Group,
  stat: StatKey,
  delta: number,
  source: string,
  until: number | null,
  debuff: boolean,
  log: BattleEvent[] | null,
): void {
  g.mods.push({ stat, delta, source, untilRound: until, debuff, logged: log !== null });
  log?.push({ kind: 'buff', target: g.ref, stat, delta, source, untilRound: until, debuff });
}

function damage(
  troops: Fighter[],
  e: Extract<BattleEffect, { kind: 'damage' }>,
  rng: RngState,
  log: BattleEvent[],
): void {
  const tally = new Map<Group, { amount: number; kills: number }>();
  for (const t of troops) {
    const amount = rollDamage(
      rng,
      e.amount,
      statOf(t, 'prot'),
      e.armorPiercing === true,
      e.armorNegating === true,
    );
    let entry = tally.get(t.group);
    if (!entry) {
      entry = { amount: 0, kills: 0 };
      tally.set(t.group, entry);
    }
    if (!t.alive || amount <= 0) continue;
    entry.amount += Math.min(amount, t.hp);
    t.hp -= amount;
    if (t.hp <= 0) {
      t.hp = 0;
      t.alive = false;
      t.group.deathsThisRound += 1;
      entry.kills += 1;
    }
  }
  for (const [g, { amount, kills }] of tally) {
    log.push({ kind: 'damage', target: g.ref, amount, element: e.element, kills });
  }
}

function heal(g: Group, amount: number, removeDebuffs: number, log: BattleEvent[]): void {
  let healed = 0;
  for (const m of g.members) {
    if (!m.alive) continue;
    const gain = Math.min(m.maxHp - m.hp, amount);
    m.hp += gain;
    healed += gain;
  }
  if (healed > 0) log.push({ kind: 'heal', target: g.ref, amount: healed });
  for (const source of debuffSources(g).slice(0, removeDebuffs)) {
    dropMods(g, (m) => m.debuff && m.source === source, log);
  }
}

function summon(
  field: Field,
  caster: Group,
  e: Extract<BattleEffect, { kind: 'summon' }>,
  log: BattleEvent[],
): void {
  const stats = field.summons[caster.side][e.unit];
  if (!stats) throw new Error(`the battle setup has no stats for summoned ${e.unit}`);
  const ref = `su${String(field.nextSummon++)}`;
  const row = defaultFormation(unitDef(e.unit));
  const g = group(caster.side, ref, caster.ref, stats, row, e.count, e.count * stats.hp, null);
  g.summoned = true;
  field.sides[caster.side].push(g);
  log.push({
    kind: 'summon',
    side: caster.side,
    unit: e.unit,
    count: e.count,
    hp: e.count * stats.hp,
    squad: ref,
    row,
    commander: caster.ref,
  });
}

function fieldEffect(
  field: Field,
  caster: Group,
  spell: BattleSpellDef,
  e: Extract<BattleEffect, { kind: 'fieldEffect' }>,
  round: number,
  log: BattleEvent[],
): void {
  const until = untilRound({ kind: 'rounds', rounds: e.rounds }, round);
  field.effects.push({ kind: e.effect, untilRound: until });
  log.push({ kind: 'field', effect: e.effect, caster: caster.ref, untilRound: until });
  // Its stat changes fall on everyone on the field now; later summons arrive unaffected. The
  // 'field' and 'fieldEnd' events report them, so they log nothing of their own.
  const rules = FIELD_EFFECTS[e.effect];
  for (const side of SIDES) {
    for (const g of field.sides[side]) {
      if (!present(g)) continue;
      if (rules.att !== 0) addMod(g, 'att', rules.att, spell.id, until, false, null);
      if (rules.prec !== 0) addMod(g, 'prec', rules.prec, spell.id, until, false, null);
    }
  }
}

/** Lands one planned effect. */
export function applyEffect(
  field: Field,
  caster: Group,
  spell: BattleSpellDef,
  plan: Plan,
  round: number,
  rng: RngState,
  log: BattleEvent[],
): void {
  const e = plan.effect;
  switch (e.kind) {
    case 'damage':
      damage(plan.troops, e, rng, log);
      return;
    case 'buff':
    case 'debuff':
      for (const g of plan.groups) {
        addMod(
          g,
          e.stat,
          e.delta,
          spell.id,
          untilRound(e.duration, round),
          e.kind === 'debuff',
          log,
        );
      }
      return;
    case 'summon':
      summon(field, caster, e, log);
      return;
    case 'heal':
      for (const g of plan.groups) heal(g, e.amount, e.removeDebuffs ?? 0, log);
      return;
    case 'fatigueDrain':
      for (const g of plan.groups) {
        g.fatigue += e.amount;
        log.push({ kind: 'fatigue', unit: g.ref, amount: e.amount });
      }
      return;
    case 'moraleShock':
      for (const g of plan.groups) g.shock += Math.abs(e.amount);
      return;
    case 'fieldEffect':
      fieldEffect(field, caster, spell, e, round, log);
      return;
  }
}
