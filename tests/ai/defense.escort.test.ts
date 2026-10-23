// Escorts for Wellspring claims (docs/08-ai.md priority 9 "Escorts"; Phase 7 design "5. Army
// pass" c): one army for each spring a priest walks to or claims, a group already there or
// marching there kept as its escort, else the nearest free army sent; never one spring's escort
// sent to another.
import { describe, expect, it } from 'vitest';
import { createArmyPass } from '../../src/ai/army';
import { escortClaims } from '../../src/ai/defense';
import { planArmies } from '../../src/ai/military';
import { createPlan } from '../../src/ai/plan';
import { createCommander } from '../../src/sim/commanders';
import { applyCommand } from '../../src/sim/commands';
import type { NationId, ProvinceId } from '../../src/sim/ids';
import { findPathFor } from '../../src/sim/movement';
import type { GameState } from '../../src/sim/types';
import { addArmy, annex, commandersIn, neighbors, redField } from '../sim/fixtures';
import { moveCmd, P, springField } from './armyFixtures';

function escorts(state: GameState, red: NationId) {
  const pass = createArmyPass(createPlan(state, red));
  escortClaims(pass);
  return pass;
}

describe('escortClaims', () => {
  it('sends the nearest free army to stand with a priest walking to claim, not the oldest', () => {
    const { state, red, army, spring, next } = springField();
    // The older army at home reaches the spring too, but the newer one is next to it.
    const near = addArmy(state, red, next, 'cinderWarrior', 30);
    expect(findPathFor(state, [army], spring)).not.toBeNull();
    const pass = escorts(state, red);
    expect(pass.plan.out).toEqual([moveCmd(red, [near], [spring])]);
    expect(pass.plan.assigned.has(army.id)).toBe(false);
  });

  it('keeps an army already there as the escort, whatever else could take it', () => {
    const { state, red, army, spring } = springField();
    army.location = spring;
    const plan = createPlan(state, red);
    planArmies(plan);
    expect(plan.out.filter((c) => c.type === 'move')).toEqual([]);
  });

  it('keeps an army marching there as the escort, sending no other', () => {
    const { state, red, army, spring, next } = springField();
    army.squads = [];
    const marching = addArmy(state, red, next, 'cinderWarrior', 30);
    expect(applyCommand(state, moveCmd(red, [marching], [spring]))).toEqual({ ok: true });
    addArmy(state, red, next, 'cinderWarrior', 30);
    const pass = escorts(state, red);
    expect(pass.plan.out).toEqual([]);
    expect([...pass.escorts]).toEqual([marching.id]);
  });

  it('lets the priest go alone with no free army', () => {
    const { state, red, army } = springField();
    army.squads = [];
    expect(escorts(state, red).plan.out).toEqual([]);
  });

  /**
   * Seed 1: Red owns all but Green's capital and its neighbors. A priest claims the Wellspring
   * p43 with an army standing there; a second priest walks from p2 to the Wellspring p3, which
   * comes first in province order.
   */
  function twoSprings() {
    const f = redField();
    const { state, red, green, capital } = f;
    const enemy = state.nations[green]!.capital;
    const near = new Set([enemy, ...neighbors(state, enemy)]);
    for (const id of Object.keys(state.provinces) as ProvinceId[]) {
      if (!near.has(id)) annex(state, red, id);
    }
    const claimer = commandersIn(state, capital).find((c) => c.unit === 'pyrePriest')!;
    claimer.location = P('p43');
    claimer.order = { kind: 'claimWellspring', daysLeft: 8 };
    const escort = addArmy(state, red, P('p43'), 'cinderWarrior', 30);
    const walker = createCommander(state, 'pyrePriest', red, P('p2'));
    expect(applyCommand(state, moveCmd(red, [walker], [P('p3')]))).toEqual({ ok: true });
    return { ...f, escort };
  }

  it("never sends one Wellspring's escort to another, whatever the province order", () => {
    const { state, red, army, escort } = twoSprings();
    army.squads = [];
    const pass = escorts(state, red);
    // No other free army: the walking priest goes alone, and the claim keeps its army.
    expect(pass.plan.out).toEqual([]);
    expect([...pass.escorts]).toEqual([escort.id]);
    const plan = createPlan(state, red);
    planArmies(plan);
    expect(plan.out.filter((c) => c.type === 'move' && c.commanders.includes(escort.id))).toEqual(
      [],
    );
  });

  it('sends the nearest free army to the spring without one, the escort staying', () => {
    const { state, red, army, escort } = twoSprings();
    const pass = escorts(state, red);
    expect(pass.plan.out).toEqual([moveCmd(red, [army], findPathFor(state, [army], P('p3'))!)]);
    expect([...pass.escorts]).toEqual([escort.id]);
  });
});
