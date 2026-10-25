// the polish checks (p91 and the extended p88) over sizes, zooms and pans: node polishprobe.cjs <w> <h> [dpr]
const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const fs = require('fs');
const W = Number(process.argv[2] || 1440), H = Number(process.argv[3] || 900), dpr = Number(process.argv[4] || 1), tag = `${W}x${H}-dpr${dpr}`;
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, rows = [];
  const p = await open(b, process.env.PAGEFILE || PAGE, { log, w: W, h: H, dpr, settle: 1500, q: process.env.Q || '' }); await p.mouse.move(W / 2, 3);
  const sc = await ev(p, 'm.reliefStartClear()'); console.log(tag, 'startClear', JSON.stringify(sc)); rows.push({ v: 'startClear', sc });
  const g = await mev(p, '({ fit: fitScale, min: minScale, start: startScale(), W, H, D: MED_DIAM, phone: app.classList.contains("phone") })'); let fails = sc.pass ? 0 : 1;
  const V = [['start', 'm.ev("fit(); draw()")', true], ['fit', `m.setScale(${g.fit}, 720, 450)`, true], ['least', `m.setScale(${g.min}, 720, 450)`, true]];
  for (const [fx, fy] of [[0.1, 0.2], [0.5, 0.5], [0.9, 0.2], [0.9, 0.8], [0.1, 0.8]]) { V.push([`fit@${fx},${fy}`, `m.setScale(${g.fit}, ${g.W * fx}, ${g.H * fy})`]); V.push([`mid@${fx},${fy}`, `m.setScale(1.0, ${g.W * fx}, ${g.H * fy})`]); V.push([`ref@${fx},${fy}`, `m.setScale(1.142, ${g.W * fx}, ${g.H * fy})`]); }
  for (const [v, src, cliff] of V) { await ev(p, src); await p.waitForTimeout(500);
    const r = await ev(p, `(() => ({ wn: m.reliefWildNames(), nv: m.reliefNamesInView(), dc: m.reliefDayChips(), cl: ${cliff ? 'm.reliefCliff()' : 'null'}, qc: m.reliefQuietCost(), Dpx: +(m.scale() * m.ev('MED_DIAM')).toFixed(1), look: m.look().shown }))()`); rows.push({ v, ...r });
    const bad = !r.wn.pass || !r.nv.pass || !r.dc.pass || (r.cl && r.cl.visible && r.look === 'natural' && r.cl.faceL.spread < 25); if (bad) fails++;
    console.log(tag, v, r.Dpx, bad ? 'FAIL' : 'ok', 'wild', JSON.stringify(r.wn.named.map((q) => [q.wild.slice(4, 9), q.outsideWild, q.onOutlineBand])), 'unnamed', r.wn.unnamed.length, '| cut', JSON.stringify(r.nv.cut), '| chips', r.dc.chips, r.dc.underPieces, r.dc.overlaps, JSON.stringify(r.dc.examples), r.cl && r.cl.visible ? '| cliff ' + JSON.stringify(r.cl.faceL) + ' stripe ' + r.cl.stripeIndex + ' streaks ' + r.cl.lightStreaksPer100px : '', '| qe', JSON.stringify(r.qc)); }
  console.log('SUMMARY', tag, 'views', rows.length, 'fails', fails, 'pageErrors', log.pageErrors.length, JSON.stringify(log.pageErrors.slice(0, 2)));
  fs.writeFileSync(`${OUT}polishprobe-${process.env.TAG || 'now'}-${tag}.json`, JSON.stringify(rows, null, 1)); await b.close(); })();
