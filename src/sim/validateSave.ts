// The check a loaded save passes after its migration, before anything uses it
// (docs/06-architecture.md, "Save and load"): every required key present (saveKeys.ts), every id
// reference resolving, and color keys and values only W U B R G. It only reads, so a save that
// passes hashes as it was saved. Three links outlive what they name by design and need only be
// well-formed ids: a message's battle (records are kept to BATTLE.keep), a construction's builder
// (it may die before the work ends) and a nation's sightings (refreshed each day before the
// eliminations, so a fallen nation's commanders stay there until the next day). A battle record's
// links into the game are checked; its roster and log belong to the replay viewer, and loading is
// lenient about replays.
import { isBuildingId, isNationDefId, isUnitTypeId } from '../content';
import { DIFFICULTIES } from '../content/ai';
import { isBlessingId } from '../content/pretenders/blessings';
import { isBoonId } from '../content/pretenders/boons';
import { isChassisId } from '../content/pretenders/chassis';
import { SCALE_AXES } from '../content/pretenders/scales';
import { isSpellId } from '../content/spells';
import { isTerrainId } from '../content/terrain';
import { isObj, SaveCheck, type Obj, type SaveProblem } from './saveCheck';
import { EFFECT_KEYS, KEYS, ORDER_KEYS, SLOT_KEYS } from './saveKeys';

export type { SaveProblem, SaveProblemKind } from './saveCheck';

const isScaleAxis = (v: unknown) =>
  typeof v === 'string' && (SCALE_AXES as readonly string[]).includes(v);
const isDifficulty = (v: unknown) => typeof v === 'string' && Object.hasOwn(DIFFICULTIES, v);

/** The ids each kind of reference must name. */
interface Ids {
  map: ReadonlySet<string>;
  provinces: ReadonlySet<string>;
  nations: ReadonlySet<string>;
  commanders: ReadonlySet<string>;
}

function checkMap(
  c: SaveCheck,
  ids: Ids,
  map: Obj | null,
  provinces: readonly [string, Obj][],
): void {
  if (map === null) return;
  for (const [key, p] of provinces) {
    const at = `map.provinces.${key}`;
    c.content(`${at}.terrain`, p.terrain, isTerrainId, 'terrain');
    c.refs(`${at}.neighbors`, p.neighbors, ids.map);
    c.colors(`${at}.springs`, p.springs);
    const step =
      p.wellspring === undefined ? null : c.record(`${at}.wellspring`, p.wellspring, KEYS.step);
    c.content(`${at}.wellspring.axis`, step?.axis, isScaleAxis, 'scale axis');
  }
  c.refs('map.capitals', map.capitals, ids.map);
  c.refs('map.wellsprings', map.wellsprings, ids.map);
  c.list('map.wilds', map.wilds).forEach((value, i) => {
    const at = `map.wilds[${String(i)}]`;
    const wild = c.record(at, value, KEYS.wild);
    c.weak(`${at}.id`, wild?.id, 'wild');
    c.refs(`${at}.borders`, wild?.borders, ids.map);
  });
}

function checkProvinces(c: SaveCheck, ids: Ids, value: unknown): void {
  for (const [key, p] of c.table('provinces', value, KEYS.province)) {
    const at = `provinces.${key}`;
    if (!ids.map.has(key)) c.report('reference', `${at} is no province of the map`);
    c.ref(`${at}.owner`, p.owner, ids.nations, true);
    c.contents(`${at}.buildings`, p.buildings, isBuildingId, 'building');
    const job = c.maybe(`${at}.construction`, p.construction, KEYS.construction);
    c.content(`${at}.construction.building`, job?.building, isBuildingId, 'building');
    c.ref(`${at}.construction.nation`, job?.nation, ids.nations);
    c.weak(`${at}.construction.commander`, job?.commander, 'commander', true);
    c.list(`${at}.recruitQueue`, p.recruitQueue).forEach((item, i) => {
      const where = `${at}.recruitQueue[${String(i)}]`;
      const order = c.record(where, item, KEYS.recruit);
      c.weak(`${where}.id`, order?.id, 'recruit');
      c.content(`${where}.unit`, order?.unit, isUnitTypeId, 'unit');
      c.ref(`${where}.nation`, order?.nation, ids.nations);
    });
    c.ref(`${at}.garrison`, p.garrison, ids.commanders, true);
    const dominion = c.record(`${at}.dominion`, p.dominion, KEYS.dominion);
    c.ref(`${at}.dominion.nation`, dominion?.nation, ids.nations, true);
    const siege = c.maybe(`${at}.siege`, p.siege, KEYS.siege);
    c.ref(`${at}.siege.attacker`, siege?.attacker, ids.nations);
    c.ref(`${at}.wellspringClaimedBy`, p.wellspringClaimedBy, ids.nations, true);
    c.colors(`${at}.extraSprings`, p.extraSprings);
  }
  for (const key of ids.map) {
    if (!ids.provinces.has(key))
      c.report('reference', `provinces has no ${key}, a province of the map`);
  }
}

function checkDesign(c: SaveCheck, at: string, value: unknown): void {
  const design = c.record(at, value, KEYS.design);
  if (design === null) return;
  c.content(`${at}.chassis`, design.chassis, isChassisId, 'chassis');
  c.byColor(`${at}.pips`, design.pips, false);
  c.contents(`${at}.blessings`, design.blessings, isBlessingId, 'blessing');
  c.list(`${at}.boons`, design.boons).forEach((item, i) => {
    const where = `${at}.boons[${String(i)}]`;
    const boon = c.record(where, item, ['id']);
    c.content(`${where}.id`, boon?.id, isBoonId, 'boon');
    if (boon?.id === 'sacredSpring') {
      c.record(where, boon, ['color']);
      c.color(`${where}.color`, boon.color);
    }
  });
}

function checkNations(c: SaveCheck, ids: Ids, value: unknown): void {
  for (const [key, n] of c.table('nations', value, KEYS.nation)) {
    const at = `nations.${key}`;
    c.content(`${at}.def`, n.def, isNationDefId, 'nation');
    c.colors(`${at}.colors`, n.colors);
    c.ref(`${at}.capital`, n.capital, ids.provinces);
    const ai = c.maybe(`${at}.ai`, n.ai, KEYS.ai);
    c.content(`${at}.ai.difficulty`, ai?.difficulty, isDifficulty, 'difficulty');
    const memory = c.record(`${at}.ai.memory`, ai?.memory, KEYS.aiMemory);
    c.ref(`${at}.ai.memory.target`, memory?.target, ids.provinces, true);
    c.byColor(`${at}.mana`, n.mana, true);
    const research = c.record(`${at}.research`, n.research, KEYS.research);
    c.color(`${at}.research.color`, research?.color);
    c.byColor(`${at}.research.points`, research?.points, true);
    checkDesign(c, `${at}.pretender`, n.pretender);
    c.ref(`${at}.pretenderId`, n.pretenderId, ids.commanders, true);
    c.ref(`${at}.prophetId`, n.prophetId, ids.commanders, true);
    c.refs(`${at}.explored`, n.explored, ids.provinces);
    c.list(`${at}.inSight`, n.inSight).forEach((id, i) => {
      c.weak(`${at}.inSight[${String(i)}]`, id, 'commander');
    });
    const stats = c.record(`${at}.stats`, n.stats, KEYS.stats);
    c.byColor(`${at}.stats.manaSpent`, stats?.manaSpent, true);
  }
}

function checkCommanders(c: SaveCheck, ids: Ids, value: unknown): void {
  for (const [key, commander] of c.table('commanders', value, KEYS.commander)) {
    const at = `commanders.${key}`;
    c.content(`${at}.unit`, commander.unit, isUnitTypeId, 'unit');
    c.ref(`${at}.owner`, commander.owner, ids.nations, true);
    c.ref(`${at}.location`, commander.location, ids.provinces);
    const transit = c.maybe(`${at}.transit`, commander.transit, KEYS.transit);
    c.ref(`${at}.transit.from`, transit?.from, ids.provinces);
    c.ref(`${at}.transit.to`, transit?.to, ids.provinces);
    c.ref(`${at}.cameFrom`, commander.cameFrom, ids.provinces, true);
    c.list(`${at}.squads`, commander.squads).forEach((item, i) => {
      const where = `${at}.squads[${String(i)}]`;
      const squad = c.record(where, item, KEYS.squad);
      c.weak(`${where}.id`, squad?.id, 'squad');
      c.content(`${where}.unit`, squad?.unit, isUnitTypeId, 'unit');
    });
    const order = c.kinded(`${at}.order`, commander.order, ORDER_KEYS);
    if (order?.kind === 'move') c.refs(`${at}.order.path`, order.path, ids.provinces);
    if (order?.kind === 'castRitual') {
      c.content(`${at}.order.spellId`, order.spellId, isSpellId, 'spell');
      c.ref(`${at}.order.target`, order.target, ids.provinces, true);
    }
    if (order?.kind === 'build') {
      c.content(`${at}.order.building`, order.building, isBuildingId, 'building');
      c.ref(`${at}.order.province`, order.province, ids.provinces);
    }
    c.list(`${at}.script`, commander.script).forEach((item, i) => {
      const where = `${at}.script[${String(i)}]`;
      const slot = c.kinded(where, item, SLOT_KEYS);
      if (slot?.kind === 'cast')
        c.content(`${where}.spellId`, slot.spellId, isSpellId, 'spell', true);
    });
    c.byColor(`${at}.pips`, commander.pips, false);
    c.byColor(`${at}.carriedMana`, commander.carriedMana, false);
  }
}

function checkBattles(c: SaveCheck, ids: Ids, value: unknown): void {
  c.list('battles', value).forEach((item, i) => {
    const at = `battles[${String(i)}]`;
    const battle = c.record(at, item, KEYS.battle);
    if (battle === null) return;
    c.weak(`${at}.id`, battle.id, 'battle');
    c.ref(`${at}.province`, battle.province, ids.map);
    c.ref(`${at}.attacker`, battle.attacker, ids.nations, true);
    c.ref(`${at}.defender`, battle.defender, ids.nations, true);
    const scene = c.record(`${at}.scene`, battle.scene, KEYS.scene);
    c.content(`${at}.scene.terrain`, scene?.terrain, isTerrainId, 'terrain');
    const roster = c.record(`${at}.roster`, battle.roster, KEYS.sides);
    for (const side of KEYS.sides) {
      const r = c.record(`${at}.roster.${side}`, roster?.[side], KEYS.roster);
      c.ref(`${at}.roster.${side}.nation`, r?.nation, ids.nations, true);
      c.list(`${at}.roster.${side}.commanders`, r?.commanders);
      c.list(`${at}.roster.${side}.squads`, r?.squads);
    }
    c.list(`${at}.replay`, battle.replay);
  });
}

function checkLog(c: SaveCheck, ids: Ids, game: Obj): void {
  c.list('messages', game.messages).forEach((item, i) => {
    const at = `messages[${String(i)}]`;
    const message = c.record(at, item, KEYS.message);
    c.weak(`${at}.id`, message?.id, 'message');
    c.ref(`${at}.nation`, message?.nation, ids.nations);
    c.ref(`${at}.province`, message?.province, ids.provinces, true);
    c.weak(`${at}.battle`, message?.battle, 'battle', true);
  });
  c.list('provinceEffects', game.provinceEffects).forEach((item, i) => {
    const at = `provinceEffects[${String(i)}]`;
    const effect = c.kinded(at, item, EFFECT_KEYS, KEYS.effect);
    c.weak(`${at}.id`, effect?.id, 'effect');
    c.ref(`${at}.province`, effect?.province, ids.provinces);
    c.ref(`${at}.nation`, effect?.nation, ids.nations);
    c.content(`${at}.source`, effect?.source, isSpellId, 'spell');
  });
  const result = c.maybe('result', game.result, KEYS.result);
  c.ref('result.winner', result?.winner, ids.nations, true);
}

const keysOfTable = (value: unknown): ReadonlySet<string> =>
  new Set(isObj(value) ? Object.keys(value) : []);

/**
 * Everything wrong with a save, in the order found: empty when it may be handed to the game.
 * Never throws, whatever `save` holds.
 */
export function saveProblems(save: unknown): SaveProblem[] {
  const c = new SaveCheck();
  const game = c.record('the save', save, KEYS.game);
  if (game === null) {
    if (save === undefined) c.report('shape', 'the save is empty');
    return c.problems;
  }
  c.record('rng', game.rng, KEYS.rng);
  const map = c.record('map', game.map, KEYS.map);
  const mapProvinces = c.table('map.provinces', map?.provinces, KEYS.mapProvince);
  const ids: Ids = {
    map: new Set(mapProvinces.map(([key]) => key)),
    provinces: keysOfTable(game.provinces),
    nations: keysOfTable(game.nations),
    commanders: keysOfTable(game.commanders),
  };
  checkMap(c, ids, map, mapProvinces);
  checkProvinces(c, ids, game.provinces);
  checkNations(c, ids, game.nations);
  checkCommanders(c, ids, game.commanders);
  checkBattles(c, ids, game.battles);
  checkLog(c, ids, game);
  return c.problems;
}
