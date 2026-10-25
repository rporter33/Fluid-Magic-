
// ================================================================== pass 4 (natural/pass4/design-final.md): the mid-game record's overworld, drawn with mock data
// R1, one switch: P4S.on in the relief look unless ?p4=off (Painted (v3) never runs pass-4 code). Each feature has its own flag: ?p4=-seasons,-waters turns
// single features off; ?p4=seasons,waters keeps only those (the isolation checks). The Map look control updates P4S.on at run time (p80e setLook).
// R2: the record's numbers live in P4_RULES, for the later sim phases (M2, M5) and docs/09-balance. R8: every seeded stream is rngFor('p4:<seed>:<purpose>:<key>');
// rule-bearing data (regions, rivers, roads, fords, leg days, the supply path) uses arithmetic, square roots and floors only: no Math.sin, and no call to p10b's
// noise or wet. The world is built lazily from p10b and p12 data alone (the first legDays call comes during p20's load), so it never depends on who views it.
const P4Q = new URLSearchParams(location.search);
const P4_FEATS = ['lean', 'regions', 'seasons', 'memory', 'waters', 'tools', 'working'];
const P4S = (() => {
  const q = P4Q.get('p4'), base = q !== 'off', s = { base, on: base && LOOK0 === 'relief', season: null, frost: false }; // season: the forced season (review control); null follows the clock
  const toks = base && q ? q.split(',').map((t) => t.trim()).filter(Boolean) : [], bare = toks.filter((t) => P4_FEATS.includes(t.replace(/^\+/, ''))).map((t) => t.replace(/^\+/, '')), minus = toks.filter((t) => t[0] === '-').map((t) => t.slice(1));
  for (const f of P4_FEATS) s[f] = (bare.length ? bare.includes(f) : true) && !minus.includes(f);
  return s;
})();
const p4 = (f) => P4S.on && !!P4S[f]; // a pass-4 feature is live: the relief look, pass 4 on, the feature's flag on
document.body.classList.toggle('p4off', !P4S.base);
// the review controls that reload the page: Pass 4 On | Off (?p4=off) and Map: Mockup | Vast probe (?map=vast)
for (const [ctl, onV, cur] of [['p4', 'off', P4S.base ? 'on' : 'off'], ['map', 'vast', P4Q.get('map') === 'vast' ? 'vast' : 'mockup']]) document.querySelectorAll(`#mockctl [data-ctl="${ctl}"] button`).forEach((b) => {
  b.classList.toggle('on', b.dataset.v === cur); b.setAttribute('aria-pressed', String(b.dataset.v === cur));
  b.addEventListener('click', () => { if (b.dataset.v === cur) return; const q = new URLSearchParams(location.search); if (b.dataset.v === onV) q.set(ctl, onV); else q.delete(ctl); location.search = q.toString(); });
});
const P4_RULES = { // the mid-game record (mid-game.md), mock rules only
  seasons: { names: ['spring', 'summer', 'autumn', 'winter'], words: ['Spring', 'Summer', 'Autumn', 'Winter'], // §2: months 1-3, 4-6, 7-9, 10-12
    supply: [0.10, 0, 0.20, -0.30], growth: [0.001, 0, 0, -0.001], materials: [0, 0.10, 0, -0.10], unrestDecay: [0, 0, 0, -1], winterDays: { hills: 2, mountains: 2, forest: 2, other: 1 } },
  supply: { reach: 2, drop: 0.2, floor: 0.2, roadHop: 0.5 }, // §3, the owner's decision 2: full up to two hops, -20% a hop past them, never under 20%; a road hop counts half
  crossing: { days: 2, defBonus: 1 }, road: { k: 0.5, min: 2 }, // §4: a river edge without an intact bridge costs +2 days; a road halves a leg (at least 2 days)
  bridgeCuts: [{ a: 'Briardale', b: 'Ashfen', from: 31, by: 'green' }], // mock state by month: Thornwood holds Ashfen from M30 and cuts its bridge
  workingSlots: (nations) => Math.floor(nations / 2) + 1, // §7
  regions: { per: 7, min: 5, max: 9 }, // §9
  rivers: { per60: 2, min: 2, max: 4, minEdges: 4, tribEdges: 3, ford: [0.35, 0.65], elev: { mountains: 5, hills: 4, forest: 3, plains: 2, farmland: 2, wasteland: 2, swamp: 1, peaks: 6, mere: 0 }, noiseK: 0.24, noiseU: 500 },
};
const p4SeasonOf = (M) => Math.floor((((M - 1) % 12) + 12) % 12 / 3); // 0 spring .. 3 winter (arithmetic only: legDays reads it during p20's load)
const p4Key = (purpose, key) => `p4:${MAP_SEED}:${purpose}:${key}`;
// ---- the world (§2.1, §5.1; reference final/p4world-r2.js): built lazily, from p10b and p12 data alone (map data: the initial owners, never the live ones or the viewer)
let P4W = null; // { rivers, riverOf: Map(edge key -> { river, seq }), ford: Map(edge key -> point), road: Set(edge keys), bridges: Map(edge key -> { river, cut }), forts, ms }
const p4Bfs = (src) => { const d = new Array(N).fill(Infinity); d[src] = 0; const q = [src]; for (let h = 0; h < q.length; h++) for (const w of nbrs(q[h])) if (d[w] === Infinity) { d[w] = d[q[h]] + 1; q.push(w); } return d; };
const p4Connected = (list) => { if (!list.length) return true; const S = new Set(list), seen = new Set([list[0]]), q = [list[0]]; for (let h = 0; h < q.length; h++) for (const w of nbrs(q[h])) if (S.has(w) && !seen.has(w)) { seen.add(w); q.push(w); } return seen.size === S.size; };
const p4MedD = () => { const d = provList.map((i) => 2 * Math.sqrt(areaOf[i] / Math.PI)).sort((a, b) => a - b); return d[Math.floor(d.length / 2)]; }; // MED_DIAM is a const in p50, read after p20's load
// the corner heights' value noise: a seeded 500-unit lattice with a smoothstep blend (arithmetic only, in place of p10b's noise)
const P4_VN = new Map(), p4Lat = (ix, iy) => { const k = ix + ',' + iy; let v = P4_VN.get(k); if (v == null) { v = 2 * rngFor(p4Key('rivh', k))() - 1; P4_VN.set(k, v); } return v; }, p4Sm = (t) => t * t * (3 - 2 * t);
function p4VN(x, y) { const S = P4_RULES.rivers.noiseU, gx = x / S, gy = y / S, ix = Math.floor(gx), iy = Math.floor(gy), fx = p4Sm(gx - ix), fy = p4Sm(gy - iy), a = p4Lat(ix, iy), b = p4Lat(ix + 1, iy), c = p4Lat(ix, iy + 1), d = p4Lat(ix + 1, iy + 1); return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy; }
function rlWorld4() { // rivers along province borders, their fords, roads from the forts, bridges where a road crosses a river, and the cut state by month
  if (P4W) return P4W; const T0 = performance.now(), RR = P4_RULES.rivers, P = provList;
  // rivers: a corner graph over province/province edges (wild edges excluded), downhill from a range's foot, then toward the nearest model edge
  const ck = (q) => Math.round(q[0] * 10) + ',' + Math.round(q[1] * 10), C = new Map(), corner = (q) => { const k = ck(q); let c = C.get(k); if (!c) { c = { k, x: q[0], y: q[1], cells: new Set(), adj: [] }; C.set(k, c); } return c; };
  for (const [key, e] of EDGE) { const ca = corner(e.a), cb = corner(e.b); ca.cells.add(e.i).add(e.j); cb.cells.add(e.i).add(e.j); if (isWild(e.i) || isWild(e.j)) continue; ca.adj.push([cb, key]); cb.adj.push([ca, key]); }
  const onEdge = (c) => c.x < 0.5 || c.y < 0.5 || c.x > W - 0.5 || c.y > H - 0.5, edgeDist = (c) => Math.min(c.x, c.y, W - c.x, H - c.y);
  const hOf = (c) => { let s = 0, n = 0; for (const i of c.cells) { s += isWild(i) ? RR.elev[wildOf[i].kind] : RR.elev[terr[i]]; n++; } return s / n + RR.noiseK * p4VN(c.x, c.y); };
  for (const c of C.values()) c.h = hOf(c);
  const MD = p4MedD(), want = Math.max(RR.min, Math.min(RR.max, Math.round((RR.per60 * P.length) / 60))), rivers = [], usedE = new Set(), onRiver = new Set();
  const sources = [...C.values()].filter((c) => !onEdge(c) && c.adj.length && [...c.cells].some((i) => (isWild(i) ? wildOf[i].kind === 'peaks' : terr[i] === 'mountains'))).sort((a, b) => b.h - a.h || (a.k < b.k ? -1 : 1));
  const trace = (s) => { const path = [s], keys = [], seen = new Set([s.k]); let cur = s;
    for (let step = 0; step < 60; step++) { if (onEdge(cur)) return { path, keys, ok: true };
      const opts = cur.adj.filter(([c2, key]) => !seen.has(c2.k) && !usedE.has(key)).map(([c2, key]) => ({ c2, key, s: c2.h < cur.h - 0.05 ? c2.h : cur.h + 0.004 * edgeDist(c2) })).sort((a, b) => a.s - b.s || (a.c2.k < b.c2.k ? -1 : 1));
      if (!opts.length) return { path, keys, ok: false }; const o = opts[0]; seen.add(o.c2.k); path.push(o.c2); keys.push(o.key); cur = o.c2; }
    return { path, keys, ok: false }; };
  const usedN = new Set(names.filter(Boolean));
  for (let r = 0; r < want; r++) {
    let best = null; for (const s of sources) { if (onRiver.has(s.k) || rivers.some((rv) => rv.corners.some((c) => Math.sqrt((c.x - s.x) ** 2 + (c.y - s.y) ** 2) < 1.5 * MD))) continue; const t = trace(s); if (!t.ok || t.keys.length < RR.minEdges) continue; if (!best || t.keys.length > best.keys.length) best = { ...t, s }; }
    if (!best) break; const Rn = rngFor(p4Key('river', best.s.k)), A2 = ['Ash', 'Reed', 'Cold', 'Elder', 'Grey', 'Sallow', 'Wyr', 'Stag'], B2 = ['water', 'run', 'burn', 'bourne', 'flow'];
    let nm = null; for (let t = 0; t < 30 && !nm; t++) { const v = 'the ' + A2[Math.floor(Rn() * A2.length)] + B2[Math.floor(Rn() * B2.length)]; if (!rivers.some((q) => q.name === v) && !usedN.has(v)) nm = v; }
    const end = best.path[best.path.length - 1];
    rivers.push({ id: rivers.length, name: nm ?? 'the River ' + (rivers.length + 1), corners: best.path, keys: best.keys, src: [...best.s.cells], to: end.x < 1 ? 'west' : end.x > W - 1 ? 'east' : end.y < 1 ? 'north' : end.y > H - 1 ? 'south' : 'join' });
    best.keys.forEach((k) => usedE.add(k)); best.path.forEach((c) => onRiver.add(c.k));
  }
  const riverOf = new Map(), ford = new Map(); for (const rv of rivers) rv.keys.forEach((k, j) => { const e = EDGE.get(k), t = RR.ford[0] + (RR.ford[1] - RR.ford[0]) * rngFor(p4Key('ford', k))(); riverOf.set(k, { river: rv.id, seq: j }); ford.set(k, [e.a[0] + (e.b[0] - e.a[0]) * t, e.a[1] + (e.b[1] - e.a[1]) * t]); });
  // roads (§4): each fort's catchment (2 hops, the owner's reach) joined by its shortest-path tree over its own land; map data (the owners at the start: a capture moves no road)
  const forts = P.filter((i) => prov[i].cap), road = new Set(), reach = P4_RULES.supply.reach;
  for (const f of forts) { const o = owner[f], prev = new Map([[f, -1]]), d = new Map([[f, 0]]), q = [f];
    for (let h = 0; h < q.length; h++) { const v = q[h]; if (d.get(v) >= reach) continue; for (const w of nbrs(v).sort((a, b) => a - b)) if (!d.has(w) && owner[w] === o) { d.set(w, d.get(v) + 1); prev.set(w, v); q.push(w); } }
    for (const [w, p] of prev) if (p >= 0) road.add(ekey(w, p)); }
  const bridges = new Map(); for (const k of road) if (riverOf.has(k)) bridges.set(k, { river: riverOf.get(k).river, cut: null });
  for (const c of P4_RULES.bridgeCuts) { const a = names.indexOf(c.a), b = names.indexOf(c.b), k = a >= 0 && b >= 0 ? ekey(a, b) : null; if (k && bridges.has(k)) bridges.get(k).cut = { from: c.from, by: c.by }; }
  P4W = { rivers, riverOf, ford, road, bridges, forts, ms: +(performance.now() - T0).toFixed(1) }; return P4W;
}
const p4RiverEdge = (k) => (p4('waters') ? rlWorld4().riverOf.get(k) ?? null : null);
const p4BridgeUp = (k, M = curMonth) => { const b = rlWorld4().bridges.get(k); return !!b && !(b.cut && M >= b.cut.from); }; // an intact bridge at month M (a cut one stays cut: mock state by month)
const p4Crossing = (k, M = curMonth) => !!p4RiverEdge(k) && !p4BridgeUp(k, M); // a river edge with no intact bridge: +2 days
// leg days (§5.2): the terrain's days; on a road (its bridge intact) max(2, ceil(d / 2)); +2 across a river without an intact bridge; in winter +2 on Hills, Mountains and Forest, +1 elsewhere
function legDays(v, w) {
  const t = prov[w].terrain; let d = DAYS[t]; if (!P4S.on) return d;
  if (P4S.waters) { const k = ekey(v, w), W4 = rlWorld4(), riv = W4.riverOf.has(k), up = riv && p4BridgeUp(k); if (W4.road.has(k) && (!riv || up)) d = Math.max(P4_RULES.road.min, Math.ceil(d * P4_RULES.road.k)); if (riv && !up) d += P4_RULES.crossing.days; }
  if (P4S.seasons && (P4S.season ?? p4SeasonOf(curMonth)) === 3) { const wd = P4_RULES.seasons.winterDays; d += wd[t] ?? wd.other; }
  return d;
}
// the supply path (§5.4): the fewest hops (a road hop counts half) over own or own-dominated land to an own fort; full up to two hops, -20% a hop past them, floor 20%
function rlSupplyPath(at, nation = VIEWER0) {
  const S = P4_RULES.supply, W4 = rlWorld4(), forts = new Set(provList.filter((i) => prov[i].owner === nation && prov[i].buildings.includes('fort'))), ok = (i) => i === at || prov[i].owner === nation || prov[i].dom.n === nation || forts.has(i);
  const dist = new Map([[at, 0]]), prev = new Map([[at, -1]]), open = new Set([at]);
  while (open.size) { let v = null; for (const o of open) if (v === null || dist.get(o) < dist.get(v)) v = o; open.delete(v);
    if (forts.has(v)) { const path = []; for (let x = v; x !== -1; x = prev.get(x)) path.push(x); const hops = dist.get(v), share = Math.max(S.floor, 1 - S.drop * Math.max(0, hops - S.reach));
      const hw = hops === 0 ? null : hops % 1 ? (Math.floor(hops) ? Math.floor(hops) + '½' : '½') + (hops < 1 ? ' hop' : ' hops') : hops + (hops === 1 ? ' hop' : ' hops');
      return { fort: v, hops, share: Math.round(share * 100) / 100, path: path.reverse(), text: hw ? `${Math.round(share * 100)}%, ${hw} from ${names[v]}` : `${Math.round(share * 100)}%, in ${names[v]}` }; }
    for (const w of nbrs(v)) { if (!ok(w)) continue; const k = ekey(v, w), rd = W4.road.has(k) && (!W4.riverOf.has(k) || p4BridgeUp(k)), d = dist.get(v) + (rd ? S.roadHop : 1); if (d < (dist.get(w) ?? Infinity)) { dist.set(w, d); prev.set(w, v); open.add(w); } } }
  return { fort: null, hops: null, share: S.floor, path: [at], text: `${Math.round(S.floor * 100)}%, no friendly path to a fort` };
}
const VIEWER0 = 'red'; // the viewer's nation (p57's VIEWER is declared after p20's load)
// ---- named regions (§2.1): K = round(n / 7), farthest-point seeds from the lowest province id, balanced growth by terrain and distance, repair and split to 5..9, names from v3's
// REGION_SYL (p54) unique against province, wild, river and v3 region names, with distinct prefixes, none beginning a nation's name. Built on first use (after p54).
let P4REG = null;
function rlRegions4() {
  if (P4REG) return P4REG; const T0 = performance.now(), P = provList, RG = P4_RULES.regions, P0 = Math.min(...P), K = Math.max(2, Math.round(P.length / RG.per)), seeds = [P0]; let dmin = p4Bfs(P0);
  while (seeds.length < K) { let best = -1; for (const i of P) if (!seeds.includes(i) && dmin[i] !== Infinity && (best < 0 || dmin[i] > dmin[best])) best = i; seeds.push(best); const d = p4Bfs(best); dmin = dmin.map((v, k) => Math.min(v, d[k])); }
  const reg = new Array(N).fill(-1), R = seeds.map((s, r) => { reg[s] = r; return { r, seed: s, t: terr[s], provs: [s], d: p4Bfs(s), frozen: false }; }); let left = P.length - K;
  while (left > 0) { const live = R.filter((x) => !x.frozen && x.provs.length < RG.max).sort((a, b) => a.provs.length - b.provs.length || a.r - b.r); if (!live.length) break;
    const g = live[0]; let pick = -1, pc = Infinity; for (const i of g.provs) for (const w of nbrs(i)) { if (reg[w] >= 0) continue; const c = (terr[w] === g.t ? 0 : 1) + 0.35 * g.d[w] + w * 1e-6; if (c < pc) { pc = c; pick = w; } }
    if (pick < 0) { g.frozen = true; continue; } reg[pick] = g.r; g.provs.push(pick); left--; }
  for (const i of P) if (reg[i] < 0) { const w = nbrs(i).find((q) => reg[q] >= 0); if (w != null) { reg[i] = reg[w]; R[reg[w]].provs.push(i); } }
  for (let pass = 0; pass < 6; pass++) for (const g of R) { if (!g.provs.length || g.provs.length >= RG.min) continue;
    const nb = [...new Set(g.provs.flatMap((i) => nbrs(i).map((w) => reg[w])))].filter((r) => r !== g.r && r >= 0).map((r) => R[r]).sort((a, b) => a.provs.length - b.provs.length || a.r - b.r), m = nb.find((h) => h.provs.length + g.provs.length <= RG.max);
    if (m) { for (const i of g.provs) { reg[i] = m.r; m.provs.push(i); } g.provs = []; continue; }
    for (const h of nb) { if (g.provs.length >= RG.min) break; for (const i of [...h.provs]) { if (g.provs.length >= RG.min || h.provs.length <= RG.min) break; if (!nbrs(i).some((w) => reg[w] === g.r)) continue; const rest = h.provs.filter((q) => q !== i); if (!p4Connected(rest)) continue; h.provs = rest; reg[i] = g.r; g.provs.push(i); } } }
  const splits = []; for (const g of [...R]) { if (g.provs.length <= RG.max) continue; const n = g.provs.length, mx = g.provs.reduce((s, i) => s + cent[i][0], 0) / n, my = g.provs.reduce((s, i) => s + cent[i][1], 0) / n; let sxx = 0, syy = 0, sxy = 0; // the long axis: the PCA of member centroids
    for (const i of g.provs) { const dx = cent[i][0] - mx, dy = cent[i][1] - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; } const tr = sxx + syy, det = sxx * syy - sxy * sxy, l1 = tr / 2 + Math.sqrt(Math.max(0, (tr * tr) / 4 - det)); let ux = sxy, uy = l1 - sxx; if (Math.abs(ux) + Math.abs(uy) < 1e-9) { ux = 1; uy = 0; } const ul = Math.sqrt(ux * ux + uy * uy); ux /= ul; uy /= ul;
    const ord = [...g.provs].sort((a, b) => (cent[a][0] - mx) * ux + (cent[a][1] - my) * uy - ((cent[b][0] - mx) * ux + (cent[b][1] - my) * uy) || a - b); let done = false;
    for (const off of [0, 1, -1, 2, -2]) { const c = Math.floor(n / 2) + off; if (c < RG.min || n - c < RG.min) continue; const A1 = ord.slice(0, c), B1 = ord.slice(c); if (!p4Connected(A1) || !p4Connected(B1)) continue; const h = { r: R.length, seed: B1[0], t: g.t, provs: B1, d: null, frozen: true }; R.push(h); g.provs = A1; for (const i of B1) reg[i] = h.r; splits.push([n, A1.length, B1.length]); done = true; break; }
    if (!done) splits.push([n, 'unsplit']); }
  const list = R.filter((g) => g.provs.length), NATIONS = ['Cinder Horde', 'Thornwood'], W4 = rlWorld4(), used = new Set([...names.filter(Boolean), ...buildRegions().map((r) => r.name), ...W4.rivers.map((r) => r.name)]), usedPre = new Set();
  const preOK = (a, base) => !usedPre.has(a) && !NATIONS.some((nn) => nn.toLowerCase().startsWith((base ?? a).toLowerCase()));
  list.forEach((g, r) => { const cnt = {}; for (const i of g.provs) cnt[terr[i]] = (cnt[terr[i]] ?? 0) + 1; g.terrain = Object.entries(cnt).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0][0];
    const Rr = rngFor(p4Key('region', Math.min(...g.provs))), [pre, suf] = REGION_SYL[g.terrain], mk = (a, b) => ('The ' + (b[0] === b[0].toLowerCase() ? a + b : a + ' ' + b)).replace(/([a-z])\1\1/g, '$1$1'); let nm = null;
    for (let tr = 0; tr < 60 && !nm; tr++) { const a = pre[Math.floor(Rr() * pre.length)], s = mk(a, suf[Math.floor(Rr() * suf.length)]); if (!used.has(s) && !used.has(s.slice(4)) && preOK(a)) { nm = s; usedPre.add(a); } }
    for (let tr = 0; tr < 60 && !nm; tr++) { const base = A[Math.floor(Rr() * A.length)], a = base + 'fall', b = suf[Math.floor(Rr() * suf.length)], s = mk(a, b[0].toUpperCase() + b.slice(1)); if (!used.has(s) && !used.has(s.slice(4)) && preOK(a, base)) { nm = s; usedPre.add(a); } } // large maps: the record's "Ashfall Downs" pattern
    g.name = nm ?? 'The ' + names[g.provs[0]] + ' March'; used.add(g.name); g.id = r; g.provs.sort((a, b) => a - b); for (const i of g.provs) reg[i] = r; });
  P4REG = { list, regionOf: reg, splits, ms: +(performance.now() - T0).toFixed(1) }; return P4REG;
}
function regionHolder(r) { // live: the nation holding most of the region's provinces ("Split: ..." on a tie)
  const g = rlRegions4().list[r], own = {}; for (const i of g.provs) { const o = prov[i].owner ?? 'independent'; own[o] = (own[o] ?? 0) + 1; }
  const E = Object.entries(own).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)), nm = (o) => (o === 'independent' ? 'independents' : o === 'red' ? 'the Cinder Horde' : ownerName(o));
  return E.length > 1 && E[0][1] === E[1][1] ? { who: null, n: E[0][1], text: `Split: ${E.filter((q) => q[1] === E[0][1]).map(([o, n]) => `${nm(o)} ${n}`).join(', ')}` } : { who: E[0][0], n: E[0][1], text: `Held mostly by ${nm(E[0][0])} (${E[0][1]} of ${g.provs.length})` };
}
// ---- the Great Working (§6.4, built in part 2): the mock data
const WORKINGS = [{ id: 'greening', name: 'The Greening', by: 'green', at: greenCap, from: 40, school: 'G', effect: "spring in every province of the caster's dominion all year; beasts cost half", dispel: 'Unmaking (L6, a contest of Lore)' }];
