const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  for (const args of [[], ['--disable-gpu'], ['--disable-accelerated-2d-canvas']]) {
    const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('file://' + __dirname + '/bench.html'); await page.waitForTimeout(300);
    const out = {}; for (const m of ['none', 'fill', 'blit', 'sprites']) out[m] = await page.evaluate((mm) => window.run(mm), m);
    console.log(JSON.stringify(args), JSON.stringify(out));
    await browser.close();
  }
})();
