// land-layer shots of one camera on this page and the pass-3 final page: node hshot.cjs <tag> <scale> <cx> <cy>
const { launch, open, ev, mev, PAGE, BEFORE, SHOTS } = require('./lib.cjs');
const tag = process.argv[2], S = process.argv[3], CX = process.argv[4], CY = process.argv[5];
(async () => { const b = await launch();
  for (const [nm, file] of [['now', PAGE], ['before', BEFORE]]) { const log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, file, { log, settle: 1500 }); await p.mouse.move(720, 896);
    await ev(p, `m.setScale(${S}, ${CX}, ${CY})`); await p.waitForTimeout(1500); await ev(p, "m.skip('rails', true); m.skip('pieces', true); m.skip('labels', true)"); await p.waitForTimeout(900);
    await p.screenshot({ path: `${SHOTS}wip/${tag}-${nm}-land.png` }); await p.context().close(); }
  await b.close(); })();
