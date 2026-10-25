// ---- the pilot's effects gallery (docs/10 Phase 10, docs/09 readability rules) ----
// Fireball and Entangle looping side by side, drawn live by the mockup's own effects code (00-util, 33, 45 to 49 are
// inlined before this harness) on a small stand-in battle: static figures, a caster each, the struck troops and the
// held squad. Toggles: sprites hidden (the effect shapes alone), colour removed (greyscale), short timing (docs/12's
// short forms), the 300 vs 300 backdrop. Story time drives everything, so 0.25x and pausing are exact.
'use strict';
let GAME = { reduced: false };
/** The stand-in battle's figure position (static, or thrown by a blast: the same throw as the mockup's figPos). */
function figPos(T, f, t, out) {
  const d = f.death;
  if (d && t >= d.t) {
    if (d.from && t < d.t + d.fall) {
      const k = (t - d.t) / d.fall, e = easeOut(k), q = d.from, p = d.at;
      out.x = lerp(q.x, p.x, e); out.y = lerp(q.y, p.y, e);
      out.h = q.h * (1 - e) + (k < 0.7 ? d.hop * Math.sin(Math.PI * k / 0.7) : d.hop * 0.18 * Math.sin(Math.PI * (k - 0.7) / 0.3));
      return out;
    }
    out.x = d.at.x; out.y = d.at.y; out.h = 0; return out;
  }
  out.x = f.pos.x; out.y = f.pos.y; out.h = 0; return out;
}
const GALLERY = (() => {
  const S = { hidden: false, grey: false, short: false, crowd: true, rate: 1, playing: false, t: 0, ready: false };
  const SIDE = { R: { tunic: 0x9a3b22, trim: 0xd9442b }, G: { tunic: 0x2f6a35, trim: 0x8fbf5a } };
  let app = null, scenes = [], tex = {}, host = null, W = 1100, H = 500;
  /** Little stand-in figures (28 wu tall), drawn once into textures: soldiers per side and a robed caster. */
  function makeTextures() {
    const fig = (tunic, trim, robe) => {
      const g = new PIXI.Graphics();
      if (robe) { g.poly([-6, 0, 6, 0, 4, -20, -4, -20]).fill(tunic); g.rect(5, -34, 1.6, 34).fill(0x5a4630); g.circle(5.8, -35, 2.4).fill(trim); }
      else { g.rect(-4, -18, 8, 14).fill(tunic); g.rect(-4, -6, 3, 6).fill(0x3a3128); g.rect(1, -6, 3, 6).fill(0x3a3128); g.rect(-5, -14, 2, 4).fill(trim); g.rect(5, -30, 1.2, 28).fill(0x6a5a44); g.rect(-7, -16, 4, 8).fill(0x5c4a36); }
      g.circle(0, robe ? -24 : -22, 3.6).fill(0xd9b38c); g.rect(-3.8, robe ? -28.5 : -26.5, 7.6, 2.6).fill(robe ? tunic : 0x7a7a72);
      const t = app.renderer.generateTexture({ target: g, resolution: 3 }); g.destroy(); return t;
    };
    tex.R = fig(SIDE.R.tunic, SIDE.R.trim, false); tex.G = fig(SIDE.G.tunic, SIDE.G.trim, false);
    tex.mageR = fig(0x6e2418, 0xffb347, true); tex.mageG = fig(0x4a5a2a, 0xa6d96a, true);
  }
  /** One scene: its world, layers like the mockup's stage, its figures, its timeline and an FxLayer of its own. */
  function makeScene(spell, idx) {
    const look = FX_LOOKS[spell], foe = spell === 'fireball' ? 'G' : 'R', own = spell === 'fireball' ? 'R' : 'G';
    const root = new PIXI.Container(); root.x = idx * W / 2; app.stage.addChild(root);
    const mask = new PIXI.Graphics().rect(0, 0, W / 2, H).fill(0xffffff); root.addChild(mask); root.mask = mask;
    const world = new PIXI.Container(); root.addChild(world);
    const ground = new PIXI.Sprite(PIXI.Texture.WHITE); ground.tint = 0xa8a784; ground.width = 4000; ground.height = 4000; ground.position.set(-2000, -2000); world.addChild(ground);
    const L = { decalLayer: new PIXI.Container(), groundFx: new PIXI.Container(), shadows: new PIXI.Container(), units: new PIXI.Container(), bannerLayer: new PIXI.Container() };
    L.units.sortableChildren = true;
    for (const k of ['decalLayer', 'groundFx', 'shadows', 'units', 'bannerLayer']) world.addChild(L[k]);
    const T = { id: 'gallery/' + spell, F: [], G: [], spellFx: [], slow: [], duration: 1e9, decals: [], rings: [], rounds: [{ round: 1, t: -10 }] };
    const sprites = [];
    const group = (side) => { const G = { idx: T.G.length, figs: [], leaveT: null, side }; T.G.push(G); return G; };
    const add = (G, x, y, t) => { const f = { id: T.F.length, g: G.idx, pos: { x, y }, death: null, side: G.side }; T.F.push(f); G.figs.push(f.id);
      const sp = new PIXI.Sprite(t); sp.anchor.set(0.5, 1); sp.position.set(sx(x, y), sy(x, y, 0)); sp.zIndex = depthKey(x, y); sp.base = 0xffffff; L.units.addChild(sp); sprites[f.id] = sp; return f; };
    const block = (side, cx, cy, cols, rows, gap) => { const G = group(side); for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) add(G, cx + (c - (cols - 1) / 2) * gap, cy + (r - (rows - 1) / 2) * gap, tex[side]); return G; };
    const casterG = group(own), caster = add(casterG, -127, -181, own === 'R' ? tex.mageR : tex.mageG);
    const target = spell === 'fireball' ? block(foe, 0, 0, 6, 5, 12) : block(foe, 0, 0, 4, 3, 13);
    if (S.crowd) { block(own, -200, -300, 20, 15, 11); block(foe, 120, 150, 20, 15, 11); }
    // the cast: docs/12's full form, or its short form
    const form = S.short ? 'short' : 'full', fb = fxBeats(spell, form, false), t0 = 0.3;
    const release = t0 + fb.charge, impact = release + fb.release + fb.travel;
    const fx = { spell, form, t0, release, impact, caster: caster.id, cg: casterG.idx, targets: [target.idx], hitFigs: [], beats: fxBeatTimes(t0, release, impact, fb), clusters: null, key: hash32(T.id) };
    if (spell === 'fireball') {
      const near = target.figs.map((id) => T.F[id]).sort((a, b) => Math.hypot(a.pos.x, a.pos.y) - Math.hypot(b.pos.x, b.pos.y)).slice(0, 5);
      fx.hitFigs = near.map((f) => f.id);
      const cl = fxClusters(T, near, impact, look); fx.clusters = cl.list;
      for (const f of near.slice(3)) { // two of the five are slain: thrown and burnt out
        const th = fxThrow(T, f, impact, { x: f.pos.x, y: f.pos.y, h: 0 }, cl.list[0], look);
        f.death = { t: impact + 0.02, fall: th.fall, at: th.to, from: th.from, hop: th.hop, fire: true };
      }
    } else {
      T.rounds.push({ round: 2, t: impact + fb.impact + 2.2 }); // the curse expires here, so the loop shows the wither
      T.rings.push({ g: target.idx, source: 'entangle', fx: true, until: 2, t0: impact, t1: Infinity });
    }
    T.spellFx.push(fx);
    const stage = { world, groundFx: L.groundFx, shadows: L.shadows, units: L.units, bannerLayer: L.bannerLayer, decalLayer: L.decalLayer, decalSprites: [], bigs: [], sprites, T,
      stage: root, app: { renderer: { width: W / 2, height: H, resolution: 1 } } };
    const FL = new FxLayer(stage);
    const end = spell === 'fireball' ? impact + fb.impact + 2.4 : Math.max(...fx.held.map((h) => h.t1)) + look.wither + 0.9;
    // the camera: the cast's middle at the scene's centre, a man about 40 px
    const z = 1.75, mx = sx(-52, -80), my = sy(-52, -80, 0);
    const P = { x: 0, y: 0, h: 0 };
    return {
      spell, end, fx, FL, root,
      frame(tAll) {
        const t = tAll % (end + 0.4);
        for (const f of T.F) {
          const sp = sprites[f.id];
          sp.visible = !S.hidden; sp.tint = 0xffffff;
          if (f.death) { figPos(T, f, t, P); sp.position.set(sx(P.x, P.y), sy(P.x, P.y, P.h)); sp.rotation = t >= f.death.t + f.death.fall ? (f.id % 2 ? 1.35 : -1.35) : 0; }
        }
        FL.frame(t, 1);
        const sh = FL.shakeAt(t);
        world.scale.set(z); world.position.set(W / 4 - mx * z + (sh ? sh.x : 0), H / 2 - my * z + (sh ? sh.y : 0));
        return t;
      },
      destroy() { FL.dispose(); app.stage.removeChild(root); root.destroy({ children: true }); },
    };
  }
  function build() { for (const s of scenes) s.destroy(); scenes = ['fireball', 'entangle'].map((s, i) => makeScene(s, i)); }
  function render() { for (const s of scenes) s.frame(S.t); app.renderer.render(app.stage); }
  async function init(el) {
    host = el;
    if (typeof PIXI === 'undefined') { host.querySelector('.gnote').hidden = false; return; }
    GAME.reduced = FX_MOTION.os;
    app = new PIXI.Application();
    await app.init({ width: W, height: H, background: 0xa8a784, antialias: true, preference: 'webgl', autoStart: false, resolution: Math.min(2, window.devicePixelRatio || 1), autoDensity: true });
    app.canvas.setAttribute('role', 'img');
    app.canvas.setAttribute('aria-label', 'Fireball, left, and Entangle, right, looping on a stand-in battle');
    host.querySelector('.gcanvas').appendChild(app.canvas);
    await FXLIB.load();
    makeTextures();
    build();
    S.ready = true; S.playing = !FX_MOTION.os;
    let last = performance.now(), onScreen = true;
    new IntersectionObserver((e) => { onScreen = e[0].isIntersecting; }).observe(host);
    const tick = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (S.playing && onScreen) { S.t += dt * S.rate; render(); }
      requestAnimationFrame(tick);
    };
    render(); requestAnimationFrame(tick);
    return S;
  }
  return {
    S, init, render,
    set(k, v) { S[k] = v; if (!S.ready) return; if (k === 'short' || k === 'crowd') { build(); } if (k === 'grey') app.canvas.style.filter = v ? 'grayscale(1)' : ''; render(); },
    step(n) { S.playing = false; S.t = Math.max(0, S.t + n / 60); render(); },
  };
})();
