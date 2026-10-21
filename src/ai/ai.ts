// The AI (docs/08-ai.md; Phase 7 design "Contract and entry point", "Step order per call"):
// each call plans for one nation on a planning copy of the state, one step after another in a
// fixed order, every step issuing commands through the copy, and returns what was issued.
import type { Command } from '../sim/commands';
import type { NationId } from '../sim/ids';
import { getNation } from '../sim/state';
import type { GameState } from '../sim/types';
import { planEconomy, planResearch } from './economy';
import { planPretender, planPriests } from './faith';
import { planRituals } from './magic';
import { planArmies } from './military';
import { createPlan } from './plan';
import { planRecruitment } from './recruit';

/**
 * The AI player: reads the state, never changes it or draws from state.rng, and returns the
 * commands to apply in order. Nothing for a nation out of the game or a game that has ended.
 */
export function runAi(state: GameState, nation: NationId): Command[] {
  if (state.result || getNation(state, nation).eliminated) return [];
  const plan = createPlan(state, nation);
  planEconomy(plan);
  planRecruitment(plan);
  planResearch(plan);
  planPriests(plan);
  planArmies(plan);
  planRituals(plan);
  planPretender(plan);
  return plan.out;
}
