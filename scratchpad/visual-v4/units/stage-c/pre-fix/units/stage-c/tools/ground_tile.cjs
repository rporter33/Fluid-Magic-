// The lineup page's ground: a tile of battle a's own painted ground (plains, summer), cut from the field's middle where
// the scenery never stands, at the ground canvas' resolution (0.8 px a screen-plane unit). PAGE=<html> node ground_tile.cjs <out.png>
const fs = require('fs');
const { launch, openPage } = require('/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/perfqw/tools/lib.cjs');
(async () => {
  const browser = await launch();
  const { page } = await openPage(browser, process.env.PAGE, '?paused=1');
  const r = await page.evaluate(() => {
    const G = window.__battle.game; G.load('a');
    const gi = G.stage.groundInfo, cv = gi.canvas;
    // the field's middle in screen-plane units, as a canvas rect
    const w = 900, h = 420, X = -w / 2, Y = -h / 2 - 40;
    const c2 = document.createElement('canvas'); c2.width = Math.round(w * gi.RES); c2.height = Math.round(h * gi.RES);
    c2.getContext('2d').drawImage(cv, Math.round((X - gi.X0) * gi.RES), Math.round((Y - gi.Y0) * gi.RES), c2.width, c2.height, 0, 0, c2.width, c2.height);
    return { url: c2.toDataURL('image/png'), RES: gi.RES, X0: gi.X0, Y0: gi.Y0, W: cv.width, H: cv.height, base: gi.base, season: gi.season };
  });
  fs.writeFileSync(process.argv[2], Buffer.from(r.url.split(',')[1], 'base64'));
  delete r.url; console.log(JSON.stringify(r));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
