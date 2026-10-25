const { launch, open, mev, PAGES, OUT } = require('./lib.cjs'); const fs = require('fs');
(async () => { const b = await launch(); const p = await open(b, PAGES.p2, { settle: 300 });
  const r = await mev(p, `(() => { const out = { MED_DIAM, maxS: maxScale, minS: minScale, cam: { ...cam }, W, H, wilds: [] };
    for (const w of WILDS) { let sx = 0, sy = 0, n = 0, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const c of w.cells) for (const [x, y] of cells[c]) { sx += x; sy += y; n++; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
      const nb = [...new Set(w.cells.flatMap((c) => NB[c]))].filter((c) => !w.cells.includes(c)).map((c) => ({ c, name: (typeof PROV !== 'undefined' && PROV[c] && PROV[c].name) || null, terr: terr[c], wild: wildOf[c] ? wildOf[c].id || true : null }));
      out.wilds.push({ id: w.id, name: w.name, kind: w.kind, cells: w.cells, cx: sx / n, cy: sy / n, bbox: [x0, y0, x1, y1], nb, polys: w.cells.map((c) => cells[c]) }); }
    return out; })()`);
  fs.writeFileSync(OUT + 'wildinfo.json', JSON.stringify(r)); const s = JSON.parse(JSON.stringify(r)); for (const w of s.wilds) delete w.polys; console.log(JSON.stringify(s, null, 1).slice(0, 4000)); await b.close(); })();
