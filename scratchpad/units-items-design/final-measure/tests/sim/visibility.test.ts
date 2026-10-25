// Fog of war (docs/01-core-rules.md section 14), and what a scry adds (docs/02-magic.md, Rituals).
import { describe, expect, it } from 'vitest';
import { newId, type NationId, type ProvinceId } from '../../src/sim/ids';
import { isStealthy } from '../../src/sim/commanders';
import {
  independentStrengthView,
  isExplored,
  visibleCommanders,
  visionOf,
} from '../../src/sim/visibility';
import type { GameState } from '../../src/sim/types';
import {
  addArmy,
  annex,
  capitalOf,
  commandersIn,
  nationIds,
  runDays,
  twoNationGame,
} from './fixtures';

/** Provinces within `radius` of `origin`, by breadth-first search written for the test. */
function ball(state: GameState, origin: ProvinceId, radius: number): Set<ProvinceId> {
  const out = new Set([origin]);
  for (let r = 0; r < radius; r++) {
    for (const p of [...out]) for (const n of state.map.provinces[p]!.neighbors) out.add(n);
  }
  return out;
}

function setup() {
  const state = twoNationGame(6);
  const [red, green] = nationIds(state) as [NationId, NationId];
  const capital = capitalOf(state, red).id;
  const scout = commandersIn(state, capital).find((c) => c.unit === 'cinderScout')!;
  return { state, red, green, capital, scout };
}

describe('vision', () => {
  it('covers owned provinces and their neighbors, armies and theirs, and 2 around scouts', () => {
    const { state, red, capital, scout } = setup();
    expect(visionOf(state, red)).toEqual(ball(state, capital, 2));
    const far = Object.keys(state.map.provinces).find(
      (p) => !ball(state, capital, 4).has(p as ProvinceId),
    ) as ProvinceId;
    scout.location = far;
    const expected = new Set([...ball(state, capital, 1), ...ball(state, far, 2)]);
    expect(visionOf(state, red)).toEqual(expected);
  });

  it("shows other nations' armies in vision, but not stealthy scouts or empty garrisons", () => {
    const { state, red, green, capital } = setup();
    const next = state.map.provinces[capital]!.neighbors[0]!;
    const army = addArmy(state, green, next, 'warden', 5, 'wardenCaptain');
    const scout = addArmy(state, green, next, 'warden', 1, 'thornScout');
    scout.squads = [];
    const seen = visibleCommanders(state, red);
    expect(seen).toContain(army);
    expect(seen).not.toContain(scout);
    expect(isStealthy(scout)).toBe(true);
    scout.squads = army.squads.splice(0, 1);
    expect(isStealthy(scout)).toBe(false);
    expect(visibleCommanders(state, red)).toContain(scout);
    // Independents are not armies of a nation.
    expect(visibleCommanders(state, red).every((c) => c.owner === green)).toBe(true);
    // Deepmoss is far away: its army and garrison are out of sight.
    const deepmoss = capitalOf(state, green).id;
    expect(visibleCommanders(state, red).some((c) => c.location === deepmoss)).toBe(false);
  });
});

describe('vision of ordinary commanders and garrisons', () => {
  it('lets any commander see its neighbors, from where it last stood while marching', () => {
    const { state, red, capital } = setup();
    const chief = commandersIn(state, capital).find((c) => c.unit === 'ashChieftain')!;
    const far = Object.keys(state.map.provinces).find(
      (p) => !ball(state, capital, 4).has(p as ProvinceId),
    ) as ProvinceId;
    chief.location = far;
    for (const p of ball(state, far, 1)) expect(visionOf(state, red).has(p)).toBe(true);
    const beyond = state.map.provinces[far]!.neighbors.find(
      (n) => !ball(state, capital, 3).has(n),
    )!;
    chief.transit = { from: far, to: beyond, progress: 3, totalDays: 4 };
    const ahead = state.map.provinces[beyond]!.neighbors.filter((n) => !ball(state, far, 1).has(n));
    const vision = visionOf(state, red);
    for (const p of ahead) {
      if (!ball(state, capital, 2).has(p)) expect(vision.has(p)).toBe(false);
    }
  });

  it('hides an empty garrison and shows one that keeps troops', () => {
    const { state, red, green } = setup();
    const deepmoss = capitalOf(state, green).id;
    const holder = state.commanders[state.provinces[deepmoss]!.garrison!]!;
    addArmy(state, red, deepmoss, 'cinderWarrior', 1);
    expect(holder.squads).toEqual([]);
    expect(visibleCommanders(state, red)).not.toContain(holder);
    holder.squads.push(...addArmy(state, green, deepmoss, 'warden', 3, 'wardenCaptain').squads);
    expect(visibleCommanders(state, red)).toContain(holder);
  });

  it('still shows an enemy army marching out of a province in sight', () => {
    const { state, red, green, capital } = setup();
    const next = state.map.provinces[capital]!.neighbors[0]!;
    const out = state.map.provinces[next]!.neighbors.find((n) => !ball(state, capital, 2).has(n))!;
    const foe = addArmy(state, green, next, 'warden', 5, 'wardenCaptain');
    foe.transit = { from: next, to: out, progress: 3, totalDays: 4 };
    expect(visibleCommanders(state, red)).toContain(foe);
  });
});

describe('explored', () => {
  it('starts with the capital and what the scout sees, and grows as scouts and borders move', () => {
    const { state, red, capital, scout } = setup();
    expect(new Set(state.nations[red]!.explored)).toEqual(ball(state, capital, 2));
    const far = Object.keys(state.map.provinces).find(
      (p) => !ball(state, capital, 4).has(p as ProvinceId),
    ) as ProvinceId;
    scout.location = far;
    runDays(state, 1);
    for (const p of ball(state, far, 2)) expect(isExplored(state, red, p)).toBe(true);
    // Leaving does not forget.
    scout.location = capital;
    runDays(state, 1);
    expect(isExplored(state, red, far)).toBe(true);
    const owned = Object.keys(state.provinces).find(
      (p) => !state.nations[red]!.explored.includes(p as ProvinceId),
    ) as ProvinceId;
    annex(state, red, owned);
    runDays(state, 1);
    expect(isExplored(state, red, owned)).toBe(true);
    expect(new Set(state.nations[red]!.explored).size).toBe(state.nations[red]!.explored.length);
  });

  it('is not widened by ordinary armies', () => {
    const { state, red, capital, scout } = setup();
    scout.location = capital;
    const before = new Set(state.nations[red]!.explored);
    const far = Object.keys(state.map.provinces).find(
      (p) => !ball(state, capital, 4).has(p as ProvinceId),
    ) as ProvinceId;
    commandersIn(state, capital).find((c) => c.unit === 'ashChieftain')!.location = far;
    runDays(state, 1);
    expect(new Set(state.nations[red]!.explored)).toEqual(before);
  });
});

describe('independent strength', () => {
  it('reads as a word unless a scout is in or next to the province', () => {
    const { state, red, capital, scout } = setup();
    const near = state.map.provinces[capital]!.neighbors[0]!;
    const count = 8 + 4 * state.map.provinces[near]!.capitalDistance;
    expect(independentStrengthView(state, red, near)).toEqual({ word: 'weak', exact: count });
    scout.location = Object.keys(state.map.provinces).find(
      (p) => !ball(state, near, 2).has(p as ProvinceId),
    ) as ProvinceId;
    expect(independentStrengthView(state, red, near)).toEqual({ word: 'weak', exact: null });
    // Two steps away is not next to it.
    const twoAway = Object.keys(state.map.provinces).find(
      (p) =>
        ball(state, near, 2).has(p as ProvinceId) && !ball(state, near, 1).has(p as ProvinceId),
    ) as ProvinceId;
    scout.location = twoAway;
    expect(independentStrengthView(state, red, near).exact).toBeNull();
  });

  it("is not revealed by another nation's scout", () => {
    const { state, red, green, capital, scout } = setup();
    const near = state.map.provinces[capital]!.neighbors[0]!;
    scout.location = Object.keys(state.map.provinces).find(
      (p) => !ball(state, near, 2).has(p as ProvinceId),
    ) as ProvinceId;
    const theirs = addArmy(state, green, near, 'warden', 1, 'thornScout');
    theirs.squads = [];
    expect(independentStrengthView(state, red, near).exact).toBeNull();
    expect(independentStrengthView(state, green, near).exact).toBe(
      8 + 4 * state.map.provinces[near]!.capitalDistance,
    );
  });
});

describe('scry', () => {
  it('adds the scried province alone to vision, none of its neighbors', () => {
    const { state, red } = setup();
    const seen = visionOf(state, red);
    const far = Object.values(state.map.provinces).find(
      (p) => !seen.has(p.id) && p.neighbors.every((n) => !seen.has(n)),
    )!.id;
    state.provinceEffects.push({
      id: newId(state, 'effect'),
      province: far,
      nation: red,
      source: 'test',
      untilDay: state.day + 30,
      kind: 'scry',
    });
    const now = visionOf(state, red);
    expect([...now].filter((p) => !seen.has(p))).toEqual([far]);
  });
});

describe('sighted messages', () => {
  it('tell a nation once per province and enemy when armies come into sight', () => {
    const { state, red, green, capital } = setup();
    const next = state.map.provinces[capital]!.neighbors[0]!;
    const far = Object.keys(state.map.provinces).find(
      (p) => !ball(state, capital, 3).has(p as ProvinceId),
    ) as ProvinceId;
    const one = addArmy(state, green, far, 'warden', 5, 'wardenCaptain');
    const two = addArmy(state, green, far, 'warden', 5, 'wardenCaptain');
    runDays(state, 1);
    const sightings = () => state.messages.filter((m) => m.nation === red && m.kind === 'sighted');
    expect(sightings()).toEqual([]);
    one.location = next;
    two.location = next;
    runDays(state, 1);
    expect(sightings().map((m) => [m.province, m.text])).toEqual([
      [next, `Thornwood army sighted in ${state.map.provinces[next]!.name}.`],
    ]);
    // Still in sight: nothing new. Out and back in: told again.
    runDays(state, 3);
    expect(sightings()).toHaveLength(1);
    one.location = far;
    two.location = far;
    runDays(state, 1);
    one.location = next;
    runDays(state, 1);
    expect(sightings()).toHaveLength(2);
    expect(state.nations[red]!.inSight).toEqual([one.id]);
  });

  it('are not sent for stealthy scouts or empty garrisons', () => {
    const { state, red, green, capital } = setup();
    const next = state.map.provinces[capital]!.neighbors[0]!;
    addArmy(state, green, next, 'warden', 1, 'thornScout').squads = [];
    runDays(state, 2);
    expect(state.messages.some((m) => m.nation === red && m.kind === 'sighted')).toBe(false);
  });
});
