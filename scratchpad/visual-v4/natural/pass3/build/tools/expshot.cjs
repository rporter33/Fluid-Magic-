// expshot.cjs <page> <tag>: crops of the two ranges at start, Near and max (build/look/exp-<tag>-*.png) plus the busyness inputs
const { launch, open, ev, mev, ME } = require('./lib.cjs');
(async () => { const PAGE = process.argv[2], tag = process.argv[3], b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, PAGE, { log, settle: 1500 }); await p.mouse.move(720, 896);
  const V = [['start', 'm.ev("fit(); draw()")', [[360, 200, 300, 160], [530, 420, 120, 190]]], ['nearG', 'm.setScale(m.maxScale() * 0.6, 640, 673)', [[560, 230, 240, 330]]], ['nearA', 'm.setScale(m.maxScale() * 0.55, 490, 237)', [[370, 290, 610, 300]]], ['maxG', 'm.setScale(m.maxScale(), 640, 700)', [[470, 120, 420, 610]]]];
  for (const [v, src, clips] of V) { await ev(p, src); await p.waitForTimeout(1500); let k = 0;
    for (const [x, y, w, h] of clips) await p.screenshot({ path: `${ME}look/exp-${tag}-${v}-${k++}.png`, clip: { x, y, width: w, height: h } }); }
  const wl = await ev(p, 'm.reliefWildLook()'); console.log(tag, 'snow', JSON.stringify(wl.peaks && { share: wl.peaks.snowShare, Lmax: wl.peaks.snowLmax }), 'pass', wl.pass, 'errors', log.pageErrors.length); await b.close(); })();
