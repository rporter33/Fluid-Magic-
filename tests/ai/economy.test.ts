// The AI's economy and research steps (docs/08-ai.md priorities 1 and 3; Phase 7 design
// "1. Economy", "3. Research"): taxes set only on change, PD bought one level a call in budget
// order above the gold reserve, buildings started one at a time by the scout, and the mages
// split into researchers in the home lab and battle mages ready to ride.
import { describe, expect, it } from 'vitest';
import { AI } from '../../src/content/ai';
import { adjacencyRoute } from '../../src/ai/army';
import { buildChoice, defenseTargets, planEconomy, planResearch } from '../../src/ai/economy';
import { createPlan, type Plan } from '../../src/ai/plan';
import { createCommander, createSquad, removeCommander } from '../../src/sim/commanders';
import { applyCommand, type Command } from '../../src/sim/commands';
import type { NationId, ProvinceId } from '../../src/sim/ids';
import { findPathFor, pathsFrom } from '../../src/sim/movement';
import type { CommanderState, GameState } from '../../src/sim/types';
import { annex, commandersIn, move, neighbors, redField } from '../sim/fixtures';

function planned(state: GameState, nation: NationId, step: (plan: Plan) => void): Plan {
  const plan = createPlan(state, nation);
  step(plan);
  return plan;
}

function ofType<T extends Command['type']>(plan: Plan, type: T): Extract<Command, { type: T }>[] {
  return plan.out.filter((c): c is Extract<Command, { type: T }> => c.type === type);
}

/** Applies a plan's commands to the real state, as the driver does. */
function applyAll(state: GameState, plan: Plan): void {
  for (const c of plan.out) expect(applyCommand(state, c)).toEqual({ ok: true });
}

function unitIn(state: GameState, province: ProvinceId, unit: string): CommanderState {
  const found = commandersIn(state, province).find((c) => c.unit === unit);
  if (!found) throw new Error(`no ${unit} in ${province}`);
  return found;
}

/** Leaves `count` independent troops in a province (none when 0). */
function setIndependents(state: GameState, province: ProvinceId, count: number): void {
  for (const c of Object.values(state.commanders)) {
    if (c.owner === null && c.location === province) removeCommander(state, c.id);
  }
  if (count <= 0) return;
  const captain = createCommander(state, 'independentCaptain', null, province);
  captain.squads.push(createSquad(state, 'ashMilitia', count));
}

describe('planEconomy: taxes', () => {
  it('raises the capital to High only while gold and unrest are low, and only on change', () => {
    const { state, red, capital } = redField();
    const other = annex(state, red, neighbors(state, capital)[0]!);
    expect(ofType(planned(state, red, planEconomy), 'setTax')).toEqual([]);
    state.nations[red]!.gold = AI.taxHighBelowGold - 1;
    other.taxRate = 'low';
    expect(ofType(planned(state, red, planEconomy), 'setTax')).toEqual([
      { type: 'setTax', nation: red, province: other.id, rate: 'normal' },
      { type: 'setTax', nation: red, province: capital, rate: 'high' },
    ]);
    other.taxRate = 'normal';
    state.provinces[capital]!.taxRate = 'high';
    expect(ofType(planned(state, red, planEconomy), 'setTax')).toEqual([]);
    state.provinces[capital]!.unrest = AI.taxHighMaxUnrest;
    expect(ofType(planned(state, red, planEconomy), 'setTax')).toEqual([
      { type: 'setTax', nation: red, province: capital, rate: 'normal' },
    ]);
    state.provinces[capital]!.unrest = 0;
    state.nations[red]!.gold = AI.taxHighBelowGold;
    expect(ofType(planned(state, red, planEconomy), 'setTax')).toEqual([
      { type: 'setTax', nation: red, province: capital, rate: 'normal' },
    ]);
  });
});

/**
 * Red owns its capital, E next to a Thornwood province, a Wellspring W, and S next to a strong
 * independent; every other independent is weak.
 */
function defenseField() {
  const field = redField();
  const { state, red, green, capital } = field;
  const [e, s] = neighbors(state, capital) as [ProvinceId, ProvinceId];
  annex(state, red, e);
  annex(state, red, s);
  const near = new Set([capital, ...neighbors(state, capital), ...neighbors(state, s)]);
  const enemy = neighbors(state, e).find((n) => !near.has(n))!;
  annex(state, green, enemy);
  const w = (Object.keys(state.map.provinces) as ProvinceId[]).find(
    (id) =>
      state.map.provinces[id]!.wellspring !== undefined &&
      state.provinces[id]!.owner === null &&
      neighbors(state, id).every((n) => state.provinces[n]!.owner === null),
  )!;
  annex(state, red, w);
  for (const p of Object.values(state.provinces))
    if (p.owner === null) setIndependents(state, p.id, 5);
  const strong = neighbors(state, s).find((n) => state.provinces[n]!.owner === null)!;
  setIndependents(state, strong, AI.independentStrength + 1);
  return { ...field, e, s, w, enemy };
}

function pdBought(plan: Plan): ProvinceId[] {
  return ofType(plan, 'buyPd').map((c) => {
    expect(c.levels).toBe(1);
    return c.province;
  });
}

describe('planEconomy: provincial defense', () => {
  it('lists the enemy border, then Wellsprings, then strong independent borders', () => {
    const { state, red, e, s, w } = defenseField();
    const targets = defenseTargets(createPlan(state, red));
    const at = (id: ProvinceId, level: number) =>
      targets.findIndex(([p, l]) => p === id && l === level);
    expect(at(e, AI.pd.enemy)).toBe(0);
    expect(at(w, AI.wellspringPd)).toBeGreaterThan(at(e, AI.pd.enemy));
    expect(at(s, AI.pd.border)).toBeGreaterThan(at(w, AI.wellspringPd));
    // The capital borders only its own provinces and a weak independent.
    expect(new Set(targets.map(([p]) => p))).toEqual(new Set([e, w, s]));
  });

  it('buys one level a call in each province, in budget order, above the reserve', () => {
    const { state, red, e, s, w } = defenseField();
    const gold = (n: number) => (state.nations[red]!.gold = AI.goldReserve + n);
    // Each first level costs 15.
    gold(15 * 3);
    const plan = planned(state, red, planEconomy);
    expect(pdBought(plan)).toEqual([e, w, s]);
    applyAll(state, plan);
    expect([e, w, s].map((id) => state.provinces[id]!.pd)).toEqual([1, 1, 1]);
    expect(state.nations[red]!.gold).toBe(AI.goldReserve);
    // E's next level costs 150: with gold for it and one more, W gets the other; S waits.
    state.provinces[e]!.pd = 9;
    gold(150 + 30);
    expect(pdBought(planned(state, red, planEconomy))).toEqual([e, w]);
    // Gold short of E's level buys nothing: W and S never take what E waits for.
    gold(149);
    expect(pdBought(planned(state, red, planEconomy))).toEqual([]);
  });

  it('stops at each tier level and passes over a besieged province', () => {
    const { state, red, green, e, s, w } = defenseField();
    state.nations[red]!.gold = 10_000;
    state.provinces[e]!.pd = AI.pd.enemy;
    state.provinces[w]!.pd = AI.wellspringPd;
    state.provinces[s]!.pd = AI.pd.border;
    expect(pdBought(planned(state, red, planEconomy))).toEqual([]);
    state.provinces[e]!.pd = AI.pd.border;
    state.provinces[s]!.pd = AI.pd.border - 1;
    state.provinces[w]!.siege = { attacker: green, wallHp: 0, storm: false };
    state.provinces[w]!.pd = 0;
    expect(pdBought(planned(state, red, planEconomy))).toEqual([e, s]);
    // Besieged first in budget order, at a level dearer than the spare gold, E ends nothing.
    state.provinces[w]!.siege = null;
    state.provinces[e]!.siege = { attacker: green, wallHp: 0, storm: false };
    state.provinces[e]!.pd = 9;
    state.provinces[s]!.pd = 0;
    state.nations[red]!.gold = AI.goldReserve + 15 * 2;
    expect(pdBought(planned(state, red, planEconomy))).toEqual([w, s]);
  });
});

/**
 * Red owns its capital's neighbors, two of them populous enough for a Temple; the scout stands
 * in the capital.
 */
function buildField() {
  const field = redField();
  const { state, red, capital } = field;
  const [second, best, small] = neighbors(state, capital).map((id) => annex(state, red, id));
  second!.pop = AI.templePop + 1000;
  best!.pop = AI.templePop + 4000;
  small!.pop = AI.templePop - 1000;
  const scout = unitIn(state, capital, 'cinderScout');
  return { ...field, best: best!, second: second!, scout };
}

describe('planEconomy: buildings', () => {
  it('sends the scout to build a second Lab in the most populous province', () => {
    const { state, red, best, scout } = buildField();
    state.nations[red]!.gold = AI.labGold + 1;
    expect(buildChoice(createPlan(state, red))?.building).toBe('lab');
    let plan = planned(state, red, planEconomy);
    expect(ofType(plan, 'move')).toEqual([
      {
        type: 'move',
        nation: red,
        commanders: [scout.id],
        path: findPathFor(state, [scout], best.id),
      },
    ]);
    expect(ofType(plan, 'build')).toEqual([]);
    // Walking there, it is left alone; standing there, it builds.
    applyAll(state, plan);
    expect(ofType(planned(state, red, planEconomy), 'move')).toEqual([]);
    scout.transit = null;
    scout.order = { kind: 'idle' };
    scout.location = best.id;
    plan = planned(state, red, planEconomy);
    expect(ofType(plan, 'build')).toEqual([
      { type: 'build', nation: red, province: best.id, commander: scout.id, building: 'lab' },
    ]);
    applyAll(state, plan);
    // One construction at a time.
    state.nations[red]!.gold = 10_000;
    expect(ofType(planned(state, red, planEconomy), 'build')).toEqual([]);
    expect(ofType(planned(state, red, planEconomy), 'move')).toEqual([]);
  });

  it('builds Temples where the people are many, paying only from gold above the reserve', () => {
    const { state, red, best, second, scout } = buildField();
    state.nations[red]!.gold = AI.templeGold;
    expect(buildChoice(createPlan(state, red))).toBeNull();
    state.nations[red]!.gold = AI.templeGold + 1;
    const choice = buildChoice(createPlan(state, red));
    expect(choice?.building).toBe('temple');
    expect(choice?.sites.map((p) => p.id)).toEqual(
      [best, second].filter((p) => p.pop > AI.templePop).map((p) => p.id),
    );
    // Gold 301 leaves too little after a 200-gold Temple: the scout walks but does not build.
    scout.location = best.id;
    expect(ofType(planned(state, red, planEconomy), 'build')).toEqual([]);
    state.nations[red]!.gold = AI.goldReserve + 200;
    expect(ofType(planned(state, red, planEconomy), 'build')).toEqual([
      { type: 'build', nation: red, province: best.id, commander: scout.id, building: 'temple' },
    ]);
    // A second lab already stands: no more labs, whatever the gold.
    state.provinces[second.id]!.buildings.push('lab');
    state.nations[red]!.gold = 10_000;
    expect(buildChoice(createPlan(state, red))?.building).toBe('temple');
  });

  it('keeps a scout walking to another site, and waits without a scout', () => {
    const { state, red, second, scout } = buildField();
    state.nations[red]!.gold = AI.templeGold + 1;
    const path = findPathFor(state, [scout], second.id)!;
    expect(move(state, red, [scout], path)).toEqual({ ok: true });
    expect(planned(state, red, planEconomy).out).toEqual([]);
    removeCommander(state, scout.id);
    expect(planned(state, red, planEconomy).out).toEqual([]);
  });
});

describe('planResearch', () => {
  it('studies the nation color with the oldest ceil(mages * research) in the capital lab', () => {
    const { state, red, capital } = redField();
    const adept = unitIn(state, capital, 'emberAdept');
    state.nations[red]!.research.color = 'G';
    let plan = planned(state, red, planResearch);
    expect(plan.out).toEqual([
      { type: 'setResearchColor', nation: red, color: 'R' },
      { type: 'setOrder', nation: red, commander: adept.id, order: 'research' },
    ]);
    applyAll(state, plan);
    expect(planned(state, red, planResearch).out).toEqual([]);
    // Red researches at 0.4: of two mages one studies, the newer one rides with the armies.
    const second = createCommander(state, 'emberAdept', red, capital);
    second.order = { kind: 'research' };
    plan = planned(state, red, planResearch);
    expect(plan.out).toEqual([
      { type: 'setOrder', nation: red, commander: second.id, order: 'idle' },
    ]);
    // A third makes two researchers: the second-oldest goes back to the lab.
    applyAll(state, plan);
    const third = createCommander(state, 'emberAdept', red, capital);
    plan = planned(state, red, planResearch);
    expect(plan.out).toEqual([
      { type: 'setOrder', nation: red, commander: second.id, order: 'research' },
    ]);
    expect(third.order.kind).toBe('idle');
  });

  it('walks a researcher home and never replaces a ritual under way', () => {
    const { state, red, capital } = redField();
    const adept = unitIn(state, capital, 'emberAdept');
    const away = annex(state, red, neighbors(state, capital)[0]!).id;
    adept.location = away;
    let plan = planned(state, red, planResearch);
    expect(plan.out).toEqual([
      { type: 'move', nation: red, commanders: [adept.id], path: [capital] },
    ]);
    applyAll(state, plan);
    expect(planned(state, red, planResearch).out).toEqual([]);
    adept.transit = null;
    adept.location = capital;
    adept.order = { kind: 'castRitual', spellId: 'callFireSprites', target: null, daysLeft: 3 };
    plan = planned(state, red, planResearch);
    expect(plan.out).toEqual([]);
  });

  it('walks a researcher to the nearest own lab while the capital is lost', () => {
    // Red owns labs in p50 and p51 and the road between; Green holds Red's capital.
    const { state, red, green, capital } = redField();
    const road = adjacencyRoute(state, ['p50' as ProvinceId], 'p51' as ProvinceId);
    for (const p of ['p50' as ProvinceId, ...road]) annex(state, red, p);
    for (const p of ['p50', 'p51'] as ProvinceId[]) state.provinces[p]!.buildings.push('lab');
    const adept = unitIn(state, capital, 'emberAdept');
    adept.location = road[0]!;
    state.provinces[capital]!.owner = green;
    const paths = pathsFrom(state, [adept]);
    expect(paths.days('p50' as ProvinceId)!).toBeLessThan(paths.days('p51' as ProvinceId)!);
    expect(ofType(planned(state, red, planResearch), 'move')).toEqual([
      {
        type: 'move',
        nation: red,
        commanders: [adept.id],
        path: findPathFor(state, [adept], 'p50' as ProvinceId),
      },
    ]);
  });

  it('researches with the share of mages the personality gives', () => {
    const { state, green } = redField();
    const capital = state.nations[green]!.capital;
    const druid = unitIn(state, capital, 'saplingDruid');
    const elder = createCommander(state, 'elderDruid', green, capital);
    // Thornwood researches at 0.7: both of two mages study.
    expect(planned(state, green, planResearch).out).toEqual([
      { type: 'setOrder', nation: green, commander: druid.id, order: 'research' },
      { type: 'setOrder', nation: green, commander: elder.id, order: 'research' },
    ]);
  });
});
