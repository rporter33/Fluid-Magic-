// Review screenshots for the war-table mockup. Usage: node review.cjs <html> <outDir> [prefix] [only]
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const [file, outDir, prefix = 'r-', only = ''] = process.argv.slice(2);
const want = (k) => !only || only.split(',').includes(k);
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const errors = [];
  const open = async (w, h) => {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + ' @ ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
    await page.goto('file://' + file, { waitUntil: 'networkidle' }).catch((e) => errors.push('goto ' + e.message));
    await page.waitForTimeout(900);
    return page;
  };
  const shot = (page, name) => page.screenshot({ path: `${outDir}/${prefix}${name}.png` });
  const log = [];
  const page = await open(1440, 900);
  log.push('info ' + JSON.stringify(await page.evaluate(() => window.__mock.info())));
  log.push('across ' + (await page.evaluate(() => window.__mock.across())) + ' closed ' + (await page.evaluate(() => window.__mock.closed())));
  log.push('scales fit ' + (await page.evaluate(() => window.__mock.fitScale())).toFixed(3) + ' min ' + (await page.evaluate(() => window.__mock.minScale())).toFixed(3) + ' max ' + (await page.evaluate(() => window.__mock.maxScale())).toFixed(3) + ' band ' + (await page.evaluate(() => window.__mock.band())));
  if (want('desktop')) await shot(page, 'desktop');
  if (want('perf')) {
    log.push('draw ms (fit) ' + (await page.evaluate(() => window.__mock.perf(20))).toFixed(2));
    log.push('pan ms (fit) ' + (await page.evaluate(() => window.__mock.pan(3, 1, 20))).toFixed(2));
  }
  if (want('lean')) {
    await page.mouse.move(600, 500); for (let k = 0; k < 12; k++) { await page.mouse.wheel(0, 240); await page.waitForTimeout(40); }
    await page.waitForTimeout(500); log.push('lean scale ' + (await page.evaluate(() => window.__mock.scale())).toFixed(3) + ' band ' + (await page.evaluate(() => window.__mock.band())));
    log.push('draw ms (lean) ' + (await page.evaluate(() => window.__mock.perf(10))).toFixed(2));
    await shot(page, 'lean');
    await page.keyboard.press('z'); await page.waitForTimeout(400);
  }
  if (want('near')) {
    await page.evaluate(() => window.__mock.zoomTo(window.__mock.maxScale() * 0.85, 'Kharnath')); await page.waitForTimeout(1200);
    log.push('near band ' + (await page.evaluate(() => window.__mock.band())) + ' draw ms ' + (await page.evaluate(() => window.__mock.perf(10))).toFixed(2));
    await shot(page, 'near');
    await page.evaluate(() => window.__mock.zoomTo(0.75, 'Ashfen')); await page.waitForTimeout(900);
    await shot(page, 'mid-ashfen');
    await page.keyboard.press('z'); await page.waitForTimeout(400);
  }
  if (want('wild')) {
    const [wx, wy] = await page.evaluate(() => window.__mock.wildAt('ashspine'));
    await page.mouse.move(wx, wy); await page.waitForTimeout(900);
    await shot(page, 'wild-hover');
    const across = await page.evaluate(() => window.__mock.across());
    if (across) { const [ax, ay] = await page.evaluate((n) => window.__mock.at(n), across); await page.mouse.click(ax, ay, { button: 'right' }); await page.waitForTimeout(300); }
    await page.mouse.move(wx, wy + 3); await page.waitForTimeout(900);
    await shot(page, 'wild');
    const closed = await page.evaluate(() => window.__mock.closed());
    if (closed) { const [cx2, cy2] = await page.evaluate((n) => window.__mock.at(n), closed); await page.mouse.click(cx2, cy2, { button: 'right' }); await page.waitForTimeout(300); log.push('toast after closed: ' + (await page.locator('.toast').first().textContent())); }
    await page.mouse.click(wx, wy, { button: 'right' }); await page.waitForTimeout(200); log.push('toast after wild: ' + (await page.locator('.toast').first().textContent()));
    await page.mouse.move(700, 880);
  }
  if (want('months')) {
    for (const m of [12, 24, 40, 70]) { await page.evaluate((mm) => window.__mock.setMonth(mm), m); await page.waitForTimeout(1500); await shot(page, 'm' + m); }
    await page.evaluate(() => window.__mock.zoomTo(1.25, 'Ashfen')); await page.waitForTimeout(900); await shot(page, 'm70-ashfen');
    await page.evaluate(() => window.__mock.setMonth(24)); await page.waitForTimeout(900); await shot(page, 'm24-ashfen');
    await page.evaluate(() => window.__mock.setMonth(3)); await page.keyboard.press('z'); await page.waitForTimeout(600);
  }
  if (want('modes')) {
    await page.keyboard.press('Shift+Digit5'); await page.waitForTimeout(500); await shot(page, 'pop-mode');
    await page.keyboard.press('Shift+Digit2'); await page.waitForTimeout(500); await shot(page, 'dominion');
    await page.keyboard.press('Shift+Digit1'); await page.waitForTimeout(400);
  }
  if (want('fog')) { await page.evaluate(() => window.__mock.zoomTo(1.0, 'Deepmoss')); await page.waitForTimeout(1000); await shot(page, 'fog'); await page.keyboard.press('z'); await page.waitForTimeout(400); }
  if (want('portraits')) { await page.click('#btnPortraits'); await page.waitForTimeout(600); await shot(page, 'portraits-modal'); await page.keyboard.press('Escape'); }
  if (want('chrome')) {
    await shot(page, 'chrome-approved'); await page.click('[data-ctl="chrome"] [data-v="warm"]'); await page.waitForTimeout(300); await shot(page, 'chrome-warm');
    await page.click('[data-ctl="chrome"] [data-v="approved"]'); await page.waitForTimeout(200);
    await page.click('[data-ctl="parch"] [data-v="on"]'); await page.waitForTimeout(100);
    const msg = page.locator('.msg').first(); await msg.hover(); await page.locator('.msg .acts button', { hasText: 'Report' }).first().click({ force: true }); await page.waitForTimeout(400); await shot(page, 'report-parchment');
    await page.keyboard.press('Escape'); await page.click('[data-ctl="parch"] [data-v="off"]');
    await page.locator('.msg').first().hover(); await page.locator('.msg .acts button', { hasText: 'Report' }).first().click({ force: true }); await page.waitForTimeout(400); await shot(page, 'report'); await page.keyboard.press('Escape');
  }
  if (want('vision')) { await page.selectOption('#vision', 'deutan'); await page.waitForTimeout(500); await shot(page, 'deutan'); await page.selectOption('#vision', 'normal'); }
  if (want('table')) {
    await page.mouse.move(600, 500); for (let k = 0; k < 8; k++) { await page.mouse.wheel(0, 240); await page.waitForTimeout(30); }
    await page.click('[data-ctl="table"] [data-v="simple"]'); await page.waitForTimeout(400); await shot(page, 'table-simple');
    await page.click('[data-ctl="table"] [data-v="off"]'); await page.waitForTimeout(400); await shot(page, 'table-off');
    await page.click('[data-ctl="table"] [data-v="full"]'); await page.keyboard.press('z'); await page.waitForTimeout(400);
  }
  if (want('pass')) { await page.click('#btnPass'); await page.waitForTimeout(400); await shot(page, 'passability'); await page.click('#btnPass'); }
  await page.close();
  if (want('mid')) { const p2 = await open(1024, 768); await shot(p2, 'mid'); await p2.close(); }
  if (want('phone')) { const p3 = await open(390, 844); await shot(p3, 'phone'); await p3.close(); }
  if (want('shot1280')) { const p4 = await open(1280, 720); await shot(p4, '1280'); await p4.close(); }
  console.log(log.join('\n')); console.log('ERRORS ' + JSON.stringify(errors));
  await browser.close();
})();
