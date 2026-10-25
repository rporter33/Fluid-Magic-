// ------------------------------------------------------------------ pass 3b checks (window.__mock): the wilds' edges after the owner's answer of 2026-10-24 ("Soft, like province lines")
// (1) reliefWildRest: the natural view at rest draws no outline or band (the frame with the wild-edge layer on and off is the same, pixel for pixel), and the landform marks
// each wild's extent. Per wild, on its whole outline and its own raster (its landform share, p58y rk8; every 0.01 D along each edge to a passable province), the distance
// to the nearest landform inside the wild (any direction: the inward normal alone ran out of the wild at sharp corners): pass when at least RL_WR.share of it lies within RL_WR.d D and its p90 within RL_WR.p90 D (no band). (A first version read the share on the outline
// in view only, so one cove filling a Near view could fail a wild whose foot holds everywhere else.) In view, every 2 px along the outline, the same distance on the raster and
// on the rendered land (rock: C* under 9 and L* under 72; water: a* under -8 and b* under 6), with the art judge's lighter inner line and an ink-like dark line, as figures;
// the landform as drawn must also stand within RL_WR.viewP90 D at p90 (no band of land in view; judged where at least RL_WR.viewD D of a wild's outline is in view, so a
// single cove filling the closest zoom is not taken for a band).
// (2) reliefWildFocusSweep: the colour-blind wild-edge test (rlWildEdgeMargins, 20 / 12 against both sides) on the edges each focus state draws: the wild hovered, every
// neighbour hovered and selected, and a march previewed and planned across each wild (one of your armies set beside it); in Clear, the Terrain mode and the data modes the
// test runs on every edge (they draw them all). Views: the start, Far (60 px), the least zoom, Mid, the reference zoom, Near and the closest zoom on each wild.
const RL_WR = { px: 5, d: 0.05, share: 0.8, p90: 0.09, maxD: 0.2, step: 0.01, viewP90: 0.12, viewD: 0.5 };
function rlWildFootStats(w) { // a wild's whole outline on its raster (world units; kept on the bake's box): from each point, the distance to the nearest landform texel inside the wild
  const B = RB.ms && RB.ms.boxOf.get(w.cells[0]); if (!B || !B.rk8) return null; if (B.footStats) return B.footStats;
  const FT = RB.TX * RL_MS.F, D = MED_DIAM, mine = new Set(w.cells), R = Math.ceil(RL_WR.maxD * D * FT), ds = [];
  const lfAt = (fx, fy) => { const x = (fx + B.X0) / FT, y = (fy + B.Y0) / FT; return mine.has(provinceAt(x, y)) ? rlBilin(B.rk8, B.nw, B.nh, fx, fy) / 255 : 0; };
  const near = (fx, fy) => { for (let r = 0; r <= R; r += 0.5) { const n = Math.max(1, Math.ceil((2 * Math.PI * r) / 0.75)); for (let k = 0; k < n; k++) { const a = (2 * Math.PI * k) / n; if (lfAt(fx + r * Math.cos(a), fy + r * Math.sin(a)) >= 0.5) return r / FT / D; } } return RL_WR.maxD; };
  for (const e of rlWildOutline(w)) { if (e.j < 0 || isWild(e.j)) continue; const [ax, ay] = e.a, [bx, by] = e.b, Lg = Math.hypot(bx - ax, by - ay); if (Lg < 0.01 * D) continue;
    for (let t = 0.005 * D; t < Lg - 0.005 * D; t += RL_WR.step * D) { const sx = ax + ((bx - ax) * t) / Lg, sy = ay + ((by - ay) * t) / Lg; ds.push(near(sx * FT - B.X0, sy * FT - B.Y0)); } }
  ds.sort((p, q) => p - q); const S = { samples: ds.length, p50D: r3(rlPct(ds, 0.5)), p90D: r3(rlPct(ds, 0.9)), within: r3(ds.filter((q) => q <= RL_WR.d).length / Math.max(1, ds.length)) }; S.pass = ds.length > 0 && S.within >= RL_WR.share && S.p90D <= RL_WR.p90; B.footStats = S; return S;
}
function rlWildRestCheck() {
  if (!rlQuietEdgeOn()) return { applicable: false, look: rlShownLook(), mode: state.mode, note: 'Clear, the Terrain mode and the data modes draw every wild edge (reliefWildEdge tests them)', pass: true };
  const keep = { h: hoverProv, s: state.sel, l: RL_LINK.prov, m: moveLine }; hoverProv = -1; state.sel = null; RL_LINK.prov = -1; moveLine = null;
  try {
    const sk = ['pieces', 'labels', 'badges', 'arrows'], a = rlRedraw(sk), b = rlRedraw([...sk, 'wildEdge']); let diff = 0; for (let k = 0; k < a.length; k += 4) if (a[k] !== b[k] || a[k + 1] !== b[k + 1] || a[k + 2] !== b[k + 2]) diff++;
    const land = rlRedraw(['rails', ...sk]), W2 = canvas.width, H2 = canvas.height, v = viewRect(), s = cam.s, Dpx = s * MED_DIAM, reach = Math.max(RL_WR.px, RL_WR.d * Dpx), lim = Math.min(RL_WR.maxD * Dpx, 160), F = RL_MS.F, FT = RB.TX * F;
    const px = (sx, sy) => { const X = Math.floor(sx * dpr), Y = Math.floor(sy * dpr); if (X < 0 || Y < 0 || X >= W2 || Y >= H2) return null; const k = (Y * W2 + X) * 4; return [land[k], land[k + 1], land[k + 2]]; };
    const lfAt = (wx, wy) => { const c = provinceAt(wx, wy); if (c < 0 || !isWild(c)) return 0; const B = RB.ms && RB.ms.boxOf.get(c); if (!B || !B.rk8) return 0; return rlBilin(B.rk8, B.nw, B.nh, wx * FT - B.X0, wy * FT - B.Y0) / 255; };
    const rows = {};
    const labAt = (sx, sy) => { const c = px(sx, sy); return c ? rgb2lab(c) : null; }, mean3 = (a) => { const b = a.filter(Boolean); if (!b.length) return null; return [0, 1, 2].map((z) => b.reduce((p, q) => p + q[z], 0) / b.length); }, de = (a, b) => (a && b ? Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) : null);
    for (const w of WILDS) { const R = { n: 0, raster: [], pixels: [], lighter: 0, darker: 0, seam: [], base: [] }, mere = w.kind === 'mere';
      for (const e of rlWildOutline(w)) {
        const [ax, ay] = toScreen(...e.a), [bx, by] = toScreen(...e.b), Lg = Math.hypot(bx - ax, by - ay); if (Lg < 12) continue; let nx = -(by - ay) / Lg, ny = (bx - ax) / Lg;
        if (provinceAt(...toWorld((ax + bx) / 2 + nx * 8, (ay + by) / 2 + ny * 8)) !== e.j) { nx = -nx; ny = -ny; } // +n into the passable province
        for (let t = 5; t < Lg - 5; t += 2) {
          const sx = ax + ((bx - ax) * t) / Lg, sy = ay + ((by - ay) * t) / Lg; if (sx < v.l + 14 || sx > v.r - 14 || sy < v.t + 14 || sy > v.b - 14) continue;
          if (!inModel(...toWorld(sx + nx * 10, sy + ny * 10)) || provinceAt(...toWorld(sx - nx * 4, sy - ny * 4)) !== e.c) continue; R.n++;
          let dr = null, dp = null, run = 0;
          for (let o = 0.5; o <= lim; o += 0.5) { const qx = sx - nx * o, qy = sy - ny * o, [wx, wy] = toWorld(qx, qy); if (!isWild(provinceAt(wx, wy))) break;
            if (dr === null && lfAt(wx, wy) >= 0.5) dr = o;
            if (dp === null) { const c = px(qx, qy); if (c) { const l = rgb2lab(c), hit = mere ? l[1] < -8 && l[2] < 6 : Math.hypot(l[1], l[2]) < 9 && l[0] < 72; run = hit ? run + 1 : 0; if (run >= 3) dp = o - 1; } }
            if (dr !== null && dp !== null) break; }
          R.raster.push(dr ?? lim); R.pixels.push(dp ?? lim);
          if (lfAt(...toWorld(sx - nx * 3.5, sy - ny * 3.5)) < 0.05) { const band = (o0) => mean3([0, 0.75, 1.5, 2.25].map((o) => labAt(sx + nx * (o0 + o), sy + ny * (o0 + o)))), s1 = de(band(-3.25), band(1)), b1 = de(band(6), band(10.25)); if (s1 !== null && b1 !== null) { R.seam.push(s1); R.base.push(b1); } } // the seam: the land just inside (1 to 3.25 px, where the strip is land) against just outside, beside two land bands as far apart outside
          const L = (o) => { const c = px(sx + nx * o, sy + ny * o); return c ? rgb2lab(c)[0] : null; }, ins = [0, 1, 2, 3, 4].map((o) => L(-o)).filter((q) => q !== null), gi = [7, 8, 9, 10].map((o) => L(-o)).filter((q) => q !== null), go = [7, 8, 9, 10].map((o) => L(o)).filter((q) => q !== null);
          if (ins.length && gi.length && go.length) { const mi = gi.reduce((p, q) => p + q, 0) / gi.length, mo = go.reduce((p, q) => p + q, 0) / go.length; if (Math.max(...ins) - mi >= 8 && Math.max(...ins) - mo >= 8) R.lighter++; if (mi - Math.min(...ins) >= 15 && mo - Math.min(...ins) >= 15) R.darker++; } // the art judge's lighter inner line, and an ink-like dark line
        } }
      if (!R.n) continue; const st = (a) => { const s2 = [...a].sort((p, q) => p - q); return { p50px: r3(rlPct(s2, 0.5)), p90px: r3(rlPct(s2, 0.9)), p50D: r3(rlPct(s2, 0.5) / Dpx), p90D: r3(rlPct(s2, 0.9) / Dpx), within: r3(s2.filter((q) => q <= reach).length / s2.length) }; };
      const ra = st(R.raster), pi = st(R.pixels), md = (a) => (a.length ? r3(rlPct(a, 0.5)) : null); const whole = rlWildFootStats(w); rows[w.name] = { samples: R.n, reachPx: r3(reach), whole, raster: ra, pixels: pi, lighterInnerLine: r3(R.lighter / R.n), darkLine: r3(R.darker / R.n), seam: { samples: R.seam.length, dE: md(R.seam), baselineDE: md(R.base) }, pass: !!whole && whole.pass && ((R.n * 2) / Dpx < RL_WR.viewD || pi.p90D <= RL_WR.viewP90) }; }
    return { look: rlShownLook(), band: bandOf(cam.s), Dpx: r3(Dpx), src: rlMsSource(), outlinePixelsDrawn: diff, wilds: rows, pass: diff === 0 && Object.values(rows).every((r) => r.pass) };
  } finally { hoverProv = keep.h; state.sel = keep.s; RL_LINK.prov = keep.l; moveLine = keep.m; RCK = null; draw(); }
}
// the focus states of one wild: [label, set(), clear()]; a march previewed across it from one of its neighbours to another its straight line crosses it to (the army set there)
function rlWildFocusStates(w, opts = {}) {
  const nb = [...new Set(rlWildOutline(w).map((e) => e.j))].filter((j) => j >= 0 && !isWild(j)), S = [], army = cmd.varo, at0 = army.at;
  const base = () => { hoverProv = -1; state.sel = null; RL_LINK.prov = -1; moveLine = null; army.at = at0; };
  S.push(['hover ' + w.name, () => { base(); hoverProv = w.cells[0]; }]);
  for (const j of nb) { S.push(['hover ' + names[j], () => { base(); hoverProv = j; }]); S.push(['select ' + names[j], () => { base(); state.sel = { type: 'prov', id: j }; }]); }
  const pairs = []; for (const a of nb) for (const b of nb) if (a < b && barrierOnLine(a, b) === w) pairs.push([a, b]);
  pairs.sort((p, q) => Math.hypot(cent[q[0]][0] - cent[q[1]][0], cent[q[0]][1] - cent[q[1]][1]) - Math.hypot(cent[p[0]][0] - cent[p[1]][0], cent[p[0]][1] - cent[p[1]][1]));
  for (const [a, b] of pairs.slice(0, opts.marches ?? 2)) {
    S.push([`preview ${names[a]} > ${names[b]}`, () => { base(); army.at = a; state.sel = { type: 'cmd', id: 'varo' }; hoverProv = b; }]);
    const d = pathTo(a, b); if (d) S.push([`planned ${names[a]} > ${names[b]}`, () => { base(); army.at = a; state.sel = { type: 'cmd', id: 'varo' }; moveLine = { from: a, path: d.path, days: d.days, around: theName(w) }; }]);
    else S.push([`planned-refused ${names[a]} > ${names[b]}`, () => { base(); army.at = a; state.sel = { type: 'cmd', id: 'varo' }; hoverProv = b; }]); // no route through your land: the refusal's preview (the wild that blocks it in focus)
  }
  return { states: S, restore: base, pairs: pairs.length };
}
const RL_WFS_VIEWS = () => { const C = WILDS.map((w) => { let x = 0, y = 0; for (const c of w.cells) { x += cent[c][0]; y += cent[c][1]; } return [w, x / w.cells.length, y / w.cells.length]; });
  return [['start', () => fit()], ['far', () => window.__mock.setScale(60 / MED_DIAM, W / 2, H / 2)], ['least', () => window.__mock.setScale(minScale, W / 2, H / 2)], ['mid', () => window.__mock.setScale(1.0, 640, 480)], ['ref', () => window.__mock.setScale(1.142, 700, 560)],
    ...C.flatMap(([w, x, y]) => [['near ' + w.name, () => window.__mock.setScale(maxScale * 0.55, x, y)], ['closest ' + w.name, () => window.__mock.setScale(maxScale, x, y)]])]; };
function rlWildFocusSweep(opts = {}) {
  const keep = { s: cam.s, x: cam.x, y: cam.y, h: hoverProv, sel: state.sel, l: RL_LINK.prov, m: moveLine, at: cmd.varo.at }, all = !rlQuietEdgeOn(), rows = [], t0 = performance.now(); let tot = 0, fails = 0, minR = Infinity, worst = null, states = 0, emptyInView = 0;
  const views = RL_WFS_VIEWS().filter(([nm]) => !opts.views || opts.views.includes(nm.split(' ')[0]));
  try {
    for (const [vn, setV] of views) { setV(); RCK = null; draw();
      if (all) { const M = rlWildEdgeMargins(); tot += M.samples; fails += M.fails; if (M.min && M.min.r < minR) { minR = M.min.r; worst = `${vn} ${M.min.at}`; } rows.push({ view: vn, state: 'every edge', samples: M.samples, fails: M.fails, min: M.min ? r3(M.min.r) : null }); states++; continue; }
      for (const w of WILDS) { const F = rlWildFocusStates(w, opts);
        for (const [sn, setS] of F.states) { setS(); const drawn = rlWildEdgesDrawn(); const M = rlWildEdgeMargins(); states++;
          if (!M.samples) { if (drawn && drawn.size && /^(hover|select) /.test(sn) && rlWildOutline(w).some((e) => drawn.has(e.c + ':' + e.j) && rlEdgeInView(e))) emptyInView++; continue; }
          tot += M.samples; fails += M.fails; if (M.min && M.min.r < minR) { minR = M.min.r; worst = `${vn} / ${sn} / ${M.min.at}`; }
          if (M.fails || opts.all) rows.push({ view: vn, state: sn, samples: M.samples, fails: M.fails, min: M.min ? r3(M.min.r) : null, at: M.min ? M.min.at : null }); }
        F.restore(); } }
  } finally { hoverProv = keep.h; state.sel = keep.sel; RL_LINK.prov = keep.l; moveLine = keep.m; cmd.varo.at = keep.at; cam.s = keep.s; cam.x = keep.x; cam.y = keep.y; clampCam(); RCK = null; draw(); }
  return { look: rlShownLook(), mode: state.mode, dpr, focus: all ? 'every edge' : 'focus states', views: views.length, states, samples: tot, fails, minRatio: minR === Infinity ? null : r3(minR), worst, rows: rows.slice(0, 40), ms: Math.round(performance.now() - t0), pass: fails === 0 };
}
const rlEdgeInView = (e) => { const v = viewRect(), [ax, ay] = toScreen(...e.a), [bx, by] = toScreen(...e.b); return Math.max(ax, bx) > v.l + 20 && Math.min(ax, bx) < v.r - 20 && Math.max(ay, by) > v.t + 20 && Math.min(ay, by) < v.b - 20 && Math.hypot(bx - ax, by - ay) >= 24; };
Object.assign(window.__mock, { reliefWildRest: () => rlWildRestCheck(), reliefWildFocusSweep: (o) => rlWildFocusSweep(o), reliefWildFocus: () => { const s = [...rlWildFocus(false).keys()], l = [...rlWildFocus(true).keys()]; return { static: s, live: l }; } });
