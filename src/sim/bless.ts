// The bless (docs/02-magic.md section 8; docs/05-pretender.md Step 6): what sacred units, the
// prophet, and a god with Avatar get in battle. It follows from the pretender's design, which
// never changes, and from whether the god is on the map (incarnate blessings), so it is
// computed when needed rather than stored. Without a choice the design takes the default
// picks, which give exactly the fixed bless of Phase 5.
import { COLOR_DEFS, COLORS, type Color } from '../content/colors';
import {
  BLESSING_LIST,
  BLESSINGS,
  isBlessingId,
  type BlessingDef,
  type BlessingEffect,
} from '../content/pretenders/blessings';
import { SCALE_DEFS } from '../content/pretenders/scales';
import type { PretenderDesign } from '../content/pretenders/types';
import { BLESSING_MENU } from '../content/rules';
import { ELEMENTS, type Element, type Shield } from '../content/types';
import type { NationId } from './ids';
import { getNation } from './state';
import type { GameState, Pips } from './types';

export interface Bless {
  att: number;
  str: number;
  def: number;
  prot: number;
  mor: number;
  prec: number;
  /** Share of max HP regained per round. */
  regeneration: number;
  /** HP regained per damaging hit. */
  lifeDrain: number;
  /** Retaliation shields, one per element with amounts added, in ELEMENTS order. */
  shields: readonly Shield[];
  /** Added to the damage of every melee weapon. */
  meleeDmg: number;
  /** Every melee weapon takes this element; null keeps each weapon's own. */
  meleeElement: Element | null;
  meleeArmorPiercing: boolean;
  /** Added to every melee weapon's first-round bonus. */
  firstRoundBonus: number;
  berserk: boolean;
}

export const NO_BLESS: Readonly<Bless> = {
  att: 0,
  str: 0,
  def: 0,
  prot: 0,
  mor: 0,
  prec: 0,
  regeneration: 0,
  lifeDrain: 0,
  shields: [],
  meleeDmg: 0,
  meleeElement: null,
  meleeArmorPiercing: false,
  firstRoundBonus: 0,
  berserk: false,
};

const STATS = ['att', 'str', 'def', 'prot', 'mor', 'prec', 'regeneration', 'lifeDrain'] as const;

/** Bless points per color with pips: max(0, pips - 1). A color's points buy only its blessings. */
export function blessPoints(pips: Pips): Partial<Record<Color, number>> {
  const points: Partial<Record<Color, number>> = {};
  for (const color of COLORS) {
    const n = pips[color] ?? 0;
    if (n > 0) points[color] = Math.max(0, n - BLESSING_MENU.freePips);
  }
  return points;
}

function tierOf(color: Color, tier: 'standard' | 'greater'): BlessingDef | undefined {
  return BLESSING_LIST.find((bl) => bl.color === color && bl.tier === tier);
}

/**
 * The default picks: each color's greater blessing at its requirement (6 pips), else its
 * standard one (4 or 5 pips). They always fit the color's points (checked over every pip set).
 */
export function defaultBlessings(pips: Pips): string[] {
  const picks: string[] = [];
  for (const color of COLORS) {
    const n = pips[color] ?? 0;
    const greater = tierOf(color, 'greater');
    const standard = tierOf(color, 'standard');
    if (greater && n >= greater.requires) picks.push(greater.id);
    else if (standard && n >= standard.requires) picks.push(standard.id);
  }
  return picks;
}

/** The design's blessings: its choice, or the default picks when it made none. */
export function chosenBlessings(design: PretenderDesign): readonly string[] {
  return design.blessings ?? defaultBlessings(design.pips);
}

function fold(bless: Bless, shields: Map<Element, number>, e: BlessingEffect): void {
  for (const key of STATS) bless[key] += e[key] ?? 0;
  bless.firstRoundBonus += e.firstRoundBonus ?? 0;
  if (e.berserk) bless.berserk = true;
  if (e.melee) {
    bless.meleeDmg += e.melee.dmg;
    // One weapon blessing per group; with several, the first in content order names the element.
    if (e.melee.element !== undefined) bless.meleeElement ??= e.melee.element;
    if (e.melee.armorPiercing) bless.meleeArmorPiercing = true;
  }
  if (e.shield) {
    shields.set(e.shield.element, (shields.get(e.shield.element) ?? 0) + e.shield.amount);
  }
}

/**
 * What the design's blessings give a blessed unit. `godPresent` is whether the pretender is on
 * the map; incarnate blessings count only then. Blessings fold in content order, so the order
 * of the design's list never matters.
 */
export function blessOf(design: PretenderDesign, godPresent: boolean): Bless {
  const chosen = new Set(chosenBlessings(design));
  const bless: Bless = { ...NO_BLESS };
  const shields = new Map<Element, number>();
  for (const bl of BLESSING_LIST) {
    if (!chosen.has(bl.id) || (bl.incarnate && !godPresent)) continue;
    fold(bless, shields, bl.effect);
  }
  if (shields.size > 0) {
    bless.shields = ELEMENTS.filter((el) => shields.has(el)).map((element) => ({
      element,
      amount: shields.get(element) ?? 0,
    }));
  }
  return bless;
}

/** A nation's bless today: incarnate blessings only while its pretender stands on the map. */
export function nationBless(state: GameState, nationId: NationId): Bless {
  const nation = getNation(state, nationId);
  return blessOf(nation.pretender, nation.pretenderId !== null);
}

/** Whether the design's scales reach the pole a blessing asks for. */
function meetsScale(design: PretenderDesign, bl: BlessingDef): boolean {
  const need = bl.requiresScale;
  if (!need) return true;
  const value = design.scales[need.axis];
  return need.toward === 'positive' ? value >= need.steps : value <= -need.steps;
}

/**
 * Why the design's blessings are not allowed, or null; the first problem only, in the order
 * the pretender screen asks (docs/05 Step 6). Pips and scales are checked before this.
 */
export function blessingProblem(design: PretenderDesign): string | null {
  const ids = design.blessings;
  if (ids === undefined) return null;
  const seen = new Set<string>();
  const groups = new Map<string, BlessingDef>();
  const spent: Partial<Record<Color, number>> = {};
  for (const id of ids) {
    if (!isBlessingId(id)) return `Unknown blessing ${id}`;
    const bl: BlessingDef = BLESSINGS[id];
    if (seen.has(id)) return `${bl.name} is chosen twice`;
    seen.add(id);
    if ((design.pips[bl.color] ?? 0) < bl.requires) {
      return `${bl.name} needs ${bl.color}${String(bl.requires)}`;
    }
    const need = bl.requiresScale;
    if (need && !meetsScale(design, bl)) {
      return `${bl.name} needs ${SCALE_DEFS[need.axis][need.toward].name} ${String(need.steps)}`;
    }
    const rival = groups.get(bl.group);
    if (rival) return `${rival.name} and ${bl.name} exclude each other`;
    groups.set(bl.group, bl);
    spent[bl.color] = (spent[bl.color] ?? 0) + bl.cost;
  }
  const points = blessPoints(design.pips);
  for (const color of COLORS) {
    const cost = spent[color] ?? 0;
    const have = points[color] ?? 0;
    if (cost > have) {
      return `${COLOR_DEFS[color].name} blessings cost ${String(cost)} of ${String(have)} bless points`;
    }
  }
  return null;
}
