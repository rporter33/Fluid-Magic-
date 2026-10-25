// vshot.cjs <variant> <camera expr> <x> <y> <w> <h> <out>: a crop at a camera on a variant map, with the sample spot
const { launch, open, ev } = require('./lib.cjs');
(async () => { const [V0, cam, x, y, w, h, out] = process.argv.slice(2), b = await launch(); const p = await open(b, `${__dirname}/../variants/${V0}/game-screen-v4.html`, { settle: 1500 }); await p.mouse.move(720, 896);
  await ev(p, cam); await p.waitForTimeout(1500); await p.screenshot({ path: out, clip: { x: +x, y: +y, width: +w, height: +h } }); await b.close(); })();
