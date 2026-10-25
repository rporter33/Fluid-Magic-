// the page's own wild edge test in data modes at cameras centred on each wild (Mid, Near), on this page and the pass-2 page, plus a crop of each failure
const { launch, open, ev, mev, PAGE, BEFORE, OUT, SHOTS } = require('./lib.cjs'); const fs = require('fs');
const dpr = Number(process.argv[2] || 1);
(async () => { const b = await launch(), out = {};
  for (const [nm, file] of (process.env.ONLYNOW ? [['now', PAGE]] : [['now', PAGE], ['pass2', BEFORE]])) { const log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, file, { log, dpr, settle: 1500 }); await p.mouse.move(720, 897);
    const Wd = await mev(p, 'WILDS.map((w) => { let x = 0, y = 0; for (const c of w.cells) { x += cent[c][0]; y += cent[c][1]; } return [w.name, x / w.cells.length, y / w.cells.length]; })'); out[nm] = [];
    for (const mode of ['dominion', 'supply', 'unrest', 'population', 'springs', 'ownership']) { await mev(p, `setMode('${mode}')`); await p.waitForTimeout(1200);
      for (const [wn, x, y] of Wd) for (const [vz, s] of [['mid', '1.0'], ['near', 'm.maxScale() * 0.55'], ['far', '60 / m.ev("MED_DIAM")']]) { await ev(p, `m.setScale(${s}, ${x}, ${y})`); await p.waitForTimeout(700);
        const E = await ev(p, 'm.reliefWildEdge()'); const row = [mode, wn, vz, E.samples, E.fails, E.worstFailRatio, E.examples.slice(0, 2)]; out[nm].push(row); if (E.fails) { console.log(nm, ...row.map((q) => JSON.stringify(q))); await p.screenshot({ path: `${SHOTS}V-modewild-${nm}-${mode}-${wn.replace(/ /g, '')}-${vz}-dpr${dpr}.png` }); } } }
    const tot = out[nm].reduce((a, r) => [a[0] + r[3], a[1] + r[4]], [0, 0]); console.log(nm, 'TOTAL samples', tot[0], 'fails', tot[1], 'pageErrors', log.pageErrors.length); await p.context().close(); }
  fs.writeFileSync(`${OUT}modewild-dpr${dpr}.json`, JSON.stringify(out, null, 1)); await b.close(); })();
