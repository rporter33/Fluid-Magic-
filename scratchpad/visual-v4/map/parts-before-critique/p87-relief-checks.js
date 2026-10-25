
// ------------------------------------------------------------------ v4 relief: review checks (window.__mock.relief*). Read-only helpers for automated review.
// Every color check reads the rendered canvas (the composite as drawn), never the design's tables.
const rlHashPx = (d) => { let h = 0x811c9dc5; for (let k = 0; k < d.length; k += 3) { h ^= d[k]; h = Math.imul(h, 0x01000193); } return h >>> 0; };
function rlReadCanvas() { const W2 = canvas.width, H2 = canvas.height; return ctx.getImageData(0, 0, W2, H2).data; }
function rlRedraw(skip) { // a from-scratch frame with some layers off; returns the main canvas pixels
  const was = new Set(SKIP); for (const k of skip ?? []) SKIP.add(k); RCK = null; draw(); const d = rlReadCanvas(); SKIP.clear(); for (const k of was) SKIP.add(k); RCK = null; draw(); return d;
}
const rlLab = (rgb) => rgb2lab(rgb), rlCvd = (rgb, m) => cvdRgb(rgb, m);
function rlPairDE(a, b) { const o = { normal: dE2000(rlLab(a), rlLab(b)) }; for (const [k, m] of Object.entries(CVD)) o[k] = dE2000(rlLab(rlCvd(a, m)), rlLab(rlCvd(b, m))); o.cvd = Math.min(o.protan, o.deutan, o.tritan); return o; }
// the expected color of a province's core in its state (albedo; the unexplored haze; the out-of-sight desaturation as the canvas blends it; the land-look wash)
function rlExpected(p) {
  let c = hex2rgb(RL_ALB[p.terrain]); const f = fogOf(p.i);
  if (f === 'unexplored') c = c.map((v, j) => v + (hex2rgb(RL_C.gesso)[j] - v) * RL_P.haze);
  else if (f === 'outofsight') { const L = 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]; c = c.map((v) => v * (1 - RL_P.outSat) + L * RL_P.outSat); }
  else if (p.dom.n && RL_WASH[p.dom.n] && state.mode === 'ownership') { const w = hex2rgb(RL_WASH[p.dom.n][0]), a = (RL_WASH[p.dom.n][1] * p.dom.s) / 10; c = c.map((v, j) => v + (w[j] - v) * a); }
  return c;
}
// (1) province means on the rendered composite: pure-terrain core pixels beyond 0.06 D of every edge, off the water; rails, pieces and labels off
function rlMeansCheck() {
  const d = rlRedraw(['rails', 'pieces', 'labels', 'badges', 'arrows']), W2 = canvas.width, H2 = canvas.height, { BW, TX, id, pure } = RB, acc = new Map();
  const wm = makeCanvas(W2, H2), wg = wm.getContext('2d', { willReadFrequently: true }); worldT(wg); wg.fillStyle = '#fff'; wg.strokeStyle = '#fff'; wg.lineCap = 'round';
  for (const L of [...RB.water.lakes, ...RB.water.ponds]) { wg.beginPath(); L.P.forEach(([x, y], k) => (k ? wg.lineTo(x, y) : wg.moveTo(x, y))); wg.closePath(); wg.fill(); wg.lineWidth = 6 * RLK; wg.stroke(); }
  for (const s of RB.water.streams) { wg.lineWidth = 2 * (s.w1 + 3 * RLK); wg.beginPath(); s.pts.forEach(([x, y], k) => (k ? wg.lineTo(x, y) : wg.moveTo(x, y))); wg.stroke(); }
  const wd = wg.getImageData(0, 0, W2, H2).data, edgeK = 0.06 * RLD; // the core is the bake's own (pure terrain, eroded 4 texels, beyond 0.06 D)
  const full = new Set(provList.filter((i) => { const b = geo(i).bb, [a0, b0] = toScreen(b[0], b[1]), [a1, b1] = toScreen(b[2], b[3]); return a0 >= 0 && b0 >= 0 && a1 <= cw && b1 <= ch; })); // provinces wholly in view
  for (let py = 0; py < H2; py++) for (let px = 0; px < W2; px++) {
    const k4 = (py * W2 + px) * 4; if (wd[k4 + 3] > 0) continue; const [x, y] = toWorld((px + 0.5) / dpr, (py + 0.5) / dpr); if (!inModel(x, y)) continue;
    const t = Math.floor(y * TX) * BW + Math.floor(x * TX), i = id[t]; if (i === 255 || RL_WILDK[i] || !pure[t] || !full.has(i)) continue;
    if (distToEdge(cells[i], x, y) < edgeK) continue;
    let a = acc.get(i); if (!a) acc.set(i, (a = [0, 0, 0, 0, 0, 0, 0])); const lb = rgb2lab([d[k4], d[k4 + 1], d[k4 + 2]]); a[0] += lb[0]; a[1] += lb[1]; a[2] += lb[2]; a[3]++; a[4] += s2l(d[k4]); a[5] += s2l(d[k4 + 1]); a[6] += s2l(d[k4 + 2]);
  }
  const rows = [];
  for (const [i, a] of acc) { if (a[3] < 40) continue; const p = prov[i], labM = [a[0] / a[3], a[1] / a[3], a[2] / a[3]], mean = lab2rgb(labM), lin = [a[4], a[5], a[6]].map((v) => l2s(v / a[3])), exp = rlExpected(p); const el = rlLab(exp); rows.push({ name: p.name, terrain: p.terrain, fog: fogOf(i) ?? '', n: a[3], mean, dE: dE2000(labM, el), dELinear: dE2000(rlLab(lin), el), dLab: labM.map((v, j) => +(v - el[j]).toFixed(2)) }); }
  const byT = {}; for (const r of rows) { const b = (byT[r.terrain] ??= { n: 0, worst: 0, sum: 0 }); b.n++; b.sum += r.dE; b.worst = Math.max(b.worst, r.dE); }
  const terr2 = Object.fromEntries(Object.entries(byT).map(([t, b]) => [t, { provinces: b.n, meanDE: +(b.sum / b.n).toFixed(2), worstDE: +b.worst.toFixed(2) }]));
  // (2) terrain pairs between the rendered means of provinces of different terrains (each in its own state), normal and under each deficiency
  let worstN = { v: Infinity }, worstC = { v: Infinity }, under = 0, pairs = 0;
  for (let a = 0; a < rows.length; a++) for (let b = a + 1; b < rows.length; b++) {
    if (rows[a].terrain === rows[b].terrain) continue; pairs++; const e = rlPairDE(rows[a].mean, rows[b].mean);
    if (e.normal < 20 || e.cvd < 12) under++;
    if (e.normal < worstN.v) worstN = { v: +e.normal.toFixed(2), pair: rows[a].name + '/' + rows[b].name, terrains: rows[a].terrain + '/' + rows[b].terrain };
    if (e.cvd < worstC.v) worstC = { v: +e.cvd.toFixed(2), pair: rows[a].name + '/' + rows[b].name, terrains: rows[a].terrain + '/' + rows[b].terrain, protan: +e.protan.toFixed(1), deutan: +e.deutan.toFixed(1), tritan: +e.tritan.toFixed(1) };
  }
  return { scale: +cam.s.toFixed(3), provinces: rows.length, measure: 'CIELAB mean of the core pixels, as the design measures it', budget: RL_P.meanBudget, worstDE: +Math.max(...rows.map((r) => r.dE)).toFixed(2), worstDELinearMean: +Math.max(...rows.map((r) => r.dELinear)).toFixed(2), overBudget: rows.filter((r) => r.dE > RL_P.meanBudget).map((r) => `${r.name} (${r.terrain}${r.fog ? ', ' + r.fog : ''}) ${r.dE.toFixed(2)} dLab ${r.dLab.join('/')} n${r.n}`), within: rows.filter((r) => r.dE <= RL_P.meanBudget).length, byTerrain: terr2, pairs: { checked: pairs, under2012: under, worstNormal: worstN, worstCvd: worstC } };
}
// (3) the band (rail) rule on rendered pixels: along realm edges, the dark keyline, banner, light keyline and the ground beyond, as antialiasing left them
function rlRailCheck() {
  const d = rlRedraw(['pieces', 'labels', 'badges', 'arrows']), W2 = canvas.width, H2 = canvas.height, w = rlW(), gap = 1, offs = { dark: gap + w.d / 2, ban: gap + w.d + w.b / 2, light: gap + w.d + w.b + w.l / 2, ground: gap + w.d + w.b + w.l + 2.5 };
  const px = (sx, sy) => { const X = Math.round(sx * dpr - 0.5), Y = Math.round(sy * dpr - 0.5); if (X < 0 || Y < 0 || X >= W2 || Y >= H2) return null; const k = (Y * W2 + X) * 4; return [d[k], d[k + 1], d[k + 2]]; };
  let n = 0, fails = 0, worst = Infinity, worstAt = '', bannerOnly = 0, dotted = 0; const failList = [];
  for (const i of provList) {
    const p = prov[i]; if (!p.owner) continue;
    for (const e of RL_EDGES[i]) {
      if (!isRealmEdge(i, e)) continue; const L = e.len * cam.s; if (L < 24) continue; if (fogOf(i) && fogOf(e.j)) { dotted++; continue; } // dotted in fog (approved meaning); not a solid line to test
      for (let t = 0.2; t <= 0.8001; t += 0.6 / Math.max(1, Math.floor(L / 30))) {
        const bx = e.a[0] + (e.b[0] - e.a[0]) * t, by = e.a[1] + (e.b[1] - e.a[1]) * t, [sx, sy] = toScreen(bx, by); if (sx < 10 || sy < 95 || sx > cw - 10 || sy > ch - 10) continue;
        const at = (o) => px(sx + e.nx * o, sy + e.ny * o), K1 = at(offs.dark), B = at(offs.ban), K2 = at(offs.light), G = at(offs.ground); if (!K1 || !B || !K2 || !G) continue;
        const gw = toWorld(sx + e.nx * offs.ground, sy + e.ny * offs.ground); if (provinceAt(...gw) !== i || !inModel(...gw)) continue;
        n++; const bg = rlPairDE(B, G), ok = (q) => q.normal >= 20 && q.cvd >= 12, keyOK = (K) => ok(rlPairDE(K, B)) && ok(rlPairDE(K, G));
        const pass = ok(bg) || keyOK(K1) || keyOK(K2); if (ok(bg)) bannerOnly++;
        const c = Math.max(rlWcag(K1, G), rlWcag(B, G), rlWcag(K2, G)); if (c < worst) { worst = c; worstAt = `${p.name} (${p.terrain}) against ${names[e.j]}`; }
        if (!pass) { fails++; if (failList.length < 8) failList.push(`${p.name}/${names[e.j]} B${rgb2hex(B)} G${rgb2hex(G)}`); }
      }
    }
  }
  return { scale: +cam.s.toFixed(3), dpr, widths: w, samples: n, fails, passByBannerAlone: bannerOnly, dottedEdgesSkipped: dotted, worstContrast: +worst.toFixed(2), worstAt, failList };
}
// (4) hit tests near the straight borders (1 to 3 screen px off each shared edge) and at the model's rounded corners
function rlHitCheck() {
  const R = rngFor('relief:hitcheck'), keys = [...EDGE.keys()]; let n = 0, bad = 0, cornerN = 0, cornerBad = 0;
  for (let t = 0; t < 400; t++) {
    const e = EDGE.get(keys[Math.floor(R() * keys.length)]), u = 0.08 + 0.84 * R(), qx = e.a[0] + (e.b[0] - e.a[0]) * u, qy = e.a[1] + (e.b[1] - e.a[1]) * u, L = Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1]) || 1, off = ((R() < 0.5 ? -1 : 1) * (1 + 2 * R())) / cam.s;
    const x = qx - ((e.b[1] - e.a[1]) / L) * off, y = qy + ((e.b[0] - e.a[0]) / L) * off; if (!inModel(x, y)) continue;
    const truth = [...Array(N).keys()].find((i) => d3.polygonContains(cells[i], [x, y])); if (truth == null) continue; n++; if (provinceAt(x, y) !== truth) bad++;
  }
  for (let t = 0; t < 200; t++) { const cx = R() < 0.5 ? RL_RC : W - RL_RC, cy = R() < 0.5 ? RL_RC : H - RL_RC, a = R() * Math.PI * 2, r = RL_RC + (R() - 0.5) * 6 / cam.s, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; if (x < 0 || y < 0 || x > W || y > H) continue; const inside = (x - cx) ** 2 + (y - cy) ** 2 <= RL_RC * RL_RC || (x > RL_RC && x < W - RL_RC) || (y > RL_RC && y < H - RL_RC); cornerN++; if (inMap(x, y) !== inside) cornerBad++; }
  return { samples: n, wrong: bad, cornerSamples: cornerN, cornerWrong: cornerBad };
}
// (5) labels and pieces at the current zoom: names shown, overlaps among labels, between labels and pieces, and between pieces; slots outside the 2 px inset
function rlLayoutCheck() {
  RCK = null; draw(); const lay = RL_PIECE_CACHE.get('L'), band = lay.band, vis = (b) => b[2] + cam.x > 0 && b[0] + cam.x < cw && b[3] + cam.y > 90 && b[1] + cam.y < ch;
  const hit = rlSilHit; // the slot rule's own silhouettes (p61)
  const plates = [...lay.labels.map((l) => ({ text: l.text, box: l.box })), ...lay.chips.map((c) => ({ text: 'chip ' + c.text, box: c.box }))].filter((q) => vis(q.box)), labels = plates.map((q) => q.box), pieces = lay.shapes.filter(vis), wildB = lay.wildOps.filter((o) => o.box).map((o) => o.box).filter(vis);
  let ll = 0, lp = 0, pp = 0; const lpList = [], ppList = [];
  for (let a = 0; a < labels.length; a++) for (let b = a + 1; b < labels.length; b++) if (hit(labels[a], labels[b])) ll++;
  const wildGl = lay.wildOps.filter((o) => o.gl).flatMap((o) => glyphBoxes(o.gl, 0)).filter(vis); // wild names (straight or along the massif) against the place names
  for (const w of [...wildB, ...wildGl]) for (const l of labels) if (hit(w, l)) ll++;
  for (const l of plates) for (const p of pieces) if (hit(l.box, p)) { lp++; if (lpList.length < 6) lpList.push(`${l.text} / ${p[4]} in ${names[p[5]]}`); }
  for (const l of wildB) for (const p of pieces) if (hit(l, p)) lp++;
  for (let a = 0; a < pieces.length; a++) for (let b = a + 1; b < pieces.length; b++) { if (pieces[a][6] === pieces[b][6]) continue; if (hit(pieces[a], pieces[b]) && !(pieces[a][4] === 'seat' && pieces[b][4] === 'army' && lay.armies.some((q) => q.prov === pieces[b][5] && q.front))) { pp++; if (ppList.length < 6) ppList.push(`${pieces[a][4]} ${names[pieces[a][5]]} / ${pieces[b][4]} ${names[pieces[b][5]]}`); } }
  const inView = provs.filter((p) => { const [sx, sy] = toScreen(...cent[p.i]); return sx > 0 && sx < cw && sy > 90 && sy < ch; }), named = new Set(lay.labels.map((l) => l.i));
  const outside = lay.armies.filter((a) => !a.front && (() => { for (let k = 0; k < 8; k++) { const ang = (k * Math.PI) / 4, qx = (a.x + Math.cos(ang) * a.rx) / cam.s, qy = (a.y + Math.sin(ang) * a.ry) / cam.s; if (!d3.polygonContains(cells[a.prov], [qx, qy]) || distToEdge(cells[a.prov], qx, qy) * cam.s < 1.99) return true; } return false; })()).length;
  return { band, scale: +cam.s.toFixed(3), Dpx: +lay.Dpx.toFixed(1), armyBase: +lay.Ba.toFixed(1), names: lay.labels.length, numberChips: lay.chips.length, wildNames: lay.wildOps.length, provincesInView: inView.length, namedInView: inView.filter((p) => named.has(p.i)).length, pctNamed: +((100 * inView.filter((p) => named.has(p.i)).length) / Math.max(1, inView.length)).toFixed(1), labelOverlaps: ll, labelPieceOverlaps: lp, pieceOverlaps: pp, armiesInFront: lay.armies.filter((a) => a.front).length, armiesOutsideInset: outside, examples: { lpList, ppList } };
}
// (6) a stable redraw (two frames from scratch) and a deterministic bake (the generator run again, compared by hash)
function rlStableCheck(rebake) {
  const a = rlHashPx(rlRedraw()), b = rlHashPx(rlRedraw()), out = { first: a, second: b, identical: a === b };
  if (rebake) { const t0 = performance.now(), o = {}; for (const _ of rlBakeGen(o)) void _; out.bake = { first: rlHashPx(RB.img.data), again: rlHashPx(o.img.data), identical: rlHashPx(RB.img.data) === rlHashPx(o.img.data), rebakeMs: Math.round(performance.now() - t0) }; }
  return out;
}
// (7) the design's numbers on this map: own-terrain share, the glow core, the mean-neutral residual, relief invariants, water rules, the escarpment guard
function rlDesignCheck() {
  const { BW, BH, HW, HH, QW, QH, TX, id, LT, hid, hh, hq, DL, pure } = RB, T2 = TX / 2, out = {};
  out.ownTerrainShare = { min: +Math.min(...RB.ownShare.map((o) => o.share)).toFixed(3), under80: RB.ownShare.filter((o) => o.share < 0.8).length, need: 0.8 };
  const GL = rlGlow(), gd = GL.canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, HW, HH).data, tot = new Float64Array(N), core = new Float64Array(N);
  for (let k = 0; k < HW * HH; k++) { const o = hid[k]; if (o === 255 || RL_WILDK[o]) continue; tot[o]++; if (gd[k * 4 + 3] === 0) core[o]++; }
  const cores = provList.filter((i) => prov[i].owner).map((i) => core[i] / tot[i]); out.glowCore = { min: +Math.min(...cores).toFixed(3), median: +cores.sort((a, b) => a - b)[cores.length >> 1].toFixed(3), need: 0.70, note: 'owned provinces; the core is untouched by the glow and the fog hem' };
  out.meanResidualL = +Math.max(...RB.residual.map((r) => Math.abs(r.dL))).toFixed(4);
  // relief invariants on the quarter-resolution field: peaks above passable land within 2 D; meres below land within 1 D
  const H4 = new Uint8Array(QW * QH); for (let y = 0; y < QH; y++) for (let x = 0; x < QW; x++) H4[y * QW + x] = RB.hLT[(y * 2 + 1) * HW + x * 2 + 1];
  let peakMin = Infinity, landMax = -Infinity, mereMax = -Infinity, landMin = Infinity; for (let k = 0; k < QW * QH; k++) { const t = H4[k]; if (t === 7) peakMin = Math.min(peakMin, hq[k]); else if (t === 8) mereMax = Math.max(mereMax, hq[k]); else if (t < 7) { landMax = Math.max(landMax, hq[k]); landMin = Math.min(landMin, hq[k]); } }
  out.reliefInvariants = { peakMin: +peakMin.toFixed(3), passableMax: +landMax.toFixed(3), peaksAbove: peakMin > landMax, mereMax: +mereMax.toFixed(3), landMin: +landMin.toFixed(3), meresBelow: mereMax < landMin, note: 'checked map-wide (stricter than within 2 D and 1 D)' };
  // water: shares, clearance from every border, inside one province
  const clear = RL_P.waterClearD * RLD; let minClear = Infinity, crossings = 0;
  for (const L of [...RB.water.lakes, ...RB.water.ponds]) for (const [x, y] of L.P) minClear = Math.min(minClear, distToEdge(cells[L.i], x, y));
  for (const s of RB.water.streams) for (const [x, y] of s.pts) { if (s.sink === 'edge' && H - y < clear) continue; if (provinceAt(x, y) !== s.i) crossings++; minClear = Math.min(minClear, distToEdge(cells[s.i], x, y)); }
  out.water = { lakes: RB.water.lakes.length, ponds: RB.water.ponds.length, streams: RB.water.streams.length, waterfalls: RB.water.falls.length, lakeMaxShare: +Math.max(0, ...RB.water.lakes.map((l) => l.share)).toFixed(3), pondMaxShare: +Math.max(0, ...RB.water.ponds.map((l) => l.share)).toFixed(3), minClearD: +(minClear / RLD).toFixed(3), needD: RL_P.waterClearD, streamPointsOutsideTheirProvince: crossings, note: 'clearance for waterfalls is measured off the south edge they fall from' };
  // the escarpment guard: |relief| p90 in a 3-unit band along terrain borders against the cores, per terrain (at most 3 x)
  const bandSet = new Uint8Array(BW * BH), r3 = Math.max(1, Math.round(3 * RLK * TX)), rel = {}, q90 = (a) => { if (!a.length) return 0; a.sort((x, y) => x - y); return a[Math.floor(a.length * 0.9)]; };
  for (let y = 1; y < BH - 1; y++) for (let x = 1; x < BW - 1; x++) { const k = y * BW + x, t = LT[k]; if (t >= 7) continue; if (LT[k + 1] !== t && LT[k + 1] < 7) for (let dy = -r3; dy <= r3; dy++) for (let dx = -r3; dx <= r3; dx++) { const yy = y + dy, xx = x + dx; if (yy >= 0 && yy < BH && xx >= 0 && xx < BW) bandSet[yy * BW + xx] = 1; } }
  for (let k = 0; k < BW * BH; k += 3) { const t = LT[k]; if (t >= 7) continue; const v = Math.abs(rlBilin(RB.fS, HW, HH, (k % BW + 0.5) / 2, (((k / BW) | 0) + 0.5) / 2)) * RL_CAP[RL_T[t]]; const r = (rel[RL_T[t]] ??= { band: [], core: [] }); (bandSet[k] ? r.band : pure[k] ? r.core : null)?.push(v); }
  out.escarpment = Object.fromEntries(Object.entries(rel).map(([t, r]) => { const b = q90(r.band), c = q90(r.core); return [t, { bandP90: +b.toFixed(2), coreP90: +c.toFixed(2), ratio: c ? +(b / c).toFixed(2) : null }]; }));
  return out;
}
// (8) memory held by the relief layers and the bake times
function rlMemory() {
  const cv = (c) => (c ? c.width * c.height * 4 : 0), mb = (b) => +(b / 1048576).toFixed(2);
  const ta = ['id', 'LT', 'LP', 'hh', 'hid', 'hLT', 'fS', 'sS', 'shd', 'ao', 'snow', 'DL', 'pure', 'modeRelief', 'hq', 'mid1', 'mid2'].reduce((a, k) => a + (RB[k] ? RB[k].byteLength : 0), 0), wb = ['img', 'mb1', 'mb2'].reduce((a, k) => a + (RB[k] ? RB[k].data.byteLength : 0), 0);
  const bake = cv(RB.canvas), mips = cv(RB.mip1) + cv(RB.mip2), live = cv(GLOW && GLOW.canvas) + cv(MODER && MODER.canvas), rim = RIM ? cv(RIM.canvas) : 0, caches = cv(rlU) + cv(rlO) + cv(canvas) + cv(amb), figs = Object.values(FIGS.fig).reduce((a, f) => a + cv(f.canvas), 0);
  const heap = performance.memory ? mb(performance.memory.usedJSHeapSize) : null;
  return { bakeMB: mb(bake), mipsMB: mb(mips), bakeWithMipsMB: mb(bake + mips), liveRastersMB: mb(live), rimMB: mb(rim), figureAtlasMB: mb(figs), screenCachesMB: mb(caches), rastersKeptMB: mb(ta), unwashedCopiesMB: mb(wb), totalCanvasMB: mb(bake + mips + live + rim + caches + figs), jsHeapMB: heap,
    design: 'bake RGBA8 with mips 14.0 MB on GPU (2048 x 1280); this mockup holds CPU canvases instead of GPU textures, plus the CPU rasters the checks read' };
}
function rlTimes() { return { bakeStepsMs: RB.t, bakeCpuMs: Math.round(RB.total), bakeWallMs: Math.round(RB.wall), slices: RB.slices, figureAtlasMs: Math.round(FIGS.ms), figureAtlas: FIGS.ready ? 'pixi.js 8.22.0' : 'fallback: ' + FIGS.err, glowMs: GLOW ? +GLOW.ms.toFixed(1) : null, modeRasterMs: MODER ? +MODER.ms.toFixed(1) : null, washComposites: RLW.n, washMsTotal: +RLW.ms.toFixed(1), staticRenders: RREB.n, staticMsMean: RREB.n ? +(RREB.ms / RREB.n).toFixed(1) : null, firstPaintMs: Math.round(window.__firstPaintFromScript ?? 0),
  design: 'GPU bake: a few ms to 15 ms on a GPU (estimate); CPU fallback 1.3 s at 1024 and 3.3 s at 2048 (measured under load in the research)' }; }
Object.assign(window.__mock, {
  relief: () => RELIEF(), reliefReady: () => RB.ready && (FIGS.ready || !!FIGS.err),
  reliefMeans: () => rlMeansCheck(), reliefRails: () => rlRailCheck(), reliefHit: () => rlHitCheck(), reliefLayout: () => rlLayoutCheck(), reliefStable: (rebake) => rlStableCheck(rebake), reliefDesign: () => rlDesignCheck(), reliefMemory: () => rlMemory(), reliefTimes: () => rlTimes(),
  reliefChecks: () => ({ hit: rlHitCheck(), layout: rlLayoutCheck(), means: rlMeansCheck(), rails: rlRailCheck(), stable: rlStableCheck(false), design: rlDesignCheck(), memory: rlMemory(), times: rlTimes() }),
  setScale: (s, wx, wy) => { const v = viewRect(); cam.s = s; cam.x = (v.l + v.r) / 2 - wx * s; cam.y = (v.t + v.b) / 2 - wy * s; clampCam(); RCK = null; draw(); return cam.s; },
  pieceAt: (id) => { const L = RL_PIECE_CACHE.get('L'), a = L && L.armies.find((q) => q.ids.includes(id)); if (!a) return null; const r = canvas.getBoundingClientRect(); return [r.left + a.x + cam.x, r.top + a.y + cam.y - a.figH * 0.5]; },
});
{ const prev = window.__mock.checks; window.__mock.checks = () => (RELIEF() ? window.__mock.reliefChecks() : prev()); } // the v3 checks under Painted (v3), the relief checks under Relief
