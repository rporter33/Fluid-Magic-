// node adshots.cjs <html> <outDir>: the art director's own shots, both palettes, every zoom band, CVD, modes, fog, wild.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const [file, out] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errors = [], log = {};
  const open = async (pal, w = 1440, h = 900) => {
    const q = pal === 'painted' ? '?palette=painted' : '';
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    page.on('pageerror', (e) => errors.push(`[${pal}] pageerror: ` + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`[${pal}] console: ` + m.text()); });
    await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
    await page.goto('file://' + file + q, { waitUntil: 'networkidle' }); await page.waitForTimeout(2500);
    await page.mouse.move(1000, 885); return page;
  };
  const shot = (page, name) => page.screenshot({ path: `${out}/${name}.png` });
  const zoom = async (page, s, name, ms = 3500) => { await page.evaluate(([s, n]) => window.__mock.zoomTo(s, n), [s, name]); await page.waitForTimeout(ms); return page.evaluate(() => window.__mock.band()); };
  const views = [
    ['far-min', 0.2573, 'Stagmoor'], ['far-030', 0.30, 'Stagmoor'], ['far-038', 0.38, 'Stagmoor'],
    ['mid-060-ashfen', 0.60, 'Ashfen'], ['mid-100-halebrook', 1.0, 'Halebrook'],
    ['near-140-stagmoor', 1.4, 'Stagmoor'], ['near-204-stagmoor', 2.04, 'Stagmoor'],
    ['near-204-marholt', 2.04, 'Marholt'], ['near-204-brambarrow', 2.04, 'Brambarrow'], ['near-204-duskholt', 2.04, 'Duskholt'],
    ['near-204-elmwick', 2.04, 'Elmwick'], ['near-204-redbarrow', 2.04, 'Redbarrow'], ['near-204-rookmere', 2.04, 'Rookmere'],
    ['near-204-kharnath', 2.04, 'Kharnath'], ['near-140-halebrook', 1.4, 'Halebrook'], ['near-140-ashstead', 1.4, 'Ashstead'],
  ];
  for (const pal of ['painted', 'bright']) {
    let page = await open(pal);
    log[pal] = { start: { s: await page.evaluate(() => window.__mock.scale()), band: await page.evaluate(() => window.__mock.band()) } };
    await shot(page, `${pal}-start`);
    for (const [n, s, p] of views) { log[pal][n] = await zoom(page, s, p); await shot(page, `${pal}-${n}`); }
    await page.keyboard.press('z'); await page.waitForTimeout(1500);
    // CVD at start and at Near over Forest/Swamp/Hills
    for (const v of ['deutan', 'tritan', 'protan']) { await page.selectOption('#vision', v); await page.waitForTimeout(900); await shot(page, `${pal}-start-${v}`); }
    await zoom(page, 1.4, 'Halebrook');
    for (const v of ['deutan', 'tritan']) { await page.selectOption('#vision', v); await page.waitForTimeout(900); await shot(page, `${pal}-near-halebrook-${v}`); }
    await page.selectOption('#vision', 'normal'); await page.keyboard.press('z'); await page.waitForTimeout(1500);
    // modes
    for (let k = 2; k <= 6; k++) { await page.keyboard.press('Shift+Digit' + k); await page.waitForTimeout(1500); await shot(page, `${pal}-mode${k}`); }
    await page.keyboard.press('Shift+Digit1'); await page.waitForTimeout(1500);
    // fog view and the wild at Near
    await zoom(page, 1.0, 'Deepmoss'); await shot(page, `${pal}-fog-deepmoss`);
    await zoom(page, 1.6, 'Tormere'); await shot(page, `${pal}-wild-ashspine-near`);
    await zoom(page, 1.2, 'Halebrook'); await shot(page, `${pal}-wild-mere`);
    await page.close();
  }
  const page = await open('painted', 390, 844); await shot(page, 'painted-phone'); await page.close();
  fs.writeFileSync(`${out}/log.json`, JSON.stringify({ log, errors }, null, 1));
  console.log(JSON.stringify(log)); console.log('ERRORS ' + JSON.stringify(errors));
  await browser.close();
})();
