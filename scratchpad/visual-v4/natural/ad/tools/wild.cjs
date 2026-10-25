const { launch, open, PAGE, realErrors } = require('../../build-tools/nlib.cjs');
const OUT = __dirname + '/../shots/';
const ev = (p, s) => p.evaluate((s) => { const m = window.__mock; return eval(s); }, s);
const mev = (p, src) => ev(p, 'm.ev(' + JSON.stringify(src) + ')');
(async () => {
  const b = await launch(), errors = [];
  const p = await open(b, PAGE, { errors, settle: 1200, reducedMotion: 'reduce' });
  await p.mouse.move(700, 880);
  await mev(p, `SKIP.add('labels'); SKIP.add('pieces'); SKIP.add('rails'); rlHamlet = function () {}; window.__wt0 = rlWildTexel; 'ok'`);
  await mev(p, `rlWildTexel = eval('(' + __wt0.toString().replace('q = rlSmooth(0.12, 1.0, s)', 'q = 0.2 + 0.6 * rlSmooth(0.12, 1.0, s)').replace(/\\* sw;/g, '* sw * 0.7;') + ')'); (() => { for (const _ of rlLookGen(RB, 'natural')) void _; RB.lookVer++; rlAfterBake(); RCK = null; draw(); })(); 'ok'`);
  for (const [view, src] of [['start', 'm.ev("fit(); draw()")'], ['refW', 'm.setScale(1.142, 400, 420)']]) { await ev(p, src); await p.waitForTimeout(400); await p.screenshot({ path: `${OUT}W-${view}-calm.png` }); }
  await ev(p, 'm.ev("fit(); draw()")');
  console.log('snow', JSON.stringify((await ev(p, 'm.reliefSnow()')).pass), 'lines', JSON.stringify((await ev(p, 'm.ev("SKIP.delete(\'rails\'); RCK=null; draw(); 1")'), await ev(p, 'm.reliefLines().pass'))));
  console.log('errors', JSON.stringify(realErrors(errors)));
  await b.close();
})();
