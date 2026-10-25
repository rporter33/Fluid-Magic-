// Painted (v3): settled frame hashes at 10 views, per page: node v3same.cjs <page> [loads]  -> out/v3-<page>.json
const { launch, open, ev, mev, page, OUT, HASH } = require('./lib.cjs'); const fs = require('fs');
const PN = process.argv[2], loads = Number(process.argv[3] || 1);
const V = [['start', null], ['mid', 'm.setScale(1.0, 640, 480)'], ['ref', 'm.setScale(1.142, 700, 560)'], ['near', 'm.setScale(m.maxScale() * 0.85, 420, 520)'], ['nearE', 'm.setScale(m.maxScale() * 0.9, 1300, 400)'], ['far', 'm.setScale(m.minScale(), 800, 500)'], ['m40', 'm.ev("fit(); draw()"); m.setMonth(40)'], ['m40near', 'm.setScale(m.maxScale() * 0.85, 900, 500)'], ['pathAcross', 'm.ev("fit(); draw()"); m.setMonth(3); m.ev("selectCmd(\'varo\')")'], ['modeSupply', 'm.ev("setMode(\'supply\')")']];
(async () => {
  const res = [];
  for (let L = 0; L < loads; L++) {
    const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
    const p = await open(b, page(PN), { log, settle: 2500, q: '?look=v3', reducedMotion: 'reduce' }); await p.waitForFunction(() => window.__mock && !window.__mock.relief(), null, { timeout: 60000 }); await p.mouse.move(720, 895);
    const h = {};
    for (const [v, src] of V) { if (src) await ev(p, src);
      let last = null, same = 0; for (let k = 0; k < 20 && same < 2; k++) { await p.waitForTimeout(900); await mev(p, 'draw()'); const x = await mev(p, HASH); if (x === last) same++; else { same = 0; last = x; } }
      h[v] = last; }
    h.pageErrors = log.pageErrors.length; res.push(h); console.log(PN, L, JSON.stringify(h)); await b.close();
  }
  fs.writeFileSync(`${OUT}v3-${PN}.json`, JSON.stringify(res, null, 1));
})();
