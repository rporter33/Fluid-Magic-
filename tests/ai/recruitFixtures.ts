// Shared helpers for the recruitment step's tests (recruit*.test.ts): run the step alone on a
// fresh plan, pick its commands by type, apply them, and find the capital's garrison holder.
import { expect } from 'vitest';
import { createPlan, type Plan } from '../../src/ai/plan';
import { planRecruitment } from '../../src/ai/recruit';
import { applyCommand, type Command } from '../../src/sim/commands';
import type { NationId, ProvinceId } from '../../src/sim/ids';
import type { CommanderState, GameState } from '../../src/sim/types';

export function planned(state: GameState, nation: NationId): Plan {
  const plan = createPlan(state, nation);
  planRecruitment(plan);
  return plan;
}

export function ofType<T extends Command['type']>(
  plan: Plan,
  type: T,
): Extract<Command, { type: T }>[] {
  return plan.out.filter((c): c is Extract<Command, { type: T }> => c.type === type);
}

export function applyAll(state: GameState, plan: Plan): void {
  for (const c of plan.out) expect(applyCommand(state, c)).toEqual({ ok: true });
}

export function holderOf(state: GameState, province: ProvinceId): CommanderState {
  return state.commanders[state.provinces[province]!.garrison!]!;
}
