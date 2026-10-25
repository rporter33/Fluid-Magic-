// DOM geometry and a start-view shot at a window size: node geo.cjs <w> <h> [q]
const { launch, open, ev, mev, PAGE, OUT, SHOTS } = require('./lib.cjs');
const W = Number(process.argv[2] || 1280), H = Number(process.argv[3] || 720), q = process.argv[4] || '';
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, process.env.PAGEFILE || PAGE, { log, w: W, h: H, settle: 1500, q }); await p.mouse.move(W / 2, H - 5);
  const g = await p.evaluate(() => { const r = (sel) => [...document.querySelectorAll(sel)].filter((e) => e.offsetParent).map((e) => { const q = e.getBoundingClientRect(); return [e.id || e.className.toString().slice(0, 24), Math.round(q.left), Math.round(q.top), Math.round(q.right), Math.round(q.bottom)]; });
    return { canvas: r('#map'), ribbon: r('#ribbon'), ribbonKids: r('#ribbon > *'), rail: r('#rail'), modes: r('#modes'), top: r('#top, .topbar, header'), leftDock: r('#leftDock'), rightDock: r('#rightDock'), strip: r('#strip') }; });
  console.log(JSON.stringify(g));
  const m = await mev(p, '({ v: viewRect(), vf: viewRect(true), s: cam.s, x: cam.x, y: cam.y, fit: fitScale, min: minScale, start: startScale(), MB: MODEL_BOX.map((q, j) => Math.round(j % 2 ? q * cam.s + cam.y : q * cam.s + cam.x)), cap: toScreen(...cent[redCap]).map(Math.round), wilds: WILDS.map((w) => [w.name, ...(() => { let b = [1e9, 1e9, -1e9, -1e9]; for (const c of w.cells) for (const [x, y] of cells[c]) { const [sx, sy] = toScreen(x, y); b = [Math.min(b[0], sx), Math.min(b[1], sy), Math.max(b[2], sx), Math.max(b[3], sy)]; } return b.map(Math.round); })()]) })');
  console.log(JSON.stringify(m));
  await p.screenshot({ path: `${SHOTS}geo-${W}x${H}${q.replace(/[^a-z0-9]/gi, '')}.png` }); console.log('pageErrors', log.pageErrors.length); await b.close(); })();
