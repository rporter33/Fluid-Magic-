// Rendered-pixel dumps (the independent verifier's own IN_PAGE dump, verify-final/dump-colors.cjs) for: Clear as built, Natural as built (the
// prototype bake injected), and both with the design's line and seat fixes (tools/patches.js) applied in memory. Output: proto/lines/<tag>-<view>-dpr<n>.json
const { launch, open, PAGE, injectNatural, restoreClear, view } = require('./natpage.cjs');
const fs = require('fs');
const IN_PAGE = fs.readFileSync(__dirname + '/../../map/verify-final/dump-colors.cjs', 'utf8').match(/String\.raw`([\s\S]*?)`;\n\(async/)[1];
const PATCH = fs.readFileSync(__dirname + '/patches.js', 'utf8');
const OUT = __dirname + '/../proto/lines/'; fs.mkdirSync(OUT, { recursive: true });
const VIEWS = [['start', 'm.ev("fitToCloth()")'], ['mid', 'm.setScale(1.0, 640, 480)'], ['nearW', 'm.setScale(m.maxScale() * 0.9, 300, 470)'], ['nearC', 'm.setScale(m.maxScale() * 0.9, 260, 640)'], ['m40', 'm.ev("fitToCloth()"); m.setMonth(40)']];
(async () => {
  const b = await launch(), errors = [];
  const PASS2 = process.argv[2] === 'pass2';
  for (const dpr of PASS2 ? [1] : [1, 2]) for (const patched of PASS2 ? [true] : [false, true]) {
    const p = await open(b, PAGE, 1440, 900, '', errors, { settle: 1500, dpr });
    if (patched) console.log(await p.evaluate((s) => window.__mock.ev(s), PATCH));
    for (const look of ['clear', 'natural']) {
      if (look === 'natural') { await injectNatural(p); await p.evaluate(() => window.__mock.ev("window.__natLook = 'natural'; if (window.NAT_LINES) { NAT_LINES.cache.clear(); NAT_SEAT.clear(); } RCK = null; draw(); 0")); }
      for (const [tag, src] of VIEWS) {
        if (dpr === 2 && !['start', 'nearW'].includes(tag)) continue; if (PASS2 && !['start', 'mid', 'nearW', 'nearC'].includes(tag)) continue;
        await view(p, src, 1500); if (tag === 'start' || tag === 'mid') await view(p, 'm.setMonth(3)', 600);
        const data = await p.evaluate((s) => window.__mock.ev(s), IN_PAGE);
        const name = `${look}${patched ? (PASS2 ? '-fixed2' : '-fixed') : ''}-${tag}-dpr${dpr}`; fs.writeFileSync(OUT + name + '.json', JSON.stringify(data));
        const st = patched ? await p.evaluate(() => window.__mock.ev('JSON.stringify(NAT_LINES.stats)')) : '';
        console.log(name, 'edges', data.edges.length, 'seats', data.seats.length, 'Dpx', data.Dpx.toFixed(1), data.band, st);
      }
    }
    await p.context().close();
  }
  console.log('errors', JSON.stringify(errors.filter((x) => !/software WebGL|willReadFrequently/.test(x))));
  await b.close();
})();
