// hovertest.cjs [page]: with the real pointer on every wild's neighbour in view (start, Mid, Near on each wild), the colour-blind wild edge test on the frame as drawn
const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, process.env.PAGEFILE || PAGE, { log, settle: 1500 });
  const rect = await mev(p, '(() => { const r = canvas.getBoundingClientRect(); return [r.left, r.top]; })()'); let n = 0, bad = 0; const fails = [];
  const views = [['start', 'm.ev("fit(); draw()")'], ['mid', 'm.setScale(1.0, 640, 480)'], ...[0, 1, 2].map((k) => [`near${k}`, `(() => { const w = m.ev("WILDS")[${k}]; let x = 0, y = 0; for (const c of w.cells) { x += m.ev("cent")[c][0]; y += m.ev("cent")[c][1]; } m.setScale(m.maxScale() * 0.55, x / w.cells.length, y / w.cells.length); })()`])];
  for (const [v, cam] of views) { await mev(p, 'closeAll(); clearSel(); hoverProv = -1; RCK = null; draw()'); await p.mouse.move(rect[0] + 3, rect[1] + 3); await ev(p, cam); await p.waitForTimeout(900);
    const nbs = await mev(p, `(() => { const v = viewRect(), out = []; const set = new Set(); for (const w of WILDS) for (const e of rlWildOutline(w)) if (!isWild(e.j)) set.add(e.j); for (const j of set) { const [sx, sy] = toScreen(...cent[j]); if (sx > v.l + 20 && sx < v.r - 60 && sy > v.t + 20 && sy < v.b - 20 && provinceAt(...cent[j]) === j) out.push([j, names[j], sx, sy]); } return out; })()`);
    for (const [j, nm, sx, sy] of nbs) { await p.mouse.move(rect[0] + sx, rect[1] + sy); await p.waitForTimeout(700);
      const r = await mev(p, `(() => { const E = window.__mock.reliefWildEdge(); return { hov: hoverProv >= 0 ? names[hoverProv] : null, fails: E.fails, n: E.samples, ex: E.examples.slice(0, 2) }; })()`); n++;
      if (r.fails) { bad++; fails.push({ v, nm, ...r }); } }
    console.log(v, 'hovered', nbs.length); }
  console.log('hovers', n, 'with fails', bad, JSON.stringify(fails).slice(0, 1500)); console.log('pageErrors', log.pageErrors.length); await b.close(); })();
