'use strict';
// ---- BattleStage, part 2: the storm wall, decals, projectile ends, the particle pool (split from 60-render.js) ----

Object.assign(BattleStage.prototype, {
  buildWall() {
    const w = this.T.wall, wl = this.L;
    const s = w.defSign;
    // rampart depth: the defenders' front and middle blocks stand on it
    let depth = 70;
    for (const G of this.T.G) if (G.onWall) depth = Math.max(depth, Math.abs(pathEnd(G.path).y) + G.ext.d + 14);
    w.depth = depth;
    const P = (gx, gy, h) => [sx(gx, gy), sy(gx, gy, h)];
    const winter = this.groundInfo.season === 'winter';
    const top = new PIXI.Graphics(), front = new PIXI.Graphics();
    const x0 = w.x0, x1 = w.x1;
    // the back face and the rampart walk (drawn before the defenders on it)
    top.poly([...P(x0, s * depth, 0), ...P(x1, s * depth, 0), ...P(x1, s * depth, w.h), ...P(x0, s * depth, w.h)]).fill(0x5c544b);
    top.poly([...P(x0, 0, w.h), ...P(x1, 0, w.h), ...P(x1, s * depth, w.h), ...P(x0, s * depth, w.h)]).fill(winter ? 0xc3c7d0 : 0x9c9284);
    const rr = streamFor(this.T.id, 'wall');
    for (let k = 0; k < 60; k++) { const xx = lerp(x0, x1, rr()), yy = s * depth * rr(); top.ellipse(...P(xx, yy, w.h), 6 + rr() * 10, 2 + rr() * 2).fill({ color: winter ? 0xe8ebf1 : 0x8a8074, alpha: 0.5 }); }
    // the outer face, stone courses, and the merlons along its edge (drawn after the defenders)
    front.poly([...P(x0, 0, 0), ...P(x1, 0, 0), ...P(x1, 0, w.h), ...P(x0, 0, w.h)]).fill(grad(0x8a8074, 0x5a524a));
    front.poly([...P(x0, 0, 0), ...P(x1, 0, 0), ...P(x1, 0, w.h), ...P(x0, 0, w.h)]).stroke({ width: 1, color: INK, alpha: 0.5 });
    for (let k = 1; k < 6; k++) { const a = P(x0, 0, (w.h * k) / 6), b = P(x1, 0, (w.h * k) / 6); front.moveTo(a[0], a[1]).lineTo(b[0], b[1]).stroke({ width: 1, color: 0x4a433b, alpha: 0.45 }); }
    for (let k = 0; k < 6; k++) for (let xx = x0 + (k % 2) * 9; xx < x1; xx += 18) { const a = P(xx, 0, (w.h * k) / 6), b = P(xx, 0, (w.h * (k + 1)) / 6); front.moveTo(a[0], a[1]).lineTo(b[0], b[1]).stroke({ width: 1, color: 0x4a433b, alpha: 0.35 }); }
    for (let k = 0; k < 40; k++) { const xx = lerp(x0, x1, rr()), hh = w.h * rr(); front.ellipse(...P(xx, 0, hh), 4 + rr() * 8, 3 + rr() * 4).fill({ color: rr() < 0.5 ? 0x4f473f : 0x9a8f82, alpha: 0.35 }); }
    for (let mx = x0 + 4; mx < x1 - 4; mx += 16) {
      const m = [...P(mx, 0, w.h), ...P(mx + 9, 0, w.h), ...P(mx + 9, 0, w.h + 11), ...P(mx, 0, w.h + 11)];
      front.poly(m).fill(0x857b6f); front.poly(m).stroke({ width: 1, color: INK, alpha: 0.45 });
      front.poly([...P(mx, 0, w.h + 11), ...P(mx + 9, 0, w.h + 11), ...P(mx + 9, s * 7, w.h + 11), ...P(mx, s * 7, w.h + 11)]).fill(winter ? 0xeceff4 : 0xa49a8c);
    }
    if (winter) front.poly([...P(x0, 0, 2), ...P(x1, 0, 2), ...P(x1, -s * 10, 0), ...P(x0, -s * 10, 0)]).fill({ color: 0xe6eaf0, alpha: 0.7 });
    // a gatehouse beyond the field's lateral end (design 3.7 rule 5: no gate inside the field rect)
    if (w.gate) {
      const gx = w.gate.x, gw = w.gate.w / 2, gh = w.h + 40, gd = 26;
      const face = [...P(gx - gw, -s * gd, 0), ...P(gx + gw, -s * gd, 0), ...P(gx + gw, -s * gd, gh), ...P(gx - gw, -s * gd, gh)];
      const side = [...P(gx + gw, -s * gd, 0), ...P(gx + gw, s * 20, 0), ...P(gx + gw, s * 20, gh), ...P(gx + gw, -s * gd, gh)];
      const roof = [...P(gx - gw, -s * gd, gh), ...P(gx + gw, -s * gd, gh), ...P(gx + gw, s * 20, gh), ...P(gx - gw, s * 20, gh)];
      front.poly(side).fill(0x5e554c); front.poly(side).stroke({ width: 1, color: INK, alpha: 0.5 });
      front.poly(face).fill(grad(0x8f8579, 0x5c544b)); front.poly(face).stroke({ width: 1, color: INK, alpha: 0.55 });
      front.poly(roof).fill(winter ? 0xe4e8ef : 0x9a8f82);
      for (let k = 1; k < 8; k++) { const a = P(gx - gw, -s * gd, (gh * k) / 8), b = P(gx + gw, -s * gd, (gh * k) / 8); front.moveTo(a[0], a[1]).lineTo(b[0], b[1]).stroke({ width: 1, color: 0x4a433b, alpha: 0.4 }); }
      for (let mx = gx - gw; mx < gx + gw - 4; mx += 13) { const m = [...P(mx, -s * gd, gh), ...P(mx + 7, -s * gd, gh), ...P(mx + 7, -s * gd, gh + 10), ...P(mx, -s * gd, gh + 10)]; front.poly(m).fill(0x857b6f); front.poly(m).stroke({ width: 1, color: INK, alpha: 0.45 }); }
      // the arch: a dark passage with a portcullis
      const ar = [];
      for (let k = 0; k <= 12; k++) { const a = Math.PI * (k / 12); ar.push(...P(gx - Math.cos(a) * 15, -s * gd, 26 + Math.sin(a) * 15)); }
      front.poly([...P(gx + 15, -s * gd, 0), ...ar, ...P(gx - 15, -s * gd, 0)]).fill(0x1f1b17);
      for (let k = -2; k <= 2; k++) { const a = P(gx + k * 6, -s * gd, 0), b = P(gx + k * 6, -s * gd, 36); front.moveTo(a[0], a[1]).lineTo(b[0], b[1]).stroke({ width: 1.4, color: 0x4a3c2c, alpha: 0.9 }); }
      // a banner over the gate in the defender's color
      const bc = hexToNum(this.B.sides.defender.banner), b0 = P(gx - 8, -s * gd, gh - 6), b1 = P(gx + 8, -s * gd, gh - 6), b2 = P(gx + 8, -s * gd, gh - 30), b3 = P(gx, -s * gd, gh - 36), b4 = P(gx - 8, -s * gd, gh - 30);
      front.poly([...b0, ...b1, ...b2, ...b3, ...b4]).fill(bc).stroke({ width: 1, color: INK, alpha: 0.6 });
    }
    this.wallLayer.addChild(top); this.wallLayer.addChild(this.wallDecals); this.wallLayer.addChild(this.walkUnits); this.wallLayer.addChild(front);
    this.wallFront = front;
    // ladders against the face, where the attackers press
    const lad = new PIXI.Graphics();
    const rl = streamFor(this.T.id, 'ladders');
    for (let i = 0; i < 7; i++) {
      const x = lerp(this.L.field.x0 * 0.5, this.L.field.x1 * 0.5, (i + 0.5) / 7) + (rl() - 0.5) * 30;
      const a0 = [sx(x - 5, -s * 16), sy(x - 5, -s * 16, 0)], a1 = [sx(x - 5, 0), sy(x - 5, 0, w.h + 6)];
      const b0 = [sx(x + 5, -s * 16), sy(x + 5, -s * 16, 0)], b1 = [sx(x + 5, 0), sy(x + 5, 0, w.h + 6)];
      lad.moveTo(...a0).lineTo(...a1).stroke({ width: 1.6, color: 0x5a4630 });
      lad.moveTo(...b0).lineTo(...b1).stroke({ width: 1.6, color: 0x5a4630 });
      for (let k = 1; k < 7; k++) { const q = k / 7; lad.moveTo(lerp(a0[0], a1[0], q), lerp(a0[1], a1[1], q)).lineTo(lerp(b0[0], b1[0], q), lerp(b0[1], b1[1], q)).stroke({ width: 1.2, color: 0x6a5238 }); }
    }
    this.wallLayer.addChild(lad);
  },
  makeDecal(d) {
    const T = this.T;
    let sp;
    if (d.kind === 'body') {
      const f = T.F[d.f];
      const G = T.G[f.g];
      if (G.g.size >= 3) { sp = new PIXI.Container(); sp.visible = false; this.decalLayer.addChild(sp); return sp; }
      const fs = this.sprites[d.f];
      if (fs && fs.paint) { // a painted body: the figure's own dead pose, where and as it fell
        sp = new PIXI.Sprite(PIXI.Texture.EMPTY);
        sp.pdecal = { sp: fs, view: G.s < 0 ? 'ne' : 'se', flip: d.flip };
        (this.paintDecals || (this.paintDecals = [])).push(sp);
        sp.rotation = d.rot * 0.5; sp.tint = 0xb0a8a0;
        sp.position.set(sx(d.x + fs.paint.vary.jx, d.y + fs.paint.vary.jy), sy(d.x + fs.paint.vary.jx, d.y + fs.paint.vary.jy, d.h || 0));
        sp.visible = false;
        ((d.h || 0) > 20 && this.T.wall ? this.wallDecals : this.decalLayer).addChild(sp);
        return sp;
      }
      const frames = this.atlas.get(lookKey(this.B, G.g));
      const view = G.s < 0 ? 'ne' : 'se';
      sp = new PIXI.Sprite(frames[view][FR.dead]);
      sp.anchor.set(FIG_ANCHOR.x, FIG_ANCHOR.y);
      sp.scale.set(FIG_SCALE * (G.g.isCmd ? 1.15 : 1) * (d.flip ? -1 : 1), FIG_SCALE * (G.g.isCmd ? 1.15 : 1));
      sp.rotation = d.rot * 0.5;
      sp.tint = 0xb0a8a0;
      sp.position.set(sx(d.x, d.y), sy(d.x, d.y, d.h || 0));
    } else if (d.kind === 'pool') {
      sp = new PIXI.Sprite(this.texPool); sp.anchor.set(0.5);
      sp.tint = this.groundInfo.season === 'winter' ? 0xb0505e : 0x6a1410;
      sp.alpha = this.groundInfo.season === 'winter' ? 0.55 : 0.62;
      sp.scale.set(d.r / 10 * 0.5, d.r / 10 * 0.5);
      sp.position.set(sx(d.x, d.y), sy(d.x, d.y, d.h || 0));
      sp.grow = d;
    } else if (d.kind === 'stub') {
      sp = new PIXI.Sprite(this.texStub); sp.anchor.set(0.5); sp.tint = 0x2a2420; sp.scale.set(0.42); sp.alpha = 0.75;
      sp.lazy = d;
    } else if (d.kind === 'scorch' || d.kind === 'specks') {
      const fs = d.f !== undefined ? this.sprites[d.f] : null, L = fs && fs.paint ? fs.paint.look : null;
      const mark = d.kind === 'scorch' && L && L.views.back && L.views.back.frames.includes('mark') ? PAINTLIB.frameTex('S', `${L.prefix}.${T.G[T.F[d.f].g].s < 0 ? 'back' : 'front'}.mark`) : null;
      if (mark) { // a painted Fire Sprite leaves its own scorch mark (its sheet's 'mark' cell)
        sp = new PIXI.Sprite(mark); sp.anchor.set(mark.pax, mark.pay); sp.scale.set(PAINT.wuPerPx.S * (d.flip ? -1 : 1), PAINT.wuPerPx.S); sp.alpha = 0.85;
      } else { sp = new PIXI.Sprite(this.texSoft); sp.anchor.set(0.5); sp.tint = 0x2a2018; sp.alpha = 0.45; sp.scale.set(0.35, 0.22); }
      sp.position.set(sx(d.x, d.y), sy(d.x, d.y, 0));
    } else if (d.kind === 'burnt') { // a breath's track on the ground
      sp = new PIXI.Sprite(this.texSoft); sp.anchor.set(0.5); sp.tint = 0x241c14; sp.alpha = 0.5; sp.scale.set(0.42 * d.s, 0.27 * d.s);
      sp.position.set(sx(d.x, d.y), sy(d.x, d.y, 0));
    } else if (d.kind === 'churn') {
      const cx = (d.x0 + d.x1) / 2;
      sp = new PIXI.Container();
      const n = Math.max(3, Math.round((d.x1 - d.x0) / 26));
      const rr = mulberry(d.key * 31 + 7);
      for (let i = 0; i < n; i++) {
        const x = lerp(d.x0, d.x1, (i + rr()) / n), y = d.y + (rr() - 0.5) * 20;
        const s1 = new PIXI.Sprite(this.texChurn); s1.anchor.set(0.5);
        s1.position.set(sx(x, y), sy(x, y, 0)); s1.rotation = 0.36; s1.scale.set(0.32 + rr() * 0.25, 0.9 + rr() * 0.6);
        s1.tint = 0x3a2a20; s1.alpha = 0.14;
        sp.addChild(s1);
        if (d.kills > 0) { const s2 = new PIXI.Sprite(this.texChurn); s2.anchor.set(0.5); s2.position.copyFrom(s1.position); s2.rotation = 0.36; s2.scale.set(s1.scale.x * 0.7, s1.scale.y * 0.8); s2.tint = this.groundInfo.season === 'winter' ? 0xb0505e : 0x7a1a12; s2.alpha = Math.min(0.35, 0.04 + 0.012 * d.kills); sp.addChild(s2); }
      }
      void cx;
    } else { sp = new PIXI.Container(); }
    sp.visible = false;
    ((d.h || 0) > 20 && this.T.wall ? this.wallDecals : this.decalLayer).addChild(sp);
    return sp;
  },
  /** Decal visibility by time; stubs need their projectile's landing point. */
  updateDecals(t, speed) {
    const T = this.T;
    for (let i = 0; i < T.decals.length; i++) {
      const d = T.decals[i], sp = this.decalSprites[i];
      let vis = t >= d.t;
      if (vis && d.item && !shownAt(d.item, speed)) vis = false;
      if (vis && d.kind === 'stub' && sp.lazy) {
        const pr = T.projectiles[d.proj];
        if (pr) { const e = this.projEnds(pr); sp.position.set(sx(e.x1, e.y1), sy(e.x1, e.y1, 0)); sp.rotation = e.rot; }
        sp.lazy = null;
      }
      if (vis && d.kind === 'pool') { const k = clamp((t - d.t) / d.grow, 0.2, 1); sp.scale.set(d.r / 10 * k, d.r / 10 * k); }
      sp.visible = vis;
    }
    for (const d of this.dropDecals) d.visible = !d.drop.none && t >= d.drop.t;
  },
  projEnds(pr) {
    if (pr.ends) return pr.ends;
    const T = this.T;
    const a = figPos(T, T.F[pr.from], pr.t0, { x: 0, y: 0, h: 0 });
    const b = figPos(T, T.F[pr.to], pr.t1, { x: 0, y: 0, h: 0 });
    const hit = pr.outcome !== 'miss';
    const x1 = hit ? b.x : b.x + pr.miss.dx, y1 = hit ? b.y : b.y + pr.miss.dy;
    const h1 = hit ? b.h + 14 : 0;
    const X0 = sx(a.x, a.y), X1 = sx(x1, y1), Y0 = sy(a.x, a.y, 0), Y1 = sy(x1, y1, 0);
    pr.ends = { x0: a.x, y0: a.y, h0: a.h + 18, x1, y1, h1, rot: Math.atan2(Y1 - Y0, X1 - X0) };
    return pr.ends;
  },
  pull(kind, tex, layer) {
    const arr = this.pool[kind];
    const i = this.poolUse[kind]++;
    if (i < arr.length) { const s = arr[i]; s.visible = true; if (s.texture !== tex) s.texture = tex; return s; }
    const s = new PIXI.Sprite(tex); s.anchor.set(0.5); layer.addChild(s); arr.push(s); return s;
  },
});
