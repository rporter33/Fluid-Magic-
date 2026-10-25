// advance(state): one day (docs/06-architecture.md, "Simulation contract"). Steps run in the
// documented order; steps owned by later phases are marked where they will slot in.
import { progressConstruction } from './buildings';
import { accrueGoldAndMana, accrueMaterials } from './economy';
import { resolveArrivals } from './conflict';
import { advanceTransits, continueMoves } from './movement';
import { applyPillage } from './pillage';
import { growPopulation } from './population';
import { spreadDominion, updateGodless } from './dominion';
import { monthlySummons, settlePretender } from './pretender';
import { progressRecruitment } from './recruitment';
import { progressResearch } from './research';
import { progressRituals } from './rituals';
import { progressSieges } from './siege';
import { allProvinceEconomies } from './selectors';
import { applySupply } from './supply';
import { TIME } from '../content/rules';
import type { NationId } from './ids';
import type { GameState } from './types';
import { updateUnrest } from './unrest';
import { settleVictory } from './victory';
import { updateExplored, updateSightings } from './visibility';
import { progressClaims } from './wellsprings';

export function advance(state: GameState): void {
  if (state.result) return;

  // 1. Commands were applied by the caller before this call.
  // 2. Movement: walk; battles, sieges, and captures at arrivals; sieges and storms; march on.
  resolveArrivals(state, advanceTransits(state));
  progressSieges(state);
  continueMoves(state);

  // 3. Queues: recruitment, construction, rituals, research, Wellspring claims; the pretender
  // arrives, returns, reforms, or is recalled; on a month's first day, monthly summons (N7).
  progressRecruitment(state);
  progressConstruction(state);
  progressRituals(state);
  progressResearch(state);
  progressClaims(state);
  for (const id of Object.keys(state.nations) as NationId[]) settlePretender(state, id);
  monthlySummons(state);

  // 4. Economy, pillage, population, unrest, supply. Rates come from one snapshot of the day.
  const economies = allProvinceEconomies(state);
  accrueGoldAndMana(state, economies);
  accrueMaterials(state, economies);
  applyPillage(state, economies);
  growPopulation(state, economies);
  updateUnrest(state, economies);
  applySupply(state, economies);

  // 5. Last day of a month: dominion spreads, then Godless is settled.
  if (state.day % TIME.daysPerMonth === TIME.daysPerMonth - 1) {
    spreadDominion(state);
    updateGodless(state);
  }
  // 6. Visibility: only the explored lists are stored; armies newly in view are reported.
  updateExplored(state);
  updateSightings(state);
  // 7. Capitals move, nations fall, and the game may end.
  settleVictory(state);

  state.day += 1;
  // Drop effects that end today, so the state never holds an expired one between ticks.
  state.provinceEffects = state.provinceEffects.filter((e) => e.untilDay > state.day);
}
