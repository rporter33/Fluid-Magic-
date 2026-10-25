// Ranged fire and melee phases on a staged field (docs/04-battle.md round steps 2 and 3), and
// the Ash Colossus's fire shield (docs/05-pretender.md, "Fire shield"; docs/09-balance.md).
import { describe, expect, it } from 'vitest';
import { CASTING } from '../../../src/content/rules';
import { meleePhase, rangedPhase } from '../../../src/sim/battle/attacks';
import type { BattleEvent } from '../../../src/sim/battle/events';
import { buildField, type Field, type Group } from '../../../src/sim/battle/field';
import { foldReplay } from '../../../src/sim/battle/replay';
import type { BattleSquadSetup, CombatStats } from '../../../src/sim/battle/types';
import { drn } from '../../../src/sim/drn';
import { cloneRng, createRng, randBelow } from '../../../src/sim/rng';
import { commander, fightOnce, setup, side, squad } from './fixtures';

describe('routing units', () => {
  it('neither swing nor shoot in their exit round', () => {
    const field = buildField(
      setup(
        side([squad('w', 'ashRider', 10)]),
        side([
          squad('r', 'ashMilitia', 10, { row: 'front' }),
          squad('s', 'ashMilitia', 10, { row: 'front' }),
          squad('ra', 'flameArcher', 10, { row: 'middle' }),
        ]),
      ),
    );
    const [r, , ra] = field.sides.defender as [Group, Group, Group];
    r.routingSince = 1;
    ra.routingSince = 1;
    const log: BattleEvent[] = [];
    rangedPhase(field, 2, createRng(1), log);
    meleePhase(field, 2, createRng(1), log);
    expect(log.some((e) => (e.kind === 'melee' || e.kind === 'volley') && e.squad === 'r')).toBe(
      false,
    );
    expect(log.some((e) => e.kind === 'volley' && e.squad === 'ra')).toBe(false);
    expect(ra.ammo).toEqual([10]);
    expect(log.some((e) => e.kind === 'melee' && e.squad === 's')).toBe(true);
  });
});

describe('a ranged shot', () => {
  it('hits exactly when prec + DRN >= 10 + DRN (a tie hits)', () => {
    for (let seed = 0; seed < 300; seed++) {
      const field = buildField(
        setup(
          side([squad('a', 'flameArcher', 1, { stats: { prec: 10 } })]),
          side([squad('d', 'ashMilitia', 1)]),
        ),
      );
      const rng = createRng(seed);
      const replay = cloneRng(rng);
      randBelow(replay, 1);
      const hit = 10 + drn(replay) >= 10 + drn(replay);
      const log: BattleEvent[] = [];
      rangedPhase(field, 1, rng, log);
      const volley = log.find((e) => e.kind === 'volley');
      expect(volley?.kind === 'volley' && volley.hits, `seed ${String(seed)}`).toBe(hit ? 1 : 0);
    }
  });
});

/** Exhausts a group, so it neither swings nor shoots (but can still be struck). */
function tooTired(g: Group): Group {
  g.fatigue = CASTING.exhaustedAt;
  return g;
}

/**
 * Strikers against an Ash Colossus alone in the defenders' front, with HP to spare and too
 * tired to strike back, so every change to the strikers comes from its shield.
 */
function colossusField(strikers: BattleSquadSetup[], stats: Partial<CombatStats> = {}) {
  const field = buildField(
    setup(
      side(strikers),
      side([], [commander('c', 'ashColossus', { row: 'front', stats: { hp: 1000, ...stats } })]),
    ),
  );
  const colossus = tooTired(field.sides.defender[0]!);
  return { field, colossus, strikers: field.sides.attacker[0]! };
}

/** One melee phase in round 3, when map-speed-2 infantry has closed. */
function melee(field: Field, seed = 1): BattleEvent[] {
  const log: BattleEvent[] = [];
  meleePhase(field, 3, createRng(seed), log);
  return log;
}

/** Damage events on a unit: blows (physical) or burns (fire). */
function damageTo(log: BattleEvent[], ref: string, element: 'physical' | 'fire') {
  return log.filter((e) => e.kind === 'damage' && e.target === ref && e.element === element);
}

describe('the fire shield', () => {
  it('burns each striker 5 per melee hit that deals damage, through any armor, after the phase', () => {
    // Plain warriors on the Colossus: some miss, some hit for 0 against its prot 14, some wound.
    const { field, colossus, strikers } = colossusField([
      squad('a', 'cinderWarrior', 20, { stats: { prot: 100 } }),
    ]);
    const log = melee(field);
    const blows = damageTo(log, 'c', 'physical').length;
    const swing = log.find((e) => e.kind === 'melee' && e.squad === 'a');
    const hits = swing?.kind === 'melee' ? swing.hits : -1;
    expect(hits).toBeLessThan(20);
    expect(blows).toBeGreaterThan(0);
    expect(blows).toBeLessThan(hits);
    // One burn per wounding blow, 5 HP each despite prot 100; misses and 0-damage hits are free.
    const hp = strikers.members.map((m) => m.hp);
    expect(hp.filter((h) => h === 11 - 5)).toHaveLength(blows);
    expect(hp.filter((h) => h === 11)).toHaveLength(20 - blows);
    // The burn is logged once for the squad, after every blow and the phase's melee tally.
    expect(log.map((e) => e.kind)).toEqual([
      ...Array<string>(blows).fill('damage'),
      'melee',
      'damage',
    ]);
    expect(log.at(-1)).toEqual({
      kind: 'damage',
      target: 'a',
      amount: 5 * blows,
      element: 'fire',
      kills: 0,
    });
    expect(colossus.members[0]!.alive).toBe(true);
  });

  it('burns per hit: a striker that wounds with two weapons is burned twice', () => {
    const twoHanded = squad('a', 'cinderWarrior', 1, {
      stats: {
        att: 50,
        str: 30,
        weapons: [
          { name: 'Axe', dmg: 5 },
          { name: 'Knife', dmg: 2 },
        ],
      },
    });
    const { field, strikers } = colossusField([twoHanded], { prot: 0 });
    const log = melee(field);
    expect(damageTo(log, 'c', 'physical')).toHaveLength(2);
    expect(strikers.members[0]!.hp).toBe(11 - 10);
    expect(damageTo(log, 'a', 'fire')).toEqual([
      { kind: 'damage', target: 'a', amount: 10, element: 'fire', kills: 0 },
    ]);
  });

  it('burns by the struck unit’s own shield strength, on squads as on commanders', () => {
    const field = buildField(
      setup(
        side([squad('a', 'cinderWarrior', 3, { stats: { att: 50, str: 30 } })]),
        side([squad('d', 'warden', 1, { hp: 1000, stats: { hp: 1000, prot: 0, fireShield: 7 } })]),
      ),
    );
    tooTired(field.sides.defender[0]!);
    const log = melee(field);
    expect(log.find((e) => e.kind === 'melee')).toMatchObject({ squad: 'a', hits: 3 });
    expect(field.sides.attacker[0]!.members.map((m) => m.hp)).toEqual([4, 4, 4]);
    expect(damageTo(log, 'a', 'fire')).toEqual([
      { kind: 'damage', target: 'a', amount: 21, element: 'fire', kills: 0 },
    ]);
  });

  it('kills strikers after their blows land, and logs the deaths as kills of the burn', () => {
    // Four warriors at 3 HP each: every blow lands, then every striker burns to death.
    const { field, colossus, strikers } = colossusField(
      [squad('a', 'cinderWarrior', 4, { hp: 12, stats: { att: 50, str: 30 } })],
      { prot: 0 },
    );
    const log = melee(field);
    const blows = damageTo(log, 'c', 'physical');
    expect(blows).toHaveLength(4);
    const dealt = blows.reduce((sum, e) => sum + (e.kind === 'damage' ? e.amount : 0), 0);
    expect(colossus.members[0]!.hp).toBe(1000 - dealt);
    expect(strikers.members.every((m) => !m.alive && m.hp === 0)).toBe(true);
    expect(strikers.deathsThisRound).toBe(4);
    expect(log.find((e) => e.kind === 'melee')).toMatchObject({ squad: 'a', hits: 4, kills: 0 });
    // The amount is the HP the strikers had left, not 4 x 5.
    expect(damageTo(log, 'a', 'fire')).toEqual([
      { kind: 'damage', target: 'a', amount: 12, element: 'fire', kills: 4 },
    ]);
  });

  it('does not burn for misses or blows that do no damage', () => {
    const harmless = colossusField(
      [squad('a', 'cinderWarrior', 5, { stats: { att: 50, str: 0 } })],
      { prot: 100 },
    );
    const glancing = melee(harmless.field);
    expect(glancing.find((e) => e.kind === 'melee')).toMatchObject({ hits: 5 });
    expect(glancing.filter((e) => e.kind === 'damage')).toEqual([]);
    expect(harmless.strikers.members.map((m) => m.hp)).toEqual([11, 11, 11, 11, 11]);

    const clumsy = colossusField([squad('a', 'cinderWarrior', 5, { stats: { att: 0 } })], {
      def: 100,
    });
    const missing = melee(clumsy.field);
    expect(missing.find((e) => e.kind === 'melee')).toMatchObject({ hits: 0 });
    expect(missing.filter((e) => e.kind === 'damage')).toEqual([]);
  });

  it('does not burn archers: only melee hits set it off', () => {
    const { field, strikers } = colossusField(
      [squad('r', 'longbowHunter', 10, { stats: { prec: 50 } })],
      { prot: 0 },
    );
    const log: BattleEvent[] = [];
    rangedPhase(field, 1, createRng(1), log);
    expect(damageTo(log, 'c', 'physical').length).toBeGreaterThan(0);
    expect(damageTo(log, 'r', 'fire')).toEqual([]);
    expect(strikers.members.every((m) => m.hp === 10)).toBe(true);
  });

  it('protects only the unit that has it: a shielded striker is not burned by its own blows', () => {
    const field = buildField(
      setup(
        side([squad('a', 'cinderWarrior', 3, { stats: { att: 50, str: 30, fireShield: 5 } })]),
        side([], [commander('c', 'ashChieftain', { row: 'front', stats: { hp: 1000, prot: 0 } })]),
      ),
    );
    tooTired(field.sides.defender[0]!);
    const log = melee(field);
    expect(damageTo(log, 'c', 'physical')).toHaveLength(3);
    expect(log.some((e) => e.kind === 'damage' && e.element === 'fire')).toBe(false);
    expect(field.sides.attacker[0]!.members.map((m) => m.hp)).toEqual([11, 11, 11]);
  });

  it('in a full battle, logs a commander it burns to death as a fire kill, then a death', () => {
    // An Ash Chieftain at 4 HP walks up to a Colossus that cannot touch it.
    const result = fightOnce(
      side(
        [],
        [commander('h', 'ashChieftain', { row: 'front', hp: 4, stats: { att: 50, def: 50 } })],
      ),
      side([], [commander('c', 'ashColossus', { row: 'front', stats: { att: 0, prot: 0 } })]),
    );
    const replay = result.replay;
    const burn = replay.findIndex((e) => e.kind === 'damage' && e.target === 'h');
    expect(replay[burn]).toEqual({
      kind: 'damage',
      target: 'h',
      amount: 4,
      element: 'fire',
      kills: 1,
    });
    expect(replay[burn + 1]).toEqual({ kind: 'death', commander: 'h' });
    expect(replay.slice(0, burn)).toContainEqual({
      kind: 'melee',
      squad: 'c',
      target: 'h',
      hits: 0,
      kills: 0,
    });
    expect(result.commanders.get('h')?.dead).toBe(true);
    expect(result.winner).toBe('defender');
    expect(foldReplay(result.roster, replay).get('h')?.count).toBe(0);
  });
});
