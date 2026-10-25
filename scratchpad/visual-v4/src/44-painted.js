'use strict';
// ---- painted figures (stage B and C integration of the painted-art plan) ----
// The painted troops, commanders, creatures, mounts and gods replace the procedural figures where their art exists
// (paint-data, built by units/stage-b/integrate/bundle.py). Every frame is a key pose painted at the battle camera;
// motion between them is closed-form transforms of story time (the approved motion layer: each figure its own phase
// and tempo). Troop variation follows the stage B calibration (owner note 1): the
// calibration's material shader and one-sided limits, baked at load into PAINT_K variants per troop page, plus
// per-figure brightness, scale, lean, place jitter, rest frame, phase and tempo. Commanders, creatures, mounts and gods
// are not tinted: they must match their portraits. Looks without art stay procedural (design 12.2).
// Stage C (owner review 2): the creatures, mounts and gods the battles use stand in the game as their stage C figures:
// the Fire Sprite, the Hornet Swarm and the mounted troops on their key-pose sheets with the troop motion below (their
// poses read through PALIAS), the big bodies (the Salamander, the Treant, the Great Wyrm) as their idle cutouts at their
// true heights (PAINT.bigs), unanimated until owner review 3.

const PAINT = (() => { const el = document.getElementById('paint-data'); try { return el ? JSON.parse(el.textContent) : null; } catch (e) { return null; } })();
/** The figures control (Painted | Procedural); Painted is the default. */
const PAINT_MODE = { on: true };
const PAINT_K = 4; // material variants per troop page (neighbours always differ: see paintVariantOf)
// a man's height on screen in device px. Tier S serves the automatic camera (plan 8.4): its holds reach a man of 52.8 px
// (fMax x 1.1), so tier H starts above that (stage B critique fix 3); the player's zoom and DPR >= 1.5 still reach it.
const PAINT_TIER_UP = 56, PAINT_TIER_DOWN = 53;
/** Every pose a painted sheet can hold; frames are resolved to these ids once per look, view and tier. */
const PPOSE = ['stand', 'idle2', 'marchA', 'marchB', 'windup', 'strike', 'follow', 'brace', 'recoil', 'fall', 'deadA', 'deadB',
  'fleeA', 'fleeB', 'cheer', 'dropped', 'nock', 'draw', 'loose', 'aim', 'throw', 'actA', 'actB', 'stand.white', 'recoil.white'];
const PP = Object.fromEntries(PPOSE.map((n, i) => [n, i]));
/** Where a sheet lacks a pose (layouts differ: plan 5.1), the nearest painted one stands in. */
const PFALL = {
  idle2: ['stand'], marchA: ['runA', 'lopeA', 'stand'], marchB: ['runB', 'lopeB', 'stand'], brace: ['stand'],
  follow: ['strike'], windup: ['charge', 'stand'], strike: ['bite', 'windup'], fleeA: ['marchA', 'runA', 'lopeA'], fleeB: ['marchB', 'runB', 'lopeB'], // never the riderless bolt: the rider routes on his mount
  nock: ['aim', 'windup'], draw: ['aim', 'windup'], loose: ['throw', 'strike'], aim: ['draw', 'windup'], throw: ['loose', 'strike'],
  actA: ['cheer', 'windup'], actB: ['strike', 'cheer'], cheer: ['stand'], deadA: ['deadB', 'fall'], deadB: ['deadA', 'fall'], fall: ['recoil'],
  dropped: [], recoil: ['stand'], 'stand.white': [], 'recoil.white': ['stand.white'],
};
// stage C layouts (plan 5.1): the cavalry walks on its walk cells and routs at the gallop
PFALL.marchA = ['runA', 'lopeA', 'walkA', 'stand']; PFALL.marchB = ['runB', 'lopeB', 'walkB', 'stand'];
PFALL.fleeA = ['marchA', 'runA', 'lopeA', 'gallopA', 'walkA']; PFALL.fleeB = ['marchB', 'runB', 'lopeB', 'gallopB', 'walkB'];
/**
 * Layouts whose cells are not a man's: which painted cell each troop pose shows, so the troop motion drives them
 * unchanged (no new animation before owner review 3). The Fire Sprite hovers on its mid-wing cell and beats its wings
 * through the march cadence (up, mid, down, mid); it bursts when it dies. The Hornet Swarm's cells are clouds of 12
 * hornets (bundle_stagec.py), wings up in one half of the cloud while down in the other.
 */
const PALIAS = {
  sprite: { stand: 'wingMid', idle2: 'wingUp', marchA: 'wingUp', marchB: 'wingDown', windup: 'dive', follow: 'strike', brace: 'wingMid', fall: 'burstA',
    deadA: 'burstB', deadB: 'burstB', fleeA: 'wingUp2', fleeB: 'wingDown2', cheer: 'wingUp2', actA: 'wingUp2', actB: 'strike', 'stand.white': 'wingMid.white' },
  hornet: { stand: 'glide', idle2: 'up', marchA: 'up', marchB: 'down', windup: 'up', strike: 'sting', follow: 'sting', brace: 'glide', recoil: 'down', fall: 'deadA',
    fleeA: 'up', fleeB: 'down', cheer: 'up', actA: 'up', actB: 'sting', 'stand.white': 'glide.white', 'recoil.white': 'down.white' },
};
/** A look's alternative frame sets (look.alt): the Wolf Rider's front, 'harness' (default) or the owner-kept 'kept' test. */
const PAINT_ALT = { wolfRider: 'harness' };
/**
 * The painted side looks per battle: the first pairs, by least change, whose rendered torso colours part by at least
 * CVD_MIN + 1 under every vision and keep the value rule (lab run in this page: units/stage-b/integrate/tools/lab2.js,
 * results in lab-painted2.json). Cinder only lightens and Thornwood only darkens (PAINT_SIDE_SHIFT).
 */
const PAINT_SIDE_LOOK_TABLE = {
  'cinderHorde>thornwood@a8a784': { near: 'vivid', far: 'darkestC' },
  'thornwood>cinderHorde@b9bdcb': { near: 'darkC', far: 'lighter' },
  'cinderHorde>thornwood@8e8e78': { near: 'vivid', far: 'darkC' },
}; // stage B critique fix 2: Thornwood's chroma is lifted instead of only darkening it (far side colour 23.5% -> 30%+)

// ---------------------------------------------------------------- colour helpers (OKLab, as the bake shader)
function oklabOf(n) {
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const r = lin((n >> 16) & 255), g = lin((n >> 8) & 255), b = lin(n & 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
function oklchOf(n) { const [L, a, b] = oklabOf(n); return { L, C: Math.hypot(a, b), h: ((Math.atan2(b, a) * 180 / Math.PI) + 360) % 360 }; }

// ---------------------------------------------------------------- the library: pages, frames, looks
class PaintLib {
  constructor(data) {
    this.D = data;
    this.src = { S: [], H: [] };       // ImageSource per page
    this.frames = { S: new Map(), H: new Map() };
    this.ready = false;
    this.texLook = new WeakMap();      // Texture -> look key (for the face-match check)
  }
  async load() {
    const t0 = performance.now();
    const loadImg = (url) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('paint page failed to decode')); i.src = url; });
    for (const tier of ['S', 'H']) {
      const pages = this.D.tiers[tier].pages;
      const imgs = await Promise.all(pages.map((p) => loadImg(p.url)));
      this.src[tier] = imgs.map((img, i) => Object.assign(new PIXI.ImageSource({ resource: img, autoGenerateMipmaps: true, scaleMode: 'linear' }), { pkind: pages[i].kind, pw: pages[i].w, ph: pages[i].h }));
      for (const [name, v] of Object.entries(this.D.tiers[tier].frames)) this.frames[tier].set(name, v);
    }
    // the big bodies' idle cutouts (the Salamander 01 of the pilot, the stage C creatures and gods): one texture each
    this.big = {};
    const tex = (img) => new PIXI.Texture({ source: new PIXI.ImageSource({ resource: img, autoGenerateMipmaps: true, scaleMode: 'linear' }) });
    for (const [fig, b] of Object.entries(this.D.bigs || {})) for (const [view, bv] of Object.entries(b.views)) for (const tier of ['S', 'H']) {
      const s = bv[tier];
      const [img, sh] = await Promise.all([loadImg(s.url), loadImg(s.shadow.url)]);
      (this.big[fig] || (this.big[fig] = {}))[view + tier] = {
        tex: tex(img), ax: s.ax, ay: s.ay, shadow: tex(sh), sax: s.shadow.ax, say: s.shadow.ay, mouth: s.mouth || null, pad: s.pad || 0, heightWu: bv.heightWu,
      };
    }
    // the nations' painted banners (critique fix 6): 128 px at tier S, 256 px at tier H
    this.banner = {};
    for (const [nat, b] of Object.entries(this.D.banners || {})) for (const tier of ['S', 'H']) {
      const img = await loadImg(b[tier].url);
      (this.banner[nat] || (this.banner[nat] = {}))[tier] = new PIXI.Texture({ source: new PIXI.ImageSource({ resource: img, autoGenerateMipmaps: true, scaleMode: 'linear' }) });
    }
    this.loadMs = performance.now() - t0;
    this.ready = true;
  }
  look(key) { return this.D.looks[key] || null; }
  /** A frame's Texture on its plain page (cached), or on variant k of its troop page when `vsrc` is given. */
  frameTex(tier, name, vsrc) {
    const v = this.frames[tier].get(name);
    if (!v) return null;
    const cache = vsrc ? (vsrc.cache || (vsrc.cache = new Map())) : (this._tc || (this._tc = { S: new Map(), H: new Map() }))[tier];
    let t = cache.get(name);
    if (!t) {
      const source = vsrc ? vsrc.pages[v[0]] || this.src[tier][v[0]] : this.src[tier][v[0]];
      t = new PIXI.Texture({ source, frame: new PIXI.Rectangle(v[1], v[2], v[3], v[4]) });
      t.pax = v[5]; t.pay = v[6]; t.pvar = v[7] || null; t.pname = name;
      cache.set(name, t);
    }
    return t;
  }
}
const PAINTLIB = PAINT ? new PaintLib(PAINT) : null;

/**
 * The painted look of a battle group, or null (procedural) with the reason. Troops use their unit's sheets;
 * commanders their own face (matched by the card portrait); creatures and mounted troops their stage C figure.
 */
function paintLookOf(B, g) {
  if (!PAINTLIB) return { key: null, why: 'no paint data' };
  const near = g.side === B.nearSide, main = near ? 'back' : 'front';
  if (g.size >= 3) { const fig = paintBigOf(B, g); return { key: null, why: fig ? `big body: painted cutout ${fig}` : 'big body: no painted cutout' }; }
  if (g.isCmd) {
    if (!g.portrait) return { key: null, why: 'no portrait' };
    const h = hash32(g.portrait);
    for (const [k, L] of Object.entries(PAINT.looks)) if (L.kind === 'commander' && L.portraitHash === h) {
      if (!L.views[main]) return { key: null, why: `face ${L.face}: no ${main} view yet (cmdB stopped on HTTP 402)` };
      return { key: k };
    }
    const miss = PAINT.missing.find((m) => m.unit === g.unit);
    return { key: null, why: miss ? miss.reason : 'face not painted' };
  }
  const L = PAINT.looks[g.unit];
  if (!L) return { key: null, why: 'no sheet' };
  if (!L.views[main] && !L.oneView) return { key: null, why: `no ${main} view` };
  return { key: g.unit };
}

/**
 * The painted big body of a battle group (size 3 and up), or null: a summoned commander by its card portrait (the face
 * the seed drew), a god by its chassis and its nation's palette.
 */
function paintBigOf(B, g) {
  if (!PAINTLIB || !PAINT.bigs || g.size < 3) return null;
  const nat = B.sides[g.side].def, h = g.portrait ? hash32(g.portrait) : null;
  for (const [fig, b] of Object.entries(PAINT.bigs)) {
    if (b.unit !== g.unit) continue;
    if (b.kind === 'god' ? b.nation === nat : h !== null && b.portraitHash === h) return fig;
  }
  return null;
}

/** Seeded per-figure variation (calibration 5.1; limits in PAINT.limits, recorded in variation.json). */
function paintVary(T, f, G, look) {
  const r = streamFor(T.id, 'vary/' + f.g + '/' + f.member);
  const lim = PAINT.limits;
  const troop = look.kind === 'troop';
  const v = {
    rest: troop && look.layout === 'melee' && r() < lim.restIdle2 ? 'idle2' : 'stand',
    scale: troop || look.kind === 'mounted' ? lerp(lim.scale[0], lim.scale[1], r()) : 1,
    bright: troop || look.kind === 'mounted' ? lerp(lim.bright[0], lim.bright[1], r()) : 1,
    lean: troop ? lerp(lim.leanDeg[0], lim.leanDeg[1], r()) * Math.PI / 180 : 0,
    jx: troop ? (r() * 2 - 1) * lim.jitterWu : 0, jy: troop ? (r() * 2 - 1) * lim.jitterWu : 0,
    phase: r(), tempo: lerp(lim.tempo[0], lim.tempo[1], r()),
    swap: 1.2 + 0.8 * r(), // idle shuffle period (s)
    variant: 0,
  };
  if (troop) {
    // neighbours in a rank differ in file parity, neighbours across ranks in rank parity: the 4 variants never meet
    const f2 = Math.round(f.file * 2);
    const perm = (hash32(T.id + '/vperm/' + f.g) % 24);
    const P = [[0, 1, 2, 3], [1, 0, 3, 2], [2, 3, 0, 1], [3, 2, 1, 0], [0, 2, 1, 3], [2, 0, 3, 1]][perm % 6];
    v.variant = P[(((f2 >> 1) & 1) + 2 * (f.rank & 1)) % PAINT_K];
  }
  if (look.clusters) v.variant = Math.floor(r() * look.clusters); // a swarm figure: one of its cloud layouts
  return v;
}

// ---------------------------------------------------------------- the variant bake (the calibration's shader)
const PAINT_VERT = `#version 300 es
in vec2 aPosition; in vec2 aUV; in vec4 aBox; in vec4 aShield; in vec2 aBody;
out vec2 vUV; out vec2 vLocal; out vec4 vShield; out vec2 vBody;
uniform mat3 uProjectionMatrix; uniform mat3 uWorldTransformMatrix; uniform mat3 uTransformMatrix;
void main() {
  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
  vUV = aUV; vLocal = (aUV - aBox.xy) / (aBox.zw - aBox.xy); vShield = aShield; vBody = aBody;
}`;
const PAINT_FRAG = `#version 300 es
precision highp float;
in vec2 vUV; in vec2 vLocal; in vec4 vShield; in vec2 vBody;
uniform sampler2D uTexture;
uniform float uClothH; uniform float uClothCmin; uniform vec4 uT1; uniform vec4 uT2; uniform vec4 uT3; uniform vec2 uSide; uniform float uSideCmin;
uniform float uStencilLight; uniform float uStencilDark;
out vec4 finalColor;
float cbrt(float x) { return sign(x) * pow(abs(x), 1.0 / 3.0); }
vec3 s2l(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
vec3 l2s(vec3 c) { c = clamp(c, 0.0, 1.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
vec3 toLab(vec3 c) {
  float l = cbrt(0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b);
  float m = cbrt(0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b);
  float s = cbrt(0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b);
  return vec3(0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s);
}
vec3 toLin(vec3 L) {
  float l = L.x + 0.3963377774 * L.y + 0.2158037573 * L.z, m = L.x - 0.1055613458 * L.y - 0.0638541728 * L.z, s = L.x - 0.0894841775 * L.y - 1.2914855480 * L.z;
  l = l * l * l; m = m * m * m; s = s * s * s;
  return vec3(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
}
vec2 rot(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }
float stencilShield(float id, vec2 p) {
  float r = length(p);
  if (id < 0.5) return 0.0;
  if (id < 1.5) return step(0.70, r);
  if (id < 2.5) return step(0.42, r) * step(r, 0.60);
  if (id < 3.5) return step(abs(p.x), 0.22);
  if (id < 4.5) return step(abs(p.y), 0.22);
  if (id < 5.5) return step(0.0, p.x * p.y);
  if (id < 6.5) { float y0 = 0.15 - 0.9 * abs(p.x); return step(y0, p.y) * step(p.y, y0 + 0.36); }
  return step(0.0, p.x + p.y);
}
void main() {
  vec4 t = texture(uTexture, vUV);
  if (t.a < 0.003) { finalColor = vec4(0.0); return; }
  vec3 c = t.rgb / t.a;
  vec3 lab = toLab(s2l(c));
  float C = length(lab.yz);
  float h = atan(lab.z, lab.y);
  float solid = smoothstep(0.86, 0.96, t.a);
  float dh = abs(mod(h - uClothH + 3.14159265, 6.2831853) - 3.14159265);
  float wC = solid * clamp((0.4538 - dh) / 0.1396, 0.0, 1.0) * clamp((C - uClothCmin) / 0.02, 0.0, 1.0);
  float hd = mod(degrees(h) + 360.0, 360.0);
  float warm = smoothstep(15.0, 30.0, hd) * (1.0 - smoothstep(90.0, 110.0, hd));
  float wM = solid * (1.0 - wC) * clamp((0.032 - C) / 0.012, 0.0, 1.0) * smoothstep(0.22, 0.32, lab.x);
  float chrom = clamp((C - 0.018) / 0.015, 0.0, 1.0);
  float lit = smoothstep(0.52, 0.62, lab.x);
  float wS = solid * (1.0 - wC) * (1.0 - wM) * warm * chrom * lit;
  float wL = solid * (1.0 - wC) * (1.0 - wM) * warm * chrom * (1.0 - lit);
  vec2 ab = lab.yz;
  float st = 0.0;
  if (vShield.z > 0.0 && uT3.y != 0.0) {
    vec2 p = (vLocal - vShield.xy) / vShield.zw;
    if (length(p) < 1.0) st = stencilShield(abs(uT3.y) - 1.0, p);
  }
  float top = vBody.x, bot = vBody.y, hh = max(0.01, bot - top), fy = (vLocal.y - top) / hh;
  if (uT3.z > 0.5 && fy < 0.17) st = max(st, uT3.z < 1.5 ? step(fy, 0.07) : step(0.5, fract(vLocal.x * 7.0)));
  if (uT3.w > 0.5) {
    if (uT3.w < 1.5) st = max(st, step(abs(fy - 0.55), 0.03));
    else if (uT3.w < 2.5) st = max(st, step(abs((fy - 0.30) - 0.75 * (vLocal.x - 0.35)), 0.045) * step(0.2, fy) * step(fy, 0.75));
    else st = max(st, step(0.80, fy));
  }
  float stShade = uT3.y < 0.0 ? uStencilLight : uStencilDark;
  vec2 abC = rot(ab, uT1.y) * uT1.z;
  float LC = lab.x + uT1.x + st * stShade;
  vec2 abS = rot(ab, uT2.y);
  float LS = lab.x + uT2.x;
  float LM = lab.x + uT2.z;
  vec2 abM = ab + (uT2.w > 0.0 ? vec2(0.629, 0.777) * 0.012 : vec2(-0.342, -0.940) * 0.008) * abs(uT2.w);
  float LL = lab.x + uT3.x;
  float wO = 1.0 - wC - wS - wM - wL;
  vec3 o = vec3(wC * LC + wS * LS + wM * LM + wL * LL + wO * lab.x, wC * abC + wS * abS + wM * abM + wL * ab + wO * ab);
  // the battle's side look (colour-blind separation, design revision 6): the side's cloth and its keyline moved in
  // lightness, with a wider chroma floor than the variation's so the dark painted Thornwood cloth is caught too
  float wSide = smoothstep(0.25, 0.5, t.a) * clamp((0.5236 - dh) / 0.1396, 0.0, 1.0) * clamp((C - uSideCmin) / 0.015, 0.0, 1.0); // the side keyline too
  o.x += wSide * uSide.x; o.yz *= mix(1.0, uSide.y, wSide);
  finalColor = vec4(l2s(toLin(o)), 1.0) * t.a;
}`;

/**
 * The painted side looks: the side's cloth moved in OKLab lightness (and chroma), one way per nation as the
 * calibration's variation limits (Cinder only lighter, Thornwood only darker), so the colour-blind contrast of the
 * two armies only grows. Chosen per battle by the lab (window.__battle.paintLab) into PAINT_SIDE_LOOK_TABLE.
 */
const PAINT_SIDE_SHIFT = {
  cinderHorde: { base: [0, 1], light: [0.05, 1.04], lighter: [0.1, 1.06], lightest: [0.15, 1.08], vivid: [0.15, 1.25] },
  // darkening alone clips the dark green's chroma (far side colour 23.5%): the C looks lift chroma too (critique fix 2)
  thornwood: { base: [0, 1], dark: [-0.05, 1], darker: [-0.09, 1], darkest: [-0.13, 1], darkC: [-0.05, 1.3], darkestC: [-0.12, 1.3] },
};
function paintSideShift(nation, which) {
  const t = PAINT_SIDE_SHIFT[nation];
  return (t && t[which]) || [0, 1];
}

/** The K material variants of one nation's troop page, for one tier and side look: K render textures. */
function bakePaintVariants(renderer, tier, nation, sideWhich) {
  const lib = PAINTLIB;
  const pages = lib.src[tier].map((s, i) => ({ s, i })).filter(({ s }) => s.pkind === 'troops:' + nation);
  const lim = PAINT.limits, cl = lim.cloth[nation];
  const clothHex = hexToNum(PAINT.cloth[nation]);
  const lch = oklchOf(clothHex);
  const side = paintSideShift(nation, sideWhich);
  const out = [];
  const t0 = performance.now();
  for (let k = 0; k < PAINT_K; k++) {
    const r = streamFor('paint-variants', nation + '/' + k);
    const q = (j) => ((((k * j) % PAINT_K) + 0.5) / PAINT_K); // evenly spread, decorrelated per dimension
    const t1 = [lerp(cl.L[0], cl.L[1], q(1)), lerp(cl.hueDeg[0], cl.hueDeg[1], q(3)) * Math.PI / 180, lerp(cl.C[0], cl.C[1], q(1) * 0.5 + r() * 0.5), 1];
    const t2 = [lerp(lim.skinL[0], lim.skinL[1], r()), lerp(lim.skinHueDeg[0], lim.skinHueDeg[1], r()) * Math.PI / 180, lerp(lim.metalL[0], lim.metalL[1], q(3)), lerp(lim.metalWarm[0], lim.metalWarm[1], r())];
    const light = cl.stencil === 'light';
    const t3 = [lerp(lim.leatherL[0], lim.leatherL[1], r()), 0, 0, 0];
    if (tier === lim.stencilsAtTier) { t3[1] = (light ? -1 : 1) * (1 + ((k * 3 + 1) % 8)); t3[2] = k % 3; t3[3] = (k + 1) % 4; }
    const vsrc = { pages: [], params: { t1, t2, t3 }, cache: null };
    for (const { s, i } of pages) {
      const names = [...lib.frames[tier].entries()].filter(([, v]) => v[0] === i);
      const n = names.length, nv = n * 4;
      const pos = new Float32Array(nv * 2), uv = new Float32Array(nv * 2), box = new Float32Array(nv * 4), shd = new Float32Array(nv * 4), body = new Float32Array(nv * 2);
      names.forEach(([, v], j) => {
        const [, x, y, w, h] = v, va = v[7] || {};
        const u0 = x / s.pw, v0 = y / s.ph, u1 = (x + w) / s.pw, v1 = (y + h) / s.ph;
        const cs = [[x, y, u0, v0], [x + w, y, u1, v0], [x + w, y + h, u1, v1], [x, y + h, u0, v1]];
        const sh = va.shield || [0, 0, -1, -1], bd = va.body || [0, 1];
        for (let c = 0; c < 4; c++) {
          const o = j * 4 + c;
          pos[o * 2] = cs[c][0]; pos[o * 2 + 1] = cs[c][1]; uv[o * 2] = cs[c][2]; uv[o * 2 + 1] = cs[c][3];
          box.set([u0, v0, u1, v1], o * 4); shd.set(sh, o * 4); body.set(bd, o * 2);
        }
      });
      const idx = new Uint32Array(n * 6);
      for (let j = 0; j < n; j++) idx.set([0, 1, 2, 0, 2, 3].map((q2) => q2 + 4 * j), j * 6);
      const geometry = new PIXI.Geometry({
        attributes: {
          aPosition: { buffer: pos, format: 'float32x2' }, aUV: { buffer: uv, format: 'float32x2' }, aBox: { buffer: box, format: 'float32x4' },
          aShield: { buffer: shd, format: 'float32x4' }, aBody: { buffer: body, format: 'float32x2' },
        },
        indexBuffer: idx,
      });
      const shader = PIXI.Shader.from({
        gl: { vertex: PAINT_VERT, fragment: PAINT_FRAG },
        resources: {
          uTexture: s,
          u: new PIXI.UniformGroup({
            uClothH: { value: lch.h * Math.PI / 180, type: 'f32' }, uClothCmin: { value: Math.max(0.04, 0.45 * lch.C), type: 'f32' },
            uT1: { value: new Float32Array(t1), type: 'vec4<f32>' }, uT2: { value: new Float32Array(t2), type: 'vec4<f32>' }, uT3: { value: new Float32Array(t3), type: 'vec4<f32>' },
            uSide: { value: new Float32Array(side), type: 'vec2<f32>' }, uSideCmin: { value: nation === 'thornwood' ? 0.02 : Math.max(0.04, 0.45 * lch.C), type: 'f32' },
            uStencilLight: { value: lim.stencilLight, type: 'f32' }, uStencilDark: { value: lim.stencilDark, type: 'f32' },
          }),
        },
      });
      const mesh = new PIXI.Mesh({ geometry, shader });
      const rt = PIXI.RenderTexture.create({ width: s.pw, height: s.ph, resolution: 1, autoGenerateMipmaps: true, scaleMode: 'linear' });
      renderer.render({ container: mesh, target: rt, clear: true, clearColor: [0, 0, 0, 0] });
      rt.source.updateMipmaps();
      vsrc.pages[i] = rt.source;
      vsrc.rts = vsrc.rts || []; vsrc.rts.push(rt);
      mesh.destroy(); geometry.destroy(); shader.destroy();
    }
    out.push(vsrc);
  }
  out.ms = performance.now() - t0;
  return out;
}

// ---------------------------------------------------------------- per look: frame textures per view and tier
/**
 * Resolves a look's poses to textures once: tex[tier][view][variant][poseId] (variants only for troops), with the
 * fallback chain for poses a layout lacks and, where a view is missing, the other view as a stand-in (flagged).
 */
function paintLookTextures(lib, key, tier, variants) {
  const L = lib.look(key);
  const out = {};
  const alias = PALIAS[L.layout] || null;
  for (const view of ['back', 'front']) {
    const have = L.views[view] ? view : L.views[view === 'back' ? 'front' : 'back'] ? (view === 'back' ? 'front' : 'back') : null;
    if (!have) continue;
    // a look's alternative frame set for this view (the Wolf Rider's front: the harness edit or the kept test)
    const sheet = L.alt && L.alt[have] ? L.alt[have][PAINT_ALT[key]] || have : have;
    const vs = variants && L.kind === 'troop' ? variants : L.clusters ? Array.from({ length: L.clusters }, (_, c) => ({ cluster: c })) : [null];
    out[view] = { standIn: have !== view && !L.oneView, view: have, sheet, v: vs.map((vsrc) => PPOSE.map((p) => {
      const tryName = (n) => {
        const nn = (alias && alias[n]) || n;
        const cl = vsrc && vsrc.cluster !== undefined;
        const name = cl ? `${L.prefix}.${sheet}.c${vsrc.cluster}.${nn}` : `${L.prefix}.${sheet}.${nn}`;
        const white = nn.endsWith('.white');
        return lib.frameTex(tier, name, white || cl ? null : vsrc);
      };
      let tx = tryName(p);
      if (!tx) for (const alt of PFALL[p] || []) { tx = tryName(alt); if (tx) break; }
      if (!tx && p !== 'dropped' && !p.endsWith('.white')) tx = tryName('stand');
      if (tx) lib.texLook.set(tx, key);
      return tx;
    })) };
  }
  return out;
}

// ---------------------------------------------------------------- the motion layer: pose and transforms at t
const _rs0 = { x: 0, y: 0, h: 0 }, _rs1 = { x: 0, y: 0, h: 0 };
/** A figure's ground speed at t (wu/s), over the next 1/30 s. */
function routSpeed(T, f, t) {
  figPos(T, f, t, _rs0); figPos(T, f, t + 1 / 30, _rs1);
  return Math.hypot(_rs1.x - _rs0.x, _rs1.y - _rs0.y) * 30;
}
/** The seat cue sliding a figure at t (a slide of more than 4 wu), or null. */
function activeSeatCue(f, t) {
  const c = f.seatCues;
  if (!c) return null;
  for (let i = c.length - 1; i >= 0; i--) {
    const q = c[i];
    if (q.t <= t) return t < q.t + q.d && Math.hypot(q.u - q.u0, q.v - q.v0) > 4 ? q : null;
  }
  return null;
}
const _pp = { pose: 0, rot: 0, lift: 0, sx: 1, sy: 1, dx: 0, dy: 0 };
/**
 * The painted pose of a figure at t, read from the same timeline data as evalFigure (st holds its result:
 * position, view, flip, visibility). Returns a reused object: the pose id and closed-form transforms.
 */
/** The hit flash's window in story seconds: one frame at 60 fps, and one real frame at 2x and 4x (docs/12 S2.14). */
function hitFlashWin(speed) { return Math.max(1, speed || 1) / 60; }
/** Reduced motion (the OS setting or the menu's toggle): hit flashes become a red tint. */
function hitReduced() { return typeof GAME !== 'undefined' && !!GAME.reduced; }
function paintPose(T, f, G, t, speed, st, look, v, extra) {
  const o = _pp;
  o.pose = PP.stand; o.rot = 0; o.lift = 0; o.sx = 1; o.sy = 1; o.dx = 0; o.dy = 0; o.hurt = 0;
  const near = G.s < 0;
  const tempo = v.tempo;
  const fwd = st.flip ? -1 : 1; // the screen x direction the figure faces (both views: flip turns it left)
  // dead or falling: fall, then the dead pose the decal keeps
  if (f.death && t >= f.death.t) {
    const k = (t - f.death.t) / f.death.fall;
    o.pose = k < 0.5 ? PP.fall : (f.death.flip ? PP.deadB : PP.deadA); // the decal keeps this same pose (critique fix 4)
    // tipping over, then easing into the decal's own rotation (no jump at half the fall)
    o.rot = k < 0.5 ? -fwd * 0.22 * smooth(k * 2) : lerp(-fwd * 0.22, f.death.rot * 0.5, smooth((k - 0.5) * 2));
    return o;
  }
  // routing: one flee frame per 17 wu run, so the feet keep pace with the eased run; standing once it has arrived
  // (no jogging on the spot at the field edge: critique fix 5c)
  if (f.rout && t >= f.rout.t) {
    const r = f.rout, q = clamp((t - r.t) / r.dur, 0, 1);
    let d = r.D * easeOut(q);
    const leaving = r.tLeave !== null && t > r.tLeave;
    if (leaving) d += 40 * clamp((t - r.tLeave) / 0.5, 0, 1);
    // arrived, or slowed below a walk (15 wu/s, his ground speed as figPos moves him, block and seat included): he
    // stands, catching his breath, instead of running on the spot
    if (!leaving && (q >= 0.97 || routSpeed(T, f, t) < 15)) { o.pose = PP.stand; o.sy = 1 + 0.012 * Math.sin(t * 5 * tempo + v.phase * TAU); return o; }
    const u = d / 17 + v.phase * 2;
    o.pose = (Math.floor(u) & 1) ? PP.fleeB : PP.fleeA;
    o.lift = (u % 1) < 0.5 ? 1.2 : 0;
    o.rot = fwd * 0.08;
    return o;
  }
  // the victory cheer: the winner's standing figures in the outro, each on its own beat
  if (extra.cheerT !== null && t >= extra.cheerT && G.side === extra.winner && !activeSeatCue(f, t)) { // dressing ranks: shuffle first
    const u = (t - extra.cheerT) * 1.5 * tempo + v.phase;
    const up = (u % 1) < 0.5;
    o.pose = up ? PP.cheer : PP.stand;
    o.lift = up ? 3 * Math.sin(Math.PI * ((u % 1) * 2)) : 0;
    return o;
  }
  let pose = -1;
  // reactions first (as evalFigure): recoil, a white flash on a wound, knocked back and tilted away from the blow
  for (let i = f.reacts.length - 1; i >= 0; i--) {
    const rc = f.reacts[i];
    if (t < rc.t) continue;
    if (t > rc.t + 0.2) break;
    if (rc.item && !shownAt(rc.item, speed) && rc.kind !== 'kill') break;
    if (rc.kind === 'wound' || rc.kind === 'blocked') {
      const q = (t - rc.t) / 0.2;
      // the hit flash (docs/12 S2.9, S2.14): white at 90% for one frame (1/60 s of story; a real frame at 2x and 4x); a
      // fire wound flashes orange through the effects layer instead (critique fix 2); reduced motion: a red tint, no flash
      const phys = rc.kind === 'wound' && rc.element !== 'fire';
      pose = phys && t < rc.t + hitFlashWin(speed) && !hitReduced() ? PP['recoil.white'] : PP.recoil;
      if (phys && hitReduced() && t < rc.t + 0.15) o.hurt = 1 - (t - rc.t) / 0.15;
      o.rot = -fwd * 0.1 * (1 - q);
      o.dy = G.s * 2 * (1 - q);
    }
    break;
  }
  if (pose < 0) {
    // striking: windup, strike, follow-through, with the lunge evalFigure already applied
    for (let i = f.strikes.length - 1; i >= 0; i--) {
      const s = f.strikes[i];
      if (t >= s.t + s.strike + s.rec) break;
      if (t < s.t - s.wind) continue;
      if (!shownAt(s.item, speed)) continue;
      if (t < s.t) { pose = PP.windup; o.rot = -fwd * 0.08 * ((t - (s.t - s.wind)) / s.wind); o.sx = 0.98; }
      else if (t < s.t + s.strike) { pose = PP.strike; o.rot = fwd * 0.07; }
      else { pose = PP.follow; o.rot = fwd * 0.1 * (1 - (t - s.t - s.strike) / s.rec); }
      break;
    }
  }
  if (pose < 0) {
    // shooting and casting: nock, draw (held), loose; aim, throw, follow; a caster's actA (charge) and actB (release)
    for (let i = f.shots.length - 1; i >= 0; i--) {
      const s = f.shots[i];
      if (t < s.t) continue;
      if (t > s.tRel + 0.35) break;
      if (s.item && !shownAt(s.item, speed)) break;
      if (s.kind === 'cast') {
        pose = t < s.tRel ? PP.actA : PP.actB;
        if (t >= s.tRel) o.dy = -G.s * (s.recoil || 4) * Math.max(0, 1 - (t - s.tRel) / 0.25); // the release recoil (Fireball 6 wu: art plan 7.3)
        if (t < s.tRel) o.sy = 1 + 0.02 * Math.min(1, (t - s.t) / Math.max(0.1, s.tRel - s.t));
      } else if (look.layout === 'thrower') pose = t < s.tRel ? PP.aim : t < s.tRel + 0.14 ? PP.throw : PP.follow;
      else {
        pose = t < s.t + 0.1 ? PP.nock : t < s.tRel ? PP.draw : t < s.tRel + 0.14 ? PP.loose : PP.stand;
        if (pose === PP.draw) o.rot = -fwd * 0.02;
      }
      break;
    }
  }
  if (pose < 0 && extra.rally) {
    // a general rallies: the weapon raised, then pointed at the enemy (on holds and when his squads hold)
    for (const ra of extra.rally) {
      if (t < ra || t >= ra + 1.1) continue;
      pose = t < ra + 0.5 ? PP.actA : PP.actB;
      break;
    }
  }
  if (pose < 0) {
    const seg = activeSeg(G.path, t);
    const moving = seg && (Math.abs(seg.x1 - seg.x0) + Math.abs(seg.y1 - seg.y0) > 2);
    const cue = moving ? null : activeSeatCue(f, t);
    if (moving) {
      // the march: marchA, pass, marchB, pass at a cadence set by the block's speed (an 11 wu step, 1.7 to 5 steps a
      // second, critique fix 5a), a bob at the passing frames that grows with the pace, and a forward lean
      const spd = Math.hypot(seg.x1 - seg.x0, seg.y1 - seg.y0) / Math.max(1e-3, seg.t1 - seg.t0);
      const steps = clamp(spd / 11, 1.7, 5) * tempo;
      const u = (t - seg.t0) * steps * 2 + v.phase * 4;
      const k = Math.floor(u) & 3;
      pose = [PP.marchA, PP.stand, PP.marchB, PP.stand][k];
      o.lift = (k & 1) ? (1.5 + clamp((spd - 30) / 60, 0, 1)) * Math.sin(Math.PI * (u % 1)) : 0;
      o.rot = fwd * (0.06 + 0.06 * clamp((spd - 30) / 90, 0, 1) + 0.017 * Math.sin(u * Math.PI / 2));
    } else if (cue) {
      // closing ranks or dressing: short shuffle steps while the seat slides (critique fix 5b)
      const u = (t - cue.t) * 8 + v.phase * 4;
      pose = [PP.marchA, PP.stand, PP.marchB, PP.stand][Math.floor(u) & 3];
    } else if (G.inContactAt && G.inContactAt(t) && f.rank === 0 && look.kind === 'troop' && look.layout === 'melee') {
      pose = PP.brace; o.sy = 0.985; o.rot = fwd * 0.05;
    } else {
      // at rest: each figure's own rest frame, shuffling to the other now and then, breathing
      const swap = (Math.floor(t / v.swap + v.phase * 3) & 3) === 3;
      pose = v.rest === 'idle2' ? (swap ? PP.stand : PP.idle2) : (swap ? PP.idle2 : PP.stand);
      o.sy = 1 + 0.008 * Math.sin(t * 2.4 * tempo + v.phase * TAU);
    }
  }
  o.pose = pose;
  return o;
}

// ---------------------------------------------------------------- painted banners (critique fix 6)
/**
 * A nation's painted banner: a pole and the cloth on a 9 x 3 MeshPlane whose column 0 stays on the pole, waved by a
 * travelling sine (the banner JSON's strip mesh). Block standards and the generals carry it.
 */
function makePaintBanner(nation) {
  const root = new PIXI.Container();
  const pole = new PIXI.Sprite(PIXI.Texture.WHITE); pole.tint = 0x3b2d20; pole.anchor.set(0.5, 1);
  const mesh = new PIXI.MeshPlane({ texture: PAINTLIB.banner[nation].S, verticesX: 9, verticesY: 3 });
  mesh.autoResize = false;
  root.addChild(pole, mesh);
  return { root, pole, mesh, nation, tier: 'S' };
}
/**
 * Places a banner in world screen units: the pole from (X, Yfoot) up to Ytop, the cloth w x h hanging from the pole
 * top and flying toward dir (+1 screen right, -1 left), its free end waving by amp.
 */
function placePaintBanner(b, tier, X, Yfoot, Ytop, w, h, dir, t, ph, amp) {
  if (b.tier !== tier) { b.mesh.texture = PAINTLIB.banner[b.nation][tier]; b.tier = tier; }
  b.pole.position.set(X, Yfoot); b.pole.width = 1.5; b.pole.height = Math.max(1, Yfoot - Ytop + 1.5);
  const buf = b.mesh.geometry.getBuffer('aPosition'), pos = buf.data;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++) {
    const i = (r * 9 + c) * 2, u = c / 8;
    pos[i] = X + dir * (u * w - 0.3 * u * u * Math.abs(amp));
    pos[i + 1] = Ytop + 0.5 + (r / 2) * h + Math.sin(t * 3 + ph - c * 0.7) * amp * u + 0.6 * u * u;
  }
  buf.update();
}

// ---------------------------------------------------------------- big bodies: their approved idle cutouts
/**
 * A painted big body (the Salamander 01 of the pilot; the stage C Salamander faces, Treants, Giants and gods): its idle
 * cutout in one view, scaled so its true height on screen is its metadata's heightWu, the ground anchor at the origin,
 * its silhouette shadow, and its mouth point where it breathes. Standing, unanimated until the owner's stage D review.
 */
function makePaintedBig(fig, view) {
  const b = PAINT.bigs[fig];
  const root = new PIXI.Container();
  const sp = new PIXI.Sprite(); root.addChild(sp);
  const shadow = new PIXI.Sprite();
  const body = {
    root, kind: b.unit, fig, H: b.views[view].heightWu, heightWu: b.views[view].heightWu, painted: true, sprite: sp, shadowSprite: shadow, view, tier: null, k: 0.5, pad: 1,
    setTier(tier) {
      if (this.tier === tier) return;
      this.tier = tier;
      const s = PAINTLIB.big[fig][view + tier];
      sp.texture = s.tex; sp.anchor.set(s.ax, s.ay);
      this.k = PAINT.wuPerPx[tier]; sp.scale.set(this.k); this.pad = s.pad;
      shadow.texture = s.shadow; shadow.anchor.set(s.sax, s.say);
      this.mouthPt = s.mouth ? { x: s.mouth[0], y: s.mouth[1] } : null;
    },
    pose() { /* standing, unanimated until the owner's stage D review (art plan 4) */ },
  };
  if (b.views[view].S.mouth) body.mouth = function mouth() { return this.mouthPt; };
  body.setTier('S');
  return body;
}
