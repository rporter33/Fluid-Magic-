// Generic runner: node run.cjs <page.html> '<query>' [--throttle N] [--w W --h H --dpr D] [--shot out.png] [--timeout ms]
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'), fs = require('fs');
const ROOT = __dirname, PIXI = '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.mjs';
(async () => {
  const a = process.argv.slice(2); const page_ = a[0], q = a[1] || '';
  const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--enable-precise-memory-info', '--js-flags=--expose-gc'] });
  const ctx = await browser.newContext({ viewport: { width: +opt('w', 1920), height: +opt('h', 1080) }, deviceScaleFactor: +opt('dpr', 1) });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.route('http://bench.local/**', (r) => {
    const u = new URL(r.request().url()); let p = u.pathname.slice(1);
    const file = p === 'pixi.mjs' ? PIXI : path.join(ROOT, p);
    if (!fs.existsSync(file)) return r.fulfill({ status: 404, body: 'nf' });
    const ct = file.endsWith('.html') ? 'text/html' : file.endsWith('.png') ? 'image/png' : file.endsWith('.webp') ? 'image/webp' : 'application/javascript';
    r.fulfill({ path: file, contentType: ct });
  });
  const thr = +opt('throttle', 1);
  if (thr > 1) { const c = await ctx.newCDPSession(page); await c.send('Emulation.setCPUThrottlingRate', { rate: thr }); }
  await page.goto('http://bench.local/' + page_ + (q ? '?' + q : ''), { waitUntil: 'commit' });
  const t0 = Date.now(), to = +opt('timeout', 120000);
  let res = null;
  while (Date.now() - t0 < to) { res = await page.evaluate(() => window.__result || null).catch(() => null); if (res || errors.length) break; await page.waitForTimeout(200); }
  const shot = opt('shot', null); if (shot) await page.screenshot({ path: shot });
  const shots = await page.evaluate(() => (window.__shots || []).map((s) => [s.name, s.url])).catch(() => []);
  const sdir = opt('shotdir', path.join(ROOT, 'out'));
  for (const [name, url] of shots) { const m = /^data:image\/(png|jpeg);base64,(.*)$/.exec(url); if (m) fs.writeFileSync(path.join(sdir, name + (m[1] === 'png' ? '.png' : '.jpg')), Buffer.from(m[2], 'base64')); }
  console.log(JSON.stringify({ q, res, errors }));
  await browser.close();
})();
