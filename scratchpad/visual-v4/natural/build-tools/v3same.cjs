// Painted (v3) must render as before: the before-natural page and the new page, ?look=v3 and via the Map look switch, canvas hashes per view
const { launch, open, PAGE, BEFORE, SHOTS, realErrors } = require('./nlib.cjs');
const HASH = `(() => { const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data; let h = 0x811c9dc5; for (let k = 0; k < d.length; k++) { h ^= d[k]; h = Math.imul(h, 0x01000193); } return h >>> 0; })()`;
const views = [['start', ''], ['mid', 'm.zoomTo(1.0, "Ashfen")'], ['near', 'm.zoomTo(m.maxScale() * 0.9, "Kharnath")'], ['supply', 'm.ev("setMode(\'supply\')")'], ['month40', 'm.ev("setMode(\'ownership\')"); m.setMonth(40)']];
(async () => {
  const b = await launch(), errors = [], out = {};
  for (const [file, tag] of (process.env.SELF ? [[BEFORE, 'before'], [BEFORE, 'after']] : [[BEFORE, 'before'], [PAGE, 'after']])) for (const how of ['query', 'switch']) {
    const p = await open(b, file, { errors, q: how === 'query' ? '?look=v3' : '', settle: 2500, wait: how !== 'query', reducedMotion: 'reduce' });
    if (how === 'switch') { await p.evaluate(() => window.__mock.setView('look', 'v3')); await p.waitForTimeout(3000); }
    for (const [v, src] of views) {
      if (src) await p.evaluate((s) => { const m = window.__mock; return eval(s); }, src);
      await p.waitForTimeout(4000); await p.evaluate(() => window.__mock.ev('(CK = null, draw(), 0)')); await p.waitForTimeout(400);
      const h = await p.evaluate((s) => window.__mock.ev(s), HASH); (out[how + ':' + v] ??= {})[tag] = h;
      if (v === 'start' || v === 'near') await p.screenshot({ path: `${SHOTS}v3-${how}-${v}-${tag}.png` });
    }
    await p.context().close();
  }
  for (const [k, r] of Object.entries(out)) console.log(k, r.before === r.after ? 'SAME' : 'DIFF', r.before, r.after);
  console.log('errors', JSON.stringify(realErrors(errors)));
  await b.close();
})();
