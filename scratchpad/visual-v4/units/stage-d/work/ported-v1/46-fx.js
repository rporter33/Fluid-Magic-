'use strict';
// ---- the effects layer (stage D magic pilot; skills audit B1 to B3 and its stage D section) ----
// One effects atlas (units/stage-d/atlas/fx), pre-warmed pools of Particle records in ParticleContainers (only what
// changes is dynamic), pooled Sprites for the few large shapes (rings, light pools, shadows, the units' vines), rope
// meshes (RopeGeometry, batched with the sprites) for the trail, the cracks and the runners, decals in the field's render
// group, a per-figure light tint and pushed shadow, docs/12's flash limiter and the OS reduced-motion setting. Nothing
// here draws Graphics, and every effect is a pure function of story time (47-spells-pilot.js): seeking stays exact.

const FX_DATA = (() => { const el = document.getElementById('fx-data'); try { return el ? JSON.parse(el.textContent) : null; } catch (e) { return null; } })();
const FXLIB = {
  ready: false, frames: {}, source: null, loadMs: 0,
  async load() {
    if (!FX_DATA) return;
    const t0 = performance.now();
    const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('fx atlas failed to decode')); i.src = FX_DATA.image; });
    this.source = new PIXI.ImageSource({ resource: img, autoGenerateMipmaps: true, scaleMode: 'linear' });
    for (const [k, f] of Object.entries(FX_DATA.frames)) {
      const t = new PIXI.Texture({ source: this.source, frame: new PIXI.Rectangle(f[0], f[1], f[2], f[3]) });
      t.fax = f[4]; t.fay = f[5]; t.fname = k;
      this.frames[k] = t;
    }
    this.loadMs = performance.now() - t0;
    this.ready = true;
  },
  t(name) { return this.frames[name] || this.frames.white; },
};
/** The OS reduced-motion setting (docs/12: "reduced motion follows the OS"); the menu toggle overrides it. */
const FX_MOTION = {
  mq: typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null,
  get os() { return !!(this.mq && this.mq.matches); },
  watch(fn) { if (this.mq && this.mq.addEventListener) this.mq.addEventListener('change', () => fn(this.os)); },
};
const FX_SETTINGS = { flashes: 'full', quality: 'high' }; // docs/12 S4.8: Flashes Full | Soft | Off (the limiter is always on)

/** A ParticleContainer with pre-warmed Particle records; unused ones are transparent, an empty layer is not drawn. */
class FxParticles {
  constructor(parent, blend, cap) {
    this.pc = new PIXI.ParticleContainer({ dynamicProperties: { position: true, vertex: true, rotation: true, uvs: true, color: true } });
    this.pc.blendMode = blend; parent.addChild(this.pc);
    this.list = [];
    for (let i = 0; i < cap; i++) { const p = new PIXI.Particle({ texture: FXLIB.t('white'), alpha: 0 }); this.list.push(p); this.pc.addParticle(p); }
    this.used = 0; this.peak = 0; this.pc.visible = false;
  }
  begin() { this.used = 0; }
  take(tex) {
    if (this.used >= this.list.length) return null;
    const p = this.list[this.used++];
    if (p.texture !== tex) p.texture = tex;
    p.anchorX = tex.fax; p.anchorY = tex.fay; p.rotation = 0; p.tint = 0xffffff;
    return p;
  }
  end() {
    for (let i = this.used; i < this.list.length; i++) if (this.list[i].alpha) this.list[i].alpha = 0;
    this.pc.visible = this.used > 0; this.peak = Math.max(this.peak, this.used);
  }
}
/** Pooled Sprites and rope meshes in one Container of one blend: they batch into one draw (one atlas source). */
class FxSprites {
  constructor(parent, blend, warm, sortable) {
    this.c = sortable ? parent : new PIXI.Container();
    if (!sortable) { this.c.blendMode = blend; parent.addChild(this.c); }
    this.list = []; this.ropes = new Map(); this.used = 0; this.rused = 0; this.own = !sortable;
    for (let i = 0; i < (warm || 0); i++) this.make();
    if (this.own) this.c.visible = false;
  }
  make() { const s = new PIXI.Sprite(FXLIB.t('white')); s.visible = false; this.c.addChild(s); this.list.push(s); return s; }
  begin() { this.used = 0; this.rused = 0; for (const R of this.ropes.values()) R.used = 0; }
  take(tex) {
    const s = this.list[this.used] || this.make();
    this.used++;
    if (s.texture !== tex) s.texture = tex;
    s.anchor.set(tex.fax, tex.fay); s.visible = true; s.rotation = 0; s.tint = 0xffffff; s.alpha = 1; s.scale.set(1);
    return s;
  }
  /** A rope of n points (n <= 50 keeps it batched) stretched over tex; the caller sets r.pts then calls fxRope(r). */
  rope(tex, width, n) {
    let R = this.ropes.get(n);
    if (!R) this.ropes.set(n, (R = { list: [], used: 0 }));
    let r = R.list[R.used];
    if (!r) {
      const pts = []; for (let i = 0; i < n; i++) pts.push(new PIXI.Point(i, 0));
      r = new PIXI.Mesh({ geometry: new PIXI.RopeGeometry({ points: pts, width, textureScale: 0 }), texture: tex });
      r.pts = pts; r.u = [0, 1]; r.visible = false;
      R.list.push(r); this.c.addChild(r);
    }
    R.used++; this.rused++;
    if (r.texture !== tex) r.texture = tex;
    r.geometry._width = width; r.visible = true; r.alpha = 1; r.tint = 0xffffff;
    return r;
  }
  end(extra) {
    for (let i = this.used; i < this.list.length; i++) this.list[i].visible = false;
    for (const R of this.ropes.values()) for (let i = R.used; i < R.list.length; i++) R.list[i].visible = false;
    if (this.own) this.c.visible = this.used + this.rused + (extra || 0) > 0;
  }
}
/** Rebuilds a rope's vertices after its points moved; u0..u1 is the part of the texture it shows (a crack revealed as it runs). */
function fxRope(r, u0, u1) {
  const g = r.geometry;
  if (r.u[0] !== u0 || r.u[1] !== u1) {
    const uv = g.getBuffer('aUV'), d = uv.data, n = r.pts.length;
    for (let i = 0; i < n; i++) { const u = lerp(u0, u1, i / (n - 1)); d[i * 4] = u; d[i * 4 + 2] = u; }
    uv.update(); r.u[0] = u0; r.u[1] = u1;
  }
  g.updateVertices();
}

/**
 * The docs/12 flash limiter (S2.14), always on: flash cues that are full-scene are admitted greedily in real time at the
 * current speed, at most 3 in any real second, alpha at most 0.35; Flashes Soft caps 0.07, Off 0; reduced motion: none.
 */
class FxFlashes {
  constructor(T) { this.T = T; this.cues = []; this.cache = new Map(); }
  add(c) { this.cues.push(c); this.cache.clear(); }
  real(t, speed) { // story seconds -> real seconds at this speed (the slow-motion spans stretch it at 2x and below)
    let r = t / speed;
    if (speed <= 2) for (const s of this.T.slow) { const a = Math.max(0, Math.min(t, s.t1) - s.t0); if (a > 0) r += a * (1 / s.rate - 1) / speed; }
    return r;
  }
  admitted(speed) {
    if (this.cache.has(speed)) return this.cache.get(speed);
    const order = this.cues.map((c, i) => ({ i, r: this.real(c.t, speed) })).sort((a, b) => a.r - b.r);
    const ok = new Set(), times = [];
    for (const o of order) { if (times.filter((x) => o.r - x < 1).length < 3) { ok.add(o.i); times.push(o.r); } }
    this.cache.set(speed, ok);
    return ok;
  }
  /** The overlay's colour and alpha at story time t. */
  at(t, speed, reduced) {
    const cap = reduced ? 0 : FX_SETTINGS.flashes === 'off' ? 0 : FX_SETTINGS.flashes === 'soft' ? 0.07 : 0.35;
    if (!cap || !this.cues.length) return null;
    const ok = this.admitted(speed);
    for (let i = 0; i < this.cues.length; i++) {
      const c = this.cues[i];
      if (t < c.t || t >= c.t + c.dur || !ok.has(i)) continue;
      return { color: c.color, alpha: Math.min(cap, c.alpha) * (1 - (t - c.t) / c.dur) };
    }
    return null;
  }
}

class FxLayer {
  constructor(stage) {
    this.st = stage; this.T = stage.T;
    const W = stage.world;
    const at = (c, before) => { W.addChildAt(c, W.getChildIndex(before)); return c; };
    // ground: matter (cracks, runners, Loam rings, shadows) under the light (pools, Ember rings, footprints)
    // the ground light sits right after the decal render group, where the batch breaks anyway (one extra draw, not two)
    this.groundA = new FxSprites(at(new PIXI.Container(), stage.groundFx), 'add', 16);
    this.groundN = new FxSprites(at(new PIXI.Container(), stage.shadows), 'normal', 16);
    this.units = new FxSprites(stage.units, 'normal', 12, true); // bursts, vines and thorns sorted with the figures
    // the air layers close the world: nothing of normal blend follows them, so each costs its own draw and splits none
    const top = new PIXI.Container(); W.addChild(top);
    this.airN = new FxParticles(top, 'normal', 320);
    this.airA = new FxSprites(top, 'add', 96);
    this.ropeA = this.airA; // the trail rope batches with the additive sprites
    this.twins = new FxTwins(this.airA.c); // the lit figures' additive copies, in the same draw
    for (let i = 0; i < 48; i++) this.twins.copy(stage.sprites.find(Boolean) || { texture: FXLIB.t('white'), anchor: new PIXI.Point(), position: new PIXI.Point(), scale: new PIXI.Point(1, 1), rotation: 0, alpha: 1 }, 0xffffff, 0);
    this.twins.begin(); this.twins.end();
    // pre-warmed ropes: the trail, the Entangle cracks and runners (no Mesh is created mid-battle)
    this.airA.rope(FXLIB.t('trail'), 12, 16);
    for (let i = 0; i < 8; i++) this.groundN.rope(FXLIB.t('crackThin'), 4, 8);
    this.groundN.rope(FXLIB.t('crackWide'), 16, 24);
    for (const p of [this.groundN, this.airA]) { p.begin(); p.end(); }
    this.flash = new PIXI.Sprite(PIXI.Texture.WHITE); this.flash.visible = false; stage.stage.addChild(this.flash);
    this.flashes = new FxFlashes(this.T);
    this.lights = []; this.occl = []; this.counts = {}; this.peaks = {}; this.stats = { updateMs: 0, particles: 0 };
    this.spells = this.T.spellFx.filter((fx) => FX_LOOKS[fx.spell] && fx.beats);
    for (const fx of this.spells) fxPrepare(this, fx);
    this.decals = new FxDecals(this);
  }
  /** Ground (x, y, h) to the world container's screen plane. */
  P(x, y, h, out) { out.X = sx(x, y); out.Y = sy(x, y, h || 0); return out; }
  /** A light this frame: ground point, radius (wu), strength 0..1, colour, and a pushed shadow's strength. */
  light(x, y, r, k, color, shadow) { if (k > 0.01) this.lights.push({ x, y, r, k, color, shadow: shadow || 0 }); }
  get reduced() { return typeof GAME !== 'undefined' && !!GAME.reduced; }
  /** Particle count scale: quality, and reduced motion x0.3 (docs/12 S2.14). */
  get pscale() { return (FX_SETTINGS.quality === 'low' ? 0.2 : FX_SETTINGS.quality === 'medium' ? 0.5 : 1) * (this.reduced ? 0.3 : 1); }
  frame(t, speed) {
    const a0 = performance.now();
    this.lights.length = 0; this.occl.length = 0;
    for (const p of [this.groundN, this.groundA, this.units, this.airN, this.airA, this.twins]) p.begin();
    for (const fx of this.spells) {
      if (t < fx.t0 - 0.05 || t > fx.fxEnd) continue;
      const n0 = this.airN.used + this.airA.used;
      const tr = fx.trace || (fx.trace = {}); for (const k in tr) tr[k] = 0; // what this frame drew, for the checks
      if (fx.spell === 'fireball') fxFireball(this, fx, t);
      else if (fx.spell === 'entangle') fxEntangle(this, fx, t);
      const n = this.airN.used + this.airA.used - n0;
      this.counts[fx.spell] = (this.counts[fx.spell] || 0) + n;
      this.peaks[fx.spell] = Math.max(this.peaks[fx.spell] || 0, n);
    }
    this.applyLights();
    for (const p of [this.groundN, this.groundA, this.units, this.airN, this.twins]) p.end();
    this.airA.end(this.twins.used);
    this.decals.update(t);
    // the full-scene flash, through the limiter
    const fl = this.flashes.at(t, speed, this.reduced);
    if (fl && fl.alpha > 0.003) {
      const r = this.st.app.renderer;
      this.flash.visible = true; this.flash.tint = fl.color; this.flash.alpha = fl.alpha;
      this.flash.width = r.width / r.resolution; this.flash.height = r.height / r.resolution;
    } else this.flash.visible = false;
    this.stats.particles = this.airN.used + this.airA.used;
    this.stats.updateMs = performance.now() - a0;
  }
  /**
   * Lights tint the figures within their radius toward their colour (art plan 7.1: up to 35%) and push a short shadow.
   * The light falls off smoothly from its centre; a figure standing between the light and the camera is lit from behind
   * and keeps more of its silhouette; a figure hidden behind a burst gets no additive copy over the fire.
   */
  applyLights() {
    if (!this.lights.length) return;
    const st = this.st, q = { x: 0, y: 0 };
    const tintOf = (x, y) => {
      let best = 0, col = 0xffffff, sh = null;
      for (const L of this.lights) {
        const d = Math.hypot(x - L.x, y - L.y) / L.r;
        if (d >= 1) continue;
        const k = L.k * (1 - smooth(d)) * (depthKey(x, y) > depthKey(L.x, L.y) + 4 ? 0.6 : 1);
        if (k > best) { best = k; col = L.color; }
        if (L.shadow > 0 && (!sh || k > sh.k)) sh = { k: k * L.shadow, dx: x - L.x, dy: y - L.y };
      }
      return { k: best, col, sh };
    };
    for (let i = 0; i < st.sprites.length; i++) {
      const sp = st.sprites[i];
      if (!sp || !sp.visible || sp.alpha <= 0) continue;
      const g = toGround(sp.x, sp.y);
      const L = tintOf(g.x, g.y);
      if (L.k <= 0.01) continue;
      sp.tint = mixTint(sp.tint, L.col, L.k * FX_LOOKS.fireball.light.tint);
      if (L.k > 0.12 && !this.hidden(sp)) this.twins.copy(sp, L.col, Math.min(0.45, L.k * 0.5) * sp.alpha);
      if (L.sh && L.sh.k > 0.02) this.pushShadow(g.x, g.y, L.sh, sp.zIndex);
    }
    for (const bb of st.bigs) {
      const r = bb.body.root;
      if (!r.visible) continue;
      const g = toGround(r.x, r.y);
      const L = tintOf(g.x, g.y);
      if (L.k > 0.01) r.tint = mixTint(r.tint === undefined ? 0xffffff : r.tint, L.col, L.k * FX_LOOKS.fireball.light.tint);
    }
    void q;
  }
  /** Is this figure behind a burst this frame and inside its painted frame (an occluder registered by fxBlast)? */
  hidden(sp) {
    for (const o of this.occl) if (sp.zIndex < o.z && sp.x > o.x0 && sp.x < o.x1 && sp.y > o.y0 && sp.y < o.y1) return true;
    return false;
  }
  pushShadow(x, y, sh, z) {
    const d = Math.hypot(sh.dx, sh.dy) || 1, len = 7 + 9 * sh.k;
    const ux = sh.dx / d, uy = sh.dy / d;
    const s = this.groundN.take(FXLIB.t('shadowLong'));
    const X = sx(x + ux * len * 0.5, y + uy * len * 0.5), Y = sy(x + ux * len * 0.5, y + uy * len * 0.5, 0);
    s.position.set(X, Y);
    s.rotation = Math.atan2(sy(ux, uy, 0), sx(ux, uy));
    s.scale.set(len / 96 * 1.6, 0.16);
    s.alpha = clamp(0.5 * sh.k, 0, 0.45);
    void z;
  }
  /** Camera shake from the pilot's trauma cues (docs/12 S2.13: trauma squared, smooth noise of t); none under reduced motion. */
  shakeAt(t) {
    if (this.reduced) return null;
    let tr = 0;
    for (const fx of this.spells) if (fx.trauma && t >= fx.trauma.t && t < fx.trauma.t + 0.55) tr = Math.max(tr, fx.trauma.k * (1 - (t - fx.trauma.t) / 0.55));
    if (tr <= 0.001) return null;
    const a = tr * tr * 26;
    return { x: a * (fxNoise(t * 31) * 2 - 1), y: a * (fxNoise(t * 37 + 9) * 2 - 1) };
  }
  dispose() { this.decals.dispose(); }
}
/** Additive copies of lit figures (their own painted frame, tinted by the light): the light brightens the paint. */
class FxTwins {
  constructor(container) { this.c = container; this.list = []; this.used = 0; }
  begin() { this.used = 0; }
  copy(sp, color, alpha) {
    let s = this.list[this.used];
    if (!s) { s = new PIXI.Sprite(sp.texture); this.c.addChild(s); this.list.push(s); }
    this.used++;
    if (s.texture !== sp.texture) s.texture = sp.texture;
    s.anchor.copyFrom(sp.anchor); s.position.copyFrom(sp.position); s.scale.copyFrom(sp.scale); s.rotation = sp.rotation;
    s.tint = color; s.alpha = alpha; s.visible = true;
  }
  end() { for (let i = this.used; i < this.list.length; i++) this.list[i].visible = false; }
}
/** Mixes a tint (a colour multiplier) toward a colour by k. */
function mixTint(a, b, k) { return mix(a, b, clamp(k, 0, 1)); }
/** Smooth 1D value noise in [0, 1], a pure function of x. */
function fxNoise(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(u01('n' + i), u01('n' + (i + 1)), u); }
