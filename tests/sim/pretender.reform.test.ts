// N8, reform after death (docs/05-pretender.md decisions, "Death and reform"; the 2026-10-21
// pretender build spec, A.5): an Ash Phoenix that dies in a province its nation dominates rises
// again at the capital 90 days later, by the arrival rules; anywhere else it dies for good, as
// every other pretender does.
import { describe, expect, it } from 'vitest';
import { unitDef } from '../../src/content';
import type { PretenderDesign } from '../../src/content/pretenders/types';
import { blessOf, nationBless } from '../../src/sim/bless';
import { commanderDies, defaultScript } from '../../src/sim/commanders';
import { engage } from '../../src/sim/conflict';
import { stateHash } from '../../src/sim/hash';
import type { NationId } from '../../src/sim/ids';
import { MIGRATIONS, migrateState } from '../../src/sim/migrate';
import { settlePretender } from '../../src/sim/pretender';
import { advance } from '../../src/sim/tick';
import { STATE_VERSION, type CommanderState, type GameState } from '../../src/sim/types';
import {
  addArmy,
  independentProvince,
  nationIds,
  neighbors,
  pretender,
  twoNationGame,
} from './fixtures';

/** An awake Ash Phoenix R5 with the incarnate Flaming Weapons. */
const PHOENIX: PretenderDesign = pretender({
  chassis: 'ashPhoenix',
  pips: { R: 5 },
  dominion: 2,
  awakening: 'awake',
  blessings: ['flamingWeapons'],
});

function phoenixGame(name: string | null = 'Ysolde') {
  const state = twoNationGame(4, { pretender: PHOENIX, ...(name ? { pretenderName: name } : {}) });
  const [red, green] = nationIds(state) as [NationId, NationId];
  const nation = state.nations[red]!;
  return { state, red, green, nation, capital: nation.capital };
}

function godOf(state: GameState, nation: NationId): CommanderState | undefined {
  const id = state.nations[nation]!.pretenderId;
  return id === null ? undefined : state.commanders[id];
}

/** Advances the game to `day`, the tick of `day` not yet run. */
function runTo(state: GameState, day: number): void {
  while (state.day < day) advance(state);
}

describe('reform after death (N8)', () => {
  it('waits 90 days after dying in its own dominion, then rises at the capital', () => {
    const { state, red, nation, capital } = phoenixGame();
    runTo(state, 10);
    const first = godOf(state, red)!;
    first.hp = 7;
    first.pips = {};
    commanderDies(state, first.id);
    expect(nation).toMatchObject({
      pretenderId: null,
      pretenderDead: false,
      pretenderReturnDay: 100,
    });
    expect(state.messages.at(-1)).toMatchObject({
      nation: red,
      kind: 'info',
      text: 'Ysolde will rise again in 90 days.',
    });
    runTo(state, 100);
    expect(nation.pretenderId).toBeNull();
    advance(state);
    const risen = godOf(state, red)!;
    // A fresh commander: full HP, the design's pips, the default script, the god's name.
    expect(risen.id).not.toBe(first.id);
    expect(risen).toMatchObject({
      unit: 'ashPhoenix',
      name: 'Ysolde',
      location: capital,
      hp: unitDef('ashPhoenix').hp,
      pips: { R: 5 },
      squads: [],
      transit: null,
    });
    expect(risen.script).toEqual(defaultScript(unitDef('ashPhoenix'), { R: 5 }, 0));
    expect(nation.pretenderReturnDay).toBeNull();
    const where = state.map.provinces[capital]!.name;
    const texts = state.messages.filter((m) => m.nation === red).map((m) => m.text);
    const rising = state.messages.find((m) => m.text === `Ysolde rises again in ${where}.`);
    // Like the arrival message it replaces, it links the capital.
    expect(rising && [rising.nation, rising.kind, rising.province, rising.day]).toEqual([
      red,
      'info',
      capital,
      100,
    ]);
    // The rising replaces the arrival message: "stands in" was posted once, on day 0.
    expect(texts.filter((t) => t.includes(' stands in '))).toHaveLength(1);
  });

  it('takes its body’s name when the god has none', () => {
    const { state, red } = phoenixGame(null);
    commanderDies(state, godOf(state, red)!.id);
    expect(state.messages.at(-1)!.text).toBe('Ash Phoenix will rise again in 90 days.');
  });

  it('counts dominion at strength 1 where it dies; in foreign or neutral dominion it is gone', () => {
    const cases = [
      { own: true, strength: 1, reforms: true },
      { own: true, strength: 0, reforms: false },
      { own: false, strength: 6, reforms: false },
      { own: null, strength: 0, reforms: false },
    ];
    for (const c of cases) {
      const { state, red, green, nation } = phoenixGame();
      const god = godOf(state, red)!;
      const wild = independentProvince(state);
      god.location = wild.id;
      const owner = c.own === null ? null : c.own ? red : green;
      wild.dominion = { nation: owner, strength: c.strength };
      commanderDies(state, god.id);
      expect(nation.pretenderDead, JSON.stringify(c)).toBe(!c.reforms);
      expect(nation.pretenderReturnDay, JSON.stringify(c)).toBe(c.reforms ? state.day + 90 : null);
      runTo(state, 120);
      expect(godOf(state, red) !== undefined, JSON.stringify(c)).toBe(c.reforms);
    }
  });

  it('reforms only the chassis that has it: a Titan dying at home is gone for good', () => {
    const titan = pretender({ chassis: 'titan', pips: { R: 4 }, dominion: 2, awakening: 'awake' });
    const state = twoNationGame(4, { pretender: titan });
    const red = nationIds(state)[0]!;
    commanderDies(state, godOf(state, red)!.id);
    expect(state.nations[red]).toMatchObject({ pretenderDead: true, pretenderReturnDay: null });
  });

  it('dies in a lost battle in its own dominion and rises again', () => {
    const { state, red, nation, capital } = phoenixGame();
    const god = godOf(state, red)!;
    const target = neighbors(state, capital).find(
      (n) => state.provinces[n]!.owner === null && guardsIn(state, n) > 0,
    )!;
    god.location = target;
    god.cameFrom = capital;
    // It flies into the guards' spears with one hit point left.
    god.hp = 1;
    god.script = god.script.map(() => ({ kind: 'attack' as const }));
    state.provinces[target]!.dominion = { nation: red, strength: 2 };
    engage(state, red, target);
    const record = state.battles.at(-1)!;
    expect(record.replay.some((e) => e.kind === 'death')).toBe(true);
    expect(state.commanders[god.id]).toBeUndefined();
    expect(nation).toMatchObject({ pretenderDead: false, pretenderReturnDay: state.day + 90 });
  });

  it('waits while the nation is Godless or its capital is lost, then returns', () => {
    const { state, red, green, nation, capital } = phoenixGame();
    commanderDies(state, godOf(state, red)!.id);
    nation.godless = true;
    state.provinces[capital]!.owner = green;
    state.day = 95;
    settlePretender(state, red);
    expect(nation.pretenderId).toBeNull();
    nation.godless = false;
    settlePretender(state, red);
    expect(nation.pretenderId).toBeNull();
    expect(nation.pretenderReturnDay).toBe(90);
    state.provinces[capital]!.owner = red;
    settlePretender(state, red);
    expect(godOf(state, red)).toMatchObject({ unit: 'ashPhoenix', location: capital });
    expect(nation.pretenderReturnDay).toBeNull();
  });

  it('reforms again after a second death', () => {
    const { state, red, nation } = phoenixGame();
    commanderDies(state, godOf(state, red)!.id);
    runTo(state, 91);
    const second = godOf(state, red)!;
    commanderDies(state, second.id);
    expect(nation.pretenderReturnDay).toBe(181);
    runTo(state, 182);
    expect(godOf(state, red)).toMatchObject({ unit: 'ashPhoenix', name: 'Ysolde' });
  });

  it('lets incarnate blessings lapse while it is away', () => {
    const { state, red } = phoenixGame();
    expect(nationBless(state, red).meleeDmg).toBe(3);
    commanderDies(state, godOf(state, red)!.id);
    expect(nationBless(state, red)).toEqual(blessOf(PHOENIX, false));
    expect(nationBless(state, red).meleeDmg).toBe(0);
    runTo(state, 91);
    expect(nationBless(state, red).meleeDmg).toBe(3);
  });

  it('standing when its nation falls, dies with it for good: no promise, nothing to cancel', () => {
    const { state, red, nation } = phoenixGame();
    for (const p of Object.values(state.provinces)) if (p.owner === red) p.owner = null;
    advance(state);
    expect(nation).toMatchObject({
      eliminated: true,
      pretenderId: null,
      pretenderDead: true,
      pretenderReturnDay: null,
    });
    expect(state.messages.some((m) => m.text.includes('rise again'))).toBe(false);
  });

  it('falling in the storm of its last fort, is promised a return and then told it is cancelled', () => {
    const { state, red, green, nation, capital } = phoenixGame();
    const god = godOf(state, red)!;
    // The Phoenix alone, at 1 HP, holds Cinder Horde's only fort, under its own dominion, against
    // 60 Wardens storming through broken walls: one tick kills it and eliminates its nation.
    for (const c of Object.values(state.commanders)) {
      if (c.owner === red && c !== god) c.squads = [];
    }
    state.provinces[capital]!.pd = 0;
    state.provinces[capital]!.dominion = { nation: red, strength: 5 };
    god.hp = 1;
    addArmy(state, green, capital, 'warden', 60, 'wardenCaptain');
    state.provinces[capital]!.siege = { attacker: green, wallHp: 0, storm: true };
    advance(state);
    expect(state.commanders[god.id]).toBeUndefined();
    expect(nation).toMatchObject({
      eliminated: true,
      pretenderId: null,
      pretenderDead: true,
      pretenderReturnDay: null,
    });
    expect(state.result).toMatchObject({ day: 0, winner: green, reason: 'lastCapital' });
    // The storm (tick step 2) promises the return before the elimination (step 7) cancels it,
    // just before the fall.
    const texts = state.messages.filter((m) => m.nation === red).map((m) => m.text);
    const promise = texts.indexOf('Ysolde will rise again in 90 days.');
    const cancel = texts.indexOf('Ysolde will not rise again.');
    const fall = texts.indexOf('Cinder Horde has fallen.');
    expect(promise).toBeGreaterThanOrEqual(0);
    expect([cancel > promise, fall]).toEqual([true, cancel + 1]);
    expect(state.messages.filter((m) => m.text.includes('will not rise'))).toHaveLength(1);
  });

  it('reforming when its nation falls, is gone for good, with the return cancelled', () => {
    const { state, red, nation } = phoenixGame(null);
    commanderDies(state, godOf(state, red)!.id);
    runTo(state, 40);
    for (const p of Object.values(state.provinces)) if (p.owner === red) p.owner = null;
    advance(state);
    expect(nation).toMatchObject({
      eliminated: true,
      pretenderDead: true,
      pretenderReturnDay: null,
    });
    const told = state.messages.filter((m) => m.nation === red && m.day === 40);
    const cancel = told.findIndex((m) => m.text === 'Ash Phoenix will not rise again.');
    expect(told[cancel]?.kind).toBe('info');
    expect(told[cancel + 1]?.text).toBe('Cinder Horde has fallen.');
    // The game is over; even on the day it would have risen, it does not.
    state.day = 120;
    settlePretender(state, red);
    expect(godOf(state, red)).toBeUndefined();
  });

  it('keeps its return day through a save and load, with no new save version', () => {
    const { state, red } = phoenixGame();
    commanderDies(state, godOf(state, red)!.id);
    const loaded = migrateState(JSON.parse(JSON.stringify(state)) as GameState);
    expect(loaded.nations[red]!.pretenderReturnDay).toBe(90);
    expect(stateHash(loaded)).toBe(stateHash(state));
    // The field came with Phase 6b.1's step to version 3, which gives older saves null.
    expect(STATE_VERSION).toBe(3);
    expect(MIGRATIONS[3]).toBeUndefined();
    const old = JSON.parse(JSON.stringify(phoenixGame().state)) as GameState;
    old.version = 2;
    for (const n of Object.values(old.nations)) {
      const o: Partial<typeof n> = n;
      delete o.pretenderReturnDay;
      delete o.pretenderName;
    }
    for (const p of Object.values(old.provinces)) {
      const o: Partial<typeof p> = p;
      delete o.extraSprings;
    }
    for (const n of Object.values(migrateState(old).nations)) {
      expect(n.pretenderReturnDay).toBeNull();
    }
  });
});

/** Independent troops standing in a province. */
function guardsIn(state: GameState, province: string): number {
  return Object.values(state.commanders)
    .filter((c) => c.owner === null && c.location === province)
    .reduce((sum, c) => sum + c.squads.reduce((n, s) => n + s.count, 0), 0);
}
