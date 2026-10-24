// Saves for the save and load tests (migrate, serialize and validateSave): a game with a recorded
// battle as JSON brings it back, the same save as each older version held it, and games the sim
// and the AI have played, with a human nation so that its battles are recorded.
import { runAi } from '../../src/ai/ai';
import { playDay } from '../../src/ai/driver';
import { runnerSetup } from '../../src/ai/match';
import { applyCommand } from '../../src/sim/commands';
import { attackersAt, fight, ownerForces } from '../../src/sim/conflict';
import { createGame } from '../../src/sim/createGame';
import { newId, type CommanderId, type NationId, type ProvinceId } from '../../src/sim/ids';
import type { GameState, NationState } from '../../src/sim/types';
import { neighbors, redField } from './fixtures';

/** Removes from a save what the given version and later ones added, as an older save lacks it. */
export function asVersion(saved: GameState, version: 1 | 2 | 3): GameState {
  const old = structuredClone(saved);
  old.version = version;
  const map: Partial<typeof old.map> = old.map;
  delete map.wilds;
  if (version === 3) return old;
  for (const n of Object.values(old.nations)) {
    const o: Partial<NationState> = n;
    delete o.pretenderName;
    delete o.pretenderReturnDay;
  }
  for (const p of Object.values(old.provinces)) {
    const o: Partial<typeof p> = p;
    delete o.extraSprings;
  }
  if (version === 1) {
    for (const b of old.battles) {
      const o: Partial<typeof b> = b;
      delete o.scene;
      delete o.rerun;
    }
  }
  return old;
}

/**
 * A saved game with one recorded battle, as JSON would bring it back. Its map has no wilds unless
 * `wilds`: the saves of versions 1 to 3 it stands for were made before wilds existed.
 */
export function savedWithBattle(wilds = false): GameState {
  const { state, red, capital, army } = redField(1, wilds);
  army.squads[0]!.count = 60;
  army.squads[0]!.hp = 60 * 11;
  const target = neighbors(state, capital)[0]!;
  army.location = target;
  fight(state, target, attackersAt(state, target, red), ownerForces(state, target));
  return JSON.parse(JSON.stringify(state)) as GameState;
}

/** Whether the game has ended; read through a call, as playDay may have just ended it. */
const over = (state: GameState): boolean => state.result !== null;

/**
 * A runner game whose first nation is played as a human would be: it has no AI, so its battles
 * are recorded with their re-runs, and runAi gives its commands on the AI's planning days.
 * `visit` sees the state after every `every` days, and once more at the end.
 */
export function playedWithHuman(
  seed: number,
  days: number,
  every: number,
  visit: (state: GameState) => void,
): GameState {
  const state = createGame(runnerSetup(seed, 0));
  const human = Object.keys(state.nations)[0] as NationId;
  state.nations[human]!.ai = null;
  while (!state.result && state.day < days) {
    playDay(state, runAi);
    if (!over(state) && state.day % 5 === 0) {
      for (const command of runAi(state, human)) applyCommand(state, command);
    }
    if (state.day % every === 0) visit(state);
  }
  visit(state);
  return state;
}

/** Where richSave put its records. */
export interface RichIds {
  red: NationId;
  green: NationId;
  capital: ProvinceId;
  near: ProvinceId;
  far: ProvinceId;
  army: CommanderId;
  mage: CommanderId;
  priest: CommanderId;
}

/**
 * A current save holding one of every record a save can hold, each well formed: a recorded
 * battle, a construction, a recruit order, a siege, a commander on the march, a ritual under way,
 * a cast slot, a timed effect, blessings and a boon, and a result.
 */
export function richSave(): { save: GameState; ids: RichIds } {
  const s = savedWithBattle(true);
  const [red, green] = Object.keys(s.nations) as [NationId, NationId];
  const nation = s.nations[red]!;
  const capital = s.provinces[nation.capital]!;
  const army = Object.values(s.commanders).find((c) => c.owner === red && c.squads.length > 0)!;
  const mage = Object.values(s.commanders).find((c) => c.owner === red && c.unit === 'emberAdept')!;
  const priest = Object.values(s.commanders).find(
    (c) => c.owner === red && c.unit === 'pyrePriest',
  )!;
  const [near, far] = neighbors(s, nation.capital) as [ProvinceId, ProvinceId];
  capital.construction = { building: 'lab', daysLeft: 3, nation: red, commander: priest.id };
  capital.recruitQueue.push({
    id: newId(s, 'recruit'),
    unit: 'ashMilitia',
    count: 5,
    nation: red,
    daysLeft: 4,
    paid: { gold: 25, materials: 0 },
  });
  s.provinces[far]!.siege = { attacker: green, wallHp: 120, storm: false };
  army.transit = { from: nation.capital, to: near, progress: 1, totalDays: 3 };
  army.order = { kind: 'move', path: [far], mapSpeed: 1 };
  mage.order = { kind: 'castRitual', spellId: 'burnTheFields', target: far, daysLeft: 6 };
  mage.script[0] = { kind: 'cast', spellId: 'fireball' };
  priest.order = { kind: 'build', building: 'lab', province: nation.capital };
  s.provinceEffects.push({
    id: newId(s, 'effect'),
    province: near,
    nation: red,
    source: 'fertileSeason',
    untilDay: s.day + 90,
    kind: 'growth',
    deltaScale: 2,
  });
  nation.pretender.blessings = ['flamingWeapons'];
  nation.pretender.boons = [{ id: 'sacredSpring', color: 'R' }];
  s.result = { day: s.day, winner: red, reason: 'wellsprings' };
  const ids = { red, green, capital: nation.capital, near, far };
  return { save: s, ids: { ...ids, army: army.id, mage: mage.id, priest: priest.id } };
}
