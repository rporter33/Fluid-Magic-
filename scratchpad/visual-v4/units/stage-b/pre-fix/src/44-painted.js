'use strict';
// ---- painted figures (stage B integration of the painted-art plan) ----
// The painted troops, commanders, the Wolf Rider pilot test and the Salamander face 01 replace the procedural
// figures where their art exists (paint-data, built by units/stage-b/integrate/bundle.py). Every frame is a key pose
// painted at the battle camera; motion between them is closed-form transforms of story time (the approved motion
// layer: each figure its own phase and tempo). Troop variation follows the stage B calibration (owner note 1): the
// calibration's material shader and one-sided limits, baked at load into PAINT_K variants per troop page, plus
// per-figure brightness, scale, lean, place jitter, rest frame, phase and tempo. Commanders, the Salamander and the
// Wolf Rider are not tinted: they must match their portraits. Looks without art stay procedural (design 12.2).

const PAINT = (() => { const el = document.getElementById('paint-data'); try { return el ? JSON.parse(el.textContent) : null; } catch (e) { return null; } })();
/** The figures control (Painted | Procedural); Painted is the default. */
const PAINT_MODE = { on: true };
const PAINT_K = 4; // material variants per troop page (neighbours always differ: see paintVariantOf)
const PAINT_TIER_UP = 50, PAINT_TIER_DOWN = 44; // a man's height on screen in device px: tier S at 48 and below (plan 8.4)
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
/**
 * The painted side looks per battle: the first pairs, by least change, whose rendered torso colours part by at least
 * CVD_MIN + 1 under every vision and keep the value rule (lab run in this page: units/stage-b/integrate/tools/lab2.js,
 * results in lab-painted2.json). Cinder only lightens and Thornwood only darkens (PAINT_SIDE_SHIFT).
 */
const PAINT_SIDE_LOOK_TABLE = {
  'cinderHorde>thornwood@a8a784': { near: 'lighter', far: 'darkest' },
  'thornwood>cinderHorde@b9bdcb': { near: 'dark', far: 'lighter' },
  'cinderHorde>thornwood@8e8e78': { near: 'lighter', far: 'darker' },
};

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
    this.sal = {};
    for (const view of ['back', 'front']) for (const tier of ['S', 'H']) {
      const s = this.D.salamander['01'][view][tier];
      const [img, sh] = await Promise.all([loadImg(s.url), loadImg(s.shadow.url)]);
      this.sal[view + tier] = {
        tex: new PIXI.Texture({ source: new PIXI.ImageSource({ resource: img, autoGenerateMipmaps: true, scaleMode: 'linear' }) }), ax: s.ax, ay: s.ay,
        shadow: new PIXI.Texture({ source: new PIXI.ImageSource({ resource: sh, autoGenerateMipmaps: true, scaleMode: 'linear' }) }), sax: s.shadow.ax, say: s.shadow.ay,
        mouth: s.mouth,
      };
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
      t.pax = v[5]; t.pay = v[6]; t.pvar = v[7] || null;
      cache.set(name, t);
    }
    return t;
  }
}
const PAINTLIB = PAINT ? new PaintLib(PAINT) : null;

/**
 * The painted look of a battle group, or null (procedural) with the reason. Troops use their unit's sheets;
 * commanders their own face (matched by the card portrait); the Wolf Rider its pilot test where its main view exists.
 */
function paintLookOf(B, g) {
  if (!PAINTLIB) return { key: null, why: 'no paint data' };
  const near = g.side === B.nearSide, main = near ? 'back' : 'front';
  if (g.size >= 3) return { key: null, why: g.unit === 'salamander' ? 'big body (painted cutout)' : 'creature/god: portrait review first' };
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
  if (!L) return { key: null, why: ['ashRider', 'wolf', 'fireSprite', 'hornetSwarm'].includes(g.unit) ? 'mount/creature: portrait review first (stage C)' : 'no sheet' };
  if (!L.views[main]) return { key: null, why: `pilot test has no ${main} view` };
  return { key: g.unit };
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
  cinderHorde: { base: [0, 1], light: [0.05, 1.04], lighter: [0.1, 1.06], lightest: [0.15, 1.08] },
  thornwood: { base: [0, 1], dark: [-0.05, 1], darker: [-0.09, 1], darkest: [-0.13, 1] }, // chroma kept: the side's hue must still read
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
  for (const view of ['back', 'front']) {
    const have = L.views[view] ? view : L.views[view === 'back' ? 'front' : 'back'] ? (view === 'back' ? 'front' : 'back') : null;
    if (!have) continue;
    const vs = variants && L.kind === 'troop' ? variants : [null];
    out[view] = { standIn: have !== view, view: have, v: vs.map((vsrc) => PPOSE.map((p) => {
      const tryName = (n) => {
        const name = `${L.prefix}.${have}.${n}`;
        const white = n.endsWith('.white');
        return lib.frameTex(tier, name, white ? null : vsrc);
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
const _pp = { pose: 0, rot: 0, lift: 0, sx: 1, sy: 1, dx: 0, dy: 0 };
/**
 * The painted pose of a figure at t, read from the same timeline data as evalFigure (st holds its result:
 * position, view, flip, visibility). Returns a reused object: the pose id and closed-form transforms.
 */
function paintPose(T, f, G, t, speed, st, look, v, extra) {
  const o = _pp;
  o.pose = PP.stand; o.rot = 0; o.lift = 0; o.sx = 1; o.sy = 1; o.dx = 0; o.dy = 0;
  const near = G.s < 0;
  const tempo = v.tempo;
  const fwd = st.flip ? -1 : 1; // the screen x direction the figure faces (both views: flip turns it left)
  // dead or falling: fall, then the dead pose the decal keeps
  if (f.death && t >= f.death.t) {
    const k = (t - f.death.t) / f.death.fall;
    o.pose = k < 0.5 ? PP.fall : (f.death.flip ? PP.deadB : PP.deadA);
    o.rot = -fwd * 0.22 * smooth(k * 2);
    return o;
  }
  // routing: flee frames at 1.6x the march, leaning into the run
  if (f.rout && t >= f.rout.t) {
    const u = (t - f.rout.t) * 4.2 * tempo + v.phase * 2;
    o.pose = (Math.floor(u) & 1) ? PP.fleeB : PP.fleeA;
    o.lift = (u % 1) < 0.5 ? 1.2 : 0;
    o.rot = fwd * 0.08;
    return o;
  }
  // the victory cheer: the winner's standing figures in the outro, each on its own beat
  if (extra.cheerT !== null && t >= extra.cheerT && G.side === extra.winner) {
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
      pose = t < rc.t + 0.05 && rc.kind === 'wound' ? PP['recoil.white'] : PP.recoil;
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
        if (t >= s.tRel) o.dy = -G.s * 4 * Math.max(0, 1 - (t - s.tRel) / 0.25); // the release recoil
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
    if (moving) {
      // the march: marchA, pass, marchB, pass (2 steps a second), a bob at the passing frames and a forward lean
      const u = t * 4 * tempo + v.phase * 4;
      const k = Math.floor(u) & 3;
      pose = [PP.marchA, PP.stand, PP.marchB, PP.stand][k];
      o.lift = (k & 1) ? 1.5 * Math.sin(Math.PI * (u % 1)) : 0;
      o.rot = fwd * (0.06 + 0.017 * Math.sin(u * Math.PI / 2));
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

// ---------------------------------------------------------------- the Salamander (face 01): its approved cutout
function makePaintedSalamander(view) {
  const root = new PIXI.Container();
  const sp = new PIXI.Sprite(); root.addChild(sp);
  const shadow = new PIXI.Sprite();
  const body = {
    root, kind: 'salamander', H: 64, footR: 16, painted: true, sprite: sp, shadowSprite: shadow, view, tier: null, k: 0.5,
    setTier(tier) {
      if (this.tier === tier) return;
      this.tier = tier;
      const s = PAINTLIB.sal[this.view + tier];
      sp.texture = s.tex; sp.anchor.set(s.ax, s.ay);
      this.k = PAINT.wuPerPx[tier]; sp.scale.set(this.k);
      shadow.texture = s.shadow; shadow.anchor.set(s.sax, s.say);
      this.mouthPt = { x: s.mouth[0], y: s.mouth[1] };
    },
    pose() { /* standing, unanimated until the owner's stage D review (art plan 9) */ },
    mouth() { return this.mouthPt; },
  };
  body.setTier('S');
  return body;
}
