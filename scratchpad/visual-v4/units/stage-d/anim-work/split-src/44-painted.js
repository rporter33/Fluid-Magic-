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
