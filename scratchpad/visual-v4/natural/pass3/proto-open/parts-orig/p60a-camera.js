
// ------------------------------------------------------------------ the camera: the view rect, the scales, the fit and the start view, clamping, zoom, easing
function rlControlsLeft() { // the mode column's left edge (canvas px), the zoom band and Fit included, 6 px of air; null when it is not over the map
  const els = [...document.querySelectorAll('#modes .modebtn, #modes .fitrow')].filter((e) => e.offsetParent); if (!els.length || !canvas) return null; const cr = canvas.getBoundingClientRect();
  return Math.min(...els.map((e) => e.getBoundingClientRect().left)) - cr.left - 6;
}
function viewRect(full) { // the part of the map the panels leave uncovered (full: the mode column counted as view, for the room clamp)
  const shown = (id) => { const el = document.getElementById(id); return el && !el.hidden && getComputedStyle(el).display !== 'none' ? el : null; };
  const phone = app.classList.contains('phone'), ld = shown('leftDock'), rd = shown('rightDock'), rail = shown('rail');
  const l = ld && !phone ? ld.offsetWidth : 0;
  let r = cw - (rd && !rd.classList.contains('fly') ? rd.offsetWidth : 0) - (rail ? rail.offsetWidth : 0);
  if (RELIEF() && !phone && !full) { const cl = rlControlsLeft(); if (cl != null && cl > l + 240 && cl < r) r = cl; } // pass 2: the view ends at the mode column (names and towns kept clear of it)
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
  const FB = RELIEF() ? MODEL_BOX : CLOTH; // v4: the model (with its south cliff and plaque) fits inside a 32 px oak band
  fitScale = Math.min((vw - 64) / (FB[2] - FB[0]), (vh - 64) / (FB[3] - FB[1]));
  minScale = Math.min(fitScale * 0.9, Math.max(0.75 * Math.min(vw / TW, vh / TH), vw / (ROOM[2] - ROOM[0]), vh / (ROOM[3] - ROOM[1])));
  maxScale = 420 / MED_DIAM;
  if (RELIEF() && app.classList.contains('phone')) minScale = Math.max(minScale, fitScale); // pass-2 critique fix 6a: the phone's least zoom is Fit (at 390 x 844 the model was 160 x 100 px, 17.6 px a province)
}
function fit() { // v3: the cloth fits the unobscured area with a 32 px oak band; a phone starts closer, on the selected army. v4 relief: the start view (natural §10 defect 6)
  resize(); computeScales();
  const v = viewRect(), phone = app.classList.contains('phone');
  if (RELIEF()) { const s = startScale(), [fx, fy] = phone ? cent[cmd.varo.at] : startCenter(s); cam.s = s; cam.x = (v.l + v.r) / 2 - fx * s; cam.y = (v.t + v.b) / 2 - fy * s; clampCam(); return; }
  const s = phone ? Math.max(fitScale, 0.5) : fitScale;
  const FB = CLOTH, [fx, fy] = phone ? cent[cmd.varo.at] : [(FB[0] + FB[2]) / 2, (FB[1] + FB[3]) / 2];
  cam.s = s; cam.x = (v.l + v.r) / 2 - fx * s; cam.y = (v.t + v.b) / 2 - fy * s; clampCam();
}
// natural §10 defect 6: windows of 1280 x 720 and smaller started at Far (55 to 63 px a province). The start view is at least 96 px a province (Mid), centred on the
// capital and clamped so the view stays on the model (or centred on it where the model is the smaller). fitScale stays the lean-back fit; Z returns to the start view.
const startScale = () => (RELIEF() ? Math.max(fitScale, RL_P.startDpx / MED_DIAM) : fitScale);
function startCenter(s) {
  const v = viewRect(), hw = (v.r - v.l) / 2 / s, hh = (v.b - v.t) / 2 / s, B = MODEL_BOX, [kx, ky] = cent[redCap];
  const cl = (c, a, b, h) => (b - a <= 2 * h ? (a + b) / 2 : Math.max(a + h, Math.min(b - h, c)));
  return [cl(kx, B[0], B[2], hw), cl(ky, B[1], B[3], hh)];
}
function clampCam() { // the view's center stays inside the table, and the view never shows the void beyond the room
  const v = viewRect(true); /* pass 2: the room under the mode column is still view here (no void strip behind it) */ const cx = ((v.l + v.r) / 2 - cam.x) / cam.s, cy = ((v.t + v.b) / 2 - cam.y) / cam.s;
  const hw = (v.r - v.l) / 2 / cam.s, hh = (v.b - v.t) / 2 / cam.s;
  const rng = (lo, hi, rlo, rhi, mid) => { const a = Math.max(lo, rlo), b = Math.min(hi, rhi); return a <= b ? [a, b] : [mid, mid]; };
  const [xa, xb] = rng(TABLE[0], TABLE[2], ROOM[0] + hw, ROOM[2] - hw, (TABLE[0] + TABLE[2]) / 2), [ya, yb] = rng(TABLE[1], TABLE[3], ROOM[1] + hh, ROOM[3] - hh, (TABLE[1] + TABLE[3]) / 2);
  const nx = Math.max(xa, Math.min(xb, cx)), ny = Math.max(ya, Math.min(yb, cy));
  cam.x += (cx - nx) * cam.s; cam.y += (cy - ny) * cam.s;
}
function zoomAt(mx, my, ns) { ns = Math.max(minScale, Math.min(maxScale, ns)); const k = ns / cam.s; cam.x = mx - (mx - cam.x) * k; cam.y = my - (my - cam.y) * k; cam.s = ns; clampCam(); }
const toScreen = (x, y) => [x * cam.s + cam.x, y * cam.s + cam.y];
const toWorld = (sx, sy) => [(sx - cam.x) / cam.s, (sy - cam.y) / cam.s];
function animateCam(s1, center) { // the detent and Fit: ease over 200 ms (instant under reduced motion)
  const v = viewRect(), mx = (v.l + v.r) / 2, my = (v.t + v.b) / 2;
  const s0 = cam.s, [wx0, wy0] = toWorld(mx, my), [wx1, wy1] = center ?? [wx0, wy0], t0 = performance.now(), ms = view.reduced ? 0 : 200;
  const step = (now) => {
    const t = ms ? Math.min(1, (now - t0) / ms) : 1, e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    cam.s = s0 + (s1 - s0) * e; const wx = wx0 + (wx1 - wx0) * e, wy = wy0 + (wy1 - wy0) * e; cam.x = mx - wx * cam.s; cam.y = my - wy * cam.s; clampCam(); draw();
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const fitToCloth = () => { if (RELIEF()) { const s = startScale(); animateCam(s, startCenter(s)); return; } const FB = CLOTH; animateCam(fitScale, [(FB[0] + FB[2]) / 2, (FB[1] + FB[3]) / 2]); }; // Z: the start view (relief), the cloth (v3)
