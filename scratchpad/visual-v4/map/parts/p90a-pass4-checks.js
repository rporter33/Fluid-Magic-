
// ------------------------------------------------------------------ pass 4 checks (natural/pass4/design-final.md §10), first half: shared helpers; the world's data
// (regions, rivers, roads, fords, bridges: p4Regions, p4Waters' and p4Supply's data halves), the seasons (p4Seasons) and fog as memory (p4Memory)
const p4Hash = (x0 = 0, y0 = 0, w = canvas.width, h = canvas.height) => { const d = ctx.getImageData(x0, y0, w, h).data; let v = 0x811c9dc5; for (let k = 0; k < d.length; k++) { v ^= d[k]; v = Math.imul(v, 0x01000193); } return (v >>> 0).toString(16); };
const p4Sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function p4Settled(view) { // a view's camera, then draws until two frames 600 ms apart are equal (Painted (v3)'s sprites settle over frames)
  if (view) view(); let last = null; for (let k = 0; k < 15; k++) { await p4Sleep(600); draw(); const h = p4Hash(); if (h === last) return h; last = h; } return last;
}
const P4_VIEWS = { // the baseline views (step 0; the determinism probe's): the start view, Far at the least zoom, Mid, Near; the phone's Fit is its start view
  start: () => { hoverProv = -1; RL_LINK.prov = -1; fit(); RCK = null; draw(); }, far: () => window.__mock.setScale(minScale, 800, 500), mid: () => window.__mock.setScale(1.0, 640, 480), near: () => window.__mock.setScale(maxScale * 0.85, 420, 520),
};
P4_VIEWS.fit = P4_VIEWS.start;
async function p4SeasonReady() { for (let k = 0; k < 400; k++) { draw(); if (typeof RL_SEAS === 'undefined' || !p4('seasons') || (RL_SEAS.gen == null && RL_SEAS.shown === rlSeasonWant())) return true; await p4Sleep(40); } return false; } // the wanted season's variant shown (a month jump may be preparing it)
const p4ViewKey = () => `${RELIEF() ? 'relief-' + view.terrain : 'v3'}|${innerWidth}x${innerHeight}@${devicePixelRatio}`;
// ---- p4Regions, the data half (§2.4; the layout half is step 5's): the partition, sizes 5..9, connected, names (unique, distinct prefixes, no nation prefix, no triple letter),
// the same regions when rebuilt and when the owners change (map data never depends on who views it); the table, with the live holder (a tie reads as split)
function p4RegionsCheck() {
  const RG = P4_RULES.regions, R = rlRegions4(), seen = new Map(); for (const g of R.list) for (const i of g.provs) seen.set(i, (seen.get(i) ?? 0) + 1);
  const partition = provList.every((i) => seen.get(i) === 1) && [...seen.keys()].every((i) => !isWild(i)), sizes = R.list.map((g) => g.provs.length), sizeOK = sizes.every((n) => n >= RG.min && n <= RG.max), connected = R.list.every((g) => p4Connected(g.provs));
  const nm = R.list.map((g) => g.name), pre = R.list.map((g) => g.name.slice(4).split(/[ ]/)[0].replace(/(wold|weald|holt|mire|lands)$/, '')), unique = new Set(nm).size === nm.length && !nm.some((n) => names.includes(n) || rlWorld4().rivers.some((r) => r.name === n));
  const prefixes = new Set(pre).size === pre.length, nation = !pre.some((a) => ['cinder horde', 'thornwood'].some((n) => n.startsWith(a.toLowerCase().replace(/fall$/, '')))), triple = !nm.some((n) => /([a-z])\1\1/i.test(n));
  const dig = () => JSON.stringify(rlRegions4().list.map((g) => [g.name, g.provs])), d0 = dig(); P4REG = null; const d1 = dig();
  const keep = provList.map((i) => prov[i].owner); provList.forEach((i) => { prov[i].owner = keep[provList.indexOf(i)] === 'red' ? 'green' : keep[provList.indexOf(i)] === 'green' ? 'red' : keep[provList.indexOf(i)]; }); P4REG = null; const d2 = dig(); provList.forEach((i, k) => { prov[i].owner = keep[k]; }); P4REG = null; const d3 = dig();
  const table = rlRegions4().list.map((g, r) => ({ name: g.name, n: g.provs.length, terrain: g.terrain, holder: regionHolder(r).text, members: g.provs.map((i) => names[i]) }));
  return { regions: R.list.length, sizes: [...sizes].sort((a, b) => a - b), splits: R.splits, partition, sizeOK, connected, unique, prefixes, noNationPrefix: nation, noTriple: triple, rebuiltSame: d0 === d1 && d1 === d3, ownersSwappedSame: d0 === d2, buildMs: R.ms, table,
    pass: partition && sizeOK && connected && unique && prefixes && nation && triple && d0 === d1 && d0 === d2 && d1 === d3 };
}
// ---- p4Seasons (§3.4): M3 shows the bake; per forced season the variant's chroma, snow and natural checks, rails, lines and the wilds at rest, core shifts within the limits,
// the readers (trained on the season, and trained on spring); Clear and the Terrain mode invariant; the clock; the 600 ms fade with no re-render; the frost control; Supply; memory
async function p4SeasonsCheck(o = {}) {
  if (!p4('seasons')) return { applicable: false }; const out = {}, keep = { s: cam.s, x: cam.x, y: cam.y, season: P4S.season, frost: P4S.frost, reduced: view.reduced, terrain: view.terrain, mode: state.mode }, T0 = performance.now();
  const show = async (s) => { P4S.season = s; for (let k = 0; k < 400; k++) { draw(); if (RL_SEAS.shown === (s ?? p4SeasonOf(curMonth))) return true; await p4Sleep(40); } return false; };
  const skipW = (f) => { const had = SKIP.has('p4waters'); SKIP.add('p4waters'); try { return f(); } finally { if (!had) SKIP.delete('p4waters'); } };
  try {
    view.reduced = true; if (curMonth !== 3) setMonth(3); await show(null); P4_VIEWS.start(); const B = P4_BASE[p4ViewKey()];
    out.m3 = { season: p4SeasonOf(curMonth), shown: RL_SEAS.shown, bakeShown: rlLkFor('natural') === RB.L.natural, startHash: skipW(() => { RCK = null; draw(); return p4Hash(); }), base: B ? B.start : null }; out.m3.pass = out.m3.shown === 0 && out.m3.bakeShown && (!B || out.m3.startHash === B.start);
    const nat = {}, lim = RL_SEASON.limits, core = (V) => { const A = RB.L.natural.img.data, Bd = V.img.data, { BW, TX, id, LT } = RB, acc = new Map(); for (let k = 0; k < LT.length; k += 2) { const i = id[k]; if (i === 255 || LT[k] !== RL_TI[terr[i]]) continue; const x = ((k % BW) + 0.5) / TX, y = (Math.floor(k / BW) + 0.5) / TX; if (distToEdge(cells[i], x, y) < 0.15 * RLD) continue; let a = acc.get(i); if (!a) acc.set(i, (a = [0, 0, 0, 0, 0, 0, 0])); const o4 = k * 4; a[0] += A[o4]; a[1] += A[o4 + 1]; a[2] += A[o4 + 2]; a[3] += Bd[o4]; a[4] += Bd[o4 + 1]; a[5] += Bd[o4 + 2]; a[6]++; }
      const byT = {}; for (const [i, a] of acc) { const n = a[6], e = dE2000(rgb2lab([a[0] / n, a[1] / n, a[2] / n]), rgb2lab([a[3] / n, a[4] / n, a[5] / n])), t = terr[i]; byT[t] = Math.max(byT[t] ?? 0, +e.toFixed(2)); } return byT; };
    for (const s of [1, 2, 3]) { const ok = await show(s), V = RB.S[s]; if (!ok || !V) { nat[s] = { built: false }; continue; } P4_VIEWS.start(); const ch = rlNatChroma(), sn = rlSnowCheck('natural'), cv = window.__mock.reliefNatural(false), rails = rlRailCheck(), lines = rlLinesCheck(), rest = typeof rlWildRestCheck === 'function' ? rlWildRestCheck() : null, cs = core(V);
      const lm = (t) => (t === 'farmland' ? (s === 2 ? lim.farmAutumn : s === 3 ? lim.farmWinter : lim.coreDE) : lim.coreDE), shiftOK = Object.entries(cs).every(([t, e]) => e <= lm(t));
      nat[s] = { season: P4_RULES.seasons.names[s], built: true, ms: V.ms, changed: V.changed, chroma: { over010: ch.over010, max: ch.max, pass: ch.pass }, snow: sn.pass, natural: { chroma: cv.chroma.pass, cover: cv.cover.pass, snow: cv.snow.pass }, rails: { samples: rails.samples, fails: rails.fails }, lines: { pass: lines.pass, hairMin: lines.hairline && lines.hairline.min }, wildRest: rest ? { drawn: rest.outlinePixelsDrawn, pass: rest.pass } : 'n/a', coreDE: cs, shiftOK };
      nat[s].pass = ch.pass && sn.pass && cv.chroma.pass && cv.snow.pass && !rails.fails && lines.pass && (!rest || rest.pass !== false) && shiftOK; }
    out.seasons = nat;
    if (o.readers !== false) { window.__mock.setScale(1.0, 640, 480); const R = {}, fold = new Map(), byT = {}; provList.forEach((i) => (byT[terr[i]] ??= []).push(i)); for (const L of Object.values(byT)) L.sort((a, b) => a - b).forEach((i, k) => fold.set(i, k % 2));
      const patches = () => { const P = [], keepC = { x: cam.x, y: cam.y }, v = viewRect(), seen = new Set(); try { for (const [fx, fy] of RL_POOL) { cam.x = keepC.x - fx * (v.r - v.l); cam.y = keepC.y - fy * (v.b - v.t); clampCam(); const at = Math.round(cam.x) + ',' + Math.round(cam.y); if (seen.has(at)) continue; seen.add(at); P.push(...rlReaderPatchesOf(rlReaderFrame(null), ['normal']).map((p) => ({ ...p, f: p.f.normal }))); const bt = new Map(); for (const p of P) { const q = bt.get(p.t) ?? new Set(); q.add(p.i); bt.set(p.t, q); } if ([...bt.values()].every((q) => q.size >= 2)) break; } } finally { cam.x = keepC.x; cam.y = keepC.y; RCK = null; draw(); } return P; };
      const cross = (tr0, te0) => { let ok = 0, n = 0; const votes = new Map(); for (const F of [0, 1]) { const tr = tr0.filter((p) => fold.get(p.i) !== F), te = te0.filter((p) => fold.get(p.i) === F); if (!tr.length || !te.length) continue; const pred = rlLDA(tr.map((p) => p.f), tr.map((p) => p.t), 7); for (const p of te) { const c = pred(p.f); n++; if (c === p.t) ok++; const vv = votes.get(p.i) ?? new Array(7).fill(0); vv[c]++; votes.set(p.i, vv); } } let pOk = 0; for (const [i, vv] of votes) if (vv.indexOf(Math.max(...vv)) === RL_TI[terr[i]]) pOk++; return { patches: n, patchAcc: r3(ok / Math.max(1, n)), provinceAcc: r3(pOk / Math.max(1, votes.size)) }; };
      await show(0); const P0 = patches();
      for (const s of [0, 1, 2, 3]) { await show(s); const own = rlNatReader(['normal']), Ps = s ? patches() : P0, sp = cross(P0, Ps); R[P4_RULES.seasons.names[s]] = { trainedOnSeason: { patch: own.normal.lightness.patchAcc, province: own.normal.lightness.provinceAcc }, trainedOnSpring: sp, pass: own.normal.lightness.provinceAcc >= 0.95 && own.normal.lightness.patchAcc >= 0.9 && sp.provinceAcc >= 0.9 }; }
      out.readers = R; }
    // Clear and the Terrain mode: identical across the seasons
    const inv = async (setup) => { await setup(); const H = []; for (const s of [0, 1, 2, 3]) { P4S.season = s; for (let k = 0; k < 400 && RL_SEAS.gen != null; k++) await p4Sleep(40); P4_VIEWS.start(); H.push(skipW(() => { RCK = null; draw(); return p4Hash(); })); } return { hashes: H, same: H.every((h) => h === H[0]) }; };
    setTerrainColours('clear'); for (let k = 0; k < 600 && !rlLookReady('clear'); k++) await p4Sleep(50); out.clear = await inv(async () => { draw(); }); setTerrainColours('natural');
    setMode('terrain'); out.terrainMode = await inv(async () => { for (let k = 0; k < 30; k++) { draw(); await p4Sleep(20); } }); setMode('ownership'); await p4Sleep(200); await show(null);
    // the clock
    updateTop(); const de = document.getElementById('date'), gl = document.getElementById('sglyph'), tip = TIPS.clock();
    out.clock = { date: de.textContent, glyphBefore: !!gl && gl.nextElementSibling === de && !!gl.querySelector('svg'), tipNamesSeason: tip.meaning.startsWith(P4_RULES.seasons.words[p4SeasonOf(curMonth)] + ':'), tip: tip.meaning.slice(0, 140) }; out.clock.pass = /^Y\d+ M\d+ D\d+$/.test(out.clock.date) && out.clock.glyphBefore && out.clock.tipNamesSeason;
    // the fade at M4 (the summer variant made during M3): one re-render, then a 600 ms blend of the cached layers with none
    view.reduced = false; P4S.season = null; P4_VIEWS.start(); for (let k = 0; k < 400 && !(RB.S[1] && RB.S[1].ready); k++) { draw(); await p4Sleep(40); } const n0 = RREB.n; setMonth(4); draw(); const n1 = RREB.n, f0 = !!RL_SEAS.fade, t0 = performance.now(); let frames = 0; while (performance.now() - t0 < 700) { draw(); frames++; await p4Sleep(30); }
    out.fade = { rendersAtChange: n1 - n0, rendersDuringFade: RREB.n - n1, frames, fadeStarted: f0, ended: !RL_SEAS.fade, shown: RL_SEAS.shown }; out.fade.pass = f0 && out.fade.rendersDuringFade === 0 && out.fade.ended && RL_SEAS.shown === 1; view.reduced = true; setMonth(3); await show(null);
    // the frost control: off by default; on: Mountains only, Mid and Near only; its colour's snow distance
    out.frost = { defaultOff: keep.frost === false }; await show(3); P4S.frost = false; window.__mock.setScale(minScale, 800, 500); const fa = p4Hash(); P4S.frost = true; RCK = null; draw(); const fb = p4Hash();
    const mt = provList.find((i) => terr[i] === 'mountains' && !fogOf(i)); window.__mock.setScale(1.0, cent[mt][0], cent[mt][1]); P4S.frost = false; RCK = null; draw(); const ma = p4Hash(); P4S.frost = true; RCK = null; draw(); const mb = p4Hash(); const FC = rlFrostCanvas(), d = FC.cv.getContext('2d').getImageData(0, 0, FC.cv.width, FC.cv.height).data; let off = 0; for (let k = 0; k < RB.LT.length; k++) if (d[k * 4 + 3] && (RB.LT[k] !== 4 || terr[RB.id[k]] !== 'mountains')) off++;
    Object.assign(out.frost, { farUnchanged: fa === fb, midChanged: ma !== mb, outsideMountains: off, coverMax: Math.max(...Object.values(FC.cover)), cover: FC.cover, colour: FC.colour, status: FC.colour.pass ? 'passes the snow-distance rule' : 'Frost: fails the snow-distance rule; review only' }); P4S.frost = false; out.frost.pass = out.frost.defaultOff && out.frost.farUnchanged && out.frost.midChanged && off === 0 && out.frost.coverMax <= RL_SEASON.frost.cover;
    // Supply: the mode's fills change by the factor and nothing else
    { const m0 = state.mode, rows = []; for (const s of [0, 1, 2, 3]) { P4S.season = s; for (const md of ['supply', 'unrest', 'dominion']) { state.mode = md; for (const i of provList) { const p = prov[i], f = fillFor(p), want = md === 'supply' && fogOf(i) !== 'unexplored' ? heat(((SUPPLY[p.terrain] + p.pop / 50) * (1 + P4_RULES.seasons.supply[s])) / 320) : null; rows.push([s, md, i, f, want]); } } } state.mode = m0;
      const other = rows.filter((r) => r[1] !== 'supply'), sup = rows.filter((r) => r[1] === 'supply' && r[4]); out.supply = { factors: P4_RULES.seasons.supply, supplyFollows: sup.every((r) => r[3] === r[4]), othersInvariant: other.every((r) => r[3] === other.find((q) => q[1] === r[1] && q[2] === r[2] && q[0] === 0)[3]) }; out.supply.pass = out.supply.supplyFollows && out.supply.othersInvariant; }
    await show(null); out.memory = { variants: Object.keys(RB.S).map(Number), pass: Object.keys(RB.S).length <= 2 };
  } finally { P4S.season = keep.season; P4S.frost = keep.frost; view.reduced = keep.reduced; if (view.terrain !== keep.terrain) setTerrainColours(keep.terrain); if (state.mode !== keep.mode) setMode(keep.mode); cam.s = keep.s; cam.x = keep.x; cam.y = keep.y; RCK = null; draw(); }
  out.ms = Math.round(performance.now() - T0); out.pass = [out.m3, out.clock, out.fade, out.frost, out.supply, out.memory].every((q) => q && q.pass) && Object.values(out.seasons).every((q) => q.pass) && out.clear.same && out.terrainMode.same && (!out.readers || Object.values(out.readers).every((q) => q.pass));
  return out;
}
// ---- p4Memory (§4.3): the snapshot keys and the card's "as of" at M3, M30, M59; scrubbing; Deepmoss remembered at M59 against live at M60; the fog guard; unexplored land
// unchanged against memory off; no army piece out of sight; the preview and the supply path read the remembered state
async function p4MemoryCheck() {
  if (!p4('memory')) return { applicable: false }; const out = {}, keep = { s: cam.s, x: cam.x, y: cam.y, M: curMonth, reduced: view.reduced }, T0 = performance.now(), mid = (i) => window.__mock.setScale(140 / MED_DIAM, cent[i][0], cent[i][1]);
  const boxHash = (i) => { const bb = geo(i).bb, [x0, y0] = toScreen(bb[0], bb[1]), [x1, y1] = toScreen(bb[2], bb[3]), X0 = Math.max(0, Math.floor(x0 * dpr)), Y0 = Math.max(0, Math.floor(y0 * dpr)), X1 = Math.min(canvas.width, Math.ceil(x1 * dpr)), Y1 = Math.min(canvas.height, Math.ceil(y1 * dpr)); return X1 > X0 && Y1 > Y0 ? p4Hash(X0, Y0, X1 - X0, Y1 - Y0) : null; };
  try { view.reduced = true;
    const keys = {}; for (const M of [3, 30, 59]) { setMonth(M); const S = rlMemSnap(3), rows = RL_MEM_OUT.filter((i) => p4FogAt(i, M)).map((i) => { const tip = provTip(i); return { prov: names[i], keyEqual: RL_MEM_FIELDS.every((k) => JSON.stringify(prov[i][k]) === JSON.stringify(S.get(i)[k])), asOf: /Out of sight · as of Y1 M3/.test(tip.meaning ?? ''), seenRow: tip.rows.some((r) => r[0] === 'Seen') }; }); keys['M' + M] = rows; }
    out.snapshots = keys; out.snapPass = Object.values(keys).every((rows) => rows.length && rows.every((r) => r.keyEqual && r.asOf && !r.seenRow));
    // live against remembered: what the viewer cannot see (the mock's events)
    setMonth(40); const rc = RL_MEM_OUT.find((i) => i !== greenCap), live = (i) => { const keepP = JSON.stringify(RL_MEM_FIELDS.map((k) => prov[i][k])); rlLive(40); const v = { pd: prov[i].pd, pop: prov[i].pop, dom: prov[i].dom.s }; deriveMonth(40); return v; };
    out.atM40 = { deepmoss: { drawn: { pd: prov[greenCap].pd, pop: prov[greenCap].pop, dom: prov[greenCap].dom.s }, live: live(greenCap) }, other: rc != null ? { prov: names[rc], drawn: { pd: prov[rc].pd, town: rlIsTown(prov[rc]) }, live: live(rc) } : null };
    // scrubbing: M64 then M40 equals a fresh M40 (canvas at the start view and Mid on Deepmoss)
    const view2 = async () => { await p4SeasonReady(); P4_VIEWS.start(); P4_VIEWS.start(); const a = p4Hash(); /* twice: the first fit after a camera elsewhere differs on the pass-3b page too (part1-notes) */ mid(greenCap); const b = p4Hash(); return a + '/' + b; };
    setMonth(3); setMonth(40); const fresh = await view2(); setMonth(64); setMonth(40); const scrub = await view2(); out.scrub = { fresh, scrub, same: fresh === scrub };
    // Deepmoss: remembered at M59, live at M60 (in sight), in its box at Mid
    setMonth(59); await p4SeasonReady(); mid(greenCap); const b59 = boxHash(greenCap), as59 = rlAsOf(greenCap); setMonth(60); await p4SeasonReady(); mid(greenCap); const b60 = boxHash(greenCap), as60 = rlAsOf(greenCap);
    out.deepmoss = { m59: { box: b59, asOf: as59 }, m60: { box: b60, asOf: as60 }, differ: b59 !== b60 && !!as59 && !as60 };
    // the fog guard: live hidden state changed (walls and people), the canvas in the province's box unchanged
    if (rc != null) { setMonth(40); await p4SeasonReady(); mid(rc); const g0 = boxHash(rc); RL_MEM.extra.push({ i: rc, from: 10, pd: 25 }, { i: rc, from: 12, popK: 2 }); setMonth(40); await p4SeasonReady(); mid(rc); const g1 = boxHash(rc); RL_MEM.extra.length = 0; setMonth(40); out.fogGuard = { prov: names[rc], before: g0, after: g1, unchanged: g0 === g1 }; }
    // unexplored land: in its box, the same with memory on and off
    setMonth(40); await p4SeasonReady(); P4_VIEWS.start(); const un = provList.filter((i) => FOG[i] === 'unexplored'), hb = () => { RCK = null; draw(); return un.map(boxHash); }, on = hb(); P4S.memory = false; deriveMonth(40); refreshKeys(); const off = hb(); P4S.memory = true; deriveMonth(40); refreshKeys(); RCK = null; draw();
    out.unexplored = { provinces: un.length, same: on.filter((h, k) => h === off[k]).length, pass: on.every((h, k) => h === off[k]) };
    // no army piece out of sight; the projection and the supply path from the remembered state
    const lay = RL_PIECE_CACHE.get('L'), ghosts = lay ? lay.armies.filter((a) => a.side !== VIEWER && fogOf(a.prov)).map((a) => names[a.prov]) : []; out.noGhosts = { checked: lay ? lay.armies.length : 0, ghosts, pass: !ghosts.length };
    const sel = cmd.varo, tgt = rc ?? greenCap, proj = moveProjection(sel, tgt), sp = rlSupplyPath(tgt); out.readsMemory = { to: names[tgt], projection: proj.replace(/<[^>]+>/g, ''), supply: sp.text, domDrawn: prov[tgt].dom, note: 'both read prov[], which holds the snapshot out of sight' };
  } finally { view.reduced = keep.reduced; RL_MEM.extra.length = 0; setMonth(keep.M); cam.s = keep.s; cam.x = keep.x; cam.y = keep.y; RCK = null; draw(); }
  out.snapshotsMade = RL_MEM.n; out.snapshotMs = +RL_MEM.ms.toFixed(1); out.ms = Math.round(performance.now() - T0);
  out.pass = out.snapPass && out.scrub.same && out.deepmoss.differ && (!out.fogGuard || out.fogGuard.unchanged) && out.unexplored.pass && out.noGhosts.pass; return out;
}
