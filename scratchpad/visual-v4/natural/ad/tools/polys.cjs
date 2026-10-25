// screen polygons of every province and wild at the layer-ablation views, for per-terrain stats on the land-only shots
const { launch, open, PAGE } = require('../../build-tools/nlib.cjs');
const fs = require('fs');
const ev = (p, s) => p.evaluate((s) => { const m = window.__mock; return eval(s); }, s);
(async () => {
  const b = await launch();
  const p = await open(b, PAGE, { settle: 800, reducedMotion: 'reduce' });
  const views = { start: 'm.ev("fit(); draw()")', mid: 'm.setScale(1.0, 640, 480)', refC: 'm.setScale(1.142, 700, 560)', refW: 'm.setScale(1.142, 400, 420)' };
  const out = {};
  for (const [vn, vs] of Object.entries(views)) {
    await ev(p, vs);
    out[vn] = await ev(p, `m.ev("(() => { const r = canvas.getBoundingClientRect(); return { s: cam.s, provs: names.map((n, i) => ({ i, n, t: terr[i], wild: isWild(i), owner: prov[i] ? prov[i].owner : null, fog: fogOf(i), poly: cells[i].map(([x, y]) => { const [a, b] = toScreen(x, y); return [r.left + a, r.top + b]; }) })) }; })()")`);
  }
  fs.writeFileSync(__dirname + '/../polys.json', JSON.stringify(out));
  console.log('ok', Object.keys(out).map((k) => k + ':' + out[k].provs.length));
  await b.close();
})();
