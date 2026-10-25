// line pass shots: node lshots.cjs <label> [dpr]  (PAGEFILE for another page) -> shots/<label>/*.png, crops around the focused province (real pointer hover, real click)
const { launch, open, ev, mev, PAGE, SHOTS } = require('./lib.cjs'); const fs = require('fs');
const label = process.argv[2] || 'now', dpr = Number(process.argv[3] || 1), dir = `${SHOTS}${label}/`; fs.mkdirSync(dir, { recursive: true });
const S = (s, x, y) => `m.setScale(${s}, ${x}, ${y})`, NEAR = (x, y) => `m.setScale(m.maxScale() * 0.8, ${x}, ${y})`;
// [shot, look, mode, how, province, camera]
const SHOTS_ = [
  ['c1-clear-mid-hover-ashmoor', 'clear', 'ownership', 'hover', 'Ashmoor', S(1.0, 640, 480)], ['c2-clear-mid-select-ashmoor', 'clear', 'ownership', 'select', 'Ashmoor', S(1.0, 640, 480)],
  ['c3-clear-mid-hover-halebrook', 'clear', 'ownership', 'hover', 'Halebrook', S(1.0, 640, 480)], ['c4-clear-start-hover-fenvale', 'clear', 'ownership', 'hover', 'Fenvale', null],
  ['c5-clear-start-select-gallreach', 'clear', 'ownership', 'select', 'Gallreach', null],
  ['t1-terrain-mid-hover-ashmoor', 'natural', 'terrain', 'hover', 'Ashmoor', S(1.0, 640, 480)], ['t2-terrain-mid-select-ashmoor', 'natural', 'terrain', 'select', 'Ashmoor', S(1.0, 640, 480)],
  ['t3-terrain-near-deepmoss', 'natural', 'terrain', 'rest', 'Deepmoss', NEAR(1180, 300)],
  ['n1-natural-mid-hover-ashmoor', 'natural', 'ownership', 'hover', 'Ashmoor', S(1.0, 640, 480)], ['n2-natural-mid-select-ashmoor', 'natural', 'ownership', 'select', 'Ashmoor', S(1.0, 640, 480)],
  ['n3-natural-near-hover-stagmoor', 'natural', 'ownership', 'hover', 'Stagmoor', NEAR(700, 500)], ['n4-natural-start-rest', 'natural', 'ownership', 'rest', null, null],
  ['d1-springs-near-deepmoss', 'natural', 'springs', 'rest', 'Deepmoss', NEAR(1180, 300)], ['d2-dominion-start-hover-ashmoor', 'natural', 'dominion', 'hover', 'Ashmoor', null],
];
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; let p = null, cur = null;
  const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
  for (const [shot, look, mode, how, name, cam] of SHOTS_) { if (ONLY && !ONLY.includes(shot)) continue;
    if (cur !== look) { if (p) await p.context().close(); p = await open(b, process.env.PAGEFILE || PAGE, { log, dpr, settle: 1500, q: look === 'clear' ? '?terrain=clear' : '' }); cur = look; }
    const rect = await mev(p, '(() => { const r = canvas.getBoundingClientRect(); return [r.left, r.top]; })()');
    await mev(p, 'closeAll(); clearSel(); hoverProv = -1; RCK = null; draw()'); await p.mouse.move(rect[0] + 5, rect[1] + 5);
    await mev(p, `setMode('${mode}')`); if (mode === 'terrain') await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 240000, polling: 300 });
    await ev(p, cam ?? 'm.ev("fit(); draw()")'); await p.waitForTimeout(1400);
    let box = [0, 0, 1440, 900];
    if (name) {
      const at = await mev(p, `(() => { const i = names.indexOf(${JSON.stringify(name)}), b = geo(i).bb, [x0, y0] = toScreen(b[0], b[1]), [x1, y1] = toScreen(b[2], b[3]), r = canvas.getBoundingClientRect(), [cx, cy] = toScreen(...cent[i]);
        for (const [dx, dy] of [[0, 14], [0, -14], [14, 0], [-14, 0], [10, 20], [-10, 20], [0, 26]]) { const x = cx + dx, y = cy + dy, el = document.elementFromPoint(r.left + x, r.top + y); if (el && el.id === 'map' && provinceAt(...toWorld(x, y)) === i) return [x, y, x0, y0, x1, y1]; } return [cx, cy, x0, y0, x1, y1]; })()`);
      const x = rect[0] + at[0], y = rect[1] + at[1];
      if (how === 'select') { await p.mouse.click(x, y); await p.mouse.move(rect[0] + 5, rect[1] + 5); await p.waitForTimeout(1500); } else if (how === 'hover') { await p.mouse.move(x, y, { steps: 3 }); await p.waitForTimeout(1200); }
      const m = 24; box = [Math.max(0, at[2] - m), Math.max(84, at[3] - m), Math.min(1440, at[4] + m), Math.min(900, at[5] + m)].map(Math.round);
    }
    await p.screenshot({ path: `${dir}${shot}-full.png` });
    await p.screenshot({ path: `${dir}${shot}.png`, clip: { x: rect[0] + box[0], y: rect[1] + box[1], width: box[2] - box[0], height: box[3] - box[1] } });
    console.log('shot', shot, JSON.stringify(box), JSON.stringify(await mev(p, '({ hover: hoverProv >= 0 ? names[hoverProv] : null, sel: state.sel && state.sel.type === "prov" ? names[state.sel.id] : null, mode: state.mode, look: rlShownLook() })')));
  }
  console.log('pageErrors', log.pageErrors.length, JSON.stringify(log.pageErrors.slice(0, 3))); await b.close();
})();
