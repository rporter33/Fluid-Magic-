// Screenshots local SVG or HTML files with the preinstalled Playwright Chromium.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const [file, out, w, h] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', args: ['--disable-gpu', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: +w || 1400, height: +h || 900 } });
  await page.goto('file://' + file, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: out, fullPage: false });
  await browser.close();
})();
