// Screenshots the calibration sketch with query parameters and reports page errors.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const [url, out, w, h] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', args: ['--disable-gpu', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: +w || 1440, height: +h || 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: out });
  console.log(JSON.stringify(errors));
  await browser.close();
})();
