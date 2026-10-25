// node run-proto.cjs <html> <proto.js> <out.json>: evaluate a prototype inside the mockup's closure (no edits to the page)
const { chromium } = require('/opt/node22/lib/node_modules/playwright'); const fs = require('fs');
const SP = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad';
const [html, proto, outp, wait] = process.argv.slice(2);
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: SP + '/vendor-d3/package/dist/d3.min.js', contentType: 'application/javascript' }));
  await page.route(/cdn\.jsdelivr\.net\/npm\/pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/, (r) => r.fulfill({ path: '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js', contentType: 'application/javascript' }));
  await page.goto('file://' + html, { waitUntil: 'load', timeout: 600000 });
  if (wait === 'ready') await page.waitForFunction(() => window.__mock && window.__mock.reliefReady && window.__mock.reliefReady(), null, { timeout: 900000, polling: 250 }); else await page.waitForFunction(() => window.__mock, null, { timeout: 60000 });
  const src = fs.readFileSync(proto, 'utf8'); const r = await page.evaluate((s) => window.__mock.ev(s), src);
  fs.writeFileSync(outp, typeof r === 'string' ? r : JSON.stringify(r)); console.log(typeof r === 'string' ? r.slice(0, 6000) : JSON.stringify(r).slice(0, 6000)); console.log('errors', errs);
  await b.close(); })();
