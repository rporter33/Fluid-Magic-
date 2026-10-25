const { chromium } = require('/opt/node22/lib/node_modules/playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
  await p.goto('file://' + process.argv[2], { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
  const cfg = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
  const idle = async () => { for (let k = 0; k < 150; k++) { await p.waitForTimeout(200); if (!(await p.evaluate(() => window.__pal.pending()))) break; } await p.waitForTimeout(1500); };
  for (const [nm, c] of [['v3', null], ['painted', cfg]]) { await p.evaluate((c) => window.__pal.apply(c), c); await idle(); await p.evaluate(() => window.__pal.mode('supply')); await idle(); await p.mouse.move(5, 5); await p.waitForTimeout(800); await p.screenshot({ path: `${process.argv[4]}/${nm}-mode-supply.png` }); await p.evaluate(() => window.__pal.mode('ownership')); await idle(); }
  await b.close(); })();
