// The required keys of every record a save holds, for the check a loaded save passes after its
// migration (docs/06-architecture.md, "Save and load"; validateSave.ts). Each list is checked
// against its type at compile time: a required key added to a record without its line here
// fails the typecheck with the key named, so the check cannot fall behind the state.
import type { ScaleStep } from '../content/pretenders/scales';
import type { PretenderDesign } from '../content/pretenders/types';
import type { MapData, MapProvince, MapWild } from '../mapgen/types';
import type { BattleRoster } from './battle/events';
import type { BattleScene } from './battle/record';
import type { RngState } from './rng';
import type {
  AiMemory,
  BattleRecord,
  CommanderOrder,
  CommanderState,
  Construction,
  Dominion,
  GameResult,
  GameState,
  Message,
  NationState,
  NationStats,
  ProvinceEffect,
  ProvinceEffectBody,
  ProvinceState,
  RecruitOrder,
  ResearchState,
  ScriptSlot,
  SiegeState,
  Squad,
  Transit,
} from './types';

/** The keys of T that are not optional. */
type RequiredKey<T> = {
  [K in keyof T]-?: Pick<T, K> extends Required<Pick<T, K>> ? K : never;
}[keyof T];

/** The required keys of T a list leaves out; never once the list is complete. */
type Missing<T, L extends readonly PropertyKey[]> = Exclude<RequiredKey<T>, L[number]>;

/** Every required key of T and nothing else, or the typecheck names what is missing. */
function keysOf<T>() {
  return <const L extends readonly (RequiredKey<T> & string)[]>(
    keys: L & ([Missing<T, L>] extends [never] ? unknown : { missing: Missing<T, L> }),
  ): readonly string[] => keys;
}

type OrderOf<K extends CommanderOrder['kind']> = Extract<CommanderOrder, { kind: K }>;
type SlotOf<K extends ScriptSlot['kind']> = Extract<ScriptSlot, { kind: K }>;
type EffectOf<K extends ProvinceEffectBody['kind']> = Extract<ProvinceEffectBody, { kind: K }>;

export const KEYS = {
  game: keysOf<GameState>()([
    'version',
    'seed',
    'rng',
    'nextId',
    'day',
    'map',
    'provinces',
    'nations',
    'commanders',
    'battles',
    'messages',
    'provinceEffects',
    'result',
  ]),
  rng: keysOf<RngState>()(['a', 'b', 'c', 'd']),
  map: keysOf<MapData>()([
    'seed',
    'size',
    'width',
    'height',
    'outline',
    'provinces',
    'capitals',
    'wellsprings',
    'wilds',
  ]),
  mapProvince: keysOf<MapProvince>()([
    'id',
    'name',
    'terrain',
    'site',
    'center',
    'polygon',
    'neighbors',
    'capitalDistance',
    'startPop',
    'springs',
    'independentStrength',
  ]),
  step: keysOf<ScaleStep>()(['axis', 'step']),
  wild: keysOf<MapWild>()(['id', 'kind', 'name', 'cells', 'center', 'borders']),
  province: keysOf<ProvinceState>()([
    'id',
    'owner',
    'pop',
    'unrest',
    'taxRate',
    'pd',
    'buildings',
    'construction',
    'materials',
    'recruitQueue',
    'garrison',
    'dominion',
    'siege',
    'wellspringClaimedBy',
    'extraSprings',
  ]),
  construction: keysOf<Construction>()(['building', 'daysLeft', 'nation', 'commander']),
  recruit: keysOf<RecruitOrder>()(['id', 'unit', 'count', 'nation', 'daysLeft', 'paid']),
  dominion: keysOf<Dominion>()(['nation', 'strength']),
  siege: keysOf<SiegeState>()(['attacker', 'wallHp', 'storm']),
  nation: keysOf<NationState>()([
    'id',
    'def',
    'name',
    'colors',
    'banner',
    'capital',
    'ai',
    'gold',
    'mana',
    'research',
    'pretender',
    'pretenderId',
    'pretenderDead',
    'pretenderName',
    'pretenderReturnDay',
    'prophetId',
    'prophetAvailableDay',
    'unpaidDays',
    'godless',
    'eliminated',
    'explored',
    'inSight',
    'stats',
  ]),
  ai: keysOf<NonNullable<NationState['ai']>>()(['difficulty', 'memory']),
  aiMemory: keysOf<AiMemory>()(['target', 'lastPlanDay']),
  research: keysOf<ResearchState>()(['color', 'points']),
  stats: keysOf<NationStats>()(['battlesWon', 'battlesLost', 'provincesTaken', 'manaSpent']),
  design: keysOf<PretenderDesign>()(['chassis', 'pips', 'dominion', 'scales', 'awakening']),
  commander: keysOf<CommanderState>()([
    'id',
    'unit',
    'owner',
    'name',
    'location',
    'transit',
    'cameFrom',
    'hp',
    'squads',
    'order',
    'script',
    'pips',
    'holy',
    'carriedMana',
    'starvedDays',
  ]),
  squad: keysOf<Squad>()(['id', 'unit', 'count', 'hp', 'formation', 'starvedDays']),
  transit: keysOf<Transit>()(['from', 'to', 'progress', 'totalDays']),
  battle: keysOf<BattleRecord>()([
    'id',
    'day',
    'province',
    'attacker',
    'defender',
    'winner',
    'rounds',
    'roster',
    'replay',
    'scene',
    'rerun',
  ]),
  sides: keysOf<BattleRecord['roster']>()(['attacker', 'defender']),
  roster: keysOf<BattleRoster>()(['nation', 'commanders', 'squads']),
  scene: keysOf<BattleScene>()(['terrain', 'storm']),
  message: keysOf<Message>()(['id', 'day', 'nation', 'kind', 'text', 'province', 'battle']),
  // The keys every effect has, whatever its kind (EFFECT_KEYS has the rest).
  effect: keysOf<Pick<ProvinceEffect, keyof ProvinceEffect>>()([
    'id',
    'province',
    'nation',
    'source',
    'untilDay',
    'kind',
  ]),
  result: keysOf<GameResult>()(['day', 'winner', 'reason']),
} as const;

/** The keys of each kind of commander order; the Record type lists every kind. */
export const ORDER_KEYS: Readonly<Record<CommanderOrder['kind'], readonly string[]>> = {
  idle: keysOf<OrderOf<'idle'>>()(['kind']),
  move: keysOf<OrderOf<'move'>>()(['kind', 'path', 'mapSpeed']),
  pillage: keysOf<OrderOf<'pillage'>>()(['kind']),
  patrol: keysOf<OrderOf<'patrol'>>()(['kind']),
  research: keysOf<OrderOf<'research'>>()(['kind']),
  preach: keysOf<OrderOf<'preach'>>()(['kind']),
  castRitual: keysOf<OrderOf<'castRitual'>>()(['kind', 'spellId', 'target', 'daysLeft']),
  claimWellspring: keysOf<OrderOf<'claimWellspring'>>()(['kind', 'daysLeft']),
  build: keysOf<OrderOf<'build'>>()(['kind', 'building', 'province']),
};

/** The keys of each kind of battle script slot. */
export const SLOT_KEYS: Readonly<Record<ScriptSlot['kind'], readonly string[]>> = {
  cast: keysOf<SlotOf<'cast'>>()(['kind', 'spellId']),
  attack: keysOf<SlotOf<'attack'>>()(['kind']),
  hold: keysOf<SlotOf<'hold'>>()(['kind']),
  retreat: keysOf<SlotOf<'retreat'>>()(['kind']),
};

/** The keys of each kind of timed province effect, beside the ones every effect has. */
export const EFFECT_KEYS: Readonly<Record<ProvinceEffectBody['kind'], readonly string[]>> = {
  growth: keysOf<EffectOf<'growth'>>()(['kind', 'deltaScale']),
  supply: keysOf<EffectOf<'supply'>>()(['kind', 'deltaPct']),
  materials: keysOf<EffectOf<'materials'>>()(['kind', 'delta']),
  defense: keysOf<EffectOf<'defense'>>()(['kind', 'prot', 'def']),
  scry: keysOf<EffectOf<'scry'>>()(['kind']),
};
