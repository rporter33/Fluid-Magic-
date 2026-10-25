// the pass-3b shots: node finalshots.cjs <set> ; sets: views (1440x900 dpr1: start, Far, least, Mid, reference, Near and closest on each wild), focus (real pointer: hover and
// click on a wild and on a neighbour, a march previewed and planned across the Ashspine), looks (Clear and the Terrain mode at the start), sizes (phone at Fit, 1280x720, 1920x1080
// starts), all. Shots in ../shots/<nn>-<name>.png; page errors printed.
const { launch, open, ev, mev, PAGE, SHOTS } = require('./lib.cjs'); const fs = require('fs');
const set = process.argv[2] || 'all', D = SHOTS; fs.mkdirSync(D, { recursive: true });
const WI = JSON.parse(fs.readFileSync('/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/judge/out/wildinfo.json', 'utf8')); const C = Object.fromEntries(WI.wilds.map((w) => [w.id, w]));
const at = (k, id) => `m.setScale(m.maxScale() * ${k}, ${C[id].cx}, ${C[id].cy})`;
const VIEWS = [['01-start', 'm.ev("fit(); draw()")'], ['02-far60', 'm.setScale(60 / m.ev("MED_DIAM"), 800, 500)'], ['03-least', 'm.setScale(m.minScale(), 800, 500)'], ['04-mid', 'm.setScale(1.0, 640, 480)'], ['05-ref', 'm.setScale(1.142, 700, 560)'],
  ['06-near-ashspine', at(0.55, 'ashspine')], ['07-near-greyteeth', at(0.6, 'greyteeth')], ['08-near-stillmere', at(0.6, 'stillmere')], ['09-closest-ashspine', at(1.0, 'ashspine')], ['10-closest-greyteeth', at(1.0, 'greyteeth')], ['11-closest-stillmere', at(1.0, 'stillmere')],
  ['09b-closest-ashspine-west', `m.setScale(m.maxScale(), ${C.ashspine.cx - 140}, ${C.ashspine.cy})`], ['09c-closest-ashspine-east', `m.setScale(m.maxScale(), ${C.ashspine.cx + 150}, ${C.ashspine.cy})`], ['04b-mid-ashspine', `m.setScale(1.0, ${C.ashspine.cx}, ${C.ashspine.cy})`], ['04c-mid-greyteeth-mere', `m.setScale(1.0, ${(C.greyteeth.cx + C.stillmere.cx) / 2}, ${(C.greyteeth.cy + C.stillmere.cy) / 2})`]];
const info = (p) => ev(p, '({ Dpx: +(m.scale() * m.ev("MED_DIAM")).toFixed(1), src: m.ev("rlMsSource()"), focus: m.reliefWildFocus() })');
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  if (set === 'views' || set === 'all') { const p = await open(b, PAGE, { log, settle: 1500 }); await p.mouse.move(720, 896);
    for (const [nm, src] of VIEWS) { await ev(p, src); await p.waitForTimeout(2200); await p.screenshot({ path: `${D}${nm}.png` }); console.log(nm, JSON.stringify(await info(p))); } await p.context().close(); }
  if (set === 'focus' || set === 'all') { const p = await open(b, PAGE, { log, settle: 1500 }); const W = 1440, H = 900;
    const scr = async (wx, wy) => mev(p, `(() => { const c = canvas.getBoundingClientRect(), [sx, sy] = toScreen(${wx}, ${wy}); return [c.left + sx, c.top + sy]; })()`), cen = async (expr) => mev(p, `(() => { const i = ${expr}; return cent[i]; })()`);
    const shot = async (nm) => { await p.waitForTimeout(800); await p.screenshot({ path: `${D}${nm}.png` }); const f = await ev(p, 'm.reliefWildFocus()'); console.log(nm, 'focus static', f.static.length, 'live', f.live.length, 'sel', JSON.stringify(await mev(p, 'state.sel'))); };
    await ev(p, `m.setScale(1.0, ...m.ev("[cent[WILDS[0].cells[1]][0], cent[WILDS[0].cells[1]][1] + 30]"))`); await p.waitForTimeout(1500);
    await p.mouse.move(W / 2, H - 6); await ev(p, 'm.ev("clearSel()")'); await shot('12-focus-rest-mid');
    { const c = await cen('WILDS[0].cells[1]'); const [x, y] = await scr(...c); await p.mouse.move(x, y); await shot('13-hover-ashspine'); await p.mouse.click(x, y); await p.waitForTimeout(300); await shot('14-click-ashspine'); }
    { const c = await cen('names.indexOf("Halevale")'); const [x, y] = await scr(c[0], c[1] + 20); await p.mouse.move(x, y); await shot('15-hover-neighbour-halevale'); await p.mouse.click(x, y); await p.mouse.move(W / 2, H - 6); await shot('16-select-neighbour-halevale'); }
    await ev(p, 'm.ev("clearSel()")'); await ev(p, 'm.ev("selectCmd(\'varo\')")'); await p.waitForTimeout(800);
    { const t = await mev(p, 'acrossTarget'); if (t != null) { const c = await cen(String(t)); const [x, y] = await scr(c[0], c[1]); await p.mouse.move(x, y); await shot('17-preview-march-across-ashspine'); await p.mouse.click(x, y, { button: 'right' }); await p.mouse.move(W / 2, H - 6); await shot('18-planned-march-around-ashspine'); } }
    await ev(p, 'm.ev("fit(); draw()")'); await p.waitForTimeout(1200); { const t = await mev(p, 'acrossTarget'); const c = await cen(String(t)); const [x, y] = await scr(c[0], c[1]); await p.mouse.move(x, y); await shot('19-preview-at-start'); }
    await p.context().close(); }
  if (set === 'looks' || set === 'all') { for (const [nm, q, mode] of [['20-clear-start', '?terrain=clear', null], ['21-terrain-start', '', 'terrain']]) { const p = await open(b, PAGE, { log, settle: 1500, q }); await p.mouse.move(720, 896);
      if (mode) { await mev(p, `setMode('${mode}')`); await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 240000, polling: 300 }); await p.waitForTimeout(1500); }
      await p.screenshot({ path: `${D}${nm}.png` }); console.log(nm, JSON.stringify(await info(p))); await p.context().close(); } }
  if (set === 'sizes' || set === 'all') { for (const [nm, w, h, dpr, src] of [['22-phone-fit', 390, 844, 3, 'm.ev("fit(); draw()")'], ['23-1280x720-start', 1280, 720, 1, null], ['24-1920x1080-start', 1920, 1080, 1, null]]) { const p = await open(b, PAGE, { log, w, h, dpr, settle: 1500 }); await p.mouse.move(w / 2, h - 4);
      if (src) { await ev(p, src); await p.waitForTimeout(1500); } await p.screenshot({ path: `${D}${nm}.png` }); console.log(nm, JSON.stringify(await info(p))); await p.context().close(); } }
  console.log('pageErrors', log.pageErrors.length, JSON.stringify(log.pageErrors.slice(0, 4))); await b.close();
})();
