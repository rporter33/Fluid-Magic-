const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  for (const f of process.argv.slice(2)) {
    const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await p.goto('file://' + f, { waitUntil: 'load' });
    await p.locator('#summary').scrollIntoViewIfNeeded();
    await p.locator('#summary').click({ clickCount: 3 });
    const triple = await p.evaluate(() => window.getSelection().toString().length);
    const bx = await p.locator('#summary').boundingBox();
    await p.mouse.move(bx.x + 5, bx.y + 8); await p.mouse.down(); await p.mouse.move(bx.x + 300, bx.y + 8, { steps: 8 }); await p.mouse.up();
    const drag = await p.evaluate(() => window.getSelection().toString());
    console.log(f.split('/').slice(-2).join('/'), 'tripleClickSel', triple, 'dragSel', JSON.stringify(drag.slice(0, 40)), 'active', await p.evaluate(() => document.activeElement.tagName + '#' + document.activeElement.id));
  }
  await b.close();
})();
