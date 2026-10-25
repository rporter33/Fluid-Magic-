const { launch, open, PAGE } = require('../../build-tools/nlib.cjs');
const ev = (p, s) => p.evaluate((s) => { const m = window.__mock; return eval(s); }, s);
(async () => {
  const b = await launch();
  const p = await open(b, PAGE, { settle: 800, reducedMotion: 'reduce' });
  await p.mouse.move(700, 880);
  for (const [n, s] of [['start', 'm.ev("fit(); draw()")'], ['min', 'm.setScale(m.minScale(), 800, 500)']]) { await ev(p, s); console.log(n, JSON.stringify(await ev(p, 'm.reliefCliff()'))); }
  console.log(JSON.stringify(await ev(p, 'm.ev("({ face: RL_FACE, plinth: RL_PLINTH, rc: RL_RC, RLK, RLD, TX: RB.TX })")')));
  await b.close();
})();
