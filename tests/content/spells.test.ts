// Spell content against docs/02-magic.md section 6. CLAUDE.md: every new spell joins these
// fixtures, and any change from the docs is recorded in docs/09-balance.md.
import { describe, expect, it } from 'vitest';
import { unitDef, validateContent } from '../../src/content';
import { parseRequirement, SPELLS, isSpellId } from '../../src/content/spells';
import { validateSpell } from '../../src/content/spells/validate';
import { UNITS } from '../../src/content/units';
import { meetsRequirement } from '../../src/sim/pips';

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
