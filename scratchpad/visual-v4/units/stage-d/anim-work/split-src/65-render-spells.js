'use strict';
// ---- BattleStage, part 6: the spells the pilot layer does not draw, the breath, the glyphs ----

Object.assign(BattleStage.prototype, {
  drawSpells(t, speed) {
    const T = this.T, g = this.spellG, ga = this.spellAdd;
    g.clear(); ga.clear();
    const tmp = { x: 0, y: 0, h: 0 }, tmp2 = { x: 0, y: 0, h: 0 };
    for (const fx of T.spellFx) {
      if (t < fx.t0 || t > fx.t1 + 0.6) continue;
      if (this.fx && fx.beats && FX_LOOKS[fx.spell]) continue; // drawn by the pilot's effects layer
      const cf = T.F[fx.caster];
      figPos(T, cf, t, tmp);
      const CX = sx(tmp.x, tmp.y), CY = sy(tmp.x, tmp.y, tmp.h + 22);
      const col = fx.look.color;
      if (fx.spell === 'breath') { this.drawBreath(fx, t); continue; }
      // charge: a glow at the staff
      if (t < fx.release) { const k = (t - fx.t0) / Math.max(0.05, fx.release - fx.t0); ga.circle(CX + 6, CY - 8, 4 + 8 * k).fill({ color: col, alpha: 0.35 }); ga.circle(CX + 6, CY - 8, 2 + 3 * k).fill({ color: 0xffffff, alpha: 0.7 }); }
      const kind = fx.look.kind;
      const targets = fx.targets.map((gi) => this.hull(T.G[gi], Math.min(t, fx.impact))).filter(Boolean);
      if (t >= fx.release && t < fx.impact) {
        const k = (t - fx.release) / Math.max(0.05, fx.impact - fx.release);
        for (const h of targets.slice(0, 3)) {
          if (kind === 'bolt' || kind === 'lob' || kind === 'tendril') {
            const apex = kind === 'lob' ? 120 : 10;
            const X = lerp(CX, h.X, k), Y = lerp(CY, h.Y, k) - apex * 4 * k * (1 - k) * CP;
            ga.circle(X, Y, kind === 'lob' ? 9 : 5).fill({ color: col, alpha: 0.9 }); ga.circle(X, Y, kind === 'lob' ? 4 : 2.5).fill({ color: 0xfff0c0, alpha: 1 });
            ga.circle(X, Y, kind === 'lob' ? 18 : 10).fill({ color: col, alpha: 0.18 });
            if (kind === 'lob') g.ellipse(lerp(CX, h.X, k), lerp(CY + 22 * CP, h.Y, k), 10, 6).fill({ color: 0x000000, alpha: 0.15 });
          } else if (kind === 'crack') {
            // a thin, jagged split in the ground, not a plank (critique-resume fix 12)
            const X1 = lerp(CX, h.X, k), Y1 = lerp(CY + 18, h.Y, k);
            g.moveTo(CX, CY + 18);
            for (let j = 1; j <= 7; j++) { const q = j / 7, w = j < 7 ? (u01('crack/' + fx.caster + '/' + j) - 0.5) * 10 : 0; g.lineTo(lerp(CX, X1, q) + w, lerp(CY + 18, Y1, q) + w * 0.5); }
            g.stroke({ width: 1.4, color: 0x2a1e12, alpha: 0.6 });
          } else if (kind === 'summon') {
            ga.circle(h.X, h.Y, 30 * k).fill({ color: col, alpha: 0.2 });
          }
        }
        if (kind === 'ripple' || kind === 'wave') { const r = 40 + 400 * k; g.ellipse(CX, CY + 18, r, r * 0.643).stroke({ width: 3, color: col, alpha: 0.6 * (1 - k) }); }
      }
      if (t >= fx.impact && t < fx.impact + 0.7) {
        const k = (t - fx.impact) / 0.7;
        for (const h of targets) {
          if (kind === 'lob' || kind === 'meteors') { const r = 20 + 70 * easeOut(k); g.ellipse(h.X, h.Y, r, r * 0.643).stroke({ width: 4, color: col, alpha: 0.7 * (1 - k) }); ga.circle(h.X, h.Y - 10, 30 * (1 - k)).fill({ color: 0xffb040, alpha: 0.35 * (1 - k) }); }
          else if (kind === 'column') { const top = 120; // a soft shaft of light: three stacked soft rectangles (critique-resume fix 12)
            for (const [wd, al] of [[16, 0.12], [9, 0.18], [4, 0.3]]) ga.rect(h.X - wd / 2, h.Y - top, wd, top).fill({ color: col, alpha: al * (1 - k) });
            g.ellipse(h.X, h.Y, h.rx * 0.6, h.ry * 0.6).fill({ color: col, alpha: 0.18 * (1 - k) }); }
          else if (kind === 'crack') { for (let j = 0; j < 6; j++) { const a = j * 1.1; g.moveTo(h.X + Math.cos(a) * 6, h.Y + Math.sin(a) * 4).lineTo(h.X + Math.cos(a) * 12, h.Y + Math.sin(a) * 8 - 14 * (1 - k)).stroke({ width: 2.4, color: 0x5a7a2a, alpha: 1 - k }); } }
          else if (kind === 'leaves') { for (let j = 0; j < 10; j++) { const a = j * 0.63 + k * 6; ga.circle(h.X + Math.cos(a) * (h.rx * 0.6), h.Y + Math.sin(a) * (h.ry * 0.6) - 20 * k, 2.5).fill({ color: 0x9bc06a, alpha: 0.8 * (1 - k) }); } }
          else if (kind === 'bolt' && fx.spell === 'emberDart' && FXLIB.ready) { // the old flat added disc was the peach disc beside
            // cast 6's blast (critique shot 21): a spray of the pilot's painted E4 embers and sparks instead (x0.3 under reduced motion)
            const r = mulberry(hash32('edart/' + fx.caster + '/' + Math.round(fx.impact * 1000))), n = hitReduced() ? 3 : 8;
            for (let j = 0; j < n; j++) {
              const a = r() * TAU, sp = 18 + r() * 30, spark = j % 2 === 1, tex = FXLIB.t((spark ? 'spark' : 'ember') + (1 + (j & 3)));
              const s = this.pull('add', tex, this.fxAdd);
              s.position.set(h.X + Math.cos(a) * sp * k, h.Y - 10 + Math.sin(a) * sp * k * 0.643 - 12 * k);
              s.tint = spark ? FX_GRAMMAR.R.primary : FX_GRAMMAR.R.accent; s.scale.set((spark ? 6 : 3.6) / tex.frame.width * (1 - 0.5 * k)); s.alpha = 1 - k; s.rotation = spark ? a : 0;
            }
          } else if (kind === 'bolt' || kind === 'tendril') ga.circle(h.X, h.Y - 10, 16 * (1 - k)).fill({ color: col, alpha: 0.5 * (1 - k) });
          else if (kind === 'summon') { for (let j = 0; j < 14; j++) { const a = j * 0.45 + k * 4; ga.circle(h.X + Math.cos(a) * 30 * k, h.Y - 30 * k + Math.sin(a) * 12, 1.6).fill({ color: 0xe0c040, alpha: 1 - k }); } }
        }
      }
    }
    void tmp2; void speed;
  },
  drawBreath(fx, t) {
    const T = this.T, ga = this.spellAdd, g = this.spellG;
    const bb = this.bigs.find((b) => b.f.id === fx.caster);
    let MX, MY;
    if (bb && bb.body.mouth) {
      const m = bb.body.mouth();
      MX = bb.body.root.x + m.x * bb.body.root.scale.x; MY = bb.body.root.y + m.y;
    } else { const p = figPos(T, T.F[fx.caster], t, { x: 0, y: 0, h: 0 }); MX = sx(p.x, p.y); MY = sy(p.x, p.y, p.h + 30); }
    if (t < fx.release - 0.15 || t > fx.t1) return;
    if (t < fx.release) { ga.circle(MX, MY, 6).fill({ color: fx.look.color, alpha: 0.5 }); return; }
    const k = (t - fx.release) / (fx.t1 - fx.release);
    const tg = fx.hitFigs.map((fi) => figPos(T, T.F[fi], fx.release, { x: 0, y: 0, h: 0 }));
    if (!tg.length) return;
    // the aim sweeps across the struck figures
    const u = clamp(k * 1.15, 0, 1) * (tg.length - 1);
    const i0 = Math.floor(u), i1 = Math.min(tg.length - 1, i0 + 1), fr = u - i0;
    const ax = lerp(tg[i0].x, tg[i1].x, fr), ay = lerp(tg[i0].y, tg[i1].y, fr);
    const AX = sx(ax, ay), AY = sy(ax, ay, 8);
    const col = fx.look.color;
    const fade = k > 0.85 ? (1 - k) / 0.15 : 1;
    const dx = AX - MX, dy = AY - MY, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    const r = mulberry(hash32(fx.caster + '/' + Math.floor(t * 40)));
    // the cone and the outer billows in normal blend, in the breath's shadowed color, so the blast
    // reads on a light ground; only the hot core is additive (critique fix 8)
    const dark = shade(col, -0.35), mid = shade(col, -0.1);
    g.poly([MX + nx * 6, MY + ny * 6, AX + nx * 62, AY + ny * 40, AX - nx * 62, AY - ny * 40, MX - nx * 6, MY - ny * 6]).fill({ color: dark, alpha: 0.2 * fade });
    g.poly([MX + nx * 3, MY + ny * 3, AX + nx * 34, AY + ny * 22, AX - nx * 34, AY - ny * 22, MX - nx * 3, MY - ny * 3]).fill({ color: mid, alpha: 0.22 * fade });
    for (let j = 0; j < 70; j++) {
      const q = Math.pow(r(), 0.7);
      const spread = (r() - 0.5) * 2 * (6 + 58 * q * q);
      const X = MX + dx * q + nx * spread + Math.sin(t * 30 + j) * 2, Y = MY + dy * q + ny * spread * 0.7 - 10 * q * r();
      const rad = 3 + 22 * q * q + 4 * r();
      if (q < 0.25) ga.circle(X, Y, rad).fill({ color: j % 2 ? 0xfff6c8 : col, alpha: (0.3 + 0.25 * (1 - q)) * fade });
      else g.circle(X, Y, rad).fill({ color: j % 3 ? dark : mid, alpha: 0.42 * fade * (1.15 - 0.45 * q) });
    }
    // the blast where it lands: a billowing burst and a hot heart
    for (let j = 0; j < 9; j++) { const a = j * 0.7 + t * 3; g.circle(AX + Math.cos(a) * 26, AY + Math.sin(a) * 14 - 8, 18 + 6 * Math.sin(t * 9 + j)).fill({ color: j % 2 ? dark : mid, alpha: 0.32 * fade }); }
    ga.circle(AX, AY - 6, 20).fill({ color: col, alpha: 0.3 * fade });
    g.ellipse(AX, AY + 4, 56, 30).fill({ color: 0x000000, alpha: 0.12 * fade });
  },
  drawGlyphs(t) {
    const T = this.T;
    this.beginPool('pennant'); this.beginPool('pip');
    // a block's pennant rides on its front-left figure; it drops when the block routs (design 6)
    for (const G of T.G) {
      if (G.kind === 'commander' || G.kind === 'body' || t < G.appear) continue;
      if (G.routT !== null && t >= G.routT) continue;
      let best = null, bk = Infinity;
      for (const fi of G.figs) {
        const f = T.F[fi];
        if (f.death && t >= f.death.t) continue;
        const sp = this.sprites[fi];
        if (!sp || !sp.visible) continue;
        const k = f.rank * 10000 + sp.x;
        if (k < bk) { bk = k; best = sp; }
      }
      if (!best) continue;
      const nat = this.B.sides[G.side].def;
      if (this.paint && PAINTLIB.banner && PAINTLIB.banner[nat]) {
        // the nation's painted banner on a 20 x 8 wu strip at the pole top (critique fix 6)
        const b = this.blockBanners[G.idx] || (this.blockBanners[G.idx] = makePaintBanner(nat));
        if (b.root.parent !== this.bannerLayer) this.bannerLayer.addChild(b.root);
        b.used = true; b.root.visible = true;
        placePaintBanner(b, this.paint.tier, best.x - 4, best.y - 12, best.y - 46, 20, 8, 1, t, G.idx, 1.2);
        continue;
      }
      const fc = this.ctxFor('flag', hexToNum(this.B.sides[G.side].banner));
      const p = this.pullObj('pennant', this.glyPennantLayer, () => {
        const c = new PIXI.Container(); c.pole = new PIXI.Graphics(this.ctxFor('pole', 0)); c.flag = new PIXI.Graphics(fc); c.addChild(c.pole, c.flag); return c;
      });
      if (p.flag.context !== fc) p.flag.context = fc;
      p.position.set(best.x - 4, best.y - 30);
      // the free end waves by w (it was redrawn at y - 7 + w): a vertical shear about the pole, y' = y + x w / 11
      const w = Math.sin(t * 3 + G.idx) * 1.2, sk = Math.atan2(w, 11);
      p.flag.skew.y = sk; p.flag.scale.x = 1 / Math.cos(sk);
    }
    for (const b of this.blockBanners) if (b) { if (!b.used) b.root.visible = false; b.used = false; }
    for (const gl of T.glyphs) {
      if (t < gl.t0 || t >= gl.t1) continue;
      const G = T.G[gl.g];
      const h = this.hull(G, t);
      if (!h) continue;
      const a = clamp((t - gl.t0) / 0.15, 0, 1) * clamp((gl.t1 - t) / 0.3, 0, 1);
      const ctx = this.ctxFor('pip', gl.kind === 'held' ? 'held' : 'broke');
      const g = this.pullObj('pip', this.glyPipLayer, () => new PIXI.Graphics(ctx));
      if (g.context !== ctx) g.context = ctx;
      g.position.set(h.X, h.Y - h.ry - 34); g.alpha = a;
    }
    this.endPool('pennant'); this.endPool('pip');
  },
});
