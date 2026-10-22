// Content validation of the blessing menu and the boons (docs/05-pretender.md Steps 6 and 7;
// docs/02-magic.md section 8): every blessing's requirement, cost, group and effect; one
// standard and one greater blessing per color, equal to the fixed bless; and the two boons.
import { describe, expect, it } from 'vitest';
import { validateContent } from '../../src/content';
import { COLORS } from '../../src/content/colors';
import {
  BLESSING_LIST,
  BLESSINGS,
  isBlessingId,
  type BlessingDef,
} from '../../src/content/pretenders/blessings';
import { BOON_IDS, BOONS, isBoonId } from '../../src/content/pretenders/boons';
import { BLESS, BLESSING_MENU } from '../../src/content/rules';
import type { Element } from '../../src/content/types';
import { patched } from './patched';

const byId = (id: string): BlessingDef => {
  const found = BLESSING_LIST.find((bl) => bl.id === id);
  if (!found) throw new Error(`no blessing ${id}`);
  return found;
};

describe('the blessing menu', () => {
  it('lists the build spec’s blessings by color, Thornhide with shields by element', () => {
    const ids = (color: string) =>
      BLESSING_LIST.filter((bl) => bl.color === color).map((bl) => bl.id);
    expect(ids('R')).toEqual([
      'fervor',
      'keenEdge',
      'emberMight',
      'emberWrath',
      'cinderSkin',
      'blazingCharge',
      'furyUnbound',
      'flamingWeapons',
      'greaterEmberWrath',
      'livingPyre',
    ]);
    expect(ids('G')).toEqual([
      'thickSkin',
      'vigor',
      'strengthOfEarth',
      'evergreen',
      'oakhide',
      'deepRoots',
      'wildVigor',
      'thornhide',
      'greaterEvergreen',
      'ironbark',
    ]);
    expect(ids('W')).toEqual(['resolve', 'warding', 'steadfast', 'greaterSteadfast']);
    expect(ids('U')).toEqual(['keenEye', 'wariness', 'clearSight', 'greaterClearSight']);
    expect(ids('B')).toEqual(['cruelty', 'grimResolve', 'bloodThirst', 'greaterBloodThirst']);
    expect(isBlessingId('thornhide')).toBe(true);
    expect(isBlessingId('toString')).toBe(false);
    expect(BLESSING_LIST).toHaveLength(32);
  });

  it('requires 2 to 6 pips, costs max(1, requires − 1), groups by color, and has an effect', () => {
    expect(BLESSING_MENU).toEqual({ freePips: 1, minRequires: 2, maxRequires: 6, minCost: 1 });
    for (const [key, bl] of Object.entries(BLESSINGS)) {
      expect(bl.id, key).toBe(key);
      expect(bl.requires, key).toBeGreaterThanOrEqual(2);
      expect(bl.requires, key).toBeLessThanOrEqual(6);
      expect(bl.cost, key).toBe(Math.max(1, bl.requires - 1));
      expect(bl.group.startsWith(`${bl.color}.`), key).toBe(true);
      expect(Object.keys(bl.effect).length, key).toBeGreaterThan(0);
    }
  });

  it('has exactly one standard and one greater blessing per color, in one group, equal to BLESS', () => {
    for (const color of COLORS) {
      const standard = BLESSING_LIST.filter((bl) => bl.color === color && bl.tier === 'standard');
      const greater = BLESSING_LIST.filter((bl) => bl.color === color && bl.tier === 'greater');
      expect(standard, color).toHaveLength(1);
      expect(greater, color).toHaveLength(1);
      const [s, g] = [standard[0]!, greater[0]!];
      expect(s.group).toBe(g.group);
      expect([s.requires, s.cost, g.requires, g.cost]).toEqual([4, 3, 6, 5]);
      expect(s.effect).toEqual(BLESS[color]);
      const doubled = Object.fromEntries(Object.entries(BLESS[color]).map(([k, v]) => [k, v * 2]));
      expect(g.effect).toEqual(doubled);
      expect([s.incarnate, g.incarnate]).toEqual([false, false]);
    }
  });

  it('matches the build spec’s numbers for every blessing outside the default picks', () => {
    const row = (id: string) => {
      const bl = byId(id);
      return [bl.requires, bl.cost, bl.group, bl.incarnate, bl.effect];
    };
    expect(row('fervor')).toEqual([2, 1, 'R.mor', false, { mor: 1 }]);
    expect(row('keenEdge')).toEqual([2, 1, 'R.att', false, { att: 1 }]);
    expect(row('emberMight')).toEqual([3, 2, 'R.str', false, { str: 2 }]);
    expect(row('cinderSkin')).toEqual([
      4,
      3,
      'R.shield',
      false,
      { shield: { element: 'fire', amount: 3 } },
    ]);
    expect(row('blazingCharge')).toEqual([4, 3, 'R.charge', false, { firstRoundBonus: 5, mor: 1 }]);
    expect(row('furyUnbound')).toEqual([5, 4, 'R.berserk', true, { berserk: true, att: 1 }]);
    expect(byId('furyUnbound').requiresScale).toEqual({
      axis: 'lore',
      toward: 'negative',
      steps: 1,
    });
    expect(row('flamingWeapons')).toEqual([
      5,
      4,
      'R.weapon',
      true,
      { melee: { dmg: 3, element: 'fire', armorPiercing: true } },
    ]);
    expect(row('livingPyre')).toEqual([
      6,
      5,
      'R.shield',
      true,
      { shield: { element: 'fire', amount: 5 }, att: 2 },
    ]);
    expect(row('thickSkin')).toEqual([2, 1, 'G.prot', false, { prot: 1 }]);
    expect(row('vigor')).toEqual([2, 1, 'G.regen', false, { regeneration: 0.05 }]);
    expect(row('strengthOfEarth')).toEqual([3, 2, 'G.str', false, { str: 2 }]);
    expect(row('oakhide')).toEqual([4, 3, 'G.prot', false, { prot: 3 }]);
    expect(row('deepRoots')).toEqual([4, 3, 'G.mor', false, { mor: 3, prot: 1 }]);
    expect(row('wildVigor')).toEqual([5, 4, 'G.regen', true, { regeneration: 0.2, str: 1 }]);
    expect(byId('wildVigor').requiresScale).toEqual({
      axis: 'growth',
      toward: 'positive',
      steps: 1,
    });
    expect(row('thornhide')).toEqual([
      5,
      4,
      'G.shield',
      true,
      { shield: { element: 'nature', amount: 4 }, prot: 1 },
    ]);
    expect(row('ironbark')).toEqual([6, 5, 'G.prot', true, { prot: 5, str: 2 }]);
    // The White, Blue and Black minors: requirement 2, cost 1, one group each.
    expect(row('resolve')).toEqual([2, 1, 'W.mor', false, { mor: 1 }]);
    expect(row('warding')).toEqual([2, 1, 'W.prot', false, { prot: 1 }]);
    expect(row('keenEye')).toEqual([2, 1, 'U.prec', false, { prec: 1 }]);
    expect(row('wariness')).toEqual([2, 1, 'U.def', false, { def: 1 }]);
    expect(row('cruelty')).toEqual([2, 1, 'B.att', false, { att: 1 }]);
    expect(row('grimResolve')).toEqual([2, 1, 'B.mor', false, { mor: 1 }]);
    // Only Fury Unbound and Wild Vigor need a scale.
    expect(BLESSING_LIST.filter((bl) => bl.requiresScale).map((bl) => bl.id)).toEqual([
      'furyUnbound',
      'wildVigor',
    ]);
  });
});

describe('content validation of blessings', () => {
  const fervor: BlessingDef = BLESSINGS.fervor;

  it('finds nothing wrong with the shipped menu', () => {
    expect(validateContent()).toEqual([]);
  });

  it('reports a wrong id, color, requirement, cost, group, or empty effect', () => {
    const check = <K extends keyof BlessingDef>(key: K, value: BlessingDef[K], problem: string) => {
      patched(fervor, key, value, () => {
        expect(validateContent(), key).toEqual([problem]);
      });
    };
    check('id', 'keenEdge', 'blessing fervor has id keenEdge');
    check('requires', 1, 'blessing fervor must require 2 to 6 pips');
    check('requires', 7, 'blessing fervor must require 2 to 6 pips');
    check('cost', 2, 'blessing fervor must cost 1');
    check('group', 'G.mor', 'blessing fervor group must start with R.');
    check('group', 'R.', 'blessing fervor group must start with R.');
    check('effect', {}, 'blessing fervor has no effect');
    check('effect', { mor: -1 }, 'blessing fervor bad mor');
    check('effect', { regeneration: 1.5 }, 'blessing fervor bad regeneration');
    check(
      'effect',
      { shield: { element: 'acid' as Element, amount: 4 } },
      'blessing fervor bad shield element',
    );
    check('effect', { shield: { element: 'fire', amount: 0 } }, 'blessing fervor bad shield');
    check('effect', { melee: { dmg: 1.5 } }, 'blessing fervor bad melee damage');
    check('effect', { melee: { dmg: -1 } }, 'blessing fervor bad melee damage');
    check(
      'effect',
      { melee: { dmg: 1, element: 'acid' as Element } },
      'blessing fervor bad melee element',
    );
    check(
      'requiresScale',
      { axis: 'lore', toward: 'negative', steps: 4 },
      'blessing fervor bad scale requirement',
    );
    check(
      'requiresScale',
      { axis: 'lore', toward: 'negative', steps: 0 },
      'blessing fervor bad scale requirement',
    );
  });

  it('reports a default pick that is incarnate, and a menu without its fixed bless', () => {
    const wrath: BlessingDef = BLESSINGS.emberWrath;
    const tierRule =
      'blessing emberWrath is a default pick, so it may be neither incarnate nor need a scale';
    patched(wrath, 'incarnate', true, () => {
      expect(validateContent()).toEqual([tierRule]);
    });
    patched(wrath, 'requiresScale', { axis: 'lore', toward: 'negative', steps: 1 }, () => {
      expect(validateContent()).toEqual([tierRule]);
    });
    const differs = 'blessings R standard emberWrath differs from the fixed bless';
    patched(wrath, 'effect', { att: 2, str: 3 }, () => {
      expect(validateContent()).toEqual([differs]);
    });
    // The fixed bless's numbers and nothing more: no shield, melee bonus or berserk.
    for (const extra of [
      { shield: { element: 'fire' as const, amount: 1 } },
      { melee: { dmg: 1 } },
      { berserk: true as const },
    ]) {
      patched(wrath, 'effect', { att: 2, str: 2, ...extra }, () => {
        expect(validateContent(), Object.keys(extra)[0]).toEqual([differs]);
      });
    }
    // At the fixed bless's threshold: the standard at 4 pips, the greater at 6.
    patched(wrath, 'requires', 5, () => {
      patched(wrath, 'cost', 4, () => {
        expect(validateContent()).toEqual([differs]);
      });
    });
    const greaterWrath: BlessingDef = BLESSINGS.greaterEmberWrath;
    patched(greaterWrath, 'requires', 5, () => {
      patched(greaterWrath, 'cost', 4, () => {
        expect(validateContent()).toEqual([
          'blessings R greater greaterEmberWrath differs from the doubled fixed bless',
        ]);
      });
    });
    patched(wrath, 'tier', undefined, () => {
      expect(validateContent()).toEqual(['blessings R need one standard and one greater']);
    });
    patched(wrath, 'group', 'R.std', () => {
      expect(validateContent()).toEqual(['blessings R standard and greater must share a group']);
    });
    const greater: BlessingDef = BLESSINGS.greaterEvergreen;
    patched(greater, 'effect', { regeneration: 0.2, prot: 1 }, () => {
      expect(validateContent()).toEqual([
        'blessings G greater greaterEvergreen differs from the doubled fixed bless',
      ]);
    });
  });
});

describe('boons', () => {
  it('are the Sacred Spring and Avatar, 40 points each', () => {
    expect(BOON_IDS).toEqual(['sacredSpring', 'avatar']);
    expect(BOON_IDS.map((id) => [BOONS[id].name, BOONS[id].cost])).toEqual([
      ['Sacred Spring', 40],
      ['Avatar', 40],
    ]);
    expect(isBoonId('avatar')).toBe(true);
    expect(isBoonId('ironWill')).toBe(false);
  });

  it('report a wrong id or cost', () => {
    const avatar = BOONS.avatar;
    patched(avatar, 'cost', -1, () => {
      expect(validateContent()).toEqual(['boon avatar bad cost']);
    });
    patched(avatar, 'id', 'sacredSpring', () => {
      expect(validateContent()).toEqual(['boon avatar has id sacredSpring']);
    });
  });
});
