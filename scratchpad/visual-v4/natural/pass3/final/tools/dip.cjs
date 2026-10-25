// where a hovered province's line dips under the floor: node dip.cjs <name> <other> <view>  (Natural); prints the low samples and crops the frame there (lines on / off, 4x)
const { launch, open, ev, mev, PAGE, OUT, SHOTS } = require('./lib.cjs'); const fs = require('fs');
const name = process.argv[2] || 'Ashmoor', other = process.argv[3] || 'Elmwick', view = process.argv[4] || 'mid', look = process.env.LOOK || 'natural';
const VIEWS = { start: 'm.ev("fit(); draw()")', mid: 'm.setScale(1.0, 640, 480)', near: 'm.setScale(m.maxScale() * 0.8, 700, 500)', ref: 'm.setScale(1.142, 700, 560)' };
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, process.env.PAGEFILE || PAGE, { settle: 1500, log, q: look === 'clear' ? '?terrain=clear' : '' }); await p.mouse.move(720, 30); await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  await ev(p, VIEWS[view]); await p.waitForTimeout(1500);
  const spot = await mev(p, `(() => { const i = names.indexOf(${JSON.stringify(name)}), r = canvas.getBoundingClientRect(), [cx, cy] = toScreen(...cent[i]); for (const [dx, dy] of [[0, 14], [0, -14], [14, 0], [-14, 0], [10, 20]]) { const x = cx + dx, y = cy + dy; const el = document.elementFromPoint(r.left + x, r.top + y); if (el && el.id === 'map' && provinceAt(...toWorld(x, y)) === i) return [r.left + x, r.top + y, i]; } return null; })()`);
  await p.mouse.move(spot[0], spot[1], { steps: 4 }); await p.waitForTimeout(700);
  const r = await mev(p, String.raw`(() => { const i = names.indexOf(${JSON.stringify(name)}), j = names.indexOf(${JSON.stringify(other)});
    const redraw = (skip) => { const was = new Set(SKIP); for (const k of skip) SKIP.add(k); RCK = null; draw(); const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data.slice(); SKIP.clear(); for (const k of was) SKIP.add(k); RCK = null; draw(); return d; };
    const land = redraw(['rails', 'pieces', 'labels', 'badges', 'arrows']), lines = redraw(['pieces', 'labels', 'badges', 'arrows']), W2 = canvas.width;
    const f = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }, lum = (d, k) => 0.2126 * f(d[k]) + 0.7152 * f(d[k + 1]) + 0.0722 * f(d[k + 2]);
    const e = [...EDGE.values()].find((q) => (q.i === i && q.j === j) || (q.i === j && q.j === i)); const [ax, ay] = toScreen(...e.a), [bx, by] = toScreen(...e.b), Lg = Math.hypot(bx - ax, by - ay), nx = -(by - ay) / Lg, ny = (bx - ax) / Lg; const low = [];
    for (let s = 6; s <= Lg - 6; s++) { const sx = ax + ((bx - ax) * s) / Lg, sy = ay + ((by - ay) * s) / Lg; let best = 1, bo = 0; const prof = []; for (let o = -7; o <= 7; o += 0.5) { const X = Math.floor((sx + nx * o) * dpr), Y = Math.floor((sy + ny * o) * dpr), k = (Y * W2 + X) * 4; const x = lum(lines, k), y = lum(land, k); const c = (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); if (c > best) { best = c; bo = o; } prof.push(rgb2hex([lines[k], lines[k + 1], lines[k + 2]]) + '/' + rgb2hex([land[k], land[k + 1], land[k + 2]])); } if (best < 2.6) low.push({ s, of: Math.round(Lg), x: +sx.toFixed(1), y: +sy.toFixed(1), best: +best.toFixed(3), at: bo, prof: prof.filter((_, q) => q % 2 === 0).join(' ') }); }
    return { Lg, a: [ax, ay], b: [bx, by], low, segs: rlSegStyles(e, rlEdgeKind(e, bandOf(cam.s)), rlLineCtx()).segs.map((s) => [toScreen(s.x0, s.y0).map((q) => +q.toFixed(1)), toScreen(s.x1, s.y1).map((q) => +q.toFixed(1)), s.key, !!s.partner]) }; })()`);
  console.log(JSON.stringify({ Lg: r.Lg, a: r.a, b: r.b, segs: r.segs })); for (const q of r.low) console.log(JSON.stringify(q));
  if (r.low.length) { const q = r.low.reduce((a, c) => (c.best < a.best ? c : a)); const cr = await p.evaluate(() => { const r = document.getElementById('map').getBoundingClientRect(); return [r.left, r.top]; });
    await p.screenshot({ path: `${SHOTS}dip-${look}-${name}-${other}-${view}.png`, clip: { x: cr[0] + q.x - 40, y: cr[1] + q.y - 40, width: 80, height: 80 } }); }
  console.log('pageErrors', log.pageErrors.length); await b.close();
})();
