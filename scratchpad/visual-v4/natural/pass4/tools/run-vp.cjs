const { chromium } = require('/opt/node22/lib/node_modules/playwright'); const fs = require('fs');
const SP = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad';
const [html, proto, w, h, dpr, touch] = process.argv.slice(2);
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: +dpr, hasTouch: touch === '1', isMobile: touch === '1' }); const page = await ctx.newPage();
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: SP + '/vendor-d3/package/dist/d3.min.js', contentType: 'application/javascript' }));
  await page.route(/cdn\.jsdelivr\.net\/npm\/pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/, (r) => r.fulfill({ path: '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js', contentType: 'application/javascript' }));
  await page.goto('file://' + html, { waitUntil: 'load', timeout: 600000 }); await page.waitForFunction(() => window.__mock, null, { timeout: 60000 }); await page.waitForTimeout(1500);
  console.log(await page.evaluate((s) => window.__mock.ev(s), fs.readFileSync(proto, 'utf8'))); await b.close(); })();
