// ---- the pilot's effects gallery (docs/10 Phase 10, docs/09 readability rules) ----
// Fireball and Entangle looping side by side, drawn live by the mockup's own effects code (00-util, 33, 45 to 49 are
// inlined before this harness) on a small battle of painted figures (stage B tier S frames: a Cinder warrior and a Warden,
// back and front as the battle camera shows each side, the Cinder Magus and the Elder Druid): the caster, the struck troops
// or the held block, and a 300 against 300 backdrop, framed at about play zoom so both crowds show (critique fix 6).
// docs/09's pair tests need Thorn Spray and Ember Dart, which are not built: what this shows is each spell alone with the
// sprites hidden or the colour removed. Short forms: docs/12's for Fireball; C.3's rule for Entangle. Story time drives
// everything, so 0.25x and pausing are exact. On a phone the two scenes stack.
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
  let app = null, scenes = [], tex = {}, wu = 0.5, host = null, stacked = false, W = 1100, H = 500;
  const SW = 550, SH = 500; // one scene
  /** The painted figures (gallery_figs.py): textures from their WebP data, with their anchors. */
  async function loadFigures() {
    const D = JSON.parse(document.getElementById('gfigs').textContent);
    wu = D.wuPerPx;
    await Promise.all(Object.entries(D.figs).map(([k, f]) => new Promise((ok, no) => {
      const img = new Image();
      img.onload = () => { const t = new PIXI.Texture({ source: new PIXI.ImageSource({ resource: img, scaleMode: 'linear', autoGenerateMipmaps: true }) }); t.ax = f.ax; t.ay = f.ay; tex[k] = t; ok(); };
      img.onerror = () => no(new Error('figure ' + k)); img.src = f.src;
    })));
  }
  /** A ground point for a spot on the screen plane (the layout is planned in screen units, from the scene's centre). */
  function at(X, Y) { return toGround(X, Y); }
  /** One scene: its world, layers like the mockup's stage, its figures, its timeline and an FxLayer of its own. */
  function makeScene(spell, idx) {
    const look = FX_LOOKS[spell], foe = spell === 'fireball' ? 'G' : 'R', own = spell === 'fireball' ? 'R' : 'G';
    const root = new PIXI.Container(); root.x = stacked ? 0 : idx * SW; root.y = stacked ? idx * SH : 0; app.stage.addChild(root);
    const mask = new PIXI.Graphics().rect(0, 0, SW, SH).fill(0xffffff); root.addChild(mask); root.mask = mask;
    const world = new PIXI.Container(); root.addChild(world);
    const ground = new PIXI.Sprite(PIXI.Texture.WHITE); ground.tint = spell === 'fireball' ? 0xa8a784 : 0x8e8e78; ground.width = 4000; ground.height = 4000; ground.position.set(-2000, -2000); world.addChild(ground);
    const L = { decalLayer: new PIXI.Container(), groundFx: new PIXI.Container(), shadows: new PIXI.Container(), units: new PIXI.Container(), bannerLayer: new PIXI.Container() };
    L.units.sortableChildren = true;
    for (const k of ['decalLayer', 'groundFx', 'shadows', 'units', 'bannerLayer']) world.addChild(L[k]);
    const T = { id: 'gallery/' + spell, F: [], G: [], spellFx: [], slow: [], duration: 1e9, decals: [], rings: [], rounds: [{ round: 1, t: -10 }] };
    const sprites = [];
    const group = (side) => { const G = { idx: T.G.length, figs: [], leaveT: null, side }; T.G.push(G); return G; };
    const add = (G, x, y, t) => {
      const f = { id: T.F.length, g: G.idx, pos: { x, y }, death: null, side: G.side, reacts: [] }; T.F.push(f); G.figs.push(f.id);
      const sp = new PIXI.Sprite(t); sp.anchor.set(t.ax, t.ay); sp.scale.set(wu); sp.position.set(sx(x, y), sy(x, y, 0)); sp.zIndex = depthKey(x, y); L.units.addChild(sp); sprites[f.id] = sp; return f;
    };
    // a block centred on a ground point, its rows along the lateral axis, seeded jitter so it is not a grid
    const block = (side, c, cols, rows, gap, t) => { const G = group(side); for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) { const j = u01(T.id + '/j/' + T.F.length) - 0.5, j2 = u01(T.id + '/k/' + T.F.length) - 0.5; add(G, c.x + (k - (cols - 1) / 2) * gap + j * 3, c.y + (r - (rows - 1) / 2) * gap + j2 * 3, t); } return G; };
    // the layout in screen units: own crowd at the bottom, the caster before it, the struck block, the foe crowd at the top
    const casterG = group(own), caster = add(casterG, at(-95, 72).x, at(-95, 72).y, own === 'R' ? tex.mageR : tex.mageG);
    const tc = at(70, -36), target = spell === 'fireball' ? block(foe, tc, 6, 5, 11, tex[foe + 'f']) : block(foe, tc, 4, 3, 12, tex[foe + 'f']);
    if (S.crowd) { block(own, at(-80, 170), 20, 15, 10, tex[own]); block(foe, at(95, -150), 20, 15, 10, tex[foe + 'f']); }
    // the cast: docs/12's full form, or the short form
    const form = S.short ? 'short' : 'full', fb = fxBeats(spell, form, false), t0 = 0.3;
    const release = t0 + fb.charge, impact = release + fb.release + fb.travel;
    const fx = { spell, form, t0, release, impact, caster: caster.id, cg: casterG.idx, targets: [target.idx], hitFigs: [], beats: fxBeatTimes(t0, release, impact, fb), clusters: null, key: hash32(T.id) };
    if (spell === 'fireball') {
      const near = target.figs.map((id) => T.F[id]).sort((a, b) => Math.hypot(a.pos.x - tc.x, a.pos.y - tc.y) - Math.hypot(b.pos.x - tc.x, b.pos.y - tc.y)).slice(0, 5);
      fx.hitFigs = near.map((f) => f.id);
      const cl = fxClusters(T, near, impact, look); fx.clusters = cl.list;
      for (const f of near.slice(3)) { // two of the five are slain: thrown and burning
        const th = fxThrow(T, f, impact, { x: f.pos.x, y: f.pos.y, h: 0 }, cl.list[0], look);
        f.death = { t: impact + 0.02, fall: th.fall, at: th.to, from: th.from, hop: th.hop, fire: true };
      }
      for (const f of near.slice(0, 2)) f.reacts.push({ t: impact + 0.025, kind: 'wound', element: 'fire', fx: fx.key }); // two wounded: the orange flash
    } else {
      T.rounds.push({ round: 2, t: impact + fb.impact + 2.2 }); // the curse expires here, so the loop shows the wither
      T.rings.push({ g: target.idx, source: 'entangle', fx: true, until: 2, t0: impact, t1: Infinity });
    }
    T.spellFx.push(fx);
    const stage = { world, groundFx: L.groundFx, shadows: L.shadows, units: L.units, bannerLayer: L.bannerLayer, decalLayer: L.decalLayer, decalSprites: [], bigs: [], sprites, T,
      stage: root, app: { renderer: { width: SW, height: SH, resolution: 1 } } };
    const FL = new FxLayer(stage);
    const end = spell === 'fireball' ? impact + fb.impact + 2.4 : Math.max(...fx.held.map((h) => h.t1)) + look.wither + 0.9;
    // the camera: every figure in the frame, at most 1.1 (a man about 31 px, play zoom)
    let X0 = Infinity, X1 = -Infinity, Y0 = Infinity, Y1 = -Infinity;
    for (const sp of sprites) { X0 = Math.min(X0, sp.x - 12); X1 = Math.max(X1, sp.x + 12); Y0 = Math.min(Y0, sp.y - 34); Y1 = Math.max(Y1, sp.y + 4); }
    const z = Math.min(1.1, SW / (X1 - X0), SH / (Y1 - Y0)), mx = (X0 + X1) / 2, my = (Y0 + Y1) / 2;
    const P = { x: 0, y: 0, h: 0 };
    return {
      spell, end, fx, FL, root, z,
      frame(tAll) {
        const t = tAll % (end + 0.4);
        for (const f of T.F) {
          const sp = sprites[f.id];
          sp.visible = !S.hidden; sp.tint = 0xffffff;
          if (f.death) { figPos(T, f, t, P); sp.position.set(sx(P.x, P.y), sy(P.x, P.y, P.h)); sp.rotation = t >= f.death.t + f.death.fall ? (f.id % 2 ? 1.35 : -1.35) : 0; }
        }
        FL.frame(t, 1);
        if (S.hidden) { FL.lit.visible = false; } // sprites hidden: their light copies go too (the effect alone)
        const sh = FL.shakeAt(t);
        world.scale.set(z); world.position.set(SW / 2 - mx * z + (sh ? sh.x : 0), SH / 2 - my * z + (sh ? sh.y : 0));
        return t;
      },
      destroy() { FL.dispose(); app.stage.removeChild(root); root.destroy({ children: true }); },
    };
  }
  function build() { for (const s of scenes) s.destroy(); scenes = ['fireball', 'entangle'].map((s, i) => makeScene(s, i)); }
  function render() { for (const s of scenes) s.frame(S.t); app.renderer.render(app.stage); }
  function layout() {
    const want = !!(host && host.clientWidth < 600);
    if (want === stacked && app) return false;
    stacked = want; W = stacked ? SW : 2 * SW; H = stacked ? 2 * SH : SH;
    if (app) app.renderer.resize(W, H);
    return true;
  }
  async function init(el) {
    host = el;
    if (typeof PIXI === 'undefined') { host.querySelector('.gnote').hidden = false; return; }
    GAME.reduced = FX_MOTION.os;
    layout();
    app = new PIXI.Application();
    await app.init({ width: W, height: H, background: 0xa8a784, antialias: true, preference: 'webgl', autoStart: false, resolution: Math.min(2, window.devicePixelRatio || 1), autoDensity: true });
    app.canvas.setAttribute('role', 'img');
    app.canvas.setAttribute('aria-label', 'Fireball and Entangle looping on a small battle of painted figures');
    host.querySelector('.gcanvas').appendChild(app.canvas);
    await FXLIB.load();
    await loadFigures();
    build();
    S.ready = true; S.playing = !FX_MOTION.os;
    let last = performance.now(), onScreen = true;
    new IntersectionObserver((e) => { onScreen = e[0].isIntersecting; }).observe(host);
    window.addEventListener('resize', () => { if (layout()) { build(); render(); } });
    const tick = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (S.playing && onScreen) { S.t += dt * S.rate; render(); }
      requestAnimationFrame(tick);
    };
    render(); requestAnimationFrame(tick);
    return S;
  }
  return {
    S, init, render, scenes: () => scenes,
    set(k, v) { S[k] = v; if (!S.ready) return; if (k === 'short' || k === 'crowd') { build(); } if (k === 'grey') app.canvas.style.filter = v ? 'grayscale(1)' : ''; render(); },
    step(n) { S.playing = false; S.t = Math.max(0, S.t + n / 60); render(); },
  };
})();
