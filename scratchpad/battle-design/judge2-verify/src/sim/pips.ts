// Pips against spell requirements (docs/02-magic.md section 2). Every check that asks "can this
// commander cast that spell" goes through here: battle setup, scripts, rituals, and the UI.
import type { Color } from '../content/colors';
import { requirementSlots } from '../content/spells';
import type { SpellDef } from '../content/spells/types';
import type { Pips } from './types';

/** Color pips in total; holy pips are not color pips. */
export function colorPips(pips: Pips): number {
  let total = 0;
  for (const n of Object.values(pips)) total += n;
  return total;
}

/** Fills hybrid slots one by one, trying each of their colors (an exact search). */
function fill(slots: readonly (readonly Color[])[], i: number, left: Pips): boolean {
  const slot = slots[i];
  if (!slot) return true;
  for (const c of slot) {
    const n = left[c] ?? 0;
    if (n <= 0) continue;
    left[c] = n - 1;
    const ok = fill(slots, i + 1, left);
    left[c] = n;
    if (ok) return true;
  }
  return false;
}

/**
 * The caster's pips fill every slot of the spell's requirement, one pip per slot, and its holy
 * pips cover the spell's.
 */
export function meetsRequirement(pips: Pips, holy: number, spell: SpellDef): boolean {
  if (holy < spell.holy) return false;
  const left: Pips = { ...pips };
  const hybrids: (readonly Color[])[] = [];
  for (const slot of requirementSlots(spell)) {
    const only = slot.length === 1 ? slot[0] : undefined;
    if (only === undefined) {
      hybrids.push(slot);
      continue;
    }
    const n = left[only] ?? 0;
    if (n <= 0) return false;
    left[only] = n - 1;
  }
  return fill(hybrids, 0, left);
}

/**
 * Pips beyond the requirement, which make a battle spell less tiring: the caster's pips in the
 * requirement's colors minus its slots; for holy spells, holy pips beyond the spell's.
 */
export function extraPips(pips: Pips, holy: number, spell: SpellDef): number {
  const slots = requirementSlots(spell);
  if (slots.length === 0) return Math.max(0, holy - spell.holy);
  let total = 0;
  for (const c of new Set(slots.flat())) total += pips[c] ?? 0;
  return Math.max(0, total - slots.length);
}
