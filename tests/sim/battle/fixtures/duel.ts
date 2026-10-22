// The staged duels of the pretender build spec's A.10 and the AI power calibration of its A.11,
// on the real bodies and rules (Phase 6b.3): every chassis body, with its battle-start abilities
// (N1: Fear, Kindle the Host, Call the Hunt), trample's strikes and size limit (N2), shields
// (N4) and bound squads (N5), against the five Independent fixtures. `npm run sim:duel` prints
// the table and `-- --calibrate` rewrites each chassis's aiPower; tests/sim/battle/duel.test.ts
// pins the bands and checks the calibration.
import { unitDef, type UnitTypeId } from '../../../../src/content';
import { CHASSIS, type ChassisId } from '../../../../src/content/pretenders/chassis';
import { troopPower } from '../../../../src/ai/assess';
import type {
  BattleSideSetup,
  BattleSquadSetup,
  CombatStats,
} from '../../../../src/sim/battle/types';
import type { ScriptSlot } from '../../../../src/sim/types';
import { commander, fightOnce, side, squad, statsOf } from '../fixtures';

/** The god's script: Attack in every slot (A.10), or Hold for a body that cannot move. */
function script(kind: 'attack' | 'hold'): ScriptSlot[] {
  return Array.from({ length: 5 }, () => ({ kind }));
}

/** A god on its own side, leading these squads; immobile bodies hold, the rest attack. */
function godSide(
  body: UnitTypeId,
  squads: BattleSquadSetup[] = [],
  stats: Partial<CombatStats> = {},
): BattleSideSetup {
  const immobile = unitDef(body).tags.includes('immobile');
  const god = commander('god', body, {
    stats: statsOf(body, stats),
    script: script(immobile ? 'hold' : 'attack'),
  });
  return side(squads, [god]);
}

/** An Independent Captain leading these troops. */
function independents(troops: readonly [UnitTypeId, number][]): BattleSideSetup {
  const squads = troops.map(([unit, n], i) => squad(`s${String(i)}`, unit, n, { leader: 'cap' }));
  return side(squads, [commander('cap', 'independentCaptain')]);
}

export interface DuelFoe {
  id: string;
  label: string;
  make: () => BattleSideSetup;
}

/** A.10's five fixtures. */
export const DUEL_FOES: readonly DuelFoe[] = [
  {
    id: 'weakPlains',
    label: 'Weak plains (11 LI, 5 archers)',
    make: () =>
      independents([
        ['lightInfantry', 11],
        ['archer', 5],
      ]),
  },
  {
    id: 'plains',
    label: 'Plains (16 LI, 8 archers)',
    make: () =>
      independents([
        ['lightInfantry', 16],
        ['archer', 8],
      ]),
  },
  {
    id: 'hills',
    label: 'Hills (20 Heavy Infantry)',
    make: () => independents([['heavyInfantry', 20]]),
  },
  {
    id: 'forest',
    label: 'Forest (12 wolves, 6 archers)',
    make: () =>
      independents([
        ['wolf', 12],
        ['archer', 6],
      ]),
  },
  {
    id: 'mountain',
    label: 'Mountain (giant, 25 HI)',
    make: () =>
      independents([
        ['giant', 1],
        ['heavyInfantry', 25],
      ]),
  },
];

export interface DuelRow {
  id: string;
  label: string;
  /** The body whose HP is reported. */
  body: UnitTypeId;
  make: () => BattleSideSetup;
}

/** Wolves under the god: bound (N5, its monthly summons) or not (a squad it merely leads). */
function wolves(n: number, bound: boolean): BattleSquadSetup {
  return squad('wolves', 'wolf', n, { leader: 'god', ...(bound ? { bound: true as const } : {}) });
}

function led(unit: UnitTypeId, n: number): BattleSquadSetup {
  return squad('army', unit, n, { leader: 'god' });
}

/** Avatar with an R4 bless (Ember Wrath): att +2, str +2 on the god. */
const AVATAR_R4 = {
  att: unitDef('ascendedHero').att + 2,
  str: unitDef('ascendedHero').str + 2,
} satisfies Partial<CombatStats>;

/** Each chassis's body alone, with what its abilities summon at battle start. */
const BODY_ROWS: readonly DuelRow[] = (Object.keys(CHASSIS) as ChassisId[]).map((id) => {
  const body = CHASSIS[id].body;
  const c = CHASSIS[id];
  return { id, label: `${c.name} (${String(c.cost)})`, body, make: () => godSide(body) };
});

/** A.10's rows: every body, then the Hero with Avatar, the Mother's packs, and gods leading armies. */
export const DUEL_ROWS: readonly DuelRow[] = [
  ...BODY_ROWS,
  {
    id: 'heroAvatar',
    label: 'Ascended Hero with Avatar and R4',
    body: 'ascendedHero',
    make: () => godSide('ascendedHero', [], AVATAR_R4),
  },
  ...[6, 12, 24].map((n) => ({
    id: `mother${String(n)}`,
    label: `Mother of Beasts + ${String(n)} bound wolves`,
    body: 'motherOfBeasts' as const,
    make: () => godSide('motherOfBeasts', [wolves(n, true)]),
  })),
  {
    id: 'mother12Led',
    label: 'Mother + 12 ordinary wolves she leads (not bound)',
    body: 'motherOfBeasts',
    make: () => godSide('motherOfBeasts', [wolves(12, false)]),
  },
  {
    id: 'titanWarriors',
    label: 'Titan + 20 Cinder Warriors',
    body: 'titan',
    make: () => godSide('titan', [led('cinderWarrior', 20)]),
  },
  {
    id: 'heroWarriors',
    label: 'Ascended Hero (Avatar, R4) + 20 Cinder Warriors',
    body: 'ascendedHero',
    make: () => godSide('ascendedHero', [led('cinderWarrior', 20)], AVATAR_R4),
  },
  {
    id: 'titanWardens',
    label: 'Titan + 20 Wardens',
    body: 'titan',
    make: () => godSide('titan', [led('warden', 20)]),
  },
  {
    id: 'motherPackWardens',
    label: 'Mother + 12 bound wolves + 20 Wardens',
    body: 'motherOfBeasts',
    make: () => godSide('motherOfBeasts', [wolves(12, true), led('warden', 20)]),
  },
];

export interface DuelCell {
  /** Share of seeds the god's side wins, 0 to 1. */
  win: number;
  /** The god's HP left, as a share of its maximum, over the seeds it lives; null if it never does. */
  hpLeft: number | null;
  /** Share of seeds the god dies. */
  dies: number;
}

/**
 * Seeds 0 to seeds - 1 of a duel. A god that cannot move is fought where it stands: the foe
 * attacks and the god's side defends; every other god attacks.
 */
export function duelCell(row: DuelRow, foe: DuelFoe, seeds: number): DuelCell {
  const immobile = unitDef(row.body).tags.includes('immobile');
  const maxHp = unitDef(row.body).hp;
  let wins = 0;
  let alive = 0;
  let hp = 0;
  for (let s = 0; s < seeds; s++) {
    const r = immobile
      ? fightOnce(foe.make(), row.make(), s)
      : fightOnce(row.make(), foe.make(), s);
    if (r.winner === (immobile ? 'defender' : 'attacker')) wins += 1;
    const god = r.commanders.get('god');
    if (god && !god.dead) {
      alive += 1;
      hp += god.hp;
    }
  }
  return {
    win: wins / seeds,
    hpLeft: alive === 0 ? null : hp / alive / maxHp,
    dies: (seeds - alive) / seeds,
  };
}

export function duelRow(id: string): DuelRow {
  const row = DUEL_ROWS.find((r) => r.id === id);
  if (!row) throw new Error(`no duel row ${id}`);
  return row;
}

export function duelFoe(id: string): DuelFoe {
  const foe = DUEL_FOES.find((f) => f.id === id);
  if (!foe) throw new Error(`no duel foe ${id}`);
  return foe;
}

// ---------------------------------------------------------------- the AI power calibration (A.11)

/** The Light Infantry troop term of docs/08's armyPower: (hp + att + def + prot) / 4. */
export const LIGHT_INFANTRY_TERM = troopPower(unitDef('lightInfantry'));

/** Seeds per probe of the calibration. */
export const CALIBRATION_SEEDS = 200;

/** Share of seeds a chassis's body (with its battle-start summons and Fear) beats n Light Infantry. */
export function beatsLightInfantry(id: ChassisId, n: number, seeds = CALIBRATION_SEEDS): number {
  const foe: DuelFoe = {
    id: 'lightInfantry',
    label: `${String(n)} Light Infantry`,
    make: () => independents([['lightInfantry', n]]),
  };
  // Immobile bodies are measured defending, as duelCell fights them.
  return duelCell(duelRow(id), foe, seeds).win;
}

/**
 * The largest n of Light Infantry the body beats in at least half the seeds: doubling, then
 * bisection, as the build spec's aipower.ts searched. 0 when it cannot beat one.
 */
export function lightInfantryEquivalent(id: ChassisId): number {
  let lo = 0;
  let hi = 1;
  while (beatsLightInfantry(id, hi) >= 0.5 && hi < 512) {
    lo = hi;
    hi *= 2;
  }
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (beatsLightInfantry(id, mid) >= 0.5) lo = mid;
    else hi = mid;
  }
  return lo;
}

/** A chassis's aiPower from its Light Infantry equivalent. */
export function aiPowerOf(n: number): number {
  return Math.round(n * LIGHT_INFANTRY_TERM);
}
