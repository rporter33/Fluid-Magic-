// the page's own terrain reader (rlNatReader) at the least zoom and at Mid (and the verifier's views): node preaders.cjs [dpr] -> out/preaders-<tag>.json
const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const fs = require('fs');
const dpr = Number(process.argv[2] || 1), tag = (process.env.TAG || 'now') + '-dpr' + dpr;
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, out = {};
  const p = await open(b, process.env.PAGEFILE || PAGE, { log, dpr, settle: 1500 }); await p.mouse.move(720, 895);
  const V = [['least', 'm.setScale(m.minScale(), 800, 500)'], ['far60', `m.setScale(60 / m.ev('MED_DIAM'), 720, 450)`], ['start', 'm.ev("fit(); draw()")'], ['mid', 'm.setScale(1.0, 640, 480)'], ['ref', 'm.setScale(1.142, 700, 560)']];
  const only = process.env.VIEWS ? process.env.VIEWS.split(',') : null;
  for (const [v, src] of V) { if (only && !only.includes(v)) continue; await ev(p, src); await p.waitForTimeout(1500);
    const r = await ev(p, 'm.reliefNatural(true).readers'); out[v] = r;
    const s = (q) => q ? [q.patchAcc, q.provinceAcc, q.missed.join('; ')].join(' / ') : '-';
    console.log(v, r.Dpx, 'pass', r.pass, '| N light', s(r.normal.lightness), '| N tex', s(r.normal.texture), '| unexp', s(r.normal.unexplored), '| unexpTex', s(r.normal.unexploredTexture), '| D', s(r.deutan.lightness), '| P', s(r.protan.lightness), '| T', s(r.tritan.lightness), r.verifier ? '| views ' + r.views + ' provs ' + r.provinces + ' | farPass ' + r.farPass + ' | verifier ' + JSON.stringify({ u: r.verifier.unexplored, ctl: r.verifier.unexploredInSightControl, forced: r.verifier.forcedUnexplored, all: r.verifier.all.acc }) : ''); }
  fs.writeFileSync(`${OUT}preaders-${tag}.json`, JSON.stringify(out, null, 1)); console.log('pageErrors', log.pageErrors.length); await b.close(); })();
