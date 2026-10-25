const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const [file] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const open = async (q = '') => { const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }); await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' })); await page.goto('file://' + file + q, { waitUntil: 'networkidle' }); await page.waitForTimeout(2500); return page; };
  const FH = `(() => view.art.broadleaf.frames.map((f) => { const d = f.getContext('2d').getImageData(0, 0, f.width, f.height).data; let h = 0x811c9dc5; for (let k = 0; k < d.length; k++) { h ^= d[k]; h = Math.imul(h, 0x01000193); } return f.width + 'x' + f.height + ':' + (h >>> 0); }).slice(0, 3).join(' '))()`;
  const S = `(() => { invalidateBakes(); firstPaint = true; CK = null; draw(); const c = document.getElementById('map'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0x811c9dc5; for (let k = 0; k < d.length; k++) { h ^= d[k]; h = Math.imul(h, 0x01000193); } return h >>> 0; })()`;
  let page = await open('');
  await page.evaluate(() => window.__mock.tryArt('broadleaf')); await page.waitForTimeout(1000);
  console.log('bright art frames', await page.evaluate((s) => window.__mock.ev(s), FH), 'scratch', await page.evaluate((s) => window.__mock.ev(s), S));
  await page.click('#mockctl [data-ctl="palette"] [data-v="painted"]'); await page.mouse.move(700, 20); await page.waitForTimeout(1500);
  console.log('switched frames  ', await page.evaluate((s) => window.__mock.ev(s), FH), 'scratch', await page.evaluate((s) => window.__mock.ev(s), S), 'checks', await page.evaluate(() => window.__mock.checks().stable.first), 'scratch again', await page.evaluate((s) => window.__mock.ev(s), S), await page.evaluate(() => window.__mock.ev('KEYS[0] + " | " + staticSig()')));
  await page.close();
  page = await open('?palette=painted');
  await page.evaluate(() => window.__mock.tryArt('broadleaf')); await page.waitForTimeout(1000);
  console.log('fresh painted art', await page.evaluate((s) => window.__mock.ev(s), FH), 'scratch', await page.evaluate((s) => window.__mock.ev(s), S), 'checks', await page.evaluate(() => window.__mock.checks().stable.first), 'scratch again', await page.evaluate((s) => window.__mock.ev(s), S), await page.evaluate(() => window.__mock.ev('KEYS[0] + " | " + staticSig()')));
  await page.close(); await browser.close();
})();
