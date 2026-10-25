// node samescale.cjs <html> <outDir>: the map at the reference's own scale (the reference spans the whole map in 1536 px; the start view
// spans it in about 671 px, so s = 0.418 x 1536 / 671 = 0.957), centred on a few provinces, both palettes; the map canvas only.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const [file, out] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  for (const pal of ['painted', 'bright']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
    await page.goto('file://' + file + (pal === 'painted' ? '?palette=painted' : ''), { waitUntil: 'networkidle' }); await page.waitForTimeout(2500);
    await page.mouse.move(1000, 885);
    for (const n of ['Elmwick', 'Halebrook', 'Redbarrow']) {
      await page.evaluate((nm) => window.__mock.zoomTo(0.957, nm), n); await page.waitForTimeout(3000);
      const r = await page.evaluate(() => { const b = document.getElementById('map').getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; });
      await page.screenshot({ path: `${out}/${pal}-same-${n}.png`, clip: { x: r[0], y: r[1], width: Math.min(r[2], 1060), height: r[3] } });
    }
    await page.close();
  }
  await browser.close();
})();
