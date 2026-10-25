const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
const [look, box] = process.argv.slice(2), [x0, y0, x1, y1] = box.split(',').map(Number);
(async () => { for (const [nm, file] of [['now', PAGE], ['before', process.env.BEFORE]]) { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, file, { log, settle: 1500, q: look === 'clear' ? '?terrain=clear' : '' }); await p.mouse.move(720, 894);
  await mev(p, "SKIP.add('pieces'); SKIP.add('labels'); SKIP.add('badges'); SKIP.add('arrows'); SKIP.add('rails'); RCK = null; draw()"); await p.waitForTimeout(800);
  const cr = await p.evaluate(() => { const r = document.getElementById('map').getBoundingClientRect(); return [r.left, r.top]; });
  await p.screenshot({ path: `${__dirname}/../out/cmp-${look}-${nm}.png`, clip: { x: cr[0] + x0, y: cr[1] + y0, width: x1 - x0, height: y1 - y0 } }); await b.close(); } })();
