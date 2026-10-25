// node faces.cjs <html> <out.json>: the colors the fixes draw, read from the page's own functions in both palettes (setPalette), with
// alpha strokes composited over the fill on a 1 x 1 canvas exactly as the bake does. Colors the as-built page drew are listed beside them.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const [file, outFile] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
  await page.goto('file://' + file, { waitUntil: 'networkidle' }); await page.waitForTimeout(2000);
  const res = {};
  for (const pal of ['bright', 'painted']) {
    res[pal] = await page.evaluate((pal) => window.__mock.ev(`(() => {
      setPalette('${pal}');
      const c = makeCanvas(1, 1), g = c.getContext('2d', { willReadFrequently: true });
      const over = (col, base) => { g.globalAlpha = 1; g.fillStyle = base; g.fillRect(0, 0, 1, 1); g.fillStyle = col; g.fillRect(0, 0, 1, 1); const d = g.getImageData(0, 0, 1, 1).data; return rgb2hex([d[0], d[1], d[2]]).toUpperCase(); };
      const F = (t) => TERRAIN[t].fill, up = (h) => h.toUpperCase();
      const fo = F('forest'), pl = F('plains'), mt = F('mountains'), T = treeP({ ...faces(pl), fill: pl, line: null });
      return {
        fills: Object.fromEntries(Object.keys(TERRAIN).map((t) => [t, up(F(t))])),
        forestCrown: { fill: up(fo), litBuilt: up(faces(fo).lit), litFixed: up(forestLit22(fo)), shade: up(faces(fo).shade) },
        plainsTrees: { fill: up(pl), litBuilt: up(faces(pl).lit), shadeBuilt: up(faces(pl).shade), trunkBuilt: up(shadeL(pl, -30)), litFixed: up(T.lit), shadeFixed: up(T.shade), trunkFixed: up(T.trunk) },
        peaks: { fill: up(mt), litBuilt: '#B4C1C6', shadeBuilt: '#6E7F86', litFixed: up(faces(mt).lit), shadeFixed: up(peakShade26(mt)), wildLit: '#8A857E', wildShade: '#46423F', granite: '#2A292C' },
        water: { fill: up(mt), pond: '#A6C7CC', brook: '#BCD6D9', bankInk: '#35535A', pondBankBuilt: over('rgba(53,83,90,.7)', mt), pondBankFixed: over('rgba(53,83,90,.9)', mt), brookUpperBuilt: over('rgba(53,83,90,.55)', mt), brookUpperFixed: over('rgba(53,83,90,.8)', mt) },
        grass: { plains: { fill: up(pl), stippleDark: over(rgba(shadeL(pl, -8), 0.55), pl), stippleLight: over(rgba(shadeL(pl, 8), 0.55), pl), tuft: over(rgba(shadeL(pl, -20), 0.5), pl) },
                 hills: { fill: up(F('hills')), tuft: over(rgba(shadeL(F('hills'), 12), 0.45), F('hills')) }, swamp: { fill: up(F('swamp')), tuft: over(rgba(shadeL(F('swamp'), 14), 0.45), F('swamp')) } },
        meadow: '#EFE7CF',
      };
    })()`), pal);
  }
  await page.evaluate(() => window.__mock.ev("setPalette('bright')"));
  fs.writeFileSync(outFile, JSON.stringify({ ...res, errors }, null, 1)); console.log(JSON.stringify(res, null, 1)); console.log('ERRORS ' + JSON.stringify(errors));
  await browser.close();
})();
