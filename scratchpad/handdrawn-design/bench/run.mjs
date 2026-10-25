import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const url = 'file://' + new URL('./bench.html', import.meta.url).pathname;
const runs = JSON.parse(process.argv[2]);
const browser = await chromium.launch();
for (const r of runs) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto(url + '?' + r.q);
  await page.waitForFunction(() => window.RESULT, null, { timeout: 300000 });
  const res = await page.evaluate(() => window.RESULT);
  console.log(JSON.stringify({ name: r.name, ...res }));
  if (r.shot) { await page.screenshot({ path: r.shot, clip: r.clip ?? { x: 0, y: 0, width: 1400, height: 900 } }); }
  await page.close();
}
await browser.close();
