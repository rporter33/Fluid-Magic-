'use strict';
// The art director's formation test (pilot-review.md). Runs inside a copy of battle-mockup.html on battle c's swamp
// ground, the battle's own figures hidden, like the pilot's pilot_scene.js. Every row compares the pilot's pick as
// the owner was going to see it ('old:') with the review's changes, left to right, and the mockup's procedural
// figure last:
//   far row (front view):  pilot pick | surcoat sheet, rim fix, varied figures | + side keyline | + cloth normalisation | procedural
//   near row (back view):  pilot pick | rim fix, varied figures              | + side keyline | + cloth normalisation | procedural
//   wolves (front view):   pilot probe (magenta key) | blue key, varied | + side keyline | procedural
//   Salamander:            slicer's anchor (tail tip) and round blob shadow | maquette anchor and silhouette shadow, back
//                          view | a man | front view with the snout scar, fixed | procedural; a ring marks where the
//                          battle stands each body (its size-3 footprint, radius 16 wu)
// window.__ad.view(name) sets a camera preset; window.__ad.setTime(t) poses the 'motion' rows at time t (seconds).
(function () {
  const PD = JSON.parse(document.getElementById('ad-data').textContent);
  const loadImg = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
  async function atlas(page) {
    const img = await loadImg(page.png);
    const source = new PIXI.ImageSource({ resource: img, autoGenerateMipmaps: true, scaleMode: 'linear' });
    const out = {};
    for (const [n, f] of Object.entries(page.frames)) {
      out[n] = { tex: new PIXI.Texture({ source, frame: new PIXI.Rectangle(f.frame.x, f.frame.y, f.frame.w, f.frame.h) }), ax: f.anchor.x, ay: f.anchor.y };
    }
    return out;
  }
  async function single(s) {
    const img = await loadImg(s.png);
    const source = new PIXI.ImageSource({ resource: img, autoGenerateMipmaps: true, scaleMode: 'linear' });
    return { tex: new PIXI.Texture({ source }), ax: s.anchor[0] / img.width, ay: s.anchor[1] / img.height };
  }

  async function build() {
    await window.__battle.ready;
    const G = window.__battle.game;
    G.load('c'); G.playing = false; G.seek(0);
    document.getElementById('hud').style.display = 'none';
    const st = G.stage, R = G.app.renderer;
    for (const k of ['units', 'shadows', 'skyShadows', 'behind', 'walkUnits', 'seeThrough', 'proj', 'projShadow', 'fxNormal', 'fxAdd',
      'spellG', 'spellAdd', 'glyphG', 'groundFx', 'wallLayer', 'decalLayer']) if (st[k]) st[k].visible = false;
    const T = { S: {}, H: {} };
    for (const tier of ['S', 'H']) for (const page of PD.atlas[tier]) Object.assign(T[tier], await atlas(page));
    const SAL = { S: {}, H: {} };
    for (const tier of ['S', 'H']) for (const k of Object.keys(PD.salamander[tier])) SAL[tier][k] = await single(PD.salamander[tier][k]);
    const procLooks = bakeFigures(R, [
      { key: 'p.cw', unit: 'cinderWarrior', pal: PALETTES.cinderHorde },
      { key: 'p.wr', unit: 'wolfRider', pal: PALETTES.thornwood },
      { key: 'p.wd', unit: 'warden', pal: PALETTES.thornwood },
    ]);

    const box = st.T.allBox;
    const C = { X: (box.x0 + box.x1) / 2, Y: (box.y0 + box.y1) / 2 };
    const jit = (k) => (u01('ad/' + k) - 0.5) * 2;
    const rows = {}, labels = [], painted = [], sal = [], movers = [];
    function row(name) {
      const shade = new PIXI.Container(), layer = new PIXI.Container(); layer.sortableChildren = true;
      st.world.addChild(shade); st.world.addChild(layer);
      rows[name] = { shade, layer }; return rows[name];
    }
    const gp = (X, Y) => { const q = toGround(C.X + X, C.Y + Y); return { x: q.x, y: q.y }; };
    function blob(r, X, Y, w, h, a) {
      const s = new PIXI.Sprite(st.texShadow); s.anchor.set(0.5); s.position.set(C.X + X + 4, C.Y + Y + 3); s.scale.set(w / 100, h / 100); s.alpha = a; r.shade.addChild(s);
    }
    // one block; opts.tag picks the atlas ('old:', 'paint:', 'sidekl:', 'normkl:'); opts.vary gives each figure its own
    // rest frame (stand or idle2), a scale within +-4% and a brightness within -8%; opts.motion animates it
    function block(r, kind, X, Y, opts) {
      const { files, ranks, sp } = opts;
      const c = gp(X, Y);
      blob(r, X, Y, files * sp[0] * 1.05 + 30, ranks * sp[1] * 0.9 + 30, 0.5);
      for (let k = 0; k < ranks; k++) for (let f = 0; f < files; f++) {
        const id = `${X},${Y},${f},${k}`;
        const x = c.x + (f - (files - 1) / 2) * sp[0] + jit(id + 'x');
        const y = c.y + (k - (ranks - 1) / 2) * sp[1] + jit(id + 'y');
        let s;
        if (kind === 'proc') {
          s = new PIXI.Sprite(procLooks.get(opts.look)[opts.view][FR.idle]);
          s.anchor.set(FIG_ANCHOR.x, FIG_ANCHOR.y); s.scale.set(FIG_SCALE * (opts.flip ? -1 : 1), FIG_SCALE);
        } else {
          s = new PIXI.Sprite(); s.tag = opts.tag; s.base = opts.base; s.rest = 'stand'; s.vs = 1; s.wuPerPxS = 0.5;
          if (opts.vary) {
            s.rest = u01('ad/rest/' + id) < 0.3 && opts.idle2 !== false ? 'idle2' : 'stand';
            s.vs = 0.96 + 0.08 * u01('ad/scale/' + id);
            const b = Math.round(255 * (0.92 + 0.08 * u01('ad/tone/' + id)));
            s.tint = (b << 16) | (b << 8) | b;
          }
          s.frameName = s.tag + s.base + '.' + s.rest;
          if (opts.motion) movers.push({ s, x, y, kind: opts.motion, front: k === (opts.frontRank ?? 0), ph: u01('ad/ph/' + id) });
          painted.push(s);
        }
        s.position.set(sx(x, y), sy(x, y, 0)); s.zIndex = depthKey(x, y);
        r.layer.addChild(s);
      }
    }
    const lab = (rowName, text, X, Y) => { const d = document.createElement('div'); d.className = 'plab'; d.textContent = text; document.body.appendChild(d); labels.push({ d, row: rowName, X: C.X + X, Y: C.Y + Y }); };
    const heavy = [13, 12], wedge = [26, 28.6];
    const ROWY = { wolves: -310, far: -160, near: 0, thorn: 135, sal: 305, mfar: -150, mnear: 40 };
    const COLX = [-540, -270, 0, 270, 540];

    let r = row('far');
    const CW = 'cinderWarrior';
    block(r, 'paint', COLX[0], ROWY.far, { files: 10, ranks: 3, sp: heavy, tag: 'old:', base: CW + '.front' });
    block(r, 'paint', COLX[1], ROWY.far, { files: 10, ranks: 3, sp: heavy, tag: 'paint:', base: CW + '.front', vary: true });
    block(r, 'paint', COLX[2], ROWY.far, { files: 10, ranks: 3, sp: heavy, tag: 'sidekl:', base: CW + '.front', vary: true });
    block(r, 'paint', COLX[3], ROWY.far, { files: 10, ranks: 3, sp: heavy, tag: 'normkl:', base: CW + '.front', vary: true });
    block(r, 'proc', COLX[4], ROWY.far, { files: 10, ranks: 3, sp: heavy, look: 'p.cw', view: 'se', flip: true });
    // Ash Chieftain 06 (the face battle c shows), re-dressed by Nano Banana 2.1 onto the camera-correct troop sheet;
    // a commander stands 1.15x a man (design 3.2), in front of his block's left end
    for (const [i, tag] of [[1, 'cmdpaint:'], [2, 'cmdsidekl:']]) {
      const q = gp(COLX[i] - 80, ROWY.far + 36);
      const s = new PIXI.Sprite(); s.tag = tag; s.base = CW + '.front'; s.rest = 'stand'; s.vs = 1.15; s.wuPerPxS = 0.5;
      s.frameName = tag + CW + '.front.stand'; painted.push(s);
      s.position.set(sx(q.x, q.y), sy(q.x, q.y, 0)); s.zIndex = depthKey(q.x, q.y); r.layer.addChild(s);
      blob(r, COLX[i] - 80, ROWY.far + 36, 34, 18, 0.5);
      lab('far', i === 1 ? 'Ash Chieftain 06' : 'Ash Chieftain 06, side keyline', COLX[i] - 80, ROWY.far + 64);
    }
    r = row('near');
    block(r, 'paint', COLX[0], ROWY.near, { files: 10, ranks: 3, sp: heavy, tag: 'old:', base: CW + '.back' });
    block(r, 'paint', COLX[1], ROWY.near, { files: 10, ranks: 3, sp: heavy, tag: 'paint:', base: CW + '.back', vary: true });
    block(r, 'paint', COLX[2], ROWY.near, { files: 10, ranks: 3, sp: heavy, tag: 'sidekl:', base: CW + '.back', vary: true });
    block(r, 'paint', COLX[3], ROWY.near, { files: 10, ranks: 3, sp: heavy, tag: 'normkl:', base: CW + '.back', vary: true });
    block(r, 'proc', COLX[4], ROWY.near, { files: 10, ranks: 3, sp: heavy, look: 'p.cw', view: 'ne' });
    const TXT = {
      far: ['1. pilot pick, as shown', '2. surcoat sheet, rim fix, varied', '3. + side keyline', '4. + cloth normalisation', 'procedural (mockup)'],
      near: ['1. pilot pick, as shown', '2. rim fix, varied figures', '3. + side keyline', '4. + cloth normalisation', 'procedural (mockup)'],
    };
    for (const rn of ['far', 'near']) TXT[rn].forEach((t, i) => lab(rn, t, COLX[i], ROWY[rn] - 62));

    // the Thornwood Warden, front view: battle c's far side (Nano Banana Pro sheet raw/ad/wd.front.g3pro)
    r = row('thorn');
    const TX = [-405, -135, 135, 405];
    block(r, 'paint', TX[0], ROWY.thorn, { files: 10, ranks: 3, sp: heavy, tag: 'wdpaint:', base: 'warden.front', vary: true });
    block(r, 'paint', TX[1], ROWY.thorn, { files: 10, ranks: 3, sp: heavy, tag: 'wdlpaint:', base: 'warden.front', vary: true });
    block(r, 'paint', TX[2], ROWY.thorn, { files: 10, ranks: 3, sp: heavy, tag: 'wdlsidekl:', base: 'warden.front', vary: true });
    block(r, 'proc', TX[3], ROWY.thorn, { files: 10, ranks: 3, sp: heavy, look: 'p.wd', view: 'se', flip: true });
    ['Warden (Thornwood), as painted', 'cloth hue lock', 'hue lock + side keyline', 'procedural (mockup)'].forEach((t, i) => lab('thorn', t, TX[i], ROWY.thorn - 62));

    r = row('wolves');
    const WX = [-405, -135, 135, 405];
    block(r, 'paint', WX[0], ROWY.wolves, { files: 4, ranks: 3, sp: wedge, tag: 'old:', base: 'wolfRider.front' });
    block(r, 'paint', WX[1], ROWY.wolves, { files: 4, ranks: 3, sp: wedge, tag: 'paint:', base: 'wolfRider.front', vary: true, idle2: false });
    block(r, 'paint', WX[2], ROWY.wolves, { files: 4, ranks: 3, sp: wedge, tag: 'sidekl:', base: 'wolfRider.front', vary: true, idle2: false });
    block(r, 'proc', WX[3], ROWY.wolves, { files: 4, ranks: 3, sp: wedge, look: 'p.wr', view: 'se', flip: true });
    ['pilot probe, magenta key', 'blue key, varied', '+ side keyline', 'procedural (mockup)'].forEach((t, i) => lab('wolves', t, WX[i], ROWY.wolves - 80));

    // the Salamander: each body stands on the ground point the battle gives it (ring), drawn with its anchor
    r = row('sal');
    const ring = (X, Y) => {
      const q = gp(X, Y), g = new PIXI.Graphics();
      g.ellipse(0, 0, 16, 16 * SP).stroke({ color: 0xf3eee4, width: 1.2, alpha: 0.9 });
      g.moveTo(-4, 0).lineTo(4, 0).moveTo(0, -3).lineTo(0, 3).stroke({ color: 0xf3eee4, width: 1, alpha: 0.9 });
      g.position.set(sx(q.x, q.y), sy(q.x, q.y, 0)); r.layer.addChild(g); g.zIndex = 1e9;
    };
    function salBody(key, X, Y, shadowKind) {
      const q = gp(X, Y);
      const s = new PIXI.Sprite(); s.salKey = key; s.position.set(sx(q.x, q.y), sy(q.x, q.y, 0)); s.zIndex = depthKey(q.x, q.y);
      r.layer.addChild(s); sal.push(s);
      if (shadowKind === 'blob') blob(r, X + 8, Y - 4, 120, 70, 0.55);
      else {
        // the silhouette shadow: the cutout itself, black, soft, nudged away from the sun (upper left) and pressed
        // a little toward its ground anchor; for a low body its silhouette from this camera is close to its footprint
        const sh = new PIXI.Sprite(); sh.salKey = key; sh.isShadow = true; sh.tint = 0x000000; sh.alpha = 0.42;
        sh.filters = [new PIXI.BlurFilter({ strength: 5, quality: 3 })];
        sh.position.set(sx(q.x, q.y) + 5, sy(q.x, q.y, 0) + 4); r.shade.addChild(sh); sal.push(sh);
      }
      ring(X, Y);
    }
    const SX = { backOld: -470, backFix: -200, man: -75, frontFix: 90, proc: 400 };
    salBody('backOld', SX.backOld, ROWY.sal, 'blob');
    salBody('backFix', SX.backFix, ROWY.sal, 'sil');
    salBody('frontFix', SX.frontFix, ROWY.sal, 'sil');
    {
      const body = makeBigBody('salamander', PALETTES.cinderHorde);
      body.pose({ t: 0.6, h: 0, flying: false, act: null, k: 0, moving: false, dead: false, deadK: 0 });
      body.root.position.set(C.X + SX.proc, C.Y + ROWY.sal); r.layer.addChild(body.root);
      blob(r, SX.proc, ROWY.sal - 2, 160, 40, 0.5);
    }
    {
      const q = gp(SX.man, ROWY.sal); const s = new PIXI.Sprite(); s.tag = 'paint:'; s.frameName = 'paint:cinderWarrior.back.stand'; s.wuPerPxS = 0.5; s.vs = 1; painted.push(s);
      s.position.set(sx(q.x, q.y), sy(q.x, q.y, 0)); s.zIndex = depthKey(q.x, q.y); r.layer.addChild(s);
    }
    lab('sal', 'pilot: slicer anchor (tail tip), round shadow', SX.backOld, ROWY.sal - 118);
    lab('sal', 'fixed: maquette anchor, silhouette shadow', SX.backFix, ROWY.sal - 118);
    lab('sal', 'a man', SX.man, ROWY.sal - 36);
    lab('sal', 'front view, snout scar, fixed', SX.frontFix, ROWY.sal - 100);
    lab('sal', 'procedural (mockup)', SX.proc, ROWY.sal - 75);
    lab('sal', 'rings: where the battle stands each body', -190, ROWY.sal + 70);

    // motion rows: painted key poses driven by time (march in place for the near side, a strike loop for the far
    // side's front rank), with a bob and a lunge; frame phases differ per figure
    r = row('mfar');
    block(r, 'paint', 120, ROWY.mfar, { files: 10, ranks: 3, sp: heavy, tag: 'sidekl:', base: CW + '.front', vary: true, motion: 'attack', frontRank: 0 });
    r = row('mnear');
    block(r, 'paint', -120, ROWY.mnear, { files: 10, ranks: 3, sp: heavy, tag: 'sidekl:', base: CW + '.back', vary: true, motion: 'march' });
    lab('mfar', 'far side: front rank strikes (windup, strike, follow), the rest at rest', 120, ROWY.mfar - 62);
    lab('mnear', 'near side: march cycle in place (marchA, pass, marchB, pass) with a bob', -120, ROWY.mnear + 52);

    let tier = 'S';
    function setTier(t) {
      tier = t;
      for (const s of painted) {
        const use = T[tier][s.frameName];
        if (!use) throw new Error('missing frame ' + s.frameName);
        s.texture = use.tex; s.anchor.set(use.ax, use.ay);
        const k = s.wuPerPxS * (tier === 'S' ? 1 : 0.5) * s.vs; s.scale.set(k);
      }
      for (const s of sal) {
        const f = SAL[tier][s.salKey];
        s.texture = f.tex; s.anchor.set(f.ax, f.ay);
        const k = 0.5 * (tier === 'S' ? 1 : 0.5);
        s.scale.set(k, s.isShadow ? k * 0.9 : k);
      }
    }
    function setTime(t) {
      for (const m of movers) {
        const s = m.s;
        let name = s.rest, dy = 0, lift = 0;
        if (m.kind === 'march') {
          const P = 0.9, u = ((t / P + m.ph * 0.25) % 1 + 1) % 1, q = Math.floor(u * 4);
          name = ['marchA', 'stand', 'marchB', 'stand'][q];
          lift = q % 2 === 1 ? 0.7 : 0;
        } else if (m.front) {
          const P = 1.8, u = ((t / P + m.ph) % 1 + 1) % 1;
          name = u < 0.28 ? 'windup' : u < 0.40 ? 'strike' : u < 0.58 ? 'follow' : s.rest;
          dy = u >= 0.28 && u < 0.40 ? -2.5 : u >= 0.40 && u < 0.58 ? -1.5 : 0; // the far side lunges toward -y
        }
        s.frameName = s.tag + s.base + '.' + name;
        const use = T[tier][s.frameName];
        s.texture = use.tex; s.anchor.set(use.ax, use.ay);
        s.position.set(sx(m.x, m.y + dy), sy(m.x, m.y + dy, lift));
      }
      G.render(G.t);
    }
    let live = false, t0 = 0;
    G.app.ticker.add(() => { if (live) setTime((performance.now() - t0) / 1000); });

    const css = document.createElement('style');
    css.textContent = '.plab{position:fixed;transform:translate(-50%,-100%);font:600 12px/1.2 system-ui,sans-serif;color:#f3eee4;' +
      'background:rgba(20,18,15,.72);padding:3px 7px;border-radius:4px;white-space:nowrap;pointer-events:none;z-index:20}' +
      '#pcard{position:fixed;left:24px;bottom:24px;width:150px;background:#1c1a17;border:1px solid #5a5248;border-radius:6px;padding:8px;z-index:20;' +
      'font:600 12px/1.3 system-ui,sans-serif;color:#e8e2d6;display:none}#pcard img{display:block;width:134px;height:134px;border-radius:3px}' +
      '#ptitle{position:fixed;right:24px;bottom:18px;font:700 15px/1.3 system-ui,sans-serif;color:#f3eee4;background:rgba(20,18,15,.8);padding:6px 10px;border-radius:5px;z-index:20}';
    document.head.appendChild(css);
    const card = document.createElement('div'); card.id = 'pcard';
    card.innerHTML = '<img alt="Salamander card portrait"><div style="margin-top:6px">Salamander, face 01<br><span style="font-weight:400;color:#b9b0a2">its card portrait (approved)</span></div>';
    card.querySelector('img').src = PD.portrait; document.body.appendChild(card);
    const CARDS = { sal: [PD.portrait, 'Salamander, face 01'], chief: [PD.portraitChief, 'Ash Chieftain, face 06'] };
    const title = document.createElement('div'); title.id = 'ptitle'; document.body.appendChild(title);

    const STATIC = ['wolves', 'far', 'near', 'thorn', 'sal'];
    const PRESETS = {
      overview: { X: 0, Y: -5, f: 28, rows: STATIC, title: 'Play zoom (a man 28 px): the pilot\'s picks (left) against the review\'s changes, on battle c\'s ground' },
      'close-near': { X: -405, Y: ROWY.near - 20, f: 72, rows: ['near'], title: 'Closest zoom, 72 px, back view: pilot pick (left) against rim fix and varied figures (right)' },
      'close-near-kl': { X: 135, Y: ROWY.near - 20, f: 72, rows: ['near'], title: 'Closest zoom, 72 px, back view: side keyline (left) and with cloth normalisation (right)' },
      'close-far': { X: -405, Y: ROWY.far - 20, f: 72, rows: ['far'], title: 'Closest zoom, 72 px, front view: pilot pick (left) against the surcoat sheet, rim fix, varied (right)' },
      'close-cmd': { X: -330, Y: ROWY.far + 10, f: 72, rows: ['far'], card: 'chief', title: 'Closest zoom, 72 px: Ash Chieftain 06 re-dressed onto the troop sheet, beside his card portrait' },
      'close-far-kl': { X: 135, Y: ROWY.far - 20, f: 72, rows: ['far'], title: 'Closest zoom, 72 px, front view: side keyline (left) and with cloth normalisation (right)' },
      'close-thorn': { X: -270, Y: ROWY.thorn - 20, f: 72, rows: ['thorn'], title: 'Closest zoom, 72 px: the Thornwood Warden, as painted (left) and with the cloth hue lock (right)' },
      'close-thorn-kl': { X: 270, Y: ROWY.thorn - 20, f: 72, rows: ['thorn'], title: 'Closest zoom, 72 px: the Warden with hue lock and side keyline (left) against the procedural figure (right)' },
      'close-wolves': { X: -270, Y: ROWY.wolves - 25, f: 72, rows: ['wolves'], title: 'Closest zoom, 72 px: Wolf Rider probe, magenta key (left) against the blue key (right)' },
      'close-sal': { X: -330, Y: ROWY.sal - 45, f: 72, rows: ['sal'], title: 'Closest zoom, 72 px: the battle c Salamander, the pilot\'s anchor (left) against the maquette anchor (right)' },
      'close-sal-front': { X: 40, Y: ROWY.sal - 45, f: 72, rows: ['sal'], card: true, title: 'Closest zoom, 72 px: the front view with the snout scar beside its card portrait' },
      'play-sal': { X: -120, Y: ROWY.sal - 60, f: 28, rows: ['sal', 'near'], card: true, title: 'Play zoom, 28 px: the Salamander, fixed, beside the near side' },
      motion: { X: 0, Y: -55, f: 72, rows: ['mfar', 'mnear'], title: 'Motion from painted key poses (closest zoom): far side striking, near side marching' },
    };
    function view(name, opts) {
      const pr = PRESETS[name];
      G.follow = false; G.user = { cx: C.X + pr.X, cy: C.Y + pr.Y, z: pr.f / 28 };
      setTier(pr.f <= 48 ? 'S' : 'H');
      for (const [n, rw] of Object.entries(rows)) { const on = pr.rows.includes(n); rw.layer.visible = on; rw.shade.visible = on; }
      card.style.display = pr.card ? 'block' : 'none';
      if (pr.card) { const [src, nm] = CARDS[pr.card === true ? 'sal' : pr.card]; card.querySelector('img').src = src; card.querySelector('div').firstChild.textContent = nm; }
      title.textContent = pr.title;
      live = name === 'motion' && !(opts && opts.still); t0 = performance.now();
      if (name === 'motion') setTime(0); else G.render(G.t);
      const w = st.world;
      for (const l of labels) {
        l.d.style.display = pr.rows.includes(l.row) ? 'block' : 'none';
        l.d.style.left = (w.position.x + l.X * w.scale.x) + 'px'; l.d.style.top = (w.position.y + l.Y * w.scale.y) + 'px';
      }
      return { name, f: pr.f, tier: pr.f <= 48 ? 'S' : 'H' };
    }
    view('overview');
    return { view, setTime, presets: Object.keys(PRESETS), anchors: PD.anchors };
  }
  window.__ad = { ready: build().catch((e) => { (window.__errors = window.__errors || []).push('ad: ' + e.message + ' ' + e.stack); throw e; }) };
})();
