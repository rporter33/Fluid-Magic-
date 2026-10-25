const { launch, open, mev, PAGE } = require('./lib.cjs'); const fs = require('fs');
(async () => { for (const [nm, file] of [['now', PAGE], ['before', process.env.BEFORE]]) { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, file, { log, settle: 1500, q: '?terrain=clear' });
  const u = await mev(p, "(() => { const r = rlRim(); const c = makeCanvas(600, 160), g = c.getContext('2d'); const k = r.canvas.width / r.w; g.drawImage(r.canvas, (W / 2 - 300 - r.x0) * k, (H - 10 - r.y0) * k, 600 * k, 160 * k, 0, 0, 600, 160); return c.toDataURL ? c.toDataURL() : null; })()");
  if (u) fs.writeFileSync(`${__dirname}/../out/rim-${nm}.png`, Buffer.from(u.split(',')[1], 'base64')); else console.log('no toDataURL'); await b.close(); } })();
