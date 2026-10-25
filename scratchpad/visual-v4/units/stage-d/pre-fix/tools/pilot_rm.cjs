// The pilot page under the OS reduced-motion setting: nothing autoplays, the gallery says why. node pilot_rm.cjs PAGE
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.route(/cdn\.jsdelivr\.net\/npm\/pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/, (r) => r.fulfill({ path: '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js', contentType: 'application/javascript' }));
  await page.goto('file://' + process.argv[2], { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => typeof GALLERY !== 'undefined' && GALLERY.S.ready, null, { timeout: 120000 });
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => ({ galleryPlaying: GALLERY.S.playing, galleryT: GALLERY.S.t, status: document.getElementById('gStatus').textContent, videosPaused: [...document.querySelectorAll('video')].map((v) => v.paused), reduced: GALLERY.S && FX_MOTION.os }));
  console.log(JSON.stringify({ r, errors }));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
