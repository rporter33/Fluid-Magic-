
// ------------------------------------------------------------------ v4 relief: the live layers (glow, fog, modes), the static layers and the draw; the rim is p59a, the lines and water p59b
// natural §6: the land shows the look of the setting (Natural by default, Clear with "Clear terrain colours") or, in the Terrain mode, the Clear bake as baked;
// a look that is not baked yet is prepared in the background while the ready one stays on screen, and the swap cross-fades over 150 ms (instant under reduced motion).
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

// ---- the live layers at half the bake's resolution: the rim glow along realm edges and the fog hem (one raster, re-made when ownership or fog changes).
// hemOnly: the Terrain mode's raster (no glow; the fog states stay, natural §6). The hem peaks at 12% over the look's own haze.
let GLOW = null, GLOWH = null;
const rlFogAt = (i) => (RL_DBG.fog !== undefined ? RL_DBG.fog : fogOf(i)); // review only: RL_DBG.fog forces one state on every province (the readability check)
function rlGlow(hemOnly) {
  if (!RB.ready) return null; const F = RL_FOG();
  const sig = provList.map((i) => (hemOnly ? '' : (prov[i].owner ?? '-')[0]) + (rlFogAt(i) ?? '-')[0]).join('') + '|' + F.haze;
  const C = hemOnly ? GLOWH : GLOW; if (C && C.sig === sig) return C;
  const t0 = performance.now(), { HW, HH, TX, hid } = RB, T2 = TX / 2, Wg = RL_P.glowD * RLD, acc = new Float32Array(HW * HH * 2), owner = new Uint8Array(HW * HH); // [glow alpha, hem extra]
  const band = (i, e, Wd, slot) => {
    const x0 = Math.max(0, Math.floor((Math.min(e.a[0], e.b[0]) - Wd) * T2)), x1 = Math.min(HW - 1, Math.ceil((Math.max(e.a[0], e.b[0]) + Wd) * T2)), y0 = Math.max(0, Math.floor((Math.min(e.a[1], e.b[1]) - Wd) * T2)), y1 = Math.min(HH - 1, Math.ceil((Math.max(e.a[1], e.b[1]) + Wd) * T2));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const k = y * HW + x; if (hid[k] !== i) continue; const d = rlSegDist((x + 0.5) / T2, (y + 0.5) / T2, e.a[0], e.a[1], e.b[0], e.b[1]); if (d >= Wd) continue;
      const v = slot === 0 ? RL_P.glow * Math.pow(1 - d / Wd, RL_P.glowPow) : (F.hemPeak - F.haze) / (1 - F.haze) * (1 - d / Wd);
      if (v > acc[k * 2 + slot]) acc[k * 2 + slot] = v;
    }
  };
  for (const i of provList) {
    const p = prov[i];
    if (p.owner && !hemOnly) for (const e of RL_EDGES[i]) if (isRealmEdge(i, e)) band(i, e, Wg, 0);
    if (rlFogAt(i) === 'unexplored') for (const e of RL_EDGES[i]) if (e.j >= 0 && !isWild(e.j) && rlFogAt(e.j) !== 'unexplored') band(i, e, Wg, 1);
  }
  const img = new ImageData(HW, HH), d = img.data, ban = { red: hex2rgb(BAN.red), green: hex2rgb(BAN.green) }, hz = hex2rgb(RL_C.gesso);
  for (let k = 0; k < HW * HH; k++) {
    const a1 = acc[k * 2], a2 = acc[k * 2 + 1]; if (!a1 && !a2) continue; const o = hid[k], G = a1 ? ban[prov[o].owner] : hz;
    const A = a2 + a1 * (1 - a2); for (let c = 0; c < 3; c++) d[k * 4 + c] = Math.round((hz[c] * a2 + G[c] * a1 * (1 - a2)) / A); d[k * 4 + 3] = Math.round(255 * A);
  }
  const cv = makeCanvas(HW, HH); cv.getContext('2d').putImageData(img, 0, 0);
  const R = { sig, canvas: cv, ms: performance.now() - t0 }; if (hemOnly) GLOWH = R; else GLOW = R; return R;
}
// ---- data modes: each province shows its mode color shaded by the gentle fixed relief (+-3 L*, mean-neutral), wilds left to the bake
let MODER = null;
function rlModeRaster() {
  if (!RB.ready || state.mode === 'ownership' || state.mode === 'terrain') return null; // the Terrain mode's raster is the Clear bake itself (natural §6)
  const cols = provList.map((i) => fillFor(prov[i])), sig = state.mode + '|' + cols.join(',');
  if (MODER && MODER.sig === sig) return MODER;
  const t0 = performance.now(), { HW, HH, hid, modeRelief } = RB, lut = new Array(N).fill(null);
  provList.forEach((i, k) => { const lab = rgb2lab(hex2rgb(cols[k])), row = new Uint8ClampedArray(17 * 3), tmp = [0, 0, 0]; for (let s = 0; s < 17; s++) { rlLabTo(Math.max(0, Math.min(100, lab[0] + (s - 8) * 0.5)), lab[1], lab[2], tmp, 0); row.set(tmp, s * 3); } lut[i] = row; });
  const img = new ImageData(HW, HH), d = img.data;
  for (let k = 0; k < HW * HH; k++) { const o = hid[k]; if (o === 255 || RL_WILDK[o]) continue; const s = Math.max(0, Math.min(16, Math.round(modeRelief[k] * 2 + 8))), row = lut[o]; d[k * 4] = row[s * 3]; d[k * 4 + 1] = row[s * 3 + 1]; d[k * 4 + 2] = row[s * 3 + 2]; d[k * 4 + 3] = 255; }
  const cv = makeCanvas(HW, HH); cv.getContext('2d').putImageData(img, 0, 0); MODER = { sig, canvas: cv, img, ver: (MODER ? MODER.ver : 0) + 1, ms: performance.now() - t0 }; return MODER;
}
function rlAfterBake() { GLOW = null; GLOWH = null; MODER = null; RCK = null; RL_PIECE_CACHE.clear(); RL_LINES.cache.clear(); RL_SEATG.clear(); for (const k of ['natural', 'clear']) if (RB.L[k]) RB.L[k].washKeys = null; }

// ---- the relief static layers: "under" (scene, model, land, live composite, water) and "over" (wild contours, rails, lip, pieces, labels)
const rlU = document.createElement('canvas'), rlUg = rlU.getContext('2d'), rlO = document.createElement('canvas'), rlOg = rlO.getContext('2d');
let RCK = null; const RREB = { n: 0, ms: 0, why: '' };
const rlPiecesSig = () => Object.values(cmd).map((c) => (c.hidden ? '' : c.id + c.at + ':' + (c.eta ?? '') + (c.prophet ? 'P' : ''))).join(',');
const rlStaticSig = () => ['relief', state.mode, KEYVER, view.table, view.detail, view.pass, view.reduced, curMonth, fontsReady, dpr, cw, ch, decoTo, RB.ready, RB.ver, RB.lookVer, rlShownLook(), view.terrain, RL_DBG.fog ?? '', [...SKIP].join(''), view.tint, rlPiecesSig(), state.sel ? state.sel.type + state.sel.id : '', moveLine ? moveLine.path.join('.') : '', RL_NUMBERS.on, RL_NUMBERS.shift, FIGS.ver].join('|');
// ---- the land-look wash: composited per texel into each look's canvases (and mips) from their unwashed copies whenever a province's wash changes.
// Canvas 2D blends in 8-bit premultiplied color, so a 1.2% polygon fill lands as a darkening (Ashfen measured 0.6 dE off); this is the shader's mix done on the CPU.
const RLW = { ms: 0, n: 0 };
const rlWashOf = (i, on) => { const p = prov[i]; if (!on || fogOf(i) || !p.dom.n || !RL_WASH[p.dom.n]) return 0; return (RL_WASH[p.dom.n][1] * p.dom.s) / 10; };
function rlWashSync(look) {
  const Lk = RB.L[look]; if (!RB.ready || !Lk) return;
  const on = decoTo >= 0.5 && !RL_DBG.noWash && !RL_DBG.noLive, A = new Float32Array(N), C = new Float32Array(N * 3);
  for (const i of provList) { A[i] = rlWashOf(i, on); if (A[i]) { const w = hex2rgb(RL_WASH[prov[i].dom.n][0]); for (let c = 0; c < 3; c++) C[i * 3 + c] = w[c] * A[i]; } }
  const keys = provList.map((i) => (A[i] ? prov[i].dom.n[0] + A[i].toFixed(4) : '-')), was = Lk.washKeys ?? provList.map(() => '-'), dirty = provList.filter((i, k) => keys[k] !== was[k]);
  Lk.washKeys = keys; if (!dirty.length) return;
  const t0 = performance.now();
  for (const [cv, base, ids] of [[Lk.canvas, Lk.img, null], [Lk.mip1, Lk.mb1, RB.mid1], [Lk.mip2, Lk.mb2, RB.mid2]]) {
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
const RL_XF = { from: null, to: null, t0: 0 }; // the look cross-fade (150 ms)
const rlXfT = (now) => (RL_XF.from && !view.reduced ? Math.min(1, (now - RL_XF.t0) / 150) : 1);
const rlNatHex = (t) => { const c = RL_NAT.mat[t].ground, o = [0, 0, 0]; rlLabTo(c[0], c[1], c[2], o, 0); return rgb2hex(o); };
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
  // the land: the shown look's bake (a mip below 0.6 texels per pixel) with the land-look wash composited in, or flat grounds while the map is being prepared
  if (RB.ready) {
    // the blit: bilinear while it upscales the chosen source, high quality only while it shrinks it ('high' upscaling cost about 255 of a 334 ms re-render at Near for a 0.31/255 mean change; critique fix 12)
    const lvl = rlMipLevel(), x0 = Math.max(0, VW[0]), y0 = Math.max(0, VW[1]), x1 = Math.min(W, VW[2]), y1 = Math.min(H, VW[3]), xf = rlXfT(now);
    const blitLook = (look, a) => { const Lk = RB.L[look]; if (!Lk || !Lk.ready || a <= 0) return; rlWashSync(look); const src = lvl === 2 ? Lk.mip2 : lvl === 1 ? Lk.mip1 : Lk.canvas, k = src.width / W;
      g.imageSmoothingQuality = src.width / W < cam.s * dpr ? 'low' : 'high'; g.globalAlpha = a; if (x1 > x0 && y1 > y0) g.drawImage(src, x0 * k, y0 * k, (x1 - x0) * k, (y1 - y0) * k, x0, y0, x1 - x0, y1 - y0); g.globalAlpha = 1; };
    if (xf < 1 && RL_XF.from) blitLook(RL_XF.from, 1); blitLook(RL_XF.to ?? rlShownLook(), xf < 1 && RL_XF.from ? xf : 1);
  } else {
    const nat = rlLandLook() === 'natural';
    g.save(); modelPath(g); g.clip(); for (const p of provs) { pathPoly(g, cells[p.i]); g.fillStyle = nat ? rlNatHex(p.terrain) : RL_ALB[p.terrain]; g.fill(); } for (const w of WILDS) for (const c of w.cells) { pathPoly(g, cells[c]); g.fillStyle = w.kind === 'peaks' ? RL_C.granite : RL_C.mere; g.fill(); } g.restore();
  }
  // the live composite: the data-mode raster (cross-fades over 150 ms), then in Ownership: the realm tint option, the glow and fog; in the Terrain mode: the fog alone.
  // Fog by look (natural §8.3): Natural hazes unexplored land 6% and then desaturates it 40%, and desaturates out-of-sight land 25%; Clear keeps the approved 4% and 10%.
  g.save(); modelPath(g); g.clip();
  const tmode = state.mode === 'terrain', liveA = tmode ? 1 : decoAlpha, F = RL_FOG();
  const MR = !tmode && decoAlpha < 0.999 ? rlModeRaster() : null; if (MR) { g.globalAlpha = 1 - decoAlpha; g.drawImage(MR.canvas, 0, 0, W, H); g.globalAlpha = 1; }
  if (liveA > 0.001 && RB.ready && !RL_DBG.noLive) {
    g.globalAlpha = liveA;
    if (view.tint && !tmode) for (const p of provs) { if (!p.owner) continue; pathPoly(g, cells[p.i]); g.fillStyle = rgba(BAN[p.owner], RL_P.realmTint); g.fill(); }
    const GL = RL_DBG.noGlow ? null : rlGlow(tmode); if (GL) g.drawImage(GL.canvas, 0, 0, W, H);
    for (const p of provs) { if (rlFogAt(p.i) !== 'unexplored') continue; pathPoly(g, cells[p.i]); g.fillStyle = rgba(RL_C.gesso, F.haze); g.fill(); }
    g.globalCompositeOperation = 'saturation';
    for (const p of provs) { const f = rlFogAt(p.i), s = f === 'outofsight' ? F.outSat : f === 'unexplored' ? F.unexSat : 0; if (!s) continue; pathPoly(g, cells[p.i]); g.fillStyle = `rgba(128,128,128,${s})`; g.fill(); }
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  }
  g.restore();
  rlDrawWater(g, px, tmode ? 1 : decoAlpha); // the Terrain mode keeps its water (natural §6)
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
  if (!RB.ready) rlStartBake(); else rlEnsureLook(rlLandLook()); if (!FIGS.started) rlStartFigures();
  const now = performance.now(); animating = false;
  let decoAnim = false;
  { const shown = RB.ready ? rlShownLook() : null; if (shown && RL_XF.to !== shown) { RL_XF.from = RL_XF.to; RL_XF.to = shown; RL_XF.t0 = now; } if (RL_XF.from && rlXfT(now) < 1) { decoAnim = true; animating = true; } else if (RL_XF.from) { RL_XF.from = null; decoAnim = true; } } // the look cross-fade re-renders each frame
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
  RL_CHIPS.length = 0; if (!SKIP.has('arrows')) { if (moveLine) rlThread(g, moveLine); if (!cmd.ilsa.hidden && cmd.ilsa.eta > 0) { const a = rlPieceAt('ilsa') ?? cent[cmd.ilsa.at]; rlArrow(g, a, cent[cmd.ilsa.to], cmd.ilsa.to, '#9FE0C2', `${cmd.ilsa.eta}d`); } rlLiveLabels(g, band); }
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
