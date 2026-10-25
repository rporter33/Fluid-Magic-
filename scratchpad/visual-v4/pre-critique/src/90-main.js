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
    this.frameLog = [];
    this.buildTransport(); this.buildPicker(); this.buildCamCtl(); this.buildMenu(); this.bindInput();
    const q = new URLSearchParams(location.search);
    this.load(q.get('b') || DATA[0].key);
    if (q.get('t')) this.seek(+q.get('t'));
    if (q.get('paused')) this.playing = false;
    document.getElementById('loading').remove();
    this.lastNow = performance.now();
    requestAnimationFrame((n) => this.loop(n));
    window.addEventListener('resize', () => { if (this.stage) this.cam = buildCameraKeys(this.stage.T, window.innerWidth, window.innerHeight); });
  }

  load(key) {
    const B = DATA.find((b) => b.key === key) || DATA[0];
    if (this.stage) { this.app.stage.removeChild(this.stage.stage); this.stage.stage.destroy({ children: true }); }
    const t0 = performance.now();
    const S = buildScript(B), L = layoutBattle(S), T = buildTimeline(S, L);
    const t1 = performance.now();
    this.stage = new BattleStage(this.app, S, L, T);
    this.buildMs = { script: +(t1 - t0).toFixed(1), stage: +(performance.now() - t1).toFixed(1), bake: +this.stage.bakeMs.toFixed(1) };
    this.app.stage.addChild(this.stage.stage);
    this.cam = buildCameraKeys(T, window.innerWidth, window.innerHeight);
    this.key = B.key; this.B = B;
    this.view.hover = null; this.view.selected = null;
    this.follow = true; this.user = null;
    this.hud.build(this.stage);
    document.querySelectorAll('#picker button').forEach((b) => b.classList.toggle('on', b.dataset.k === B.key));
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

  loop(now) {
    const dt = Math.min(0.1, (now - this.lastNow) / 1000);
    this.lastNow = now;
    if (this.playing && this.stage) {
      this.t += dt * this.rate(this.t);
      if (this.t >= this.stage.T.duration) { this.t = this.stage.T.duration; this.playing = false; }
    }
    if (this.keysDown && this.keysDown.size) this.keyPan(dt);
    this.render(this.t);
    this.syncTransport();
    requestAnimationFrame((n) => this.loop(n));
  }

  render(t) {
    const a = performance.now();
    this.stage.frame(t, this.speed, this.view);
    this.applyCamera(t);
    const b = performance.now();
    this.hud.update(t);
    this.app.renderer.render(this.app.stage);
    const c = performance.now();
    if (this.measuring) this.measuring.push({ update: b - a, hud: 0, render: c - b, total: c - a, now: c });
  }

  camera(t) {
    if (!this.follow && this.user) return this.user;
    return cameraAt(this.cam, t, this.reduced);
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

  // ---- picking (design 11.1): big bodies, commanders, block hulls ----
  pick(px, py) {
    const st = this.stage, T = st.T, t = this.t;
    const w = st.world;
    const X = (px - w.position.x) / w.scale.x, Y = (py - w.position.y) / w.scale.y;
    for (const bb of st.bigs) {
      if (!bb.body.root.visible) continue;
      const b = bb.body.root.getBounds();
      if (px >= b.minX && px <= b.maxX && py >= b.minY && py <= b.maxY) return bb.G.idx;
    }
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
    document.getElementById('bSpeed').onclick = (e) => this.stepSpeed(e.shiftKey ? -1 : 1);
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
  buildPicker() {
    const p = document.getElementById('picker');
    p.innerHTML = '<span class="tag">Mockup battles</span>' + DATA.map((b) => `<button data-k="${b.key}">${b.title}</button>`).join('');
    p.querySelectorAll('button').forEach((b) => (b.onclick = () => this.load(b.dataset.k)));
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
    const items = [['Restart', 'Home', () => this.seek(0, true)], ['Log', 'L', () => document.getElementById('log').classList.toggle('show')],
      ['Enemy strip', ']', () => document.getElementById('enemy').classList.toggle('collapsed')], ['Hide the HUD', 'H', () => document.getElementById('hud').classList.toggle('hidden')],
      ['Follow the action', 'Z', () => { this.follow = true; this.user = null; }], ['Reduced motion', '', () => { this.reduced = !this.reduced; }]];
    m.innerHTML = '';
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
      this.stage.frame(t, speed, this.view); this.applyCamera(t); this.hud.update(t);
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
  async checks(opts = {}) {
    const report = { battles: [], frameTiming: [] };
    for (const b of DATA) report.battles.push(this.checkBattle(b.key));
    if (opts.timing !== false) {
      for (const b of DATA) {
        const m0 = (() => { this.load(b.key); return this.moments(); })();
        for (const sp of [1, 4]) report.frameTiming.push({ battle: b.key, ...(await this.measure(b.key, sp, opts.frames || 240, Math.max(3, (m0.clash || 10) - 1))) });
      }
    }
    report.pageErrors = window.__errors.slice();
    report.ok = report.battles.every((x) => !x.figureMismatches.length && !x.cardMismatches.length && x.bodiesOk && x.winnerOk && x.rerunMatches && x.deterministic) && report.pageErrors.length === 0;
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
  state: () => ({ key: GAME.key, t: GAME.t, duration: GAME.stage.T.duration, speed: GAME.speed, figures: GAME.stage.T.F.length, build: GAME.buildMs }),
  game: GAME,
};
