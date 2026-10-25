
// ================================================================== v4: the relief map (visual-v4/map-design-final.md). Map look: Relief (default) | Painted (v3)
// The cloth becomes a terrain model on the oak table: one bake per map (albedo through a seeded lookup warp, relief with its own wider
// blend, mean-neutral hillshade, ground detail, wilds in relief), live layers over it (glow, fog, modes, hover), vector rails and water,
// miniatures on bases, labels by zoom band. Nothing here calls Math.random or Date: every draw is seeded from the map seed.
// Natural view (visual-v4/natural/design-final.md): the land has two looks of one model. Natural (default) is a muted landscape that blends across
// borders (p58n covers, p58m materials); Clear is the v4 colour-blind-safe bake (p58c), shown by the Clear terrain colours setting and the Terrain mode.
// This file: constants, the seeded noise, the blur and colour helpers. p58b: the shared rasters; p58c: the Clear colour pass; p58d: wilds, water, the scheduler.
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
// (RL_HAIRA, the per-terrain hairline alpha keyed to the Clear albedo, is superseded by the line rule of natural §8.2: one keyline per edge, solved on the ground under it; p59b)
const RL_WASH = { red: ['#8F8C88', 0.1], green: ['#5E7F45', 0.06] }; // the land looks' wash colors and caps at strength 10 (ash 10%, moss 6%; §4.2)
const RL_C = { water: '#50AF9B', granite: '#2A292C', graniteLit: '#8A857E', snow: '#F2EEE6', mere: '#24222A', mereBank: '#3A3640', ripple: '#8FC3D3', lip: '#E9E4D8', cliffTop: '#3A3436', cliffFoot: '#221E20', plinth: '#2B231C', contact: '#1C1A17', brass: '#B8914A', fall: '#B9D3CF', waterNat: '#14615B', gesso: '#E8DCC2', base: '#1E1B18', baseLip: '#B8B1A4', pewter: '#91A092', keyLight: '#F4EEDF', keyDark: '#1C1A17' };
// Presentation numbers (V16: docs/09-balance "Map presentation"; one place, read by the checks). Lengths in D or in mapgen units (x RLK).
const RL_P = {
  bakeW: 4096, bakeH: 2346, warpD: 0.10, warpF1: 40, warpF2: 9, albBlur: 1.1, hSigmaD: 0.12, vScale: 26, litCap: 0.6, elev: 40, azimuth: 315,
  castD: 0.25, castSteps: 16, castL: 6, valleyL: 4, meanBudget: 0.5, meanSpreadD: 0.03, meanIters: 3, octaves: 5, lacunarity: 2.03, gain: 0.5, hGain: 0.42, featK: 1.5, // featK: the height features x 1.5 (larger landforms) // hGain: the heights' fBm gain (the design's 0.5 let the fine octaves own the hillshade)
  glow: 0.35, glowD: 0.05, glowPow: 1.6, coreD: 0.06, hover: 0.25, select: 0.30, indepHover: 0.20, indepSelect: 0.25, hairline: 0.70, hemPeak: 0.12, haze: 0.04, outSat: 0.10, realmTint: 0.08,
  // pass 2: in the natural view the model's shadow on the oak falls as its 0.4 D of height casts it at 40 degrees, with a tight contact shadow (Clear and the Terrain mode keep v4's 0.05 D, blur 0.06, 0.55)
  face: 48, faceShown: 37, plinth: 3, strata: 6, crag: 10, cragShown: 8, bank: 4, cornerD: 0.22, shadowD: 0.05, shadowBlurD: 0.06, shadowA: 0.55, shadowNat: { shadowD: 0.16, shadowBlurD: 0.09, shadowA: 0.62, contactD: 0.02, contactA: 0.5 }, plaqueD: 0.9,
  modeRelief: 3, lakeMax: 0.08, pondMax: 0.02, waterClearD: 0.10, townStep: 4, townPD: 5,
  hamletDpx: 220, hamletFadePx: 280, guardDpx: 300, guardMax: 2, townMaxPx: 96, townHouseK: 0.14, townHouseMax: 16, // AD fix 5: hamlets and huts only deep in Near, from 220 px a province (fading in to 280; v4 had 100 and 130); fix 7: guards from 300 px, at most 2; fix 8: town ceiling and house size
  allNamesDpx: 320, // AD fix 6: every province named from 320 px a province (and with Shift or the numbers layer); from 180 to 320 px capitals, Wellsprings, towns, the selection and the path
  nearDetail: { tpp0: 1.5, tpp1: 2.1, crownU: 0.85, tileU: 24, crownA: 0.16, grainA: 0.11 }, // AD fix 7: the Near detail pass (CSS px per bake texel from 1.5, full at 2.1, so from about 205 px a province; crowns 0.85 units apart in 24-unit world tiles; soft-light strengths)
  plaqueH: 11.3, // the plaque keeps its height on the taller face (mapgen units)
  // natural §8.3: fog per look. Natural: unexplored 6% haze then 40% desaturation (hem to 12%), out of sight 25%; Clear and the Terrain mode: the approved 4% and 10%
  fog: { natural: { haze: 0.06, unexSat: 0.40, outSat: 0.25, hemPeak: 0.12 }, clear: { haze: 0.04, unexSat: 0, outSat: 0.10, hemPeak: 0.12 } },
  // natural §8.2: the line rule (segments 0.1 D; hairline 2.45:1 at coverage 0.75 against p10 and p90, alpha cap 0.92; partner 1.5 px at 0.8; internal 3.3:1 at coverage 1, 2.5 px below ratio 1.5)
  line: { q: 0.05, segD: 0.1, hair: 2.45, hairCov: 0.8, hairCap: 0.92, partnerA: 1, internal: 3.3, intW1: 2.5, sidePx: 3, hairW1: 2, partnerW1: 2, pairW1: [1.5, 1.5], pairDiagW1: [2, 1.5], intPartnerW1: 2.5 }, // pass 2 (verifier defects): on a diagonal edge (20 to 70 degrees) below ratio 1.5 a partnered hairline is 2 + 1.5 px (the 1.5 px anchor never covered a pixel past about 0.45 there: Karford/Ashstead 1.84:1 in Clear); the internal partner 2.5 px // below ratio 1.5 the hairline and its partner are 2 px: a 1.5 px line at 45 degrees leaves no pixel over 0.56 coverage (the reason the rail's banner is 2 px)
  // AD fix 1: the neutral hairline is a lit bevel: an upper-left half in the light key and a lower-right half in the dark key, 1.5 px each, each solved against its own side
  // (its p8 and p92 and the ground under the line) at 2.35:1, coverage 0.8; a half whose key reaches that on fewer than two-thirds of the edge's segments takes the other key for the whole edge
  // soft: where the other lip's key also serves a lip's side, that lip stays a soft shade of its own key (dark at 0.3, light at 0.25) instead of doubling the other key (see p59b)
  bevel: { T: 2.45, cov: 0.8, cov1: 0.55, q: 0.08, w: 1.5, wLit1: 2, keep: 2 / 3, cap: 1, soft: true, shade: 0.3, lit: 0.25, looks: ['natural'] }, // Clear and the Terrain mode keep the v4 anchor-and-partner hairline: the bevel left 5 to 7 segments under 2.3:1 on the Clear grounds
  seatMute: { mid: 2.3, near: 3.6 }, startDpx: 96, // natural §10: hamlets muted per house (2.3:1 Mid, 3.6:1 Near); the start view at least 96 px a province
  // pass 2, the owner's decision of 2026-10-23 (map-relief.owner-answers.md, "Faint lines, realms clear"): in the natural view (Natural look, Ownership mode) lines between
  // unowned provinces and internal lines inside one realm are faint: 1 CSS px, alpha solved per edge so the line reaches T (WCAG) against the median ground on each side, within
  // [minA, capA]; neutral in the light key, internal in the banner mixed intMix toward the light key. The hovered, linked and selected province's lines take the floor (p59b).
  farRelief: { dpx0: 85, dpx1: 58, blurD: 0.18, ex: 6, gain: 1.8, lit: 22, shade: 34, cast: 12, castD: 0.45, steps: 24, neutral: 1, muD: 0.3, wMin: 0.25, fogK: 0.6 }, // pass-2 critique fix 1: fogK, the share of it taken off unexplored land (its haze already flattens it; the unexplored reader read 0.867 of patches with it, 0.88 without); muD, the blur of the per-province mean before it is removed (D); wMin, the flattest land's share of the light and shade; gain 2.4 -> 1.8, lit 34 -> 22, shade 52 -> 34, cast 30 -> 12 (at the least zoom the lightness reader read 0.877 of patches at the old amplitudes with the smooth mean, 0.913 at these; 0.953 with no relief) // amplitudes: at 55 / 85 / 45 a lightness-only reader read 0.785 of Far patches (0.955 without); at these, 0.88 and every province // pass 2: the Far relief (p59c): soft-light grey, 128 neutral
  faint: { T: 1.35, w: 1, capA: 0.42, minA: 0.07, intMix: 0.45 },
  faceNat: { ledge: 16, ledgeW: 1.6, strata: 6.5, lip: 5, footL: 4, footK: 0.9 }, lipNat: { lit: 0.5, dark: 0.45, d0: 0.05, d1: 0.6 }, // pass-2 critique fix 7: the Natural face (p59a rlRim) and lip (rlDrawLip)
  wildRim: { m: 1.1, jit: 4, farJit: 10, pieceD: 0.08, pad: 0.04, stepPx: 2, gapD: 0.15, whole: 0.6 }, // pass-2 critique fix 3b: the natural view's light rim only along the stretches (pieceD D, padded by pad of the edge) whose own ground pair misses 20 / 12 x m at one of the scales zooms (p59b rlWildRimMap)
};
// natural §6: the look of the land. Natural by default; Clear with Settings → Accessibility → Terrain colours: Clear (?terrain=clear) and in the Terrain mode.
view.terrain = new URLSearchParams(location.search).get('terrain') === 'clear' ? 'clear' : 'natural';
const rlLandLook = () => (state.mode === 'terrain' || view.terrain === 'clear' ? 'clear' : 'natural'); // the look the land should show
const rlShownLook = () => { const w = rlLandLook(); if (!RB.ready || rlLookReady(w)) return w; return rlLookReady('natural') ? 'natural' : 'clear'; }; // the ready look stays while the other is prepared
const RL_FOG = () => RL_P.fog[rlShownLook()]; // the fog of the look on screen
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
// the mountains' micro-relief (lightness only, in [-1, 1]; rock at 7-unit features), shared by the Clear detail and the granite
let RL_TMR = null; const rlMicro = (x, y) => { const T = (RL_TMR ??= rlGTable('micro:mountains')), mE = 0.7 * RLK, f = (u, v) => rlRidged(T, u / (7 * RLK), v / (7 * RLK), 2, 0.2), t = (f(x + mE, y + mE) - f(x - mE, y - mE)) * 2.2; return t > 1 ? 1 : t < -1 ? -1 : t; };
// which keyline (light #F4EEDF or dark #1C1A17) contrasts more with a colour (keylineFor; natural §8.4 keys independents' hover to the natural core)
const rlKeyFor = (rgb) => (rlWcag(rgb, hex2rgb(RL_C.keyLight)) >= rlWcag(rgb, hex2rgb(RL_C.keyDark)) ? RL_C.keyLight : RL_C.keyDark);
function rlSegDist(px, py, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1; let t = ((px - ax) * dx + (py - ay) * dy) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t; const ex = px - ax - t * dx, ey = py - ay - t * dy; return Math.sqrt(ex * ex + ey * ey); }

