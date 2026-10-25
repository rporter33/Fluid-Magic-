// the natural bake's CPU per step, the before page and this build alternately (the machine is shared)
const { launch, open, PAGE } = require('./nlib2.cjs');
const BEFORE = __dirname + '/../game-screen-v4.before-ad.html';
(async () => { const b = await launch();
  for (let r = 0; r < 2; r++) for (const [tag, file] of [['before', BEFORE], ['after', PAGE]]) { const p = await open(b, file, { settle: 300 }); const t = await p.evaluate(() => window.__mock.reliefTimes()); console.log(tag, JSON.stringify({ shared: t.sharedStepsMs, natural: t.naturalStepsMs, cpu: t.lookCpu.natural, total: t.bakeCpuMs, wall: t.bakeWallMs })); await p.context().close(); }
  await b.close(); })();
