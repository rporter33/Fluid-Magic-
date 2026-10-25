// Battle effect primitives cast by hand onto a staged field (docs/02-magic.md section 5 and its
// decisions; docs/04-battle.md Spellcasting), so each change can be read off the groups that
// carry it. effects.test.ts follows the same primitives through whole battles.
import { describe, expect, it } from 'vitest';
import { SPELLS } from '../../../src/content/spells';
import type { BattleEvent } from '../../../src/sim/battle/events';
import { groupStat } from '../../../src/sim/battle/field';
import { commanderDeaths, moralePhase } from '../../../src/sim/battle/morale';
import { drn } from '../../../src/sim/drn';
import { cloneRng, createRng, randBelow } from '../../../src/sim/rng';
import { side, squad, statsOf } from './fixtures';
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
