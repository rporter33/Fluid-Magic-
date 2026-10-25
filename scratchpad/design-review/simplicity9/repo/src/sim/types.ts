// GameState and every nested type (docs/06-architecture.md, "Simulation contract"). The whole
// game is one JSON-serializable object; later phases fill in behavior, not new top-level
// shapes. Rates and pools are floats; selectors expose integers for display.
import type { NationDefId, UnitTypeId } from '../content';
import type { Difficulty } from '../content/ai';
import type { Color } from '../content/colors';
import type { MapSizeId } from '../content/mapgen';
import type { Scales } from '../content/pretenders/scales';
import type { TaxRate } from '../content/rules';
import type { BuildingId } from '../content/types';
import type { MapData } from '../mapgen/types';
import type { BattleEvent, BattleSide } from './battle/events';
import type {
  BattleId,
  CommanderId,
  EffectId,
  MessageId,
  NationId,
  ProvinceId,
  RitualId,
  SquadId,
} from './ids';
import type { RngState } from './rng';

export type { Difficulty };

/** Bumped whenever the saved shape changes; serialize.ts migrates older saves. */
export const STATE_VERSION = 1;

export type ColorAmounts = Record<Color, number>;
export type Pips = Partial<Record<Color, number>>;

// ---------------------------------------------------------------- setup

export type Awakening = 'awake' | 'dormant' | 'imprisoned';

/** The pre-game pretender design (docs/05-pretender.md). Budget validation is Phase 6. */
export interface PretenderDesign {
  chassis: string;
  pips: Pips;
  /** Dominion score, 1 to 10, before Wellspring bonuses. */
  dominion: number;
  scales: Scales;
  awakening: Awakening;
}

export interface NationSetup {
  nation: NationDefId;
  pretender: PretenderDesign;
  /** Null for the human player. */
  ai: { difficulty: Difficulty } | null;
}

export interface GameSetup {
  seed: number;
  mapSize: MapSizeId;
  /** 2 to 4 nations; the order fixes nation ids and capital slots. */
  nations: NationSetup[];
}

// ---------------------------------------------------------------- provinces

export interface Construction {
  building: BuildingId;
  daysLeft: number;
  nation: NationId;
}

/** A fort's recruitment queue item. Gold and materials are paid on queueing. */
export interface RecruitOrder {
  unit: UnitTypeId;
  count: number;
  daysLeft: number;
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
  /** The fort's garrison holder, present exactly when the province has a fort. */
  garrison: CommanderId | null;
  dominion: Dominion;
  siege: SiegeState | null;
  /** The nation that has claimed this province's Wellspring. */
  wellspringClaimedBy: NationId | null;
}

// ---------------------------------------------------------------- commanders

export type Formation = 'front' | 'middle' | 'rear';

/** Identical troops under a commander. Troops have no identity: a count and an HP pool. */
export interface Squad {
  id: SquadId;
  unit: UnitTypeId;
  count: number;
  /** Shared HP pool, at most count times the unit's hp. */
  hp: number;
  formation: Formation;
  /** Starvation counter: up one per starving day, down one per fed day. */
  starvedDays: number;
}

export type ScriptSlot =
  /** A null spell casts the best castable one (docs/04-battle.md, "Scripts"). */
  | { kind: 'cast'; spellId: string | null }
  | { kind: 'attack' }
  | { kind: 'hold' }
  | { kind: 'retreat' };

export type CommanderOrder =
  | { kind: 'idle' }
  /** Provinces still to enter after the current transit, in order. */
  | { kind: 'move'; path: ProvinceId[] }
  | { kind: 'pillage' }
  | { kind: 'patrol' }
  | { kind: 'research' }
  | { kind: 'preach' }
  | { kind: 'castRitual'; ritual: RitualId }
  | { kind: 'claimWellspring'; daysLeft: number }
  | { kind: 'build'; building: BuildingId };

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
  /** Current province; while in transit, the province it left. */
  location: ProvinceId;
  transit: Transit | null;
  hp: number;
  squads: Squad[];
  order: CommanderOrder;
  /** Five battle script slots. */
  script: ScriptSlot[];
  /** The unit's pips plus any extra pip rolled at recruitment. */
  pips: Pips;
  holy: number;
  carriedMana: Pips;
  prophet: boolean;
  pretender: boolean;
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
  color: Color;
  capital: ProvinceId;
  /** Null for the human player. */
  ai: { difficulty: Difficulty; memory: AiMemory } | null;
  gold: number;
  mana: ColorAmounts;
  research: ResearchState;
  pretender: PretenderDesign;
  /** The pretender's commander once it has arrived. */
  pretenderId: CommanderId | null;
  prophetId: CommanderId | null;
  /** First day a new prophet may be named. */
  prophetAvailableDay: number;
  /** Consecutive days upkeep has gone unpaid; troops lose morale while it runs. */
  unpaidDays: number;
  godless: boolean;
  eliminated: boolean;
  /** Provinces ever owned or scouted, whose population and springs are known. */
  explored: ProvinceId[];
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
  winner: BattleSide | null;
  rounds: number;
  replay: BattleEvent[];
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

export interface RitualInProgress {
  id: RitualId;
  caster: CommanderId;
  spellId: string;
  target: ProvinceId | null;
  daysLeft: number;
}

/** Timed province modifiers from rituals. The effect ends at the start of `untilDay`. */
export type ProvinceEffect = {
  id: EffectId;
  province: ProvinceId;
  nation: NationId;
  /** The spell that made it. */
  source: string;
  untilDay: number;
} & (
  | { kind: 'growth'; deltaScale: number }
  | { kind: 'supply'; deltaPct: number }
  | { kind: 'materials'; delta: number }
  | { kind: 'defense'; prot: number; def: number }
);

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
  messages: Message[];
  activeRituals: RitualInProgress[];
  provinceEffects: ProvinceEffect[];
  result: GameResult | null;
}
