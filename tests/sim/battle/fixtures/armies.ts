// The armies behind the named battles (named.ts): casters, the starting armies, the 300 v 300
// clashes, and the builders several fixtures share.
import type { UnitTypeId } from '../../../../src/content';
import { SPELLS } from '../../../../src/content/spells';
import type { BattleSpellDef } from '../../../../src/content/spells/types';
import type {
  BattleCommanderSetup,
  BattleSetup,
  BattleSideSetup,
  BattleSquadSetup,
  CombatStats,
} from '../../../../src/sim/battle/types';
import type { ScriptSlot } from '../../../../src/sim/types';
import { commander, setup, side, squad } from '../fixtures';
import { testSpell } from '../spellFixtures';

export const cast = (spellId: string | null): ScriptSlot => ({ kind: 'cast', spellId });
export const casting = (spellId: string | null = null): ScriptSlot[] =>
  Array.from({ length: 5 }, () => cast(spellId));
export const attacking: ScriptSlot[] = Array.from({ length: 5 }, () => ({ kind: 'attack' }));

/** A caster of the given spells, scripted to cast its best one every round. */
export function caster(
  ref: string,
  unit: UnitTypeId,
  spells: readonly BattleSpellDef[],
  opts: Parameters<typeof commander>[2] = {},
): BattleCommanderSetup {
  return commander(ref, unit, { spells, script: casting(), ...opts });
}

export function priest(ref: string, unit: 'pyrePriest' | 'grovePriest'): BattleCommanderSetup {
  return commander(ref, unit, { spells: [SPELLS.bless], script: casting('bless') });
}

/** Every unit of a side with more morale and protection, as the defenders of a stormed fort. */
export function stormed(s: BattleSideSetup, mor: number, prot: number): BattleSideSetup {
  const add = (st: CombatStats): CombatStats => ({
    ...st,
    mor: st.mor + mor,
    prot: st.prot + prot,
  });
  return {
    ...s,
    squads: s.squads.map((q) => ({ ...q, stats: add(q.stats) })),
    commanders: s.commanders.map((c) => ({ ...c, stats: add(c.stats) })),
  };
}

/** The starting armies of docs/03-nations.md, more or less: the typical small battle. */
export function starting(): BattleSetup {
  return setup(
    side(
      [
        squad('a1', 'cinderWarrior', 20, { leader: 'ac' }),
        squad('a2', 'flameArcher', 10, { leader: 'ac' }),
      ],
      [
        commander('ac', 'ashChieftain'),
        caster('am', 'emberAdept', [SPELLS.emberDart]),
        priest('ap', 'pyrePriest'),
      ],
    ),
    side(
      [
        squad('d1', 'warden', 20, { leader: 'dc' }),
        squad('d2', 'longbowHunter', 10, { leader: 'dc' }),
      ],
      [
        commander('dc', 'wardenCaptain'),
        caster('dm', 'saplingDruid', [SPELLS.thornSpray]),
        priest('dp', 'grovePriest'),
      ],
    ),
  );
}

/** 300 troops in 7 squads and 6 commanders against 300 in 6 squads and 6 commanders. */
export function clash300(): BattleSetup {
  const red = [SPELLS.emberDart, SPELLS.fireball, SPELLS.pyreStorm, SPELLS.warcry];
  const green = [SPELLS.thornSpray, SPELLS.barkSkin, SPELLS.entangle, SPELLS.swarm];
  return setup(
    side(
      [
        squad('a1', 'cinderWarrior', 60, { leader: 'ac1' }),
        squad('a2', 'cinderWarrior', 40, { leader: 'ac2' }),
        squad('a3', 'flameArcher', 60, { leader: 'ac1' }),
        squad('a4', 'berserker', 40, { leader: 'ac2' }),
        squad('a5', 'ashRider', 40, { leader: 'ac3' }),
        squad('a6', 'emberSkirmisher', 30, { leader: 'ac3' }),
        squad('a7', 'flamebrand', 30, { leader: 'ac1' }),
      ],
      [
        commander('ac1', 'ashChieftain'),
        commander('ac2', 'ashChieftain'),
        commander('ac3', 'ashChieftain'),
        caster('am1', 'cinderMagus', [...red, SPELLS.bloodFury], {
          carriedMana: { R: 3 },
          pips: { R: 3 },
        }),
        caster('am2', 'cinderMagus', [SPELLS.emberDart, SPELLS.fireball, SPELLS.bloodFury]),
        priest('ap', 'pyrePriest'),
      ],
    ),
    side(
      [
        squad('d1', 'warden', 60, { leader: 'dc1' }),
        squad('d2', 'warden', 40, { leader: 'dc2' }),
        squad('d3', 'longbowHunter', 80, { leader: 'dc1' }),
        squad('d4', 'briarGuard', 40, { leader: 'dc2' }),
        squad('d5', 'wolfRider', 40, { leader: 'dc3' }),
        squad('d6', 'oakheart', 40, { leader: 'dc3' }),
      ],
      [
        commander('dc1', 'wardenCaptain'),
        commander('dc2', 'wardenCaptain'),
        commander('dc3', 'wardenCaptain'),
        caster('dm1', 'elderDruid', [...green, SPELLS.regrowth], {
          carriedMana: { G: 3 },
          pips: { G: 3 },
        }),
        caster('dm2', 'elderDruid', [SPELLS.thornSpray, SPELLS.barkSkin, SPELLS.entangle]),
        commander('dt', 'treant', {
          spells: [SPELLS.thornSpray],
          script: [cast(null), ...attacking.slice(1)],
        }),
      ],
    ),
  );
}

/** 300 against 300 plain troops, with the same stat changes on both sides. */
export function wall300(stats: Partial<CombatStats>, mages = false): BattleSetup {
  const red = [SPELLS.emberDart, SPELLS.fireball, SPELLS.warcry, SPELLS.pyreStorm];
  const green = [SPELLS.thornSpray, SPELLS.barkSkin, SPELLS.swarm, SPELLS.regrowth];
  const four = (prefix: string, unit: UnitTypeId, spells: BattleSpellDef[]) =>
    mages
      ? Array.from({ length: 4 }, (_, i) =>
          caster(`${prefix}${String(i)}`, unit, spells, {
            pips: { R: 3, G: 3 },
            carriedMana: { R: 2, G: 2 },
          }),
        )
      : [];
  return setup(
    side(
      [squad('a0', 'cinderWarrior', 200, { stats }), squad('a1', 'flameArcher', 100, { stats })],
      four('am', 'cinderMagus', red),
    ),
    side(
      [squad('d0', 'warden', 200, { stats }), squad('d1', 'longbowHunter', 100, { stats })],
      four('dm', 'elderDruid', green),
    ),
  );
}

/** A commander alone against a squad. */
export function lone(c: BattleCommanderSetup, foes: BattleSquadSetup[]): BattleSetup {
  return setup(side([], [c]), side(foes));
}

export const RED_SPELLS = [
  SPELLS.emberDart,
  SPELLS.fireball,
  SPELLS.warcry,
  SPELLS.bloodFury,
  SPELLS.pyreStorm,
];
export const GREEN_SPELLS = [
  SPELLS.thornSpray,
  SPELLS.barkSkin,
  SPELLS.entangle,
  SPELLS.swarm,
  SPELLS.regrowth,
];

export function fieldBattle(effect: 'storm' | 'fog' | 'wall'): BattleSetup {
  const spell = testSpell(`test:${effect}`, [{ kind: 'fieldEffect', effect, rounds: 3 }], 30);
  return setup(
    side(
      [
        squad('a0', 'cinderWarrior', 20, { leader: 'am' }),
        squad('a1', 'flameArcher', 15, { leader: 'am' }),
      ],
      [caster('am', 'cinderMagus', [spell])],
    ),
    side([squad('d0', 'thornMilitia', 25), squad('d1', 'longbowHunter', 15)]),
  );
}

/** Both nations' casters with all eleven M1 battle spells between them. */
export function mageDuel(): BattleSetup {
  return setup(
    side(
      [
        squad('a0', 'cinderWarrior', 25, { leader: 'ac', hp: 220 }),
        squad('a1', 'flameArcher', 15, { leader: 'ac' }),
      ],
      [
        commander('ac', 'ashChieftain'),
        caster('am1', 'cinderMagus', RED_SPELLS, { carriedMana: { R: 3 }, pips: { R: 5 } }),
        caster('am2', 'cinderMagus', RED_SPELLS.slice(0, 4), { carriedMana: { R: 1 } }),
        caster('aa', 'emberAdept', [SPELLS.emberDart]),
        priest('ap', 'pyrePriest'),
      ],
    ),
    side(
      [
        squad('d0', 'warden', 25, { leader: 'dc', hp: 220 }),
        squad('d1', 'longbowHunter', 15, { leader: 'dc' }),
      ],
      [
        commander('dc', 'wardenCaptain'),
        caster('dm1', 'elderDruid', GREEN_SPELLS, { carriedMana: { G: 3 }, pips: { G: 5 } }),
        caster('dm2', 'elderDruid', GREEN_SPELLS.slice(0, 3)),
        caster('ds', 'saplingDruid', [SPELLS.barkSkin]),
        priest('dp', 'grovePriest'),
      ],
    ),
  );
}
