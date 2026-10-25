// Pass 4 prototype (reference for the build's p13-p4-world.js): mock regions, rivers along borders, roads from forts, bridges and fords, leg days and the
// supply path. Evaluated inside the mockup's closure (window.__mock.ev) so it reads the mockup's own map data. Seeded; no Math.random, no Date, no trig.
(() => {
  const T0 = performance.now(), out = {};
  const P = provList, Pset = new Set(P);
  const bfsAll = (src) => { const d = new Array(N).fill(Infinity); d[src] = 0; const q = [src]; for (let h = 0; h < q.length; h++) for (const w of nbrs(q[h])) if (d[w] === Infinity) { d[w] = d[q[h]] + 1; q.push(w); } return d; };
  // ---------------------------------------------------------------- regions: K = round(n / 7); farthest-point seeds from the viewer's capital; balanced growth
  const K = Math.max(2, Math.round(P.length / 7)), seeds = [redCap]; let dmin = bfsAll(redCap);
  while (seeds.length < K) { let best = -1; for (const i of P) if (!seeds.includes(i) && dmin[i] !== Infinity && (best < 0 || dmin[i] > dmin[best])) best = i; seeds.push(best); const d = bfsAll(best); dmin = dmin.map((v, k) => Math.min(v, d[k])); }
  const reg = new Array(N).fill(-1), R = seeds.map((s, r) => { reg[s] = r; return { r, seed: s, t: terr[s], provs: [s], d: bfsAll(s), frozen: false }; });
  let left = P.length - K;
  while (left > 0) {
    const live = R.filter((x) => !x.frozen && x.provs.length < 9).sort((a, b) => a.provs.length - b.provs.length || a.r - b.r); if (!live.length) break;
    const g = live[0]; let pick = -1, pc = Infinity;
    for (const i of g.provs) for (const w of nbrs(i)) { if (reg[w] >= 0) continue; const c = (terr[w] === g.t ? 0 : 1) + 0.35 * g.d[w] + w * 1e-6; if (c < pc) { pc = c; pick = w; } }
    if (pick < 0) { g.frozen = true; continue; } reg[pick] = g.r; g.provs.push(pick); left--;
  }
  for (const i of P) if (reg[i] < 0) { const w = nbrs(i).find((q) => reg[q] >= 0); if (w != null) { reg[i] = reg[w]; R[reg[w]].provs.push(i); } } // leftovers (the cap reached): join a neighbour
  // repair: a region under 5 gives its provinces to its smallest neighbouring region while the sum stays at most 9, else takes boundary provinces from a donor over 5
  const connected = (list) => { if (!list.length) return true; const S = new Set(list), seen = new Set([list[0]]), q = [list[0]]; for (let h = 0; h < q.length; h++) for (const w of nbrs(q[h])) if (S.has(w) && !seen.has(w)) { seen.add(w); q.push(w); } return seen.size === S.size; };
  for (let pass = 0; pass < 6; pass++) for (const g of R) {
    if (!g.provs.length || g.provs.length >= 5) continue;
    const nb = [...new Set(g.provs.flatMap((i) => nbrs(i).map((w) => reg[w])))].filter((r) => r !== g.r && r >= 0).map((r) => R[r]).sort((a, b) => a.provs.length - b.provs.length || a.r - b.r);
    const m = nb.find((h) => h.provs.length + g.provs.length <= 9);
    if (m) { for (const i of g.provs) { reg[i] = m.r; m.provs.push(i); } g.provs = []; continue; }
    for (const h of nb) { if (g.provs.length >= 5) break; for (const i of [...h.provs]) { if (g.provs.length >= 5 || h.provs.length <= 5) break; if (!nbrs(i).some((w) => reg[w] === g.r)) continue; const rest = h.provs.filter((q) => q !== i); if (!connected(rest)) continue; h.provs = rest; reg[i] = g.r; g.provs.push(i); } }
  }
  const regions = R.filter((g) => g.provs.length);
  // names: the region's most common terrain gives the syllables (v3's REGION_SYL), unique against province, wild and v3 region names
  const used = new Set([...names.filter(Boolean), ...buildRegions().map((r) => r.name)]), usedPre = new Set();
  for (const g of regions) {
    const cnt = {}; for (const i of g.provs) cnt[terr[i]] = (cnt[terr[i]] ?? 0) + 1; g.terrain = Object.entries(cnt).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0][0];
    const Rr = rngFor('region4:12:' + Math.min(...g.provs)), [pre, suf] = REGION_SYL[g.terrain]; let nm = null;
    for (let tr = 0; tr < 60 && !nm; tr++) { const a = pre[Math.floor(Rr() * pre.length)], b = suf[Math.floor(Rr() * suf.length)], s = 'The ' + (b[0] === b[0].toLowerCase() ? a + b : a + ' ' + b); if (!used.has(s) && !used.has(s.slice(4)) && !usedPre.has(a)) { nm = s; usedPre.add(a); } }
    if (!nm) nm = 'The ' + names[g.provs[0]] + ' March'; used.add(nm); g.name = nm;
    const own = {}; for (const i of g.provs) { const o = prov[i].owner ?? 'independent'; own[o] = (own[o] ?? 0) + 1; } g.holder = Object.entries(own).sort((a, b) => b[1] - a[1])[0];
    g.connected = connected(g.provs);
  }
  out.regions = regions.map((g) => ({ name: g.name, n: g.provs.length, terrain: g.terrain, holder: g.holder.join(' '), connected: g.connected, provs: g.provs.map((i) => names[i]) }));
  out.regionSizes = regions.map((g) => g.provs.length).sort((a, b) => a - b);
  out.regionsMs = +(performance.now() - T0).toFixed(1);
  // ---------------------------------------------------------------- rivers along borders: a corner graph over province/province edges; downhill from a range's foot to the model's edge
  const T1 = performance.now(), ck = (q) => Math.round(q[0] * 10) + ',' + Math.round(q[1] * 10), C = new Map(), CE = new Map();
  const corner = (q) => { const k = ck(q); let c = C.get(k); if (!c) { c = { k, x: q[0], y: q[1], cells: new Set(), adj: [] }; C.set(k, c); } return c; };
  for (const [key, e] of EDGE) { const ca = corner(e.a), cb = corner(e.b); ca.cells.add(e.i).add(e.j); cb.cells.add(e.i).add(e.j); if (isWild(e.i) || isWild(e.j)) continue; ca.adj.push([cb, key]); cb.adj.push([ca, key]); }
  const onEdge = (c) => c.x < 0.5 || c.y < 0.5 || c.x > W - 0.5 || c.y > H - 0.5;
  const ELV = { mountains: 5, hills: 4, forest: 3, plains: 2, farmland: 2, wasteland: 2, swamp: 1 }, hOf = (c) => { let s = 0, n = 0; for (const i of c.cells) { s += isWild(i) ? (wildOf[i].kind === 'peaks' ? 6 : 0) : ELV[terr[i]]; n++; } return s / n + 0.08 * noise(c.x, c.y); };
  for (const c of C.values()) c.h = hOf(c);
  const edgeDist = (c) => Math.min(c.x, c.y, W - c.x, H - c.y);
  const want = Math.max(2, Math.min(4, Math.round((2 * P.length) / 60))), rivers = [], usedE = new Set(), onRiver = new Set();
  const sources = [...C.values()].filter((c) => !onEdge(c) && c.adj.length && [...c.cells].some((i) => isWild(i) ? wildOf[i].kind === 'peaks' : terr[i] === 'mountains')).sort((a, b) => b.h - a.h || (a.k < b.k ? -1 : 1));
  const trace = (s) => { const path = [s], keys = [], seen = new Set([s.k]); let cur = s;
    for (let step = 0; step < 60; step++) {
      if (onEdge(cur)) return { path, keys, ok: true };
      const opts = cur.adj.filter(([c2, key]) => !seen.has(c2.k) && !usedE.has(key)).map(([c2, key]) => ({ c2, key, s: (c2.h < cur.h - 0.05 ? c2.h : cur.h + 0.004 * edgeDist(c2)) })).sort((a, b) => a.s - b.s || (a.c2.k < b.c2.k ? -1 : 1));
      if (!opts.length) return { path, keys, ok: false }; const o = opts[0]; seen.add(o.c2.k); path.push(o.c2); keys.push(o.key); cur = o.c2;
    } return { path, keys, ok: false }; };
  for (let r = 0; r < want; r++) {
    let best = null; for (const s of sources) { if (onRiver.has(s.k) || rivers.some((rv) => rv.corners.some((c) => Math.hypot(c.x - s.x, c.y - s.y) < 1.5 * MED_DIAM))) continue; const t = trace(s); if (!t.ok || t.keys.length < 4) continue; if (!best || t.keys.length > best.keys.length) best = { ...t, s }; }
    if (!best) break; const s = best.s, path = best.path, keys = best.keys, joins = null;
    const Rn = rngFor('river4:12:' + s.k), A2 = ['Ash', 'Reed', 'Cold', 'Elder', 'Grey', 'Sallow', 'Wyr', 'Stag'], B2 = ['water', 'run', 'burn', 'bourne', 'flow'];
    let nm = null; for (let t = 0; t < 30 && !nm; t++) { const v = 'the ' + A2[Math.floor(Rn() * A2.length)] + B2[Math.floor(Rn() * B2.length)]; if (!rivers.some((q) => q.name === v) && !used.has(v)) nm = v; }
    rivers.push({ name: nm, corners: path, keys, joins }); keys.forEach((k) => usedE.add(k)); path.forEach((c) => onRiver.add(c.k));
  }
  const RIV = new Map(); for (const rv of rivers) for (const k of rv.keys) { const e = EDGE.get(k), Rf = rngFor('ford4:12:' + k), t = 0.35 + 0.3 * Rf(); RIV.set(k, { river: rv.name, ford: [e.a[0] + (e.b[0] - e.a[0]) * t, e.a[1] + (e.b[1] - e.a[1]) * t] }); }
  out.rivers = rivers.map((rv) => ({ name: rv.name, edges: rv.keys.length, joins: !!rv.joins, from: [...rv.corners[0].cells].map((i) => names[i]), to: rv.corners.at(-1).x < 1 ? 'west edge' : rv.corners.at(-1).x > W - 1 ? 'east edge' : rv.corners.at(-1).y < 1 ? 'north edge' : rv.corners.at(-1).y > H - 1 ? 'south edge' : 'joins', realmEdges: rv.keys.filter((k) => { const e = EDGE.get(k); return (prov[e.i].owner ?? '-') !== (prov[e.j].owner ?? '-'); }).length }));
  out.riversMs = +(performance.now() - T1).toFixed(1);
  // ---------------------------------------------------------------- roads: each fort's catchment (2 hops, the owner's supply reach) by its shortest-path tree over its own land
  const T2 = performance.now(), forts = P.filter((i) => prov[i].buildings.includes('fort')), ROAD = new Set();
  for (const f of forts) { const o = prov[f].owner, prev = new Map([[f, -1]]), d = new Map([[f, 0]]), q = [f];
    for (let h = 0; h < q.length; h++) { const v = q[h]; if (d.get(v) >= 2) continue; for (const w of nbrs(v).sort((a, b) => a - b)) if (!d.has(w) && prov[w].owner === o) { d.set(w, d.get(v) + 1); prev.set(w, v); q.push(w); } }
    for (const [w, p] of prev) if (p >= 0) ROAD.add(ekey(w, p)); }
  const bridges = [...ROAD].filter((k) => RIV.has(k));
  out.roads = { forts: forts.map((i) => names[i]), edges: ROAD.size, bridges: bridges.map((k) => { const e = EDGE.get(k); return names[e.i] + '/' + names[e.j] + ' over ' + RIV.get(k).river; }) };
  out.roadsMs = +(performance.now() - T2).toFixed(1);
  // ---------------------------------------------------------------- leg days and a path through a ford; the supply path (hops, roads half) and share (2-hop reach, -20% a hop, floor 20%)
  const legDays = (v, w) => { const k = ekey(v, w), base = DAYS[prov[w].terrain], d = ROAD.has(k) ? Math.max(2, Math.ceil(base / 2)) : base; return d + (RIV.has(k) && !ROAD.has(k) ? 2 : 0); };
  const pathDays = (from, to) => { const dist = new Array(N).fill(Infinity), prev = new Array(N).fill(-1); dist[from] = 0; const open = new Set([from]);
    while (open.size) { let v = -1; for (const o of open) if (v < 0 || dist[o] < dist[v]) v = o; open.delete(v); if (v === to) break; if (v !== from && prov[v].owner !== 'red') continue; for (const w of nbrs(v)) { const d = dist[v] + legDays(v, w); if (d < dist[w]) { dist[w] = d; prev[w] = v; open.add(w); } } }
    if (dist[to] === Infinity) return null; const path = []; for (let v = to; v !== from; v = prev[v]) path.unshift(v); return { path, days: dist[to], crossings: path.filter((v, k) => RIV.has(ekey(k ? path[k - 1] : from, v)) && !ROAD.has(ekey(k ? path[k - 1] : from, v))).length };
  };
  const supply = (at, nation) => { const ok = (i) => i === at || prov[i].owner === nation || prov[i].dom.n === nation, F = P.filter((i) => prov[i].owner === nation && prov[i].buildings.includes('fort'));
    const dist = new Map([[at, 0]]), prev = new Map([[at, -1]]), open = new Set([at]);
    while (open.size) { let v = null; for (const o of open) if (v === null || dist.get(o) < dist.get(v)) v = o; open.delete(v); if (F.includes(v)) { const path = []; for (let x = v; x !== -1; x = prev.get(x)) path.push(x); const hops = dist.get(v), share = Math.max(0.2, 1 - 0.2 * Math.max(0, hops - 2)); return { fort: names[v], hops, share: +share.toFixed(2), path: path.map((i) => names[i]), text: `${Math.round(share * 100)}%, ${hops % 1 ? hops.toFixed(1) : hops} hops from ${names[v]}` }; }
      for (const w of nbrs(v)) { if (!ok(w) && !F.includes(w)) continue; const d = dist.get(v) + (ROAD.has(ekey(v, w)) ? 0.5 : 1); if (d < (dist.get(w) ?? Infinity)) { dist.set(w, d); prev.set(w, v); open.add(w); } } }
    return { fort: null, hops: null, share: 0.2, text: '20%, no friendly path to a fort' }; };
  out.supply = { varoAtAshfen: supply(ashfen, 'red'), atMorholt: supply(morholt, 'red'), dravikPillage: supply(pillageProv, 'red'), dravikDeepmoss: supply(greenCap, 'red'), ilsa: supply(cmd.ilsa.at, 'green') };
  // every province reached from Varo: how many paths cross a river, and the farthest supply share in red land
  const reach = P.filter((i) => i !== cmd.varo.at).map((i) => [i, pathDays(cmd.varo.at, i)]).filter(([, d]) => d);
  out.paths = { reachable: reach.length, crossing: reach.filter(([, d]) => d.crossings).length, example: (() => { const x = reach.find(([, d]) => d.crossings); return x ? { to: names[x[0]], days: x[1].days, oldDays: pathTo(cmd.varo.at, x[0]).days, crossings: x[1].crossings } : null; })() };
  out.targets = P.filter((i) => prov[i].owner !== 'red').map((i) => [names[i], supply(i, 'red').text]).filter(([, t]) => !t.startsWith('20%, no'));
  out.redSupply = P.filter((i) => prov[i].owner === 'red').map((i) => supply(i, 'red').share).sort((a, b) => a - b);
  out.ms = +(performance.now() - T0).toFixed(1);
  return JSON.stringify(out);
})()
