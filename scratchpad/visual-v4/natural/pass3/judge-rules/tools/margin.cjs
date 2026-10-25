// how much room each build leaves on the colour-blind wild edge test: the verifier's rlWildEdgeCheck, re-implemented to return each sample's margin
// m = max(pair ratio, best line-pixel ratio), ratio = min(dE00/20, cvd/12); a sample fails under 1. node margin.cjs <page> [dpr]  -> out/margin-<page>-dpr<d>.json
const { launch, open, ev, mev, page, OUT } = require('./lib.cjs'); const fs = require('fs');
const PN = process.argv[2], dpr = Number(process.argv[3] || 1);
const WC = `(() => { const o = {}; for (const w of WILDS) { let x = 0, y = 0; for (const c of w.cells) { x += cent[c][0]; y += cent[c][1]; } o[w.kind === 'mere' ? 'mere' : w.name.includes('Ash') ? 'ash' : 'grey'] = [x / w.cells.length, y / w.cells.length]; } return o; })()`;
const PROBE = `(() => { const d = rlRedraw(['pieces', 'labels', 'badges', 'arrows']), W2 = canvas.width, H2 = canvas.height, v = viewRect();
  const px = (sx, sy) => { const X = Math.floor(sx * dpr), Y = Math.floor(sy * dpr); if (X < 0 || Y < 0 || X >= W2 || Y >= H2) return null; const k = (Y * W2 + X) * 4; return [d[k], d[k + 1], d[k + 2]]; };
  const med = (a) => { const s2 = a.filter(Boolean).sort((p, q) => rlL(...p) - rlL(...q)); return s2[s2.length >> 1]; }, R = (q) => Math.min(q.normal / 20, q.cvd / 12);
  const ms = [], byWild = {};
  for (const w of WILDS) for (const e of rlWildOutline(w)) {
    const [ax, ay] = toScreen(...e.a), [bx, by] = toScreen(...e.b), Lg = Math.hypot(bx - ax, by - ay); if (Lg < 12) continue; let nx = -(by - ay) / Lg, ny = (bx - ax) / Lg;
    const [mx, my] = [(ax + bx) / 2, (ay + by) / 2]; if (provinceAt(...toWorld(mx + nx * 8, my + ny * 8)) !== e.j) { nx = -nx; ny = -ny; }
    for (let s = 6; s < Lg - 6; s += 4) {
      const sx = ax + ((bx - ax) * s) / Lg, sy = ay + ((by - ay) * s) / Lg; if (sx < v.l + 12 || sx > v.r - 12 || sy < v.t + 12 || sy > v.b - 12) continue;
      if (!inModel(...toWorld(sx + nx * 10, sy + ny * 10)) || provinceAt(...toWorld(sx + nx * 8, sy + ny * 8)) !== e.j) continue;
      const Wg = med([6, 7, 8, 9].map((o) => px(sx - nx * o, sy - ny * o))), G = med([6, 7, 8, 9, 9.5].map((o) => px(sx + nx * o, sy + ny * o))); if (!Wg || !G) continue;
      let m = R(rlPairDE(Wg, G)), via = 'pair';
      for (let o = -4; o <= 4; o += 0.5) { const c = px(sx + nx * o, sy + ny * o); if (!c) continue; const r = Math.min(R(rlPairDE(c, Wg)), R(rlPairDE(c, G))); if (r > m) { m = r; via = rlL(...c) > 50 ? 'light' : 'dark'; } }
      ms.push(m); (byWild[w.name] = byWild[w.name] || { n: 0, under105: 0, under110: 0, fails: 0, light: 0, dark: 0, pair: 0 }); const B = byWild[w.name]; B.n++; B[via]++; if (m < 1) B.fails++; if (m < 1.05) B.under105++; if (m < 1.1) B.under110++;
    }
  }
  ms.sort((a, b) => a - b); const q = (f) => ms.length ? +ms[Math.min(ms.length - 1, Math.floor(f * ms.length))].toFixed(3) : null;
  return { band: bandOf(cam.s), n: ms.length, min: q(0), p1: q(0.01), p5: q(0.05), p50: q(0.5), fails: ms.filter((x) => x < 1).length, under105: ms.filter((x) => x < 1.05).length, under110: ms.filter((x) => x < 1.1).length, byWild }; })()`;
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, out = { page: PN, dpr, views: {} };
  const p = await open(b, page(PN), { log, dpr, settle: 1500, reducedMotion: 'reduce' }); await p.mouse.move(720, 896);
  const wc = await mev(p, WC), set = (k, f) => `m.setScale(m.maxScale() * ${f}, ${wc[k][0]}, ${wc[k][1]})`;
  const V = [['start', 'm.ev("fit(); draw()")'], ['min', 'm.setScale(m.minScale(), 800, 500)'], ['far60', `m.setScale(60 / m.ev('MED_DIAM'), 800, 500)`], ['mid', `m.setScale(1.0, ${(wc.grey[0] + wc.mere[0]) / 2}, ${(wc.grey[1] + wc.mere[1]) / 2 - 40})`], ['ref', 'm.setScale(1.142, 700, 560)'],
    ['ash', set('ash', 0.55)], ['grey', set('grey', 0.55)], ['mere', set('mere', 0.55)], ['ashMax', set('ash', 1)], ['greyMax', set('grey', 1)], ['mereMax', set('mere', 1)]];
  for (const [v, src] of V) { await ev(p, src); await p.waitForTimeout(1800); const r = await mev(p, PROBE); out.views[v] = r;
    console.log(PN, 'dpr' + dpr, v, r.band, 'n', r.n, 'min', r.min, 'p1', r.p1, 'p5', r.p5, 'p50', r.p50, 'fails', r.fails, '<1.05', r.under105, '<1.10', r.under110, JSON.stringify(Object.fromEntries(Object.entries(r.byWild).map(([k, B]) => [k.replace('The ', ''), [B.n, B.fails, B.under105, B.pair, B.dark, B.light]])))); }
  out.pageErrors = log.pageErrors; console.log(PN, 'pageErrors', log.pageErrors.length);
  fs.writeFileSync(`${OUT}margin-${PN}-dpr${dpr}.json`, JSON.stringify(out, null, 1)); await b.close();
})();
