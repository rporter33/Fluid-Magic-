// one province hovered (real pointer) and then selected (real click) at given views; my line probe on each: node hov1.cjs <look> <name> <view,...>
const { launch, open, ev, mev, PAGE, OUT, SHOTS } = require('./lib.cjs'); const { LP } = require('./lp.cjs'); const fs = require('fs');
const look = process.argv[2] || 'natural', name = process.argv[3] || 'Ashmoor', views = (process.argv[4] || 'start,mid,near').split(','), dpr = Number(process.env.DPR || 1), W = 1440, H = 900;
const VIEWS = { start: 'm.ev("fit(); draw()")', far: 'm.setScale(m.minScale(), 800, 500)', mid: 'm.setScale(1.0, 640, 480)', ref: 'm.setScale(1.142, 700, 560)', near: 'm.setScale(m.maxScale() * 0.8, 700, 500)', midAt: `m.setScale(1.0, ...m.ev('cent[names.indexOf(${JSON.stringify(name)})]'))`, nearAt: `m.setScale(m.maxScale() * 0.8, ...m.ev('cent[names.indexOf(${JSON.stringify(name)})]'))` };
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, out = {};
  const p = await open(b, process.env.PAGEFILE || PAGE, { log, dpr, w: W, h: H, settle: 1500, q: look === 'clear' ? '?terrain=clear' : '' });
  const away = async () => { await p.mouse.move(W / 2, 30); await p.waitForTimeout(350); };
  await away(); await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  for (const v of views) {
    await ev(p, VIEWS[v]); await p.waitForTimeout(1500);
    const spot = await mev(p, `(() => { const i = names.indexOf(${JSON.stringify(name)}), r = canvas.getBoundingClientRect(), [cx, cy] = toScreen(...cent[i]); for (const [dx, dy] of [[0, 14], [0, -14], [14, 0], [-14, 0], [10, 20], [-10, 20], [0, 26], [20, 30], [-20, 30]]) { const x = cx + dx, y = cy + dy; const el = document.elementFromPoint(r.left + x, r.top + y); if (el && el.id === 'map' && provinceAt(...toWorld(x, y)) === i) return [r.left + x, r.top + y, i]; } return null; })()`);
    if (!spot) { console.log(v, 'no spot'); continue; }
    await p.mouse.move(spot[0], spot[1], { steps: 4 }); await p.waitForTimeout(700);
    const r = await mev(p, LP([spot[2]])); await p.screenshot({ path: `${SHOTS}hov1-${look}-${name}-${v}-hover.png` });
    console.log(look, v, r.band, r.Dpx, 'hover', r.hover, 'focusN', JSON.stringify(r.focusNeutral), 'focusI', JSON.stringify(r.focusInternal), 'under', JSON.stringify(r.focusUnder));
    for (const q of r.rows.filter((q) => q.touches)) console.log('   ', q.a + '/' + q.b, q.kind, q.fogBoth ? 'fog' : '', 'n', q.n, 'min', q.min, 'p10', q.p10, 'med', q.median, 'u23', q.under23);
    await p.mouse.click(spot[0], spot[1]); await p.waitForTimeout(500); await away();
    const s = await mev(p, LP([spot[2]])); console.log(look, v, 'select', s.sel, 'focusN', JSON.stringify([s.focusNeutral.minOfMins, s.focusNeutral.samplesUnderFloor, s.focusNeutral.samples]), 'focusI', JSON.stringify([s.focusInternal.minOfMins, s.focusInternal.samplesUnderFloor, s.focusInternal.samples]), 'under', JSON.stringify(s.focusUnder));
    await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); out[v] = { hover: r, select: s };
  }
  fs.writeFileSync(`${OUT}hov1-${look}-${name}.json`, JSON.stringify(out)); console.log('pageErrors', log.pageErrors.length); await b.close();
})();
