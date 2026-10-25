
// ------------------------------------------------------------------ v4 relief: the battle's procedural figure atlas (§6.7 M1: one oblique, one figure atlas).
// Copied unchanged from visual-v4/src/00-util.js, 40-figures.js and 42-figure-draw.js (the battle mockup), wrapped so its names stay local.
const FIGLIB = (() => {
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

// ---- procedural rank-and-file figures, baked into pose frames (design 12.1) ----
// Original shapes drawn with Pixi Graphics for a 40-degree overhead three-quarter camera; nothing
// is traced from any reference. Art space: a size-1 figure is 50 px tall, feet at (0, 0), facing
// screen right. Two views: 'se' (front three-quarter) and 'ne' (back three-quarter); flips give
// 'sw' and 'nw'. Every frame gets a dark keyline (#1C1A17 at 60%) around its silhouette.

const ART = { cell: 88, foot: 70, figH: 50, pxPerWu: 50 / 28 };
const INK = 0x1c1a17;
const FR = { idle: 0, idle1: 1, walk: 2, atk: 6, shoot: 10, brace: 13, flinch: 14, fall: 15, dead: 17, white: 18, whiteFlinch: 19, N: 20 };

const PALETTES = {
  cinderHorde: { cloth: 0xc4532c, clothDark: 0x7e3118, clothLight: 0xd9744a, metal: 0x4d4843, metalHi: 0x8f877d, leather: 0x47321f,
    skin: 0xa88068, wood: 0x6b4c32, trim: 0xd2a347, hair: 0x2a1d16, bark: 0x5b4636, horse: 0x5a4636, horseDark: 0x3a2b20 },
  thornwood: { cloth: 0x1f6a50, clothDark: 0x113f2f, clothLight: 0x2f8a68, metal: 0x6f5a3c, metalHi: 0xa58b5c, leather: 0x4a3a28,
    skin: 0xc49a76, wood: 0x6e5232, trim: 0xc9b26b, hair: 0x4a3524, bark: 0x5e4a33, horse: 0x77736c, horseDark: 0x4e4a45 },
  independent: { cloth: 0x8c8a80, clothDark: 0x5c5a54, clothLight: 0xaaa79c, metal: 0x6d7076, metalHi: 0xb0b4ba, leather: 0x4f4338,
    skin: 0xc8a080, wood: 0x7a5a3a, trim: 0x9a8a6a, hair: 0x3a2a20, bark: 0x5e4a33, horse: 0x6a5040, horseDark: 0x45342a },
};

/** Unit looks: body plan, gear and silhouette. */
const LOOKS = {
  ashMilitia: { body: 'man', helm: 'cap', armor: 'padded', weapon: 'spear', shield: null },
  thornMilitia: { body: 'man', helm: 'hood', armor: 'padded', weapon: 'spear', shield: null },
  lightInfantry: { body: 'man', helm: 'cap', armor: 'padded', weapon: 'spear', shield: 'round' },
  swampFighter: { body: 'man', helm: 'hood', armor: 'padded', weapon: 'spear', shield: null },
  cinderWarrior: { body: 'man', helm: 'crestHelm', armor: 'scale', weapon: 'axe', shield: 'round' },
  heavyInfantry: { body: 'man', helm: 'kettle', armor: 'plate', weapon: 'sword', shield: 'kite' },
  warden: { body: 'man', helm: 'leafHelm', armor: 'bark', weapon: 'sword', shield: 'round', cape: true },
  briarGuard: { body: 'man', helm: 'thornHelm', armor: 'bark', weapon: 'halberd', shield: null, cape: true },
  flamebrand: { body: 'man', helm: 'crestHelm', armor: 'scale', weapon: 'fireSword', shield: null, cape: true, glow: true },
  berserker: { body: 'man', helm: 'wild', armor: 'bare', weapon: 'greatAxe', shield: null },
  flameArcher: { body: 'man', helm: 'hood', armor: 'padded', weapon: 'bow', shield: null, quiver: true, fire: true },
  longbowHunter: { body: 'man', helm: 'hood', armor: 'padded', weapon: 'longbow', shield: null, quiver: true, cape: true },
  archer: { body: 'man', helm: 'cap', armor: 'padded', weapon: 'bow', shield: null, quiver: true },
  emberSkirmisher: { body: 'man', helm: 'band', armor: 'padded', weapon: 'javelin', shield: null },
  ashRider: { body: 'horse', helm: 'crestHelm', armor: 'scale', weapon: 'lance', shield: null },
  wolfRider: { body: 'wolf', helm: 'hood', armor: 'bark', weapon: 'spear', shield: null },
  wolf: { body: 'wolfOnly' },
  fireSprite: { body: 'sprite' },
  hornetSwarm: { body: 'swarm' },
  ashChieftain: { body: 'man', helm: 'horned', armor: 'scale', weapon: 'axe', shield: null, cape: true, banner: true },
  wardenCaptain: { body: 'man', helm: 'leafHelm', armor: 'bark', weapon: 'sword', shield: 'round', cape: true, banner: true },
  independentCaptain: { body: 'man', helm: 'kettle', armor: 'mail', weapon: 'sword', shield: 'round', cape: true, banner: true },
  cinderMagus: { body: 'man', helm: 'robeHood', armor: 'robe', weapon: 'staff', staffGlow: 0xff8a3a },
  emberAdept: { body: 'man', helm: 'robeHood', armor: 'robe', weapon: 'staff', staffGlow: 0xffa04a },
  pyrePriest: { body: 'man', helm: 'mitre', armor: 'robe', weapon: 'staff', staffGlow: 0xffd070 },
  elderDruid: { body: 'man', helm: 'antler', armor: 'robe', weapon: 'staff', staffGlow: 0x9be07a },
  saplingDruid: { body: 'man', helm: 'leafCrown', armor: 'robe', weapon: 'staff', staffGlow: 0xb8e08a },
  grovePriest: { body: 'man', helm: 'leafCrown', armor: 'robe', weapon: 'staff', staffGlow: 0xf0e08a, light: true },
  cinderScout: { body: 'man', helm: 'hood', armor: 'padded', weapon: 'dagger' },
  thornScout: { body: 'man', helm: 'hood', armor: 'padded', weapon: 'dagger' },
  oakheart: { body: 'man', helm: 'leafHelm', armor: 'bark', weapon: 'maul', shield: null, scale: 1.5 },
};

// ---------------------------------------------------------------------------------------
function P(g) {
  return {
    poly(pts, fill, a) { g.poly(pts).fill({ color: fill, alpha: a ?? 1 }); return this; },
    ell(x, y, rx, ry, fill, a) { g.ellipse(x, y, rx, ry).fill({ color: fill, alpha: a ?? 1 }); return this; },
    circ(x, y, r, fill, a) { g.circle(x, y, r).fill({ color: fill, alpha: a ?? 1 }); return this; },
    rect(x, y, w, h, fill, a) { g.rect(x, y, w, h).fill({ color: fill, alpha: a ?? 1 }); return this; },
    rrect(x, y, w, h, r, fill, a) { g.roundRect(x, y, w, h, r).fill({ color: fill, alpha: a ?? 1 }); return this; },
    line(x0, y0, x1, y1, w, color, a) { g.moveTo(x0, y0).lineTo(x1, y1).stroke({ width: w, color, alpha: a ?? 1, cap: 'round' }); return this; },
    curve(pts, w, color, a) { g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 4) g.quadraticCurveTo(pts[i], pts[i + 1], pts[i + 2], pts[i + 3]); g.stroke({ width: w, color, alpha: a ?? 1, cap: 'round', join: 'round' }); return this; },
  };
}

/** Pose parameters for a frame. */
function poseParams(frame) {
  const q = { step: 0, bob: 0, atk: -1, shoot: -1, brace: 0, flinch: 0, fall: -1, dead: false };
  if (frame === FR.idle1) q.bob = 0.8;
  else if (frame >= FR.walk && frame < FR.walk + 4) { const k = frame - FR.walk; q.step = [1, 0, -1, 0][k]; q.bob = [0, 1, 0, 1][k]; }
  else if (frame >= FR.atk && frame < FR.atk + 4) q.atk = frame - FR.atk; // 0 windup, 1 strike, 2 recover, 3 strike variant
  else if (frame >= FR.shoot && frame < FR.shoot + 3) q.shoot = frame - FR.shoot; // 0 draw, 1 loose, 2 recover
  else if (frame === FR.brace) q.brace = 1;
  else if (frame === FR.flinch || frame === FR.whiteFlinch) q.flinch = 1;
  else if (frame === FR.fall || frame === FR.fall + 1) q.fall = frame - FR.fall;
  else if (frame === FR.dead) q.dead = true;
  return q;
}

// ---------------------------------------------------------------------------------------
/**
 * Bakes the frames of the given (unit, side palette) looks: per look, one render of every frame's
 * vector parts, then one render that lays the dark keyline (the silhouette offset in 8 directions
 * at 60%) under it. Returns Map key -> {ne: Texture[], se: Texture[]}.
 */
function bakeFigures(renderer, list) {
  const out = new Map();
  const C = ART.cell;
  const cols = 10;
  const rows = Math.ceil((FR.N * 2) / cols);
  const whiteM = [0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0];
  for (const { key, unit, pal, scale } of list) {
    const opts = { width: C * cols, height: C * rows, resolution: 1, antialias: true };
    const rtA = PIXI.RenderTexture.create(opts), rtB = PIXI.RenderTexture.create(opts);
    const root = new PIXI.Container();
    const whites = new PIXI.Container();
    const cm = new PIXI.ColorMatrixFilter(); cm.matrix = whiteM; whites.filters = [cm];
    root.addChild(whites);
    const cells = { ne: [], se: [] };
    let k = 0;
    for (const view of ['ne', 'se']) for (let f = 0; f < FR.N; f++) {
      const cx = (k % cols) * C, cy = Math.floor(k / cols) * C;
      const holder = new PIXI.Container();
      holder.position.set(cx + C / 2, cy + ART.foot);
      const white = f === FR.white || f === FR.whiteFlinch;
      const fall = f === FR.fall || f === FR.fall + 1, dead = f === FR.dead;
      const g = new PIXI.Graphics();
      drawFigure(g, unit, pal, view, white ? (f === FR.white ? FR.idle : FR.flinch) : f === FR.fall ? FR.flinch : f);
      const body = new PIXI.Container();
      body.addChild(g);
      if (f === FR.fall) { body.rotation = (view === 'ne' ? -1 : 1) * 0.55; body.position.set((view === 'ne' ? -3 : 3), 0); }
      const s = scale || 1;
      body.scale.x *= s; body.scale.y *= s;
      holder.addChild(body);
      (white ? whites : root).addChild(holder);
      cells[view].push({ cx, cy });
      k++;
    }
    renderer.render({ container: root, target: rtA, clear: true });
    const comp = new PIXI.Container();
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) {
      const sp = new PIXI.Sprite(rtA); sp.position.set(dx * 1.1, dy * 1.1); sp.tint = INK; sp.alpha = 0.6; comp.addChild(sp);
    }
    comp.addChild(new PIXI.Sprite(rtA));
    renderer.render({ container: comp, target: rtB, clear: true });
    const frames = { ne: [], se: [] };
    for (const view of ['ne', 'se']) frames[view] = cells[view].map(({ cx, cy }) => new PIXI.Texture({ source: rtB.source, frame: new PIXI.Rectangle(cx, cy, C, C) }));
    out.set(key, frames);
    root.destroy({ children: true }); comp.destroy({ children: true });
    rtA.destroy(true); // only the composited frames are kept
  }
  return out;
}
const FIG_ANCHOR = { x: 0.5, y: ART.foot / ART.cell };

// ---- figure drawing: chunky miniatures for a 40-degree overhead camera ----
// Art px, figure 50 px tall, feet at (0, 0), facing screen right. Light from the upper left.
// Proportions favour what the camera sees: a big head and helmet top, broad shoulders, short legs.
// The side's cloth sits on the top-visible surfaces: helmet crests, shoulders, cloaks, shield faces.

/** Draws one figure frame into Graphics g (art space). */
function drawFigure(g, unit, pal, view, frame) {
  const look = LOOKS[unit] || LOOKS.ashMilitia;
  const q = poseParams(frame);
  if (look.body === 'sprite') return drawSprite(g, pal, q, view);
  if (look.body === 'swarm') return drawSwarm(g, q);
  if (q.dead || q.fall === 1) return drawLying(g, look, pal, view, q);
  if (look.body === 'horse' || look.body === 'wolf') return drawRider(g, look, pal, view, q);
  if (look.body === 'wolfOnly') return drawWolf(g, pal, view, q, 0, 0, true);
  return drawMan(g, look, pal, view, q);
}

function weaponPose(q) {
  if (q.atk === 0) return { w: -1, lunge: -1.5 };   // windup: pulled back
  if (q.atk === 1) return { w: 1, lunge: 3.5 };      // strike
  if (q.atk === 2) return { w: 0.45, lunge: 1.2 };   // recover
  if (q.atk === 3) return { w: 1.25, lunge: 3 };     // strike variant
  if (q.brace) return { w: 0.35, lunge: 0 };
  return { w: 0, lunge: 0 };
}

const SKIN_HI = (c) => shade(c, 0.12);

function drawMan(g, look, pal, view, q) {
  const d = P(g);
  const back = view === 'ne';
  const robe = look.armor === 'robe';
  const wp = weaponPose(q);
  const ox = wp.lunge + (q.flinch ? -2.2 : 0);
  const oy = -q.bob + (q.brace ? 1.4 : 0) + (q.flinch ? 0.6 : 0);
  const sc = look.scale || 1;
  void sc;
  d.ell(5, 0.6, 12.5, 4.4, 0x000000, 0.32);
  // weapon behind the body (back view: the weapon arm is on the far, screen-right side, in front)
  // banner pole behind everything
  if (look.banner) drawBanner(g, pal, back, ox, oy, q);
  if (look.quiver && !back) d.rrect(ox - 9, oy - 33, 5, 15, 2, pal.leather);
  // legs
  const legC = look.armor === 'bare' ? pal.clothDark : look.armor === 'bark' ? pal.bark : pal.leather;
  if (!robe) {
    const st = q.step * 3.4;
    d.line(ox - 2.8, oy - 15, -3.6 - st, -2, 5.4, shade(legC, -0.18));
    d.line(ox + 2.8, oy - 15, 3.8 + st, -2, 5.4, legC);
    d.ell(-3.8 - st, -1.2, 3.6, 2.1, 0x261c14); d.ell(4.4 + st, -1.2, 3.6, 2.1, 0x2c2118);
  }
  // cloak on the back (back view), large and in side cloth: what the camera sees of the near side
  if (back && (look.cape || look.armor === 'bark' || look.armor === 'padded' || look.armor === 'scale' || look.armor === 'mail')) {
    d.poly([ox - 9.5, oy - 30, ox + 9.5, oy - 30, ox + 10.5, oy - 9, ox + 3, oy - 7, ox - 3, oy - 8.5, ox - 10.5, oy - 9.5], look.cape ? pal.cloth : pal.clothDark);
    d.poly([ox + 2.5, oy - 30, ox + 9.5, oy - 30, ox + 10.5, oy - 9, ox + 3, oy - 7], shade(look.cape ? pal.cloth : pal.clothDark, -0.22), 0.8);
    d.line(ox - 3, oy - 27, ox - 4, oy - 10, 1.2, shade(pal.cloth, -0.35), 0.6);
  } else if (!back && look.cape) {
    d.poly([ox - 10, oy - 29, ox - 6, oy - 30, ox - 9, oy - 9, ox - 12.5, oy - 10], pal.clothDark);
  }
  // torso
  if (robe) {
    const R = look.light ? 0xd2c7aa : pal.cloth;
    d.poly([ox - 9, oy - 30, ox + 9, oy - 30, ox + 11.5, oy - 1.5, ox + 3, oy + 0.5, ox - 11.5, oy - 1.5], R);
    d.poly([ox + 2.5, oy - 30, ox + 9, oy - 30, ox + 11.5, oy - 1.5, ox + 3, oy + 0.5], shade(R, -0.22), 0.9);
    d.poly([ox - 9, oy - 30, ox - 4, oy - 30, ox - 6, oy - 1, ox - 11.5, oy - 1.5], shade(R, 0.1), 0.6);
    d.rect(ox - 9, oy - 18, 18, 2.6, pal.trim, 0.95);
    if (!back) d.rect(ox - 1.2, oy - 29, 2.4, 27, pal.trim, 0.7);
  } else {
    const T = look.armor === 'bare' ? pal.skin : look.armor === 'scale' ? pal.cloth : look.armor === 'bark' ? pal.bark : look.armor === 'plate' || look.armor === 'mail' ? pal.metal : pal.cloth;
    if (!back || !(look.cape || look.armor === 'bark' || look.armor === 'padded' || look.armor === 'scale' || look.armor === 'mail')) {
      d.poly([ox - 9.5, oy - 30, ox + 9.5, oy - 30, ox + 7.8, oy - 14, ox - 7.8, oy - 14], T);
      d.poly([ox + 3, oy - 30, ox + 9.5, oy - 30, ox + 7.8, oy - 14, ox + 2.5, oy - 14], shade(T, -0.24), 0.9);
      d.poly([ox - 9.5, oy - 30, ox - 4.5, oy - 30, ox - 4.2, oy - 14, ox - 7.8, oy - 14], shade(T, 0.12), 0.7);
      if (look.armor === 'scale') for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) d.ell(ox - 6.4 + c * 3.2 + (r % 2) * 1.6, oy - 27 + r * 3.5, 1.6, 1.1, shade(pal.cloth, -0.4), 0.55);
      if (look.armor === 'bark') { for (let r = 0; r < 3; r++) d.line(ox - 7, oy - 26 + r * 4.3, ox + 7, oy - 25 + r * 4.3, 1.3, shade(pal.bark, -0.4), 0.8); if (!back) d.poly([ox - 4, oy - 30, ox + 4, oy - 30, ox + 3, oy - 15, ox - 3, oy - 15], pal.cloth); }
      if (look.armor === 'bare') { for (let i = 0; i < 3; i++) d.line(ox - 6, oy - 26 + i * 3.6, ox + 1, oy - 25 + i * 3.6, 1.4, 0x7a2a20, 0.7); d.line(ox - 9, oy - 22, ox + 9, oy - 26, 2.4, pal.leather); }
      if (look.armor === 'padded' && !back) { d.poly([ox - 3.5, oy - 30, ox + 3.5, oy - 30, ox + 3, oy - 15, ox - 3, oy - 15], pal.clothLight, 0.55); }
      if (look.armor === 'mail' || look.armor === 'plate') d.poly([ox - 4, oy - 30, ox + 4, oy - 30, ox + 3, oy - 15, ox - 3, oy - 15], pal.cloth, 0.95);
    }
    // the tunic skirt over the upper legs, side cloth
    d.poly([ox - 8.5, oy - 16, ox + 8.5, oy - 16, ox + 9.5, oy - 8.5, ox - 9.5, oy - 8.5], look.armor === 'padded' ? pal.clothDark : pal.cloth);
    d.poly([ox + 2.5, oy - 16, ox + 8.5, oy - 16, ox + 9.5, oy - 8.5, ox + 3, oy - 8.5], shade(look.armor === 'padded' ? pal.clothDark : pal.cloth, -0.2), 0.8);
    d.rect(ox - 8.5, oy - 17.2, 17, 2.4, pal.leather);
  }
  // shield arm and shield on the far side in the back view
  const sh = look.shield;
  if (sh && back) drawShield(g, pal, true, ox - 10, oy - 19 + (q.brace ? -2 : 0), sh);
  // shoulders: pauldrons in side cloth, lit from the upper left
  const shC = look.armor === 'bare' ? pal.skin : robe ? (look.light ? 0xd2c7aa : pal.cloth) : look.armor === 'bark' ? pal.clothLight : pal.cloth;
  d.ell(ox - 8.6, oy - 28.5, 4.8, 3.6, shade(shC, 0.12));
  d.ell(ox + 8.6, oy - 28.5, 4.8, 3.6, shade(shC, -0.1));
  if (look.armor === 'scale' || look.armor === 'plate' || look.armor === 'mail') { d.ell(ox - 9.4, oy - 29.6, 2.4, 1.4, shade(pal.cloth, 0.35), 0.7); }
  // the off arm when there is no shield
  if (!sh && !robe && look.weapon !== 'bow' && look.weapon !== 'longbow') {
    const ax = back ? ox - 10 : ox + 9.5;
    d.line(ax, oy - 27, ax + (back ? -0.5 : 1.5), oy - 17, 4.4, look.armor === 'bare' ? pal.skin : pal.clothDark);
    d.circ(ax + (back ? -0.5 : 1.5), oy - 16.5, 2.1, pal.skin);
  }
  // head
  drawHead(g, look, pal, back, ox, oy, q);
  // weapon (and its arm)
  drawWeapon(g, look, pal, view, q, ox, oy);
  if (sh && !back) drawShield(g, pal, false, ox + 8.5, oy - 19 + (q.brace ? -2 : 0), sh);
  if (look.quiver && back) { d.rrect(ox - 7.5, oy - 35, 5.2, 16, 2, pal.leather); d.line(ox - 6.5, oy - 35.5, ox - 5, oy - 41, 1.3, pal.trim); d.line(ox - 4.5, oy - 35.5, ox - 3, oy - 41, 1.3, look.fire ? 0xffa040 : 0xe8e0c8); }
  if (look.glow) d.circ(ox, oy - 22, 15, 0xff9a40, 0.10);
}

function drawShield(g, pal, back, x, y, kind) {
  const d = P(g);
  const r = kind === 'kite' ? 8 : 8.6;
  if (back) {
    d.ell(x, y, 4.8, r + 0.6, pal.trim);
    d.ell(x + 0.6, y, 3.8, r - 0.6, shade(pal.wood, -0.1));
    d.line(x + 0.6, y - r + 2, x + 0.6, y + r - 2, 1.2, shade(pal.wood, -0.35));
    return;
  }
  d.ell(x, y, r, r + 0.8, pal.trim);
  d.ell(x, y, r - 1.4, r - 0.6, pal.cloth);
  d.ell(x - 1.8, y - 2.2, r - 4, r - 4.4, pal.clothLight, 0.55);
  d.ell(x + 2, y + 2.4, r - 4.2, r - 4.6, shade(pal.cloth, -0.25), 0.5);
  d.circ(x, y, 2.2, pal.metalHi); d.circ(x - 0.6, y - 0.6, 0.9, 0xffffff, 0.6);
}

function drawHead(g, look, pal, back, ox, oy, q) {
  const d = P(g);
  const hx = ox + (q.atk === 1 || q.atk === 3 ? 1.2 : 0), hy = oy - 36.5;
  const h = look.helm;
  // head and face
  d.circ(hx, hy, 6.8, pal.skin);
  if (!back) { d.ell(hx + 2.4, hy + 1, 3.8, 4, SKIN_HI(pal.skin)); d.circ(hx + 3.6, hy - 0.2, 0.9, 0x1c1a17); d.circ(hx + 0.8, hy - 0.4, 0.8, 0x1c1a17, 0.8); }
  else d.ell(hx - 0.6, hy + 0.6, 6.4, 5.6, pal.hair);
  const metalTop = (hRx, hRy) => {
    d.ell(hx, hy - 2.6, hRx, hRy, pal.metal);
    d.ell(hx + 2, hy - 1.6, hRx * 0.55, hRy * 0.7, shade(pal.metal, -0.22), 0.8);
    d.ell(hx - 2.2, hy - 4.4, hRx * 0.45, hRy * 0.38, pal.metalHi, 0.9);
  };
  if (h === 'crestHelm' || h === 'kettle' || h === 'horned') {
    metalTop(7.6, 6.2);
    d.rect(hx - 7.6, hy - 0.4, 15.2, 1.8, shade(pal.metal, -0.35));
    if (h === 'crestHelm') { d.ell(hx, hy - 7.6, 6.2, 2.4, pal.cloth); d.ell(hx - 1.5, hy - 8.4, 3.4, 1.1, pal.clothLight, 0.9); }
    if (h === 'kettle') d.ell(hx, hy - 0.4, 9.6, 2.6, pal.metal);
    if (h === 'horned') { d.curve([hx - 6, hy - 4, hx - 12.5, hy - 7, hx - 10, hy - 14], 2.6, 0xe6dac0); d.curve([hx + 6, hy - 4, hx + 12.5, hy - 7, hx + 10, hy - 14], 2.6, 0xcfc3a8); d.ell(hx, hy - 8, 4, 1.6, pal.cloth); }
  } else if (h === 'leafHelm' || h === 'thornHelm') {
    metalTop(7.6, 6.2);
    // a broad leaf crest in side cloth across the helmet top
    d.poly([hx - 7.5, hy - 4, hx - 3, hy - 10.5, hx + 1, hy - 11.2, hx + 7.6, hy - 5, hx + 1, hy - 7], pal.cloth);
    d.poly([hx - 6, hy - 5, hx - 2.5, hy - 9.5, hx + 0.5, hy - 9.8, hx - 1, hy - 7], pal.clothLight, 0.9);
    if (h === 'thornHelm') for (let i = -2; i <= 2; i++) d.line(hx + i * 2.6, hy - 7, hx + i * 3.4, hy - 12.5, 1.4, shade(pal.bark, -0.2));
  } else if (h === 'hood' || h === 'robeHood') {
    const C = h === 'robeHood' ? pal.clothDark : pal.cloth;
    d.poly([hx - 7.8, hy + 4, hx - 8, hy - 4, hx - 3, hy - 10.5, hx + 3, hy - 10, hx + 8, hy - 3.5, hx + 7.4, hy + 4], C);
    d.poly([hx + 2, hy - 10, hx + 8, hy - 3.5, hx + 7.4, hy + 4, hx + 3, hy + 3], shade(C, -0.22), 0.85);
    if (!back) { d.ell(hx + 2.8, hy + 1, 3.6, 3.8, pal.skin); d.circ(hx + 3.8, hy + 0.2, 0.85, 0x1c1a17); }
    d.ell(hx - 2.4, hy - 6, 3.2, 2, shade(C, 0.25), 0.8);
  } else if (h === 'cap') {
    d.ell(hx, hy - 3.4, 7.2, 5, pal.leather); d.ell(hx - 2, hy - 5, 3.2, 1.8, shade(pal.leather, 0.3));
    d.rect(hx - 7.2, hy - 1.4, 14.4, 2, pal.cloth);
  } else if (h === 'wild') {
    d.ell(hx, hy - 3.6, 7.4, 5, pal.hair);
    for (let i = 0; i < 6; i++) d.line(hx - 6 + i * 2.4, hy - 6, hx - 7.5 + i * 3, hy - 12 - (i % 2) * 2.5, 1.9, pal.hair);
    d.rect(hx - 6.8, hy - 2.6, 13.6, 1.8, pal.cloth);
  } else if (h === 'band') {
    d.ell(hx, hy - 3.4, 6.8, 4.6, pal.hair); d.rect(hx - 7, hy - 2.8, 14, 2.2, pal.cloth);
  } else if (h === 'mitre') {
    d.poly([hx - 6, hy - 2, hx - 5, hy - 13, hx, hy - 17, hx + 5, hy - 13, hx + 6, hy - 2], pal.trim);
    d.poly([hx - 2.4, hy - 3, hx - 1.8, hy - 13, hx + 1.8, hy - 13, hx + 2.4, hy - 3], pal.cloth);
  } else if (h === 'antler') {
    const C = pal.clothDark;
    d.poly([hx - 7.8, hy + 4, hx - 8, hy - 4, hx - 3, hy - 10.5, hx + 3, hy - 10, hx + 8, hy - 3.5, hx + 7.4, hy + 4], C);
    if (!back) d.ell(hx + 2.8, hy + 1, 3.6, 3.8, pal.skin);
    d.curve([hx - 3, hy - 9, hx - 10, hy - 14, hx - 8, hy - 20], 2, 0xdcd0b4); d.line(hx - 8.8, hy - 14.5, hx - 13, hy - 15, 1.6, 0xdcd0b4);
    d.curve([hx + 3, hy - 9, hx + 10, hy - 14, hx + 8, hy - 20], 2, 0xc8bca0); d.line(hx + 8.8, hy - 14.5, hx + 13, hy - 15, 1.6, 0xc8bca0);
  } else if (h === 'leafCrown') {
    d.ell(hx, hy - 3.4, 7, 4.8, pal.hair);
    for (let i = 0; i < 6; i++) d.ell(hx - 6 + i * 2.4, hy - 6.6 - (i % 2) * 1.2, 2, 1.3, 0x86b852);
  }
}

function drawWeapon(g, look, pal, view, q, ox, oy) {
  const d = P(g);
  const back = view === 'ne';
  const w = look.weapon;
  const wp = weaponPose(q);
  const armC = look.armor === 'bare' ? pal.skin : look.armor === 'robe' ? (look.light ? 0xd2c7aa : pal.cloth) : pal.clothDark;
  // weapon shoulder: screen right in the back view, screen left (behind) in the front view
  const sx0 = back ? ox + 9.5 : ox - 9.5, sy0 = oy - 27;
  if (w === 'bow' || w === 'longbow') {
    const L = w === 'longbow' ? 25 : 18;
    const bx = ox + (back ? 11 : 12), by = oy - 24;
    const draw = q.shoot === 0 ? 6 : q.shoot === 1 ? 1 : 0;
    d.line(ox + (back ? 9 : 8), oy - 27, bx, by, 4.2, armC);
    d.curve([bx, by - L, bx + 6, by, bx, by + L * 0.65], 2.6, pal.wood);
    d.line(bx, by - L, bx - draw, by, 0.9, 0xe6dcc0); d.line(bx - draw, by, bx, by + L * 0.65, 0.9, 0xe6dcc0);
    d.line(ox - (back ? 7 : 6), oy - 27, bx - draw - 1, by, 4, armC);
    if (q.shoot === 0) { d.line(bx - draw, by, bx + 11, by - 1.5, 1.4, pal.wood); if (look.fire) { d.circ(bx + 11.5, by - 1.5, 3.6, 0xff8a2a, 0.35); d.circ(bx + 11.5, by - 1.5, 2, 0xffc060); } }
    return;
  }
  // weapon arm toward the hand
  const handX = back ? ox + 11 + wp.w * 2 : ox - 8 + wp.w * 4, handY = oy - 20 - wp.w * 2;
  d.line(sx0, sy0, handX, handY, 4.6, armC);
  d.circ(handX, handY, 2.2, pal.skin);
  const along = (ang, a, b) => [handX + Math.cos(ang) * a, handY + Math.sin(ang) * a, handX + Math.cos(ang) * b, handY + Math.sin(ang) * b];
  if (w === 'spear' || w === 'lance' || w === 'javelin' || w === 'halberd') {
    // idle upright and leaning forward; strike: lowered toward the foe (up-right from the back, down-right from the front)
    const idleA = back ? -1.28 : -1.38, hitA = back ? -0.55 : 0.28, windA = back ? -1.75 : -1.8;
    const ang = wp.w > 0 ? lerp(idleA, hitA, Math.min(1, wp.w)) : lerp(idleA, windA, -wp.w);
    const len = w === 'javelin' ? 30 : w === 'halberd' ? 44 : 48;
    const [x0, y0, x1, y1] = along(ang, -14, len - 14);
    d.line(x0, y0, x1, y1, 2.2, pal.wood);
    const cx = Math.cos(ang), cy = Math.sin(ang);
    if (w === 'halberd') {
      d.poly([x1 - cx * 7 - cy * 1, y1 - cy * 7 + cx * 1, x1 - cx * 2 + cy * 7, y1 - cy * 2 - cx * 7, x1 + cx * 2 + cy * 6, y1 + cy * 2 - cx * 6], pal.metalHi);
      d.line(x1, y1, x1 + cx * 5, y1 + cy * 5, 2, pal.metalHi);
    } else d.poly([x1 + cx * 6, y1 + cy * 6, x1 - cy * 2, y1 + cx * 2, x1 + cy * 2, y1 - cx * 2], pal.metalHi);
    if (w === 'javelin' && q.atk < 0) { d.line(ox - 11, oy - 22, ox - 5, oy - 40, 1.6, pal.wood); d.line(ox - 9.5, oy - 22, ox - 2.5, oy - 39, 1.6, pal.wood); }
  } else if (w === 'sword' || w === 'fireSword' || w === 'dagger') {
    const idleA = back ? -0.9 : -2.2, hitA = back ? 0.2 : 0.5, windA = back ? -2.4 : -2.6;
    const ang = wp.w > 0 ? lerp(idleA, hitA, Math.min(1, wp.w)) : lerp(idleA, windA, -wp.w);
    const len = w === 'dagger' ? 9 : 17;
    const [x0, y0, x1, y1] = along(ang, 0, len);
    if (w === 'fireSword') d.line(x0, y0, x1, y1, 6, 0xff7a20, 0.35);
    d.line(x0, y0, x1, y1, 2.4, w === 'fireSword' ? 0xffbf60 : 0xdde2e6);
    d.line(handX - Math.sin(ang) * 3, handY + Math.cos(ang) * 3, handX + Math.sin(ang) * 3, handY - Math.cos(ang) * 3, 1.8, pal.trim);
  } else if (w === 'axe' || w === 'greatAxe' || w === 'maul') {
    const idleA = back ? -1.1 : -2.0, hitA = back ? 0.35 : 0.6, windA = back ? -2.5 : -2.7;
    const ang = wp.w > 0 ? lerp(idleA, hitA, Math.min(1, wp.w)) : lerp(idleA, windA, -wp.w);
    const len = w === 'greatAxe' ? 24 : 16;
    const [x0, y0, x1, y1] = along(ang, -3, len);
    d.line(x0, y0, x1, y1, 2.4, pal.wood);
    const cx = Math.cos(ang), cy = Math.sin(ang);
    if (w === 'maul') d.rrect(x1 - 5, y1 - 5, 10, 10, 2.5, pal.bark);
    else {
      const s = w === 'greatAxe' ? 8 : 5.6;
      d.poly([x1 - cx * 3, y1 - cy * 3, x1 - cx * 1.5 + cy * s, y1 - cy * 1.5 - cx * s, x1 + cx * 5 + cy * s * 0.8, y1 + cy * 5 - cx * s * 0.8, x1 + cx * 3.5, y1 + cy * 3.5], pal.metalHi);
      if (w === 'greatAxe') d.poly([x1 - cx * 3, y1 - cy * 3, x1 - cy * s * 0.8, y1 + cx * s * 0.8, x1 + cx * 3.5 - cy * s * 0.6, y1 + cy * 3.5 + cx * s * 0.6, x1 + cx * 3.5, y1 + cy * 3.5], shade(pal.metalHi, -0.2));
    }
  } else if (w === 'staff') {
    const ang = (back ? -1.42 : -1.62) + wp.w * 0.5 + (q.shoot >= 0 ? -0.25 : 0);
    const [x0, y0, x1, y1] = along(ang, -20, 30);
    d.line(x0, y0, x1, y1, 2.2, pal.wood);
    d.circ(x1, y1, 5.5, look.staffGlow, 0.25); d.circ(x1, y1, 2.6, look.staffGlow); d.circ(x1 - 0.8, y1 - 0.8, 1, 0xffffff, 0.8);
    if (q.shoot >= 0) d.circ(x1, y1, 10, look.staffGlow, 0.25);
  }
}

function drawBanner(g, pal, back, ox, oy, q) {
  const d = P(g);
  const px = ox + (back ? -12 : -13), top = oy - 74;
  d.line(px, oy - 2, px, top, 2, pal.wood);
  const wave = q.bob * 1.6;
  d.poly([px, top + 1, px + 17, top + 3 + wave, px + 14.5, top + 9.5 + wave, px + 17, top + 16 + wave, px, top + 15], pal.cloth);
  d.poly([px, top + 1, px + 17, top + 3 + wave, px + 16, top + 5.5 + wave, px, top + 4.5], pal.trim);
  d.circ(px, top, 2, pal.trim);
}

function drawLying(g, look, pal, view, q) {
  const d = P(g);
  const back = view === 'ne';
  const s = q.fall === 1 ? 0.9 : 1;
  d.ell(3, -0.5, 17 * s, 4.6, 0x000000, 0.26);
  const T = look.armor === 'bare' ? pal.skin : look.armor === 'bark' ? pal.bark : look.armor === 'robe' ? (look.light ? 0xd2c7aa : pal.cloth) : pal.cloth;
  const legC = look.armor === 'bark' ? pal.bark : pal.leather;
  if (look.body === 'horse' || look.body === 'wolf' || look.body === 'wolfOnly') {
    // a fallen mount: its bulk on the ground with the rider thrown beside it
    const coat = look.body === 'horse' ? pal.horse : 0x6d6a64;
    d.ell(4, -5, 15, 6, coat); d.ell(6, -3, 12, 3.5, shade(coat, -0.25), 0.8);
    d.line(14, -4, 21, -1, 3, shade(coat, -0.2)); d.line(10, -3, 15, 1, 2.6, shade(coat, -0.3));
    d.circ(-10, -6, 4.5, coat);
    if (look.body === 'wolfOnly') return;
  }
  d.line(2 * s, -4, 15 * s, -2.5, 5, legC); d.line(2 * s, -6, 13 * s, -7.5, 5, shade(legC, -0.15));
  d.ell(-3 * s, -5, 9.5 * s, 6, T);
  d.ell(-1 * s, -3, 8 * s, 3.4, shade(T, -0.25), 0.7);
  if (back || look.cape) d.poly([-11 * s, -9, 4 * s, -10, 6 * s, -3, -10 * s, -1.5], pal.cloth, 0.95);
  d.line(-6 * s, -9, -3 * s, -15, 4, look.armor === 'bare' ? pal.skin : pal.clothDark);
  d.circ(-14 * s, -5.5, 5.8, pal.skin);
  if (look.helm === 'crestHelm' || look.helm === 'kettle' || look.helm === 'horned' || look.helm === 'leafHelm' || look.helm === 'thornHelm') { d.ell(-15 * s, -6.5, 6, 5, pal.metal); d.ell(-16.5 * s, -8, 2.6, 1.6, pal.metalHi, 0.8); }
  else if (look.helm === 'hood' || look.helm === 'robeHood' || look.helm === 'antler') d.ell(-15 * s, -6, 6.2, 5.4, look.helm === 'hood' ? pal.cloth : pal.clothDark);
  else d.ell(-15 * s, -6.5, 5.6, 4.4, pal.hair);
  // the dropped weapon
  const w = look.weapon;
  if (w === 'spear' || w === 'halberd' || w === 'lance' || w === 'javelin') d.line(-22 * s, 3, 18 * s, -12, 2, pal.wood);
  else if (w === 'bow' || w === 'longbow') d.curve([-6, 4, 4, 7, 14, 3], 2.2, pal.wood);
  else if (w === 'staff') d.line(-18 * s, 2, 14 * s, 5, 2, pal.wood);
  else if (w) d.line(-2 * s, 4, 10 * s, 6, 2.4, 0xc8ccd0);
  if (look.shield) { d.ell(9 * s, 3, 6.5, 4.2, pal.trim); d.ell(9 * s, 3, 5.2, 3.2, pal.cloth); }
}

function drawRider(g, look, pal, view, q) {
  const d = P(g);
  const back = view === 'ne';
  const wolf = look.body === 'wolf';
  const s = q.step;
  d.ell(5, 1.5, 21, 6, 0x000000, 0.3);
  if (wolf) drawWolf(g, pal, view, q, 0, 0, false);
  else {
    const coat = pal.horse, dark = pal.horseDark;
    for (const [x, o, c] of [[-12, s, dark], [-8, -s, shade(dark, 0.1)], [9, -s, dark], [13, s, shade(dark, 0.1)]]) d.line(x, -13, x + o * 2.4, -1, 3.4, c);
    d.ell(0, -17, 17, 8.5, coat);
    d.ell(2, -13.5, 14, 4.2, shade(coat, -0.25), 0.8);
    d.ell(-3, -21, 11, 3.6, shade(coat, 0.14), 0.7);
    // caparison in side cloth (top-visible)
    d.poly([-13, -23, 10, -23, 12.5, -11, -14, -11], pal.cloth);
    d.poly([-13, -23, 10, -23, 9, -20.5, -12, -20.5], pal.trim, 0.9);
    d.poly([3, -23, 10, -23, 12.5, -11, 4, -11], shade(pal.cloth, -0.22), 0.8);
    if (!back) {
      d.poly([11, -21, 19, -33, 25, -31, 19, -18], coat);
      d.ell(24, -30.5, 4.8, 3.2, dark);
      d.line(19, -32, 17, -36, 1.8, dark); d.line(21, -33, 20, -37, 1.8, dark);
      d.line(12, -22, 18, -34, 2.2, pal.hair, 0.8);
    } else {
      d.ell(-16, -16, 3.4, 7, dark);
      d.poly([10, -22, 16, -33, 20, -31, 15, -20], coat);
      d.line(11, -24, 16, -34, 2.2, pal.hair, 0.8);
    }
  }
  // the rider
  const rx = -1, ry = wolf ? -17 : -21;
  const T = look.armor === 'scale' ? pal.cloth : pal.bark;
  if (back) d.poly([rx - 8, ry - 13, rx + 8, ry - 13, rx + 9, ry + 1, rx - 9, ry + 1], pal.cloth);
  else {
    d.poly([rx - 7.5, ry - 13, rx + 7.5, ry - 13, rx + 6.5, ry + 1, rx - 6.5, ry + 1], T);
    if (look.armor === 'scale') for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) d.ell(rx - 4.8 + c * 3.2 + (r % 2) * 1.5, ry - 10 + r * 3.4, 1.6, 1.1, shade(pal.cloth, -0.4), 0.55);
  }
  d.ell(rx - 7.4, ry - 12, 4.2, 3.2, shade(pal.cloth, 0.12)); d.ell(rx + 7.4, ry - 12, 4.2, 3.2, shade(pal.cloth, -0.1));
  drawHead(g, look, pal, back, rx, ry + 24.5, q);
  // lance or spear: couched forward
  const wp = weaponPose(q);
  const ang = (look.weapon === 'lance' ? (back ? -0.42 : -0.18) : (back ? -0.95 : -0.75)) + wp.w * 0.28;
  const cx = Math.cos(ang), cy = Math.sin(ang);
  const hx = rx + 6, hy = ry - 6;
  const L = look.weapon === 'lance' ? 42 : 34;
  d.line(rx + 7, ry - 11, hx, hy, 4.2, pal.clothDark);
  d.line(hx - cx * 14, hy - cy * 14, hx + cx * L, hy + cy * L, 2.2, pal.wood);
  d.poly([hx + cx * (L + 6), hy + cy * (L + 6), hx + cx * L - cy * 2, hy + cy * L + cx * 2, hx + cx * L + cy * 2, hy + cy * L - cx * 2], pal.metalHi);
  if (look.weapon === 'lance') d.poly([hx + cx * 28, hy + cy * 28, hx + cx * 36, hy + cy * 36, hx + cx * 33 - cy * 6, hy + cy * 33 + cx * 6], pal.cloth);
}

function drawWolf(g, pal, view, q, ox, oy, alone) {
  const d = P(g);
  const back = view === 'ne';
  const s = q.step;
  const fur = 0x726e67, dark = 0x48443f, light = 0xa29d94;
  if (alone) d.ell(ox + 4, oy + 1.5, 17, 5, 0x000000, 0.3);
  for (const [x, o, c] of [[-11, s, dark], [-7, -s, shade(dark, 0.12)], [8, -s, dark], [11, s, shade(dark, 0.12)]]) d.line(ox + x, oy - 10, ox + x + o * 2.2, oy - 0.5, 3.2, c);
  d.ell(ox, oy - 13, 15, 7, fur);
  d.ell(ox - 1, oy - 16.5, 12, 3.4, light, 0.6);
  d.ell(ox + 1, oy - 9.5, 12, 3, shade(fur, -0.25), 0.7);
  d.curve([ox - 14, oy - 14, ox - 20, oy - 17, ox - 24, oy - 12], 3.6, fur);
  const lunge = q.atk === 1 || q.atk === 3 ? 3.5 : 0;
  if (!back || alone) {
    d.poly([ox + 10, oy - 17, ox + 18 + lunge, oy - 22, ox + 25 + lunge, oy - 17.5, ox + 19 + lunge, oy - 11.5, ox + 11, oy - 10], fur);
    d.poly([ox + 14 + lunge, oy - 21, ox + 16.5 + lunge, oy - 27, ox + 19 + lunge, oy - 21], dark);
    d.circ(ox + 21 + lunge, oy - 18, 1, 0x1c1a17);
    if (q.atk === 1 || q.atk === 3) d.poly([ox + 20 + lunge, oy - 14, ox + 26 + lunge, oy - 15, ox + 21 + lunge, oy - 12], 0xa03a30);
  } else d.poly([ox + 10, oy - 17, ox + 17, oy - 23, ox + 21, oy - 20, ox + 13, oy - 12], fur);
}

function drawSprite(g, pal, q) {
  const d = P(g);
  const y = -26 - (q.bob ? 2 : 0) + (q.atk === 1 || q.atk === 3 ? 6 : 0);
  d.circ(0, y, 13, 0xff7a20, 0.16);
  d.poly([-6, y + 7, -3.5, y - 7, 0, y - 15, 3.5, y - 8, 6, y + 7, 0, y + 12], 0xff8a2a);
  d.poly([-3.5, y + 5, -1.8, y - 5, 0.5, y - 10, 3, y - 4, 3.5, y + 5, 0, y + 8], 0xffd060);
  d.circ(0, y - 1, 2.6, 0xfff4c0);
  void pal;
}

function drawSwarm(g, q) {
  const d = P(g);
  const r = mulberry(77 + (q.bob ? 5 : 0) + Math.max(0, q.atk) * 13);
  const tight = q.atk === 1 || q.atk === 3 ? 0.6 : 1;
  // a loose cloud of large striped hornets with bright wing blurs: reads as insects at play zoom, not
  // as a heap (the noted issue in the critique)
  d.ell(0, -26, 17 * tight, 11 * tight, 0xe8d890, 0.1);
  for (let i = 0; i < 11; i++) {
    const a = r() * TAU, rr = (0.35 + 0.65 * Math.sqrt(r())) * 17 * tight;
    const x = Math.cos(a) * rr, y = -26 + Math.sin(a) * rr * 0.7;
    const fl = r() < 0.5 ? -1 : 1;
    d.ell(x - 1.6 * fl, y - 2.2, 2.6, 1.2, 0xffffff, 0.75); d.ell(x + 1.4 * fl, y - 2.4, 2.4, 1.1, 0xffffff, 0.6);
    d.ell(x, y, 2.6, 1.6, 0x1a160a); d.ell(x + 1.4 * fl, y + 0.1, 1.7, 1.2, 0xf0c428); d.ell(x + 2.6 * fl, y + 0.2, 0.9, 0.9, 0x1a160a);
  }
}

  return { ART, FR, INK, PALETTES, LOOKS, drawFigure };
})();
