// the start view on the final page, two loads each: 390x844 dpr3 (Natural, Clear) and 1280x720: identical frames?
const { launch, open, ev, mev, PAGE, HASH } = require('./lib.cjs');
(async () => {
  const b = await launch();
  for (const [w, h, dpr, q] of [[390, 844, 3, ''], [390, 844, 3, '?terrain=clear'], [1280, 720, 1, '']]) { const hs = [];
    for (let k = 0; k < 2; k++) { const log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, w, h, dpr, q, settle: 1500 }); await p.mouse.move(w / 2, h - 4); await p.waitForTimeout(800);
      hs.push(await ev(p, 'm.ev(' + JSON.stringify(HASH) + ')') + '/' + log.pageErrors.length); await p.context().close(); }
    console.log(`${w}x${h} dpr${dpr}${q}`, hs.join(' '), 'identical', hs[0] === hs[1]); }
  await b.close();
})();
