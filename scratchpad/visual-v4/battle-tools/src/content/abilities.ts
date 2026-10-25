// The abilities catalog (units-and-items build spec, section B), shared with the pretender
// expansion. Phase 6b.2 lands its trigger kind: battle-start abilities (pretender build spec N1),
// each an effect list of docs/02 section 5 battle primitives fired once at battle start. Every
// entry carries the catalog's display fields so the card, the hover and the replay read the same
// words. The other kinds (tags, numbers, shields, resistances, weapon properties, boosters,
// bodies) and the remaining display fields arrive with the rest of the catalog in Phase 7b.1.
// No unit lists an ability until the new chassis bodies land in Phase 6b.3.
import type { Color } from './colors';
import type { BattleSpellId } from './spells';
import type { BattleEffect, EffectSource } from './spells/types';

/** A 24 px monoline glyph id (docs/09 Icons); the icon set itself is drawn in Phase 11. */
export type GlyphId = string;

export type AbilityRule = {
  kind: 'trigger';
  /** M1 has battle start only; M2 adds 'eachRound'. */
  trigger: 'battleStart';
  /** Presentation only: the color whose look its cue takes; null takes its first effect's look. */
  color: Color | null;
  /** docs/02 battle primitives, validated like a spell's effects. */
  effects: readonly BattleEffect[];
  /**
   * A battle spell whose effect this copies. Its stat changes then carry the spell's id as their
   * source, so the two never land on one squad (the target rule skips a squad that already has
   * that source). Absent: the ability's own id is the source.
   */
  sourceId?: BattleSpellId;
};

export type AbilityDef = AbilityRule & {
  /** Unique among abilities and distinct from every spell id. */
  id: string;
  name: string;
  glyph: GlyphId;
  /** At most UI.unitCard.oneLineMax characters; {n}, {m}, {unit}, {color} fill from the bearer. */
  oneLine: string;
};

export const ABILITIES = {
  primordialFear: {
    kind: 'trigger',
    id: 'primordialFear',
    name: 'Fear',
    glyph: 'staringEye',
    oneLine: 'Fear: at battle start, every enemy fights at −2 morale for the whole battle.',
    trigger: 'battleStart',
    color: null,
    effects: [
      {
        kind: 'debuff',
        stat: 'mor',
        delta: -2,
        duration: { kind: 'battle' },
        targets: { kind: 'allEnemy' },
      },
    ],
  },
  kindleTheHost: {
    kind: 'trigger',
    id: 'kindleTheHost',
    name: 'Kindle the Host',
    glyph: 'risingFlame',
    oneLine: 'Kindle the Host: at battle start, 6 Fire Sprites rise beside it.',
    trigger: 'battleStart',
    color: 'R',
    effects: [{ kind: 'summon', unit: 'fireSprite', count: 6, side: 'friendly' }],
  },
  callTheHunt: {
    kind: 'trigger',
    id: 'callTheHunt',
    name: 'Call the Hunt',
    glyph: 'huntingHorn',
    oneLine: 'Call the Hunt: at battle start, 8 Wolves run to its side.',
    trigger: 'battleStart',
    color: 'G',
    effects: [{ kind: 'summon', unit: 'wolf', count: 8, side: 'friendly' }],
  },
} as const satisfies Record<string, AbilityDef>;

export type AbilityId = keyof typeof ABILITIES;

/**
 * Ids of the trigger entries, in catalog order: what UnitDef.abilities may hold. They are listed
 * apart from ABILITIES because a type derived from ABILITIES would be circular once a unit names
 * one (units, abilities, effects, the summoned unit's id); `triggerDef` fails to compile for a
 * listed id with no entry, and content validation refuses a trigger entry missing here.
 */
export const TRIGGER_ABILITY_IDS = ['primordialFear', 'kindleTheHost', 'callTheHunt'] as const;
export type TriggerAbilityId = (typeof TRIGGER_ABILITY_IDS)[number];

/** What the battle code reads of an ability (N1). */
export type UnitAbility = Extract<AbilityDef, { kind: 'trigger' }>;

/** Every catalog entry, in content order. */
export const ABILITY_LIST: readonly AbilityDef[] = Object.values(ABILITIES);

export function isAbilityId(value: unknown): value is AbilityId {
  return typeof value === 'string' && Object.hasOwn(ABILITIES, value);
}

export function isTriggerAbilityId(value: unknown): value is TriggerAbilityId {
  return (TRIGGER_ABILITY_IDS as readonly unknown[]).includes(value);
}

export function triggerDef(id: TriggerAbilityId): UnitAbility {
  return ABILITIES[id];
}

/** The EffectSource an ability plans and lands with: the copied spell's id when it names one. */
export function abilitySource(a: UnitAbility): EffectSource {
  return { id: a.sourceId ?? a.id, effects: a.effects };
}
