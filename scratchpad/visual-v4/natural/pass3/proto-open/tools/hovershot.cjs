// the spill belongs to the neighbour: hover a spill point in Halevale (its tint covers the foothills) and a point just inside the Ashspine (the card), at the reference zoom
const { launch, open, ev, mev, PAGE, SHOTS } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, settle: 1500 });
  await ev(p, 'm.setScale(m.maxScale() * 0.55, 560, 230)'); await p.waitForTimeout(1500);
  const pt = (off) => mev(p, `(() => { const r = canvas.getBoundingClientRect(), w = WILDS.find((q) => q.id === 'ashspine'); let best = null; for (const e of rlWildOutline(w)) { if (names[e.j] !== 'Halevale') continue; const L = Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1]); if (!best || L > best.L) best = { e, L }; }
    const { e } = best, [ax, ay] = e.a, [bx, by] = e.b, L = best.L; let nx = -(by - ay) / L, ny = (bx - ax) / L; if (provinceAt((ax + bx) / 2 + nx * 3, (ay + by) / 2 + ny * 3) !== e.j) { nx = -nx; ny = -ny; } const [sx, sy] = toScreen((ax + bx) / 2 + nx * ${off} * RLD, (ay + by) / 2 + ny * ${off} * RLD); return [r.left + sx, r.top + sy]; })()`);
  for (const [nm, off, sel] of [['16-hover-spill-halevale', 0.07, false], ['17-hover-inside-ashspine-army', -0.07, true]]) {
    if (sel) await mev(p, "selectCmd('varo')"); const [x, y] = await pt(off); await p.mouse.move(720, 895); await p.waitForTimeout(200); await p.mouse.move(x, y, { steps: 5 }); await p.waitForTimeout(1400); await p.screenshot({ path: `${SHOTS}${nm}.png` }); console.log('shot', nm); }
  console.log('pageErrors', log.pageErrors.length); await b.close(); })();
