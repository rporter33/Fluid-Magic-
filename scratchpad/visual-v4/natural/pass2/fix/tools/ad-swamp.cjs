const { launch, open, ev, PAGE } = require('./lib.cjs');
const fs = require('fs');
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, p = await open(b, PAGE, { log, settle: 1200 }); await p.mouse.move(720, 894);
  await p.evaluate((src) => window.__mock.ev(src), fs.readFileSync(__dirname + '/ad-adprobe.js', 'utf8'));
  const code = `(() => { const d = rlRedraw(['rails','pieces','labels','badges','arrows']), W2 = canvas.width, H2 = canvas.height, v = viewRect();
    const c = document.createElement('canvas'); c.width = W2; c.height = H2; const g = c.getContext('2d'); g.setTransform(dpr * cam.s, 0, 0, dpr * cam.s, dpr * cam.x, dpr * cam.y);
    const T = ['plains','farmland','forest','hills','mountains','swamp','wasteland']; provs.forEach(q => { pathPoly(g, cells[q.i]); g.fillStyle = 'rgb(' + (20 + 20 * T.indexOf(q.terrain)) + ',0,0)'; g.fill(); });
    g.strokeStyle = '#000'; g.lineWidth = 16 / cam.s; for (const [, e] of EDGE) { g.beginPath(); g.moveTo(...e.a); g.lineTo(...e.b); g.stroke(); }
    const M = g.getImageData(0, 0, W2, H2).data, L = (o) => { const f = (x) => { x /= 255; return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; const Y = 0.2126 * f(d[o]) + 0.7152 * f(d[o + 1]) + 0.0722 * f(d[o + 2]); return Y > 0.008856 ? 116 * Math.cbrt(Y) - 16 : 903.3 * Y; };
    const acc = {}; for (let y = Math.ceil((v.t + 6) * dpr); y < Math.floor((v.b - 6) * dpr); y++) for (let x = Math.ceil((v.l + 6) * dpr); x < Math.floor((v.r - 6) * dpr); x++) { const k = y * W2 + x, t = Math.round((M[k * 4] - 20) / 20); if (M[k * 4] < 10) continue; (acc[T[t]] ??= []).push(L(k * 4)); }
    const out = {}; for (const [t, a] of Object.entries(acc)) { a.sort((p, q) => p - q); const med = a[a.length >> 1]; out[t] = { px: a.length, Lp10: +a[Math.floor(a.length * 0.1)].toFixed(1), Lp50: +med.toFixed(1), Lp90: +a[Math.floor(a.length * 0.9)].toFixed(1), darkShare: +(a.filter(x => x < med - 6).length / a.length).toFixed(3) }; } return out; })()`;
  const r = {}; r.start = await ev(p, `m.ev(${JSON.stringify(code)})`); await ev(p, 'm.zoomTo(1.142, "Ashmoor")'); await p.waitForTimeout(800); r.ref = await ev(p, `m.ev(${JSON.stringify(code)})`);
  r.hfRef = await p.evaluate(() => window.__ad.hfCores());
  console.log(JSON.stringify(r, null, 1)); await b.close();
})();
