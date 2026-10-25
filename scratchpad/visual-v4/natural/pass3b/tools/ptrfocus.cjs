// the wild edge with the REAL pointer: node ptrfocus.cjs <dpr> [w h] ; at the start view and at Mid on each wild, the pointer on every wild in view and on every wild
// neighbour in view (hover), then a click on each neighbour (selection, pointer moved away), and with Varo selected the pointer on each neighbour (a previewed march);
// after each, the page's colour-blind wild-edge test on the edges drawn (m.reliefWildEdge samples the focus-state edges) -> ../out/ptrfocus-dpr<d>-<w>x<h>.json
const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const fs = require('fs');
const dpr = Number(process.argv[2] || 1), W = Number(process.argv[3] || 1440), H = Number(process.argv[4] || 900);
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, dpr, w: W, h: H, settle: 1500 }); const rows = []; let tot = 0, fails = 0, empty = 0, minR = Infinity, worst = null;
  const away = async () => { await p.mouse.move(W / 2, H - 4); await p.waitForTimeout(150); };
  const scr = (i) => mev(p, `(() => { const c = canvas.getBoundingClientRect(), v = viewRect(), [x, y] = cent[${i}], [sx, sy] = toScreen(x, y); return sx > v.l + 30 && sx < v.r - 30 && sy > v.t + 30 && sy < v.b - 30 ? [c.left + sx, c.top + sy] : null; })()`);
  const test = async (label) => { await p.waitForTimeout(350); const r = await ev(p, `(() => { const E = m.reliefWildEdge(), M = m.reliefWildMargins(); return { samples: E.samples, fails: E.fails, mSamples: M.samples, mFails: M.fails, min: M.min ? +M.min.r.toFixed(3) : null, at: M.min ? M.min.at : null }; })()`); r.label = label;
    if (!r.samples) empty++; tot += r.samples || 0; fails += (r.fails || 0) + (r.mFails || 0); if (r.min != null && r.min < minR) { minR = r.min; worst = label + ' / ' + r.at; } rows.push(r); if (r.fails || r.mFails) console.log('FAIL', JSON.stringify(r)); };
  const views = [['start', 'm.ev("fit(); draw()")'], ...[0, 1, 2].map((k) => [`mid w${k}`, `m.setScale(1.0, ...m.ev("(() => { const w = WILDS[${k}]; let x = 0, y = 0; for (const c of w.cells) { x += cent[c][0]; y += cent[c][1]; } return [x / w.cells.length, y / w.cells.length]; })()"))`])];
  for (const [vn, src] of views) { await away(); await ev(p, 'm.ev("clearSel()")'); await ev(p, src); await p.waitForTimeout(1500);
    const nb = await mev(p, '[...new Set(WILDS.flatMap((w) => rlWildOutline(w).map((e) => e.j)))].filter((j) => j >= 0 && !isWild(j))'), wl = await mev(p, 'WILDS.map((w) => w.cells[0])');
    for (const i of wl) { const at = await scr(i); if (!at) continue; await p.mouse.move(...at); await test(`${vn} / pointer on wild ${i}`); }
    for (const i of nb) { const at = await scr(i); if (!at) continue; await p.mouse.move(...at); await test(`${vn} / hover ${i}`); await p.mouse.click(...at); await away(); await test(`${vn} / select ${i}`); }
    await ev(p, 'm.ev("clearSel()")'); await ev(p, 'm.ev("selectCmd(\'varo\')")'); await p.waitForTimeout(300);
    for (const i of nb) { const at = await scr(i); if (!at) continue; await p.mouse.move(...at); await test(`${vn} / varo, preview to ${i}`); } }
  const out = { dpr, W, H, tests: rows.length, emptyTests: empty, samples: tot, fails, minRatio: minR === Infinity ? null : +minR.toFixed(3), worst, pageErrors: log.pageErrors.length, rows };
  console.log('SUMMARY', JSON.stringify({ ...out, rows: undefined })); fs.writeFileSync(`${OUT}ptrfocus-dpr${dpr}-${W}x${H}.json`, JSON.stringify(out, null, 1)); await b.close(); })();
