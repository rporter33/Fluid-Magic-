// Battle spellcasting, round step 1 (docs/04-battle.md; docs/02-magic.md section 3): which spell
// a commander casts, what it costs, and the cast itself. Casts land one after another, so a
// later caster sees the field after earlier casts.
import { CASTING } from '../../content/rules';
import type { BattleEffect, BattleSpellDef } from '../../content/spells/types';
import { extraPips } from '../pips';
import type { RngState } from '../rng';
import { applyEffect, removeSource, type Plan } from './effects';
import type { BattleEvent } from './events';
import { active, fieldHas, living, OTHER, present, type Field, type Group } from './field';
import { neverChecks } from './morale';
import {
  canBeShaken,
  debuffSources,
  enemyTarget,
  friendlySquad,
  hasSource,
  isCaster,
  isDamageSpell,
  largestGroup,
  oneTroop,
  pipCount,
  presentGroups,
  troopsInRow,
  wounded,
} from './targets';

/** Fatigue a cast adds: less for extra pips, never under a share of the listed fatigue. */
export function fatigueCost(caster: Group, spell: BattleSpellDef): number {
  const extra = extraPips(caster.pips, caster.holy, spell);
  return Math.max(
    spell.fatigue * CASTING.minFatigueShare,
    spell.fatigue - CASTING.fatiguePerExtraPip * extra,
  );
}

function hasMana(caster: Group, spell: BattleSpellDef): boolean {
  return Object.entries(spell.carriedMana).every(
    ([color, need]) => (caster.carriedMana[color as keyof Group['carriedMana']] ?? 0) >= need,
  );
}

function needsHeal(g: Group, e: Extract<BattleEffect, { kind: 'heal' }>): boolean {
  return wounded(g) || ((e.removeDebuffs ?? 0) > 0 && debuffSources(g).length > 0);
}

/** The groups an effect would land on; no rng is drawn here. */
function effectGroups(
  field: Field,
  caster: Group,
  spell: BattleSpellDef,
  e: BattleEffect,
): Group[] {
  const enemy = OTHER[caster.side];
  const lacks = (g: Group) => present(g) && !hasSource(g, spell.id);
  const one = (g: Group | null) => (g ? [g] : []);
  switch (e.kind) {
    case 'damage':
      return one(enemyTarget(field, caster));
    case 'buff':
      if (e.targets.kind === 'self') return hasSource(caster, spell.id) ? [] : [caster];
      if (e.targets.kind === 'friendlySquad') {
        return one(friendlySquad(field, caster, (g) => !hasSource(g, spell.id)));
      }
      return presentGroups(field, caster.side).some(lacks) ? presentGroups(field, caster.side) : [];
    case 'debuff':
      if (e.targets.kind === 'allEnemy') {
        return presentGroups(field, enemy).some(lacks) ? presentGroups(field, enemy) : [];
      }
      return one(largestGroup(field, enemy, lacks));
    case 'heal': {
      const needs = (g: Group) => needsHeal(g, e);
      if (e.targets.kind === 'self') return needs(caster) ? [caster] : [];
      if (e.targets.kind === 'friendlySquad') return one(friendlySquad(field, caster, needs));
      const all = presentGroups(field, caster.side);
      return all.some(needs) ? all : [];
    }
    case 'fatigueDrain': {
      const casters = presentGroups(field, enemy).filter(isCaster);
      if (e.targets.kind === 'allEnemy') return casters;
      let best: Group | null = null;
      for (const g of casters) if (!best || pipCount(g) > pipCount(best)) best = g;
      return one(best);
    }
    case 'moraleShock': {
      const shaken = (g: Group) => canBeShaken(g, neverChecks);
      if (e.targets.kind === 'allEnemy') return presentGroups(field, enemy).filter(shaken);
      return one(largestGroup(field, enemy, shaken));
    }
    case 'summon':
    case 'fieldEffect':
      return [];
  }
}

/** Every effect has something to land on (summons always do; a field effect once at a time). */
function hasTargets(field: Field, caster: Group, spell: BattleSpellDef): boolean {
  return spell.effects.every((e) => {
    if (e.kind === 'summon') return true;
    if (e.kind === 'fieldEffect') return !fieldHas(field, (f) => f.kind === e.effect);
    return effectGroups(field, caster, spell, e).length > 0;
  });
}

/** It can cast the spell now: mana carried and a target for every effect. */
export function castable(field: Field, caster: Group, spell: BattleSpellDef): boolean {
  return hasMana(caster, spell) && hasTargets(field, caster, spell);
}

function activeTroops(field: Field, side: Group['side']): number {
  let n = 0;
  for (const g of field.sides[side]) if (!g.isCommander && active(g)) n += living(g);
  return n;
}

/**
 * The named spell if it can be cast, else the best castable one: against at least
 * CASTING.damageWhenEnemiesAtLeast active enemy troops damage spells first, otherwise the rest
 * first; then the highest level; then content order.
 */
export function chooseSpell(
  field: Field,
  caster: Group,
  named: string | null,
): BattleSpellDef | null {
  if (named !== null) {
    const spell = caster.spells.find((s) => s.id === named);
    if (spell && castable(field, caster, spell)) return spell;
  }
  const damageFirst = activeTroops(field, OTHER[caster.side]) >= CASTING.damageWhenEnemiesAtLeast;
  const rank = (s: BattleSpellDef) => (isDamageSpell(s) === damageFirst ? 0 : 1);
  const ranked = caster.spells
    .map((spell, i) => ({ spell, i }))
    .sort((a, b) => rank(a.spell) - rank(b.spell) || b.spell.level - a.spell.level || a.i - b.i);
  return ranked.find(({ spell }) => castable(field, caster, spell))?.spell ?? null;
}

/** Chooses every effect's targets, one choice per target kind, so effects share them. */
function plan(field: Field, caster: Group, spell: BattleSpellDef, rng: RngState): Plan[] {
  const chosen = new Map<string, Plan>();
  return spell.effects.map((effect) => {
    const key = `${effect.kind}:${'targets' in effect ? effect.targets.kind : ''}`;
    const earlier = chosen.get(key);
    if (earlier) return { ...earlier, effect };
    const groups = effectGroups(field, caster, spell, effect);
    let troops: Plan['troops'] = [];
    if (effect.kind === 'damage' || (effect.kind === 'debuff' && effect.targets.kind === 'area')) {
      const target = groups[0];
      if (target) {
        if (effect.targets.kind === 'area') {
          troops = troopsInRow(field, target.side, target.row, effect.targets.count, rng);
        } else if (effect.targets.kind === 'single') {
          troops = oneTroop(target, rng);
        } else {
          troops = target.members.filter((m) => m.alive);
        }
      }
    }
    // An area curse lands on every group it touches.
    const landed =
      effect.kind === 'debuff' && effect.targets.kind === 'area'
        ? [...new Set(troops.map((t) => t.group))]
        : groups;
    const result: Plan = { effect, groups: landed, troops };
    chosen.set(key, result);
    return result;
  });
}

/** Casts a spell: fatigue and carried mana are paid, targets chosen, then each effect lands. */
export function cast(
  field: Field,
  caster: Group,
  spell: BattleSpellDef,
  round: number,
  rng: RngState,
  log: BattleEvent[],
): void {
  caster.fatigue += fatigueCost(caster, spell);
  for (const [color, need] of Object.entries(spell.carriedMana)) {
    const key = color as keyof Group['carriedMana'];
    caster.carriedMana[key] = (caster.carriedMana[key] ?? 0) - need;
  }
  const plans = plan(field, caster, spell, rng);
  const targets = new Set<string>();
  for (const p of plans) {
    for (const g of p.groups) targets.add(g.ref);
    for (const t of p.troops) targets.add(t.group.ref);
  }
  log.push({ kind: 'cast', caster: caster.ref, spellId: spell.id, targets: [...targets] });
  // A recast replaces the spell's earlier changes on its targets; it never stacks.
  const changed = new Set<Group>();
  for (const p of plans) {
    if (p.effect.kind === 'buff' || p.effect.kind === 'debuff')
      for (const g of p.groups) changed.add(g);
  }
  for (const g of changed) removeSource(g, spell.id, log);
  for (const p of plans) applyEffect(field, caster, spell, p, round, rng, log);
}
