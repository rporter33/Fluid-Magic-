// Bound squads (pretender build spec N5; docs/04-battle.md decisions, "A commander's rout" and
// "Bound squads"): a battle summon, or a squad of its pretender's monthly-summon unit, never drags
// its commander into a rout when it breaks, while standing bound squads still keep it on the
// field. Also Fear and the morale-50 line (Rulings R3b). Staged fields, one morale step at a time.
import { describe, expect, it } from 'vitest';
import { ABILITIES } from '../../../src/content/abilities';
import { SPELLS } from '../../../src/content/spells';
import { abilityPhase } from '../../../src/sim/battle/abilities';
import type { DetailEvent } from '../../../src/sim/battle/detail';
import type { BattleEvent } from '../../../src/sim/battle/events';
import { buildField, type Field, type Group } from '../../../src/sim/battle/field';
import { moralePhase, neverChecks } from '../../../src/sim/battle/morale';
import { createRng } from '../../../src/sim/rng';
import { commander, setup, side, squad } from './fixtures';
import { staged } from './spellFixtures';

function kill(g: Group, n: number): void {
  let left = n;
  for (const m of g.members) {
    if (left === 0) break;
    if (!m.alive) continue;
    m.alive = false;
    m.hp = 0;
    g.deathsThisRound += 1;
    left -= 1;
  }
}

/** A morale step in this round; the groups' per-round state is reset first. */
function morale(field: Field, round: number, seed = 1): BattleEvent[] {
  const log: BattleEvent[] = [];
  moralePhase(field, round, createRng(seed), log);
  for (const g of [...field.sides.attacker, ...field.sides.defender]) {
    g.deathsThisRound = 0;
    g.checked = false;
    g.shock = 0;
  }
  return log;
}

const byRef = (field: Field, ref: string): Group => {
  const g = [...field.sides.attacker, ...field.sides.defender].find((x) => x.ref === ref);
  if (!g) throw new Error(`no group ${ref}`);
  return g;
};

/** A druid leading 20 militia, with Swarm's 20 hornets cast at its side ('su0'). */
function druidWithHornets() {
  const { field, castBy } = staged(
    side(
      [squad('r', 'ashMilitia', 20, { leader: 'm', stats: { mor: -100 } })],
      [commander('m', 'elderDruid', { spells: [SPELLS.swarm], carriedMana: { G: 1 } })],
    ),
    side([squad('e', 'ashMilitia', 1)]),
  );
  castBy('m', SPELLS.swarm);
  return { field, druid: byRef(field, 'm'), real: byRef(field, 'r'), hornets: byRef(field, 'su0') };
}

describe('a battle summon', () => {
  it('is bound; the regression: a caster whose real squad broke stays while its hornets stand', () => {
    const { field, druid, real, hornets } = druidWithHornets();
    expect([hornets.summoned, hornets.bound, real.bound]).toEqual([true, true, false]);
    kill(real, 5);
    morale(field, 1);
    expect(real.routingSince).toBe(1);
    expect(druid.routingSince).toBeNull();
    expect(hornets.routingSince).toBeNull();
  });

  it('the one corner that changes: hornets under 50 that break leave their caster on the field', () => {
    let broke = 0;
    for (let seed = 0; seed < 60; seed++) {
      const run = (bound: boolean) => {
        const { field, druid, real, hornets } = druidWithHornets();
        // The real squad is gone; the hornets, at morale 47 (Fear and Dread), are shocked hard.
        real.gone = true;
        hornets.bound = bound;
        hornets.mods.push({
          stat: 'mor',
          delta: -3,
          source: 'test:dread',
          untilRound: null,
          debuff: true,
          logged: false,
        });
        hornets.shock = 40;
        morale(field, 1, seed);
        return { druid: druid.routingSince, hornets: hornets.routingSince };
      };
      const now = run(true);
      if (now.hornets === null) continue;
      broke += 1;
      expect(now.druid, `seed ${String(seed)}`).toBeNull();
      // Before N5 the same break took the caster along.
      expect(run(false).druid, `seed ${String(seed)}`).toBe(1);
    }
    expect(broke).toBeGreaterThan(10);
  });

  it('eight wolves of Call the Hunt rout; their commander stays', () => {
    const field = buildField(
      setup(
        side([], [commander('h', 'titan', { abilities: [ABILITIES.callTheHunt] })]),
        side([squad('e', 'ashMilitia', 1)]),
      ),
    );
    abilityPhase(field, 1, createRng(1), []);
    const wolves = byRef(field, 'su0');
    expect([wolves.startCount, wolves.bound]).toEqual([8, true]);
    wolves.base = { ...wolves.base, mor: -100 };
    kill(wolves, 3);
    morale(field, 1);
    expect(wolves.routingSince).toBe(1);
    expect(byRef(field, 'h').routingSince).toBeNull();
  });
});

/** A Mother-like commander leading 12 wolves, bound or not, and maybe 10 Wardens. */
function mother(bound: boolean, wardens = false) {
  const field = buildField(
    setup(
      side(
        [
          squad('w', 'wolf', 12, {
            leader: 'mo',
            stats: { mor: -100 },
            ...(bound ? { bound: true as const } : {}),
          }),
          ...(wardens ? [squad('g', 'warden', 10, { leader: 'mo', stats: { mor: -100 } })] : []),
        ],
        [commander('mo', 'titan')],
      ),
      side([squad('e', 'ashMilitia', 1)]),
    ),
  );
  return { field, wolves: byRef(field, 'w'), mo: byRef(field, 'mo') };
}

describe('bound monthly wolves', () => {
  it('rout without dragging the Mother; the same wolves unbound drag their commander', () => {
    const bound = mother(true);
    expect(bound.wolves.bound).toBe(true);
    kill(bound.wolves, 3);
    morale(bound.field, 1);
    expect(bound.wolves.routingSince).toBe(1);
    expect(bound.mo.routingSince).toBeNull();
    const plain = mother(false);
    expect(plain.wolves.bound).toBe(false);
    kill(plain.wolves, 3);
    morale(plain.field, 1);
    expect(plain.mo.routingSince).toBe(1);
  });

  it('leave her to rout with the Wardens, her last standing squad, when they break after', () => {
    const { field, wolves, mo } = mother(true, true);
    const wardens = byRef(field, 'g');
    kill(wolves, 3);
    morale(field, 1);
    expect([wolves.routingSince, wardens.routingSince, mo.routingSince]).toEqual([1, null, null]);
    kill(wardens, 2);
    morale(field, 2);
    expect([wardens.routingSince, mo.routingSince]).toEqual([2, 2]);
  });

  it('still keep her on the field while they stand', () => {
    const { field, wolves, mo } = mother(true, true);
    const wardens = byRef(field, 'g');
    kill(wardens, 2);
    morale(field, 1);
    expect([wardens.routingSince, wolves.routingSince, mo.routingSince]).toEqual([1, null, null]);
  });
});

describe('Fear and the morale-50 line', () => {
  it('makes a morale-50 squad checkable: at 48 it rolls when shaken, at 50 it never does', () => {
    const rolls = (feared: boolean) => {
      const field = buildField(
        setup(
          side(
            [],
            [commander('p', 'titan', { abilities: feared ? [ABILITIES.primordialFear] : [] })],
          ),
          side([squad('h', 'hornetSwarm', 20)]),
        ),
      );
      abilityPhase(field, 1, createRng(1), []);
      const hornets = byRef(field, 'h');
      const detail: DetailEvent[] = [];
      field.detail = detail;
      kill(hornets, 5);
      morale(field, 1);
      return { never: neverChecks(hornets), rolled: detail.filter((e) => e.kind === 'morale') };
    };
    const plain = rolls(false);
    expect(plain.never).toBe(true);
    expect(plain.rolled).toEqual([]);
    const feared = rolls(true);
    expect(feared.never).toBe(false);
    expect(feared.rolled).toHaveLength(1);
    expect(feared.rolled[0]).toMatchObject({ group: 'h', roll: { morale: 48 } });
  });
});
