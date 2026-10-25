'use strict';
// ---- the camera (design section 10): automatic framing, a pure function of story time ----

function safeRect(W, H) {
  const ui = clamp(Math.min(W / 1920, H / 1080), 0.75, 1.25);
  const phone = W < 700;
  const top = (phone ? 54 : 64) * (phone ? 1 : ui), bottom = (phone ? 96 : 112) * (phone ? 1 : ui);
  return { x0: 0, y0: top, x1: W, y1: H - bottom };
}
/** Pixels per world unit that fit a box into the safe rect. */
function fitZoom(box, R) {
  return Math.min((R.x1 - R.x0) / Math.max(1, box.x1 - box.x0), (R.y1 - R.y0) / Math.max(1, box.y1 - box.y0));
}

function buildCameraKeys(T, W, H) {
  const R = safeRect(W, H);
  const fScale = W >= 700 ? W / 1920 : Math.max(W / 1920, 0.42);
  const fMin = 18 * fScale, fMax = 48 * fScale;
  const zAll = clamp(fitZoom(T.allBox, R), fMin / 28, fMax / 28);
  const center = (b) => ({ x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2 });
  const keys = [];
  const first = { t: 0, cx: center(T.allBox).x, cy: center(T.allBox).y, z: zAll };
  keys.push(first);
  let last = first;
  for (const k of T.camera) {
    if (k.t < 2.6) continue;
    let z = clamp(fitZoom(k.box, R), zAll, 1.6 * zAll);
    z = Math.min(z, fMax / 28);
    if (k.hold) z = Math.min(z * 1.25, fMax / 28 * 1.1, 2.0 * zAll);
    const c = center(k.box);
    const cand = { t: k.t, cx: c.x, cy: c.y, z, hold: k.hold };
    const moved = Math.hypot(cand.cx - last.cx, cand.cy - last.cy) / ((R.x1 - R.x0) / last.z);
    if (!k.hold && k.t - last.t < 1.4) continue;
    if (!k.hold && moved < 0.08 && Math.abs(cand.z / last.z - 1) < 0.08) continue;
    keys.push(cand); last = cand;
  }
  // each key eases over 0.8 s from wherever the camera is at its time
  for (let i = 1; i < keys.length; i++) {
    const s = camAtKeys(keys, i - 1, keys[i].t);
    keys[i].from = s;
  }
  keys[0].from = { cx: first.cx, cy: first.cy, z: first.z };
  return { keys, zAll, R, fMin, fMax };
}
function camAtKeys(keys, i, t) {
  const k = keys[i];
  if (!k.from || i === 0) return { cx: k.cx, cy: k.cy, z: k.z };
  const q = smooth((t - k.t) / 0.8);
  return { cx: lerp(k.from.cx, k.cx, q), cy: lerp(k.from.cy, k.cy, q), z: lerp(k.from.z, k.z, q) };
}
/** cameraAt(t): pure, continuous (cuts under reduced motion). */
function cameraAt(C, t, reduced) {
  const keys = C.keys;
  let i = 0;
  for (let j = keys.length - 1; j >= 0; j--) if (keys[j].t <= t) { i = j; break; }
  if (reduced) return { cx: keys[i].cx, cy: keys[i].cy, z: keys[i].z };
  return camAtKeys(keys, i, t);
}
