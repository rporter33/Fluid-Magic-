const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
  await p.goto('file://' + process.argv[2], { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
  console.log(JSON.stringify(await p.evaluate(() => { const r = document.getElementById('map').getBoundingClientRect(); const v = window.__pal.info().view; return { left: r.left, top: r.top, clip: [r.left + v.l, r.top + v.t, r.left + v.r, r.top + v.b] }; }))); await b.close(); })();
