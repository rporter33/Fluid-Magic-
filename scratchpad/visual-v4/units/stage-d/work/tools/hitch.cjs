// The first-effect hitch (critique fix 7): on a fresh page (a new context, so a new GL context), story time stepped at
// 1/60 s from just before Fireball 1's charge; each frame is timed in full (camera, stage frame, HUD, render submit and a
// 1-pixel readPixels, which waits for the GPU process: in SwiftShader the atlas upload and the shader compiles run there).
// The first frame that draws the effects layer against the median of the frames after it; and the warm-up's own cost at
// load (buildMs.fxWarm) on the fixed page. A and B interleaved, --runs fresh pages each.
//   node hitch.cjs A.html B.html OUT.json [--runs 3]
const fs = require('fs');
const { launch, openPage } = require('./lib.cjs');
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
(async () => {
  const browser = await launch();
  const runs = +opt('runs', 3), res = { A: a[0], B: a[1], runs: [], note: 'SwiftShader software GL on a shared 4-core VM (load average 10 to 15 during the runs): GPU work runs on the CPU, so these frames include what a real GPU does asynchronously; noisy' };
  for (let r = 0; r < runs; r++) for (const [tag, file] of [['A', a[0]], ['B', a[1]]]) {
    const { page, ctx } = await openPage(browser, file, '?b=a&paused=1&t=3.7', { w: 1440, h: 900 });
    const x = await page.evaluate(() => {
      const G = window.__battle.game; G.loop = () => {}; G.playing = false;
      const gl = G.app.renderer.gl, px = new Uint8Array(4), fx = G.stage.fx, rows = [];
      const t0 = fx.spells[0].t0 - 0.05;
      for (let i = 0; i < 90; i++) {
        const t = t0 + i / 60, A = performance.now();
        G.applyCamera(t); G.stage.frame(t, 1, G.view); G.hud.update(t); G.app.renderer.render(G.app.stage);
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        rows.push({ t: +t.toFixed(3), ms: +(performance.now() - A).toFixed(1), fx: fx.stats.particles + (fx.stats.lit || 0) + fx.units.used });
      }
      const first = rows.findIndex((q) => q.fx > 0);
      const after = rows.slice(first + 1, first + 31).map((q) => q.ms).sort((p, q) => p - q);
      return { warmMs: G.buildMs.fxWarm || null, firstFxFrame: first, firstMs: first >= 0 ? rows[first].ms : null, nextMedian: after[after.length >> 1], max: Math.max(...rows.map((q) => q.ms)), rows: rows.slice(Math.max(0, first - 3), first + 6) };
    });
    // the battle switch: battle c loaded from a, then its first frame with Entangle's charge on screen and the frames after
    // (the old page pays c's textures and the effects' first draw in that frame; the fixed page in its load, behind the switch)
    x.sw = await page.evaluate(() => {
      const G = window.__battle.game, gl = G.app.renderer.gl, px = new Uint8Array(4);
      const frame = (t) => { const A = performance.now(); G.applyCamera(t); G.stage.frame(t, 1, G.view); G.hud.update(t); G.app.renderer.render(G.app.stage); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); return performance.now() - A; };
      const A0 = performance.now(); G.load('c'); G.playing = false; const loadMs = performance.now() - A0;
      const fx = G.stage.fx.spells.find((q) => q.spell === 'entangle'), t0 = fx.t0 + 0.2;
      const first = frame(t0), rest = [];
      for (let i = 1; i <= 20; i++) rest.push(frame(t0 + i / 60));
      rest.sort((p, q) => p - q);
      return { loadMs: +loadMs.toFixed(1), firstMs: +first.toFixed(1), nextMedian: +rest[10].toFixed(1), total: +(loadMs + first).toFixed(1) };
    });
    res.runs.push({ round: r, page: tag, ...x });
    process.stderr.write(`${r} ${tag} warm ${x.warmMs} first fx frame ${x.firstMs} ms (next median ${x.nextMedian}) max ${x.max}; switch ${JSON.stringify(x.sw)}\n`);
    fs.writeFileSync(a[2], JSON.stringify(res, null, 1));
    await ctx.close();
  }
  const med = (xs) => { const s = xs.filter((v) => v !== null).sort((p, q) => p - q); return s.length ? s[s.length >> 1] : null; };
  const sum = (tag) => { const rs = res.runs.filter((q) => q.page === tag); return { firstMs: med(rs.map((q) => q.firstMs)), nextMedian: med(rs.map((q) => q.nextMedian)), warmMs: med(rs.map((q) => q.warmMs)),
    swLoad: med(rs.map((q) => q.sw.loadMs)), swFirst: med(rs.map((q) => q.sw.firstMs)), swNext: med(rs.map((q) => q.sw.nextMedian)), swTotal: med(rs.map((q) => q.sw.total)), n: rs.length }; };
  res.A_sum = sum('A'); res.B_sum = sum('B');
  const A = res.A_sum, B = res.B_sum;
  const warms = res.runs.filter((q) => q.page === 'B').map((q) => q.warmMs).sort((p, q) => p - q);
  res.summary = [`The first frame that draws Fireball 1 on a fresh page: ${A.firstMs} ms before the fixes against ${A.nextMedian} ms for the frames after it; ${B.firstMs} ms after, against ${B.nextMedian} ms. Median of ${runs} fresh pages each, GPU waits included (SwiftShader on a shared machine: noisy). The fixed page pays it at startup behind the loading screen: its warm-up render took ${Math.round(warms[0])} to ${Math.round(warms[warms.length - 1])} ms, which includes the whole scene's first draw that the old page pays in its first frame after the loading screen.`,
    `Switching to battle c, load and first frame together: ${A.swTotal} ms before, ${B.swTotal} ms after (load ${A.swLoad} and ${B.swLoad} ms). That first frame is battle c's own textures reaching the GPU on both pages; see switch_split.cjs for the split.`];
  fs.writeFileSync(a[2], JSON.stringify(res, null, 1));
  console.log(res.summary.join('\n'));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
