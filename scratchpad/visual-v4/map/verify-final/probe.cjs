const { launch, open, PAGE } = require('./vlib.cjs');
(async () => {
  const b = await launch(), errors = [], reqs = [];
  const p = await open(b, PAGE, { errors, reqs });
  console.log('readyMs', p.__readyMs);
  console.log(await p.evaluate(() => ({ keys: Object.keys(window.__mock), fonts: [...document.fonts].map((f) => f.family + ' ' + f.weight + ' ' + f.style + ' ' + f.status).slice(0, 20), relief: window.__mock.relief(), band: window.__mock.band(), scale: window.__mock.scale(), figs: window.__mock.ev('FIGS.ready ? "ready" : FIGS.err') })));
  console.log('errors', JSON.stringify(errors)); console.log('reqs', JSON.stringify(reqs));
  await b.close();
})();
