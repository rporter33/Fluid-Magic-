// The check a save passes after its migration (docs/06-architecture.md, "Save and load";
// src/sim/validateSave.ts): nothing is wrong with games as the sim and the AI leave them; the
// three links that outlive what they name pass while well formed; anything at all can be checked
// without a throw; and the check never writes. Each missing key and color it reports is in
// validateSave.keys.test.ts, each reference in validateSave.refs.test.ts.
import { describe, expect, it } from 'vitest';
import { captureProvince } from '../../src/sim/capture';
import { createGame } from '../../src/sim/createGame';
import type { BattleId, CommanderId, NationId } from '../../src/sim/ids';
import { removeCommander } from '../../src/sim/commanders';
import { advance } from '../../src/sim/tick';
import type { GameState } from '../../src/sim/types';
import { saveProblems } from '../../src/sim/validateSave';
import { nation, twoNationGame } from './fixtures';
import { playedWithHuman, richSave, savedWithBattle } from './saveFixtures';

/** The state as a save brings it back. */
const viaJson = (state: GameState): unknown => JSON.parse(JSON.stringify(state));

describe('saveProblems on games the sim has played', () => {
  it('finds nothing wrong with new games, a recorded battle, and every kind of record', () => {
    expect(saveProblems(viaJson(twoNationGame()))).toEqual([]);
    expect(saveProblems(viaJson(twoNationGame(2, {}, {}, false)))).toEqual([]);
    expect(saveProblems(viaJson(savedWithBattle(true)))).toEqual([]);
    expect(saveProblems(viaJson(richSave().save))).toEqual([]);
  });

  // A human nation driven by the AI to day 720, checked every 30 days: 2.1 s at a load average
  // of 7 on 4 cores, so vitest's 5 s default is too close under load; 20 s.
  it('finds nothing wrong all through a year and more with a human nation’s recorded battles', () => {
    let checks = 0;
    let reruns = 0;
    let dropped = 0;
    playedWithHuman(9, 720, 30, (state) => {
      expect(saveProblems(viaJson(state)), `day ${String(state.day)}`).toEqual([]);
      checks++;
      reruns += state.battles.filter((b) => b.rerun !== null).length;
      const kept = new Set(state.battles.map((b) => b.id));
      dropped += state.messages.filter((m) => m.battle !== null && !kept.has(m.battle)).length;
    });
    expect(checks).toBeGreaterThan(20);
    expect(reruns).toBeGreaterThan(0);
    // Records are kept to BATTLE.keep, so some messages name records no longer kept.
    expect(dropped).toBeGreaterThan(0);
  }, 20_000);

  it('accepts a fallen nation’s commanders in the sightings of a nation that saw them', () => {
    const state = createGame({
      seed: 3,
      mapSize: 'medium',
      nations: [
        nation('cinderHorde'),
        nation('thornwood', { ai: { difficulty: 'normal' } }),
        nation('thornwood', { ai: { difficulty: 'easy' } }),
      ],
    });
    const [n0, , n2] = Object.keys(state.nations) as [NationId, NationId, NationId];
    const garrison = state.provinces[state.nations[n2]!.capital]!.garrison;
    const army = Object.values(state.commanders).find(
      (c) => c.owner === n2 && c.squads.length > 0 && c.id !== garrison,
    )!;
    army.location = state.nations[n0]!.capital;
    advance(state);
    expect(state.nations[n0]!.inSight).toContain(army.id);
    // n2 loses its last province; the next tick sees, then eliminates it, killing its commanders.
    for (const p of Object.values(state.provinces))
      if (p.owner === n2) captureProvince(state, p.id, null);
    advance(state);
    expect(state.nations[n2]!.eliminated).toBe(true);
    expect(state.commanders[army.id]).toBeUndefined();
    expect(state.nations[n0]!.inSight).toContain(army.id);
    expect(saveProblems(viaJson(state))).toEqual([]);
  });
});

describe('links that outlive what they name', () => {
  it('pass as well-formed ids, and fail as anything else', () => {
    const save = savedWithBattle(true);
    const [red] = Object.keys(save.nations) as [NationId];
    const message = save.messages.find((m) => m.battle !== null)!;
    const builder = Object.values(save.commanders).find(
      (c) => c.owner === red && c.unit === 'pyrePriest',
    )!;
    const capital = save.provinces[save.nations[red]!.capital]!;
    capital.construction = { building: 'lab', daysLeft: 2, nation: red, commander: builder.id };
    // What the game does to them: records dropped past BATTLE.keep, a builder dead before the
    // work ends, a sighted commander killed after the day's sightings.
    save.battles = [];
    removeCommander(save, builder.id);
    save.nations[red]!.inSight = ['c99999' as CommanderId];
    expect(saveProblems(viaJson(save))).toEqual([]);
    message.battle = 'x' as BattleId;
    capital.construction.commander = 5 as unknown as CommanderId;
    save.nations[red]!.inSight = ['b1' as CommanderId];
    expect(saveProblems(viaJson(save)).map((p) => [p.kind, p.text])).toEqual([
      ['reference', `provinces.${capital.id}.construction.commander 5 is no commander id`],
      ['reference', `nations.${red}.inSight[0] "b1" is no commander id`],
      [
        'reference',
        `messages[${String(save.messages.indexOf(message))}].battle "x" is no battle id`,
      ],
    ]);
  });
});

describe('saveProblems on anything', () => {
  it('never throws, and says what is missing', () => {
    expect(saveProblems(undefined)).toEqual([{ kind: 'shape', text: 'the save is empty' }]);
    for (const junk of [null, 42, 'save', [], [1, 2]]) {
      expect(saveProblems(junk), JSON.stringify(junk)).toEqual([
        { kind: 'shape', text: 'the save is not a record' },
      ]);
    }
    const empty = saveProblems({});
    expect(empty.map((p) => p.text)).toEqual(
      [
        'version',
        'seed',
        'rng',
        'nextId',
        'day',
        'map',
        'provinces',
        'nations',
        'commanders',
        'battles',
        'messages',
        'provinceEffects',
        'result',
      ].map((key) => `the save has no ${key}`),
    );
    const wrong = {
      ...(viaJson(savedWithBattle()) as object),
      map: 5,
      provinces: [],
      nations: 'nations',
      commanders: { c1: null, c2: [] },
      battles: {},
      messages: [7, null],
      provinceEffects: [{ kind: 'flood' }],
    };
    expect(saveProblems(wrong).map((p) => p.text)).toEqual([
      'map is not a record',
      'provinces is not a record',
      'nations is not a record',
      'commanders.c1 is not a record',
      'commanders.c2 is not a record',
      'battles is not a list',
      'messages[0] is not a record',
      'messages[1] is not a record',
      'provinceEffects[0] has no known kind ("flood")',
    ]);
  });

  it('only reads: the save is as it was, key for key', () => {
    const save = viaJson(richSave().save) as GameState;
    const before = JSON.stringify(save);
    saveProblems(save);
    Reflect.deleteProperty(save.map, 'wilds');
    const damaged = JSON.stringify(save);
    expect(saveProblems(save)).toContainEqual({ kind: 'shape', text: 'map has no wilds' });
    expect(JSON.stringify(save)).toBe(damaged);
    expect(before).not.toBe(damaged);
  });
});
