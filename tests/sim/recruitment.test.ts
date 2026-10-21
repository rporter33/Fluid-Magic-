// Recruitment at forts (docs/01-core-rules.md section 8).
import { describe, expect, it } from 'vitest';
import type { UnitTypeId } from '../../src/content';
import { applyCommand } from '../../src/sim/commands';
import type { NationId, ProvinceId, RecruitId } from '../../src/sim/ids';
import { recruitDays, recruitGold } from '../../src/sim/recruitment';
import { fortMaterials } from '../../src/sim/selectors';
import type { GameState } from '../../src/sim/types';
import {
  capitalOf,
  commandersIn,
  independentProvince,
  nationIds,
  redGame,
  runDays,
  twoNationGame,
} from './fixtures';

function recruit(
  state: GameState,
  nation: NationId,
  province: ProvinceId,
  unit: UnitTypeId,
  count: number,
) {
  return applyCommand(state, { type: 'recruit', nation, province, unit, count });
}

/** Red's capital with gold in the treasury and materials in its fort pool. */
function setup(state = twoNationGame()) {
  const red = nationIds(state)[0]!;
  const capital = capitalOf(state, red);
  capital.materials = 1000;
  state.nations[red]!.gold = 5000;
  const garrison = state.commanders[capital.garrison!]!;
  return { state, red, capital, garrison };
}

describe('recruiting troops', () => {
  it('pays gold and materials at once and population on completion', () => {
    const { state, red, capital, garrison } = setup();
    const gold = state.nations[red]!.gold;
    expect(recruit(state, red, capital.id, 'cinderWarrior', 15)).toEqual({ ok: true });
    expect(state.nations[red]!.gold).toBe(gold - 15 * 12);
    expect(capital.materials).toBe(1000 - 15 * 8);
    // 10 days per started 10 troops.
    expect(capital.recruitQueue).toEqual([
      {
        id: expect.stringMatching(/^rq\d+$/) as unknown,
        unit: 'cinderWarrior',
        count: 15,
        nation: red,
        daysLeft: 20,
        paid: { gold: 180, materials: 120 },
      },
    ]);
    const pop = capital.pop;
    runDays(state, 19);
    expect(garrison.squads).toEqual([]);
    expect(capital.pop).toBeGreaterThan(pop);
    const before = capital.pop;
    runDays(state, 1);
    expect(capital.recruitQueue).toEqual([]);
    // 150 people leave first; the day's growth comes from what remains.
    expect(capital.pop).toBeCloseTo((before - 150) * (1 + 0.002 / 30), 6);
    expect(garrison.squads.map((s) => [s.unit, s.count, s.hp, s.formation])).toEqual([
      ['cinderWarrior', 15, 165, 'front'],
    ]);
    expect(state.messages.some((m) => m.kind === 'recruited' && m.nation === red)).toBe(true);
  });

  it('waits at the end of its time until the province has the people', () => {
    const { state, red, capital, garrison } = setup();
    recruit(state, red, capital.id, 'cinderWarrior', 10);
    capital.pop = 50;
    runDays(state, 15);
    expect(capital.recruitQueue[0]!.daysLeft).toBe(0);
    expect(garrison.squads).toEqual([]);
    capital.pop = 5000;
    runDays(state, 1);
    expect(garrison.squads).toHaveLength(1);
    expect(capital.pop).toBeCloseTo((5000 - 100) * (1 + 0.002 / 30), 6);
  });

  it('merges a batch into a garrison squad of the same unit and row', () => {
    const { state, red, capital, garrison } = setup();
    recruit(state, red, capital.id, 'ashMilitia', 10);
    recruit(state, red, capital.id, 'ashMilitia', 5);
    runDays(state, 16);
    expect(garrison.squads.map((s) => [s.unit, s.count, s.hp])).toEqual([['ashMilitia', 15, 150]]);
  });

  it('works one item at a time, in queue order', () => {
    const { state, red, capital, garrison } = setup();
    recruit(state, red, capital.id, 'ashMilitia', 10);
    recruit(state, red, capital.id, 'flameArcher', 5);
    runDays(state, 8);
    expect(garrison.squads.map((s) => s.unit)).toEqual(['ashMilitia']);
    runDays(state, 9);
    expect(garrison.squads.map((s) => s.unit)).toEqual(['ashMilitia']);
    runDays(state, 1);
    expect(garrison.squads.map((s) => s.unit)).toEqual(['ashMilitia', 'flameArcher']);
  });
});

describe('recruiting commanders', () => {
  it('stands a new idle commander in the fort, with its pips and script', () => {
    const { state, red, capital } = setup();
    expect(recruit(state, red, capital.id, 'emberAdept', 1)).toEqual({ ok: true });
    runDays(state, 20);
    const adepts = commandersIn(state, capital.id).filter((c) => c.unit === 'emberAdept');
    expect(adepts).toHaveLength(2);
    const fresh = adepts[1]!;
    expect(fresh).toMatchObject({ owner: red, order: { kind: 'idle' }, pips: { R: 1 }, hp: 10 });
    expect(fresh.script[0]).toEqual({ kind: 'cast', spellId: null });
  });

  it('recruits commanders one at a time', () => {
    const { state, red, capital } = setup();
    expect(recruit(state, red, capital.id, 'ashChieftain', 2).ok).toBe(false);
  });
});

describe('recruit time and cost', () => {
  it('rounds to whole days without floating-point noise', () => {
    // Order 2 is +10%: 50 Cinder Warriors take 10 * 5 * 1.1 = 55 days, not 56.
    const state = redGame(10, { order: 2 });
    const capital = capitalOf(state, nationIds(state)[0]!).id;
    expect(recruitDays(state, capital, 'cinderWarrior', 50)).toBe(55);
  });

  it('slows with Wild and speeds up with Artifice, which scale build time', () => {
    const wild = redGame(10, { wild: 3 });
    expect(recruitDays(wild, capitalOf(wild, nationIds(wild)[0]!).id, 'cinderWarrior', 10)).toBe(
      15,
    );
    const artifice = redGame(10, { wild: -3 });
    expect(
      recruitDays(artifice, capitalOf(artifice, nationIds(artifice)[0]!).id, 'cinderWarrior', 10),
    ).toBe(6);
  });

  it('runs faster with Turmoil and slower with Order', () => {
    const turmoil = redGame(10, { order: -3 });
    const t = capitalOf(turmoil, nationIds(turmoil)[0]!).id;
    expect(recruitDays(turmoil, t, 'cinderWarrior', 10)).toBe(7);
    expect(recruitDays(turmoil, t, 'cinderWarrior', 11)).toBe(14);
    const order = redGame(10, { order: 3 });
    const o = capitalOf(order, nationIds(order)[0]!).id;
    expect(recruitDays(order, o, 'cinderWarrior', 10)).toBe(12);
    expect(recruitDays(order, o, 'ashChieftain', 1)).toBe(18);
  });

  it('makes beasts cheaper with Wild', () => {
    const state = twoNationGame(1, {}, {});
    const green = nationIds(state)[1]!;
    const deepmoss = capitalOf(state, green);
    expect(recruitGold(state, deepmoss.id, 'wolfRider', 10)).toBe(260);
    deepmoss.dominion = { nation: green, strength: 10 };
    state.nations[green]!.pretender.scales.wild = 3;
    expect(recruitGold(state, deepmoss.id, 'wolfRider', 10)).toBeCloseTo(260 * 0.7, 9);
    expect(recruitGold(state, deepmoss.id, 'warden', 10)).toBe(140);
  });
});

describe('recruit validation', () => {
  it('needs a fort, the buildings the unit asks for, and the capital for the adept tier', () => {
    const { state, red, capital } = setup();
    const p = independentProvince(state);
    p.owner = red;
    p.materials = 1000;
    expect(recruit(state, red, p.id, 'cinderWarrior', 10).ok).toBe(false);
    p.buildings = ['fort', 'lab', 'temple'];
    expect(recruit(state, red, p.id, 'cinderWarrior', 10).ok).toBe(true);
    expect(recruit(state, red, p.id, 'emberAdept', 1).ok).toBe(true);
    expect(recruit(state, red, p.id, 'cinderMagus', 1).ok).toBe(false);
    expect(recruit(state, red, capital.id, 'cinderMagus', 1).ok).toBe(true);
    capital.buildings = ['fort'];
    expect(recruit(state, red, capital.id, 'flamebrand', 1).ok).toBe(false);
    expect(recruit(state, red, capital.id, 'pyrePriest', 1).ok).toBe(false);
    expect(recruit(state, red, capital.id, 'emberAdept', 1).ok).toBe(false);
  });

  it("recruits only the nation's own recruitable units", () => {
    const { state, red, capital } = setup();
    for (const unit of ['warden', 'fireSprite', 'garrison', 'lightInfantry'] as const) {
      expect(recruit(state, red, capital.id, unit, 1).ok).toBe(false);
    }
    expect(recruit(state, red, capital.id, 'nope' as UnitTypeId, 1).ok).toBe(false);
  });

  it('takes 1 to 50 whole troops and needs the gold and materials up front', () => {
    const { state, red, capital } = setup();
    for (const count of [0, 51, 1.5, -1]) {
      expect(recruit(state, red, capital.id, 'ashMilitia', count).ok).toBe(false);
    }
    expect(recruit(state, red, capital.id, 'ashMilitia', 50).ok).toBe(true);
    state.nations[red]!.gold = 11;
    expect(recruit(state, red, capital.id, 'cinderWarrior', 1).ok).toBe(false);
    state.nations[red]!.gold = 1000;
    capital.materials = 7;
    expect(recruit(state, red, capital.id, 'cinderWarrior', 1).ok).toBe(false);
  });

  it('is blocked by a siege and by unrest above 50, which also pause the queue', () => {
    const { state, red, capital, garrison } = setup();
    const green = nationIds(state)[1]!;
    recruit(state, red, capital.id, 'ashMilitia', 10);
    capital.unrest = 51;
    expect(recruit(state, red, capital.id, 'ashMilitia', 10).ok).toBe(false);
    capital.unrest = 50;
    expect(recruit(state, red, capital.id, 'ashMilitia', 10).ok).toBe(true);
    capital.siege = { attacker: green, wallHp: 300 };
    expect(recruit(state, red, capital.id, 'ashMilitia', 10).ok).toBe(false);
    runDays(state, 20);
    expect(capital.recruitQueue[0]!.daysLeft).toBe(8);
    expect(garrison.squads).toEqual([]);
  });
});

describe('cancelling and losing the fort', () => {
  it('refunds gold in full by item id, and materials up to the fort cap', () => {
    const { state, red, capital } = setup();
    const { cap } = fortMaterials(state, capital.id);
    capital.materials = cap;
    recruit(state, red, capital.id, 'ashMilitia', 10);
    recruit(state, red, capital.id, 'cinderWarrior', 10);
    const [first, second] = capital.recruitQueue;
    const gold = state.nations[red]!.gold;
    const cancel = (order: RecruitId) =>
      applyCommand(state, { type: 'cancelRecruit', nation: red, province: capital.id, order });
    // Below the cap by 110: the warriors' 80 materials come back in full.
    expect(capital.materials).toBeCloseTo(cap - 110, 9);
    expect(cancel(second!.id)).toEqual({ ok: true });
    expect(state.nations[red]!.gold).toBe(gold + 120);
    expect(capital.materials).toBeCloseTo(cap - 30, 9);
    expect(capital.recruitQueue).toEqual([first]);
    expect(cancel(second!.id).ok).toBe(false);
    expect(cancel('rq9999' as RecruitId).ok).toBe(false);
    // The militia's 30 would reach the cap exactly; a fuller pool gets only up to the cap.
    capital.materials = cap - 10;
    expect(cancel(first!.id)).toEqual({ ok: true });
    expect(capital.materials).toBeCloseTo(cap, 9);
    // A pool above the cap keeps what it has.
    recruit(state, red, capital.id, 'ashMilitia', 10);
    capital.materials = cap + 100;
    expect(cancel(capital.recruitQueue[0]!.id)).toEqual({ ok: true });
    expect(capital.materials).toBe(cap + 100);
  });

  it("cannot cancel another nation's item", () => {
    const { state, red, capital } = setup();
    const green = nationIds(state)[1]!;
    recruit(state, red, capital.id, 'ashMilitia', 10);
    capital.owner = green;
    const order = capital.recruitQueue[0]!.id;
    expect(
      applyCommand(state, { type: 'cancelRecruit', nation: green, province: capital.id, order }).ok,
    ).toBe(false);
  });

  it('drops what the old owner queued when the fort changes hands', () => {
    const { state, red, capital } = setup();
    const green = nationIds(state)[1]!;
    recruit(state, red, capital.id, 'ashMilitia', 10);
    capital.owner = green;
    runDays(state, 1);
    expect(capital.recruitQueue).toEqual([]);
  });

  it("gives the new owner its own garrison holder, removing the old one's", () => {
    const { state, red, capital, garrison } = setup();
    const green = nationIds(state)[1]!;
    recruit(state, red, capital.id, 'ashMilitia', 10);
    runDays(state, 8);
    expect(garrison.squads).toHaveLength(1);
    capital.owner = green;
    capital.recruitQueue.push({
      id: 'rq9000' as RecruitId,
      unit: 'thornMilitia',
      count: 5,
      nation: green,
      daysLeft: 1,
      paid: { gold: 0, materials: 0 },
    });
    runDays(state, 1);
    expect(state.commanders[garrison.id]).toBeUndefined();
    const holder = state.commanders[capital.garrison!]!;
    expect(holder.owner).toBe(green);
    expect(holder.squads.map((s) => [s.unit, s.count])).toEqual([['thornMilitia', 5]]);
  });
});
