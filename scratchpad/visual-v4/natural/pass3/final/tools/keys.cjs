// list window.__mock keys and types on the final page
const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const fs = require('fs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, PAGE, { log, settle: 1500 });
  const k = await p.evaluate(() => Object.keys(window.__mock).map((x) => [x, typeof window.__mock[x], typeof window.__mock[x] === 'function' ? window.__mock[x].length : null]));
  const geo = await mev(p, '({ W, H, D: MED_DIAM, max: maxScale, min: minScale, fit: fitScale, s: cam.s, look: rlShownLook(), mode: state.mode })');
  console.log(JSON.stringify(geo)); console.log(k.map((x) => x.join(':')).join(' '));
  console.log('ready ms', p.__readyMs, 'pageErrors', log.pageErrors.length, JSON.stringify(log.pageErrors), 'requests', JSON.stringify(log.requests.slice(0, 10)), 'console', JSON.stringify(log.console.slice(0, 10)));
  fs.writeFileSync(OUT + 'mock-keys.json', JSON.stringify({ geo, k }, null, 1)); await b.close(); })();
