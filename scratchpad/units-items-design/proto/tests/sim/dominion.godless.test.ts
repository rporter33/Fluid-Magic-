// Godless (docs/01-core-rules.md section 12 and its Phase 6 decision): the trigger, the monthly
// settle with its message, and the pretender recalled and returned through the tick.
import { describe, expect, it } from 'vitest';
import { isGodless, updateGodless } from '../../src/sim/dominion';
import type { NationId } from '../../src/sim/ids';
import { advance } from '../../src/sim/tick';
import type { GameState } from '../../src/sim/types';
import {
  annex,
  capitalOf,
  independentProvince,
  nationIds,
  pretender,
  redGame,
  runDays,
  twoNationGame,
} from './fixtures';

function ids(state: GameState): [NationId, NationId] {
  return nationIds(state) as [NationId, NationId];
}

/** Takes the temple out of a nation's capital and gives the capital's dominion away. */
function loseFaith(state: GameState, nation: NationId, to: NationId | null, strength = 10) {
  const capital = capitalOf(state, nation);
  capital.buildings = capital.buildings.filter((b) => b !== 'temple');
  capital.dominion = to === null ? { nation: null, strength: 0 } : { nation: to, strength };
  return capital;
}

function dominionMessages(state: GameState, nation: NationId) {
  return state.messages.filter((m) => m.nation === nation && m.kind === 'dominion');
}

describe('Godless', () => {
  it('is false for every nation at game start', () => {
    const state = redGame(5);
    for (const id of nationIds(state)) {
      expect(isGodless(state, id)).toBe(false);
      expect(state.nations[id]!.godless).toBe(false);
    }
  });

  it('needs both: the capital out of its dominion and no owned temple under its dominion', () => {
    const state = redGame(5);
    const [red, green] = ids(state);
    const capital = capitalOf(state, red);
    // The capital's temple stands, but under green's dominion it keeps no faith.
    capital.dominion = { nation: green, strength: 3 };
    expect(capital.buildings).toContain('temple');
    expect(isGodless(state, red)).toBe(true);
    // The capital under red's own dominion is enough, temple or not.
    loseFaith(state, red, red, 2);
    expect(isGodless(state, red)).toBe(false);
    loseFaith(state, red, green, 3);
    expect(isGodless(state, red)).toBe(true);
    loseFaith(state, red, null);
    expect(isGodless(state, red)).toBe(true);
    // Red's dominion at strength 0 is no dominion.
    capital.dominion = { nation: red, strength: 0 };
    expect(isGodless(state, red)).toBe(true);
    expect(isGodless(state, green)).toBe(false);
  });

  it('ends with an owned temple under its own dominion, or the capital’s dominion regained', () => {
    const state = redGame(5);
    const [red, green] = ids(state);
    const capital = loseFaith(state, red, green);
    expect(isGodless(state, red)).toBe(true);
    // A temple under red's dominion in a province red does not own does not help.
    const p = independentProvince(state);
    p.buildings.push('temple');
    p.dominion = { nation: red, strength: 4 };
    expect(isGodless(state, red)).toBe(true);
    annex(state, red, p.id);
    expect(isGodless(state, red)).toBe(false);
    // Owned, but under green's dominion, or under none, it keeps no faith.
    p.dominion = { nation: green, strength: 4 };
    expect(isGodless(state, red)).toBe(true);
    p.dominion = { nation: red, strength: 0 };
    expect(isGodless(state, red)).toBe(true);
    p.dominion = { nation: red, strength: 1 };
    expect(isGodless(state, red)).toBe(false);
    p.owner = null;
    expect(isGodless(state, red)).toBe(true);
    capital.dominion = { nation: red, strength: 1 };
    expect(isGodless(state, red)).toBe(false);
  });

  it('updateGodless sets the flag and posts a dominion message only when it changes', () => {
    const state = redGame(5);
    const [red, green] = ids(state);
    const capital = loseFaith(state, red, green);
    updateGodless(state);
    expect(state.nations[red]!.godless).toBe(true);
    expect(state.nations[green]!.godless).toBe(false);
    expect(dominionMessages(state, red)).toHaveLength(1);
    expect(dominionMessages(state, red)[0]!.text).toMatch(/godless/);
    expect(dominionMessages(state, green)).toHaveLength(0);
    updateGodless(state);
    expect(dominionMessages(state, red)).toHaveLength(1);

    capital.dominion = { nation: red, strength: 1 };
    updateGodless(state);
    expect(state.nations[red]!.godless).toBe(false);
    expect(dominionMessages(state, red)).toHaveLength(2);
    expect(dominionMessages(state, red)[1]!.text).toBe(
      `${state.nations[red]!.name} has its faith again.`,
    );
    updateGodless(state);
    expect(dominionMessages(state, red)).toHaveLength(2);
  });

  it('updateGodless skips eliminated nations', () => {
    const state = redGame(5);
    const [red, green] = ids(state);
    loseFaith(state, red, green);
    state.nations[red]!.eliminated = true;
    updateGodless(state);
    expect(state.nations[red]!.godless).toBe(false);
    expect(dominionMessages(state, red)).toHaveLength(0);
  });

  it('recalls a present pretender the tick after the month it fell, and returns it after', () => {
    const state = twoNationGame(1, { pretender: pretender({ awakening: 'awake' }) });
    const [red, green] = ids(state);
    const nation = state.nations[red]!;
    const first = nation.pretenderId!;
    expect(state.commanders[first]!.location).toBe(nation.capital);
    const capital = loseFaith(state, red, green);

    runDays(state, 29);
    expect(nation.godless).toBe(false);
    advance(state); // Day 29, the month's last: Godless is settled after the spread.
    expect(nation.godless).toBe(true);
    expect(nation.pretenderId).toBe(first);
    expect(state.commanders[first]).toBeDefined();

    advance(state); // Day 30: the settle recalls it.
    expect(nation.pretenderId).toBeNull();
    expect(state.commanders[first]).toBeUndefined();
    expect(nation.pretenderDead).toBe(false);
    runDays(state, 10);
    expect(nation.pretenderId).toBeNull();

    // Its own dominion again: Godless ends on the month's last day, the pretender the day after.
    capital.dominion = { nation: red, strength: 5 };
    runDays(state, 59 - state.day);
    expect(nation.godless).toBe(true);
    advance(state); // Day 59.
    expect(nation.godless).toBe(false);
    expect(dominionMessages(state, red).map((m) => m.day)).toEqual([29, 59]);
    expect(nation.pretenderId).toBeNull();
    advance(state); // Day 60.
    const back = nation.pretenderId;
    expect(back).not.toBeNull();
    expect(back).not.toBe(first);
    expect(state.commanders[back!]).toMatchObject({ unit: 'oracle', location: nation.capital });
  });

  it('falls on a nation whose temples still stand when another nation’s dominion takes them', () => {
    // Red's dominion score is 1, so its capital and temple win back little of what green holds.
    const state = twoNationGame(1, { pretender: pretender({ dominion: 1, awakening: 'awake' }) });
    const [red, green] = ids(state);
    const nation = state.nations[red]!;
    const capital = capitalOf(state, red);
    capital.dominion = { nation: green, strength: 10 };
    expect(capital.buildings).toContain('temple');
    runDays(state, 30);
    expect(capital.dominion.nation).toBe(green);
    expect(nation.godless).toBe(true);
    expect(dominionMessages(state, red).map((m) => m.day)).toEqual([29]);
    advance(state); // Day 30: the pretender leaves the map.
    expect(nation.pretenderId).toBeNull();
    expect(nation.pretenderDead).toBe(false);
  });
});
