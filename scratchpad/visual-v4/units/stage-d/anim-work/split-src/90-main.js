'use strict';
// ---- bootstrap, the loop, input, picking, and window.__battle (checks and screenshots) ----

window.__errors = window.__errors || [];
window.addEventListener('error', (e) => window.__errors.push('error: ' + (e.message || e)));
window.addEventListener('unhandledrejection', (e) => window.__errors.push('rejection: ' + (e.reason && e.reason.message || e.reason)));

const DATA = JSON.parse(document.getElementById('battle-data').textContent);
const SPEEDS = [0.5, 1, 2, 4];

class Game {
  async init() {
    this.app = new PIXI.Application();
    await this.app.init({
      resizeTo: window, antialias: false, autoDensity: true, preference: 'webgl', background: 0x14120f,
      resolution: Math.min(window.devicePixelRatio || 1, ('ontouchstart' in window) ? 1.5 : 2), preserveDrawingBuffer: true,
      // the page picks for itself (pick(), window listeners in bindInput): Pixi's event system would otherwise
      // hit-test the whole passive stage on every pointermove (skills audit B7)
      eventMode: 'none', eventFeatures: { move: false, globalMove: false, click: false, wheel: false },
    });
    this.app.ticker.stop();
    document.getElementById('app').appendChild(this.app.canvas);
    this.hud = new Hud(this);
    this.view = { hover: null, selected: null, hoverAt: null };
    this.speed = 1; this.playing = true; this.beats = false; this.follow = true; this.user = null;
    // reduced motion follows the OS (docs/12; skills audit B3) until the menu's toggle overrides it
    this.reduced = FX_MOTION.os; this.reducedSet = false;
    FX_MOTION.watch((v) => { if (!this.reducedSet) { this.reduced = v; this.invalidate(); } });
    this.frameLog = []; this.firstFrames = [];
    this.buildTransport(); this.buildPicker(); this.buildCamCtl(); this.buildMenu(); this.bindInput();
    const q = new URLSearchParams(location.search);
    // painted figures (stage B): decode the painted pages first; Painted is the default, ?fig=procedural the old look
    if (PAINTLIB) { try { await PAINTLIB.load(); } catch (e) { window.__errors.push('paint: ' + e.message); } }
    if (FX_DATA) { try { await FXLIB.load(); } catch (e) { window.__errors.push('fx: ' + e.message); } } // the pilot's effects atlas
    PAINT_MODE.on = !!(PAINTLIB && PAINTLIB.ready) && q.get('fig') !== 'procedural';
    if (q.get('wr') === 'kept') PAINT_ALT.wolfRider = 'kept'; // the Wolf Rider front (owner review 2): ?wr=kept
    if (q.get('fxtiming') === 'short') FX_SETTINGS.timing = 'short'; // the pilot's docs/12 short forms, for comparison (?fxtiming=short)
    this.buildFigs();
    this.load(q.get('b') || DATA[0].key);
    if (q.get('t')) this.seek(+q.get('t'));
    if (q.get('paused')) this.playing = false;
    document.getElementById('loading').remove();
    this.lastNow = null; // the first frame advances nothing: its timestamp may predate init (critique fix 4)
    requestAnimationFrame((n) => this.loop(n));
    window.addEventListener('resize', () => { if (this.stage) { this.camCache = new Map(); this.cam = this.camFor(this.speed); } this.invalidate(); });
    // a restored GL context or a tab coming back draws once more, whatever else changed
    this.app.canvas.addEventListener('webglcontextrestored', () => this.invalidate());
    document.addEventListener('visibilitychange', () => this.invalidate());
  }

  load(key) {
    const B = DATA.find((b) => b.key === key) || DATA[0];
    if (this.stage) { this.app.stage.removeChild(this.stage.stage); this.stage.dispose(); }
    const t0 = performance.now();
    const S = buildScript(B), L = layoutBattle(S), T = buildTimeline(S, L);
    const t1 = performance.now();
    this.stage = new BattleStage(this.app, S, L, T);
    this.buildMs = { script: +(t1 - t0).toFixed(1), stage: +(performance.now() - t1).toFixed(1), bake: +this.stage.bakeMs.toFixed(1), looks: +this.stage.chooseMs.toFixed(1), ground: +this.stage.groundMs.toFixed(1) };
    this.app.stage.addChild(this.stage.stage);
    // the effects layer's first frame is paid here, while the loading screen (or the battle switch) is up: the atlas
    // upload with its mipmaps and the particle, rope and batch shaders (critique fix 7a)
    if (this.stage.fx) this.buildMs.fxWarm = +this.stage.fx.warm(this.app.renderer, this.app.stage).toFixed(1);
    this.camCache = new Map(); this.camFade = null; this.camSpeed = this.speed;
    this.cam = this.camFor(this.speed);
    this.key = B.key; this.B = B;
    this.view.hover = null; this.view.selected = null;
    this.follow = true; this.user = null;
    this.hud.build(this.stage);
    document.querySelectorAll('#picker button, #menu .pick:not(.figpick):not(.wrpick)').forEach((b) => b.classList.toggle('on', b.dataset.k === B.key));
    this.syncWr();
    this.t = 0; this.playing = true;
    this.render(0);
  }

  seek(t, play) { this.t = clamp(t, 0, this.stage.T.duration); if (play) this.playing = true; this.render(this.t); }

  rate(t) {
    let r = this.speed * storyRate(this.stage.T, t, this.speed);
    if (this.beats) {
      const near = this.stage.T.beats.some((b) => b.weight >= 6 && t >= b.t - 1.0 && t <= b.t + 2.5);
      if (!near) r *= 4;
    }
    return r;
  }

  /** One clock step: never backwards, never more than 0.1 s, nothing on the first frame (critique fix 4). */
  advance(now) {
    const dt = this.lastNow === null ? 0 : clamp((now - this.lastNow) / 1000, 0, 0.1);
    this.lastNow = now;
    if (this.playing && this.stage) {
      this.t = Math.max(0, this.t + dt * this.rate(this.t));
      if (this.t >= this.stage.T.duration) { this.t = this.stage.T.duration; this.playing = false; }
    }
    return dt;
  }
  loop(now) {
    const dt = this.advance(now);
    if (this.firstFrames.length < 8) this.firstFrames.push({ dt: +dt.toFixed(4), t: +this.t.toFixed(4) }); // for checks()
    if (this.keysDown && this.keysDown.size) this.keyPan(dt);
    if (this.frameChanged()) this.render(this.t); // paused and idle: the last frame still stands (skills audit B5)
    this.syncTransport();
    requestAnimationFrame((n) => this.loop(n));
  }

  render(t) {
    const a = performance.now();
    this.applyCamera(t); // first: the painted figures pick their tier from this frame's zoom
    this.stage.frame(t, this.speed, this.view);
    const b = performance.now();
    this.hud.update(t);
    this.app.renderer.render(this.app.stage);
    const c = performance.now();
    if (this.measuring) this.measuring.push({ update: b - a, hud: 0, render: c - b, total: c - a, now: c });
    this.noteDrawn(t);
  }

  /**
   * What the last drawn frame was made from: everything render() reads (story time, speed, the camera inputs, hover,
   * selection and hover point, the window and canvas size, the figures mode, the loaded stage). The loop redraws when
   * any of it changes, while playing, during a camera cross-fade (real time), or after invalidate(); otherwise the
   * frame on the canvas is still current and the loop only keeps the clock and the transport in step.
   */
  noteDrawn(t) {
    const s = this._drawn || (this._drawn = {}), u = this.user, v = this.view, r = this.app.renderer;
    s.stage = this.stage; s.t = t; s.speed = this.speed; s.reduced = this.reduced; s.follow = this.follow;
    s.ucx = u ? u.cx : null; s.ucy = u ? u.cy : null; s.uz = u ? u.z : null;
    s.hover = v.hover; s.selected = v.selected; s.hx = v.hoverAt ? v.hoverAt.x : null; s.hy = v.hoverAt ? v.hoverAt.y : null;
    s.w = window.innerWidth; s.h = window.innerHeight; s.cw = r.width; s.ch = r.height; s.paint = PAINT_MODE.on; s.wr = PAINT_ALT.wolfRider;
    this.dirty = false;
  }
  frameChanged() {
    const s = this._drawn;
    if (!s || this.dirty || this.playing || this.camFade) return true;
    const u = this.user, v = this.view, r = this.app.renderer;
    return s.stage !== this.stage || s.t !== this.t || s.speed !== this.speed || s.reduced !== this.reduced || s.follow !== this.follow
      || s.ucx !== (u ? u.cx : null) || s.ucy !== (u ? u.cy : null) || s.uz !== (u ? u.z : null)
      || s.hover !== v.hover || s.selected !== v.selected || s.hx !== (v.hoverAt ? v.hoverAt.x : null) || s.hy !== (v.hoverAt ? v.hoverAt.y : null)
      || s.w !== window.innerWidth || s.h !== window.innerHeight || s.cw !== r.width || s.ch !== r.height || s.paint !== PAINT_MODE.on || s.wr !== PAINT_ALT.wolfRider;
  }
  /** The next loop frame redraws whatever changed. */
  invalidate() { this.dirty = true; }

  /** Camera keys per pace (cached); the camera is a pure function of (t, speed). */
  camFor(speed) {
    const k = camPace(speed).toFixed(3);
    if (!this.camCache.has(k)) this.camCache.set(k, buildCameraKeys(this.stage.T, window.innerWidth, window.innerHeight, speed));
    return this.camCache.get(k);
  }
  camera(t) {
    if (!this.follow && this.user) return this.user;
    if (this.speed !== this.camSpeed) {
      // a speed change cross-fades from the old pace's camera to the new one over 0.5 s of real time
      const prev = this.cam, next = this.camFor(this.speed);
      if (prev !== next) this.camFade = { from: prev, t0: performance.now() };
      this.cam = next; this.camSpeed = this.speed;
    }
    const c = cameraAt(this.cam, t, this.reduced);
    if (this.camFade) {
      const q = smooth((performance.now() - this.camFade.t0) / 500);
      if (q >= 1) this.camFade = null;
      else { const o = cameraAt(this.camFade.from, t, this.reduced); return { cx: lerp(o.cx, c.cx, q), cy: lerp(o.cy, c.cy, q), z: lerp(o.z, c.z, q) }; }
    }
    return c;
  }
  applyCamera(t) {
    const c = this.camera(t);
    const R = this.cam.R;
    const w = this.stage.world;
    w.scale.set(c.z);
    w.position.set((R.x0 + R.x1) / 2 - c.cx * c.z, (R.y0 + R.y1) / 2 - c.cy * c.z);
    const sh = this.stage.fx ? this.stage.fx.shakeAt(t) : null; // the pilot's trauma (none under reduced motion)
    if (sh) w.position.set(w.position.x + sh.x, w.position.y + sh.y);
    this.curCam = c;
  }
  userFromCurrent() { if (!this.user || this.follow) this.user = { ...this.curCam }; this.follow = false; }

  // ---- picking (design 11.1): commanders, then block hulls, then big bodies (critique fix 5) ----
  pick(px, py) {
    const st = this.stage, T = st.T, t = this.t;
    const w = st.world;
    const X = (px - w.position.x) / w.scale.x, Y = (py - w.position.y) / w.scale.y;
    const hit = this.pickSmall(X, Y, t);
    if (hit !== null && T.G[hit].g.isCmd) return hit; // a leader's figure always answers
    // a big body answers only on its body: its ground footprint, or its bounds inset 25% / 20%
    let big = null;
    for (const bb of st.bigs) {
      if (!bb.body.root.visible) continue;
      const fr = LAYOUT.footR[bb.G.g.size] * 1.3;
      const FX = sx(bb.gx, bb.gy), FY = sy(bb.gx, bb.gy, 0);
      const b = bb.body.root.getBounds();
      const ix = (b.maxX - b.minX) * 0.25, iy = (b.maxY - b.minY) * 0.2;
      if (((X - FX) / fr) ** 2 + ((Y - FY) / (fr * 0.643)) ** 2 <= 1 || (px >= b.minX + ix && px <= b.maxX - ix && py >= b.minY + iy && py <= b.maxY - iy)) { big = bb.G.idx; break; }
    }
    if (hit === null || big === null) return hit ?? big;
    // both: the block wins in the inner part of its hull or where one of its figures is under the
    // pointer; the body wins in the rest of the hull
    if (this.lastPickD < 0.36) return hit;
    const G = T.G[hit];
    for (const fi of G.figs) {
      const sp = st.sprites[fi];
      if (sp && sp.visible && Math.abs(X - sp.x) < 8 && Y > sp.y - 30 && Y < sp.y + 4) return hit;
    }
    return big;
  }
  pickSmall(X, Y, t) {
    const st = this.stage, T = st.T;
    let best = null, bd = Infinity;
    for (const G of T.G) {
      if (G.g.size >= 3) continue;
      if (G.g.isCmd) {
        const sp = st.sprites[G.figs[0]];
        if (!sp || !sp.visible) continue;
        const dx = Math.abs(X - sp.x), dy = sp.y - Y;
        if (dx < 9 && dy > -4 && dy < 34) return G.idx;
        continue;
      }
      const h = st.hull(G, t);
      if (!h) continue;
      const d = ((X - h.X) / (h.rx + 6)) ** 2 + ((Y - h.Y + 10) / (h.ry + 14)) ** 2;
      if (d < 1 && d < bd) { bd = d; best = G.idx; }
    }
    this.lastPickD = bd; // how deep in the hull (0 centre, 1 rim)
    return best;
  }
  setHover(gi, elx) {
    this.view.hover = gi;
    if (elx && gi !== null) { const r = elx.getBoundingClientRect(); this.view.hoverAt = { x: r.left + r.width / 2, y: r.top }; }
    for (const [i, c] of this.hud.cardEls) c.classList.toggle('hovered', i === gi);
  }
  select(gi) {
    this.view.selected = this.view.selected === gi ? null : gi;
    for (const [i, c] of this.hud.cardEls) c.classList.toggle('selected', i === this.view.selected);
  }
  centerOn(gi) {
    const h = this.stage.hull(this.stage.T.G[gi], this.t);
    if (!h) return;
    this.userFromCurrent();
    this.user = { ...this.user, cx: h.X, cy: h.Y };
  }

}
