// Decal baking: bodies, blood splats and stuck arrows stamped into a ground RenderTexture,
// against keeping every decal as a live sprite. Query: size (RT edge), live (count for the live test).
import { PIXI, makeApp, timeFrames, done, qn, rng, stats } from './harness.js';
import { buildAtlas } from './figures.js';

const SIZE = qn('size', 2048), LIVE = qn('live', 8000);
const ctx = await makeApp({ width: 1920, height: 1080, background: 0xcdb386 });
const { app, sync } = ctx;
const R = rng(11);
const atlas = buildAtlas(app.renderer, { nations: ['cinder', 'thorn'] });
const bodies = [];
for (const k of ['spear', 'sword', 'axe', 'archer']) for (const n of ['cinder', 'thorn']) bodies.push(atlas.frames[k][n].se.die[1]);
const splatG = new PIXI.Graphics();
for (let k = 0; k < 4; k++) {
  const cx = 24 + k * 48, cy = 24, pts = [];
  for (let a = 0; a < 16; a++) { const r = 10 + 9 * Math.abs(Math.sin(a * 2.3 + k * 1.7)); pts.push(cx + Math.cos(a / 16 * 6.283) * r, cy + Math.sin(a / 16 * 6.283) * r * 0.55); }
  splatG.poly(pts).fill({ color: 0x6a0a0a, alpha: 0.75 });
}
const splatRT = PIXI.RenderTexture.create({ width: 192, height: 48 });
app.renderer.render({ container: splatG, target: splatRT });
const splats = [0, 1, 2, 3].map((k) => { const t = new PIXI.Texture({ source: splatRT.source, frame: new PIXI.Rectangle(k * 48, 0, 48, 48) }); t.defaultAnchor = { x: 0.5, y: 0.5 }; return t; });
// NB: bodies and splats come from two sources; Pixi batches up to the GPU's texture-unit limit per draw.

const rt = PIXI.RenderTexture.create({ width: SIZE, height: Math.round(SIZE * (qn('aspect', 1))) });
const layer = new PIXI.Container();
const pool = [];
const fill = (n) => {
  for (let i = 0; i < n; i++) {
    const s = pool.pop() ?? new PIXI.Sprite();
    const body = R() < 0.5;
    s.texture = body ? bodies[Math.floor(R() * bodies.length)] : splats[Math.floor(R() * 4)];
    s.position.set(R() * rt.width, R() * rt.height); s.rotation = body ? 0 : R() * 6.28; s.tint = body ? 0x9a9a9a : 0xffffff;
    s.scale.set(body ? 0.5 : 0.8 + R() * 0.8);
    layer.addChild(s);
  }
};
const flush = (clear = false) => { app.renderer.render({ container: layer, target: rt, clear }); for (const c of layer.removeChildren()) pool.push(c); };

const out = { rtSize: [rt.width, rt.height], rtMB: +(rt.width * rt.height * 4 / 1048576).toFixed(1), batch: {} };
// warm the pipeline
fill(50); flush(true); sync();
for (const k of [1, 10, 50, 200, 1000]) {
  const cpu = [], tot = [];
  for (let r = 0; r < 30; r++) {
    fill(k); const t0 = performance.now(); flush(false); const t1 = performance.now(); sync(); const t2 = performance.now();
    cpu.push(t1 - t0); tot.push(t2 - t0);
  }
  out.batch[k] = { cpu: stats(cpu), withGpu: stats(tot) };
}
// full re-bake of 8000 stamps (what a backward seek or a context restore costs)
{
  const cpu = [], tot = [];
  for (let r = 0; r < 5; r++) { fill(8000); const t0 = performance.now(); flush(true); const t1 = performance.now(); sync(); const t2 = performance.now(); cpu.push(t1 - t0); tot.push(t2 - t0); }
  out.rebake8000 = { cpu: stats(cpu), withGpu: stats(tot) };
}
// per-frame cost of showing the field: one baked sprite vs LIVE static sprites in a render group
const shown = new PIXI.Sprite(rt); shown.width = 1920; shown.height = 1080;
app.stage.addChild(shown);
out.frameBaked = timeFrames(ctx, () => {}, 120, 20);
app.stage.removeChild(shown);
const live = new PIXI.Container({ isRenderGroup: true });
for (let i = 0; i < LIVE; i++) {
  const body = R() < 0.5;
  const s = new PIXI.Sprite(body ? bodies[Math.floor(R() * bodies.length)] : splats[Math.floor(R() * 4)]);
  s.position.set(R() * 1920, R() * 1080); s.rotation = body ? 0 : R() * 6.28; s.scale.set(body ? 0.5 : 1); live.addChild(s);
}
app.stage.addChild(live);
out.frameLive = timeFrames(ctx, () => {}, 120, 20);
out.liveCount = LIVE;
done(out);
