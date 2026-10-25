// node ev.cjs <html> <w> <h> <query> <expr...>: open the page and print __mock.ev(expr) for each expr
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const [file, w, h, q, ...exprs] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 4).join(' | ')));
  page.on('console', (m) => { if (m.type() === 'error' || m.text().startsWith('LOG')) errors.push('console: ' + m.text()); });
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
  await page.route(/cdn\.jsdelivr\.net\/npm\/pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/, (r) => r.fulfill({ path: '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js', contentType: 'application/javascript' }));
  await page.goto('file://' + file + (q && q !== '-' ? q : ''), { waitUntil: 'networkidle' });
  await page.waitForTimeout(+(process.env.WAIT || 2500));
  for (const e of exprs) { try { const v = await page.evaluate((src) => window.__mock.ev(src), e); console.log(e.slice(0, 60), '=>', JSON.stringify(v)); } catch (err) { console.log(e.slice(0, 60), 'ERR', err.message.split('\n')[0]); } }
  console.log('ERRORS', JSON.stringify(errors));
  await browser.close();
})();
