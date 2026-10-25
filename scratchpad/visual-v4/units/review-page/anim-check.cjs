const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.route(/fonts\./, (r) => r.abort());
  await p.goto('file://' + process.argv[2]);
  const ids = await p.evaluate(() => { const c = {}; for (const e of document.querySelectorAll('[id]')) c[e.id] = (c[e.id] || 0) + 1; return Object.entries(c).filter(([, n]) => n > 1); });
  const el = p.locator('#img-motion-near');
  await el.scrollIntoViewIfNeeded();
  const shots = [];
  for (let i = 0; i < 4; i++) { shots.push((await el.screenshot()).toString('base64')); await p.waitForTimeout(230); }
  const distinct = new Set(shots).size;
  const sameFilled = await p.evaluate(() => [...document.querySelectorAll('img[data-same]')].every((i) => i.src.startsWith('data:image/webp')));
  console.log(JSON.stringify({ dupIds: ids, motionDistinctFrames: distinct, sameFilled }));
  await b.close();
})();
