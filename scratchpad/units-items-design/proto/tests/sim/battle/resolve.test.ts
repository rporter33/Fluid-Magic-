// The battle resolver (docs/04-battle.md), including its "Required tests". Script slots and
// commander deaths are in resolve.scripts.test.ts.
import { describe, expect, it } from 'vitest';
import { SPELLS } from '../../../src/content/spells';
import type { BattleSpellDef } from '../../../src/content/spells/types';
import { weaponDamage } from '../../../src/sim/battle/attacks';
import { resolveBattle } from '../../../src/sim/battle/resolve';
import { drn } from '../../../src/sim/drn';
import { cloneRng, createRng } from '../../../src/sim/rng';
import {
  attackerWinRate,
  byRound,
  commander,
  fightOnce,
  IMMORTAL,
  setup,
  side,
  squad,
} from './fixtures';

describe('required tests (docs/04-battle.md)', () => {
  it('is deterministic: same setup and seed, same result and log', () => {
    const make = () =>
      setup(
        side([squad('a0', 'cinderWarrior', 20), squad('a1', 'flameArcher', 10)]),
        side([squad('d0', 'warden', 20), squad('d1', 'longbowHunter', 10)]),
      );
    const a = resolveBattle(make(), createRng(5));
    const b = resolveBattle(make(), createRng(5));
    expect(b).toEqual(a);
    expect(resolveBattle(make(), createRng(6)).replay).not.toEqual(a.replay);
  });

  it('never changes its setup: one setup object fought twice gives the same battle', () => {
    const once = setup(
      side(
        [squad('a0', 'cinderWarrior', 20, { leader: 'ac' }), squad('a1', 'flameArcher', 10)],
        [commander('ac', 'ashChieftain', { script: [{ kind: 'attack' }] })],
      ),
      side([squad('d0', 'ashRider', 10, { hp: 80 }), squad('d1', 'longbowHunter', 10)]),
    );
    const copy = structuredClone(once);
    const a = resolveBattle(once, createRng(9));
    expect(once).toEqual(copy);
    expect(resolveBattle(once, createRng(9))).toEqual(a);
  });

  it('20 Cinder Warriors beat 10 Ash Militia in at least 95% of 200 seeds', () => {
    const rate = attackerWinRate(
      () => [side([squad('a', 'cinderWarrior', 20)]), side([squad('d', 'ashMilitia', 10)])],
      200,
    );
    expect(rate).toBeGreaterThanOrEqual(0.95);
  });

  it('equal armies on Plains: attacker wins 35% to 65% of 500 seeds', () => {
    const army = (tag: string) =>
      side(
        [
          squad(`${tag}w`, 'cinderWarrior', 20, { leader: `${tag}c` }),
          squad(`${tag}a`, 'flameArcher', 10, { leader: `${tag}c` }),
        ],
        [commander(`${tag}c`, 'ashChieftain')],
      );
    const rate = attackerWinRate(() => [army('a'), army('d')], 500);
    expect(rate).toBeGreaterThanOrEqual(0.35);
    expect(rate).toBeLessThanOrEqual(0.65);
  });

  it('archers with 3 free volleys kill at least 2 of 20 militia on average', () => {
    // Infantry holds the front, so the archers behind keep shooting in rounds 1 to 3.
    let kills = 0;
    const seeds = 200;
    for (let s = 0; s < seeds; s++) {
      const result = fightOnce(
        side([squad('w', 'cinderWarrior', 10), squad('a', 'flameArcher', 10)]),
        side([squad('m', 'ashMilitia', 20)]),
        s,
      );
      for (const { round, event } of byRound(result)) {
        if (event.kind === 'volley' && event.squad === 'a' && round <= 3) kills += event.kills;
      }
    }
    expect(kills / seeds).toBeGreaterThanOrEqual(2);
  });

  it('the attacker retreats at round 50 when nothing can die', () => {
    const result = fightOnce(
      side([squad('a', 'ashMilitia', 1, { stats: IMMORTAL })]),
      side([squad('d', 'ashMilitia', 1, { stats: IMMORTAL })]),
    );
    expect(result.rounds).toBe(50);
    expect(result.winner).toBe('defender');
    expect(result.squads.get('a')).toEqual({ count: 1, hp: 50, routed: true });
    expect(result.squads.get('d')).toEqual({ count: 1, hp: 50, routed: false });
    expect(result.replay.at(-1)).toEqual({ kind: 'battleEnd', winner: 'defender', rounds: 50 });
  });
});

describe('closing and reach', () => {
  /** The first round a squad strikes in melee. */
  function firstMelee(unit: 'ashRider' | 'cinderWarrior' | 'warden' | 'fireSprite'): number {
    const result = fightOnce(
      side([squad('a', unit, 5, { stats: { prot: 99, mor: 50 } })]),
      // Archers that never hit and never close, so only the attacker's own speed counts.
      side([squad('d', 'longbowHunter', 5, { stats: { prec: 0, prot: 99, mor: 50 } })]),
    );
    const first = byRound(result).find(
      ({ event }) => event.kind === 'melee' && event.squad === 'a',
    );
    return first?.round ?? -1;
  }

  it('starts melee in round 2 at speed 3 or flying, 3 at speed 2, 4 at speed 1', () => {
    expect(firstMelee('ashRider')).toBe(2);
    expect(firstMelee('fireSprite')).toBe(2);
    expect(firstMelee('cinderWarrior')).toBe(3);
    expect(firstMelee('warden')).toBe(4);
  });

  it('reaches the rear only with range 5 or more', () => {
    const target = () => side([squad('d', 'ashMilitia', 10, { row: 'rear', stats: IMMORTAL })]);
    const shots = (unit: 'flameArcher' | 'archer' | 'emberSkirmisher') =>
      fightOnce(
        side([squad('a', unit, 10, { row: 'rear', stats: { mor: 50 } })]),
        target(),
      ).replay.filter((e) => e.kind === 'volley').length;
    expect(shots('flameArcher')).toBeGreaterThan(0);
    // The independents' Shortbow has range 5 exactly.
    expect(shots('archer')).toBeGreaterThan(0);
    // Javelins reach 3: the rear row is out of reach.
    expect(shots('emberSkirmisher')).toBe(0);
  });

  it('closes when its missiles cannot reach the enemy front, though it has some left', () => {
    // Javelins (range 3) against a front in the rear row: the skirmishers charge in round 2.
    const result = fightOnce(
      side([squad('a', 'emberSkirmisher', 20, { row: 'front', stats: { mor: 50 } })]),
      side([squad('d', 'longbowHunter', 10, { row: 'rear', stats: IMMORTAL })]),
    );
    const first = byRound(result).find(
      ({ event }) => event.kind === 'melee' && event.squad === 'a',
    );
    expect(first?.round).toBe(2);
    // Two skirmisher lines in their rear rows fight it out instead of waiting for round 50.
    const standoff = fightOnce(
      side([squad('a', 'emberSkirmisher', 10, { row: 'rear' })]),
      side([squad('d', 'emberSkirmisher', 10, { row: 'rear' })]),
    );
    expect(standoff.replay.some((e) => e.kind === 'melee')).toBe(true);
    expect(standoff.rounds).toBeLessThan(50);
  });

  it('stops shooting once in melee contact, and uses ammunition', () => {
    const result = fightOnce(
      side([squad('a', 'flameArcher', 5, { row: 'front', stats: IMMORTAL })]),
      side([squad('d', 'ashMilitia', 5, { stats: IMMORTAL })]),
    );
    const volleys = byRound(result).filter(({ event }) => event.kind === 'volley');
    // Flame Archers are speed 2: they shoot in rounds 1 and 2, then fight hand to hand.
    expect([...new Set(volleys.map((v) => v.round))]).toEqual([1, 2]);
    // Facing archers that never close, Flame Archers (ammo 10) shoot ten volleys, then charge.
    const longer = fightOnce(
      side([squad('a', 'flameArcher', 5, { row: 'rear', stats: IMMORTAL })]),
      side([squad('d', 'longbowHunter', 5, { row: 'rear', stats: { ...IMMORTAL, prec: 0 } })]),
    );
    const attackerVolleys = byRound(longer).filter(
      ({ event }) => event.kind === 'volley' && event.squad === 'a',
    );
    expect(attackerVolleys.map((v) => v.round)).toEqual(
      Array.from({ length: 10 }, (_, i) => i + 1),
    );
    expect(byRound(longer).some(({ round, event }) => event.kind === 'melee' && round === 11)).toBe(
      true,
    );
  });
});

describe('damage', () => {
  const sword = { name: 'Sword', dmg: 4 };
  it('is str + weapon + DRN - prot - DRN, at least 0; piercing halves prot, negating ignores it', () => {
    const rng = createRng(3);
    for (const [w, armor] of [
      [sword, 7],
      [{ ...sword, armorPiercing: true }, 3],
      [{ ...sword, armorNegating: true }, 0],
    ] as const) {
      for (let i = 0; i < 50; i++) {
        const copy = cloneRng(rng);
        const expected = Math.max(0, 11 + 4 + drn(copy) - armor - drn(copy));
        expect(weaponDamage(rng, 11, w, 7, 0)).toBe(expected);
      }
    }
    const bonus = cloneRng(rng);
    const expected = Math.max(0, 11 + 4 + 3 + drn(bonus) - 7 - drn(bonus));
    expect(weaponDamage(rng, 11, sword, 7, 3)).toBe(expected);
  });

  it('gives the field to the defender when two lone commanders kill each other', () => {
    const deadly = { att: 100, def: -100, str: 100, hp: 1 };
    const result = fightOnce(
      side([], [commander('a', 'ashChieftain', { stats: deadly })]),
      side([], [commander('d', 'wardenCaptain', { stats: deadly })]),
    );
    expect(result.commanders.get('a')?.dead).toBe(true);
    expect(result.commanders.get('d')?.dead).toBe(true);
    expect(result.winner).toBe('defender');
  });

  it('lands simultaneously: two who strike each other dead both fall', () => {
    const deadly = { att: 99, def: 0, str: 99, prot: 0, hp: 1, mor: 50, mapSpeed: 3 };
    const result = fightOnce(
      side([squad('a', 'cinderWarrior', 1, { stats: deadly })]),
      side([squad('d', 'cinderWarrior', 1, { stats: deadly })]),
    );
    expect(result.squads.get('a')?.count).toBe(0);
    expect(result.squads.get('d')?.count).toBe(0);
    expect(result.casualties).toBe(2);
    expect(result.winner).toBe('defender');
  });

  it('splits a wounded squad evenly and writes back the survivors', () => {
    const result = fightOnce(
      side([squad('a', 'cinderWarrior', 4, { hp: 22, stats: IMMORTAL })]),
      side([squad('d', 'ashMilitia', 1, { stats: { mor: 50, weapons: [] } })]),
    );
    expect(result.squads.get('a')).toEqual({ count: 4, hp: 22, routed: false });
    expect(result.winner).toBe('attacker');
  });
});

describe('ranged damage', () => {
  it('leaves out the shooter’s strength', () => {
    const volleys = (str: number) =>
      fightOnce(
        side([
          squad('w', 'cinderWarrior', 10, { stats: IMMORTAL }),
          squad('a', 'flameArcher', 10, { stats: { str } }),
        ]),
        side([squad('m', 'ashMilitia', 20, { stats: { mapSpeed: 1, mor: 50 } })]),
        7,
      ).replay.filter((e) => e.kind === 'volley');
    expect(volleys(30)).toEqual(volleys(0));
  });
});

describe('lances', () => {
  it('hit harder in the rider’s first melee round only', () => {
    let first = 0;
    let firstHits = 0;
    let later = 0;
    let laterHits = 0;
    for (let seed = 0; seed < 100; seed++) {
      const result = fightOnce(
        side([squad('r', 'ashRider', 10, { stats: { mor: 50 } })]),
        side(
          [],
          [
            commander('c', 'ashChieftain', {
              hp: 1e6,
              stats: { hp: 1e6, prot: 0, mor: 50, def: 0 },
            }),
          ],
        ),
        seed,
      );
      for (const { round, event } of byRound(result)) {
        if (event.kind !== 'damage' || event.target !== 'c') continue;
        if (round === 2) {
          first += event.amount;
          firstHits += 1;
        } else if (round === 3) {
          later += event.amount;
          laterHits += 1;
        }
      }
    }
    // The lance's +3 lands on one of the rider's two weapons: about 1.5 a hit.
    expect(first / firstHits - later / laterHits).toBeGreaterThan(1);
  });
});

describe('the log and the result', () => {
  it('starts every round, ends with battleEnd, and carries the roster', () => {
    const result = fightOnce(
      side([squad('a', 'cinderWarrior', 20)], [commander('c', 'ashChieftain')]),
      side([squad('d', 'ashMilitia', 10)]),
    );
    const starts = result.replay.flatMap((e) => (e.kind === 'roundStart' ? [e.round] : []));
    expect(starts).toEqual(Array.from({ length: result.rounds }, (_, i) => i + 1));
    expect(result.replay.at(-1)).toEqual({
      kind: 'battleEnd',
      winner: result.winner,
      rounds: result.rounds,
    });
    expect(result.roster.attacker.squads).toEqual([
      { ref: 'a', commander: null, unit: 'cinderWarrior', count: 20, hp: 220, row: 'front' },
    ]);
    expect(result.roster.attacker.commanders).toEqual([
      { ref: 'c', unit: 'ashChieftain', name: 'Ash Chieftain', row: 'rear', hp: 14 },
    ]);
    const kills = result.replay.reduce(
      (n, e) => n + (e.kind === 'melee' || e.kind === 'volley' ? e.kills : 0),
      0,
    );
    expect(kills).toBe(result.casualties);
  });

  it('heals regenerating units at the end of each round', () => {
    const result = fightOnce(
      side([
        squad('a', 'cinderWarrior', 5, {
          hp: 25,
          stats: { ...IMMORTAL, hp: 10, regeneration: 0.1 },
        }),
      ]),
      side([squad('d', 'ashMilitia', 1, { stats: IMMORTAL })]),
    );
    expect(result.replay.some((e) => e.kind === 'heal' && e.target === 'a')).toBe(true);
    expect(result.squads.get('a')?.hp).toBe(50);
  });

  it('resolves 300 against 300 in well under 50 ms', () => {
    const big = () =>
      setup(
        side([squad('a0', 'cinderWarrior', 200), squad('a1', 'flameArcher', 100)]),
        side([squad('d0', 'warden', 200), squad('d1', 'longbowHunter', 100)]),
      );
    resolveBattle(big(), createRng(1));
    const start = performance.now();
    for (let i = 0; i < 5; i++) resolveBattle(big(), createRng(i));
    expect((performance.now() - start) / 5).toBeLessThan(50);
  });

  it('stays well under 50 ms with four mages casting on each side', () => {
    const mages = (prefix: string, spells: BattleSpellDef[]) =>
      Array.from({ length: 4 }, (_, i) =>
        commander(`${prefix}${String(i)}`, 'cinderMagus', {
          spells,
          pips: { R: 3, G: 3 },
          carriedMana: { R: 2, G: 2 },
          script: Array.from({ length: 5 }, () => ({ kind: 'cast' as const, spellId: null })),
        }),
      );
    const big = () =>
      setup(
        side(
          [squad('a0', 'cinderWarrior', 200), squad('a1', 'flameArcher', 100)],
          mages('am', [SPELLS.emberDart, SPELLS.fireball, SPELLS.warcry, SPELLS.pyreStorm]),
        ),
        side(
          [squad('d0', 'warden', 200), squad('d1', 'longbowHunter', 100)],
          mages('dm', [SPELLS.thornSpray, SPELLS.barkSkin, SPELLS.swarm, SPELLS.regrowth]),
        ),
      );
    resolveBattle(big(), createRng(1));
    const start = performance.now();
    for (let i = 0; i < 5; i++) resolveBattle(big(), createRng(i));
    expect((performance.now() - start) / 5).toBeLessThan(50);
  });
});
