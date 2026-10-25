'use strict';
// ---- the effects layer's light (stage D magic pilot; split from 46-fx.js, behaviour unchanged) ----
// The spells' light on the figures (an added copy of each lit figure's own frame, only while a spell's light is on it),
// the fire wounds' one-frame orange flash through the same copy, the solid burst domes and big bodies that hide a
// figure from it, and the pushed shadows. Methods of FxLayer (46-fx.js).

Object.assign(FxLayer.prototype, {
  litMake() { const s = new PIXI.Sprite(PIXI.Texture.EMPTY); s.visible = false; this.lit.addChild(s); this.litList.push(s); return s; },
  /** An added copy of a figure's own frame, at its exact transform (pooled; made only past the 96 pre-warmed). */
  litCopy(sp, tint, alpha) {
    const c = this.litList[this.litUsed] || this.litMake();
    this.litUsed++;
    if (c.texture !== sp.texture) c.texture = sp.texture;
    c.anchor.copyFrom(sp.anchor); c.position.copyFrom(sp.position); c.scale.copyFrom(sp.scale); c.skew.copyFrom(sp.skew);
    c.rotation = sp.rotation; c.tint = tint; c.alpha = alpha; c.visible = true;
    if (alpha > this.litAlphaMax) this.litAlphaMax = alpha;
    return c;
  },
  /** A light this frame: ground point, radius (wu), strength 0..1, colour, and a pushed shadow's strength. */
  light(x, y, r, k, color, shadow) { if (k > 0.01) this.lights.push({ x, y, r, k, color, shadow: shadow || 0 }); },
  /** A solid burst dome this frame (screen ellipse inside its sprite, its zIndex): the figures behind it get no light copy. */
  dome(cx, cy, rx, ry, z) { this.domes.push({ cx, cy, rx, ry, z }); },
  behindDome(sp) { // the figure's middle (a man is 28 units tall) inside a dome sorted in front of it
    for (const d of this.domes) { if (sp.zIndex >= d.z) continue; const u = (sp.x - d.cx) / d.rx, v = (sp.y - 14 - d.cy) / d.ry; if (u * u + v * v < 1) return true; }
    return false;
  },
  /**
   * The spells' light on the figures (critique fix 1; art plan 7.1; owner 2026-10-24, "Glow only during own fire": a spell's
   * light may light the figures near it, and nothing glows at rest). A figure within a light's radius gets an added copy
   * of its own frame tinted the light's colour, at light.add x k (0.5 at the peak), falling off smoothly from the centre;
   * a figure between the light and the camera, lit from behind, takes less of it. Figures hidden behind a big body or a
   * solid burst dome get no copy (it would shine through). Big bodies keep a multiply tint until they have a copy of their own. The
   * impact's light pushes a short shadow away from it. Fire wounds flash orange for one frame through the same copy (fix
   * 2). Figures outside every light's box are skipped without a distance test, and nothing is allocated (fix 7c).
   */
  applyLights(t) {
    this.litUsed = 0; this.litAlphaMax = 0; this.litFlash = 0;
    const st = this.st, Ls = this.lights, nL = Ls.length, LK = FX_LOOKS.fireball.light;
    const flash = this.woundFlashes(t);
    if (!nL && !flash) { this.litEnd(); return; }
    // the lights' box in the screen plane (a figure's feet), with room for a thrown figure's hop
    let X0 = Infinity, X1 = -Infinity, Y0 = Infinity, Y1 = -Infinity;
    for (let j = 0; j < nL; j++) {
      const L = Ls[j], X = sx(L.x, L.y), Y = sy(L.x, L.y, 0);
      if (X - L.r < X0) X0 = X - L.r; if (X + L.r > X1) X1 = X + L.r;
      if (Y - L.r * SP - 14 < Y0) Y0 = Y - L.r * SP - 14; if (Y + L.r * SP + 4 > Y1) Y1 = Y + L.r * SP + 4;
    }
    const occ = this.occluders();
    const g = this._lg || (this._lg = { x: 0, y: 0 }), sh = this._ls || (this._ls = { k: 0, dx: 0, dy: 0 });
    for (let i = 0; i < st.sprites.length; i++) {
      const sp = st.sprites[i];
      if (!sp || !sp.visible || sp.alpha <= 0) continue;
      const fa = flash ? flash.get(i) : undefined;
      const inBox = nL && sp.x >= X0 && sp.x <= X1 && sp.y >= Y0 && sp.y <= Y1;
      if (!inBox && fa === undefined) continue;
      let best = 0, col = 0xffffff;
      sh.k = 0;
      if (inBox) {
        toGround(sp.x, sp.y, g);
        const dk = depthKey(g.x, g.y);
        for (let j = 0; j < nL; j++) {
          const L = Ls[j], d = Math.hypot(g.x - L.x, g.y - L.y) / L.r;
          if (d >= 1) continue;
          const k = L.k * (1 - smooth(d)) * (dk > depthKey(L.x, L.y) + 4 ? 0.6 : 1);
          if (k > best) { best = k; col = L.color; }
          if (L.shadow > 0 && k * L.shadow > sh.k) { sh.k = k * L.shadow; sh.dx = g.x - L.x; sh.dy = g.y - L.y; }
        }
      }
      // an added copy would shine through a solid burst dome, or a big body (its box: coarse, so not for the one-frame flash)
      const hidD = this.domes.length > 0 && this.behindDome(sp), hid = hidD || (occ && this.hidden(sp, occ));
      if (fa !== undefined && fa > 0 && !hidD) { this.litCopy(sp, FX_LOOKS.fireball.wound.flash, fa); this.litFlash++; } // the one-frame orange flash
      else if (best > 0.02 && !hid) this.litCopy(sp, col, Math.min(1, LK.add * best));
      if (sh.k > 0.02) this.pushShadow(g.x, g.y, sh);
    }
    for (const bb of st.bigs) {
      const r = bb.body.root;
      if (!r.visible) continue;
      toGround(r.x, r.y, g);
      let best = 0, col = 0xffffff;
      for (let j = 0; j < nL; j++) { const L = Ls[j], d = Math.hypot(g.x - L.x, g.y - L.y) / (L.r + LAYOUT.footR[bb.G.g.size]); if (d < 1 && L.k * (1 - smooth(d)) > best) { best = L.k * (1 - smooth(d)); col = L.color; } }
      if (best > 0.01) r.tint = mixTint(r.tint === undefined ? 0xffffff : r.tint, col, best * LK.tint);
    }
    this.litEnd();
  },
  litEnd() {
    for (let i = this.litUsed; i < this.litList.length; i++) if (this.litList[i].visible) this.litList[i].visible = false;
    this.lit.visible = this.litUsed > 0; this.litPeak = Math.max(this.litPeak, this.litUsed);
  },
  /** The big bodies standing on the field this frame, as screen rectangles (a figure behind one and inside it is hidden). */
  occluders() {
    let out = null;
    for (const bb of this.st.bigs) {
      const r = bb.body.root, s = bb.body.sprite;
      if (!r.visible || !s || !s.texture || !s.texture.frame) continue;
      const w = s.texture.frame.width * Math.abs(s.scale.x * r.scale.x), h = s.texture.frame.height * Math.abs(s.scale.y * r.scale.y);
      const ax = Math.max(s.anchor.x, 1 - s.anchor.x);
      (out || (out = [])).push({ z: r.zIndex, x0: r.x - ax * w, x1: r.x + ax * w, y0: r.y - s.anchor.y * h, y1: r.y + (1 - s.anchor.y) * h });
    }
    return out;
  },
  hidden(sp, occ) {
    for (const o of occ) if (sp.zIndex < o.z && sp.x > o.x0 && sp.x < o.x1 && sp.y > o.y0 && sp.y < o.y1) return true;
    return false;
  },
  /**
   * Fire wounds this frame (critique fix 2, docs/12 S2.9 and S2.14): a map of sprite index to the orange flash's alpha
   * while it shows (one frame: 1/60 s of story, a real frame at 2x and 4x), or null when none. Under reduced motion there
   * is no flash: the figure takes a red tint fading over 0.15 s instead.
   */
  woundFlashes(t) {
    const W = this.fireWounds;
    if (this._wf) this._wf.clear();
    if (!W.length) return null;
    const look = FX_LOOKS.fireball.wound, win = Math.max(1, this.speed) / 60, red = this.reduced;
    let out = null;
    for (let i = upperBound(W, t - 0.2, (w) => w.t), n = W.length; i < n && W[i].t <= t; i++) {
      const w = W[i], age = t - w.t, sp = this.st.sprites[w.f.id];
      if (!sp || !sp.visible) continue;
      if (red) { if (age < look.reducedLife) sp.tint = mixTint(sp.tint, look.reducedTint, 1 - age / look.reducedLife); continue; }
      if (age < win) { out = this._wf || (this._wf = new Map()); out.set(w.f.id, look.flashAlpha); }
    }
    return out;
  },
  pushShadow(x, y, sh) {
    const LK = FX_LOOKS.fireball.light, d = Math.hypot(sh.dx, sh.dy) || 1, len = LK.shadowLen[0] + LK.shadowLen[1] * sh.k;
    const ux = sh.dx / d, uy = sh.dy / d;
    const S = this.sets.get('fireball'); // the light that pushes shadows is Ember's
    if (!S) return;
    const s = S.groundN.take(FXLIB.t('shadowLong'));
    const X = sx(x + ux * len * 0.5, y + uy * len * 0.5), Y = sy(x + ux * len * 0.5, y + uy * len * 0.5, 0);
    s.position.set(X, Y);
    s.rotation = Math.atan2(sy(ux, uy, 0), sx(ux, uy));
    s.scale.set(len / 96 * 1.6, 0.16);
    s.alpha = clamp(LK.shadowAlpha * sh.k, 0, 0.55);
  },
});
