// the page's own reliefWildEdge() at one wild's closest zoom (and 0.55 / 0.8 of it): node edgeat.cjs <page> <ash|grey|mere>
const { launch, open, ev, mev, page } = require('./lib.cjs');
const PN = process.argv[2], K = process.argv[3] || 'ash';
const WC = `(() => { const o = {}; for (const w of WILDS) { let x = 0, y = 0; for (const c of w.cells) { x += cent[c][0]; y += cent[c][1]; } o[w.kind === 'mere' ? 'mere' : w.name.includes('Ash') ? 'ash' : 'grey'] = [x / w.cells.length, y / w.cells.length]; } return o; })()`;
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, page(PN), { log, settle: 1500, reducedMotion: 'reduce' }); await p.mouse.move(720, 896);
  const wc = await mev(p, WC);
  for (const f of [1, 0.9, 0.8, 0.7]) { await ev(p, `m.setScale(m.maxScale() * ${f}, ${wc[K][0]}, ${wc[K][1]})`); await p.waitForTimeout(1800); const E = await ev(p, 'm.reliefWildEdge()'); console.log(PN, K, f, E.samples, E.fails, JSON.stringify(E.examples), JSON.stringify(E.rim)); }
  console.log('pageErrors', log.pageErrors.length); await b.close(); })();
