// Before (the v4 relief bake, i.e. Clear) and after (the natural prototype injected in memory) at the same views; reduced motion, dpr 1
const { launch, open, PAGE, injectNatural, restoreClear, view } = require('./natpage.cjs');
const OUT = __dirname + '/../proto/renders/';
const VIEWS = [
  ['start', null],
  ['far', 'm.setScale(0.36, 800, 520)'],
  ['mid', 'm.setScale(0.62, 760, 520)'],
  ['ref200a', 'm.setScale(1.142, 700, 560)'],
  ['ref200b', 'm.setScale(1.142, 1180, 420)'],
  ['near', 'm.setScale(2.4, 820, 420)'],
  ['fog', 'm.setScale(0.9, 1350, 450)'],
];
(async () => {
  const b = await launch(), errors = [];
  const W = +(process.argv[2] || 1440), H = +(process.argv[3] || 900), only = (process.argv[4] || '').split(',').filter(Boolean), tag = process.argv[5] || '';
  const PATCH = require('fs').readFileSync(__dirname + '/patches.js', 'utf8'); let p = null;
  for (const look of ['before', 'after', 'clearfixed']) {
    if (p) await p.context().close(); p = await open(b, PAGE, W, H, '', errors, { settle: 1500 });
    if (look !== 'before') await p.evaluate((s) => window.__mock.ev(s), PATCH);
    if (look === 'after') { await injectNatural(p, tag); await p.evaluate(() => window.__mock.ev("window.__natLook = 'natural'; NAT_LINES.cache.clear(); NAT_SEAT.clear(); RL_MUTE.clear(); RL_P.haze = 0.10; RL_P.outSat = 0.25; RL_P.hemPeak = 0.20; const rs = rlRenderStatic.toString().replace(\"if (fogOf(p.i) !== 'outofsight') continue;\", \"if (!fogOf(p.i)) continue;\"); rlRenderStatic = eval('(' + rs + ')'); GLOW = null; RCK = null; draw(); 0")); }
    for (const [name, src] of VIEWS) {
      if (only.length && !only.includes(name)) continue;
      if (name === 'start') await view(p, 'm.ev("fitToCloth()")', 1600); else await view(p, src, 1300);
      await p.screenshot({ path: `${OUT}${look}${tag}-${name}${W === 1440 ? '' : '-' + W}.png` });
    }
  }
  console.log('errors', JSON.stringify(errors.filter((x) => !/software WebGL|willReadFrequently/.test(x))));
  await b.close();
})();
