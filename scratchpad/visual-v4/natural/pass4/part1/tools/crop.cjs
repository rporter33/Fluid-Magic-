// a view set by an expression, then a crop around a point at 4x: node crop.cjs <tag> <expr> <cx> <cy> [r]
const { launch, open, ev, mev, PAGE, ME } = require('./lib.cjs');
const [tag, expr, cx, cy, r = '60'] = process.argv.slice(2);
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, settle: 1500, reducedMotion: 'reduce' }); await p.mouse.move(720, 896);
  const info = await mev(p, expr); await p.waitForTimeout(500); const cr = await p.evaluate(() => { const q = document.getElementById('map').getBoundingClientRect(); return [q.left, q.top]; });
  await p.screenshot({ path: `${ME}wip/${tag}-full.png` }); await p.screenshot({ path: `${ME}wip/${tag}-crop.png`, clip: { x: cr[0] + +cx - +r, y: cr[1] + +cy - +r, width: 2 * +r, height: 2 * +r } });
  console.log(JSON.stringify(info), JSON.stringify(log.pageErrors)); await b.close(); })();
