// The AI's rituals and carried mana (docs/08-ai.md priority 8; Phase 7 design "6. Rituals and
// carried mana"): one ritual at a time, the cheapest useful one the pools hold twice over, by a
// caster in the capital lab that leaves research going; summons and strikes at war, the economy
// at peace; battle mages carrying the mana their spells use, and casting with it in battle.
import { describe, expect, it } from 'vitest';
import { AI } from '../../src/content/ai';
import { planResearch } from '../../src/ai/economy';
import type { Player } from '../../src/ai/driver';
import { playDay } from '../../src/ai/driver';
import {
  atWar,
  carriedColors,
  planCarriedMana,
  planRituals,
  ritualCasters,
} from '../../src/ai/magic';
import { createPlan, type Plan } from '../../src/ai/plan';
import { planRecruitment } from '../../src/ai/recruit';
import { splitMages } from '../../src/ai/roles';
import { createCommander, createSquad, removeCommander } from '../../src/sim/commanders';
import { applyCommand, type Command } from '../../src/sim/commands';
import type { NationId, ProvinceId } from '../../src/sim/ids';
import type { CommanderState, GameState } from '../../src/sim/types';
import {
  addArmy,
  annex,
  castRitual,
  commandersIn,
  move,
  neighbors,
  redField,
  ritualCaster,
  runDays,
} from '../sim/fixtures';

function planned(state: GameState, nation: NationId, step: (plan: Plan) => void): Plan {
  const plan = createPlan(state, nation);
  step(plan);
  return plan;
}

type Cast = Extract<Command, { type: 'castRitual' }>;

function casts(plan: Plan): Pick<Cast, 'commander' | 'spell' | 'target'>[] {
  return plan.out
    .filter((c): c is Cast => c.type === 'castRitual')
    .map(({ commander, spell, target }) => ({ commander, spell, target }));
}

function applyAll(state: GameState, plan: Plan): void {
  for (const c of plan.out) expect(applyCommand(state, c)).toEqual({ ok: true });
}

function unitIn(state: GameState, province: ProvinceId, unit: string): CommanderState {
  const found = commandersIn(state, province).find((c) => c.unit === unit);
  if (!found) throw new Error(`no ${unit} in ${province}`);
  return found;
}

/**
 * A nation with two researchers in its capital lab, its first mage and a master mage with every
 * level and full pools (ritualCaster), adding a mage of the first's kind while the personality
 * leaves fewer researchers; the newest of those rides as a battle mage.
 */
function casters(state: GameState, nation: NationId) {
  const capital = state.nations[nation]!.capital;
  const first = commandersIn(state, capital).find(
    (c) => c.unit === 'emberAdept' || c.unit === 'saplingDruid',
  )!;
  const master = ritualCaster(state, nation);
  while (splitMages(createPlan(state, nation)).researchers.length < 2) {
    createCommander(state, first.unit, nation, capital);
  }
  expect(splitMages(createPlan(state, nation)).researchers.map((c) => c.id)).toEqual([
    first.id,
    master.id,
  ]);
  return { capital, first, master };
}

describe('planRituals at peace', () => {
  it('casts Forge of Cinders on the capital with the master, when the pools hold twice its cost', () => {
    const { state, red } = redField();
    const { first, master } = casters(state, red);
    const plan = planned(state, red, planRituals);
    expect(atWar(plan)).toBe(false);
    // The first mage studies least, but has no useful ritual: Forge needs two Red pips.
    expect(ritualCasters(createPlan(state, red)).map((c) => c.id)).toEqual([first.id, master.id]);
    expect(casts(plan)).toEqual([{ commander: master.id, spell: 'forgeOfCinders', target: null }]);
    // Forge takes 3 Red and 1 generic, paid in Red: 7 Red is short of twice 4.
    state.nations[red]!.mana.R = 2 * 4 - 1;
    expect(casts(planned(state, red, planRituals))).toEqual([]);
    state.nations[red]!.mana.R = 2 * 4;
    expect(casts(planned(state, red, planRituals))).toHaveLength(1);
    // Once it works on the capital, nothing else at peace suits Red.
    expect(castRitual(state, red, master, 'forgeOfCinders')).toEqual({ ok: true });
    runDays(state, 10);
    expect(state.provinceEffects.some((e) => e.source === 'forgeOfCinders')).toBe(true);
    state.nations[red]!.mana.R = 50;
    expect(casts(planned(state, red, planRituals))).toEqual([]);
  });

  it('grows the best own province, then feeds the capital while it grows', () => {
    const { state, green } = redField();
    const { capital, master } = casters(state, green);
    const best = annex(state, green, neighbors(state, capital)[0]!);
    best.pop = state.provinces[capital]!.pop + 1000;
    // A more populous province in reach that Thornwood does not own is no target.
    const other = neighbors(state, capital).find((p) => state.provinces[p]!.owner === null)!;
    state.provinces[other]!.pop = best.pop + 5000;
    expect(casts(planned(state, green, planRituals))).toEqual([
      { commander: master.id, spell: 'fertileSeason', target: best.id },
    ]);
    expect(castRitual(state, green, master, 'fertileSeason', best.id)).toEqual({ ok: true });
    runDays(state, 10);
    state.nations[green]!.mana.G = 50;
    // Fertile Season is useful only on the best province: Bounty of the Loam goes to the capital.
    expect(casts(planned(state, green, planRituals))).toEqual([
      { commander: master.id, spell: 'bountyOfTheLoam', target: capital },
    ]);
  });
});

describe('planRituals at war', () => {
  /** Red at war: Thornwood owns two provinces next to Red's. */
  function redAtWar() {
    const field = redField();
    const { state, red, green, capital } = field;
    const roles = casters(state, red);
    const [a, b] = neighbors(state, capital) as [ProvinceId, ProvinceId];
    const near = annex(state, green, a);
    const far = annex(state, green, b);
    near.pop = 9000;
    far.pop = 12_000;
    return { ...field, ...roles, near, far };
  }

  it('summons with the cheapest ritual, by the researcher that studies least', () => {
    const { state, red, first } = redAtWar();
    const plan = planned(state, red, planRituals);
    expect(atWar(plan)).toBe(true);
    expect(casts(plan)).toEqual([{ commander: first.id, spell: 'callFireSprites', target: null }]);
  });

  it('strikes the most populous front province free of own commanders when summons cannot', () => {
    const { state, red, green, capital, first, master, near, far } = redAtWar();
    // Neither caster can lead five more troops.
    first.squads.push(createSquad(state, 'ashMilitia', 10));
    master.squads.push(createSquad(state, 'ashMilitia', 20));
    // A more populous enemy province deeper in, within the ritual's reach, is no front.
    const deep = neighbors(state, far.id).find(
      (p) => p !== capital && !neighbors(state, capital).includes(p),
    )!;
    annex(state, green, deep).pop = 20_000;
    expect(casts(planned(state, red, planRituals))).toEqual([
      { commander: master.id, spell: 'burnTheFields', target: far.id },
    ]);
    addArmy(state, red, far.id, 'ashMilitia', 5);
    expect(casts(planned(state, red, planRituals))).toEqual([
      { commander: master.id, spell: 'burnTheFields', target: near.id },
    ]);
  });

  it('counts an enemy army next door as war, but not a hidden scout', () => {
    const { state, red, green, capital } = redField();
    const next = neighbors(state, capital)[0]!;
    const scout = createCommander(state, 'thornScout', green, next);
    expect(atWar(createPlan(state, red))).toBe(false);
    removeCommander(state, scout.id);
    addArmy(state, green, next, 'warden', 10, 'wardenCaptain');
    expect(atWar(createPlan(state, red))).toBe(true);
  });
});

describe('planRituals casters', () => {
  it('runs one ritual at a time and keeps a researcher studying', () => {
    const { state, red, capital } = redField();
    const { first, master } = casters(state, red);
    const [rider] = splitMages(createPlan(state, red)).battleMages;
    master.order = { kind: 'castRitual', spellId: 'forgeOfCinders', target: null, daysLeft: 4 };
    expect(casts(planned(state, red, planRituals))).toEqual([]);
    // With a single researcher, it studies: no ritual.
    master.order = { kind: 'idle' };
    removeCommander(state, rider!.id);
    removeCommander(state, first.id);
    expect(splitMages(createPlan(state, red)).researchers.map((c) => c.id)).toEqual([master.id]);
    expect(ritualCasters(createPlan(state, red))).toEqual([]);
    // An immobile pretender, which cannot research, casts alone.
    const monolith = createCommander(state, 'livingMonolith', red, capital);
    monolith.pips = { R: 3 };
    state.nations[red]!.pretenderId = monolith.id;
    expect(casts(planned(state, red, planRituals))).toEqual([
      { commander: monolith.id, spell: 'forgeOfCinders', target: null },
    ]);
  });

  it('begins no ritual while one is under way, whoever else could cast', () => {
    // A third researcher, a second master mage: with the first master casting, it could begin
    // another and leave the first mage studying.
    const { state, red, capital } = redField();
    const { master } = casters(state, red);
    while (splitMages(createPlan(state, red)).researchers.length < 3) {
      createCommander(state, 'cinderMagus', red, capital).pips = { R: 4 };
    }
    const third = state.commanders[splitMages(createPlan(state, red)).researchers[2]!.id]!;
    third.pips = { R: 4 };
    master.order = { kind: 'castRitual', spellId: 'forgeOfCinders', target: null, daysLeft: 4 };
    expect(ritualCasters(createPlan(state, red)).map((c) => c.id)).toContain(third.id);
    expect(casts(planned(state, red, planRituals))).toEqual([]);
  });

  it('casts with the Living Monolith before the researchers', () => {
    const { state, red, capital } = redField();
    const { first, master } = casters(state, red);
    const monolith = createCommander(state, 'livingMonolith', red, capital);
    monolith.pips = { R: 3 };
    state.nations[red]!.pretenderId = monolith.id;
    expect(ritualCasters(createPlan(state, red)).map((c) => c.id)).toEqual([
      monolith.id,
      first.id,
      master.id,
    ]);
    expect(casts(planned(state, red, planRituals))).toEqual([
      { commander: monolith.id, spell: 'forgeOfCinders', target: null },
    ]);
  });

  it('casts only with casters standing in the capital lab', () => {
    const { state, red, capital } = redField();
    const { first, master } = casters(state, red);
    const away = annex(state, red, neighbors(state, capital)[0]!).id;
    master.location = away;
    first.location = away;
    expect(ritualCasters(createPlan(state, red))).toEqual([]);
  });
});

describe('a summoning druid', () => {
  it('casts Call of the Wild twice and researches between and after the casts', () => {
    const { state, red, green } = redField();
    const capital = state.nations[green]!.capital;
    annex(state, red, neighbors(state, capital)[0]!);
    const druid = unitIn(state, capital, 'saplingDruid');
    const other = createCommander(state, 'saplingDruid', green, capital);
    const holder = state.commanders[state.provinces[capital]!.garrison!]!;
    const steps: Player = (s, nation) => {
      const plan = createPlan(s, nation);
      planRecruitment(plan);
      planResearch(plan);
      planRituals(plan);
      return plan.out;
    };
    // Mana for one cast at a time: twice Call of the Wild's 2 Green on cast days, too little between.
    const pools = [4, 1, 4, 1];
    const orders: string[] = [];
    for (const g of pools) {
      for (let d = 0; d < 5; d++) {
        if (d === 4) state.nations[green]!.mana.G = g;
        expect(playDay(state, steps).refused).toEqual([]);
      }
      orders.push(druid.order.kind);
      expect(other.order.kind).toBe('research');
    }
    expect(orders).toEqual(['castRitual', 'research', 'castRitual', 'research']);
    // Both packs of wolves went to the garrison.
    expect(druid.squads).toEqual([]);
    expect(holder.squads.find((s) => s.unit === 'wolf')?.count).toBe(12);
  });
});

describe('carried mana', () => {
  /** Red with Warcry known (Red level 2) and a battle mage in its capital lab. */
  function warcryRed() {
    const field = redField();
    const { state, red, capital } = field;
    state.nations[red]!.research.points.R = 150;
    const researcher = unitIn(state, capital, 'emberAdept');
    const rider = createCommander(state, 'emberAdept', red, capital);
    state.nations[red]!.mana.R = 10;
    return { ...field, researcher, rider };
  }

  function gifts(plan: Plan) {
    return plan.out.filter((c) => c.type === 'giveMana');
  }

  it('gives a battle mage the colors its spells use, up to the cap, half the pool at most', () => {
    const { state, red, rider } = warcryRed();
    let plan = planned(state, red, planResearch);
    expect(carriedColors(plan, plan.copy.commanders[rider.id]!)).toEqual(['R']);
    expect(gifts(plan)).toEqual([
      { type: 'giveMana', nation: red, commander: rider.id, color: 'R', amount: AI.carriedMana },
    ]);
    applyAll(state, plan);
    expect(rider.carriedMana).toEqual({ R: AI.carriedMana });
    expect(gifts(planned(state, red, planResearch))).toEqual([]);
    // One carried, a pool of 3: one more, leaving 2 of 3.
    rider.carriedMana = { R: 1 };
    state.nations[red]!.mana.R = 3;
    plan = planned(state, red, planResearch);
    expect(gifts(plan)).toEqual([
      { type: 'giveMana', nation: red, commander: rider.id, color: 'R', amount: 1 },
    ]);
    state.nations[red]!.mana.R = 1;
    expect(gifts(planned(state, red, planResearch))).toEqual([]);
  });

  it('gives nothing before a spell needs it, to researchers, or outside a lab', () => {
    const { state, red, capital, rider } = warcryRed();
    state.nations[red]!.research.points.R = 60;
    expect(gifts(planned(state, red, planResearch))).toEqual([]);
    state.nations[red]!.research.points.R = 150;
    // Out of the lab the battle mage gets nothing, and the researcher in it nothing either.
    rider.location = annex(state, red, neighbors(state, capital)[0]!).id;
    expect(gifts(planned(state, red, planResearch))).toEqual([]);
    const plan = createPlan(state, red);
    planCarriedMana(plan, [plan.copy.commanders[rider.id]!]);
    expect(plan.out).toEqual([]);
  });

  it('lets the battle mage cast Warcry in battle with what it carries', () => {
    const { state, red, capital, army, rider } = warcryRed();
    applyAll(state, planned(state, red, planResearch));
    expect(rider.carriedMana.R).toBe(AI.carriedMana);
    const target = neighbors(state, capital)[0]!;
    for (const c of Object.values(state.commanders)) {
      if (c.owner === null && c.location === target) removeCommander(state, c.id);
    }
    addArmy(state, null, target, 'ashMilitia', 5, 'independentCaptain');
    expect(move(state, red, [army, rider], [target])).toEqual({ ok: true });
    for (let d = 0; d < 10 && !state.battles.some((b) => b.province === target); d++) {
      runDays(state, 1);
    }
    const battle = state.battles.find((b) => b.province === target);
    expect(battle).toBeDefined();
    const cast = battle!.replay.find(
      (e) => e.kind === 'cast' && e.caster === rider.id && e.spellId === 'warcry',
    );
    expect(cast).toBeDefined();
    if (state.commanders[rider.id]) expect(rider.carriedMana.R).toBeLessThan(AI.carriedMana);
  });
});
