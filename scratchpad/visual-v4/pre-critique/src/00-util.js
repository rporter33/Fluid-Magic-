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
function toGround(X, Y) { const Yp = Y / SP; return { x: X * CY + Yp * SY, y: X * SY - Yp * CY }; }
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
