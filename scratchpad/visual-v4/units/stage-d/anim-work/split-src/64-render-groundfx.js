'use strict';
// ---- BattleStage, part 5: pooled objects, shared Graphics contexts, ground fx and hulls (skills audit B1) ----

Object.assign(BattleStage.prototype, {
  // ---- pooled display objects and shared Graphics contexts (skills audit B1) ----
  /** The next pooled object of a kind, made in its layer on first use; endPool hides the ones this frame left over. */
  pullObj(kind, layer, make) {
    const P = this.objPool[kind] || (this.objPool[kind] = { items: [], used: 0 });
    let o = P.items[P.used++];
    if (!o) { o = make(); layer.addChild(o); P.items.push(o); }
    o.visible = true;
    return o;
  },
  beginPool(kind) { const P = this.objPool[kind]; if (P) P.used = 0; },
  endPool(kind) { const P = this.objPool[kind]; if (P) for (let i = P.used; i < P.items.length; i++) P.items[i].visible = false; },
  /**
   * A shape built once and shared by every pooled Graphics that shows it (the per-frame clear-and-redraw rebuilt and
   * re-tessellated them all on every frame). Each is drawn about (0, 0) exactly as the frame drew it about its anchor,
   * so placing the Graphics there gives the same geometry.
   */
  ctxFor(kind, v) {
    const key = kind + '/' + v;
    let c = this.ctx.get(key);
    if (c) return c;
    c = new PIXI.GraphicsContext();
    if (kind === 'cmdRing') { // a commander's base ring in his banner colour v
      c.ellipse(0, 0, 19, 19 * 0.643).stroke({ width: 3.4, color: INK, alpha: 0.6 });
      c.ellipse(0, 0, 19, 19 * 0.643).stroke({ width: 2, color: v, alpha: 0.95 });
    } else if (kind === 'pole') c.moveTo(0, 14).lineTo(0, -10).stroke({ width: 1.6, color: INK, alpha: 0.9 });
    else if (kind === 'flag') c.poly([0, -10, 11, -7, 0, -3]).fill(v).stroke({ width: 0.8, color: INK, alpha: 0.8 }); // its tip waves by a shear
    else if (kind === 'pip') { // a wordless pip: shield with a tick (held) or a broken shield (broke); its fade is the Graphics' alpha
      c.roundRect(-9, -10, 18, 20, 6).fill({ color: 0x14120f, alpha: 0.72 });
      c.poly([-5, -6, 5, -6, 5, 1, 0, 6, -5, 1]).fill({ color: v === 'held' ? 0x9bd3a2 : 0xd9543a, alpha: 1 });
      if (v === 'held') c.moveTo(-3, -1).lineTo(-0.5, 2).lineTo(3.5, -3).stroke({ width: 1.6, color: 0x14120f, alpha: 1 });
      else c.moveTo(-1, -6).lineTo(1, -1).lineTo(-1, 6).stroke({ width: 1.6, color: 0x14120f, alpha: 1 });
    }
    c.batchMode = 'batch'; // batched with the sprites, whatever its vertex count
    this.ctx.set(key, c);
    return c;
  },
  clearGroundFx() { this.beginPool('shadow'); this.endPool('shadow'); this.beginPool('cmdRing'); this.endPool('cmdRing'); if (this.fxRingsDrawn) { this.fxRingG.clear(); this.fxRingsDrawn = false; } },
  clearGlyphs() { this.beginPool('pennant'); this.endPool('pennant'); this.beginPool('pip'); this.endPool('pip'); },
  drawGroundFx(t, view) {
    const T = this.T;
    const tmp = this._gfxTmp || (this._gfxTmp = { x: 0, y: 0, h: 0 });
    this.beginPool('shadow'); this.beginPool('cmdRing');
    // soft contact shadows under every block, so the masses sit on the ground
    for (const G of T.G) {
      if (G.kind === 'commander' || G.kind === 'body' || G.kind === 'cloud' || G.onWall) continue;
      if (t < G.appear || (G.leaveT !== null && t >= G.leaveT)) continue;
      const hull = this.hull(G, t);
      if (!hull) continue;
      for (let k = 0; k < 2; k++) {
        const s = this.pullObj('shadow', this.fxShadowLayer, () => { const o = new PIXI.Sprite(this.texDisc); o.anchor.set(0.5); o.tint = 0x1c1a17; o.alpha = 0.035; return o; });
        s.position.set(hull.X + 4, hull.Y + 3);
        s.scale.set((hull.rx - 2 - k * 6) / DISC_R, (hull.ry - k * 4) / DISC_R);
      }
    }
    // commander base rings: the only figures with a ring, in the banner color
    for (const G of T.G) {
      const g = G.g;
      if (!g.isCmd || g.size >= 3) continue;
      const f = T.F[G.figs[0]];
      if (f.death && t >= f.death.t) continue;
      if (G.leaveT !== null && t >= G.leaveT) continue;
      figPos(T, f, t, tmp);
      const ctx = this.ctxFor('cmdRing', hexToNum(this.B.sides[g.side].banner));
      const r = this.pullObj('cmdRing', this.fxCmdLayer, () => new PIXI.Graphics(ctx));
      if (r.context !== ctx) r.context = ctx;
      r.position.set(sx(tmp.x, tmp.y), sy(tmp.x, tmp.y, tmp.h));
      // held by a pilot curse (Entangle): his ring dims to 0.3 so the dashed curse ring takes its place (critique fix 3c)
      const hd = G.fxHold, dim = hd && t >= hd.t0 && t < hd.t1 + 0.3 ? smooth((t - hd.t0) / 0.2) * (t > hd.t1 ? 1 - (t - hd.t1) / 0.3 : 1) : 0;
      r.alpha = 1 - (1 - FX_LOOKS.entangle.hold.cmdRing) * dim;
    }
    this.endPool('shadow'); this.endPool('cmdRing');
    // the rings that follow a block's size, drawn as before but only while one shows
    const gx = this.fxRingG;
    if (this.fxRingsDrawn) { gx.clear(); this.fxRingsDrawn = false; }
    // buff and debuff rings under blocks
    for (const rg of T.rings) {
      if (t < rg.t0 || t >= rg.t1) continue;
      if (rg.fx && this.fx) continue; // the pilot's curse ring is a sprite of the effects layer
      const G = T.G[rg.g];
      if (!G || countAt(T, rg.g, t) === 0) continue;
      const hull = this.hull(G, t);
      if (!hull) continue;
      const a = clamp((t - rg.t0) / 0.4, 0, 1) * (0.5 - 0.4 * clamp((t - rg.t0 - 1.5) / 2, 0, 1));
      // each dash starts its own path: a bare arc() after another shape is joined to that shape's last point, and drew a
      // stray line from the world origin to the ring (Pixi 8 path continuation)
      if (rg.debuff) for (let k = 0; k < 24; k += 2) { const a0 = (k / 24) * TAU, R = hull.rx + 6; gx.moveTo(hull.X + Math.cos(a0) * R, hull.Y + Math.sin(a0) * R).arc(hull.X, hull.Y, R, a0, ((k + 1) / 24) * TAU).stroke({ width: 1.6, color: rg.color, alpha: a }); }
      else gx.ellipse(hull.X, hull.Y, hull.rx, hull.ry).stroke({ width: 1.4, color: rg.color, alpha: a });
      this.fxRingsDrawn = true;
    }
    // hover and selection hull rings
    for (const [gi, kind] of [[view.hover, 'hover'], [view.selected, 'sel']]) {
      if (gi === null || gi === undefined) continue;
      const G = T.G[gi];
      if (!G) continue;
      const hull = this.hull(G, t);
      if (!hull) continue;
      const col = kind === 'sel' ? hexToNum(this.B.sides[G.side].banner) : 0xf4eedf;
      gx.ellipse(hull.X, hull.Y, hull.rx + 10, hull.ry + 7).stroke({ width: 4, color: INK, alpha: 0.5 });
      gx.ellipse(hull.X, hull.Y, hull.rx + 10, hull.ry + 7).stroke({ width: kind === 'sel' ? 2.4 : 1.6, color: col, alpha: 0.95 });
      this.fxRingsDrawn = true;
    }
  },
  /** A block's ground hull at t, in the screen plane (centre and ellipse radii). */
  hull(G, t) {
    const T = this.T;
    let X0 = Infinity, X1 = -Infinity, Y0 = Infinity, Y1 = -Infinity, n = 0;
    const tmp = this._hullTmp || (this._hullTmp = { x: 0, y: 0, h: 0 });
    for (const fi of G.figs) {
      const f = T.F[fi];
      if (f.death && t >= f.death.t) continue;
      if (t < G.appear) continue;
      figPos(T, f, t, tmp);
      const X = sx(tmp.x, tmp.y), Y = sy(tmp.x, tmp.y, G.onWall ? T.wall.h : G.kind === 'cloud' ? tmp.h : 0); // a swarm's hull is where it flies
      X0 = Math.min(X0, X); X1 = Math.max(X1, X); Y0 = Math.min(Y0, Y); Y1 = Math.max(Y1, Y); n++;
    }
    if (!n) return null;
    const big = G.g.size >= 3 ? LAYOUT.footR[G.g.size] : 8;
    return { X: (X0 + X1) / 2, Y: (Y0 + Y1) / 2, rx: (X1 - X0) / 2 + big, ry: (Y1 - Y0) / 2 + big * 0.643 };
  },
});
