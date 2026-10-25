
// ================================================================== v4: the relief map (visual-v4/map-design-final.md). Map look: Relief (default) | Painted (v3)
// The cloth becomes a terrain model on the oak table: one bake per map (albedo through a seeded lookup warp, relief with its own wider
// blend, mean-neutral hillshade, ground detail, wilds in relief), live layers over it (glow, fog, modes, hover), vector rails and water,
// miniatures on bases, labels by zoom band. Nothing here calls Math.random or Date: every draw is seeded from the map seed.
// This file: constants, the seeded noise, the CPU bake (the design's CPU reference and fallback path, time-sliced on the main thread),
// the model's rim (cliff, plinth, shadow, plaque) and the water placement.
const RELIEF = () => view.look === 'relief';
const RLD = MED_DIAM, RLK = MED_DIAM / 90; // D, and mockup units per mapgen unit (the design's numbers are mapgen units, D = 90)
const RL_T = ['plains', 'farmland', 'forest', 'hills', 'mountains', 'swamp', 'wasteland']; // terrain index order; 7 peaks, 8 mere, 255 off
const RL_TI = Object.fromEntries(RL_T.map((t, k) => [t, k]));
const RL_ALB = { plains: '#78894A', farmland: '#D5B16B', forest: '#1A3819', hills: '#6D5303', mountains: '#859BB8', swamp: '#38616D', wasteland: '#877773' }; // §4.1
const RL_CAP = { plains: 4, farmland: 4, forest: 6, hills: 9, mountains: 16, swamp: 3, wasteland: 6 }; // §3.3 swing caps, L*
// Shade gain per terrain (RL_T order), blended across ecotones like the heights: tanh(3.2 g (s - sin 40)) under the same caps, so the low land's
// gentle slopes reach a third of their swing cap in the core (§3.2, §13) and the relief, not the mottle, carries the lightness budget (critique fix 3)
const RL_SHG = [2.6, 3.6, 1.4, 1.0, 1.0, 2.2, 1.2]; // plains, farmland, forest, hills, mountains, swamp, wasteland
const RL_HT = { swamp: [0.03, 0.04, 60], farmland: [0.08, 0.075, 60], plains: [0.10, 0.15, 60], forest: [0.14, 0.175, 45], wasteland: [0.18, 0.25, 40], hills: [0.28, 0.30, 30], mountains: [0.48, 0.62, 22] }; // §3.2 base, amplitude, feature (mapgen units)
const RL_KEYFOR = { plains: '#1C1A17', farmland: '#1C1A17', forest: '#F4EEDF', hills: '#F4EEDF', mountains: '#1C1A17', swamp: '#F4EEDF', wasteland: '#1C1A17' }; // keylineFor(albedo), §4.1
// The neutral hairline's alpha per terrain (fix 5; was keylineFor at 70% everywhere, 6.3:1 on forest, louder than the rails): each solved so the worst case over the
// relief extremes (-A, 0, +0.6 A) and the five approved states is 2.41 to 2.44:1 (wasteland stays at the 70% cap, 2.39:1, the design's floor); critique-work/calc/hairline.ts
const RL_HAIRA = { plains: 0.62, farmland: 0.47, forest: 0.34, hills: 0.51, mountains: 0.67, swamp: 0.48, wasteland: 0.70 };
const RL_WASH = { red: ['#8F8C88', 0.1], green: ['#5E7F45', 0.06] }; // the land looks' wash colors and caps at strength 10 (ash 10%, moss 6%; §4.2)
const RL_C = { water: '#50AF9B', granite: '#2A292C', graniteLit: '#8A857E', snow: '#F2EEE6', mere: '#24222A', mereBank: '#3A3640', ripple: '#8FC3D3', lip: '#E9E4D8', cliffTop: '#3A3436', cliffFoot: '#221E20', plinth: '#2B231C', contact: '#1C1A17', brass: '#B8914A', fall: '#B9D3CF', gesso: '#E8DCC2', base: '#1E1B18', baseLip: '#B8B1A4', pewter: '#91A092', keyLight: '#F4EEDF', keyDark: '#1C1A17' };
// Presentation numbers (V16: docs/09-balance "Map presentation"; one place, read by the checks). Lengths in D or in mapgen units (x RLK).
const RL_P = {
  bakeW: 2048, bakeH: 1280, warpD: 0.10, warpF1: 40, warpF2: 9, albBlur: 1.1, hSigmaD: 0.12, vScale: 26, litCap: 0.6, elev: 40, azimuth: 315,
  castD: 0.25, castSteps: 16, castL: 6, valleyL: 4, meanBudget: 0.5, meanSpreadD: 0.03, meanIters: 3, octaves: 5, lacunarity: 2.03, gain: 0.5, hGain: 0.42, featK: 1.5, // featK: the height features x 1.5 (larger landforms) // hGain: the heights' fBm gain (the design's 0.5 let the fine octaves own the hillshade)
  glow: 0.35, glowD: 0.05, glowPow: 1.6, coreD: 0.06, hover: 0.25, select: 0.30, indepHover: 0.20, indepSelect: 0.25, hairline: 0.70, hemPeak: 0.12, haze: 0.04, outSat: 0.10, realmTint: 0.08,
  face: 48, faceShown: 37, plinth: 3, strata: 6, crag: 10, cragShown: 8, bank: 4, cornerD: 0.22, shadowD: 0.05, shadowBlurD: 0.06, shadowA: 0.55, plaqueD: 0.9,
  modeRelief: 3, lakeMax: 0.08, pondMax: 0.02, waterClearD: 0.10, townStep: 4, townPD: 5,
  hamletDpx: 100, hamletFadePx: 130, guardDpx: 300, guardMax: 2, townMaxPx: 96, townHouseK: 0.14, townHouseMax: 16, // fix 4: hamlets and huts from 100 px a province (fading in to 130); fix 7: guards from 300 px, at most 2; fix 8: town ceiling and house size
  plaqueH: 11.3, // the plaque keeps its height on the taller face (mapgen units)
};
const RL_FACE = RL_P.faceShown * RLK; // the cliff as shown in the 40 degree oblique (48 units tall, 37 shown; critique fix 9, the design's §2.2 had 24 and 18)
const RL_PLINTH = RL_P.plinth * RLK * 0.77;
const RL_RC = RL_P.cornerD * RLD; // the model is mapgen's rounded rectangle
const MODEL_BOX = [0, 0, W, H + RL_FACE];
function inModel(x, y) { // inside the land's rounded rectangle
  if (x < 0 || y < 0 || x > W || y > H) return false;
  const cx = x < RL_RC ? RL_RC : x > W - RL_RC ? W - RL_RC : x, cy = y < RL_RC ? RL_RC : y > H - RL_RC ? H - RL_RC : y;
  return (x - cx) ** 2 + (y - cy) ** 2 <= RL_RC * RL_RC;
}
function modelPath(g) { g.beginPath(); g.roundRect(0, 0, W, H, RL_RC); }
const RL_L = (() => { const r = {}; for (const t of RL_T) r[t] = rgb2lab(hex2rgb(RL_ALB[t])); return r; })();
// tanh by a rational approximation (the rule-bearing rasters use arithmetic, sqrt and floor only; V13, review item 34)
const rlTanh = (x) => { if (x > 4.97) return 1; if (x < -4.97) return -1; const x2 = x * x; return (x * (135135 + x2 * (17325 + x2 * (378 + x2)))) / (135135 + x2 * (62370 + x2 * (3150 + x2 * 28))); };
const rlLum = (c) => 0.2126 * s2l(c[0]) + 0.7152 * s2l(c[1]) + 0.0722 * s2l(c[2]);
const rlWcag = (a, b) => { const la = rlLum(a), lb = rlLum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); }; // WCAG contrast of two sRGB triples
const rlSmooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---- seeded value noise: one 256 x 256 table per purpose (V13: presentation streams keyed relief:<seed>:<purpose>, never state.rng)
const RL_TABLES = new Map();
function rlTable(purpose) {
  let t = RL_TABLES.get(purpose); if (t) return t;
  const R = rngFor(`relief:${MAP_SEED}:${purpose}`); t = new Float32Array(65536); for (let k = 0; k < 65536; k++) t[k] = R() * 2 - 1;
  RL_TABLES.set(purpose, t); return t;
}
function rlVN(T, x, y) { // value noise on the unit lattice, smoothstep interpolation, in [-1, 1]
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const x0 = ix & 255, x1 = (ix + 1) & 255, y0 = (iy & 255) << 8, y1 = ((iy + 1) & 255) << 8;
  const a = T[y0 | x0], b = T[y0 | x1], c = T[y1 | x0], d = T[y1 | x1];
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
// gradient noise for the heights (value noise creases along its lattice): a seeded permutation and unit gradients made with sqrt only
const RL_GTABLES = new Map();
function rlGTable(purpose) {
  let t = RL_GTABLES.get(purpose); if (t) return t;
  const R = rngFor(`relief:${MAP_SEED}:g:${purpose}`), perm = new Uint8Array(512), gx = new Float32Array(256), gy = new Float32Array(256), p = [...Array(256).keys()];
  for (let k = 255; k > 0; k--) { const j = Math.floor(R() * (k + 1)); [p[k], p[j]] = [p[j], p[k]]; }
  for (let k = 0; k < 512; k++) perm[k] = p[k & 255];
  for (let k = 0; k < 256; k++) { let x, y, l; do { x = R() * 2 - 1; y = R() * 2 - 1; l = x * x + y * y; } while (l > 1 || l < 0.05); l = Math.sqrt(l); gx[k] = x / l; gy[k] = y / l; }
  t = { perm, gx, gy }; RL_GTABLES.set(purpose, t); return t;
}
function rlGN(G, x, y) { // 2D gradient noise, quintic fade, about [-1, 1]
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, X = ix & 255, Y = iy & 255, P = G.perm;
  const a = P[P[X] + Y], b = P[P[X + 1] + Y], c = P[P[X] + Y + 1], d = P[P[X + 1] + Y + 1];
  const u = fx * fx * fx * (fx * (fx * 6 - 15) + 10), v = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
  const na = G.gx[a] * fx + G.gy[a] * fy, nb = G.gx[b] * (fx - 1) + G.gy[b] * fy, nc = G.gx[c] * fx + G.gy[c] * (fy - 1), nd = G.gx[d] * (fx - 1) + G.gy[d] * (fy - 1);
  return 1.45 * (na + (nb - na) * u + (nc - na) * v + (na - nb - nc + nd) * u * v);
}
function rlGFbm(G, x, y, oct, gain) { let s = 0, amp = 1, f = 1, norm = 0; for (let k = 0; k < oct; k++) { s += amp * rlGN(G, x * f + k * 19.17, y * f + k * 47.53); norm += amp; amp *= gain; f *= RL_P.lacunarity; } const v = (s / norm) * 1.5; return v > 1 ? 1 : v < -1 ? -1 : v; }
function rlFbm(T, x, y, oct, gain = RL_P.gain) { // fBm, lacunarity 2.03; each octave offset in the table; scaled so p95 |n| is about 0.9
  let s = 0, amp = 1, f = 1, norm = 0;
  for (let k = 0; k < oct; k++) { s += amp * rlVN(T, x * f + k * 37.31, y * f + k * 91.17); norm += amp; amp *= gain; f *= RL_P.lacunarity; }
  const v = (s / norm) * 1.75; return v > 1 ? 1 : v < -1 ? -1 : v;
}
function rlRidged(G, x, y, oct, warp) { // ridged multifractal on gradient noise (sharp crests, smooth valleys), domain-warped so crests meander; about [-1, 1]
  if (warp) { const wx = rlGN(G, x * 0.43 + 17.3, y * 0.43 + 5.1), wy = rlGN(G, x * 0.43 + 61.7, y * 0.43 + 29.9); x += warp * wx; y += warp * wy; }
  let s = 0, amp = 1, f = 1, w = 1, norm = 0;
  for (let k = 0; k < oct; k++) { let n = 1 - Math.abs(rlGN(G, x * f + k * 37.31, y * f + k * 91.17)); n *= n; n *= w; w = Math.min(1, n * 1.6); s += n * amp; norm += amp; amp *= 0.45; f *= RL_P.lacunarity; }
  return Math.max(-1, Math.min(1, (s / norm) * 2.4 - 1.0));
}

// ---- box blur helpers on Float32 planes (separable running sums; edges renormalized)
function rlBoxBlur(src, w, h, r, passes, mask) { // mask: optional Float32 weights (blur value*mask and mask, divide); returns a new plane
  let a = Float32Array.from(src), m = mask ? Float32Array.from(mask) : null; const tmp = new Float32Array(w * h), tmpm = m ? new Float32Array(w * h) : null;
  if (m) for (let k = 0; k < a.length; k++) a[k] *= m[k];
  const run = (S, D, n, stride, count, step) => { // blur `count` lines of length n
    for (let l = 0; l < count; l++) {
      const o = l * step; let acc = 0, cnt = 0;
      for (let k = 0; k <= r && k < n; k++) { acc += S[o + k * stride]; cnt++; }
      for (let k = 0; k < n; k++) {
        D[o + k * stride] = acc / cnt;
        const add = k + r + 1, rem = k - r; if (add < n) { acc += S[o + add * stride]; cnt++; } if (rem >= 0) { acc -= S[o + rem * stride]; cnt--; }
      }
    }
  };
  for (let p = 0; p < passes; p++) {
    run(a, tmp, w, 1, h, w); run(tmp, a, h, w, w, 1);
    if (m) { run(m, tmpm, w, 1, h, w); run(tmpm, m, h, w, w, 1); }
  }
  if (m) for (let k = 0; k < a.length; k++) a[k] = m[k] > 1e-6 ? a[k] / m[k] : 0;
  return a;
}
function rlBilin(P, w, h, x, y) { // bilinear sample of a plane at fractional texel coordinates (texel centers at k + 0.5)
  x -= 0.5; y -= 0.5; if (x < 0) x = 0; if (y < 0) y = 0; if (x > w - 1) x = w - 1; if (y > h - 1) y = h - 1;
  const ix = x | 0, iy = y | 0, fx = x - ix, fy = y - iy, ix1 = ix + 1 < w ? ix + 1 : ix, iy1 = iy + 1 < h ? iy + 1 : iy;
  const a = P[iy * w + ix], b = P[iy * w + ix1], c = P[iy1 * w + ix], d = P[iy1 * w + ix1];
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
const RL_GAMMA = (() => { const n = 4096, t = new Uint8ClampedArray(n + 1); for (let k = 0; k <= n; k++) { const c = k / n; t[k] = Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)); } return t; })();
function rlLabTo(L, a, b, d, o) { // CIELAB (D65) to sRGB bytes at d[o..o+2]
  const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200;
  const X = (fx > 0.2068966 ? fx * fx * fx : (fx - 16 / 116) / 7.787) * 0.95047, Y = fy > 0.2068966 ? fy * fy * fy : (fy - 16 / 116) / 7.787, Z = (fz > 0.2068966 ? fz * fz * fz : (fz - 16 / 116) / 7.787) * 1.08883;
  let r = 3.2406 * X - 1.5372 * Y - 0.4986 * Z, g = -0.9689 * X + 1.8758 * Y + 0.0415 * Z, bb = 0.0557 * X - 0.204 * Y + 1.057 * Z;
  r = r < 0 ? 0 : r > 1 ? 1 : r; g = g < 0 ? 0 : g > 1 ? 1 : g; bb = bb < 0 ? 0 : bb > 1 ? 1 : bb;
  d[o] = RL_GAMMA[(r * 4096 + 0.5) | 0]; d[o + 1] = RL_GAMMA[(g * 4096 + 0.5) | 0]; d[o + 2] = RL_GAMMA[(bb * 4096 + 0.5) | 0];
}

// ---- the wild outlines (straight edges against non-wild cells) and the light
const RL_WILDK = new Uint8Array(N); for (const w of WILDS) for (const c of w.cells) RL_WILDK[c] = w.kind === 'peaks' ? 7 : 8;
const RL_LIGHT = (() => { const el = (RL_P.elev * Math.PI) / 180, az = (RL_P.azimuth * Math.PI) / 180; // azimuth 315: from the upper left of the screen
  return [Math.sin(az) * Math.cos(el), -Math.cos(az) * Math.cos(el), Math.sin(el)]; })(); // [-0.54, -0.54, 0.64]
const RL_SIN_EL = Math.sin((RL_P.elev * Math.PI) / 180), RL_TAN_EL = Math.tan((RL_P.elev * Math.PI) / 180);
function rlWildOutline(w) { const out = []; for (const c of w.cells) for (const j of NB[c]) { if (w.cells.includes(j)) continue; const e = edgeBetween(c, j); if (e) out.push({ a: e.a, b: e.b, c, j }); } return out; }
function rlSegDist(px, py, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1; let t = ((px - ax) * dx + (py - ay) * dy) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t; const ex = px - ax - t * dx, ey = py - ay - t * dy; return Math.sqrt(ex * ex + ey * ey); }

