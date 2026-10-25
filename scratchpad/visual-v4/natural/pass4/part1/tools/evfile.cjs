// evaluate a file inside the page's closure: node evfile.cjs <js> [query] [w h dpr]
const { launch, open, ev, mev, PAGE } = require('./lib.cjs'); const fs = require('fs');
const [js, q = '', w = '1440', h = '900', dpr = '1'] = process.argv.slice(2);
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, q, w: +w, h: +h, dpr: +dpr, settle: 1500, timeout: 900000 });
  const r = await mev(p, fs.readFileSync(js, 'utf8')); console.log(typeof r === 'string' ? r : JSON.stringify(r, null, 1)); console.log('pageErrors', JSON.stringify(log.pageErrors.slice(0, 4))); await b.close(); })();
