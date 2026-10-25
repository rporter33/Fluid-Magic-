// dump a box's rasters as grey PNGs: node fine2.cjs <outdir> [box]
const { launch, open, mev } = require('./lib.cjs'); const fs = require('fs');
(async () => {
  const dir = process.argv[2], bi = Number(process.argv[3] || 0); fs.mkdirSync(dir, { recursive: true }); const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, require('./lib.cjs').PAGE, { log, settle: 500 });
  const r = await mev(p, `(() => { const B = RB.ms.boxes[${bi}], out = {};
    const pic = (A, w, h, lo, hi) => { const c = makeCanvas(w, h), g = c.getContext('2d'), im = g.createImageData(w, h); for (let k = 0; k < w * h; k++) { const v = Math.max(0, Math.min(255, Math.round(255 * (A[k] - lo) / (hi - lo)))); im.data[k * 4] = im.data[k * 4 + 1] = im.data[k * 4 + 2] = v; im.data[k * 4 + 3] = 255; } g.putImageData(im, 0, 0); return c.toDataURL('image/png'); };
    let lo = Infinity, hi = -Infinity; for (const v of B.h) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    out.h = pic(B.h, B.nw, B.nh, lo, hi); out.cast = pic(B.cast, B.bw, B.bh, 0, 1); out.ao = pic(B.ao, B.bw, B.bh, 0, 1); out.m = pic(B.m, B.nw, B.nh, 0, 1.3); out.h1 = pic(B.h1, B.bw, B.bh, lo, hi); out.range = [lo, hi]; return out; })()`);
  for (const k of ['h', 'cast', 'ao', 'm', 'h1']) fs.writeFileSync(`${dir}/${k}.png`, Buffer.from(r[k].split(',')[1], 'base64')); console.log(r.range);
  await b.close();
})();
