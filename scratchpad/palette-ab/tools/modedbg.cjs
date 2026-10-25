const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const [file] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  for (const [pal, q] of [['bright', ''], ['painted', '?palette=painted']]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
    await page.goto('file://' + file + q, { waitUntil: 'networkidle' }); await page.waitForTimeout(2500);
    await page.keyboard.press('Shift+Digit3'); await page.waitForTimeout(2500);
    console.log(pal, await page.evaluate(() => window.__mock.ev(`(() => { const out = []; for (const nm of ['Thornbrook', 'Halebrook', 'Kharnath', 'Elmwick']) { const i = names.indexOf(nm), p = prov[i]; const [sx, sy] = toScreen(cent[i][0] + 12, cent[i][1] + 14); const c = document.getElementById('map').getContext('2d').getImageData(Math.round(sx * dpr), Math.round(sy * dpr), 1, 1).data; out.push(nm + ' ' + p.terrain + ' fillFor ' + fillFor(p) + ' fog ' + fogOf(i) + ' px ' + [c[0], c[1], c[2]].join(',')); } return out.join(' | ') + ' | mode ' + state.mode + ' decoAlpha ' + decoAlpha; })()`)));
    await page.close();
  }
  await browser.close();
})();
