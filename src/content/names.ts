// Syllables for province names, per terrain. A name is an onset, an optional middle, and
// a terrain suffix: "Har" + "wood" = "Harwood", "Sel" + "en" + "holt" = "Selenholt".
import type { WildKind } from './mapgen';
import type { TerrainId } from './terrain';

export interface NameSyllables {
  onsets: readonly string[];
  suffixes: readonly string[];
}

/** Shared connective syllables, used in a fraction of names. */
export const NAME_MIDDLES: readonly string[] = ['a', 'e', 'i', 'o', 'en', 'ar', 'el', 'or'];

/** Probability that a name gets a middle syllable. */
export const NAME_MIDDLE_CHANCE = 0.35;

export const NAME_SYLLABLES: Readonly<Record<TerrainId, NameSyllables>> = {
  plains: {
    onsets: ['Al', 'Bar', 'Cal', 'Dun', 'Ev', 'Har', 'Mar', 'Sel', 'Tor', 'Val', 'Wen', 'Ost'],
    suffixes: ['mead', 'field', 'stead', 'ford', 'dale', 'lea', 'mere', 'wold'],
  },
  farmland: {
    onsets: ['Bram', 'Cor', 'Ed', 'Fen', 'Gil', 'Hol', 'Lin', 'Mil', 'Os', 'Rye', 'Sun', 'Wil'],
    suffixes: ['ham', 'wick', 'thorpe', 'acre', 'by', 'ton', 'garth', 'croft'],
  },
  forest: {
    onsets: [
      'Ash',
      'Bel',
      'Elm',
      'Fern',
      'Hawk',
      'Ivy',
      'Lind',
      'Oak',
      'Rook',
      'Sil',
      'Thorn',
      'Wyl',
    ],
    suffixes: ['wood', 'holt', 'glade', 'shaw', 'hurst', 'grove', 'weald', 'bower'],
  },
  hills: {
    onsets: [
      'Ard',
      'Ben',
      'Cairn',
      'Dor',
      'Glen',
      'Kel',
      'Mor',
      'Pen',
      'Ross',
      'Strath',
      'Tal',
      'Ul',
    ],
    suffixes: ['tor', 'brae', 'crag', 'knoll', 'ridge', 'fell', 'down', 'law'],
  },
  mountains: {
    onsets: [
      'Drak',
      'Grim',
      'Hald',
      'Ir',
      'Jot',
      'Krag',
      'Nor',
      'Skar',
      'Storm',
      'Thar',
      'Vor',
      'Zar',
    ],
    suffixes: ['peak', 'horn', 'spire', 'crown', 'gard', 'fang', 'helm', 'mount'],
  },
  swamp: {
    onsets: [
      'Bog',
      'Dim',
      'Gloam',
      'Hag',
      'Mur',
      'Nar',
      'Quag',
      'Rush',
      'Sedge',
      'Slo',
      'Wick',
      'Yar',
    ],
    suffixes: ['fen', 'mire', 'moss', 'marsh', 'sump', 'slough', 'carr', 'reed'],
  },
  wasteland: {
    onsets: [
      'Ash',
      'Bleak',
      'Char',
      'Dread',
      'Gall',
      'Grey',
      'Hollow',
      'Rust',
      'Salt',
      'Scour',
      'Sear',
      'Ves',
    ],
    suffixes: ['waste', 'scar', 'reach', 'flats', 'pan', 'barrow', 'drift', 'heath'],
  },
};

/**
 * Names for wild ranges (Phase 1b): a first part and an ending, joined as written ("Ash" +
 * "spine" = "Ashspine", "Still" + " Mere" = "Still Mere"). The map stores the bare name; text
 * always gives it "the" ("the Ashspine", "around the Still Mere").
 */
export const WILD_NAME_PARTS: Readonly<Record<WildKind, NameSyllables>> = {
  peaks: {
    onsets: ['Ash', 'Grey', 'Iron', 'Cold', 'Crag', 'Wolf', 'Storm', 'Raven', 'Frost', 'Black'],
    suffixes: ['spine', 'teeth', 'crown', 'horns', 'fells', 'spires', 'fangs'],
  },
  mere: {
    onsets: ['Still', 'Black', 'Dead', 'Hollow', 'Grey', 'Mirror', 'Silent'],
    suffixes: [' Mere', 'water', ' Tarn', 'mere'],
  },
};
