// Content validation of the pretender (docs/06-architecture.md, "Content validation";
// docs/05-pretender.md steps 1 to 5): the chassis, design point costs, and validateContent's
// chassis checks. The presets are in validate.presets.test.ts.
import { describe, expect, it } from 'vitest';
import { nationDef, unitDef, validateContent } from '../../src/content';
import {
  CHASSIS,
  CHASSIS_ROLES,
  isChassisId,
  type ChassisDef,
} from '../../src/content/pretenders/chassis';
import { AWAKENING, PRETENDER_COSTS } from '../../src/content/pretenders/costs';
import { patched } from './patched';

describe('pretender chassis', () => {
  const chassis: ChassisDef[] = Object.values(CHASSIS);

  it('lists the sixteen chassis of docs/05 step 1 in order, keyed by their own ids', () => {
    expect(Object.keys(CHASSIS)).toEqual([
      'oracle',
      'titan',
      'greatWyrm',
      'livingMonolith',
      'ascendedHero',
      'primordial',
      'ashColossus',
      'ashPhoenix',
      'pyreLord',
      'cinderIdol',
      'emberHierophant',
      'wildSpirit',
      'worldTree',
      'hornedHunter',
      'elderWyrm',
      'motherOfBeasts',
    ]);
    expect(chassis.map((c) => c.name)).toEqual([
      'Oracle of the Flux',
      'Titan',
      'Great Wyrm',
      'Living Monolith',
      'Ascended Hero',
      'Primordial',
      'Ash Colossus',
      'Ash Phoenix',
      'Pyre Lord',
      'Cinder Idol',
      'Ember Hierophant',
      'Wild Spirit',
      'World Tree',
      'Horned Hunter',
      'Elder Wyrm',
      'Mother of Beasts',
    ]);
    for (const [key, c] of Object.entries(CHASSIS)) {
      expect(c.id).toBe(key);
      expect(isChassisId(key)).toBe(true);
    }
    for (const bad of ['Titan', 'toString', 'constructor', '', 3, null, undefined]) {
      expect(isChassisId(bad)).toBe(false);
    }
  });

  it('match the docs/05 table: cost, base pips, and base dominion', () => {
    expect(chassis.map((c) => [c.id, c.cost, c.basePips, c.baseDominion])).toEqual([
      ['oracle', 20, null, 1],
      ['titan', 120, { color: 'nation', count: 1 }, 2],
      ['greatWyrm', 220, { color: 'nation', count: 2 }, 2],
      ['livingMonolith', 60, null, 4],
      ['ascendedHero', 100, { color: 'nation', count: 1 }, 1],
      ['primordial', 220, { color: 'nation', count: 2 }, 3],
      ['ashColossus', 100, { color: 'R', count: 1 }, 1],
      ['ashPhoenix', 120, { color: 'R', count: 1 }, 2],
      ['pyreLord', 140, { color: 'R', count: 2 }, 2],
      ['cinderIdol', 110, { color: 'R', count: 2 }, 4],
      ['emberHierophant', 60, { color: 'R', count: 2 }, 1],
      ['wildSpirit', 80, { color: 'G', count: 1 }, 2],
      ['worldTree', 150, { color: 'G', count: 2 }, 4],
      ['hornedHunter', 140, { color: 'G', count: 2 }, 2],
      ['elderWyrm', 190, { color: 'G', count: 1 }, 2],
      ['motherOfBeasts', 130, { color: 'G', count: 1 }, 2],
    ]);
  });

  it('give only the Oracle a pip discount and only the Monolith doubled dominion checks', () => {
    for (const c of chassis) {
      expect([c.pipDiscount, c.dominionFactor], c.id).toEqual([
        c.id === 'oracle' ? 10 : 0,
        c.id === 'livingMonolith' ? 2 : 1,
      ]);
    }
  });

  it('carry the realm, role, new-color price and AI power of the build spec (A.2, A.4, A.11)', () => {
    expect(chassis.map((c) => [c.id, c.realm, c.role, c.newColorFirstPip, c.aiPower])).toEqual([
      ['oracle', 'generic', 'mage', 40, 0],
      ['titan', 'generic', 'leader', 60, 94],
      ['greatWyrm', 'generic', 'monster', 80, 247],
      ['livingMonolith', 'generic', 'idol', 50, 595],
      ['ascendedHero', 'generic', 'leader', 50, 80],
      ['primordial', 'generic', 'monster', 80, 218],
      ['ashColossus', 'R', 'fighter', 60, 160],
      ['ashPhoenix', 'R', 'raider', 80, 138],
      ['pyreLord', 'R', 'summoner', 60, 189],
      ['cinderIdol', 'R', 'idol', 50, 305],
      ['emberHierophant', 'R', 'mage', 40, 0],
      ['wildSpirit', 'G', 'raider', 80, 65],
      ['worldTree', 'G', 'idol', 50, 645],
      ['hornedHunter', 'G', 'summoner', 60, 210],
      ['elderWyrm', 'G', 'monster', 80, 210],
      ['motherOfBeasts', 'G', 'summoner', 60, 65],
    ]);
    for (const c of chassis) expect(CHASSIS_ROLES, c.id).toContain(c.role);
  });

  it('carry the optional fields only where A.4 gives them', () => {
    const optional = chassis
      .map((c) => {
        const { attunement, minAwakening, startSprings, monthlySummon, reform, avatar } = c;
        const extra = { attunement, minAwakening, startSprings, monthlySummon, reform, avatar };
        const set = Object.entries(extra).filter(([, v]) => v !== undefined);
        return [c.id, Object.fromEntries(set)] as const;
      })
      .filter(([, extra]) => Object.keys(extra).length > 0);
    expect(optional).toEqual([
      ['ascendedHero', { avatar: true }],
      ['primordial', { minAwakening: 'dormant' }],
      [
        'ashPhoenix',
        { attunement: [{ axis: 'growth', toward: 'positive' }], reform: { days: 90 } },
      ],
      [
        'cinderIdol',
        {
          attunement: [{ axis: 'sanctity', toward: 'negative' }],
          monthlySummon: { unit: 'fireSprite', count: 2, cap: 20 },
        },
      ],
      [
        'worldTree',
        {
          attunement: [{ axis: 'sanctity', toward: 'positive' }],
          startSprings: { color: 'G', count: 1 },
        },
      ],
      ['hornedHunter', { attunement: [{ axis: 'lore', toward: 'negative' }] }],
      ['motherOfBeasts', { monthlySummon: { unit: 'wolf', count: 2, cap: 24 } }],
    ]);
  });

  it('match the A.10 cost-parity snapshot: body value = cost - pips - dominion - built-ins', () => {
    // Base pips at own-color prices (40 for the first, 20 for the second), 30 per base dominion
    // above 1, and built-in options at their boon prices (Avatar 40, a spring 40).
    const pipValue = [0, 40, 60];
    const parity = chassis.map((c) => {
      const pips = pipValue[c.basePips?.count ?? 0] ?? NaN;
      const dominion = 30 * (c.baseDominion - 1);
      const builtIn = (c.avatar ? 40 : 0) + 40 * (c.startSprings?.count ?? 0);
      return [c.id, c.cost - pips - dominion - builtIn];
    });
    expect(parity).toEqual([
      ['oracle', 20],
      ['titan', 50],
      ['greatWyrm', 130],
      ['livingMonolith', -30],
      ['ascendedHero', 20],
      ['primordial', 100],
      ['ashColossus', 60],
      ['ashPhoenix', 50],
      ['pyreLord', 50],
      ['cinderIdol', -40],
      ['emberHierophant', 0],
      ['wildSpirit', 10],
      ['worldTree', -40],
      ['hornedHunter', 50],
      ['elderWyrm', 120],
      ['motherOfBeasts', 60],
    ]);
  });

  it('each walk the map as their own body: a commander nobody can recruit', () => {
    for (const c of chassis) {
      expect(c.body, c.id).toBe(c.id);
      const body = unitDef(c.body);
      expect(body.commander, c.id).toBeDefined();
      expect(body.cost, c.id).toBeNull();
      expect(body.recruitDays, c.id).toBe(0);
      expect(body.requires, c.id).toEqual([]);
      expect(body.name, c.id).toBe(c.name);
    }
  });

  it('pair each nation with the two chassis that fit it (docs/03)', () => {
    expect(nationDef('cinderHorde').chassis).toEqual(['titan', 'ashColossus']);
    expect(nationDef('thornwood').chassis).toEqual(['wildSpirit', 'livingMonolith']);
  });
});

describe('design point costs', () => {
  it('match docs/05 steps 2 to 5', () => {
    // The new-color price moved onto each chassis in Phase 6b.1.
    expect(PRETENDER_COSTS).toEqual({
      budget: 400,
      pipLevel: [40, 20, 25, 30, 35, 40],
      dominionPoint: 30,
      scaleStep: { own: 20, other: 40 },
    });
  });

  it('refund awakening points and bring the pretender on day 0, Month 12, or Month 36', () => {
    expect(AWAKENING).toEqual({
      awake: { refund: 0, arrivalDay: 0 },
      dormant: { refund: 150, arrivalDay: 330 },
      imprisoned: { refund: 350, arrivalDay: 1050 },
    });
  });
});

describe('content validation of chassis', () => {
  const titan: ChassisDef = CHASSIS.titan;

  it('finds nothing wrong with the shipped content', () => {
    expect(validateContent()).toEqual([]);
  });

  it('reports a chassis whose body is missing, not a commander, or recruitable', () => {
    patched(titan, 'body', 'ashMilitia', () => {
      expect(validateContent()).toEqual(['chassis titan body ashMilitia is not a commander']);
    });
    patched(titan, 'body', 'ashChieftain', () => {
      expect(validateContent()).toEqual(['chassis titan body ashChieftain is recruitable']);
    });
  });

  it('reports a chassis with a wrong id, cost, base pips, base dominion, or modifiers', () => {
    const check = <K extends keyof ChassisDef>(key: K, value: ChassisDef[K], problem: string) => {
      patched(titan, key, value, () => {
        expect(validateContent(), key).toEqual([problem]);
      });
    };
    check('id', 'oracle', 'chassis titan has id oracle');
    check('cost', -1, 'chassis titan bad cost');
    check('basePips', { color: 'nation', count: 0 }, 'chassis titan bad base pips');
    check('baseDominion', 0, 'chassis titan bad base dominion');
    check('baseDominion', 11, 'chassis titan bad base dominion');
    check('pipDiscount', -10, 'chassis titan bad modifiers');
    check('dominionFactor', 0.5, 'chassis titan bad modifiers');
  });

  it('reports a bad realm, role, new-color price, attunement, awakening, springs, or AI power', () => {
    const check = <K extends keyof ChassisDef>(key: K, value: ChassisDef[K], problem: string) => {
      patched(titan, key, value, () => {
        expect(validateContent(), `${key} ${JSON.stringify(value)}`).toEqual([problem]);
      });
    };
    // The Oracle fits no nation, so its realm is reported alone.
    patched(CHASSIS.oracle as ChassisDef, 'realm', 'X' as ChassisDef['realm'], () => {
      expect(validateContent()).toEqual(['chassis oracle bad realm']);
    });
    check('role', 'support' as ChassisDef['role'], 'chassis titan bad role');
    check('newColorFirstPip', 0, 'chassis titan bad new-color price');
    check('newColorFirstPip', 55.5, 'chassis titan bad new-color price');
    check('aiPower', -1, 'chassis titan bad AI power');
    check('aiPower', NaN, 'chassis titan bad AI power');
    const bad = 'chassis titan bad attunement';
    check('attunement', [{ axis: 'luck' as 'lore', toward: 'positive' }], bad);
    check('attunement', [{ axis: 'lore', toward: 'up' as 'positive' }], bad);
    check(
      'attunement',
      [
        { axis: 'lore', toward: 'positive' },
        { axis: 'lore', toward: 'negative' },
      ],
      bad,
    );
    check('minAwakening', 'awake' as 'dormant', 'chassis titan bad minimum awakening');
    check('startSprings', { color: 'G', count: 0 }, 'chassis titan bad start springs');
    check('startSprings', { color: 'X' as 'G', count: 1 }, 'chassis titan bad start springs');
    // The Oracle's discount may not make a new color free.
    patched(CHASSIS.oracle as ChassisDef, 'newColorFirstPip', 10, () => {
      expect(validateContent()).toEqual(['chassis oracle bad new-color price']);
    });
    // Valid values of the optional fields pass.
    patched(titan, 'attunement', [{ axis: 'growth', toward: 'positive' }], () => {
      expect(validateContent()).toEqual([]);
    });
    patched(titan, 'startSprings', { color: 'nation', count: 1 }, () => {
      expect(validateContent()).toEqual([]);
    });
    patched(titan, 'minAwakening', 'imprisoned', () => {
      expect(validateContent()).toEqual([]);
    });
  });

  it('reports bad reform days, a monthly summon past leadership, or a mobile idol', () => {
    const check = <K extends keyof ChassisDef>(key: K, value: ChassisDef[K], problem: string) => {
      patched(titan, key, value, () => {
        expect(validateContent(), `${key} ${JSON.stringify(value)}`).toEqual([problem]);
      });
    };
    check('reform', { days: 0 }, 'chassis titan bad reform days');
    check('reform', { days: 1.5 }, 'chassis titan bad reform days');
    // The Titan leads 100; the Mother of Beasts leads 60.
    check(
      'monthlySummon',
      { unit: 'wolf', count: 101, cap: 200 },
      "chassis titan monthly summon exceeds its body's leadership",
    );
    check('role', 'idol', 'chassis titan is an idol exactly when its body is immobile');
    patched(CHASSIS.cinderIdol as ChassisDef, 'role', 'summoner', () => {
      expect(validateContent()).toEqual([
        'chassis cinderIdol is an idol exactly when its body is immobile',
      ]);
    });
    // The edges pass: a day, and a monthly summon of exactly the leadership.
    patched(titan, 'reform', { days: 1 }, () => {
      expect(validateContent()).toEqual([]);
    });
    patched(titan, 'monthlySummon', { unit: 'wolf', count: 100, cap: 100 }, () => {
      expect(validateContent()).toEqual([]);
    });
  });
});
