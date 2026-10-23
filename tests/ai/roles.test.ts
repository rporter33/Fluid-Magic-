// Commander roles for the AI (docs/08-ai.md; Phase 7 design "Roles", "Research"): one role per
// commander from content alone, the pretender's work from its body, and the split of mages into
// researchers and battle mages by the research personality, oldest first.
import { describe, expect, it } from 'vitest';
import { unitDef, type UnitTypeId } from '../../src/content';
import { CHASSIS, type ChassisDef } from '../../src/content/pretenders/chassis';
import { UNITS } from '../../src/content/units';
import { createPlan } from '../../src/ai/plan';
import {
  isAdeptTier,
  pretenderRole,
  roleOf,
  splitMages,
  unitRole,
  type PretenderRole,
  type Role,
} from '../../src/ai/roles';
import { createCommander } from '../../src/sim/commanders';
import { applyCommand } from '../../src/sim/commands';
import { patched } from '../content/patched';
import { commandersIn, redField } from '../sim/fixtures';

/** The role of every commander unit in content when a nation fields it. */
const ROLES: Record<string, Role> = {
  garrison: 'garrison',
  independentCaptain: 'summoned',
  cinderScout: 'scout',
  ashChieftain: 'leader',
  pyrePriest: 'priest',
  emberAdept: 'mage',
  cinderMagus: 'mage',
  salamander: 'summoned',
  thornScout: 'scout',
  wardenCaptain: 'leader',
  grovePriest: 'priest',
  saplingDruid: 'mage',
  elderDruid: 'mage',
  treant: 'summoned',
  oracle: 'summoned',
  titan: 'summoned',
  greatWyrm: 'summoned',
  livingMonolith: 'summoned',
  wildSpirit: 'summoned',
  ashColossus: 'summoned',
  ascendedHero: 'summoned',
  primordial: 'summoned',
  ashPhoenix: 'summoned',
  pyreLord: 'summoned',
  cinderIdol: 'summoned',
  emberHierophant: 'summoned',
  worldTree: 'summoned',
  hornedHunter: 'summoned',
  elderWyrm: 'summoned',
  motherOfBeasts: 'summoned',
};

/**
 * What each chassis does as the pretender, by its role tag (docs/05-pretender.md Step 1,
 * docs/08 step 10): idols cast rituals, the researching mage studies, the stealthy raider
 * hides, every other rides with an army after month 3.
 */
const PRETENDER_ROLES: Record<string, PretenderRole> = {
  oracle: 'researcher',
  titan: 'rider',
  greatWyrm: 'rider',
  livingMonolith: 'ritualist',
  ascendedHero: 'rider',
  primordial: 'rider',
  ashColossus: 'rider',
  ashPhoenix: 'rider',
  pyreLord: 'rider',
  cinderIdol: 'ritualist',
  emberHierophant: 'rider',
  wildSpirit: 'hidden',
  worldTree: 'ritualist',
  hornedHunter: 'rider',
  elderWyrm: 'rider',
  motherOfBeasts: 'rider',
};

const commanderUnits = (Object.keys(UNITS) as UnitTypeId[]).filter((u) => unitDef(u).commander);

describe('roleOf', () => {
  it('lists every commander unit in content', () => {
    expect(Object.keys(ROLES).sort()).toEqual([...commanderUnits].sort());
    expect(Object.keys(PRETENDER_ROLES).sort()).toEqual(Object.keys(CHASSIS).sort());
  });

  it("gives every commander unit its role in a nation's hands, from content alone", () => {
    const { state, red, capital } = redField();
    for (const unit of commanderUnits) {
      const c = createCommander(state, unit, red, capital);
      expect(roleOf(state, c), unit).toBe(ROLES[unit]);
      expect(unitRole(unitDef(unit)), unit).toBe(ROLES[unit]);
    }
  });

  it('gives the garrison holder, an independent, and a troop unit no working role', () => {
    const { state, capital } = redField();
    const holder = state.commanders[state.provinces[capital]!.garrison!]!;
    expect(roleOf(state, holder)).toBe('garrison');
    const independent = Object.values(state.commanders).find((c) => c.owner === null)!;
    expect(roleOf(state, independent)).toBe('other');
    expect(unitRole(unitDef('ashMilitia'))).toBeNull();
  });

  it("calls the nation's pretender a pretender, whatever its body", () => {
    const { state, red, capital } = redField();
    for (const id of Object.keys(CHASSIS) as (keyof typeof CHASSIS)[]) {
      const body = CHASSIS[id].body;
      const c = createCommander(state, body, red, capital);
      expect(roleOf(state, c), body).toBe('summoned');
      state.nations[red]!.pretenderId = c.id;
      state.nations[red]!.pretender = { ...state.nations[red]!.pretender, chassis: id };
      expect(roleOf(state, c), body).toBe('pretender');
      expect(pretenderRole(state, c), body).toBe(PRETENDER_ROLES[id]);
    }
  });

  it('reads the chassis’s role tag, not the body: a patched role changes the work', () => {
    const { state, red, capital } = redField();
    const titan = createCommander(state, 'titan', red, capital);
    state.nations[red]!.pretenderId = titan.id;
    state.nations[red]!.pretender = { ...state.nations[red]!.pretender, chassis: 'titan' };
    const chassis: ChassisDef = CHASSIS.titan;
    expect(pretenderRole(state, titan)).toBe('rider');
    for (const role of ['leader', 'fighter', 'monster', 'summoner', 'raider'] as const) {
      patched(chassis, 'role', role, () => {
        expect(pretenderRole(state, titan), role).toBe('rider');
      });
    }
    patched(chassis, 'role', 'idol', () => {
      expect(pretenderRole(state, titan)).toBe('ritualist');
    });
    // A mage researches only if its body may: the Titan's may not.
    patched(chassis, 'role', 'mage', () => {
      expect(pretenderRole(state, titan)).toBe('rider');
    });
  });

  it('keeps a prophet a priest', () => {
    const { state, red, capital } = redField();
    const priest = commandersIn(state, capital).find((c) => c.unit === 'pyrePriest')!;
    state.nations[red]!.prophetAvailableDay = 0;
    const named = applyCommand(state, { type: 'makeProphet', nation: red, commander: priest.id });
    expect(named).toEqual({ ok: true });
    expect(priest.holy).toBe(3);
    expect(roleOf(state, priest)).toBe('priest');
  });

  it('needs the leadership of a leader: a lesser plain commander fits no role', () => {
    const def = unitDef('ashChieftain');
    const traits = def.commander!;
    expect(unitRole({ ...def, commander: { ...traits, leadership: 59 } })).toBe('other');
    expect(unitRole({ ...def, commander: { ...traits, leadership: 60 } })).toBe('leader');
    expect(unitRole({ ...def, commander: { ...traits, holy: 1 } })).toBe('other');
    expect(unitRole({ ...def, commander: { ...traits, pips: { R: 1 } } })).toBe('other');
  });
});

describe('isAdeptTier', () => {
  it('marks the mages recruited only in the capital', () => {
    const adept = commanderUnits.filter((u) => isAdeptTier(unitDef(u)));
    expect(adept.sort()).toEqual(['cinderMagus', 'elderDruid']);
  });
});

describe('splitMages', () => {
  it('makes the oldest ceil(mages * research) researchers and the rest battle mages', () => {
    const { state, red, green, capital } = redField();
    const ids = (cs: readonly { id: string }[]) => cs.map((c) => c.id);
    const start = commandersIn(state, capital).find((c) => c.unit === 'emberAdept')!;
    // Cinder Horde researches at 0.4: one mage of one.
    expect(ids(splitMages(createPlan(state, red)).researchers)).toEqual([start.id]);
    const magus = createCommander(state, 'cinderMagus', red, capital);
    const adept = createCommander(state, 'emberAdept', red, capital);
    // Three: ceil(1.2) = 2 researchers, the oldest first.
    expect(splitMages(createPlan(state, red))).toEqual({
      researchers: [start, magus],
      battleMages: [adept],
    });
    // Priests, summons, and the other nation's mages are not mages of Red's.
    createCommander(state, 'salamander', red, capital);
    createCommander(state, 'pyrePriest', red, capital);
    createCommander(state, 'saplingDruid', green, capital);
    expect(ids(splitMages(createPlan(state, red)).battleMages)).toEqual([adept.id]);
    // Thornwood researches at 0.7: its starting mage and the one above both study; of four, three.
    expect(splitMages(createPlan(state, green)).researchers).toHaveLength(2);
    for (let i = 0; i < 2; i++) createCommander(state, 'saplingDruid', green, capital);
    expect(splitMages(createPlan(state, green)).researchers).toHaveLength(3);
    expect(splitMages(createPlan(state, green)).battleMages).toHaveLength(1);
  });
});
