// Every spell, keyed by id, and the requirement parser (docs/02-magic.md sections 2 and 6).
// White, Blue, and Black spells are M2: several need effects the primitive list lacks, so no
// data for them is written in M1 (docs/02 Implementation decisions).
import { isColor, type Color } from '../colors';
import { GREEN_SPELLS } from './green';
import { HOLY_SPELLS } from './holy';
import { RED_SPELLS } from './red';
import type { BattleSpellDef, BattleSpellRules, RitualSpellDef, SpellDef } from './types';

export const SPELLS = {
  ...HOLY_SPELLS,
  ...RED_SPELLS,
  ...GREEN_SPELLS,
} satisfies Record<string, SpellDef>;

export type SpellId = keyof typeof SPELLS;

/** Ids of battle spells only (a copied spell's id in an ability's sourceId, N1). */
export type BattleSpellId = {
  [K in SpellId]: (typeof SPELLS)[K]['kind'] extends 'battle' ? K : never;
}[SpellId];

export function isSpellId(value: unknown): value is SpellId {
  return typeof value === 'string' && Object.hasOwn(SPELLS, value);
}

export function spellDef(id: SpellId): SpellDef {
  return SPELLS[id];
}

export function isBattleSpellId(value: unknown): value is BattleSpellId {
  return isSpellId(value) && SPELLS[value].kind === 'battle';
}

const ALL: readonly SpellDef[] = Object.values(SPELLS);

/** Every battle spell, in content order. */
export const BATTLE_SPELLS: readonly BattleSpellDef[] = ALL.filter(
  (s): s is BattleSpellDef => s.kind === 'battle',
);

/** Every ritual, in content order. */
export const RITUALS: readonly RitualSpellDef[] = ALL.filter(
  (s): s is RitualSpellDef => s.kind === 'ritual',
);

/**
 * A battle spell without its presentation (`fx`), the other keys in their order: what the battle
 * rules fingerprint reads (sim/battle/rerun.ts), so a change of look never voids a re-run.
 */
export function spellRules(spell: BattleSpellDef): BattleSpellRules {
  const rules: BattleSpellRules & Partial<Pick<BattleSpellDef, 'fx'>> = { ...spell };
  delete rules.fx;
  return rules;
}

/**
 * A requirement string as pip slots, one per pip: a letter is a slot of that color, and a
 * slash joins letters into one slot any of them can fill ('RR/G' is R plus R-or-G). Throws on
 * anything else.
 */
export function parseRequirement(requirement: string): Color[][] {
  const slots: Color[][] = [];
  let join = false;
  for (const ch of requirement) {
    if (ch === '/') {
      if (slots.length === 0 || join) throw new Error(`bad requirement ${requirement}`);
      join = true;
      continue;
    }
    if (!isColor(ch)) throw new Error(`bad requirement ${requirement}`);
    const last = slots.at(-1);
    if (join && last) last.push(ch);
    else slots.push([ch]);
    join = false;
  }
  if (join) throw new Error(`bad requirement ${requirement}`);
  return slots;
}

const SLOTS = new WeakMap<SpellDef, readonly (readonly Color[])[]>();

/** A spell's requirement slots, parsed once per spell record. */
export function requirementSlots(spell: SpellDef): readonly (readonly Color[])[] {
  let slots = SLOTS.get(spell);
  if (!slots) {
    slots = parseRequirement(spell.requirement);
    SLOTS.set(spell, slots);
  }
  return slots;
}
