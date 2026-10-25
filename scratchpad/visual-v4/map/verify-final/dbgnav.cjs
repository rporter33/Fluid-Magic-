const { launch, open, PAGE } = require('./vlib.cjs');
(async () => { const b = await launch(); const errors = [];
  const p = await open(b, PAGE, { settle: 1200, errors }); p.on('framenavigated', (f) => console.log('NAV', f.url().slice(-60)));
  console.log('ready', p.url().slice(-40));
  for (let k = 0; k < 5; k++) { try { console.log(await p.evaluate(() => window.__mock.scale())); } catch (e) { console.log('ERR', e.message.split('\n')[0]); } await p.waitForTimeout(500); }
  console.log(errors.slice(0, 5)); await b.close(); })();
