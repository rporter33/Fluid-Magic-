const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, w: 390, h: 844, dpr: 3, settle: 1000 });
  const byT = await mev(p, '(() => { const o = {}; for (const i of provList) { const t = terr[i]; if (!o[t] && !fogOf(i)) o[t] = [cent[i][0], cent[i][1]]; } return o; })()');
  await ev(p, `m.setScale(m.maxScale() * 0.8, ${byT.forest[0]}, ${byT.forest[1]})`); await p.waitForTimeout(1500);
  console.log(await ev(p, `(() => { try { const R = m.reliefNatural(true).readers; return JSON.stringify({ pass: R.pass, farPass: R.farPass, views: R.views, provinces: R.provinces }); } catch (e) { return 'ERR ' + e.message + ' | ' + e.stack.split('\\n').slice(0, 5).join(' | '); } })()`));
  await b.close(); })();
