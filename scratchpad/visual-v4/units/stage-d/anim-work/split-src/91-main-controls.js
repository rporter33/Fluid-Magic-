'use strict';
// ---- Game, part 2: the transport, the battle picker, the figures and Wolf Rider controls, the menu, input ----
// Split from 90-main.js for size (stage D animation part); behaviour unchanged.

Object.assign(Game.prototype, {
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
  },
  syncTransport() {
    const k = (this.playing ? 1 : 0) + '/' + this.speed + '/' + this.beats + '/' + this.follow;
    if (this._tk === k) return;
    this._tk = k;
    document.getElementById('bPlay').innerHTML = this.playing ? ICON.pause : ICON.play;
    document.getElementById('bSpeed').textContent = this.speed + 'x';
    document.getElementById('bBeats').classList.toggle('on', this.beats);
    document.getElementById('bFollow').classList.toggle('on', this.follow);
  },
  togglePlay() { if (this.t >= this.stage.T.duration) this.seek(0); this.playing = !this.playing; },
  stepSpeed(d) { const i = clamp(SPEEDS.indexOf(this.speed) + d, 0, SPEEDS.length - 1); this.speed = SPEEDS[i]; },
  cycleSpeed(d) { const n = SPEEDS.length; this.speed = SPEEDS[(SPEEDS.indexOf(this.speed) + d + n) % n]; },
  buildPicker() {
    const p = document.getElementById('picker');
    p.innerHTML = '<span class="tag">Mockup battles</span>' + DATA.map((b) => `<button data-k="${b.key}">${b.title}</button>`).join('');
    p.querySelectorAll('button').forEach((b) => (b.onclick = () => this.load(b.dataset.k)));
  },
  /** The figures control: Painted (default) or Procedural; switching keeps the story time and the camera. */
  buildFigs() {
    const box = document.getElementById('figs');
    if (!box) return;
    const has = !!(PAINTLIB && PAINTLIB.ready);
    box.innerHTML = '<span class="tag">Figures</span>' + [['painted', 'Painted'], ['procedural', 'Procedural']]
      .map(([k, l]) => `<button data-f="${k}"${k === 'painted' && !has ? ' disabled' : ''}>${l}</button>`).join('');
    box.querySelectorAll('button').forEach((b) => (b.onclick = () => this.setFigures(b.dataset.f)));
    this.syncFigs();
    this.buildWr();
  },
  syncFigs() {
    const on = PAINT_MODE.on ? 'painted' : 'procedural';
    document.querySelectorAll('#figs button, #menu .figpick').forEach((b) => b.classList.toggle('on', b.dataset.f === on));
  },
  /**
   * The Wolf Rider's front for the owner to compare (stage C, owner review 2): the owner-kept test or the War Wolf A
   * harness edit (the default). Shown in Painted mode for a battle with Wolf Riders; it swaps that frame set only.
   */
  buildWr() {
    const box = document.getElementById('wrfront');
    if (!box) return;
    box.innerHTML = '<span class="tag">Wolf Rider front</span>' + [['kept', 'Kept test'], ['harness', 'War Wolf harness']]
      .map(([k, l]) => `<button data-w="${k}" aria-pressed="false">${l}</button>`).join('');
    box.querySelectorAll('button').forEach((b) => (b.onclick = () => this.setWolfFront(b.dataset.w)));
  },
  syncWr() {
    const box = document.getElementById('wrfront');
    // stage C fix 11: only where a Wolf Rider shows its front: a far-side group (T.G.s > 0), or one with a routing figure
    // (a near-side router turns and shows its front); a battle whose Wolf Riders all stand on the near side hides it
    const st = this.stage;
    const has = !!(st && st.paint && st.S.groups.some((g) => st.paint.lookOf[g.idx] === 'wolfRider'
      && (st.T.G[g.idx].s > 0 || st.T.G[g.idx].figs.some((fi) => !!st.T.F[fi].rout))));
    if (box) box.hidden = !has;
    document.querySelectorAll('#menu .wrpick').forEach((b) => (b.style.display = has ? '' : 'none'));
    document.querySelectorAll('#wrfront button, #menu .wrpick').forEach((b) => { const on = b.dataset.w === PAINT_ALT.wolfRider; b.classList.toggle('on', on); if (b.tagName === 'BUTTON' && b.dataset.w) b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
  },
  setWolfFront(which) {
    if (which !== 'kept' && which !== 'harness') return;
    PAINT_ALT.wolfRider = which;
    if (this.stage && this.stage.paint) this.stage.refreshLook('wolfRider');
    this.invalidate();
    this.syncWr();
  },
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
  },
  buildCamCtl() {
    const c = document.getElementById('camctl');
    c.innerHTML = `<button class="btn" id="bFollow" title="Follow the action (Z)">${ICON.follow}</button><button class="btn" id="bZoomOut" title="Zoom out">−</button><button class="btn" id="bZoomIn" title="Zoom in">+</button>`;
    document.getElementById('bFollow').onclick = () => { this.follow = true; this.user = null; };
    document.getElementById('bZoomOut').onclick = () => this.zoomBy(1 / 1.2, window.innerWidth / 2, window.innerHeight / 2);
    document.getElementById('bZoomIn').onclick = () => this.zoomBy(1.2, window.innerWidth / 2, window.innerHeight / 2);
  },
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
    for (const [k, l] of [['kept', 'Wolf Rider front: kept test'], ['harness', 'Wolf Rider front: War Wolf harness']]) {
      const it = el('button', 'pick wrpick', `<span>${l}</span><kbd></kbd>`);
      it.dataset.w = k;
      it.onclick = () => { this.setWolfFront(k); m.classList.remove('show'); };
      m.appendChild(it);
    }
    m.appendChild(el('div', 'sep'));
    const items = [['Restart', 'Home', () => this.seek(0, true)], ['Log', 'L', () => document.getElementById('log').classList.toggle('show')],
      ['Enemy strip', ']', () => document.getElementById('enemy').classList.toggle('collapsed')], ['Hide the HUD', 'H', () => document.getElementById('hud').classList.toggle('hidden')],
      ['Follow the action', 'Z', () => { this.follow = true; this.user = null; }], ['Reduced motion', '', () => { this.reduced = !this.reduced; this.reducedSet = true; }]];
    for (const [label, key, fn] of items) {
      const b = el('button', '', `<span>${label}</span><kbd>${key}</kbd>`);
      b.onclick = () => { fn(); m.classList.remove('show'); };
      m.appendChild(b);
    }
  },
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
  },
  clampUser() {
    const c = this.user, b = this.stage.T.allBox;
    c.cx = clamp(c.cx, b.x0, b.x1); c.cy = clamp(c.cy, b.y0, b.y1);
  },
  keyPan(dt) {
    let dx = 0, dy = 0;
    if (this.keysDown.has('a')) dx -= 1; if (this.keysDown.has('d')) dx += 1;
    if (this.keysDown.has('w')) dy -= 1; if (this.keysDown.has('s') && !this.sIsSkip) dy += 1;
    if (!dx && !dy) return;
    this.userFromCurrent();
    this.user.cx += dx * dt * 600 / this.user.z; this.user.cy += dy * dt * 600 / this.user.z;
    this.clampUser();
  },
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
  },
});
