// Commander roles for the AI (docs/08-ai.md; Phase 7 design "Roles", "Research"): one role per
// commander from content alone, the pretender's work from its body, and the split of mages into
// researchers and battle mages by the research personality, oldest first.
import { describe, expect, it } from 'vitest';
import { unitDef, type UnitTypeId } from '../../src/content';
import { CHASSIS } from '../../src/content/pretenders/chassis';
import { UNITS } from '../../src/content/units';
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
};

/** What each chassis body does as the pretender (docs/05-pretender.md, docs/08 priority 10). */
const PRETENDER_ROLES: Record<string, PretenderRole> = {
  oracle: 'researcher',
  titan: 'fighter',
  greatWyrm: 'fighter',
  livingMonolith: 'ritualist',
  wildSpirit: 'hidden',
  ashColossus: 'fighter',
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
    for (const body of Object.keys(CHASSIS) as UnitTypeId[]) {
      const c = createCommander(state, body, red, capital);
      expect(roleOf(state, c), body).toBe('summoned');
      state.nations[red]!.pretenderId = c.id;
      expect(roleOf(state, c), body).toBe('pretender');
      expect(pretenderRole(c), body).toBe(PRETENDER_ROLES[body]);
    }
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
    expect(ids(splitMages(state, red).researchers)).toEqual([start.id]);
    const magus = createCommander(state, 'cinderMagus', red, capital);
    const adept = createCommander(state, 'emberAdept', red, capital);
    // Three: ceil(1.2) = 2 researchers, the oldest first.
    expect(splitMages(state, red)).toEqual({ researchers: [start, magus], battleMages: [adept] });
    // Priests, summons, and the other nation's mages are not mages of Red's.
    createCommander(state, 'salamander', red, capital);
    createCommander(state, 'pyrePriest', red, capital);
    createCommander(state, 'saplingDruid', green, capital);
    expect(ids(splitMages(state, red).battleMages)).toEqual([adept.id]);
    // Thornwood researches at 0.7: its starting mage and the one above both study; of four, three.
    expect(splitMages(state, green).researchers).toHaveLength(2);
    for (let i = 0; i < 2; i++) createCommander(state, 'saplingDruid', green, capital);
    expect(splitMages(state, green).researchers).toHaveLength(3);
    expect(splitMages(state, green).battleMages).toHaveLength(1);
  });
});
