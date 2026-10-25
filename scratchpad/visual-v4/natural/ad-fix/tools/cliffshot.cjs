const { launch, open, PAGE } = require('../../build-tools/nlib.cjs');
const ev = (p, s) => p.evaluate((s) => { const m = window.__mock; return eval(s); }, s);
(async () => { const b = await launch(); const dpr = Number(process.env.DPR || 1);
  const p = await open(b, process.env.PAGE || PAGE, { settle: 800, reducedMotion: 'reduce', dpr }); await p.mouse.move(700, 880);
  for (const [n, s] of [['s055', 'm.setScale(0.55, 800, 900)'], ['s1', 'm.setScale(1.0, 500, 980)'], ['s2', 'm.setScale(2.0, 300, 1000)']]) { await ev(p, s); await p.waitForTimeout(500); await p.screenshot({ path: (process.env.OUTD || __dirname + '/../shots-dev/') + `cliff-${n}${process.env.TAG || ''}.png` }); }
  await b.close(); })();
