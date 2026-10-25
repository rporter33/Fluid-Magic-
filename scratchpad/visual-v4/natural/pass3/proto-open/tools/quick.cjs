// quick look: node quick.cjs <prefix> view,view,...  (views: start far mid ref ash grey mere ashmax ashnear clear)
const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const fs = require('fs');
const pre = process.argv[2] || 'q', want = (process.argv[3] || 'start').split(','), q = process.env.Q || '';
const V = { start: null, far: 'm.setScale(m.minScale(), 800, 500)', mid: 'm.setScale(1.0, 640, 480)', ref: 'm.setScale(1.142, 700, 560)',
  ash: 'm.setScale(m.maxScale() * 0.55, 560, 230)', ashnear: 'm.setScale(m.maxScale() * 0.8, 520, 240)', ashmax: 'm.setScale(m.maxScale(), 600, 240)', grey: 'm.setScale(m.maxScale() * 0.6, 640, 640)', greynear: 'm.setScale(m.maxScale() * 0.8, 640, 600)', mere: 'm.setScale(m.maxScale() * 0.6, 900, 560)', merenear: 'm.setScale(m.maxScale() * 0.8, 920, 585)', fit: 'm.ev("fit(); draw()")' };
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, PAGE, { log, settle: 1200, q }); await p.mouse.move(720, 895);
  const t = await mev(p, '({ shared: RB.t, nat: RB.L.natural && RB.L.natural.t, cpu: RB.L.natural && RB.L.natural.cpu, ready: p => 0 })'); console.log('times', JSON.stringify(t));
  for (const v of want) { if (V[v]) await ev(p, V[v]); await p.waitForTimeout(1800); await p.screenshot({ path: `${OUT}${pre}-${v}.png` }); console.log('shot', v); }
  console.log('pageErrors', log.pageErrors.length, JSON.stringify(log.pageErrors.slice(0, 3))); await b.close(); })();
