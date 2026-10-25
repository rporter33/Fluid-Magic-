// Overhead three-quarter battle stress scene: N soldier figures in formations, arrow volleys,
// blood particles, deaths baked as bodies and blood into a ground RenderTexture, 0 to 2 monsters.
// Query: n, mode=sprite|particle, sort=none|zindex|manual, atlas=1|0, arrows, blood, deaths (per frame),
// monsters, frames, raf=1 (also measure a real rAF loop), res (renderer resolution).
import { PIXI, makeApp, timeFrames, rafFps, done, qn, qs, rng, memMB, stats } from './harness.js';
import { buildAtlas, NATIONS } from './figures.js';
import { buildMonster } from './monster.js';

const N = qn('n', 1500), MODE = qs('mode', 'sprite'), SORT = qs('sort', 'manual'), ATLAS = qn('atlas', 1);
const ARROWS = qn('arrows', 400), BLOOD = qn('blood', 1500), DEATHS = qn('deaths', 1), MONSTERS = qn('monsters', 1);
const FRAMES = qn('frames', 240), RES = qn('res', 1);
const VW = window.innerWidth, VH = window.innerHeight, W = 1920, H = 1080; // layout in 1920x1080 world units, scaled to the viewport
const ctx = await makeApp({ width: VW, height: VH, background: 0xcdb386, resolution: RES });
const { app, sync } = ctx;
const R = rng(7);

// ---------- art ----------
const tA = performance.now();
const atlas = buildAtlas(app.renderer, { separate: !ATLAS, nations: ['cinder', 'thorn'] });
sync();
const atlasMs = performance.now() - tA;
const F = atlas.frames;
// art=painted: the keyed generated soldier (one unit, two nations by hue recolor) for every kind, to see the massed look
let paintedSrc = null;
if (qs('art', 'proc') === 'painted') {
  const ptex = await PIXI.Assets.load('painted-atlas-2.png'); paintedSrc = ptex.source;
  const pf = (k, row) => { const t = new PIXI.Texture({ source: ptex.source, frame: new PIXI.Rectangle(k * 64, row * 64, 64, 64) }); t.defaultAnchor = { x: 0.5, y: 58 / 64 }; return t; };
  for (const kind of Object.keys(F)) for (const [nat, row] of [['cinder', 0], ['thorn', 1]]) {
    const walk = [0, 1, 2, 3].map((k) => pf(k, row));
    F[kind][nat].se = { idle: [walk[0]], walk, attack: [4, 5, 6, 7].map((k) => pf(k, row)), die: [12, 13].map((k) => pf(k, row)) };
  }
}
// fx atlas: arrow, droplets, splats (one source so particles batch)
const fxRT = PIXI.RenderTexture.create({ width: 256, height: 64 });
{
  const g = new PIXI.Graphics();
  g.moveTo(2, 4).lineTo(20, 4).stroke({ width: 1.6, color: 0x3a2a1c }); g.poly([20, 2, 25, 4, 20, 6]).fill(0x9a9a9a); g.poly([2, 2, 6, 4, 2, 6]).fill(0xe8e0c8);
  for (let i = 0; i < 4; i++) g.circle(36 + i * 10, 4, 1.5 + i * 0.6).fill(0x7a0d0d);
  // splats: irregular blobs
  for (let k = 0; k < 4; k++) {
    const cx = 100 + k * 40, cy = 32, pts = [];
    for (let a = 0; a < 14; a++) { const r = 9 + 7 * Math.abs(Math.sin(a * 2.3 + k * 1.7)); pts.push(cx + Math.cos(a / 14 * 6.283) * r, cy + Math.sin(a / 14 * 6.283) * r * 0.55); }
    g.poly(pts).fill({ color: 0x6a0a0a, alpha: 0.75 });
    g.circle(cx + 14, cy + 4, 2.5).fill({ color: 0x6a0a0a, alpha: 0.7 });
  }
  app.renderer.render({ container: g, target: fxRT });
}
const fxTex = (x, y, w, h, ax = 0.5, ay = 0.5) => { const t = new PIXI.Texture({ source: fxRT.source, frame: new PIXI.Rectangle(x, y, w, h) }); t.defaultAnchor = { x: ax, y: ay }; return t; };
const ARROW = fxTex(0, 0, 26, 8), DROPS = [0, 1, 2, 3].map((i) => fxTex(32 + i * 10, 0, 10, 8)), SPLATS = [0, 1, 2, 3].map((k) => fxTex(80 + k * 40, 12, 40, 40));

// ---------- layers ----------
const world = new PIXI.Container(); app.stage.addChild(world); world.scale.set(VW / W);
// ground: sand from a small canvas, scaled up (one quad)
{
  const c = document.createElement('canvas'); c.width = 480; c.height = 270; const x = c.getContext('2d');
  const img = x.createImageData(480, 270); const r2 = rng(3);
  for (let i = 0; i < 480 * 270; i++) { const n = r2() * 14 - 7, m = Math.sin(i % 480 * 0.03) * Math.cos(Math.floor(i / 480) * 0.04) * 8; img.data.set([205 + n + m, 179 + n + m, 134 + n + m, 255], i * 4); }
  x.putImageData(img, 0, 0);
  const s = new PIXI.Sprite(PIXI.Texture.from(c)); s.width = W; s.height = H; world.addChild(s);
}
const decalRT = PIXI.RenderTexture.create({ width: W, height: H }); // ground-space decals at 1 px per world unit
world.addChild(new PIXI.Sprite(decalRT));
const stampLayer = new PIXI.Container(); // filled each frame, rendered into decalRT, then emptied
const stampPool = [];
let stampsTotal = 0, stampMs = [];
const stamp = (tex, x, y, rot = 0, tint = 0xffffff, alpha = 1, sx = 1) => {
  const s = stampPool.pop() ?? new PIXI.Sprite();
  s.texture = tex; s.position.set(x, y); s.rotation = rot; s.tint = tint; s.alpha = alpha; s.scale.set(sx * 0.5, 0.5);
  if (tex === ARROW) s.scale.set(0.5, 0.5);
  stampLayer.addChild(s); stampsTotal++;
};

let figs, figLayer;
if (MODE === 'particle') {
  figLayer = new PIXI.ParticleContainer({ texture: paintedSrc ? new PIXI.Texture({ source: paintedSrc }) : atlas.rt ? new PIXI.Texture({ source: atlas.rt.source }) : undefined,
    dynamicProperties: { position: true, uvs: true, vertex: SORT !== 'none', color: SORT !== 'none', rotation: false } });
} else {
  figLayer = new PIXI.Container();
  if (SORT === 'zindex') figLayer.sortableChildren = true;
}
world.addChild(figLayer);
const monsterLayer = new PIXI.Container(); world.addChild(monsterLayer);
const arrowLayer = new PIXI.ParticleContainer({ texture: new PIXI.Texture({ source: fxRT.source }), dynamicProperties: { position: true, rotation: true, uvs: false, vertex: false, color: false } });
const bloodLayer = new PIXI.ParticleContainer({ texture: new PIXI.Texture({ source: fxRT.source }), dynamicProperties: { position: true, rotation: false, uvs: false, vertex: false, color: true } });
world.addChild(arrowLayer, bloodLayer);

// ---------- armies ----------
// squads of up to 100 (10 ranks x 10 files), 60% melee, 25% archers, 15% cavalry per side
const per = Math.floor(N / 2), sq = [];
const kindsFor = (i, n) => (i < n * 0.6 ? ['spear', 'sword', 'axe'][i % 3] : i < n * 0.85 ? 'archer' : 'cav');
for (const side of [0, 1]) {
  const squads = Math.ceil(per / 100);
  for (let i = 0; i < squads; i++) {
    const kind = kindsFor(i, squads);
    const col = kind === 'archer' ? 2 : kind === 'cav' ? 1 : 0; // 0 = front line
    const rowsInCol = Math.max(1, Math.ceil(squads * (col === 0 ? 0.6 : col === 2 ? 0.25 : 0.15)));
    const idxInCol = kind === 'archer' ? i - Math.ceil(squads * 0.6) : kind === 'cav' ? i - Math.ceil(squads * 0.85) : i;
    const span = H - 260, y0 = 150 + (span * (idxInCol + 0.5)) / rowsInCol - 45;
    const dir = side === 0 ? 1 : -1;
    const x0 = W / 2 - dir * (90 + col * 175) - (side === 0 ? 130 : 0);
    sq.push({ side, kind, dir, x0, y0, count: Math.min(100, per - i * 100), col });
  }
}
figs = [];
for (const s of sq) for (let k = 0; k < s.count; k++) {
  const rank = k % 10, file = Math.floor(k / 10);
  const sp = s.kind === 'cav' ? 17 : 13;
  const f = { s, rank, file, bx: s.x0 + (s.dir > 0 ? rank : 9 - rank) * sp, by: s.y0 + file * 9 + (rank % 2) * 2, ph: R(), x: 0, y: 0, kind: s.kind,
    nat: s.side === 0 ? 'cinder' : 'thorn', node: null };
  const tex = F[f.kind][f.nat].se.idle[0];
  f.node = MODE === 'particle' ? new PIXI.Particle({ texture: tex, x: 0, y: 0, anchorX: tex.defaultAnchor.x, anchorY: tex.defaultAnchor.y, scaleX: s.dir * 0.5, scaleY: 0.5 })
    : Object.assign(new PIXI.Sprite(tex), {});
  if (MODE !== 'particle') f.node.scale.set(s.dir * 0.5, 0.5);
  figs.push(f);
}
figs.sort((a, b) => a.by - b.by);
if (MODE === 'particle') figs.forEach((f) => figLayer.addParticle(f.node)); else figs.forEach((f) => figLayer.addChild(f.node));
const front = figs.filter((f) => f.s.col === 0 && f.rank >= 7);

// monsters: painted-style cutout stand-in drawn procedurally, mesh-deformed (see monster.js)
const monsters = [];
for (let m = 0; m < MONSTERS; m++) {
  const mon = buildMonster(app.renderer, { side: m % 2 });
  mon.node.position.set(W / 2 + (m % 2 ? 260 : -300), 300 + m * 380);
  monsterLayer.addChild(mon.node); monsters.push(mon);
}

// arrows: closed-form arcs from archer squads to the enemy front
const archers = figs.filter((f) => f.kind === 'archer');
const arrows = [];
for (let i = 0; i < ARROWS; i++) {
  const p = new PIXI.Particle({ texture: ARROW, anchorX: 0.5, anchorY: 0.5, scaleX: 0.6, scaleY: 0.6 });
  arrowLayer.addParticle(p);
  arrows.push({ p, t0: -R() * 1.4, T: 1.1 + R() * 0.4, sx: 0, sy: 0, ex: 0, ey: 0, h: 0 });
}
const launch = (a, t) => {
  const src = archers.length ? archers[Math.floor(R() * archers.length)] : figs[0];
  a.sx = src.x; a.sy = src.y - 14; a.ex = W / 2 + (src.s.dir > 0 ? 40 : -40) + (R() - 0.5) * 120; a.ey = src.y + (R() - 0.5) * 160;
  a.t0 = t; a.T = 1.0 + R() * 0.5; a.h = 110 + R() * 70;
};
// blood particles
const blood = [];
for (let i = 0; i < BLOOD; i++) { const p = new PIXI.Particle({ texture: DROPS[i % 4], anchorX: 0.5, anchorY: 0.5, scaleX: 0.5, scaleY: 0.5, alpha: 0 }); bloodLayer.addParticle(p); blood.push({ p, life: 0, vx: 0, vy: 0, vz: 0, z: 0, gx: 0, gy: 0 }); }
let bi = 0;
const spray = (x, y) => { for (let k = 0; k < 10; k++) { const b = blood[bi++ % BLOOD]; b.life = 0.6; b.gx = x; b.gy = y; b.z = 14; b.vx = (R() - 0.5) * 90; b.vy = (R() - 0.5) * 40; b.vz = 40 + R() * 60; } };

// ---------- frame update ----------
const dt = 1 / 60;
let sortMs = [], updMs = [];
function update(fr) {
  const t = fr * dt;
  const adv = Math.min(t, 2.2) * 32; // advance then hold
  const u0 = performance.now();
  for (let i = 0; i < figs.length; i++) {
    const f = figs[i], s = f.s;
    const fighting = t > 2.2 && s.col === 0 && f.rank >= 6;
    const wob = fighting ? Math.sin((t + f.ph * 3) * 7) * 1.5 : 0;
    f.x = f.bx + s.dir * (s.col === 2 ? adv * 0.2 : adv) + wob;
    f.y = f.by + (fighting ? Math.cos((t + f.ph) * 5) : 0);
    const pose = t <= 2.2 && s.col !== 2 ? 'walk' : fighting ? 'attack' : s.kind === 'archer' && t > 0.5 ? 'attack' : 'idle';
    const arr = F[f.kind][f.nat].se[pose];
    const tex = arr[Math.floor((t * (pose === 'walk' ? 8 : 5) + f.ph * 4)) % arr.length];
    const n = f.node;
    n.x = f.x; n.y = f.y;
    if (n.texture !== tex) n.texture = tex;
    if (SORT === 'zindex') n.zIndex = f.y;
  }
  // deaths: stamp the body and a splat into the ground texture, recycle the figure to its squad's rear
  if (t > 2.4) for (let d = 0; d < DEATHS; d++) {
    const f = front[Math.floor(R() * front.length)];
    stamp(SPLATS[Math.floor(R() * 4)], f.x, f.y - 2, R() * 6.28, 0xffffff, 0.85, 0.9 + R() * 0.6);
    stamp(F[f.kind][f.nat].se.die[1], f.x, f.y, 0, 0x9a9a9a, 1, f.s.dir);
    spray(f.x, f.y - 14);
  }
  // arrows
  for (const a of arrows) {
    let u = (t - a.t0) / a.T;
    if (u >= 1 || u < 0 && a.t0 <= 0 && t > 0) { if (u >= 1 && R() < 0.35) stamp(ARROW, a.ex, a.ey, Math.atan2(a.ey - a.sy, a.ex - a.sx) + 0.4, 0xffffff, 1); launch(a, t); u = 0; }
    const x = a.sx + (a.ex - a.sx) * u, gy = a.sy + (a.ey - a.sy) * u, z = 4 * a.h * u * (1 - u);
    a.p.x = x; a.p.y = gy - z;
    const dx = (a.ex - a.sx) / a.T, dy = (a.ey - a.sy) / a.T - 4 * a.h * (1 - 2 * u) / a.T;
    a.p.rotation = Math.atan2(dy, dx);
  }
  for (const b of blood) {
    if (b.life <= 0) { if (b.p.alpha) b.p.alpha = 0; continue; }
    b.life -= dt; b.vz -= 400 * dt; b.z = Math.max(0, b.z + b.vz * dt); b.gx += b.vx * dt; b.gy += b.vy * dt;
    b.p.x = b.gx; b.p.y = b.gy - b.z; b.p.alpha = Math.min(1, b.life * 3);
  }
  for (const m of monsters) m.update(t);
  const u1 = performance.now();
  if (SORT === 'manual') {
    // insertion sort on nearly sorted data, then hand Pixi the new order
    const list = MODE === 'particle' ? figLayer.particleChildren : figLayer.children;
    for (let i = 1; i < list.length; i++) { const v = list[i], y = v.y; let j = i - 1; while (j >= 0 && list[j].y > y) { list[j + 1] = list[j]; j--; } list[j + 1] = v; }
    if (MODE !== 'particle') { const rg = figLayer.parentRenderGroup ?? figLayer.renderGroup; if (rg) rg.structureDidChange = true; }
  }
  const u2 = performance.now();
  sortMs.push(u2 - u1); updMs.push(u1 - u0);
  // bake this frame's stamps
  if (stampLayer.children.length) {
    const s0 = performance.now();
    app.renderer.render({ container: stampLayer, target: decalRT, clear: false });
    stampMs.push(performance.now() - s0);
    for (const c of stampLayer.removeChildren()) stampPool.push(c);
  }
}

const SKIP = qn('skip', 180);
for (let f = 0; f < SKIP; f++) update(f);
const res = timeFrames(ctx, (f) => update(f + SKIP), FRAMES, 40);
let raf = null;
if (qn('raf', 0)) raf = await rafFps(ctx, (f) => update(SKIP + FRAMES + 40 + f), 3000);
done({ n: figs.length, mode: MODE, sort: SORT, atlas: ATLAS, arrows: ARROWS, blood: BLOOD, monsters: MONSTERS, res: RES, viewport: [VW, VH],
  atlasBuildMs: +atlasMs.toFixed(1), ...res, figUpdate: stats(updMs.slice(SKIP + 40)), sortMs: stats(sortMs.slice(SKIP + 40)), stampRender: stampMs.length ? stats(stampMs) : null,
  stampsTotal, raf, heapMB: memMB() });
