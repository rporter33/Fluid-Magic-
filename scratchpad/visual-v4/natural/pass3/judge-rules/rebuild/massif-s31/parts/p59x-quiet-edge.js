// ------------------------------------------------------------------ pass 3 prototype "Sculpted massif": the wilds' outline in the natural view (Natural, Ownership)
// The outline is a thin dark line (RL_QE.inkPx, never tinted, faded or fogged), plus, only where the colour-blind wild edge test needs it, a quiet edge: a 2 px band of stone
// just inside the ink, its lightness solved per stretch (the least L* in RL_QE.L that reaches 20 / 12 x m against both sides), never the cream rim. The test is the verifier's
// (rlWildEdgeCheck): across the outline, W the wild's ground 6 to 9 px inside and G the land 6 to 9.5 px outside; a sample passes when W and G differ by 20 / 12 (normal / worst
// deficiency), or a line pixel within 4 px differs by that from both. Here, per stretch (RL_P.wildRim.pieceD D) at the camera's zoom, on the natural bake with the land side's
// fog and tint and the land +-jit L* (the composite's own shading): the pair passes, or else the ink passes against both, or else the stretch takes the quiet edge. Where the
// land sample meets water (drawn over the bake) the stretch takes the edge. Clear, the Terrain mode, the data modes and the passability view keep the v4 rim on every edge.
const RL_QE = { inkPx: 2, edgePx: 2, L: [36, 90], hueK: 0.6, a: 1, b: 6, m: 1.06, mS: 1.14, ink: [0, 0, 0], inkHex: '#000000', pad: 0.02, gapD: 0.05, whole: 0.85, ms: 0, n: 0 };
// the decision reads the land as rendered: the under layer of the static cache (the bake, the wilds' fine raster, the Near detail, the Far relief, the realm tint, the glow,
// the fog and the water, all drawn before the wild outlines), at the pixels the test samples; only the selected neighbour's live tint is added. Margin RL_QE.m on 20 / 12.
function rlQuietEdgeMap(g, gO) { // edge key (c:j) -> { np, bad, L, Ls, Ha, Hb }: bad[piece] = 1 where the stretch needs the quiet edge, Ls[piece] its solved L*
  const t0 = performance.now(), P = RL_P.wildRim, W2 = g.canvas.width, H2 = g.canvas.height, map = new Map(), WAT = hex2rgb(RL_C.waterNat); let tot = 0, ne = 0;
  const sp = state.sel && state.sel.type === 'prov' ? state.sel.id : -1, spT = sp >= 0 && !isWild(sp) ? rlTintOf(sp, true) : null, spC = spT ? [hex2rgb(spT[0]), spT[1]] : null;
  const memo = new Map(), qk = (c) => ((c[0] >> 1) << 14) | ((c[1] >> 1) << 7) | (c[2] >> 1); // colours to 7 bits a channel (the margin covers the rounding)
  const okM = (a, b, m, M2) => { const k = qk(a) * 2097152 + qk(b); let v = M2.get(k); if (v === undefined) { const q = rlPairDE(a, b); v = q.normal >= 20 * m && q.cvd >= 12 * m; M2.set(k, v); } return v; }, memoS = new Map(), ok = (a, b) => okM(a, b, RL_QE.m, memo), okS = (a, b) => okM(a, b, RL_QE.mS, memoS), stone = (L, h) => { const o = [0, 0, 0]; rlLabTo(L, h[0], h[1], o, 0); return o; };
  const med = (a) => { const s2 = a.filter(Boolean).sort((p, q) => rlLumOf(...p) - rlLumOf(...q)); return s2.length ? s2[s2.length >> 1] : null; };
  const W8 = RB.water ? [...RB.water.lakes, ...RB.water.ponds] : [], ST = RB.water ? RB.water.streams : [];
  const wet = (x, y, r) => W8.some((L) => d3.polygonContains(L.P, [x, y])) || ST.some((st) => { for (let k = 0; k < st.pts.length - 1; k++) if (rlSegDist(x, y, st.pts[k][0], st.pts[k][1], st.pts[k + 1][0], st.pts[k + 1][1]) < st.w1 + r) return true; return false; });
  for (const w of WILDS) {
    let bb = [Infinity, Infinity, -Infinity, -Infinity]; for (const c of w.cells) for (const [x, y] of cells[c]) { const [sx, sy] = toScreen(x, y); bb = [Math.min(bb[0], sx), Math.min(bb[1], sy), Math.max(bb[2], sx), Math.max(bb[3], sy)]; }
    const X0 = Math.max(0, Math.floor((bb[0] - 14) * dpr)), Y0 = Math.max(0, Math.floor((bb[1] - 14) * dpr)), X1 = Math.min(W2, Math.ceil((bb[2] + 14) * dpr)), Y1 = Math.min(H2, Math.ceil((bb[3] + 14) * dpr)); if (X1 <= X0 || Y1 <= Y0) continue;
    const img = g.getImageData(X0, Y0, X1 - X0, Y1 - Y0), D = img.data, iw = X1 - X0, ih = Y1 - Y0, O = gO ? gO.getImageData(X0, Y0, X1 - X0, Y1 - Y0).data : null; // gO: the rails already drawn over it
    const pxAt = (sx, sy) => { const X = Math.floor(sx * dpr) - X0, Y = Math.floor(sy * dpr) - Y0; if (X < 0 || Y < 0 || X >= iw || Y >= ih) return null; const k = (Y * iw + X) * 4; if (D[k + 3] < 255) return null; const a = O ? O[k + 3] / 255 : 0;
      return a ? [D[k] + (O[k] - D[k]) * a, D[k + 1] + (O[k + 1] - D[k + 1]) * a, D[k + 2] + (O[k + 2] - D[k + 2]) * a] : [D[k], D[k + 1], D[k + 2]]; };
    for (const e of rlWildOutline(w)) {
      const [ax, ay] = toScreen(...e.a), [bx, by] = toScreen(...e.b), Ls0 = Math.hypot(bx - ax, by - ay), L = Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1]); if (L < 1e-6) continue; tot += L; ne++;
      let nx = -(by - ay) / Ls0, ny = (bx - ax) / Ls0; if (provinceAt(...toWorld((ax + bx) / 2 + nx * 8, (ay + by) / 2 + ny * 8)) !== e.j) { nx = -nx; ny = -ny; } // +n into the passable province (screen px)
      const np = Math.max(1, Math.round(L / (P.pieceD * RLD))), bad = new Uint8Array(np), seen = new Uint8Array(np), CS = [], Ls = new Float32Array(np), Ha = new Float32Array(np), Hb = new Float32Array(np), tinted = e.j === sp && spC;
      for (let pc = 0; pc < np; pc++) { if (isWild(e.j)) { bad[pc] = 1; Ls[pc] = 70; continue; } const n = Math.max(2, Math.ceil(Ls0 / np)), against = new Map(); let hue = null;
        for (let t = 0; t <= n; t++) { const f = (pc + t / n) / np, sx = ax + (bx - ax) * f, sy = ay + (by - ay) * f, [wx, wy] = toWorld(sx, sy), isWet = [6, 7.5, 9.5].some((o) => wet(...toWorld(sx + nx * o, sy + ny * o), 3 / cam.s));
          const Wg = med([6, 7, 8, 9].map((o) => pxAt(sx - nx * o, sy - ny * o))); let G = med([6, 7, 8, 9, 9.5].map((o) => pxAt(sx + nx * o, sy + ny * o))); if (!Wg || !G || !inModel(wx, wy)) continue; seen[pc] = 1;
          if (tinted) { const [H, a] = spC; G = [G[0] + (H[0] - G[0]) * a, G[1] + (H[1] - G[1]) * a, G[2] + (H[2] - G[2]) * a]; }
          const Gs = isWet ? [G, WAT] : [G]; if (!isWet && ok(Wg, G)) continue; if (!isWet && ok(RL_QE.ink, Wg) && ok(RL_QE.ink, G)) continue; // the pair, or the ink, carries it
          if (!hue) { const gl = rgb2lab(G); hue = [gl[1] * RL_QE.hueK, gl[2] * RL_QE.hueK]; } for (const c of [Wg, ...Gs]) against.set(c.map((v) => Math.round(v / 2)).join(','), c); }
        if (!against.size) continue; const cs = [...against.values()].sort((p, q) => rlLumOf(...q) - rlLumOf(...p)); let Lq = RL_QE.L[0]; // the lightest first: the one a light stone is nearest
        while (Lq < RL_QE.L[1] && !cs.every((c) => okS(stone(Lq, hue), c))) Lq += 1; bad[pc] = 1; Ls[pc] = Lq; Ha[pc] = hue[0]; Hb[pc] = hue[1]; CS[pc] = cs; }
      map.set(e.c + ':' + e.j, { np, bad, seen, L, Ls, Ha, Hb, CS });
    }
  }
  map.solve = (hue, cs) => { let Lq = RL_QE.L[0]; while (Lq < RL_QE.L[1] && !cs.every((c) => okS(stone(Lq, hue), c))) Lq += 1; return Lq; }; // a run's one colour against every piece it covers
  RL_QE.ms = +(performance.now() - t0).toFixed(1); RL_QE.n++; Object.assign(RL_WRIM, { key: 'qe', map, tot, edges: ne, ms: RL_QE.ms }); return map;
}
function rlQuietRuns(E) { // the stretches [[t0, t1], ...] of one edge that keep the quiet edge: a short pad, short gaps closed, nearly all of it the whole edge
  const runs = []; for (let pc = 0; pc < E.np; pc++) { if (!E.bad[pc]) continue; const t0 = Math.max(0, pc / E.np - RL_QE.pad), t1 = Math.min(1, (pc + 1) / E.np + RL_QE.pad); if (runs.length && runs[runs.length - 1][1] >= t0 - (RL_QE.gapD * RLD) / E.L) runs[runs.length - 1][1] = t1; else runs.push([t0, t1]); }
  if (runs.reduce((a, [p, q]) => a + q - p, 0) >= RL_QE.whole) return [[0, 1]]; return runs;
}
const rlQuietShare = () => { const m = RL_WRIM.map; if (!m || !RL_WRIM.tot) return null; let r = 0, t = 0; for (const E of m.values()) { const sn = E.seen.reduce((a, v) => a + v, 0) / E.np; if (!sn) continue; t += E.L * sn; r += E.L * Math.min(sn, rlQuietRuns(E).reduce((a, [p, q]) => a + q - p, 0)); } return t ? r / t : null; }; // over the outline in view
function rlDrawQuietEdges(g, px, gU) { // the natural view's wild outlines: the quiet edge where needed (clipped inside the cells), then the thin ink on the whole outline
  const map = rlQuietEdgeMap(gU, g);
  for (const w of WILDS) {
    const ol = rlWildOutline(w), runs = [];
    for (const e of ol) { const E = map && map.get(e.c + ':' + e.j); if (!E) continue; for (const [t0, t1] of rlQuietRuns(E)) { let ha = 0, hb = 0, nh = 0; const cs = []; for (let pc = 0; pc < E.np; pc++) if (E.bad[pc] && (pc + 1) / E.np > t0 - 1e-6 && pc / E.np < t1 + 1e-6) { ha += E.Ha[pc]; hb += E.Hb[pc]; nh++; if (E.CS[pc]) cs.push(...E.CS[pc]); }
      ha = nh ? ha / nh : RL_QE.a; hb = nh ? hb / nh : RL_QE.b; const Lq = cs.length ? map.solve([ha, hb], cs) : 60; runs.push({ ha, hb, a: [e.a[0] + (e.b[0] - e.a[0]) * t0, e.a[1] + (e.b[1] - e.a[1]) * t0], b: [e.a[0] + (e.b[0] - e.a[0]) * t1, e.a[1] + (e.b[1] - e.a[1]) * t1], L: Lq || 60 }); } }
    if (runs.length) { g.save(); g.beginPath(); for (const c of w.cells) { cells[c].forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); } g.clip(); g.lineCap = 'round'; g.lineWidth = (RL_QE.inkPx + 2 * RL_QE.edgePx) * px;
      for (const r of runs) { const o = [0, 0, 0]; rlLabTo(r.L, r.ha, r.hb, o, 0); g.strokeStyle = rgb2hex(o); g.beginPath(); g.moveTo(...r.a); g.lineTo(...r.b); g.stroke(); } g.restore(); }
    g.strokeStyle = RL_QE.inkHex; g.lineWidth = RL_QE.inkPx * px; g.lineCap = 'round'; g.beginPath(); for (const e of ol) { g.moveTo(...e.a); g.lineTo(...e.b); } g.stroke(); g.lineCap = 'butt';
  }
}
const rlQuietEdgeOn = () => rlFaintOn() && !view.pass && !RL_DBG.fullRim && !!RB.ms;
