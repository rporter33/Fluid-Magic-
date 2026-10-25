// reproduce the talus option's 2x sweep failure: node talusfail.cjs <query> <dpr> <sweepIndex> [load]
const { launch, open, ev, mev, PAGE, OUT, SHOTS } = require('./lib.cjs'); const fs = require('fs');
const q = process.argv[2], dpr = Number(process.argv[3] || 2), idx = Number(process.argv[4] || 17), ld = process.argv[5] || '1', tag = (q || 'default').replace(/[?=&]/g, '_') + `-dpr${dpr}-sweep${idx}-load${ld}`;
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, PAGE, { log, dpr, settle: 1500, q: q === 'default' ? '' : q }); await p.mouse.move(720, 896);
  const V = await mev(p, `rlWildSweepViews()[${idx}]`); console.log(tag, 'view', JSON.stringify(V));
  await ev(p, `m.setScale(${V[1]}, ${V[2]}, ${V[3]})`); await p.waitForTimeout(1800);
  const r = await ev(p, '(() => { const E = m.reliefWildEdge(), M = m.reliefWildMargins(); return { band: m.band(), Dpx: +(m.scale() * m.ev("MED_DIAM")).toFixed(1), samples: E.samples, fails: E.fails, worst: E.worstFailRatio, ex: E.examples.slice(0, 4), mFails: M.fails, mMin: M.min, share: E.rim && E.rim.quietEdgeShare }; })()');
  console.log(tag, JSON.stringify(r));
  await p.screenshot({ path: `${SHOTS}talusfail-${tag}.png` });
  if (r.mMin && r.mMin.sx != null) { const cr = await p.evaluate(() => { const b = document.getElementById('map').getBoundingClientRect(); return [b.left, b.top]; }); const x = Math.max(0, cr[0] + r.mMin.sx - 60), y = Math.max(0, cr[1] + r.mMin.sy - 40); await p.screenshot({ path: `${SHOTS}talusfail-${tag}-crop.png`, clip: { x, y, width: 120, height: 80 } }); }
  console.log(tag, 'pageErrors', log.pageErrors.length); fs.writeFileSync(`${OUT}talusfail-${tag}.json`, JSON.stringify({ V, r, pageErrors: log.pageErrors }, null, 1)); await b.close(); })();
