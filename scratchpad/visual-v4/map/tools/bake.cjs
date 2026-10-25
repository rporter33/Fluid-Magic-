// node bake.cjs <html> <outPrefix>: the relief bake as PNG (full and a 1:1 crop list), plus the bake stats
const { launch, open } = require('./lib.cjs'); const fs = require('fs');
const [file, out, ...crops] = process.argv.slice(2);
(async () => {
  const b = await launch(), errors = [];
  const page = await open(b, file, 1440, 900, '', errors, { settle: 200 });
  const url = await page.evaluate(() => window.__mock.ev('RB.canvas.toDataURL()'));
  fs.writeFileSync(out + '-full.png', Buffer.from(url.split(',')[1], 'base64'));
  const st = await page.evaluate(() => window.__mock.ev('JSON.stringify({t: RB.t, total: Math.round(RB.total), share: Math.min(...RB.ownShare.map(o=>o.share)).toFixed(3), resid: Math.max(...RB.residual.map(r=>Math.abs(r.dL))).toFixed(4), water: [RB.water.lakes.length, RB.water.ponds.length, RB.water.streams.length, RB.water.falls.length]})'));
  console.log(st, 'ERRORS', JSON.stringify(errors)); await b.close();
})();
