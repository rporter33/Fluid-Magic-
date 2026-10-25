// Rituals (docs/02-magic.md sections 3, 5, 6): every Red and Green ritual cast through the
// command and run to completion, payment, targets, and failure. ritualEffects.test.ts tests the
// primitives on their own.
import { describe, expect, it } from 'vitest';
import { unitDef } from '../../src/content';
import { RITUALS, SPELLS } from '../../src/content/spells';
import type { RitualSpellDef } from '../../src/content/spells/types';
import { applyCommand, validateCommand } from '../../src/sim/commands';
import { addSquad, createSquad } from '../../src/sim/commanders';
import type { ProvinceId } from '../../src/sim/ids';
import { ritualPayment, ritualTargets, withinHops } from '../../src/sim/rituals';
import { activeEffects } from '../../src/sim/state';
import type { GameState } from '../../src/sim/types';
import {
  annex,
  castRitual,
  commandersIn,
  neighbors,
  redField,
  RICH_POOLS,
  ritualCaster,
  runDays,
} from './fixtures';

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
    const r = ritualCaster(state, red);
    const g = ritualCaster(state, green);
    expect(castRitual(state, red, r, 'callFireSprites')).toEqual({ ok: true });
    expect(castRitual(state, green, g, 'callOfTheWild')).toEqual({ ok: true });
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
    const r = ritualCaster(state, red);
    const g = ritualCaster(state, green);
    expect(castRitual(state, red, r, 'bindSalamander')).toEqual({ ok: true });
    expect(castRitual(state, green, g, 'awakenTreant')).toEqual({ ok: true });
    runDays(state, 20);
    const sal = commandersIn(state, r.location).find((c) => c.unit === 'salamander');
    const tree = commandersIn(state, g.location).find((c) => c.unit === 'treant');
    expect(sal).toMatchObject({ owner: red, pips: { R: 2 }, hp: 35, squads: [] });
    expect(sal?.script[0]).toEqual({ kind: 'cast', spellId: null });
    expect(tree).toMatchObject({ owner: green, pips: { G: 1 }, hp: 60 });
  });

  it('Forge of Cinders, Fertile Season, Bounty of the Loam, and Rootwall leave timed effects', () => {
    const { state, red, green } = redField();
    const r = ritualCaster(state, red);
    const g = ritualCaster(state, green);
    const home = state.nations[green]!.capital;
    expect(castRitual(state, red, r, 'forgeOfCinders')).toEqual({ ok: true });
    expect(castRitual(state, green, g, 'bountyOfTheLoam', home)).toEqual({ ok: true });
    runDays(state, 10);
    const forge = activeEffects(state, r.location).filter((e) => e.source === 'forgeOfCinders');
    expect(forge).toMatchObject([{ kind: 'materials', delta: 25, nation: red }]);
    expect(forge[0]!.untilDay - state.day).toBe(180 - 1);
    const bounty = activeEffects(state, home).filter((e) => e.source === 'bountyOfTheLoam');
    expect(bounty.map((e) => e.kind).sort()).toEqual(['materials', 'supply']);
    expect(castRitual(state, green, g, 'fertileSeason', home)).toEqual({ ok: true });
    runDays(state, 10);
    expect(castRitual(state, green, g, 'rootwall', home)).toEqual({ ok: true });
    runDays(state, 15);
    const kinds = activeEffects(state, home).map((e) => [e.source, e.kind]);
    expect(kinds).toContainEqual(['fertileSeason', 'growth']);
    expect(kinds).toContainEqual(['rootwall', 'defense']);
  });

  it('Burn the Fields and Ash Rain strike a province within range', () => {
    const { state, red } = redField();
    const r = ritualCaster(state, red);
    const target = independentNear(state, r.location, 3);
    const p = state.provinces[target]!;
    p.unrest = 0;
    const pop = p.pop;
    expect(castRitual(state, red, r, 'burnTheFields', target)).toEqual({ ok: true });
    runDays(state, 10);
    expect(p.pop).toBeLessThan(pop * 0.95);
    expect(p.unrest).toBeGreaterThanOrEqual(14);
    expect(activeEffects(state, target).find((e) => e.source === 'burnTheFields')).toMatchObject({
      kind: 'supply',
      deltaPct: -0.5,
    });

    const guards = commandersIn(state, target).flatMap((c) => c.squads);
    const before = guards.reduce((n, s) => n + s.hp, 0);
    expect(castRitual(state, red, r, 'ashRain', target)).toEqual({ ok: true });
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
    expect(ritualPayment(RICH_POOLS, burn, { G: 2 })).toMatchObject({ R: 4, G: 2 });
    expect(ritualPayment(RICH_POOLS, burn, { G: 1 })).toMatch(/takes 2 generic/);
    expect(ritualPayment(RICH_POOLS, burn, { G: 1.5, U: 0.5 })).toMatch(/whole/);
  });

  it('offers as targets only what the command accepts', () => {
    const { state, red, green } = redField();
    const r = ritualCaster(state, red);
    const g = ritualCaster(state, green);
    const agree = (): number => {
      let offered = 0;
      for (const spell of RITUALS) {
        const c = spell.color === 'R' ? r : g;
        for (const target of ritualTargets(state, c, spell)) {
          offered += 1;
          const cmd = { nation: c.owner!, commander: c.id, spell: spell.id, target };
          expect(validateCommand(state, { type: 'castRitual', ...cmd }), spell.id).toBeNull();
        }
      }
      return offered;
    };
    for (const s of RITUALS) {
      expect(ritualTargets(state, s.color === 'R' ? r : g, s).length, s.id).toBeGreaterThan(0);
    }
    const all = agree();
    // Mages leading all they can, then nations short of mana: fewer targets, all still accepted.
    for (const m of [r, g]) {
      addSquad(m, createSquad(state, 'cinderWarrior', unitDef(m.unit).commander!.leadership));
    }
    const led = agree();
    expect(led).toBeLessThan(all);
    state.nations[red]!.mana.R = 4;
    state.nations[green]!.mana.G = 4;
    expect(agree()).toBeLessThan(led);
  });

  it('offers no target without the mana or, for a summoning, the leadership', () => {
    const { state, red } = redField();
    const r = ritualCaster(state, red);
    const sprites = SPELLS.callFireSprites as RitualSpellDef;
    const burn = SPELLS.burnTheFields as RitualSpellDef;
    state.nations[red]!.mana = { W: 0, U: 0, B: 0, R: 0, G: 0 };
    expect(ritualTargets(state, r, sprites)).toEqual([]);
    expect(ritualTargets(state, r, burn)).toEqual([]);
    state.nations[red]!.mana = { ...RICH_POOLS };
    expect(ritualTargets(state, r, sprites)).toEqual([null]);
    addSquad(r, createSquad(state, 'cinderWarrior', unitDef(r.unit).commander!.leadership));
    expect(ritualTargets(state, r, sprites)).toEqual([]);
    expect(castRitual(state, red, r, 'callFireSprites')).toMatchObject({ error: /can lead only/ });
    expect(ritualTargets(state, r, burn).length).toBeGreaterThan(0);
  });

  it('fails at completion when its target is no longer valid, with no refund', () => {
    const { state, green, red } = redField();
    const g = ritualCaster(state, green);
    const home = state.nations[green]!.capital;
    const near = neighbors(state, home)[0]!;
    annex(state, green, near);
    expect(castRitual(state, green, g, 'fertileSeason', near)).toEqual({ ok: true });
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
    const r = ritualCaster(state, red);
    expect(castRitual(state, red, r, 'callFireSprites')).toEqual({ ok: true });
    applyCommand(state, { type: 'setOrder', nation: red, commander: r.id, order: 'idle' });
    runDays(state, 6);
    expect(r.squads).toEqual([]);
    expect(state.nations[red]!.stats.manaSpent.R).toBe(2);
  });
});
