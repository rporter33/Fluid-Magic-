// The AI's army pass (docs/08-ai.md priority 4 "Expansion"; Phase 7 design "5. Army pass" f, g,
// "Groups and free armies"): the expansion score with its distance penalty and the 1.5x rule,
// no two moves to one province, the march home to refill and out again, and groups moving as
// one with the fighter pretender, a summoned commander, and one battle mage.
import { describe, expect, it } from 'vitest';
import { unitDef } from '../../src/content';
import { AI } from '../../src/content/ai';
import { distanceFactor, provinceValue } from '../../src/ai/army';
import { armyPower, commanderPower, defenderPower, troopPower } from '../../src/ai/assess';
import { expansionTarget, planArmies } from '../../src/ai/military';
import { createPlan } from '../../src/ai/plan';
import { createCommander, createSquad, removeCommander } from '../../src/sim/commanders';
import { applyCommand, type Command } from '../../src/sim/commands';
import type { NationId, ProvinceId } from '../../src/sim/ids';
import { findPathFor, pathsFrom } from '../../src/sim/movement';
import { advance } from '../../src/sim/tick';
import type { CommanderState, GameState } from '../../src/sim/types';
import { addArmy, annex, besiege, redField } from '../sim/fixtures';

const P = (id: string) => id as ProvinceId;

function armies(state: GameState, red: NationId): Command[] {
  const plan = createPlan(state, red);
  planArmies(plan);
  return plan.out;
}

function moveCmd(red: NationId, members: readonly CommanderState[], path: ProvinceId[]): Command {
  return { type: 'move', nation: red, commanders: members.map((m) => m.id), path };
}

describe('expansionTarget', () => {
  it('is the best reached independent by value over defenders, discounted by days', () => {
    const { state, red, army } = redField();
    const plan = createPlan(state, red);
    const paths = pathsFrom(state, [army]);
    const score = (p: ProvinceId) =>
      (provinceValue(state, p) / Math.max(defenderPower(state, p), 1)) *
      distanceFactor(plan, paths.days(p)!);
    const candidates = paths.reached.filter((p) => state.provinces[p]!.owner === null);
    expect(candidates.length).toBeGreaterThan(1);
    const best = [...candidates].sort((a, b) => score(b) - score(a))[0];
    expect(expansionTarget(plan, [army], new Set())).toBe(best);
    // Skipping where an own move already ends, the next best.
    const next = [...candidates].sort((a, b) => score(b) - score(a))[1];
    expect(expansionTarget(plan, [army], new Set([best!]))).toBe(next);
  });

  it(`attacks only with more than ${String(AI.expansionRatio)} times the defenders`, () => {
    const { state, red, army } = redField();
    const plan = () => createPlan(state, red);
    const target = expansionTarget(plan(), [army], new Set())!;
    // Only the target is open: every other province counts as taken.
    const others = new Set(pathsFrom(state, [army]).reached.filter((p) => p !== target));
    for (const c of Object.values(state.commanders)) {
      if (c.owner === null && c.location === target) removeCommander(state, c.id);
    }
    const guard = addArmy(state, null, target, 'lightInfantry', 1, 'independentCaptain');
    const unit = unitDef('lightInfantry');
    const body = commanderPower({ ...guard, squads: [] });
    /** Gives the defenders exactly this power, through the troops' HP pool. */
    const defend = (power: number) => {
      const troops = (power - body) / troopPower(unit);
      guard.squads[0]!.count = Math.ceil(troops);
      guard.squads[0]!.hp = troops * unit.hp;
      expect(defenderPower(state, target)).toBeCloseTo(power, 6);
    };
    const bound = armyPower([army]) / AI.expansionRatio;
    defend(bound * 1.001);
    expect(expansionTarget(plan(), [army], others)).toBeNull();
    defend(bound * 0.999);
    expect(expansionTarget(plan(), [army], others)).toBe(target);
  });
});

describe('planArmies: expansion', () => {
  it('sends two armies to two provinces, never both to one', () => {
    const { state, red, capital, army } = redField();
    const second = addArmy(state, red, capital, 'cinderWarrior', 30);
    const out = armies(state, red).filter((c) => c.type === 'move');
    expect(out.map((c) => c.commanders)).toEqual([[army.id], [second.id]]);
    const ends = out.map((c) => c.path.at(-1));
    expect(new Set(ends).size).toBe(2);
  });

  it('leaves besiegers to their siege', () => {
    const { state, red, green } = redField();
    const siege = besiege(state, red, state.nations[green]!.capital);
    siege.squads[0]!.count = 30;
    expect(
      armies(state, red).some((c) => c.type === 'move' && c.commanders.includes(siege.id)),
    ).toBe(false);
  });
});

describe('planArmies: the march home', () => {
  it('walks a depleted army home, where it refills and leaves again', () => {
    const { state, red, capital, army } = redField();
    const out = annex(state, red, P('p50')).id;
    army.location = out;
    army.squads = [createSquad(state, 'cinderWarrior', AI.fieldArmyTroops - 1)];
    expect(armies(state, red)).toContainEqual(moveCmd(red, [army], [capital]));
    // Walk it home.
    expect(applyCommand(state, moveCmd(red, [army], [capital]))).toEqual({ ok: true });
    while (army.transit) advance(state);
    expect(army.location).toBe(capital);
    // At home and short of troops it stays.
    expect(armies(state, red).filter((c) => c.type === 'move')).toEqual([]);
    // The transfers fill it (recruit.ts); then it leaves on a task again.
    const holder = state.commanders[state.provinces[capital]!.garrison!]!;
    holder.squads.push(createSquad(state, 'cinderWarrior', 30));
    expect(
      applyCommand(state, {
        type: 'transferSquad',
        nation: red,
        from: holder.id,
        to: army.id,
        squad: holder.squads[0]!.id,
      }),
    ).toEqual({ ok: true });
    const moves = armies(state, red).filter((c) => c.type === 'move');
    expect(moves.map((c) => c.commanders)).toEqual([[army.id]]);
  });

  it('walks home a field army no task takes, and riders left without a leader', () => {
    const { state, red, capital, army } = redField();
    const out = annex(state, red, P('p50')).id;
    // Every neighbor of p50 but the capital is far too strong for it.
    army.location = out;
    army.squads = [createSquad(state, 'ashMilitia', AI.fieldArmyTroops)];
    const salamander = createCommander(state, 'salamander', red, P('p50'));
    const lone = annex(state, red, P('p57')).id;
    const rider = createCommander(state, 'salamander', red, lone);
    const moves = armies(state, red).filter((c) => c.type === 'move');
    expect(moves).toEqual([
      moveCmd(red, [army, salamander], [capital]),
      moveCmd(red, [rider], [capital]),
    ]);
  });
});

describe('planArmies: groups', () => {
  it('move as one with the fighter pretender, a summoned commander, and one battle mage', () => {
    const { state, red, capital, army } = redField();
    state.day = AI.pretenderJoinDay;
    const titan = createCommander(state, 'titan', red, capital);
    state.nations[red]!.pretenderId = titan.id;
    // With the starting adept, four mages: Cinder researches at 0.4, so the newest two ride.
    createCommander(state, 'emberAdept', red, capital);
    const rider = createCommander(state, 'emberAdept', red, capital);
    const spare = createCommander(state, 'emberAdept', red, capital);
    const salamander = createCommander(state, 'salamander', red, capital);
    const [move] = armies(state, red).filter((c) => c.type === 'move');
    const group = [army, titan, rider, salamander];
    expect(move?.type === 'move' && [...move.commanders].sort()).toEqual(
      group.map((c) => c.id).sort(),
    );
    // One pace: the path the whole group would be given.
    const to = move?.type === 'move' ? move.path.at(-1)! : capital;
    expect(move?.type === 'move' && move.path).toEqual(findPathFor(state, group, to));
    expect(move?.type === 'move' && move.commanders.includes(spare.id)).toBe(false);
  });
});
