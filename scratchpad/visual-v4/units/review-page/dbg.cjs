const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.route(/fonts\./, (r) => r.abort());
  await p.goto('file://' + process.argv[2]);
  console.log(JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('.flex')].map((f) => ({ cls: f.className, w: f.getBoundingClientRect().width, kids: [...f.children].map((c) => [c.getAttribute('style'), Math.round(c.getBoundingClientRect().width), getComputedStyle(c).flexBasis]) })))));
  await b.close();
})();
