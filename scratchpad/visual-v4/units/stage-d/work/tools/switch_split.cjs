// node switch_split.cjs A.html B.html
// Where the first frame after a battle switch spends its time: camera, stage frame, HUD, render + GPU sync.
const { launch, openPage } = require('./lib.cjs');
const [A, B] = process.argv.slice(2);
(async () => {
  const b = await launch();
  for (const [tag, file] of [['A', A], ['B', B]]) {
    const { page, ctx } = await openPage(b, file, '?b=a&paused=1&t=3.7', { w: 1440, h: 900 });
    const r = await page.evaluate(() => {
      const G = window.__battle.game; G.loop = () => {}; G.playing = false;
      const gl = G.app.renderer.gl, px = new Uint8Array(4), now = () => performance.now();
      const a0 = now(); G.load('c'); const load = now() - a0;
      const fx = G.stage.fx.spells.find((q) => q.spell === 'entangle'), t = fx.t0 + 0.2;
      const out = { load: +load.toFixed(1), warm: G.buildMs.fxWarm || null, frames: [] };
      for (let i = 0; i < 3; i++) {
        const tt = t + i / 60, c0 = now(); G.applyCamera(tt); const c1 = now(); G.stage.frame(tt, 1, G.view); const c2 = now(); G.hud.update(tt); const c3 = now();
        G.app.renderer.render(G.app.stage); const c4 = now(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); const c5 = now();
        out.frames.push({ camera: +(c1 - c0).toFixed(1), stage: +(c2 - c1).toFixed(1), hud: +(c3 - c2).toFixed(1), render: +(c4 - c3).toFixed(1), gpu: +(c5 - c4).toFixed(1) });
      }
      return out;
    });
    console.log(tag, JSON.stringify(r));
    await ctx.close();
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
