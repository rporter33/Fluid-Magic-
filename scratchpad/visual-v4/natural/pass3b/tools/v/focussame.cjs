// Clear and the Terrain mode in focus states, this page against the pass-3 final page: node focussame.cjs <clear|terrain> [dpr]
// states (set in the page, no pointer): rest, the Ashspine hovered, Halevale hovered, Halevale selected, Varo selected with a march previewed across the Ashspine, a planned march;
// views: start, Mid on the Ashspine, Near on the Greyteeth; frame hashes
const { launch, open, ev, mev, PAGE, BEFORE, OUT } = require('./lib.cjs'); const fs = require('fs');
const look = process.argv[2] || 'clear', dpr = Number(process.argv[3] || 1);
const STATES = [['rest', 'hoverProv = -1; state.sel = null; moveLine = null;'], ['hover Ashspine', 'hoverProv = WILDS[0].cells[0]; state.sel = null; moveLine = null;'], ['hover Halevale', 'hoverProv = names.indexOf("Halevale"); state.sel = null; moveLine = null;'],
  ['select Halevale', 'hoverProv = -1; state.sel = { type: "prov", id: names.indexOf("Halevale") }; moveLine = null;'], ['preview across', 'state.sel = { type: "cmd", id: "varo" }; moveLine = null; hoverProv = acrossTarget;'],
  ['planned', '(() => { hoverProv = -1; state.sel = { type: "cmd", id: "varo" }; const d = pathTo(cmd.varo.at, acrossTarget); moveLine = d ? { from: cmd.varo.at, path: d.path, days: d.days, around: "the Ashspine" } : null; })();']];
(async () => {
  const b = await launch(), res = {};
  for (const [nm, file] of [['now', PAGE], ['before', BEFORE]]) { const log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, file, { log, dpr, settle: 1500, q: look === 'clear' ? '?terrain=clear' : '' }); await p.mouse.move(720, 896);
    if (look === 'terrain') { await mev(p, "setMode('terrain')"); await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 240000, polling: 300 }); await p.waitForTimeout(1500); }
    const geo = await mev(p, 'WILDS.map((w) => { let x = 0, y = 0; for (const c of w.cells) { x += cent[c][0]; y += cent[c][1]; } return [x / w.cells.length, y / w.cells.length]; })'); res[nm] = {};
    for (const [vn, src] of [['start', 'm.ev("fit(); draw()")'], ['midAsh', `m.setScale(1.0, ${geo[0][0]}, ${geo[0][1]})`], ['nearGrey', `m.setScale(m.maxScale() * 0.6, ${geo[2][0]}, ${geo[2][1]})`]]) { await ev(p, src); await p.waitForTimeout(1500);
      for (const [sn, set] of STATES) { const r = await mev(p, `(() => { const keep = { h: hoverProv, s: state.sel, m: moveLine }; try { ${set} RCK = null; draw(); const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data; let h = 0x811c9dc5; for (let k = 0; k < d.length; k++) { h ^= d[k]; h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16); } finally { hoverProv = keep.h; state.sel = keep.s; moveLine = keep.m; RCK = null; draw(); } })()`);
        res[nm][vn + ' | ' + sn] = r; } }
    res[nm].pageErrors = log.pageErrors.length; await p.context().close(); }
  const keys = Object.keys(res.now).filter((k) => k !== 'pageErrors'), same = keys.filter((k) => res.now[k] === res.before[k]);
  console.log(look, 'dpr' + dpr, 'identical', same.length + '/' + keys.length, 'differ', JSON.stringify(keys.filter((k) => res.now[k] !== res.before[k])), 'pageErrors', res.now.pageErrors, res.before.pageErrors);
  fs.writeFileSync(`${OUT}focussame-${look}-dpr${dpr}.json`, JSON.stringify({ res, same: same.length, total: keys.length }, null, 1)); await b.close();
})();
