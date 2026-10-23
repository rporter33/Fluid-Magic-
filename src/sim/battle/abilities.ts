// Battle-start abilities (pretender build spec N1; docs/04-battle.md decisions). In round 1,
// inside the scripts step and before any script, every active commander fires its body's
// abilities, in caster order and then in list order. An ability fires only when every effect has
// a target, as a spell is cast only then; it plans its targets as a spell does and lands its
// effects at once, with no fatigue, carried mana, research or spell power. It fires once, so it
// never replaces earlier changes of its own.
import { abilitySource } from '../../content/abilities';
import type { RngState } from '../rng';
import { applyEffect } from './effects';
import type { BattleEvent } from './events';
import { active, interleaved, type Field } from './field';
import { hasTargets, plan, plannedRefs } from './spells';

export function abilityPhase(field: Field, round: number, rng: RngState, log: BattleEvent[]): void {
  for (const c of interleaved(field)) {
    if (!active(c)) continue;
    for (const ability of c.abilities) {
      const source = abilitySource(ability);
      if (!hasTargets(field, c, source)) continue;
      const plans = plan(field, c, source, rng);
      log.push({ kind: 'ability', unit: c.ref, ability: ability.id, targets: plannedRefs(plans) });
      for (const p of plans) applyEffect(field, c, source, p, round, rng, log, 0);
    }
  }
}
