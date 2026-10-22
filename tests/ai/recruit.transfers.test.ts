// The AI's recruitment step, transfers (docs/08-ai.md priority 2; Phase 7 design "2. Recruitment
// and transfers"): leaders in the capital take the garrison above the reserve from day 0, a mage's
// or the pretender's summons go to the garrison holder, the pretender keeps its monthly summons up
// to the summon's cap, and shareOut splits whole squads by largest remainder.
import { describe, expect, it } from 'vitest';
import { AI } from '../../src/content/ai';
import { CHASSIS } from '../../src/content/pretenders/chassis';
import { shareOut } from '../../src/ai/recruit';
import { createCommander, createSquad } from '../../src/sim/commanders';
import type { ProvinceId } from '../../src/sim/ids';
import type { CommanderState, GameState } from '../../src/sim/types';
import { annex, commandersIn, makePretender, move, neighbors, redField } from '../sim/fixtures';
import { applyAll, holderOf, ofType, planned } from './recruitFixtures';

function unitIn(state: GameState, province: ProvinceId, unit: string): CommanderState {
  const found = commandersIn(state, province).find((c) => c.unit === unit);
  if (!found) throw new Error(`no ${unit} in ${province}`);
  return found;
}

describe('transfers', () => {
  it('give leaders in the capital the garrison above the reserve, from day 0', () => {
    const { state, red, capital, army } = redField();
    const holder = holderOf(state, capital);
    holder.squads.push(createSquad(state, 'ashMilitia', 30), createSquad(state, 'flameArcher', 15));
    const fresh = createCommander(state, 'ashChieftain', red, capital);
    expect(state.day).toBe(0);
    let plan = planned(state, red);
    // 25 above the reserve, shared 30:15; the leader leading most takes them first.
    const [militia, archers] = holder.squads;
    expect(ofType(plan, 'transferSquad')).toEqual([
      {
        type: 'transferSquad',
        nation: red,
        from: holder.id,
        to: army.id,
        squad: militia!.id,
        count: 17,
      },
      {
        type: 'transferSquad',
        nation: red,
        from: holder.id,
        to: army.id,
        squad: archers!.id,
        count: 8,
      },
    ]);
    applyAll(state, plan);
    expect(holder.squads.reduce((n, s) => n + s.count, 0)).toBe(AI.capitalGarrison);
    expect(fresh.squads).toEqual([]);
    expect(planned(state, red).out).toEqual([]);
    // Up to each leader's leadership, then the next leader.
    holder.squads[0]!.count += 70;
    plan = planned(state, red);
    const given = (to: CommanderState) =>
      ofType(plan, 'transferSquad')
        .filter((c) => c.to === to.id)
        .reduce((n, c) => n + (c.count ?? 0), 0);
    expect(given(army)).toBe(80 - 55);
    expect(given(fresh)).toBe(70 - 25);
  });

  it('skip leaders on the move, the pretender, and summoned commanders', () => {
    const { state, red, capital, army } = redField();
    const holder = holderOf(state, capital);
    holder.squads.push(createSquad(state, 'ashMilitia', 60));
    const next = annex(state, red, neighbors(state, capital)[0]!).id;
    expect(move(state, red, [army], [next])).toEqual({ ok: true });
    const titan = createCommander(state, 'titan', red, capital);
    makePretender(state, red, titan);
    createCommander(state, 'salamander', red, capital);
    expect(ofType(planned(state, red), 'transferSquad')).toEqual([]);
  });

  it("hand a mage's or the pretender's summons to the garrison, then on to leaders", () => {
    const { state, red, capital, army } = redField();
    const holder = holderOf(state, capital);
    holder.squads.push(createSquad(state, 'ashMilitia', AI.capitalGarrison));
    const adept = unitIn(state, capital, 'emberAdept');
    adept.squads.push(createSquad(state, 'fireSprite', 5));
    const sprites = adept.squads[0]!;
    const plan = planned(state, red);
    const transfers = ofType(plan, 'transferSquad');
    expect(transfers[0]).toEqual({
      type: 'transferSquad',
      nation: red,
      from: adept.id,
      to: holder.id,
      squad: sprites.id,
    });
    expect(transfers.slice(1).every((c) => c.from === holder.id && c.to === army.id)).toBe(true);
    expect(transfers.slice(1).reduce((n, c) => n + (c.count ?? 0), 0)).toBe(5);
    applyAll(state, plan);
    expect(adept.squads).toEqual([]);
    // Away from a fort, a mage keeps what it leads.
    const away = annex(state, red, neighbors(state, capital)[0]!).id;
    adept.location = away;
    adept.squads.push(createSquad(state, 'fireSprite', 5));
    expect(ofType(planned(state, red), 'transferSquad')).toEqual([]);
    // A Living Monolith pretender, which summons and never moves, hands its summons on too.
    const monolith = createCommander(state, 'livingMonolith', red, capital);
    makePretender(state, red, monolith);
    monolith.squads.push(createSquad(state, 'fireSprite', 8));
    expect(ofType(planned(state, red), 'transferSquad')[0]).toEqual({
      type: 'transferSquad',
      nation: red,
      from: monolith.id,
      to: holder.id,
      squad: monolith.squads[0]!.id,
    });
  });

  it('let the pretender keep its monthly summons, bound to it, and hand on the rest', () => {
    const { state, red, capital } = redField();
    const holder = holderOf(state, capital);
    holder.squads.push(createSquad(state, 'ashMilitia', AI.capitalGarrison));
    // The Cinder Idol's sprites stay with it; a squad of another unit would not.
    const idol = createCommander(state, 'cinderIdol', red, capital);
    makePretender(state, red, idol);
    idol.squads.push(createSquad(state, 'fireSprite', 6));
    idol.squads.push(createSquad(state, 'wolf', 4));
    const handed = ofType(planned(state, red), 'transferSquad').filter((c) => c.from === idol.id);
    expect(handed).toEqual([
      {
        type: 'transferSquad',
        nation: red,
        from: idol.id,
        to: holder.id,
        squad: idol.squads[1]!.id,
      },
    ]);
    // A mage keeps nothing, sprites included.
    const adept = unitIn(state, capital, 'emberAdept');
    adept.squads.push(createSquad(state, 'fireSprite', 5));
    const fromAdept = ofType(planned(state, red), 'transferSquad').filter(
      (c) => c.from === adept.id,
    );
    expect(fromAdept).toHaveLength(1);
  });

  it('let the Mother of Beasts keep her wolves and hand on the rest', () => {
    const { state, red, capital } = redField();
    const holder = holderOf(state, capital);
    holder.squads.push(createSquad(state, 'ashMilitia', AI.capitalGarrison));
    const mother = createCommander(state, 'motherOfBeasts', red, capital);
    makePretender(state, red, mother);
    mother.squads.push(createSquad(state, 'wolf', 6));
    mother.squads.push(createSquad(state, 'fireSprite', 4));
    const plan = planned(state, red);
    const handed = ofType(plan, 'transferSquad').filter((c) => c.from === mother.id);
    expect(handed).toEqual([
      {
        type: 'transferSquad',
        nation: red,
        from: mother.id,
        to: holder.id,
        squad: mother.squads[1]!.id,
      },
    ]);
    applyAll(state, plan);
    expect(mother.squads.map((s) => [s.unit, s.count])).toEqual([['wolf', 6]]);
  });

  it('hand on what the pretender holds of its summoned unit above the summon’s cap', () => {
    const { state, red, capital } = redField();
    const holder = holderOf(state, capital);
    holder.squads.push(createSquad(state, 'ashMilitia', AI.capitalGarrison));
    const idol = createCommander(state, 'cinderIdol', red, capital);
    makePretender(state, red, idol);
    // 35 sprites, its monthly ones and those its own Call Fire Sprites rituals brought: it keeps
    // the cap of 20 and splits off 15 for the garrison, and so for the armies.
    const cap = CHASSIS.cinderIdol.monthlySummon.cap;
    expect(cap).toBe(20);
    idol.squads.push(createSquad(state, 'fireSprite', 35));
    const sprites = idol.squads[0]!;
    const plan = planned(state, red);
    expect(ofType(plan, 'transferSquad').filter((c) => c.from === idol.id)).toEqual([
      {
        type: 'transferSquad',
        nation: red,
        from: idol.id,
        to: holder.id,
        squad: sprites.id,
        count: 15,
      },
    ]);
    applyAll(state, plan);
    expect(idol.squads.map((s) => [s.unit, s.count])).toEqual([['fireSprite', cap]]);
    // At the cap, or below it, nothing is handed on.
    expect(ofType(planned(state, red), 'transferSquad').filter((c) => c.from === idol.id)).toEqual(
      [],
    );
  });
});

describe('shareOut', () => {
  it('splits by largest remainder into whole shares that add up', () => {
    expect(shareOut(25, [30, 15])).toEqual([17, 8]);
    expect(shareOut(5, [20, 5])).toEqual([4, 1]);
    expect(shareOut(3, [1, 1, 1, 1])).toEqual([1, 1, 1, 0]);
    expect(shareOut(10, [4, 2])).toEqual([4, 2]);
    expect(shareOut(0, [4, 2])).toEqual([0, 0]);
    expect(shareOut(5, [])).toEqual([]);
  });
});
