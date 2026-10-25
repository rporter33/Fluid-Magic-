// node run.cjs <html> <probe.js> <out.json> [w h dpr]: evaluate a probe inside the mockup's closure after the relief is ready (read-only)
const { chromium } = require('/opt/node22/lib/node_modules/playwright'); const fs = require('fs');
const SP = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad';
const [html, probe, outp, w = '1440', h = '900', dpr = '1'] = process.argv.slice(2);
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--js-flags=--max-old-space-size=4096'] });
  const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: +dpr }); const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: SP + '/vendor-d3/package/dist/d3.min.js', contentType: 'application/javascript' }));
  await page.route(/cdn\.jsdelivr\.net\/npm\/pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/, (r) => r.fulfill({ path: '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js', contentType: 'application/javascript' }));
  await page.goto('file://' + html, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__mock && window.__mock.reliefReady && window.__mock.reliefReady(), null, { timeout: 900000, polling: 250 });
  await page.waitForTimeout(1200);
  const src = fs.readFileSync(probe, 'utf8'); const r = await page.evaluate((s) => window.__mock.ev(s), src);
  fs.writeFileSync(outp, typeof r === 'string' ? r : JSON.stringify(r)); console.log(typeof r === 'string' ? r.slice(0, 8000) : JSON.stringify(r).slice(0, 8000)); console.log('errors', errs);
  await b.close(); })();
