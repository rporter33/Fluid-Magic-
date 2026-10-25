// the bake -> fine raster switch: the same camera just below and just above it; node pop.cjs <key> <id>  -> out/pop-<key>-<id>-{lo,hi}.png
const { launch, open, ev, PAGES, OUT } = require('./lib.cjs'); const fs = require('fs');
const KEY = process.argv[2], id = process.argv[3] || 'ashspine';
const WI = JSON.parse(fs.readFileSync('/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/judge/out/wildinfo.json', 'utf8')); const C = Object.fromEntries(WI.wilds.map((w) => [w.id, w]));
(async () => {
  const b = await launch(), log = { pageErrors: [] }; const p = await open(b, PAGES[KEY], { log, settle: 1500 }); await p.mouse.move(720, 896);
  for (const [t, s] of [['lo', 1.27], ['hi', 1.29]]) {
    await ev(p, `m.setScale(${s}, ${C[id].cx}, ${C[id].cy})`); await p.waitForTimeout(2500);
    const src = await ev(p, 'm.ev("rlMsSource()")');
    await p.screenshot({ path: `${OUT}pop-${KEY}-${id}-${t}.png`, clip: { x: 420, y: 250, width: 600, height: 400 } }); console.log(t, s, src);
  }
  console.log('pageErrors', log.pageErrors.length, log.pageErrors.slice(0, 2)); await b.close();
})();
