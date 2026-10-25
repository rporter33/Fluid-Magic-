'use strict';
// ---- the Pixi scene (design 11.1) and the per-frame evaluation (11.2) ----

const FIG_SCALE = 28 / ART.figH; // world units per art px
const DISC_R = 64; // the baked contact-shadow disc's radius, world units
const ATLAS_CACHE = new Map(); // baked looks survive switching battles

class BattleStage {
  constructor(app, S, L, T) {
    this.app = app; this.S = S; this.L = L; this.T = T;
    const B = S.B;
    this.B = B;
    this.stage = new PIXI.Container();
    this.world = new PIXI.Container(); this.stage.addChild(this.world);
    // ground
    const tg = performance.now();
    const gp = paintGround(B, L, T);
    this.groundMs = performance.now() - tg;
    this.groundInfo = gp;
    const gtex = PIXI.Texture.from(gp.canvas);
    this.ground = new PIXI.Sprite(gtex);
    this.ground.position.set(gp.X0, gp.Y0); this.ground.scale.set(1 / gp.RES);
    this.world.addChild(this.ground);
    // the bodies, pools and gear left on the field: hundreds of sprites that rarely change, so Pixi keeps their
    // instructions between frames and rebuilds them only when one appears (skills audit B6)
    this.decalLayer = new PIXI.Container({ isRenderGroup: true }); this.world.addChild(this.decalLayer);
    // ground fx (skills audit B1): contact shadows as pooled sprites of one baked disc; commander rings as pooled
    // Graphics sharing one context per banner colour, built once and only moved; the rings whose size follows a block
    // (buffs, debuffs, hover, selection) in one small Graphics, redrawn only while one shows
    this.groundFx = new PIXI.Container(); this.world.addChild(this.groundFx);
    this.fxShadowLayer = new PIXI.Container(); this.fxCmdLayer = new PIXI.Container(); this.fxRingG = new PIXI.Graphics();
    this.groundFx.addChild(this.fxShadowLayer, this.fxCmdLayer, this.fxRingG);
    this.groundFx.clear = () => this.clearGroundFx(); // as Graphics.clear(): nothing drawn this frame (the audit harness uses it)
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
    this.bannerLayer = new PIXI.Container(); this.world.addChild(this.bannerLayer); // painted block standards
    // glyphs (skills audit B1): block pennants and the held/broke pips as pooled Graphics on shared contexts
    this.glyphG = new PIXI.Container(); this.world.addChild(this.glyphG);
    this.glyPennantLayer = new PIXI.Container(); this.glyPipLayer = new PIXI.Container();
    this.glyphG.addChild(this.glyPennantLayer, this.glyPipLayer);
    this.glyphG.clear = () => this.clearGlyphs();
    this.ctx = new Map(); // shared GraphicsContexts, built once per stage (ctxFor)
    this.objPool = {};
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
    this.texDisc = makeTex(app, (g) => g.circle(0, 0, DISC_R).fill(0xffffff)); // the contact shadows' ellipse
    // figure atlas: the battle's unit looks, one per (unit, side, cloth variant)
    const tc = performance.now();
    this.sideLooks = sideLooksOf(B);
    this.chooseMs = performance.now() - tc;
    // painted figures (stage B): which groups have art, the material variants of each side's troop pages
    this.paintMode = !!(PAINT_MODE.on && PAINTLIB && PAINTLIB.ready);
    if (this.paintMode) this.setupPaint();
    const looks = new Map();
    for (const g of S.groups) if (g.size < 3 && !(this.paint && this.paint.lookOf[g.idx])) looks.set(lookKey(B, g), { key: lookKey(B, g), unit: g.unit, pal: paletteFor(B, g.side) });
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
        // stage C: the body's painted idle cutout (the summoned commander's own face, the god's chassis and palette)
        const view = G.s < 0 ? 'back' : 'front';
        const fig = this.paintMode ? paintBigOf(B, g) : null;
        const painted = !!(fig && PAINTLIB.big[fig] && PAINTLIB.big[fig][view + 'S']);
        // Painted mode: a body still without art stays a procedural stand-in, toned down so it does not draw the eye
        // (critique-resume fix 11), its colours graded once at build rather than by a filter pass on every frame (skills audit B8)
        const tone = this.paintMode && !painted ? standInTone() : null;
        const body = painted ? makePaintedBig(fig, view) : makeBigBody(g.unit, paletteFor(B, g.side), tone);
        if (tone) this.standInToned = (this.standInToned || 0) + 1;
        body.root.zIndex = 0;
        this.units.addChild(body.root);
        const sh = new PIXI.Sprite(this.texShadow); sh.anchor.set(0.5); (g.flying ? this.skyShadows : this.shadows).addChild(sh);
        if (painted) { sh.visible = false; sh.alpha = 0; this.shadows.addChild(body.shadowSprite); }
        this.bigs.push({ f, body, shadow: sh, G, tint: tone ? tone.tint : null, fig: painted ? fig : null });
        this.sprites.push(null);
        continue;
      }
      const pk = this.paint ? this.paint.lookOf[g.idx] : null;
      const frames = pk ? null : this.atlas.get(lookKey(B, g));
      const sp = new PIXI.Sprite(pk ? PIXI.Texture.EMPTY : frames.ne[0]);
      sp.layer = this.layerFor(G);
      sp.anchor.set(FIG_ANCHOR.x, FIG_ANCHOR.y);
      const sc = FIG_SCALE * (g.isCmd ? 1.15 : 1);
      sp.scale.set(sc);
      sp.baseScale = sc;
      sp.frames = frames;
      if (pk) sp.paint = this.paintFigure(f, G, pk);
      sp.layer.addChild(sp);
      this.sprites.push(sp);
      if (G.kind === 'cloud') { const sh = new PIXI.Sprite(this.texShadow); sh.anchor.set(0.5); sh.scale.set(0.12); sh.alpha = 0.2; this.shadows.addChild(sh); this.flyShadows[f.id] = sh; }
    }
    // painted generals carry their nation's painted banner, as the procedural ones did (critique fix 6)
    this.genBanners = [];
    this.blockBanners = [];
    if (this.paint && PAINTLIB.banner) for (const G of T.G) {
      const k = this.paint.lookOf[G.idx], nat = B.sides[G.side].def;
      if (!k || !G.g.isCmd || G.g.size >= 3 || PAINT.looks[k].act !== 'rally' || !PAINTLIB.banner[nat]) continue;
      const sp = this.sprites[G.figs[0]];
      if (!sp) continue;
      const b = makePaintBanner(nat);
      b.G = G; b.sp = sp; b.root.visible = false;
      sp.layer.addChild(b.root);
      this.genBanners.push(b);
    }
    // the storm wall: segments sorted with the figures
    this.wallSegs = [];
    if (T.wall) this.buildWall();
    // decals
    this.decalSprites = T.decals.map((d) => this.makeDecal(d));
    this.decalShown = 0;
    // painted troops drop their weapon and shield where they turn to run (the sheet's 'dropped' cell)
    this.dropDecals = [];
    if (this.paint) {
      for (let i = 0; i < T.F.length; i++) {
        const sp = this.sprites[i], f = T.F[i];
        if (!sp || !sp.paint || !f.rout || sp.paint.look.kind !== 'troop') continue;
        const p = figPos(T, f, f.rout.t, { x: 0, y: 0, h: 0 });
        const d = new PIXI.Sprite(PIXI.Texture.EMPTY);
        d.tint = 0xc8c0b6; d.visible = false;
        d.drop = { t: f.rout.t + 0.15, x: p.x + sp.paint.vary.jx, y: p.y + sp.paint.vary.jy, h: p.h, sp, fi: i, mirror: u01(T.id + '/drop/' + f.id) < 0.5 };
        this.decalLayer.addChild(d); this.dropDecals.push(d);
      }
    }
    if (this.paint) this.applyPaintTier(this.paint.tier, true);
    // particle pools
    this.pool = { normal: [], add: [], proj: [], projSh: [] };
    this.lastT = -1;
    this.stats = { figures: 0, drawn: 0 };
    // the stage D magic pilot's effects layer (46-fx.js): Fireball and Entangle; the other spells keep drawSpells
    this.fx = FXLIB.ready ? new FxLayer(this) : null;
  }

  /**
   * Frees what this stage owns on the GPU (critique fix 4): the scene graph, the ground canvas
   * texture and the particle and decal textures. The baked figure atlas (ATLAS_CACHE) is kept.
   */
  dispose() {
    this.disposed = true;
    if (this.fx) this.fx.dispose();
    const own = [this.ground.texture, ...['texDot', 'texSoft', 'texDash', 'texStub', 'texPool', 'texShadow', 'texChurn', 'texDisc'].map((k) => this[k])];
    this.stage.destroy({ children: true }); // sprites let go of their textures first
    for (const tex of own) tex.destroy(true);
    for (const c of this.ctx.values()) c.destroy(); // the shared Graphics contexts (their Graphics are gone)
    // the painted variants are this battle's own render textures (the decoded pages are shared and kept)
    if (this.paint) for (const tier of ['S', 'H']) for (const side of Object.keys(this.paint.variants[tier])) for (const vs of this.paint.variants[tier][side]) {
      if (vs.cache) for (const t of vs.cache.values()) t.destroy(false);
      for (const rt of vs.rts || []) rt.destroy(true);
    }
  }

  // ---- painted figures ----
  setupPaint() {
    const B = this.B, S = this.S, T = this.T;
    const far = B.nearSide === 'attacker' ? 'defender' : 'attacker';
    const sl = PAINT_SIDE_LOOK_TABLE[sideLookKey(B)] || { near: 'base', far: 'base' };
    this.paint = { tier: 'S', lookOf: [], why: [], variants: { S: {}, H: {} }, tex: { S: new Map(), H: new Map() }, sideLooks: { near: sl.near, far: sl.far }, bakeMs: 0, standInMoments: 0 };
    for (const g of S.groups) { const r = paintLookOf(B, g); this.paint.lookOf[g.idx] = r.key; this.paint.why[g.idx] = r.key ? null : r.why; }
    this.paint.sideNation = { [B.nearSide]: B.sides[B.nearSide].def, [far]: B.sides[far].def };
    this.paint.sideWhich = { [B.nearSide]: sl.near, [far]: sl.far };
    this.bakePaintTier('S');
    // tier H is baked just after the first frame, not on its first use in the middle of a beat (critique fix 3)
    setTimeout(() => { if (!this.disposed && this.paint && !this.paint.tex.H.size) this.bakePaintTier('H'); }, 0);
    // the outro cheer, and each general's rallies: at deploy, on each round he holds, when one of his squads holds
    const outro = T.segments.find((s) => s.kind === 'outro');
    this.paint.cheerT = outro ? outro.t0 + 0.4 : null;
    const refIdx = new Map(S.groups.map((g) => [g.ref, g.idx]));
    this.paint.rally = [];
    for (const g of S.groups) {
      const k = this.paint.lookOf[g.idx];
      if (!k || !g.isCmd || PAINT.looks[k].act !== 'rally') continue;
      const times = [1.0];
      T.rounds.forEach((r, i) => { const sc = g.script && g.script[i]; if (sc && sc.kind === 'hold') times.push(r.t + 0.35); });
      for (const gl of T.glyphs) if (gl.kind === 'held' && S.groups[gl.g] && refIdx.get(S.groups[gl.g].leader) === g.idx) times.push(gl.t0 + 0.05);
      this.paint.rally[g.idx] = times.sort((a, b) => a - b);
    }
  }
  bakePaintTier(tier) {
    const P = this.paint, t0 = performance.now();
    for (const side of Object.keys(P.sideNation)) {
      const nat = P.sideNation[side];
      if (!PAINT.limits.cloth[nat]) continue;
      if (!this.S.groups.some((g) => g.side === side && P.lookOf[g.idx] && PAINT.looks[P.lookOf[g.idx]].kind === 'troop')) continue;
      P.variants[tier][side] = bakePaintVariants(this.app.renderer, tier, nat, P.sideWhich[side]);
    }
    for (const g of this.S.groups) {
      const k = P.lookOf[g.idx];
      if (!k) continue;
      const key = k + '/' + g.side;
      if (!P.tex[tier].has(key)) P.tex[tier].set(key, paintLookTextures(PAINTLIB, k, tier, P.variants[tier][g.side] || null));
    }
    P.bakeMs += performance.now() - t0;
  }
  paintFigure(f, G, key) {
    const look = PAINT.looks[key];
    return { key, look, vary: paintVary(this.T, f, G, look), texKey: key + '/' + G.side,
      extra: { cheerT: this.paint.cheerT, winner: this.B.winner, rally: this.paint.rally[G.idx] || null },
      deadPose: f.death && f.death.flip ? PP.deadB : PP.deadA }; // the falling sprite's own dead pose (critique fix 4)
  }
  /** Tier S below a man of PAINT_TIER_UP device px, tier H above (with hysteresis); tier H is baked on first use. */
  paintTierFor() {
    const px = 28 * this.world.scale.x * this.app.renderer.resolution;
    const cur = this.paint.tier;
    return cur === 'S' ? (px > PAINT_TIER_UP ? 'H' : 'S') : (px < PAINT_TIER_DOWN ? 'S' : 'H');
  }
  applyPaintTier(tier, force) {
    const P = this.paint;
    if (!force && P.tier === tier) return;
    if (!P.tex[tier].size) this.bakePaintTier(tier);
    P.tier = tier;
    for (const bb of this.bigs) if (bb.body.painted) bb.body.setTier(tier);
    // bodies and dropped gear already on the ground take the tier's frames
    for (const d of this.paintDecals || []) this.paintDecalTex(d);
    for (const d of this.dropDecals) {
      const sp = d.drop.sp, V = P.tex[tier].get(sp.paint.texKey), view = this.T.G[this.T.F[d.drop.fi].g].s < 0 ? 'front' : 'back';
      const vv = V[view] || V.back || V.front, arr = vv.v[sp.paint.vary.variant] || vv.v[0], tx = arr[PP.dropped];
      if (!tx || tx === arr[PP.stand]) { d.texture = PIXI.Texture.EMPTY; d.drop.none = true; continue; }
      d.texture = tx; d.anchor.set(0.5, 0.5);
      const k = PAINT.wuPerPx[tier]; d.scale.set(k * (d.drop.mirror ? -1 : 1), k);
      d.position.set(sx(d.drop.x, d.drop.y), sy(d.drop.x, d.drop.y, d.drop.h));
    }
  }
  paintDecalTex(d) {
    const P = this.paint, sp = d.pdecal.sp, pd = sp.paint;
    const V = P.tex[P.tier].get(pd.texKey);
    const view = d.pdecal.view === 'ne' ? 'back' : 'front';
    const vv = V[view] || V[view === 'back' ? 'front' : 'back'];
    let mirror = d.pdecal.view === 'ne' ? d.pdecal.flip : !d.pdecal.flip;
    if (vv.standIn) mirror = !mirror;
    const arr = vv.v[pd.vary.variant] || vv.v[0];
    const tx = arr[pd.deadPose] || arr[PP.stand];
    d.texture = tx; d.anchor.set(tx.pax, tx.pay);
    const k = PAINT.wuPerPx[P.tier] * pd.vary.scale;
    d.scale.set(k * (mirror ? -1 : 1), k);
  }

  /**
   * One look's frames again after its frame set changed (the Wolf Rider front control): its textures at every tier
   * already baked, and the bodies of it already on the ground. Nothing else is touched.
   */
  refreshLook(key) {
    const P = this.paint;
    if (!P) return;
    for (const tier of ['S', 'H']) {
      if (!P.tex[tier].size) continue; // not baked yet: it will be made with the new set
      for (const g of this.S.groups) {
        if (P.lookOf[g.idx] !== key) continue;
        P.tex[tier].set(key + '/' + g.side, paintLookTextures(PAINTLIB, key, tier, P.variants[tier][g.side] || null));
      }
    }
    for (const d of this.paintDecals || []) if (d.pdecal.sp.paint.key === key) this.paintDecalTex(d);
  }

  /** Storms: defenders on the rampart stand in the wall's own layer; the courtyard is behind it. */
  layerFor(G) {
    if (!this.T.wall) return this.units;
    if (G.onWall) return this.walkUnits;
    if (G.side === 'defender') return this.behind;
    return this.units;
  }

}
