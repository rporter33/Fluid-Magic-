
// ------------------------------------------------------------------ v4 relief: miniatures on bases (§6), labels by zoom band (§7)
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
const rlTownPx = (p, Dpx) => Math.max(14, Math.min(120, (0.16 + 0.045 * (rlStep(p) - 1)) * Dpx));
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
function rlLayout(band) {
  const key = [cam.s.toFixed(5), band, KEYVER, curMonth, rlPiecesSig(), state.sel ? state.sel.type + state.sel.id : '', moveLine ? moveLine.path.join('.') : '', RL_NUMBERS.on, RL_NUMBERS.shift, fontsReady, RB.ver, view.detail].join('|');
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
    if (fog === 'unexplored') { if (!far) { kind = 'hut'; T = Math.max(6, 0.04 * Dpx * 1.6); r = T / 2; } }
    else if (rlIsTown(p)) { kind = 'town'; T = rlTownPx(p, Dpx); r = T / 2; }
    else if (!far) { kind = 'hamlet'; T = Math.max(5, Math.min(14, 0.06 * Dpx)); const nH = near ? houseCount(p) : Math.min(4, houseCount(p)); rm = T * 0.62 * Math.sqrt(nH - 1 + 0.35); r = Math.max(0.08 * Dpx, rm * 1.25 + 0.6 * T); }
    const st = { i: p.i, x, y, kind, T, r };
    if (kind === 'town') st.box = [x - r - 1, y - r * 0.64 - 0.42 * T, x + r + 1, y + r * 0.64 + 0.12 * T + 1];
    else if (kind === 'hamlet') st.box = [x - rm * 1.25 - 0.62 * T, y - 0.72 * rm - 1.1 * T, x + rm * 1.25 + 0.62 * T, y + 0.72 * rm + 0.25 * T]; // the houses' extent (roofs to shadows)
    else if (kind === 'hut') st.box = [x - T * 0.7, y - T * 1.1, x + T * 0.7, y + T * 0.3];
    seats.set(p.i, st); if (st.box) boxes.push([...st.box, 'seat', p.i]);
  }
  // the label zone under every seat, reserved before the Wellspring and the armies take their slots (a piece never covers a label)
  const fs0 = rlFs(Dpx), lzone = new Map();
  for (const p of provs) { const st = seats.get(p.i), f0 = `${p.cap ? 700 : 500} ${(p.cap ? fs0 + 1 : fs0).toFixed(1)}px 'Alegreya Sans', 'Segoe UI', sans-serif`, tw = textW(p.name, f0), bot = st.kind === 'town' ? st.y + st.r * 0.64 + 0.12 * st.T : st.kind === 'hamlet' ? st.y + st.r * 0.6 : st.y + 2, h = fs0 + 4; lzone.set(p.i, [st.x - tw / 2 - 3, bot + 2, st.x + tw / 2 + 3, bot + 3 + h + 2]); }
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
  const byProv = new Map(); for (const c of Object.values(cmd)) { if (c.hidden) continue; const m = byProv.get(c.at) ?? new Map(); const l = m.get(c.side) ?? []; l.push(c); m.set(c.side, l); byProv.set(c.at, m); }
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
    const st = seats.get(p.i); if (!p.scar || !st.kind || fogOf(p.i) === 'unexplored') continue; const k = Math.max(0.8, Math.min(2.4, 0.014 * Dpx)), h = 9 * k, others = [lzone.get(p.i), ...boxes.map((q) => q.slice(0, 4))];
    for (const [ox, oy] of [[-0.2, 0.16], [0.2, 0.16], [-0.26, 0.02], [0.26, 0.02], [-0.14, 0.26], [0.14, 0.26], [0, 0.3], [-0.3, 0.22], [0.3, 0.22]]) {
      const bx = st.x + ox * Dpx, by = st.y + oy * Dpx, b = [bx - h * 0.6 - 2, by - h - 2, bx + h * 0.6 + 2, by + 3];
      if (ovl(b, others) || !inset(p.i, bx, by - h / 2, h * 0.6, h / 2)) continue; scarAt.set(p.i, [bx, by]); boxes.push([...b, 'marker', p.i]); break;
    }
    if (!scarAt.has(p.i)) { const bx = st.x - 0.2 * Dpx, by = st.y + 0.16 * Dpx; scarAt.set(p.i, [bx, by]); boxes.push([bx - h * 0.6 - 2, by - h - 2, bx + h * 0.6 + 2, by + 3, 'marker', p.i]); }
  }
  // labels: Far capitals, Wellsprings and wilds; Mid adds what the player points at or plans with; Near (and Shift, the numbers layer) every name
  const fs = rlFs(Dpx), labels = [], allNames = RL_NUMBERS.on || RL_NUMBERS.shift || near;
  const want = new Set(); for (const p of provs) if (p.cap || p.well || allNames) want.add(p.i);
  if (!far || allNames) { if (state.sel && state.sel.type === 'prov') want.add(state.sel.id); if (moveLine) for (const v of moveLine.path) want.add(v); }
  else { if (state.sel && state.sel.type === 'prov') want.add(state.sel.id); if (moveLine) want.add(moveLine.path[moveLine.path.length - 1]); }
  const placed = [], order = [...provs].sort((a, b) => { const pr = (p) => (p.cap ? 0 : p.well ? 1 : state.sel && state.sel.id === p.i ? 2 : moveLine && moveLine.path.includes(p.i) ? 3 : p.owner === VIEWER ? 4 : 5); return pr(a) - pr(b) || cent[a.i][1] - cent[b.i][1]; });
  const anchorOf = (p) => { // under the seat piece, or under an army standing in front of it
    const st = seats.get(p.i), fr = armies.find((a) => a.prov === p.i && a.front), bottom = fr ? fr.y + fr.ry + 0.12 * fr.B * 2 : st.kind === 'town' ? st.y + st.r * 0.64 + 0.12 * st.T : st.kind === 'hamlet' ? st.y + st.r * 0.6 : st.y + 2;
    return [st.x, bottom + 3 + fs / 2];
  };
  const pieceBoxes = boxes.map((b) => b.slice(0, 4));
  if (moveLine) for (const v of moveLine.path) { const [x, y] = L(cent[v]); pieceBoxes.push([x - 8, y - 8, x + 8, y + 8]); } // the planned path's waypoint diamonds stay clear of the names
  const tryPlace = (p, force) => {
    const font = `${p.cap ? 700 : 500} ${(p.cap ? fs + 1 : fs).toFixed(1)}px 'Alegreya Sans', 'Segoe UI', sans-serif`, tw = textW(p.name, font), h = (p.cap ? fs + 1 : fs) + 3;
    const [ax, ay] = anchorOf(p), st = seats.get(p.i);
    const spots = [[0, 0], [0, 4], [0, -(ay - st.y) * 2 - 2], [tw / 2 + st.r + 4, -(ay - st.y)], [-(tw / 2 + st.r + 4), -(ay - st.y)], [0, 10]];
    for (const [dx, dy] of spots) {
      const x = ax + dx, y = ay + dy, b = [x - tw / 2 - 2, y - h / 2, x + tw / 2 + 2, y + h / 2];
      if (ovl(b, pieceBoxes) || ovl(b, placed)) continue;
      placed.push(b); return { i: p.i, x, y, font, text: p.name, box: b };
    }
    if (force) { const b = [ax - tw / 2 - 2, ay - h / 2, ax + tw / 2 + 2, ay + h / 2]; placed.push(b); return { i: p.i, x: ax, y: ay, font, text: p.name, box: b, forced: true }; }
    return null;
  };
  const cand = new Map(); // every province's label spot (for live hover and link names)
  for (const p of order) { const [ax, ay] = anchorOf(p), font = `${p.cap ? 700 : 500} ${(p.cap ? fs + 1 : fs).toFixed(1)}px 'Alegreya Sans', 'Segoe UI', sans-serif`; cand.set(p.i, { x: ax, y: ay, font }); }
  // wild names first (they never move): straight at Far and Mid, curved along the massif at Near
  const wildOps = [];
  for (const w of WILDS) {
    const G = wgeo(w), wfs = far ? 11.5 : near ? Math.max(13, G.nameFs + 2) : Math.max(12, G.nameFs), f = `italic 500 ${wfs.toFixed(1)}px 'Alegreya Sans', sans-serif`;
    if (near) { const Pw = wildSpine(w).map(([x, y]) => [x * s, y * s]); const gl = layoutOnPath(w.name, Pw, f, 0.14 * wfs, wfs); if (gl) { const bs = glyphBoxes(gl, 2); if (!anyHit(bs, placed) && !anyHit(bs, pieceBoxes)) { placed.push(...bs); wildOps.push({ w, gl, font: f }); continue; } } }
    const tw = textW(w.name, f) + 0.12 * wfs * w.name.length + 2, [lx, ly] = L(G.labelPt ?? cent[G.labelAt]), vert = G.vertical, hw = (vert ? wfs : tw) / 2 + 2, hh = (vert ? tw : wfs) / 2 + 2;
    const spots = vert ? [[lx, ly]] : [[lx, ly], [lx, ly + 22], [lx, ly - 22], ...w.cells.map((c) => L(cent[c]))];
    const sp = spots.find(([x, y]) => !ovl([x - hw, y - hh, x + hw, y + hh], pieceBoxes) && !ovl([x - hw, y - hh, x + hw, y + hh], placed)) ?? spots[0];
    const b = [sp[0] - hw, sp[1] - hh, sp[0] + hw, sp[1] + hh]; placed.push(b); wildOps.push({ w, x: sp[0], y: sp[1], font: f, vertical: vert, box: b });
  }
  for (const p of order) if (want.has(p.i)) { const lb = tryPlace(p, p.cap || (moveLine && !allNames && moveLine.path.includes(p.i))); if (lb) labels.push(lb); } // a planned path's names always show
  // the numbers layer: one chip per province with the active mode's value (PD in Ownership)
  const chips = [];
  if (RL_NUMBERS.on || RL_NUMBERS.shift) for (const p of provs) {
    if (fogOf(p.i) === 'unexplored' && state.mode !== 'ownership') continue; const v = rlModeValue(p); if (v == null) continue;
    const lb = labels.find((q) => q.i === p.i), st = seats.get(p.i), w2 = textW(String(v), "600 11px 'IBM Plex Sans Condensed'") + 10, lw = lb ? (lb.box[2] - lb.box[0]) / 2 : 0;
    const spots = lb ? [[lb.x, lb.box[3] + 9], [lb.box[2] + w2 / 2 + 2, lb.y], [lb.box[0] - w2 / 2 - 2, lb.y], [lb.x, lb.box[1] - 9], [lb.x + lw, lb.box[3] + 9], [lb.x - lw, lb.box[3] + 9]] : [[st.x, st.y + st.r + 12], [st.x + st.r + w2 / 2 + 4, st.y], [st.x - st.r - w2 / 2 - 4, st.y]];
    const sp = spots.find(([x, y]) => { const b = [x - w2 / 2, y - 8, x + w2 / 2, y + 8]; return !ovl(b, pieceBoxes) && !ovl(b, placed); }); // a chip keeps off the pieces and names, or waits for the zoom
    if (!sp) continue; const [x, y] = sp, b = [x - w2 / 2, y - 8, x + w2 / 2, y + 8]; placed.push(b); chips.push({ x, y, text: String(v), box: b });
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
    const st = seats.get(p.i), fog = fogOf(p.i); if (fog === 'unexplored' || !st.kind) continue;
    if (p.siege || p.pillage || (p.fx && p.fx.length) || p.scar || p.unrest >= 50) events.push({ p, st, scar: scarAt.get(p.i) ?? null });
    if (near && p.owner === null && p.indep) { const n = TENTS[strengthWord(p.indep)], gH = 0.55 * Ba; for (let k2 = 0; k2 < n; k2++) { const a = Math.PI * (0.8 + 0.22 * k2), d = st.r * (st.kind === 'town' ? 0.45 : 1.1) + (st.kind === 'town' ? 0 : 0.35 * Ba); guards.push({ x: st.x + Math.cos(a) * d, y: st.y + Math.sin(a) * d * 0.64 + (st.kind === 'town' ? 0 : 2), h: gH, bow: k2 % 2 === 1, i: p.i }); } }
    if (near && p.springs.length) p.springs.forEach((c, k2) => stones.push({ c, x: st.x + st.r + 10 + k2 * 9, y: st.y - st.r * 0.3 - 4, i: p.i }));
  }
  const shapes = []; let sid = 0; // for the overlap check: [x0, y0, x1, y1, kind, prov, id, base?] (a base is its ellipse swept down by its side band; an upright part is its box)
  for (const [, st] of seats) { if (!st.kind) continue; sid++; shapes.push(...rlSeatSh(st, st.i, sid)); }
  for (const wl of wells) { sid++; shapes.push(...rlWellSh(wl.x, wl.y, wl.B, wl.i, sid)); }
  for (const a of armies) { sid++; shapes.push(...rlArmySh(a.x, a.y, a.kind, a.B, a.rx, a.ry, a.figH, a.prov, sid)); }
  for (const b of boxes) if (b[4] === 'marker') { sid++; shapes.push([...b.slice(0, 4), 'marker', b[5], sid]); }
  const out = { key, band, s, Dpx, Ba, fs, seats, armies, wells, boxes, shapes, labels, wildOps, chips, scen, events, guards, stones, cand };
  RL_PIECE_CACHE.set('L', out); return out;
}
function rlModeValue(p) {
  switch (state.mode) {
    case 'ownership': return p.pd; case 'population': return (p.pop / 1000).toFixed(1) + 'k'; case 'unrest': return p.unrest; case 'supply': return Math.round(SUPPLY[p.terrain] + p.pop / 50);
    case 'dominion': return p.dom.n ? p.dom.s : null; case 'springs': return p.springs.length ? p.springs.join('') : null; default: return null;
  }
}
const rlToScr = (lx, ly, ls = cam.s) => [(lx * cam.s) / ls + cam.x, (ly * cam.s) / ls + cam.y]; // layout px (laid out at scale ls) to the live frame: during a wheel zoom the cached land is drawn at the new scale before the layout is redone
const rlLayK = (lay) => (lay ? cam.s / lay.s : 1);
function rlPieceAt(id) { const lay = RL_PIECE_CACHE.get('L'); if (!lay) return null; const a = lay.armies.find((q) => q.ids.includes(id)); return a ? [a.x / lay.s, a.y / lay.s] : null; }

// ---- drawing bases, towns, houses (screen px; the light from the upper left; shadows to the lower right)
function rlBasePath(g, x, y, rx, ry, notched) {
  g.beginPath();
  if (!notched) { g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); return; }
  const depth = Math.max(2, 0.12 * 2 * rx), nArc = (0.3 * 2 * Math.PI) / 8; // 8 notches, 30% of the circumference
  for (let m = 0; m <= 96; m++) { const a = (m / 96) * Math.PI * 2, ph = ((a + Math.PI / 8) % (Math.PI / 4)) - Math.PI / 8, inN = Math.abs(ph) < nArc / 2, r = inN ? 1 - depth / rx : 1; const px = x + Math.cos(a) * rx * r, py = y + Math.sin(a) * ry * r; m ? g.lineTo(px, py) : g.moveTo(px, py); }
  g.closePath();
}
function rlBase(g, x, y, rx, ry, rim, opts = {}) { // a dark round base: shadow, side band, top, rim (banner or pewter), worn lip on its upper-left quarter
  const band = Math.max(1.5, 0.12 * 2 * rx * (opts.bandK ?? 1)), lift = opts.lift ?? 0;
  g.fillStyle = `rgba(0,0,0,${opts.shadowA ?? 0.25})`; rlBasePath(g, x + 0.15 * 2 * rx * 0.5 + lift, y + band + 0.15 * rx * 0.64 + lift, rx * (1 + lift * 0.03), ry * (1 + lift * 0.03), false); g.fill();
  y -= lift;
  for (let t = band; t > 0; t -= 1) { g.fillStyle = t > band * 0.5 ? '#0F0D0B' : '#16130F'; rlBasePath(g, x, y + t, rx, ry, opts.notched); g.fill(); }
  const sg = g.createLinearGradient(x - rx, 0, x + rx, 0); sg.addColorStop(0, 'rgba(120,108,92,.35)'); sg.addColorStop(0.45, 'rgba(0,0,0,0)'); g.fillStyle = sg; g.save(); g.beginPath(); g.rect(x - rx - 1, y, 2 * rx + 2, band + ry + 1); g.clip(); rlBasePath(g, x, y + band * 0.5, rx, ry, opts.notched); g.fill(); g.restore();
  g.fillStyle = opts.top ?? RL_C.base; rlBasePath(g, x, y, rx, ry, opts.notched); g.fill();
  if (opts.brass) { g.strokeStyle = RL_C.brass; g.lineWidth = Math.max(1.2, rx * 0.12); rlBasePath(g, x, y, rx + g.lineWidth * 0.2, ry + g.lineWidth * 0.12, opts.notched); g.stroke(); }
  if (rim) { g.strokeStyle = rim; g.lineWidth = opts.rimW ?? 2.4; rlBasePath(g, x, y, rx - g.lineWidth / 2, ry - g.lineWidth * 0.32, opts.notched); g.stroke(); }
  g.strokeStyle = RL_C.baseLip; g.lineWidth = 1; g.beginPath(); g.ellipse(x, y, Math.max(1, rx - (opts.rimW ?? 2.4) - 0.6), Math.max(1, ry - (opts.rimW ?? 2.4) * 0.32 - 0.4), 0, Math.PI * 1.05, Math.PI * 1.45); g.stroke();
  return y;
}
function rlHouse(g, x, y, s, kitK, muted, ground, flags = {}) { // one house seen from 40 degrees: a south wall in shade, the roof's south slope, its lit west end
  const K = rlKitOf(kitK), mu = (c) => (muted ? rlMuted(c, ground) : c), hw = 0.42 * s, hr = 0.42 * s;
  g.fillStyle = 'rgba(0,0,0,.25)'; ellipse(g, x + 0.28 * s, y + 0.06 * s, 0.62 * s, 0.17 * s); g.fill();
  if (kitK === 'green') { // a round timber hut under a living roof
    g.fillStyle = mu(shadeL(K.wall, -8)); ellipse(g, x, y - 0.18 * s, 0.46 * s, 0.24 * s); g.fill(); g.fillRect(x - 0.46 * s, y - 0.5 * s, 0.92 * s, 0.32 * s);
    if (flags.ruin) return; const rg = g.createLinearGradient(x - 0.5 * s, y - s, x + 0.5 * s, y); rg.addColorStop(0, mu(flags.fresh ? '#E3CF8F' : K.roofHi)); rg.addColorStop(1, mu(flags.fresh ? '#B89A5A' : K.roof));
    g.fillStyle = rg; g.beginPath(); g.ellipse(x, y - 0.5 * s, 0.56 * s, 0.5 * s, 0, Math.PI, 0); g.closePath(); g.fill();
    if (!flags.shut && !muted) { g.fillStyle = K.win; g.fillRect(x - 0.06 * s, y - 0.36 * s, 0.12 * s, 0.14 * s); } else if (flags.shut) { g.fillStyle = '#2B2A28'; g.fillRect(x - 0.08 * s, y - 0.38 * s, 0.16 * s, 0.16 * s); }
    return;
  }
  g.fillStyle = mu(shadeL(K.wall, -10)); g.fillRect(x - s / 2, y - hw, s, hw); // the south wall, in shade
  g.fillStyle = mu(shadeL(K.wall, 6)); g.beginPath(); g.moveTo(x - s / 2, y); g.lineTo(x - s / 2, y - hw); g.lineTo(x - s / 2 - 0.12 * s, y - hw - 0.1 * s); g.lineTo(x - s / 2 - 0.12 * s, y - 0.1 * s); g.closePath(); g.fill(); // the lit west end
  if (flags.ruin) return;
  const rg = g.createLinearGradient(x - s / 2, 0, x + s / 2, 0); rg.addColorStop(0, mu(shadeL(flags.fresh ? '#E3CF8F' : K.roof, 10))); rg.addColorStop(1, mu(flags.fresh ? '#B89A5A' : K.roof));
  g.fillStyle = rg; g.beginPath(); g.moveTo(x - s / 2 - 0.1 * s, y - hw); g.lineTo(x + s / 2 + 0.06 * s, y - hw); g.lineTo(x + s / 2 - 0.04 * s, y - hw - hr); g.lineTo(x - s / 2 - 0.16 * s, y - hw - hr); g.closePath(); g.fill();
  g.strokeStyle = mu(kitK === 'red' ? '#5E5953' : shadeL(K.roof, 14)); g.lineWidth = Math.max(0.5, 0.06 * s); g.beginPath(); g.moveTo(x - s / 2 - 0.16 * s, y - hw - hr); g.lineTo(x + s / 2 - 0.04 * s, y - hw - hr); g.stroke();
  if (s >= 5) { if (flags.shut) { g.fillStyle = '#2B2A28'; g.fillRect(x - 0.3 * s, y - hw * 0.72, 0.18 * s, 0.26 * s); g.fillRect(x + 0.1 * s, y - hw * 0.72, 0.18 * s, 0.26 * s); } else if (!muted || kitK === 'red') { g.fillStyle = muted ? mix(K.win, ground, 0.5) : K.win; g.fillRect(x - 0.26 * s, y - hw * 0.66, 0.12 * s, 0.18 * s); g.fillRect(x + 0.14 * s, y - hw * 0.66, 0.12 * s, 0.18 * s); } }
}
const RL_MUTE = new Map();
function rlMuted(c, ground) { // the color moved toward the ground until it is within 2.5:1 of it (WCAG luminance)
  const k = c + ground; let v = RL_MUTE.get(k); if (v) return v; const G = hex2rgb(ground);
  if (rlWcag(hex2rgb(c), G) <= 2.5) v = c; else { let lo = 0, hi = 1; for (let it = 0; it < 14; it++) { const m = (lo + hi) / 2; if (rlWcag(hex2rgb(mix(c, ground, m)), G) > 2.5) lo = m; else hi = m; } v = mix(c, ground, hi); }
  RL_MUTE.set(k, v); return v;
}
function rlPennant(g, x, y, h, col) { g.strokeStyle = '#2B2A28'; g.lineWidth = Math.max(0.8, h * 0.06); g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - h); g.stroke(); g.fillStyle = col; g.beginPath(); g.moveTo(x, y - h); g.lineTo(x + h * 0.55, y - h * 0.84); g.lineTo(x, y - h * 0.66); g.closePath(); g.fill(); g.strokeStyle = 'rgba(28,26,23,.6)'; g.lineWidth = 0.6; g.stroke(); }
function rlTower(g, x, y, w, h, stone, hi) { g.fillStyle = shadeL(stone, -12); g.fillRect(x - w / 2, y - h, w, h); g.fillStyle = hi; g.fillRect(x - w / 2, y - h, w * 0.32, h); g.fillStyle = shadeL(stone, 8); ellipse(g, x, y - h, w / 2, w * 0.24); g.fill(); g.fillStyle = shadeL(stone, -22); for (let k = 0; k < 3; k++) g.fillRect(x - w / 2 + (k * w) / 3 + w * 0.04, y - h - w * 0.2, w * 0.18, w * 0.16); }
function rlTown(g, st, p, band, ground) {
  const { x, T } = st, far = band === 'far', kitK = p.kitOwner ?? p.owner, K = rlKitOf(kitK), rim = p.owner ? BAN[p.owner] : RL_C.pewter, rx = T / 2, ry = rx * 0.64;
  const y = rlBase(g, x, st.y, rx, ry, rim, { rimW: Math.max(1.6, Math.min(3, 0.03 * T)) });
  g.fillStyle = 'rgba(78,70,56,.55)'; ellipse(g, x, y - 0.5, rx * 0.84, ry * 0.84); g.fill(); // the yard
  const ws = rlWallStage(p.pd), wr = rx * 0.8, wry = wr * 0.64, wallH = T * (ws === 'palisade' ? 0.07 : 0.085), stone = K.stone;
  const wallArc = (a0, a1) => { // the wall as a band of height wallH along the ring, from angle a0 to a1
    if (!ws || ws === 'watch') return; const n = 28; g.beginPath(); for (let m = 0; m <= n; m++) { const a = a0 + ((a1 - a0) * m) / n; g.lineTo(x + Math.cos(a) * wr, y + Math.sin(a) * wry - wallH); } for (let m = n; m >= 0; m--) { const a = a0 + ((a1 - a0) * m) / n; g.lineTo(x + Math.cos(a) * wr, y + Math.sin(a) * wry); } g.closePath();
    if (ws === 'palisade') { g.fillStyle = '#6B4A2B'; g.fill(); g.strokeStyle = '#3E2A18'; g.lineWidth = Math.max(0.5, T * 0.008); for (let m = 0; m <= Math.round(T * 0.5); m++) { const a = a0 + ((a1 - a0) * m) / Math.round(T * 0.5); const px = x + Math.cos(a) * wr, py = y + Math.sin(a) * wry; g.beginPath(); g.moveTo(px, py); g.lineTo(px, py - wallH * 1.15); g.stroke(); } }
    else { const gr = g.createLinearGradient(x - wr, 0, x + wr, 0); gr.addColorStop(0, K.stoneHi); gr.addColorStop(1, shadeL(stone, -14)); g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(28,26,23,.55)'; g.lineWidth = 0.6; g.stroke(); }
    if (p.siege && p.siege !== 'intact' && a0 > 0) { g.strokeStyle = '#1C1A17'; g.lineWidth = Math.max(0.8, T * 0.012); for (const a of [0.7, 1.9]) { const px = x + Math.cos(a) * wr, py = y + Math.sin(a) * wry - wallH * 0.5; g.beginPath(); g.moveTo(px - 1.5, py - 2); g.lineTo(px + 0.5, py); g.lineTo(px - 0.6, py + 2); g.stroke(); } }
  };
  wallArc(Math.PI, Math.PI * 2); // the back half first
  if (ws === 'towers') for (const a of [Math.PI * 1.25, Math.PI * 1.75]) rlTower(g, x + Math.cos(a) * wr, y + Math.sin(a) * wry, T * 0.1, T * 0.17, stone, K.stoneHi);
  if (ws === 'watch') rlTower(g, x + Math.cos(Math.PI * 1.7) * wr, y + Math.sin(Math.PI * 1.7) * wry, T * 0.08, T * 0.2, '#6B4A2B', '#8C6A47');
  // houses on the spiral, the keep at the center with a fort, the temple and the lab as landmarks on the ring, scaffolding while building
  const items = [], st2 = settlementC(p.i), n = far ? Math.min(3, st2.n) : Math.min(16, st2.n), hs = Math.max(3, Math.min(11, T * 0.11)), unrestShut = p.unrest >= 50;
  for (let k = 0; k < n; k++) { const a = (k * 137.508 * Math.PI) / 180, r = Math.min(0.62, 0.17 * Math.sqrt(k + 0.6)) * rx; items.push({ y: y + Math.sin(a) * r * 0.64, draw: () => rlHouse(g, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.64, hs, kitK, false, ground, { fresh: st2.houses[k]?.fresh, ruin: st2.houses[k]?.ruin, shut: unrestShut }) }); }
  if (p.buildings.includes('fort')) items.push({ y: y + 0.01, draw: () => { rlTower(g, x, y + 2, T * 0.17, T * 0.3, stone, K.stoneHi); rlPennant(g, x, y + 2 - T * 0.3 - T * 0.04, T * 0.16, p.owner ? BAN[p.owner] : RL_C.pewter); } });
  const lm = (a, fn) => { const lx = x + Math.cos(a) * wr * 0.72, ly = y + Math.sin(a) * wry * 0.72; items.push({ y: ly, draw: () => fn(lx, ly) }); };
  if (!far && (p.buildings.includes('temple') || (p.build && p.build.kind === 'temple'))) lm(-Math.PI * 0.2, (lx, ly) => {
    const w = T * 0.2, h = T * 0.16;
    if (p.build && !p.buildings.includes('temple')) { g.strokeStyle = '#8C6A47'; g.lineWidth = Math.max(0.7, T * 0.012); g.strokeRect(lx - w / 2, ly - h, w, h); g.beginPath(); g.moveTo(lx - w / 2, ly); g.lineTo(lx + w / 2, ly - h); g.moveTo(lx - w / 2, ly - h); g.lineTo(lx + w / 2, ly); g.stroke(); return; }
    if (kitK === 'green') { g.fillStyle = shadeL(K.wall, -10); g.fillRect(lx - w / 2, ly - h * 0.6, w, h * 0.6); g.fillStyle = K.roof; g.beginPath(); g.ellipse(lx, ly - h * 0.6, w * 0.62, h * 0.6, 0, Math.PI, 0); g.closePath(); g.fill(); g.fillStyle = K.roofHi; ellipse(g, lx - w * 0.15, ly - h * 0.95, w * 0.2, h * 0.14); g.fill(); return; }
    g.fillStyle = shadeL(stone, -6); g.fillRect(lx - w / 2, ly - h * 0.5, w, h * 0.5); g.fillStyle = K.stoneHi; g.fillRect(lx - w * 0.36, ly - h * 0.85, w * 0.72, h * 0.35); g.fillStyle = shadeL(stone, -20); g.fillRect(lx - w * 0.2, ly - h * 0.5, w * 0.4, h * 0.3);
    const unlit = p.dom.n && p.dom.n !== (p.kitOwner ?? p.owner); if (!unlit) { g.fillStyle = '#FFB347'; ellipse(g, lx, ly - h * 0.98, w * 0.12, h * 0.16); g.fill(); g.fillStyle = 'rgba(255,179,71,.25)'; ellipse(g, lx, ly - h * 0.98, w * 0.28, h * 0.3); g.fill(); } else { g.fillStyle = '#3A3836'; ellipse(g, lx, ly - h * 0.9, w * 0.12, h * 0.07); g.fill(); }
  });
  if (!far && p.buildings.includes('lab')) lm(-Math.PI * 0.8, (lx, ly) => { const w = T * 0.11, h = T * 0.26; rlTower(g, lx, ly, w, h, kitK === 'green' ? '#8C6A47' : '#6E6A64', kitK === 'green' ? '#A88A64' : '#8E8A84'); g.fillStyle = '#2B2A28'; g.fillRect(lx + w * 0.15, ly - h - w * 0.5, w * 0.22, w * 0.5); if (!far) smokeWisp(g, lx + w * 0.26, ly - h - w * 0.5, 0.8, h * 0.6); });
  items.sort((a, b) => a.y - b.y); for (const it of items) it.draw();
  wallArc(0, Math.PI); // the front half over the houses
  if (ws === 'towers') { for (const a of [Math.PI * 0.25, Math.PI * 0.75]) rlTower(g, x + Math.cos(a) * wr, y + Math.sin(a) * wry, T * 0.1, T * 0.17, stone, K.stoneHi); const gx = x, gy = y + wry; g.fillStyle = shadeL(stone, -10); g.fillRect(gx - T * 0.09, gy - T * 0.15, T * 0.18, T * 0.15); g.fillStyle = '#1C1A17'; g.beginPath(); g.moveTo(gx - T * 0.035, gy); g.lineTo(gx - T * 0.035, gy - T * 0.06); g.arc(gx, gy - T * 0.06, T * 0.035, Math.PI, 0); g.lineTo(gx + T * 0.035, gy); g.closePath(); g.fill(); }
  if (!p.buildings.includes('fort') && n > 0 && !far) { const a = 0, r = 0.17 * Math.sqrt(0.6) * rx; rlPennant(g, x + Math.cos(a) * r - hs * 0.3, y - hs * 0.84, hs * 1.3, p.owner ? BAN[p.owner] : RL_C.pewter); }
  return y;
}
function rlHamlet(g, st, p, band, ground) { // houses on the land, no base; muted at Mid (within 2.5:1 of the ground), full kit colors at Near
  const near = band === 'near', s2 = settlementC(p.i), n = near ? s2.n : Math.min(4, s2.n), hs = st.T, shut = p.unrest >= 50, list = []; // a cluster of at most 4 at Mid
  for (let k = 0; k < n; k++) { const a = (k * 137.508 * Math.PI) / 180, r = hs * 0.62 * Math.sqrt(k + 0.35); list.push([st.x + Math.cos(a) * r * 1.25, st.y + Math.sin(a) * r * 0.72, k]); }
  list.sort((a, b) => a[1] - b[1]); for (const [x, y, k] of list) rlHouse(g, x, y, hs * (k === 0 ? 1.1 : 1), p.kitOwner ?? p.owner, !near, ground, { fresh: s2.houses[k]?.fresh, ruin: s2.houses[k]?.ruin, shut });
}
function rlHut(g, st) { const s = st.T, x = st.x, y = st.y; g.fillStyle = 'rgba(0,0,0,.2)'; ellipse(g, x + 0.25 * s, y + 0.05 * s, 0.6 * s, 0.16 * s); g.fill(); g.fillStyle = '#C9C1B1'; g.fillRect(x - s / 2, y - 0.42 * s, s, 0.42 * s); g.fillStyle = RL_C.gesso; g.beginPath(); g.moveTo(x - 0.6 * s, y - 0.42 * s); g.lineTo(x + 0.56 * s, y - 0.42 * s); g.lineTo(x + 0.44 * s, y - 0.86 * s); g.lineTo(x - 0.5 * s, y - 0.86 * s); g.closePath(); g.fill(); g.strokeStyle = 'rgba(28,26,23,.35)'; g.lineWidth = 0.6; g.stroke(); }
function rlWell(g, wl, p) { // the Wellspring: a basin with five drops in the five colors on its own base; a static glow while unclaimed; claim stones
  const rx = wl.B / 2, ry = rx * 0.64, claimed = p.claim === 'red', rim = claimed ? BAN.red : RL_C.lip;
  if (!claimed) { const gr = g.createRadialGradient(wl.x, wl.y - ry, 0, wl.x, wl.y - ry, rx * 2); gr.addColorStop(0, 'rgba(244,238,223,.28)'); gr.addColorStop(1, 'rgba(244,238,223,0)'); g.fillStyle = gr; g.fillRect(wl.x - rx * 2, wl.y - ry - rx * 2, rx * 4, rx * 4); }
  const y = rlBase(g, wl.x, wl.y, rx, ry, rim, { rimW: Math.max(1.6, rx * 0.12) });
  g.fillStyle = '#9A9286'; ellipse(g, wl.x, y - ry * 0.25, rx * 0.62, ry * 0.62); g.fill(); g.fillStyle = '#CFC6B4'; ellipse(g, wl.x, y - ry * 0.45, rx * 0.6, ry * 0.58); g.fill();
  g.fillStyle = '#7FA9BA'; ellipse(g, wl.x, y - ry * 0.48, rx * 0.42, ry * 0.36); g.fill(); g.fillStyle = 'rgba(232,246,240,.5)'; ellipse(g, wl.x - rx * 0.12, y - ry * 0.55, rx * 0.16, ry * 0.08); g.fill();
  const cols = ['#F3E6B8', '#3A7BD5', '#3D2B4F', '#FD6533', '#00674B'];
  for (let k = 0; k < 5; k++) { const a = Math.PI + 0.25 + k * 0.66, px = wl.x + Math.cos(a) * rx * 0.64, py = y - ry * 0.45 + Math.sin(a) * ry * 0.6, h = rx * 0.34; g.fillStyle = claimed ? '#CFC6B4' : cols[k]; g.beginPath(); g.moveTo(px - h * 0.22, py); g.quadraticCurveTo(px - h * 0.24, py - h * 0.6, px, py - h); g.quadraticCurveTo(px + h * 0.24, py - h * 0.6, px + h * 0.22, py); g.closePath(); g.fill(); g.strokeStyle = 'rgba(28,26,23,.6)'; g.lineWidth = 0.6; g.stroke(); }
  if (claimed) for (let k = 0; k < 4; k++) { const a = Math.PI * 0.15 + (k / 3) * Math.PI * 0.7, px = wl.x + Math.cos(a) * rx * 0.86, py = y + Math.sin(a) * ry * 0.86; g.fillStyle = BAN.red; g.fillRect(px - rx * 0.06, py - rx * 0.22, rx * 0.12, rx * 0.22); }
  if (p.claim === 'running') { g.strokeStyle = '#E9E4D8'; g.lineWidth = Math.max(1, rx * 0.08); g.beginPath(); g.ellipse(wl.x, y, rx * 1.15, ry * 1.15, 0, -Math.PI / 2, Math.PI / 2); g.stroke(); }
}
const RL_LOOKKINDS = { red: (lvl) => ['cairn', ...(lvl >= 2 ? ['scorch', 'shard', 'brazier'] : [])], green: (lvl) => ['blossom', 'ivy', ...(lvl >= 2 ? ['sapling', 'moss', 'blossom'] : []), ...(lvl >= 3 ? ['bramble'] : [])] };
const RL_POLEKINDS = { Fury: ['warCairn', 'tornBanner'], Turmoil: ['brokenFence', 'toppledCart', 'smoke'], Growth: ['fruitTree', 'cropClump'], Wild: ['briar', 'fern', 'beastDen'] };
function rlMotif(g, kind, x, y, k, R) { // one scenery piece standing on the land at (x, y); k scales a 10 px design; lit from the upper left
  const sh = (rx, ry) => { g.fillStyle = 'rgba(0,0,0,.22)'; ellipse(g, x + 0.3 * rx, y + 0.15 * ry, rx, ry); g.fill(); };
  const stone = (sx, sy, w, h, c) => { g.fillStyle = shadeL(c, -14); g.beginPath(); g.moveTo(sx - w / 2, sy); g.lineTo(sx - w * 0.4, sy - h); g.lineTo(sx + w * 0.35, sy - h * 1.05); g.lineTo(sx + w / 2, sy); g.closePath(); g.fill(); g.fillStyle = shadeL(c, 6); g.beginPath(); g.moveTo(sx - w / 2, sy); g.lineTo(sx - w * 0.4, sy - h); g.lineTo(sx - w * 0.02, sy - h * 1.02); g.lineTo(sx - w * 0.08, sy); g.closePath(); g.fill(); };
  switch (kind) {
    case 'cairn': sh(4 * k, 1.3 * k); for (let m = 0; m < 3; m++) { const r = (3 - m * 0.7) * k, yy = y - m * 1.9 * k; g.fillStyle = '#6E6A64'; ellipse(g, x, yy, r, r * 0.55); g.fill(); g.fillStyle = '#8E8A84'; ellipse(g, x - r * 0.25, yy - r * 0.15, r * 0.55, r * 0.3); g.fill(); } g.fillStyle = '#FFB347'; ellipse(g, x + 0.7 * k, y - 2.4 * k, 0.6 * k, 0.6 * k); g.fill(); return;
    case 'scorch': g.fillStyle = 'rgba(52,48,44,.45)'; ellipse(g, x, y, 6 * k, 2.6 * k, (R() - 0.5) * 0.5); g.fill(); g.fillStyle = '#FF9A3A'; for (let m = 0; m < 4; m++) { ellipse(g, x + (R() - 0.5) * 7 * k, y + (R() - 0.5) * 2.4 * k, 0.45 * k, 0.45 * k); g.fill(); } return;
    case 'shard': sh(4 * k, 1.2 * k); for (const [dx, h] of [[-1.6, 5], [1.3, 7]]) { g.fillStyle = '#26232A'; g.beginPath(); g.moveTo(x + (dx - 1.2) * k, y); g.lineTo(x + dx * k, y - h * k); g.lineTo(x + (dx + 1.2) * k, y); g.closePath(); g.fill(); g.fillStyle = '#5A5560'; g.beginPath(); g.moveTo(x + (dx - 1.2) * k, y); g.lineTo(x + dx * k, y - h * k); g.lineTo(x + (dx - 0.2) * k, y); g.closePath(); g.fill(); } return;
    case 'brazier': sh(3 * k, 1 * k); g.strokeStyle = '#2B2A28'; g.lineWidth = 0.9 * k; g.beginPath(); g.moveTo(x - 2 * k, y); g.lineTo(x, y - 3.4 * k); g.lineTo(x + 2 * k, y); g.stroke(); g.fillStyle = '#3A3836'; g.beginPath(); g.ellipse(x, y - 3.6 * k, 2.6 * k, 1.2 * k, 0, 0, Math.PI); g.fill(); g.fillStyle = '#FF8A2A'; ellipse(g, x, y - 4.4 * k, 1.5 * k, 1.1 * k); g.fill(); g.fillStyle = '#FFD27A'; ellipse(g, x - 0.2 * k, y - 4.8 * k, 0.7 * k, 0.6 * k); g.fill(); return;
    case 'blossom': sh(4 * k, 1.3 * k); for (const [dx, dy, r] of [[-1.8, -1.6, 2.2], [1.8, -1.8, 2.3], [0, -3.3, 2.1]]) { g.fillStyle = '#3F5E2E'; ellipse(g, x + dx * k, y + dy * k, r * k, r * 0.85 * k); g.fill(); g.fillStyle = '#5E8044'; ellipse(g, x + (dx - 0.5) * k, y + (dy - 0.5) * k, r * 0.55 * k, r * 0.45 * k); g.fill(); } g.fillStyle = '#EAD2DA'; for (let m = 0; m < 7; m++) { const a = m * 2.4; ellipse(g, x + Math.cos(a) * 2.5 * k, y - 2.3 * k + Math.sin(a) * 1.7 * k, 0.55 * k, 0.55 * k); g.fill(); } return;
    case 'ivy': case 'moss': sh(3 * k, 1 * k); stone(x, y, 3.4 * k, 6.2 * k, '#9A958C'); g.fillStyle = '#4E6B3A'; g.fillRect(x - 1.4 * k, y - 6.3 * k, 2.6 * k, 1.5 * k); if (kind === 'ivy') { g.strokeStyle = '#5E8044'; g.lineWidth = 0.8 * k; g.beginPath(); g.moveTo(x - 1.6 * k, y); g.quadraticCurveTo(x - 0.6 * k, y - 2.5 * k, x + 0.4 * k, y - 4.5 * k); g.stroke(); } return;
    case 'sapling': sh(2.4 * k, 0.8 * k); g.strokeStyle = '#5E4630'; g.lineWidth = 0.8 * k; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 4.5 * k); g.stroke(); g.fillStyle = '#4E6B3A'; ellipse(g, x, y - 5.6 * k, 2 * k, 1.8 * k); g.fill(); g.fillStyle = '#6E8F4E'; ellipse(g, x - 0.6 * k, y - 6.1 * k, 1 * k, 0.8 * k); g.fill(); return;
    case 'bramble': case 'briar': g.strokeStyle = kind === 'bramble' ? '#5A3A28' : '#3F4A2A'; g.lineWidth = 0.9 * k; for (let m = 0; m < 3; m++) { g.beginPath(); g.arc(x + (m - 1) * 2.6 * k, y, 2.2 * k, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); } return;
    case 'warCairn': rlMotif(g, 'cairn', x, y, k, R); g.strokeStyle = '#5E4630'; g.lineWidth = 0.8 * k; for (const dx of [-1, 1.2]) { g.beginPath(); g.moveTo(x + dx * k, y - 4 * k); g.lineTo(x + dx * 1.6 * k, y - 11 * k); g.stroke(); } g.fillStyle = '#A8ADB3'; for (const dx of [-1, 1.2]) { g.beginPath(); g.moveTo(x + (dx * 1.6 - 0.7) * k, y - 10.6 * k); g.lineTo(x + dx * 1.6 * k, y - 13 * k); g.lineTo(x + (dx * 1.6 + 0.7) * k, y - 10.6 * k); g.closePath(); g.fill(); } return;
    case 'tornBanner': sh(2 * k, 0.7 * k); g.strokeStyle = '#3E2E20'; g.lineWidth = 0.8 * k; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 0.6 * k, y - 10 * k); g.stroke(); g.fillStyle = '#7A1E12'; g.beginPath(); g.moveTo(x + 0.6 * k, y - 10 * k); g.lineTo(x + 5 * k, y - 9.2 * k); g.lineTo(x + 3.4 * k, y - 8 * k); g.lineTo(x + 5.2 * k, y - 6.8 * k); g.lineTo(x + 2.6 * k, y - 6.4 * k); g.lineTo(x + 0.5 * k, y - 6 * k); g.closePath(); g.fill(); return;
    case 'brokenFence': g.strokeStyle = '#6B4A2B'; g.lineWidth = 0.9 * k; for (const dx of [-4.5, -1.5, 1.8, 4.6]) { g.beginPath(); g.moveTo(x + dx * k, y); g.lineTo(x + (dx + (dx > 4 ? 1.2 : 0)) * k, y - 3.2 * k); g.stroke(); } g.beginPath(); g.moveTo(x - 4.5 * k, y - 2.2 * k); g.lineTo(x - 1.5 * k, y - 2.4 * k); g.moveTo(x + 1.8 * k, y - 2 * k); g.lineTo(x + 5.2 * k, y - 0.8 * k); g.stroke(); return;
    case 'toppledCart': sh(4 * k, 1.2 * k); g.save(); g.translate(x, y); g.rotate(0.45); g.fillStyle = '#8C6A47'; g.fillRect(-3.6 * k, -2.6 * k, 7.2 * k, 2.6 * k); g.restore(); g.strokeStyle = '#3E2E20'; g.lineWidth = 0.9 * k; ellipse(g, x + 2.6 * k, y + 0.4 * k, 1.4 * k, 1.4 * k); g.stroke(); return;
    case 'smoke': g.strokeStyle = 'rgba(110,106,100,.5)'; g.lineWidth = 1.6 * k; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 2.5 * k, y - 4 * k, x - 2.5 * k, y - 8 * k, x + 1.5 * k, y - 12 * k); g.stroke(); g.lineCap = 'butt'; return;
    case 'fruitTree': sh(4 * k, 1.3 * k); g.strokeStyle = '#5E4630'; g.lineWidth = 0.9 * k; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 4 * k); g.stroke(); g.fillStyle = '#3F5E2E'; ellipse(g, x, y - 6.4 * k, 3.6 * k, 3 * k); g.fill(); g.fillStyle = '#6E8F4E'; ellipse(g, x - 1.2 * k, y - 7.4 * k, 1.8 * k, 1.3 * k); g.fill(); g.fillStyle = '#D9874A'; for (let m = 0; m < 5; m++) { const a = m * 1.3 + 0.4; ellipse(g, x + Math.cos(a) * 2.2 * k, y - 6.4 * k + Math.sin(a) * 1.7 * k, 0.5 * k, 0.5 * k); g.fill(); } return;
    case 'cropClump': g.strokeStyle = '#4E7A32'; g.lineWidth = 0.8 * k; for (let m = 0; m < 6; m++) { g.beginPath(); g.moveTo(x + (-3 + m * 1.2) * k, y); g.lineTo(x + (-3.4 + m * 1.3) * k, y - (3.5 + (m % 2)) * k); g.stroke(); } return;
    case 'fern': g.strokeStyle = '#5E8A3A'; g.lineWidth = 0.8 * k; for (const a of [-0.7, 0, 0.7]) { g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.sin(a) * 3 * k, y - 3 * k, x + Math.sin(a) * 5 * k, y - 4.5 * k); g.stroke(); } return;
    case 'beastDen': g.fillStyle = '#5E4630'; g.beginPath(); g.ellipse(x, y, 4.6 * k, 2.8 * k, 0, Math.PI, 0); g.closePath(); g.fill(); g.fillStyle = '#1C1A17'; g.beginPath(); g.ellipse(x, y, 1.9 * k, 1.5 * k, 0, Math.PI, 0); g.fill(); g.strokeStyle = '#E9E4D8'; g.lineWidth = 0.8 * k; g.beginPath(); g.moveTo(x + 3.2 * k, y + 0.5 * k); g.lineTo(x + 5.5 * k, y - 0.2 * k); g.stroke(); return;
  }
}
function rlGroundAt(lx, ly) { const i = provinceAt(lx / cam.s, ly / cam.s); return isWild(i) ? RL_C.granite : RL_ALB[terr[i]]; }
function rlDrawPieces(g, band, lay) {
  // decals on the land first: churned ground after a battle, burnt patches, ash, fresh growth
  for (const { p, st, scar } of lay.events) {
    const R = rngFor(`relief:${MAP_SEED}:decal:${p.i}`), [sx, sy] = rlToScr(st.x, st.y), k = Math.max(0.7, Math.min(2.4, 0.012 * lay.Dpx));
    if ((p.scar === 'churned' || p.scar === 'cairns') && scar) { g.save(); g.globalAlpha = p.scar === 'churned' ? 0.45 : 0.25; const [cx, cy] = rlToScr(scar[0], scar[1]); for (let m = 0; m < 14; m++) { const x = cx + (R() - 0.5) * 0.16 * lay.Dpx, y = cy + (R() - 0.5) * 0.07 * lay.Dpx; g.fillStyle = m % 2 ? '#3A2E22' : '#5A4632'; ellipse(g, x, y, (1.2 + R() * 2.2) * k, (0.5 + R() * 0.8) * k, R() * 0.6); g.fill(); } g.restore(); }
    for (const fx of p.fx ?? []) {
      if (fx.kind === 'burn') { for (let m = 0; m < 6; m++) { const x = sx + (R() - 0.5) * 0.6 * lay.Dpx, y = sy + (R() - 0.5) * 0.45 * lay.Dpx; g.fillStyle = 'rgba(36,32,28,.55)'; ellipse(g, x, y, (6 + R() * 7) * k, (3 + R() * 3) * k, R()); g.fill(); smokeWisp(g, x, y, 1.2, 14 * k); } }
      if (fx.kind === 'ashrain') { for (let m = 0; m < 60 * fx.step; m++) { const x = sx + (R() - 0.5) * 0.7 * lay.Dpx, y = sy + (R() - 0.5) * 0.5 * lay.Dpx; g.fillStyle = m % 3 ? 'rgba(74,71,68,.75)' : 'rgba(233,228,216,.8)'; g.fillRect(x, y, 1.6 * k, 0.9 * k); } }
      if (fx.kind === 'fertile') { g.strokeStyle = '#7FB04A'; g.lineWidth = Math.max(0.8, 0.8 * k); for (let m = 0; m < 14; m++) { const x = sx + (R() - 0.5) * 0.55 * lay.Dpx, y = sy + (R() - 0.5) * 0.4 * lay.Dpx; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - 2 * k, y - 3 * k, x - 3 * k, y - 4 * k); g.moveTo(x, y); g.quadraticCurveTo(x + 2 * k, y - 3 * k, x + 3 * k, y - 4.5 * k); g.stroke(); } }
    }
  }
  const items = [];
  for (const [i, st] of lay.seats) {
    if (!st.kind) continue; const p = prov[i], [x, y] = rlToScr(st.x, st.y), s2 = { ...st, x, y }, ground = RL_ALB[p.terrain];
    if (st.kind === 'town') items.push({ y, f: () => rlTown(g, s2, p, band, ground) });
    else if (st.kind === 'hamlet') items.push({ y, f: () => rlHamlet(g, s2, p, band, ground) });
    else items.push({ y, f: () => rlHut(g, s2) });
  }
  for (const wl of lay.wells) { const [x, y] = rlToScr(wl.x, wl.y); items.push({ y, f: () => rlWell(g, { ...wl, x, y }, prov[wl.i]) }); }
  for (const q of lay.scen) { const [x, y] = rlToScr(q.x, q.y); items.push({ y, f: () => { const R = rngFor(`relief:motif:${q.i}:${q.j}`); if (q.kind === 'pole') { const ks = RL_POLEKINDS[q.pole]; rlMotif(g, ks[q.j % ks.length], x, y, q.k, R); } else { const ks = RL_LOOKKINDS[q.look](q.lvl); rlMotif(g, ks[q.j % ks.length], x, y, q.k, R); } } }); }
  for (const q of lay.stones) { const [x, y] = rlToScr(q.x, q.y); items.push({ y, f: () => { g.fillStyle = 'rgba(0,0,0,.25)'; ellipse(g, x + 2, y + 1, 4, 1.4); g.fill(); g.fillStyle = '#9A958C'; g.beginPath(); g.moveTo(x - 2.6, y); g.lineTo(x - 2, y - 9); g.lineTo(x + 2, y - 10); g.lineTo(x + 2.6, y); g.closePath(); g.fill(); g.fillStyle = MANA[q.c] ? MANA[q.c].fill : '#E9E4D8'; g.fillRect(x - 1.6, y - 7, 3.2, 2.6); g.strokeStyle = 'rgba(28,26,23,.6)'; g.lineWidth = 0.7; g.strokeRect(x - 1.6, y - 7, 3.2, 2.6); } }); }
  for (const q of lay.guards) { const [x, y] = rlToScr(q.x, q.y); items.push({ y, f: () => rlFigure(g, q.bow ? 'guardBow' : 'guard', x, y, q.h, null) }); }
  for (const { p, st, scar } of lay.events) {
    const [x, y] = rlToScr(st.x, st.y), r = st.r, k = Math.max(0.8, Math.min(2.4, 0.014 * lay.Dpx)), [mx, my] = scar ? rlToScr(scar[0], scar[1]) : [x - 0.2 * lay.Dpx, y + 0.16 * lay.Dpx];
    if (p.siege) { const R = rngFor('siege:' + p.i); for (let m = 0; m < 5; m++) { const a = Math.PI * (0.1 + m * 0.2) + R() * 0.08, tx = x + Math.cos(a) * (r + 7 * k), ty = y + Math.sin(a) * (r + 7 * k) * 0.64; items.push({ y: ty, f: () => { g.fillStyle = 'rgba(0,0,0,.25)'; ellipse(g, tx + 2 * k, ty + 0.6 * k, 4 * k, 1.2 * k); g.fill(); g.fillStyle = BAN.red; g.beginPath(); g.moveTo(tx - 3.6 * k, ty); g.lineTo(tx, ty - 5.5 * k); g.lineTo(tx + 3.6 * k, ty); g.closePath(); g.fill(); g.fillStyle = shadeL(BAN.red, -25); g.beginPath(); g.moveTo(tx, ty - 5.5 * k); g.lineTo(tx + 3.6 * k, ty); g.lineTo(tx + 1.2 * k, ty); g.closePath(); g.fill(); } }); }
      items.push({ y: y + r * 0.64 + 6 * k, f: () => { const gx = x + 2 * k, gy = y + r * 0.64 + 6 * k; g.fillStyle = '#8C6A47'; g.fillRect(gx - 5 * k, gy - 2 * k, 10 * k, 2.4 * k); g.fillStyle = '#4A4744'; g.fillRect(gx + 4 * k, gy - 1.6 * k, 2.4 * k, 1.6 * k); g.strokeStyle = '#3E2E20'; g.lineWidth = k; ellipse(g, gx - 3 * k, gy + 0.6 * k, 1.4 * k, 1.4 * k); g.stroke(); ellipse(g, gx + 3 * k, gy + 0.6 * k, 1.4 * k, 1.4 * k); g.stroke(); } }); }
    if (p.pillage) items.push({ y: y + 1, f: () => { for (const dx of [-0.3, 0.25]) { g.strokeStyle = 'rgba(70,66,63,.6)'; g.lineWidth = 3 * k; g.lineCap = 'round'; const sx = x + dx * Math.max(r, 8), sy = y - r * 0.3; g.beginPath(); g.moveTo(sx, sy); g.bezierCurveTo(sx + 5 * k, sy - 10 * k, sx - 5 * k, sy - 20 * k, sx + 3 * k, sy - 32 * k); g.stroke(); g.lineCap = 'butt'; g.fillStyle = '#FF8A3A'; ellipse(g, sx, sy + 1, 2.4 * k, 1.4 * k); g.fill(); } } });
    if (p.unrest >= 50 && !p.pillage) items.push({ y: y + r * 0.64 + 3, f: () => { const bx = x - r - 4 * k, by = y + r * 0.4; g.strokeStyle = '#6B4A2B'; g.lineWidth = 1.4 * k; g.beginPath(); g.moveTo(bx - 4 * k, by); g.lineTo(bx + 4 * k, by - 5 * k); g.moveTo(bx - 4 * k, by - 5 * k); g.lineTo(bx + 4 * k, by); g.moveTo(bx - 5 * k, by - 2.5 * k); g.lineTo(bx + 5 * k, by - 2.5 * k); g.stroke(); } });
    if (p.scar === 'churned') items.push({ y: my, f: () => { const bx = mx, by = my, h = 9 * k; g.strokeStyle = '#2B2A28'; g.lineWidth = 2 * k; g.beginPath(); g.moveTo(bx - h * 0.45, by); g.lineTo(bx + h * 0.35, by - h); g.moveTo(bx + h * 0.45, by); g.lineTo(bx - h * 0.35, by - h); g.stroke(); g.strokeStyle = '#C8C2B6'; g.lineWidth = 1.1 * k; g.beginPath(); g.moveTo(bx - h * 0.3, by - h * 0.25); g.lineTo(bx + h * 0.35, by - h); g.moveTo(bx + h * 0.3, by - h * 0.25); g.lineTo(bx - h * 0.35, by - h); g.stroke(); g.fillStyle = '#5E4630'; g.fillRect(bx - h * 0.62, by - h * 0.32, h * 0.3, 1.4 * k); g.fillRect(bx + h * 0.32, by - h * 0.32, h * 0.3, 1.4 * k); } });
    if (p.scar === 'cairns') for (let m = 0; m < 3; m++) { const cx = mx - 0.04 * lay.Dpx + m * 7 * k, cy = my + (m % 2) * 2 * k; items.push({ y: cy, f: () => { g.save(); g.translate(cx, cy); g.scale(k, k); cairn(g, 0, 0, 1, 1 / k, false); g.restore(); } }); }
  }
  items.sort((a, b) => a.y - b.y); for (const it of items) it.f();
}
function rlFigure(g, key, x, y, h, side) { // the atlas figure with its feet at (x, y), h px tall
  const F = FIGS.fig[key]; if (!F) { rlFallbackFigure(g, x, y, h, side ?? (key.startsWith('guard') ? null : 'red')); return; }
  const k = h / F.h; g.drawImage(F.canvas, x - F.fx * k, y - F.fy * k, F.canvas.width * k, F.canvas.height * k);
}
function rlPaintLabels(g, lay) {
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  for (const op of lay.wildOps) {
    if (op.gl) { paintGlyphs(g, op.gl.map((q) => ({ ...q, x: q.x + cam.x, y: q.y + cam.y })), op.font, '#E9E4D8', 'rgba(20,18,15,.55)', 2.5); continue; }
    const [x, y] = rlToScr(op.x, op.y); g.save(); g.translate(x, y); if (op.vertical) g.rotate(-Math.PI / 2); g.font = op.font; if ('letterSpacing' in g) g.letterSpacing = '0.12em';
    g.lineWidth = 2.5; g.strokeStyle = 'rgba(20,18,15,.55)'; g.strokeText(op.w.name, 0, 0); g.fillStyle = '#E9E4D8'; g.fillText(op.w.name, 0, 0); if ('letterSpacing' in g) g.letterSpacing = '0px'; g.restore();
  }
  for (const lb of lay.labels) { const [x, y] = rlToScr(lb.x, lb.y); rlLabel(g, lb.text, x, y, lb.font); }
  for (const c of lay.chips) { const [x, y] = rlToScr(c.x, c.y), w2 = c.box[2] - c.box[0]; g.fillStyle = 'rgba(20,18,15,.88)'; roundRect(g, x - w2 / 2, y - 8, w2, 16, 3); g.fill(); g.font = "600 11px 'IBM Plex Sans Condensed', sans-serif"; g.fillStyle = '#F4EEDF'; g.fillText(c.text, x, y + 0.5); }
}
function rlLabel(g, text, x, y, font, strong) { g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = strong ? 4 : 3; g.strokeStyle = strong ? 'rgba(20,18,15,.95)' : 'rgba(20,18,15,.85)'; g.strokeText(text, x, y); g.fillStyle = '#F4EEDF'; g.fillText(text, x, y); }
