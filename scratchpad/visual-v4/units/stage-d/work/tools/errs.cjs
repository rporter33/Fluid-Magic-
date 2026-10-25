const { launch, openPage } = require('./lib.cjs');
(async () => {
  const browser = await launch();
  const { page, errors } = await openPage(browser, process.argv[2], '?paused=1', { noReady: true });
  await page.waitForTimeout(4000);
  console.log(errors, await page.evaluate(() => window.__errors));
  await browser.close();
})();
