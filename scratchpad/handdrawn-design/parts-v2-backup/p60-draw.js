
// ------------------------------------------------------------------ canvas, camera, drawing
const app = document.getElementById('app');
const canvas = document.getElementById('map'), ctx = canvas.getContext('2d');
const layer = document.getElementById('layer');
const amb = document.getElementById('amb'), actx = amb.getContext('2d');
const cam = { s: 1, x: 0, y: 0 };
let dpr = 1, cw = 0, ch = 0, moveLine = null, hoverProv = -1, fitScale = 1, minScale = 0.2, maxScale = 2.4, firstPaint = true;
let decoAlpha = 1, decoFrom = 1, decoTo = 1, decoT0 = 0;
const BAN = { red: '#FD6533', green: '#00674B' };
function viewRect() { // the part of the map the panels leave uncovered
  const shown = (id) => { const el = document.getElementById(id); return el && !el.hidden && getComputedStyle(el).display !== 'none' ? el : null; };
  const phone = app.classList.contains('phone'), ld = shown('leftDock'), rd = shown('rightDock'), rail = shown('rail');
  const l = ld && !phone ? ld.offsetWidth : 0;
  const r = cw - (rd && !rd.classList.contains('fly') ? rd.offsetWidth : 0) - (rail ? rail.offsetWidth : 0);
  const b = ch - (app.classList.contains('strip-on') ? document.getElementById('strip').offsetHeight : 0) - (ld && phone ? ld.offsetHeight : 0);
  return { l, r, t: 84, b }; // 84: top bar plus the alerts ribbon
}
function resize() {
  const r = canvas.getBoundingClientRect(); const nd = window.devicePixelRatio || 1;
  if (nd !== dpr) { dpr = nd; invalidateBakes(); }
  cw = r.width; ch = r.height; canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr); amb.width = canvas.width; amb.height = canvas.height;
}
function computeScales() {
  const v = viewRect(), vw = Math.max(80, v.r - v.l), vh = Math.max(80, v.b - v.t);
  fitScale = Math.min((vw - 64) / (CLOTH[2] - CLOTH[0]), (vh - 64) / (CLOTH[3] - CLOTH[1]));
  minScale = Math.min(fitScale * 0.9, Math.max(0.75 * Math.min(vw / TW, vh / TH), vw / (ROOM[2] - ROOM[0]), vh / (ROOM[3] - ROOM[1])));
  maxScale = 420 / MED_DIAM;
}
function fit() { // the cloth fits the unobscured area with a 32 px oak band; a phone starts closer, on the selected army
  resize(); computeScales();
  const v = viewRect(), phone = app.classList.contains('phone');
  const s = phone ? Math.max(fitScale, 0.5) : fitScale;
  const [fx, fy] = phone ? cent[cmd.varo.at] : [(CLOTH[0] + CLOTH[2]) / 2, (CLOTH[1] + CLOTH[3]) / 2];
  cam.s = s; cam.x = (v.l + v.r) / 2 - fx * s; cam.y = (v.t + v.b) / 2 - fy * s; clampCam();
}
function clampCam() { // the view's center stays inside the table, and the view never shows the void beyond the room
  const v = viewRect(); const cx = ((v.l + v.r) / 2 - cam.x) / cam.s, cy = ((v.t + v.b) / 2 - cam.y) / cam.s;
  const hw = (v.r - v.l) / 2 / cam.s, hh = (v.b - v.t) / 2 / cam.s;
  const rng = (lo, hi, rlo, rhi, mid) => { const a = Math.max(lo, rlo), b = Math.min(hi, rhi); return a <= b ? [a, b] : [mid, mid]; };
  const [xa, xb] = rng(TABLE[0], TABLE[2], ROOM[0] + hw, ROOM[2] - hw, (TABLE[0] + TABLE[2]) / 2), [ya, yb] = rng(TABLE[1], TABLE[3], ROOM[1] + hh, ROOM[3] - hh, (TABLE[1] + TABLE[3]) / 2);
  const nx = Math.max(xa, Math.min(xb, cx)), ny = Math.max(ya, Math.min(yb, cy));
  cam.x += (cx - nx) * cam.s; cam.y += (cy - ny) * cam.s;
}
function zoomAt(mx, my, ns) { ns = Math.max(minScale, Math.min(maxScale, ns)); const k = ns / cam.s; cam.x = mx - (mx - cam.x) * k; cam.y = my - (my - cam.y) * k; cam.s = ns; clampCam(); }
const toScreen = (x, y) => [x * cam.s + cam.x, y * cam.s + cam.y];
const toWorld = (sx, sy) => [(sx - cam.x) / cam.s, (sy - cam.y) / cam.s];
const MODE_BASE = Object.fromEntries(Object.entries(TERRAIN).map(([t, d]) => [t, { forest: '#79786B', hills: '#7E7767', swamp: '#6F7A77' }[t] ?? desat(d.fill, 0.8)]));
const HEAT = ['#4C5E96', '#8170AC', '#C4808E', '#E6AC6E', '#F8E6A6'].map(hex2rgb);
function heat(t) { // 0..1 -> a lightness-carrying ramp (L* 41 to 91), readable without hue
  const x = Math.max(0, Math.min(0.9999, t)) * (HEAT.length - 1), k = Math.floor(x), f = x - k, a = HEAT[k], b = HEAT[k + 1];
  return rgb2hex(a.map((v, j) => v + (b[j] - v) * f));
}
const FILLMEMO = new Map();
function fillFor(p) {
  const fog = fogOf(p.i), hid = fog === 'unexplored', base = MODE_BASE[p.terrain];
  const memo = (k, fn) => { let v = FILLMEMO.get(k); if (!v) { v = fn(); FILLMEMO.set(k, v); } return v; };
  switch (state.mode) {
    case 'dominion': return hid || !p.dom.n ? base : memo(`d${p.terrain}${p.dom.n}${p.dom.s}`, () => mix(base, BAN[p.dom.n], p.dom.n === 'red' ? 0.25 + p.dom.s * 0.07 : 0.35 + p.dom.s * 0.07));
    case 'supply': return hid ? base : heat((SUPPLY[p.terrain] + p.pop / 50) / 320);
    case 'unrest': return hid ? base : heat(p.unrest / 60);
    case 'population': return hid ? base : heat((Math.log(p.pop) / Math.log(26000)) * 1.15 - 0.55);
    case 'springs': return base;
    default: {
      const f = TERRAIN[p.terrain].fill;
      if (hid) return memo('u' + f, () => mix(f, '#E8DCC2', 0.04));
      if (fog === 'outofsight') return memo('o' + f, () => desat(f, 0.1));
      if (!p.dom.n) return f;
      return memo(`w${f}${p.dom.n}${p.dom.s}`, () => mix(f, p.dom.n === 'red' ? '#8F8C88' : '#5E7F45', (p.dom.n === 'red' ? 0.1 : 0.06) * p.dom.s / 10));
    }
  }
}
const provsByY = [...provs].sort((a, b) => cent[a.i][1] - cent[b.i][1]);
const worldT = (g) => g.setTransform(dpr * cam.s, 0, 0, dpr * cam.s, dpr * cam.x, dpr * cam.y);
const screenT = (g) => g.setTransform(dpr, 0, 0, dpr, 0, 0);
const blitW = (g, B) => g.drawImage(B.src, B.x0, B.y0, B.w, B.h);
let drawQueued = false, animating = false, VW = [0, 0, W, H];
function blitRegion(g, B, x0, y0, x1, y1) { // the part of a world-space bake that is on screen
  x0 = Math.max(x0, B.x0, VW[0]); y0 = Math.max(y0, B.y0, VW[1]); x1 = Math.min(x1, B.x0 + B.w, VW[2]); y1 = Math.min(y1, B.y0 + B.h, VW[3]);
  if (x1 <= x0 || y1 <= y0) return; const kx = B.canvas.width / B.w, ky = B.canvas.height / B.h;
  g.drawImage(B.src, (x0 - B.x0) * kx, (y0 - B.y0) * ky, (x1 - x0) * kx, (y1 - y0) * ky, x0, y0, x1 - x0, y1 - y0);
}
function blitRing(g, B, o, n) { blitRegion(g, B, o[0], o[1], o[2], n[1]); blitRegion(g, B, o[0], n[3], o[2], o[3]); blitRegion(g, B, o[0], n[1], n[0], n[3]); blitRegion(g, B, n[2], n[1], o[2], n[3]); }
function requestDraw() { if (!drawQueued) { drawQueued = true; requestAnimationFrame(() => { drawQueued = false; draw(); }); } }
let tmpA = null, tmpB = null;
function wipeDraw(g, sp, t, alpha) { // the M1-should brush wipe: a soft edge sweeping from the nation's side
  const w = sp.canvas.width, h = sp.canvas.height; tmpA ??= makeCanvas(w, h); tmpB ??= makeCanvas(w, h);
  for (const c of [tmpA, tmpB]) { if (c.width < w) c.width = w; if (c.height < h) c.height = h; }
  const [dx, dy] = sp.from, L = Math.abs(dx) * w + Math.abs(dy) * h, cx = w / 2 - (dx * L) / 2, cy = h / 2 - (dy * L) / 2;
  const mk = (c, src, keepNew) => { const q = c.getContext('2d'); q.globalCompositeOperation = 'source-over'; q.clearRect(0, 0, c.width, c.height); q.drawImage(src, 0, 0); q.globalCompositeOperation = keepNew ? 'destination-in' : 'destination-out';
    const gr = q.createLinearGradient(cx, cy, cx + dx * L, cy + dy * L), e = t * 1.3 - 0.15; gr.addColorStop(Math.max(0, Math.min(1, e - 0.15)), 'rgba(0,0,0,1)'); gr.addColorStop(Math.max(0, Math.min(1, e + 0.15)), 'rgba(0,0,0,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); };
  mk(tmpA, sp.prev.canvas, false); mk(tmpB, sp.canvas, true);
  g.globalAlpha = alpha; g.drawImage(tmpA, 0, 0, w, h, sp.x0, sp.y0, sp.w, sp.h); g.drawImage(tmpB, 0, 0, w, h, sp.x0, sp.y0, sp.w, sp.h); g.globalAlpha = 1;
}
function visibleWorld() { const [x0, y0] = toWorld(0, 0), [x1, y1] = toWorld(cw, ch); return [x0, y0, x1, y1]; }
const PROF = {}, SKIP = new Set(); let PT = 0; const PM = (k) => { const t = performance.now(); PROF[k] = (PROF[k] ?? 0) + (t - PT); PT = t; };
// The static layers (scene, fills, decoration, wilds, marks, borders, bands, labels) render into a cache 35% larger than the
// view on every side; a pan or a hover only blits it and draws the live overlays (hover, selection, arrows, the path).
const cache = document.createElement('canvas'), cctx = cache.getContext('2d');
let CK = null, zoomingUntil = 0;
const staticSig = () => [state.mode, KEYVER, view.table, view.detail, view.pass, view.reduced, curMonth, fontsReady, dpr, cw, ch, TW_CACHE.size > 0, SPR.size === 0].join('|');
function renderStatic(g, now) {
  const band = bandOf(cam.s);
  g.setTransform(1, 0, 0, 1, 0, 0);
  const covers = (r) => r[0] <= VW[0] && r[1] <= VW[1] && r[2] >= VW[2] && r[3] >= VW[3];
  // T0 to T5: the room, the oak, the props, the cloth (each drawn only where it shows, as strips around the next layer)
  if (SKIP.has('scene')) { g.fillStyle = '#15130F'; g.fillRect(0, 0, g.canvas.width, g.canvas.height); }
  else if (view.table === 'off') { g.fillStyle = '#15130F'; g.fillRect(0, 0, g.canvas.width, g.canvas.height); }
  else {
    const roomShows = !covers(TABLE);
    if (roomShows) {
      if (!covers(ROOM)) { g.fillStyle = '#0E0905'; g.fillRect(0, 0, g.canvas.width, g.canvas.height); }
      worldT(g);
      if (view.table === 'full') blitRing(g, bakeRoom(), ROOM, TABLE);
      else { const [cx, cy] = [(TABLE[0] + TABLE[2]) / 2, (TABLE[1] + TABLE[3]) / 2], rg = g.createRadialGradient(cx, cy, TW * 0.3, cx, cy, TW * 1.1); rg.addColorStop(0, '#2A2018'); rg.addColorStop(1, '#0E0905'); g.fillStyle = rg; g.fillRect(ROOM[0], ROOM[1], ROOM[2] - ROOM[0], ROOM[3] - ROOM[1]); }
    }
    worldT(g); if (!SKIP.has('table')) blitRing(g, bakeTable(), TABLE, CLOTH);
    if (view.table === 'full' && roomShows) { screenT(g); const vg = g.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.35, cw / 2, ch / 2, Math.hypot(cw, ch) * 0.6); vg.addColorStop(0, 'rgba(14,9,5,0)'); vg.addColorStop(1, 'rgba(14,9,5,.5)'); g.fillStyle = vg; g.save(); g.beginPath(); g.rect(0, 0, cw, ch); const [a, b] = toScreen(CLOTH[0], CLOTH[1]), [c, d] = toScreen(CLOTH[2], CLOTH[3]); g.rect(a, b, c - a, d - b); g.clip('evenodd'); g.fillRect(0, 0, cw, ch); g.restore(); }
  }
  worldT(g); if (!SKIP.has('cloth')) blitRing(g, bakeCloth(), CLOTH, [0, 0, W, H]);
  PM('cloth');
  PM('scene');
  // M: the fill layer
  const vw = VW, seen = (bb) => bb[2] > vw[0] && bb[0] < vw[2] && bb[3] > vw[1] - 30 && bb[1] < vw[3] + 10;
  for (const p of provs) { if (!seen(geo(p.i).bb)) continue; pathPoly(g, cells[p.i]); g.fillStyle = fillFor(p); g.fill(); }
  for (const w of WILDS) { g.fillStyle = w.kind === 'peaks' ? '#2A292C' : '#24222A'; for (const c of w.cells) { pathPoly(g, cells[c]); g.fill(); } }
  PM('fills');
  // the decoration layer (Ownership mode; faded out in data modes)
  if (decoAlpha > 0.001 && !SKIP.has('deco')) {
    bakeBudgetEnd = firstPaint ? Infinity : performance.now() + 12;
    if (band === 'near') bakeMissing(provsByY.filter((p) => seen(geo(p.i).bb)).map((p) => p.i), band, now);
    const C = band !== 'near' && !animatingSprites(now) ? decoComposite(band, now) : null;
    if (C) { g.globalAlpha = decoAlpha; blitRegion(g, C, C.x0, C.y0, C.x0 + C.w, C.y0 + C.h); g.globalAlpha = 1; }
    else for (const p of provsByY) {
      const G = geo(p.i); if (!seen(G.bb)) continue;
      const sp = provSprite(p.i, band, now); if (!sp) continue;
      if (sp.prev && now - sp.t0 < 600) {
        const t = (now - sp.t0) / 600; animating = true;
        if (view.wipe && sp.from) wipeDraw(g, sp, t, decoAlpha);
        else { g.globalAlpha = decoAlpha * (1 - t); blitW(g, sp.prev); g.globalAlpha = decoAlpha * t; blitW(g, sp); }
      } else { if (sp.prev) { sp.prev = null; ANIM.delete(p.i); } g.globalAlpha = decoAlpha; blitW(g, sp); }
    }
    g.globalAlpha = 1;
  }
  PM('deco');
  // the always-on layer: wilds (every mode, every band), information marks, borders, bands
  if (!SKIP.has('wilds')) for (const w of WILDS) blitW(g, wildSprite(w, band));
  PM('wilds');
  if (!SKIP.has('marks')) drawMarks(g, band, now);
  PM('marks');
  const px = 1 / cam.s;
  if (state.mode === 'ownership') { g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 5 * px; for (const p of provs) { pathPoly(g, cells[p.i]); g.stroke(); } }
  g.strokeStyle = '#2B2620'; g.lineWidth = 2 * px;
  for (const p of provs) { const f = fogOf(p.i); if (f) g.setLineDash([2 * px, 3 * px]); else g.setLineDash([]); pathPoly(g, cells[p.i]); g.stroke(); }
  g.setLineDash([]);
  if (state.mode === 'ownership') for (const p of provs) {
    if (!p.owner) continue; const poly = cells[p.i];
    g.save(); pathPoly(g, poly); g.clip(); g.lineWidth = Math.max(5, 11 * cam.s) * px; g.strokeStyle = BAN[p.owner]; g.stroke();
    g.lineWidth = px; g.strokeStyle = p.owner === 'green' ? '#F4EEDF' : '#1C1A17'; g.globalAlpha = 0.7;
    const c = cent[p.i]; g.beginPath(); poly.forEach(([x, y], k) => { const ix = c[0] + (x - c[0]) * 0.86, iy = c[1] + (y - c[1]) * 0.86; k ? g.lineTo(ix, iy) : g.moveTo(ix, iy); }); g.closePath(); g.stroke(); g.restore();
  }
  PM('borders');
  g.strokeStyle = '#1C1A17'; g.lineWidth = 2.5 * px; g.strokeRect(-1, -1, W + 2, H + 2);
  // wild signature: a 3 px ink contour in place of the border, and a light rim inside (ticks on peaks, a keyline on meres)
  for (const w of WILDS) {
    const G = wgeo(w), full = view.pass;
    if (w.kind === 'mere') { g.save(); g.beginPath(); for (const c of w.cells) pathPoly(g, cells[c]); g.clip(); g.strokeStyle = `rgba(233,228,216,${full ? 1 : 0.7})`; g.lineWidth = 7 * px; g.beginPath(); for (const e of G.edges) { g.moveTo(...e.a); g.lineTo(...e.b); } g.stroke(); g.restore(); }
    else { g.strokeStyle = `rgba(233,228,216,${full ? 1 : 0.85})`; g.lineWidth = 1.3 * px; g.beginPath(); for (const t of G.ticks[band]) { g.moveTo(t[0], t[1]); g.lineTo(t[2], t[3]); } g.stroke(); }
    g.strokeStyle = '#1C1A17'; g.lineWidth = 3 * px; g.lineCap = 'round'; g.beginPath(); for (const e of G.edges) { g.moveTo(...e.a); g.lineTo(...e.b); } g.stroke(); g.lineCap = 'butt';
    if (view.pass) { g.strokeStyle = '#E9E4D8'; g.lineWidth = 4 * px; g.beginPath(); for (const e of G.edges) { g.moveTo(...e.a); g.lineTo(...e.b); } g.stroke(); }
  }
  // review overlay: hatch every province Varo cannot reach
  if (view.pass) {
    g.save(); g.beginPath(); for (const p of provs) if (p.i !== cmd.varo.at && !pathTo(cmd.varo.at, p.i)) { const poly = cells[p.i]; poly.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); } g.clip();
    g.strokeStyle = 'rgba(28,26,23,.55)'; g.lineWidth = 1.6 * px; g.beginPath(); for (let d = -H; d < W + H; d += 9 * px) { g.moveTo(d, 0); g.lineTo(d + H, H); } g.stroke(); g.restore();
  }
  screenT(g);
  if (!SKIP.has('labels')) drawLabels(g, band);
  g.setTransform(1, 0, 0, 1, 0, 0);
}
const REB = { n: 0, ms: 0, why: '' };
function renderCache(now, sig, why) {
  const m = 0.35, vw = cw * (1 + 2 * m), vh = ch * (1 + 2 * m), W2 = Math.round(vw * dpr), H2 = Math.round(vh * dpr);
  if (cache.width !== W2 || cache.height !== H2) { cache.width = W2; cache.height = H2; }
  const sx = cam.x, sy = cam.y, scw = cw, sch = ch;
  cam.x += m * cw; cam.y += m * ch; cw = vw; ch = vh; VW = visibleWorld(); bakesPending = false;
  const t0 = performance.now(); renderStatic(cctx, now); REB.n++; REB.ms += performance.now() - t0; REB.why = why;
  CK = { sig, s: cam.s, wx0: -cam.x / cam.s, wy0: -cam.y / cam.s, ww: vw / cam.s, wh: vh / cam.s, pending: bakesPending };
  cam.x = sx; cam.y = sy; cw = scw; ch = sch; VW = visibleWorld();
}
function draw() {
  const now = performance.now(); PT = now; animating = false;
  let decoAnim = false;
  if (decoAlpha !== decoTo) { const t = view.reduced ? 1 : Math.min(1, (now - decoT0) / 150); decoAlpha = decoFrom + (decoTo - decoFrom) * t; if (t < 1) { animating = true; decoAnim = true; } }
  VW = visibleWorld();
  const band = bandOf(cam.s), sig = staticSig();
  const inside = CK && VW[0] >= CK.wx0 && VW[1] >= CK.wy0 && VW[2] <= CK.wx0 + CK.ww && VW[3] <= CK.wy0 + CK.wh;
  const spritesAnim = ANIM.size > 0 && animatingSprites(now);
  const zooming = CK && cam.s !== CK.s && now < zoomingUntil && inside;
  if (!CK || CK.sig !== sig || decoAnim || spritesAnim || CK.pending || !inside || (cam.s !== CK.s && !zooming)) renderCache(now, sig, !CK ? 'none' : CK.sig !== sig ? 'sig ' + CK.sig + ' > ' + sig : decoAnim ? 'deco' : spritesAnim ? 'sprites' : CK.pending ? 'pending' : !inside ? 'outside' : 'scale');
  if (spritesAnim) animating = true;
  if (zooming) setTimeout(requestDraw, zoomingUntil - now + 10);
  PM('static');
  const g = ctx; g.setTransform(1, 0, 0, 1, 0, 0);
  if (zooming) { g.fillStyle = '#0E0905'; g.fillRect(0, 0, canvas.width, canvas.height); }
  worldT(g); g.drawImage(cache, CK.wx0, CK.wy0, CK.ww, CK.wh);
  PM('blit');
  const px = 1 / cam.s;
  const hw = hoverProv >= 0 && isWild(hoverProv) ? wildOf[hoverProv] : null;
  if (hw) { // hover brightens the wild's rim to 100%
    const G = wgeo(hw);
    if (hw.kind === 'mere') { g.save(); g.beginPath(); for (const c of hw.cells) pathPoly(g, cells[c]); g.clip(); g.strokeStyle = '#E9E4D8'; g.lineWidth = 7 * px; g.beginPath(); for (const e of G.edges) { g.moveTo(...e.a); g.lineTo(...e.b); } g.stroke(); g.restore(); }
    else { g.strokeStyle = '#E9E4D8'; g.lineWidth = 1.3 * px; g.beginPath(); for (const t of G.ticks[band]) { g.moveTo(t[0], t[1]); g.lineTo(t[2], t[3]); } g.stroke(); }
    g.strokeStyle = '#1C1A17'; g.lineWidth = 3 * px; g.lineCap = 'round'; g.beginPath(); for (const e of G.edges) { g.moveTo(...e.a); g.lineTo(...e.b); } g.stroke(); g.lineCap = 'butt';
  }
  if (hoverProv >= 0 && !isWild(hoverProv)) { pathPoly(g, cells[hoverProv]); g.lineWidth = 2 * px; g.strokeStyle = 'rgba(244,238,223,.55)'; g.stroke(); }
  if (state.sel && state.sel.type === 'prov') { pathPoly(g, cells[state.sel.id]); g.lineWidth = 3 * px; g.strokeStyle = '#F4EEDF'; g.stroke(); }
  // transit arrows and the path preview (a thread with square brass tacks and day plates)
  screenT(g);
  if (!cmd.ilsa.hidden && cmd.ilsa.eta > 0) arrow(g, cent[cmd.ilsa.at], cent[cmd.ilsa.to], '#9FE0C2', `${cmd.ilsa.eta}d`);
  if (moveLine) thread(g, moveLine);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  present(now, true);
  if (!SKIP.has('badges')) placeBadges(band);
  PM('badges');
  updateZoomChip(band);
  firstPaint = false;
  if (animating || (CK && CK.pending)) requestDraw();
}
let ambDirty = [];
function present(now, all) { // the overlay canvas: the two mirror props and the ambience, redrawn alone at up to 30 fps
  const g = actx; g.setTransform(1, 0, 0, 1, 0, 0);
  if (all) g.clearRect(0, 0, amb.width, amb.height); else for (const r of ambDirty) g.clearRect(r[0], r[1], r[2], r[3]);
  ambDirty = [];
  if (view.table !== 'full') return;
  const live = ambienceOn(), t = now / 1000;
  const rectOf = (x0, y0, x1, y1) => { const [a, b] = toScreen(x0, y0), [c, d] = toScreen(x1, y1); const r = [Math.floor(a * dpr) - 2, Math.floor(b * dpr) - 2, Math.ceil((c - a) * dpr) + 4, Math.ceil((d - b) * dpr) + 4]; return r[0] < amb.width && r[1] < amb.height && r[0] + r[2] > 0 && r[1] + r[3] > 0 ? r : null; };
  const cRect = rectOf(PROPS.candle[0] - 60, PROPS.candle[1] - 110, PROPS.candle[0] + 60, PROPS.candle[1] + 40), hRect = rectOf(PROPS.hourglass[0] - 50, PROPS.hourglass[1] - 50, PROPS.hourglass[0] + 50, PROPS.hourglass[1] + 50);
  const gRect = live ? rectOf(HEARTH[0] - 620, HEARTH[1] - 620, HEARTH[0] + 620, HEARTH[1] + 620) : null, mRect = live ? rectOf(WINDOW[0] - 40, WINDOW[1] - 120, WINDOW[0] + 600, WINDOW[1] + 900) : null;
  if (!cRect && !hRect && !gRect && !mRect) return;
  worldT(g); g.save(); g.beginPath(); g.rect(ROOM[0], ROOM[1], ROOM[2] - ROOM[0], ROOM[3] - ROOM[1]); g.rect(CLOTH[0], CLOTH[1], CLOTH[2] - CLOTH[0], CLOTH[3] - CLOTH[1]); g.clip('evenodd');
  if (gRect) { const a = 0.04 * (1 + Math.cos((2 * Math.PI * t) / 7)), [hx, hy] = HEARTH, hg = g.createRadialGradient(hx, hy, 10, hx, hy, 620); hg.addColorStop(0, `rgba(255,137,14,${a})`); hg.addColorStop(1, 'rgba(255,137,14,0)'); g.fillStyle = hg; g.fillRect(hx - 620, hy - 620, 1240, 1240); ambDirty.push(gRect); }
  if (mRect) { const R = rngFor('motes'); for (let k = 0; k < 12; k++) { const bx = WINDOW[0] + 60 + R() * 400, by = WINDOW[1] + 60 + R() * 700, sp = 3 / cam.s + R() * 1.5 / cam.s, ph = R() * 1000; const x = bx + ((t * sp + ph) % 120) - 60, y = by - ((t * sp * 0.6 + ph) % 80); g.fillStyle = `rgba(242,235,221,${0.3 + 0.15 * Math.sin(t + k)})`; ellipse(g, x, y, 2 / cam.s + 1.5, 2 / cam.s + 1.5); g.fill(); } ambDirty.push(mRect); }
  if (cRect) { drawCandle(g, t, live); ambDirty.push(cRect); }
  if (hRect) { drawHourglass(g, t, live); ambDirty.push(hRect); }
  g.restore();
}
function tableOnScreen() { const [a, b] = toScreen(CLOTH[0], CLOTH[1]), [c, d] = toScreen(CLOTH[2], CLOTH[3]); return a > 0 || b > 0 || c < cw || d < ch; }
function ambienceOn() { return view.table === 'full' && view.detail === 'full' && !view.reduced && !document.hidden && scrim.hidden && tableOnScreen(); }
function arrow(g, a, b, color, label) {
  const [ax, ay] = toScreen(...a), [bx, by] = toScreen(...b);
  g.save(); g.strokeStyle = color; g.lineWidth = 3; g.setLineDash([8, 6]); g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); g.setLineDash([]);
  const ang = Math.atan2(by - ay, bx - ax); g.fillStyle = color; g.beginPath(); g.moveTo(bx, by); g.lineTo(bx - 12 * Math.cos(ang - 0.4), by - 12 * Math.sin(ang - 0.4)); g.lineTo(bx - 12 * Math.cos(ang + 0.4), by - 12 * Math.sin(ang + 0.4)); g.closePath(); g.fill();
  if (label) { const mx = (ax + bx) / 2, my = (ay + by) / 2; g.fillStyle = 'rgba(20,18,15,.9)'; roundRect(g, mx - 16, my - 10, 32, 20, 4); g.fill(); g.fillStyle = '#F4EEDF'; g.font = `600 12px 'IBM Plex Sans Condensed', sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, mx, my + 1); }
  g.restore();
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function thread(g, ml) {
  const pts3 = [cent[ml.from], ...ml.path.map((v) => cent[v])].map((q) => toScreen(...q));
  g.save(); g.lineJoin = 'round';
  g.setLineDash([8, 6]); g.strokeStyle = '#1C1A17'; g.lineWidth = 5; g.beginPath(); pts3.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
  g.strokeStyle = '#F4EEDF'; g.lineWidth = 3; g.stroke(); g.setLineDash([]);
  let days = 0;
  g.font = `600 11.5px 'IBM Plex Sans Condensed', sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  ml.path.forEach((v, k) => {
    days += DAYS[prov[v].terrain]; const [x, y] = pts3[k + 1], last = k === ml.path.length - 1;
    g.save(); g.translate(x, y); g.rotate(Math.PI / 4); g.fillStyle = '#B8914A'; g.fillRect(-3.5, -3.5, 7, 7); g.strokeStyle = '#1C1A17'; g.lineWidth = 1; g.strokeRect(-3.5, -3.5, 7, 7); g.restore();
    const lbl = last ? `${days}d${ml.around ? ' · around ' + ml.around : ''}` : `${days}d`, tw = g.measureText(lbl).width + 10;
    const ox = last ? Math.max(8, textW(prov[v].name, nameFont(prov[v], labelFs(cam.s))) / 2 + 6) : 7, oy = last ? -14 : -21;
    g.fillStyle = last ? 'rgba(20,18,15,.95)' : 'rgba(20,18,15,.82)'; roundRect(g, x + ox, y + oy, tw, 17, 3); g.fill();
    if (last) { g.strokeStyle = '#B8914A'; g.lineWidth = 1; g.stroke(); }
    g.fillStyle = '#F4EEDF'; g.fillText(lbl, x + ox + tw / 2, y + oy + 9);
  });
  g.restore();
}
// ---- labels: names and the second line; wild names; culled by priority (capitals, Wellsprings, wilds, own, the rest)
const glyphCache = {};
function glyph(g, name, x, y, color) {
  const key = name + color; let img = glyphCache[key];
  if (!img) { img = new Image(); img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(svgIcon(name, 16, color).replace('aria-hidden="true"', 'xmlns="http://www.w3.org/2000/svg"')); img.onload = () => requestDraw(); glyphCache[key] = img; }
  if (img.complete && img.naturalWidth) { g.fillStyle = 'rgba(20,18,15,.7)'; g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.fill(); g.drawImage(img, x - 8, y - 8, 16, 16); }
}
const manaImg = {}; for (const c of 'WUBRG') { manaImg[c] = new Image(); manaImg[c].src = 'data:image/svg+xml;utf8,' + encodeURIComponent(manaSym(c, 18).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')); }
function chipCandle(g, x, y, n, s) {
  g.fillStyle = 'rgba(20,18,15,.82)'; roundRect(g, x - 12, y - 8, 24, 16, 4); g.fill();
  g.fillStyle = n === 'green' ? '#4FB38C' : BAN[n]; g.fillRect(x - 8, y - 3, 3, 8); g.beginPath(); g.arc(x - 6.5, y - 5, 2, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#F4EEDF'; g.font = `600 11px 'IBM Plex Sans Condensed', sans-serif`; g.fillText(String(s), x + 4, y + 1);
}
const LABEL_ORDER = [...provs].sort((a, b) => { const pr = (p) => (p.cap ? 0 : p.well ? 1 : p.owner === 'red' ? 3 : 4); return pr(a) - pr(b); });
function drawLabels(g, band) {
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const fs = labelFs(cam.s), placed = [];
  const fits = (b) => { if (placed.some((q) => b[2] > q[0] && b[0] < q[2] && b[3] > q[1] && b[1] < q[3])) return false; placed.push(b); return true; };
  // token boxes first: no label may sit under an army token
  const byAt = new Map(); for (const c of Object.values(cmd)) if (!c.hidden) byAt.set(c.at, [...(byAt.get(c.at) ?? []), c]);
  for (const [at, list] of byAt) { const [sx, sy] = toScreen(...cent[at]), n = list.length, eta = list.some((c) => c.eta), hw = Math.max(15 * n + 3, eta ? 40 : 0), h = 54 + (eta ? 17 : 0) + (band === 'near' ? 34 : 0); placed.push([sx - hw, sy - 18 - h, sx + hw, sy - 16]); }
  const wildLabels = WILDS.map((w) => { const G = wgeo(w); const f = `italic 400 ${G.nameFs}px 'Alegreya Sans', sans-serif`; const tw = textW(w.name, f) * 1.1; const spots = G.vertical ? [toScreen(...G.labelPt)] : [G.labelAt, ...[...w.cells].sort((a, b) => areaOf[b] - areaOf[a])].flatMap((c) => [[0, 0], [0, 26], [0, -26]].map(([dx, dy]) => { const [sx, sy] = toScreen(...cent[c]); return [sx + dx, sy + dy]; })); return { w, spots, f, tw, fsz: G.nameFs, vertical: G.vertical }; });
  const queue = [];
  for (const p of LABEL_ORDER) { if (p.cap || p.well) queue.push(['p', p]); }
  for (const wl of wildLabels) queue.push(['w', wl]);
  for (const p of LABEL_ORDER) { if (!p.cap && !p.well) queue.push(['p', p]); }
  for (const [kind, it] of queue) {
    if (kind === 'w') {
      const hw = (it.vertical ? it.fsz : it.tw) / 2 + 2, hh = (it.vertical ? it.tw : it.fsz) / 2 + 2;
      const spot = it.spots.find(([x, y]) => { const b = [x - hw, y - hh, x + hw, y + hh]; return !placed.some((q) => b[2] > q[0] && b[0] < q[2] && b[3] > q[1] && b[1] < q[3]); });
      if (!spot) continue; const [lx, ly] = spot; placed.push([lx - hw, ly - hh, lx + hw, ly + hh]);
      g.save(); g.translate(lx, ly); if (it.vertical) g.rotate(-Math.PI / 2);
      g.font = it.f; if ('letterSpacing' in g) g.letterSpacing = '0.08em'; g.fillStyle = '#E9E4D8'; g.fillText(it.w.name, 0, 0); if ('letterSpacing' in g) g.letterSpacing = '0px'; g.restore();
      continue;
    }
    const p = it, [sx, sy] = toScreen(...cent[p.i]);
    if (sx < -80 || sy < -40 || sx > cw + 80 || sy > ch + 40) continue;
    const font = nameFont(p, fs), tw = textW(p.name, font);
    const box = [sx - tw / 2 - 2, sy - 6 - fs / 2 - 1, sx + tw / 2 + 2, sy - 6 + fs / 2 + 1];
    if (!fits(box)) continue;
    g.font = font; g.lineWidth = 3; g.strokeStyle = 'rgba(20,18,15,.85)'; g.strokeText(p.name, sx, sy - 6); g.fillStyle = '#F4EEDF'; g.fillText(p.name, sx, sy - 6);
    if (band === 'far' && !p.cap) continue;
    const hid = fogOf(p.i) === 'unexplored';
    let gx = sx - 14; const gy = sy + 10;
    if (p.dom.n && !hid) { chipCandle(g, gx, gy, p.dom.n, p.dom.s); gx += 26; }
    if (p.unrest >= 25 && p.owner && !hid) { glyph(g, 'fist', gx, gy, '#FFB4A9'); gx += 18; }
    if (p.buildings.length) { glyph(g, 'fort', gx, gy, '#F4EEDF'); gx += 18; }
    if (p.well) { glyph(g, 'well', gx, gy, '#CFE8FF'); gx += 18; }
    for (const fx of p.fx ?? []) { glyph(g, { burn: 'fire', ashrain: 'ash', fertile: 'leaf' }[fx.kind], gx, gy, { burn: '#FFB4A9', ashrain: '#E9E4D8', fertile: '#A6D96A' }[fx.kind]); gx += 18; }
    g.textAlign = 'center';
    if (state.mode === 'springs') p.springs.forEach((c, k) => { const img = manaImg[c]; if (img.complete) g.drawImage(img, sx - 9 + k * 20, sy + 22, 18, 18); });
    if (!hid && (state.mode === 'population' || state.mode === 'unrest' || state.mode === 'supply')) {
      const v = state.mode === 'population' ? (p.pop / 1000).toFixed(1) + 'k' : state.mode === 'unrest' ? p.unrest : Math.round(SUPPLY[p.terrain] + p.pop / 50);
      g.font = `600 12px 'IBM Plex Sans Condensed', sans-serif`; g.lineWidth = 3; g.strokeStyle = 'rgba(20,18,15,.85)'; g.strokeText(String(v), sx, sy + 26); g.fillStyle = '#FFF'; g.fillText(String(v), sx, sy + 26);
    }
  }
}
// ---- always-on information marks: Wellsprings, sieges, pillage, rituals, the battle marker
function drawMarks(g, band, now) {
  const px = 1 / cam.s;
  for (const p of provs) {
    const G = geo(p.i), fog = fogOf(p.i); if (fog === 'unexplored') continue;
    if (!p.well && !p.siege && !p.pillage && !(p.fx && p.fx.length) && !p.scar) continue;
    const st = settlementC(p.i);
    if (p.well) { // the Wellspring monument and its claim state
      const x0 = st.sx - st.rad - 13 * LS, y0 = st.sy + 5; g.save(); g.translate(x0, y0); g.scale(LS, LS); const x = 0, y = 0; g.lineWidth = Math.min(1.2, px * 1.1) / LS; g.strokeStyle = INK;
      if (p.claim === 'red') for (let k = 0; k < 4; k++) { const a = Math.PI + (k / 3) * Math.PI; const qx = x + Math.cos(a) * 9, qy = y + Math.sin(a) * 5; g.fillStyle = '#FD6533'; g.fillRect(qx - 1.3, qy - 6, 2.6, 6); g.strokeRect(qx - 1.3, qy - 6, 2.6, 6); }
      g.fillStyle = '#CFC6B4'; ellipse(g, x, y, 6.5, 3.6); g.fill(); g.stroke(); g.fillStyle = '#7FA9BA'; ellipse(g, x, y - 0.4, 4.2, 2); g.fill();
      g.fillStyle = '#CFE8F0'; for (let k = 0; k < 5; k++) { const a = Math.PI + 0.3 + k * 0.6; ellipse(g, x + Math.cos(a) * 5, y - 4 + Math.sin(a) * 1.5, 0.8, 1.2); g.fill(); }
      g.save(); g.translate(x, y - 10); g.rotate(Math.PI / 4); g.strokeStyle = '#E9E4D8'; g.lineWidth = Math.min(1.4, px * 1.3); g.fillStyle = p.claim === 'red' ? '#FD6533' : 'rgba(0,0,0,0)'; g.fillRect(-2.2, -2.2, 4.4, 4.4); g.strokeRect(-2.2, -2.2, 4.4, 4.4); g.restore();
      if (p.claim === 'running') { g.fillStyle = '#5E4630'; g.fillRect(x + 7, y - 6, 2.4, 6); g.fillStyle = '#E9DFC2'; ellipse(g, x + 8.2, y - 7.3, 1.4, 1.4); g.fill(); g.strokeStyle = '#E9E4D8'; g.lineWidth = Math.min(1.6, px * 1.5) / LS; g.beginPath(); g.arc(x, y - 1, 11, -Math.PI / 2, -Math.PI / 2 + Math.PI); g.stroke(); g.strokeStyle = 'rgba(233,228,216,.3)'; g.beginPath(); g.arc(x, y - 1, 11, Math.PI / 2, Math.PI * 1.5); g.stroke(); }
      g.restore();
    }
    if (p.siege) { // tents in the besieger's banner, a stake ring, a ram; wall states
      const R = rngFor('siege:' + p.i), rx = st.rad + 12, ry = rx * 0.62;
      g.strokeStyle = '#6B4A2B'; g.lineWidth = Math.min(1.2, px); for (let a = 0.2; a < Math.PI * 2; a += 0.22) { const x = st.sx + Math.cos(a) * rx, y = st.sy + Math.sin(a) * ry; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 0.6, y - 2.6); g.stroke(); }
      for (let k = 0; k < 6; k++) { const a = Math.PI * 0.05 + k * 0.4 + R() * 0.1, x = st.sx + Math.cos(a) * (rx + 9), y = st.sy + Math.sin(a) * (ry + 6), q = LS; g.fillStyle = '#FD6533'; g.beginPath(); g.moveTo(x - 3.5 * q, y); g.lineTo(x, y - 5 * q); g.lineTo(x + 3.5 * q, y); g.closePath(); g.fill(); g.strokeStyle = INK; g.lineWidth = Math.min(1, px); g.stroke(); g.beginPath(); g.moveTo(x, y - 5 * q); g.lineTo(x, y); g.stroke(); }
      const gx = st.sx, gy = st.sy + st.rad * 0.62 + 9; g.fillStyle = '#8C6A47'; g.fillRect(gx - 4, gy - 2, 8, 3); g.strokeRect(gx - 4, gy - 2, 8, 3); g.beginPath(); g.moveTo(gx, gy - 2); g.lineTo(gx, gy - 6); g.stroke();
      if (p.siege !== 'intact') { g.strokeStyle = '#1C1A17'; g.lineWidth = Math.min(1.6, px * 1.4); const wr = st.rad + 3, wy = wr * 0.62; for (const a of [0.6, 2.3, 4.1]) { const x = st.sx + Math.cos(a) * wr, y = st.sy + Math.sin(a) * wy; g.beginPath(); g.moveTo(x - 1.5, y - 2.5); g.lineTo(x + 0.5, y - 0.6); g.lineTo(x - 0.6, y + 1.6); g.stroke(); }
        if (p.siege === 'breached') { const a = Math.PI / 2, x = st.sx + Math.cos(a) * wr + 6, y = st.sy + Math.sin(a) * wy; g.fillStyle = '#9A958C'; for (let k = 0; k < 5; k++) { ellipse(g, x - 3 + k * 1.6, y + (k % 2), 1.2, 0.8); g.fill(); } g.fillStyle = 'rgba(28,26,23,.75)'; g.fillRect(x - 3, y - 3, 6, 3); } }
    }
    if (p.pillage) { // two smoke columns and burning roofs
      for (const h of st.houses.slice(-2)) { g.fillStyle = '#FF8A3A'; ellipse(g, h.x, h.y - 3.5 * HSC, 2.2, 1.4); g.fill(); }
      for (const dx of [-5, 6]) { g.strokeStyle = 'rgba(70,66,63,.6)'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(st.sx + dx, st.sy - 6); g.bezierCurveTo(st.sx + dx + 5, st.sy - 16, st.sx + dx - 5, st.sy - 26, st.sx + dx + 3, st.sy - 38); g.stroke(); g.lineCap = 'butt'; }
    }
    for (const fx of p.fx ?? []) {
      const R = rngFor(`fx:${p.i}:${fx.kind}`);
      if (fx.kind === 'burn') { g.save(); pathPoly(g, G.poly); g.clip(); for (let k = 0; k < 7; k++) { const s = G.slots[Math.floor(R() * G.slots.length)]; if (!s) continue; g.fillStyle = 'rgba(43,42,40,.55)'; g.beginPath(); for (let j = 0; j < 9; j++) { const a = (j / 9) * Math.PI * 2, r = 7 + R() * 7; const xx = s.x + Math.cos(a) * r * 1.4, yy = s.y + Math.sin(a) * r * 0.8; j ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.closePath(); g.fill(); } g.restore();
        for (let k = 0; k < 3; k++) { const s = G.slots[Math.floor(R() * G.slots.length)]; if (!s) continue; g.strokeStyle = 'rgba(110,106,100,.6)'; g.lineWidth = Math.min(1.4, px * 1.2); g.beginPath(); g.moveTo(s.x, s.y); g.bezierCurveTo(s.x + 4, s.y - 8, s.x - 4, s.y - 16, s.x + 2, s.y - 26); g.stroke(); } }
      if (fx.kind === 'ashrain') { g.save(); pathPoly(g, G.poly); g.clip(); const [x0, y0, x1, y1] = G.bb; for (let k = 0; k < 110 * fx.step; k++) { const x = x0 + R() * (x1 - x0), y = y0 + R() * (y1 - y0), a = R() * Math.PI; g.fillStyle = k % 3 ? 'rgba(74,71,68,.75)' : 'rgba(233,228,216,.85)'; g.save(); g.translate(x, y); g.rotate(a); g.fillRect(-1.6, -0.8, 3.2, 1.6); g.restore(); } g.restore(); }
      if (fx.kind === 'fertile') { g.strokeStyle = '#7FB04A'; g.lineWidth = Math.min(1.3, px * 1.1); for (const s of G.slots.slice(4, 22)) { g.beginPath(); g.moveTo(s.x, s.y); g.quadraticCurveTo(s.x - 2, s.y - 3, s.x - 3, s.y - 4); g.moveTo(s.x, s.y); g.quadraticCurveTo(s.x + 2, s.y - 3, s.x + 3, s.y - 4.5); g.stroke(); } }
    }
    if (p.scar === 'churned') { const [x, y] = toWorldOff(G.c, 0, -38); g.save(); g.translate(x, y); const k = Math.max(0.7, px * 1.3); g.scale(k, k); g.fillStyle = 'rgba(20,18,15,.85)'; g.beginPath(); g.arc(0, 0, 10, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#F4EEDF'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(-5, -5); g.lineTo(5, 5); g.moveTo(5, -5); g.lineTo(-5, 5); g.moveTo(-5, -5); g.lineTo(-2, -5); g.moveTo(5, -5); g.lineTo(2, -5); g.stroke(); g.restore(); }
  }
}
const toWorldOff = (c, dx, dy) => [c[0] + dx / Math.max(cam.s, 0.5), c[1] + dy / Math.max(cam.s, 0.5)];
// ---- army tokens: painted wood, a contact shadow; standees at Near
const TOKEN_COL = { red: ['#FD6533', '#2A0A04', '#7A1E12'], green: ['#00674B', '#DFF5E8', '#244F22'], indep: ['#91A092', '#1C1A17', '#5E6A60'] };
function standeeSVG(side, cloaked) {
  const [f] = TOKEN_COL[side], body = cloaked ? '#5E6A60' : shadeL(f, -10);
  return cloaked ? `<svg class="standee" width="26" height="40" viewBox="0 0 26 40"><ellipse cx="13" cy="38" rx="9" ry="2" fill="rgba(0,0,0,.3)"/><path d="M13 3c4 0 6 3 6 7l4 27H3l4-27c0-4 2-7 6-7z" fill="${body}" stroke="#1C1A17" stroke-opacity=".7" stroke-width="1.4"/><path d="M9 9c1-3 7-3 8 0v4c-2-1-6-1-8 0z" fill="#2B2A28"/></svg>`
    : `<svg class="standee" width="26" height="40" viewBox="0 0 26 40"><ellipse cx="13" cy="38" rx="9" ry="2" fill="rgba(0,0,0,.3)"/><path d="M8 18h10l2 18H6z" fill="${body}" stroke="#1C1A17" stroke-opacity=".7" stroke-width="1.3"/><circle cx="13" cy="12" r="5" fill="${shadeL(f, 8)}" stroke="#1C1A17" stroke-opacity=".7" stroke-width="1.3"/><path d="M7.5 11c0-5 11-5 11 0z" fill="#4A4744" stroke="#1C1A17" stroke-width="1"/><path d="M6 20l-3 10M20 20l3 9" stroke="#1C1A17" stroke-opacity=".7" stroke-width="2.2" stroke-linecap="round"/><path d="M22 6v25" stroke="#5E4630" stroke-width="1.6"/></svg>`;
}
function badgeSVG(side, sel) {
  const [f, ink] = TOKEN_COL[side], hi = shadeL(f, 12), sym = side === 'red' ? MANA.R.shape : side === 'green' ? MANA.G.shape : '<path d="M7 12h10M12 7v10"/>';
  return `<svg width="30" height="36" viewBox="0 0 30 36"><ellipse cx="15" cy="33.5" rx="10" ry="2.4" fill="rgba(0,0,0,.25)"/><path d="M15 2l12 4v9c0 8-5.5 13-12 16C8.5 28 3 23 3 15V6z" fill="${f}" stroke="${sel ? '#fff' : 'rgba(28,26,23,.7)'}" stroke-width="${sel ? 2 : 1.5}"/><path d="M4.2 6.6L15 3.1l10.8 3.5" fill="none" stroke="${hi}" stroke-width="1"/><g transform="translate(8 7) scale(.58)" fill="none" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">${sym}</g></svg>`;
}
let badgeSig = '', badgeEls = [];
function placeBadges(band) { // tokens are rebuilt only when what they show changes; a pan only moves them
  const byProv = {};
  for (const c of Object.values(cmd)) if (!c.hidden) (byProv[c.at] ??= []).push(c);
  const near = band === 'near';
  if (near) for (const p of provs) if (p.owner === null && p.indep && !fogOf(p.i) && nbrs(p.i).some((w) => prov[w].owner === 'red') && !byProv[p.i]) (byProv[p.i] ??= []).push({ id: 'indep' + p.i, side: 'indep', squads: [], indepOf: p });
  const sig = [band, state.sel ? state.sel.id : '', curMonth, ...Object.entries(byProv).map(([at, l]) => at + ':' + l.map((c) => c.id + ':' + (c.eta ?? '') + ':' + c.squads.length).join(','))].join('|');
  if (sig !== badgeSig) {
    badgeSig = sig; layer.innerHTML = ''; badgeEls = [];
    for (const [at, list] of Object.entries(byProv)) list.forEach((c, k) => {
      const troops = c.squads.reduce((n, s) => n + s[1], 0);
      const el = document.createElement('div'); el.className = 'badge' + (state.sel && state.sel.id === c.id ? ' sel' : '') + (c.side === 'indep' ? ' indep' : '');
      const word = c.indepOf ? (c.indepOf.indep < 15 ? 'weak' : c.indepOf.indep < 25 ? 'moderate' : 'strong') : null;
      el.innerHTML = (near ? standeeSVG(c.side, !!c.indepOf) : '') + badgeSVG(c.side, state.sel && state.sel.id === c.id) + `<span class="plate" style="background:${TOKEN_COL[c.side][2]}">${word ?? (troops || (c.crown ? '♛' : '·'))}</span>` + (c.eta ? `<span class="eta">${c.eta}d ▸ ${prov[c.to].name}</span>` : '');
      if (c.indepOf) { el.dataset.tip = 'prov:' + at; el.setAttribute('aria-label', `Independents in ${c.indepOf.name}, ${word}`); }
      else { el.dataset.tip = 'cmd:' + c.id; el.tabIndex = 0; el.setAttribute('role', 'button'); el.setAttribute('aria-label', `${cname(c)}, ${troops} troops`); el.addEventListener('click', (e) => { e.stopPropagation(); selectCmd(c.id); }); }
      layer.appendChild(el); badgeEls.push({ el, at: Number(at), k, n: list.length });
    });
  }
  for (const b of badgeEls) {
    const [sx, sy] = toScreen(...cent[b.at]), off = sx < -40 || sx > cw + 40 || sy < -20 || sy > ch + 80;
    b.el.style.display = off ? 'none' : '';
    if (!off) { b.el.style.left = sx + (b.k - (b.n - 1) / 2) * 30 + 'px'; b.el.style.top = sy - 18 - 44 + 'px'; }
  }
}
function updateZoomChip(band) { const z = document.getElementById('zoomChip'); if (z) z.textContent = 'Zoom: ' + band[0].toUpperCase() + band.slice(1); }
