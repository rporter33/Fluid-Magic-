// Dominion (docs/01-core-rules.md section 12; docs/05-pretender.md "Prophet", Scales): pushes
// and the spread checks of every source. The spread through the tick is in dominion.tick.test.ts,
// its dice and order in dominion.spread.test.ts, and Godless in dominion.godless.test.ts.
import { describe, expect, it } from 'vitest';
import { DOMINION } from '../../src/content/rules';
import { createCommander } from '../../src/sim/commanders';
import { dominionChecks, pushDominion } from '../../src/sim/dominion';
import type { NationId } from '../../src/sim/ids';
import { dominionScore } from '../../src/sim/selectors';
import type { CommanderState, GameState } from '../../src/sim/types';
import {
  annex,
  capitalOf,
  commandersIn,
  independentProvince,
  nationIds,
  neighbors,
  pretender,
  redGame,
  twoNationGame,
} from './fixtures';
import { checksBy, preach } from './dominionFixtures';

function ids(state: GameState): [NationId, NationId] {
  return nationIds(state) as [NationId, NationId];
}

/** A nation's commander of some unit, standing in its capital. */
function inCapital(state: GameState, nation: NationId, unit: string): CommanderState {
  const found = commandersIn(state, capitalOf(state, nation).id).find((c) => c.unit === unit);
  if (!found) throw new Error(`no ${unit} in the capital`);
  return found;
}

describe('pushDominion', () => {
  it('builds an empty province one step at a time up to the dominion score', () => {
    const state = redGame(5);
    const [red] = ids(state);
    const p = independentProvince(state);
    expect(p.dominion).toEqual({ nation: null, strength: 0 });
    pushDominion(state, p.id, red, 3);
    expect(p.dominion).toEqual({ nation: red, strength: 3 });
    pushDominion(state, p.id, red, 1);
    expect(p.dominion).toEqual({ nation: red, strength: 4 });
    pushDominion(state, p.id, red, 7);
    expect(p.dominion).toEqual({ nation: red, strength: 5 });
  });

  it('caps at the score by default, Wellspring bonus included, or at a given cap', () => {
    const state = redGame(3);
    const [red] = ids(state);
    const p = independentProvince(state);
    pushDominion(state, p.id, red, 10);
    expect(p.dominion.strength).toBe(3);
    // A claimed Wellspring the nation owns adds 1 to the score, and so to the cap.
    annex(state, red, state.map.wellsprings[0]!).wellspringClaimedBy = red;
    expect(dominionScore(state, red)).toBe(4);
    pushDominion(state, p.id, red, 10);
    expect(p.dominion.strength).toBe(4);
    const other = Object.values(state.provinces).find(
      (x) => x.owner === null && x.dominion.nation === null,
    )!;
    pushDominion(state, other.id, red, 10, 2);
    expect(other.dominion).toEqual({ nation: red, strength: 2 });
  });

  it('never lowers an own province that stands above the cap', () => {
    const state = redGame(5);
    const [red] = ids(state);
    const p = independentProvince(state);
    p.dominion = { nation: red, strength: 8 };
    pushDominion(state, p.id, red, 3);
    expect(p.dominion).toEqual({ nation: red, strength: 8 });
    pushDominion(state, p.id, red, 3, 2);
    expect(p.dominion).toEqual({ nation: red, strength: 8 });
  });

  it('wears down another nation’s dominion, empties it at 0, then builds the pusher’s', () => {
    const state = redGame(5);
    const [red, green] = ids(state);
    const p = independentProvince(state);
    p.dominion = { nation: green, strength: 3 };
    pushDominion(state, p.id, red, 2);
    expect(p.dominion).toEqual({ nation: green, strength: 1 });
    pushDominion(state, p.id, red, 1);
    expect(p.dominion).toEqual({ nation: null, strength: 0 });
    pushDominion(state, p.id, red, 1);
    expect(p.dominion).toEqual({ nation: red, strength: 1 });

    // In one call: two steps take green's 2 away, the next three build red's.
    p.dominion = { nation: green, strength: 2 };
    pushDominion(state, p.id, red, 5);
    expect(p.dominion).toEqual({ nation: red, strength: 3 });
  });

  it('wears down another nation’s dominion even above the pusher’s cap', () => {
    const state = redGame(2);
    const [red, green] = ids(state);
    const p = independentProvince(state);
    p.dominion = { nation: green, strength: 9 };
    pushDominion(state, p.id, red, 4);
    expect(p.dominion).toEqual({ nation: green, strength: 5 });
  });

  it('treats another nation’s dominion at strength 0 as none', () => {
    const state = redGame(5);
    const [red, green] = ids(state);
    const p = independentProvince(state);
    p.dominion = { nation: green, strength: 0 };
    pushDominion(state, p.id, red, 1);
    expect(p.dominion).toEqual({ nation: red, strength: 1 });
  });
});

describe('dominionChecks', () => {
  it('makes 3 checks from an owned capital and 1 from its temple at game start', () => {
    const state = redGame(5);
    const [red, green] = ids(state);
    const capital = capitalOf(state, red).id;
    expect(checksBy(state, red)).toEqual({
      [capital]: DOMINION.capitalChecks + DOMINION.templeChecks,
    });
    expect(DOMINION.capitalChecks + DOMINION.templeChecks).toBe(4);
    expect(checksBy(state, green)).toEqual({ [capitalOf(state, green).id]: 4 });
  });

  it('makes capital checks only while the nation owns its capital', () => {
    const state = redGame(5);
    const [red, green] = ids(state);
    const capital = capitalOf(state, red);
    capital.buildings = capital.buildings.filter((b) => b !== 'temple');
    expect(checksBy(state, red)).toEqual({ [capital.id]: 3 });
    capital.owner = green;
    expect(checksBy(state, red)).toEqual({});
    capital.owner = null;
    expect(checksBy(state, red)).toEqual({});
  });

  it('makes 1 check per owned temple, wherever it stands, and none for temples of others', () => {
    const state = redGame(5);
    const [red, green] = ids(state);
    const capital = capitalOf(state, red).id;
    const p = annex(state, red, independentProvince(state).id);
    expect(checksBy(state, red)[p.id]).toBeUndefined();
    p.buildings.push('temple');
    expect(checksBy(state, red)).toEqual({ [capital]: 4, [p.id]: 1 });
    // The same temple under another owner, or no owner, makes no check for red.
    p.owner = green;
    expect(checksBy(state, red)).toEqual({ [capital]: 4 });
    expect(checksBy(state, green)[p.id]).toBe(1);
    p.owner = null;
    expect(checksBy(state, red)).toEqual({ [capital]: 4 });
  });

  it('adds the Sanctity scale’s temple checks per step, and nothing for Dread', () => {
    for (const [sanctity, perTemple] of [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [-2, 1],
      [-3, 1],
    ] as const) {
      const state = redGame(5, { sanctity });
      const [red] = ids(state);
      const capital = capitalOf(state, red).id;
      const p = annex(state, red, independentProvince(state).id);
      p.buildings.push('temple');
      expect(checksBy(state, red)).toEqual({ [capital]: 3 + perTemple, [p.id]: perTemple });
    }
  });

  it('counts Sanctity from an owned Wellspring among the nation’s scales', () => {
    const state = redGame(5, { sanctity: 1 });
    const [red] = ids(state);
    const capital = capitalOf(state, red).id;
    const well = state.map.wellsprings[0]!;
    state.map.provinces[well]!.wellspring = { axis: 'sanctity', step: 1 };
    expect(checksBy(state, red)[capital]).toBe(3 + 2);
    annex(state, red, well);
    expect(checksBy(state, red)[capital]).toBe(3 + 3);
  });

  it('makes 2 checks from an awake pretender where it stands, 4 for the Living Monolith', () => {
    const awake = twoNationGame(1, { pretender: pretender({ awakening: 'awake' }) });
    const [red] = ids(awake);
    const capital = capitalOf(awake, red).id;
    const god = awake.commanders[awake.nations[red]!.pretenderId!]!;
    expect(god.location).toBe(capital);
    expect(checksBy(awake, red)).toEqual({ [capital]: 4 + DOMINION.pretenderChecks });
    const p = independentProvince(awake);
    god.location = p.id;
    expect(checksBy(awake, red)).toEqual({ [capital]: 4, [p.id]: 2 });

    const monolith = twoNationGame(1, {
      pretender: pretender({ chassis: 'livingMonolith', dominion: 5, awakening: 'awake' }),
    });
    const [red2] = ids(monolith);
    const capital2 = capitalOf(monolith, red2).id;
    expect(monolith.nations[red2]!.pretenderId).not.toBeNull();
    expect(checksBy(monolith, red2)).toEqual({ [capital2]: 4 + 4 });
  });

  it('makes no pretender checks while the pretender is absent', () => {
    // The default test pretender is imprisoned until day 1050.
    const state = redGame(5);
    const [red] = ids(state);
    expect(state.nations[red]!.pretenderId).toBeNull();
    expect(dominionChecks(state, red)).toHaveLength(4);
    // A stale id of a commander no longer in the game counts for nothing either.
    state.nations[red]!.pretenderId = 'c9999' as CommanderState['id'];
    expect(dominionChecks(state, red)).toHaveLength(4);
  });

  it('makes 1 check from the prophet where it stands', () => {
    const state = redGame(5);
    const [red] = ids(state);
    const capital = capitalOf(state, red).id;
    const chief = inCapital(state, red, 'ashChieftain');
    state.nations[red]!.prophetId = chief.id;
    expect(checksBy(state, red)).toEqual({ [capital]: 4 + 1 });
    const p = independentProvince(state);
    chief.location = p.id;
    expect(checksBy(state, red)).toEqual({ [capital]: 4, [p.id]: DOMINION.prophetChecks });
    expect(DOMINION.prophetChecks).toBe(1);
  });

  it('makes 1 check per holy pip for a preaching priest, 1 more in an own temple province', () => {
    const state = redGame(5);
    const [red, green] = ids(state);
    const capital = capitalOf(state, red).id;
    const priest = inCapital(state, red, 'pyrePriest');
    expect(priest.holy).toBe(2);
    // Idle priests make none.
    expect(checksBy(state, red)).toEqual({ [capital]: 4 });
    preach(priest);
    // In the capital, which has red's temple: 2 + 1.
    expect(checksBy(state, red)).toEqual({ [capital]: 4 + 3 });

    // An own province without a temple, then with one.
    const p = annex(state, red, independentProvince(state).id);
    priest.location = p.id;
    expect(checksBy(state, red)).toEqual({ [capital]: 4, [p.id]: 2 });
    p.buildings.push('temple');
    expect(checksBy(state, red)).toEqual({ [capital]: 4, [p.id]: 1 + 2 + 1 });
    // Another nation's temple gives no bonus (and its checks are not red's).
    p.owner = green;
    expect(checksBy(state, red)).toEqual({ [capital]: 4, [p.id]: 2 });
  });

  it('counts holy pips as the priest has them, and nothing without holy pips', () => {
    const state = redGame(5);
    const [red] = ids(state);
    const capital = capitalOf(state, red).id;
    const p = independentProvince(state);
    const priest = preach(createCommander(state, 'pyrePriest', red, p.id));
    priest.holy = 3;
    expect(checksBy(state, red)).toEqual({ [capital]: 4, [p.id]: 3 });
    priest.holy = 0;
    expect(checksBy(state, red)).toEqual({ [capital]: 4 });
    // A commander without holy pips makes none even with the order set.
    const chief = preach(inCapital(state, red, 'ashChieftain'));
    expect(chief.holy).toBe(0);
    expect(checksBy(state, red)).toEqual({ [capital]: 4 });
  });

  it('makes no checks for a preaching priest in transit or of another nation', () => {
    const state = redGame(5);
    const [red, green] = ids(state);
    const capital = capitalOf(state, red).id;
    const priest = preach(inCapital(state, red, 'pyrePriest'));
    priest.transit = {
      from: capital,
      to: neighbors(state, capital)[0]!,
      progress: 1,
      totalDays: 3,
    };
    expect(checksBy(state, red)).toEqual({ [capital]: 4 });

    const grove = preach(inCapital(state, green, 'grovePriest'));
    const greenCapital = capitalOf(state, green).id;
    grove.location = capital;
    expect(checksBy(state, red)).toEqual({ [capital]: 4 });
    expect(checksBy(state, green)).toEqual({ [greenCapital]: 4, [capital]: 2 });
  });

  it('sums every source', () => {
    const state = twoNationGame(1, { pretender: pretender({ awakening: 'awake' }) });
    const [red] = ids(state);
    const capital = capitalOf(state, red).id;
    preach(inCapital(state, red, 'pyrePriest'));
    state.nations[red]!.prophetId = inCapital(state, red, 'ashChieftain').id;
    // Capital 3, temple 1, pretender 2, prophet 1, priest 2 + 1.
    expect(checksBy(state, red)).toEqual({ [capital]: 10 });
  });
});
