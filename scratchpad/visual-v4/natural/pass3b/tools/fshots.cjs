// focus-state shots with the real pointer: node fshots.cjs <tag> [dpr] [w h]; ../shots/wip/<tag>-f-*.png
const { launch, open, ev, mev, PAGE, SHOTS } = require('./lib.cjs'); const fs = require('fs');
const tag = process.argv[2] || 'f', dpr = Number(process.argv[3] || 1), W = Number(process.argv[4] || 1440), H = Number(process.argv[5] || 900), D = SHOTS + (process.env.SUB || 'wip') + '/'; fs.mkdirSync(D, { recursive: true });
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, process.env.PAGEFILE || PAGE, { log, dpr, w: W, h: H, settle: 1500, q: process.env.Q || '' });
  const scr = async (wx, wy) => { const r = await mev(p, `(() => { const c = canvas.getBoundingClientRect(), [sx, sy] = toScreen(${wx}, ${wy}); return [c.left + sx, c.top + sy]; })()`); return r; };
  const cen = async (expr) => mev(p, `(() => { const i = ${expr}; return cent[i]; })()`);
  const shot = async (nm) => { await p.waitForTimeout(700); await p.screenshot({ path: `${D}${tag}-${nm}.png` }); const f = await ev(p, 'm.reliefWildFocus()'); console.log(nm, 'focus static', f.static.length, 'live', f.live.length); };
  await ev(p, `m.setScale(1.0, ...m.ev("[cent[WILDS[0].cells[1]][0], cent[WILDS[0].cells[1]][1] + 30]"))`); await p.waitForTimeout(1500);
  await p.mouse.move(W / 2, H - 6); await shot('mid-rest');
  { const c = await cen('WILDS[0].cells[1]'); const [x, y] = await scr(...c); await p.mouse.move(x, y); await shot('hover-wild'); }
  { const c = await cen('names.indexOf("Halevale")'); const [x, y] = await scr(c[0], c[1] + 20); await p.mouse.move(x, y); await shot('hover-halevale'); await p.mouse.click(x, y); await p.mouse.move(W / 2, H - 6); await shot('select-halevale'); }
  { const c = await cen('names.indexOf("Ashmoor")'); const [x, y] = await scr(c[0], c[1]); await p.mouse.move(x, y); await shot('hover-ashmoor-while-halevale-selected'); }
  await ev(p, 'm.ev("clearSel()")'); await ev(p, 'm.ev("selectCmd(\'varo\')")'); await p.waitForTimeout(800);
  { const t = await mev(p, 'acrossTarget'); if (t != null) { const c = await cen(String(t)); const [x, y] = await scr(c[0], c[1]); await p.mouse.move(x, y); await shot('preview-across'); await p.mouse.click(x, y, { button: 'right' }); await p.mouse.move(W / 2, H - 6); await shot('planned-across'); } }
  { const c = await cen('WILDS[0].cells[1]'); const [x, y] = await scr(...c); await p.mouse.move(x, y); await shot('preview-onto-wild'); await p.mouse.click(x, y, { button: 'right' }); await shot('refused-onto-wild'); }
  console.log('pageErrors', log.pageErrors.length, JSON.stringify(log.pageErrors.slice(0, 3))); await b.close();
})();
