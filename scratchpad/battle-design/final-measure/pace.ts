import * as P from './tests/sim/battle/fixtures';
import { spellDef } from './src/content/spells';
import { unitDef } from './src/content';
import { resolveBattle } from './src/sim/battle/resolve';
import { createRng } from './src/sim/rng';
const sp = (id: string) => spellDef(id as never) as any;
const cast = (id: string | null) => ({ kind: 'cast' as const, spellId: id });
const { side, squad, commander } = P as any;
function small() {
  return { province: 'p0', attacker: side([squad('a1', 'cinderWarrior', 20, { leader: 'ac' }), squad('a2', 'flameArcher', 10, { leader: 'ac' })],
      [commander('ac', 'ashChieftain'), commander('am', 'emberAdept', { spells: [sp('emberDart')], script: Array(5).fill(cast(null)) }), commander('ap', 'pyrePriest', { spells: [sp('bless')], script: Array(5).fill(cast('bless')) })]),
    defender: side([squad('d1', 'warden', 20, { leader: 'dc' }), squad('d2', 'longbowHunter', 10, { leader: 'dc' })],
      [commander('dc', 'wardenCaptain'), commander('dm', 'saplingDruid', { spells: [sp('thornSpray')], script: Array(5).fill(cast(null)) }), commander('dp', 'grovePriest', { spells: [sp('bless')], script: Array(5).fill(cast('bless')) })]) };
}
function big() {
  const a = side([squad('a1', 'cinderWarrior', 60, { leader: 'ac1' }), squad('a2', 'cinderWarrior', 40, { leader: 'ac2' }), squad('a3', 'flameArcher', 60, { leader: 'ac1' }), squad('a4', 'berserker', 40, { leader: 'ac2' }), squad('a5', 'ashRider', 40, { leader: 'ac3' }), squad('a6', 'emberSkirmisher', 30, { leader: 'ac3' }), squad('a7', 'flamebrand', 30, { leader: 'ac1' })],
    [commander('ac1', 'ashChieftain'), commander('ac2', 'ashChieftain'), commander('ac3', 'ashChieftain'),
      commander('am1', 'cinderMagus', { spells: [sp('emberDart'), sp('fireball'), sp('pyreStorm'), sp('warcry'), sp('bloodFury')], carriedMana: { R: 3 }, pips: { R: 3 }, script: Array(5).fill(cast(null)) }),
      commander('am2', 'cinderMagus', { spells: [sp('emberDart'), sp('fireball'), sp('bloodFury')], script: Array(5).fill(cast(null)) }),
      commander('ap', 'pyrePriest', { spells: [sp('bless')], script: Array(5).fill(cast('bless')) })]);
  const d = side([squad('d1', 'warden', 60, { leader: 'dc1' }), squad('d2', 'warden', 40, { leader: 'dc2' }), squad('d3', 'longbowHunter', 80, { leader: 'dc1' }), squad('d4', 'briarGuard', 40, { leader: 'dc2' }), squad('d5', 'wolfRider', 40, { leader: 'dc3' }), squad('d6', 'oakheart', 40, { leader: 'dc3' })],
    [commander('dc1', 'wardenCaptain'), commander('dc2', 'wardenCaptain'), commander('dc3', 'wardenCaptain'),
      commander('dm1', 'elderDruid', { spells: [sp('thornSpray'), sp('barkSkin'), sp('entangle'), sp('swarm'), sp('regrowth')], carriedMana: { G: 3 }, pips: { G: 3 }, script: Array(5).fill(cast(null)) }),
      commander('dm2', 'elderDruid', { spells: [sp('thornSpray'), sp('barkSkin'), sp('entangle')], script: Array(5).fill(cast(null)) }),
      commander('dt', 'treant', { spells: [sp('thornSpray')], script: [cast(null), { kind: 'attack' }, { kind: 'attack' }, { kind: 'attack' }, { kind: 'attack' }] })]);
  return { province: 'p0', attacker: a, defender: d };
}
function grind(prot: number) {
  const st = { prot, mor: 50 };
  return { province: 'p0', attacker: side([squad('a1', 'cinderWarrior', 150, { stats: st }), squad('a2', 'cinderWarrior', 150, { stats: st })]), defender: side([squad('d1', 'warden', 150, { stats: st }), squad('d2', 'warden', 150, { stats: st })]) };
}
const CAP: Record<number, number> = { 1: 20, 2: 12, 3: 6, 4: 4, 5: 2, 6: 1 };
const visible = (n: number, start: number, cap: number) => n <= 0 ? 0 : start <= cap ? n : Math.min(cap, Math.max(Math.ceil(cap * n / start), Math.min(n, 5)));
const SPELL: Record<string, [number, number, number]> = { emberDart: [0.9, 0.6, 0.35], fireball: [1.9, 1.3, 0.7], warcry: [1.3, 1.3, 0.3], bloodFury: [1.4, 1.4, 0.4], pyreStorm: [3.2, 2.2, 1.3], thornSpray: [1.2, 0.8, 0.35], barkSkin: [1.2, 1.2, 0.3], entangle: [1.4, 1.4, 0.45], swarm: [1.8, 1.8, 0.6], regrowth: [2.0, 2.0, 0.8], bless: [1.0, 0.6, 0.3] };
const BR: Record<string, number> = {};
const add = (k: string, v: number) => { BR[k] = (BR[k] ?? 0) + v; };
function pace(setup: any, seed: number, beatsMode = false) {
  let beatTime = 0;
  const r = resolveBattle(setup, createRng(seed));
  const units = new Map<string, { n: number; start: number; cap: number; cmd: boolean; side: string }>();
  for (const s of ['attacker', 'defender'] as const) {
    for (const q of r.roster[s].squads) units.set(q.ref, { n: q.count, start: q.count, cap: CAP[unitDef(q.unit as never).size]!, cmd: false, side: s });
    for (const c of r.roster[s].commanders) units.set(c.ref, { n: 1, start: 1, cap: 1, cmd: true, side: s });
  }
  const sideStart = { attacker: 0, defender: 0 } as Record<string, number>;
  for (const u of units.values()) if (!u.cmd) sideStart[u.side] += u.start;
  const kill = (ref: string, k: number) => { const u = units.get(ref); if (!u) return 0; const v0 = visible(u.n, u.start, u.cap); u.n = Math.max(0, u.n - k); return v0 - visible(u.n, u.start, u.cap); };
  let total = 3.0 + 2.5; let firstMelee = true; const seen = new Set<string>(); const castN = new Map<string, number>(); const rounds: number[] = []; let quietRun = 0; let runTime = 0;
  type Ph = { kind: string; ev: any[] }; let round: Ph[] = []; let cur: Ph | null = null;
  const flush = () => {
    if (round.length === 0) return;
    let t = 0.3, vis = 0, strikes = 0, beats = 0, housekeepingOnly = true; let roundKills = 0; let flagged = false;
    for (const ph of round) for (const e of ph.ev) { if (['death','cast','rout','summon','advance','leave'].includes(e.kind)) flagged = true; if (e.kills) roundKills += e.kills; }
    let present = 0; for (const u of units.values()) present += u.n;
    for (const ph of round) {
      if (ph.kind === 'scripts') {
        let s = 0, i = 0; for (const e of ph.ev) if (e.kind === 'cast') { housekeepingOnly = false; const [full, short, ch] = SPELL[e.spellId] ?? [1, 0.6, 0.3]; const key = e.caster + e.spellId; const nth = (castN.get(key) ?? 0) + 1; castN.set(key, nth); let d = seen.has(e.spellId) ? short : full; let c = seen.has(e.spellId) ? ch / 2 : ch; if (nth >= 3 && sp(e.spellId).level < 3) { d = 0.5; c = 0; } seen.add(e.spellId); if (sp(e.spellId).level >= 3) beats++; s += s > 5 ? 0.3 : (i > 0 ? Math.max(0.3, d - c) : d); i++; }
        for (const e of ph.ev) { if (e.kind === 'damage') vis += kill(e.target, e.kills); if (e.kind === 'summon') { beats++; units.set(e.squad, { n: e.count, start: e.count, cap: CAP[unitDef(e.unit).size]!, cmd: false, side: e.side }); } }
        t += s; add('spells', s); for (const e of ph.ev) if (e.kind === 'cast' && sp(e.spellId).level >= 3) beatTime += Math.min(s, (SPELL[e.spellId] ?? [1])[0]!);
      }
      if (ph.kind === 'ranged') { housekeepingOnly = false; t += 1.7; add('ranged', 1.7); for (const e of ph.ev) if (e.kind === 'volley' || e.kind === 'damage') vis += kill(e.target, e.kills); }
      if (ph.kind === 'melee') {
        housekeepingOnly = false; let v = 0; for (const e of ph.ev) { if (e.kind === 'melee' || e.kind === 'damage') v += kill(e.target, e.kills); if (e.kind === 'melee') strikes += e.attacks; }
        vis += v; let w = firstMelee ? 4.0 : 2.4; if (firstMelee) { beats++; beatTime += 4.0; } firstMelee = false; w = Math.min(4.8, w + Math.max(0, Math.floor((v - 20) / 10)) * 0.25); t += w; add('melee', w);
      }
      if (['scripts', 'ranged', 'melee'].includes(ph.kind)) { const deaths = ph.ev.filter((e) => e.kind === 'death').length; if (deaths > 0) { t += 2.4 + 0.8 * (deaths - 1); beats += deaths; add('cmdDeath', 2.4 + 0.8 * (deaths - 1)); beatTime += 2.4 + 0.8 * (deaths - 1); } }
      if (ph.kind === 'morale') { const routs = ph.ev.filter((e) => e.kind === 'rout').length; { const m = routs > 0 ? Math.min(2.2, 1.0 + 0.3 * (routs - 1)) : 0.3; t += m; add('morale', m); if (routs) beatTime += 1.0; } if (routs) { housekeepingOnly = false; beats += routs; } }
      if (ph.kind === 'end') { t += 0.4; add('end', 0.4); }
    }
    
    const quiet = !flagged && roundKills <= Math.max(1, 0.01 * present) && !(firstMelee === false && beats > 0);
    housekeepingOnly = quiet;
    const intensity = vis + 8 * beats;
    if (intensity < 3) t = Math.max(1.0, t * 0.5);
    
    if (housekeepingOnly) { quietRun++; if (quietRun === 4) { total -= 3 * 0; } }
    else { if (quietRun >= 4) { total -= runTime; total += Math.min(4.0, 1.5 + 0.15 * quietRun); } quietRun = 0; runTime = 0; }
    if (housekeepingOnly) runTime += t;
    rounds.push(t); total += t; round = [];
  };
  for (const e of r.replay as any[]) {
    if (e.kind === 'roundStart') { flush(); continue; }
    if (e.kind === 'phase') { cur = { kind: e.phase, ev: [] }; round.push(cur); continue; }
    if (e.kind === 'battleEnd') { flush(); break; }
    cur?.ev.push(e);
  }
  if (quietRun >= 4) { total -= runTime; total += Math.min(4.0, 1.5 + 0.15 * quietRun); }
  if (beatsMode) total = 1.2 + 2.5 + beatTime + (total - 5.5 - beatTime) / 4;
  return { rounds: r.rounds, total, max: Math.max(...rounds) };
}
for (const [name, mk, n] of [['starting', small, 50], ['clash300', big, 20], ['grind16', () => grind(16), 5], ['immortal', () => grind(99), 3]] as const) {
  let tot = 0, totB = 0, mx = 0, rd = 0, worst = 0;
  for (let s = 1; s <= n; s++) { const p = pace(mk(), s); const b = pace(mk(), s, true); tot += p.total; totB += b.total; mx = Math.max(mx, p.max); rd += p.rounds; worst = Math.max(worst, p.total); }
  for (const k of Object.keys(BR)) BR[k] = +(BR[k]! / (2 * n)).toFixed(1);
  console.log(name, JSON.stringify(BR)); for (const k of Object.keys(BR)) delete BR[k];
  console.log(name, { rounds: (rd / n).toFixed(1), avg1x: (tot / n).toFixed(0) + ' s', worst1x: worst.toFixed(0) + ' s', beatsMode: (totB / n).toFixed(0) + ' s', longestRound: mx.toFixed(1) + ' s' });
}
