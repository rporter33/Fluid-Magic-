// Shared helpers for sim tests.
import type { NationDefId, UnitTypeId } from '../../src/content';
import { NEUTRAL_SCALES, type Scales } from '../../src/content/pretenders/scales';
import { createCommander, createSquad, removeCommander } from '../../src/sim/commanders';
import { applyCommand } from '../../src/sim/commands';
import { createGame } from '../../src/sim/createGame';
import { advance } from '../../src/sim/tick';
import type { NationId, ProvinceId } from '../../src/sim/ids';
import type {
  ColorAmounts,
  CommanderState,
  GameState,
  NationSetup,
  PretenderDesign,
  ProvinceState,
} from '../../src/sim/types';

/**
 * A test pretender: an imprisoned Oracle, cheap enough for any test's scales and absent from the
 * map until day 1050, so tests see only the nation's starting army.
 */
export function pretender(overrides: Partial<PretenderDesign> = {}): PretenderDesign {
  return {
    chassis: 'oracle',
    pips: {},
    dominion: 5,
    scales: { ...NEUTRAL_SCALES },
    awakening: 'imprisoned',
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

/** Gives a province to a nation and removes the independent defenders standing in it. */
export function annex(state: GameState, nation: NationId, province: ProvinceId): ProvinceState {
  for (const c of Object.values(state.commanders)) {
    if (c.owner === null && c.location === province) removeCommander(state, c.id);
  }
  const p = state.provinces[province]!;
  p.owner = nation;
  return p;
}

export function neighbors(state: GameState, id: ProvinceId): ProvinceId[] {
  return state.map.provinces[id]!.neighbors;
}

/** Red's Ash Chieftain army standing in Red's capital. */
export function redField(seed = 1) {
  const state = twoNationGame(seed);
  const [red, green] = nationIds(state) as [NationId, NationId];
  const capital = capitalOf(state, red).id;
  const army = commandersIn(state, capital).find((c) => c.unit === 'ashChieftain')!;
  return { state, red, green, capital, army };
}

export function move(
  state: GameState,
  nation: NationId,
  commanders: readonly CommanderState[],
  path: ProvinceId[],
) {
  return applyCommand(state, {
    type: 'move',
    nation,
    commanders: commanders.map((c) => c.id),
    path,
  });
}

/** Lays siege to a province: an army of the besieger stands there, walls at full strength. */
export function besiege(state: GameState, nation: NationId, province: ProvinceId): CommanderState {
  const army = addArmy(state, nation, province, 'cinderWarrior', 5);
  state.provinces[province]!.siege = { attacker: nation, wallHp: 300, storm: false };
  return army;
}

/** Mana pools full enough for any ritual. */
export const RICH_POOLS: ColorAmounts = { W: 50, U: 50, B: 50, R: 50, G: 50 };

/** A nation's master mage in its capital lab, with every level researched and full pools. */
export function ritualCaster(state: GameState, nation: NationId): CommanderState {
  const n = state.nations[nation]!;
  n.mana = { ...RICH_POOLS };
  n.research.points = { W: 1050, U: 1050, B: 1050, R: 1050, G: 1050 };
  const color = n.colors[0];
  const mage = createCommander(
    state,
    color === 'R' ? 'cinderMagus' : 'elderDruid',
    nation,
    n.capital,
  );
  mage.pips = { [color]: 4 };
  return mage;
}

export function castRitual(
  state: GameState,
  nation: NationId,
  c: CommanderState,
  spell: string,
  target: ProvinceId | null = null,
) {
  return applyCommand(state, { type: 'castRitual', nation, commander: c.id, spell, target });
}
