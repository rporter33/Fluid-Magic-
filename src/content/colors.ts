// The five colors of magic (docs/02-magic.md section 1, palettes from docs/09-art-direction.md).
// Internally a color is always its MTG letter; element names are flavor only.

export const COLORS = ['W', 'U', 'B', 'R', 'G'] as const;
export type Color = (typeof COLORS)[number];

export interface Palette {
  primary: string;
  secondary: string;
  accent: string;
}

export interface ColorDef {
  key: Color;
  name: string;
  element: string;
  theme: string;
  essence: string;
  doesWell: string;
  neverDoes: string;
  palette: Palette;
  symbol: string;
}

export const COLOR_DEFS: Readonly<Record<Color, ColorDef>> = {
  W: {
    key: 'W',
    name: 'White',
    element: 'Radiance',
    theme: 'light, sun, law',
    essence: 'Order, community, protection',
    doesWell:
      'Cheap massed troops, healing, protection buffs, anti-undead, dominion spread, unrest control',
    neverDoes: 'Direct big damage, summoning monsters, stealing',
    palette: { primary: '#F3E6B8', secondary: '#D9B85C', accent: '#FFFFFF' },
    symbol: 'sun disc',
  },
  U: {
    key: 'U',
    name: 'Blue',
    element: 'Tide',
    theme: 'water, mind, storm',
    essence: 'Knowledge, control, deception',
    doesWell:
      'Research speed, scrying, illusions and misdirection, debuffs, fatigue, weather, teleportation',
    neverDoes: 'Healing, raw brawn, cheap troops',
    palette: { primary: '#3A7BD5', secondary: '#1E3F7A', accent: '#9ED8FF' },
    symbol: 'wave crest',
  },
  B: {
    key: 'B',
    name: 'Black',
    element: 'Umbra',
    theme: 'shadow, rot, blood',
    essence: 'Ambition, death, sacrifice',
    doesWell:
      'Undead, population sacrifice for power, life drain, fear, unrest in enemy lands, decay',
    neverDoes: 'Healing the living, protection buffs, cheap honest troops',
    palette: { primary: '#3D2B4F', secondary: '#1A1024', accent: '#9B4DCA' },
    symbol: 'skull in a drop',
  },
  R: {
    key: 'R',
    name: 'Red',
    element: 'Ember',
    theme: 'fire, fury, chaos',
    essence: 'Passion, speed, destruction',
    doesWell:
      'Burst damage, area fire, morale and attack buffs, fast troops, berserk, destroying buildings',
    neverDoes: 'Defense, long-term growth, control',
    palette: { primary: '#D9442B', secondary: '#7A1E12', accent: '#FFB347' },
    symbol: 'flame',
  },
  G: {
    key: 'G',
    name: 'Green',
    element: 'Loam',
    theme: 'earth, growth, beasts',
    essence: 'Life, growth, the wild',
    doesWell:
      'Population growth, supply, big beasts, protection, regeneration, entangle, summoning animals',
    neverDoes: 'Flying, evasion, precision, undead',
    palette: { primary: '#3F8F3A', secondary: '#244F22', accent: '#A6D96A' },
    symbol: 'leaf',
  },
};

/** Independents have no color; they get a neutral palette and a plain shield. */
export const INDEPENDENT_PALETTE: Readonly<Palette> = {
  primary: '#8C8A80',
  secondary: '#4A4A44',
  accent: '#C9C4B0',
};
export const INDEPENDENT_SYMBOL = 'plain shield';

export type ColorPair = readonly [Color, Color];

/** Enemy pairs; each defines one Scale axis (docs/05-pretender.md step 4). */
export const ENEMY_PAIRS: readonly ColorPair[] = [
  ['W', 'B'],
  ['W', 'R'],
  ['U', 'R'],
  ['U', 'G'],
  ['B', 'G'],
];

/** Allied pairs; the future two-color nations (M3). */
export const ALLIED_PAIRS: readonly ColorPair[] = [
  ['W', 'U'],
  ['U', 'B'],
  ['B', 'R'],
  ['R', 'G'],
  ['G', 'W'],
];

function inPairs(pairs: readonly ColorPair[], x: Color, y: Color): boolean {
  return pairs.some(([p, q]) => (p === x && q === y) || (p === y && q === x));
}

export function areEnemies(x: Color, y: Color): boolean {
  return inPairs(ENEMY_PAIRS, x, y);
}

export function areAllies(x: Color, y: Color): boolean {
  return inPairs(ALLIED_PAIRS, x, y);
}

export function isColor(value: unknown): value is Color {
  return typeof value === 'string' && (COLORS as readonly string[]).includes(value);
}
