// Builds three real battles with the repo's sim (read-only imports) and exports each record plus
// its per-blow detail (docs/12 S1 sink) as compact JSON for the v4 battle mockup.
//
//   cd /home/user/Fluid-Magic- && npx tsx <this file> explore [a|b|c] [n]   # outcome survey over seeds
//   cd /home/user/Fluid-Magic- && npx tsx <this file> emit A B C           # write battles.json
//
// Nothing in the repo is written. The game state built here is a scratch GameState: armies are
// placed by hand (createCommander/createSquad, as tests do) and the battle is fought by the real
// conflict.fight(), which builds the setup with every modifier (terrain, storm, blessings),
// resolves it and stores the BattleRecord with its re-run. The re-run with the detail sink is
// then checked against the record (matchesRecord).
import { writeFileSync, readFileSync } from 'node:fs';
import { unitDef, type UnitTypeId } from '/home/user/Fluid-Magic-/src/content';
import { findPreset } from '/home/user/Fluid-Magic-/src/content/pretenders/presets';
import { BATTLE, RESEARCH_LEVEL_POINTS, STORM } from '/home/user/Fluid-Magic-/src/content/rules';
import { NATION_BANNERS } from '/home/user/Fluid-Magic-/src/content/colors';
import { createGame } from '/home/user/Fluid-Magic-/src/sim/createGame';
import { createCommander, createSquad, removeCommander } from '/home/user/Fluid-Magic-/src/sim/commanders';
import { attackersAt, fight, ownerForces } from '/home/user/Fluid-Magic-/src/sim/conflict';
import { settlePretender } from '/home/user/Fluid-Magic-/src/sim/pretender';
import { replaceGarrison } from '/home/user/Fluid-Magic-/src/sim/recruitment';
import { cyrb53 } from '/home/user/Fluid-Magic-/src/sim/hash';
import { matchesRecord, rerunBattle } from '/home/user/Fluid-Magic-/src/sim/battle/rerun';
import { foldReplay } from '/home/user/Fluid-Magic-/src/sim/battle/replay';
import type { DetailEvent } from '/home/user/Fluid-Magic-/src/sim/battle/detail';
import type { BattleEvent } from '/home/user/Fluid-Magic-/src/sim/battle/events';
import type { CommanderState, GameState, ScriptSlot } from '/home/user/Fluid-Magic-/src/sim/types';
import type { NationId, ProvinceId } from '/home/user/Fluid-Magic-/src/sim/ids';

const OUT = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/battle-data';
const PORTRAITS = '/home/user/Fluid-Magic-/src/assets/raster/portraits';

type Army = { leader: UnitTypeId; squads: [UnitTypeId, number][]; script?: ScriptSlot[]; mana?: Record<string, number> }[];
const attack: ScriptSlot[] = Array.from({ length: 5 }, () => ({ kind: 'attack' }));
const castThen = (first: string | null, rest: string | null = null): ScriptSlot[] => [
  { kind: 'cast', spellId: first },
  ...Array.from({ length: 4 }, () => ({ kind: 'cast' as const, spellId: rest })),
];

interface Spec {
  key: 'a' | 'b' | 'c';
  title: string;
  terrain: string;
  day: number;
  /** The player's nation index (0 cinder, 1 thornwood): the near side. */
  player: 0 | 1;
  attackerIdx: 0 | 1;
  storm: { wallsStanding: boolean } | null;
  pd: number;
  attacker: Army;
  defender: Army;
  /** Pretender rides with the side given (it leads the first army entry when the leader is 'pretender'). */
  research: { R: number; G: number };
}

const SPECS: Spec[] = [
  {
    key: 'a',
    title: 'The Wyrm at {p}',
    terrain: 'plains',
    day: 455, // month 4
    player: 0,
    attackerIdx: 0,
    storm: null,
    pd: 0,
    research: { R: 2, G: 3 },
    attacker: [
      { leader: 'ashChieftain', squads: [['cinderWarrior', 60], ['flameArcher', 40]] },
      { leader: 'ashChieftain', squads: [['ashMilitia', 50], ['berserker', 30]] },
      { leader: 'ashChieftain', squads: [['ashRider', 30], ['emberSkirmisher', 24]] },
      { leader: 'cinderMagus', squads: [], script: castThen('fireball') },
      { leader: 'pyrePriest', squads: [] },
    ],
    defender: [
      { leader: 'greatWyrm', squads: [], script: attack },
      { leader: 'wardenCaptain', squads: [['warden', 40], ['briarGuard', 30], ['longbowHunter', 40]] },
      { leader: 'elderDruid', squads: [], script: castThen('barkSkin', null) },
    ],
  },
  {
    key: 'b',
    title: 'The Storm of {p}',
    terrain: 'mountains',
    day: 345, // month 12: winter
    player: 1,
    attackerIdx: 1,
    storm: { wallsStanding: true },
    pd: 8,
    research: { R: 2, G: 3 },
    attacker: [
      { leader: 'treant', squads: [], script: attack },
      { leader: 'wardenCaptain', squads: [['warden', 50], ['briarGuard', 30], ['longbowHunter', 36]] },
      { leader: 'wardenCaptain', squads: [['wolfRider', 24], ['thornMilitia', 40]] },
      { leader: 'saplingDruid', squads: [], script: castThen('thornSpray') },
      { leader: 'grovePriest', squads: [] },
    ],
    defender: [
      { leader: 'ashChieftain', squads: [['cinderWarrior', 36], ['flameArcher', 30]] },
      { leader: 'emberAdept', squads: [], script: castThen('emberDart') },
      { leader: 'pyrePriest', squads: [] },
    ],
  },
  {
    key: 'c',
    title: 'The Fight in {p}',
    terrain: 'swamp',
    day: 520, // month 6
    player: 0,
    attackerIdx: 0,
    storm: null,
    pd: 0,
    research: { R: 2, G: 4 },
    attacker: [
      { leader: 'salamander', squads: [], script: attack },
      { leader: 'ashChieftain', squads: [['cinderWarrior', 40], ['flameArcher', 30], ['fireSprite', 15]] },
      { leader: 'ashChieftain', squads: [['emberSkirmisher', 24], ['flamebrand', 20]] },
      { leader: 'emberAdept', squads: [], script: castThen('emberDart') },
    ],
    defender: [
      { leader: 'wardenCaptain', squads: [['warden', 36], ['longbowHunter', 30], ['wolfRider', 20]] },
      { leader: 'elderDruid', squads: [], script: castThen('swarm', null), mana: { G: 1 } },
      { leader: 'saplingDruid', squads: [], script: castThen('thornSpray') },
    ],
  },
];

const NATIONS = ['cinderHorde', 'thornwood'] as const;

function makeGame(seed: number): GameState {
  return createGame({
    seed,
    mapSize: 'medium',
    nations: [
      { nation: 'cinderHorde', pretender: findPreset('warlord')!.design, ai: null },
      {
        nation: 'thornwood',
        pretender: findPreset('wyrmOfTheLoam')!.design,
        pretenderName: 'Ysmerach',
        ai: { difficulty: 'normal' },
      },
    ],
  });
}

function stage(spec: Spec, seed: number) {
  const state = makeGame(seed);
  const ids = Object.keys(state.nations) as NationId[];
  const nationOf = (i: 0 | 1) => ids[i]!;
  state.day = spec.day;
  for (const id of ids) {
    const n = state.nations[id]!;
    n.research.points.R = RESEARCH_LEVEL_POINTS[spec.research.R]!;
    n.research.points.G = RESEARCH_LEVEL_POINTS[spec.research.G]!;
  }
  // The province: an independent one on the terrain, handed to the defender.
  const p = Object.values(state.provinces).find(
    (q) => q.owner === null && state.map.provinces[q.id]!.terrain === spec.terrain,
  );
  if (!p) throw new Error(`no ${spec.terrain}`);
  for (const c of Object.values(state.commanders)) if (c.location === p.id) removeCommander(state, c.id);
  const defIdx = (1 - spec.attackerIdx) as 0 | 1;
  const attNation = nationOf(spec.attackerIdx);
  const defNation = nationOf(defIdx);
  p.owner = defNation;
  p.pd = spec.pd;
  if (spec.storm) {
    if (!p.buildings.includes('fort')) p.buildings.push('fort');
    replaceGarrison(state, p.id);
  }
  const place = (army: Army, owner: NationId) => {
    const out: CommanderState[] = [];
    for (const a of army) {
      let c: CommanderState;
      if (a.leader === 'greatWyrm') {
        settlePretender(state, owner);
        const pid = state.nations[owner]!.pretenderId;
        if (pid === null) throw new Error('no pretender');
        c = state.commanders[pid]!;
        c.location = p.id;
      } else {
        c = createCommander(state, a.leader, owner, p.id);
      }
      if (a.script) c.script = a.script.map((s) => ({ ...s }));
      if (a.mana) c.carriedMana = { ...a.mana };
      for (const [u, n] of a.squads) c.squads.push(createSquad(state, u, n));
      out.push(c);
    }
    return out;
  };
  place(spec.attacker, attNation);
  place(spec.defender, defNation);
  return { state, p: p.id as ProvinceId, attNation, defNation };
}

function run(spec: Spec, seed: number) {
  const { state, p, attNation, defNation } = stage(spec, seed);
  const pretenderRefs = new Set(Object.values(state.nations).map((n) => n.pretenderId).filter((x): x is string => x !== null));
  const att = attackersAt(state, p, attNation);
  const def = ownerForces(state, p);
  fight(state, p, att, def, spec.storm);
  const record = state.battles[state.battles.length - 1]!;
  return { state, record, attNation, defNation, province: p, pretenderRefs };
}

function summary(record: ReturnType<typeof run>['record']) {
  const kills: Record<string, number> = {};
  let routs = 0;
  let casts = 0;
  let deaths = 0;
  const cmdDmg: Record<string, number> = {};
  const dead: string[] = [];
  const unitOf = (ref: string) => {
    for (const s of ['attacker', 'defender'] as const) {
      const c = record.roster[s].commanders.find((x) => x.ref === ref);
      if (c) return c.unit + ':' + s[0];
      const q = record.roster[s].squads.find((x) => x.ref === ref);
      if (q) return q.unit + ':' + s[0];
    }
    return ref;
  };
  for (const e of record.replay) {
    if (e.kind === 'volley' || e.kind === 'melee') kills[e.squad] = (kills[e.squad] ?? 0) + e.kills;
    if (e.kind === 'damage' && e.by) cmdDmg[e.by] = (cmdDmg[e.by] ?? 0) + e.amount;
    if (e.kind === 'rout') routs++;
    if (e.kind === 'cast') casts++;
    if (e.kind === 'death') { deaths++; dead.push(unitOf(e.commander)); }
  }
  const start = (s: 'attacker' | 'defender') => record.roster[s].squads.reduce((a, q) => a + q.count, 0);
  const k2: Record<string, number> = {};
  for (const [r, v] of Object.entries(kills)) k2[unitOf(r)] = (k2[unitOf(r)] ?? 0) + v;
  return { winner: record.winner, rounds: record.rounds, startA: start('attacker'), startD: start('defender'), routs, casts, deaths, dead, kills: k2 };
}

// ---- export ----

const PHASES = ['scripts', 'ranged', 'melee', 'morale', 'end'] as const;
const CAUSES = ['losses', 'shock', 'commanderDeath'] as const;

function portraitFor(seed: number, ref: string, nation: string | null, unit: string): string | null {
  const dir = nation === null ? `${PORTRAITS}/independent/independentCaptain-levy` : `${PORTRAITS}/${nation}/${unit}`;
  let files: string[];
  try {
    files = require('node:fs').readdirSync(dir).filter((f: string) => /^\d\d-64\.webp$/.test(f));
  } catch {
    return null;
  }
  // a set is used only when complete: 8 for national commanders, 4 for summons (the approved sets)
  if (files.length < (unitDef(unit as UnitTypeId).size >= 3 ? 4 : 8)) return null;
  // docs/09 identity: the game seed and the commander id pick the face, by rendezvous.
  let best = '';
  let bestH = '';
  for (const f of files) {
    const h = cyrb53(`${seed}:${ref}:portrait:${f.slice(0, 2)}`);
    if (h > bestH) { bestH = h; best = f; }
  }
  return 'data:image/webp;base64,' + readFileSync(`${dir}/${best}`).toString('base64');
}

// Presentation-only personal names (docs/09 "Commanders carry personal names"); not sim state.
const NAME_PARTS: Record<string, string[]> = {
  cinderHorde: ['Varo', 'Kesh', 'Ardun', 'Mazra', 'Tolvek', 'Ishka', 'Drenn', 'Sul', 'Haruk', 'Orsa'],
  thornwood: ['Elowen', 'Bram', 'Sorrel', 'Hawthen', 'Alder', 'Linnet', 'Rowan', 'Tamsin', 'Fenna', 'Oswy'],
};

function emit(spec: Spec, seed: number) {
  const { state, record, attNation, defNation, province, pretenderRefs } = run(spec, seed);
  if (!record.rerun) throw new Error('no rerun');
  const detail: DetailEvent[] = [];
  const result = rerunBattle(record.rerun, detail);
  const matches = matchesRecord(result, record);
  if (!matches) throw new Error('rerun mismatch');
  const setup = record.rerun.setup;
  const nationDefOf = (n: NationId | null) => (n === null ? null : state.nations[n]!.def);
  // groups: roster squads and commanders, then summons as they appear
  type G = Record<string, unknown> & { ref: string };
  const groups: G[] = [];
  const index = new Map<string, number>();
  // the pretenders as the battle began (a god that died here is no longer the nation's pretenderId)
  const pretenderIds = pretenderRefs;
  const usedNames = new Set<string>();
  for (const side of ['attacker', 'defender'] as const) {
    const s = setup[side];
    const nat = nationDefOf(s.nation);
    for (const c of s.commanders) {
      const def = unitDef(c.unit);
      let personal: string | null = null;
      if (!pretenderIds.has(c.ref) && nat && def.size <= 2) {
        const list = NAME_PARTS[nat]!;
        let k = parseInt(cyrb53(`${seed}:${c.ref}:name`).slice(-6), 16) % list.length;
        while (usedNames.has(list[k]!)) k = (k + 1) % list.length;
        usedNames.add(list[k]!);
        personal = list[k]!;
      }
      index.set(c.ref, groups.length);
      groups.push({
        ref: c.ref, side, cmd: 1, unit: c.unit, unitName: def.name, name: c.name, personal,
        pretender: pretenderIds.has(c.ref) ? 1 : 0, start: 1, row: c.row, hp: c.hp, maxHp: def.hp,
        size: c.stats.size, speed: c.stats.mapSpeed, tags: c.stats.tags, mor: c.stats.mor, prot: c.stats.prot, def: c.stats.def,
        weapons: c.stats.weapons.map((w) => ({ name: w.name, dmg: w.dmg, range: w.range ?? 0, ammo: w.ammo ?? 0 })),
        leader: null, spells: c.spells, script: c.script,
        portrait: portraitFor(seed, c.ref, nat, c.unit),
      });
    }
    for (const q of s.squads) {
      const def = unitDef(q.unit);
      index.set(q.ref, groups.length);
      groups.push({
        ref: q.ref, side, cmd: 0, unit: q.unit, unitName: def.name, name: def.name, personal: null, pretender: 0,
        start: q.count, row: q.row, hp: q.hp, maxHp: def.hp, size: q.stats.size, speed: q.stats.mapSpeed, tags: q.stats.tags,
        mor: q.stats.mor, prot: q.stats.prot, def: q.stats.def,
        weapons: q.stats.weapons.map((w) => ({ name: w.name, dmg: w.dmg, range: w.range ?? 0, ammo: w.ammo ?? 0 })),
        leader: q.commander, pd: q.ref.startsWith('pd') ? 1 : 0, bound: q.bound ? 1 : 0,
      });
    }
  }
  for (const e of record.replay) {
    if (e.kind === 'summon' && !index.has(e.squad)) {
      const def = unitDef(e.unit);
      const st = setup[e.side].summons[e.unit];
      index.set(e.squad, groups.length);
      groups.push({
        ref: e.squad, side: e.side, cmd: 0, unit: e.unit, unitName: def.name, name: def.name, personal: null,
        pretender: 0, start: e.count, row: e.row, hp: e.hp, maxHp: def.hp, size: def.size, speed: st?.mapSpeed ?? def.mapSpeed, tags: st?.tags ?? def.tags,
        mor: st?.mor ?? def.mor, prot: st?.prot ?? def.prot, def: st?.def ?? def.def,
        weapons: (st?.weapons ?? def.weapons).map((w) => ({ name: w.name, dmg: w.dmg, range: w.range ?? 0, ammo: w.ammo ?? 0 })),
        leader: e.commander, summoned: 1,
      });
    }
  }
  const gi = (ref: string) => {
    const i = index.get(ref);
    if (i === undefined) throw new Error(`unknown ref ${ref}`);
    return i;
  };
  const ph = (p: string) => PHASES.indexOf(p as (typeof PHASES)[number]);
  // detail, compact
  const d = detail.map((e) => {
    switch (e.kind) {
      case 'strike':
        return ['s', e.at, e.round, ph(e.phase), gi(e.attacker), e.attackerMember, e.weapon, gi(e.target), e.targetMember,
          e.hit ? 1 : 0, e.landing ? (e.landing.killed ? 1 : 0) : 0, e.landing?.dealt ?? 0, e.landing?.hpBefore ?? -1,
          e.damage?.rolled ?? -1, e.berserk ? 1 : 0, e.firstRound ? 1 : 0, e.attack, e.attackDrn, e.defense, e.defenseDrn];
      case 'spellHit':
        return ['h', e.at, e.round, ph(e.phase), gi(e.caster), e.spell, e.effect, e.element, gi(e.target), e.targetMember,
          e.landing.killed ? 1 : 0, e.landing.dealt, e.landing.hpBefore];
      case 'burn':
        return ['b', e.at, e.round, ph(e.phase), gi(e.unit), e.member, e.element, gi(e.shield), e.owed,
          e.landing.killed ? 1 : 0, e.landing.dealt, e.landing.hpBefore];
      case 'drain':
        return ['d', e.at, e.round, ph(e.phase), gi(e.unit), e.member, e.gained];
      case 'morale':
        return ['m', e.at, e.round, ph(e.phase), gi(e.group), CAUSES.indexOf(e.cause), e.roll.morale, e.roll.moraleDrn,
          e.roll.target, e.roll.targetDrn, e.roll.pressure, e.roll.broke ? 1 : 0];
      case 'engage':
        return ['e', e.at, e.round, ph(e.phase), e.fronts.attacker, e.fronts.defender, e.contact.map(gi)];
    }
  });
  // folds at every phase end: the state after the last event of each phase span
  const folds: { at: number; round: number; phase: string; units: Record<string, [number, number, number, number]> }[] = [];
  let round = 0;
  let phase = '';
  const ev: BattleEvent[] = record.replay;
  const flush = (at: number) => {
    if (phase === '') return;
    const st = foldReplay(record.roster, ev.slice(0, at));
    const units: Record<string, [number, number, number, number]> = {};
    for (const [ref, u] of st) units[ref] = [u.count, u.hp, u.routing ? 1 : 0, u.gone ? 1 : 0];
    folds.push({ at, round, phase, units });
  };
  ev.forEach((e, i) => {
    if (e.kind === 'roundStart' || e.kind === 'phase' || e.kind === 'battleEnd') {
      flush(i);
      if (e.kind === 'roundStart') { round = e.round; phase = ''; }
      if (e.kind === 'phase') phase = e.phase;
      if (e.kind === 'battleEnd') phase = '';
    }
  });
  const nat = (n: NationId | null) => {
    const def = nationDefOf(n);
    return def === null
      ? { id: null, def: null, name: 'Independents', banner: '#8C8A80' }
      : { id: n, def, name: state.nations[n!]!.def === 'cinderHorde' ? 'Cinder Horde' : 'Thornwood', banner: def === 'cinderHorde' ? NATION_BANNERS.R[0] : NATION_BANNERS.G[0] };
  };
  const month = (Math.floor(record.day / 30) % 12) + 1;
  const near = record.attacker === state.nations[(Object.keys(state.nations) as NationId[])[spec.player]!]!.id ? 'attacker' : 'defender';
  const provinceName = state.map.provinces[province]!.name;
  const out = {
    key: spec.key, title: spec.title.replace('{p}', provinceName), seed, id: record.id, day: record.day, month, province: provinceName,
    terrain: record.scene.terrain, storm: record.scene.storm, winner: record.winner, rounds: record.rounds,
    nearSide: near,
    sides: { attacker: nat(record.attacker), defender: nat(record.defender) },
    rerunMatches: matches,
    groups, replay: record.replay.map((e) => {
      // refs → indices in the compact export
      const x: Record<string, unknown> = { ...e };
      for (const k of ['squad', 'target', 'caster', 'unit', 'commander', 'by']) {
        if (typeof x[k] === 'string' && index.has(x[k] as string)) x[k] = gi(x[k] as string);
      }
      if (Array.isArray(x.targets)) x.targets = (x.targets as string[]).map(gi);
      return x;
    }),
    detail: d, folds: folds.map((f) => ({ at: f.at, round: f.round, phase: f.phase, units: Object.fromEntries(Object.entries(f.units).map(([r, v]) => [gi(r), v])) })),
    end: Object.fromEntries([...foldReplay(record.roster, record.replay)].map(([r, u]) => [gi(r), [u.count, u.hp, u.routing ? 1 : 0, u.gone ? 1 : 0]])),
    summary: summary(record),
    rules: { closingRound: BATTLE.closingRound, flyingSpeed: BATTLE.flyingSpeed, rearReach: BATTLE.rearReach, morale: BATTLE.morale, toHit: BATTLE.ranged.toHit, storm: STORM },
  };
  void attNation; void defNation;
  return out;
}

const [mode, ...args] = process.argv.slice(2);
if (mode === 'explore') {
  const which = args[0] ?? 'a';
  const n = Number(args[1] ?? 12);
  const spec = SPECS.find((s) => s.key === which)!;
  for (let seed = 1; seed <= n; seed++) {
    try {
      const { record } = run(spec, seed);
      console.log(seed, JSON.stringify(summary(record)));
    } catch (e) {
      console.log(seed, 'ERR', (e as Error).message);
    }
  }
} else if (mode === 'casts') {
  const spec = SPECS.find((s) => s.key === args[0])!;
  const { record } = run(spec, Number(args[1]));
  for (const e of record.replay) if (e.kind === 'cast' || e.kind === 'summon' || e.kind === 'field' || e.kind === 'ability') console.log(JSON.stringify(e));
  const setup = record.rerun!.setup;
  for (const s of ['attacker', 'defender'] as const) for (const c of setup[s].commanders) console.log(s, c.ref, c.unit, JSON.stringify(c.pips), c.spells.join(','), JSON.stringify(c.script));
} else if (mode === 'emit') {
  const seeds = args.map(Number);
  const battles = SPECS.map((s, i) => emit(s, seeds[i] ?? 1));
  writeFileSync(`${OUT}/battles.json`, JSON.stringify(battles));
  for (const b of battles) {
    console.log(b.key, b.title, b.province, b.terrain, 'month', b.month, 'storm', JSON.stringify(b.storm), 'winner', b.winner,
      'rounds', b.rounds, 'rerunMatches', b.rerunMatches, 'groups', b.groups.length, 'detail', b.detail.length,
      'bytes', JSON.stringify(b).length);
  }
}
