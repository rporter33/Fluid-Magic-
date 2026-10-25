// node provstats.cjs <html> <out.json>: per-province on-screen statistics at the start view, both palettes (full decoration, as shown).
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const [file, out] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const res = {};
  for (const pal of ['painted', 'bright']) {
    for (const zoom of ['start', 'near']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
    await page.goto('file://' + file + (pal === 'painted' ? '?palette=painted' : ''), { waitUntil: 'networkidle' }); await page.waitForTimeout(2500);
    await page.mouse.move(1000, 885);
    if (zoom === 'near') { await page.evaluate(() => window.__mock.zoomTo(1.4, 'Stagmoor')); await page.waitForTimeout(3500); }
    res[pal + ':' + zoom] = await page.evaluate(() => window.__mock.ev(`(() => {
      const c = document.getElementById('map'), cp = document.createElement('canvas'); cp.width = c.width; cp.height = c.height;
      const g = cp.getContext('2d', { willReadFrequently: true }); g.drawImage(c, 0, 0); const D = g.getImageData(0, 0, c.width, c.height).data;
      const k = c.width / c.getBoundingClientRect().width;
      const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      const Lof = (r, gg, b) => { const Y = 0.2126729 * lin(r) + 0.7151522 * lin(gg) + 0.072175 * lin(b); return Y > 216 / 24389 ? 116 * Math.cbrt(Y) - 16 : (24389 / 27) * Y; };
      const out = [];
      for (const i of provList) {
        const poly = cells[i].map(([x, y]) => toScreen(x, y).map((v) => v * k));
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of poly) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
        const inside = (x, y) => { let s = false; for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) { const [xa, ya] = poly[a], [xb, yb] = poly[b]; if ((ya > y) !== (yb > y) && x < ((xb - xa) * (y - ya)) / (yb - ya) + xa) s = !s; } return s; };
        const dEdge = (x, y) => { let m = 1e9; for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) { const [xa, ya] = poly[a], [xb, yb] = poly[b], dx = xb - xa, dy = yb - ya, t = Math.max(0, Math.min(1, ((x - xa) * dx + (y - ya) * dy) / (dx * dx + dy * dy || 1))); m = Math.min(m, Math.hypot(x - xa - t * dx, y - ya - t * dy)); } return m; };
        let n = 0, sr = 0, sg = 0, sb = 0; const Ls = [];
        for (let y = Math.max(0, Math.floor(y0)); y < Math.min(c.height, y1); y++) for (let x = Math.max(0, Math.floor(x0)); x < Math.min(c.width, x1); x++) {
          if (!inside(x + 0.5, y + 0.5) || dEdge(x + 0.5, y + 0.5) < 7 * k) continue;
          const o = (y * c.width + x) * 4; sr += D[o]; sg += D[o + 1]; sb += D[o + 2]; n++; Ls.push(Lof(D[o], D[o + 1], D[o + 2]));
        }
        if (n < 30) continue;
        Ls.sort((a, b) => a - b); const med = Ls[Ls.length >> 1], mean = Ls.reduce((a, b) => a + b, 0) / n, sd = Math.sqrt(Ls.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
        const flat = Ls.filter((v) => Math.abs(v - med) < 3).length / n, p10 = Ls[Math.floor(n * 0.1)], p90 = Ls[Math.floor(n * 0.9)];
        out.push({ name: names[i], terrain: terr[i], fog: fogOf(i), owner: prov[i].owner || '', n, rgb: [sr / n, sg / n, sb / n].map(Math.round), Lmean: +mean.toFixed(1), Lsd: +sd.toFixed(1), Lp10: +p10.toFixed(1), Lp90: +p90.toFixed(1), flat: +flat.toFixed(3) });
      }
      return { s: cam.s, k, provinces: out };
    })()`));
    await page.close();
    }
  }
  fs.writeFileSync(out, JSON.stringify(res, null, 1));
  await browser.close();
})();
