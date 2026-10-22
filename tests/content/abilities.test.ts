// Content validation of the abilities catalog and of the Phase 6b.2 unit fields (pretender build
// spec N1 to N4; units-and-items build spec B.1 and B.3): the fixture abilities, their display
// fields and rules, the trigger id list, and what a unit, a weapon, or a chassis may carry.
import { describe, expect, it } from 'vitest';
import { unitDef, validateContent } from '../../src/content';
import {
  ABILITIES,
  ABILITY_LIST,
  abilitySource,
  isTriggerAbilityId,
  TRIGGER_ABILITY_IDS,
  triggerDef,
  type AbilityDef,
  type UnitAbility,
} from '../../src/content/abilities';
import { CHASSIS, type ChassisDef } from '../../src/content/pretenders/chassis';
import { UI } from '../../src/content/rules';
import { isSpellId } from '../../src/content/spells';
import type { BattleEffect } from '../../src/content/spells/types';
import type { WeaponDef } from '../../src/content/types';
import { UNITS } from '../../src/content/units';
import { validateAbility } from '../../src/content/validateAbilities';
import { patched } from './patched';

/** The catalog of Phase 6b.2: the pretender expansion's three battle-start abilities (A.4). */
const FIXTURE: Record<string, [string, string, string | null, readonly BattleEffect[]]> = {
  primordialFear: [
    'Fear',
    'staringEye',
    null,
    [
      {
        kind: 'debuff',
        stat: 'mor',
        delta: -2,
        duration: { kind: 'battle' },
        targets: { kind: 'allEnemy' },
      },
    ],
  ],
  kindleTheHost: [
    'Kindle the Host',
    'risingFlame',
    'R',
    [{ kind: 'summon', unit: 'fireSprite', count: 6, side: 'friendly' }],
  ],
  callTheHunt: [
    'Call the Hunt',
    'huntingHorn',
    'G',
    [{ kind: 'summon', unit: 'wolf', count: 8, side: 'friendly' }],
  ],
};

describe('the abilities catalog', () => {
  it('holds exactly the fixture abilities, every one a battle-start trigger', () => {
    expect(Object.keys(ABILITIES)).toEqual(Object.keys(FIXTURE));
    for (const [id, [name, glyph, color, effects]] of Object.entries(FIXTURE)) {
      const a: AbilityDef | undefined = ABILITY_LIST.find((x) => x.id === id);
      expect(a, id).toMatchObject({ kind: 'trigger', trigger: 'battleStart', name, glyph, color });
      expect(a?.effects, id).toEqual(effects);
      expect(a?.sourceId, id).toBeUndefined();
    }
    expect(TRIGGER_ABILITY_IDS).toEqual(Object.keys(FIXTURE));
  });

  it('gives each a one line within the card’s limit, its name first, from the catalog', () => {
    expect(UI.unitCard.oneLineMax).toBe(120);
    expect(ABILITIES.primordialFear.oneLine).toBe(
      'Fear: at battle start, every enemy fights at −2 morale for the whole battle.',
    );
    expect(ABILITIES.kindleTheHost.oneLine).toBe(
      'Kindle the Host: at battle start, 6 Fire Sprites rise beside it.',
    );
    expect(ABILITIES.callTheHunt.oneLine).toBe(
      'Call the Hunt: at battle start, 8 Wolves run to its side.',
    );
    for (const a of ABILITY_LIST) {
      expect(a.oneLine.length, a.id).toBeLessThanOrEqual(UI.unitCard.oneLineMax);
      expect(a.oneLine.startsWith(`${a.name}:`), a.id).toBe(true);
      expect(isSpellId(a.id), a.id).toBe(false);
    }
    expect(new Set(ABILITY_LIST.map((a) => a.glyph)).size).toBe(ABILITY_LIST.length);
  });

  it('resolves trigger ids and plans with the ability’s own id, or the copied spell’s', () => {
    expect(TRIGGER_ABILITY_IDS.every(isTriggerAbilityId)).toBe(true);
    expect(isTriggerAbilityId('emberDart')).toBe(false);
    expect(isTriggerAbilityId('toString')).toBe(false);
    expect(triggerDef('callTheHunt')).toBe(ABILITIES.callTheHunt);
    const fear = abilitySource(ABILITIES.primordialFear);
    expect(fear).toEqual({ id: 'primordialFear', effects: ABILITIES.primordialFear.effects });
    const copy: UnitAbility = { ...ABILITIES.callTheHunt, sourceId: 'swarm' };
    expect(abilitySource(copy).id).toBe('swarm');
  });

  it('passes content validation, and no shipped unit lists an ability or the new fields yet', () => {
    expect(validateContent()).toEqual([]);
    for (const u of Object.values(UNITS)) {
      const def = unitDef(u.id as keyof typeof UNITS);
      expect(def.abilities, u.id).toBeUndefined();
      expect(def.spellPower, u.id).toBeUndefined();
      for (const w of def.weapons) {
        expect([w.strikes, w.maxTargetSize], `${u.id} ${w.name}`).toEqual([undefined, undefined]);
      }
    }
    for (const c of Object.values(CHASSIS)) expect(c, c.id).not.toHaveProperty('monthlySummon');
  });
});

describe('content validation of abilities', () => {
  const kindle = ABILITIES.kindleTheHost as AbilityDef;
  const check = <K extends keyof AbilityDef>(key: K, value: AbilityDef[K], problem: string) => {
    patched(kindle, key, value, () => {
      expect(validateContent(), key).toEqual([problem]);
    });
  };

  it('reports a wrong id, name, glyph, one line, trigger, color, or effect', () => {
    check('id', 'kindle', 'ability kindleTheHost has id kindle');
    check('name', ' ', 'ability kindleTheHost has no name');
    check('glyph', 'Rising Flame', 'ability kindleTheHost bad glyph id Rising Flame');
    check('glyph', 'staringEye', 'ability glyphs repeat');
    check('oneLine', '', 'ability kindleTheHost has no one line');
    check('oneLine', 'x'.repeat(121), 'ability kindleTheHost one line over 120 characters');
    // The raw line counts, trailing spaces too.
    check('oneLine', `${'x'.repeat(119)}  `, 'ability kindleTheHost one line over 120 characters');
    check('oneLine', 'Kindle: {n} {size}.', 'ability kindleTheHost unknown placeholder {size}');
    check('trigger', 'eachRound' as 'battleStart', 'ability kindleTheHost bad trigger');
    check('color', 'X' as 'R', 'ability kindleTheHost bad color');
    check('effects', [], 'ability kindleTheHost has no effects');
    check(
      'effects',
      [{ kind: 'summon', unit: 'titan', count: 6, side: 'friendly' }],
      'ability kindleTheHost bad summon',
    );
    check(
      'effects',
      [{ kind: 'heal', amount: 0, targets: { kind: 'self' } }],
      'ability kindleTheHost bad heal',
    );
  });

  it('accepts a one line of exactly 120 characters, and the placeholders {n}, {m}, {unit} and {color}', () => {
    for (const line of ['x'.repeat(120), 'Kindle the Host: {n} {m} {unit} {color}.']) {
      patched(kindle, 'oneLine', line, () => {
        expect(validateContent(), line).toEqual([]);
      });
    }
  });

  it('holds a copied spell to the spell’s shape: a battle spell, same kinds, stats and targets', () => {
    check(
      'sourceId',
      'callFireSprites' as 'swarm',
      'ability kindleTheHost source callFireSprites is not a battle spell',
    );
    check(
      'sourceId',
      'barkSkin',
      'ability kindleTheHost effects differ in kind, stat or targets from barkSkin',
    );
    // A summon has Swarm's shape, whatever it summons and however many.
    patched(kindle, 'sourceId', 'swarm', () => {
      expect(validateContent()).toEqual([]);
    });
    // A copy of Bark Skin keeps its stat and its target kind; its delta is free.
    const buff = (
      stat: 'def' | 'prot',
      targets: 'friendlySquad' | 'allFriendly',
    ): BattleEffect[] => [
      { kind: 'buff', stat, delta: 2, duration: { kind: 'battle' }, targets: { kind: targets } },
    ];
    const differ = 'ability kindleTheHost effects differ in kind, stat or targets from barkSkin';
    patched(kindle, 'sourceId', 'barkSkin', () => {
      patched(kindle, 'effects', buff('prot', 'friendlySquad'), () => {
        expect(validateContent()).toEqual([]);
      });
      patched(kindle, 'effects', buff('def', 'friendlySquad'), () => {
        expect(validateContent()).toEqual([differ]);
      });
      patched(kindle, 'effects', buff('prot', 'allFriendly'), () => {
        expect(validateContent()).toEqual([differ]);
      });
    });
  });

  it('refuses an ability id that is a spell id, and a trigger entry missing from the id list', () => {
    expect(validateAbility('emberDart', { ...kindle, id: 'emberDart' })).toEqual([
      'ability emberDart shares its id with a spell',
    ]);
    const all = ABILITIES as unknown as Record<string, AbilityDef>;
    all.extra = { ...kindle, id: 'extra', glyph: 'extraGlyph' };
    try {
      expect(validateContent()).toEqual([
        'TRIGGER_ABILITY_IDS must list every trigger entry, in catalog order',
      ]);
    } finally {
      delete all.extra;
    }
    expect(validateContent()).toEqual([]);
  });
});

describe('content validation of the Phase 6b.2 unit fields', () => {
  it('lets only commanders list abilities: trigger ids, each once', () => {
    patched(unitDef('cinderWarrior'), 'abilities', ['callTheHunt'], () => {
      expect(validateContent()).toEqual([
        'unit cinderWarrior lists abilities but is not a commander',
      ]);
    });
    patched(unitDef('titan'), 'abilities', ['nope' as 'callTheHunt'], () => {
      expect(validateContent()).toEqual(['unit titan ability nope is not a trigger']);
    });
    patched(unitDef('titan'), 'abilities', ['callTheHunt', 'callTheHunt'], () => {
      expect(validateContent()).toEqual(['unit titan lists an ability twice']);
    });
    patched(unitDef('titan'), 'abilities', ['callTheHunt', 'primordialFear'], () => {
      expect(validateContent()).toEqual([]);
    });
  });

  it('holds strikes to 1 to 4 and the target size limit to 1 to 6, on melee weapons only', () => {
    const axe = (extra: Partial<WeaponDef>): WeaponDef[] => [{ name: 'Axe', dmg: 5, ...extra }];
    const warrior = unitDef('cinderWarrior');
    for (const strikes of [0, 5, 1.5]) {
      patched(warrior, 'weapons', axe({ strikes }), () => {
        expect(validateContent(), String(strikes)).toEqual(['unit cinderWarrior Axe bad strikes']);
      });
    }
    for (const maxTargetSize of [0, 7, 2.5]) {
      patched(warrior, 'weapons', axe({ maxTargetSize }), () => {
        expect(validateContent()).toEqual(['unit cinderWarrior Axe bad target size limit']);
      });
    }
    for (const bounds of [
      { strikes: 1, maxTargetSize: 1 },
      { strikes: 4, maxTargetSize: 6 },
    ]) {
      patched(warrior, 'weapons', axe(bounds), () => {
        expect(validateContent(), JSON.stringify(bounds)).toEqual([]);
      });
    }
    const bow: WeaponDef = { name: 'Bow', dmg: 6, range: 6, ammo: 10 };
    patched(unitDef('flameArcher'), 'weapons', [{ ...bow, strikes: 2, maxTargetSize: 2 }], () => {
      expect(validateContent()).toEqual([
        'unit flameArcher Bow bad strikes',
        'unit flameArcher Bow bad target size limit',
      ]);
    });
  });

  it('gives spell power to commanders only, as a whole number, and fire shields of 1 or more', () => {
    const rule = 'spell power belongs to commanders, as a whole number';
    patched(unitDef('cinderWarrior'), 'spellPower', 2, () => {
      expect(validateContent()).toEqual([`unit cinderWarrior ${rule}`]);
    });
    for (const power of [-1, 1.5]) {
      patched(unitDef('cinderMagus'), 'spellPower', power, () => {
        expect(validateContent()).toEqual([`unit cinderMagus ${rule}`]);
      });
    }
    for (const power of [0, 3]) {
      patched(unitDef('cinderMagus'), 'spellPower', power, () => {
        expect(validateContent(), String(power)).toEqual([]);
      });
    }
    for (const shield of [0, 2.5]) {
      patched(unitDef('ashColossus'), 'fireShield', shield, () => {
        expect(validateContent()).toEqual(['unit ashColossus bad fire shield']);
      });
    }
    patched(unitDef('ashColossus'), 'fireShield', 1, () => {
      expect(validateContent()).toEqual([]);
    });
  });

  it('holds a chassis’s monthly summon to a troop and whole counts up to its cap', () => {
    const titan: ChassisDef = CHASSIS.titan;
    for (const cap of [2, 24]) {
      patched(titan, 'monthlySummon', { unit: 'wolf', count: 2, cap }, () => {
        expect(validateContent(), String(cap)).toEqual([]);
      });
    }
    patched(titan, 'monthlySummon', { unit: 'titan', count: 2, cap: 24 }, () => {
      expect(validateContent()).toEqual(['chassis titan monthly summon titan is not a troop']);
    });
    for (const [count, cap] of [
      [0, 24],
      [3, 2],
      [1.5, 4],
    ] as const) {
      patched(titan, 'monthlySummon', { unit: 'wolf', count, cap }, () => {
        expect(validateContent()).toEqual(['chassis titan bad monthly summon numbers']);
      });
    }
  });
});
