// GameSetup -> GameState (docs/06-architecture.md). Generates the map with each nation's
// capital, then places nations, capital buildings, garrisons, and starting armies.
import { isNationDefId, nationDef } from '../content';
import { CAPITAL_BUILDINGS } from '../content/buildings';
import { isColor, NATION_BANNERS } from '../content/colors';
import { MAPGEN } from '../content/mapgen';
import { SCALE_AXES, SCALE_MAX, SCALE_MIN } from '../content/pretenders/scales';
import { DEFAULT_TAX_RATE, DOMINION, ECONOMY, RESEARCH_LEVEL_POINTS } from '../content/rules';
import { generateMap } from '../mapgen/generate';
import { numbered } from '../mapgen/names';
import { createCommander, createSquad } from './commanders';
import { newId, type ProvinceId } from './ids';
import { placeIndependents } from './independents';
import { createRng } from './rng';
import { zeroMana } from './selectors';
import { getProvince } from './state';
import { STATE_VERSION, type GameSetup, type GameState, type ProvinceState } from './types';
import { updateExplored, updateSightings } from './visibility';

/** Keeps the game's random stream apart from the map generator's, which uses the bare seed. */
const GAME_RNG_SALT = 0x5f3759df;

function checkSetup(setup: GameSetup): void {
  const n = setup.nations.length;
  if (n < MAPGEN.minNations || n > MAPGEN.maxNations) {
    throw new RangeError(`need ${MAPGEN.minNations} to ${MAPGEN.maxNations} nations, got ${n}`);
  }
  for (const { nation, pretender } of setup.nations) {
    if (!isNationDefId(nation)) throw new RangeError(`unknown nation ${String(nation)}`);
    const { dominion, scales, pips } = pretender;
    if (!Number.isInteger(dominion) || dominion < DOMINION.min || dominion > DOMINION.max) {
      throw new RangeError(`dominion must be ${DOMINION.min} to ${DOMINION.max}`);
    }
    for (const axis of SCALE_AXES) {
      const v = scales[axis];
      if (!Number.isInteger(v) || v < SCALE_MIN || v > SCALE_MAX) {
        throw new RangeError(`scale ${axis} must be an integer ${SCALE_MIN} to ${SCALE_MAX}`);
      }
    }
    for (const [color, count] of Object.entries(pips)) {
      if (!isColor(color) || !Number.isInteger(count) || count < 0) {
        throw new RangeError(`bad pretender pips ${color}`);
      }
    }
  }
}

function independentProvince(id: ProvinceId, pop: number): ProvinceState {
  return {
    id,
    owner: null,
    pop,
    unrest: 0,
    taxRate: DEFAULT_TAX_RATE,
    pd: 0,
    buildings: [],
    construction: null,
    materials: 0,
    recruitQueue: [],
    garrison: null,
    dominion: { nation: null, strength: 0 },
    siege: null,
    wellspringClaimedBy: null,
  };
}

export function createGame(setup: GameSetup): GameState {
  checkSetup(setup);
  const defs = setup.nations.map((n) => nationDef(n.nation));
  const map = generateMap({
    seed: setup.seed,
    size: setup.mapSize,
    capitals: defs.map((d) => ({
      color: d.colors[0],
      terrain: d.capitalTerrain,
      name: d.capitalName,
    })),
  });

  const state: GameState = {
    version: STATE_VERSION,
    seed: setup.seed,
    rng: createRng(Math.trunc(setup.seed) ^ GAME_RNG_SALT),
    nextId: 0,
    day: 0,
    map,
    provinces: {},
    nations: {},
    commanders: {},
    battles: [],
    messages: [],
    provinceEffects: [],
    result: null,
  };
  for (const mp of Object.values(map.provinces)) {
    state.provinces[mp.id] = independentProvince(mp.id, mp.startPop);
  }

  const names = new Set<string>();
  const bannersUsed = new Map<string, number>();
  setup.nations.forEach((nationSetup, slot) => {
    const def = defs[slot];
    const capital = map.capitals[slot];
    if (!def || !capital) throw new Error(`no capital for nation slot ${slot}`);
    const id = newId(state, 'nation');
    const name = numbered(def.name, names);
    names.add(name);
    // The k-th nation of a primary color takes that color's k-th banner.
    const primary = def.colors[0];
    const k = bannersUsed.get(primary) ?? 0;
    bannersUsed.set(primary, k + 1);
    const banner = NATION_BANNERS[primary][k];
    if (banner === undefined) throw new RangeError(`no banner left for color ${primary}`);
    const points = zeroMana();
    points[def.startingResearch.color] = RESEARCH_LEVEL_POINTS[def.startingResearch.level] ?? 0;
    state.nations[id] = {
      id,
      def: nationSetup.nation,
      name,
      colors: [...def.colors],
      banner,
      capital,
      ai: nationSetup.ai
        ? { difficulty: nationSetup.ai.difficulty, memory: { target: null, lastPlanDay: -1 } }
        : null,
      gold: ECONOMY.startGold,
      mana: zeroMana(),
      research: { color: def.startingResearch.color, points },
      pretender: {
        ...nationSetup.pretender,
        pips: { ...nationSetup.pretender.pips },
        scales: { ...nationSetup.pretender.scales },
      },
      pretenderId: null,
      prophetId: null,
      prophetAvailableDay: 0,
      unpaidDays: 0,
      godless: false,
      eliminated: false,
      explored: [],
      inSight: [],
      stats: { battlesWon: 0, battlesLost: 0, provincesTaken: 0, manaSpent: zeroMana() },
    };
  });

  // Capitals and armies after all nations, so nation ids run n0, n1, ...
  for (const nation of Object.values(state.nations)) {
    const province = getProvince(state, nation.capital);
    province.owner = nation.id;
    province.buildings = [...CAPITAL_BUILDINGS];
    province.dominion = { nation: nation.id, strength: nation.pretender.dominion };
    province.garrison = createCommander(state, 'garrison', nation.id, nation.capital).id;
    for (const start of nationDef(nation.def).startingArmy) {
      const commander = createCommander(state, start.commander, nation.id, nation.capital);
      for (const squad of start.squads) {
        commander.squads.push(createSquad(state, squad.unit, squad.count));
      }
    }
  }
  placeIndependents(state);
  updateExplored(state);
  updateSightings(state);
  return state;
}
