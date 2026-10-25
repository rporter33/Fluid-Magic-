'use strict';
// ---- the Pixi scene (design 11.1) and the per-frame evaluation (11.2) ----

const FIG_SCALE = 28 / ART.figH; // world units per art px
const DISC_R = 64; // the baked contact-shadow disc's radius, world units
const ATLAS_CACHE = new Map(); // baked looks survive switching battles

function basePalette(B, side) {
  const n = B.sides[side];
  return PALETTES[n.def || 'independent'] || PALETTES.independent;
}
/**
 * Cloth variants a side may wear. The armies must part by CIEDE2000 >= CVD_MIN under protan and
 * deutan vision as rendered (critique fix 6), and each must stay 15 L* below its ground (design 3.8).
 */
const PAL_VARIANTS = {
  base: (p) => p,
  mid: (p) => ({ ...p, cloth: mix(p.cloth, p.clothLight, 0.55), clothDark: mix(p.clothDark, p.cloth, 0.5) }),
  light: (p) => ({ ...p, cloth: p.clothLight, clothDark: p.cloth, clothLight: shade(p.clothLight, 0.2) }),
  dark: (p) => ({ ...p, cloth: p.clothDark, clothLight: p.cloth, clothDark: shade(p.clothDark, -0.3) }),
};
/** Least change first: the far side lightens before the near side darkens. */
const LOOK_ORDER = [['base', 'base'], ['base', 'mid'], ['base', 'light'], ['dark', 'base'], ['dark', 'mid'], ['dark', 'light']];
const SIDE_LOOKS = new Map(); // battle id -> { near, far, tried }, from a lab run in this page
/**
 * The lab's choices (chooseSideLooks, run with window.__battle.lab()), per near nation, far nation and
 * ground. The game would ship such a table; measuring at load costs seconds on a software GPU.
 */
const SIDE_LOOK_TABLE = {
  'cinderHorde>thornwood@a8a784': { near: 'base', far: 'mid' },
  'thornwood>cinderHorde@b9bdcb': { near: 'base', far: 'light' },
  'cinderHorde>thornwood@8e8e78': { near: 'dark', far: 'base' },
};
function sideLookKey(B) {
  const far = B.nearSide === 'attacker' ? 'defender' : 'attacker';
  return B.sides[B.nearSide].def + '>' + B.sides[far].def + '@' + numToHex(groundColor(B)).slice(1);
}
function sideLooksOf(B) { return SIDE_LOOKS.get(B.id) || SIDE_LOOK_TABLE[sideLookKey(B)] || { near: 'base', far: 'base' }; }
function paletteFor(B, side) {
  const v = sideLooksOf(B);
  const which = v ? (side === B.nearSide ? v.near : v.far) : 'base';
  return which === 'base' ? basePalette(B, side) : { ...PAL_VARIANTS[which](basePalette(B, side)), variant: which };
}
/** Median sRGB of a baked frame's opaque pixels. */
function frameMedian(renderer, tex) {
  // render the frame into a small target and read it back directly (extract.pixels takes seconds on a
  // software GPU; this takes milliseconds)
  const w = Math.round(tex.frame.width), h = Math.round(tex.frame.height);
  const rt = PIXI.RenderTexture.create({ width: w, height: h, resolution: 1 });
  const sp = new PIXI.Sprite(tex);
  renderer.render({ container: sp, target: rt, clear: true });
  const gl = renderer.gl, pixels = new Uint8Array(w * h * 4);
  renderer.renderTarget.bind(rt, false);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  if (renderer.renderTarget.rootRenderTarget) renderer.renderTarget.bind(renderer.renderTarget.rootRenderTarget, false);
  sp.destroy(); rt.destroy(true);
  const ch = [[], [], []];
  for (let i = 0; i < pixels.length; i += 4) if (pixels[i + 3] >= 250) { ch[0].push(pixels[i]); ch[1].push(pixels[i + 1]); ch[2].push(pixels[i + 2]); }
  const m = ch.map((a) => a.sort((x, y) => x - y)[a.length >> 1] || 0);
  return (m[0] << 16) | (m[1] << 8) | m[2];
}
/**
 * Chooses the two sides' cloth variants once per battle by measuring baked figures of each side's
 * largest block: the first pair in LOOK_ORDER that parts under every vision and keeps the value rule.
 * (The game would do this in the lab, per pair of nations and ground; the mockup measures at load.)
 */
function chooseSideLooks(renderer, B) {
  const far = B.nearSide === 'attacker' ? 'defender' : 'attacker';
  const rep = (side) => B.groups.filter((g) => g.side === side && !g.cmd && g.size < 3 && !['fireSprite', 'hornetSwarm'].includes(g.unit)).sort((a, b) => b.start - a.start)[0];
  const ground = lstar(groundColor(B));
  const med = new Map();
  const measure = (side, which) => {
    const g = rep(side);
    if (!g) return null;
    const key = g.unit + '/' + side + '/' + which;
    if (!med.has(key)) {
      if (!ATLAS_CACHE.has(key)) {
        const pal = which === 'base' ? basePalette(B, side) : { ...PAL_VARIANTS[which](basePalette(B, side)), variant: which };
        for (const [k, v] of bakeFigures(renderer, [{ key, unit: g.unit, pal }])) ATLAS_CACHE.set(k, v);
      }
      med.set(key, frameMedian(renderer, ATLAS_CACHE.get(key)[side === B.nearSide ? 'ne' : 'se'][FR.idle]));
    }
    return med.get(key);
  };
  const tried = [];
  let pick = null, best = null;
  for (const [n, f] of LOOK_ORDER) {
    const a = measure(B.nearSide, n), b = measure(far, f);
    if (a === null || b === null) { pick = { near: 'base', far: 'base' }; break; }
    const d = deltaEBy(a, b);
    const cvd = Math.min(...VISIONS.map((v) => d[v]));
    const value = ground - Math.max(lstar(a), lstar(b));
    tried.push({ near: n, far: f, nearColor: numToHex(a), farColor: numToHex(b), deltaE: d, belowGround: +value.toFixed(1) });
    if (!best || cvd > best.cvd) best = { near: n, far: f, cvd };
    if (cvd >= CVD_MIN + 1 && value >= 15) { pick = { near: n, far: f }; break; } // 1 point of margin for antialiasing
  }
  const out = { ...(pick || best), tried };

  return out;
}
/** The baked look's key: unit, side and palette variant (the atlas cache outlives a battle). */
function lookKey(B, g) { return g.unit + '/' + g.side + '/' + (paletteFor(B, g.side).variant || 'base'); }

/**
 * The Painted mode stand-in tone as a colour function: the matrix of a ColorMatrixFilter after saturate(-0.4) and
 * brightness(0.88), the filter the stand-ins wore before. Its shader maps straight (unpremultiplied) colour through the
 * matrix with no offset, so it is linear and commutes with alpha blending: grading each colour the rig draws gives the
 * filtered pixels, up to 8-bit rounding.
 */
let STAND_IN_TONE = null;
function standInTone() {
  if (STAND_IN_TONE) return STAND_IN_TONE;
  const cm = new PIXI.ColorMatrixFilter(); cm.saturate(-0.4, false); cm.brightness(0.88, true);
  const m = Array.from(cm.matrix); cm.destroy();
  const ch = (r, g, b, i) => Math.round(255 * clamp(m[i] * r + m[i + 1] * g + m[i + 2] * b + m[i + 3] + m[i + 4], 0, 1));
  STAND_IN_TONE = (c) => { const r = ((c >> 16) & 255) / 255, g = ((c >> 8) & 255) / 255, b = (c & 255) / 255; return (ch(r, g, b, 0) << 16) | (ch(r, g, b, 5) << 8) | ch(r, g, b, 10); };
  STAND_IN_TONE.matrix = m;
  // the body's tint (hit flash, death darkening) was graded by the filter too: as a tint on graded colours it is
  // M(t) / M(white) per channel, exact for grey colours and within a level for the rigs' own
  const w = [0, 5, 10].map((i) => m[i] + m[i + 1] + m[i + 2]);
  const tch = (r, g, b, i, k) => Math.round(255 * clamp((m[i] * r + m[i + 1] * g + m[i + 2] * b) / w[k], 0, 1));
  STAND_IN_TONE.tint = (c) => { const r = ((c >> 16) & 255) / 255, g = ((c >> 8) & 255) / 255, b = (c & 255) / 255; return (tch(r, g, b, 0, 0) << 16) | (tch(r, g, b, 5, 1) << 8) | tch(r, g, b, 10, 2); };
  return STAND_IN_TONE;
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
        const painted = this.paintMode && g.unit === 'salamander' && g.portrait && hash32(g.portrait) === PAINT.salamander.portraitHash;
        // Painted mode: the procedural stand-ins wait for stage C; toned down so they do not draw the eye (critique-resume
        // fix 11), their colours graded once at build rather than by a filter pass on every frame (skills audit B8)
        const tone = this.paintMode && !painted ? standInTone() : null;
        const body = painted ? makePaintedSalamander(G.s < 0 ? 'back' : 'front') : makeBigBody(g.unit, paletteFor(B, g.side), tone);
        if (tone) this.standInToned = (this.standInToned || 0) + 1;
        body.root.zIndex = 0;
        this.units.addChild(body.root);
        const sh = new PIXI.Sprite(this.texShadow); sh.anchor.set(0.5); (g.flying ? this.skyShadows : this.shadows).addChild(sh);
        if (painted) { sh.visible = false; sh.alpha = 0; this.shadows.addChild(body.shadowSprite); }
        this.bigs.push({ f, body, shadow: sh, G, tint: tone ? tone.tint : null });
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
  }

  /**
   * Frees what this stage owns on the GPU (critique fix 4): the scene graph, the ground canvas
   * texture and the particle and decal textures. The baked figure atlas (ATLAS_CACHE) is kept.
   */
  dispose() {
    this.disposed = true;
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
  }

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
      sp = new PIXI.Sprite(this.texSoft); sp.anchor.set(0.5); sp.tint = 0x2a2018; sp.alpha = 0.45; sp.scale.set(0.35, 0.22);
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
    for (const d of this.dropDecals) d.visible = !d.drop.none && t >= d.drop.t;
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
        sp.tint = this.paintMode ? mix(st.tint, 0x9a9184, 0.18) : st.tint; sp.alpha = st.alpha; // stand-ins toned down (critique-resume fix 11)
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
        const s = add ? this.pull('add', this.texDot, this.fxAdd) : this.pull('normal', this.texDot, this.fxNormal);
        s.position.set(sx(ox + dx, oy + dy), sy(ox + dx, oy + dy, Math.max(0, b.kind === 'dust' ? 4 + age * 10 : hh)));
        const fade = 1 - age / life;
        if (b.kind === 'blood') { s.tint = 0x7a1410; s.scale.set(0.75); s.alpha = 0.9 * fade; } // 3 wu drops: visible at play zoom (critique fix 8)
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
    sp.alpha = st.alpha;
    sp.pv = v.variant; sp.pPose = pp.pose; sp.pFwd = st.flip ? -1 : 1; // read by the checks and the general's banner
  }

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
  }

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
  }

  updateBig(bb, t, speed) {
    const { f, body, shadow, G } = bb;
    const T = this.T;
    const g = G.g;
    const p = figPos(T, f, t, { x: 0, y: 0, h: 0 });
    const vis = t >= G.appear;
    body.root.visible = vis; shadow.visible = vis;
    if (body.shadowSprite) body.shadowSprite.visible = vis;
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
    const aloft = flying && !f.death && p.h > 12; // a landed flyer stands on the ground
    if (aloft && act === 'bite' && h > 30) h = Math.max(10, h - 100 * Math.sin(Math.PI * clamp(k, 0, 1)));
    if (aloft) h += Math.sin(t * TAU * 0.5) * 6;
    bb.gx = p.x; bb.gy = p.y; bb.h = h;
    if (flying) { const want = h > 20 ? this.skyShadows : this.shadows; if (shadow.parent !== want) want.addChild(shadow); }
    // facing: toward the nearest enemy front (screen left or right)
    let face = G.s < 0 ? 1 : -1;
    const tgt = f.strikes.find((s) => t >= s.t - 1.2 && t < s.t + 0.6);
    if (tgt) { const q = figPos(T, T.F[tgt.tf], t, { x: 0, y: 0, h: 0 }); face = sx(q.x, q.y) >= sx(p.x, p.y) ? 1 : -1; }
    body.root.scale.x = body.painted ? face * (body.view === 'back' ? 1 : -1) : face; // a painted view has its own native facing
    let x = p.x, y = p.y;
    const dead = f.death && t >= f.death.t;
    const deadK = dead ? clamp((t - f.death.t) / f.death.fall, 0, 1) : 0;
    body.pose({ t: dead ? f.death.t + f.phase * 10 : t + f.phase * 10, h, flying: aloft && !dead, act: dead ? null : act, k, moving: false, dead, deadK });
    body.root.position.set(sx(x, y), sy(x, y, h));
    body.root.zIndex = depthKey(x, y) + (flying && h > 30 ? 0.5 : 0);
    if (dead && body.painted) { // the painted cutout is not deformed (stage D animates it): it collapses (plan 6: tilt 8 to
      // 12 degrees, settle), sinking onto its belly about the ground anchor, and darkens (critique fix 10)
      const q = clamp((t - f.death.t) / f.death.fall, 0, 1), e = easeOut(q);
      body.root.rotation = face * 0.2 * e;
      body.root.scale.y = 1 - 0.16 * e;
      body.root.position.y += 3 * e;
      body.root.alpha = 1; body.root.tint = mix(0xffffff, 0x3a3430, q);
    } else if (dead) { // the corpse lies down: it tips, settles flat (squashed in y) and folds its wings (the pose)
      const q = clamp((t - f.death.t) / f.death.fall, 0, 1);
      body.root.rotation = face * 0.18 * q * (1 - q * 0.6);
      body.root.scale.y = lerp(1, 0.55, easeIn(q));
      body.root.alpha = 1;
      body.root.tint = bb.tint ? bb.tint(mix(0xffffff, 0x5a544e, q)) : mix(0xffffff, 0x5a544e, q);
    } else { body.root.rotation = 0; body.root.scale.y = 1; body.root.tint = bb.tint ? bb.tint(act === 'hit' ? 0xffd0c0 : 0xffffff) : act === 'hit' ? 0xffd0c0 : 0xffffff; }
    if (body.painted) { // the silhouette shadow (review change 13): the cutout, black, soft, 5 wu right and 4 wu down
      const ss = body.shadowSprite, k = body.k;
      ss.visible = true;
      ss.position.set(sx(x, y) + 5, sy(x, y, 0) + 4);
      ss.scale.set(body.root.scale.x * k, 0.9 * k * body.root.scale.y);
      ss.rotation = body.root.rotation;
      ss.alpha = dead ? 1 - 0.5 * clamp((t - f.death.t) / f.death.fall, 0, 1) : 1;
      shadow.visible = false;
      return;
    }
    // soft shadow on the ground, offset toward the lower right
    const H = LAYOUT.sizeH[g.size] || 64;
    shadow.position.set(sx(x, y) + 0.25 * H * 0.5 + h * 0.5, sy(x, y, 0) + 6 + h * 0.15);
    const sc = (LAYOUT.footR[g.size] * 1.4) / 50 * (g.unit === 'greatWyrm' ? 2.6 : 1.4) * (1 - h / 400);
    shadow.scale.set(sc * 1.2, sc * 0.9);
    shadow.alpha = flying ? 0.35 - h / 800 : 0.35;
  }

  // ---- pooled display objects and shared Graphics contexts (skills audit B1) ----
  /** The next pooled object of a kind, made in its layer on first use; endPool hides the ones this frame left over. */
  pullObj(kind, layer, make) {
    const P = this.objPool[kind] || (this.objPool[kind] = { items: [], used: 0 });
    let o = P.items[P.used++];
    if (!o) { o = make(); layer.addChild(o); P.items.push(o); }
    o.visible = true;
    return o;
  }
  beginPool(kind) { const P = this.objPool[kind]; if (P) P.used = 0; }
  endPool(kind) { const P = this.objPool[kind]; if (P) for (let i = P.used; i < P.items.length; i++) P.items[i].visible = false; }
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
  }
  clearGroundFx() { this.beginPool('shadow'); this.endPool('shadow'); this.beginPool('cmdRing'); this.endPool('cmdRing'); if (this.fxRingsDrawn) { this.fxRingG.clear(); this.fxRingsDrawn = false; } }
  clearGlyphs() { this.beginPool('pennant'); this.endPool('pennant'); this.beginPool('pip'); this.endPool('pip'); }

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
    }
    this.endPool('shadow'); this.endPool('cmdRing');
    // the rings that follow a block's size, drawn as before but only while one shows
    const gx = this.fxRingG;
    if (this.fxRingsDrawn) { gx.clear(); this.fxRingsDrawn = false; }
    // buff and debuff rings under blocks
    for (const rg of T.rings) {
      if (t < rg.t0 || t >= rg.t1) continue;
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
  }

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
  }

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
  }
}

// ---- figure state at t (pure) ----
const _st = { vis: true, x: 0, y: 0, h: 0, view: 'ne', flip: false, frame: 0, tint: 0xffffff, alpha: 1, key: 0 };
const _q = { x: 0, y: 0, h: 0 };
/** The returned object is reused: read it before the next call (no garbage per figure per frame). */
function evalFigure(T, f, G, t, speed, tmp) {
  const st = _st;
  st.vis = true; st.x = 0; st.y = 0; st.h = 0; st.view = 'ne'; st.flip = false; st.frame = 0; st.tint = 0xffffff; st.alpha = 1; st.key = 0;
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
      // a short side-step (under a man's height) keeps the facing: men side-step a pace or two without turning
      const sideways = Math.abs(seg.x1 - seg.x0) > Math.abs(seg.y1 - seg.y0) * 1.5 && Math.abs(seg.x1 - seg.x0) > 28;
      // a sideways move turns the figure to its heading by the mirror alone: the side keeps its view (back for the near
      // side, front for the far side), so no move spins a man between his back and his front (stage B fix pass, 5d)
      if (sideways) { const right = seg.x1 > seg.x0; st.flip = !right; }
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
      const q = figPos(T, T.F[s.tf], s.t, _q);
      let dx = q.x - st.x, dy = q.y - st.y; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
      let lk;
      if (t < s.t) { frame = FR.atk; lk = -0.25 * ((t - (s.t - s.wind)) / s.wind); }
      else if (t < s.t + s.strike) { frame = (s.t * 7) % 2 > 1 ? FR.atk + 3 : FR.atk + 1; lk = 1; }
      else { frame = FR.atk + 2; lk = 1 - (t - s.t - s.strike) / s.rec; }
      const lunge = Math.min(s.lunge, dl * 0.6) * 0.5;
      st.x += dx * lunge * lk; st.y += dy * lunge * lk;
      // face the target (screen right or left)
      // turn to the camera (or away) only when the target is clearly behind: a target a little lower on screen spun
      // a near-side man 180 degrees per blow (critique fix 5d)
      // and he turns to the other side only when the target is clearly there (more than 30 degrees past square), not for each blow
      // at a target straight ahead
      const sl = Math.hypot(sx(dx, dy), sy(dx, dy, 0)) || 1, sh = sx(dx, dy) / sl, sv = sy(dx, dy, 0) / sl;
      const right = st.flip ? sh > 0.5 : sh >= -0.5;
      st.view = near ? (sv > 0.34 ? 'se' : 'ne') : (sv < -0.34 ? 'ne' : 'se');
      st.flip = !right;
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
  if ((G.onWall || (f.climb && t >= f.climb.t + f.climb.dur * 0.6)) && T.wall) st.key = depthKey(st.x, 0) + 0.02 + (Math.abs(st.y) / 1000);
  return st;
}
function activeSeg(path, t) {
  for (let i = path.length - 1; i >= 0; i--) { const s = path[i]; if (s.t0 <= t) return t < s.t1 ? s : null; }
  return null;
}
