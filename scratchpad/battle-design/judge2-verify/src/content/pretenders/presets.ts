// One-click pretender designs, three per nation (docs/05-pretender.md, "Presets"). Each fits
// its budget; Deep Root's dominion is 7, not 8 (docs/09-balance.md). The first of a nation's
// presets is its default, also for AI nations.
import type { NationDefId } from '../nations';
import { NEUTRAL_SCALES } from './scales';
import type { PretenderDesign } from './types';

export interface PresetDef {
  id: string;
  name: string;
  nation: NationDefId;
  design: PretenderDesign;
}

export const PRESETS: readonly PresetDef[] = [
  {
    id: 'warlord',
    name: 'Warlord',
    nation: 'cinderHorde',
    design: {
      chassis: 'titan',
      pips: { R: 4 },
      dominion: 5,
      scales: { ...NEUTRAL_SCALES, lore: -3, order: -2 },
      awakening: 'awake',
    },
  },
  {
    id: 'emberOracle',
    name: 'Ember Oracle',
    nation: 'cinderHorde',
    design: {
      chassis: 'oracle',
      pips: { R: 6 },
      dominion: 4,
      scales: { ...NEUTRAL_SCALES, lore: -2 },
      awakening: 'dormant',
    },
  },
  {
    id: 'wildfire',
    name: 'Wildfire',
    nation: 'cinderHorde',
    design: {
      chassis: 'ashColossus',
      pips: { R: 3 },
      dominion: 6,
      scales: { ...NEUTRAL_SCALES, order: -3, lore: -3 },
      awakening: 'imprisoned',
    },
  },
  {
    id: 'elderOak',
    name: 'Elder Oak',
    nation: 'thornwood',
    design: {
      chassis: 'titan',
      pips: { G: 4 },
      dominion: 5,
      scales: { ...NEUTRAL_SCALES, growth: 3, wild: 2 },
      awakening: 'awake',
    },
  },
  {
    id: 'deepRoot',
    name: 'Deep Root',
    nation: 'thornwood',
    design: {
      chassis: 'livingMonolith',
      pips: { G: 3 },
      dominion: 7,
      scales: { ...NEUTRAL_SCALES, growth: 3, wild: 3, sanctity: 1 },
      awakening: 'awake',
    },
  },
  {
    id: 'wyrmOfTheLoam',
    name: 'Wyrm of the Loam',
    nation: 'thornwood',
    design: {
      chassis: 'greatWyrm',
      pips: { G: 4 },
      dominion: 4,
      scales: { ...NEUTRAL_SCALES, growth: 2 },
      awakening: 'dormant',
    },
  },
];

/** A nation's default preset: its first. */
export function defaultPreset(nation: NationDefId): PresetDef {
  const found = PRESETS.find((p) => p.nation === nation);
  if (!found) throw new Error(`no preset for ${nation}`);
  return found;
}
