// every hook in window.__mock under Painted (v3), on the v4 page (?look=v3) and on the original page
const { launch, open, PAGE, ORIG } = require('./vlib.cjs'); const fs = require('fs');
(async () => { const b = await launch(), out = {}, errors = [];
  for (const [tag, file, q] of [['v4-look-v3', PAGE, '?look=v3'], ['original', ORIG, '']]) {
    const p = await open(b, file, { q, v3: true, settle: 3000, errors, reducedMotion: 'reduce' }); const r = {};
    for (const k of ['checks', 'density', 'paintcheck', 'trackcheck', 'silhouettes', 'feats', 'info', 'sprInfo', 'reb', 'bakes', 'relief', 'reliefReady', 'reliefChecks', 'reliefLayout', 'reliefDesign']) {
      r[k] = await p.evaluate((k) => { try { const f = window.__mock[k]; if (!f) return 'absent'; const v = f(); return JSON.stringify(v).slice(0, 700); } catch (e) { return 'ERR ' + e.message; } }, k);
    }
    r.perf = await p.evaluate(() => ({ perf: +window.__mock.perf(5).toFixed(1), pan: +window.__mock.pan(3, 0, 10).toFixed(1) }));
    r.panStats = await p.evaluate(() => window.__mock.panStats(3, 60));
    out[tag] = r; await p.context().close();
  }
  out.errors = errors.filter((x) => !/software WebGL|willReadFrequently/.test(x));
  fs.writeFileSync(__dirname + '/out/v3hooks.json', JSON.stringify(out, null, 1));
  for (const k of Object.keys(out['original'])) console.log(k.padEnd(12), (out['v4-look-v3'][k] === out['original'][k] || JSON.stringify(out['v4-look-v3'][k]) === JSON.stringify(out['original'][k]) ? 'same ' : 'DIFF '), String(typeof out['v4-look-v3'][k] === 'string' ? out['v4-look-v3'][k] : JSON.stringify(out['v4-look-v3'][k])).slice(0, 330));
  console.log('errors', JSON.stringify(out.errors)); await b.close(); })();
