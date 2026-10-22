// War's later targets (docs/08-ai.md priority 6 "War"; Phase 7 design "5. Army pass" e): the
// odds gate judged per target (aggression x field power against AI.warRatio x the target's
// garrison and PD and the other nations' commanders near it, garrison holders counting nothing),
// marches joined only with AI.warRatio times the defenders, new targets by value discounted by
// path days, and only armies standing together combined.
import { describe, expect, it } from 'vitest';
import { AI } from '../../src/content/ai';
import {
  adjacencyRoute,
  createArmyPass,
  distanceFactor,
  fixedDefense,
  provinceValue,
} from '../../src/ai/army';
import { armyPower, defenderPower } from '../../src/ai/assess';
import { createPlan } from '../../src/ai/plan';
import { makeWar } from '../../src/ai/war';
import { createSquad, isGarrisonHolder, removeCommander } from '../../src/sim/commanders';
import { applyCommand, type Command } from '../../src/sim/commands';
import type { NationId } from '../../src/sim/ids';
import { withinHops } from '../../src/sim/rituals';
import { nationDefOf } from '../../src/sim/state';
import type { GameState } from '../../src/sim/types';
import { addArmy, annex, neighbors, redField } from '../sim/fixtures';
import { moveCmd, P, setTroops, warriorsFor } from './armyFixtures';

function war(state: GameState, red: NationId): Command[] {
  const pass = createArmyPass(createPlan(state, red));
  makeWar(pass);
  return pass.plan.out;
}

/** Red's field without Green's armies: only Green's garrison holder is left on the map. */
function quietField() {
  const f = redField();
  for (const c of Object.values(f.state.commanders)) {
    if (c.owner === f.green && !isGarrisonHolder(c)) removeCommander(f.state, c.id);
  }
  return f;
}

describe('makeWar: the odds gate', () => {
  /** Seed 1: Red's army in p15, next to Green's undefended p10; a Green army in p2 beyond. */
  function gate() {
    const f = redField();
    annex(f.state, f.red, P('p15'));
    annex(f.state, f.green, P('p10'));
    annex(f.state, f.green, P('p2'));
    f.army.location = P('p15');
    const enemy = addArmy(f.state, f.green, P('p2'), 'cinderWarrior', 40, 'wardenCaptain');
    return { ...f, enemy };
  }

  it('picks a new target only when aggression * own power > AI.warRatio * enemy power near it', () => {
    const { state, red, army, enemy } = gate();
    // 0.8 * 262 against 1.2 * 180.3, the Green army one hop from p10: shut, though the army
    // alone has more than AI.warRatio times that enemy.
    setTroops(enemy, 20);
    const aggression = nationDefOf(state, red).ai.aggression;
    expect(aggression * armyPower([army])).toBeLessThan(AI.warRatio * armyPower([enemy]));
    expect(armyPower([army])).toBeGreaterThan(AI.warRatio * armyPower([enemy]));
    expect(war(state, red)).toEqual([]);
    removeCommander(state, enemy.id);
    expect(war(state, red)).toEqual([moveCmd(red, [army], [P('p10')])]);
  });

  it("counts the target's own PD against the odds", () => {
    // No enemy commander near p10, whose PD 12 the army can take but the odds shut on.
    const { state, red, army, enemy } = gate();
    removeCommander(state, enemy.id);
    state.provinces[P('p10')]!.pd = 12;
    const aggression = nationDefOf(state, red).ai.aggression;
    expect(armyPower([army])).toBeGreaterThanOrEqual(AI.warRatio * defenderPower(state, P('p10')));
    expect(aggression * armyPower([army])).toBeLessThan(
      AI.warRatio * fixedDefense(state, P('p10')),
    );
    expect(war(state, red)).toEqual([]);
  });

  it('opens on one target it can take along a long border of PD-10 provinces', () => {
    // Seed 1: Red holds its capital p42, p19, and p15; Green holds the four provinces beyond,
    // every one at PD 10, and stands its army at home far away.
    const f = redField();
    const { state, red, green, army, capital } = f;
    annex(state, red, P('p19'));
    annex(state, red, P('p15'));
    const border = ['p7', 'p10', 'p29', 'p47'].map(P);
    for (const p of border) annex(state, green, p).pd = 10;
    const second = addArmy(state, red, capital, 'cinderWarrior', 30);
    const field = 0.8 * armyPower([army, second]);
    const pd10 = fixedDefense(state, P('p10'));
    for (const p of border) expect(fixedDefense(state, p)).toBe(pd10);
    // Summed over the border the odds are shut; against any one target they are open.
    expect(field).toBeLessThan(AI.warRatio * border.length * pd10);
    expect(field).toBeGreaterThan(AI.warRatio * pd10);
    expect(armyPower([army])).toBeGreaterThanOrEqual(AI.warRatio * pd10);
    const moves = war(state, red).filter((c) => c.type === 'move');
    expect(moves.length).toBeGreaterThan(0);
    for (const m of moves) expect(border).toContain(m.path.at(-1));
  });

  it("counts nothing for a garrison holder near the target, the enemy capital's included", () => {
    // Red's army stands two provinces short of Green's capital, whose holder keeps 30 Wardens;
    // Green's p53 lies between, next to the capital.
    const { state, red, green, capital, army } = quietField();
    const enemyCapital = state.nations[green]!.capital;
    const route = adjacencyRoute(state, [capital], enemyCapital);
    for (const p of route.slice(0, -2)) annex(state, red, p);
    const between = route.at(-2)!;
    annex(state, green, between);
    army.location = route.at(-3)!;
    expect(withinHops(state, between, AI.warHops).has(enemyCapital)).toBe(true);
    const holder = state.commanders[state.provinces[enemyCapital]!.garrison!]!;
    holder.squads.push(createSquad(state, 'warden', 30));
    const aggression = nationDefOf(state, red).ai.aggression;
    expect(aggression * armyPower([army])).toBeLessThan(AI.warRatio * armyPower([holder]));
    expect(war(state, red)).toEqual([moveCmd(red, [army], [between])]);
  });
});

describe('makeWar: marches', () => {
  it('joins a march on an enemy province past the gate when it can take it', () => {
    const { state, red, green, army } = redField();
    annex(state, red, P('p15'));
    annex(state, green, P('p10'));
    annex(state, green, P('p2'));
    army.location = P('p15');
    addArmy(state, green, P('p2'), 'cinderWarrior', 40, 'wardenCaptain');
    const marcher = addArmy(state, red, P('p15'), 'cinderWarrior', 20);
    expect(applyCommand(state, moveCmd(red, [marcher], [P('p10')]))).toEqual({ ok: true });
    expect(war(state, red)).toEqual([moveCmd(red, [army], [P('p10')])]);
  });

  it(`joins a march only with ${String(AI.warRatio)} times the defenders, not merely more`, () => {
    // A small Red army marches on Green's p10, which a Green army holds.
    const { state, red, green, army } = redField();
    annex(state, red, P('p15'));
    annex(state, green, P('p10'));
    addArmy(state, green, P('p10'), 'cinderWarrior', 40, 'wardenCaptain');
    const defenders = defenderPower(state, P('p10'));
    const marcher = addArmy(state, red, P('p15'), 'cinderWarrior', 5);
    expect(applyCommand(state, moveCmd(red, [marcher], [P('p10')]))).toEqual({ ok: true });
    army.squads = [];
    const joiner = addArmy(state, red, P('p15'), 'cinderWarrior', warriorsFor(1.05 * defenders));
    expect(armyPower([joiner])).toBeGreaterThan(defenders);
    expect(armyPower([joiner])).toBeLessThan(AI.warRatio * defenders);
    expect(war(state, red)).toEqual([]);
    setTroops(joiner, warriorsFor(AI.warRatio * defenders));
    expect(war(state, red)).toEqual([moveCmd(red, [joiner], [P('p10')])]);
  });

  it('combines armies standing together, never armies apart', () => {
    const { state, red, green, army } = redField();
    annex(state, red, P('p15'));
    annex(state, green, P('p10'));
    army.squads = [];
    const defender = addArmy(state, green, P('p10'), 'cinderWarrior', 30, 'wardenCaptain');
    const e = armyPower([defender]);
    const n = warriorsFor(0.9 * e);
    const a = addArmy(state, red, P('p15'), 'cinderWarrior', n);
    const b = addArmy(state, red, P('p19'), 'cinderWarrior', n);
    annex(state, red, P('p19'));
    expect(armyPower([a])).toBeLessThan(AI.warRatio * e);
    expect(armyPower([a, b])).toBeGreaterThanOrEqual(AI.warRatio * e);
    expect(war(state, red)).toEqual([]);
    b.location = P('p15');
    // The emptied army is no field army: it stays out of it.
    expect(war(state, red)).toEqual([moveCmd(red, [a, b], [P('p10')])]);
    expect(army.squads).toEqual([]);
  });
});

describe('makeWar: new targets', () => {
  it('takes the enemy capital when its defenders are weak, before richer provinces', () => {
    const f = redField();
    const { state, red, green } = f;
    const fort = state.nations[green]!.capital;
    for (const c of Object.values(state.commanders)) {
      if (c.owner === green && c.id !== state.provinces[fort]!.garrison)
        removeCommander(state, c.id);
    }
    // Red's army in p58, next to Green's capital and to Green's far richer p52.
    annex(state, red, P('p58'));
    annex(state, green, P('p52')).pop = 50_000;
    state.provinces[fort]!.pop = 100;
    f.army.location = P('p58');
    expect(war(state, red)).toEqual([moveCmd(red, [f.army], [fort])]);
    // Out of reach of the capital, the richer province.
    state.provinces[fort]!.owner = null;
    expect(war(state, red)).toEqual([moveCmd(red, [f.army], [P('p52')])]);
  });

  it('weighs value against path days', () => {
    // Red's army in p15 has Green's p10 next door and Green's p56 at the end of a road of Red
    // land (p19, p29, p48), both empty and far from Green's capital.
    const { state, red, green, army } = quietField();
    annex(state, red, P('p15'));
    annex(state, green, P('p10'));
    const road = adjacencyRoute(state, [P('p15')], P('p56'));
    const enemyCapital = state.nations[green]!.capital;
    expect(road.includes(P('p10')) || neighbors(state, P('p56')).includes(enemyCapital)).toBe(
      false,
    );
    for (const p of road.slice(0, -1)) annex(state, red, p);
    annex(state, green, P('p56'));
    army.location = P('p15');
    const plan = createPlan(state, red);
    const paths = plan.paths([army]);
    const worth = (p: string) =>
      provinceValue(state, P(p)) * distanceFactor(plan, paths.days(P(p))!);
    // The far one worth more, but less once discounted by its days (24 against 4): the near one.
    state.provinces[P('p10')]!.pop = 19_000;
    state.provinces[P('p56')]!.pop = 21_000;
    expect(provinceValue(state, P('p56'))).toBeGreaterThan(provinceValue(state, P('p10')));
    expect(worth('p56')).toBeLessThan(worth('p10'));
    expect(war(state, red).map((c) => (c.type === 'move' ? c.path.at(-1) : null))).toEqual(['p10']);
    // Far richer, the far one.
    state.provinces[P('p56')]!.pop = 50_000;
    expect(worth('p56')).toBeGreaterThan(worth('p10'));
    expect(war(state, red).map((c) => (c.type === 'move' ? c.path.at(-1) : null))).toEqual(['p56']);
  });
});
