// Who does what for the AI (docs/08-ai.md; Phase 7 design "Roles", "Research"): every count and
// every step's selection goes through one role per commander, derived from content (recruit
// requirements, pips, holy, tags, cost, map speed, the research flag), never from unit ids.
import { unitDef } from '../content';
import { AI } from '../content/ai';
import type { UnitDef } from '../content/types';
import { isGarrisonHolder } from '../sim/commanders';
import { hasPips } from '../sim/pips';
import { chassisOf } from '../sim/pretender';
import { isPretender } from '../sim/selectors';
import type { CommanderState, GameState } from '../sim/types';
import { nationDefOf } from '../sim/state';
import type { Plan } from './plan';

export type Role =
  /** The nation's pretender; what it does comes from its body (pretenderRole). */
  | 'pretender'
  /** A fort's garrison holder: keeps troops, never acts. */
  | 'garrison'
  /** A commander nobody recruits (a summon): rides with armies, never leads, studies, or prays. */
  | 'summoned'
  /** A recruitable commander needing a temple: preaches and claims Wellsprings. */
  | 'priest'
  /** A recruitable commander needing a lab: researches and casts rituals, or rides to battle. */
  | 'mage'
  /** A recruitable stealthy commander: scouts and builds. */
  | 'scout'
  /** A recruitable commander without pips or holy, leading at least AI.leaderLeadership. */
  | 'leader'
  /** An independent's commander, or a recruitable commander that fits no role. */
  | 'other';

/**
 * What the pretender does (docs/08-ai.md step 10), from its chassis's role (docs/05 Step 1, D8)
 * and, within a role, its body.
 */
export type PretenderRole =
  /** A mage that may research (the Oracle): it studies in the capital lab. */
  | 'researcher'
  /** An idol (the Living Monolith, Cinder Idol, World Tree): it casts rituals in the capital. */
  | 'ritualist'
  /** A stealthy raider (the Wild Spirit): hidden, it would add nothing to a battle; it stays home. */
  | 'hidden'
  /**
   * A leader, fighter, monster or summoner, a raider that can be seen, or a mage that does not
   * research (the Ember Hierophant): it stays home until AI.pretenderJoinDay, then rides with
   * an army.
   */
  | 'rider';

/** The role a unit gives a nation's commander, from content alone; null for a troop. */
export function unitRole(def: UnitDef): Role | null {
  const traits = def.commander;
  if (!traits) return null;
  if (traits.garrison === true) return 'garrison';
  if (def.cost === null) return 'summoned';
  if (def.requires.includes('temple')) return 'priest';
  if (def.requires.includes('lab')) return 'mage';
  if (def.tags.includes('stealthy')) return 'scout';
  if (!hasPips(traits.pips, traits.holy) && traits.leadership >= AI.leaderLeadership) {
    return 'leader';
  }
  return 'other';
}

/** A commander's role: the pretender and the garrison holder first, else its unit's role. */
export function roleOf(state: GameState, commander: CommanderState): Role {
  if (commander.owner === null) return 'other';
  if (isPretender(state, commander)) return 'pretender';
  if (isGarrisonHolder(commander)) return 'garrison';
  return unitRole(unitDef(commander.unit)) ?? 'other';
}

/** The adept tier of mages: those that can be recruited only in the capital. */
export function isAdeptTier(def: UnitDef): boolean {
  return unitRole(def) === 'mage' && def.requires.includes('capital');
}

/**
 * What a nation's pretender does, read from its chassis's role tag (docs/08 step 10): idols cast
 * rituals; mages research if their body may, else ride; raiders ride unless their body is
 * stealthy; leaders, fighters, monsters and summoners ride. Content validation keeps every idol
 * immobile and every immobile body an idol.
 */
export function pretenderRole(state: GameState, pretender: CommanderState): PretenderRole {
  const chassis = pretender.owner === null ? null : chassisOf(state, pretender.owner);
  const def = unitDef(pretender.unit);
  switch (chassis?.role) {
    case 'idol':
      return 'ritualist';
    case 'mage':
      return def.commander?.research !== false ? 'researcher' : 'rider';
    case 'raider':
      return def.tags.includes('stealthy') ? 'hidden' : 'rider';
    default:
      return 'rider';
  }
}

/** The nation's mages, split into researchers and battle mages. */
export interface MageSplit {
  /** The oldest ceil(mages * research personality): they study in the capital lab. */
  readonly researchers: readonly CommanderState[];
  /** The rest: they ride with armies. */
  readonly battleMages: readonly CommanderState[];
}

/**
 * Splits the planning nation's mages by its research personality, oldest first (state order is
 * the order commanders were made in), from the plan's roles.
 */
export function splitMages(plan: Plan): MageSplit {
  const mages = plan.withRole('mage');
  const count = Math.ceil(mages.length * nationDefOf(plan.copy, plan.nation).ai.research);
  return { researchers: mages.slice(0, count), battleMages: mages.slice(count) };
}
