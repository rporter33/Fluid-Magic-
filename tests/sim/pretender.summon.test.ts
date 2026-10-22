// N7, the monthly summon (docs/05-pretender.md decisions, "Monthly summons"; the 2026-10-21
// pretender build spec, A.5): on the first day of each month a pretender whose chassis summons
// gains its troops while it stands in its own dominion, bounded by the nation's cap and its free
// leadership. The Mother of Beasts gains 2 Wolves (cap 24), the Cinder Idol 2 Fire Sprites (cap 20).
import { describe, expect, it } from 'vitest';
import { unitDef } from '../../src/content';
import { SPELLS } from '../../src/content/spells';
import { TIME } from '../../src/content/rules';
import { buildBattle } from '../../src/sim/battle/setup';
import { AWAKENING } from '../../src/content/pretenders/costs';
import {
  commanderSupply,
  createCommander,
  createSquad,
  isGarrisonHolder,
} from '../../src/sim/commanders';
import { stateHash } from '../../src/sim/hash';
import type { NationId } from '../../src/sim/ids';
import { monthlySummons, nationStock, settlePretender } from '../../src/sim/pretender';
import { applyRitualEffect } from '../../src/sim/ritualEffects';
import { advance } from '../../src/sim/tick';
import type { CommanderState, GameState } from '../../src/sim/types';
import { independentProvince, nationIds, pretender, runDays, twoNationGame } from './fixtures';

const MOTHER = pretender({
  chassis: 'motherOfBeasts',
  pips: { G: 4 },
  dominion: 5,
  awakening: 'awake',
});
const IDOL = pretender({ chassis: 'cinderIdol', pips: { R: 4 }, dominion: 4, awakening: 'awake' });

/** A game with the Mother of Beasts for Thornwood, on the first day of month 2. */
function motherGame(name?: string) {
  const state = twoNationGame(
    3,
    {},
    { pretender: MOTHER, ...(name ? { pretenderName: name } : {}) },
  );
  const green = nationIds(state)[1]!;
  const mother = god(state, green);
  state.day = TIME.daysPerMonth;
  // At strength 1, the least that counts as its dominion.
  state.provinces[mother.location]!.dominion = { nation: green, strength: 1 };
  return { state, green, mother };
}

function god(state: GameState, nation: NationId): CommanderState {
  return state.commanders[state.nations[nation]!.pretenderId!]!;
}

function wolves(c: CommanderState): number {
  return c.squads.filter((s) => s.unit === 'wolf').reduce((sum, s) => sum + s.count, 0);
}

describe('the monthly summon (N7)', () => {
  it('adds 2 Wolves to the Mother on day 30 at strength 1, with a message', () => {
    const { state, green, mother } = motherGame('Ysolde');
    const rng = { ...state.rng };
    monthlySummons(state);
    expect(mother.squads).toEqual([
      expect.objectContaining({ unit: 'wolf', count: 2, hp: 2 * unitDef('wolf').hp }),
    ]);
    // No rng is drawn: createSquad takes only an id.
    expect(state.rng).toEqual(rng);
    const last = state.messages.at(-1)!;
    expect([last.nation, last.kind, last.text, last.province]).toEqual([
      green,
      'info',
      '2 Wolves join Ysolde.',
      mother.location,
    ]);
  });

  it('joins the wolves to her one squad month after month', () => {
    const { state, mother } = motherGame();
    for (const day of [30, 60, 90]) {
      state.day = day;
      monthlySummons(state);
    }
    expect(mother.squads).toHaveLength(1);
    expect(wolves(mother)).toBe(6);
    expect(state.messages.at(-1)!.text).toBe('2 Wolves join Mother of Beasts.');
  });

  it('summons only on the first day of a month, never on day 0', () => {
    const { state, mother } = motherGame();
    for (const day of [0, 1, 29, 31, 59]) {
      state.day = day;
      monthlySummons(state);
    }
    expect(wolves(mother)).toBe(0);
    state.day = 60;
    monthlySummons(state);
    expect(wolves(mother)).toBe(2);
  });

  it('summons nothing in foreign, neutral, or zero-strength dominion', () => {
    const { state, mother } = motherGame();
    const red = nationIds(state)[0]!;
    const where = state.provinces[mother.location]!;
    for (const dominion of [
      { nation: red, strength: 5 },
      { nation: null, strength: 0 },
      { nation: mother.owner, strength: 0 },
    ]) {
      where.dominion = dominion;
      monthlySummons(state);
    }
    expect(wolves(mother)).toBe(0);
    // Wherever she stands, only that province's dominion counts.
    const wild = independentProvince(state);
    mother.location = wild.id;
    wild.dominion = { nation: mother.owner, strength: 3 };
    monthlySummons(state);
    expect(wolves(mother)).toBe(2);
  });

  it('summons nothing while she is in transit', () => {
    const { state, mother } = motherGame();
    const to = state.map.provinces[mother.location]!.neighbors[0]!;
    mother.transit = { from: mother.location, to, progress: 1, totalDays: 3 };
    monthlySummons(state);
    expect(wolves(mother)).toBe(0);
  });

  it('summons nothing while the nation is Godless, nor before the god arrives', () => {
    const { state, green, mother } = motherGame();
    state.nations[green]!.godless = true;
    settlePretender(state, green);
    expect(state.nations[green]!.pretenderId).toBeNull();
    monthlySummons(state);
    expect(nationStock(state, green, 'wolf')).toBe(0);
    expect(state.commanders[mother.id]).toBeUndefined();
    // A dormant Mother is not on the map yet in month 2.
    const asleep = twoNationGame(3, {}, { pretender: { ...MOTHER, awakening: 'dormant' } });
    asleep.day = TIME.daysPerMonth;
    monthlySummons(asleep);
    expect(nationStock(asleep, nationIds(asleep)[1]!, 'wolf')).toBe(0);
  });

  it('counts the nation’s whole stock against the cap: handed-off wolves and Call of the Wild', () => {
    const { state, green, mother } = motherGame();
    // 18 wolves she handed to a Warden Captain, 4 from Call of the Wild's ritual (6 joined its
    // caster, 2 died since): 22 of 24.
    const captain = createCommander(state, 'wardenCaptain', green, mother.location);
    captain.squads.push(createSquad(state, 'wolf', 18));
    const druid = createCommander(state, 'elderDruid', green, mother.location);
    const spell = SPELLS.callOfTheWild;
    const ctx = { nation: green, caster: druid, spell, province: mother.location };
    for (const e of spell.effects) applyRitualEffect(state, ctx, e);
    druid.squads[0]!.count -= 2;
    expect(nationStock(state, green, 'wolf')).toBe(22);
    monthlySummons(state);
    expect(wolves(mother)).toBe(2);
    // At the cap nothing more comes, and no message is posted.
    const messages = state.messages.length;
    state.day += TIME.daysPerMonth;
    monthlySummons(state);
    expect(wolves(mother)).toBe(2);
    expect(state.messages).toHaveLength(messages);
    // One short of the cap brings one, in the singular.
    druid.squads[0]!.count -= 1;
    state.day += TIME.daysPerMonth;
    monthlySummons(state);
    expect(wolves(mother)).toBe(3);
    expect(state.messages.at(-1)!.text).toBe('1 Wolf joins Mother of Beasts.');
    // Another nation's wolves never count.
    const red = nationIds(state)[0]!;
    expect(nationStock(state, red, 'wolf')).toBe(0);
  });

  it('counts wolves held by the capital’s garrison holder against the cap', () => {
    // The AI hands a mage's Call of the Wild wolves to the holder, so this is the usual stock.
    const { state, green, mother } = motherGame();
    const holder = state.commanders[state.provinces[mother.location]!.garrison!]!;
    expect(isGarrisonHolder(holder)).toBe(true);
    holder.squads.push(createSquad(state, 'wolf', 23));
    expect(nationStock(state, green, 'wolf')).toBe(23);
    monthlySummons(state);
    expect(wolves(mother)).toBe(1);
    holder.squads[holder.squads.length - 1]!.count = 24;
    state.day += TIME.daysPerMonth;
    monthlySummons(state);
    expect(wolves(mother)).toBe(1);
    expect(nationStock(state, green, 'wolf')).toBe(25);
  });

  it('never summons past her free leadership', () => {
    const { state, mother } = motherGame();
    const lead = unitDef('motherOfBeasts').commander!.leadership;
    mother.squads.push(createSquad(state, 'warden', lead - 1));
    monthlySummons(state);
    expect(wolves(mother)).toBe(1);
    monthlySummons(state);
    expect(wolves(mother)).toBe(1);
  });

  it('gives the Cinder Idol 2 Fire Sprites a month to its cap of 20; they eat no supply', () => {
    const state = twoNationGame(3, { pretender: IDOL });
    const red = nationIds(state)[0]!;
    const idol = god(state, red);
    const supply = commanderSupply(idol);
    for (let month = 1; month <= 12; month++) {
      state.day = month * TIME.daysPerMonth;
      monthlySummons(state);
    }
    expect(nationStock(state, red, 'fireSprite')).toBe(20);
    expect(idol.squads).toEqual([expect.objectContaining({ unit: 'fireSprite', count: 20 })]);
    // Constructs eat nothing; wolves eat 1 a day each.
    expect(commanderSupply(idol)).toBe(supply);
    const { state: wild, mother } = motherGame();
    const before = commanderSupply(mother);
    monthlySummons(wild);
    expect(commanderSupply(mother) - before).toBe(2);
  });

  it('binds the summoned wolves to the Mother in battle (N5), and only under her', () => {
    const { state, green, mother } = motherGame();
    monthlySummons(state);
    const at = mother.location;
    const none = { nation: null, commanders: [], garrison: null, pd: false };
    const led = buildBattle(state, at, none, {
      nation: green,
      commanders: [mother],
      garrison: null,
      pd: false,
    });
    expect(led.defender.squads.map((s) => [s.unit, s.bound])).toEqual([['wolf', true]]);
    const captain = createCommander(state, 'wardenCaptain', green, at);
    captain.squads = mother.squads;
    mother.squads = [];
    const other = buildBattle(state, at, none, {
      nation: green,
      commanders: [captain],
      garrison: null,
      pd: false,
    });
    expect(other.defender.squads.map((s) => [s.unit, s.bound])).toEqual([['wolf', undefined]]);
  });

  it('runs in tick step 3 after the pretenders settle: a dormant Mother summons on arrival', () => {
    // Her arrival day is a month's first day, so the summon must follow the settle in the tick.
    const state = twoNationGame(3, {}, { pretender: { ...MOTHER, awakening: 'dormant' } });
    const green = nationIds(state)[1]!;
    const arrival = AWAKENING.dormant.arrivalDay;
    expect([arrival > 0, arrival % TIME.daysPerMonth]).toEqual([true, 0]);
    while (state.day < arrival) advance(state);
    expect(state.nations[green]!.pretenderId).toBeNull();
    expect(nationStock(state, green, 'wolf')).toBe(0);
    advance(state);
    expect(state.nations[green]!.pretenderId).not.toBeNull();
    expect(wolves(god(state, green))).toBe(2);
    expect(nationStock(state, green, 'wolf')).toBe(2);
  });

  it('runs in tick step 3: day 30 brings the first wolves, deterministically over 365 days', () => {
    const play = () => {
      const state = twoNationGame(9, {}, { pretender: MOTHER });
      const green = nationIds(state)[1]!;
      const counts: number[] = [];
      while (state.day < 365) {
        advance(state);
        if (state.day % TIME.daysPerMonth === 1) counts.push(nationStock(state, green, 'wolf'));
      }
      return { counts, hash: stateHash(state) };
    };
    const first = play();
    // Nobody commands this game, so she stays at her capital and gains 2 each month to the cap.
    // Counted after the ticks of days 0, 30, 60, ...: none on day 0, then 2 a month to 24.
    expect(first.counts).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24]);
    expect(play()).toEqual(first);
  });

  it('leaves a game without a monthly summon exactly as it was', () => {
    const state = twoNationGame(9);
    const copy = twoNationGame(9);
    runDays(state, 60);
    runDays(copy, 60);
    monthlySummons(state);
    expect(stateHash(state)).toBe(stateHash(copy));
  });
});
