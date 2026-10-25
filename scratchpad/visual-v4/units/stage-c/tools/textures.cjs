// Managed GPU textures and their largest side, before and after: each page in Painted (all three battles loaded and
// drawn, tier S then tier H) and Procedural.   node textures.cjs <before.html> <after.html>
const { launch, openPage } = require('/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/perfqw/tools/lib.cjs');
(async () => {
  const browser = await launch();
  const out = {};
  for (const file of process.argv.slice(2)) {
    for (const mode of ['painted', 'procedural']) {
      const { page, ctx } = await openPage(browser, file, '?paused=1' + (mode === 'procedural' ? '&fig=procedural' : ''));
      out[file.split('/').slice(-2).join('/') + ' ' + mode] = await page.evaluate(async () => {
        const G = window.__battle.game, r = G.app.renderer;
        const stat = () => { const t = r.texture.managedTextures.filter(Boolean); return { count: t.length, maxSide: Math.max(...t.map((s) => Math.max(s.pixelWidth || s.width || 0, s.pixelHeight || s.height || 0))), mpx: +(t.reduce((a, s) => a + (s.pixelWidth || 0) * (s.pixelHeight || 0), 0) / 1e6).toFixed(1) }; };
        const rows = {};
        for (const k of ['a', 'b', 'c']) {
          G.load(k); G.render(2.2);
          await new Promise((res) => setTimeout(res, 50));
          if (G.stage.paint) { G.stage.applyPaintTier('H'); G.render(2.2); }
          rows[k] = stat();
        }
        return rows;
      });
      await ctx.close();
    }
  }
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
