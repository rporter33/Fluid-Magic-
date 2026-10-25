const { launch, open } = require('./lib.cjs');
const [file] = process.argv.slice(2);
(async () => {
  const b = await launch(), errors = [];
  const page = await open(b, file, 1440, 900, '', errors);
  await page.click('#railFeed'); await page.waitForTimeout(300);
  const link = await page.$('#msgs .link'); const bb = await link.boundingBox(); console.log('bb', JSON.stringify(bb), await link.textContent());
  await page.mouse.move(bb.x + 5, bb.y + 5); await page.waitForTimeout(400);
  console.log('link prov', await page.evaluate(() => window.__mock.ev('RL_LINK.prov + " " + names[RL_LINK.prov] + " dock:" + document.getElementById("rightDock").className')));
  await page.screenshot({ path: process.argv[3] || '/dev/null' });
  console.log('ERRORS', JSON.stringify(errors)); await b.close();
})();
