
// ------------------------------------------------------------------ v4 relief: the rim (cliff, plinth, shadow, plaque), the live layers (glow, fog, modes), rails, water
// Per-province edges of the straight cells and the cell across each (-1: the model's edge)
const RL_EDGES = cells.map((ring, i) => {
  const out = [], [cx, cy] = cent[i];
  for (let k = 0; k < ring.length - 1; k++) {
    const a = ring[k], b = ring[k + 1]; let j = -1;
    for (const q of NB[i]) { const e = edgeBetween(i, q); if (e && ((PEQ(e.a, a) && PEQ(e.b, b)) || (PEQ(e.a, b) && PEQ(e.b, a)))) { j = q; break; } }
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; let nx = -dy / L, ny = dx / L; // the inward normal: toward the centroid
    if ((cx - a[0]) * nx + (cy - a[1]) * ny < 0) { nx = -nx; ny = -ny; }
    out.push({ a, b, j, nx, ny, len: L });
  }
  return out;
});
const ownerOf = (i) => (i < 0 || isWild(i) ? undefined : prov[i].owner);
const isRealmEdge = (i, e) => { const o = prov[i].owner; return !!o && e.j >= 0 && !isWild(e.j) && prov[e.j].owner !== o; };

// ---- the rim: the model's shadow on the oak, its cliff face (strata, cracks, the plinth, the contact), waterfalls, the brass plaque
let RIM = null, RIMKEY = '';
function rlOutlineSouth(n) { // the south half of the rounded outline, west to east: [x, y, nx, ny] with the outward normal
  const out = [], rc = RL_RC;
  for (let k = 0; k <= n; k++) { const t = Math.PI - (k / n) * (Math.PI / 2); out.push([rc + rc * Math.cos(t), H - rc + rc * Math.sin(t), Math.cos(t), Math.sin(t)]); }
  const m = Math.max(8, Math.round((W - 2 * rc) / (6 * RLK))); for (let k = 1; k < m; k++) out.push([rc + ((W - 2 * rc) * k) / m, H, 0, 1]);
  for (let k = 0; k <= n; k++) { const t = Math.PI / 2 - (k / n) * (Math.PI / 2); out.push([W - rc + rc * Math.cos(t), H - rc + rc * Math.sin(t), Math.cos(t), Math.sin(t)]); }
  return out;
}
function rlRim() {
  const key = dpr + ':' + fontsReady + ':' + RB.ver + ':' + view.table;
  if (RIM && RIMKEY === key) return RIM;
  RIMKEY = key; const res = 0.9 * Math.min(2, dpr), hs = RL_FACE, pl = RL_PLINTH;
  RIM = bakeWorld([-70, -60, W + 80, H + hs + 70], res, (g) => {
    const S = rlOutlineSouth(14), R = rngFor(`relief:${MAP_SEED}:cliff`);
    const silhouette = () => { g.beginPath(); g.moveTo(0, RL_RC); g.lineTo(0, H - RL_RC); for (const [x, y] of S) g.lineTo(x, y + hs); g.lineTo(W, RL_RC); g.arcTo(W, 0, W - RL_RC, 0, RL_RC); g.lineTo(RL_RC, 0); g.arcTo(0, 0, 0, RL_RC, RL_RC); g.closePath(); };
    // the shadow on the oak: offset 0.05 D to the lower right, blurred 0.06 D, #000 from 55% at the plinth
    g.save(); g.filter = `blur(${Math.max(1, RL_P.shadowBlurD * RLD * res).toFixed(1)}px)`; g.translate(RL_P.shadowD * RLD, RL_P.shadowD * RLD); g.fillStyle = `rgba(0,0,0,${RL_P.shadowA})`; silhouette(); g.fill(); g.restore();
    // the face: bands every 6 units (shown 0.77 x 6), each a little darker; lit where the face turns west (toward the light), darker east
    const band = RL_P.strata * RLK * 0.77, nb = Math.ceil((hs - pl) / band), top = hex2rgb(RL_C.cliffTop), foot = hex2rgb(RL_C.cliffFoot);
    for (let b = 0; b < nb; b++) {
      const y0 = b * band, y1 = Math.min(hs - pl, (b + 1) * band), t = (b + 0.5) / nb;
      for (let k = 0; k < S.length - 1; k++) {
        const p = S[k], q = S[k + 1], turn = -(p[2] + q[2]) / 2, lit = 1 + 0.16 * turn + 0.05 * (R() - 0.5), dk = b % 2 ? 0.86 : 1;
        const c = top.map((v, j) => (v + (foot[j] - v) * t) * lit * dk);
        g.fillStyle = rgb2hex(c); g.beginPath(); g.moveTo(p[0], p[1] + y0); g.lineTo(q[0], q[1] + y0); g.lineTo(q[0], q[1] + y1 + 0.3); g.lineTo(p[0], p[1] + y1 + 0.3); g.closePath(); g.fill();
      }
      // the stratum's lit ledge (faint since fix 9: the rock facets carry the face) and its shadowed underside (seeded, uneven)
      g.strokeStyle = 'rgba(150,140,135,.12)'; g.lineWidth = 0.6; g.beginPath(); S.forEach(([x, y], k) => { const yy = y + y0 + 0.4 + (R() - 0.5) * 0.5; k ? g.lineTo(x, yy) : g.moveTo(x, yy); }); g.stroke();
      g.strokeStyle = 'rgba(10,8,9,.35)'; g.lineWidth = 0.8; g.beginPath(); S.forEach(([x, y], k) => { const yy = y + y1 - 0.3 + (R() - 0.5) * 0.6; k ? g.lineTo(x, yy) : g.moveTo(x, yy); }); g.stroke();
    }
    g.strokeStyle = 'rgba(12,10,11,.5)'; g.lineWidth = 0.7; // vertical cracks, ledges' chips
    for (let k = 0; k < 160; k++) { const s = S[1 + Math.floor(R() * (S.length - 2))]; if (Math.abs(s[3]) < 0.25) continue; const y0 = s[1] + R() * (hs - pl) * 0.7, L = (2 + R() * 6) * RLK; g.beginPath(); g.moveTo(s[0] + (R() - 0.5) * 4, y0); g.lineTo(s[0] + (R() - 0.5) * 3, Math.min(s[1] + hs - pl, y0 + L)); g.stroke(); }
    g.fillStyle = 'rgba(160,150,140,.22)'; for (let k = 0; k < 220; k++) { const s = S[1 + Math.floor(R() * (S.length - 2))]; if (Math.abs(s[3]) < 0.25) continue; g.fillRect(s[0] + (R() - 0.5) * 5, s[1] + R() * (hs - pl), 0.9 + R() * 1.6, 0.6); }
    { // fix 9: rock, not a tray. The lower half of the face darker (less sky light); irregular facet clusters (4 to 14 units wide), 42% of them lit on
      // their west side (a facet turned west faces the 315 degree light: n.l = cos 40 sin 45 = 0.54) with a dark crease on the east edge; talus at the foot.
      // No same-width columns: they read as plastic ribbing.
      const RB2 = rngFor(`relief:${MAP_SEED}:cliffrock`), fh = hs - pl;
      g.fillStyle = 'rgba(14,12,13,.35)'; g.beginPath(); S.forEach(([x, y], k) => (k ? g.lineTo(x, y + fh * 0.5) : g.moveTo(x, y + fh * 0.5))); for (let k = S.length - 1; k >= 0; k--) g.lineTo(S[k][0], S[k][1] + fh); g.closePath(); g.fill();
      for (let k = 0; k < S.length - 1; k++) {
        const p = S[k], q = S[k + 1]; if ((p[3] + q[3]) / 2 < 0.3) continue; const L = Math.hypot(q[0] - p[0], q[1] - p[1]); let t = RB2() * 3 * RLK;
        while (t < L) {
          const w = (4 + 10 * RB2() * RB2()) * RLK, x0 = p[0] + (q[0] - p[0]) * (t / L), y0 = p[1] + (q[1] - p[1]) * (t / L);
          if (RB2() < 0.42) {
            const lw = w * (0.2 + 0.25 * RB2()), top = fh * (0.05 + 0.25 * RB2()), depth = fh * (0.35 + 0.5 * RB2()), a = 0.3 + 0.3 * RB2();
            const gl = g.createLinearGradient(0, y0 + top, 0, y0 + top + depth); gl.addColorStop(0, `rgba(158,148,146,${a.toFixed(3)})`); gl.addColorStop(1, 'rgba(158,148,146,0)'); g.fillStyle = gl;
            g.beginPath(); g.moveTo(x0, y0 + top); g.lineTo(x0 + lw, y0 + top - lw * 0.3); g.lineTo(x0 + lw * 0.8, y0 + top + depth); g.lineTo(x0 - lw * 0.1, y0 + top + depth * 0.9); g.closePath(); g.fill();
            g.strokeStyle = 'rgba(8,7,8,.5)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x0 + lw, y0 + top - lw * 0.3); g.lineTo(x0 + lw * 0.8, y0 + top + depth); g.stroke();
          }
          t += w;
        }
      }
      for (let k = 0; k < S.length - 1; k++) { const p = S[k]; if (p[3] < 0.3 || RB2() < 0.5) continue; const n = 2 + Math.floor(RB2() * 4); for (let m = 0; m < n; m++) { const x = p[0] + RB2() * 6 * RLK, r = (0.8 + 1.6 * RB2()) * RLK, y = p[1] + fh - r * 0.3; g.fillStyle = '#2E2829'; ellipse(g, x, y, r, r * 0.6); g.fill(); g.fillStyle = 'rgba(150,140,138,.35)'; ellipse(g, x - r * 0.3, y - r * 0.25, r * 0.45, r * 0.25); g.fill(); } }
    }
    // the plinth: the board the model is built on (dark oak), its lit top edge, and the contact line on the table
    g.fillStyle = RL_C.plinth; g.beginPath(); S.forEach(([x, y], k) => (k ? g.lineTo(x, y + hs - pl) : g.moveTo(x, y + hs - pl))); for (let k = S.length - 1; k >= 0; k--) g.lineTo(S[k][0], S[k][1] + hs); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(176,138,94,.55)'; g.lineWidth = 0.8; g.beginPath(); S.forEach(([x, y], k) => (k ? g.lineTo(x, y + hs - pl + 0.4) : g.moveTo(x, y + hs - pl + 0.4))); g.stroke();
    g.strokeStyle = 'rgba(28,26,23,.6)'; g.lineWidth = 2.2; g.beginPath(); S.forEach(([x, y], k) => (k ? g.lineTo(x, y + hs + 0.6) : g.moveTo(x, y + hs + 0.6))); g.stroke();
    // waterfalls: a stream that reaches the south edge falls down the face as a pale streak and ends at the plinth
    if (RB.ready) for (const f of RB.water.falls) {
      const gr = g.createLinearGradient(0, H, 0, H + hs - pl); gr.addColorStop(0, 'rgba(185,211,207,.95)'); gr.addColorStop(0.7, 'rgba(185,211,207,.55)'); gr.addColorStop(1, 'rgba(185,211,207,.2)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(f.x - f.w * 0.55, H); g.lineTo(f.x + f.w * 0.55, H); g.lineTo(f.x + f.w * 0.9, H + hs - pl); g.lineTo(f.x - f.w * 0.9, H + hs - pl); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(240,248,246,.55)'; g.lineWidth = 0.5; for (const dx of [-0.3, 0.1, 0.4]) { g.beginPath(); g.moveTo(f.x + dx * f.w, H + 0.5); g.lineTo(f.x + dx * f.w * 1.5, H + hs - pl - 1); g.stroke(); }
      g.fillStyle = 'rgba(214,232,228,.6)'; ellipse(g, f.x, H + hs - pl - 0.6, f.w * 1.3, 1.1); g.fill();
    }
    // the brass plaque, set on the plinth at the middle of the south face: the map's seeded name
    const pw = RL_P.plaqueD * RLD, ph = Math.min((hs - pl) * 0.72, RL_P.plaqueH * RLK), px0 = W / 2 - pw / 2, py1 = H + hs - pl, py0 = py1 - ph;
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(px0 + 1.2, py0 + 1.2, pw, ph);
    const bg = g.createLinearGradient(0, py0, 0, py1); bg.addColorStop(0, '#CDA862'); bg.addColorStop(0.5, RL_C.brass); bg.addColorStop(1, '#8E6E36'); g.fillStyle = bg; g.fillRect(px0, py0, pw, ph);
    g.strokeStyle = '#D9BC7A'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(px0 + 0.5, py1 - 0.5); g.lineTo(px0 + 0.5, py0 + 0.5); g.lineTo(px0 + pw - 0.5, py0 + 0.5); g.stroke();
    g.strokeStyle = '#6E5428'; g.beginPath(); g.moveTo(px0 + pw - 0.5, py0 + 0.5); g.lineTo(px0 + pw - 0.5, py1 - 0.5); g.lineTo(px0 + 0.5, py1 - 0.5); g.stroke();
    for (const [rx, ry] of [[px0 + 3.2, py0 + 3.2], [px0 + pw - 3.2, py0 + 3.2], [px0 + 3.2, py1 - 3.2], [px0 + pw - 3.2, py1 - 3.2]]) { g.fillStyle = '#7A5F2E'; g.fillRect(rx - 1, ry - 1, 2, 2); g.fillStyle = '#E2C98E'; g.fillRect(rx - 1, ry - 1, 1, 1); }
    const fs = Math.min(ph * 0.62, pw / 12.5); g.font = `${fs.toFixed(2)}px 'Marcellus SC', Georgia, serif`; g.fillStyle = '#1C1A17'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('The Ember Marches', W / 2, (py0 + py1) / 2 + fs * 0.06);
  }, true);
  return RIM;
}

// ---- the live layers at half the bake's resolution: the rim glow along realm edges and the fog hem (one raster, re-made when ownership or fog changes)
let GLOW = null;
function rlGlow() {
  if (!RB.ready) return null;
  const sig = provList.map((i) => (prov[i].owner ?? '-')[0] + (fogOf(i) ?? '-')[0]).join('');
  if (GLOW && GLOW.sig === sig) return GLOW;
  const t0 = performance.now(), { HW, HH, TX, hid } = RB, T2 = TX / 2, Wg = RL_P.glowD * RLD, acc = new Float32Array(HW * HH * 2), owner = new Uint8Array(HW * HH); // [glow alpha, hem extra]
  const band = (i, e, Wd, slot) => {
    const x0 = Math.max(0, Math.floor((Math.min(e.a[0], e.b[0]) - Wd) * T2)), x1 = Math.min(HW - 1, Math.ceil((Math.max(e.a[0], e.b[0]) + Wd) * T2)), y0 = Math.max(0, Math.floor((Math.min(e.a[1], e.b[1]) - Wd) * T2)), y1 = Math.min(HH - 1, Math.ceil((Math.max(e.a[1], e.b[1]) + Wd) * T2));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const k = y * HW + x; if (hid[k] !== i) continue; const d = rlSegDist((x + 0.5) / T2, (y + 0.5) / T2, e.a[0], e.a[1], e.b[0], e.b[1]); if (d >= Wd) continue;
      const v = slot === 0 ? RL_P.glow * Math.pow(1 - d / Wd, RL_P.glowPow) : (RL_P.hemPeak - RL_P.haze) / (1 - RL_P.haze) * (1 - d / Wd);
      if (v > acc[k * 2 + slot]) acc[k * 2 + slot] = v;
    }
  };
  for (const i of provList) {
    const p = prov[i];
    if (p.owner) for (const e of RL_EDGES[i]) if (isRealmEdge(i, e)) band(i, e, Wg, 0);
    if (fogOf(i) === 'unexplored') for (const e of RL_EDGES[i]) if (e.j >= 0 && !isWild(e.j) && fogOf(e.j) !== 'unexplored') band(i, e, Wg, 1);
  }
  const img = new ImageData(HW, HH), d = img.data, ban = { red: hex2rgb(BAN.red), green: hex2rgb(BAN.green) }, hz = hex2rgb(RL_C.gesso);
  for (let k = 0; k < HW * HH; k++) {
    const a1 = acc[k * 2], a2 = acc[k * 2 + 1]; if (!a1 && !a2) continue; const o = hid[k], G = a1 ? ban[prov[o].owner] : hz;
    const A = a2 + a1 * (1 - a2); for (let c = 0; c < 3; c++) d[k * 4 + c] = Math.round((hz[c] * a2 + G[c] * a1 * (1 - a2)) / A); d[k * 4 + 3] = Math.round(255 * A);
  }
  const cv = makeCanvas(HW, HH); cv.getContext('2d').putImageData(img, 0, 0);
  GLOW = { sig, canvas: cv, ms: performance.now() - t0 }; return GLOW;
}
// ---- data modes: each province shows its mode color shaded by the gentle fixed relief (+-3 L*, mean-neutral), wilds left to the bake
let MODER = null;
function rlModeRaster() {
  if (!RB.ready || state.mode === 'ownership') return null;
  const cols = provList.map((i) => fillFor(prov[i])), sig = state.mode + '|' + cols.join(',');
  if (MODER && MODER.sig === sig) return MODER;
  const t0 = performance.now(), { HW, HH, hid, modeRelief } = RB, lut = new Array(N).fill(null);
  provList.forEach((i, k) => { const lab = rgb2lab(hex2rgb(cols[k])), row = new Uint8ClampedArray(17 * 3), tmp = [0, 0, 0]; for (let s = 0; s < 17; s++) { rlLabTo(Math.max(0, Math.min(100, lab[0] + (s - 8) * 0.5)), lab[1], lab[2], tmp, 0); row.set(tmp, s * 3); } lut[i] = row; });
  const img = new ImageData(HW, HH), d = img.data;
  for (let k = 0; k < HW * HH; k++) { const o = hid[k]; if (o === 255 || RL_WILDK[o]) continue; const s = Math.max(0, Math.min(16, Math.round(modeRelief[k] * 2 + 8))), row = lut[o]; d[k * 4] = row[s * 3]; d[k * 4 + 1] = row[s * 3 + 1]; d[k * 4 + 2] = row[s * 3 + 2]; d[k * 4 + 3] = 255; }
  const cv = makeCanvas(HW, HH); cv.getContext('2d').putImageData(img, 0, 0); MODER = { sig, canvas: cv, ms: performance.now() - t0 }; return MODER;
}
function rlAfterBake() { GLOW = null; MODER = null; RCK = null; RLW.keys = null; RL_PIECE_CACHE.clear(); }

// ---- the lit-bead rails, the two-tone internal lines and the neutral hairlines (§5.1), in device-pixel-aware CSS widths
const rlW = () => (dpr < 1.5 ? { d: 1.5, b: 1.5, l: 1.5, ib: 1.5, ik: 1.5 } : { d: 1, b: 1.5, l: 1, ib: 1.5, ik: 1 });
function rlInset(i, delta) { // the convex cell inset by delta world units: one vertex per ring vertex (between edge k-1 and edge k)
  const E = RL_EDGES[i], n = E.length, out = new Array(n);
  for (let k = 0; k < n; k++) {
    const e0 = E[(k - 1 + n) % n], e1 = E[k];
    const p0 = [e0.a[0] + e0.nx * delta, e0.a[1] + e0.ny * delta], d0 = [e0.b[0] - e0.a[0], e0.b[1] - e0.a[1]], p1 = [e1.a[0] + e1.nx * delta, e1.a[1] + e1.ny * delta], d1 = [e1.b[0] - e1.a[0], e1.b[1] - e1.a[1]];
    const den = d0[0] * d1[1] - d0[1] * d1[0]; let v;
    if (Math.abs(den) > 1e-9) { const t = ((p1[0] - p0[0]) * d1[1] - (p1[1] - p0[1]) * d1[0]) / den; v = [p0[0] + d0[0] * t, p0[1] + d0[1] * t]; }
    if (!v || Math.hypot(v[0] - e1.a[0], v[1] - e1.a[1]) > 6 * delta) { const mx = e0.nx + e1.nx, my = e0.ny + e1.ny, ml = Math.hypot(mx, my) || 1; v = [e1.a[0] + (mx / ml) * delta, e1.a[1] + (my / ml) * delta]; }
    out[k] = v;
  }
  return out;
}
function rlRuns(i, pred) { // runs of consecutive edges (cyclic) for which pred holds: [[k0, k1], ...] inclusive
  const E = RL_EDGES[i], n = E.length, on = E.map((e) => pred(e)); if (on.every(Boolean)) return [[0, n - 1, true]];
  let s = on.findIndex((v) => !v); const runs = [];
  for (let c = 1; c <= n; c++) { const k = (s + c) % n; if (on[k] && !on[(k - 1 + n) % n]) { let m = k; while (on[(m + 1) % n] && (m + 1) % n !== k) m = (m + 1) % n; runs.push([k, m]); } }
  return runs;
}
function rlStrokeRun(g, V, k0, k1, n, closed) { g.beginPath(); if (closed) { V.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); return; } let k = k0; g.moveTo(...V[k]); for (;;) { k = (k + 1) % n; g.lineTo(...V[k]); if (k === (k1 + 1) % n) break; } }
function rlDrawRails(g, band, px, opts = {}) {
  const w = rlW(), gap = 1, D1 = gap + w.d / 2, D2 = gap + w.d + w.b / 2, D3 = gap + w.d + w.b + w.l / 2, vw = VW, extra = opts.extra ?? 0;
  const seen = (bb) => bb[2] > vw[0] - 5 && bb[0] < vw[2] + 5 && bb[3] > vw[1] - 5 && bb[1] < vw[3] + 5;
  g.lineCap = 'butt'; g.lineJoin = 'miter'; g.miterLimit = 4;
  const list = opts.only != null ? [opts.only] : provList;
  for (const i of list) {
    const p = prov[i]; if (!p.owner) continue; const bb = geo(i).bb; if (!seen(bb)) continue; const E = RL_EDGES[i], n = E.length;
    const runs = rlRuns(i, (e) => isRealmEdge(i, e)); if (!runs.length) continue;
    for (const [col, delta, lw] of [[RL_C.keyDark, D1, w.d], [BAN[p.owner], D2 + extra / 2, w.b + extra], [RL_C.keyLight, D3 + extra, w.l]]) {
      const V = rlInset(i, delta * px); g.strokeStyle = col; g.lineWidth = lw * px;
      for (const [k0, k1, all] of runs) {
        const fogged = (() => { for (let k = k0; ; k = (k + 1) % n) { const e = E[k]; if (!(fogOf(i) && fogOf(e.j))) return false; if (k === k1) return true; } })();
        if (fogged) g.setLineDash([2 * px, 3 * px]);
        rlStrokeRun(g, V, k0, k1, n, all); g.stroke(); if (fogged) g.setLineDash([]);
      }
    }
  }
  if (opts.only != null) return;
  for (const [, e] of EDGE) { // internal two-tone lines and neutral hairlines, once per shared edge
    const i = e.i, j = e.j; if (isWild(i) || isWild(j)) continue; const oi = prov[i].owner, oj = prov[j].owner;
    const b = e.bb ?? (e.bb = bboxOf(e.wobble)); if (!seen(b)) continue;
    const [ax, ay] = e.a, [bx, by] = e.b, L = Math.hypot(bx - ax, by - ay) || 1; let nx = -(by - ay) / L, ny = (bx - ax) / L; if (nx + ny < 0) { nx = -nx; ny = -ny; } // toward the lower right
    const lr = (cent[j][0] - ax) * nx + (cent[j][1] - ay) * ny > 0 ? j : i, key = RL_KEYFOR[terr[lr]], fog = fogOf(i) && fogOf(j);
    if (fog) g.setLineDash([2 * px, 3 * px]);
    if (oi && oi === oj && band !== 'far') {
      const o1 = -w.ik / 2, o2 = w.ib / 2; g.strokeStyle = BAN[oi]; g.lineWidth = w.ib * px; g.beginPath(); g.moveTo(ax + nx * o1 * px, ay + ny * o1 * px); g.lineTo(bx + nx * o1 * px, by + ny * o1 * px); g.stroke();
      g.strokeStyle = key; g.lineWidth = w.ik * px; g.beginPath(); g.moveTo(ax + nx * o2 * px, ay + ny * o2 * px); g.lineTo(bx + nx * o2 * px, by + ny * o2 * px); g.stroke();
    } else if ((!oi && !oj) || (oi && oi === oj)) { g.strokeStyle = rgba(key, Math.min(RL_P.hairline, RL_HAIRA[terr[lr]])); g.lineWidth = 1.5 * px; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); }
    if (fog) g.setLineDash([]);
  }
}
// the hover and selection inner line, inside the rail (or at the border where there is none)
function rlInnerLine(g, i, px, width, alpha) {
  const w = rlW(), hasRail = !!prov[i].owner && RL_EDGES[i].some((e) => isRealmEdge(i, e)), d = (hasRail ? 1 + w.d + w.b + w.l + 0.5 : 1) + width / 2;
  const V = rlInset(i, d * px); g.save(); modelPath(g); g.clip(); g.strokeStyle = `rgba(244,238,223,${alpha})`; g.lineWidth = width * px; g.lineJoin = 'miter'; g.beginPath(); V.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.stroke(); g.restore();
}
function rlTintOf(i, sel) { const p = prov[i]; if (p.owner) return [BAN[p.owner], sel ? RL_P.select : RL_P.hover]; return [RL_KEYFOR[p.terrain], sel ? RL_P.indepSelect : RL_P.indepHover]; }

// ---- water: lakes and ponds as smoothed polygons, streams as width-varying lines (vectors over the composite, §3.6)
function rlDrawWater(g, px, alpha) {
  if (!RB.ready || alpha < 0.01) return; const Wt = RB.water, shore = shadeL(RL_C.water, -3);
  g.save(); g.globalAlpha = alpha; modelPath(g); g.clip();
  for (const s of Wt.streams) {
    const P = s.pts, n = P.length; g.lineCap = 'round'; g.lineJoin = 'round';
    for (let k = 0; k < n - 1; k++) { const t = k / (n - 1), w = s.w0 + (s.w1 - s.w0) * t; g.strokeStyle = shore; g.lineWidth = w + 0.8; g.beginPath(); g.moveTo(...P[k]); g.lineTo(...P[k + 1]); g.stroke(); }
    for (let k = 0; k < n - 1; k++) { const t = k / (n - 1), w = s.w0 + (s.w1 - s.w0) * t; g.strokeStyle = RL_C.water; g.lineWidth = Math.max(0.6, w - 0.4); g.beginPath(); g.moveTo(...P[k]); g.lineTo(...P[k + 1]); g.stroke(); }
    g.strokeStyle = 'rgba(220,240,232,.35)'; g.lineWidth = Math.max(0.4, 0.6 * px); g.beginPath(); P.forEach(([x, y], k) => (k ? g.lineTo(x - 0.4, y - 0.4) : g.moveTo(x - 0.4, y - 0.4))); g.stroke();
  }
  for (const L of [...Wt.lakes, ...Wt.ponds]) {
    const path = () => { g.beginPath(); L.P.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
    g.save(); g.beginPath(); g.rect(-50, -50, W + 100, H + 100); L.P.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.clip('evenodd'); // the banks, outside the water
    g.translate(0.9 * RLK, 0.9 * RLK); g.strokeStyle = 'rgba(236,240,226,.42)'; g.lineWidth = 1.2 * RLK; path(); g.stroke(); // the lit bank (south-east)
    g.translate(-1.8 * RLK, -1.8 * RLK); g.strokeStyle = 'rgba(12,20,14,.38)'; g.lineWidth = 1.4 * RLK; path(); g.stroke(); g.restore(); // the shaded bank (north-west)
    path(); g.fillStyle = RL_C.water; g.fill();
    g.save(); path(); g.clip(); g.strokeStyle = shore; g.lineWidth = 3.2 * RLK; path(); g.stroke(); // the shore band, 3 L* darker
    g.strokeStyle = 'rgba(232,246,240,.22)'; g.lineWidth = 0.7 * RLK; const R = rngFor('ripple:' + L.i); for (let k = 0; k < 3; k++) { const x = L.x + (R() - 0.5) * 18 * RLK, y = L.y + (R() - 0.5) * 8 * RLK; g.beginPath(); g.ellipse(x, y, 5 * RLK, 1.1 * RLK, 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
    g.restore();
  }
  g.restore();
}
// ---- the wilds' contour (3 px ink) and light rim, never tinted, faded or fogged (approved)
function rlDrawWildContours(g, px) {
  for (const w of WILDS) {
    const ol = rlWildOutline(w), path = () => { g.beginPath(); for (const e of ol) { g.moveTo(...e.a); g.lineTo(...e.b); } };
    g.save(); g.beginPath(); for (const c of w.cells) { cells[c].forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); } g.clip();
    g.strokeStyle = `rgba(233,228,216,${view.pass ? 1 : w.kind === 'mere' ? 0.7 : 0.8})`; g.lineWidth = (w.kind === 'mere' ? 7 : 6) * px; g.lineCap = 'round'; path(); g.stroke(); g.restore();
    g.strokeStyle = '#1C1A17'; g.lineWidth = 3 * px; g.lineCap = 'round'; path(); g.stroke(); g.lineCap = 'butt';
    if (view.pass) { g.strokeStyle = '#E9E4D8'; g.lineWidth = 4 * px; path(); g.stroke(); }
  }
}

// ---- the relief static layers: "under" (scene, model, land, live composite, water) and "over" (wild contours, rails, lip, pieces, labels)
const rlU = document.createElement('canvas'), rlUg = rlU.getContext('2d'), rlO = document.createElement('canvas'), rlOg = rlO.getContext('2d');
let RCK = null; const RREB = { n: 0, ms: 0, why: '' };
const rlPiecesSig = () => Object.values(cmd).map((c) => (c.hidden ? '' : c.id + c.at + ':' + (c.eta ?? '') + (c.prophet ? 'P' : ''))).join(',');
const rlStaticSig = () => ['relief', state.mode, KEYVER, view.table, view.detail, view.pass, view.reduced, curMonth, fontsReady, dpr, cw, ch, decoTo, RB.ready, RB.ver, view.tint, rlPiecesSig(), state.sel ? state.sel.type + state.sel.id : '', moveLine ? moveLine.path.join('.') : '', RL_NUMBERS.on, RL_NUMBERS.shift, FIGS.ver].join('|');
// ---- the land-look wash: composited per texel into the land's canvases (and mips) from their unwashed copies whenever a province's wash changes.
// Canvas 2D blends in 8-bit premultiplied color, so a 1.2% polygon fill lands as a darkening (Ashfen measured 0.6 dE off); this is the shader's mix done on the CPU.
const RLW = { keys: null, ms: 0, n: 0 };
const rlWashOf = (i, on) => { const p = prov[i]; if (!on || fogOf(i) || !p.dom.n || !RL_WASH[p.dom.n]) return 0; return (RL_WASH[p.dom.n][1] * p.dom.s) / 10; };
function rlWashSync() {
  if (!RB.ready) return;
  const on = decoTo >= 0.5 && !RL_DBG.noWash && !RL_DBG.noLive, A = new Float32Array(N), C = new Float32Array(N * 3);
  for (const i of provList) { A[i] = rlWashOf(i, on); if (A[i]) { const w = hex2rgb(RL_WASH[prov[i].dom.n][0]); for (let c = 0; c < 3; c++) C[i * 3 + c] = w[c] * A[i]; } }
  const keys = provList.map((i) => (A[i] ? prov[i].dom.n[0] + A[i].toFixed(4) : '-')), was = RLW.keys ?? provList.map(() => '-'), dirty = provList.filter((i, k) => keys[k] !== was[k]);
  RLW.keys = keys; if (!dirty.length) return;
  const t0 = performance.now();
  for (const [cv, base, ids] of [[RB.canvas, RB.img, null], [RB.mip1, RB.mb1, RB.mid1], [RB.mip2, RB.mb2, RB.mid2]]) {
    const w = base.width, h = base.height, f = (RB.TX * w) / RB.BW, B = base.data, idOf = ids ? (k) => ids[k] : (k) => (RB.LT[k] < 7 ? RB.id[k] : 255), g = cv.getContext('2d');
    for (const i of dirty) {
      const bb = geo(i).bb, x0 = Math.max(0, Math.floor(bb[0] * f) - 2), y0 = Math.max(0, Math.floor(bb[1] * f) - 2), x1 = Math.min(w - 1, Math.ceil(bb[2] * f) + 2), y1 = Math.min(h - 1, Math.ceil(bb[3] * f) + 2), bw = x1 - x0 + 1, bh = y1 - y0 + 1;
      const out = new ImageData(bw, bh), D = out.data;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const k = y * w + x, o4 = k * 4, d4 = ((y - y0) * bw + x - x0) * 4, o = idOf(k); D[d4 + 3] = B[o4 + 3];
        if (o === 255) { D[d4] = B[o4]; D[d4 + 1] = B[o4 + 1]; D[d4 + 2] = B[o4 + 2]; continue; }
        let a = A[o], r = C[o * 3], gg = C[o * 3 + 1], b = C[o * 3 + 2];
        if (x > 0 && y > 0 && x < w - 1 && y < h - 1 && (idOf(k - 1) !== o || idOf(k + 1) !== o || idOf(k - w) !== o || idOf(k + w) !== o)) { // a 3x3 average across a border, so the step is soft
          a = 0; r = gg = b = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { let q = idOf(k + dy * w + dx); if (q === 255) q = o; a += A[q]; r += C[q * 3]; gg += C[q * 3 + 1]; b += C[q * 3 + 2]; }
          a /= 9; r /= 9; gg /= 9; b /= 9;
        }
        D[d4] = Math.round(B[o4] * (1 - a) + r); D[d4 + 1] = Math.round(B[o4 + 1] * (1 - a) + gg); D[d4 + 2] = Math.round(B[o4 + 2] * (1 - a) + b);
      }
      g.putImageData(out, x0, y0);
    }
  }
  RLW.ms += performance.now() - t0; RLW.n++;
}
function rlRenderStatic(gU, gO, now) {
  const band = bandOf(cam.s), px = 1 / cam.s, covers = (r) => r[0] <= VW[0] && r[1] <= VW[1] && r[2] >= VW[2] && r[3] >= VW[3];
  gU.setTransform(1, 0, 0, 1, 0, 0); gO.setTransform(1, 0, 0, 1, 0, 0); gO.clearRect(0, 0, gO.canvas.width, gO.canvas.height);
  const g = gU;
  if (view.table === 'off') { g.fillStyle = '#15130F'; g.fillRect(0, 0, g.canvas.width, g.canvas.height); }
  else {
    const roomShows = !covers(TABLE);
    if (roomShows) {
      if (!covers(ROOM)) { g.fillStyle = '#0E0905'; g.fillRect(0, 0, g.canvas.width, g.canvas.height); }
      worldT(g);
      if (view.table === 'full') blitRing(g, bakeRoom(), ROOM, TABLE);
      else { const [cx, cy] = [(TABLE[0] + TABLE[2]) / 2, (TABLE[1] + TABLE[3]) / 2], rg = g.createRadialGradient(cx, cy, TW * 0.3, cx, cy, TW * 1.1); rg.addColorStop(0, '#2A2018'); rg.addColorStop(1, '#0E0905'); g.fillStyle = rg; g.fillRect(ROOM[0], ROOM[1], ROOM[2] - ROOM[0], ROOM[3] - ROOM[1]); }
    }
    worldT(g); const T = bakeTable(); blitRegion(g, T, T.x0, T.y0, T.x0 + T.w, T.y0 + T.h);
    if (view.table === 'full' && roomShows) { screenT(g); const vg = g.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.35, cw / 2, ch / 2, Math.hypot(cw, ch) * 0.6); vg.addColorStop(0, 'rgba(14,9,5,0)'); vg.addColorStop(1, 'rgba(14,9,5,.5)'); g.fillStyle = vg; g.save(); g.beginPath(); g.rect(0, 0, cw, ch); const [a, b] = toScreen(MODEL_BOX[0], MODEL_BOX[1]), [c, d] = toScreen(MODEL_BOX[2], MODEL_BOX[3]); g.rect(a, b, c - a, d - b); g.clip('evenodd'); g.fillRect(0, 0, cw, ch); g.restore(); }
  }
  worldT(g); const RM = rlRim(); blitRegion(g, RM, RM.x0, RM.y0, RM.x0 + RM.w, RM.y0 + RM.h);
  // the land: the bake (a mip below 0.6 texels per pixel) with the land-look wash composited in, or the flat albedos while the map is being prepared
  if (RB.ready) {
    rlWashSync();
    // the blit: bilinear while it upscales the chosen source, high quality only while it shrinks it ('high' upscaling cost about 255 of a 334 ms re-render at Near for a 0.31/255 mean change; critique fix 12)
    const tpp = RB.TX / (cam.s * dpr), src = RL_DBG.mip === 0 ? RB.canvas : RL_DBG.mip === 1 ? RB.mip1 : tpp > 2.4 ? RB.mip2 : tpp > 1.2 ? RB.mip1 : RB.canvas, k = src.width / W;
    const x0 = Math.max(0, VW[0]), y0 = Math.max(0, VW[1]), x1 = Math.min(W, VW[2]), y1 = Math.min(H, VW[3]);
    g.imageSmoothingQuality = src.width / W < cam.s * dpr ? 'low' : 'high'; if (x1 > x0 && y1 > y0) g.drawImage(src, x0 * k, y0 * k, (x1 - x0) * k, (y1 - y0) * k, x0, y0, x1 - x0, y1 - y0);
  } else {
    g.save(); modelPath(g); g.clip(); for (const p of provs) { pathPoly(g, cells[p.i]); g.fillStyle = RL_ALB[p.terrain]; g.fill(); } for (const w of WILDS) for (const c of w.cells) { pathPoly(g, cells[c]); g.fillStyle = w.kind === 'peaks' ? RL_C.granite : RL_C.mere; g.fill(); } g.restore();
  }
  // the live composite: the data-mode raster (cross-fades over 150 ms), then in Ownership: the land-look wash, the realm tint option, the glow and fog
  g.save(); modelPath(g); g.clip();
  const MR = decoAlpha < 0.999 ? rlModeRaster() : null; if (MR) { g.globalAlpha = 1 - decoAlpha; g.drawImage(MR.canvas, 0, 0, W, H); g.globalAlpha = 1; }
  if (decoAlpha > 0.001 && RB.ready && !RL_DBG.noLive) {
    g.globalAlpha = decoAlpha;
    if (view.tint) for (const p of provs) { if (!p.owner) continue; pathPoly(g, cells[p.i]); g.fillStyle = rgba(BAN[p.owner], RL_P.realmTint); g.fill(); }
    const GL = RL_DBG.noGlow ? null : rlGlow(); if (GL) g.drawImage(GL.canvas, 0, 0, W, H);
    for (const p of provs) { if (fogOf(p.i) !== 'unexplored') continue; pathPoly(g, cells[p.i]); g.fillStyle = rgba(RL_C.gesso, RL_P.haze); g.fill(); }
    g.globalCompositeOperation = 'saturation'; for (const p of provs) { if (fogOf(p.i) !== 'outofsight') continue; pathPoly(g, cells[p.i]); g.fillStyle = `rgba(128,128,128,${RL_P.outSat})`; g.fill(); } g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
  }
  g.restore();
  rlDrawWater(g, px, decoAlpha);
  if (!RB.ready) { screenT(g); const [mx, my] = toScreen(W / 2, H / 2); g.font = "500 15px 'Alegreya Sans', sans-serif"; g.textAlign = 'center'; g.fillStyle = 'rgba(20,18,15,.8)'; g.fillRect(mx - 110, my - 16, 220, 32); g.fillStyle = '#F4EEDF'; g.fillText('Preparing the map…', mx, my + 1); worldT(g); }
  // over: wild contours, rails and hairlines, the worn lip, pieces, labels
  worldT(gO); gO.save(); modelPath(gO); gO.clip();
  if (!SKIP.has('rails')) rlDrawRails(gO, band, px);
  gO.restore();
  rlDrawWildContours(gO, px);
  gO.save(); modelPath(gO); gO.clip(); gO.strokeStyle = 'rgba(233,228,216,.5)'; gO.lineWidth = 3 * px; modelPath(gO); gO.stroke(); gO.restore(); // the worn lip, 1.5 px on the land's side
  if (view.pass) { gO.save(); gO.beginPath(); for (const p of provs) if (p.i !== cmd.varo.at && !pathTo(cmd.varo.at, p.i)) { cells[p.i].forEach(([x, y], k) => (k ? gO.lineTo(x, y) : gO.moveTo(x, y))); gO.closePath(); } gO.clip(); gO.strokeStyle = 'rgba(28,26,23,.55)'; gO.lineWidth = 1.6 * px; gO.beginPath(); for (let d = -H; d < W + H; d += 9 * px) { gO.moveTo(d, 0); gO.lineTo(d + H, H); } gO.stroke(); gO.restore(); }
  const lay = rlLayout(band);
  screenT(gO); if (!SKIP.has('pieces')) rlDrawPieces(gO, band, lay); if (!SKIP.has('labels')) rlPaintLabels(gO, lay);
  gO.setTransform(1, 0, 0, 1, 0, 0); gU.setTransform(1, 0, 0, 1, 0, 0);
  RL_LAST_LAYOUT = lay;
}
let RL_LAST_LAYOUT = null; const RL_DBG = { mip: null }; // review only: force a mip level
function rlRenderCache(now, sig, why) {
  const m = 0.35, vw = cw * (1 + 2 * m), vh = ch * (1 + 2 * m), W2 = Math.round(vw * dpr), H2 = Math.round(vh * dpr);
  for (const c of [rlU, rlO]) if (c.width !== W2 || c.height !== H2) { c.width = W2; c.height = H2; }
  const sx = cam.x, sy = cam.y, scw = cw, sch = ch, ox = Math.round(m * cw * dpr) / dpr, oy = Math.round(m * ch * dpr) / dpr; // whole device pixels: the blit is an exact copy
  cam.x += ox; cam.y += oy; cw = vw; ch = vh; VW = visibleWorld();
  const t0 = performance.now(); try { rlRenderStatic(rlUg, rlOg, now); } finally { RREB.n++; RREB.ms += performance.now() - t0; RREB.why = why;
    RCK = { sig, s: cam.s, wx0: -cam.x / cam.s, wy0: -cam.y / cam.s, ww: vw / cam.s, wh: vh / cam.s, ox: cam.x, oy: cam.y };
    cam.x = sx; cam.y = sy; cw = scw; ch = sch; VW = visibleWorld(); }
}
function rlDraw() {
  if (checkFonts()) onFontsArrived();
  if (!RB.ready) rlStartBake(); if (!FIGS.started) rlStartFigures();
  const now = performance.now(); animating = false;
  let decoAnim = false;
  if (decoAlpha !== decoTo) { const t = view.reduced ? 1 : Math.min(1, (now - decoT0) / 150); decoAlpha = decoFrom + (decoTo - decoFrom) * t; decoAnim = true; if (t < 1) animating = true; }
  VW = visibleWorld();
  const band = bandOf(cam.s), sig = rlStaticSig();
  const inside = RCK && VW[0] >= RCK.wx0 && VW[1] >= RCK.wy0 && VW[2] <= RCK.wx0 + RCK.ww && VW[3] <= RCK.wy0 + RCK.wh;
  const zooming = RCK && cam.s !== RCK.s && now < zoomingUntil && inside;
  if (!RCK || RCK.sig !== sig || decoAnim || !inside || (cam.s !== RCK.s && !zooming)) rlRenderCache(now, sig, !RCK ? 'none' : RCK.sig !== sig ? 'sig' : decoAnim ? 'deco' : !inside ? 'outside' : 'scale');
  if (zooming) setTimeout(requestDraw, zoomingUntil - now + 10);
  const g = ctx; g.setTransform(1, 0, 0, 1, 0, 0);
  if (zooming) { g.fillStyle = '#0E0905'; g.fillRect(0, 0, canvas.width, canvas.height); }
  const blit = (c) => { if (cam.s === RCK.s) { g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(c, Math.round((cam.x - RCK.ox) * dpr), Math.round((cam.y - RCK.oy) * dpr)); worldT(g); } else { worldT(g); g.drawImage(c, RCK.wx0, RCK.wy0, RCK.ww, RCK.wh); } };
  worldT(g); blit(rlU);
  const px = 1 / cam.s, own = state.mode === 'ownership';
  // live: the hovered, linked and selected provinces' tints under the rails and pieces (Ownership only; data modes draw the line alone)
  const hp = hoverProv >= 0 && !isWild(hoverProv) ? hoverProv : -1, lp = RL_LINK.prov, sp = state.sel && state.sel.type === 'prov' ? state.sel.id : -1;
  if (own && RB.ready) { g.save(); modelPath(g); g.clip(); for (const [i, sel] of [[hp, false], [lp, false], [sp, true]]) { if (i < 0 || (sel === false && i === sp)) continue; const [c, a] = rlTintOf(i, sel); pathPoly(g, cells[i]); g.fillStyle = rgba(c, a); g.fill(); } g.restore(); }
  blit(rlO);
  for (const i of [hp, lp]) if (i >= 0 && i !== sp) { if (prov[i].owner) { g.save(); modelPath(g); g.clip(); rlDrawRails(g, bandOf(cam.s), px, { only: i, extra: 0.5 }); g.restore(); } rlInnerLine(g, i, px, 1, 0.7); }
  if (sp >= 0) rlInnerLine(g, sp, px, 1.5, 1);
  screenT(g);
  if (!SKIP.has('arrows')) { if (moveLine) rlThread(g, moveLine); if (!cmd.ilsa.hidden && cmd.ilsa.eta > 0) { const a = rlPieceAt('ilsa') ?? cent[cmd.ilsa.at]; rlArrow(g, a, cent[cmd.ilsa.to], cmd.ilsa.to, '#9FE0C2', `${cmd.ilsa.eta}d`); } rlLiveLabels(g, band); }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  present(now, true);
  if (!SKIP.has('badges')) rlPlacePieces(band);
  updateZoomChip(band);
  if (RB.ready && !window.__rlReadyMs) window.__rlReadyMs = performance.now() - T_START; // the first frame with the bake
  if (!window.__firstPaintMs) { window.__firstPaintMs = performance.now(); window.__firstPaintFromScript = performance.now() - T_START; }
  firstPaint = false;
  if (animating) requestDraw();
}
// ---- the brass compass prop in the table's upper-right slot (the cloth's compass rose moves to the table; inert, like the other props)
function rlCompass(g) {
  const x = W * 0.82, y = CLOTH[1] - POFF + 4, r = 34;
  g.fillStyle = 'rgba(0,0,0,.32)'; ellipse(g, x + 6, y + 7, r + 2, r + 2); g.fill();
  const rg = g.createLinearGradient(x - r, y - r, x + r, y + r); rg.addColorStop(0, '#D4B26A'); rg.addColorStop(0.5, '#B8914A'); rg.addColorStop(1, '#7A5F2E');
  g.fillStyle = rg; ellipse(g, x, y, r, r); g.fill(); g.fillStyle = '#E8DCC2'; ellipse(g, x, y, r * 0.8, r * 0.8); g.fill();
  g.strokeStyle = '#7A5F2E'; g.lineWidth = 1.2; ellipse(g, x, y, r * 0.8, r * 0.8); g.stroke();
  g.strokeStyle = 'rgba(28,26,23,.55)'; g.lineWidth = 0.9; for (let k = 0; k < 32; k++) { const a = (k * Math.PI) / 16, l = k % 4 ? 0.06 : 0.12; g.beginPath(); g.moveTo(x + Math.cos(a) * r * 0.78, y + Math.sin(a) * r * 0.78); g.lineTo(x + Math.cos(a) * r * (0.78 - l), y + Math.sin(a) * r * (0.78 - l)); g.stroke(); }
  for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 2 - Math.PI / 2, tip = [x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62], l = [x + Math.cos(a - Math.PI / 2) * 4, y + Math.sin(a - Math.PI / 2) * 4], rr = [x + Math.cos(a + Math.PI / 2) * 4, y + Math.sin(a + Math.PI / 2) * 4];
    g.fillStyle = k === 0 ? '#7A1E12' : '#3E3428'; g.beginPath(); g.moveTo(...l); g.lineTo(...tip); g.lineTo(...rr); g.closePath(); g.fill(); }
  g.fillStyle = '#B8914A'; ellipse(g, x, y, 3, 3); g.fill(); g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.ellipse(x - r * 0.2, y - r * 0.25, r * 0.5, r * 0.28, -0.6, 0, Math.PI * 2); g.fill();
  g.font = "10px 'Marcellus SC', Georgia, serif"; g.fillStyle = '#1C1A17'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('N', x, y - r * 0.42);
}
