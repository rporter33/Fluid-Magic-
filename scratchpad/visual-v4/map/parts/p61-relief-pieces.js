
// ------------------------------------------------------------------ v4 relief: miniatures on bases (§6), labels by zoom band (§7). This part: the figure atlas, sizes, the layout
// (seats, Wellsprings, army slots, scenery, labels, the numbers layer) and the seat ground. p62: bases, figures, towns, hamlets, huts, events and the army pieces;
// p63: labels, live names, chips, the path thread and arrows.
// Sizes are continuous in the median province's screen diameter D_px (§6.4); the layout lives in "layout px" (world x cam.s, no pan),
// so a pan moves it and only a zoom re-lays it. Armies are DOM pieces (click, tooltip, focus); everything else is drawn on the over layer.
const RL_LINK = { prov: -1 }; // a province named by a hovered link (feed, alerts, outliner, cards)
const RL_NUMBERS = { on: false, shift: false }; // the numbers layer (` or the # button) and Shift held alone
const RL_FIGLOOK = { // commander type -> the battle atlas's look, side palette and scale (the pretender's body at 1.3)
  ashChieftain: ['ashChieftain', 'cinderHorde', 1], titan: ['flamebrand', 'cinderHorde', 1.3], emberAdept: ['emberAdept', 'cinderHorde', 1], pyrePriest: ['pyrePriest', 'cinderHorde', 1],
  cinderScout: ['cinderScout', 'cinderHorde', 1], wardenCaptain: ['wardenCaptain', 'thornwood', 1], guard: ['lightInfantry', 'independent', 1], guardBow: ['archer', 'independent', 1],
};
const FIGS = { started: false, ready: false, ver: 0, fig: {}, err: null, ms: 0 };
function rlLoadPixi() {
  if (window.PIXI) return Promise.resolve(window.PIXI);
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/pixi.js@8.22.0/dist/pixi.min.js'; s.onload = () => (window.PIXI ? res(window.PIXI) : rej(new Error('no PIXI'))); s.onerror = () => rej(new Error('pixi.js did not load')); document.head.appendChild(s); });
}
function rlStartFigures() {
  FIGS.started = true; const t0 = performance.now();
  rlLoadPixi().then(async (PX) => {
    const renderer = await PX.autoDetectRenderer({ preference: 'webgl', width: 64, height: 64, backgroundAlpha: 0, antialias: true, resolution: 1 });
    const { ART, FR, PALETTES: FP, drawFigure } = FIGLIB, C = ART.cell * 2;
    for (const [key, [unit, pal, sc]] of Object.entries(RL_FIGLOOK)) {
      const rt = PX.RenderTexture.create({ width: C, height: C, resolution: 1, antialias: true }), holder = new PX.Container(), gph = new PX.Graphics();
      drawFigure(gph, unit, FP[pal], 'se', FR.idle); holder.addChild(gph); holder.position.set(C / 2, ART.foot * 2); holder.scale.set(2 * sc);
      renderer.render({ container: holder, target: rt, clear: true });
      const raw = renderer.extract.canvas(rt), out = makeCanvas(C, C), og = out.getContext('2d'), sil = makeCanvas(C, C), sg = sil.getContext('2d');
      sg.drawImage(raw, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = '#1C1A17'; sg.fillRect(0, 0, C, C);
      og.globalAlpha = 0.6; for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) og.drawImage(sil, dx * 2.2, dy * 2.2); og.globalAlpha = 1; og.drawImage(raw, 0, 0);
      FIGS.fig[key] = { canvas: out, fx: C / 2, fy: ART.foot * 2, h: ART.figH * 2 * sc };
      holder.destroy({ children: true }); rt.destroy(true);
    }
    renderer.destroy(); FIGS.ready = true; FIGS.ver++; FIGS.ms = performance.now() - t0; rlPieceSigLast = ''; requestDraw();
  }).catch((e) => { FIGS.err = String(e && e.message || e); FIGS.ver++; requestDraw(); });
}
function rlFallbackFigure(g, x, y, h, side) { // used until (or unless) the atlas is baked: a cloaked figure, lit from the upper left
  const c = side === 'red' ? '#9A4A2A' : side === 'green' ? '#2F6A4E' : '#7E8478';
  g.fillStyle = 'rgba(28,26,23,.75)'; g.beginPath(); g.moveTo(x - h * 0.2, y); g.lineTo(x - h * 0.13, y - h * 0.62); g.lineTo(x + h * 0.13, y - h * 0.62); g.lineTo(x + h * 0.2, y); g.closePath(); g.fill();
  g.fillStyle = c; g.beginPath(); g.moveTo(x - h * 0.17, y - 1); g.lineTo(x - h * 0.11, y - h * 0.6); g.lineTo(x + h * 0.11, y - h * 0.6); g.lineTo(x + h * 0.17, y - 1); g.closePath(); g.fill();
  g.fillStyle = '#C49A76'; ellipse(g, x, y - h * 0.72, h * 0.12, h * 0.12); g.fill(); g.strokeStyle = 'rgba(28,26,23,.75)'; g.lineWidth = 1; g.stroke();
}

// ---- sizes (§6.4)
const rlDpx = () => cam.s * MED_DIAM;
const rlBa = (Dpx) => Math.max(16, Math.min(34, 0.23 * Dpx));
const rlStep = (p) => tierOf(p) + 1 + (p.cap ? 1 : 0);
const rlIsTown = (p) => tierOf(p) + 1 >= RL_P.townStep || p.pd >= RL_P.townPD || p.buildings.length > 0 || !!p.build || p.cap;
const rlTownPx = (p, Dpx) => Math.max(14, Math.min(RL_P.townMaxPx, (0.16 + 0.045 * (rlStep(p) - 1)) * Dpx)); // the ceiling 96 px (fix 8; §6.4 had 120)
const rlWallStage = (pd) => (pd >= 25 ? 'towers' : pd >= 15 ? 'stone' : pd >= 5 ? 'palisade' : pd >= 1 ? 'watch' : '');
const rlFs = (Dpx) => Math.max(11, Math.min(15, 11 + (4 * (Dpx - 70)) / 350));
const RL_KIT = {
  red: { wall: '#8F8C88', roof: '#3A3633', win: '#FFB347', stone: '#77736E', stoneHi: '#9E9A93' },
  green: { wall: '#A0785A', roof: '#4E6B3A', roofHi: '#6E8F4E', win: '#E9C46A', stone: '#8A7E66', stoneHi: '#ADA184' },
  indep: { wall: '#D8CBB0', roof: '#C2A86B', win: '#F2D58A', stone: '#A39C8E', stoneHi: '#C6C0B2' },
};
const rlKitOf = (k) => RL_KIT[k === 'red' ? 'red' : k === 'green' ? 'green' : 'indep'];

// ---- the layout: seats, Wellsprings, army pieces on slots, scenery points, labels; in layout px (world x cam.s)
const RL_PIECE_CACHE = new Map();
const RL_SCEN = new Map(); // fixed seeded scenery points per province (world units)
function rlScenPoints(i) {
  let v = RL_SCEN.get(i); if (v) return v; v = [];
  const R = rngFor(`relief:${MAP_SEED}:scenery:${i}`), bb = bboxOf(cells[i]), wt = RB.ready ? RB.water : { lakes: [], ponds: [], streams: [] };
  const wetNear = (x, y) => [...wt.lakes, ...wt.ponds].some((L) => L.i === i && (d3.polygonContains(L.P, [x, y]) || distToEdge([...L.P, L.P[0]], x, y) < 5 * RLK)) || wt.streams.some((s) => s.i === i && s.pts.some((q) => Math.hypot(q[0] - x, q[1] - y) < 5 * RLK));
  for (let t = 0; t < 400 && v.length < 14; t++) {
    const x = bb[0] + R() * (bb[2] - bb[0]), y = bb[1] + R() * (bb[3] - bb[1]);
    if (!d3.polygonContains(cells[i], [x, y]) || distToEdge(cells[i], x, y) < 0.13 * RLD || !inModel(x, y) || Math.hypot(x - cent[i][0], y - cent[i][1]) < 0.22 * RLD || wetNear(x, y)) continue;
    if (v.some((q) => Math.hypot(q.x - x, q.y - y) < 0.09 * RLD)) continue; v.push({ x, y, j: v.length, R: R() });
  }
  RL_SCEN.set(i, v); return v;
}
// ---- piece silhouettes [x0, y0, x1, y1, kind, prov, id, base?]: a base is its ellipse swept down by its side band, an upright part its box (the slot rule and the overlap check share them)
const rlSilIn = (S, x, y) => { const e = S[7]; if (!e) return x > S[0] + 0.5 && x < S[2] - 0.5 && y > S[1] + 0.5 && y < S[3] - 0.5; const sv = Math.max(0, Math.min(e.t, y - e.cy)); return ((x - e.cx) / Math.max(0.5, e.rx - 0.5)) ** 2 + ((y - e.cy - sv) / Math.max(0.5, e.ry - 0.5)) ** 2 < 1; };
const rlSilPts = (S) => { const e = S[7], P = []; if (e) { for (let k = 0; k < 64; k++) { const a = (k / 64) * 2 * Math.PI, c = Math.cos(a), sn = Math.sin(a); P.push([e.cx + c * e.rx, e.cy + sn * e.ry + (sn > 0 ? e.t : 0)]); } P.push([e.cx - e.rx, e.cy + e.t * 0.5], [e.cx + e.rx, e.cy + e.t * 0.5]); } else { for (let k = 0; k <= 16; k++) { const f = k / 16; P.push([S[0] + (S[2] - S[0]) * f, S[1]], [S[0] + (S[2] - S[0]) * f, S[3]], [S[0], S[1] + (S[3] - S[1]) * f], [S[2], S[1] + (S[3] - S[1]) * f]); } P.push([(S[0] + S[2]) / 2, (S[1] + S[3]) / 2]); } return P; };
const rlSilHit = (a, b) => { if (!(a[2] > b[0] + 0.5 && a[0] < b[2] - 0.5 && a[3] > b[1] + 0.5 && a[1] < b[3] - 0.5)) return false; if (!a[7] && !b[7]) return true; return rlSilPts(a).some(([x, y]) => rlSilIn(b, x, y)) || rlSilPts(b).some(([x, y]) => rlSilIn(a, x, y)); };
const rlSeatSh = (st, i, id) => (!st.kind ? [] : st.kind === 'town' ? [[st.x - st.r, st.y - st.r * 0.64, st.x + st.r, st.y + st.r * 0.64 + 0.12 * st.T, 'seat', i, id, { cx: st.x, cy: st.y, rx: st.r, ry: st.r * 0.64, t: 0.12 * st.T }], [st.x - st.r * 0.8, st.y - st.r * 0.64 - 0.38 * st.T, st.x + st.r * 0.8, st.y, 'seat', i, id]] : [[...st.box, 'seat', i, id]]);
const rlWellSh = (x, y, B, i, id) => { const rr = B / 2; return [[x - rr, y - rr * 0.64, x + rr, y + rr * 0.64 + 0.12 * B, 'well', i, id, { cx: x, cy: y, rx: rr, ry: rr * 0.64, t: 0.12 * B }], [x - rr * 0.7, y - rr * 0.64 - 0.4 * B, x + rr * 0.7, y, 'well', i, id]]; };
const rlArmySh = (x, y, kind, B, rx, ry, figH, i, id) => { const hw = kind === 'stack' ? rx : 0.32 * B; return [[x - rx, y - ry, x + rx, y + ry + 0.24 * B, 'army', i, id, { cx: x, cy: y, rx, ry, t: 0.24 * B }], [x - hw, y - figH - (kind === 'army' ? 0.25 * B : 0), x + hw, y, 'army', i, id]]; };
// the alerts ribbon in layout px at the camera on screen (AD fix 12: names step aside from it, as the day chips do), or null
function rlRibbonLay() { const rb = document.getElementById('ribbon'); if (!rb || !rb.offsetParent || !rb.childElementCount) return null; const r = rb.getBoundingClientRect(), cr = canvas.getBoundingClientRect(); if (r.width <= 0 || r.height <= 0) return null;
  const cx = RL_CAM0.on ? RL_CAM0.x : cam.x, cy = RL_CAM0.on ? RL_CAM0.y : cam.y; return [r.left - cr.left - cx - 4, r.top - cr.top - cy - 3, r.right - cr.left - cx + 4, r.bottom - cr.top - cy + 3]; }
// pass 2 (verifier: names under the right-edge controls): the mode column (buttons, zoom band, Fit) and a shown legend, in layout px at the camera on screen; names step aside
function rlControlsLay() { const cr = canvas.getBoundingClientRect(), cx = RL_CAM0.on ? RL_CAM0.x : cam.x, cy = RL_CAM0.on ? RL_CAM0.y : cam.y, out = [];
  const col = [...document.querySelectorAll('#modes .modebtn, #modes .fitrow')].filter((e) => e.offsetParent).map((e) => e.getBoundingClientRect()), lg = [...document.querySelectorAll('#modes .legend')].filter((e) => e.offsetParent && getComputedStyle(e).display !== 'none').map((e) => e.getBoundingClientRect());
  if (col.length) out.push([Math.min(...col.map((r) => r.left)) - cr.left - cx - 4, Math.min(...col.map((r) => r.top)) - cr.top - cy - 3, Math.max(...col.map((r) => r.right)) - cr.left - cx + 4, Math.max(...col.map((r) => r.bottom)) - cr.top - cy + 3]);
  for (const r of lg) if (r.width > 0) out.push([r.left - cr.left - cx - 4, r.top - cr.top - cy - 3, r.right - cr.left - cx + 4, r.bottom - cr.top - cy + 3]);
  return out; }
// pass-2 critique fix 5 (the verifier's defect 3 held only at the start view: Deepmoss's name was placed past the canvas edge, under the controls at the reference zoom):
// the canvas across and the view band down, in layout px at the camera on screen (the cache is drawn with a margin, so the canvas's own size, not cw / ch); a name whose seat
// is in it must sit inside it (a seat off the screen keeps its name for the pan), and every name stays on the model
// polish (pass-2 verifier item 4: on the phone at Fit, panned, Deepmoss and Thornbrook were cut by the right rail with their towns in view): the band ends at the rail and a
// docked panel (viewRect(true): the mode column still counts as view; names step aside from it as before)
function rlViewLay() { const cr = canvas.getBoundingClientRect(), keep = [cw, ch]; let v, vf; cw = cr.width; ch = cr.height; try { v = viewRect(); vf = viewRect(true); } finally { cw = keep[0]; ch = keep[1]; }
  const cx = RL_CAM0.on ? RL_CAM0.x : cam.x, cy = RL_CAM0.on ? RL_CAM0.y : cam.y; return [Math.max(2, v.l + 2) - cx, v.t - cy, Math.min(cr.width, vf.r) - 2 - cx, v.b - cy]; }
const rlInBox = (b, q) => b[0] >= q[0] && b[1] >= q[1] && b[2] <= q[2] && b[3] <= q[3];
// a box (layout px at scale s) wholly inside wild w, every point of it at least the outline's ink half width, the stone band and 1.5 px from the outline (sampled every 3 px)
const RL_WFIT = new Map(); // per wild, scale and density: the memo of boxes tested (a pan re-lays the names without testing again)
function rlWildFitter(w, s) { const key = w.id + '|' + s.toFixed(5) + '|' + dpr; let F = RL_WFIT.get(key); if (F) return F;
  const OL = rlWildOutline(w), inset = (RL_QE.inkPx / 2 + Math.max(2.5, rlQeBand()) + 1.5) / s, cs = new Set(w.cells), memo = new Map();
  F = (b) => { const k = b.map((v) => Math.round(v * 4)).join(','); let v = memo.get(k); if (v !== undefined) return v; v = true; const nx = Math.max(1, Math.ceil((b[2] - b[0]) / 3)), ny = Math.max(1, Math.ceil((b[3] - b[1]) / 3));
    out: for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { const x = (b[0] + ((b[2] - b[0]) * i) / nx) / s, y = (b[1] + ((b[3] - b[1]) * j) / ny) / s; if (!cs.has(provinceAt(x, y))) { v = false; break out; } for (const e of OL) if (rlSegDist(x, y, e.a[0], e.a[1], e.b[0], e.b[1]) < inset) { v = false; break out; } }
    memo.set(k, v); return v; };
  if (RL_WFIT.size > 60) RL_WFIT.clear(); RL_WFIT.set(key, F); return F; }
function rlLayout(band) {
  const rib = rlRibbonLay(), ctrl = RELIEF() ? rlControlsLay() : [], vb = rlViewLay(), key = [cam.s.toFixed(5), band, KEYVER, curMonth, rlPiecesSig(), state.sel ? state.sel.type + state.sel.id : '', moveLine ? moveLine.path.join('.') : '', RL_NUMBERS.on, RL_NUMBERS.shift, fontsReady, RB.ver, view.detail, state.mode, rlShiftSwatch(), rib ? rib.map((v) => Math.round(v / 8)).join(',') : '', ctrl.map((q) => q.map((v) => Math.round(v / 8)).join(',')).join(';'), vb.map((v) => Math.round(v / 8)).join(',')].join('|');
  const hit = RL_PIECE_CACHE.get('L'); if (hit && hit.key === key) return hit;
  const s = cam.s, Dpx = rlDpx(), Ba = rlBa(Dpx), far = band === 'far', near = band === 'near', L = (q) => [q[0] * s, q[1] * s];
  const seats = new Map(), armies = [], wells = [], boxes = [], scen = [], events = [], guards = [], stones = [];
  const inset = (i, x, y, rx, ry) => { // the base inside the province's polygon inset by 2 px (layout px)
    const wx = x / s, wy = y / s; if (!d3.polygonContains(cells[i], [wx, wy])) return false;
    for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4, qx = (x + Math.cos(a) * rx) / s, qy = (y + Math.sin(a) * ry) / s; if (!d3.polygonContains(cells[i], [qx, qy]) || distToEdge(cells[i], qx, qy) * s < 2 || !inModel(qx, qy)) return false; }
    return true;
  };
  const ovl = (b, list) => list.some((q) => b[2] > q[0] && b[0] < q[2] && b[3] > q[1] && b[1] < q[3]);
  // seats
  for (const p of provs) {
    const fog = fogOf(p.i), [x, y] = L(cent[p.i]); let kind = null, T = 0, r = 0.08 * Dpx, rm = 0;
    if (fog === 'unexplored') { if (Dpx >= RL_P.hamletDpx) { kind = 'hut'; T = Math.max(6, 0.04 * Dpx * 1.6); r = T / 2; } }
    else if (rlIsTown(p)) { kind = 'town'; T = rlTownPx(p, Dpx); r = T / 2; }
    else if (Dpx >= RL_P.hamletDpx) { kind = 'hamlet'; T = Math.max(5, Math.min(14, 0.06 * Dpx)); const nH = near ? houseCount(p) : Math.min(4, houseCount(p)); rm = ((Math.ceil(nH / 2) - 1) / 2 + 0.3) * 1.3 * T + 0.13 * T + 0.75 * T; r = Math.max(0.08 * Dpx, rm); } // AD fix 5: two rows along a lane (rlHamletSpots); rm, their half width
    const st = { i: p.i, x, y, kind, T, r };
    if (kind === 'town') st.box = [x - r - 1, y - r * 0.64 - 0.42 * T, x + r + 1, y + r * 0.64 + 0.12 * T + 1];
    else if (kind === 'hamlet') { st.box = [x - rm, y - 1.7 * T, x + rm, y + 0.66 * T]; st.bot = y + 0.66 * T; } // the houses' extent (the north row's roofs to the south row's shadows)
    else if (kind === 'hut') st.box = [x - T * 0.7, y - T * 1.1, x + T * 0.7, y + T * 0.3];
    seats.set(p.i, st); if (st.box) boxes.push([...st.box, 'seat', p.i]);
  }
  // the label zone under every seat, reserved before the Wellspring and the armies take their slots (a piece never covers a label)
  const fs0 = rlFs(Dpx), lzone = new Map();
  for (const p of provs) { const st = seats.get(p.i), f0 = `${p.cap ? 700 : 500} ${(p.cap ? fs0 + 1 : fs0).toFixed(1)}px 'Alegreya Sans', 'Segoe UI', sans-serif`, tw = textW(p.name, f0), bot = st.kind === 'town' ? st.y + st.r * 0.64 + 0.12 * st.T : st.kind === 'hamlet' ? st.bot : st.y + 2, h = fs0 + 4; lzone.set(p.i, [st.x - tw / 2 - 3, bot + 2, st.x + tw / 2 + 3, bot + 3 + h + 2]); }
  // Wellsprings: their own base, 20 degrees below the left-hand horizontal
  for (const p of provs) {
    if (!p.well || fogOf(p.i) === 'unexplored') continue; const st = seats.get(p.i), B = Math.max(12, 0.18 * Dpx), rr = B / 2;
    const ssh = rlSeatSh(st, p.i, 0), lz = [...lzone.get(p.i), 'label', p.i, 0];
    let pos = null; outerW: for (const da of [0, 15, -15, 30, -30, 45, -45, 60, -60, 90]) for (let e = 0; e <= B; e += 1.5) { const a = ((160 + da) * Math.PI) / 180, d = st.r + rr + 3 + e, x = st.x + Math.cos(a) * d, y = st.y + Math.sin(a) * d * 0.9, sh = rlWellSh(x, y, B, p.i, 0);
      if (sh.some((q) => ssh.some((z) => rlSilHit(q, z)) || rlSilHit(q, lz))) continue; if (inset(p.i, x, y, rr, rr * 0.64)) { pos = [x, y]; break outerW; } break; }
    if (!pos) pos = [st.x - st.r - rr - 3, st.y + 2];
    const wl = { i: p.i, x: pos[0], y: pos[1], B, box: [pos[0] - rr - 1, pos[1] - rr * 0.64 - B * 0.5, pos[0] + rr + 1, pos[1] + rr * 0.64 + 0.12 * B + 1] };
    wells.push(wl); boxes.push([...wl.box, 'well', p.i]);
  }
  // army pieces: one per nation per province (a stack for several armies of one nation), on the arc around the seat (§6.6)
  const byProv = new Map(); for (const c of Object.values(cmd)) { if (c.hidden || (p4('memory') && c.side !== VIEWER && fogOf(c.at))) continue; /* pass 4 (p66): no ghost pieces */ const m = byProv.get(c.at) ?? new Map(); const l = m.get(c.side) ?? []; l.push(c); m.set(c.side, l); byProv.set(c.at, m); }
  const SLOTS = [20, -20, 60, -60, 100, -100, 140, -140];
  for (const [at, m] of byProv) {
    const st = seats.get(at), sides = [...m.keys()].sort((a, b) => (a === VIEWER ? -1 : b === VIEWER ? 1 : 0)), taken = [...rlSeatSh(st, at, 0), ...wells.filter((w) => w.i === at).flatMap((w) => rlWellSh(w.x, w.y, w.B, at, 0)), [...lzone.get(at), 'label', at, 0]];
    sides.forEach((side, k) => {
      const list = m.get(side).sort((a, b) => (b.crown ? 1 : 0) - (a.crown ? 1 : 0) || b.squads.length - a.squads.length), lead = list[0], stack = list.length > 1;
      const kindP = stack ? 'stack' : lead.crown ? 'pretender' : lead.squads.length ? 'army' : 'lone';
      const B = kindP === 'pretender' ? 1.15 * Ba : kindP === 'lone' ? 0.8 * Ba : Ba, rx = kindP === 'stack' ? 0.75 * Ba : B / 2, ry = (kindP === 'stack' ? 0.5 * Ba : B / 2) * 0.64;
      const figH = kindP === 'stack' ? Ba * 1.05 : B * 1.15 * (kindP === 'pretender' ? 1.3 : 1);
      const boxAt = (x, y) => [x - rx - 1, y - ry - figH - (kindP === 'army' ? 0.25 * B : 0), x + rx + 1, y + ry + 0.12 * B * 2 + 1];
      let pos = null, front = false;
      outer: for (const base of SLOTS.slice(k)) for (const da of [0, 10, -10, 20, -20, 30, -30, 40, -40, 50, -50, 60, -60, 70, -70, 80, -80, 90, -90, 120, -120, 150, -150, 180]) {
        for (let e = 0; e <= Ba; e += 1.5) { // the arc's radius grows until the piece clears what stands nearer (the seat's buildings rise above its base)
          const a = ((base + da) * Math.PI) / 180, d = st.r + rx + 3 + e, x = st.x + Math.cos(a) * d, y = st.y + Math.sin(a) * d, sh = rlArmySh(x, y, kindP, B, rx, ry, figH, at, 0);
          if (sh.some((q) => taken.some((z) => rlSilHit(q, z)))) continue; if (!inset(at, x, y, rx, ry)) break; pos = [x, y]; taken.push(...sh); break outer;
        }
      }
      if (!pos) { pos = [st.x, st.y + 0.5 * st.r]; front = true; taken.push(...rlArmySh(pos[0], pos[1], kindP, B, rx, ry, figH, at, 0)); }
      const pc = { key: side + ':' + at, ids: list.map((c) => c.id), side, prov: at, x: pos[0], y: pos[1], B, rx, ry, figH, kind: kindP, front, box: boxAt(pos[0], pos[1]) };
      armies.push(pc); boxes.push([...pc.box, 'army', at]);
    });
  }
  // the battle marker (a scar): beside the seat, clear of its label zone and the pieces, reserved before the names
  const scarAt = new Map();
  for (const p of provs) {
    // a battle marker stays where the hamlet is hidden (Mid under 100 px a province, fix 4); at Far only at towns, as before
    const st = seats.get(p.i); if (!p.scar || (!st.kind && far) || fogOf(p.i) === 'unexplored') continue; const k = Math.max(0.8, Math.min(2.4, 0.014 * Dpx)), h = 9 * k, others = [lzone.get(p.i), ...boxes.map((q) => q.slice(0, 4))];
    for (const [ox, oy] of [[-0.2, 0.16], [0.2, 0.16], [-0.26, 0.02], [0.26, 0.02], [-0.14, 0.26], [0.14, 0.26], [0, 0.3], [-0.3, 0.22], [0.3, 0.22]]) {
      const bx = st.x + ox * Dpx, by = st.y + oy * Dpx, b = [bx - h * 0.6 - 2, by - h - 2, bx + h * 0.6 + 2, by + 3];
      if (ovl(b, others) || !inset(p.i, bx, by - h / 2, h * 0.6, h / 2)) continue; scarAt.set(p.i, [bx, by]); boxes.push([...b, 'marker', p.i]); break;
    }
    if (!scarAt.has(p.i)) { const bx = st.x - 0.2 * Dpx, by = st.y + 0.16 * Dpx; scarAt.set(p.i, [bx, by]); boxes.push([bx - h * 0.6 - 2, by - h - 2, bx + h * 0.6 + 2, by + 3, 'marker', p.i]); }
  }
  // labels: Far capitals, Wellsprings and wilds; Mid adds what the player points at or plans with; Near adds the towns, and from 320 px a province (and with Shift or the
  // numbers layer) every name (AD fix 6: every province was named from 180 px, 29 of 29 at ref-2's zoom; hover and link names stay live)
  const fs = rlFs(Dpx), labels = [], allNames = RL_NUMBERS.on || RL_NUMBERS.shift || Dpx >= RL_P.allNamesDpx;
  const want = new Set(); for (const p of provs) if (p.cap || p.well || allNames || (near && rlIsTown(p))) want.add(p.i);
  if (!far || allNames) { if (state.sel && state.sel.type === 'prov') want.add(state.sel.id); if (moveLine) for (const v of moveLine.path) want.add(v); }
  else { if (state.sel && state.sel.type === 'prov') want.add(state.sel.id); if (moveLine) want.add(moveLine.path[moveLine.path.length - 1]); }
  const placed = [], order = [...provs].sort((a, b) => { const pr = (p) => (p.cap ? 0 : p.well ? 1 : state.sel && state.sel.id === p.i ? 2 : moveLine && moveLine.path.includes(p.i) ? 3 : p.owner === VIEWER ? 4 : 5); return pr(a) - pr(b) || cent[a.i][1] - cent[b.i][1]; });
  const anchorOf = (p) => { // under the seat piece, or under an army standing in front of it
    const st = seats.get(p.i), fr = armies.find((a) => a.prov === p.i && a.front), bottom = fr ? fr.y + fr.ry + 0.12 * fr.B * 2 : st.kind === 'town' ? st.y + st.r * 0.64 + 0.12 * st.T : st.kind === 'hamlet' ? st.bot : st.y + 2;
    return [st.x, bottom + 3 + fs / 2];
  };
  const pieceBoxes = boxes.map((b) => b.slice(0, 4));
  if (moveLine) for (const v of moveLine.path) { const [x, y] = L(cent[v]); pieceBoxes.push([x - 8, y - 8, x + 8, y + 8]); } // the planned path's waypoint diamonds stay clear of the names
  const tryPlace = (p, force) => {
    const font = `${p.cap ? 700 : 500} ${(p.cap ? fs + 1 : fs).toFixed(1)}px 'Alegreya Sans', 'Segoe UI', sans-serif`, sw = rlShiftSwatch() ? 13 : 0, tw = textW(p.name, font) + sw, h = (p.cap ? fs + 1 : fs) + 3; // natural §7: Shift in Natural adds each name's 10 px swatch
    const [ax, ay] = anchorOf(p), st = seats.get(p.i), left = [-(tw / 2 + st.r + 4), -(ay - st.y)];
    let spots = [[0, 0], [0, 4], [0, -(ay - st.y) * 2 - 2], [tw / 2 + st.r + 4, -(ay - st.y)], left, [0, 10]];
    if (ax + tw / 2 + 2 > vb[2] || ctrl.some((q) => ax + tw / 2 + 2 > q[0] && ax - tw / 2 - 2 < q[2] && ay + h > q[1] && ay - h < q[3])) spots = [left, ...spots.filter((q) => q !== left)]; // fix 5: by the controls or the edge, the spot left of the seat first
    const seen = st.x >= vb[0] && st.x <= vb[2] && st.y >= vb[1] && st.y <= vb[3], mb = [0, 0, W * s, (H + RL_FACE) * s];
    const boxAt = ([dx, dy]) => { const x = ax + dx, y = ay + dy; return [x, y, [x - tw / 2 - 2, y - h / 2, x + tw / 2 + 2, y + h / 2]]; }, room = (b) => rlInBox(b, mb) && (rlInBox(b, vb) || (!seen && !ovl(b, [vb]))) && !(rib && ovl(b, [rib])) && !ovl(b, ctrl); // on the model; on screen wholly (a name for a seat off it waits off it); clear of the ribbon and the controls
    if (seen) { const sl = Math.max(0, vb[0] - (ax - tw / 2 - 2)) - Math.max(0, ax + tw / 2 + 2 - Math.min(vb[2], ...ctrl.filter((q) => ay + h > q[1] && ay - h < q[3]).map((q) => q[0]))); if (sl) spots.push([sl, 0], [sl, -(ay - st.y) * 2 - 2]); } // by the view's edge: the name slid inward under its seat (or above it)
    for (const sp of spots) {
      const [x, y, b] = boxAt(sp); if (!room(b) || ovl(b, pieceBoxes) || ovl(b, placed)) continue;
      placed.push(b); return { i: p.i, x, y, font, text: p.name, box: b, sw };
    }
    if (force) { // a capital or the path's name: the first spot with room (left of the seat first by the controls), over a piece if it must; never off the canvas or under the controls
      // pass 3 fix (the verifier's item 7: Deepmoss over the seat in Ashdale at the phone's Fit): first a wider search near the seat (up to three lines above or below, half to
      // one name width aside, nearest first) for a spot clear of every piece and name
      const far2 = []; for (const ky of [-1, 1, -2, 2, -3, 3]) for (const kx of [0, -0.6, 0.6, -1.1, 1.1]) far2.push([kx * (tw + 4), ky * (h + 1)]); far2.sort((a, b) => Math.hypot(a[0], a[1] * 1.6) - Math.hypot(b[0], b[1] * 1.6));
      for (const sp2 of far2) { const [x, y, b] = boxAt(sp2); if (!room(b) || ovl(b, pieceBoxes) || ovl(b, placed)) continue; placed.push(b); return { i: p.i, x, y, font, text: p.name, box: b, sw, aside: true }; }
      const sp = spots.find((q) => room(boxAt(q)[2])); if (!sp) return null; const [x, y, b] = boxAt(sp); placed.push(b); return { i: p.i, x, y, font, text: p.name, box: b, forced: true, sw }; }
    return null;
  };
  const cand = new Map(); // every province's label spot (for live hover and link names)
  for (const p of order) { const [ax, ay] = anchorOf(p), font = `${p.cap ? 700 : 500} ${(p.cap ? fs + 1 : fs).toFixed(1)}px 'Alegreya Sans', 'Segoe UI', sans-serif`; cand.set(p.i, { x: ax, y: ay, font }); }
  // wild names first (they never move): straight at Far and Mid, curved along the massif at Near. Polish (pass-2 verifier item 5: the Ashspine's and the Mere's names crossed
  // their own outline at the start view, Fit and the least zoom): a name, halo included, sits wholly inside its wild, clear of the outline by the ink, the stone band and 1.5 px
  // (rlWildFits); its spot is searched over the wild, then tighter tracking, then 1 px smaller; a name that fits nowhere is dropped (the hover card names the wild)
  const wildOps = [];
  for (const w of WILDS) {
    const G = wgeo(w), wfs0 = far ? 11.5 : near ? Math.max(13, G.nameFs + 2) : Math.max(12, G.nameFs), fits = rlWildFitter(w, s), free = (q) => (rlInBox(q, vb) || !ovl(q, [vb])) && rlInBox(q, [0, 0, W * s, H * s]) && !ovl(q, pieceBoxes) && !ovl(q, placed) && !(rib && ovl(q, [rib])) && !ovl(q, ctrl);
    if (near) { const f = `italic 500 ${wfs0.toFixed(1)}px 'Alegreya Sans', sans-serif`, Pw = wildSpine(w).map(([x, y]) => [x * s, y * s]); const gl = layoutOnPath(w.name, Pw, f, 0.14 * wfs0, wfs0); if (gl) { const bs = glyphBoxes(gl, 2); if (!anyHit(bs, placed) && !anyHit(bs, pieceBoxes) && (bs.every((q) => rlInBox(q, vb)) || !anyHit(bs, [vb])) && !anyHit(bs, ctrl) && bs.every((q) => fits(q))) { placed.push(...bs); wildOps.push({ w, gl, font: f }); continue; } } }
    const [lx, ly] = L(G.labelPt ?? cent[G.labelAt]), vert = G.vertical; let wb = [Infinity, Infinity, -Infinity, -Infinity]; for (const c of w.cells) { const q = bboxOf(cells[c]); wb = [Math.min(wb[0], q[0]), Math.min(wb[1], q[1]), Math.max(wb[2], q[2]), Math.max(wb[3], q[3])]; }
    const grid = []; for (let y = wb[1] * s; y <= wb[3] * s; y += 4) for (let x = wb[0] * s; x <= wb[2] * s; x += 4) grid.push([x, y]); grid.sort((a, b) => Math.hypot(a[0] - lx, (a[1] - ly) * 1.5) - Math.hypot(b[0] - lx, (b[1] - ly) * 1.5) || a[1] - b[1] || a[0] - b[0]); // nearest the design's spot first (a vertical drift costs 1.5x)
    let op = null;
    for (const [wfs, ls] of [[wfs0, 0.12], [wfs0, 0.06], [wfs0, 0], [Math.max(10.5, wfs0 - 1), 0]]) {
      const f = `italic 500 ${wfs.toFixed(1)}px 'Alegreya Sans', sans-serif`, tw = textW(w.name, f) + ls * wfs * w.name.length + 2, hw = (vert ? wfs : tw) / 2 + 2, hh = (vert ? tw : wfs) / 2 + 2;
      if (tw > 1.1 * (vert ? wb[3] - wb[1] : wb[2] - wb[0]) * s) continue; // fix 6b: longer than 1.1x the wild's extent along it, never
      const spots = vert ? [[lx, ly]] : [[lx, ly], [lx, ly + 22], [lx, ly - 22], ...w.cells.map((c) => L(cent[c]))];
      const sp = [...spots, ...grid].find(([x, y]) => { const q = [x - hw, y - hh, x + hw, y + hh]; return fits(q) && free(q); }); if (!sp) continue;
      op = { w, x: sp[0], y: sp[1], font: f, vertical: vert, ls, box: [sp[0] - hw, sp[1] - hh, sp[0] + hw, sp[1] + hh] }; break;
    }
    if (op) { placed.push(op.box); wildOps.push(op); }
  }
  for (const p of order) if (want.has(p.i)) { const lb = tryPlace(p, p.cap || (moveLine && !allNames && moveLine.path.includes(p.i))); if (lb) labels.push(lb); } // a planned path's names always show
  // the numbers layer: one chip per province with the active mode's value (PD in Ownership)
  const chips = [];
  if (RL_NUMBERS.on || RL_NUMBERS.shift) for (const p of provs) {
    if (fogOf(p.i) === 'unexplored' && state.mode !== 'ownership' && state.mode !== 'terrain') continue; const v = rlModeValue(p); if (v == null) continue; // terrain is public: named in every fog state
    const tg = state.mode === 'terrain' ? p.terrain : null, lb = labels.find((q) => q.i === p.i), st = seats.get(p.i), w2 = textW(String(v), "600 11px 'IBM Plex Sans Condensed'") + 10 + (tg ? 13 : 0), lw = lb ? (lb.box[2] - lb.box[0]) / 2 : 0; // the Terrain mode's chip: the glyph and the word
    const spots = lb ? [[lb.x, lb.box[3] + 9], [lb.box[2] + w2 / 2 + 2, lb.y], [lb.box[0] - w2 / 2 - 2, lb.y], [lb.x, lb.box[1] - 9], [lb.x + lw, lb.box[3] + 9], [lb.x - lw, lb.box[3] + 9]] : [[st.x, st.y + st.r + 12], [st.x + st.r + w2 / 2 + 4, st.y], [st.x - st.r - w2 / 2 - 4, st.y]];
    const sp = spots.find(([x, y]) => { const b = [x - w2 / 2, y - 8, x + w2 / 2, y + 8]; return !ovl(b, pieceBoxes) && !ovl(b, placed); }); // a chip keeps off the pieces and names, or waits for the zoom
    if (!sp) continue; const [x, y] = sp, b = [x - w2 / 2, y - 8, x + w2 / 2, y + 8]; placed.push(b); chips.push({ x, y, text: String(v), box: b, tg });
  }
  // scenery on the land: land-look pieces by dominion band and one pole motif (Mid: at most 3 and 1; Near: up to 10), never under a piece or label
  if (!far) for (const p of provs) {
    if (fogOf(p.i) || !p.dom.n) continue; const sdom = p.dom.s, nLook = near ? Math.min(10, sdom + 1) : sdom <= 3 ? 1 : sdom <= 6 ? 2 : 3;
    const axis = SCALES[p.dom.n][0], pole = effStep(axis[1], sdom) >= 1 ? axis[0] : null, k = Math.max(0.55, Math.min(1.5, 0.0068 * Dpx));
    let nl = 0, np = 0; for (const q of rlScenPoints(p.i)) {
      const [x, y] = L([q.x, q.y]), b = [x - 6 * k, y - 9 * k, x + 6 * k, y + 2 * k]; if (ovl(b, pieceBoxes) || ovl(b, placed)) continue;
      if (pole && np < 1) { scen.push({ kind: 'pole', pole, x, y, k, j: q.j, i: p.i }); np++; placed.push(b); continue; }
      if (nl < nLook) { scen.push({ kind: 'look', look: p.dom.n, lvl: sdom >= 7 ? 3 : sdom >= 4 ? 2 : 1, x, y, k, j: q.j, i: p.i }); nl++; placed.push(b); }
      if (nl >= nLook && (np >= 1 || !pole)) break;
    }
  }
  // events, independents' guards (Near), mana spring stones (Near)
  for (const p of provs) {
    const st = seats.get(p.i), fog = fogOf(p.i); if (fog === 'unexplored' || (!st.kind && far)) continue; // event pieces stay where the hamlet is hidden (Mid under 100 px, fix 4); at Far only at towns, as before
    if (p.siege || p.pillage || (p.fx && p.fx.length) || p.scar || p.unrest >= 50) events.push({ p, st, scar: scarAt.get(p.i) ?? null });
    if (Dpx >= RL_P.guardDpx && st.kind && p.owner === null && p.indep) { const n = Math.min(RL_P.guardMax, TENTS[strengthWord(p.indep)]), gH = 0.55 * Ba; for (let k2 = 0; k2 < n; k2++) { const a = Math.PI * (0.8 + 0.22 * k2), d = st.r * (st.kind === 'town' ? 0.45 : 0.5); guards.push({ x: st.x + Math.cos(a) * d, y: st.y + Math.sin(a) * d * 0.64 + (st.kind === 'town' ? 0 : 2), h: gH, bow: k2 % 2 === 1, i: p.i }); } }
    if (near && p.springs.length) p.springs.forEach((c, k2) => stones.push({ c, x: st.x + st.r + 10 + k2 * 9, y: st.y - st.r * 0.3 - 4, i: p.i }));
  }
  const shapes = []; let sid = 0; // for the overlap check: [x0, y0, x1, y1, kind, prov, id, base?] (a base is its ellipse swept down by its side band; an upright part is its box)
  for (const [, st] of seats) { if (!st.kind) continue; sid++; shapes.push(...rlSeatSh(st, st.i, sid)); }
  for (const wl of wells) { sid++; shapes.push(...rlWellSh(wl.x, wl.y, wl.B, wl.i, sid)); }
  for (const a of armies) { sid++; shapes.push(...rlArmySh(a.x, a.y, a.kind, a.B, a.rx, a.ry, a.figH, a.prov, sid)); }
  for (const b of boxes) if (b[4] === 'marker') { sid++; shapes.push([...b.slice(0, 4), 'marker', b[5], sid]); }
  const out = { key, band, s, Dpx, Ba, fs, seats, armies, wells, boxes, shapes, labels, wildOps, chips, scen, events, guards, stones, cand, rib, ctrl };
  RL_PIECE_CACHE.set('L', out); return out;
}
function rlModeValue(p) {
  switch (state.mode) {
    case 'ownership': return p.pd; case 'population': return (p.pop / 1000).toFixed(1) + 'k'; case 'unrest': return p.unrest; case 'supply': return Math.round((SUPPLY[p.terrain] + p.pop / 50) * p4SupplyK());
    case 'dominion': return p.dom.n ? p.dom.s : null; case 'springs': return p.springs.length ? p.springs.join('') : null; case 'terrain': return TERRAIN[p.terrain].name; default: return null;
  }
}
const rlToScr = (lx, ly, ls = cam.s) => [(lx * cam.s) / ls + cam.x, (ly * cam.s) / ls + cam.y]; // layout px (laid out at scale ls) to the live frame: during a wheel zoom the cached land is drawn at the new scale before the layout is redone
const rlLayK = (lay) => (lay ? cam.s / lay.s : 1);
function rlPieceAt(id) { const lay = RL_PIECE_CACHE.get('L'); if (!lay) return null; const a = lay.armies.find((q) => q.ids.includes(id)); return a ? [a.x / lay.s, a.y / lay.s] : null; }
const rlShiftSwatch = () => RL_NUMBERS.shift && RB.ready && rlShownLook() === 'natural'; // Shift held alone in Natural: each name with its terrain swatch
// ---- the seat ground (natural §10 defect 3): each house tone is muted against the darkest texel of the bake under that house's own footprint (+1 px), in the look on
// screen, at the drawn mip, in the province's state (wash, fog). The v4 muting against the flat albedo overshot on textured ground. Cached per spot, look and mip.
const RL_SEATG = new Map();
function rlHouseGround(i, x0, y0, x1, y1, median) { // a screen-px box (+1 px); returns a hex colour
  if (!RB.ready) return RL_ALB[prov[i].terrain]; const look = rlShownLook(), Lk = rlLkFor(look), lvl = rlMipLevel(); if (!Lk) return RL_ALB[prov[i].terrain];
  const [wx0, wy0] = toWorld(x0 - 1, y0 - 1), [wx1, wy1] = toWorld(x1 + 1, y1 + 1), S = rlStateOf(i, look, true);
  const key = [look + rlSeasonKey(), lvl, Math.round(wx0 * 8), Math.round(wy0 * 8), Math.round(wx1 * 8), Math.round(wy1 * 8), median ? 1 : 0, S.wa.toFixed(3), S.haze, S.sat].join('|'); let v = RL_SEATG.get(key); if (v) return v;
  const src = lvl === 2 ? Lk.mb2 : lvl === 1 ? Lk.mb1 : Lk.img, w = src.width, h = src.height, f = (RB.TX * w) / RB.BW, d = src.data, out = [];
  for (let ty = Math.max(0, Math.floor(wy0 * f)); ty <= Math.min(h - 1, Math.floor(wy1 * f)); ty++) for (let tx = Math.max(0, Math.floor(wx0 * f)); tx <= Math.min(w - 1, Math.floor(wx1 * f)); tx++) {
    const k = (ty * w + tx) * 4; if (d[k + 3] < 255) continue; const c = rlApplyState([d[k], d[k + 1], d[k + 2]], S); out.push([rlLumOf(...c), ...c]);
  }
  if (!out.length) return RL_ALB[prov[i].terrain]; out.sort((p, q) => p[0] - q[0]); const q = median ? out[out.length >> 1] : out[0];
  v = rgb2hex([q[1], q[2], q[3]]); if (RL_SEATG.size > 20000) RL_SEATG.clear(); RL_SEATG.set(key, v); return v;
}
