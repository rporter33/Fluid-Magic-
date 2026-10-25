'use strict';
// ---- utilities: hashing, seeded streams, easing, projection (design section 3.1) ----
// The replay never uses an unseeded random source or the wall clock. Every choice comes from a
// stream keyed by (battle id, purpose) or from hash32 of a stable key.

const TAU = Math.PI * 2;

function hash32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}
function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** docs/12 streamFor(battle, purpose): one independent seeded stream per purpose. */
function streamFor(battle, purpose) { return mulberry(hash32(battle + '/' + purpose)); }
/** A stable number in [0,1) for a key. */
function u01(key) { return hash32(key) / 4294967296; }

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const easeOut = (t) => { t = clamp(t, 0, 1); return 1 - (1 - t) * (1 - t); };
const easeIn = (t) => { t = clamp(t, 0, 1); return t * t; };

/** First index i with key(arr[i]) > t (arr sorted ascending by key). */
function upperBound(arr, t, key) {
  let lo = 0, hi = arr.length;
  while (lo < hi) { const m = (lo + hi) >> 1; if (key(arr[m]) <= t) lo = m + 1; else hi = m; }
  return lo;
}

// Projection: orthographic, pitch 40 degrees, yaw 30 degrees (design 3.1).
const PITCH = (40 * Math.PI) / 180, YAW = (30 * Math.PI) / 180;
const CY = Math.cos(YAW), SY = Math.sin(YAW), SP = Math.sin(PITCH), CP = Math.cos(PITCH);
/** Ground (x lateral, y depth, h height) to the screen plane, before the camera. */
function sx(x, y) { return x * CY + y * SY; }
function sy(x, y, h) { return (x * SY - y * CY) * SP - (h || 0) * CP; }
/** The screen plane back to the ground (height 0); writes into out when given (no allocation in a frame loop). */
function toGround(X, Y, out) { const Yp = Y / SP, o = out || { x: 0, y: 0 }; o.x = X * CY + Yp * SY; o.y = X * SY - Yp * CY; return o; }
/** Larger is nearer the camera. */
function depthKey(x, y) { return (x * SY - y * CY) * SP; }
/** Canvas 2D transform that draws ground coordinates onto the screen plane. */
const GROUND_MATRIX = [CY, SY * SP, SY, -CY * SP];

// Colors
function hexToNum(h) { return parseInt(h.replace('#', ''), 16); }
function numToHex(n) { return '#' + (n >>> 0).toString(16).padStart(6, '0'); }
function mix(a, b, t) {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return (Math.round(lerp(ar, br, t)) << 16) | (Math.round(lerp(ag, bg, t)) << 8) | Math.round(lerp(ab, bb, t));
}
function shade(c, f) { return mix(c, f < 0 ? 0x000000 : 0xffffff, Math.abs(f)); }
function rgba(n, a) { return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }
/** CIE L* of an sRGB color (for the value rule checks). */
function lstar(n) {
  const f = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const Y = 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
  return Y > 216 / 24389 ? 116 * Math.cbrt(Y) - 16 : (24389 / 27) * Y;
}

const PHASES = ['scripts', 'ranged', 'melee', 'morale', 'end'];

// Open-ended DRN (docs/04): 2d6, each 6 rerolled and added. Distribution of X - Y for the
// break chance (docs/12 S2.16), truncated below 1e-6, computed once.
const DRN_DIFF = (() => {
  const die = new Map();
  // one open-ended d6: values 1..5 with 1/6, 6+k recursively
  const add = (m, v, p) => m.set(v, (m.get(v) || 0) + p);
  const d = new Map();
  let carry = 1, base = 0;
  while (carry > 1e-9) {
    for (let v = 1; v <= 5; v++) add(d, base + v, carry / 6);
    base += 6; carry /= 6;
  }
  void die;
  const conv = (a, b) => { const m = new Map(); for (const [x, p] of a) for (const [y, q] of b) if (p * q > 1e-12) add(m, x + y, p * q); return m; };
  const drn = conv(d, d);
  const diff = new Map();
  for (const [x, p] of drn) for (const [y, q] of drn) if (p * q > 1e-12) add(diff, x - y, p * q);
  return diff;
})();
/** P(X - Y < thr) for two open-ended DRNs. */
function pBelow(thr) { let p = 0; for (const [v, q] of DRN_DIFF) if (v < thr) p += q; return p; }

// Color difference under color vision deficiency, as the repo's tests/content/colorMath.ts:
// sRGB -> CIELAB (D65), CIEDE2000, Machado 2009 full-severity simulation on linear RGB.
const CVD = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};
const VISIONS = ['normal', 'protan', 'deutan', 'tritan'];
function labAs(n, vision) {
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  let rgb = [lin((n >> 16) & 255), lin((n >> 8) & 255), lin(n & 255)];
  if (vision !== 'normal') { const m = CVD[vision]; rgb = m.map((row) => clamp(row[0] * rgb[0] + row[1] * rgb[1] + row[2] * rgb[2], 0, 1)); }
  const [r, g, b] = rgb;
  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
  const f = (q) => (q > 216 / 24389 ? Math.cbrt(q) : ((24389 / 27) * q + 16) / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}
function deltaE2000([L1, a1, b1], [L2, a2, b2]) {
  const rad = Math.PI / 180;
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cbar = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cbar ** 7 / (Cbar ** 7 + 25 ** 7)));
  const a1p = (1 + G) * a1, a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  const hue = (a, b) => (a === 0 && b === 0 ? 0 : (Math.atan2(b, a) / rad + 360) % 360);
  const h1p = hue(a1p, b1), h2p = hue(a2p, b2);
  let dhp = 0;
  if (C1p * C2p !== 0) { dhp = h2p - h1p; if (dhp > 180) dhp -= 360; else if (dhp < -180) dhp += 360; }
  const dLp = L2 - L1, dCp = C2p - C1p, dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * rad);
  const Lbp = (L1 + L2) / 2, Cbp = (C1p + C2p) / 2;
  let hbp = h1p + h2p;
  if (C1p * C2p !== 0) { if (Math.abs(h1p - h2p) > 180) hbp += h1p + h2p < 360 ? 360 : -360; hbp /= 2; }
  const Tt = 1 - 0.17 * Math.cos((hbp - 30) * rad) + 0.24 * Math.cos(2 * hbp * rad) + 0.32 * Math.cos((3 * hbp + 6) * rad) - 0.2 * Math.cos((4 * hbp - 63) * rad);
  const dTheta = 30 * Math.exp(-(((hbp - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lbp - 50) ** 2) / Math.sqrt(20 + (Lbp - 50) ** 2), Sc = 1 + 0.045 * Cbp, Sh = 1 + 0.015 * Cbp * Tt;
  const Rt = -Math.sin(2 * dTheta * rad) * Rc;
  return Math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh));
}
/** ΔE2000 between two sRGB colors as seen with each vision. */
function deltaEBy(a, b) { const o = {}; for (const v of VISIONS) o[v] = +deltaE2000(labAs(a, v), labAs(b, v)).toFixed(1); return o; }
/** The colorblind rule's minimum (docs/09, palette-ab/decision.md). */
const CVD_MIN = 12;
