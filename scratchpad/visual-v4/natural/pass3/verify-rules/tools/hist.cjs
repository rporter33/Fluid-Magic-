// history independence: the same camera hashed (a) on a fresh load at once, (b) after the idle prefetch, (c) after a random session of zooms, pans, hovers, selections
// and month changes; node hist.cjs <natural|clear> <dpr>
const { launch, open, ev, mev, PAGE, OUT, HASH } = require('./lib.cjs'); const fs = require('fs');
const look = process.argv[2] || 'natural', dpr = Number(process.argv[3] || 1);
(async () => {
  const res = {}, V = [['start', 'm.ev("fit(); RCK = null; draw()")'], ['mid', 'm.setScale(1.0, 640, 480)'], ['wildNear', 'm.setScale(m.maxScale() * 0.55, ...m.ev("[cent[WILDS[0].cells[0]][0], cent[WILDS[0].cells[0]][1]]"))'], ['mid87', 'm.setScale(0.87, 1050, 380)'], ['min', 'm.setScale(m.minScale(), 800, 500)'], ['odd', 'm.setScale(0.6131, 1210, 330)']];
  const MAPHASH = `(() => { const was = new Set(SKIP); SKIP.clear(); for (const k of ['pieces', 'labels', 'badges', 'arrows']) SKIP.add(k); RCK = null; draw(); const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data; SKIP.clear(); for (const k of was) SKIP.add(k); RCK = null; draw(); let h = 0x811c9dc5; for (let k = 0; k < d.length; k++) { h ^= d[k]; h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16) + ' vr' + JSON.stringify(viewRect()); })()`;
  const restore = (p) => mev(p, "(() => { state.sel = null; hoverProv = -1; selectCmd('varo'); state.targeting = false; decoTo = decoAlpha = decoFrom = 1; return [state.sel && state.sel.id, document.getElementById('leftDock').hidden]; })()");
  const hashAll = async (p, tag) => { const o = {}; await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); await p.mouse.move(720, 897); const rs = await restore(p); for (const [v, src] of V) { await ev(p, src); await p.waitForTimeout(150); await restore(p); o[v] = await mev(p, MAPHASH); o['full_' + v] = await mev(p, HASH); } res[tag] = o; console.log(tag, JSON.stringify(rs), JSON.stringify(o)); };
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  { const p = await open(b, PAGE, { log, dpr, settle: 0, q: look === 'clear' ? '?terrain=clear' : '', reducedMotion: 'reduce' }); await p.mouse.move(720, 897); await hashAll(p, 'freshNoIdle'); await p.context().close(); }
  { const p = await open(b, PAGE, { log, dpr, settle: 6000, q: look === 'clear' ? '?terrain=clear' : '', reducedMotion: 'reduce' }); await p.mouse.move(720, 897); await hashAll(p, 'afterIdle');
    let sd = 991; const rnd = () => { sd = (Math.imul(sd, 48271) + 7) >>> 0; return sd / 4294967296; };
    for (let k = 0; k < 40; k++) { const s = 0.3066 * Math.pow(2.397 / 0.3066, rnd()); await ev(p, `m.setScale(${s}, ${100 + rnd() * 1400}, ${100 + rnd() * 800})`); await p.waitForTimeout(80);
      if (k % 3 === 0) { await p.mouse.move(100 + rnd() * 1200, 120 + rnd() * 700, { steps: 2 }); await p.waitForTimeout(120); }
      if (k % 7 === 0) { await p.mouse.click(150 + rnd() * 1100, 150 + rnd() * 600); await p.waitForTimeout(120); await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); }
      if (k % 13 === 0) { await ev(p, `m.setMonth(${[40, 70, 3][k % 3]})`); await p.waitForTimeout(150); } }
    await ev(p, 'm.setMonth(3)'); await p.mouse.move(720, 897); await p.waitForTimeout(400); await hashAll(p, 'afterSession'); await p.context().close(); }
  const same = Object.fromEntries(V.flatMap(([v]) => [[v, res.freshNoIdle[v] === res.afterIdle[v] && res.afterIdle[v] === res.afterSession[v]], ['full_' + v, res.freshNoIdle['full_' + v] === res.afterIdle['full_' + v] && res.afterIdle['full_' + v] === res.afterSession['full_' + v]]]));
  console.log('SAME', JSON.stringify(same), 'pageErrors', log.pageErrors.length); fs.writeFileSync(`${OUT}hist-${look}-dpr${dpr}.json`, JSON.stringify({ res, same, log }, null, 1)); await b.close();
})();
