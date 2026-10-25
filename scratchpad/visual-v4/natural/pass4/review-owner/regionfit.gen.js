// Review probe (owner review of pass 4): does each mock region's name fit 0.85 of its long axis at Lean-back and Far zooms? Read-only.
(() => {
  const REG = [{"name": "The Broad Plain", "n": 8, "terrain": "plains", "holder": "red 5", "connected": true, "provs": ["Kharnath", "Redholt", "Briardale", "Torbarrow", "Stagmarch", "Ashfen", "Brambarrow", "Briarmarch"]}, {"name": "The Wind Knolls", "n": 6, "terrain": "hills", "holder": "independent 4", "connected": true, "provs": ["Oakford", "Briarstead", "Wyrford", "Bramreach", "Rookmere", "Cinford"]}, {"name": "The Sedge Fens", "n": 9, "terrain": "swamp", "holder": "independent 9", "connected": true, "provs": ["Lanbrook", "Rookbarrow", "Sundale", "Oakmarch", "Thornbrook", "Marholt", "Ashmoor", "Gallreach", "Lanstead"]}, {"name": "The Lark Leas", "n": 8, "terrain": "plains", "holder": "independent 6", "connected": true, "provs": ["Thornwick", "Rookford", "Wyrmere", "Thornreach", "Coldbrook", "Rookmarch", "Redcrag", "Brammere"]}, {"name": "The Long Downs", "n": 8, "terrain": "hills", "holder": "independent 6", "connected": true, "provs": ["Halegate", "Ashvale", "Karwick", "Morholt", "Sunmere", "Halevale", "Karreach", "Wyrholt"]}, {"name": "The Mosswold", "n": 6, "terrain": "forest", "holder": "independent 6", "connected": true, "provs": ["Cinfen", "Redwick", "Duskholt", "Morgate", "Redbarrow", "Elmwick"]}, {"name": "The Elderholt", "n": 8, "terrain": "forest", "holder": "independent 6", "connected": true, "provs": ["Stagmoor", "Tormere", "Oakmoor", "Ashstead", "Briarmoor", "Coldmere", "Fenvale", "Karford"]}, {"name": "The Gold Leas", "n": 7, "terrain": "plains", "holder": "green 4", "connected": true, "provs": ["Elmgate", "Elmcrag", "Ashdale", "Wyrmarch", "Deepmoss", "Halebrook", "Wyrfen"]}];
  const ix = {}; provList.forEach((i) => { ix[names[i]] = i; });
  const c = document.createElement('canvas').getContext('2d');
  const wOf = (s, px) => { c.font = `${px}px 'Marcellus SC', serif`; try { c.letterSpacing = (0.28 * px).toFixed(2) + 'px'; } catch (e) {} return c.measureText(s).width; };
  const res = [];
  for (const r of REG) {
    const pts = r.provs.map((n) => cent[ix[n]]);
    const mx = pts.reduce((a, p) => a + p[0], 0) / pts.length, my = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    let sxx = 0, syy = 0, sxy = 0; for (const [x, y] of pts) { sxx += (x - mx) ** 2; syy += (y - my) ** 2; sxy += (x - mx) * (y - my); }
    const tr = sxx + syy, det = sxx * syy - sxy * sxy, l1 = tr / 2 + Math.sqrt(Math.max(0, tr * tr / 4 - det));
    let ux = sxy, uy = l1 - sxx; if (Math.abs(ux) + Math.abs(uy) < 1e-9) { ux = 1; uy = 0; } const L = Math.hypot(ux, uy); ux /= L; uy /= L;
    const proj = pts.map(([x, y]) => (x - mx) * ux + (y - my) * uy); const ext = Math.max(...proj) - Math.min(...proj) + 0.6 * MED_DIAM; // world units, + 0.3 D each end
    const row = { name: r.name, n: r.n, extD: +(ext / MED_DIAM).toFixed(2), angle: +(Math.atan2(uy, ux) * 180 / Math.PI).toFixed(0) };
    for (const [dpx, px] of [[26.6, 15], [26.6, 12], [36.7, 15], [36.7, 12], [53.7, 12.5], [53.7, 14], [66, 14]]) { const spine = ext / MED_DIAM * dpx; row[`fit@${dpx}/${px}`] = +(wOf(r.name, px) / (0.85 * spine)).toFixed(2); }
    res.push(row);
  }
  return JSON.stringify({ MED_DIAM, W, H, res });
})()
