// Content validation of the abilities catalog and of the units that list abilities
// (units-and-items build spec B.3; pretender build spec N1). validateContent runs these with the
// rest of the content checks.
import { ABILITIES, isTriggerAbilityId, TRIGGER_ABILITY_IDS, type AbilityDef } from './abilities';
import { isColor } from './colors';
import { UI } from './rules';
import { isBattleSpellId, isSpellId, SPELLS } from './spells';
import type { BattleEffect } from './spells/types';
import { battleEffectProblems } from './spells/validate';
import type { UnitDef } from './types';

/** The placeholders a one line may hold, filled from its bearer. */
const PLACEHOLDERS: readonly string[] = ['n', 'm', 'unit', 'color'];

/** An effect's shape: its kind, the stat it changes and the kind of its targets. */
function shape(e: BattleEffect): string {
  const stat = 'stat' in e ? e.stat : '';
  const targets = 'targets' in e ? e.targets.kind : '';
  return `${e.kind}/${stat}/${targets}`;
}

function textProblems(where: string, a: AbilityDef): string[] {
  const problems: string[] = [];
  if (a.name.trim() === '') problems.push(`${where} has no name`);
  if (!/^[a-z][A-Za-z0-9]*$/.test(a.glyph)) problems.push(`${where} bad glyph id ${a.glyph}`);
  const line = a.oneLine.trim();
  if (line === '') problems.push(`${where} has no one line`);
  if (a.oneLine.length > UI.unitCard.oneLineMax) {
    problems.push(`${where} one line over ${String(UI.unitCard.oneLineMax)} characters`);
  }
  for (const [, key] of a.oneLine.matchAll(/\{([^}]*)\}/g)) {
    if (key === undefined || !PLACEHOLDERS.includes(key)) {
      problems.push(`${where} unknown placeholder {${key ?? ''}}`);
    }
  }
  return problems;
}

function triggerProblems(where: string, a: AbilityDef): string[] {
  const problems: string[] = [];
  const trigger: string = a.trigger;
  if (trigger !== 'battleStart') problems.push(`${where} bad trigger`);
  if (a.color !== null && !isColor(a.color)) problems.push(`${where} bad color`);
  if (a.effects.length === 0) problems.push(`${where} has no effects`);
  for (const e of a.effects) problems.push(...battleEffectProblems(where, e));
  if (a.sourceId !== undefined) {
    const spell = isBattleSpellId(a.sourceId) ? SPELLS[a.sourceId] : null;
    if (spell?.kind !== 'battle') {
      problems.push(`${where} source ${a.sourceId} is not a battle spell`);
    } else if (a.effects.map(shape).join() !== spell.effects.map(shape).join()) {
      problems.push(`${where} effects differ in kind, stat or targets from ${spell.id}`);
    }
  }
  return problems;
}

/** An entry's kind, read as a string: the catalog's other kinds arrive in Phase 7b.1. */
function kindOf(a: AbilityDef): string {
  return a.kind;
}

/** One catalog entry: its id, its display fields, and its rule. */
export function validateAbility(key: string, a: AbilityDef): string[] {
  const where = `ability ${key}`;
  const problems: string[] = [];
  if (a.id !== key) problems.push(`${where} has id ${a.id}`);
  if (isSpellId(key)) problems.push(`${where} shares its id with a spell`);
  problems.push(...textProblems(where, a));
  if (kindOf(a) === 'trigger') problems.push(...triggerProblems(where, a));
  else problems.push(`${where} bad kind ${kindOf(a)}`);
  return problems;
}

/** The catalog as a whole: glyphs unique, and the trigger id list equal to its trigger entries. */
export function validateCatalog(): string[] {
  const problems: string[] = [];
  const entries: [string, AbilityDef][] = Object.entries(ABILITIES);
  const glyphs = entries.map(([, a]) => a.glyph);
  if (new Set(glyphs).size !== glyphs.length) problems.push('ability glyphs repeat');
  const triggers = entries.filter(([, a]) => kindOf(a) === 'trigger').map(([key]) => key);
  if (triggers.join() !== TRIGGER_ABILITY_IDS.join()) {
    problems.push('TRIGGER_ABILITY_IDS must list every trigger entry, in catalog order');
  }
  return problems;
}

/** A unit's abilities: commanders only, trigger ids that exist, none twice. */
export function unitAbilityProblems(where: string, u: UnitDef): string[] {
  const ids: readonly unknown[] = u.abilities ?? [];
  if (ids.length === 0) return [];
  const problems: string[] = [];
  if (!u.commander) problems.push(`${where} lists abilities but is not a commander`);
  for (const id of ids) {
    if (!isTriggerAbilityId(id)) problems.push(`${where} ability ${String(id)} is not a trigger`);
  }
  if (new Set(ids).size !== ids.length) problems.push(`${where} lists an ability twice`);
  return problems;
}
