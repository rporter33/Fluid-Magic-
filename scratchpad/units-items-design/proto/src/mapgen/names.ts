// Province names from per-terrain syllables (content/names.ts), unique across the map.
import { NAME_MIDDLE_CHANCE, NAME_MIDDLES, NAME_SYLLABLES } from '../content/names';
import type { TerrainId } from '../content/terrain';
import { chance, pick, type RngState } from '../sim/rng';

/** Random draws before a duplicate name falls back to a numbered variant. */
const MAX_DRAWS = 50;
const NUMERALS = ['II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

export function provinceName(rng: RngState, terrain: TerrainId): string {
  const { onsets, suffixes } = NAME_SYLLABLES[terrain];
  const onset = pick(rng, onsets);
  const middle = chance(rng, NAME_MIDDLE_CHANCE) ? pick(rng, NAME_MIDDLES) : '';
  return onset + middle + pick(rng, suffixes);
}

/** Returns `name`, or `name II`, `name III`, ... until it is not in `taken`. */
export function numbered(name: string, taken: ReadonlySet<string>): string {
  if (!taken.has(name)) return name;
  for (const numeral of NUMERALS) {
    const candidate = `${name} ${numeral}`;
    if (!taken.has(candidate)) return candidate;
  }
  for (let k = NUMERALS.length + 2; ; k++) {
    const candidate = `${name} ${k}`;
    if (!taken.has(candidate)) return candidate;
  }
}

/**
 * Names every province. `fixed` lists [province index, name] pairs that must keep their
 * name (capitals, in nation order); a repeated fixed name gets a numeral, so a second
 * Kharnath becomes Kharnath II. Generated names never repeat any other name.
 */
export function nameProvinces(
  rng: RngState,
  terrains: readonly TerrainId[],
  fixed: readonly (readonly [number, string])[],
): string[] {
  const taken = new Set<string>();
  const names = new Array<string>(terrains.length).fill('');
  const fixedIndices = new Set(fixed.map(([index]) => index));
  for (const [index, name] of fixed) {
    const unique = numbered(name, taken);
    names[index] = unique;
    taken.add(unique);
  }
  terrains.forEach((terrain, i) => {
    if (fixedIndices.has(i)) return;
    let name = provinceName(rng, terrain);
    for (let draw = 1; draw < MAX_DRAWS && taken.has(name); draw++) {
      name = provinceName(rng, terrain);
    }
    const unique = numbered(name, taken);
    names[i] = unique;
    taken.add(unique);
  });
  return names;
}
