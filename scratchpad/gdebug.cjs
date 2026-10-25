const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
  const page = await (await browser.newContext({ viewport: { width: 1240, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')));
  page.on('console', (m) => errors.push('console.' + m.type() + ': ' + m.text()));
  await page.route(/cdn\.jsdelivr\.net\/npm\/pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/, (r) => r.fulfill({ path: '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js', contentType: 'application/javascript' }));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto('file://' + process.argv[2], { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(8000);
  const r = await page.evaluate(() => ({ pixi: typeof PIXI, gal: typeof GALLERY, ready: typeof GALLERY !== 'undefined' && GALLERY.S.ready, status: document.getElementById('gStatus').textContent, fxlib: typeof FXLIB !== 'undefined' && FXLIB.ready }));
  console.log(JSON.stringify({ r, errors: errors.slice(0, 20) }, null, 1));
  await browser.close();
})();
