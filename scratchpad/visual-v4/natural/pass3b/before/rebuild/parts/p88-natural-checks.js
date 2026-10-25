
// ------------------------------------------------------------------ the natural view's checks (natural §13): window.__mock.reliefNatural, reliefLines, reliefSeats, reliefHoverChips, reliefCliff
// Read-only helpers for automated review. Colours are measured on the rendered canvas (the composite as drawn) or on the bake as baked, never on the design's tables.
const rlL = (r, g, b) => { const y = 0.2126 * s2l(r) + 0.7152 * s2l(g) + 0.0722 * s2l(b); return y > 0.008856 ? 116 * Math.cbrt(y) - 16 : 903.3 * y; };
const rlOk = (r, g, b) => { const l = Math.cbrt(0.4122214708 * s2l(r) + 0.5363325363 * s2l(g) + 0.0514459929 * s2l(b)), m = Math.cbrt(0.2119034982 * s2l(r) + 0.6806995451 * s2l(g) + 0.1073969566 * s2l(b)), s = Math.cbrt(0.0883024619 * s2l(r) + 0.2817188376 * s2l(g) + 0.6299787005 * s2l(b)); return Math.hypot(1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s); };
const rlPct = (a, f) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(f * s.length))]; };
const r3 = (v) => (v == null ? null : +v.toFixed(3));
// (1) chroma: no texel of the natural bake over OKLCH C 0.10, nor any material (§2.3)
function rlNatChroma() {
  const Lk = RB.L.natural; if (!Lk) return { baked: false }; const d = Lk.img.data, { LT } = RB, memo = new Map(); let n = 0, over = 0, max = 0; const hist = [];
  for (let k = 0; k < LT.length; k += 2) { if (LT[k] >= 7) continue; const o = k * 4, key = (d[o] << 16) | (d[o + 1] << 8) | d[o + 2]; let c = memo.get(key); if (c == null) { c = rlOk(d[o], d[o + 1], d[o + 2]); memo.set(key, c); } n++; if (c > 0.10) over++; if (c > max) max = c; if ((k & 63) === 0) hist.push(c); }
  const mats = []; for (const [t, M] of Object.entries(RL_NAT.mat)) for (const [nm, lab] of Object.entries(M)) { const o = [0, 0, 0]; rlLabTo(lab[0], lab[1], lab[2], o, 0); mats.push([t + '.' + nm, rgb2hex(o), +rlOk(...o).toFixed(3)]); }
  mats.sort((a, b) => b[2] - a[2]);
  return { texels: n, over010: over, max: r3(max), p99: r3(rlPct(hist, 0.99)), cap: 0.10, materialsMax: mats[0], materialsOver010: mats.filter((m) => m[2] > 0.10).length, pass: over === 0 && mats.every((m) => m[2] <= 0.10) };
}
// (1b) snow (§10 defect 2, both looks): no passable texel of the bake within 20 / 12 of the snow #F2EEE6, raw and under the unexplored haze of the look
function rlSnowCheck(look = rlShownLook()) {
  const Lk = RB.L[look]; if (!Lk) return { baked: false, look }; const d = Lk.img.data, { LT } = RB, sn = hex2rgb(RL_C.snow), F = RL_P.fog[look], G = hex2rgb(RL_C.gesso), memo = new Map(), byT = {};
  for (let k = 0; k < LT.length; k++) { const t = LT[k]; if (t >= 7 || d[k * 4 + 3] < 255) continue; const key = (d[k * 4] << 16) | (d[k * 4 + 1] << 8) | d[k * 4 + 2]; let v = memo.get(key);
    if (!v) { const c = [d[k * 4], d[k * 4 + 1], d[k * 4 + 2]], e = rlPairDE(c, sn), hz = c.map((x, j) => x + (G[j] - x) * F.hemPeak), eh = rlPairDE(hz, sn); v = [e.normal, e.cvd, eh.normal, eh.cvd]; memo.set(key, v); }
    const b = (byT[RL_T[t]] ??= { n: 0, near: 0, nearHaze: 0, minN: 99, minC: 99 }); b.n++; if (v[0] < 20 || v[1] < 12) b.near++; if (v[2] < 20 || v[3] < 12) b.nearHaze++; b.minN = Math.min(b.minN, v[0]); b.minC = Math.min(b.minC, v[1]); }
  const rows = Object.fromEntries(Object.entries(byT).map(([t, b]) => [t, { texels: b.n, within2012: b.near, withinUnderHaze: b.nearHaze, minNormal: +b.minN.toFixed(1), minCvd: +b.minC.toFixed(1) }]));
  return { look, byTerrain: rows, pass: Object.values(byT).every((b) => !b.near && !b.nearHaze) };
}
// (2) N4: each province's own cover. Whole province >= 0.70 own (copses and hedge trees as forest); core (0.15 D in) >= 0.95 own (copses as its own); copses <= 25% of a core
function rlNatCover() {
  if (!RB.nat) return { baked: false }; const { cls } = RB.nat, { BW, BH, TX, id, LT } = RB, A = new Map();
  for (let ty = 1; ty < BH; ty += 2) for (let tx = 1; tx < BW; tx += 2) {
    const k = ty * BW + tx, i = id[k]; if (i === 255 || RL_WILDK[i] || LT[k] >= 7) continue; const own = RL_TI[terr[i]], c = cls[k], x = (tx + 0.5) / TX, y = (ty + 0.5) / TX;
    let a = A.get(i); if (!a) A.set(i, (a = { n: 0, ownF: 0, ownC: 0, cn: 0, cownC: 0, cownF: 0, ccopse: 0 }));
    const asForest = c === 9 || c === 10 ? 2 : c, isOwnF = asForest === own, isOwnC = c === own || ((c === 9 || c === 10) && (own === 0 || own === 3 || own === 1)) || (c === 9 && own === 2);
    a.n++; if (isOwnF) a.ownF++; if (isOwnC) a.ownC++;
    if (distToEdge(cells[i], x, y) >= 0.15 * RLD) { a.cn++; if (isOwnC) a.cownC++; if (isOwnF) a.cownF++; if (c === 9) a.ccopse++; }
  }
  const rows = [...A].map(([i, a]) => ({ name: names[i], terrain: terr[i], whole: a.ownF / a.n, wholeOwnCopses: a.ownC / a.n, core: a.cn ? a.cownC / a.cn : null, coreCopsesAsForest: a.cn ? a.cownF / a.cn : null, copseCore: a.cn ? a.ccopse / a.cn : 0 }));
  const col = (k) => rows.map((r) => r[k]).filter((v) => v != null), byT = {};
  for (const r of rows) { const b = (byT[r.terrain] ??= { n: 0, wholeMin: 1, coreMin: 1 }); b.n++; b.wholeMin = Math.min(b.wholeMin, r.whole); if (r.core != null) b.coreMin = Math.min(b.coreMin, r.core); }
  const worst = rows.reduce((p, q) => (q.whole < p.whole ? q : p));
  const scan = [rlNatCoverGen, rlParcel, rlH2].map((f) => f.toString()).join('\n').match(/Math\.(cos|sin|tan|exp|log|pow|atan2|random)\b/g) ?? []; // N8: the cover raster uses arithmetic, sqrt, floor and table noise only
  return { sourceScan: { transcendentals: scan, pass: !scan.length }, provinces: rows.length, wholeMin: r3(Math.min(...col('whole'))), wholeMedian: r3(rlPct(col('whole'), 0.5)), wholeOwnCopsesMin: r3(Math.min(...col('wholeOwnCopses'))), coreMin: r3(Math.min(...col('core'))), coreCopsesAsForestMin: r3(Math.min(...col('coreCopsesAsForest'))), copseCoreMax: r3(Math.max(...col('copseCore'))), worst: `${worst.name} (${worst.terrain}) ${worst.whole.toFixed(3)}`, byTerrain: Object.fromEntries(Object.entries(byT).map(([t, b]) => [t, { n: b.n, wholeMin: r3(b.wholeMin), coreMin: r3(b.coreMin) }])), need: { whole: 0.70, core: 0.95, copseCore: 0.25 }, pass: Math.min(...col('whole')) >= 0.70 && Math.min(...col('core')) >= 0.95 && Math.max(...col('copseCore')) <= 0.25 };
}
// (3) the readers: p88b-readers.js
function rlNaturalCheck(readers = true) { return { look: rlShownLook(), chroma: rlNatChroma(), cover: rlNatCover(), snow: rlSnowCheck('natural'), readers: readers && rlShownLook() === 'natural' && state.mode === 'ownership' ? rlNatReader() : `not run (${rlShownLook() !== 'natural' ? 'the look on screen is Clear' : 'a data mode replaces the terrain colours'})` }; }
// (4) lines on rendered pixels (§8.2): per drawn segment, the best contrast of the line's pixels (the partner's counted) against the same pixel without lines.
// Hairline (+-3 px) >= 2.3:1, internal keyline (0 to 6 px on its lower-right side) >= 3.2:1; one keyline per edge; no hairline wider than 3 px (3.5 px: a partnered pair on a diagonal edge below ratio 1.5, pass 2). Fog-dashed edges are skipped.
// pass 2: dense (every 2 px along the edge, the joints included, as the verifier samples) or at segment midpoints; faint lines (the natural view) are reported apart:
// they are held under the floor (a faint line never draws the grid back), and the floor is checked where it is drawn (around the selected province; the hover, reliefLinesHover)
function rlLinesCheck(opts = {}) {
  const land = rlRedraw(['rails', 'pieces', 'labels', 'badges', 'arrows']), lines = rlRedraw(['pieces', 'labels', 'badges', 'arrows']), W2 = canvas.width, H2 = canvas.height, v = viewRect(), dense = opts.dense !== false;
  const px = (d, sx, sy) => { const X = Math.floor(sx * dpr), Y = Math.floor(sy * dpr); if (X < 0 || Y < 0 || X >= W2 || Y >= H2) return null; const k = (Y * W2 + X) * 4; return [d[k], d[k + 1], d[k + 2]]; };
  const R = { hair: [], int: [], faint: [], skippedFog: 0, edges: RL_LINES.drawn.length, flips: RL_LINES.stats.flips, partners: RL_LINES.stats.partners, segs: RL_LINES.stats.segs, maxHairWidthPx: RL_LINES.stats.maxWidthPx }, worst = { hair: null, int: null }, under = { hair: [], int: [] };
  const bevel = { ulLight: 0, ulDark: 0, lrLight: 0, lrDark: 0, softLips: 0 }; for (const dr of RL_LINES.drawn) if (dr.kind === 'hair' && dr.keyLR) { bevel[dr.key === 'light' ? 'ulLight' : 'ulDark']++; bevel[dr.keyLR === 'light' ? 'lrLight' : 'lrDark']++; if (dr.soft) bevel.softLips++; } // AD fix 1: the bevel's keys per edge
  const inView = (sx, sy) => sx >= v.l + 8 && sx <= v.r - 8 && sy >= v.t + 8 && sy <= v.b - 8, best = (sx, sy, nx, ny, o0, o1) => { let b = 0; for (let o = o0; o <= o1; o += 0.5) { const a = px(lines, sx + nx * o, sy + ny * o), c = px(land, sx + nx * o, sy + ny * o); if (a && c) b = Math.max(b, rlWcag(a, c)); } return b; };
  for (const dr of RL_LINES.drawn) {
    if (dr.fog) { R.skippedFog++; continue; } const e = dr.e;
    if (dr.faint) { const [ax, ay] = toScreen(...e.a), [bx, by] = toScreen(...e.b), Lg = Math.hypot(bx - ax, by - ay), nx = -(by - ay) / (Lg || 1), ny = (bx - ax) / (Lg || 1); for (let s = 4; s < Lg - 4; s += 3) { const sx = ax + ((bx - ax) * s) / Lg, sy = ay + ((by - ay) * s) / Lg; if (inView(sx, sy)) R.faint.push(best(sx, sy, nx, ny, -2, 2)); } continue; }
    const st = rlSegStyles(e, dr.kind, rlLineCtx()), { nx, ny } = st, offs = dr.kind === 'hair' ? [-3, 3] : [0, 6];
    for (const sg of st.segs) {
      const [x0, y0] = toScreen(sg.x0, sg.y0), [x1, y1] = toScreen(sg.x1, sg.y1), Ls = Math.hypot(x1 - x0, y1 - y0); if (Ls < 0.5) continue; // line pass: was Ls < 6, which skipped every segment at Far
      const ts = dense ? (() => { const a = []; for (let q = 0; q <= Ls; q += opts.step ?? 2) a.push(q / Ls); return a; })() : [0.5];
      for (const t of ts) {
        const [ea, eb] = [toScreen(...e.a), toScreen(...e.b)], sx = x0 + (x1 - x0) * t, sy = y0 + (y1 - y0) * t; if (!inView(sx, sy) || Math.hypot(sx - ea[0], sy - ea[1]) < 4 || Math.hypot(sx - eb[0], sy - eb[1]) < 4) continue; // the edge's own ends meet other lines
        const c = best(sx, sy, nx, ny, offs[0], offs[1]); R[dr.kind].push(c); const lim = dr.kind === 'hair' ? 2.3 : 3.2;
        if (c < lim && under[dr.kind].length < 6) under[dr.kind].push(`${names[dr.i]}/${names[dr.j]} ${c.toFixed(2)} at ${t.toFixed(2)}`);
        if (!worst[dr.kind] || c < worst[dr.kind].c) worst[dr.kind] = { c: +c.toFixed(2), at: `${names[dr.i]}/${names[dr.j]}`, key: sg.key, partner: !!sg.partner };
      }
    }
  }
  const sum = (a, lim) => ({ samples: a.length, min: r3(Math.min(...a)), median: r3(rlPct(a, 0.5)), under: a.filter((x) => x < lim).length, limit: lim }), fa = R.faint;
  const faint = { edges: RL_LINES.drawn.filter((d) => d.faint).length, samples: fa.length, median: r3(rlPct(fa, 0.5)), p90: r3(rlPct(fa, 0.9)), max: r3(fa.length ? Math.max(...fa) : null), overFloor: fa.filter((x) => x >= 2.3).length, note: 'the natural view: neutral and internal lines faint (owner, 2026-10-23); held under the hairline floor' };
  return { look: rlShownLook(), band: bandOf(cam.s), dpr, dense, hairline: sum(R.hair, 2.3), internal: sum(R.int, 3.2), faint, worst, underExamples: under, bevel, edges: R.edges, segs: R.segs, partners: R.partners, keylineFlipsAlongEdges: R.flips, maxHairWidthPx: R.maxHairWidthPx, skippedFogDashed: R.skippedFog,
    pass: R.hair.every((x) => x >= 2.3) && R.int.every((x) => x >= 3.2) && R.flips === 0 && R.maxHairWidthPx <= 3.5 && (!fa.length || rlPct(fa, 0.9) < 2.3) };
}
// (5) seats (§10 defect 3): the light pixels the pieces layer adds at hamlets and huts against the pixel beneath, p95 per seat <= 2.5 (Mid) or 4 (Near)
function rlSeatsCheck() {
  const on = rlRedraw(['rails', 'labels', 'badges', 'arrows', 'nonseats']), off = rlRedraw(['rails', 'labels', 'badges', 'arrows', 'pieces']), W2 = canvas.width, H2 = canvas.height, lay = RL_PIECE_CACHE.get('L'), k = cam.s / lay.s, v = viewRect(), lim = bandOf(cam.s) === 'near' ? 4 : 2.5, kinds = {};
  for (const [i, st] of lay.seats) {
    if (!st.kind || !st.box) continue; const cx = st.x * k + cam.x, cy = st.y * k + cam.y, bx = st.box.map((q, j) => q * k + (j % 2 ? cam.y : cam.x)); if (cx < v.l || cx > v.r || cy < v.t || cy > v.b) continue; const cs = []; // the seat's own box (houses, roofs to shadows), seats drawn alone
    for (let y = Math.floor((bx[1] - 2) * dpr); y <= (bx[3] + 2) * dpr; y++) for (let x = Math.floor((bx[0] - 2) * dpr); x <= (bx[2] + 2) * dpr; x++) { if (x < 0 || y < 0 || x >= W2 || y >= H2) continue; const q = (y * W2 + x) * 4; if (on[q] === off[q] && on[q + 1] === off[q + 1] && on[q + 2] === off[q + 2]) continue; const A = [on[q], on[q + 1], on[q + 2]], B2 = [off[q], off[q + 1], off[q + 2]]; if (rlL(...A) > rlL(...B2)) cs.push(rlWcag(A, B2)); }
    if (cs.length < 6) continue; const b = (kinds[st.kind] ??= { seats: 0, over: [], p95: [] }); b.seats++; const p = rlPct(cs, 0.95); b.p95.push(p); if (p > lim) b.over.push(`${names[i]} ${p.toFixed(2)}`);
  }
  const out = { band: bandOf(cam.s), Dpx: +(MED_DIAM * cam.s).toFixed(1), limit: lim, look: rlShownLook() }; for (const [kd, b] of Object.entries(kinds)) out[kd] = { seats: b.seats, p95Worst: r3(Math.max(...b.p95)), p95Median: r3(rlPct(b.p95, 0.5)), over: kd === 'town' ? 'towns are not muted (bases with rims)' : b.over };
  out.pass = ['hamlet', 'hut'].every((kd) => !out[kd] || !out[kd].over.length); return out;
}
// (6) hover names against day chips (§10 defect 4): every province in view hovered in turn
function rlHoverChipsCheck() {
  const keep = hoverProv, v = viewRect(); let hovered = 0, moved = 0, chipOnTop = 0, over = 0; const ex = [];
  for (const i of provList) { const [sx, sy] = toScreen(...cent[i]); if (sx < v.l || sx > v.r || sy < v.t || sy > v.b) continue; hoverProv = i; draw(); const L = RL_LIVE.list.find((q) => q.i === i); if (!L) continue; hovered++; if (L.moved) moved++; if (L.chipsOnTop) chipOnTop++;
    const hit = RL_CHIPS.some((q) => L.box[2] > q.box[0] && L.box[0] < q.box[2] && L.box[3] > q.box[1] && L.box[1] < q.box[3]); if (hit && !L.chipsOnTop) { over++; ex.push(names[i]); } else if (L.moved && ex.length < 4) ex.push(`${names[i]} moved`); }
  hoverProv = keep; draw(); const dc = rlDayChipsCheck(); return { chips: RL_CHIPS.map((q) => q.text), hovered, namesMoved: moved, chipRedrawnOnTop: chipOnTop, namesOverAChip: over, examples: ex, dayChipsOverNames: dc.overlaps, dayChipExamples: dc.examples, pass: over === 0 && dc.overlaps === 0 };
}
// (6b) AD fix 11: no day chip (the path's and the arrows') covers a placed name, a wild's name, or sits under the alerts ribbon, in the frame as drawn
function rlDayChipsCheck() {
  draw(); const lay = RL_PIECE_CACHE.get('L'), sh = rlLiveBox(lay), names = lay ? [...lay.labels.map((l) => ({ t: l.text, b: sh(l.box) })), ...lay.wildOps.flatMap((o) => (o.gl ? glyphBoxes(o.gl, 0) : o.box ? [o.box] : []).map((b) => ({ t: o.w.name, b: sh(b) })))] : [], room = rlChipRoom();
  let n = 0; const ex = []; for (const c of RL_CHIPS) { const r = c.box; for (const q of names) if (r[2] > q.b[0] && r[0] < q.b[2] && r[3] > q.b[1] && r[1] < q.b[3]) { n++; if (ex.length < 4) ex.push(`${c.text} over ${q.t}`); break; } if (!room.clearOfRibbon(r)) { n++; if (ex.length < 4) ex.push(`${c.text} under the alerts`); } for (const q of RL_CHIPS) if (q !== c && q.box !== r && r[2] > q.box[0] + 1 && r[0] < q.box[2] - 1 && r[3] > q.box[1] + 1 && r[1] < q.box[3] - 1 && RL_CHIPS.indexOf(q) > RL_CHIPS.indexOf(c)) { n++; if (ex.length < 4) ex.push(`${c.text} under ${q.text}`); } }
  // polish: no chip under an army piece, measured on the pieces as placed in the DOM after this frame (each piece canvas's pixels with alpha over 24 inside the chip, 1 px in)
  const cr = canvas.getBoundingClientRect(), pcs = [...document.querySelectorAll('#layer .mini')].filter((e) => e.offsetParent && e.style.display !== 'none').map((e) => { const cv = e.querySelector('canvas'), q = cv.getBoundingClientRect(); return { cv, x: q.left - cr.left, y: q.top - cr.top, w: q.width, h: q.height }; }); let under = 0, worst = 0; const uex = [];
  for (const c of RL_CHIPS) { const r = c.box; let px = 0, tot = 0; for (let y = r[1] + 1.5; y < r[3] - 1; y += 1) for (let x = r[0] + 1.5; x < r[2] - 1; x += 1) { tot++; for (const q of pcs) { if (x < q.x || y < q.y || x >= q.x + q.w || y >= q.y + q.h) continue; const k = q.cv.width / q.w, X = Math.floor((x - q.x) * k), Y = Math.floor((y - q.y) * k), a = (q.d ??= q.cv.getContext('2d').getImageData(0, 0, q.cv.width, q.cv.height).data)[(Y * q.cv.width + X) * 4 + 3]; if (a > 24) { px++; break; } } }
    const sh = tot ? px / tot : 0; if (px) { under++; if (uex.length < 4) uex.push(`${c.text} ${(100 * sh).toFixed(1)}%`); } worst = Math.max(worst, sh); }
  return { chips: RL_CHIPS.length, overlaps: n, examples: ex, underPieces: under, underPiecesWorstShare: r3(worst), underExamples: uex, pass: n === 0 && under === 0 };
}
// (7) the cliff face (§10 defect 5) on the rendered view: the stripe index (the share of gradient energy across x) and light streak columns per 100 px
function rlCliffCheck() {
  const d = rlRedraw([]), W2 = canvas.width, [x0, yE] = toScreen(RL_RC + 4, H), [x1] = toScreen(W - RL_RC - 4, H), fh = (RL_FACE - RL_PLINTH) * cam.s, pw = W / 2, [qx0] = toScreen(pw - (RL_P.plaqueD * RLD) / 2 - 4, H), [qx1] = toScreen(pw + (RL_P.plaqueD * RLD) / 2 + 4, H);
  const X0 = Math.ceil(Math.max(0, x0) * dpr), X1 = Math.floor(Math.min(cw, x1) * dpr), Y0 = Math.ceil((yE + 2) * dpr), Y1 = Math.floor((yE + fh - 2) * dpr); if (Y1 - Y0 < 6 || X1 - X0 < 40) return { visible: false };
  const fall = (X) => RB.water.falls.some((f) => Math.abs(X / dpr - toScreen(f.x, H)[0]) < f.w * cam.s * 1.6 + 3) || (X / dpr > qx0 && X / dpr < qx1); // waterfalls and the plaque are not the rock
  const cols = []; for (let X = X0; X < X1; X++) if (!fall(X)) cols.push(X); const Lm = cols.map((X) => { const c = []; for (let Y = Y0; Y <= Y1; Y++) { const k = (Y * W2 + X) * 4; c.push(rlL(d[k], d[k + 1], d[k + 2])); } return c; });
  let ex = 0, ey = 0; for (let c = 0; c + 1 < Lm.length; c++) { if (cols[c + 1] !== cols[c] + 1) continue; for (let r = 0; r + 1 < Lm[c].length; r++) { ex += (Lm[c + 1][r] - Lm[c][r]) ** 2; ey += (Lm[c][r + 1] - Lm[c][r]) ** 2; } }
  const mean = Lm.map((c) => c.reduce((a, b) => a + b, 0) / c.length); let streak = 0; for (let c = 0; c < mean.length; c++) { const w = mean.slice(Math.max(0, c - 4), c + 5).sort((a, b) => a - b); if (mean[c] - w[w.length >> 1] > 3) streak++; }
  const all = Lm.flat().sort((a, b) => a - b), q = (f) => all[Math.min(all.length - 1, Math.floor(f * all.length))]; // polish: the face's lightness spread, the verifier's statistic (p95 - p5 of L* over the face, falls and plaque left out), 25 or more
  return { visible: true, facePx: +(fh).toFixed(1), columns: cols.length, stripeIndex: r3(ex / (ex + ey)), lightStreaksPer100px: +((100 * streak) / cols.length).toFixed(1), faceL: { p5: +q(0.05).toFixed(1), p50: +q(0.5).toFixed(1), p95: +q(0.95).toFixed(1), spread: +(q(0.95) - q(0.05)).toFixed(1), need: 25 }, design: { before: [0.568, 15.4], after: [0.141, 0] } };
}
Object.assign(window.__mock, {
  reliefNatural: (readers) => rlNaturalCheck(readers !== false), reliefSnow: (look) => rlSnowCheck(look), reliefLines: (o) => rlLinesCheck(o), reliefSeats: () => rlSeatsCheck(), reliefHoverChips: () => rlHoverChipsCheck(), reliefCliff: () => rlCliffCheck(), reliefDayChips: () => rlDayChipsCheck(),
  reliefNearDetail: () => ({ strength: +rlNearK().toFixed(3), texelCssPx: +(cam.s * RB.TX).toFixed(2), drawn: !!RL_ND.cv && RL_ND.key !== '', lastMs: RL_ND.ms, builds: RL_ND.n, pixels: RL_ND.px }),
  reliefChecks: () => { const nat = rlShownLook() === 'natural'; return { look: rlShownLook(), mode: state.mode, hit: rlHitCheck(), layout: rlLayoutCheck(), means: rlMeansCheck(), natural: nat ? rlNaturalCheck(true) : 'not applicable (Clear): the 20 / 12 means and pairs run', snow: rlSnowCheck(), rails: rlRailCheck(), lines: rlLinesCheck(), seats: rlSeatsCheck(), stable: rlStableCheck(false), design: rlDesignCheck(), memory: rlMemory(), times: rlTimes() }; },
});
