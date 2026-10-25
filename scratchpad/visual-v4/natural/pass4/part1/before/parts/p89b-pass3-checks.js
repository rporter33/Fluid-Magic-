// ------------------------------------------------------------------ pass 3 checks (window.__mock): the wild edge beyond the standard views, the footprint, the interaction
// Rules judge graft 5: every prototype passed the 18 standard views and failed elsewhere, so the colour-blind wild edge test (rlWildEdgeCheck) is also run over a seeded
// camera sweep round the three wilds (every zoom band), each wild's closest zoom and sub-pixel pans, with each sample's margin (its best ratio to 20 / 12) and whether
// the decision (p59x) changes when the camera only pans. Graft 4: the footprint as a guard (no land texel written by the wilds' pass) and the interaction checks.
// (1) the per-sample margin of the wild edge test on the frame as drawn: for every sample the best of the pair's ratio and each line pixel's (min over normal and worst
// deficiency, against both sides) to 20 / 12; < 1 fails (the same sampling as rlWildEdgeCheck)
function rlWildEdgeMargins() {
  const d = rlRedraw(['pieces', 'labels', 'badges', 'arrows']), W2 = canvas.width, H2 = canvas.height, v = viewRect(), R = [], drawn = rlWildEdgesDrawn(); // pass 3b: the edges drawn now (in focus, in the natural view)
  const px = (sx, sy) => { const X = Math.floor(sx * dpr), Y = Math.floor(sy * dpr); if (X < 0 || Y < 0 || X >= W2 || Y >= H2) return null; const k = (Y * W2 + X) * 4; return [d[k], d[k + 1], d[k + 2]]; };
  const med = (a) => { const s2 = a.filter(Boolean).sort((p, q) => rlL(...p) - rlL(...q)); return s2[s2.length >> 1]; }, rt = (q) => Math.min(q.normal / 20, q.cvd / 12);
  for (const w of WILDS) for (const e of rlWildOutline(w)) {
    if (drawn && !drawn.has(e.c + ':' + e.j)) continue;
    const [ax, ay] = toScreen(...e.a), [bx, by] = toScreen(...e.b), Lg = Math.hypot(bx - ax, by - ay); if (Lg < 12) continue; let nx = -(by - ay) / Lg, ny = (bx - ax) / Lg;
    if (provinceAt(...toWorld((ax + bx) / 2 + nx * 8, (ay + by) / 2 + ny * 8)) !== e.j) { nx = -nx; ny = -ny; }
    for (let s = 6; s < Lg - 6; s += 4) {
      const sx = ax + ((bx - ax) * s) / Lg, sy = ay + ((by - ay) * s) / Lg; if (sx < v.l + 12 || sx > v.r - 12 || sy < v.t + 12 || sy > v.b - 12) continue;
      if (!inModel(...toWorld(sx + nx * 10, sy + ny * 10)) || provinceAt(...toWorld(sx + nx * 8, sy + ny * 8)) !== e.j) continue;
      const Wg = med([6, 7, 8, 9].map((o) => px(sx - nx * o, sy - ny * o))), G = med([6, 7, 8, 9, 9.5].map((o) => px(sx + nx * o, sy + ny * o))); if (!Wg || !G) continue;
      let best = rt(rlPairDE(Wg, G)), via = 'pair'; for (let o = -4; o <= 4; o += 0.5) { const c = px(sx + nx * o, sy + ny * o); if (!c) continue; const r = Math.min(rt(rlPairDE(c, Wg)), rt(rlPairDE(c, G))); if (r > best) { best = r; via = `${o} px L* ${Math.round(rgb2lab(c)[0])}`; } }
      R.push({ r: best, at: `${w.name}/${names[e.j]}`, via, W: Math.round(rgb2lab(Wg)[0]), G: Math.round(rgb2lab(G)[0]), sx: Math.round(sx), sy: Math.round(sy) }); } }
  const rs = R.map((q) => q.r).sort((a, b) => a - b), worst = R.reduce((p, q) => (!p || q.r < p.r ? q : p), null);
  return { samples: R.length, fails: rs.filter((x) => x < 1).length, under110: rs.filter((x) => x < 1.1).length, p5: r3(rlPct(rs, 0.05)), min: worst ? { r: r3(worst.r), at: worst.at, via: worst.via, W: worst.W, G: worst.G, sx: worst.sx, sy: worst.sy } : null };
}
// (2) the sweep: views [label, scale, world x, world y]; the camera is restored after
const RL_SWEEP = { seed: 20261023, n: 30, pans: [[0.37, 0], [0, 0.61], [1, 1], [2.5, -1.5]] };
function rlWildSweepViews(n = RL_SWEEP.n) {
  const C = WILDS.map((w) => { let x = 0, y = 0; for (const c of w.cells) { x += cent[c][0]; y += cent[c][1]; } return [w.name, x / w.cells.length, y / w.cells.length]; }); let sd = RL_SWEEP.seed;
  const rnd = () => { sd = (Math.imul(sd, 1664525) + 1013904223) >>> 0; return sd / 4294967296; }, V = [];
  for (let k = 0; k < n; k++) { const [nm, cx, cy] = C[k % C.length], f = rnd(), s = minScale * Math.pow(maxScale / minScale, f), ox = (rnd() - 0.5) * 1.2 * MED_DIAM, oy = (rnd() - 0.5) * 1.2 * MED_DIAM; V.push(['sweep ' + k + ' ' + nm, s, cx + ox, cy + oy]); }
  for (const [nm, cx, cy] of C) V.push(['closest ' + nm, maxScale, cx, cy]);
  return V;
}
function rlWildSweep(opts = {}) {
  if (!rlQuietEdgeOn()) return { applicable: false, note: 'the natural view only (Clear, the Terrain mode and the data modes keep the v4 rim on every edge)', pass: true };
  const keep = { s: cam.s, x: cam.x, y: cam.y }, keepC = toWorld((viewRect().l + viewRect().r) / 2, (viewRect().t + viewRect().b) / 2), set = (s, wx, wy) => window.__mock.setScale(s, wx, wy), rows = []; let tot = 0, fails = 0, worst = null, minR = Infinity, n110 = 0;
  const keepAll = RL_DBG.focusAll; RL_DBG.focusAll = opts.focusAll ?? true; // pass 3b: the sweep draws every edge as if in focus (the decision's worst case; every focus state draws a subset of these, the hovered tint apart: reliefWildFocusSweep)
  const views = opts.views ?? rlWildSweepViews(opts.n), sig = () => new Map([...(RL_WRIM.map ?? new Map())].map(([k, E]) => [k, Array.from(E.fail).join('')])), same = (a, b) => [...a].every(([k, v]) => !b.has(k) || b.get(k) === v); // polish: edges are decided as they come near the frame, so a pan adds edges; an edge decided in both must not change
  for (const [nm, s, wx, wy] of views) { set(s, wx, wy); const M = rlWildEdgeMargins(); tot += M.samples; fails += M.fails; n110 += M.under110; if (M.min && M.min.r < minR) { minR = M.min.r; worst = nm + ' ' + M.min.at; } rows.push({ view: nm, Dpx: +(cam.s * MED_DIAM).toFixed(1), samples: M.samples, fails: M.fails, p5: M.p5, min: M.min, share: rlQuietShare() == null ? null : r3(rlQuietShare()) }); }
  // sub-pixel and small pans at three views: the decision must not change, and the test must pass at each position
  const pans = []; for (const [nm, s, wx, wy] of opts.panViews ?? [['start', keep.s, ...keepC], ['mid', 1.0, cent[WILDS[1].cells[0]][0], cent[WILDS[1].cells[0]][1]], ['Ashspine Near', maxScale * 0.55, cent[WILDS[0].cells[0]][0], cent[WILDS[0].cells[0]][1]]]) {
    set(s, wx, wy); const M0 = rlWildEdgeMargins(), s0 = sig(); let flips = 0, pf = M0.fails;
    for (const [dx, dy] of RL_SWEEP.pans) { set(s, wx + dx / s, wy + dy / s); const M = rlWildEdgeMargins(); pf += M.fails; tot += M.samples; fails += M.fails; if (!same(s0, sig())) flips++; if (M.min && M.min.r < minR) { minR = M.min.r; worst = nm + ' pan ' + dx + ',' + dy + ' ' + M.min.at; } }
    pans.push({ view: nm, positions: RL_SWEEP.pans.length + 1, fails: pf, decisionChanged: flips }); }
  RL_DBG.focusAll = keepAll; cam.s = keep.s; cam.x = keep.x; cam.y = keep.y; clampCam(); RCK = null; draw();
  return { focusAll: opts.focusAll ?? true, views: rows.length, samples: tot, fails, samplesUnder110: n110, minRatio: minR === Infinity ? null : r3(minR), worst, pans, rows, pass: fails === 0 && pans.every((p) => !p.decisionChanged) };
}
// (3) the footprint as a guard: the wilds' pass writes only wild texels (a hash of every land texel before and after it, p58m), no wild texel lies outside its cells
// (rlWildLookCheck), and the land outside a wild changes only by its recomputed cast shadow (the share of land texels whose shadow moved, for review)
function rlWildFootprint() {
  const F = RB.msFoot; if (!F) return { baked: false }; const L = rlWildLookCheck();
  return { landHashBefore: F.before, landHashAfter: F.after, landTexelsWrittenByWildPass: F.before === F.after ? 0 : 'changed', wildTexelsOutsideCells: (L.peaks ? L.peaks.textelsOutsideTheirCells : 0) + (L.mere ? L.mere.textelsOutsideTheirCells : 0), landShadowTexelsMoved: F.shadowMoved, pass: F.before === F.after && L.peaks.textelsOutsideTheirCells === 0 && L.mere.textelsOutsideTheirCells === 0 };
}
// (4) interaction (the open prototype's checks, kept in the page): just inside every outline edge the hit test names the wild and its card says Impassable; just outside it names
// the neighbour, whose card names its terrain; no path enters a wild from any of its neighbours, and a right-click into it is refused
function rlWildInteract() {
  let edges = 0, hitIn = 0, hitOut = 0, cards = 0, paths = 0; const bad = [];
  for (const w of WILDS) { const tip = wildTip(w); if (/Impassable/.test(tip.value)) cards++; else bad.push(w.name + ' card');
    for (const e of rlWildOutline(w)) { if (isWild(e.j)) continue; edges++; const mx = (e.a[0] + e.b[0]) / 2, my = (e.a[1] + e.b[1]) / 2, L = Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1]) || 1; let nx = -(e.b[1] - e.a[1]) / L, ny = (e.b[0] - e.a[0]) / L, o = 0.03 * RLD;
      if (provinceAt(mx + nx * o, my + ny * o) !== e.j) { nx = -nx; ny = -ny; }
      if (isWild(provinceAt(mx - nx * o, my - ny * o))) hitIn++; else bad.push(`${w.name}/${names[e.j]} inside`);
      const j = provinceAt(mx + nx * o, my + ny * o), tp = j === e.j ? provTip(j) : null; if (tp && tp.title.includes(names[j]) && /tchip|terrain/i.test(tp.title + (tp.value || ''))) hitOut++; else bad.push(`${w.name}/${names[e.j]} outside`);
      if (pathTo(e.j, e.c) === null) paths++; else bad.push(`${w.name}/${names[e.j]} path`); } }
  return { edges, hitInside: hitIn, hitOutsideNamesTerrain: hitOut, cardsImpassable: cards, pathsRefused: paths, problems: bad.slice(0, 6), pass: hitIn === edges && hitOut === edges && cards === WILDS.length && paths === edges };
}
Object.assign(window.__mock, { reliefWildMargins: () => rlWildEdgeMargins(), reliefWildSweep: (o) => rlWildSweep(o), reliefWildFootprint: () => rlWildFootprint(), reliefWildInteract: () => rlWildInteract() });
