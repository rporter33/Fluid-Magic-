// Rituals (docs/02-magic.md sections 3, 5, 6): every Red and Green ritual cast through the
// command and run to completion, payment, targets, refusals, and every ritual primitive.
import { describe, expect, it } from 'vitest';
import { RITUALS, SPELLS } from '../../src/content/spells';
import type { RitualEffect, RitualSpellDef } from '../../src/content/spells/types';
import { applyCommand, validateCommand } from '../../src/sim/commands';
import { createCommander } from '../../src/sim/commanders';
import type { NationId, ProvinceId } from '../../src/sim/ids';
import { applyRitualEffect } from '../../src/sim/ritualEffects';
import { ritualPayment, ritualTargets, withinHops } from '../../src/sim/rituals';
import { activeEffects } from '../../src/sim/state';
import type { ColorAmounts, CommanderState, GameState } from '../../src/sim/types';
import { independentStrengthView, visionOf } from '../../src/sim/visibility';
import { annex, commandersIn, neighbors, redField, runDays } from './fixtures';

const RICH: ColorAmounts = { W: 50, U: 50, B: 50, R: 50, G: 50 };

/** A nation's master mage in its capital lab, with every level researched and full pools. */
function caster(state: GameState, nation: NationId): CommanderState {
  const n = state.nations[nation]!;
  n.mana = { ...RICH };
  n.research.points = { W: 1050, U: 1050, B: 1050, R: 1050, G: 1050 };
  const color = n.colors[0];
  const mage = createCommander(
    state,
    color === 'R' ? 'cinderMagus' : 'elderDruid',
    nation,
    n.capital,
  );
  mage.pips = { [color]: 4 };
  return mage;
}

function cast(
  state: GameState,
  nation: NationId,
  c: CommanderState,
  spell: string,
  target: ProvinceId | null = null,
) {
  return applyCommand(state, { type: 'castRitual', nation, commander: c.id, spell, target });
}

/** An independent province within some hops, or throws. */
function independentNear(state: GameState, from: ProvinceId, hops: number): ProvinceId {
  const found = [...withinHops(state, from, hops)].find((p) => state.provinces[p]!.owner === null);
  if (!found) throw new Error('none near');
  return found;
}

describe('every Red and Green ritual', () => {
  it('has ten of them', () => {
    expect(RITUALS.map((s) => s.id)).toEqual([
      'callFireSprites',
      'forgeOfCinders',
      'burnTheFields',
      'bindSalamander',
      'ashRain',
      'callOfTheWild',
      'fertileSeason',
      'awakenTreant',
      'bountyOfTheLoam',
      'rootwall',
    ]);
  });

  it('Call Fire Sprites and Call of the Wild bring troops to the caster', () => {
    const { state, red, green } = redField();
    const r = caster(state, red);
    const g = caster(state, green);
    expect(cast(state, red, r, 'callFireSprites')).toEqual({ ok: true });
    expect(cast(state, green, g, 'callOfTheWild')).toEqual({ ok: true });
    expect(r.order).toEqual({
      kind: 'castRitual',
      spellId: 'callFireSprites',
      target: null,
      daysLeft: 5,
    });
    expect(state.nations[red]!.mana.R).toBe(48);
    runDays(state, 4);
    expect(r.squads).toEqual([]);
    runDays(state, 1);
    expect(r.squads.map((s) => [s.unit, s.count])).toEqual([['fireSprite', 5]]);
    expect(g.squads.map((s) => [s.unit, s.count])).toEqual([['wolf', 6]]);
    expect(r.order).toEqual({ kind: 'idle' });
    const note = state.messages.find((m) => m.nation === red && m.kind === 'ritual');
    expect(note?.text).toMatch(/^Call Fire Sprites is complete at /);
  });

  it('Bind Salamander and Awaken Treant raise new mage commanders', () => {
    const { state, red, green } = redField();
    const r = caster(state, red);
    const g = caster(state, green);
    expect(cast(state, red, r, 'bindSalamander')).toEqual({ ok: true });
    expect(cast(state, green, g, 'awakenTreant')).toEqual({ ok: true });
    runDays(state, 20);
    const sal = commandersIn(state, r.location).find((c) => c.unit === 'salamander');
    const tree = commandersIn(state, g.location).find((c) => c.unit === 'treant');
    expect(sal).toMatchObject({ owner: red, pips: { R: 2 }, hp: 35, squads: [] });
    expect(sal?.script[0]).toEqual({ kind: 'cast', spellId: null });
    expect(tree).toMatchObject({ owner: green, pips: { G: 1 }, hp: 60 });
  });

  it('Forge of Cinders, Fertile Season, Bounty of the Loam, and Rootwall leave timed effects', () => {
    const { state, red, green } = redField();
    const r = caster(state, red);
    const g = caster(state, green);
    const home = state.nations[green]!.capital;
    expect(cast(state, red, r, 'forgeOfCinders')).toEqual({ ok: true });
    expect(cast(state, green, g, 'bountyOfTheLoam', home)).toEqual({ ok: true });
    runDays(state, 10);
    const forge = activeEffects(state, r.location).filter((e) => e.source === 'forgeOfCinders');
    expect(forge).toMatchObject([{ kind: 'materials', delta: 25, nation: red }]);
    expect(forge[0]!.untilDay - state.day).toBe(180 - 1);
    const bounty = activeEffects(state, home).filter((e) => e.source === 'bountyOfTheLoam');
    expect(bounty.map((e) => e.kind).sort()).toEqual(['materials', 'supply']);
    expect(cast(state, green, g, 'fertileSeason', home)).toEqual({ ok: true });
    runDays(state, 10);
    expect(cast(state, green, g, 'rootwall', home)).toEqual({ ok: true });
    runDays(state, 15);
    const kinds = activeEffects(state, home).map((e) => [e.source, e.kind]);
    expect(kinds).toContainEqual(['fertileSeason', 'growth']);
    expect(kinds).toContainEqual(['rootwall', 'defense']);
  });

  it('Burn the Fields and Ash Rain strike a province within range', () => {
    const { state, red } = redField();
    const r = caster(state, red);
    const target = independentNear(state, r.location, 3);
    const p = state.provinces[target]!;
    p.unrest = 0;
    const pop = p.pop;
    expect(cast(state, red, r, 'burnTheFields', target)).toEqual({ ok: true });
    runDays(state, 10);
    expect(p.pop).toBeLessThan(pop * 0.95);
    expect(p.unrest).toBeGreaterThanOrEqual(14);
    expect(activeEffects(state, target).find((e) => e.source === 'burnTheFields')).toMatchObject({
      kind: 'supply',
      deltaPct: -0.5,
    });

    const guards = commandersIn(state, target).flatMap((c) => c.squads);
    const before = guards.reduce((n, s) => n + s.hp, 0);
    expect(cast(state, red, r, 'ashRain', target)).toEqual({ ok: true });
    runDays(state, 25);
    const after = commandersIn(state, target).flatMap((c) => c.squads);
    expect(after.reduce((n, s) => n + s.hp, 0)).toBeLessThan(before);
    for (const s of after) expect(s.count).toBeGreaterThan(0);
    expect(p.unrest).toBeGreaterThanOrEqual(35);
  });
});

describe('casting a ritual', () => {
  it('pays the generic cost from the spell’s color first, then the largest pools', () => {
    const burn = SPELLS.burnTheFields as RitualSpellDef;
    expect(ritualPayment({ W: 0, U: 5, B: 0, R: 10, G: 3 }, burn)).toEqual({
      W: 0,
      U: 0,
      B: 0,
      R: 6,
      G: 0,
    });
    expect(ritualPayment({ W: 0, U: 5, B: 0, R: 4.5, G: 3 }, burn)).toEqual({
      W: 0,
      U: 1.5,
      B: 0,
      R: 4.5,
      G: 0,
    });
    expect(ritualPayment({ W: 0, U: 1, B: 0, R: 4, G: 0 }, burn)).toBe('Not enough mana');
    expect(ritualPayment(RICH, burn, { G: 2 })).toMatchObject({ R: 4, G: 2 });
    expect(ritualPayment(RICH, burn, { G: 1 })).toMatch(/takes 2 generic/);
    expect(ritualPayment(RICH, burn, { G: 1.5, U: 0.5 })).toMatch(/whole/);
  });

  it('is refused for the wrong caster, place, research, target, or mana', () => {
    const { state, red, green, capital, army } = redField();
    const r = caster(state, red);
    const far = [...withinHops(state, capital, 6)].find(
      (p) => !withinHops(state, capital, 3).has(p),
    )!;
    const tryCast = (c: CommanderState, spell: string, target: ProvinceId | null = null) =>
      validateCommand(state, { type: 'castRitual', nation: red, commander: c.id, spell, target });
    expect(tryCast(caster(state, green), 'callFireSprites')).toMatch(/not yours/);
    expect(tryCast(army, 'callFireSprites')).toMatch(/cannot cast/);
    expect(tryCast(r, 'emberDart')).toMatch(/cast in battle/);
    expect(tryCast(r, 'nope')).toMatch(/Unknown spell/);
    expect(tryCast(r, 'burnTheFields')).toMatch(/needs a target/);
    expect(tryCast(r, 'burnTheFields', far)).toMatch(/reaches only 3/);
    expect(tryCast(r, 'callFireSprites', capital)).toMatch(/own province/);
    expect(tryCast(r, 'fertileSeason')).toMatch(/cast in battle|Unknown|cannot cast/);
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
    caster(state, red);
    const adept = createCommander(state, 'emberAdept', red, capital);
    const once = () => cast(state, red, adept, 'callFireSprites');
    expect(once()).toEqual({ ok: true });
    runDays(state, 5);
    expect(once()).toEqual({ ok: true });
    runDays(state, 5);
    expect(adept.squads[0]?.count).toBe(10);
    expect(once()).toEqual({ ok: false, error: 'Ember Adept can lead only 10 troops' });
  });

  it('cannot be laid twice on a province while its effect lasts', () => {
    const { state, green } = redField();
    const g = caster(state, green);
    const home = state.nations[green]!.capital;
    expect(cast(state, green, g, 'fertileSeason', home)).toEqual({ ok: true });
    runDays(state, 10);
    expect(cast(state, green, g, 'fertileSeason', home)).toMatchObject({
      ok: false,
      error: 'Fertile Season is already at work there',
    });
    expect(ritualTargets(state, g, SPELLS.fertileSeason as RitualSpellDef)).not.toContain(home);
  });

  it('fails at completion when its target is no longer valid, with no refund', () => {
    const { state, green, red } = redField();
    const g = caster(state, green);
    const home = state.nations[green]!.capital;
    const near = neighbors(state, home)[0]!;
    annex(state, green, near);
    expect(cast(state, green, g, 'fertileSeason', near)).toEqual({ ok: true });
    const mana = { ...state.nations[green]!.mana };
    state.provinces[near]!.owner = red;
    runDays(state, 10);
    expect(g.order).toEqual({ kind: 'idle' });
    expect(activeEffects(state, near)).toEqual([]);
    expect(state.nations[green]!.mana.G).toBeGreaterThanOrEqual(mana.G);
    const note = state.messages.filter((m) => m.nation === green && m.kind === 'ritual').at(-1);
    expect(note?.text).toBe('Fertile Season failed: Fertile Season needs a province you own.');
  });

  it('ends when the caster is given another order, and the mana stays spent', () => {
    const { state, red } = redField();
    const r = caster(state, red);
    expect(cast(state, red, r, 'callFireSprites')).toEqual({ ok: true });
    applyCommand(state, { type: 'setOrder', nation: red, commander: r.id, order: 'idle' });
    runDays(state, 6);
    expect(r.squads).toEqual([]);
    expect(state.nations[red]!.stats.manaSpent.R).toBe(2);
  });
});

describe('ritual primitives no M1 spell uses', () => {
  const ritual = (effects: RitualEffect[]): RitualSpellDef => ({
    ...(SPELLS.callFireSprites as RitualSpellDef),
    id: 'test:ritual',
    effects,
  });

  it('scry shows one province to the caster for 30 days and explores it', () => {
    const { state, red } = redField();
    const r = caster(state, red);
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
    const r = caster(state, red);
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
    const r = caster(state, red);
    const spell = ritual([{ kind: 'manaConvert', from: 'G', to: 'R', ratio: 2 }]);
    applyRitualEffect(
      state,
      { nation: red, caster: r, spell, province: r.location },
      spell.effects[0]!,
    );
    expect(state.nations[red]!.mana).toMatchObject({ G: 0, R: 75 });
  });

  it('remoteDamage hits troops only, never commanders, and clears emptied squads', () => {
    const { state, red, capital, army } = redField();
    const r = caster(state, red);
    const hp = army.hp;
    const spell = ritual([{ kind: 'remoteDamage', dice: 30, element: 'fire' }]);
    applyRitualEffect(
      state,
      { nation: red, caster: r, spell, province: capital },
      spell.effects[0]!,
    );
    expect(army.hp).toBe(hp);
    expect(army.squads).toEqual([]);
  });
});

describe('giving mana', () => {
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
});
