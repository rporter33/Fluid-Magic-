// Battle effect primitives cast by hand onto a staged field (docs/02-magic.md section 5 and its
// decisions; docs/04-battle.md Spellcasting), so each change can be read off the groups that
// carry it. effects.test.ts follows the same primitives through whole battles.
import { describe, expect, it } from 'vitest';
import { SPELLS } from '../../../src/content/spells';
import type { BattleSpellDef } from '../../../src/content/spells/types';
import type { DetailEvent } from '../../../src/sim/battle/detail';
import type { BattleEvent } from '../../../src/sim/battle/events';
import { groupStat } from '../../../src/sim/battle/field';
import { commanderDeaths, moralePhase } from '../../../src/sim/battle/morale';
import { drn } from '../../../src/sim/drn';
import { cloneRng, createRng, randBelow } from '../../../src/sim/rng';
import { commander, side, squad, statsOf } from './fixtures';
import { mage, staged, testSpell } from './spellFixtures';

describe('spell damage', () => {
  it('rolls amount + DRN − prot − DRN, with no hit roll; Ember Dart keeps half the prot', () => {
    for (let seed = 0; seed < 50; seed++) {
      const { castBy } = staged(
        side([], [mage('m', [SPELLS.emberDart])]),
        side([squad('d', 'ashMilitia', 1, { hp: 99, stats: { hp: 99, prot: 10 } })]),
      );
      const rng = createRng(seed);
      const replay = cloneRng(rng);
      randBelow(replay, 1); // the troop hit
      const amount = Math.max(0, 12 + drn(replay) - 5 - drn(replay));
      const damage = castBy('m', SPELLS.emberDart, rng).find((e) => e.kind === 'damage');
      expect(damage, `seed ${String(seed)}`).toEqual({
        kind: 'damage',
        target: 'd',
        amount,
        element: 'fire',
        kills: 0,
      });
    }
  });

  it('reports every troop each damage effect rolls; one an earlier effect felled, as fallen', () => {
    const area = { kind: 'area', count: 3 } as const;
    const twice = testSpell('test:twice', [
      { kind: 'damage', amount: 500, element: 'fire', targets: area },
      { kind: 'damage', amount: 500, element: 'fire', targets: area },
    ]);
    const { field, castBy } = staged(
      side([], [mage('m', [twice])]),
      side([squad('d', 'ashMilitia', 10)]),
    );
    const detail: DetailEvent[] = [];
    field.detail = detail;
    const log = castBy('m', twice);
    const hits = detail.flatMap((e) => (e.kind === 'spellHit' ? [e] : []));
    const [first, second] = [0, 1].map((i) => hits.filter((h) => h.effect === i));
    // The second effect lands on the troops the first one burnt to death.
    expect(first?.length).toBeGreaterThan(0);
    expect(second?.map((h) => h.targetMember)).toEqual(first?.map((h) => h.targetMember));
    expect(second?.map((h) => h.landing)).toEqual(
      second?.map(() => ({ hpBefore: 0, dealt: 0, killed: false })),
    );
    const kills = log.reduce((n, e) => n + (e.kind === 'damage' ? e.kills : 0), 0);
    expect(hits.filter((h) => h.landing.killed)).toHaveLength(kills);
  });

  it('kills that count toward the round’s morale: a squad half burnt checks at once', () => {
    const blast = testSpell('test:blast', [
      { kind: 'damage', amount: 500, element: 'fire', targets: { kind: 'area', count: 5 } },
    ]);
    let routs = 0;
    for (let seed = 0; seed < 20; seed++) {
      const { field, castBy } = staged(
        side([], [mage('m', [blast])]),
        side([squad('d', 'ashMilitia', 10, { stats: { mor: 0 } })]),
      );
      const rng = createRng(seed);
      // The spell's kills are the round's only losses.
      const log = castBy('m', blast, rng);
      moralePhase(field, 1, rng, log);
      if (log.some((e) => e.kind === 'rout' && e.squad === 'd')) routs++;
    }
    expect(routs).toBeGreaterThan(10);
  });
});

describe('Regrowth', () => {
  it('lifts every change of the newest curse; older curses and Blood Fury’s price stay', () => {
    const oldCurse = testSpell('test:oldCurse', [
      {
        kind: 'debuff',
        stat: 'def',
        delta: -1,
        duration: { kind: 'battle' },
        targets: { kind: 'enemySquad' },
      },
    ]);
    const { find, castBy } = staged(
      side(
        [squad('w', 'cinderWarrior', 10, { leader: 'm', hp: 80 })],
        [mage('m', [SPELLS.bloodFury, SPELLS.regrowth], { carried: { G: 1 } })],
      ),
      side([], [mage('e', [oldCurse, SPELLS.entangle])]),
    );
    castBy('e', oldCurse);
    castBy('e', SPELLS.entangle);
    // Blood Fury's −2 defense is the newest negative change, yet no curse.
    castBy('m', SPELLS.bloodFury);
    const lifted = castBy('m', SPELLS.regrowth);
    expect(find('w').mods.map((m) => [m.source, m.stat, m.delta])).toEqual([
      ['test:oldCurse', 'def', -1],
      ['bloodFury', 'att', 2],
      ['bloodFury', 'str', 3],
      ['bloodFury', 'def', -2],
    ]);
    expect(lifted.filter((e) => e.kind === 'expire')).toEqual([
      { kind: 'expire', target: 'w', source: 'entangle' },
    ]);
  });
});

describe('a storm', () => {
  it('gives everyone on the field −2 attack until it ends', () => {
    const storm = testSpell('test:storm', [{ kind: 'fieldEffect', effect: 'storm', rounds: 3 }]);
    const { field, castBy } = staged(
      side([squad('w', 'cinderWarrior', 10)], [mage('m', [storm])]),
      side([squad('d', 'ashMilitia', 10)]),
    );
    castBy('m', storm);
    for (const g of [...field.sides.attacker, ...field.sides.defender]) {
      expect(groupStat(g, 'att'), g.ref).toBe(g.base.att - 2);
      // The change ends with the storm, after round 3.
      expect(g.mods.map((m) => m.untilRound)).toEqual([3]);
    }
  });
});

describe('summons', () => {
  it('join under their caster, so they roll for its death', () => {
    // Real hornets never break (morale 50); these are made skittish to show who leads them.
    const { field, find, castBy } = staged(
      {
        ...side([], [mage('m', [SPELLS.swarm], { carried: { G: 1 } })]),
        summons: { hornetSwarm: statsOf('hornetSwarm', { mor: -20 }) },
      },
      side([squad('d', 'ashMilitia', 10)]),
    );
    castBy('m', SPELLS.swarm);
    const m = find('m');
    for (const t of m.members) {
      t.alive = false;
      t.hp = 0;
    }
    m.deathsThisRound = 1;
    const log: BattleEvent[] = [];
    commanderDeaths(field, 1, createRng(1), log);
    expect(log).toEqual([
      { kind: 'death', commander: 'm' },
      { kind: 'rout', squad: 'su0' },
    ]);
  });
});

describe('spell power (N3)', () => {
  /** A Cinder Magus of this spell power casting at 20 militia, with a detail sink. */
  function powered(power: number, spells: readonly BattleSpellDef[] = [SPELLS.emberDart]) {
    const caster = commander('m', 'cinderMagus', { spells, stats: { spellPower: power } });
    const { field, find, castBy } = staged(
      // Warriors at 10 of 100 HP each, so no heal is capped.
      side([squad('w', 'cinderWarrior', 10, { hp: 100, stats: { hp: 100 } })], [caster]),
      side([squad('d', 'ashMilitia', 20, { stats: { prot: 4, hp: 99 }, hp: 20 * 99 })]),
    );
    const detail: DetailEvent[] = [];
    field.detail = detail;
    return { find, castBy, detail };
  }

  it('adds to a damage spell’s amount and changes no target or draw', () => {
    const rolls = [0, 3].map((power) => {
      const { castBy, detail } = powered(power);
      const rng = createRng(7);
      const log = castBy('m', SPELLS.emberDart, rng);
      const hits = detail.flatMap((e) => (e.kind === 'spellHit' ? [e] : []));
      return { log, hits, rng };
    });
    const [plain, strong] = rolls as [(typeof rolls)[0], (typeof rolls)[0]];
    expect(plain.hits.map((h) => h.damage.base)).toEqual([12]);
    expect(strong.hits.map((h) => h.damage.base)).toEqual([15]);
    expect(strong.hits.map((h) => [h.target, h.targetMember])).toEqual(
      plain.hits.map((h) => [h.target, h.targetMember]),
    );
    expect(strong.rng).toEqual(plain.rng);
    const dealt = strong.hits[0]!.damage.rolled;
    expect(strong.log.find((e) => e.kind === 'damage')).toMatchObject({ amount: dealt });
  });

  it('adds to a heal: Regrowth heals 10 + 3 on each wounded troop', () => {
    const heals = [0, 3].map((power) => {
      const { find, castBy } = powered(power, [SPELLS.regrowth]);
      const healed = castBy('m', SPELLS.regrowth).find((e) => e.kind === 'heal');
      return { healed, hp: find('w').members.map((t) => t.hp) };
    });
    expect(heals.map((h) => h.healed)).toEqual([
      { kind: 'heal', target: 'w', amount: 10 * 10 },
      { kind: 'heal', target: 'w', amount: 10 * 13 },
    ]);
    expect(heals[1]?.hp).toEqual(Array<number>(10).fill(10 + 13));
  });

  it.each([
    testSpell('test:drain', [{ kind: 'fatigueDrain', amount: 5, targets: { kind: 'enemySquad' } }]),
    testSpell('test:shock', [{ kind: 'moraleShock', amount: -5, targets: { kind: 'enemySquad' } }]),
    SPELLS.barkSkin,
    SPELLS.entangle,
    SPELLS.swarm,
  ])(
    'never touches a drain, shock, buff, debuff or summon: $id at power 3 is $id at 0',
    (spell) => {
      const run = (power: number) => {
        const caster = commander('m', 'elderDruid', {
          spells: [spell],
          stats: { spellPower: power },
        });
        const { field, castBy } = staged(
          side([squad('w', 'warden', 10)], [caster]),
          side([squad('d', 'ashMilitia', 20)], [commander('e', 'cinderMagus')]),
        );
        const groups = () =>
          [...field.sides.attacker, ...field.sides.defender].map((g) => ({
            ref: g.ref,
            fatigue: g.fatigue,
            shock: g.shock,
            mods: g.mods.map((m) => [m.stat, m.delta]),
            members: g.members.length,
          }));
        const before = groups();
        const log = castBy('m', spell);
        return { log, before, after: groups() };
      };
      const plain = run(0);
      // The plain cast did something to a group other than its caster.
      const others = (gs: typeof plain.before) => gs.filter((g) => g.ref !== 'm');
      expect(others(plain.after)).not.toEqual(others(plain.before));
      const strong = run(3);
      expect(strong.log).toEqual(plain.log);
      expect(strong.after).toEqual(plain.after);
    },
  );
});
