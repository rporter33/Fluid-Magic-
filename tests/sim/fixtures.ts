// Shared helpers for sim tests.
import type { NationDefId, UnitTypeId } from '../../src/content';
import { NEUTRAL_SCALES, type Scales } from '../../src/content/pretenders/scales';
import { createCommander, createSquad } from '../../src/sim/commanders';
import { createGame } from '../../src/sim/createGame';
import { advance } from '../../src/sim/tick';
import type { NationId, ProvinceId } from '../../src/sim/ids';
import type {
  CommanderState,
  GameState,
  NationSetup,
  PretenderDesign,
  ProvinceState,
} from '../../src/sim/types';

export function pretender(overrides: Partial<PretenderDesign> = {}): PretenderDesign {
  return {
    chassis: 'titan',
    pips: {},
    dominion: 5,
    scales: { ...NEUTRAL_SCALES },
    awakening: 'awake',
    ...overrides,
  };
}

export function nation(
  def: NationDefId,
  overrides: Partial<NationSetup> = {},
  scales: Partial<Scales> = {},
): NationSetup {
  return {
    nation: def,
    pretender: pretender({ scales: { ...NEUTRAL_SCALES, ...scales } }),
    ai: null,
    ...overrides,
  };
}

/** A Medium two-nation game: Cinder Horde (player) against Thornwood (AI). */
export function twoNationGame(
  seed = 1,
  red: Partial<NationSetup> = {},
  green: Partial<NationSetup> = {},
): GameState {
  return createGame({
    seed,
    mapSize: 'medium',
    nations: [
      nation('cinderHorde', red),
      nation('thornwood', { ai: { difficulty: 'normal' }, ...green }),
    ],
  });
}

/** A two-nation game where Cinder Horde's pretender has the given dominion and scales. */
export function redGame(dominion: number, scales: Partial<Scales> = {}, seed = 1): GameState {
  return twoNationGame(seed, {
    pretender: pretender({ dominion, scales: { ...NEUTRAL_SCALES, ...scales } }),
  });
}

export function nationIds(state: GameState): NationId[] {
  return Object.keys(state.nations) as NationId[];
}

export function capitalOf(state: GameState, id: NationId): ProvinceState {
  const capital = state.nations[id]!.capital;
  return state.provinces[capital]!;
}

/** Commanders standing in a province, garrison holder included. */
export function commandersIn(state: GameState, province: ProvinceId): CommanderState[] {
  return Object.values(state.commanders).filter((c) => c.location === province);
}

/** Adds a commander with one squad to a province. */
export function addArmy(
  state: GameState,
  owner: NationId | null,
  province: ProvinceId,
  troops: UnitTypeId,
  count: number,
  leader: UnitTypeId = 'ashChieftain',
): CommanderState {
  const commander = createCommander(state, leader, owner, province);
  commander.squads.push(createSquad(state, troops, count));
  return commander;
}

/** A non-capital province, preferably on the given terrain. */
export function independentProvince(state: GameState, terrain?: string): ProvinceState {
  const found = Object.values(state.provinces).find(
    (p) =>
      p.owner === null && (terrain === undefined || state.map.provinces[p.id]!.terrain === terrain),
  );
  if (!found) throw new Error(`no independent ${terrain ?? ''} province`);
  return found;
}

export function runDays(state: GameState, days: number): void {
  for (let d = 0; d < days; d++) advance(state);
}
