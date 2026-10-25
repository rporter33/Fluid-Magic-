'use strict';
// ---- procedural rank-and-file figures, baked into pose frames (design 12.1) ----
// Original shapes drawn with Pixi Graphics for a 40-degree overhead three-quarter camera; nothing
// is traced from any reference. Art space: a size-1 figure is 50 px tall, feet at (0, 0), facing
// screen right. Two views: 'se' (front three-quarter) and 'ne' (back three-quarter); flips give
// 'sw' and 'nw'. Every frame gets a dark keyline (#1C1A17 at 60%) around its silhouette.

const ART = { cell: 88, foot: 70, figH: 50, pxPerWu: 50 / 28 };
const INK = 0x1c1a17;
const FR = { idle: 0, idle1: 1, walk: 2, atk: 6, shoot: 10, brace: 13, flinch: 14, fall: 15, dead: 17, white: 18, whiteFlinch: 19, N: 20 };

const PALETTES = {
  cinderHorde: { cloth: 0xc4532c, clothDark: 0x7e3118, clothLight: 0xd9744a, metal: 0x4d4843, metalHi: 0x8f877d, leather: 0x47321f,
    skin: 0xa88068, wood: 0x6b4c32, trim: 0xd2a347, hair: 0x2a1d16, bark: 0x5b4636, horse: 0x5a4636, horseDark: 0x3a2b20 },
  thornwood: { cloth: 0x1f6a50, clothDark: 0x113f2f, clothLight: 0x2f8a68, metal: 0x6f5a3c, metalHi: 0xa58b5c, leather: 0x4a3a28,
    skin: 0xc49a76, wood: 0x6e5232, trim: 0xc9b26b, hair: 0x4a3524, bark: 0x5e4a33, horse: 0x77736c, horseDark: 0x4e4a45 },
  independent: { cloth: 0x8c8a80, clothDark: 0x5c5a54, clothLight: 0xaaa79c, metal: 0x6d7076, metalHi: 0xb0b4ba, leather: 0x4f4338,
    skin: 0xc8a080, wood: 0x7a5a3a, trim: 0x9a8a6a, hair: 0x3a2a20, bark: 0x5e4a33, horse: 0x6a5040, horseDark: 0x45342a },
};

/** Unit looks: body plan, gear and silhouette. */
const LOOKS = {
  ashMilitia: { body: 'man', helm: 'cap', armor: 'padded', weapon: 'spear', shield: null },
  thornMilitia: { body: 'man', helm: 'hood', armor: 'padded', weapon: 'spear', shield: null },
  lightInfantry: { body: 'man', helm: 'cap', armor: 'padded', weapon: 'spear', shield: 'round' },
  swampFighter: { body: 'man', helm: 'hood', armor: 'padded', weapon: 'spear', shield: null },
  cinderWarrior: { body: 'man', helm: 'crestHelm', armor: 'scale', weapon: 'axe', shield: 'round' },
  heavyInfantry: { body: 'man', helm: 'kettle', armor: 'plate', weapon: 'sword', shield: 'kite' },
  warden: { body: 'man', helm: 'leafHelm', armor: 'bark', weapon: 'sword', shield: 'round', cape: true },
  briarGuard: { body: 'man', helm: 'thornHelm', armor: 'bark', weapon: 'halberd', shield: null, cape: true },
  flamebrand: { body: 'man', helm: 'crestHelm', armor: 'scale', weapon: 'fireSword', shield: null, cape: true, glow: true },
  berserker: { body: 'man', helm: 'wild', armor: 'bare', weapon: 'greatAxe', shield: null },
  flameArcher: { body: 'man', helm: 'hood', armor: 'padded', weapon: 'bow', shield: null, quiver: true, fire: true },
  longbowHunter: { body: 'man', helm: 'hood', armor: 'padded', weapon: 'longbow', shield: null, quiver: true, cape: true },
  archer: { body: 'man', helm: 'cap', armor: 'padded', weapon: 'bow', shield: null, quiver: true },
  emberSkirmisher: { body: 'man', helm: 'band', armor: 'padded', weapon: 'javelin', shield: null },
  ashRider: { body: 'horse', helm: 'crestHelm', armor: 'scale', weapon: 'lance', shield: null },
  wolfRider: { body: 'wolf', helm: 'hood', armor: 'bark', weapon: 'spear', shield: null },
  wolf: { body: 'wolfOnly' },
  fireSprite: { body: 'sprite' },
  hornetSwarm: { body: 'swarm' },
  ashChieftain: { body: 'man', helm: 'horned', armor: 'scale', weapon: 'axe', shield: null, cape: true, banner: true },
  wardenCaptain: { body: 'man', helm: 'leafHelm', armor: 'bark', weapon: 'sword', shield: 'round', cape: true, banner: true },
  independentCaptain: { body: 'man', helm: 'kettle', armor: 'mail', weapon: 'sword', shield: 'round', cape: true, banner: true },
  cinderMagus: { body: 'man', helm: 'robeHood', armor: 'robe', weapon: 'staff', staffGlow: 0xff8a3a },
  emberAdept: { body: 'man', helm: 'robeHood', armor: 'robe', weapon: 'staff', staffGlow: 0xffa04a },
  pyrePriest: { body: 'man', helm: 'mitre', armor: 'robe', weapon: 'staff', staffGlow: 0xffd070 },
  elderDruid: { body: 'man', helm: 'antler', armor: 'robe', weapon: 'staff', staffGlow: 0x9be07a },
  saplingDruid: { body: 'man', helm: 'leafCrown', armor: 'robe', weapon: 'staff', staffGlow: 0xb8e08a },
  grovePriest: { body: 'man', helm: 'leafCrown', armor: 'robe', weapon: 'staff', staffGlow: 0xf0e08a, light: true },
  cinderScout: { body: 'man', helm: 'hood', armor: 'padded', weapon: 'dagger' },
  thornScout: { body: 'man', helm: 'hood', armor: 'padded', weapon: 'dagger' },
  oakheart: { body: 'man', helm: 'leafHelm', armor: 'bark', weapon: 'maul', shield: null, scale: 1.5 },
};

// ---------------------------------------------------------------------------------------
function P(g) {
  return {
    poly(pts, fill, a) { g.poly(pts).fill({ color: fill, alpha: a ?? 1 }); return this; },
    ell(x, y, rx, ry, fill, a) { g.ellipse(x, y, rx, ry).fill({ color: fill, alpha: a ?? 1 }); return this; },
    circ(x, y, r, fill, a) { g.circle(x, y, r).fill({ color: fill, alpha: a ?? 1 }); return this; },
    rect(x, y, w, h, fill, a) { g.rect(x, y, w, h).fill({ color: fill, alpha: a ?? 1 }); return this; },
    rrect(x, y, w, h, r, fill, a) { g.roundRect(x, y, w, h, r).fill({ color: fill, alpha: a ?? 1 }); return this; },
    line(x0, y0, x1, y1, w, color, a) { g.moveTo(x0, y0).lineTo(x1, y1).stroke({ width: w, color, alpha: a ?? 1, cap: 'round' }); return this; },
    curve(pts, w, color, a) { g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 4) g.quadraticCurveTo(pts[i], pts[i + 1], pts[i + 2], pts[i + 3]); g.stroke({ width: w, color, alpha: a ?? 1, cap: 'round', join: 'round' }); return this; },
  };
}

/** Pose parameters for a frame. */
function poseParams(frame) {
  const q = { step: 0, bob: 0, atk: -1, shoot: -1, brace: 0, flinch: 0, fall: -1, dead: false };
  if (frame === FR.idle1) q.bob = 0.8;
  else if (frame >= FR.walk && frame < FR.walk + 4) { const k = frame - FR.walk; q.step = [1, 0, -1, 0][k]; q.bob = [0, 1, 0, 1][k]; }
  else if (frame >= FR.atk && frame < FR.atk + 4) q.atk = frame - FR.atk; // 0 windup, 1 strike, 2 recover, 3 strike variant
  else if (frame >= FR.shoot && frame < FR.shoot + 3) q.shoot = frame - FR.shoot; // 0 draw, 1 loose, 2 recover
  else if (frame === FR.brace) q.brace = 1;
  else if (frame === FR.flinch || frame === FR.whiteFlinch) q.flinch = 1;
  else if (frame === FR.fall || frame === FR.fall + 1) q.fall = frame - FR.fall;
  else if (frame === FR.dead) q.dead = true;
  return q;
}

// ---------------------------------------------------------------------------------------
/**
 * Bakes the frames of the given (unit, side palette) looks: per look, one render of every frame's
 * vector parts, then one render that lays the dark keyline (the silhouette offset in 8 directions
 * at 60%) under it. Returns Map key -> {ne: Texture[], se: Texture[]}.
 */
function bakeFigures(renderer, list) {
  const out = new Map();
  const C = ART.cell;
  const cols = 10;
  const rows = Math.ceil((FR.N * 2) / cols);
  const whiteM = [0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0];
  for (const { key, unit, pal, scale } of list) {
    const opts = { width: C * cols, height: C * rows, resolution: 1, antialias: true };
    const rtA = PIXI.RenderTexture.create(opts), rtB = PIXI.RenderTexture.create(opts);
    const root = new PIXI.Container();
    const whites = new PIXI.Container();
    const cm = new PIXI.ColorMatrixFilter(); cm.matrix = whiteM; whites.filters = [cm];
    root.addChild(whites);
    const cells = { ne: [], se: [] };
    let k = 0;
    for (const view of ['ne', 'se']) for (let f = 0; f < FR.N; f++) {
      const cx = (k % cols) * C, cy = Math.floor(k / cols) * C;
      const holder = new PIXI.Container();
      holder.position.set(cx + C / 2, cy + ART.foot);
      const white = f === FR.white || f === FR.whiteFlinch;
      const fall = f === FR.fall || f === FR.fall + 1, dead = f === FR.dead;
      const g = new PIXI.Graphics();
      drawFigure(g, unit, pal, view, white ? (f === FR.white ? FR.idle : FR.flinch) : f === FR.fall ? FR.flinch : f);
      const body = new PIXI.Container();
      body.addChild(g);
      if (f === FR.fall) { body.rotation = (view === 'ne' ? -1 : 1) * 0.55; body.position.set((view === 'ne' ? -3 : 3), 0); }
      const s = scale || 1;
      body.scale.x *= s; body.scale.y *= s;
      holder.addChild(body);
      (white ? whites : root).addChild(holder);
      cells[view].push({ cx, cy });
      k++;
    }
    renderer.render({ container: root, target: rtA, clear: true });
    const comp = new PIXI.Container();
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) {
      const sp = new PIXI.Sprite(rtA); sp.position.set(dx * 1.1, dy * 1.1); sp.tint = INK; sp.alpha = 0.6; comp.addChild(sp);
    }
    comp.addChild(new PIXI.Sprite(rtA));
    renderer.render({ container: comp, target: rtB, clear: true });
    const frames = { ne: [], se: [] };
    for (const view of ['ne', 'se']) frames[view] = cells[view].map(({ cx, cy }) => new PIXI.Texture({ source: rtB.source, frame: new PIXI.Rectangle(cx, cy, C, C) }));
    out.set(key, frames);
    root.destroy({ children: true }); comp.destroy({ children: true });
    rtA.destroy(true); // only the composited frames are kept
  }
  return out;
}
const FIG_ANCHOR = { x: 0.5, y: ART.foot / ART.cell };
