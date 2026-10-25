import { unitDef } from '/home/user/fm-godless/src/content';
import { commander, side, squad, fightOnce } from '/home/user/fm-godless/tests/sim/battle/fixtures';
import { spellDef } from '/home/user/fm-godless/src/content/spells';
import type { BattleSpellDef } from '/home/user/fm-godless/src/content/spells/types';
import { gzipSync } from "node:zlib";
import type { BattleEvent } from '/home/user/fm-godless/src/sim/battle/events';

const sp = (id: string) => spellDef(id as never) as BattleSpellDef;
const cast = (id: string | null) => ({ kind: 'cast' as const, spellId: id });

function small() {
  const a = side(
    [squad('a1', 'cinderWarrior', 20, { leader: 'ac' }), squad('a2', 'flameArcher', 10, { leader: 'ac' })],
    [
      commander('ac', 'ashChieftain'),
      commander('am', 'emberAdept', { spells: [sp('emberDart')], script: Array(5).fill(cast(null)) }),
      commander('ap', 'pyrePriest', { spells: [sp('bless')], script: Array(5).fill(cast('bless')) }),
    ],
  );
  const d = side(
    [squad('d1', 'warden', 20, { leader: 'dc' }), squad('d2', 'longbowHunter', 10, { leader: 'dc' })],
    [
      commander('dc', 'wardenCaptain'),
      commander('dm', 'saplingDruid', { spells: [sp('thornSpray')], script: Array(5).fill(cast(null)) }),
      commander('dp', 'grovePriest', { spells: [sp('bless')], script: Array(5).fill(cast('bless')) }),
    ],
  );
  return [a, d] as const;
}

function big() {
  const a = side(
    [
      squad('a1', 'cinderWarrior', 60, { leader: 'ac1' }),
      squad('a2', 'cinderWarrior', 40, { leader: 'ac2' }),
      squad('a3', 'flameArcher', 60, { leader: 'ac1' }),
      squad('a4', 'berserker', 40, { leader: 'ac2' }),
      squad('a5', 'ashRider', 40, { leader: 'ac3' }),
      squad('a6', 'emberSkirmisher', 30, { leader: 'ac3' }),
      squad('a7', 'flamebrand', 30, { leader: 'ac1' }),
    ],
    [
      commander('ac1', 'ashChieftain'),
      commander('ac2', 'ashChieftain'),
      commander('ac3', 'ashChieftain'),
      commander('am1', 'cinderMagus', { spells: [sp('emberDart'), sp('fireball'), sp('pyreStorm'), sp('warcry'), sp('bloodFury')], carriedMana: { R: 3 }, pips: { R: 3 }, script: Array(5).fill(cast(null)) }),
      commander('am2', 'cinderMagus', { spells: [sp('emberDart'), sp('fireball'), sp('bloodFury')], script: Array(5).fill(cast(null)) }),
      commander('ap', 'pyrePriest', { spells: [sp('bless')], script: Array(5).fill(cast('bless')) }),
    ],
  );
  const d = side(
    [
      squad('d1', 'warden', 60, { leader: 'dc1' }),
      squad('d2', 'warden', 40, { leader: 'dc2' }),
      squad('d3', 'longbowHunter', 80, { leader: 'dc1' }),
      squad('d4', 'briarGuard', 40, { leader: 'dc2' }),
      squad('d5', 'wolfRider', 40, { leader: 'dc3' }),
      squad('d6', 'oakheart', 40, { leader: 'dc3' }),
    ],
    [
      commander('dc1', 'wardenCaptain'),
      commander('dc2', 'wardenCaptain'),
      commander('dc3', 'wardenCaptain'),
      commander('dm1', 'elderDruid', { spells: [sp('thornSpray'), sp('barkSkin'), sp('entangle'), sp('swarm'), sp('regrowth')], carriedMana: { G: 3 }, pips: { G: 3 }, script: Array(5).fill(cast(null)) }),
      commander('dm2', 'elderDruid', { spells: [sp('thornSpray'), sp('barkSkin'), sp('entangle')], script: Array(5).fill(cast(null)) }),
      commander('dt', 'treant', { spells: [sp('thornSpray')], script: [cast(null), { kind: 'attack' }, { kind: 'attack' }, { kind: 'attack' }, { kind: 'attack' }] }),
    ],
  );
  return [a, d] as const;
}

function report(name: string, mk: () => readonly [any, any], seeds: number) {
  let rounds = 0, events = 0, bytes = 0, hits = 0, kills = 0, maxRounds = 0;
  const kinds: Record<string, number> = {};
  let maxPairsPerRound = 0, meleeRounds = 0, roundsTotal = 0;
  let maxHitsRound = 0;
  for (let s = 1; s <= seeds; s++) {
    const [a, d] = mk();
    const t0 = performance.now();
    const r = fightOnce(a, d, s);
    const t1 = performance.now();
    if (s === 1) console.log(name, 'resolve ms', (t1 - t0).toFixed(1));
    rounds += r.rounds; maxRounds = Math.max(maxRounds, r.rounds);
    events += r.replay.length;
    bytes += JSON.stringify({ roster: r.roster, replay: r.replay }).length;
    let pairs = 0, rh = 0, hasMelee = false;
    for (const e of r.replay as BattleEvent[]) {
      kinds[e.kind] = (kinds[e.kind] ?? 0) + 1;
      if (e.kind === 'roundStart') { maxPairsPerRound = Math.max(maxPairsPerRound, pairs); maxHitsRound = Math.max(maxHitsRound, rh); if (hasMelee) meleeRounds++; pairs = 0; rh = 0; hasMelee = false; roundsTotal++; }
      if (e.kind === 'volley' || e.kind === 'melee') { pairs++; hits += e.hits; kills += e.kills; rh += e.hits; if (e.kind === 'melee') hasMelee = true; }
    }
  }
  console.log(name, { avgRounds: rounds / seeds, maxRounds, avgEvents: events / seeds, avgBytes: Math.round(bytes / seeds), avgHits: hits / seeds, avgKills: kills / seeds, maxPairsPerRound, maxHitsRound, meleeRoundsAvg: meleeRounds / seeds });
  for (const k of Object.keys(kinds)) kinds[k] = +(kinds[k]! / seeds).toFixed(1);
  console.log(kinds);
}

report('small', small, 50);
report('big', big, 20);

// print the first 60 events of a small battle
const [a, d] = small();
const r = fightOnce(a, d, 3);
console.log(r.winner, r.rounds);
for (const e of r.replay.slice(0, 80)) console.log(JSON.stringify(e));

// gzip and per-round kill profile for big
{
  const [a2, d2] = big();
  const r2 = fightOnce(a2, d2, 5);
  const json = JSON.stringify({ roster: r2.roster, replay: r2.replay });
  console.log('big json', json.length, 'gzip', gzipSync(json).length, 'rounds', r2.rounds, 'winner', r2.winner);
  let round = 0; const perRound: Record<number, { volleyKills: number; meleeKills: number; spellKills: number; pairsM: number; pairsV: number; hitsM: number; routs: number; deaths: number }> = {};
  for (const e of r2.replay as BattleEvent[]) {
    if (e.kind === 'roundStart') { round = e.round; perRound[round] = { volleyKills: 0, meleeKills: 0, spellKills: 0, pairsM: 0, pairsV: 0, hitsM: 0, routs: 0, deaths: 0 }; continue; }
    const p = perRound[round]!;
    if (e.kind === 'volley') { p.volleyKills += e.kills; p.pairsV++; }
    if (e.kind === 'melee') { p.meleeKills += e.kills; p.pairsM++; p.hitsM += e.hits; }
    if (e.kind === 'damage') p.spellKills += e.kills;
    if (e.kind === 'rout') p.routs++;
    if (e.kind === 'death') p.deaths++;
  }
  console.table(perRound);
}

// visible deaths per phase with the proxy rule
{

  const CAP: Record<number, number> = { 1: 20, 2: 12, 3: 6, 4: 4, 5: 2, 6: 1 };
  const visible = (count: number, start: number, cap: number) =>
    count <= 0 ? 0 : start <= cap ? count : Math.min(cap, Math.max(Math.ceil((cap * count) / start), Math.min(count, 5)));
  for (const seed of [1, 5, 9]) {
    const [a2, d2] = big();
    const r2 = fightOnce(a2, d2, seed);
    const start = new Map<string, { n: number; start: number; cap: number }>();
    for (const sd of ['attacker', 'defender'] as const) for (const s of r2.roster[sd].squads) start.set(s.ref, { n: s.count, start: s.count, cap: CAP[unitDef(s.unit as never).size] ?? 20 });
    let round = 0; let phaseKind = ''; let vis = 0; let kills = 0; const rows: any[] = [];
    const flush = () => { if (phaseKind) rows.push({ round, phase: phaseKind, kills, visibleDeaths: vis }); vis = 0; kills = 0; };
    for (const e of r2.replay as BattleEvent[]) {
      if (e.kind === 'roundStart') { flush(); round = e.round; phaseKind = ''; continue; }
      const k = e.kind === 'volley' || e.kind === 'melee' ? e.kind : e.kind === 'damage' && phaseKind === '' ? 'spell' : null;
      if (k && k !== phaseKind && (k === 'volley' || k === 'melee')) { flush(); phaseKind = k; }
      if (k === 'spell' && phaseKind === '') phaseKind = 'spell';
      if ((e.kind === 'volley' || e.kind === 'melee' || e.kind === 'damage') && start.has(e.target)) {
        const s = start.get(e.target)!; const before = visible(s.n, s.start, s.cap); s.n -= e.kills; kills += e.kills; vis += before - visible(s.n, s.start, s.cap);
      }
      if (e.kind === 'summon') start.set(e.squad, { n: e.count, start: e.count, cap: CAP[unitDef(e.unit as never).size] ?? 20 });
    }
    flush();
    console.log('seed', seed, 'rounds', r2.rounds, JSON.stringify(rows.filter((r) => r.kills > 0).map((r) => `${r.round}${r.phase[0]}:${r.kills}/${r.visibleDeaths}`)));
  }
}

// size with A1 phase markers and A2 fields (realistic magnitudes)
for (const [name, mk] of [['small', small], ['big', big]] as const) {
  const [a3, d3] = mk();
  const r3 = fightOnce(a3, d3, 5);
  const base = JSON.stringify({ roster: r3.roster, replay: r3.replay });
  const aug: unknown[] = [];
  let last = '';
  for (const e of r3.replay as BattleEvent[]) {
    const ph = e.kind === 'roundStart' ? '' : e.kind === 'cast' ? 'spells' : e.kind === 'volley' ? 'ranged' : e.kind === 'melee' ? 'melee' : e.kind === 'rout' ? 'morale' : e.kind === 'leave' || e.kind === 'expire' ? 'end' : last;
    if (e.kind === 'roundStart') last = '';
    if (ph && ph !== last) { aug.push({ kind: 'phase', phase: ph }); last = ph; }
    if (e.kind === 'volley' || e.kind === 'melee') aug.push({ ...e, attacks: e.hits * 2 + 3, blocked: Math.floor(e.hits / 3), dmg: e.hits * 7 });
    else if (e.kind === 'cast') aug.push({ ...e, fatigue: 35 });
    else aug.push(e);
  }
  const more = JSON.stringify({ roster: r3.roster, replay: aug, scene: { terrain: 'hills', storm: null } });
  console.log(name, 'raw', base.length, '->', more.length, `(+${Math.round((100 * (more.length - base.length)) / base.length)}%)`, 'gzip', gzipSync(base).length, '->', gzipSync(more).length);
}
