// advance(state): one day (docs/06-architecture.md, "Simulation contract"). Steps run in the
// documented order; steps owned by later phases are marked where they will slot in.
import { progressConstruction } from './buildings';
import { accrueGoldAndMana, accrueMaterials } from './economy';
import { applyPillage } from './pillage';
import { growPopulation } from './population';
import { allProvinceEconomies } from './selectors';
import { applySupply } from './supply';
import type { GameState } from './types';
import { updateUnrest } from './unrest';

export function advance(state: GameState): void {
  if (state.result) return;

  // 1. Commands were applied by the caller before this call.
  // 2. Movement, arrivals, battles, sieges (Phases 3 and 4).

  // 3. Queues: construction here; recruitment (Phase 3), rituals and research (Phase 5).
  progressConstruction(state);

  // 4. Economy, pillage, population, unrest, supply. Rates come from one snapshot of the day.
  const economies = allProvinceEconomies(state);
  accrueGoldAndMana(state, economies);
  accrueMaterials(state, economies);
  applyPillage(state, economies);
  growPopulation(state, economies);
  updateUnrest(state, economies);
  applySupply(state, economies);

  // 5. Last day of a month (day % 30 === 29): dominion spread, monthly effects (Phase 6).
  // 6. Visibility (Phase 3). 7. Victory check (Phase 6).

  state.day += 1;
  // Drop effects that end today, so the state never holds an expired one between ticks.
  state.provinceEffects = state.provinceEffects.filter((e) => e.untilDay > state.day);
}
