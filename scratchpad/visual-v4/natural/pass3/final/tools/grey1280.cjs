// how much of the Greyteeth lies below the view's foot (under the bottom panel) at the 1280x720 start view
const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  for (const [w, h] of [[1280, 720], [1440, 900]]) { const p = await open(b, PAGE, { log, w, h, settle: 1200 }); await p.mouse.move(w / 2, h - 4);
    const r = await mev(p, `(() => { const v = viewRect(); const w = WILDS.find((q) => q.id === 'greyteeth'); let n = 0, below = 0, y0 = 1e9, y1 = -1e9; const bb = [1e9, 1e9, -1e9, -1e9]; for (const c of w.cells) for (const pt of cells[c]) { const [x, y] = toScreen(...pt); bb[0] = Math.min(bb[0], x); bb[1] = Math.min(bb[1], y); bb[2] = Math.max(bb[2], x); bb[3] = Math.max(bb[3], y); }
      for (let y = bb[1]; y <= bb[3]; y += 2) for (let x = bb[0]; x <= bb[2]; x += 2) { const q = provinceAt(...toWorld(x, y)); if (q >= 0 && w.cells.includes(q)) { n++; if (y > v.b) below++; } }
      return { viewBottom: Math.round(v.b), greyTop: Math.round(bb[1]), greyBottom: Math.round(bb[3]), shareBelowViewFoot: +(below / n).toFixed(3) }; })()`);
    console.log(w + 'x' + h, JSON.stringify(r)); await p.context().close(); }
  console.log('pageErrors', log.pageErrors.length); await b.close(); })();
