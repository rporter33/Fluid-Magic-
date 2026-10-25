// Procedural vector soldier figures for a three-quarter overhead camera, drawn with Pixi Graphics
// at 2x and baked into one atlas. Parts take per-nation colors at bake time, so each (kind, nation)
// pair is one sprite per figure at run time. Original shapes; nothing traced from any reference.
import { PIXI } from './harness.js';

export const CELL = 64; // atlas cell in px at 2x (a figure shows at about 20 x 28 px at zoom 1)
export const KINDS = ['spear', 'sword', 'archer', 'axe', 'cav'];
export const FACINGS = ['se', 'ne']; // flip x for sw / nw
export const POSES = [['idle', 1], ['walk', 4], ['attack', 3], ['die', 2]];
export const NATIONS = {
  cinder: { cloth: 0xc4532c, clothDark: 0x8a3a20, trim: 0x8a4a2a, metal: 0x6e6a64, metalHi: 0xa9a49b, skin: 0x8f8c88, leather: 0x4a3a2e, wood: 0x6a5038 },
  thorn: { cloth: 0x1f6a50, clothDark: 0x124232, trim: 0xc9b26b, metal: 0x6b4a2b, metalHi: 0x9c7a50, skin: 0xa0785a, leather: 0x5a4632, wood: 0x7a5a3a },
  indep: { cloth: 0x8c8a80, clothDark: 0x5e5c55, trim: 0x5a5248, metal: 0xa8adb3, metalHi: 0xd6dadf, skin: 0xc8a080, leather: 0x4f4338, wood: 0x7a5a3a },
};
const INK = 0x1c1a17;

function limb(g, x0, y0, x1, y1, w, color) {
  g.moveTo(x0, y0).lineTo(x1, y1).stroke({ width: w + 2, color: INK, alpha: 0.55, cap: 'round' });
  g.moveTo(x0, y0).lineTo(x1, y1).stroke({ width: w, color, cap: 'round' });
}

/** One figure. Origin at the feet; +y is down the screen. `ph` is the pose phase 0..1. */
export function drawFigure(g, kind, pal, facing, pose, ph) {
  const back = facing === 'ne';
  const s = Math.sin(ph * Math.PI * 2);
  if (pose === 'die') {
    // falling (ph 0) then lying flat (ph 1): drawn rotated, no shadow (the body decal carries its own pool).
    const lie = ph > 0.5;
    g.ellipse(0, -2, lie ? 14 : 11, lie ? 5 : 4.5).fill({ color: 0x000000, alpha: 0.25 });
    const sub = new PIXI.Graphics();
    drawFigure(sub, kind === 'cav' ? 'sword' : kind, pal, facing, 'idle', 0);
    sub.rotation = lie ? -1.45 : -0.75;
    sub.scale.set(1, lie ? 0.62 : 0.85);
    sub.position.set(lie ? -14 : -8, lie ? -3 : -2);
    return sub;
  }
  if (kind === 'cav') return drawRider(g, pal, back, pose, ph);
  // shadow
  g.ellipse(0, -1, 10, 4).fill({ color: 0x000000, alpha: 0.3 });
  // legs (a step reads as a vertical offset from this camera)
  const step = pose === 'walk' ? s * 2.4 : 0;
  limb(g, -3, -14, -3.5, -2 - step, 3.2, pal.leather);
  limb(g, 3, -14, 3.5, -2 + step, 3.2, pal.leather);
  // weapon behind body when seen from the back
  const atk = pose === 'attack' ? [0, 1, 0.4][Math.round(ph * 2)] ?? 0 : 0;
  const drawWeapon = () => {
    if (kind === 'spear') {
      const tipX = 9 + atk * 9, tipY = -50 + atk * 30, buttX = 7 - atk * 4, buttY = -4 + atk * 2;
      limb(g, buttX, buttY, tipX, tipY, 1.6, pal.wood);
      g.poly([tipX - 2, tipY + 3, tipX + 2, tipY + 3, tipX + (atk ? 3 : 0), tipY - 4]).fill(pal.metalHi).stroke({ width: 1, color: INK, alpha: 0.6 });
    } else if (kind === 'sword') {
      const a = -1.2 + atk * 1.9, hx = 9, hy = -20;
      const ex = hx + Math.cos(a) * 14, ey = hy + Math.sin(a) * 14;
      limb(g, hx, hy, ex, ey, 2, pal.metalHi);
    } else if (kind === 'axe') {
      const a = -1.9 + atk * 2.2, hx = 8, hy = -22;
      const ex = hx + Math.cos(a) * 18, ey = hy + Math.sin(a) * 18;
      limb(g, hx, hy, ex, ey, 2, pal.wood);
      g.circle(ex, ey, 4.2).fill(pal.metal).stroke({ width: 1, color: INK, alpha: 0.6 });
    } else if (kind === 'archer') {
      const draw = pose === 'attack' ? 3 + atk * 4 : 0;
      g.moveTo(10, -36).quadraticCurveTo(16, -24, 10, -10).stroke({ width: 2.2, color: pal.wood });
      g.moveTo(10, -36).lineTo(10 - draw, -23).lineTo(10, -10).stroke({ width: 0.8, color: 0xe8e0c8 });
      if (pose === 'attack' && atk > 0) limb(g, 10 - draw, -23, 20, -25, 1, pal.wood);
    }
  };
  if (back) drawWeapon();
  // torso: tunic in the nation cloth, armor over it
  g.roundRect(-7.5, -29, 15, 17, 4).fill(pal.cloth).stroke({ width: 1.4, color: INK, alpha: 0.6 });
  g.roundRect(-7.5, -16, 15, 4, 2).fill(pal.clothDark);
  if (kind === 'sword' || kind === 'spear') g.roundRect(-6, -28, 12, 9, 3).fill(pal.metal);
  if (kind === 'axe') { g.circle(-3, -23, 2).fill(0x8a2a20); g.circle(3, -23, 2).fill(0x8a2a20); }
  if (kind === 'archer' && back) g.roundRect(-2, -34, 5, 14, 2).fill(pal.leather);
  g.rect(-7, -18, 14, 2).fill(pal.leather);
  // arms
  limb(g, -6.5, -26, -9, -17, 3, kind === 'axe' ? pal.skin : pal.cloth);
  limb(g, 6.5, -26, 9 + atk * 2, -19 - atk * 3, 3, kind === 'axe' ? pal.skin : pal.cloth);
  // head and helm (lit from the upper left)
  g.circle(0, -34, 5.4).fill(pal.skin).stroke({ width: 1.4, color: INK, alpha: 0.6 });
  if (kind === 'archer') {
    g.circle(0, -35, 5.8).fill(pal.clothDark);
    if (!back) g.ellipse(1.2, -33, 3.2, 2.6).fill(pal.skin);
  } else if (kind !== 'axe') {
    g.ellipse(0, -36, 5.8, 4.6).fill(pal.metal);
    g.ellipse(-1.6, -37.6, 2.4, 1.6).fill({ color: pal.metalHi, alpha: 0.9 });
    if (!back) g.rect(0.6, -36, 1.2, 4).fill(pal.metal);
  } else {
    g.ellipse(0, -37, 5, 3).fill(0x2a2420);
  }
  // shield on the near arm
  if (kind === 'spear' || kind === 'sword') {
    const sx = back ? 6 : -8, sy = -21;
    g.ellipse(sx, sy, back ? 4 : 6, 7.5).fill(pal.cloth).stroke({ width: 1.5, color: pal.trim });
    g.ellipse(sx, sy, back ? 4 : 6, 7.5).stroke({ width: 0.8, color: INK, alpha: 0.7 });
    g.circle(sx, sy, 1.6).fill(pal.metalHi);
  }
  if (!back) drawWeapon();
}

function drawRider(g, pal, back, pose, ph) {
  const s = Math.sin(ph * Math.PI * 2);
  g.ellipse(0, -1, 17, 5).fill({ color: 0x000000, alpha: 0.3 });
  const gait = pose === 'walk' ? s * 3 : 0;
  // horse legs
  for (const [x, o] of [[-10, gait], [-6, -gait], [7, -gait], [11, gait]]) limb(g, x, -12, x + o * 0.4, -1 - Math.abs(o) * 0.3, 2.6, 0x4a3426);
  // body and head (facing right; back view sees the rump larger)
  g.ellipse(0, -15, 14, 7).fill(0x6a4a34).stroke({ width: 1.4, color: INK, alpha: 0.6 });
  g.ellipse(-1, -17, 12, 4).fill({ color: pal.cloth, alpha: 0.85 }); // caparison in nation cloth
  if (!back) {
    g.poly([10, -18, 17, -28, 21, -27, 16, -15]).fill(0x6a4a34).stroke({ width: 1.2, color: INK, alpha: 0.6 });
    g.ellipse(19.5, -27, 3.5, 2.4).fill(0x5a3e2c);
  } else {
    g.ellipse(-13, -14, 3, 5).fill(0x3a2a20);
  }
  // rider
  g.roundRect(-5, -32, 10, 13, 3).fill(pal.metal).stroke({ width: 1.2, color: INK, alpha: 0.6 });
  g.circle(0, -35, 4.6).fill(pal.metal).stroke({ width: 1.2, color: INK, alpha: 0.6 });
  g.ellipse(-1.4, -36.5, 2, 1.3).fill({ color: pal.metalHi, alpha: 0.9 });
  const atk = pose === 'attack' ? [0, 1, 0.4][Math.round(ph * 2)] ?? 0 : 0;
  limb(g, 2, -26, 24 + atk * 6, -34 + atk * 10, 1.6, pal.wood);
  g.poly([22 + atk * 6, -36 + atk * 10, 28 + atk * 6, -36 + atk * 11, 24 + atk * 6, -33 + atk * 10]).fill(pal.metalHi);
}

/**
 * Bakes every (kind, nation, facing, pose frame) into one RenderTexture.
 * Returns frames[kind][nation][facing][pose] = Texture[] and timings.
 */
export function buildAtlas(renderer, opts = {}) {
  const nations = opts.nations ?? Object.keys(NATIONS);
  const separate = !!opts.separate; // one texture per frame (to show what an atlas saves)
  const t0 = performance.now();
  const root = new PIXI.Container();
  const cells = [];
  for (const kind of KINDS) for (const nat of nations) for (const facing of FACINGS) for (const [pose, n] of POSES) for (let i = 0; i < n; i++) {
    const g = new PIXI.Container();
    const base = new PIXI.Graphics();
    g.addChild(base);
    const extra = drawFigure(base, kind, NATIONS[nat], facing, pose, n === 1 ? 0 : i / n);
    if (extra) g.addChild(extra);
    cells.push({ kind, nat, facing, pose, i, g });
  }
  const t1 = performance.now();
  const cols = Math.floor(2048 / CELL);
  const rows = Math.ceil(cells.length / cols);
  const H = Math.pow(2, Math.ceil(Math.log2(rows * CELL)));
  const frames = {};
  const put = (c, tex) => {
    ((((frames[c.kind] ??= {})[c.nat] ??= {})[c.facing] ??= {})[c.pose] ??= [])[c.i] = tex;
  };
  let rt = null;
  if (!separate) {
    rt = PIXI.RenderTexture.create({ width: 2048, height: H, resolution: 1 });
    cells.forEach((c, k) => {
      const holder = new PIXI.Container();
      holder.position.set((k % cols) * CELL + CELL / 2, Math.floor(k / cols) * CELL + CELL - 8);
      c.g.scale.set(1.25); // 2x art: figure about 50 px tall in the atlas
      holder.addChild(c.g);
      root.addChild(holder);
    });
    renderer.render({ container: root, target: rt, clear: true });
    cells.forEach((c, k) => {
      const fr = new PIXI.Rectangle((k % cols) * CELL, Math.floor(k / cols) * CELL, CELL, CELL);
      const tex = new PIXI.Texture({ source: rt.source, frame: fr });
      tex.defaultAnchor = { x: 0.5, y: (CELL - 8) / CELL };
      put(c, tex);
    });
  } else {
    cells.forEach((c) => {
      const own = PIXI.RenderTexture.create({ width: CELL, height: CELL });
      const holder = new PIXI.Container();
      holder.position.set(CELL / 2, CELL - 8);
      c.g.scale.set(1.25);
      holder.addChild(c.g);
      renderer.render({ container: holder, target: own, clear: true });
      own.defaultAnchor = { x: 0.5, y: (CELL - 8) / CELL };
      put(c, own);
    });
  }
  const t2 = performance.now();
  return { frames, rt, count: cells.length, atlasH: H, timing: { drawMs: +(t1 - t0).toFixed(1), bakeMs: +(t2 - t1).toFixed(1) } };
}
