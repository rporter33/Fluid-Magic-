'use strict';
// ---- the Pixi scene (design 11.1) and the per-frame evaluation (11.2) ----

const FIG_SCALE = 28 / ART.figH; // world units per art px
const ATLAS_CACHE = new Map(); // baked looks survive switching battles

function paletteFor(B, side) {
  const n = B.sides[side];
  return PALETTES[n.def || 'independent'] || PALETTES.independent;
}

function makeTex(app, draw, w, h) {
  const g = new PIXI.Graphics();
  draw(g);
  return app.renderer.generateTexture({ target: g, resolution: 2, antialias: true });
}

class BattleStage {
  constructor(app, S, L, T) {
    this.app = app; this.S = S; this.L = L; this.T = T;
    const B = S.B;
    this.B = B;
    this.stage = new PIXI.Container();
    this.world = new PIXI.Container(); this.stage.addChild(this.world);
    // ground
    const gp = paintGround(B, L, T);
    this.groundInfo = gp;
    const gtex = PIXI.Texture.from(gp.canvas);
    this.ground = new PIXI.Sprite(gtex);
    this.ground.position.set(gp.X0, gp.Y0); this.ground.scale.set(1 / gp.RES);
    this.world.addChild(this.ground);
    this.decalLayer = new PIXI.Container(); this.world.addChild(this.decalLayer);
    this.groundFx = new PIXI.Graphics(); this.world.addChild(this.groundFx);
    this.shadows = new PIXI.Container(); this.world.addChild(this.shadows);
    this.projShadow = new PIXI.Container(); this.world.addChild(this.projShadow);
    this.behind = new PIXI.Container(); this.behind.sortableChildren = true; this.world.addChild(this.behind);
    this.wallLayer = new PIXI.Container(); this.world.addChild(this.wallLayer);
    this.wallDecals = new PIXI.Container();
    this.walkUnits = new PIXI.Container(); this.walkUnits.sortableChildren = true;
    this.units = new PIXI.Container(); this.units.sortableChildren = true; this.world.addChild(this.units);
    this.skyShadows = new PIXI.Container(); this.world.addChild(this.skyShadows); // flyers' shadows fall on the troops too
    this.seeThrough = new PIXI.Container(); this.world.addChild(this.seeThrough);
    this.proj = new PIXI.Container(); this.world.addChild(this.proj);
    this.fxNormal = new PIXI.Container(); this.world.addChild(this.fxNormal);
    this.fxAdd = new PIXI.Container(); this.fxAdd.blendMode = 'add'; this.world.addChild(this.fxAdd);
    this.spellG = new PIXI.Graphics(); this.world.addChild(this.spellG);
    this.spellAdd = new PIXI.Graphics(); this.spellAdd.blendMode = 'add'; this.world.addChild(this.spellAdd);
    this.glyphG = new PIXI.Graphics(); this.world.addChild(this.glyphG);
    this.overlay = new PIXI.Graphics(); this.stage.addChild(this.overlay);
    this.grade = new PIXI.ColorMatrixFilter();
    this.gradeOn = false;
    // textures
    const R = app.renderer;
    this.texDot = makeTex(app, (g) => g.circle(0, 0, 4).fill(0xffffff));
    this.texSoft = makeTex(app, (g) => { for (let i = 8; i > 0; i--) g.circle(0, 0, i * 4).fill({ color: 0xffffff, alpha: 0.12 }); });
    this.texDash = makeTex(app, (g) => g.rect(-6, -1, 12, 2).fill(0xffffff));
    this.texStub = makeTex(app, (g) => { g.rect(-4, -0.6, 8, 1.2).fill(0xffffff); g.rect(-5, -1.4, 2, 2.8).fill(0xffffff); });
    this.texPool = makeTex(app, (g) => { g.ellipse(0, 0, 10, 6.4).fill({ color: 0xffffff, alpha: 0.9 }); g.ellipse(6, 3, 4, 2.4).fill({ color: 0xffffff, alpha: 0.8 }); g.ellipse(-7, -2, 3, 2).fill({ color: 0xffffff, alpha: 0.7 }); });
    this.texShadow = makeTex(app, (g) => { for (let i = 10; i > 0; i--) g.ellipse(0, 0, i * 5, i * 5 * 0.643).fill({ color: 0x000000, alpha: 0.06 }); });
    this.texChurn = makeTex(app, (g) => { for (let i = 12; i > 0; i--) g.ellipse(0, 0, i * 6, i * 1.6).fill({ color: 0xffffff, alpha: 0.05 }); });
    // figure atlas: the battle's unit looks, one per (unit, side)
    const looks = new Map();
    for (const g of S.groups) if (g.size < 3) looks.set(g.unit + '/' + g.side, { key: g.unit + '/' + g.side, unit: g.unit, pal: paletteFor(B, g.side) });
    const t0 = performance.now();
    const missing = [...looks.values()].filter((l) => !ATLAS_CACHE.has(l.key));
    for (const [k, v] of bakeFigures(R, missing)) ATLAS_CACHE.set(k, v);
    this.atlas = new Map([...looks.keys()].map((k) => [k, ATLAS_CACHE.get(k)]));
    this.bakeMs = performance.now() - t0;
    // figure sprites
    this.sprites = [];
    this.flyShadows = [];
    this.bigs = [];
    for (const f of T.F) {
      const G = T.G[f.g];
      const g = G.g;
      if (g.size >= 3) {
        const body = makeBigBody(g.unit, paletteFor(B, g.side));
        body.root.zIndex = 0;
        this.units.addChild(body.root);
        const sh = new PIXI.Sprite(this.texShadow); sh.anchor.set(0.5); (g.flying ? this.skyShadows : this.shadows).addChild(sh);
        this.bigs.push({ f, body, shadow: sh, G });
        this.sprites.push(null);
        continue;
      }
      const frames = this.atlas.get(g.unit + '/' + g.side);
      const sp = new PIXI.Sprite(frames.ne[0]);
      sp.layer = this.layerFor(G);
      sp.anchor.set(FIG_ANCHOR.x, FIG_ANCHOR.y);
      const sc = FIG_SCALE * (g.isCmd ? 1.15 : 1);
      sp.scale.set(sc);
      sp.baseScale = sc;
      sp.frames = frames;
      sp.layer.addChild(sp);
      this.sprites.push(sp);
      if (G.kind === 'cloud') { const sh = new PIXI.Sprite(this.texShadow); sh.anchor.set(0.5); sh.scale.set(0.12); sh.alpha = 0.2; this.shadows.addChild(sh); this.flyShadows[f.id] = sh; }
    }
    // the storm wall: segments sorted with the figures
    this.wallSegs = [];
    if (T.wall) this.buildWall();
    // decals
    this.decalSprites = T.decals.map((d) => this.makeDecal(d));
    this.decalShown = 0;
    // particle pools
    this.pool = { normal: [], add: [], proj: [], projSh: [] };
    this.lastT = -1;
    this.stats = { figures: 0, drawn: 0 };
  }

  /** Storms: defenders on the rampart stand in the wall's own layer; the courtyard is behind it. */
  layerFor(G) {
    if (!this.T.wall) return this.units;
    if (G.onWall) return this.walkUnits;
    if (G.side === 'defender') return this.behind;
    return this.units;
  }

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
    top.poly([...P(x0, s * depth, w.h), ...P(x1, s * depth, w.h), ...P(x1, s * (depth - 4), w.h + 5), ...P(x0, s * (depth - 4), w.h + 5)]).fill(0x7a7066);
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
  }

  makeDecal(d) {
    const T = this.T;
    let sp;
    if (d.kind === 'body') {
      const f = T.F[d.f];
      const G = T.G[f.g];
      if (G.g.size >= 3) { sp = new PIXI.Container(); sp.visible = false; this.decalLayer.addChild(sp); return sp; }
      const frames = this.atlas.get(G.g.unit + '/' + G.g.side);
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
      sp = new PIXI.Sprite(this.texSoft); sp.anchor.set(0.5); sp.tint = 0x2a2018; sp.alpha = 0.45; sp.scale.set(0.35, 0.22);
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
        s1.tint = 0x3a2a20; s1.alpha = 0.07;
        sp.addChild(s1);
        if (d.kills > 0) { const s2 = new PIXI.Sprite(this.texChurn); s2.anchor.set(0.5); s2.position.copyFrom(s1.position); s2.rotation = 0.36; s2.scale.set(s1.scale.x * 0.7, s1.scale.y * 0.8); s2.tint = this.groundInfo.season === 'winter' ? 0xb0505e : 0x7a1a12; s2.alpha = Math.min(0.12, 0.006 * d.kills + 0.03); sp.addChild(s2); }
      }
      void cx;
    } else { sp = new PIXI.Container(); }
    sp.visible = false;
    ((d.h || 0) > 20 && this.T.wall ? this.wallDecals : this.decalLayer).addChild(sp);
    return sp;
  }

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
  }

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
  }

  pull(kind, tex, layer) {
    const arr = this.pool[kind];
    const i = this.poolUse[kind]++;
    if (i < arr.length) { const s = arr[i]; s.visible = true; if (s.texture !== tex) s.texture = tex; return s; }
    const s = new PIXI.Sprite(tex); s.anchor.set(0.5); layer.addChild(s); arr.push(s); return s;
  }

  /** Draws story time t. */
  frame(t, speed, view) {
    const T = this.T, S = this.S;
    const tmp = { x: 0, y: 0, h: 0 };
    this.poolUse = { normal: 0, add: 0, proj: 0, projSh: 0 };
    let drawn = 0;
    // ---- figures ----
    for (let i = 0; i < T.F.length; i++) {
      const f = T.F[i];
      const sp = this.sprites[i];
      if (!sp) continue;
      const G = T.G[f.g];
      const st = evalFigure(T, f, G, t, speed, tmp);
      if (!st.vis) { sp.visible = false; const sh = this.flyShadows[i]; if (sh) sh.visible = false; continue; }
      sp.visible = true; drawn++;
      const frames = sp.frames[st.view];
      const tex = frames[st.frame];
      if (sp.texture !== tex) sp.texture = tex;
      sp.position.set(sx(st.x, st.y), sy(st.x, st.y, st.h));
      sp.scale.x = st.flip ? -sp.baseScale : sp.baseScale;
      sp.tint = st.tint; sp.alpha = st.alpha;
      sp.curView = st.view;
      sp.zIndex = st.key;
      const sh = this.flyShadows[i];
      if (sh) { sh.visible = st.h > 4; sh.position.set(sx(st.x, st.y) + st.h * 0.25, sy(st.x, st.y, 0) + st.h * 0.1); sh.alpha = 0.22 - st.h / 900; }
    }
    // ---- big bodies ----
    for (const bb of this.bigs) this.updateBig(bb, t, speed);
    this.stats.drawn = drawn;
    this.seeThroughPass();
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
        const s = add ? this.pull('add', this.texDot, this.fxAdd) : this.pull('normal', this.texDot, this.fxNormal);
        s.position.set(sx(ox + dx, oy + dy), sy(ox + dx, oy + dy, Math.max(0, b.kind === 'dust' ? 4 + age * 10 : hh)));
        const fade = 1 - age / life;
        if (b.kind === 'blood') { s.tint = 0x7a1410; s.scale.set(0.32); s.alpha = 0.9 * fade; }
        else if (b.kind === 'spark') { s.tint = 0xfff0b0; s.scale.set(0.22); s.alpha = fade; }
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
  }

  /** Figures a nearer big body covers are drawn again above it as dark silhouettes (design 6). */
  seeThroughPass() {
    let used = 0;
    const pool = this.pool.see || (this.pool.see = []);
    const w = this.world;
    for (const bb of this.bigs) {
      const r = bb.body.root;
      if (!r.visible) continue;
      const b = r.getBounds();
      const ix = (b.maxX - b.minX) * 0.18, iy = (b.maxY - b.minY) * 0.12;
      const X0 = (b.minX + ix - w.x) / w.scale.x, X1 = (b.maxX - ix - w.x) / w.scale.x;
      const Y0 = (b.minY + iy - w.y) / w.scale.y, Y1 = (b.maxY - iy - w.y) / w.scale.y;
      for (const sp of this.sprites) {
        if (!sp || !sp.visible || sp.layer !== this.units || sp.zIndex >= r.zIndex) continue;
        if (sp.x < X0 || sp.x > X1 || sp.y - 24 > Y1 || sp.y < Y0) continue;
        let s2 = pool[used];
        if (!s2) { s2 = new PIXI.Sprite(); s2.anchor.set(FIG_ANCHOR.x, FIG_ANCHOR.y); this.seeThrough.addChild(s2); pool.push(s2); }
        used++;
        s2.visible = true;
        s2.texture = sp.frames[sp.curView][FR.white];
        s2.position.copyFrom(sp.position); s2.scale.copyFrom(sp.scale);
        s2.tint = 0x1c1a17; s2.alpha = 0.35;
      }
    }
    for (let i = used; i < pool.length; i++) pool[i].visible = false;
    this.stats.seeThrough = used;
  }

  updateBig(bb, t, speed) {
    const { f, body, shadow, G } = bb;
    const T = this.T;
    const g = G.g;
    const p = figPos(T, f, t, { x: 0, y: 0, h: 0 });
    const vis = t >= G.appear;
    body.root.visible = vis; shadow.visible = vis;
    if (!vis) return;
    // action
    let act = null, k = 0;
    for (const s of f.shots) if (t >= s.t && t < s.t + (s.dur || 0.8)) { act = s.kind === 'breath' ? 'breath' : 'cast'; k = (t - s.t) / (s.dur || 0.8); }
    for (const s of f.strikes) {
      const a = s.t - s.wind, b = s.t + s.strike + s.rec;
      if (t >= a && t < b && shownAt(s.item, speed)) { act = g.unit === 'treant' ? 'slam' : 'bite'; k = (t - a) / (b - a); }
    }
    for (const r of f.reacts) if (t >= r.t && t < r.t + 0.18 && r.kind !== 'dodge') { if (!act) act = 'hit'; }
    let h = p.h;
    const flying = g.flying;
    if (flying && act === 'bite' && !f.death) h = Math.max(10, h - 100 * Math.sin(Math.PI * clamp(k, 0, 1)));
    if (flying && !f.death) h += Math.sin(t * TAU * 0.5) * 6;
    // facing: toward the nearest enemy front (screen left or right)
    let face = G.s < 0 ? 1 : -1;
    const tgt = f.strikes.find((s) => t >= s.t - 1.2 && t < s.t + 0.6);
    if (tgt) { const q = figPos(T, T.F[tgt.tf], t, { x: 0, y: 0, h: 0 }); face = sx(q.x, q.y) >= sx(p.x, p.y) ? 1 : -1; }
    body.root.scale.x = face;
    let x = p.x, y = p.y;
    const dead = f.death && t >= f.death.t;
    const deadK = dead ? clamp((t - f.death.t) / f.death.fall, 0, 1) : 0;
    body.pose({ t: dead ? f.death.t + f.phase * 10 : t + f.phase * 10, h, flying: flying && !dead, act: dead ? null : act, k, moving: false, dead, deadK });
    body.root.position.set(sx(x, y), sy(x, y, h));
    body.root.zIndex = depthKey(x, y) + (flying && h > 30 ? 0.5 : 0);
    if (dead) {
      const q = clamp((t - f.death.t) / f.death.fall, 0, 1);
      body.root.rotation = face * 0.18 * q;
      body.root.alpha = 1;
      body.root.tint = mix(0xffffff, 0x5a544e, q);
    } else { body.root.rotation = 0; body.root.tint = act === 'hit' ? 0xffd0c0 : 0xffffff; }
    // soft shadow on the ground, offset toward the lower right
    const H = LAYOUT.sizeH[g.size] || 64;
    shadow.position.set(sx(x, y) + 0.25 * H * 0.5 + h * 0.5, sy(x, y, 0) + 6 + h * 0.15);
    const sc = (LAYOUT.footR[g.size] * 1.4) / 50 * (g.unit === 'greatWyrm' ? 2.6 : 1.4) * (1 - h / 400);
    shadow.scale.set(sc * 1.2, sc * 0.9);
    shadow.alpha = flying ? 0.35 - h / 800 : 0.35;
  }

  drawGroundFx(t, view) {
    const T = this.T, gx = this.groundFx;
    gx.clear();
    const tmp = { x: 0, y: 0, h: 0 };
    // soft contact shadows under every block, so the masses sit on the ground
    for (const G of T.G) {
      if (G.kind === 'commander' || G.kind === 'body' || G.kind === 'cloud' || G.onWall) continue;
      if (t < G.appear || (G.leaveT !== null && t >= G.leaveT)) continue;
      const hull = this.hull(G, t);
      if (!hull) continue;
      for (let k = 0; k < 2; k++) gx.ellipse(hull.X + 4, hull.Y + 3, hull.rx - 2 - k * 6, hull.ry - k * 4).fill({ color: 0x1c1a17, alpha: 0.035 });
    }
    // commander base rings: the only figures with a ring, in the banner color
    for (const G of T.G) {
      const g = G.g;
      if (!g.isCmd || g.size >= 3) continue;
      const f = T.F[G.figs[0]];
      if (f.death && t >= f.death.t) continue;
      if (G.leaveT !== null && t >= G.leaveT) continue;
      figPos(T, f, t, tmp);
      const X = sx(tmp.x, tmp.y), Y = sy(tmp.x, tmp.y, tmp.h);
      const col = hexToNum(this.B.sides[g.side].banner);
      gx.ellipse(X, Y, 19, 19 * 0.643).stroke({ width: 3.4, color: INK, alpha: 0.6 });
      gx.ellipse(X, Y, 19, 19 * 0.643).stroke({ width: 2, color: col, alpha: 0.95 });
    }
    // buff and debuff rings under blocks
    for (const rg of T.rings) {
      if (t < rg.t0 || t >= rg.t1) continue;
      const G = T.G[rg.g];
      if (!G || countAt(T, rg.g, t) === 0) continue;
      const hull = this.hull(G, t);
      if (!hull) continue;
      const a = clamp((t - rg.t0) / 0.4, 0, 1) * (0.5 - 0.4 * clamp((t - rg.t0 - 1.5) / 2, 0, 1));
      if (rg.debuff) for (let k = 0; k < 24; k += 2) gx.arc(hull.X, hull.Y, hull.rx + 6, (k / 24) * TAU, ((k + 1) / 24) * TAU).stroke({ width: 1.6, color: rg.color, alpha: a });
      else gx.ellipse(hull.X, hull.Y, hull.rx, hull.ry).stroke({ width: 1.4, color: rg.color, alpha: a });
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
    }
  }

  /** A block's ground hull at t, in the screen plane (centre and ellipse radii). */
  hull(G, t) {
    const T = this.T;
    let X0 = Infinity, X1 = -Infinity, Y0 = Infinity, Y1 = -Infinity, n = 0;
    const tmp = { x: 0, y: 0, h: 0 };
    for (const fi of G.figs) {
      const f = T.F[fi];
      if (f.death && t >= f.death.t) continue;
      if (t < G.appear) continue;
      figPos(T, f, t, tmp);
      const X = sx(tmp.x, tmp.y), Y = sy(tmp.x, tmp.y, G.onWall ? T.wall.h : 0);
      X0 = Math.min(X0, X); X1 = Math.max(X1, X); Y0 = Math.min(Y0, Y); Y1 = Math.max(Y1, Y); n++;
    }
    if (!n) return null;
    const big = G.g.size >= 3 ? LAYOUT.footR[G.g.size] : 8;
    return { X: (X0 + X1) / 2, Y: (Y0 + Y1) / 2, rx: (X1 - X0) / 2 + big, ry: (Y1 - Y0) / 2 + big * 0.643 };
  }

  drawSpells(t, speed) {
    const T = this.T, g = this.spellG, ga = this.spellAdd;
    g.clear(); ga.clear();
    const tmp = { x: 0, y: 0, h: 0 }, tmp2 = { x: 0, y: 0, h: 0 };
    for (const fx of T.spellFx) {
      if (t < fx.t0 || t > fx.t1 + 0.6) continue;
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
            g.moveTo(CX, CY + 18).lineTo(lerp(CX, h.X, k), lerp(CY + 18, h.Y, k)).stroke({ width: 3, color: 0x3a2a1a, alpha: 0.8 });
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
          else if (kind === 'column') { const top = 120; ga.rect(h.X - 8, h.Y - top, 16, top).fill({ color: col, alpha: 0.35 * (1 - k) }); g.ellipse(h.X, h.Y, h.rx * 0.6, h.ry * 0.6).fill({ color: col, alpha: 0.18 * (1 - k) }); }
          else if (kind === 'crack') { for (let j = 0; j < 6; j++) { const a = j * 1.1; g.moveTo(h.X + Math.cos(a) * 6, h.Y + Math.sin(a) * 4).lineTo(h.X + Math.cos(a) * 12, h.Y + Math.sin(a) * 8 - 14 * (1 - k)).stroke({ width: 2.4, color: 0x5a7a2a, alpha: 1 - k }); } }
          else if (kind === 'leaves') { for (let j = 0; j < 10; j++) { const a = j * 0.63 + k * 6; ga.circle(h.X + Math.cos(a) * (h.rx * 0.6), h.Y + Math.sin(a) * (h.ry * 0.6) - 20 * k, 2.5).fill({ color: 0x9bc06a, alpha: 0.8 * (1 - k) }); } }
          else if (kind === 'bolt' || kind === 'tendril') ga.circle(h.X, h.Y - 10, 16 * (1 - k)).fill({ color: col, alpha: 0.5 * (1 - k) });
          else if (kind === 'summon') { for (let j = 0; j < 14; j++) { const a = j * 0.45 + k * 4; ga.circle(h.X + Math.cos(a) * 30 * k, h.Y - 30 * k + Math.sin(a) * 12, 1.6).fill({ color: 0xe0c040, alpha: 1 - k }); } }
        }
      }
    }
    void tmp2; void speed;
  }

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
    // a soft cone under the particles
    ga.poly([MX + nx * 4, MY + ny * 4, AX + nx * 36, AY + ny * 22, AX - nx * 36, AY - ny * 22, MX - nx * 4, MY - ny * 4]).fill({ color: col, alpha: 0.16 * fade });
    for (let j = 0; j < 46; j++) {
      const q = Math.pow(r(), 0.8);
      const spread = (r() - 0.5) * 2 * (6 + 34 * q);
      const X = MX + dx * q + nx * spread + Math.sin(t * 30 + j) * 2, Y = MY + dy * q + ny * spread * 0.7;
      const rad = 3 + 13 * q;
      const c = q < 0.25 ? 0xfff6c8 : j % 3 ? col : 0xffe28a;
      ga.circle(X, Y, rad).fill({ color: c, alpha: (0.22 + 0.18 * (1 - q)) * fade });
    }
    ga.circle(AX, AY, 26).fill({ color: col, alpha: 0.22 * fade });
    g.ellipse(AX, AY + 4, 40, 24).fill({ color: 0x000000, alpha: 0.06 * fade });
  }

  drawGlyphs(t) {
    const T = this.T, g = this.glyphG;
    g.clear();
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
      const col = hexToNum(this.B.sides[G.side].banner);
      const X = best.x - 4, Y = best.y - 30;
      g.moveTo(X, Y + 14).lineTo(X, Y - 10).stroke({ width: 1.6, color: INK, alpha: 0.9 });
      const w = Math.sin(t * 3 + G.idx) * 1.2;
      g.poly([X, Y - 10, X + 11, Y - 7 + w, X, Y - 3]).fill(col).stroke({ width: 0.8, color: INK, alpha: 0.8 });
    }
    for (const gl of T.glyphs) {
      if (t < gl.t0 || t >= gl.t1) continue;
      const G = T.G[gl.g];
      const h = this.hull(G, t);
      if (!h) continue;
      const a = clamp((t - gl.t0) / 0.15, 0, 1) * clamp((gl.t1 - t) / 0.3, 0, 1);
      const X = h.X, Y = h.Y - h.ry - 34;
      // a wordless pip: shield with a tick (held) or a broken shield (broke)
      g.roundRect(X - 9, Y - 10, 18, 20, 6).fill({ color: 0x14120f, alpha: 0.72 * a });
      g.poly([X - 5, Y - 6, X + 5, Y - 6, X + 5, Y + 1, X, Y + 6, X - 5, Y + 1]).fill({ color: gl.kind === 'held' ? 0x9bd3a2 : 0xd9543a, alpha: a });
      if (gl.kind === 'held') g.moveTo(X - 3, Y - 1).lineTo(X - 0.5, Y + 2).lineTo(X + 3.5, Y - 3).stroke({ width: 1.6, color: 0x14120f, alpha: a });
      else g.moveTo(X - 1, Y - 6).lineTo(X + 1, Y - 1).lineTo(X - 1, Y + 6).stroke({ width: 1.6, color: 0x14120f, alpha: a });
    }
  }
}

// ---- figure state at t (pure) ----
function evalFigure(T, f, G, t, speed, tmp) {
  const st = { vis: true, x: 0, y: 0, h: 0, view: 'ne', flip: false, frame: 0, tint: 0xffffff, alpha: 1, key: 0 };
  if (t < G.appear) { st.vis = false; return st; }
  const p = figPos(T, f, t, tmp);
  st.x = p.x; st.y = p.y; st.h = p.h;
  const near = G.s < 0;
  st.view = near ? 'ne' : 'se'; st.flip = !near;
  // leaving the field
  if (G.leaveT !== null && t >= G.leaveT) { st.vis = false; return st; }
  if (G.leaveT !== null && t >= G.leaveT - 0.6) st.alpha = clamp((G.leaveT - t) / 0.6, 0, 1);
  if (G.appear > 0 && t < G.appear + 0.6) st.alpha *= clamp((t - G.appear) / 0.6, 0, 1);
  if (G.kind === 'cloud') st.h += 6 * Math.sin(TAU * 0.8 * t + f.phase * TAU);
  // dead or falling
  if (f.death && t >= f.death.t) {
    const k = (t - f.death.t) / f.death.fall;
    if (k >= 1) { st.vis = false; return st; }
    st.frame = k < 0.5 ? FR.fall : FR.fall + 1;
    st.key = depthKey(st.x, st.y);
    st.flip = st.flip !== f.death.flip ? !st.flip : st.flip;
    return st;
  }
  // routing: away from the enemy, running
  const r = f.rout;
  if (r && t >= r.t) {
    st.view = near ? 'se' : 'ne'; st.flip = near;
    const run = t * 9 + f.phase * 4;
    st.frame = FR.walk + (Math.floor(run) & 3);
  } else {
    // moving with the block
    const seg = activeSeg(G.path, t);
    const moving = seg && (Math.abs(seg.x1 - seg.x0) + Math.abs(seg.y1 - seg.y0) > 2);
    let frame;
    if (moving) {
      const sideways = Math.abs(seg.x1 - seg.x0) > Math.abs(seg.y1 - seg.y0) * 1.5;
      if (sideways) { const right = seg.x1 > seg.x0; st.view = right ? 'se' : 'ne'; st.flip = !right; }
      frame = FR.walk + (Math.floor(t * 6 + f.phase * 4) & 3);
    } else frame = (Math.floor(t / (1.2 + 0.8 * f.phase) + f.phase * 3) & 1) ? FR.idle1 : FR.idle;
    // shooting or casting
    for (let i = f.shots.length - 1; i >= 0; i--) {
      const s = f.shots[i];
      if (t < s.t) continue;
      if (t > s.tRel + 0.3) break;
      if (s.item && !shownAt(s.item, speed)) break;
      frame = t < s.tRel ? FR.shoot : t < s.tRel + 0.12 ? FR.shoot + 1 : FR.shoot + 2;
      break;
    }
    // striking (duels only; lunge toward the real target)
    for (let i = f.strikes.length - 1; i >= 0; i--) {
      const s = f.strikes[i];
      if (t >= s.t + s.strike + s.rec) break;
      if (t < s.t - s.wind) continue;
      if (!shownAt(s.item, speed)) continue;
      const q = figPos(T, T.F[s.tf], s.t, { x: 0, y: 0, h: 0 });
      let dx = q.x - st.x, dy = q.y - st.y; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
      let lk;
      if (t < s.t) { frame = FR.atk; lk = -0.25 * ((t - (s.t - s.wind)) / s.wind); }
      else if (t < s.t + s.strike) { frame = (s.t * 7) % 2 > 1 ? FR.atk + 3 : FR.atk + 1; lk = 1; }
      else { frame = FR.atk + 2; lk = 1 - (t - s.t - s.strike) / s.rec; }
      const lunge = Math.min(s.lunge, dl * 0.6) * 0.5;
      st.x += dx * lunge * lk; st.y += dy * lunge * lk;
      // face the target (screen right or left)
      const right = sx(dx, dy) >= 0;
      if (near) { st.view = sy(dx, dy, 0) < 0 ? 'ne' : 'se'; st.flip = !right; } else { st.view = sy(dx, dy, 0) < 0 ? 'ne' : 'se'; st.flip = !right; }
      break;
    }
    // reactions: flash, flinch, dodge
    for (let i = f.reacts.length - 1; i >= 0; i--) {
      const rc = f.reacts[i];
      if (t < rc.t) continue;
      if (t > rc.t + 0.2) break;
      if (rc.item && !shownAt(rc.item, speed) && rc.kind !== 'kill') break;
      if (rc.kind === 'wound' || rc.kind === 'blocked') {
        frame = t < rc.t + 0.05 && rc.kind === 'wound' ? FR.whiteFlinch : FR.flinch;
        st.y += G.s * 2.5 * (1 - (t - rc.t) / 0.2);
      } else if (rc.kind === 'dodge') st.x += 3 * Math.sin(Math.PI * (t - rc.t) / 0.2) * (f.phase < 0.5 ? 1 : -1);
      break;
    }
    st.frame = frame;
  }
  // wound tint (detailed mode): (1, 1 - 0.35w, 1 - 0.35w)
  let w = 0;
  for (const wd of f.wounds) { if (wd.t <= t) w = wd.w; else break; }
  if (w > 0 && st.frame !== FR.whiteFlinch) { const gb = Math.round(255 * (1 - 0.35 * w)); st.tint = (255 << 16) | (gb << 8) | gb; }
  st.key = depthKey(st.x, st.y) + (G.onWall ? 0.0 : 0);
  if (G.onWall && T.wall) st.key = depthKey(st.x, 0) + 0.02 + (Math.abs(st.y) / 1000);
  return st;
}
function activeSeg(path, t) {
  for (let i = path.length - 1; i >= 0; i--) { const s = path[i]; if (s.t0 <= t) return t < s.t1 ? s : null; }
  return null;
}
