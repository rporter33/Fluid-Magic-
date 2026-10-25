// Battle spellcasting, round step 1 (docs/04-battle.md; docs/02-magic.md section 3): which spell
// a commander casts, what it costs, and the cast itself. Casts land one after another, so a
// later caster sees the field after earlier casts.
import { CASTING } from '../../content/rules';
import type { BattleEffect, BattleSpellDef, EffectSource } from '../../content/spells/types';
import { colorPips, extraPips } from '../pips';
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

/**
 * The groups an effect of a spell or ability would land on; no rng is drawn here. Only the
 * source's id is read: a group already carrying a change from it is not chosen again.
 */
function effectGroups(field: Field, caster: Group, source: EffectSource, e: BattleEffect): Group[] {
  const enemy = OTHER[caster.side];
  const lacks = (g: Group) => present(g) && !hasSource(g, source.id);
  const one = (g: Group | null) => (g ? [g] : []);
  // An all-groups target takes every group, or none when no group needs the effect.
  const allIf = (all: Group[], needs: (g: Group) => boolean) => (all.some(needs) ? all : []);
  const friends = (kind: string) => {
    const all = presentGroups(field, caster.side);
    return kind === 'allFriendlySquads' ? all.filter((g) => !g.isCommander) : all;
  };
  switch (e.kind) {
    case 'damage':
      return one(enemyTarget(field, caster));
    case 'buff':
      if (e.targets.kind === 'self') return hasSource(caster, source.id) ? [] : [caster];
      if (e.targets.kind === 'friendlySquad') {
        return one(friendlySquad(field, caster, (g) => !hasSource(g, source.id)));
      }
      return allIf(friends(e.targets.kind), lacks);
    case 'debuff':
      if (e.targets.kind === 'allEnemy') return allIf(presentGroups(field, enemy), lacks);
      return one(largestGroup(field, enemy, lacks));
    case 'heal': {
      const needs = (g: Group) => needsHeal(g, e);
      if (e.targets.kind === 'self') return needs(caster) ? [caster] : [];
      if (e.targets.kind === 'friendlySquad') return one(friendlySquad(field, caster, needs));
      return allIf(friends(e.targets.kind), needs);
    }
    case 'fatigueDrain': {
      const casters = presentGroups(field, enemy).filter(isCaster);
      if (e.targets.kind === 'allEnemy') return casters;
      let best: Group | null = null;
      for (const g of casters) if (!best || colorPips(g.pips) > colorPips(best.pips)) best = g;
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

/**
 * Every effect has something to land on (summons always do; a field effect once at a time). A
 * spell is cast and an ability fires only then.
 */
export function hasTargets(field: Field, caster: Group, source: EffectSource): boolean {
  return source.effects.every((e) => {
    if (e.kind === 'summon') return true;
    if (e.kind === 'fieldEffect') return !fieldHas(field, (f) => f.kind === e.effect);
    return effectGroups(field, caster, source, e).length > 0;
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

/**
 * Chooses every effect's targets once per cast or ability: area effects share one draw of
 * troops, and other effects share the targets of an earlier effect of the same kind and target
 * kind.
 */
export function plan(field: Field, caster: Group, source: EffectSource, rng: RngState): Plan[] {
  const chosen = new Map<string, Plan>();
  return source.effects.map((effect, index) => {
    const targets = 'targets' in effect ? effect.targets.kind : '';
    const key = targets === 'area' ? 'area' : `${effect.kind}:${targets}`;
    const earlier = chosen.get(key);
    if (earlier) return { ...earlier, effect, index };
    const groups = effectGroups(field, caster, source, effect);
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
    // An area effect lands on every group its troops belong to.
    const landed = targets === 'area' ? [...new Set(troops.map((t) => t.group))] : groups;
    const result: Plan = { effect, index, groups: landed, troops };
    chosen.set(key, result);
    return result;
  });
}

/** The groups a cast or ability names: every planned group and every planned troop's group. */
export function plannedRefs(plans: readonly Plan[]): string[] {
  const targets = new Set<string>();
  for (const p of plans) {
    for (const g of p.groups) targets.add(g.ref);
    for (const t of p.troops) targets.add(t.group.ref);
  }
  return [...targets];
}

/**
 * Casts a spell: fatigue and carried mana are paid, targets chosen, then each effect lands with
 * the caster's spell power (N3). The cast is logged with the caster's fatigue after paying.
 */
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
  log.push({
    kind: 'cast',
    caster: caster.ref,
    spellId: spell.id,
    targets: plannedRefs(plans),
    fatigue: caster.fatigue,
  });
  // A recast replaces the spell's earlier changes on its targets; it never stacks.
  const changed = new Set<Group>();
  for (const p of plans) {
    if (p.effect.kind === 'buff' || p.effect.kind === 'debuff')
      for (const g of p.groups) changed.add(g);
  }
  for (const g of changed) removeSource(g, spell.id, log);
  const power = caster.base.spellPower;
  for (const p of plans) applyEffect(field, caster, spell, p, round, rng, log, power);
}
