// Research (docs/02-magic.md section 4): mages with the Research order in a lab earn research
// points each day for the nation's chosen color; levels unlock spells.
import { COLOR_DEFS, COLORS, type Color } from '../content/colors';
import { RESEARCH, RESEARCH_LEVEL_POINTS, TIME } from '../content/rules';
import { SPELLS } from '../content/spells';
import { isGarrisonHolder } from './commanders';
import type { NationId } from './ids';
import { postMessage } from './messages';
import { colorPips } from './pips';
import { provinceScales, scaleEffect } from './scales';
import { getNation, getProvince, wholeDays } from './state';
import type { CommanderState, GameState } from './types';

/** Points are compared with this slack, so floating-point sums of daily points reach a level on time. */
const LEVEL_SLACK = 1e-9;
const TOP = RESEARCH_LEVEL_POINTS[RESEARCH_LEVEL_POINTS.length - 1] ?? 0;

/** The level a cumulative point total has reached. */
export function levelFor(points: number): number {
  let level = 0;
  RESEARCH_LEVEL_POINTS.forEach((need, i) => {
    if (points >= need - LEVEL_SLACK) level = i;
  });
  return level;
}

export function researchLevel(state: GameState, nation: NationId, color: Color): number {
  return levelFor(getNation(state, nation).research.points[color]);
}

export function researchLevels(state: GameState, nation: NationId): Record<Color, number> {
  const points = getNation(state, nation).research.points;
  const levels = {} as Record<Color, number>;
  for (const color of COLORS) levels[color] = levelFor(points[color]);
  return levels;
}

/**
 * Who may research: a nation's commander with a color pip (holy pips do not count). Phase 6
 * decides which pretenders join them; this is the one place that says so.
 */
export function canResearch(commander: CommanderState): boolean {
  return commander.owner !== null && !isGarrisonHolder(commander) && colorPips(commander.pips) > 0;
}

/** Researching now: able to, ordered to, standing still in an own province with a lab. */
export function isResearching(state: GameState, commander: CommanderState): boolean {
  if (!canResearch(commander) || commander.order.kind !== 'research' || commander.transit) {
    return false;
  }
  const p = getProvince(state, commander.location);
  return p.owner === commander.owner && p.buildings.includes('lab');
}

/**
 * Monthly research points of a commander standing where it is: base plus per pip, scaled by the
 * province's Lore (or Fury).
 */
export function researchRate(state: GameState, commander: CommanderState): number {
  const base = RESEARCH.base + RESEARCH.perPip * colorPips(commander.pips);
  const scales = provinceScales(state, commander.location);
  return base * Math.max(0, 1 + scaleEffect(scales, 'researchPct'));
}

/** A nation's monthly research points from every researching commander. */
export function nationResearchRate(state: GameState, nation: NationId): number {
  let total = 0;
  for (const c of Object.values(state.commanders)) {
    if (c.owner === nation && isResearching(state, c)) total += researchRate(state, c);
  }
  return total;
}

/** Days until the research color's next level at today's rate; null at the top or with no rate. */
export function daysToNextLevel(state: GameState, nation: NationId): number | null {
  const { color, points } = getNation(state, nation).research;
  const need = RESEARCH_LEVEL_POINTS[levelFor(points[color]) + 1];
  const rate = nationResearchRate(state, nation);
  if (need === undefined || rate <= 0) return null;
  return wholeDays((need - points[color]) / (rate / TIME.daysPerMonth));
}

function unlockedText(color: Color, level: number): string {
  const names = Object.values(SPELLS)
    .filter((s) => s.color === color && s.level === level)
    .map((s) => s.name);
  return names.length > 0 ? `: ${names.join(', ')}` : '';
}

/** Tick step 3: a day of research for every nation; a message for each level reached. */
export function progressResearch(state: GameState): void {
  const daily = new Map<NationId, number>();
  for (const c of Object.values(state.commanders)) {
    if (c.owner === null || !isResearching(state, c)) continue;
    daily.set(c.owner, (daily.get(c.owner) ?? 0) + researchRate(state, c) / TIME.daysPerMonth);
  }
  for (const [id, points] of daily) {
    const research = getNation(state, id).research;
    const color = research.color;
    const before = levelFor(research.points[color]);
    // Past the last level nothing more is learned; the points are lost.
    research.points[color] = Math.min(TOP, research.points[color] + points);
    const after = levelFor(research.points[color]);
    for (let level = before + 1; level <= after; level++) {
      const name = COLOR_DEFS[color].name;
      postMessage(
        state,
        id,
        'research',
        `${name} research reached level ${String(level)}${unlockedText(color, level)}.`,
      );
    }
  }
}
