// Dominion (docs/01-core-rules.md section 12; docs/05-pretender.md "Prophet", Scales): pushes,
// the spread checks of every source, the monthly spread through the tick, and Godless with
// its pretender recall.
import { describe, expect, it } from 'vitest';
import { DOMINION } from '../../src/content/rules';
import { createCommander } from '../../src/sim/commanders';
import {
  dominionChecks,
  isGodless,
  pushDominion,
  spreadDominion,
  updateGodless,
} from '../../src/sim/dominion';
import type { NationId } from '../../src/sim/ids';
import { dominionScore } from '../../src/sim/selectors';
import { advance } from '../../src/sim/tick';
import type { CommanderState, GameState, ProvinceState } from '../../src/sim/types';
import {
  annex,
  capitalOf,
  commandersIn,
  independentProvince,
  nationIds,
  neighbors,
  pretender,
  redGame,
  runDays,
  twoNationGame,
} from './fixtures';

function ids(state: GameState): [NationId, NationId] {
  return nationIds(state) as [NationId, NationId];
}

/** Every check a nation makes, counted per province it is made from. */
function checksBy(state: GameState, nation: NationId): Record<string, number> {
  const out: Record<string, number> = {};
  for (const check of dominionChecks(state, nation)) {
    expect(check.nation).toBe(nation);
    out[check.from] = (out[check.from] ?? 0) + 1;
  }
  return out;
}

/** A nation's commander of some unit, standing in its capital. */
function inCapital(state: GameState, nation: NationId, unit: string): CommanderState {
  const found = commandersIn(state, capitalOf(state, nation).id).find((c) => c.unit === unit);
  if (!found) throw new Error(`no ${unit} in the capital`);
  return found;
}

/** An independent province next to a nation's capital. */
function independentNeighbor(state: GameState, nation: NationId): ProvinceState {
  const id = neighbors(state, capitalOf(state, nation).id).find(
    (n) => state.provinces[n]!.owner === null,
  );
  if (id === undefined) throw new Error('no independent neighbor');
  return state.provinces[id]!;
}

/** An independent province whose neighbors are no capital's neighbors. */
function farProvince(state: GameState): ProvinceState {
  const found = Object.values(state.provinces).find(
    (p) => p.owner === null && state.map.provinces[p.id]!.capitalDistance >= 3,
  );
  if (!found) throw new Error('no far province');
  return found;
}

function preach(c: CommanderState): CommanderState {
  c.order = { kind: 'preach' };
  return c;
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
    // A claimed Wellspring adds 1 to the score, and so to the cap.
    state.provinces[state.map.wellsprings[0]!]!.wellspringClaimedBy = red;
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

/** Every province's dominion, for comparing before and after. */
function dominionMap(state: GameState): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of Object.values(state.provinces)) {
    out[p.id] = `${p.dominion.nation ?? '-'}:${String(p.dominion.strength)}`;
  }
  return out;
}

function expectWithinScores(state: GameState): void {
  for (const p of Object.values(state.provinces)) {
    const { nation, strength } = p.dominion;
    expect(strength).toBeGreaterThanOrEqual(0);
    if (nation === null) expect(strength).toBe(0);
    else expect(strength).toBeLessThanOrEqual(dominionScore(state, nation));
  }
}

describe('spreadDominion through the tick', () => {
  it('spreads nothing before the last day of the month', () => {
    const state = redGame(10);
    const start = dominionMap(state);
    runDays(state, 29);
    expect(state.day).toBe(29);
    expect(dominionMap(state)).toEqual(start);
    advance(state);
    expect(state.day).toBe(30);
    expect(dominionMap(state)).not.toEqual(start);
    // Nothing moves again until the next month's last day.
    const afterFirst = dominionMap(state);
    runDays(state, 29);
    expect(dominionMap(state)).toEqual(afterFirst);
  });

  it('holds the capital and spreads to its neighbors over 6 months, never above the score', () => {
    const state = redGame(10);
    const [red, green] = ids(state);
    const capital = capitalOf(state, red).id;
    const around = neighbors(state, capital);
    expect(around.some((n) => state.provinces[n]!.dominion.nation === red)).toBe(false);
    for (let day = 0; day < 6 * 30; day++) {
      advance(state);
      expectWithinScores(state);
      expect(state.provinces[capital]!.dominion.nation).toBe(red);
    }
    expect(around.some((n) => state.provinces[n]!.dominion.nation === red)).toBe(true);
    expect(capitalOf(state, green).dominion.nation).toBe(green);
  });

  it('lands 40% on its own province, else a neighbor, and pushes on 1d10 ≤ the score', () => {
    // Five red priests preach in a far province; it and its neighbors are green's at strength
    // 10, so every successful check takes exactly 1 off somewhere in that area.
    const spread = (score: number) => {
      const state = redGame(score);
      const [red, green] = ids(state);
      const p = farProvince(state);
      const area = [p.id, ...neighbors(state, p.id)];
      for (let i = 0; i < 5; i++) preach(createCommander(state, 'pyrePriest', red, p.id));
      expect(checksBy(state, red)[p.id]).toBe(10);
      let total = 0;
      let own = 0;
      for (let month = 0; month < 3; month++) {
        for (const id of area) state.provinces[id]!.dominion = { nation: green, strength: 10 };
        state.day = 30 * month + 29;
        spreadDominion(state);
        for (const id of area) {
          const d = state.provinces[id]!.dominion;
          expect(d.nation).toBe(green);
          total += 10 - d.strength;
          if (id === p.id) own += 10 - d.strength;
        }
      }
      return { total, own };
    };
    // Score 10 never fails: all 30 checks of three months land in the area, about 40% on p.
    const sure = spread(10);
    expect(sure.total).toBe(30);
    expect(sure.own).toBeGreaterThanOrEqual(6);
    expect(sure.own).toBeLessThanOrEqual(18);
    // Score 1 succeeds on a 1 only: about 3 of 30.
    expect(spread(1).total).toBeLessThan(10);
  });

  it('tells the owner when a province’s dominating nation changes, and only then', () => {
    const state = redGame(10);
    const [red, green] = ids(state);
    const capital = capitalOf(state, red);
    // A red province next to the capital, held by green's dominion at strength 1, with ten
    // priests preaching in it; the capital's own dominion sits low, so it grows without
    // changing hands.
    const p = annex(state, red, independentNeighbor(state, red).id);
    p.dominion = { nation: green, strength: 1 };
    capital.dominion = { nation: red, strength: 3 };
    for (let i = 0; i < 10; i++) preach(createCommander(state, 'pyrePriest', red, p.id));
    const before = Object.fromEntries(
      Object.values(state.provinces).map((x) => [x.id, x.dominion.nation] as const),
    );
    state.day = 29;
    const firstMessage = state.messages.length;
    spreadDominion(state);

    expect(p.dominion.nation).toBe(red);
    expect(capital.dominion.nation).toBe(red);
    expect(capital.dominion.strength).toBeGreaterThan(3);
    const posted = state.messages.slice(firstMessage);
    expect(posted.length).toBeGreaterThan(0);
    for (const m of posted) expect(m.kind).toBe('dominion');
    const changedOwned = Object.values(state.provinces)
      .filter((x) => x.owner !== null && x.dominion.nation !== before[x.id])
      .map((x) => x.id);
    expect(changedOwned).toContain(p.id);
    expect(posted.map((m) => m.province)).toEqual(changedOwned);
    const name = state.map.provinces[p.id]!.name;
    const mine = posted.find((m) => m.province === p.id)!;
    expect(mine).toMatchObject({
      nation: red,
      day: 29,
      text: `${name} is now under the dominion of ${state.nations[red]!.name}.`,
    });
    // Independent provinces that changed hands tell no one.
    const changedFree = Object.values(state.provinces).filter(
      (x) => x.owner === null && x.dominion.nation !== before[x.id],
    );
    expect(changedFree.length).toBeGreaterThan(0);
    for (const x of changedFree) expect(posted.some((m) => m.province === x.id)).toBe(false);
  });

  it('tells the owner, not the pushing nation, naming no one when dominion empties', () => {
    const state = redGame(10);
    const [red, green] = ids(state);
    // Green owns a province far from both capitals, under its own dominion at strength 1, where
    // a red priest with 3 holy pips preaches and no other check can land. Month by month the
    // province is set back and the outcome read: no hit, one hit (empty), or more (red).
    const p = annex(state, green, farProvince(state).id);
    const priest = preach(createCommander(state, 'pyrePriest', red, p.id));
    priest.holy = 3;
    const name = state.map.provinces[p.id]!.name;
    const seen = new Set<string>();
    for (let month = 0; month < 60 && seen.size < 3; month++) {
      p.dominion = { nation: green, strength: 1 };
      state.day = 30 * month + 29;
      const first = state.messages.length;
      spreadDominion(state);
      const posted = state.messages.slice(first).filter((m) => m.province === p.id);
      const now = p.dominion.nation;
      seen.add(now ?? 'none');
      if (now === green) {
        expect(posted).toEqual([]);
        continue;
      }
      expect(posted).toHaveLength(1);
      const who = now === null ? 'no one' : state.nations[red]!.name;
      expect(posted[0]).toMatchObject({
        nation: green,
        kind: 'dominion',
        day: state.day,
        text: `${name} is now under the dominion of ${who}.`,
      });
      expect(state.messages.slice(first).some((m) => m.nation === red)).toBe(false);
    }
    expect([...seen].sort()).toEqual([green, red, 'none'].sort());
  });

  it('makes no checks for an eliminated nation', () => {
    const state = redGame(5);
    const [, green] = ids(state);
    const greenCapital = capitalOf(state, green);
    greenCapital.dominion = { nation: green, strength: 1 };
    for (let i = 0; i < 10; i++) {
      preach(createCommander(state, 'grovePriest', green, greenCapital.id));
    }
    const greenTotal = () =>
      Object.values(state.provinces).reduce(
        (sum, p) => sum + (p.dominion.nation === green ? p.dominion.strength : 0),
        0,
      );
    state.nations[green]!.eliminated = true;
    state.day = 29;
    spreadDominion(state);
    expect(greenTotal()).toBe(1);
    expect(greenCapital.dominion).toEqual({ nation: green, strength: 1 });
    // The same 34 checks build green's dominion once it is back in the game.
    state.nations[green]!.eliminated = false;
    spreadDominion(state);
    expect(greenTotal()).toBeGreaterThan(5);
  });
});

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
