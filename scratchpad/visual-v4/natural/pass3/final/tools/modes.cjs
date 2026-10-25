// lines and rails in every map mode, in a look and dpr: node modes.cjs <natural|clear> <dpr>
const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const fs = require('fs');
const look = process.argv[2] || 'natural', dpr = Number(process.argv[3] || 1);
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, rows = [];
  const p = await open(b, process.env.PAGEFILE || PAGE, { log, dpr, settle: 1500, q: look === 'clear' ? '?terrain=clear' : '' }); await p.mouse.move(720, 895);
  for (const [v, src] of [['start', null], ['mid', 'm.setScale(1.0, 640, 480)'], ['near', 'm.setScale(m.maxScale() * 0.8, 1180, 300)']]) {
    if (src) await ev(p, src);
    for (const mode of ['ownership', 'dominion', 'supply', 'unrest', 'population', 'springs', 'terrain']) {
      await mev(p, `setMode('${mode}')`); if (mode === 'terrain') await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 240000, polling: 300 }); await p.waitForTimeout(1300);
      const r = await ev(p, '(() => { const L = m.reliefLines(), R = m.reliefRails(); return { shown: m.look().shown, hair: [L.hairline.samples, L.hairline.min, L.hairline.under], int: [L.internal.samples, L.internal.min, L.internal.under], flips: L.keylineFlipsAlongEdges, w: L.maxHairWidthPx, worst: L.worst, pass: L.pass, rails: [R.samples, R.fails, R.worstContrast], wild: (() => { const E = m.reliefWildEdge(); return [E.samples, E.fails, typeof E.rim === "string" ? E.rim : E.rim.quietEdgeShare]; })() }; })()');
      rows.push({ view: v, mode, ...r }); console.log(look, 'dpr' + dpr, v, mode, JSON.stringify(r));
    }
    await mev(p, "setMode('ownership')");
  }
  fs.writeFileSync(`${OUT}modes-${process.env.TAGP || ''}${look}-dpr${dpr}.json`, JSON.stringify(rows, null, 1));
  console.log('ALLPASS', rows.every((r) => r.pass && r.rails[1] === 0 && r.wild[1] === 0), 'pageErrors', log.pageErrors.length); await b.close();
})();
