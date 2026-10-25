const { launch, open, PAGE, view } = require('../../tools/natpage.cjs');
const fs = require('fs');
(async () => { const b = await launch(), e = []; const p = await open(b, PAGE, 1440, 900, '', e, { settle: 1500 });
  console.log(await p.evaluate((s) => window.__mock.ev(s), fs.readFileSync(__dirname + '/patches5.js', 'utf8')));
  await view(p, 'm.setScale(1.0, 640, 480)', 1500);
  console.log(await p.evaluate(() => window.__mock.ev(`JSON.stringify([...EDGE.values()].filter((e) => (e.i === 22 && e.j === 33) || (e.i === 12 && e.j === 23)).map((e) => ({ i: e.i, j: e.j, w: rlW(), st: NAT_LINES.segStyles(e, 'int').map((s) => [s.key, +s.alpha.toFixed(2), s.ok, +s.reach.toFixed(2)]) })))`)));
  console.log(await p.evaluate(() => window.__mock.ev(`rlDrawRails.toString().match(/const ikw[^}]*}/)[0]`)));
  await b.close(); })();
