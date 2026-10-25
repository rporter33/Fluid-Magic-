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
    });
    this.app.ticker.stop();
    document.getElementById('app').appendChild(this.app.canvas);
    this.hud = new Hud(this);
    this.view = { hover: null, selected: null, hoverAt: null };
    this.speed = 1; this.playing = true; this.beats = false; this.follow = true; this.user = null; this.reduced = false;
    this.frameLog = []; this.firstFrames = [];
    this.buildTransport(); this.buildPicker(); this.buildCamCtl(); this.buildMenu(); this.bindInput();
    const q = new URLSearchParams(location.search);
    // painted figures (stage B): decode the painted pages first; Painted is the default, ?fig=procedural the old look
    if (PAINTLIB) { try { await PAINTLIB.load(); } catch (e) { window.__errors.push('paint: ' + e.message); } }
    PAINT_MODE.on = !!(PAINTLIB && PAINTLIB.ready) && q.get('fig') !== 'procedural';
    this.buildFigs();
    this.load(q.get('b') || DATA[0].key);
    if (q.get('t')) this.seek(+q.get('t'));
    if (q.get('paused')) this.playing = false;
    document.getElementById('loading').remove();
    this.lastNow = null; // the first frame advances nothing: its timestamp may predate init (critique fix 4)
    requestAnimationFrame((n) => this.loop(n));
    window.addEventListener('resize', () => { if (this.stage) { this.camCache = new Map(); this.cam = this.camFor(this.speed); } });
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
    this.camCache = new Map(); this.camFade = null; this.camSpeed = this.speed;
    this.cam = this.camFor(this.speed);
    this.key = B.key; this.B = B;
    this.view.hover = null; this.view.selected = null;
    this.follow = true; this.user = null;
    this.hud.build(this.stage);
    document.querySelectorAll('#picker button, #menu .pick:not(.figpick)').forEach((b) => b.classList.toggle('on', b.dataset.k === B.key));
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
    this.render(this.t);
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
  }

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

  // ---- controls ----
  buildTransport() {
    const tr = document.getElementById('transport');
    tr.innerHTML = `<div id="round"><span class="rn num">R–</span><span class="pips"><i class="pip"></i><i class="pip"></i><i class="pip"></i><i class="pip"></i></span></div>
      <button class="btn" id="bPlay" title="Play or pause (Space)">${ICON.pause}</button>
      <button class="btn wide num" id="bSpeed" title="Speed (1 to 4, + and −; Shift+click steps down)">1x</button>
      <button class="btn hide-phone" id="bBeats" title="Beats (B)">${ICON.beats}</button>
      <button class="btn" id="bSkip" title="Skip to the result (S or End)">${ICON.skip}</button>
      <button class="btn" id="bMenu" title="Menu">${ICON.menu}</button>`;
    document.getElementById('bPlay').onclick = () => this.togglePlay();
    document.getElementById('bSpeed').onclick = (e) => this.cycleSpeed(e.shiftKey ? -1 : 1); // the button wraps (4x -> 0.5x)
    document.getElementById('bBeats').onclick = () => { this.beats = !this.beats; };
    document.getElementById('bSkip').onclick = () => this.seek(this.stage.T.duration);
    document.getElementById('bMenu').onclick = () => document.getElementById('menu').classList.toggle('show');
  }
  syncTransport() {
    const k = (this.playing ? 1 : 0) + '/' + this.speed + '/' + this.beats + '/' + this.follow;
    if (this._tk === k) return;
    this._tk = k;
    document.getElementById('bPlay').innerHTML = this.playing ? ICON.pause : ICON.play;
    document.getElementById('bSpeed').textContent = this.speed + 'x';
    document.getElementById('bBeats').classList.toggle('on', this.beats);
    document.getElementById('bFollow').classList.toggle('on', this.follow);
  }
  togglePlay() { if (this.t >= this.stage.T.duration) this.seek(0); this.playing = !this.playing; }
  stepSpeed(d) { const i = clamp(SPEEDS.indexOf(this.speed) + d, 0, SPEEDS.length - 1); this.speed = SPEEDS[i]; }
  cycleSpeed(d) { const n = SPEEDS.length; this.speed = SPEEDS[(SPEEDS.indexOf(this.speed) + d + n) % n]; }
  buildPicker() {
    const p = document.getElementById('picker');
    p.innerHTML = '<span class="tag">Mockup battles</span>' + DATA.map((b) => `<button data-k="${b.key}">${b.title}</button>`).join('');
    p.querySelectorAll('button').forEach((b) => (b.onclick = () => this.load(b.dataset.k)));
  }
  /** The figures control: Painted (default) or Procedural; switching keeps the story time and the camera. */
  buildFigs() {
    const box = document.getElementById('figs');
    if (!box) return;
    const has = !!(PAINTLIB && PAINTLIB.ready);
    box.innerHTML = '<span class="tag">Figures</span>' + [['painted', 'Painted'], ['procedural', 'Procedural']]
      .map(([k, l]) => `<button data-f="${k}"${k === 'painted' && !has ? ' disabled' : ''}>${l}</button>`).join('');
    box.querySelectorAll('button').forEach((b) => (b.onclick = () => this.setFigures(b.dataset.f)));
    this.syncFigs();
  }
  syncFigs() {
    const on = PAINT_MODE.on ? 'painted' : 'procedural';
    document.querySelectorAll('#figs button, #menu .figpick').forEach((b) => b.classList.toggle('on', b.dataset.f === on));
  }
  setFigures(mode) {
    const on = mode === 'painted' && !!(PAINTLIB && PAINTLIB.ready);
    if (PAINT_MODE.on === on && this.stage) { this.syncFigs(); return; }
    PAINT_MODE.on = on;
    if (this.stage) {
      const keep = { t: this.t, playing: this.playing, follow: this.follow, user: this.user ? { ...this.user } : null, sel: this.view.selected };
      this.load(this.key);
      this.t = keep.t; this.playing = keep.playing; this.follow = keep.follow; this.user = keep.user;
      if (keep.sel !== null) this.select(keep.sel);
      this.render(this.t);
    }
    this.syncFigs();
  }
  buildCamCtl() {
    const c = document.getElementById('camctl');
    c.innerHTML = `<button class="btn" id="bFollow" title="Follow the action (Z)">${ICON.follow}</button><button class="btn" id="bZoomOut" title="Zoom out">−</button><button class="btn" id="bZoomIn" title="Zoom in">+</button>`;
    document.getElementById('bFollow').onclick = () => { this.follow = true; this.user = null; };
    document.getElementById('bZoomOut').onclick = () => this.zoomBy(1 / 1.2, window.innerWidth / 2, window.innerHeight / 2);
    document.getElementById('bZoomIn').onclick = () => this.zoomBy(1.2, window.innerWidth / 2, window.innerHeight / 2);
  }
  buildMenu() {
    const m = document.getElementById('menu');
    m.innerHTML = '';
    // the mockup's battles, shown in the menu on phones (the picker is hidden there)
    for (const b of DATA) {
      const it = el('button', 'pick', `<span>${b.title}</span><kbd></kbd>`);
      it.dataset.k = b.key;
      it.onclick = () => { this.load(b.key); m.classList.remove('show'); };
      m.appendChild(it);
    }
    m.appendChild(el('div', 'sep'));
    for (const [k, l] of [['painted', 'Figures: Painted'], ['procedural', 'Figures: Procedural']]) {
      const it = el('button', 'pick figpick', `<span>${l}</span><kbd></kbd>`);
      it.dataset.f = k;
      it.onclick = () => { this.setFigures(k); m.classList.remove('show'); };
      m.appendChild(it);
    }
    m.appendChild(el('div', 'sep'));
    const items = [['Restart', 'Home', () => this.seek(0, true)], ['Log', 'L', () => document.getElementById('log').classList.toggle('show')],
      ['Enemy strip', ']', () => document.getElementById('enemy').classList.toggle('collapsed')], ['Hide the HUD', 'H', () => document.getElementById('hud').classList.toggle('hidden')],
      ['Follow the action', 'Z', () => { this.follow = true; this.user = null; }], ['Reduced motion', '', () => { this.reduced = !this.reduced; }]];
    for (const [label, key, fn] of items) {
      const b = el('button', '', `<span>${label}</span><kbd>${key}</kbd>`);
      b.onclick = () => { fn(); m.classList.remove('show'); };
      m.appendChild(b);
    }
  }
  zoomBy(f, px, py) {
    this.userFromCurrent();
    const c = this.user, R = this.cam.R;
    const fScale = window.innerWidth / 1920;
    const zMin = Math.min(14 * fScale / 28, this.cam.zAll * 0.8), zMax = 72 * Math.max(fScale, 0.5) / 28;
    const nz = clamp(c.z * f, zMin, zMax);
    // keep the point under the cursor
    const wx = (px - (R.x0 + R.x1) / 2) / c.z + c.cx, wy = (py - (R.y0 + R.y1) / 2) / c.z + c.cy;
    c.cx = wx - (px - (R.x0 + R.x1) / 2) / nz; c.cy = wy - (py - (R.y0 + R.y1) / 2) / nz; c.z = nz;
    this.clampUser();
  }
  clampUser() {
    const c = this.user, b = this.stage.T.allBox;
    c.cx = clamp(c.cx, b.x0, b.x1); c.cy = clamp(c.cy, b.y0, b.y1);
  }
  keyPan(dt) {
    let dx = 0, dy = 0;
    if (this.keysDown.has('a')) dx -= 1; if (this.keysDown.has('d')) dx += 1;
    if (this.keysDown.has('w')) dy -= 1; if (this.keysDown.has('s') && !this.sIsSkip) dy += 1;
    if (!dx && !dy) return;
    this.userFromCurrent();
    this.user.cx += dx * dt * 600 / this.user.z; this.user.cy += dy * dt * 600 / this.user.z;
    this.clampUser();
  }
  bindInput() {
    const cv = () => this.app.canvas;
    let down = null;
    window.addEventListener('pointerdown', (e) => { if (e.target === cv()) down = { x: e.clientX, y: e.clientY, moved: false }; });
    window.addEventListener('pointermove', (e) => {
      if (down && (Math.abs(e.clientX - down.x) + Math.abs(e.clientY - down.y) > 4 || down.moved)) {
        if (!down.moved) { this.userFromCurrent(); down.moved = true; }
        this.user.cx -= (e.clientX - down.x) / this.user.z; this.user.cy -= (e.clientY - down.y) / this.user.z;
        down.x = e.clientX; down.y = e.clientY;
        this.clampUser();
        return;
      }
      if (e.target !== cv()) return;
      const gi = this.pick(e.clientX, e.clientY);
      this.view.hover = gi; this.view.hoverAt = { x: e.clientX, y: e.clientY };
      for (const [i, c] of this.hud.cardEls) c.classList.toggle('hovered', i === gi);
      cv().style.cursor = gi !== null ? 'pointer' : 'default';
    });
    window.addEventListener('pointerup', (e) => {
      if (down && !down.moved && e.target === cv()) {
        const gi = this.pick(e.clientX, e.clientY);
        this.view.hoverAt = { x: e.clientX, y: e.clientY }; // a tap places the card where the finger was (critique fix 10)
        if (gi !== null) this.select(gi); else { this.view.selected = null; this.select(null); this.view.selected = null; }
      }
      down = null;
    });
    window.addEventListener('dblclick', (e) => { if (e.target === cv() && this.pick(e.clientX, e.clientY) === null) { this.follow = true; this.user = null; } });
    window.addEventListener('wheel', (e) => { if (e.target === cv()) { e.preventDefault(); this.zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX, e.clientY); } }, { passive: false });
    this.keysDown = new Set();
    window.addEventListener('keydown', (e) => {
      const k = e.key;
      if (['w', 'a', 's', 'd'].includes(k.toLowerCase())) { this.keysDown.add(k.toLowerCase()); if (k.toLowerCase() !== 's') return; }
      if (k === ' ') { e.preventDefault(); this.togglePlay(); }
      else if (k >= '1' && k <= '4') this.speed = SPEEDS[+k - 1];
      else if (k === '+' || k === '=') this.stepSpeed(1);
      else if (k === '-') this.stepSpeed(-1);
      else if (k === 'b' || k === 'B') this.beats = !this.beats;
      else if (k === 'End' || (k === 'S' && e.shiftKey)) this.seek(this.stage.T.duration);
      else if (k === 'Home') this.seek(0, true);
      else if (k === 'z' || k === 'Z') { this.follow = true; this.user = null; }
      else if (k === 'h' || k === 'H') document.getElementById('hud').classList.toggle('hidden');
      else if (k === 'l' || k === 'L') document.getElementById('log').classList.toggle('show');
      else if (k === ']') document.getElementById('enemy').classList.toggle('collapsed');
      else if (k === 'Escape') { this.view.selected = null; this.select(null); this.view.selected = null; document.getElementById('menu').classList.remove('show'); }
      else if (k === 'ArrowRight') this.seek(this.t + (e.shiftKey ? 5 : 1));
      else if (k === 'ArrowLeft') this.seek(this.t - (e.shiftKey ? 5 : 1));
      else if (k === 'k' || k === 'K') document.getElementById('scrub').classList.add('open');
      else if (k === 'f' || k === 'F') this.setFigures(PAINT_MODE.on ? 'procedural' : 'painted');
    });
    window.addEventListener('keyup', (e) => { this.keysDown.delete(e.key.toLowerCase()); if (e.key === 'k' || e.key === 'K') document.getElementById('scrub').classList.remove('open'); });
    const sc = document.getElementById('scrub');
    let scrubbing = false;
    const seekAt = (e) => { const r = sc.getBoundingClientRect(); this.seek(clamp((e.clientX - r.left) / r.width, 0, 1) * this.stage.T.duration); };
    sc.addEventListener('pointerdown', (e) => { scrubbing = true; seekAt(e); });
    window.addEventListener('pointermove', (e) => { if (scrubbing) seekAt(e); });
    window.addEventListener('pointerup', () => { scrubbing = false; });
  }

  // ---- moments for screenshots ----
  moments() {
    const T = this.stage.T;
    const first = (pred) => { const b = T.beats.find(pred); return b ? b.t : null; };
    const vol = T.projectiles.find((p) => p.kind !== 'breath');
    const contact = first((b) => b.kind === 'contact');
    // a monster's blow: the first big body's killing strike, else its first shown strike, else its breath
    const bigF = T.F.filter((f) => T.G[f.g].g.size >= 3);
    const kills = bigF.flatMap((f) => f.strikes.filter((s) => s.item && s.item.b.outcome === 'kill').map((s) => s.t));
    const hits = bigF.flatMap((f) => f.strikes.filter((s) => s.item && s.item.b.outcome !== 'miss').map((s) => s.t));
    const br = T.spellFx.filter((x) => x.spell === 'breath' && bigF.some((f) => f.id === x.caster)).map((x) => x.release + 0.3);
    const monster = kills.length ? Math.min(...kills) + 0.02 : hits.length ? Math.min(...hits) + 0.02 : br.length ? Math.min(...br) : null;
    return {
      deploy: 2.2,
      volley: vol ? vol.t0 + (vol.t1 - vol.t0) * 0.55 : null,
      clash: contact !== null ? contact + 0.9 : null,
      monster,
      breath: (() => { const fx = T.spellFx.find((x) => x.spell === 'breath'); return fx ? fx.release + 0.25 : null; })(),
      rout: first((b) => b.kind === 'rout') !== null ? first((b) => b.kind === 'rout') + 1.4 : null,
      death: first((b) => b.kind === 'death'),
      result: T.duration,
      duration: T.duration,
    };
  }

  // ---- checks (task step 4) ----
  countStanding(t, speed) {
    const st = this.stage, T = st.T;
    st.frame(t, speed, this.view);
    const n = new Array(T.G.length).fill(0);
    for (let i = 0; i < T.F.length; i++) {
      const f = T.F[i];
      const sp = st.sprites[i];
      const dead = f.death && t >= f.death.t;
      if (sp) { if (sp.visible && sp.alpha > 0 && !dead) n[f.g]++; }
      else { const bb = st.bigs.find((b) => b.f === f); if (bb && bb.body.root.visible && !dead) n[f.g]++; }
    }
    return n;
  }
  checkBattle(key) {
    this.load(key);
    this.playing = false;
    const T = this.stage.T, B = this.B;
    const out = { key, title: B.title, rerunMatches: B.rerunMatches, duration: +T.duration.toFixed(1), phaseEnds: 0, figureMismatches: [], cardMismatches: [], figures: T.F.length };
    for (const speed of [1, 4]) {
      for (const pe of T.phaseEnds) {
        if (!pe.fold) continue;
        const n = this.countStanding(pe.t, speed);
        this.hud.update(pe.t);
        if (speed === 1) out.phaseEnds++;
        for (const [gi, v] of Object.entries(pe.fold.units)) {
          const [count, , , gone] = v;
          const expectStanding = gone ? 0 : count;
          if (n[gi] !== expectStanding) out.figureMismatches.push({ speed, round: pe.round, phase: pe.phase, group: B.groups[gi].unit, standing: n[gi], record: expectStanding });
          const card = countAt(T, +gi, pe.t);
          const el2 = this.hud.cardEls.get(+gi) || this.hud.miniEls.get(+gi);
          const shown = el2 ? +(el2.querySelector('.count, .cnt').textContent) : null;
          const g = B.groups[gi];
          const shownCount = g.cmd ? (countAt(T, +gi, pe.t)) : shown;
          if (card !== count || (shownCount !== null && shownCount !== count)) out.cardMismatches.push({ speed, round: pe.round, phase: pe.phase, group: g.unit, card: shownCount, model: card, record: count });
        }
      }
    }
    // every death left a body (or a death mark)
    const end = T.duration;
    this.stage.frame(end, 1, this.view);
    let marks = 0;
    T.decals.forEach((d, i) => { if ((d.kind === 'body' || d.kind === 'scorch' || d.kind === 'specks') && this.stage.decalSprites[i].visible) marks++; });
    const deaths = B.groups.reduce((a, g, i) => a + (g.cmd ? 1 : g.start) - B.end[i][0], 0);
    out.deaths = deaths; out.bodiesAtEnd = marks;
    out.bodiesOk = marks === deaths;
    // the replay ends with the record's winner
    this.hud.update(end);
    const rt = document.getElementById('resultTitle');
    out.winnerShown = rt ? rt.dataset.winner : null;
    out.winnerOk = out.winnerShown === B.winner;
    // determinism: the timeline built twice is the same
    const digest = (TT) => hash32(JSON.stringify({ d: TT.duration, f: TT.F.map((f) => [f.death && f.death.t, f.strikes.length, f.seatCues.length]), p: TT.projectiles.map((p) => [p.t0, p.t1, p.from, p.to]) }));
    const S2 = buildScript(B), T2 = buildTimeline(S2, layoutBattle(S2));
    out.deterministic = digest(T2) === digest(T);
    out.build = this.buildMs;
    return out;
  }
  /**
   * Frame timing: frames run back to back at a 60 Hz story step, timing the JS update (figures,
   * effects, camera, HUD) and Pixi's render submit separately on the CPU, then the GPU wait
   * (a 1-pixel readPixels sync). In this container the GPU is SwiftShader on the CPU, so the GPU
   * wait does not transfer to real hardware; the CPU times do.
   */
  async measure(key, speed, frames, from) {
    this.load(key);
    this.speed = speed; this.playing = false;
    const gl = this.app.renderer.gl, px = new Uint8Array(4);
    const up = [], rd = [], gp = [];
    let t = from;
    for (let i = 0; i < frames + 10; i++) {
      t = Math.min(this.stage.T.duration, t + (1 / 60) * speed * storyRate(this.stage.T, t, speed));
      const a = performance.now();
      this.applyCamera(t); this.stage.frame(t, speed, this.view); this.hud.update(t);
      const b = performance.now();
      this.app.renderer.render(this.app.stage);
      const c = performance.now();
      if (gl) gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      const d = performance.now();
      if (i >= 10) { up.push(b - a); rd.push(c - b); gp.push(d - c); }
      if (i % 15 === 0) await new Promise((r) => setTimeout(r, 0));
    }
    this.t = t;
    const pct = (arr, q) => { const s = [...arr].sort((x, y) => x - y); return +s[Math.min(s.length - 1, Math.floor(q * s.length))].toFixed(2); };
    const sum = up.map((x, i) => x + rd[i]);
    return { speed, frames: up.length, storySpan: +(t - from).toFixed(1), updateP50: pct(up, 0.5), updateP95: pct(up, 0.95), renderCpuP50: pct(rd, 0.5), renderCpuP95: pct(rd, 0.95),
      cpuP50: pct(sum, 0.5), cpuP95: pct(sum, 0.95), gpuWaitP50: pct(gp, 0.5), figures: this.stage.T.F.length, viewport: `${window.innerWidth}x${window.innerHeight}` };
  }
  /** Same-side figures of different squads closer than 9 wu, every 0.25 s (critique fix 2; qa/s6). */
  checkOverlap() {
    const T = this.stage.T, p = { x: 0, y: 0, h: 0 };
    let frames = 0, maxPairs = 0, first = null;
    for (let t = 0; t <= T.duration; t += 0.25) {
      const grid = new Map(); let n = 0;
      for (const f of T.F) {
        const Q = T.G[f.g];
        if (t < Q.appear || (f.death && t >= f.death.t) || (Q.leaveT !== null && t >= Q.leaveT) || Q.g.size >= 3 || Q.kind === 'cloud') continue;
        if (f.rout && t >= f.rout.t) continue;
        figPos(T, f, t, p);
        const cx = Math.floor(p.x / 9), cy = Math.floor(p.y / 9);
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
          for (const q of grid.get((cx + dx) + ',' + (cy + dy)) || []) {
            if (q.g === f.g || q.side !== Q.side || Math.abs(q.h - p.h) > 10) continue;
            if (Math.hypot(q.x - p.x, q.y - p.y) < 9) { n++; if (!first) first = { t: +t.toFixed(2), a: T.G[q.g].g.unit, b: Q.g.unit }; }
          }
        }
        const k = cx + ',' + cy; if (!grid.has(k)) grid.set(k, []);
        grid.get(k).push({ g: f.g, side: Q.side, x: p.x, y: p.y, h: p.h });
      }
      if (n) frames++;
      maxPairs = Math.max(maxPairs, n);
    }
    return { framesWithOverlap: frames, maxPairs, first };
  }
  /** Picking at a leader or a block's middle finds that group, never a big body behind it (critique fix 5). */
  checkPick() {
    const st = this.stage, T = st.T, m = this.moments();
    const out = { tried: 0, wrong: [] };
    for (const t of [m.clash !== null ? m.clash + 1.5 : 10, m.monster !== null ? m.monster : 20]) {
      this.seek(t); this.follow = true; this.user = null; this.render(t);
      const w = st.world;
      for (const G of T.G) {
        if (G.g.size >= 3 || t < G.appear || countAt(T, G.idx, t) === 0 || (G.routT !== null && t >= G.routT)) continue;
        let X, Y;
        if (G.g.isCmd) { const sp = st.sprites[G.figs[0]]; if (!sp || !sp.visible) continue; X = sp.x; Y = sp.y - 14; }
        else { const h = st.hull(G, t); if (!h) continue; X = h.X; Y = h.Y; }
        const px = w.position.x + X * w.scale.x, py = w.position.y + Y * w.scale.y;
        if (px < 0 || py < 0 || px > window.innerWidth || py > window.innerHeight) continue;
        out.tried++;
        const got = this.pick(px, py);
        if (got === null || T.G[got].g.size >= 3 || (G.g.isCmd && got !== G.idx)) out.wrong.push({ t: +t.toFixed(1), want: G.g.unit, got: got === null ? null : T.G[got].g.unit });
      }
    }
    return out;
  }
  /**
   * The two armies as rendered at deploy (critique fix 6; design 3.8): the median color of the pixels
   * on every rank-and-file figure's torso, per side, read back from the canvas. They must part by at
   * least CVD_MIN under every vision, and each side must stay 15 L* below its ground.
   */
  checkColors(B) {
    const st = this.stage, T = st.T;
    this.follow = true; this.user = null; this.seek(2.2); this.render(2.2);
    const gl = this.app.renderer.gl, cv = this.app.canvas, W = cv.width, H = cv.height, res = this.app.renderer.resolution;
    const px = new Uint8Array(W * H * 4);
    gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const w = st.world, acc = { near: [[], [], []], far: [[], [], []] };
    st.sprites.forEach((sp, i) => {
      if (!sp || !sp.visible) return;
      const Q = T.G[T.F[i].g];
      if (Q.g.isCmd || Q.kind === 'cloud') return;
      const side = Q.side === B.nearSide ? 'near' : 'far';
      const x = Math.round((w.position.x + sp.x * w.scale.x) * res), y = Math.round((w.position.y + (sp.y - 14) * w.scale.y) * res);
      const r = Math.max(1, Math.round(3 * w.scale.x * res));
      for (let dx = -r; dx <= r; dx++) for (let dy = -2 * r; dy <= r; dy++) {
        const X = x + dx, Y = H - 1 - (y + dy);
        if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
        const k = (Y * W + X) * 4;
        acc[side][0].push(px[k]); acc[side][1].push(px[k + 1]); acc[side][2].push(px[k + 2]);
      }
    });
    const med = (ch) => { const m = ch.map((a) => a.sort((p, q) => p - q)[a.length >> 1] || 0); return (m[0] << 16) | (m[1] << 8) | m[2]; };
    const a = med(acc.near), b = med(acc.far);
    const d = deltaEBy(a, b), ground = lstar(groundColor(B));
    const below = [+(ground - lstar(a)).toFixed(1), +(ground - lstar(b)).toFixed(1)];
    return { variants: st.paint ? { ...st.paint.sideLooks, painted: true } : { near: st.sideLooks.near, far: st.sideLooks.far }, nearRendered: numToHex(a), farRendered: numToHex(b), deltaE: d, belowGround: below,
      ok: VISIONS.every((v) => d[v] >= CVD_MIN) && below.every((x) => x >= 15) };
  }
  // ---- painted figures (stage B): art use, face match, variation, side colour at play zoom ----
  /** Foot troops and commanders: which use painted frames (and that their sprites really show them), which cannot. */
  checkPaintUse() {
    const st = this.stage, T = st.T, B = this.B;
    const out = { troopGroups: 0, troopGroupsPainted: 0, commanders: 0, commandersPainted: 0, notPainted: [], spriteChecks: 0, spritesNotPainted: 0, standInMoments: 0, reported: [] };
    if (!st.paint) return { ...out, mode: 'procedural', ok: null };
    const track = new Set(['ashRider', 'wolfRider', 'wolf', 'fireSprite', 'hornetSwarm']); // mounts and creatures: their own review track
    for (const g of st.S.groups) {
      if (g.size >= 3 || (!g.isCmd && track.has(g.unit))) continue;
      const k = st.paint.lookOf[g.idx];
      if (g.isCmd) { out.commanders++; if (k) out.commandersPainted++; } else { out.troopGroups++; if (k) out.troopGroupsPainted++; }
      if (!k) out.notPainted.push({ unit: g.unit, cmd: !!g.isCmd, name: g.personal || null, why: st.paint.why[g.idx] });
      else for (const [v, vv] of Object.entries(PAINT.looks[k].views)) if (vv.status !== 'pass' && !(g.isCmd ? false : false)) out.reported.push({ look: k, view: v, status: vv.status, failed: vv.failed });
    }
    st.paint.standInMoments = 0;
    const m = this.moments();
    for (const t of [m.deploy, m.clash, m.rout, m.result].filter((x) => x !== null)) {
      st.frame(t, 1, this.view);
      st.sprites.forEach((sp, i) => {
        if (!sp || !sp.visible || !sp.paint) return;
        out.spriteChecks++;
        if (PAINTLIB.texLook.get(sp.texture) !== sp.paint.key) out.spritesNotPainted++;
      });
    }
    out.standInMoments = st.paint.standInMoments;
    const uniq = new Map(); for (const r of out.reported) uniq.set(r.look + '.' + r.view, r);
    out.reported = [...uniq.values()];
    out.allPainted = out.troopGroupsPainted === out.troopGroups && out.commandersPainted === out.commanders;
    // with the art that exists: every foot troop painted, every commander whose face has art painted, sprites honest
    out.ok = out.troopGroupsPainted === out.troopGroups && out.spritesNotPainted === 0
      && out.notPainted.every((n) => n.cmd && PAINT.missing.some((x) => x.unit === n.unit));
    return out;
  }
  /** Each commander's card portrait and field figure are the same face (read from the card's image and the sprite's texture). */
  checkFaceMatch() {
    const st = this.stage, T = st.T;
    const out = { commanders: 0, matched: 0, mismatches: [], noArt: [] };
    if (!st.paint) return { ...out, ok: null };
    const byHash = new Map(Object.entries(PAINT.looks).filter(([, L]) => L.kind === 'commander').map(([k, L]) => [L.portraitHash, k]));
    st.frame(2.2, 1, this.view);
    for (const g of st.S.groups) {
      if (!g.isCmd || g.size >= 3) continue;
      out.commanders++;
      const el2 = this.hud.cardEls.get(g.idx) || this.hud.miniEls.get(g.idx);
      const src = el2 ? el2.querySelector('img').getAttribute('src') : null;
      const fromCard = src ? byHash.get(hash32(src)) || null : null;
      const sp = st.sprites[T.G[g.idx].figs[0]];
      const fromFig = sp && sp.paint ? PAINTLIB.texLook.get(sp.texture) || null : null;
      if (!fromFig) { out.noArt.push({ unit: g.unit, name: g.personal, cardFace: fromCard, why: st.paint.why[g.idx] }); continue; }
      if (fromCard && fromCard === fromFig && PAINT.looks[fromFig].portraitHash === hash32(g.portrait)) out.matched++;
      else out.mismatches.push({ unit: g.unit, name: g.personal, card: fromCard, figure: fromFig });
    }
    out.ok = out.mismatches.length === 0;
    return out;
  }
  /** No two neighbours in a block (deploy seats) identical in frame, tint and timing (owner note 1). */
  checkVariation() {
    const st = this.stage, T = st.T, L = st.L;
    const out = { blocks: 0, pairs: 0, identical: 0, differFrame: 0, differVariant: 0, differTint: 0, differTiming: 0, first: null };
    if (!st.paint) return { ...out, ok: null };
    st.frame(2.2, 1, this.view);
    for (const G of T.G) {
      const k = st.paint.lookOf[G.idx];
      if (!k || PAINT.looks[k].kind !== 'troop' || G.figs.length < 2) continue;
      out.blocks++;
      const seats = G.figs.map((fi) => { const f = T.F[fi]; const s = L.groups[G.idx].seats[f.member]; return { f, sp: st.sprites[fi], file: s.file, rank: s.rank }; });
      for (let a = 0; a < seats.length; a++) for (let b = a + 1; b < seats.length; b++) {
        const A = seats[a], Bq = seats[b];
        const dr = Math.abs(A.rank - Bq.rank), df = Math.abs(A.file - Bq.file);
        if (!((dr === 0 && df <= 1) || (dr === 1 && df <= 1))) continue;
        if (!A.sp.visible || !Bq.sp.visible) continue;
        out.pairs++;
        const va = A.sp.paint.vary, vb = Bq.sp.paint.vary;
        const sameFrame = A.sp.texture === Bq.sp.texture, sameVar = va.variant === vb.variant, sameTint = A.sp.tint === Bq.sp.tint;
        const sameTiming = Math.abs(va.phase - vb.phase) < 0.02 && Math.abs(va.tempo - vb.tempo) < 0.004;
        if (!sameFrame) out.differFrame++;
        if (!sameVar) out.differVariant++;
        if (!sameTint) out.differTint++;
        if (!sameTiming) out.differTiming++;
        if (sameFrame && sameTint && sameTiming) { out.identical++; if (!out.first) out.first = { unit: G.g.unit, a: [A.file, A.rank], b: [Bq.file, Bq.rank] }; }
      }
    }
    for (const k of ['differFrame', 'differVariant', 'differTint', 'differTiming']) out[k + 'Pct'] = out.pairs ? +(100 * out[k] / out.pairs).toFixed(1) : null;
    out.ok = out.identical === 0;
    return out;
  }
  /**
   * The side's colour at play zoom (art plan 1.4): the rank-and-file of each side rendered alone at a man = 28 px at
   * deploy (tier S, with the side keyline), and the share of visible pixels (weighted by coverage) within 20 degrees
   * of the side's base cloth hue with chroma >= max(0.04, 0.45 x the cloth's). Target 30% per side.
   */
  checkSideShare() {
    const st = this.stage, T = st.T, B = this.B, R = this.app.renderer;
    if (!st.paint) return { ok: null };
    this.follow = true; this.user = null; this.seek(2.2); this.render(2.2);
    const w = st.world, keep = { x: w.position.x, y: w.position.y, s: w.scale.x, tier: st.paint.tier };
    w.scale.set(1);
    st.applyPaintTier('S');
    st.frame(2.2, 1, this.view);
    const wallParts = st.wallLayer ? st.wallLayer.children.filter((c) => c !== st.walkUnits) : []; // keep the rampart's defenders
    const hide = [st.ground, st.decalLayer, st.groundFx, st.shadows, st.projShadow, ...wallParts, st.skyShadows, st.seeThrough, st.proj, st.fxNormal, st.fxAdd, st.spellG, st.spellAdd, st.glyphG, st.bannerLayer, ...(st.genBanners || []).map((b) => b.root), st.overlay].filter(Boolean);
    const hv = hide.map((o) => o.visible); hide.forEach((o) => (o.visible = false));
    const bigVis = st.bigs.map((bb) => bb.body.root.visible); st.bigs.forEach((bb) => (bb.body.root.visible = false));
    const vis = st.sprites.map((sp) => sp && sp.visible);
    const out = { tier: 'S', manPx: 28, sides: {} };
    const gl = R.gl;
    for (const side of ['attacker', 'defender']) {
      const nat = B.sides[side].def, cloth = PAINT.cloth[nat];
      if (!cloth) continue;
      const c = oklchOf(hexToNum(cloth)), cmin = Math.max(0.04, 0.45 * c.C);
      const acc = { visible: 0, side: 0, groups: [] };
      for (const G of T.G) {
        if (G.side !== side || G.g.isCmd || G.g.size >= 3 || G.kind === 'cloud' || !st.paint.lookOf[G.idx]) continue;
        let X0 = Infinity, Y0 = Infinity, X1 = -Infinity, Y1 = -Infinity;
        st.sprites.forEach((sp, i) => { if (!sp) return; const on = vis[i] && T.F[i].g === G.idx; sp.visible = on; if (on) { X0 = Math.min(X0, sp.x - 30); X1 = Math.max(X1, sp.x + 30); Y0 = Math.min(Y0, sp.y - 50); Y1 = Math.max(Y1, sp.y + 12); } });
        if (!isFinite(X0)) continue;
        const W = Math.min(2048, Math.ceil(X1 - X0)), H = Math.min(2048, Math.ceil(Y1 - Y0));
        w.position.set(-X0, -Y0);
        const rt = PIXI.RenderTexture.create({ width: W, height: H, resolution: 1 });
        R.render({ container: this.app.stage, target: rt, clear: true, clearColor: [0, 0, 0, 0] });
        const px = new Uint8Array(W * H * 4);
        R.renderTarget.bind(rt, false); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
        if (R.renderTarget.rootRenderTarget) R.renderTarget.bind(R.renderTarget.rootRenderTarget, false);
        rt.destroy(true);
        // coverage-weighted: a pixel counts by its alpha (the 1 px keyline is half covered at a man of 28 px)
        let nv = 0, ns = 0;
        for (let q = 0; q < px.length; q += 4) {
          const a = px[q + 3];
          if (a < 26) continue;
          nv += a / 255;
          const r = Math.min(255, Math.round(px[q] * 255 / a)), g2 = Math.min(255, Math.round(px[q + 1] * 255 / a)), b = Math.min(255, Math.round(px[q + 2] * 255 / a));
          const o = oklchOf((r << 16) | (g2 << 8) | b);
          const dh = Math.abs(((o.h - c.h + 540) % 360) - 180);
          if (dh <= 20 && o.C >= cmin) ns += a / 255;
        }
        acc.visible += nv; acc.side += ns;
        acc.groups.push({ unit: G.g.unit, share: nv ? +(100 * ns / nv).toFixed(1) : null });
      }
      out.sides[side] = { nation: nat, near: side === B.nearSide, sideLook: st.paint.sideWhich[side], sharePct: acc.visible ? +(100 * acc.side / acc.visible).toFixed(1) : null, groups: acc.groups };
    }
    st.sprites.forEach((sp, i) => { if (sp) sp.visible = vis[i]; });
    hide.forEach((o, i) => (o.visible = hv[i]));
    st.bigs.forEach((bb, i) => (bb.body.root.visible = bigVis[i]));
    w.scale.set(keep.s); w.position.set(keep.x, keep.y);
    st.applyPaintTier(keep.tier);
    this.render(this.t);
    out.ok = Object.values(out.sides).every((s) => s.sharePct !== null && s.sharePct >= 30);
    return out;
  }
  async checks(opts = {}) {
    const report = { figures: PAINT_MODE.on ? 'painted' : 'procedural', battles: [], frameTiming: [] };
    for (const b of DATA) {
      const r = this.checkBattle(b.key);
      r.overlap = this.checkOverlap();
      r.pick = this.checkPick();
      r.colors = this.checkColors(this.B);
      if (this.stage.paint) {
        r.paint = this.checkPaintUse();
        r.faces = this.checkFaceMatch();
        r.variation = this.checkVariation();
        r.sideShare = this.checkSideShare();
        r.deadHandoff = this.checkDeadHandoff ? this.checkDeadHandoff() : { ok: null };
        r.paintBuild = { bakeMs: +this.stage.paint.bakeMs.toFixed(1), decodeMs: +PAINTLIB.loadMs.toFixed(1) };
      }
      report.battles.push(r);
    }
    // the clock: the first frames never ran story time below 0, and a stale timestamp cannot step it back
    {
      const saved = { t: this.t, lastNow: this.lastNow, playing: this.playing };
      this.playing = true; this.t = 1; const now = performance.now(); this.lastNow = now + 4000;
      this.advance(now);
      const stale = this.t;
      this.lastNow = null; this.advance(now); const firstStep = this.t;
      Object.assign(this, saved);
      report.clock = { firstFrames: this.firstFrames.slice(), staleStepT: +stale.toFixed(4), firstStepT: +firstStep.toFixed(4) };
      report.clock.ok = this.firstFrames.every((f) => f.t >= 0) && stale === 1 && firstStep === 1;
    }
    // GPU textures: loading the three battles again leaves the managed texture count where it was
    {
      const r = this.app.renderer, count = () => (r.texture && r.texture.managedTextures ? r.texture.managedTextures.filter(Boolean).length : -1);
      const counts = [];
      for (let round = 0; round < 3; round++) { for (const b of DATA) { this.load(b.key); this.render(1); } counts.push(count()); }
      report.textures = { afterEachRound: counts, ok: counts[1] === counts[0] && counts[2] === counts[0] };
    }
    if (opts.timing !== false) {
      for (const b of DATA) {
        const m0 = (() => { this.load(b.key); return this.moments(); })();
        for (const sp of [1, 4]) report.frameTiming.push({ battle: b.key, ...(await this.measure(b.key, sp, opts.frames || 240, Math.max(3, (m0.clash || 10) - 1))) });
      }
    }
    report.pageErrors = window.__errors.slice();
    report.ok = report.battles.every((x) => !x.figureMismatches.length && !x.cardMismatches.length && x.bodiesOk && x.winnerOk && x.rerunMatches && x.deterministic
      && x.overlap.framesWithOverlap === 0 && x.pick.wrong.length === 0 && x.colors.ok) && report.clock.ok && report.textures.ok && report.pageErrors.length === 0;
    if (PAINT_MODE.on) {
      // the painted checks: met with the art that exists; allPainted says whether every foot troop and commander has art
      report.paintOk = report.battles.every((x) => x.paint && x.paint.ok && x.faces.ok && x.variation.ok && x.sideShare.ok && x.deadHandoff.ok !== false);
      report.allPainted = report.battles.every((x) => x.paint && x.paint.allPainted);
    }
    return report;
  }
}

const GAME = new Game();
window.__battle = {
  ready: GAME.init().then(() => true).catch((e) => { window.__errors.push('init: ' + e.message); throw e; }),
  load: (k) => GAME.load(k),
  seek: (t) => { GAME.playing = false; GAME.seek(t); },
  play: () => { GAME.playing = true; },
  pause: () => { GAME.playing = false; },
  setSpeed: (s) => { GAME.speed = s; },
  moments: () => GAME.moments(),
  hover: (gi, x, y) => { GAME.view.hover = gi; GAME.view.hoverAt = { x, y }; GAME.render(GAME.t); },
  select: (gi) => GAME.select(gi),
  groups: () => GAME.stage.S.groups.map((g) => ({ idx: g.idx, unit: g.unit, side: g.side, start: g.start, big: g.big, cmd: g.isCmd })),
  screenOf: (gi) => { const h = GAME.stage.hull(GAME.stage.T.G[gi], GAME.t); if (!h) return null; const w = GAME.stage.world; return { x: w.position.x + h.X * w.scale.x, y: w.position.y + h.Y * w.scale.y }; },
  checks: (o) => GAME.checks(o),
  /** Re-derives the side cloth variants of a battle by measuring baked figures (slow on a software GPU). */
  lab: (k) => { const B = DATA.find((b) => b.key === k) || DATA[0]; const r = chooseSideLooks(GAME.app.renderer, B); return { key: sideLookKey(B), table: SIDE_LOOK_TABLE[sideLookKey(B)] || null, ...r }; },
  state: () => ({ key: GAME.key, t: GAME.t, duration: GAME.stage.T.duration, speed: GAME.speed, figures: GAME.stage.T.F.length, build: GAME.buildMs }),
  game: GAME,
};
