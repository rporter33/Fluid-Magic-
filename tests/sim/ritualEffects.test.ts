// Ritual effect primitives (docs/02-magic.md section 5 and its Rituals decisions), applied as a
// finished ritual applies them: how long timed effects last, whom remoteDamage reaches, and the
// primitives no M1 spell uses.
import { describe, expect, it } from 'vitest';
import { RITUALS, SPELLS } from '../../src/content/spells';
import type { RitualEffect, RitualSpellDef } from '../../src/content/spells/types';
import { addSquad, createSquad, isGarrisonHolder } from '../../src/sim/commanders';
import type { NationId, ProvinceId } from '../../src/sim/ids';
import { applyRitualEffect } from '../../src/sim/ritualEffects';
import { withinHops } from '../../src/sim/rituals';
import type { CommanderState, GameState } from '../../src/sim/types';
import { independentStrengthView, visionOf } from '../../src/sim/visibility';
import {
  addArmy,
  annex,
  commandersIn,
  independentProvince,
  neighbors,
  redField,
  ritualCaster,
} from './fixtures';

/** A test-only Red ritual made of the given effects. */
function ritual(effects: RitualEffect[]): RitualSpellDef {
  return { ...(SPELLS.callFireSprites as RitualSpellDef), id: 'test:ritual', effects };
}

/** Lands `dice` d6 of remoteDamage on a province, as a finished Red ritual would. */
function rain(state: GameState, caster: CommanderState, province: ProvinceId, dice: number) {
  const spell = ritual([{ kind: 'remoteDamage', dice, element: 'fire' }]);
  const nation = caster.owner as NationId;
  applyRitualEffect(state, { nation, caster, spell, province }, spell.effects[0]!);
}

describe('timed ritual effects', () => {
  it('last months * 30 days from the day the ritual lands', () => {
    const { state, red, green } = redField();
    const casters = { R: ritualCaster(state, red), G: ritualCaster(state, green) };
    state.day = 40;
    for (const spell of RITUALS) {
      const caster = spell.color === 'R' ? casters.R : casters.G;
      const ctx = { nation: caster.owner as NationId, caster, spell, province: caster.location };
      for (const e of spell.effects) if ('months' in e) applyRitualEffect(state, ctx, e);
    }
    const lasting: Record<string, number[]> = {};
    for (const e of state.provinceEffects) (lasting[e.source] ??= []).push(e.untilDay - state.day);
    expect(lasting).toEqual({
      forgeOfCinders: [180],
      burnTheFields: [90],
      fertileSeason: [180],
      bountyOfTheLoam: [180, 180],
      rootwall: [360],
    });
  });
});

describe('remoteDamage', () => {
  it('ignores protection: 2d6 kills some Wardens (hp 11, prot 6) and wounds every survivor', () => {
    const { state, red, green } = redField();
    const r = ritualCaster(state, red);
    const p = annex(state, green, independentProvince(state).id);
    const wardens = addArmy(state, green, p.id, 'warden', 120, 'wardenCaptain');
    rain(state, r, p.id, 2);
    const [squad] = wardens.squads;
    expect(squad!.count).toBeGreaterThan(0);
    expect(squad!.count).toBeLessThan(120);
    // Each survivor took at least 2 of its 11 HP.
    expect(squad!.hp).toBeLessThanOrEqual(squad!.count * 9);
  });

  it('reaches every squad in the province, of any owner and the garrison’s, but no commander', () => {
    const { state, red, green, capital, army } = redField();
    const r = ritualCaster(state, red);
    const garrison = commandersIn(state, capital).find(isGarrisonHolder)!;
    addSquad(garrison, createSquad(state, 'cinderWarrior', 10));
    const foe = addArmy(state, green, capital, 'warden', 5, 'wardenCaptain');
    const leaders = [army, garrison, foe];
    const hp = leaders.map((c) => c.hp);
    rain(state, r, capital, 30);
    expect(leaders.map((c) => c.squads)).toEqual([[], [], []]);
    expect(leaders.map((c) => c.hp)).toEqual(hp);
  });
});

describe('ritual primitives no M1 spell uses', () => {
  it('scry shows one province to the caster for 30 days and explores it', () => {
    const { state, red } = redField();
    const r = ritualCaster(state, red);
    const far = [...withinHops(state, r.location, 8)].find(
      (p) => !visionOf(state, red).has(p) && state.provinces[p]!.owner === null,
    )!;
    const spell = ritual([{ kind: 'scry' }]);
    applyRitualEffect(state, { nation: red, caster: r, spell, province: far }, spell.effects[0]!);
    expect(visionOf(state, red).has(far)).toBe(true);
    expect(state.nations[red]!.explored).toContain(far);
    expect(independentStrengthView(state, red, far).exact).not.toBeNull();
    state.day += 30;
    expect(visionOf(state, red).has(far)).toBe(false);
  });

  it('dominionPush builds own dominion to the score and wears down another nation’s', () => {
    const { state, red, green } = redField();
    const r = ritualCaster(state, red);
    const p = state.provinces[neighbors(state, r.location)[0]!]!;
    const push = (n: number) => {
      const spell = ritual([{ kind: 'dominionPush', strength: n }]);
      applyRitualEffect(
        state,
        { nation: red, caster: r, spell, province: p.id },
        spell.effects[0]!,
      );
    };
    p.dominion = { nation: green, strength: 2 };
    push(3);
    expect(p.dominion).toEqual({ nation: red, strength: 1 });
    push(20);
    expect(p.dominion).toEqual({ nation: red, strength: 5 });
  });

  it('manaConvert turns a whole pool into another color', () => {
    const { state, red } = redField();
    const r = ritualCaster(state, red);
    const spell = ritual([{ kind: 'manaConvert', from: 'G', to: 'R', ratio: 2 }]);
    applyRitualEffect(
      state,
      { nation: red, caster: r, spell, province: r.location },
      spell.effects[0]!,
    );
    expect(state.nations[red]!.mana).toMatchObject({ G: 0, R: 75 });
  });
});
