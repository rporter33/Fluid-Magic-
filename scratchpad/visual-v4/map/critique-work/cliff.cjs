// critique preview of fix 7: the cliff as buttress columns with lit west facets, a talus foot and a 1.5x face (in memory only)
const { launch, open } = require('../tools/lib.cjs');
const OUT = __dirname + '/shots';
const FILE = __dirname + '/../game-screen-v4.html';
const INS = String.raw`{ // rock: irregular facet clusters (4 to 14 units), about 40% lit on their west side; strata kept only as faint ledges; talus at the foot
      const RB2 = rngFor('relief:' + MAP_SEED + ':buttress'), fh = hs - pl;
      g.fillStyle = 'rgba(14,12,13,.35)'; for (let k = 0; k < S.length - 1; k++) { const p = S[k]; if (p[3] < 0.3) continue; g.fillRect(p[0], p[1] + fh * 0.5, 6 * RLK + 0.5, fh * 0.5); } // the lower half darker (less sky light)
      for (let k = 0; k < S.length - 1; k++) { const p = S[k], q = S[k + 1]; if ((p[3] + q[3]) / 2 < 0.3) continue; const L = Math.hypot(q[0] - p[0], q[1] - p[1]); let t = RB2() * 3 * RLK;
        while (t < L) { const w = (4 + 10 * RB2() * RB2()) * RLK, x0 = p[0] + (q[0] - p[0]) * (t / L), y0 = p[1] + (q[1] - p[1]) * (t / L);
          if (RB2() < 0.42) { const lw = w * (0.2 + 0.25 * RB2()), top = fh * (0.05 + 0.25 * RB2()), depth = fh * (0.35 + 0.5 * RB2()), a = 0.3 + 0.3 * RB2();
            const gl = g.createLinearGradient(0, y0 + top, 0, y0 + top + depth); gl.addColorStop(0, 'rgba(158,148,146,' + a + ')'); gl.addColorStop(1, 'rgba(158,148,146,0)'); g.fillStyle = gl;
            g.beginPath(); g.moveTo(x0, y0 + top); g.lineTo(x0 + lw, y0 + top - lw * 0.3); g.lineTo(x0 + lw * 0.8, y0 + top + depth); g.lineTo(x0 - lw * 0.1, y0 + top + depth * 0.9); g.closePath(); g.fill();
            g.strokeStyle = 'rgba(8,7,8,.5)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x0 + lw, y0 + top - lw * 0.3); g.lineTo(x0 + lw * 0.8, y0 + top + depth); g.stroke(); }
          t += w; } }
      for (let k = 0; k < S.length - 1; k++) { const p = S[k]; if (p[3] < 0.3) continue; if (RB2() < 0.5) continue; const n = 2 + Math.floor(RB2() * 4); for (let m = 0; m < n; m++) { const x = p[0] + RB2() * 6 * RLK, r = (0.8 + 1.6 * RB2()) * RLK, y = p[1] + hs - pl - r * 0.3; g.fillStyle = '#2E2829'; ellipse(g, x, y, r, r * 0.6); g.fill(); g.fillStyle = 'rgba(150,140,138,.35)'; ellipse(g, x - r * 0.3, y - r * 0.25, r * 0.45, r * 0.25); g.fill(); } } }
    `;
const PATCH_FN = (INS) => {
  let s = rlRim.toString();
  const rep = (a, b) => { if (!s.includes(a)) throw new Error('missing ' + a.slice(0, 50)); s = s.replace(a, b); };
  rep('hs = RL_FACE,', 'hs = RL_FACE * 2,'); rep("g.strokeStyle = 'rgba(150,140,135,.28)'", "g.strokeStyle = 'rgba(150,140,135,.12)'");
  rep('// the plinth: the board', INS + '// the plinth: the board');
  rlRim = eval('(' + s + ')'); RIM = null; RCK = null; draw(); return 'cliff patched';
};
(async () => {
  const b = await launch(), errors = [];
  const page = await open(b, FILE, 1440, 900, '', errors);
  const mock = (s) => page.evaluate((x) => window.__mock.ev(x), s);
  await page.mouse.move(5, 880); await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/q00-cliff-before.png`, clip: { x: 340, y: 560, width: 720, height: 160 } });
  await page.evaluate((ins) => { window.__INS = ins; }, INS); console.log(await mock("(" + PATCH_FN.toString() + ")(window.__INS)")); await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/q01-cliff-after.png`, clip: { x: 340, y: 560, width: 720, height: 160 } });
  await page.evaluate(() => { const m = window.__mock; m.setScale(m.minScale(), 800, 560); }); await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/q02-cliff-after-far.png` });
  console.log('ERRORS', JSON.stringify(errors)); await b.close();
})();
