// The AI's priests and pretender (docs/08-ai.md priorities 9 and 10; Phase 7 design "4.
// Priests", "Roles"): Godless danger and preaching at home, Wellspring claims with one priest
// per Wellspring, the prophet, and the work of a pretender that does not fight.
import { describe, expect, it } from 'vitest';
import { AI } from '../../src/content/ai';
import { godlessDanger, planPretender, planPriests } from '../../src/ai/faith';
import { createPlan } from '../../src/ai/plan';
import { createCommander } from '../../src/sim/commanders';
import type { Command } from '../../src/sim/commands';
import type { UnitTypeId } from '../../src/content';
import type { NationId, ProvinceId } from '../../src/sim/ids';
import { findPathFor, pathsFrom } from '../../src/sim/movement';
import type { CommanderState, GameState } from '../../src/sim/types';
import { annex, besiege, commandersIn, neighbors, redField } from '../sim/fixtures';

/** Red owns every province that is not Green's, so every path is open and every spring is Red's. */
function redWorld() {
  const f = redField();
  const { state, red } = f;
  for (const p of Object.values(state.provinces)) if (p.owner === null) annex(state, red, p.id);
  const priest = commandersIn(state, f.capital).find((c) => c.unit === 'pyrePriest')!;
  return { ...f, priest };
}

function priests(state: GameState, red: NationId, at: ProvinceId, n: number): CommanderState[] {
  return Array.from({ length: n }, () => createCommander(state, 'pyrePriest', red, at));
}

/** The commands one call of a step issues for Red. */
function run(state: GameState, red: NationId, step: typeof planPriests): Command[] {
  const plan = createPlan(state, red);
  step(plan);
  return plan.out;
}

function moveTo(state: GameState, red: NationId, c: CommanderState, to: ProvinceId): Command {
  return { type: 'move', nation: red, commanders: [c.id], path: findPathFor(state, [c], to)! };
}

function order(red: NationId, c: CommanderState, kind: 'preach' | 'research'): Command {
  return { type: 'setOrder', nation: red, commander: c.id, order: kind };
}

/** Commands other than the prophet's naming. */
function withoutProphet(out: Command[]): Command[] {
  return out.filter((c) => c.type !== 'makeProphet');
}

describe('godlessDanger', () => {
  it('holds while no owned anchor of the faith keeps own dominion of AI.godlessAlarm', () => {
    const { state, red, green, capital } = redField();
    expect(godlessDanger(createPlan(state, red))).toBe(false);
    state.provinces[capital]!.dominion = { nation: green, strength: 3 };
    expect(godlessDanger(createPlan(state, red))).toBe(true);
    // A temple province of its own dominion anchors it, from AI.godlessAlarm on.
    const temple = annex(state, red, neighbors(state, capital)[0]!);
    temple.buildings.push('temple');
    temple.dominion = { nation: red, strength: AI.godlessAlarm - 1 };
    expect(godlessDanger(createPlan(state, red))).toBe(true);
    temple.dominion.strength = AI.godlessAlarm;
    expect(godlessDanger(createPlan(state, red))).toBe(false);
    // Without the temple the province anchors nothing.
    temple.buildings = [];
    expect(godlessDanger(createPlan(state, red))).toBe(true);
  });
});

describe('planPriests in Godless danger', () => {
  it('brings idle and preaching priests and the prophet home to preach, never a claimer', () => {
    const { state, red, green, capital, priest } = redWorld();
    state.provinces[capital]!.dominion = { nation: green, strength: 3 };
    const away = neighbors(state, capital)[0]!;
    const spring = state.map.wellsprings[0]!;
    const [preacher, claimer, walker, prophet] = priests(state, red, away, 4) as [
      CommanderState,
      CommanderState,
      CommanderState,
      CommanderState,
    ];
    preacher.order = { kind: 'preach' };
    claimer.location = spring;
    claimer.order = { kind: 'claimWellspring', daysLeft: 4 };
    // A priest on its way somewhere keeps going; the prophet comes home whatever it does.
    const elsewhere = neighbors(state, away).find((n) => n !== capital)!;
    for (const c of [walker, prophet]) {
      const path = findPathFor(state, [c], elsewhere)!;
      c.order = { kind: 'move', path: path.slice(1), mapSpeed: 3 };
      c.transit = { from: away, to: path[0]!, progress: 0, totalDays: 3 };
    }
    state.nations[red]!.prophetId = prophet.id;
    expect(withoutProphet(run(state, red, planPriests))).toEqual([
      order(red, priest, 'preach'),
      moveTo(state, red, preacher, capital),
      moveTo(state, red, prophet, capital),
    ]);
  });

  it('preaches where the priests stand while the capital is besieged', () => {
    const { state, red, green, capital, priest } = redWorld();
    state.provinces[capital]!.dominion = { nation: green, strength: 3 };
    const away = neighbors(state, capital)[0]!;
    const [outside] = priests(state, red, away, 1) as [CommanderState];
    besiege(state, green, capital);
    expect(withoutProphet(run(state, red, planPriests))).toEqual([
      order(red, priest, 'preach'),
      order(red, outside, 'preach'),
    ]);
  });
});

describe('planPriests claiming Wellsprings', () => {
  it('claims where a priest stands, one priest to a Wellspring', () => {
    const { state, red, priest } = redWorld();
    const [spring] = state.map.wellsprings as [ProvinceId];
    const [first, second] = priests(state, red, spring, 2) as [CommanderState, CommanderState];
    const out = withoutProphet(run(state, red, planPriests));
    expect(out[0]).toEqual({ type: 'claimWellspring', nation: red, commander: first.id });
    // The second goes to another Wellspring, as does the priest at home; none to the first.
    const moves = out.slice(1);
    expect(moves.map((c) => c.type)).toEqual(['move', 'move']);
    const ends = moves.map((c) => (c.type === 'move' ? c.path.at(-1) : null));
    expect(new Set(ends).size).toBe(2);
    expect(ends).not.toContain(spring);
    expect(moves.map((c) => (c.type === 'move' ? c.commanders : []))).toEqual([
      [priest.id],
      [second.id],
    ]);
  });

  it('sends each free priest to the nearest Wellspring no other priest has', () => {
    const { state, red, capital, priest } = redWorld();
    const springs = state.map.wellsprings;
    const [second] = priests(state, red, capital, 1) as [CommanderState];
    const days = pathsFrom(state, [priest]);
    const byDistance = [...springs].sort((a, b) => days.days(a)! - days.days(b)!);
    const out = withoutProphet(run(state, red, planPriests));
    expect(out).toEqual([
      moveTo(state, red, priest, byDistance[0]!),
      moveTo(state, red, second, byDistance[1]!),
    ]);
  });

  it('leaves a priest walking to a Wellspring be and sends the rest home to preach', () => {
    const { state, red, capital, priest } = redWorld();
    // Every Wellspring but one is claimed; the home priest walks to the last.
    const [open, ...claimed] = state.map.wellsprings as [ProvinceId, ...ProvinceId[]];
    for (const s of claimed) state.provinces[s]!.wellspringClaimedBy = red;
    const away = neighbors(state, capital)[0]!;
    const [late] = priests(state, red, away, 1) as [CommanderState];
    late.order = { kind: 'preach' };
    const [first] = run(state, red, planPriests);
    expect(first).toEqual(moveTo(state, red, priest, open));
    // Next call: the walker is left be; the other walks home and preaches there.
    const plan = createPlan(state, red);
    plan.issue(moveTo(state, red, priest, open));
    planPriests(plan);
    expect(withoutProphet(plan.out.slice(1))).toEqual([moveTo(state, red, late, capital)]);
    late.location = capital;
    late.order = { kind: 'idle' };
    expect(withoutProphet(run(state, red, planPriests)).slice(1)).toEqual([
      order(red, late, 'preach'),
    ]);
    // Preaching already, it is given nothing.
    late.order = { kind: 'preach' };
    expect(withoutProphet(run(state, red, planPriests)).slice(1)).toEqual([]);
  });
});

describe('the prophet', () => {
  it('is the oldest priest, named whenever the nation may name one', () => {
    const { state, red, capital, priest } = redWorld();
    const [younger] = priests(state, red, capital, 1) as [CommanderState];
    const named = run(state, red, planPriests).filter((c) => c.type === 'makeProphet');
    expect(named).toEqual([{ type: 'makeProphet', nation: red, commander: priest.id }]);
    state.nations[red]!.prophetId = younger.id;
    expect(run(state, red, planPriests).some((c) => c.type === 'makeProphet')).toBe(false);
    state.nations[red]!.prophetId = null;
    state.nations[red]!.prophetAvailableDay = state.day + 1;
    expect(run(state, red, planPriests).some((c) => c.type === 'makeProphet')).toBe(false);
  });
});

describe('planPretender', () => {
  function withPretender(unit: UnitTypeId) {
    const f = redField();
    const body = createCommander(f.state, unit, f.red, f.capital);
    f.state.nations[f.red]!.pretenderId = body.id;
    return { ...f, body };
  }

  it('sets an Oracle with a color pip to research in the capital lab', () => {
    const { state, red, body } = withPretender('oracle');
    // With no color pip it cannot research: it is left idle, nothing refused.
    expect(run(state, red, planPretender)).toEqual([]);
    body.pips = { R: 1 };
    expect(run(state, red, planPretender)).toEqual([order(red, body, 'research')]);
    body.order = { kind: 'research' };
    expect(run(state, red, planPretender)).toEqual([]);
  });

  it('brings a hidden body, and a fighter before AI.pretenderJoinDay, home to the capital', () => {
    for (const unit of ['wildSpirit', 'titan', 'oracle'] as const) {
      const { state, red, capital, body } = withPretender(unit);
      const away = annex(state, red, neighbors(state, capital)[0]!).id;
      body.location = away;
      expect(run(state, red, planPretender), unit).toEqual([moveTo(state, red, body, capital)]);
    }
    const { state, red, capital, body } = withPretender('titan');
    body.location = annex(state, red, neighbors(state, capital)[0]!).id;
    state.day = AI.pretenderJoinDay;
    // From then on it rides with the armies (military.ts), not here.
    expect(run(state, red, planPretender)).toEqual([]);
  });

  it('leaves a Monolith to its rituals', () => {
    const { state, red } = withPretender('livingMonolith');
    expect(run(state, red, planPretender)).toEqual([]);
  });
});
