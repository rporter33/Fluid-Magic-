// Pass 4 final: region-name fit under the final rule (Marcellus SC, 0.12 em tracking, spine clamped to +-30 deg, size min(cap, fit), floor 11 px). Read-only.
(() => {
  const REG = __REG__;
  const ix = {}; provList.forEach((i) => { ix[names[i]] = i; });
  const c = document.createElement('canvas').getContext('2d');
  const wOf = (s, px) => { c.font = `${px}px 'Marcellus SC', serif`; try { c.letterSpacing = (0.12 * px).toFixed(2) + 'px'; } catch (e) {} return c.measureText(s).width; };
  const D = MED_DIAM, out = { D: +D.toFixed(1), regions: REG.length, rows: [] };
  const geom = REG.map((r) => { const pts = r.provs.map((n) => cent[ix[n]]); const mx = pts.reduce((a, p) => a + p[0], 0) / pts.length, my = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    let sxx = 0, syy = 0, sxy = 0; for (const [x, y] of pts) { sxx += (x - mx) ** 2; syy += (y - my) ** 2; sxy += (x - mx) * (y - my); }
    const tr = sxx + syy, det = sxx * syy - sxy * sxy, l1 = tr / 2 + Math.sqrt(Math.max(0, tr * tr / 4 - det)); let ux = sxy, uy = l1 - sxx; if (Math.abs(ux) + Math.abs(uy) < 1e-9) { ux = 1; uy = 0; }
    let ang = Math.atan2(uy, ux) * 180 / Math.PI; if (ang > 90) ang -= 180; if (ang < -90) ang += 180; const cl = Math.max(-30, Math.min(30, ang)), a = cl * Math.PI / 180, vx = Math.cos(a), vy = Math.sin(a);
    const proj = pts.map(([x, y]) => (x - mx) * vx + (y - my) * vy), ext = Math.max(...proj) - Math.min(...proj);
    return { name: r.name, n: r.n, angle: +ang.toFixed(0), clamped: cl !== ang, spineU: ext + 0.6 * D, extentU: ext + 1.0 * D }; });
  out.steep = geom.filter((g) => g.clamped).length;
  for (const [dpx, cap, floor] of [[26.6, 12.5, 11], [29.4, 12.5, 11], [32, 12.5, 11], [36.7, 12.5, 11], [40, 12.5, 11], [44, 12.5, 11], [53.7, 12.5, 11.5], [62, 12.5, 11.5]]) {
    const sc = dpx / D; let strict = 0, relaxed = 0; const sizes = [];
    for (const g of geom) { const w1 = wOf(g.name, 1), sp = g.spineU * sc, ex = g.extentU * sc, fs = Math.min(cap, 0.85 * sp / w1);
      if (fs >= floor) { strict++; sizes.push(+fs.toFixed(1)); } else if (wOf(g.name, floor) <= 1.25 * ex) relaxed++; }
    out.rows.push({ dpx, strictFit: strict, relaxedOnly: relaxed, share: +((strict + relaxed) / geom.length).toFixed(2), sizes: [Math.min(...sizes, 99), Math.max(...sizes, 0)] }); }
  out.angles = geom.map((g) => g.angle); return JSON.stringify(out);
})()
