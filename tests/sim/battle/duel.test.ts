// The staged duels of the pretender build spec (A.10) and the AI power calibration (A.11), on the
// real bodies and rules of Phase 6b.3 (fixtures/duel.ts; `npm run sim:duel` prints the table).
// Each cell is pinned to a band of 15 points either side of its value measured over 400 seeds
// on 2026-10-22, so tuning may move a body a little but not change what it is; the spec's named
// targets are checked as it wrote them; and every chassis's aiPower must be what
// `npm run sim:duel -- --calibrate` writes.
import { describe, expect, it } from 'vitest';
import { unitDef } from '../../../src/content';
import { CHASSIS, type ChassisId } from '../../../src/content/pretenders/chassis';
import { buildBattle } from '../../../src/sim/battle/setup';
import { nationIds, pretender, twoNationGame } from '../fixtures';
import {
  aiPowerOf,
  beatsLightInfantry,
  DUEL_FOES,
  DUEL_ROWS,
  duelCell,
  duelFoe,
  duelRow,
  LIGHT_INFANTRY_TERM,
} from './fixtures/duel';

const SEEDS = 400;

/** Win percentages measured over seeds 0 to 399, in DUEL_FOES order. */
const MEASURED: Record<string, readonly number[]> = {
  oracle: [0, 0, 0, 0, 0],
  titan: [40, 2, 0, 11, 0],
  greatWyrm: [100, 100, 75, 100, 5],
  livingMonolith: [100, 100, 100, 100, 31],
  ascendedHero: [15, 0, 0, 3, 0],
  primordial: [100, 100, 73, 100, 14],
  ashColossus: [92, 60, 2, 68, 0],
  ashPhoenix: [56, 12, 3, 27, 0],
  pyreLord: [65, 22, 18, 43, 5],
  cinderIdol: [100, 100, 51, 100, 0],
  emberHierophant: [0, 0, 0, 0, 0],
  wildSpirit: [1, 0, 0, 0, 0],
  worldTree: [100, 100, 100, 100, 100],
  hornedHunter: [78, 49, 18, 56, 5],
  elderWyrm: [100, 100, 56, 100, 14],
  motherOfBeasts: [8, 0, 0, 1, 0],
  heroAvatar: [16, 0, 0, 3, 0],
  mother6: [60, 29, 2, 34, 2],
  mother12: [92, 72, 16, 72, 6],
  mother24: [98, 89, 66, 90, 38],
  mother12Led: [32, 14, 7, 17, 2],
  titanWarriors: [65, 43, 53, 57, 21],
  heroWarriors: [42, 19, 23, 57, 9],
  titanWardens: [96, 82, 75, 87, 38],
  motherPackWardens: [100, 95, 81, 99, 52],
};

/** How far a cell may move from its measured value, in points. */
const BAND = 15;

const cache = new Map<string, number>();

/** A cell's win percentage over the pinned seeds, computed once per test file. */
function win(row: string, foe: string): number {
  const key = `${row} ${foe}`;
  let value = cache.get(key);
  if (value === undefined) {
    value = 100 * duelCell(duelRow(row), duelFoe(foe), SEEDS).win;
    cache.set(key, value);
  }
  return value;
}

describe('the A.10 duels', () => {
  it('pin every row of the table, and only those', () => {
    expect(Object.keys(MEASURED)).toEqual(DUEL_ROWS.map((r) => r.id));
    // Every chassis body has its own row.
    expect(DUEL_ROWS.slice(0, Object.keys(CHASSIS).length).map((r) => r.id)).toEqual(
      Object.keys(CHASSIS),
    );
  });

  it.each(DUEL_ROWS.map((r) => r.id))(
    '%s stays within 15 points of its measured cells',
    (id) => {
      const cells = DUEL_FOES.map((f) => win(id, f.id));
      MEASURED[id]!.forEach((measured, i) => {
        const foe = DUEL_FOES[i]!.id;
        expect(cells[i], `${id} against ${foe}`).toBeGreaterThanOrEqual(measured - BAND);
        expect(cells[i], `${id} against ${foe}`).toBeLessThanOrEqual(measured + BAND);
      });
    },
    120_000,
  );

  it('meet the build spec’s named targets', () => {
    const between = (row: string, foe: string, lo: number, hi: number) => {
      expect(win(row, foe), `${row} against ${foe}`).toBeGreaterThanOrEqual(lo);
      expect(win(row, foe), `${row} against ${foe}`).toBeLessThanOrEqual(hi);
    };
    between('greatWyrm', 'hills', 60, 90);
    between('primordial', 'hills', 58, 88);
    between('primordial', 'mountain', 0, 32);
    between('elderWyrm', 'hills', 42, 72);
    between('mother12', 'plains', 57, 87);
    between('hornedHunter', 'plains', 32, 62);
    between('ashPhoenix', 'weakPlains', 41, 71);
    // In no fixture is the Primordial more than 15 points ahead of the Great Wyrm.
    for (const f of DUEL_FOES) {
      expect(win('primordial', f.id) - win('greatWyrm', f.id), f.id).toBeLessThanOrEqual(15);
    }
  }, 120_000);

  it('show what binding is worth: the Mother wins far more with bound wolves than led ones', () => {
    for (const f of DUEL_FOES.slice(0, 4)) {
      expect(win('mother12', f.id) - win('mother12Led', f.id), f.id).toBeGreaterThan(5);
    }
  }, 120_000);
});

describe('the Avatar rows', () => {
  it('give the Hero exactly the stats the sim gives an Ascended Hero R4 in its own dominion', () => {
    // The real Avatar rule (docs/05 Step 7, built into the Ascended Hero): an R4 god blessed
    // with Ember Wrath at home. The duel rows stage the same stats by hand, so they must agree.
    const hero = pretender({
      chassis: 'ascendedHero',
      pips: { R: 4 },
      dominion: 1,
      awakening: 'awake',
    });
    const state = twoNationGame(1, { pretender: hero });
    const nation = nationIds(state)[0]!;
    const god = state.commanders[state.nations[nation]!.pretenderId!]!;
    const none = { nation: null, commanders: [], garrison: null, pd: false };
    const own = { nation, commanders: [god], garrison: null, pd: false };
    const blessed = buildBattle(state, god.location, none, own).defender.commanders[0]!.stats;
    const body = unitDef('ascendedHero');
    expect([blessed.att, blessed.str]).toEqual([body.att + 2, body.str + 2]);
    for (const id of ['heroAvatar', 'heroWarriors']) {
      expect(duelRow(id).make().commanders[0]!.stats, id).toEqual(blessed);
    }
    // The bare body's row carries no bless.
    expect(duelRow('ascendedHero').make().commanders[0]!.stats).toMatchObject({
      att: body.att,
      str: body.str,
    });
  });
});

describe('the A.11 AI power calibration', () => {
  it('uses the Light Infantry troop term of docs/08, 7.25', () => {
    expect(LIGHT_INFANTRY_TERM).toBe(7.25);
    expect(aiPowerOf(13)).toBe(94);
  });

  it.each(Object.keys(CHASSIS) as ChassisId[])(
    '%s has the aiPower `sim:duel --calibrate` writes',
    (id) => {
      // aiPower is n Light Infantry times the term, where the body beats n in at least half
      // of 200 seeds and n + 1 in fewer, as the calibration's search leaves it.
      const n = Math.round(CHASSIS[id].aiPower / LIGHT_INFANTRY_TERM);
      expect(aiPowerOf(n), id).toBe(CHASSIS[id].aiPower);
      if (n > 0) expect(beatsLightInfantry(id, n), id).toBeGreaterThanOrEqual(0.5);
      expect(beatsLightInfantry(id, n + 1), id).toBeLessThan(0.5);
    },
    120_000,
  );
});
