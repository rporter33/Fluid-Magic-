// Entity ids come from one monotonic counter kept in state (GameState.nextId), never from
// randomness, so the same command log always yields the same ids. Each kind has a prefix,
// which keeps ids readable in saves and lets a branded type tell kinds apart at compile time.

export const ID_PREFIXES = {
  province: 'p',
  nation: 'n',
  commander: 'c',
  squad: 'sq',
  battle: 'b',
  message: 'm',
  effect: 'fx',
  recruit: 'rq',
} as const;

export type IdKind = keyof typeof ID_PREFIXES;

export type Id<K extends IdKind> = string & { readonly __idKind: K };
export type ProvinceId = Id<'province'>;
export type NationId = Id<'nation'>;
export type CommanderId = Id<'commander'>;
export type SquadId = Id<'squad'>;
export type BattleId = Id<'battle'>;
export type MessageId = Id<'message'>;
export type EffectId = Id<'effect'>;
export type RecruitId = Id<'recruit'>;

/** Anything that owns the id counter: GameState, or a scratch counter in mapgen. */
export interface IdCounter {
  nextId: number;
}

/** Takes the next number from the counter and returns it as an id of `kind`. */
export function newId<K extends IdKind>(counter: IdCounter, kind: K): Id<K> {
  const n = counter.nextId;
  if (!Number.isSafeInteger(n) || n < 0) throw new RangeError(`bad id counter ${n}`);
  counter.nextId = n + 1;
  return `${ID_PREFIXES[kind]}${n}` as Id<K>;
}

const ID_PATTERN = /^([a-z]+)(0|[1-9]\d*)$/;

/** Type guard for deserialized ids: the kind's prefix followed by a counter value. */
export function isId<K extends IdKind>(value: unknown, kind: K): value is Id<K> {
  if (typeof value !== 'string') return false;
  const match = ID_PATTERN.exec(value);
  return match !== null && match[1] === ID_PREFIXES[kind];
}
