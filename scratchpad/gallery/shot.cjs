const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const out = [];
  for (const [w, h, name, y] of [[1280, 900, 'desk', 0], [1280, 900, 'desk-act', 1], [390, 844, 'phone', 0]]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, colorScheme: 'dark' });
    await p.goto('file://' + process.cwd() + '/index.html'); await p.waitForTimeout(1500);
    if (y) { await p.evaluate(() => document.getElementById('actions').scrollIntoView()); await p.waitForTimeout(800); }
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    await p.screenshot({ path: `shot-${name}.png` }); out.push([name, 'overflow', ov]);
  }
  console.log(JSON.stringify(out)); await b.close();
})();
