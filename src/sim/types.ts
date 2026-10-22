// GameState and every nested type (docs/06-architecture.md, "Simulation contract"). The whole
// game is one JSON-serializable object; later phases fill in behavior, not new top-level
// shapes. Rates and pools are floats; selectors expose integers for display.
import type { NationDefId, UnitTypeId } from '../content';
import type { Difficulty } from '../content/ai';
import type { Color } from '../content/colors';
import type { MapSizeId } from '../content/mapgen';
import type { PretenderDesign } from '../content/pretenders/types';
import type { TaxRate } from '../content/rules';
import type { BuildingId } from '../content/types';
import type { MapData } from '../mapgen/types';
import type { BattleEvent, BattleRoster, BattleSide } from './battle/events';
import type { BattleRerun, BattleScene } from './battle/record';
import type {
  BattleId,
  CommanderId,
  EffectId,
  MessageId,
  NationId,
  ProvinceId,
  RecruitId,
  SquadId,
} from './ids';
import type { RngState } from './rng';

export type { Difficulty };

/**
 * Bumped whenever the saved shape changes; migrate.ts lifts older saves. 2: battle records gained
 * scene and rerun (Phase 10 S1). 3: nations gained pretenderName and pretenderReturnDay,
 * provinces extraSprings (Phase 6b.1). 4: the map gained wilds, its impassable wild ranges
 * (Phase 1b).
 */
export const STATE_VERSION = 4;

export type ColorAmounts = Record<Color, number>;
export type Pips = Partial<Record<Color, number>>;

// ---------------------------------------------------------------- setup

export type { Awakening, PretenderDesign } from '../content/pretenders/types';

export interface NationSetup {
  nation: NationDefId;
  pretender: PretenderDesign;
  /**
   * The god's name (docs/05-pretender.md decisions): 1 to 24 Latin letters, spaces,
   * apostrophes, hyphens and periods, starting with a letter. Absent: the body's name.
   */
  pretenderName?: string;
  /** Null for the human player. */
  ai: { difficulty: Difficulty } | null;
}

export interface GameSetup {
  seed: number;
  mapSize: MapSizeId;
  /** 2 to 4 nations; the order fixes nation ids and capital slots. */
  nations: NationSetup[];
  /**
   * Impassable wild ranges on the map (Phase 1b; MapGenParams.wilds). Absent or true: the map
   * has them, as New Game does since the owner's decision of 2026-10-21; false: none.
   */
  wilds?: boolean;
}

// ---------------------------------------------------------------- provinces

export interface Construction {
  building: BuildingId;
  daysLeft: number;
  nation: NationId;
  /** The commander who started it; its order returns to idle when the work ends. */
  commander: CommanderId | null;
}

/** A fort's recruitment queue item. Gold and materials are paid on queueing. */
export interface RecruitOrder {
  id: RecruitId;
  unit: UnitTypeId;
  count: number;
  /** The nation that queued it; the item is dropped if the fort changes hands. */
  nation: NationId;
  daysLeft: number;
  /** What was paid, so a cancellation can refund it exactly. */
  paid: { gold: number; materials: number };
}

export interface Dominion {
  /** The dominating nation, or null when no nation holds dominion here. */
  nation: NationId | null;
  /** 0 to 10. */
  strength: number;
}

export interface SiegeState {
  attacker: NationId;
  wallHp: number;
  /** The besieger ordered a storm; it is fought in the next tick's siege step. */
  storm: boolean;
}

export interface ProvinceState {
  id: ProvinceId;
  /** Null for Independents. */
  owner: NationId | null;
  /** Float; displayed rounded down. */
  pop: number;
  /** 0 to 100. */
  unrest: number;
  taxRate: TaxRate;
  /** Provincial defense level, 0 to 30. */
  pd: number;
  buildings: BuildingId[];
  construction: Construction | null;
  /** The fort's materials pool; stays 0 without a fort. */
  materials: number;
  recruitQueue: RecruitOrder[];
  /**
   * The fort's garrison holder: null exactly when there is no fort; otherwise an existing
   * holder owned by the province's owner and standing here. A fort that changes hands gets a
   * new one (recruitment.ts replaceGarrison).
   */
  garrison: CommanderId | null;
  dominion: Dominion;
  siege: SiegeState | null;
  /** The nation that has claimed this province's Wellspring. */
  wellspringClaimedBy: NationId | null;
  /**
   * Springs added in play to the map's (the World Tree's and the Sacred Spring boon's, at the
   * capital); they pay mana like map springs and stay with the province when it changes hands.
   */
  extraSprings: Color[];
}

// ---------------------------------------------------------------- commanders

export const FORMATIONS = ['front', 'middle', 'rear'] as const;
export type Formation = (typeof FORMATIONS)[number];

/** Identical troops under a commander. Troops have no identity: a count and an HP pool. */
export interface Squad {
  id: SquadId;
  unit: UnitTypeId;
  count: number;
  /**
   * Shared HP pool: 0 < hp <= count * unit hp. Splits divide it in proportion and never
   * recompute count from it; only starvation does (docs/01 Implementation decisions).
   */
  hp: number;
  formation: Formation;
  /**
   * Starvation counter: up one per starving day, down one per fed day, and capped so morale
   * recovers at the rate it was lost. The docs' squad moraleMod is derived from this and the
   * nation's unpaidDays, not stored.
   */
  starvedDays: number;
}

export const SCRIPT_KINDS = ['cast', 'attack', 'hold', 'retreat'] as const;

export type ScriptSlot =
  /** A null spell casts the best castable one (docs/04-battle.md, "Scripts"). */
  | { kind: 'cast'; spellId: string | null }
  | { kind: 'attack' }
  | { kind: 'hold' }
  | { kind: 'retreat' };

export type CommanderOrder =
  | { kind: 'idle' }
  /**
   * Provinces still to enter after the current transit, in order. mapSpeed is frozen when the
   * move is ordered: the slowest speed of every commander given this move, so a group keeps
   * one pace on every leg.
   */
  | { kind: 'move'; path: ProvinceId[]; mapSpeed: number }
  | { kind: 'pillage' }
  | { kind: 'patrol' }
  | { kind: 'research' }
  | { kind: 'preach' }
  /** The ritual's progress lives in the order: replacing the order or losing the caster ends it. */
  | { kind: 'castRitual'; spellId: string; target: ProvinceId | null; daysLeft: number }
  | { kind: 'claimWellspring'; daysLeft: number }
  | { kind: 'build'; building: BuildingId; province: ProvinceId };

export interface Transit {
  from: ProvinceId;
  to: ProvinceId;
  /** Days travelled so far. */
  progress: number;
  totalDays: number;
}

export interface CommanderState {
  id: CommanderId;
  unit: UnitTypeId;
  /** Null for independent defenders. */
  owner: NationId | null;
  name: string;
  /**
   * The province the commander last stood in, where it eats, sees, and is present for every
   * purpose. In transit that is transit.from on an outbound leg and transit.to on a reversed
   * one (it turned back before arriving). Between ticks, a move order always has a transit.
   */
  location: ProvinceId;
  transit: Transit | null;
  /** The province it last left, where routed attackers retreat to. */
  cameFrom: ProvinceId | null;
  hp: number;
  squads: Squad[];
  order: CommanderOrder;
  /** Five battle script slots. */
  script: ScriptSlot[];
  /** The unit's pips plus any extra pip rolled at recruitment. */
  pips: Pips;
  holy: number;
  carriedMana: Pips;
  /** Starvation counter, as on squads. */
  starvedDays: number;
}

// ---------------------------------------------------------------- nations

export interface ResearchState {
  /** The color research points currently go to. */
  color: Color;
  /** Cumulative research points per color; levels derive from them. */
  points: ColorAmounts;
}

export interface AiMemory {
  target: ProvinceId | null;
  lastPlanDay: number;
}

export interface NationStats {
  battlesWon: number;
  battlesLost: number;
  provincesTaken: number;
  manaSpent: ColorAmounts;
}

export interface NationState {
  id: NationId;
  def: NationDefId;
  name: string;
  /** Color identity; one color in M1, the first is the primary. */
  colors: readonly [Color, ...Color[]];
  /** Display color for ownership bands, dominion candles, and army badges. */
  banner: string;
  capital: ProvinceId;
  /** Null for the human player. */
  ai: { difficulty: Difficulty; memory: AiMemory } | null;
  gold: number;
  mana: ColorAmounts;
  research: ResearchState;
  pretender: PretenderDesign;
  /**
   * The pretender's commander; the only record of who it is. Null before the pretender arrives,
   * while it is recalled (Godless) or reforming, and after it dies.
   */
  pretenderId: CommanderId | null;
  /** The pretender died for good; it never returns (a reforming Ash Phoenix is not dead). */
  pretenderDead: boolean;
  /** The god's name from the setup, given to its commander on every arrival; null: the body's. */
  pretenderName: string | null;
  /**
   * N8: the day a pretender that died in its own dominion and reforms (the Ash Phoenix) rises
   * again at the capital; null otherwise, and again once it has risen.
   */
  pretenderReturnDay: number | null;
  /** The prophet's commander; the only record of who it is. */
  prophetId: CommanderId | null;
  /** First day a new prophet may be named. */
  prophetAvailableDay: number;
  /**
   * Unpaid upkeep counter: up by the unpaid fraction of each short day, down one per fully
   * paid day, capped like starvedDays. Troops lose morale by it.
   */
  unpaidDays: number;
  godless: boolean;
  eliminated: boolean;
  /** Provinces ever owned or scouted, whose population and springs are known. */
  explored: ProvinceId[];
  /** Enemy commanders in sight at the end of the last day; newcomers post a sighting. */
  inSight: CommanderId[];
  stats: NationStats;
}

// ---------------------------------------------------------------- events and records

export interface BattleRecord {
  id: BattleId;
  day: number;
  province: ProvinceId;
  /** Null when Independents fought. */
  attacker: NationId | null;
  defender: NationId | null;
  winner: BattleSide;
  rounds: number;
  /** Both sides as the battle began. */
  roster: Record<BattleSide, BattleRoster>;
  replay: BattleEvent[];
  /** A5: where it was fought. */
  scene: BattleScene;
  /** Setup and starting rng for a blow-by-blow re-run; null for older records. */
  rerun: BattleRerun | null;
}

export type MessageKind =
  | 'battle'
  | 'recruited'
  | 'built'
  | 'ritual'
  | 'research'
  | 'captured'
  | 'lost'
  | 'dominion'
  | 'starvation'
  | 'wellspring'
  | 'sighted'
  | 'info';

export interface Message {
  id: MessageId;
  day: number;
  /** The nation the message is for. */
  nation: NationId;
  kind: MessageKind;
  text: string;
  province: ProvinceId | null;
  battle: BattleId | null;
}

/** What a timed province effect does. */
export type ProvinceEffectBody =
  | { kind: 'growth'; deltaScale: number }
  | { kind: 'supply'; deltaPct: number }
  | { kind: 'materials'; delta: number }
  | { kind: 'defense'; prot: number; def: number }
  /** The nation sees this province as if it stood there. */
  | { kind: 'scry' };

/**
 * Timed province modifiers from rituals. Active while state.day < untilDay; readers go through
 * activeEffects, and advance drops expired ones at the end of each day.
 */
export type ProvinceEffect = {
  id: EffectId;
  province: ProvinceId;
  nation: NationId;
  /** The spell that made it. */
  source: string;
  untilDay: number;
} & ProvinceEffectBody;

export interface GameResult {
  day: number;
  /** The winning nation; null if the game ended without one. */
  winner: NationId | null;
  reason: 'wellsprings' | 'lastCapital' | 'playerDefeated';
}

// ---------------------------------------------------------------- the game

export interface GameState {
  version: number;
  seed: number;
  rng: RngState;
  /** Shared id counter for everything created after map generation. */
  nextId: number;
  /** Absolute day; day 0 is Y1 M1 D1. */
  day: number;
  map: MapData;
  provinces: Record<ProvinceId, ProvinceState>;
  nations: Record<NationId, NationState>;
  commanders: Record<CommanderId, CommanderState>;
  /** The most recent battles with replays, oldest first. */
  battles: BattleRecord[];
  /** The most recent messages per nation, oldest first. */
  messages: Message[];
  provinceEffects: ProvinceEffect[];
  result: GameResult | null;
}
