// the colour-blind wild edge test while a wild's neighbour is hovered (real pointer) or selected (real click), per view: node hoverwild.cjs <page>  -> out/hoverwild-<page>.json
// the rim / quiet-edge decision of every build reads the selected neighbour's tint but not the hovered one's; this measures whether that matters on rendered pixels
const { launch, open, ev, mev, page, OUT } = require('./lib.cjs'); const fs = require('fs');
const PN = process.argv[2];
const WC = `(() => { const o = {}; for (const w of WILDS) { let x = 0, y = 0; for (const c of w.cells) { x += cent[c][0]; y += cent[c][1]; } o[w.kind === 'mere' ? 'mere' : w.name.includes('Ash') ? 'ash' : 'grey'] = [x / w.cells.length, y / w.cells.length]; } return o; })()`;
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, out = { page: PN, views: {} };
  const p = await open(b, page(PN), { log, settle: 1500, reducedMotion: 'reduce' }); await p.mouse.move(720, 896);
  const wc = await mev(p, WC);
  const V = [['start', 'm.ev("fit(); draw()")'], ['mid', `m.setScale(1.0, ${(wc.grey[0] + wc.mere[0]) / 2}, ${(wc.grey[1] + wc.mere[1]) / 2 - 40})`], ['ashNear', `m.setScale(m.maxScale() * 0.55, ${wc.ash[0]}, ${wc.ash[1]})`]];
  for (const [v, src] of V) {
    await ev(p, src); await p.waitForTimeout(1800); await p.mouse.move(720, 896); await p.waitForTimeout(400);
    const base = await ev(p, 'm.reliefWildEdge()');
    // one probe point per (wild, neighbour): 14 px into the neighbour from the midpoint of its longest shared edge, on screen and inside the map view
    const pts = await mev(p, `(() => { const o = new Map(), v = viewRect(); for (const w of WILDS) for (const e of rlWildOutline(w)) { if (isWild(e.j)) continue; const [ax, ay] = toScreen(...e.a), [bx, by] = toScreen(...e.b), L = Math.hypot(bx - ax, by - ay); if (L < 30) continue;
      let nx = -(by - ay) / L, ny = (bx - ax) / L; const mx = (ax + bx) / 2, my = (ay + by) / 2; if (provinceAt(...toWorld(mx + nx * 8, my + ny * 8)) !== e.j) { nx = -nx; ny = -ny; } const x = mx + nx * 14, y = my + ny * 14;
      if (x < v.l + 20 || x > v.r - 20 || y < v.t + 20 || y > v.b - 20 || !inModel(...toWorld(x, y)) || provinceAt(...toWorld(x, y)) !== e.j) continue; const k = w.name + '/' + names[e.j]; if (!o.has(k) || o.get(k).L < L) o.set(k, { k, j: e.j, x, y, L }); }
      const r = canvas.getBoundingClientRect(); return [...o.values()].map((q) => ({ ...q, cx: r.left + q.x * r.width / W, cy: r.top + q.y * r.height / H })); })()`);
    const rows = [];
    for (const q of pts) {
      await p.mouse.move(q.cx, q.cy); await p.waitForTimeout(450);
      const hov = await ev(p, `(() => { const E = m.reliefWildEdge(); return { hovered: m.ev('hoverProv'), samples: E.samples, fails: E.fails, ex: E.examples.slice(0, 3), worst: E.worstFailRatio, rim: E.rim }; })()`);
      await p.mouse.click(q.cx, q.cy); await p.waitForTimeout(700);
      const sel = await ev(p, `(() => { const E = m.reliefWildEdge(); return { selected: m.ev('state.sel && state.sel.id'), samples: E.samples, fails: E.fails, ex: E.examples.slice(0, 3), worst: E.worstFailRatio }; })()`);
      await mev(p, 'state.sel = null; draw()'); await p.mouse.move(720, 896); await p.waitForTimeout(300);
      rows.push({ k: q.k, j: q.j, hover: hov, select: sel });
      console.log(PN, v, q.k, 'hover', hov.hovered, hov.fails + '/' + hov.samples, hov.fails ? JSON.stringify(hov.ex) : '', '| select', sel.selected, sel.fails + '/' + sel.samples, sel.fails ? JSON.stringify(sel.ex) : '');
    }
    out.views[v] = { base: { samples: base.samples, fails: base.fails, rim: base.rim }, rows };
    console.log(PN, v, 'base', base.fails + '/' + base.samples, 'probes', rows.length, 'hoverFails', rows.reduce((a, r) => a + r.hover.fails, 0), 'selectFails', rows.reduce((a, r) => a + r.select.fails, 0));
  }
  out.pageErrors = log.pageErrors; console.log(PN, 'pageErrors', log.pageErrors.length, JSON.stringify(log.pageErrors.slice(0, 3)));
  fs.writeFileSync(`${OUT}hoverwild-${PN}.json`, JSON.stringify(out, null, 1)); await b.close();
})();
