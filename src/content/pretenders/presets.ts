// One-click pretender designs, six per nation (docs/05-pretender.md, "Presets"). Each fits its
// budget; Deep Root's dominion is 7, not 8 (docs/09-balance.md). The first of a nation's presets
// is its default, also for AI nations. The six of Phase 6 come first, exactly as they were (no
// blessings or boons field); the six after them arrived in Phase 6b.3 with the new chassis (the
// 2026-10-21 pretender build spec, A.8) and pick their blessings. Their looks are Phase 9.
import type { NationDefId } from '../nations';
import { NEUTRAL_SCALES } from './scales';
import type { PretenderDesign } from './types';

export interface PresetDef {
  id: string;
  name: string;
  nation: NationDefId;
  design: PretenderDesign;
}

/** Presets each nation ships (content validation checks it). */
export const PRESETS_PER_NATION = 6;

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
  {
    id: 'undyingFlame',
    name: 'Undying Flame',
    nation: 'cinderHorde',
    design: {
      chassis: 'ashPhoenix',
      pips: { R: 4 },
      dominion: 5,
      scales: { ...NEUTRAL_SCALES, growth: 2, lore: -2, order: -1 },
      awakening: 'awake',
      blessings: ['emberWrath'],
    },
  },
  {
    id: 'pyreHost',
    name: 'Pyre Host',
    nation: 'cinderHorde',
    design: {
      chassis: 'pyreLord',
      pips: { R: 4 },
      dominion: 5,
      scales: { ...NEUTRAL_SCALES, lore: -3, order: -2 },
      awakening: 'awake',
      blessings: ['emberWrath'],
    },
  },
  {
    id: 'dreadIdol',
    name: 'Dread Idol',
    nation: 'cinderHorde',
    design: {
      chassis: 'cinderIdol',
      pips: { R: 4 },
      dominion: 9,
      scales: { ...NEUTRAL_SCALES, sanctity: -3, order: -1 },
      awakening: 'awake',
      blessings: ['cinderSkin'],
    },
  },
  {
    id: 'heartwood',
    name: 'Heartwood',
    nation: 'thornwood',
    design: {
      chassis: 'worldTree',
      pips: { G: 4 },
      dominion: 7,
      scales: { ...NEUTRAL_SCALES, growth: 3, wild: 1, sanctity: 1 },
      awakening: 'awake',
      blessings: ['deepRoots'],
    },
  },
  {
    id: 'huntLord',
    name: 'Hunt Lord',
    nation: 'thornwood',
    design: {
      chassis: 'hornedHunter',
      pips: { G: 4 },
      dominion: 4,
      scales: { ...NEUTRAL_SCALES, lore: -2, wild: 2, growth: 3 },
      awakening: 'awake',
      blessings: ['oakhide'],
    },
  },
  {
    id: 'motherOfThePack',
    name: 'Mother of the Pack',
    nation: 'thornwood',
    design: {
      chassis: 'motherOfBeasts',
      pips: { G: 4 },
      dominion: 5,
      scales: { ...NEUTRAL_SCALES, growth: 3, wild: 2 },
      awakening: 'awake',
      blessings: ['evergreen'],
    },
  },
];

/** A nation's default preset: its first. */
export function defaultPreset(nation: NationDefId): PresetDef {
  const found = PRESETS.find((p) => p.nation === nation);
  if (!found) throw new Error(`no preset for ${nation}`);
  return found;
}

/** The preset with this id, or undefined. */
export function findPreset(id: string): PresetDef | undefined {
  return PRESETS.find((p) => p.id === id);
}
