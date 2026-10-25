'use strict';
// ---- the camera (design section 10): automatic framing, a pure function of story time ----

function safeRect(W, H) {
  const ui = clamp(Math.min(W / 1920, H / 1080), 0.75, 1.25);
  const phone = W < 700, flat = !phone && H < 500; // phone landscape: the HUD rows are compact (critique fix 10)
  const top = phone ? 54 : flat ? 46 : 64 * ui, bottom = phone ? 96 : flat ? 82 : 112 * ui;
  return { x0: 0, y0: top, x1: W, y1: H - bottom };
}
/** Pixels per world unit that fit a box into the safe rect. */
function fitZoom(box, R) {
  return Math.min((R.x1 - R.x0) / Math.max(1, box.x1 - box.x0), (R.y1 - R.y0) / Math.max(1, box.y1 - box.y0));
}

/** Camera timing grows with speed above 1.5x, so keys and eases last as long in real time (critique fix 7). */
function camPace(speed) { return Math.max(1, (speed || 1) / 1.5); }
/**
 * A key's action box grown by every living, unrouted commander near it, so the generals the owner approved stay in
 * frame and above the card bar (stage B critique fix 7). Still a pure function of story time.
 */
function commandersInBox(T, k, q) {
  const box = { ...k.box }, reach = Math.max(240, k.box.y1 - k.box.y0); // a close beat still keeps the generals a few ranks behind it
  box.cmd = false;
  for (const G of T.G) {
    if (!G.g.isCmd || G.g.size >= 3 || k.t < G.appear || (G.leaveT !== null && k.t >= G.leaveT)) continue;
    const f = T.F[G.figs[0]];
    if ((f.death && k.t >= f.death.t) || (f.rout && k.t >= f.rout.t)) continue;
    figPos(T, f, k.t, q);
    const X = sx(q.x, q.y), Y = sy(q.x, q.y, q.h);
    if (X < box.x0 - reach || X > box.x1 + reach || Y < box.y0 - reach || Y > box.y1 + reach) continue;
    // his figure and banner, with room below his feet so a few steps do not take him under the card bar
    box.x0 = Math.min(box.x0, X - 18); box.x1 = Math.max(box.x1, X + 18); box.y0 = Math.min(box.y0, Y - 52); box.y1 = Math.max(box.y1, Y + 26);
    box.cmd = true;
  }
  return box;
}
/** Whether a screen-plane box lies inside what a camera key shows of the safe rect. */
function boxInView(box, key, R) {
  const hw = (R.x1 - R.x0) / 2 / key.z, hh = (R.y1 - R.y0) / 2 / key.z;
  return box.x0 >= key.cx - hw && box.x1 <= key.cx + hw && box.y0 >= key.cy - hh && box.y1 <= key.cy + hh;
}
function buildCameraKeys(T, W, H, speed) {
  const pace = camPace(speed);
  const R = safeRect(W, H);
  const fScale = W >= 700 ? W / 1920 : Math.max(W / 1920, 0.42);
  const fMin = 18 * fScale, fMax = 48 * fScale;
  const zAll = clamp(fitZoom(T.allBox, R), fMin / 28, fMax / 28);
  const center = (b) => ({ x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2 });
  const keys = [];
  const first = { t: 0, cx: center(T.allBox).x, cy: center(T.allBox).y, z: zAll };
  keys.push(first);
  let last = first;
  const q = { x: 0, y: 0, h: 0 };
  for (const k of T.camera) {
    if (k.t < 2.6) continue;
    const box = commandersInBox(T, k, q);
    let z = clamp(fitZoom(box, R), zAll, 2.2 * zAll); // dense blocks: follow closer (critique fix 3)
    z = Math.min(z, fMax / 28);
    if (k.hold) z = Math.min(z * 1.25, fMax / 28 * 1.1, 2.0 * zAll, box.cmd ? Math.max(z, fitZoom(box, R)) : Infinity); // a hold leans in, but not past its commanders
    const c = center(box);
    const cand = { t: k.t, cx: c.x, cy: c.y, z, hold: k.hold };
    const moved = Math.hypot(cand.cx - last.cx, cand.cy - last.cy) / ((R.x1 - R.x0) / last.z);
    if (!k.hold && k.t - last.t < 1.4 * pace) continue;
    if (!k.hold && moved < 0.08 && Math.abs(cand.z / last.z - 1) < 0.08 && (!box.cmd || boxInView(box, last, R))) continue;
    keys.push(cand); last = cand;
  }
  // each key eases over 0.8 s (times the pace) from wherever the camera is at its time
  const ease = 0.8 * pace;
  for (let i = 1; i < keys.length; i++) {
    const s = camAtKeys(keys, i - 1, keys[i].t, ease);
    keys[i].from = s;
  }
  keys[0].from = { cx: first.cx, cy: first.cy, z: first.z };
  return { keys, zAll, R, fMin, fMax, ease, pace };
}
function camAtKeys(keys, i, t, ease) {
  const k = keys[i];
  if (!k.from || i === 0) return { cx: k.cx, cy: k.cy, z: k.z };
  const q = smooth((t - k.t) / (ease || 0.8));
  return { cx: lerp(k.from.cx, k.cx, q), cy: lerp(k.from.cy, k.cy, q), z: lerp(k.from.z, k.z, q) };
}
/** cameraAt(t): pure, continuous (cuts under reduced motion). */
function cameraAt(C, t, reduced) {
  const keys = C.keys;
  let i = 0;
  for (let j = keys.length - 1; j >= 0; j--) if (keys[j].t <= t) { i = j; break; }
  if (reduced) return { cx: keys[i].cx, cy: keys[i].cy, z: keys[i].z };
  return camAtKeys(keys, i, t, C.ease);
}
