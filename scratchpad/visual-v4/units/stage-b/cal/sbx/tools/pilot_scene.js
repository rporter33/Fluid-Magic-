'use strict';
// The pilot's formation test (stage A, no animation): runs inside a copy of battle-mockup.html, on battle c's own
// swamp ground, with the battle's figures hidden. Painted blocks (as generated, and with pack.py's cloth
// normalisation) stand beside the mockup's procedural figures, drawn by its own bakeFigures and makeBigBody.
// Rows are placed by screen position (one comparison per row); a block inside a row keeps the game's ground grid.
// window.__pilot.view(name) sets a camera preset: overview (f = 28 px, play zoom), close-* (f = 72 px, the player's
// closest zoom), look40-* (f = 40 px). Tier S frames serve f <= 48 px, tier H above (art plan 8.4).
(function () {
  const PD = JSON.parse(document.getElementById('pilot-data').textContent);
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
    for (const tier of ['S', 'H']) for (const v of ['back', 'front']) SAL[tier][v] = await single(PD.salamander[tier][v]);
    const procLooks = bakeFigures(R, [
      { key: 'p.cw', unit: 'cinderWarrior', pal: PALETTES.cinderHorde },
      { key: 'p.wr', unit: 'wolfRider', pal: PALETTES.thornwood },
    ]);

    // the scene's centre: the battle's own field centre, in the screen plane
    const box = st.T.allBox;
    const C = { X: (box.x0 + box.x1) / 2, Y: (box.y0 + box.y1) / 2 };
    const g0 = toGround(C.X, C.Y);
    const jit = (k) => (u01('pilot/' + k) - 0.5) * 2; // deterministic, the same for painted and procedural
    const rows = {}, labels = [], painted = [], sal = [];
    function row(name) {
      const shade = new PIXI.Container(), layer = new PIXI.Container(); layer.sortableChildren = true;
      st.world.addChild(shade); st.world.addChild(layer);
      rows[name] = { shade, layer }; return rows[name];
    }
    // ground point of a screen offset (X, Y) from the centre
    const gp = (X, Y) => { const q = toGround(C.X + X, C.Y + Y); return { x: q.x, y: q.y }; };
    function shadow(r, X, Y, w, h, a) {
      const s = new PIXI.Sprite(st.texShadow); s.anchor.set(0.5); s.position.set(C.X + X + 4, C.Y + Y + 3); s.scale.set(w / 100, h / 100); s.alpha = a; r.shade.addChild(s);
    }
    function block(r, kind, X, Y, opts) {
      const { files, ranks, sp } = opts;
      const c = gp(X, Y);
      shadow(r, X, Y, files * sp[0] * 1.05 + 30, ranks * sp[1] * 0.9 + 30, 0.5);
      for (let k = 0; k < ranks; k++) for (let f = 0; f < files; f++) {
        const x = c.x + (f - (files - 1) / 2) * sp[0] + jit(`${X},${Y},${f},${k},x`);
        const y = c.y + (k - (ranks - 1) / 2) * sp[1] + jit(`${X},${Y},${f},${k},y`);
        let s;
        if (kind === 'proc') {
          s = new PIXI.Sprite(procLooks.get(opts.look)[opts.view][FR.idle]);
          s.anchor.set(FIG_ANCHOR.x, FIG_ANCHOR.y); s.scale.set(FIG_SCALE * (opts.flip ? -1 : 1), FIG_SCALE);
        } else {
          s = new PIXI.Sprite(); s.frameName = opts.frame; s.wuPerPxS = 0.5; painted.push(s);
        }
        s.position.set(sx(x, y), sy(x, y, 0)); s.zIndex = depthKey(x, y);
        r.layer.addChild(s);
      }
    }
    const lab = (rowName, text, X, Y) => { const d = document.createElement('div'); d.className = 'plab'; d.textContent = text; document.body.appendChild(d); labels.push({ d, row: rowName, X: C.X + X, Y: C.Y + Y }); };
    const heavy = [13, 12], wedge = [26, 28.6];
    const ROWY = { wolves: -330, far: -140, near: 60, sal: 300 };
    const COLX = [-245, 0, 245];
    // far side, the front view (facing down-left)
    let r = row('far');
    block(r, 'paint', COLX[0], ROWY.far, { files: 10, ranks: 3, sp: heavy, frame: 'cinderWarrior.front.stand' });
    block(r, 'paint', COLX[1], ROWY.far, { files: 10, ranks: 3, sp: heavy, frame: 'boost:cinderWarrior.front.stand' });
    block(r, 'proc', COLX[2], ROWY.far, { files: 10, ranks: 3, sp: heavy, look: 'p.cw', view: 'se', flip: true });
    // near side, the back view (facing up-right)
    r = row('near');
    block(r, 'paint', COLX[0], ROWY.near, { files: 10, ranks: 3, sp: heavy, frame: 'cinderWarrior.back.stand' });
    block(r, 'paint', COLX[1], ROWY.near, { files: 10, ranks: 3, sp: heavy, frame: 'boost:cinderWarrior.back.stand' });
    block(r, 'proc', COLX[2], ROWY.near, { files: 10, ranks: 3, sp: heavy, look: 'p.cw', view: 'ne' });
    for (const rn of ['far', 'near']) {
      const v = rn === 'far' ? 'front view' : 'back view';
      lab(rn, `painted, as generated (${v})`, COLX[0], ROWY[rn] - 62); lab(rn, 'painted + cloth normalisation', COLX[1], ROWY[rn] - 62);
      lab(rn, 'procedural (current mockup)', COLX[2], ROWY[rn] - 62);
    }
    // wolf riders, far side: 12 each (4 files x 3 ranks at the wedge spacing)
    r = row('wolves');
    block(r, 'paint', -150, ROWY.wolves, { files: 4, ranks: 3, sp: wedge, frame: 'wolfRider.front.stand' });
    block(r, 'proc', 150, ROWY.wolves, { files: 4, ranks: 3, sp: wedge, look: 'p.wr', view: 'se', flip: true });
    lab('wolves', 'painted Wolf Riders (pipeline probe, front view)', -150, ROWY.wolves - 80); lab('wolves', 'procedural Wolf Riders', 150, ROWY.wolves - 80);
    // the Salamander (face 01, battle c), standing at its true size against the men (pilot_page.py)
    r = row('sal');
    for (const [v, X] of [['back', -230], ['front', -60]]) {
      const s = new PIXI.Sprite(); s.salView = v; s.position.set(C.X + X, C.Y + ROWY.sal); r.layer.addChild(s); sal.push(s);
      shadow(r, X + 8, ROWY.sal - 4, 120, 70, 0.55);
    }
    {
      const body = makeBigBody('salamander', PALETTES.cinderHorde);
      body.pose({ t: 0.6, h: 0, flying: false, act: null, k: 0, moving: false, dead: false, deadK: 0 });
      body.root.position.set(C.X + 190, C.Y + ROWY.sal); r.layer.addChild(body.root);
      shadow(r, 190, ROWY.sal - 2, 160, 40, 0.5);
    }
    // a man of the near block for scale, beside the painted Salamander
    {
      const q = gp(-125, ROWY.sal); const s = new PIXI.Sprite(); s.frameName = 'cinderWarrior.back.stand'; s.wuPerPxS = 0.5; painted.push(s);
      s.position.set(sx(q.x, q.y), sy(q.x, q.y, 0)); r.layer.addChild(s);
    }
    lab('sal', 'painted Salamander, back view (battle c)', -230, ROWY.sal - 112); lab('sal', 'painted, front view', -60, ROWY.sal - 92);
    lab('sal', 'procedural Salamander', 190, ROWY.sal - 75); lab('sal', 'a man', -125, ROWY.sal - 34);

    function setTier(tier) {
      for (const s of painted) {
        const use = T[tier][s.frameName]; // the cloth-normalised frames carry a 'boost:' prefix (pilot_page.py)
        s.texture = use.tex; s.anchor.set(use.ax, use.ay);
        const k = s.wuPerPxS * (tier === 'S' ? 1 : 0.5); s.scale.set(k);
      }
      for (const s of sal) {
        const f = SAL[tier][s.salView];
        s.texture = f.tex; s.anchor.set(f.ax, f.ay); s.scale.set(0.5 * (tier === 'S' ? 1 : 0.5));
      }
    }
    const css = document.createElement('style');
    css.textContent = '.plab{position:fixed;transform:translate(-50%,-100%);font:600 13px/1.2 system-ui,sans-serif;color:#f3eee4;' +
      'background:rgba(20,18,15,.72);padding:3px 7px;border-radius:4px;white-space:nowrap;pointer-events:none;z-index:20}' +
      '#pcard{position:fixed;left:24px;bottom:24px;width:150px;background:#1c1a17;border:1px solid #5a5248;border-radius:6px;padding:8px;z-index:20;' +
      'font:600 12px/1.3 system-ui,sans-serif;color:#e8e2d6;display:none}#pcard img{display:block;width:134px;height:134px;border-radius:3px}' +
      '#ptitle{position:fixed;left:24px;top:18px;font:700 15px/1.3 system-ui,sans-serif;color:#f3eee4;background:rgba(20,18,15,.8);padding:6px 10px;border-radius:5px;z-index:20}';
    document.head.appendChild(css);
    const card = document.createElement('div'); card.id = 'pcard';
    card.innerHTML = '<img alt="Salamander card portrait"><div style="margin-top:6px">Salamander, face 01<br><span style="font-weight:400;color:#b9b0a2">its card portrait (approved)</span></div>';
    card.querySelector('img').src = PD.portrait; document.body.appendChild(card);
    const title = document.createElement('div'); title.id = 'ptitle'; document.body.appendChild(title);

    const ALL = ['wolves', 'far', 'near', 'sal'];
    const PRESETS = {
      overview: { X: 0, Y: -10, f: 28, rows: ALL, title: 'Play zoom, a man 28 px tall: painted and procedural on battle c\'s ground (Wickemoss)' },
      'close-near': { X: 0, Y: ROWY.near - 20, f: 72, rows: ['near'], title: 'Closest zoom, 72 px: near side, back view' },
      'close-far': { X: 0, Y: ROWY.far - 20, f: 72, rows: ['far'], title: 'Closest zoom, 72 px: far side, front view' },
      'close-wolves': { X: 0, Y: ROWY.wolves - 25, f: 72, rows: ['wolves'], title: 'Closest zoom, 72 px: Wolf Riders, front view' },
      'close-sal': { X: -20, Y: ROWY.sal - 45, f: 72, rows: ['sal'], card: true, title: 'Closest zoom, 72 px: the Salamander beside its card portrait' },
      'play-sal': { X: -20, Y: ROWY.sal - 60, f: 28, rows: ['sal', 'near'], card: true, title: 'Play zoom, 28 px: the Salamander beside its card portrait' },
      'look40-near': { X: 0, Y: ROWY.near - 20, f: 40, rows: ['near'], title: 'A man 40 px tall: near side, back view' },
      'look40-far': { X: 0, Y: ROWY.far - 20, f: 40, rows: ['far'], title: 'A man 40 px tall: far side, front view' },
    };
    function view(name) {
      const pr = PRESETS[name];
      G.follow = false; G.user = { cx: C.X + pr.X, cy: C.Y + pr.Y, z: pr.f / 28 };
      setTier(pr.f <= 48 ? 'S' : 'H');
      for (const [n, rw] of Object.entries(rows)) { const on = pr.rows.includes(n); rw.layer.visible = on; rw.shade.visible = on; }
      card.style.display = pr.card ? 'block' : 'none';
      title.textContent = pr.title;
      G.render(G.t);
      const w = st.world;
      for (const l of labels) {
        l.d.style.display = pr.rows.includes(l.row) ? 'block' : 'none';
        l.d.style.left = (w.position.x + l.X * w.scale.x) + 'px'; l.d.style.top = (w.position.y + l.Y * w.scale.y) + 'px';
      }
      return { name, f: pr.f, tier: pr.f <= 48 ? 'S' : 'H' };
    }
    view('overview');
    return { view, presets: Object.keys(PRESETS) };
  }
  window.__pilot = { ready: build().catch((e) => { (window.__errors = window.__errors || []).push('pilot: ' + e.message + ' ' + e.stack); throw e; }) };
})();
