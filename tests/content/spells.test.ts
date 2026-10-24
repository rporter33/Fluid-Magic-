// Spell content against docs/02-magic.md section 6, and each battle spell's fx against the
// docs/09-art-direction.md mapping with docs/12 S2.10's full-form lengths. CLAUDE.md: every new
// spell joins these fixtures, and any change from the docs is recorded in docs/09-balance.md.
import { describe, expect, it } from 'vitest';
import { unitDef, validateContent } from '../../src/content';
import type { SpellFx } from '../../src/content/fx';
import {
  BATTLE_SPELLS,
  parseRequirement,
  RITUALS,
  SPELLS,
  isSpellId,
  spellRules,
} from '../../src/content/spells';
import type { BattleSpellDef, SpellDef } from '../../src/content/spells/types';
import { validateSpell } from '../../src/content/spells/validate';
import { UNITS } from '../../src/content/units';
import { meetsRequirement } from '../../src/sim/pips';
import { patched } from './patched';

/** [level, requirement, fatigue or castDays, carried mana or cost] per docs/02. */
const BATTLE: Record<string, readonly [number, string, number, object]> = {
  emberDart: [1, 'R', 10, {}],
  fireball: [2, 'RR', 25, {}],
  warcry: [2, 'R', 20, { R: 1 }],
  bloodFury: [3, 'RR', 30, {}],
  pyreStorm: [5, 'RRR', 60, { R: 1 }],
  thornSpray: [1, 'G', 10, {}],
  barkSkin: [2, 'G', 15, {}],
  entangle: [3, 'GG', 25, {}],
  swarm: [4, 'GG', 35, { G: 1 }],
  regrowth: [5, 'GGG', 50, { G: 1 }],
};

/** docs/09 "M1 spell to family mapping": family and scale; duration is docs/12's full form. */
const FX: Record<string, SpellFx> = {
  emberDart: { family: 'projectile', scale: 1, duration: 900 },
  fireball: { family: 'burst', scale: 2, duration: 1900 },
  warcry: { family: 'aura', scale: 2, duration: 1300 },
  bloodFury: { family: 'aura', scale: 1, duration: 1400 },
  pyreStorm: { family: 'burst', scale: 3, duration: 3200 },
  thornSpray: { family: 'burst', scale: 1, duration: 1200 },
  barkSkin: { family: 'aura', scale: 1, duration: 1200 },
  entangle: { family: 'shock', scale: 2, duration: 1400 },
  swarm: { family: 'summon', scale: 2, duration: 1800 },
  regrowth: { family: 'aura', scale: 3, duration: 2000 },
  bless: { family: 'aura', scale: 1, duration: 1000 },
};

const RITUAL: Record<string, readonly [number, string, number, object]> = {
  callFireSprites: [1, 'R', 5, { mana: { R: 2 }, generic: 0 }],
  forgeOfCinders: [2, 'RR', 10, { mana: { R: 3 }, generic: 1 }],
  burnTheFields: [3, 'RR', 10, { mana: { R: 4 }, generic: 2 }],
  bindSalamander: [4, 'RRR', 20, { mana: { R: 8 }, generic: 4 }],
  ashRain: [6, 'RRRR', 25, { mana: { R: 12 }, generic: 6 }],
  callOfTheWild: [1, 'G', 5, { mana: { G: 2 }, generic: 0 }],
  fertileSeason: [2, 'GG', 10, { mana: { G: 3 }, generic: 1 }],
  awakenTreant: [3, 'GGG', 15, { mana: { G: 6 }, generic: 3 }],
  bountyOfTheLoam: [4, 'GG', 10, { mana: { G: 5 }, generic: 2 }],
  rootwall: [5, 'GGG', 15, { mana: { G: 8 }, generic: 4 }],
};

describe('spells', () => {
  it('match the docs/02 battle spell list', () => {
    for (const [id, [level, req, fatigue, carried]] of Object.entries(BATTLE)) {
      expect(isSpellId(id), id).toBe(true);
      const s = isSpellId(id) ? SPELLS[id] : null;
      expect(
        s?.kind === 'battle' && [s.level, s.requirement, s.fatigue, s.carriedMana],
        id,
      ).toEqual([level, req, fatigue, carried]);
    }
  });

  it('match the docs/02 ritual list', () => {
    for (const [id, [level, req, days, cost]] of Object.entries(RITUAL)) {
      const s = isSpellId(id) ? SPELLS[id] : null;
      expect(s?.kind === 'ritual' && [s.level, s.requirement, s.castDays, s.cost], id).toEqual([
        level,
        req,
        days,
        cost,
      ]);
    }
  });

  it('cover every spell in content, plus the priests’ Bless', () => {
    expect(Object.keys(SPELLS).sort()).toEqual(
      ['bless', ...Object.keys(BATTLE), ...Object.keys(RITUAL)].sort(),
    );
    expect(SPELLS.bless).toMatchObject({ color: null, level: 0, requirement: '', holy: 1 });
  });

  it('pass content validation, which catches broken records', () => {
    expect(validateContent()).toEqual([]);
    expect(validateSpell('x', { ...SPELLS.emberDart, requirement: 'RX' })).toContain(
      'spell x bad requirement RX',
    );
    expect(validateSpell('emberDart', { ...SPELLS.emberDart, requirement: 'G' })).toContain(
      'spell emberDart requirement lacks its color',
    );
    expect(
      validateSpell('swarm', {
        ...SPELLS.swarm,
        effects: [{ kind: 'summon', unit: 'salamander', count: 1, side: 'friendly' }],
      }),
    ).toContain('spell swarm bad summon');
  });

  it('parse requirements into pip slots, hybrids joined by a slash', () => {
    expect(parseRequirement('RR')).toEqual([['R'], ['R']]);
    expect(parseRequirement('RR/G')).toEqual([['R'], ['R', 'G']]);
    expect(parseRequirement('')).toEqual([]);
    for (const bad of ['/R', 'R/', 'R//G', 'X']) expect(() => parseRequirement(bad), bad).toThrow();
  });

  it('give every battle spell its docs/09 effect family and scale, and docs/12 length', () => {
    expect(BATTLE_SPELLS.map((s) => s.id).sort()).toEqual(Object.keys(FX).sort());
    for (const s of BATTLE_SPELLS) expect(s.fx, s.id).toEqual(FX[s.id]);
  });

  it('give no ritual an fx: the map shows a ring in the ritual’s color instead', () => {
    expect(RITUALS).toHaveLength(Object.keys(RITUAL).length);
    for (const s of RITUALS) expect(Object.hasOwn(s, 'fx'), s.id).toBe(false);
  });

  it('refuse an unknown family, a scale outside 1 to 3, a bad length, and a ritual with fx', () => {
    const dart = SPELLS.emberDart;
    const withFx = (fx: unknown): BattleSpellDef => ({ ...dart, fx: fx as SpellFx });
    const where = 'spell emberDart';
    expect(validateSpell('emberDart', withFx({ family: 'beam' }))).toEqual([
      `${where} fx family "beam" is unknown`,
    ]);
    for (const scale of [0, 4, 1.5, '2', null]) {
      const shown = JSON.stringify(scale);
      expect(validateSpell('emberDart', withFx({ family: 'strike', scale })), shown).toEqual([
        `${where} fx scale ${shown} is not 1 to 3`,
      ]);
    }
    for (const duration of [0, -900, 1.5, '900']) {
      const shown = JSON.stringify(duration);
      expect(validateSpell('emberDart', withFx({ family: 'strike', duration })), shown).toEqual([
        `${where} fx duration ${shown} is not whole ms`,
      ]);
    }
    expect(validateSpell('emberDart', withFx(undefined))).toEqual([`${where} has no fx`]);
    // Scale and duration may be left out: scale 1, the family's own lifecycle.
    expect(validateSpell('emberDart', withFx({ family: 'strike' }))).toEqual([]);
    const ritual = { ...SPELLS.ashRain, fx: FX.fireball } as SpellDef;
    expect(validateSpell('ashRain', ritual)).toEqual(['spell ashRain is a ritual and has fx']);
    // Content validation runs the same checks over the registry.
    const fireball: BattleSpellDef = SPELLS.fireball;
    patched(fireball, 'fx', { family: 'beam', scale: 4 } as unknown as SpellFx, () => {
      expect(validateContent()).toEqual([
        'spell fireball fx family "beam" is unknown',
        'spell fireball fx scale 4 is not 1 to 3',
      ]);
    });
    expect(validateContent()).toEqual([]);
  });

  it('leave a battle spell’s rules as they were before fx: only the fx key goes', () => {
    for (const s of BATTLE_SPELLS) {
      const rules = spellRules(s);
      expect(Object.hasOwn(rules, 'fx'), s.id).toBe(false);
      expect(Object.keys(rules)).toEqual(Object.keys(s).filter((k) => k !== 'fx'));
      expect({ ...rules, fx: s.fx }).toEqual(s);
    }
  });

  it('give each default spell to a unit that can cast it', () => {
    let found = 0;
    for (const id of Object.keys(UNITS) as (keyof typeof UNITS)[]) {
      const traits = unitDef(id).commander;
      const spellId = traits?.defaultSpell;
      if (!traits || spellId === undefined) continue;
      found++;
      const spell = isSpellId(spellId) ? SPELLS[spellId] : null;
      expect(spell !== null && meetsRequirement(traits.pips, traits.holy, spell), id).toBe(true);
    }
    expect(found).toBe(2);
  });
});
