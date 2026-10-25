'use strict';
// ---- BattleStage, part 3: one frame at story time t, the painted figures, the generals' banners, see-through ----

Object.assign(BattleStage.prototype, {
  /** Draws story time t. */
  frame(t, speed, view) {
    const T = this.T, S = this.S;
    const tmp = { x: 0, y: 0, h: 0 };
    this.poolUse = { normal: 0, add: 0, proj: 0, projSh: 0 };
    let drawn = 0;
    // ---- figures ----
    if (this.paint) { const want = this.paintTierFor(); if (want !== this.paint.tier) this.applyPaintTier(want); }
    for (let i = 0; i < T.F.length; i++) {
      const f = T.F[i];
      const sp = this.sprites[i];
      if (!sp) continue;
      const G = T.G[f.g];
      const st = evalFigure(T, f, G, t, speed, tmp);
      if (!st.vis) { sp.visible = false; const sh = this.flyShadows[i]; if (sh) sh.visible = false; continue; }
      sp.visible = true; drawn++;
      if (f.climb && T.wall) { // a climber stands in the wall's own layer once it is on the walk
        const want = t >= f.climb.t + f.climb.dur * 0.6 ? this.walkUnits : sp.layer;
        if (sp.parent !== want) want.addChild(sp);
      }
      if (sp.paint) this.paintSprite(sp, T, f, G, t, speed, st);
      else {
        const frames = sp.frames[st.view];
        const tex = frames[st.frame];
        if (sp.texture !== tex) sp.texture = tex;
        sp.position.set(sx(st.x, st.y), sy(st.x, st.y, st.h));
        sp.scale.x = st.flip ? -sp.baseScale : sp.baseScale;
        sp.tint = this.paintMode ? mix(st.tint, 0x9a9184, 0.18) : st.tint; sp.alpha = st.frame === FR.whiteFlinch ? st.alpha * 0.9 : st.alpha; // stand-ins toned down (critique-resume fix 11); the white flash at 90%
      }
      sp.curView = st.view;
      sp.zIndex = st.key;
      const sh = this.flyShadows[i];
      if (sh) { sh.visible = st.h > 4; sh.position.set(sx(st.x, st.y) + st.h * 0.25, sy(st.x, st.y, 0) + st.h * 0.1); sh.alpha = 0.22 - st.h / 900; }
    }
    if (this.genBanners.length) this.updateGenBanners(t);
    // ---- big bodies ----
    for (const bb of this.bigs) this.updateBig(bb, t, speed);
    this.stats.drawn = drawn;
    this.seeThroughPass(t);
    // ---- projectiles ----
    const P = T.projectiles;
    let lo = upperBound(P, t - 1.4, (p) => p.t0);
    for (let k = lo; k < P.length && P[k].t0 <= t; k++) {
      const pr = P[k];
      if (t > pr.t1 || !shownAt(pr.item, speed)) continue;
      const e = this.projEnds(pr);
      const q = (t - pr.t0) / Math.max(1e-3, pr.t1 - pr.t0);
      const x = lerp(e.x0, e.x1, q), y = lerp(e.y0, e.y1, q);
      const h = lerp(e.h0, e.h1, q) + pr.apex * 4 * q * (1 - q);
      const q2 = Math.min(1, q + 0.02);
      const xb = lerp(e.x0, e.x1, q2), yb = lerp(e.y0, e.y1, q2), hb = lerp(e.h0, e.h1, q2) + pr.apex * 4 * q2 * (1 - q2);
      const X = sx(x, y), Y = sy(x, y, h);
      const rot = Math.atan2(sy(xb, yb, hb) - Y, sx(xb, yb) - X);
      const s = this.pull('proj', this.texDash, this.proj);
      s.position.set(X, Y); s.rotation = rot;
      s.tint = pr.kind === 'fireArrow' ? 0x3a2418 : 0x2a2420; s.alpha = 1; s.scale.set(pr.kind === 'javelin' ? 1.6 : 1.1, pr.kind === 'javelin' ? 1.3 : 0.9);
      if (pr.kind === 'fireArrow') { const g = this.pull('add', this.texSoft, this.fxAdd); g.position.set(X + Math.cos(rot) * 6, Y + Math.sin(rot) * 6); g.tint = 0xff8a30; g.scale.set(0.11); g.alpha = 0.9; }
      const sh = this.pull('projSh', this.texDash, this.projShadow);
      sh.position.set(sx(x, y) + h * 0.12, sy(x, y, 0) + h * 0.05); sh.rotation = Math.atan2(sy(xb, yb, 0) - sy(x, y, 0), sx(xb, yb) - sx(x, y));
      sh.tint = 0x000000; sh.alpha = 0.15; sh.scale.set(0.5, 0.5);
    }
    // ---- bursts (closed-form particles) ----
    const Bu = T.bursts;
    lo = upperBound(Bu, t - 0.9, (b) => b.t);
    for (let k = lo; k < Bu.length && Bu[k].t <= t; k++) {
      const b = Bu[k];
      if (b.item && !shownAt(b.item, speed)) continue;
      const age = t - b.t;
      const life = b.kind === 'dust' ? 0.9 : b.kind === 'motes' ? 0.9 : 0.55;
      if (age > life) continue;
      let ox = b.x, oy = b.y, oh = 14;
      if (b.f !== undefined) { const f = T.F[b.f]; figPos(T, f, b.t, tmp); ox = tmp.x; oy = tmp.y; oh = tmp.h + (T.G[f.g].g.size >= 3 ? 30 : 14); }
      const r = mulberry(b.key);
      for (let j = 0; j < b.n; j++) {
        const a = r() * TAU, sp = 30 + r() * 70, up = 20 + r() * 60;
        const dx = Math.cos(a) * sp * age, dy = Math.sin(a) * sp * age;
        const hh = oh + up * age - 160 * age * age;
        if (hh < 0 && b.kind !== 'dust') continue;
        const add = b.kind === 'spark' || b.kind === 'fire' || b.kind === 'motes';
        // fire: the stage D pilot's painted embers and sparks (E4) instead of ten added dots, which overlapped into a flat
        // peach disc in their first frames (critique, "outside the pilot, but in its frames")
        const ftex = b.kind === 'fire' && FXLIB.ready ? FXLIB.t(j % 3 === 2 ? 'spark' + (1 + (j & 3)) : 'ember' + (1 + (j & 3))) : null;
        const s = add ? this.pull('add', ftex || this.texDot, this.fxAdd) : this.pull('normal', this.texDot, this.fxNormal);
        s.position.set(sx(ox + dx, oy + dy), sy(ox + dx, oy + dy, Math.max(0, b.kind === 'dust' ? 4 + age * 10 : hh)));
        const fade = 1 - age / life;
        if (b.kind === 'blood') { s.tint = 0x7a1410; s.scale.set(0.75); s.alpha = 0.9 * fade; } // 3 wu drops: visible at play zoom (critique fix 8)
        else if (b.kind === 'spark') { s.tint = 0xfff0b0; s.scale.set(0.22); s.alpha = fade; }
        else if (b.kind === 'fire' && ftex) { s.tint = j % 2 ? FX_GRAMMAR.R.primary : FX_GRAMMAR.R.accent; s.scale.set((j % 3 === 2 ? 6 : 3.6) / ftex.frame.width * (0.6 + 0.4 * fade)); s.alpha = fade; s.rotation = j % 3 === 2 ? a : 0; }
        else if (b.kind === 'fire') { s.tint = j % 2 ? 0xff8a20 : 0xffd060; s.scale.set(0.45 * fade + 0.1); s.alpha = fade; }
        else if (b.kind === 'motes') { s.tint = 0xb8f08a; s.scale.set(0.25); s.alpha = fade; }
        else { s.tint = 0xb8ac98; s.scale.set(0.9 + age); s.alpha = 0.25 * fade; }
      }
    }
    for (const k of ['normal', 'add', 'proj', 'projSh']) for (let i = this.poolUse[k]; i < this.pool[k].length; i++) this.pool[k][i].visible = false;
    // ---- decals ----
    this.updateDecals(t, speed);
    // ---- death sequences desaturate the field (S2.8) ----
    let desat = 0;
    for (const sl of T.slow) if (t >= sl.t0 && t < sl.t1 + 0.6) desat = Math.max(desat, (sl.rate < 0.25 ? 1 : 0.6) * clamp((t - sl.t0) / 0.25, 0, 1) * clamp((sl.t1 + 0.6 - t) / 0.6, 0, 1));
    if (desat > 0.01) { this.grade.reset(); this.grade.saturate(-desat * 0.85, false); if (!this.gradeOn) { this.world.filters = [this.grade]; this.gradeOn = true; } }
    else if (this.gradeOn) { this.world.filters = []; this.gradeOn = false; }
    // ---- ground fx, spells, glyphs ----
    this.drawGroundFx(t, view);
    this.drawSpells(t, speed);
    this.drawGlyphs(t);
    if (this.fx) this.fx.frame(t, speed); // last: the pilot's lights tint the figures drawn above
  },
  /** One painted figure at t: its pose's frame in its view (mirrored as needed), variant, tier and transforms. */
  paintSprite(sp, T, f, G, t, speed, st) {
    const P = this.paint, pd = sp.paint, v = pd.vary;
    const pp = paintPose(T, f, G, t, speed, st, pd.look, v, pd.extra);
    if (P.tier === 'H' && pp.pose === PP['recoil.white']) pp.pose = PP.recoil; // close zoom: the painted flinch, no cut-out (critique-resume fix 9)
    const V = P.tex[P.tier].get(pd.texKey);
    const want = st.view === 'ne' ? 'back' : 'front';
    let mirror = st.view === 'ne' ? st.flip : !st.flip;
    const vv = V[want];
    if (vv.standIn) { mirror = !mirror; P.standInMoments++; }
    const arr = vv.v[v.variant] || vv.v[0];
    const tex = arr[pp.pose] || arr[PP.stand];
    if (sp.texture !== tex) { sp.texture = tex; sp.anchor.set(tex.pax, tex.pay); }
    sp.whiteTex = arr[PP['stand.white']] || tex;
    const dead = f.death && t >= f.death.t;
    const k = PAINT.wuPerPx[P.tier] * v.scale;
    sp.scale.set((mirror ? -k : k) * pp.sx, k * pp.sy);
    sp.rotation = dead ? pp.rot : pp.rot + v.lean; // the fall eases into the decal's rotation (paintPose)
    const x = st.x + v.jx, y = st.y + v.jy + pp.dy;
    sp.position.set(sx(x, y), sy(x, y, st.h + pp.lift));
    const white = pp.pose === PP['recoil.white'];
    if (white) sp.tint = 0xffffff;
    else if (v.bright === 1 && st.tint === 0xffffff) sp.tint = 0xffffff;
    else {
      // painted figures: a wound darkens the paint a little instead of the procedural red cast (critique-resume fix 3)
      const R = (st.tint >> 16) & 255, Gc = (st.tint >> 8) & 255;
      const w = R > 0 ? clamp((1 - Gc / R) / 0.35, 0, 1) : 0;
      const c = Math.round(255 * v.bright * (1 - 0.12 * w));
      sp.tint = (c << 16) | (c << 8) | c;
    }
    if (pp.hurt > 0) sp.tint = mix(sp.tint, 0xd0605a, pp.hurt); // reduced motion: the hit's red tint (docs/12 S2.14)
    sp.alpha = white ? st.alpha * 0.9 : st.alpha; // the white flash at 90% (docs/12 S2.9)
    sp.pv = v.variant; sp.pPose = pp.pose; sp.pFwd = st.flip ? -1 : 1; // read by the checks and the general's banner
  },
  /**
   * A painted general's banner: on a pole 50 wu tall (drawBanner's 74 art px at the commander's 1.15 scale, rounded up),
   * 7 wu behind his back shoulder, the cloth 26 x 11 wu flying over his head toward his facing; it flares to 1.15x while
   * he rallies (plan 6, "Banner wave") and goes down with him.
   */
  updateGenBanners(t) {
    const T = this.T, tier = this.paint.tier;
    for (const b of this.genBanners) {
      const sp = b.sp, f = T.F[b.G.figs[0]];
      const on = sp.visible && !(f.death && t >= f.death.t) && sp.pFwd !== undefined;
      b.root.visible = on;
      if (!on) continue;
      if (b.root.parent !== sp.parent) sp.parent.addChild(b.root);
      b.root.zIndex = sp.zIndex - 0.01;
      b.root.alpha = sp.alpha;
      const fwd = sp.pFwd, rally = sp.pPose === PP.actA || sp.pPose === PP.actB, fl = rally ? 1.15 : 1;
      const X = sp.x - fwd * 7;
      placePaintBanner(b, tier, X, sp.y - 2, sp.y - 50, 26 * fl, 11 * fl, fwd, t * (rally ? 1.6 : 1), b.G.idx * 1.7, 1.6 * fl);
    }
  },
  /**
   * Figures a nearer big body covers are drawn again above it as faint silhouettes (design 6), only
   * for a body on the ground: engaged figures within 1.5 footprints of it, at most 12 (critique fix 1).
   */
  seeThroughPass(t) {
    let used = 0;
    const pool = this.pool.see || (this.pool.see = []);
    const T = this.T;
    for (const bb of this.bigs) {
      const r = bb.body.root;
      if (!r.visible || bb.h > 30 || (bb.f.death && t >= bb.f.death.t)) continue;
      const R = 1.5 * LAYOUT.footR[bb.G.g.size];
      let n = 0;
      for (let i = 0; i < this.sprites.length && n < 12; i++) {
        const sp = this.sprites[i];
        if (!sp || !sp.visible || sp.layer !== this.units || sp.zIndex >= r.zIndex) continue;
        const f = T.F[i], G = T.G[f.g];
        if (!G.inContactAt || !G.inContactAt(t) || (f.death && t >= f.death.t)) continue;
        const p = figPos(T, f, t, this._see || (this._see = { x: 0, y: 0, h: 0 }));
        if (Math.hypot(p.x - bb.gx, p.y - bb.gy) > R) continue;
        let s2 = pool[used];
        if (!s2) { s2 = new PIXI.Sprite(); s2.anchor.set(FIG_ANCHOR.x, FIG_ANCHOR.y); this.seeThrough.addChild(s2); pool.push(s2); }
        used++; n++;
        s2.visible = true;
        if (sp.paint) { s2.texture = sp.whiteTex; s2.anchor.copyFrom(sp.anchor); s2.rotation = sp.rotation; }
        else { s2.texture = sp.frames[sp.curView][FR.white]; s2.anchor.set(FIG_ANCHOR.x, FIG_ANCHOR.y); s2.rotation = 0; }
        s2.position.copyFrom(sp.position); s2.scale.copyFrom(sp.scale);
        s2.tint = 0x1c1a17; s2.alpha = 0.22;
      }
    }
    for (let i = used; i < pool.length; i++) pool[i].visible = false;
    this.stats.seeThrough = used;
  },
});
