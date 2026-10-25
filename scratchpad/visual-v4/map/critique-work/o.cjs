// critique pass O: where the static re-render's time goes at the start view and at Near (shared machine: noisy)
const { launch, open } = require('../tools/lib.cjs');
const FILE = __dirname + '/../game-screen-v4.html';
(async () => {
  const b = await launch(), errors = [];
  const page = await open(b, FILE, 1440, 900, '', errors);
  const W = String.raw`(() => { window.__T = {}; for (const f of ['rlDrawRails', 'rlLayout', 'rlDrawPieces', 'rlPaintLabels', 'rlWashSync', 'rlDrawWater', 'rlDrawWildContours', 'rlGlow', 'bakeTable', 'bakeRoom', 'rlRim', 'blitRing', 'blitRegion']) { const o = eval(f); const w = function (...a) { const t0 = performance.now(); try { return o.apply(this, a); } finally { window.__T[f] = (window.__T[f] || 0) + performance.now() - t0; } }; eval(f + ' = w'); } return 'wrapped'; })()`;
  console.log(await page.evaluate((s) => window.__mock.ev(s), W));
  for (const [nm, sc] of [['start', null], ['near', 'max']]) {
    const r = await page.evaluate(([sc]) => { const m = window.__mock; if (sc) m.setScale(m.maxScale() * 0.9, 800, 500); window.__T = {}; const t0 = performance.now(); for (let k = 0; k < 5; k++) { m.ev('RCK = null; RL_PIECE_CACHE.clear(); draw()'); } const tot = (performance.now() - t0) / 5; return { totalMs: +tot.toFixed(1), parts: Object.fromEntries(Object.entries(window.__T).map(([k, v]) => [k, +(v / 5).toFixed(1)])) }; }, [sc]);
    console.log(nm, JSON.stringify(r));
  }
  console.log('ERRORS', JSON.stringify(errors)); await b.close();
})();
