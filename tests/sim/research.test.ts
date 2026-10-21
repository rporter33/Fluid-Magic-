// Research (docs/02-magic.md section 4) and the balance checklist's research target.
import { describe, expect, it } from 'vitest';
import { applyCommand } from '../../src/sim/commands';
import { createCommander } from '../../src/sim/commanders';
import type { NationId, ProvinceId } from '../../src/sim/ids';
import {
  daysToNextLevel,
  isResearching,
  levelFor,
  nationResearchRate,
  progressResearch,
  researchLevel,
  researchRate,
} from '../../src/sim/research';
import type { CommanderState, GameState } from '../../src/sim/types';
import { neighbors, redField, redGame, runDays } from './fixtures';

/** Ember Adepts researching in Red's capital lab. */
function researchers(state: GameState, red: NationId, at: ProvinceId, n: number): CommanderState[] {
  return Array.from({ length: n }, () => {
    const c = createCommander(state, 'emberAdept', red, at);
    c.order = { kind: 'research' };
    return c;
  });
}

/** Days of research until the nation's research color reaches a level. */
function daysTo(state: GameState, red: NationId, level: number): number {
  let days = 0;
  while (researchLevel(state, red, 'R') < level) {
    progressResearch(state);
    state.day += 1;
    days += 1;
    if (days > 5000) throw new Error('never');
  }
  return days;
}

/** Red with its starting mages sent elsewhere, so only the test's researchers count. */
function quietRed(scales: Parameters<typeof redGame>[1] = {}) {
  const state = redGame(5, scales);
  const red = Object.keys(state.nations)[0] as NationId;
  const capital = state.nations[red]!.capital;
  for (const c of Object.values(state.commanders)) {
    if (c.order.kind === 'research') c.order = { kind: 'idle' };
  }
  return { state, red, capital };
}

describe('research points', () => {
  it('are 3 + 2 per color pip a month, holy pips aside, scaled by Lore and Fury', () => {
    const { state, red, capital } = quietRed();
    const [adept] = researchers(state, red, capital, 1);
    expect(researchRate(state, adept!)).toBe(5);
    const magus = createCommander(state, 'cinderMagus', red, capital);
    magus.pips = { R: 2 };
    expect(researchRate(state, magus)).toBe(7);
    // Fury 2 at full dominion gives the capital Fury 1 (5 * 2 / 10 rounds to 1): -10%.
    const fury = quietRed({ lore: -2 });
    const [furious] = researchers(fury.state, fury.red, fury.capital, 1);
    expect(researchRate(fury.state, furious!)).toBeCloseTo(5 * 0.9, 12);
  });

  it('count only for a mage standing, ordered to research, in its own lab province', () => {
    const { state, red, capital } = quietRed();
    const [adept] = researchers(state, red, capital, 1);
    expect(isResearching(state, adept!)).toBe(true);
    adept!.transit = {
      from: capital,
      to: neighbors(state, capital)[0]!,
      progress: 1,
      totalDays: 3,
    };
    expect(isResearching(state, adept!)).toBe(false);
    adept!.transit = null;
    adept!.location = neighbors(state, capital)[0]!;
    expect(isResearching(state, adept!)).toBe(false);
    const chief = createCommander(state, 'ashChieftain', red, capital);
    chief.order = { kind: 'research' };
    expect(isResearching(state, chief)).toBe(false);
    expect(nationResearchRate(state, red)).toBe(0);
  });
});

describe('research levels', () => {
  it('follow the cumulative thresholds, with slack for daily sums', () => {
    expect([0, 59.99, 60, 149, 150, 1049, 1050].map(levelFor)).toEqual([0, 0, 1, 1, 2, 5, 6]);
    expect(levelFor(60 - 1e-12)).toBe(1);
  });

  it('one apprentice reaches level 2 from the start on the day the formula says', () => {
    const { state, red, capital } = quietRed();
    researchers(state, red, capital, 1);
    expect(daysToNextLevel(state, red)).toBe(540);
    expect(daysTo(state, red, 2)).toBe(540);
  });

  it('four apprentices reach level 4 on day 660, inside the checklist’s month 24', () => {
    const { state, red, capital } = quietRed();
    researchers(state, red, capital, 4);
    expect(daysTo(state, red, 4)).toBe(660);
  });

  it('miss month 24 at Fury -2 in the capital (day 825; docs/09 records the conflict)', () => {
    const { state, red, capital } = quietRed({ lore: -3 });
    // Fury 3 at dominion 5: round(-3 * 5 / 10) = -2 in the capital, so x0.8.
    researchers(state, red, capital, 4);
    expect(daysTo(state, red, 4)).toBe(825);
  });

  it('stop at level 6, post a message per level, and keep progress per color', () => {
    const { state, red, capital } = quietRed();
    researchers(state, red, capital, 4);
    state.nations[red]!.research.points.R = 1049.99;
    progressResearch(state);
    expect(state.nations[red]!.research.points.R).toBe(1050);
    const notes = state.messages.filter((m) => m.nation === red && m.kind === 'research');
    expect(notes.at(-1)?.text).toBe('Red research reached level 6: Ash Rain.');
    progressResearch(state);
    expect(state.nations[red]!.research.points.R).toBe(1050);
    expect(daysToNextLevel(state, red)).toBeNull();

    expect(applyCommand(state, { type: 'setResearchColor', nation: red, color: 'G' })).toEqual({
      ok: true,
    });
    runDays(state, 3);
    expect(state.nations[red]!.research.points.G).toBeGreaterThan(0);
    expect(state.nations[red]!.research.points.R).toBe(1050);
  });

  it('starts every nation at its starting level', () => {
    const { state, red } = redField();
    expect(researchLevel(state, red, 'R')).toBe(1);
    expect(researchLevel(state, red, 'G')).toBe(0);
  });
});
