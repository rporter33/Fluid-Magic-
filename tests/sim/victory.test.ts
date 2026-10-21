// The end of a nation and of the game (docs/01-core-rules.md section 13 and its implementation
// decisions "The end of the day" and "The last nation with a capital"): Wellspring victory,
// the last capital, elimination and capital moves, and the player's defeat, all settled in
// tick step 7.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { wellspringsToWin } from '../../src/mapgen/placement';
import { captureProvince } from '../../src/sim/capture';
import { createCommander } from '../../src/sim/commanders';
import { applyCommand, validateCommand } from '../../src/sim/commands';
import { createGame } from '../../src/sim/createGame';
import type { NationId, ProvinceId } from '../../src/sim/ids';
import { advance } from '../../src/sim/tick';
import type { GameState, NationSetup } from '../../src/sim/types';
import type * as Wellsprings from '../../src/sim/wellsprings';
import {
  addArmy,
  annex,
  capitalOf,
  independentProvince,
  nation,
  nationIds,
  neighbors,
  pretender,
  runDays,
  twoNationGame,
} from './fixtures';

// Two nations can never both hold a majority of the Wellsprings, so the same-day tie the rules
// settle by nation order is reached only by forcing claimedBy. Every other test sees the real one.
const forced = vi.hoisted(() => ({ claims: null as Readonly<Record<string, number>> | null }));
vi.mock('../../src/sim/wellsprings', async (importOriginal) => {
  const actual = await importOriginal<typeof Wellsprings>();
  return {
    ...actual,
    claimedBy: (state: GameState, id: NationId) =>
      forced.claims?.[id] ?? actual.claimedBy(state, id),
  };
});
afterEach(() => {
  forced.claims = null;
});

function ids2(state: GameState): [NationId, NationId] {
  return nationIds(state) as [NationId, NationId];
}

/** Gives a nation the first `count` Wellsprings, claimed. */
function claimWells(state: GameState, id: NationId, count: number): ProvinceId[] {
  const wells = state.map.wellsprings.slice(0, count);
  for (const w of wells) annex(state, id, w).wellspringClaimedBy = id;
  return wells;
}

/** The texts of the 'info' messages each nation got, by nation. */
function infoTo(state: GameState, id: NationId): string[] {
  return state.messages.filter((m) => m.nation === id && m.kind === 'info').map((m) => m.text);
}

/** A Medium three-nation game: Cinder Horde, Thornwood, Cinder Horde, with the given AI flags. */
function threeNationGame(ai: readonly [boolean, boolean, boolean]): GameState {
  const defs = ['cinderHorde', 'thornwood', 'cinderHorde'] as const;
  const setups: NationSetup[] = defs.map((def, i) =>
    nation(def, ai[i] === true ? { ai: { difficulty: 'normal' } } : {}),
  );
  return createGame({ seed: 2, mapSize: 'medium', nations: setups });
}

/** Takes every province of a nation away (its capital to no one), so it falls next tick. */
function strip(state: GameState, id: NationId): void {
  for (const p of Object.values(state.provinces)) {
    if (p.owner === id) captureProvince(state, p.id, null);
  }
}

describe('wellspringsToWin', () => {
  it('is a majority: 2 of 3, 3 of 5', () => {
    expect(wellspringsToWin(3)).toBe(2);
    expect(wellspringsToWin(5)).toBe(3);
    expect(wellspringsToWin(4)).toBe(3);
  });

  it('matches the maps: 3 Wellsprings for two nations, 5 for three', () => {
    expect(twoNationGame().map.wellsprings).toHaveLength(3);
    expect(threeNationGame([true, true, true]).map.wellsprings).toHaveLength(5);
  });
});

describe('a Wellspring victory', () => {
  it('needs the majority: one claimed of three is not enough, two wins at the day’s end', () => {
    const state = twoNationGame();
    const [red, green] = ids2(state);
    claimWells(state, red, 1);
    advance(state);
    expect(state.result).toBeNull();
    claimWells(state, red, 2);
    const day = state.day;
    advance(state);
    expect(state.result).toEqual({ day, winner: red, reason: 'wellsprings' });
    expect(state.day).toBe(day + 1);
    expect(infoTo(state, red)).toContain('Cinder Horde has won the game.');
    expect(infoTo(state, green)).toContain('Cinder Horde has won the game.');
  });

  it('counts only claimed Wellsprings the nation still owns', () => {
    const state = twoNationGame();
    const [red, green] = ids2(state);
    const [, second] = claimWells(state, red, 2) as [ProvinceId, ProvinceId];
    state.provinces[second]!.owner = green;
    advance(state);
    expect(state.result).toBeNull();
  });

  it('comes in the tick a claim completes; after it advance and commands change nothing', () => {
    const state = twoNationGame();
    const [red, green] = ids2(state);
    claimWells(state, red, 1);
    const second = state.map.wellsprings[1]!;
    annex(state, red, second);
    const priest = createCommander(state, 'pyrePriest', red, second);
    expect(
      applyCommand(state, { type: 'claimWellspring', nation: red, commander: priest.id }),
    ).toEqual({ ok: true });
    runDays(state, 9);
    expect(state.result).toBeNull();
    advance(state);
    expect(state.provinces[second]!.wellspringClaimedBy).toBe(red);
    expect(state.result).toEqual({ day: 9, winner: red, reason: 'wellsprings' });
    expect(state.day).toBe(10);
    for (const id of [red, green]) {
      expect(infoTo(state, id).filter((t) => t === 'Cinder Horde has won the game.')).toHaveLength(
        1,
      );
    }
    const before = JSON.stringify(state);
    runDays(state, 3);
    expect(JSON.stringify(state)).toBe(before);
    expect(state.day).toBe(10);
    expect(
      validateCommand(state, {
        type: 'setOrder',
        nation: red,
        commander: priest.id,
        order: 'idle',
      }),
    ).toBe('The game is over');
  });

  it('is won by an AI nation as well', () => {
    const state = twoNationGame();
    const [red, green] = ids2(state);
    claimWells(state, green, 2);
    advance(state);
    expect(state.result).toMatchObject({ winner: green, reason: 'wellsprings' });
    expect(infoTo(state, red)).toContain('Thornwood has won the game.');
  });

  it('beats the last capital when both come the same day', () => {
    const state = twoNationGame();
    const [red, green] = ids2(state);
    claimWells(state, red, 2);
    strip(state, green);
    advance(state);
    expect(state.nations[green]!.eliminated).toBe(true);
    expect(state.result).toMatchObject({ winner: red, reason: 'wellsprings' });
  });

  it('goes to the first nation in nation order when two reach it the same day', () => {
    const state = threeNationGame([true, true, true]);
    const [, second, third] = nationIds(state) as [NationId, NationId, NationId];
    expect(wellspringsToWin(state.map.wellsprings.length)).toBe(3);
    forced.claims = { [second]: 3, [third]: 3 };
    advance(state);
    expect(state.result).toMatchObject({ winner: second, reason: 'wellsprings' });
  });
});

describe('the last capital', () => {
  it('a 1v1 ends when the player loses its capital and every other province: the AI wins', () => {
    const state = twoNationGame();
    const [red, green] = ids2(state);
    const redCapital = capitalOf(state, red).id;
    const outpost = neighbors(state, redCapital)[0]!;
    annex(state, red, outpost);
    captureProvince(state, redCapital, green);
    captureProvince(state, outpost, green);
    const day = state.day;
    advance(state);
    expect(state.nations[red]!.eliminated).toBe(true);
    // Its imprisoned pretender never arrived, and now never will.
    expect(state.nations[red]!.pretenderDead).toBe(true);
    expect(state.nations[green]!.eliminated).toBe(false);
    // Last nation standing is settled before the player's defeat.
    expect(state.result).toEqual({ day, winner: green, reason: 'lastCapital' });
    expect(infoTo(state, red)).toContain('Thornwood has won the game.');
    expect(infoTo(state, green)).toContain('Thornwood has won the game.');
  });

  it('has no winner when the last two fall the same day', () => {
    const state = twoNationGame();
    const [red, green] = ids2(state);
    strip(state, red);
    strip(state, green);
    advance(state);
    expect(state.result).toMatchObject({ winner: null, reason: 'lastCapital' });
    expect(infoTo(state, red)).toContain('The game is over.');
    expect(infoTo(state, green)).toContain('The game is over.');
  });
});

describe('elimination', () => {
  it('takes a nation with provinces but no fort: its commanders die and its lands go to no one', () => {
    const state = twoNationGame(1, { pretender: pretender({ awakening: 'awake' }) });
    const [red, green] = ids2(state);
    const home = capitalOf(state, red);
    const god = state.nations[red]!.pretenderId!;
    expect(state.commanders[god]).toBeDefined();
    const outpost = annex(state, red, neighbors(state, home.id)[0]!);
    outpost.pd = 4;
    outpost.wellspringClaimedBy = red;
    home.pd = 10;
    home.siege = { attacker: green, wallHp: 120, storm: false };
    home.buildings = home.buildings.filter((b) => b !== 'fort');
    const away = addArmy(state, red, independentProvince(state).id, 'cinderWarrior', 5);
    const dominion = { ...home.dominion };
    expect(home.garrison).not.toBeNull();
    advance(state);
    const n = state.nations[red]!;
    expect(n.eliminated).toBe(true);
    expect(n.pretenderDead).toBe(true);
    expect(n.pretenderId).toBeNull();
    expect(Object.values(state.commanders).filter((c) => c.owner === red)).toEqual([]);
    expect(state.commanders[god]).toBeUndefined();
    expect(state.commanders[away.id]).toBeUndefined();
    for (const p of [home, outpost]) {
      expect(p).toMatchObject({
        owner: null,
        pd: 0,
        garrison: null,
        siege: null,
        wellspringClaimedBy: null,
      });
    }
    // Dominion stays as it was.
    expect(home.dominion).toEqual(dominion);
    expect(Object.values(state.provinces).some((p) => p.owner === red)).toBe(false);
    expect(infoTo(state, red)).toContain('Cinder Horde has fallen.');
    expect(infoTo(state, green)).toContain('Cinder Horde has fallen.');
  });

  it('spares a nation that lost its capital but holds another fort, which becomes its capital', () => {
    const state = twoNationGame();
    const [red, green] = ids2(state);
    const oldCapital = capitalOf(state, red).id;
    const [a, b] = neighbors(state, oldCapital) as [ProvinceId, ProvinceId];
    for (const id of [a, b]) annex(state, red, id).buildings.push('fort');
    captureProvince(state, oldCapital, green);
    advance(state);
    const n = state.nations[red]!;
    expect(n.eliminated).toBe(false);
    // The first fort in map order.
    const first = Object.keys(state.map.provinces).find((id) => id === a || id === b);
    expect(n.capital).toBe(first);
    expect(state.provinces[n.capital]!.owner).toBe(red);
    expect(state.result).toBeNull();
    expect(infoTo(state, red).some((t) => t.includes('has fallen'))).toBe(false);
  });

  it('keeps the capital where it is while the nation holds it', () => {
    const state = twoNationGame();
    const [red] = ids2(state);
    const capital = state.nations[red]!.capital;
    const fort = annex(state, red, neighbors(state, capital)[0]!);
    fort.buildings.push('fort');
    advance(state);
    expect(state.nations[red]!.capital).toBe(capital);
  });

  it('shuts the fallen nation out of commands', () => {
    const state = threeNationGame([true, true, true]);
    const [, , third] = nationIds(state) as [NationId, NationId, NationId];
    strip(state, third);
    advance(state);
    expect(validateCommand(state, { type: 'setResearchColor', nation: third, color: 'R' })).toBe(
      'No such nation',
    );
  });
});

describe('three nations', () => {
  it('all AI: one falling leaves the game running; the last one standing wins', () => {
    const state = threeNationGame([true, true, true]);
    const [first, second, third] = nationIds(state) as [NationId, NationId, NationId];
    strip(state, third);
    advance(state);
    expect(state.nations[third]!.eliminated).toBe(true);
    expect(state.result).toBeNull();
    const fallen = `${state.nations[third]!.name} has fallen.`;
    for (const id of [first, second, third]) expect(infoTo(state, id)).toContain(fallen);
    strip(state, second);
    advance(state);
    expect(state.result).toMatchObject({ winner: first, reason: 'lastCapital' });
    // A nation already out does not hear of later falls.
    const fallen2 = `${state.nations[second]!.name} has fallen.`;
    expect(infoTo(state, first)).toContain(fallen2);
    expect(infoTo(state, second)).toContain(fallen2);
    expect(infoTo(state, third)).not.toContain(fallen2);
  });

  it('one human, two AI: the human falling ends the game with no winner', () => {
    const state = threeNationGame([false, true, true]);
    const [human, ...ais] = nationIds(state) as [NationId, NationId, NationId];
    strip(state, human);
    const day = state.day;
    advance(state);
    expect(state.result).toEqual({ day, winner: null, reason: 'playerDefeated' });
    for (const id of [human, ...ais]) expect(infoTo(state, id)).toContain('The game is over.');
    for (const id of ais) expect(state.nations[id]!.eliminated).toBe(false);
  });

  it('one human, two AI: an AI falling does not end it', () => {
    const state = threeNationGame([false, true, true]);
    const [, , ai] = nationIds(state) as [NationId, NationId, NationId];
    strip(state, ai);
    advance(state);
    expect(state.nations[ai]!.eliminated).toBe(true);
    expect(state.result).toBeNull();
  });

  it('two humans: the game goes on while one human still plays', () => {
    const state = threeNationGame([false, false, true]);
    const [human] = nationIds(state) as [NationId, NationId, NationId];
    strip(state, human);
    advance(state);
    expect(state.nations[human]!.eliminated).toBe(true);
    expect(state.result).toBeNull();
  });
});
