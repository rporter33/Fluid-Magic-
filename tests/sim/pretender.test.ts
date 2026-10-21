// The pretender (docs/05-pretender.md steps 1 to 5, "Presets", "Implementation decisions";
// docs/01-core-rules.md section 12 Godless and the Phase 4 "Retreat" and "Deaths" decisions):
// design prices and budgets, validation, arrival by awakening, Godless recall and return,
// research, and the immobile Living Monolith.
import { describe, expect, it } from 'vitest';
import { nationDef } from '../../src/content';
import { CHASSIS } from '../../src/content/pretenders/chassis';
import { PRESETS } from '../../src/content/pretenders/presets';
import { NEUTRAL_SCALES, type Scales } from '../../src/content/pretenders/scales';
import type { Awakening, PretenderDesign } from '../../src/content/pretenders/types';
import { applyCommand, validateCommand } from '../../src/sim/commands';
import { commanderDies, createSquad, removeCommander } from '../../src/sim/commanders';
import { engage } from '../../src/sim/conflict';
import type { NationId, ProvinceId } from '../../src/sim/ids';
import {
  basePips,
  designBudget,
  designCost,
  pipStepCost,
  scaleStepCost,
  settlePretender,
  validatePretender,
} from '../../src/sim/pretender';
import { canResearch } from '../../src/sim/research';
import { advance } from '../../src/sim/tick';
import type { CommanderState, GameState } from '../../src/sim/types';
import {
  addArmy,
  annex,
  commandersIn,
  move,
  nationIds,
  neighbors,
  pretender,
  runDays,
  twoNationGame,
} from './fixtures';

const RED = nationDef('cinderHorde');
const GREEN = nationDef('thornwood');

/** A design: neutral scales, awake, unless overridden. */
function design(overrides: Partial<PretenderDesign>): PretenderDesign {
  return pretender({ awakening: 'awake', ...overrides });
}

function scales(s: Partial<Scales>): Scales {
  return { ...NEUTRAL_SCALES, ...s };
}

/** Titan R4 at base dominion: 120 + 20 + 25 + 30 = 195 for Cinder Horde. */
const TITAN_R4 = design({ chassis: 'titan', pips: { R: 4 }, dominion: 2 });
const MONOLITH = design({ chassis: 'livingMonolith', pips: {}, dominion: 4 });

/** A game where Cinder Horde's pretender has this design. */
function redWith(d: PretenderDesign, seed = 1) {
  const state = twoNationGame(seed, { pretender: d });
  const [red, green] = nationIds(state) as [NationId, NationId];
  return { state, red, green, capital: state.nations[red]!.capital };
}

function godOf(state: GameState, nation: NationId): CommanderState | undefined {
  const id = state.nations[nation]!.pretenderId;
  return id === null ? undefined : state.commanders[id];
}

function arrivals(state: GameState, nation: NationId) {
  return state.messages.filter(
    (m) => m.nation === nation && m.kind === 'info' && / stands in /.test(m.text),
  );
}

/** Troops of a unit type across a nation's commanders. */
function troops(state: GameState, nation: NationId, unit: string): number {
  let n = 0;
  for (const c of Object.values(state.commanders)) {
    if (c.owner !== nation) continue;
    for (const s of c.squads) if (s.unit === unit) n += s.count;
  }
  return n;
}

describe('design costs', () => {
  it('a mono-color pretender reaches 4 pips for 115 points, then 35 and 40', () => {
    const steps = [1, 2, 3, 4, 5, 6].map((l) => pipStepCost(RED, CHASSIS.titan, 'R', l));
    expect(steps).toEqual([40, 20, 25, 30, 35, 40]);
    expect(steps.slice(0, 4).reduce((a, b) => a + b, 0)).toBe(115);
    expect(pipStepCost(RED, CHASSIS.titan, 'R', 7)).toBe(Infinity);
  });

  it('opening a color outside the nation costs 60, so a second color at 2 pips costs 80', () => {
    expect(pipStepCost(RED, CHASSIS.titan, 'G', 1)).toBe(60);
    expect(pipStepCost(RED, CHASSIS.titan, 'G', 2)).toBe(20);
    expect(pipStepCost(RED, CHASSIS.titan, 'G', 3)).toBe(25);
    // Green is Thornwood's own color, Red is new to it.
    expect(pipStepCost(GREEN, CHASSIS.titan, 'G', 1)).toBe(40);
    expect(pipStepCost(GREEN, CHASSIS.titan, 'R', 1)).toBe(60);
    const titanR1G2 = design({ chassis: 'titan', pips: { R: 1, G: 2 }, dominion: 2 });
    expect(designCost(RED, titanR1G2)).toBe(120 + 80);
  });

  it('the Oracle pays 10 less for every pip', () => {
    const steps = [1, 2, 3, 4, 5, 6].map((l) => pipStepCost(RED, CHASSIS.oracle, 'R', l));
    expect(steps).toEqual([30, 10, 15, 20, 25, 30]);
    expect(pipStepCost(RED, CHASSIS.oracle, 'G', 1)).toBe(50);
    expect(designCost(RED, design({ chassis: 'oracle', pips: { R: 6 }, dominion: 1 }))).toBe(
      20 + 130,
    );
  });

  it('base pips are free: their color comes from the nation or the chassis', () => {
    expect(basePips(RED, CHASSIS.titan)).toEqual({ R: 1 });
    expect(basePips(GREEN, CHASSIS.titan)).toEqual({ G: 1 });
    expect(basePips(RED, CHASSIS.greatWyrm)).toEqual({ R: 2 });
    expect(basePips(RED, CHASSIS.wildSpirit)).toEqual({ G: 1 });
    expect(basePips(GREEN, CHASSIS.ashColossus)).toEqual({ R: 1 });
    expect(basePips(RED, CHASSIS.oracle)).toEqual({});
    expect(basePips(RED, CHASSIS.livingMonolith)).toEqual({});

    expect(designCost(RED, TITAN_R4)).toBe(195);
    expect(designCost(GREEN, design({ chassis: 'titan', pips: { G: 4 }, dominion: 2 }))).toBe(195);
    expect(designCost(RED, design({ chassis: 'titan', pips: { R: 1 }, dominion: 2 }))).toBe(120);
    expect(designCost(RED, design({ chassis: 'greatWyrm', pips: { R: 3 }, dominion: 2 }))).toBe(
      220 + 25,
    );
    // A Wild Spirit's free G pip makes Green's second pip a level-2 step even for Cinder Horde.
    expect(designCost(RED, design({ chassis: 'wildSpirit', pips: { G: 2 }, dominion: 2 }))).toBe(
      80 + 20,
    );
    expect(
      designCost(RED, design({ chassis: 'wildSpirit', pips: { G: 1, R: 1 }, dominion: 2 })),
    ).toBe(80 + 40);
    expect(designCost(RED, design({ chassis: 'oracle', pips: {}, dominion: 1 }))).toBe(20);
    expect(designCost(RED, MONOLITH)).toBe(60);
  });

  it('dominion costs 30 per point above the chassis base', () => {
    for (let d = 2; d <= 10; d++) {
      const titan = design({ chassis: 'titan', pips: { R: 1 }, dominion: d });
      expect(designCost(RED, titan)).toBe(120 + 30 * (d - 2));
    }
    expect(designCost(RED, design({ chassis: 'oracle', pips: {}, dominion: 5 }))).toBe(20 + 120);
    expect(designCost(RED, design({ chassis: 'livingMonolith', pips: {}, dominion: 7 }))).toBe(
      60 + 90,
    );
  });

  it('a scale step costs 20 toward a pole of the nation color and 40 otherwise', () => {
    expect(scaleStepCost(RED, 'order', 'negative')).toBe(20); // Turmoil, R
    expect(scaleStepCost(RED, 'lore', 'negative')).toBe(20); // Fury, R
    expect(scaleStepCost(RED, 'order', 'positive')).toBe(40); // Order, W
    expect(scaleStepCost(RED, 'lore', 'positive')).toBe(40); // Lore, U
    expect(scaleStepCost(RED, 'growth', 'positive')).toBe(40); // Growth, G
    expect(scaleStepCost(GREEN, 'growth', 'positive')).toBe(20);
    expect(scaleStepCost(GREEN, 'wild', 'positive')).toBe(20);
    expect(scaleStepCost(GREEN, 'growth', 'negative')).toBe(40); // Rot, B
    expect(scaleStepCost(GREEN, 'wild', 'negative')).toBe(40); // Artifice, U
    expect(scaleStepCost(GREEN, 'order', 'negative')).toBe(40); // Turmoil, R
  });

  it('every scale step from 0 counts, in both directions', () => {
    const titan = (s: Partial<Scales>) =>
      designCost(RED, design({ chassis: 'titan', pips: { R: 1 }, dominion: 2, scales: scales(s) }));
    expect(titan({})).toBe(120);
    expect(titan({ order: -1 })).toBe(140);
    expect(titan({ order: -2 })).toBe(160);
    expect(titan({ order: -3 })).toBe(180);
    expect(titan({ order: 3 })).toBe(240);
    expect(titan({ order: -3, lore: -3 })).toBe(240);
    expect(titan({ order: 1, lore: -1, sanctity: -2 })).toBe(120 + 40 + 20 + 80);
  });

  it('the budget is 400, plus 150 dormant or 350 imprisoned', () => {
    const budgets = (['awake', 'dormant', 'imprisoned'] as const).map(designBudget);
    expect(budgets).toEqual([400, 550, 750]);
  });

  it('an unknown chassis costs Infinity', () => {
    expect(designCost(RED, design({ chassis: 'dragon' }))).toBe(Infinity);
  });

  it('every preset is priced exactly and fits its budget', () => {
    const priced = PRESETS.map((p) => [p.id, designCost(nationDef(p.nation), p.design)]);
    expect(priced).toEqual([
      ['warlord', 385],
      ['emberOracle', 280],
      ['wildfire', 415],
      ['elderOak', 385],
      ['deepRoot', 395],
      ['wyrmOfTheLoam', 375],
    ]);
    for (const p of PRESETS) {
      expect(validatePretender(nationDef(p.nation), p.design), p.id).toBeNull();
    }
  });
});

describe('validatePretender', () => {
  it('accepts a design inside every limit', () => {
    expect(validatePretender(RED, TITAN_R4)).toBeNull();
    const titanR6 = design({ chassis: 'titan', pips: { R: 6 }, dominion: 2 });
    expect(validatePretender(RED, titanR6)).toBeNull();
    const plainOracle = design({ chassis: 'oracle', pips: { R: 0 }, dominion: 1 });
    expect(validatePretender(RED, plainOracle)).toBeNull();
  });

  it('refuses an unknown chassis or awakening', () => {
    expect(validatePretender(RED, design({ chassis: 'dragon' }))).toBe('Unknown chassis dragon');
    const asleep: string = 'asleep';
    expect(validatePretender(RED, { ...TITAN_R4, awakening: asleep as Awakening })).toBe(
      'Unknown awakening',
    );
  });

  it('refuses pips outside 0 to 6, fractional pips, and unknown colors', () => {
    const PIPS = 'Pips must be 0 to 6 per color';
    const titan = (pips: PretenderDesign['pips']) => validatePretender(RED, { ...TITAN_R4, pips });
    expect(titan({ R: 7 })).toBe(PIPS);
    expect(titan({ R: 1, G: -1 })).toBe(PIPS);
    expect(titan({ R: 1.5 })).toBe(PIPS);
    expect(titan({ R: 1, ...Object.fromEntries([['X', 1]]) })).toBe(PIPS);
  });

  it('refuses fewer pips than the chassis comes with', () => {
    expect(validatePretender(RED, { ...TITAN_R4, pips: {} })).toBe('Titan comes with 1 R pips');
    expect(validatePretender(RED, { ...TITAN_R4, pips: { G: 1 } })).toBe(
      'Titan comes with 1 R pips',
    );
    expect(validatePretender(GREEN, { ...TITAN_R4, pips: { G: 1 } })).toBeNull();
    expect(validatePretender(RED, { ...TITAN_R4, chassis: 'greatWyrm', pips: { R: 1 } })).toBe(
      'Great Wyrm comes with 2 R pips',
    );
    // The Wild Spirit's pip is Green whatever the nation.
    const spirit = design({ chassis: 'wildSpirit', pips: { R: 1 }, dominion: 2 });
    expect(validatePretender(RED, spirit)).toBe('Wild Spirit comes with 1 G pips');
    expect(validatePretender(RED, { ...spirit, pips: { R: 1, G: 1 } })).toBeNull();
  });

  it('refuses dominion below the chassis base, above 10, or fractional', () => {
    expect(validatePretender(RED, { ...MONOLITH, dominion: 3 })).toBe('Dominion must be 4 to 10');
    expect(validatePretender(RED, { ...MONOLITH, dominion: 10 })).toBeNull();
    expect(validatePretender(RED, { ...TITAN_R4, dominion: 11 })).toBe('Dominion must be 2 to 10');
    expect(validatePretender(RED, { ...TITAN_R4, dominion: 4.5 })).toBe('Dominion must be 2 to 10');
    const oracle = design({ chassis: 'oracle', pips: {}, dominion: 1 });
    expect(validatePretender(RED, oracle)).toBeNull();
    expect(validatePretender(RED, { ...oracle, dominion: 0 })).toBe('Dominion must be 1 to 10');
  });

  it('refuses scales outside -3 to 3', () => {
    const SCALES = 'Scales run from -3 to 3';
    const titan = (s: Partial<Scales>) =>
      validatePretender(RED, { ...TITAN_R4, scales: scales(s) });
    expect(titan({ order: -3, lore: -3 })).toBeNull();
    expect(titan({ order: 4 })).toBe(SCALES);
    expect(titan({ lore: -4 })).toBe(SCALES);
    expect(titan({ growth: 0.5 })).toBe(SCALES);
  });

  it('refuses a design over budget, naming its cost and budget', () => {
    // Titan R5 at dominion 7 with Fury 1: 120 + (20 + 25 + 30 + 35) + 150 + 20 = 400, the budget.
    const exact = design({
      chassis: 'titan',
      pips: { R: 5 },
      dominion: 7,
      scales: scales({ lore: -1 }),
    });
    expect(designCost(RED, exact)).toBe(400);
    expect(validatePretender(RED, exact)).toBeNull();
    const over = { ...exact, scales: scales({ lore: -2 }) };
    expect(validatePretender(RED, over)).toBe('The design costs 420 of 400 points');
    expect(validatePretender(RED, { ...over, awakening: 'dormant' })).toBeNull();
    expect(validatePretender(RED, { ...over, awakening: 'imprisoned' })).toBeNull();
  });

  it('holds an imprisoned design to 750', () => {
    // Great Wyrm R6, dominion 10, Turmoil 3, Fury 3, Growth 1: 220 + 130 + 240 + 120 + 40 = 750.
    const wyrm = design({
      chassis: 'greatWyrm',
      pips: { R: 6 },
      dominion: 10,
      scales: scales({ order: -3, lore: -3, growth: 1 }),
      awakening: 'imprisoned',
    });
    expect(validatePretender(RED, wyrm)).toBeNull();
    const greedy = { ...wyrm, scales: scales({ order: -3, lore: -3, growth: 2 }) };
    expect(validatePretender(RED, greedy)).toBe('The design costs 790 of 750 points');
  });

  it('makes createGame throw a RangeError for either nation', () => {
    expect(() => redWith(design({ chassis: 'dragon' }))).toThrow(RangeError);
    expect(() => redWith(design({ chassis: 'dragon' }))).toThrow('Unknown chassis dragon');
    const over = design({ chassis: 'titan', pips: { R: 6 }, dominion: 10 });
    expect(() => redWith(over)).toThrow('The design costs 510 of 400 points');
    expect(() => twoNationGame(1, {}, { pretender: { ...TITAN_R4, pips: { R: 4 } } })).toThrow(
      'Titan comes with 1 G pips',
    );
  });
});

describe('arrival', () => {
  it('an awake pretender stands in its capital on day 0 as its chassis body', () => {
    const { state, red, green, capital } = redWith(TITAN_R4);
    const god = godOf(state, red)!;
    expect(god).toMatchObject({
      unit: 'titan',
      owner: red,
      location: capital,
      transit: null,
      hp: 60,
      squads: [],
      pips: { R: 4 },
      holy: 0,
      order: { kind: 'idle' },
    });
    // It casts, since it has pips; its pips are its own copy of the design's.
    expect(god.script.every((s) => s.kind === 'cast')).toBe(true);
    expect(god.pips).not.toBe(state.nations[red]!.pretender.pips);
    expect(state.nations[red]!.pretenderDead).toBe(false);
    const name = state.map.provinces[capital]!.name;
    expect(arrivals(state, red)).toMatchObject([
      { day: 0, text: `Titan stands in ${name}.`, province: capital },
    ]);
    // Thornwood's default imprisoned Oracle is not on the map yet.
    expect(state.nations[green]!.pretenderId).toBeNull();
    expect(Object.values(state.commanders).some((c) => c.unit === 'oracle')).toBe(false);
  });

  it('arrives once, however often it is settled', () => {
    const { state, red } = redWith(TITAN_R4);
    settlePretender(state, red);
    settlePretender(state, red);
    const titans = Object.values(state.commanders).filter((c) => c.unit === 'titan');
    expect(titans.map((c) => c.id)).toEqual([state.nations[red]!.pretenderId]);
    expect(arrivals(state, red)).toHaveLength(1);
  });

  it('a dormant pretender arrives during the tick of day 330, month 12', () => {
    const dormant = design({
      chassis: 'oracle',
      pips: { R: 2 },
      dominion: 1,
      awakening: 'dormant',
    });
    const { state, red, capital } = redWith(dormant);
    runDays(state, 330);
    expect(state.day).toBe(330);
    expect(state.nations[red]!.pretenderId).toBeNull();
    expect(arrivals(state, red)).toEqual([]);
    advance(state);
    expect(godOf(state, red)).toMatchObject({ unit: 'oracle', location: capital, pips: { R: 2 } });
    expect(arrivals(state, red).map((m) => m.day)).toEqual([330]);
  });

  it('an imprisoned pretender arrives on day 1050, month 36', () => {
    const { state, red, capital } = redWith(pretender());
    state.day = 1049;
    settlePretender(state, red);
    expect(state.nations[red]!.pretenderId).toBeNull();
    state.day = 1050;
    settlePretender(state, red);
    expect(godOf(state, red)).toMatchObject({ unit: 'oracle', location: capital, holy: 0 });
  });

  it('waits until its nation holds the capital again', () => {
    const dormant = { ...TITAN_R4, awakening: 'dormant' as const };
    const { state, red, green, capital } = redWith(dormant);
    state.day = 330;
    state.provinces[capital]!.owner = green;
    settlePretender(state, red);
    expect(state.nations[red]!.pretenderId).toBeNull();
    state.provinces[capital]!.owner = null;
    settlePretender(state, red);
    expect(state.nations[red]!.pretenderId).toBeNull();
    state.day = 400;
    state.provinces[capital]!.owner = red;
    settlePretender(state, red);
    expect(godOf(state, red)).toMatchObject({ unit: 'titan', location: capital });
    expect(arrivals(state, red).map((m) => m.day)).toEqual([400]);
  });

  it('never comes to an eliminated nation', () => {
    const { state, red } = redWith({ ...TITAN_R4, awakening: 'dormant' });
    state.day = 330;
    state.nations[red]!.eliminated = true;
    settlePretender(state, red);
    expect(state.nations[red]!.pretenderId).toBeNull();
  });

  it('a dead pretender is gone for good', () => {
    const { state, red } = redWith(TITAN_R4);
    const god = godOf(state, red)!;
    commanderDies(state, god.id);
    expect(state.commanders[god.id]).toBeUndefined();
    expect(state.nations[red]).toMatchObject({ pretenderId: null, pretenderDead: true });
    settlePretender(state, red);
    runDays(state, 2);
    expect(state.nations[red]!.pretenderId).toBeNull();
    expect(Object.values(state.commanders).some((c) => c.unit === 'titan')).toBe(false);
  });
});

describe('Godless recall and return', () => {
  /** An awake Titan R4 leading five Cinder Warriors in its capital. */
  function leading() {
    const s = redWith(TITAN_R4);
    const god = godOf(s.state, s.red)!;
    god.squads.push(createSquad(s.state, 'cinderWarrior', 5));
    return { ...s, god };
  }

  it('takes the pretender off the map; its troops join another own commander there', () => {
    const { state, red, capital, god } = leading();
    const holder = state.commanders[state.provinces[capital]!.garrison!]!;
    const chief = commandersIn(state, capital).find((c) => c.unit === 'ashChieftain')!;
    const warriors = troops(state, red, 'cinderWarrior');
    state.nations[red]!.godless = true;
    settlePretender(state, red);
    expect(state.commanders[god.id]).toBeUndefined();
    // A recall is not a death: the pretender comes back.
    expect(state.nations[red]).toMatchObject({ pretenderId: null, pretenderDead: false });
    expect(chief.squads.find((s) => s.unit === 'cinderWarrior')?.count).toBe(25);
    expect(holder.squads).toEqual([]);
    expect(troops(state, red, 'cinderWarrior')).toBe(warriors);
    const note = state.messages.at(-1)!;
    expect(note).toMatchObject({
      nation: red,
      kind: 'info',
      text: 'Titan is recalled: the nation is godless.',
    });
  });

  it('gives its troops to the garrison holder when no other commander is there', () => {
    const { state, red, capital, god } = leading();
    const holder = state.commanders[state.provinces[capital]!.garrison!]!;
    for (const c of commandersIn(state, capital)) {
      if (c !== god && c !== holder) removeCommander(state, c.id);
    }
    state.nations[red]!.godless = true;
    settlePretender(state, red);
    expect(holder.squads.map((s) => [s.unit, s.count])).toEqual([['cinderWarrior', 5]]);
  });

  it('loses its troops with no commander of its own nation there', () => {
    const { state, red, green, capital, god } = leading();
    const away = neighbors(state, capital).find((n) => state.provinces[n]!.owner === null)!;
    annex(state, red, away);
    god.location = away;
    const visitor = addArmy(state, green, away, 'warden', 3, 'wardenCaptain');
    const warriors = troops(state, red, 'cinderWarrior');
    state.nations[red]!.godless = true;
    settlePretender(state, red);
    expect(state.commanders[god.id]).toBeUndefined();
    expect(troops(state, red, 'cinderWarrior')).toBe(warriors - 5);
    expect(visitor.squads.map((s) => [s.unit, s.count])).toEqual([['warden', 3]]);
  });

  it('keeps an unarrived pretender away, with no message', () => {
    const { state, red } = redWith({ ...TITAN_R4, awakening: 'dormant' });
    state.day = 330;
    state.nations[red]!.godless = true;
    const before = state.messages.length;
    settlePretender(state, red);
    expect(state.nations[red]!.pretenderId).toBeNull();
    expect(state.messages).toHaveLength(before);
    state.nations[red]!.godless = false;
    settlePretender(state, red);
    expect(godOf(state, red)?.unit).toBe('titan');
  });

  it('returns to the capital as a new commander when the faith returns', () => {
    const { state, red, capital, god } = leading();
    const away = neighbors(state, capital)[0]!;
    annex(state, red, away);
    god.location = away;
    god.hp = 10;
    state.nations[red]!.godless = true;
    settlePretender(state, red);
    state.nations[red]!.godless = false;
    settlePretender(state, red);
    const back = godOf(state, red)!;
    expect(back.id).not.toBe(god.id);
    expect(back).toMatchObject({
      unit: 'titan',
      location: capital,
      hp: 60,
      squads: [],
      pips: { R: 4 },
    });
    expect(arrivals(state, red)).toHaveLength(2);
  });

  it('goes and comes back through the daily tick', () => {
    const { state, red, capital, god } = leading();
    // Godless is settled on the last day of each month; Kharnath has a temple, so it ends then.
    state.nations[red]!.godless = true;
    advance(state);
    expect(state.commanders[god.id]).toBeUndefined();
    expect(state.nations[red]!.pretenderId).toBeNull();
    runDays(state, 29);
    expect(state.nations[red]!.godless).toBe(false);
    expect(state.nations[red]!.pretenderId).toBeNull();
    advance(state);
    expect(godOf(state, red)).toMatchObject({ unit: 'titan', location: capital });
  });
});

describe('research', () => {
  it('the Oracle researches with pips; the Titan never does', () => {
    const oracle = redWith(design({ chassis: 'oracle', pips: { R: 2 }, dominion: 1 }));
    const seer = godOf(oracle.state, oracle.red)!;
    expect(canResearch(seer)).toBe(true);
    expect(
      applyCommand(oracle.state, {
        type: 'setOrder',
        nation: oracle.red,
        commander: seer.id,
        order: 'research',
      }),
    ).toEqual({ ok: true });
    expect(seer.order).toEqual({ kind: 'research' });
    seer.pips = {};
    expect(canResearch(seer)).toBe(false);

    const titan = redWith(TITAN_R4);
    const fighter = godOf(titan.state, titan.red)!;
    expect(canResearch(fighter)).toBe(false);
    expect(
      validateCommand(titan.state, {
        type: 'setOrder',
        nation: titan.red,
        commander: fighter.id,
        order: 'research',
      }),
    ).toBe('Titan is not a mage');
  });
});

describe('the Living Monolith', () => {
  const retreating = Array.from({ length: 5 }, () => ({ kind: 'retreat' as const }));

  function guards(state: GameState, p: ProvinceId): CommanderState[] {
    return Object.values(state.commanders).filter((c) => c.owner === null && c.location === p);
  }

  it('cannot be moved, alone or in a group', () => {
    const { state, red, capital } = redWith(MONOLITH);
    const god = godOf(state, red)!;
    const chief = commandersIn(state, capital).find((c) => c.unit === 'ashChieftain')!;
    const to = neighbors(state, capital)[0]!;
    expect(move(state, red, [god], [to])).toEqual({
      ok: false,
      error: 'Living Monolith cannot move',
    });
    expect(move(state, red, [chief, god], [to])).toEqual({
      ok: false,
      error: 'Living Monolith cannot move',
    });
    expect(god).toMatchObject({ location: capital, transit: null, order: { kind: 'idle' } });
  });

  it('dies instead of retreating from a lost battle, and never returns', () => {
    const { state, red, capital } = redWith(MONOLITH);
    const god = godOf(state, red)!;
    const target = neighbors(state, capital).find(
      (n) => state.provinces[n]!.owner === null && guards(state, n).length > 0,
    )!;
    // It stands among independents it cannot hurt, beside a runner; both came from the capital,
    // which is a friendly refuge.
    god.location = target;
    god.cameFrom = capital;
    const runner = addArmy(state, red, target, 'ashMilitia', 1);
    runner.script = retreating;
    runner.cameFrom = capital;
    engage(state, red, target);
    const record = state.battles.at(-1)!;
    expect(record).toMatchObject({ province: target, attacker: red, winner: 'defender' });
    expect(record.roster.attacker.commanders.map((c) => c.unit)).toContain('livingMonolith');
    // No commander fell in the battle itself: the Monolith died for want of legs.
    expect(record.replay.filter((e) => e.kind === 'death')).toEqual([]);
    expect(runner.location).toBe(capital);
    expect(state.commanders[god.id]).toBeUndefined();
    expect(state.nations[red]).toMatchObject({ pretenderId: null, pretenderDead: true });
    settlePretender(state, red);
    expect(state.nations[red]!.pretenderId).toBeNull();
  });

  it('casts Call of the Wild from its capital', () => {
    const monolith = design({ chassis: 'livingMonolith', pips: { G: 1 }, dominion: 4 });
    const state = twoNationGame(1, {}, { pretender: monolith });
    const green = nationIds(state)[1]!;
    const god = godOf(state, green)!;
    expect(god.location).toBe(state.nations[green]!.capital);
    const cmd = {
      type: 'castRitual' as const,
      nation: green,
      commander: god.id,
      spell: 'callOfTheWild',
      target: null,
    };
    const nation = state.nations[green]!;
    // Thornwood starts at Green research level 1, but with no mana.
    expect(validateCommand(state, cmd)).not.toBeNull();
    nation.mana.G = 2;
    const points = nation.research.points.G;
    nation.research.points.G = 0;
    expect(validateCommand(state, cmd)).toBe('Call of the Wild needs level 1 research');
    nation.research.points.G = points;
    expect(validateCommand(state, cmd)).toBeNull();
    expect(applyCommand(state, cmd)).toEqual({ ok: true });
    runDays(state, 5);
    expect(god.squads.map((s) => [s.unit, s.count])).toEqual([['wolf', 6]]);
    expect(god.location).toBe(nation.capital);
  });
});
