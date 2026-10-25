// first look: what the page exposes, how it loads, with fonts allowed or aborted
const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
(async () => {
  const b = await launch();
  for (const fonts of [process.argv[2] || 'allow']) {
    const log = { pageErrors: [], console: [], requests: [] };
    const p = await open(b, PAGE, { log, fonts, settle: 1500 });
    console.log('fonts', fonts, 'readyMs', p.__readyMs);
    console.log('keys', await ev(p, 'Object.keys(m).join(" ")'));
    console.log('look', JSON.stringify(await ev(p, 'm.look()')), 'band', await ev(p, 'm.band()'), 'scale', await ev(p, 'm.scale()'), 'fit', await ev(p, 'm.fitScale()'), 'D', await mev(p, 'MED_DIAM'));
    console.log('fontsOk', await p.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family).join(',')));
    console.log('times', JSON.stringify(await ev(p, 'm.reliefTimes()')));
    console.log(JSON.stringify(log).slice(0, 3000));
  }
  await b.close();
})();
