// ------------------------------------------------------------------ line pass checks (window.__mock): the floor around every hovered and selected province, in every look and mode
// Read-only helpers for automated review, measured on the rendered canvas (the composite as drawn), as the verifier samples it. The owner's rule (2026-10-23): lines brighten
// to the colour-blind floor around the hovered and selected province, and everywhere in Clear and the Terrain mode (the data modes keep every line at the floor too).
// The older checks hid four views: reliefLinesHover ran in the natural view only, on 10 to 40 provinces; reliefLines sampled no segment under 6 px, so Far took no
// samples; and the harness never ran the Near view at camera 1180,300 or the data modes at double density. These sample every province in view and every view and mode.
const RL_LF = { LAND: ['rails', 'pieces', 'labels', 'badges', 'arrows'], LINES: ['pieces', 'labels', 'badges', 'arrows'], hair: 2.3, int: 3.2 };
function rlFloorEdgesOf(i, band) { // the floor lines a province owns: every hairline or internal keyline on its edges (realm edges have rails; wilds have their contour), fog-dashed ones apart
  const out = []; for (const [, e] of EDGE) { if (i != null && e.i !== i && e.j !== i) continue; const kind = rlEdgeKind(e, band); if (!kind || (fogOf(e.i) && fogOf(e.j))) continue; out.push({ e, kind }); } return out;
}
function rlFloorPlan(list) { // the sample points: along each edge every 1 px, 4 px clear of its ends, 8 px inside the view; across it every 0.5 px (hairline +-3 px, internal keyline 0 to 6 px on its lower-right side)
  const v = viewRect(), W2 = canvas.width, H2 = canvas.height, pts = [], idx = []; let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const { e, kind } of list) {
    const [ax, ay] = toScreen(...e.a), [bx, by] = toScreen(...e.b), Lg = Math.hypot(bx - ax, by - ay); let nx = -(e.b[1] - e.a[1]), ny = e.b[0] - e.a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l; if (nx + ny < 0) { nx = -nx; ny = -ny; }
    const [o0, o1] = kind === 'hair' ? [-3, 3] : [0, 6];
    for (let s = 4; s <= Lg - 4; s += 1) {
      const sx = ax + ((bx - ax) * s) / Lg, sy = ay + ((by - ay) * s) / Lg; if (sx < v.l + 8 || sx > v.r - 8 || sy < v.t + 8 || sy > v.b - 8) continue;
      const k0 = idx.length; for (let o = o0; o <= o1; o += 0.5) { const X = Math.floor((sx + nx * o) * dpr), Y = Math.floor((sy + ny * o) * dpr); if (X < 0 || Y < 0 || X >= W2 || Y >= H2) continue; idx.push(X, Y); x0 = Math.min(x0, X); y0 = Math.min(y0, Y); x1 = Math.max(x1, X); y1 = Math.max(y1, Y); }
      if (idx.length > k0) pts.push({ e, kind, k0, k1: idx.length, at: +(s / Lg).toFixed(2) });
    }
  }
  return { pts, idx, rect: pts.length ? [x0, y0, x1 - x0 + 1, y1 - y0 + 1] : null };
}
function rlReadPlan(plan) { // the plan's pixels from the main canvas (one read of their bounding box)
  if (!plan.rect) return new Uint8ClampedArray(0); const [rx, ry, rw, rh] = plan.rect, d = ctx.getImageData(rx, ry, rw, rh).data, I = plan.idx, out = new Uint8ClampedArray((I.length / 2) * 3);
  for (let k = 0; k < I.length; k += 2) { const q = ((I[k + 1] - ry) * rw + (I[k] - rx)) * 4, o = (k / 2) * 3; out[o] = d[q]; out[o + 1] = d[q + 1]; out[o + 2] = d[q + 2]; }
  return out;
}
function rlScorePlan(plan, land, lines, row) { // per point the best contrast of a line pixel against the same pixel without lines; the floor is 2.3 (hairline) or 3.2 (internal keyline)
  for (const p of plan.pts) {
    let b = 0; for (let k = p.k0; k < p.k1; k += 2) { const o = (k / 2) * 3, c = rlWcag([lines[o], lines[o + 1], lines[o + 2]], [land[o], land[o + 1], land[o + 2]]); if (c > b) b = c; }
    const lim = RL_LF[p.kind]; row.n++; if (b < row.min) row.min = b; if (b < lim) { row.under++; if (row.ex.length < 3) row.ex.push(`${p.kind} ${names[p.e.i]}/${names[p.e.j]} ${b.toFixed(2)} at ${p.at}`); }
  }
}
function rlFrame(skip, fresh) { SKIP.clear(); for (const k of skip) SKIP.add(k); if (fresh) RCK = null; draw(); }
// (1) every province in view hovered (the live layer, drawn over the static one as the pointer draws it) and selected (the static layer, re-rendered), in the look and mode on screen
function rlLinesFocusCheck(opts = {}) {
  const keep = { h: hoverProv, s: state.sel, l: RL_LINK.prov, skip: new Set(SKIP) }, band = bandOf(cam.s), hows = opts.how ?? ['hover', 'select'], t0 = performance.now();
  const plans = new Map(); for (const i of opts.only ?? provList) { if (isWild(i)) continue; const P = rlFloorPlan(rlFloorEdgesOf(i, band)); if (P.pts.length) plans.set(i, P); }
  const rows = [], sum = { look: rlShownLook(), mode: state.mode, band, dpr, faintOn: rlFaintOn(), provinces: plans.size };
  try {
    RL_LINK.prov = -1;
    if (hows.includes('hover')) { // the static layer twice (lines off, on); each province hovered over it
      state.sel = null; hoverProv = -1; const land = new Map(); rlFrame(RL_LF.LAND, true);
      for (const [i, P] of plans) { hoverProv = i; draw(); land.set(i, rlReadPlan(P)); }
      hoverProv = -1; rlFrame(RL_LF.LINES, true);
      for (const [i, P] of plans) { hoverProv = i; draw(); const row = { how: 'hover', prov: names[i], owner: prov[i].owner ?? '', n: 0, min: Infinity, under: 0, ex: [] }; rlScorePlan(P, land.get(i), rlReadPlan(P), row); rows.push(row); }
      hoverProv = -1;
    }
    if (hows.includes('select')) for (const [i, P] of plans) { // the selection is part of the static layer: two renders each
      state.sel = { type: 'prov', id: i }; hoverProv = -1; rlFrame(RL_LF.LAND, true); const land = rlReadPlan(P); rlFrame(RL_LF.LINES, true);
      const row = { how: 'select', prov: names[i], owner: prov[i].owner ?? '', n: 0, min: Infinity, under: 0, ex: [] }; rlScorePlan(P, land, rlReadPlan(P), row); rows.push(row);
    }
  } finally { hoverProv = keep.h; state.sel = keep.s; RL_LINK.prov = keep.l; SKIP.clear(); for (const k of keep.skip) SKIP.add(k); RCK = null; draw(); }
  const by = (h) => rows.filter((r) => r.how === h), agg = (R) => ({ provinces: R.length, samples: R.reduce((a, r) => a + r.n, 0), min: r3(R.length ? Math.min(...R.map((r) => r.min)) : null), under: R.reduce((a, r) => a + r.under, 0), failing: R.filter((r) => r.under).map((r) => `${r.prov} ${r3(r.min)} (${r.under})`).slice(0, 8), examples: R.flatMap((r) => r.ex).slice(0, 6) });
  for (const r of rows) r.min = r3(r.min === Infinity ? null : r.min);
  return { ...sum, hover: agg(by('hover')), select: agg(by('select')), rows: opts.rows ? rows : undefined, ms: Math.round(performance.now() - t0), pass: rows.every((r) => !r.under) };
}
// (2) every floor line at rest, sampled along whole edges (so Far and the least zoom are sampled: reliefLines skipped segments under 6 px), faint lines apart
function rlLinesRestCheck() {
  const band = bandOf(cam.s), keep = new Set(SKIP), P = rlFloorPlan(rlFloorEdgesOf(null, band).filter(({ e }) => !rlFaintOn() || (state.sel && state.sel.type === 'prov' && (e.i === state.sel.id || e.j === state.sel.id)))), row = { n: 0, min: Infinity, under: 0, ex: [] };
  let land, lines; try { rlFrame(RL_LF.LAND, true); land = rlReadPlan(P); rlFrame(RL_LF.LINES, true); lines = rlReadPlan(P); } finally { SKIP.clear(); for (const k of keep) SKIP.add(k); RCK = null; draw(); }
  rlScorePlan(P, land, lines, row); return { look: rlShownLook(), mode: state.mode, band, dpr, samples: row.n, min: r3(row.n ? row.min : null), under: row.under, examples: row.ex, pass: !row.under };
}
// (3) the sweep: every view (start, Far, the least zoom, Mid, the reference zoom, Near at 1180,300 and 700,500) in every mode, the lines at rest and every province hovered and
// selected. The device pixel ratio is the page's: the harness runs it at 1x and 2x. Async: the Terrain mode waits for the Clear bake.
const RL_LF_VIEWS = { start: () => { fit(); RCK = null; draw(); }, far: () => window.__mock.setScale(60 / MED_DIAM, W / 2, H / 2), min: () => window.__mock.setScale(minScale, W / 2, H / 2), mid: () => window.__mock.setScale(1.0, 640, 480), ref: () => window.__mock.setScale(1.142, 700, 560), near: () => window.__mock.setScale(maxScale * 0.8, 1180, 300), near2: () => window.__mock.setScale(maxScale * 0.8, 700, 500) };
async function rlLinesSweep(opts = {}) {
  const views = opts.views ?? Object.keys(RL_LF_VIEWS), modes = opts.modes ?? ['ownership', 'terrain', 'dominion', 'supply', 'unrest', 'population', 'springs'], keepMode = state.mode, keepCam = { ...cam }, out = [];
  try {
    for (const m of modes) {
      setMode(m); decoAlpha = decoFrom = decoTo; if (m === 'terrain') { const t1 = performance.now() + 240000; while (!rlLookReady('clear') && performance.now() < t1) await new Promise((r) => setTimeout(r, 250)); }
      for (const vw of views) { RL_LF_VIEWS[vw](); const R = rlLinesRestCheck(), F = opts.focus === false ? null : rlLinesFocusCheck({ how: opts.how }); out.push({ view: vw, mode: m, shown: rlShownLook(), band: bandOf(cam.s), rest: [R.samples, R.min, R.under], hover: F && [F.hover.provinces, F.hover.samples, F.hover.min, F.hover.under], select: F && [F.select.provinces, F.select.samples, F.select.min, F.select.under], failing: F ? [...R.examples, ...F.hover.failing.map((x) => 'hover ' + x), ...F.select.failing.map((x) => 'select ' + x)].slice(0, 6) : R.examples, pass: R.pass && (!F || F.pass) }); if (opts.log) console.log('linesSweep', JSON.stringify(out[out.length - 1])); }
    }
  } finally { setMode(keepMode); decoAlpha = decoFrom = decoTo; Object.assign(cam, keepCam); RCK = null; draw(); }
  return { look: rlShownLook(), dpr, rows: out, pass: out.every((r) => r.pass) };
}
Object.assign(window.__mock, { reliefLinesFocus: (o) => rlLinesFocusCheck(o), reliefLinesRest: () => rlLinesRestCheck(), reliefLinesSweep: (o) => rlLinesSweep(o) });
