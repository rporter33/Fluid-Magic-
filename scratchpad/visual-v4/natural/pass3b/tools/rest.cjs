// reliefWildRest at the views: node rest.cjs <tag> [dpr] [w h]; out/rest-<tag>.json
const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const fs = require('fs');
const tag = process.argv[2] || 'now', dpr = Number(process.argv[3] || 1), W = Number(process.argv[4] || 1440), H = Number(process.argv[5] || 900);
const WI = JSON.parse(fs.readFileSync('/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/judge/out/wildinfo.json', 'utf8')); const C = Object.fromEntries(WI.wilds.map((w) => [w.id, w]));
const VIEWS = [['start', 'm.ev("fit(); draw()")'], ['far', 'm.setScale(60 / m.ev("MED_DIAM"), 800, 500)'], ['least', 'm.setScale(m.minScale(), 800, 500)'], ['mid', 'm.setScale(1.0, 640, 480)'], ['ref', 'm.setScale(1.142, 700, 560)'],
  ...['ashspine', 'greyteeth', 'stillmere'].flatMap((id) => [['near-' + id, `m.setScale(m.maxScale() * 0.55, ${C[id].cx}, ${C[id].cy})`], ['closest-' + id, `m.setScale(m.maxScale(), ${C[id].cx}, ${C[id].cy})`]])];
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, process.env.PAGEFILE || PAGE, { log, dpr, w: W, h: H, settle: 1500, q: process.env.Q || '' }); await p.mouse.move(W / 2, H - 6);
  const rows = {};
  for (const [v, src] of VIEWS) { if (process.env.VIEWS && !process.env.VIEWS.split(',').includes(v)) continue; await ev(p, src); await p.waitForTimeout(1500); const r = await ev(p, 'm.reliefWildRest()'); rows[v] = r;
    console.log(v, r.Dpx, r.src, 'drawn', r.outlinePixelsDrawn, 'pass', r.pass, Object.entries(r.wilds || {}).map(([k, w]) => `${k.replace('The ', '')}: n${w.samples} reach${w.reachPx} raster p50 ${w.raster.p50D}D p90 ${w.raster.p90D}D within ${w.raster.within} | px p50 ${w.pixels.p50D} p90 ${w.pixels.p90D} within ${w.pixels.within} | light ${w.lighterInnerLine} dark ${w.darkLine}`).join(' || ')); }
  rows.pageErrors = log.pageErrors; fs.writeFileSync(`${OUT}rest-${tag}-dpr${dpr}-${W}x${H}.json`, JSON.stringify(rows, null, 1)); console.log('pageErrors', log.pageErrors.length, JSON.stringify(log.pageErrors.slice(0, 3))); await b.close();
})();
