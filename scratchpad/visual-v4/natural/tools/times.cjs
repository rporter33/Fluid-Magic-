const { launch, open, PAGE } = require('./natpage.cjs');
(async () => { const b = await launch(), e = []; const p = await open(b, PAGE, 1440, 900, '', e, { settle: 1500 });
  console.log(JSON.stringify(await p.evaluate(() => ({ times: window.__mock.reliefTimes(), mem: window.__mock.reliefMemory() })), null, 1)); await b.close(); })();
