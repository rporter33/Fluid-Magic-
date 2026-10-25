// node edgeprof.cjs <html> <out.json>: mean L* by distance from the province edge at the start view (unowned, explored provinces only, so no
// band), per terrain, both palettes; shows how strongly each province is framed by its own edge pool at the start zoom.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const [file, out] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const res = {};
  for (const pal of ['painted', 'bright']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: process.env.D3_LOCAL, contentType: 'application/javascript' }));
    await page.goto('file://' + file + (pal === 'painted' ? '?palette=painted' : ''), { waitUntil: 'networkidle' }); await page.waitForTimeout(2500);
    await page.mouse.move(1000, 885);
    for (const zoom of [['start', null], ['mid0957', 0.957]]) {
      if (zoom[1]) { await page.evaluate((s) => window.__mock.zoomTo(s, 'Elmwick'), zoom[1]); await page.waitForTimeout(3000); }
      res[pal + ':' + zoom[0]] = await page.evaluate(() => window.__mock.ev(`(() => {
      const c = document.getElementById('map'), cp = document.createElement('canvas'); cp.width = c.width; cp.height = c.height;
      const g = cp.getContext('2d', { willReadFrequently: true }); g.drawImage(c, 0, 0); const D = g.getImageData(0, 0, c.width, c.height).data;
      const k = c.width / c.getBoundingClientRect().width;
      const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      const Lof = (r, gg, b) => { const Y = 0.2126729 * lin(r) + 0.7151522 * lin(gg) + 0.072175 * lin(b); return Y > 216 / 24389 ? 116 * Math.cbrt(Y) - 16 : (24389 / 27) * Y; };
      const bins = [0, 2, 4, 6, 8, 10, 13, 16, 20, 25, 32, 45], per = {};
      for (const i of provList) {
        if (prov[i].owner || fogOf(i)) continue;
        const poly = npolyLite(i).map(([x, y]) => toScreen(x, y).map((v) => v * k));
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of poly) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
        const inside = (x, y) => { let s = false; for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) { const [xa, ya] = poly[a], [xb, yb] = poly[b]; if ((ya > y) !== (yb > y) && x < ((xb - xa) * (y - ya)) / (yb - ya) + xa) s = !s; } return s; };
        const dEdge = (x, y) => { let m = 1e9; for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) { const [xa, ya] = poly[a], [xb, yb] = poly[b], dx = xb - xa, dy = yb - ya, t = Math.max(0, Math.min(1, ((x - xa) * dx + (y - ya) * dy) / (dx * dx + dy * dy || 1))); m = Math.min(m, Math.hypot(x - xa - t * dx, y - ya - t * dy)); } return m; };
        const t = terr[i], acc = (per[t] ??= bins.map(() => []));
        for (let y = Math.max(0, Math.floor(y0)); y < Math.min(c.height, y1); y++) for (let x = Math.max(0, Math.floor(x0)); x < Math.min(c.width, x1); x++) {
          if (!inside(x + 0.5, y + 0.5)) continue; const d = dEdge(x + 0.5, y + 0.5) / k; let b = bins.length - 1; for (let q = 0; q < bins.length - 1; q++) if (d < bins[q + 1]) { b = q; break; }
          const o = (y * c.width + x) * 4; acc[b].push(Lof(D[o], D[o + 1], D[o + 2]));
        }
      }
      const med = (a) => { if (!a.length) return null; const s = [...a].sort((p, q) => p - q); return +s[s.length >> 1].toFixed(1); };
      return { s: cam.s, bins, per: Object.fromEntries(Object.entries(per).map(([t, a]) => [t, a.map(med)])) };
    })()`));
    }
    await page.close();
  }
  fs.writeFileSync(out, JSON.stringify(res, null, 1));
  for (const [k, v] of Object.entries(res)) { console.log(k, 'scale', v.s.toFixed(3), 'bins(px from edge)', v.bins.join(',')); for (const [t, a] of Object.entries(v.per)) console.log('  ', t.padEnd(10), a.map((x) => (x == null ? '  - ' : x.toFixed(0).padStart(4))).join('')); }
  await browser.close();
})();
