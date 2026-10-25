// run pass-4 checks in a fresh page: node p4run.cjs <tag> <expr, e.g. "m.p4Seasons()"> [query] [w h dpr] -> out/p4-<tag>.json
const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const fs = require('fs');
const [tag, expr, q = '', w = '1440', h = '900', dpr = '1'] = process.argv.slice(2);
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, T0 = Date.now(); const p = await open(b, process.env.PAGEFILE || PAGE, { log, q, w: +w, h: +h, dpr: +dpr, settle: 2000, timeout: 900000 }); await p.mouse.move(+w / 2, +h - 4);
  p.setDefaultTimeout(1800000); const r = await ev(p, expr); const out = { tag, expr, q, view: [+w, +h, +dpr], readyMs: p.__readyMs, r, pageErrors: log.pageErrors, ms: Date.now() - T0 };
  fs.writeFileSync(`${OUT}p4-${tag}.json`, JSON.stringify(out, null, 1)); console.log(JSON.stringify(out, null, 1).slice(0, +(process.env.MAXC || 6000))); await b.close(); })();
