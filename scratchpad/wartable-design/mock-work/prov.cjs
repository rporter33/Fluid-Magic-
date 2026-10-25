const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const [file, outDir] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
  await page.goto('file://' + file, { waitUntil: 'networkidle' }); await page.waitForTimeout(800);
  const [x, y] = await page.evaluate(() => window.__mock.at('Kharnath'));
  await page.mouse.click(x, y + 22); await page.waitForTimeout(400);
  console.log('dock title', await page.locator('#leftDock h2').textContent().catch(() => 'none'));
  await page.screenshot({ path: outDir + '/p-prov.png' });
  await page.locator('#leftDock .tab', { hasText: 'Recruit' }).click(); await page.waitForTimeout(300); await page.screenshot({ path: outDir + '/p-recruit.png' });
  await page.locator('#leftDock .tab', { hasText: 'Forces' }).click(); await page.waitForTimeout(300); await page.screenshot({ path: outDir + '/p-forces.png' });
  // hover a province for its tooltip, then Ashfen's (contested), then the strip portrait tooltip
  const [ax, ay] = await page.evaluate(() => window.__mock.at('Ashfen')); await page.keyboard.press('Escape');
  await page.mouse.move(ax + 30, ay + 30); await page.waitForTimeout(900); await page.screenshot({ path: outDir + '/p-ashfen-tip.png' });
  // Ilsa tooltip (notched frame)
  await page.hover('.badge[data-tip="cmd:ilsa"]'); await page.waitForTimeout(800); await page.screenshot({ path: outDir + '/p-ilsa-tip.png' });
  // keys: M cycles, H hides UI, [ ] docks, T lock, Shift detail
  for (const k of ['m', 'm', 'h', 'h', '[', '[', ']', ']']) { await page.keyboard.press(k); await page.waitForTimeout(80); }
  await page.keyboard.press('Shift+Digit1'); await page.keyboard.press('Digit2'); await page.keyboard.press('Space'); await page.waitForTimeout(1200); await page.keyboard.press('Space');
  console.log('date', await page.locator('#date').textContent(), 'mode legend', await page.locator('.modes .legend').textContent());
  // reduced motion + table off + detail reduced toggles
  await page.click('#rmotion'); await page.click('[data-ctl="detail"] [data-v="reduced"]'); await page.waitForTimeout(400); await page.screenshot({ path: outDir + '/p-reduced.png' });
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
