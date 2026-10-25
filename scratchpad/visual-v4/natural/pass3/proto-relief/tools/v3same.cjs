// Painted (v3): this build against the page before the AD fixes (and the page before the natural view), fresh loads, frames hashed once the sprites settle
// node v3same.cjs [loads]
const { launch, open, ev, mev, PAGE, BEFORE, SP, OUT, HASH, SHOTS } = require('./lib.cjs'); const fs = require('fs');
const BEFORE_NAT = SP + '/visual-v4/natural/game-screen-v4.before-natural.html';
const loads = Number(process.argv[2] || 2);
const V = [['start', null], ['mid', 'm.setScale(1.0, 640, 480)'], ['ref', 'm.setScale(1.142, 700, 560)'], ['near', 'm.setScale(m.maxScale() * 0.85, 420, 520)'], ['nearE', 'm.setScale(m.maxScale() * 0.9, 1300, 400)'], ['far', 'm.setScale(m.minScale(), 800, 500)'], ['m40', 'm.ev("fit(); draw()"); m.setMonth(40)'], ['m40near', 'm.setScale(m.maxScale() * 0.85, 900, 500)'], ['pathAcross', 'm.ev("fit(); draw()"); m.setMonth(3); m.ev("selectCmd(\'varo\')")'], ['modeSupply', 'm.ev("setMode(\'supply\')")']];
(async () => {
  const res = {};
  for (const [nm, file] of [['now', PAGE], ['beforeAD', BEFORE], ['beforeNatural', BEFORE_NAT]]) {
    res[nm] = [];
    for (let L = 0; L < loads; L++) {
      const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
      const p = await open(b, file, { log, settle: 2500, q: '?look=v3', reducedMotion: 'reduce' }); await p.waitForFunction(() => window.__mock && !window.__mock.relief(), null, { timeout: 60000 }); await p.mouse.move(720, 895);
      const h = {};
      for (const [v, src] of V) {
        if (src) await ev(p, src);
        let last = null, same = 0; for (let k = 0; k < 20 && same < 2; k++) { await p.waitForTimeout(900); await mev(p, 'draw()'); const x = await mev(p, HASH); if (x === last) same++; else { same = 0; last = x; } } // settled: the same frame three times in a row
        h[v] = last; if (L === 0) await p.screenshot({ path: `${OUT}v3/v3-${nm}-${v}.png` });
      }
      h.pageErrors = log.pageErrors.length; res[nm].push(h); console.log(nm, L, JSON.stringify(h)); await b.close();
    }
  }
  const views = V.map(([v]) => v), cmp = {};
  for (const v of views) cmp[v] = { nowStable: res.now.every((h) => h[v] === res.now[0][v]), nowVsBeforeAD: res.now[0][v] === res.beforeAD[0][v], nowVsBeforeNatural: res.now[0][v] === res.beforeNatural[0][v], beforeADStable: res.beforeAD.every((h) => h[v] === res.beforeAD[0][v]) };
  console.log(JSON.stringify(cmp)); fs.writeFileSync(OUT + 'v3same.json', JSON.stringify({ res, cmp }, null, 1));
})();
