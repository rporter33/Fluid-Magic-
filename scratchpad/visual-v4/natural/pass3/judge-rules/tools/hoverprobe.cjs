// the colour-blind wild edge test (the page's own m.reliefWildEdge) while each passable neighbour of a wild is hovered, then selected, with the real pointer
// node hoverprobe.cjs <page> [look] [dpr]  ->  out/hover-<page>-<look>-dpr<d>.json
const { launch, open, ev, mev, page, OUT } = require('./lib.cjs'); const fs = require('fs');
const PN = process.argv[2], look = process.argv[3] || 'natural', dpr = Number(process.argv[4] || 1), PAGE = page(PN);
const WC = `(() => { const o = {}; for (const w of WILDS) { let x = 0, y = 0; for (const c of w.cells) { x += cent[c][0]; y += cent[c][1]; } o[w.kind === 'mere' ? 'mere' : w.name.includes('Ash') ? 'ash' : 'grey'] = [x / w.cells.length, y / w.cells.length]; } return o; })()`;
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, rows = [];
  const p = await open(b, PAGE, { log, dpr, settle: 1500, q: look === 'clear' ? '?terrain=clear' : '' }); await p.mouse.move(720, 896);
  const wc = await mev(p, WC);
  const VIEWS = [['start', 'm.ev("fit(); draw()")'], ['mid', `m.setScale(1.0, ${(wc.grey[0] + wc.mere[0]) / 2}, ${(wc.grey[1] + wc.mere[1]) / 2})`], ['ash', `m.setScale(m.maxScale() * 0.5, ${wc.ash[0]}, ${wc.ash[1]})`], ['grey', `m.setScale(m.maxScale() * 0.5, ${wc.grey[0]}, ${wc.grey[1]})`]];
  for (const [v, src] of VIEWS) {
    await ev(p, src); await p.mouse.move(720, 896); await p.waitForTimeout(1800);
    const base = await ev(p, 'm.reliefWildEdge()');
    const pts = await mev(p, `(() => { const v = viewRect(), o = []; const seen = new Set();
      for (const w of WILDS) for (const e of rlWildOutline(w)) { if (isWild(e.j)) continue; const [ax, ay] = toScreen(...e.a), [bx, by] = toScreen(...e.b), L = Math.hypot(bx - ax, by - ay); if (L < 16) continue;
        let nx = -(by - ay) / L, ny = (bx - ax) / L; const mx = (ax + bx) / 2, my = (ay + by) / 2; if (provinceAt(...toWorld(mx + nx * 8, my + ny * 8)) !== e.j) { nx = -nx; ny = -ny; }
        const sx = mx + nx * 16, sy = my + ny * 16; if (sx < v.l + 30 || sx > v.r - 30 || sy < v.t + 30 || sy > v.b - 30) continue; if (provinceAt(...toWorld(sx, sy)) !== e.j) continue;
        const key = e.j; if (seen.has(key)) continue; seen.add(key); const cr = canvas.getBoundingClientRect(); o.push({ j: e.j, name: names[e.j], terr: terr[e.j], wild: w.name, x: sx + cr.left, y: sy + cr.top }); }
      return o; })()`);
    const vr = { view: v, base: { samples: base.samples, fails: base.fails, rim: base.rim }, hover: [], select: [] };
    for (const q of pts) {
      await p.mouse.move(q.x, q.y); await p.waitForTimeout(500); const hp = await mev(p, 'hoverProv');
      const r = await ev(p, 'm.reliefWildEdge()'); vr.hover.push({ name: q.name, terr: q.terr, wild: q.wild, hovered: hp === q.j, samples: r.samples, fails: r.fails, worst: r.worstFailRatio, ex: r.examples.slice(0, 3) });
      await p.mouse.click(q.x, q.y); await p.waitForTimeout(900); const sel = await mev(p, 'state.sel ? [state.sel.type, state.sel.id] : null');
      await p.mouse.move(720, 896); await p.waitForTimeout(500);
      const r2 = await ev(p, 'm.reliefWildEdge()'); vr.select.push({ name: q.name, terr: q.terr, wild: q.wild, selected: !!sel && sel[1] === q.j, samples: r2.samples, fails: r2.fails, worst: r2.worstFailRatio, ex: r2.examples.slice(0, 3) });
      await p.keyboard.press('Escape'); await p.waitForTimeout(300); await mev(p, 'state.sel = null; draw()'); await p.waitForTimeout(500);
    }
    const hf = vr.hover.filter((h) => h.fails), sf = vr.select.filter((h) => h.fails);
    console.log(PN, look, v, 'base', base.samples, base.fails, 'hovered', vr.hover.length, 'with fails', hf.length, JSON.stringify(hf.map((h) => [h.name, h.fails, h.worst && h.worst.v])), 'selected', vr.select.length, 'with fails', sf.length, JSON.stringify(sf.map((h) => [h.name, h.fails, h.worst && h.worst.v])), 'hoverOk', vr.hover.filter((h) => h.hovered).length, 'selOk', vr.select.filter((h) => h.selected).length);
    rows.push(vr);
  }
  console.log('pageErrors', log.pageErrors.length, JSON.stringify(log.pageErrors.slice(0, 3)));
  fs.writeFileSync(`${OUT}hover-${PN}-${look}-dpr${dpr}.json`, JSON.stringify({ rows, log }, null, 1)); await b.close();
})();
