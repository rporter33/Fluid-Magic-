
// A second Cinder army that only the time-lapse uses (pillage at M14, siege of Deepmoss from M60).
cmd.dravik = { id: 'dravik', name: 'Dravik', unit: 'Ash Chieftain', ptype: 'ashChieftain', side: 'red', at: pillageProv, hp: [14, 14], mor: 13, lead: 80, pips: '', order: 'Pillage', squads: [['Cinder Warriors', 40, 100], ['Ash Riders', 12, 100]], script: ['sword', 'sword', 'sword', 'sword', 'sword'], hidden: true };

// ------------------------------------------------------------------ time-lapse: the example state re-derived month by month (M3 to M70)
const SCALES = { red: [['Fury', 3], ['Turmoil', 2]], green: [['Growth', 3], ['Wild', 2]] };
const effStep = (scale, s) => { const v = (scale * s) / 10; return Math.sign(v) * Math.round(Math.abs(v)); }; // halves away from zero
const BASE = provs.map((p) => ({ i: p.i, pop: p.pop, owner: p.owner, dom: { ...p.dom }, pd: p.pd, unrest: p.unrest, buildings: [...p.buildings] }));
for (const p of provs) p.startPop = p.pop;
let curMonth = 3;
function deriveMonth(M) {
  for (const b of BASE) { const p = prov[b.i]; Object.assign(p, { pop: b.pop, owner: b.owner, dom: { ...b.dom }, pd: b.pd, unrest: b.unrest, buildings: [...b.buildings], kitOwner: b.owner }); }
  for (let k = 4; k <= M; k++) {
    for (const p of provs) p.kitOwner = p.owner; // a captured town is rebuilt in its new owner's kit a month later
    if (k === 12) captureTargets.forEach((i) => { prov[i].owner = 'red'; });
    if (k === 30) prov[ashfen].owner = 'green';
    if ((k - 3) % 6 === 0) for (const p of provs) if (p.dom.n && p.i !== ashfen) p.dom.s = Math.min(p.dom.n === p.owner ? 7 : 4, p.dom.s + 1);
    if ((k - 3) % 8 === 0) for (const n of ['red', 'green']) {
      provs.filter((p) => !p.dom.n && (p.owner === null || p.owner === n) && nbrs(p.i).some((w) => prov[w].dom.n === n && prov[w].dom.s >= 2)).forEach((p) => { p.dom = { n, s: 1 }; });
    }
    const a = prov[ashfen];
    a.dom = k <= 24 ? { n: 'green', s: 2 + Math.floor((3 * (k - 3)) / 21) } : k < 40 ? { n: 'green', s: 5 } : { n: 'red', s: Math.min(6, 3 + Math.floor((k - 40) / 6)) };
    if (k >= 20) prov[redCap].pd = Math.max(prov[redCap].pd, k >= 48 ? 25 : 15);
    for (const p of provs) p.pop *= 1 + 0.002 + 0.003 * (p.dom.n === 'green' ? effStep(3, p.dom.s) : 0);
    if (k === 14) prov[pillageProv].pop *= 0.92;
    if (k === 15) prov[pillageProv].pop *= 0.815;
  }
  for (const p of provs) { p.pop = Math.round(p.pop / 10) * 10; p.fx = []; p.siege = null; p.scar = null; p.pillage = false; p.claim = null; p.build = null; }
  const sun = prov[ownWell], ash = prov[ashfen];
  if (M < 6) sun.build = { kind: 'temple', q: M - 2 }; else sun.buildings = [...new Set([...sun.buildings, 'temple'])];
  if (M >= 5 && M < 8) ash.build = { kind: 'temple', q: M - 4 }; else if (M >= 8) ash.buildings = [...new Set([...ash.buildings, 'temple'])];
  sun.claim = M === 17 ? 'running' : M >= 18 ? 'red' : null;
  const pp = prov[pillageProv];
  pp.pillage = M === 14 || M === 15; if (M >= 14 && M <= 16) pp.unrest = 50; else if (M > 16 && M <= 20) pp.unrest = 30;
  if (M >= 20 && M <= 23) prov[burnProv].fx.push({ kind: 'burn' });
  if (M === 36 || M === 37) prov[ashRainProv].fx.push({ kind: 'ashrain', step: M === 36 ? 3 : 1 });
  if (M >= 8 && M <= 14) prov[greenCap].fx.push({ kind: 'fertile' });
  if (M >= 60) prov[greenCap].siege = M >= 64 ? 'breached' : M >= 62 ? 'cracked' : 'intact';
  prov[morholt].scar = M <= 5 ? 'churned' : M <= 14 ? 'cairns' : null;
  cmd.varo.hp[0] = M >= 12 && M <= 13 ? 6 : 14;
  cmd.ondra.prophet = M >= 24;
  const fell = M >= 30; // Ashfen falls to Thornwood: Varo falls back to Morholt and Ilsa holds Ashfen
  cmd.varo.at = fell ? morholt : ashfen; cmd.ilsa.at = fell ? ashfen : greenFrom; if (fell) cmd.ilsa.eta = 0; else if (cmd.ilsa.eta === 0 && !state.autoPaused) cmd.ilsa.eta = 4;
  const dv = cmd.dravik; dv.hidden = !(pp.pillage || M >= 60); dv.at = M >= 60 ? greenCap : pillageProv; dv.order = M >= 60 ? 'Besiege' : 'Pillage';
  curMonth = M;
}
const fogOf = (i) => (i === greenCap && curMonth >= 60 ? null : FOG[i]); // a besieging army sees Deepmoss
const wellClaimed = () => prov[ownWell].claim === 'red';

// ------------------------------------------------------------------ paths (by days), barriers and the review targets
const DAYS = { plains: 2, farmland: 2, forest: 3, hills: 3, mountains: 5, swamp: 4, wasteland: 2 };
function pathTo(from, to) {
  if (isWild(to) || isWild(from)) return null;
  const dist = new Array(N).fill(Infinity), prev = new Array(N).fill(-1); dist[from] = 0;
  const open = new Set([from]);
  while (open.size) {
    let v = -1; for (const o of open) if (v < 0 || dist[o] < dist[v]) v = o;
    open.delete(v); if (v === to) break;
    if (v !== from && prov[v].owner !== 'red') continue; // paths cross only friendly land; the last step may be hostile
    for (const w of nbrs(v)) { const d = dist[v] + DAYS[prov[w].terrain]; if (d < dist[w]) { dist[w] = d; prev[w] = v; open.add(w); } }
  }
  if (dist[to] === Infinity) return null;
  const path = []; for (let v = to; v !== from; v = prev[v]) path.unshift(v);
  return { path, days: dist[to] };
}
function segT(a, b, p, q) { // parameter along ab where it crosses pq, or null
  const d = (b[0] - a[0]) * (q[1] - p[1]) - (b[1] - a[1]) * (q[0] - p[0]); if (Math.abs(d) < 1e-9) return null;
  const u = ((p[0] - a[0]) * (q[1] - p[1]) - (p[1] - a[1]) * (q[0] - p[0])) / d, v = ((p[0] - a[0]) * (b[1] - a[1]) - (p[1] - a[1]) * (b[0] - a[0])) / d;
  return u > 0 && u < 1 && v >= 0 && v <= 1 ? u : null;
}
function barrierOnLine(from, to) { // the first wild the straight segment between the two centers crosses
  let best = null, bt = Infinity;
  for (const w of WILDS) for (const c of w.cells) { const poly = cells[c]; for (let k = 0; k < poly.length - 1; k++) { const t = segT(cent[from], cent[to], poly[k], poly[k + 1]); if (t !== null && t < bt) { bt = t; best = w; } } }
  return best;
}
function hostileAround(from, to) { // the first province not ours on the shortest way around
  const prev = new Array(N).fill(-1), seen = new Set([from]), q = [from];
  for (let h = 0; h < q.length; h++) { const v = q[h]; if (v === to) break; for (const w of nbrs(v)) if (!seen.has(w)) { seen.add(w); prev[w] = v; q.push(w); } }
  const path = []; for (let v = to; v !== from && v >= 0; v = prev[v]) path.unshift(v);
  return path.slice(0, -1).find((v) => prov[v].owner !== 'red') ?? null;
}
const ashspine = WILDS.find((w) => w.id === 'ashspine') ?? WILDS[0];
let acrossTarget = null, closedTarget = null;
if (ashspine) {
  const ring = [...new Set(ashspine.cells.flatMap((c) => NB[c]))].filter((x) => !isWild(x) && x !== cmd.varo.at && prov[x].owner !== 'red');
  const crossing = ring.filter((t) => barrierOnLine(cmd.varo.at, t) === ashspine);
  const reach = crossing.filter((t) => pathTo(cmd.varo.at, t)).sort((a, b) => pathTo(cmd.varo.at, b).path.length - pathTo(cmd.varo.at, a).path.length);
  acrossTarget = reach[0] ?? null;
  const closed = crossing.filter((t) => !pathTo(cmd.varo.at, t)).map((t) => [t, hostileAround(cmd.varo.at, t)]).filter(([, h]) => h !== null);
  const pick = closed.find(([, h]) => prov[h].owner === 'green') ?? closed[0];
  closedTarget = pick ? pick[0] : null;
}
