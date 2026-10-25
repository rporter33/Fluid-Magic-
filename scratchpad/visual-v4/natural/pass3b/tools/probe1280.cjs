const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const W = Number(process.argv[2] || 1280), H = Number(process.argv[3] || 720);
  const p = await open(b, process.env.PAGEFILE || PAGE, { log, w: W, h: H, settle: 1500 });
  const r = await mev(p, `(() => { const cr = canvas.getBoundingClientRect(), rb = document.getElementById('ribbon').getBoundingClientRect(), st = document.getElementById('strip'), sr = st.getBoundingClientRect(), v = viewRect();
    const grey = WILDS.find((w) => w.id === 'greyteeth'); let n = 0, hid = 0; for (const c of grey.cells) { const bb = bboxOf(cells[c]); for (let y = bb[1]; y <= bb[3]; y += 2) for (let x = bb[0]; x <= bb[2]; x += 2) { if (provinceAt(x, y) !== c) continue; n++; const [sx, sy] = toScreen(x, y); if (sy > v.b || sy < v.t || sx < v.l || sx > v.r) hid++; } }
    return { canvas: [cr.left, cr.top, cr.width, cr.height], ribbon: [rb.left - cr.left, rb.top - cr.top, rb.right - cr.left, rb.bottom - cr.top], strip: [sr.top - cr.top, sr.height, st.offsetHeight], view: v, s: cam.s, Dpx: cam.s * MED_DIAM, camY: cam.y, start: window.__mock.reliefStartClear(), greyHidden: +(hid / n).toFixed(3), fit: fitScale, startDpx: RL_P.startDpx, appClass: app.className };
  })()`);
  console.log(JSON.stringify(r, null, 1)); await b.close(); })();
