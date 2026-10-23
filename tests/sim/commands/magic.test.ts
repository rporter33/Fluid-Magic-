// Magic commands (docs/02-magic.md sections 3 and 6; docs/06-architecture.md, "Commands"):
// what setResearchColor, castRitual, and giveMana refuse, and what an accepted one changes at once.
import { describe, expect, it } from 'vitest';
import type { Color } from '../../../src/content/colors';
import { SPELLS } from '../../../src/content/spells';
import type { RitualSpellDef } from '../../../src/content/spells/types';
import { applyCommand, validateCommand } from '../../../src/sim/commands';
import { createCommander } from '../../../src/sim/commanders';
import type { ProvinceId } from '../../../src/sim/ids';
import { applyRitualEffect } from '../../../src/sim/ritualEffects';
import { ritualTargets } from '../../../src/sim/rituals';
import type { CommanderState, GameState } from '../../../src/sim/types';
import { annex, castRitual, neighbors, redField, ritualCaster, runDays } from '../fixtures';

/** Hops from a province to every other, by a breadth-first search written for the test. */
function hopsFrom(state: GameState, from: ProvinceId): Map<ProvinceId, number> {
  const hops = new Map([[from, 0]]);
  const queue = [from];
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i]!;
    for (const n of state.map.provinces[p]!.neighbors) {
      if (!hops.has(n)) {
        hops.set(n, hops.get(p)! + 1);
        queue.push(n);
      }
    }
  }
  return hops;
}

describe('castRitual', () => {
  it('is refused for the wrong caster, place, research, target, or mana', () => {
    const { state, red, green, capital, army } = redField();
    const r = ritualCaster(state, red);
    const tryCast = (c: CommanderState, spell: string, target: ProvinceId | null = null) =>
      validateCommand(state, { type: 'castRitual', nation: red, commander: c.id, spell, target });
    expect(tryCast(ritualCaster(state, green), 'callFireSprites')).toMatch(/not yours/);
    expect(tryCast(army, 'callFireSprites')).toMatch(/cannot cast/);
    expect(tryCast(r, 'emberDart')).toMatch(/cast in battle/);
    expect(tryCast(r, 'nope')).toMatch(/Unknown spell/);
    expect(tryCast(r, 'burnTheFields')).toMatch(/needs a target/);
    expect(tryCast(r, 'callFireSprites', capital)).toMatch(/own province/);
    expect(tryCast(r, 'fertileSeason')).toMatch(/cannot cast Fertile Season/);
    state.nations[red]!.research.points.R = 300;
    expect(tryCast(r, 'ashRain', capital)).toMatch(/level 6/);
    state.nations[red]!.mana.R = 1;
    expect(tryCast(r, 'callFireSprites')).toMatch(/Not enough mana/);
    state.nations[red]!.mana.R = 50;
    r.location = neighbors(state, capital)[0]!;
    expect(tryCast(r, 'callFireSprites')).toMatch(/lab/);
    r.location = capital;
    state.nations[red]!.godless = true;
    expect(tryCast(r, 'callFireSprites')).toMatch(/godless/);
  });

  it('keeps summoned troops within the caster’s leadership when it begins', () => {
    const { state, red, capital } = redField();
    ritualCaster(state, red);
    const adept = createCommander(state, 'emberAdept', red, capital);
    const once = () => castRitual(state, red, adept, 'callFireSprites');
    expect(once()).toEqual({ ok: true });
    runDays(state, 5);
    expect(once()).toEqual({ ok: true });
    runDays(state, 5);
    expect(adept.squads[0]?.count).toBe(10);
    expect(once()).toEqual({ ok: false, error: 'Ember Adept can lead only 10 troops' });
  });

  it('cannot be laid twice on a province while its effect lasts', () => {
    const { state, green } = redField();
    const g = ritualCaster(state, green);
    const home = state.nations[green]!.capital;
    expect(castRitual(state, green, g, 'fertileSeason', home)).toEqual({ ok: true });
    runDays(state, 10);
    expect(castRitual(state, green, g, 'fertileSeason', home)).toMatchObject({
      ok: false,
      error: 'Fertile Season is already at work there',
    });
    expect(ritualTargets(state, g, SPELLS.fertileSeason as RitualSpellDef)).not.toContain(home);
  });

  it('cannot be laid where another nation’s effect of the same spell lasts', () => {
    const { state, red, green, capital } = redField();
    const r = ritualCaster(state, red);
    const g = ritualCaster(state, green);
    const burn = SPELLS.burnTheFields as RitualSpellDef;
    const target = neighbors(state, capital)[0]!;
    const supply = burn.effects.find((e) => e.kind === 'provinceSupply')!;
    applyRitualEffect(state, { nation: green, caster: g, spell: burn, province: target }, supply);
    expect(castRitual(state, red, r, 'burnTheFields', target)).toEqual({
      ok: false,
      error: 'Burn the Fields is already at work there',
    });
  });

  it('needs its caster standing still in a lab province its nation owns, and Forge a fort', () => {
    const { state, red, green, capital } = redField();
    const r = ritualCaster(state, red);
    const tryCast = (spell = 'callFireSprites') =>
      validateCommand(state, {
        type: 'castRitual',
        nation: red,
        commander: r.id,
        spell,
        target: null,
      });
    const near = annex(state, red, neighbors(state, capital)[0]!);
    // Leaving the capital: it still stands there until it arrives.
    r.transit = { from: capital, to: near.id, progress: 1, totalDays: 3 };
    expect(tryCast()).toMatch(/on the move/);
    r.transit = null;
    // An own province without a lab, then with one, then with a fort too.
    near.buildings = [];
    r.location = near.id;
    expect(tryCast()).toBe('Rituals need a lab in a province you own');
    near.buildings = ['lab'];
    expect(tryCast()).toBeNull();
    expect(tryCast('forgeOfCinders')).toBe('Forge of Cinders needs a fort where the caster stands');
    near.buildings = ['lab', 'fort'];
    expect(tryCast('forgeOfCinders')).toBeNull();
    // Another nation's lab.
    r.location = state.nations[green]!.capital;
    expect(tryCast()).toBe('Rituals need a lab in a province you own');
  });

  it('reaches provinces up to its hops away by adjacency, and no farther', () => {
    const { state, red, capital } = redField();
    const r = ritualCaster(state, red);
    const hops = [...hopsFrom(state, capital)];
    const at = (n: number) => hops.find(([, d]) => d === n)![0];
    const tryCast = (spell: string, target: ProvinceId) =>
      validateCommand(state, { type: 'castRitual', nation: red, commander: r.id, spell, target });
    expect(tryCast('burnTheFields', at(3))).toBeNull();
    expect(tryCast('burnTheFields', at(4))).toBe('Burn the Fields reaches only 3 provinces away');
    expect(tryCast('ashRain', at(4))).toBeNull();
    expect(tryCast('ashRain', at(5))).toBe('Ash Rain reaches only 4 provinces away');
  });

  it('takes the generic part as the command splits it', () => {
    const { state, red, capital } = redField();
    const r = ritualCaster(state, red);
    const target = neighbors(state, capital)[0]!;
    const cmd = { nation: red, commander: r.id, spell: 'burnTheFields', target };
    expect(applyCommand(state, { type: 'castRitual', ...cmd, generic: { G: 2 } })).toEqual({
      ok: true,
    });
    expect(state.nations[red]!.mana).toEqual({ W: 50, U: 50, B: 50, R: 46, G: 48 });
    expect(state.nations[red]!.stats.manaSpent).toEqual({ W: 0, U: 0, B: 0, R: 4, G: 2 });
  });
});

describe('giveMana', () => {
  it('moves whole mana from the pool to a commander in an own lab province', () => {
    const { state, red, capital, army } = redField();
    state.nations[red]!.mana.R = 3.5;
    const give = (amount: number) =>
      applyCommand(state, {
        type: 'giveMana',
        nation: red,
        commander: army.id,
        color: 'R',
        amount,
      });
    expect(give(4)).toMatchObject({ ok: false, error: 'Give 1 to 3 mana' });
    expect(give(1.5)).toMatchObject({ ok: false });
    expect(give(3)).toEqual({ ok: true });
    expect(army.carriedMana).toEqual({ R: 3 });
    expect(state.nations[red]!.mana.R).toBeCloseTo(0.5, 12);
    army.location = neighbors(state, capital)[0]!;
    state.nations[red]!.mana.R = 5;
    expect(give(1)).toMatchObject({
      ok: false,
      error: 'Mana is handed over in a lab in a province you own',
    });
  });

  it('is refused to a commander on the move or in another nation’s lab', () => {
    const { state, red, green, capital, army } = redField();
    state.nations[red]!.mana.R = 5;
    const give = () =>
      validateCommand(state, {
        type: 'giveMana',
        nation: red,
        commander: army.id,
        color: 'R',
        amount: 1,
      });
    expect(give()).toBeNull();
    army.transit = { from: capital, to: neighbors(state, capital)[0]!, progress: 1, totalDays: 3 };
    expect(give()).toBe('Ash Chieftain is on the move');
    army.transit = null;
    army.location = state.nations[green]!.capital;
    expect(state.provinces[army.location]!.buildings).toContain('lab');
    expect(give()).toBe('Mana is handed over in a lab in a province you own');
  });
});

describe('setResearchColor', () => {
  it('turns research to one of the five colors and refuses any other', () => {
    const { state, red } = redField();
    const set = (color: string) =>
      applyCommand(state, { type: 'setResearchColor', nation: red, color: color as Color });
    expect(set('G')).toEqual({ ok: true });
    expect(state.nations[red]!.research.color).toBe('G');
    expect(set('X')).toEqual({ ok: false, error: 'Unknown color' });
    expect(state.nations[red]!.research.color).toBe('G');
  });
});
