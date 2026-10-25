// shots of the natural view: node shoot.cjs <set> ; each view is [name, {w,h,q,dpr}, script run in the page with m = window.__mock]
const { launch, open, PAGE, SHOTS, realErrors } = require('./nlib.cjs'); const fs = require('fs');
const C = (n) => `m.ev("cent[names.indexOf('${n}')]")`;
const SETS = {
  core: [
    ['start', {}, ''],
    ['far', {}, 'm.setScale(0.3, 800, 520)'],
    ['mid', {}, 'm.setScale(1.0, 640, 480)'],
    ['near-west', {}, 'm.setScale(m.maxScale() * 0.9, 300, 470)'],
    ['near-centre', {}, 'm.setScale(m.maxScale() * 0.9, 800, 560)'],
    ['near-east', {}, 'm.setScale(m.maxScale() * 0.9, 1250, 420)'],
  ],
  look: [
    ['look-start', {}, ''], ['look-far', {}, 'm.setScale(0.36, 800, 520)'], ['look-mid', {}, 'm.setScale(0.62, 760, 520)'], ['look-ref200a', {}, 'm.setScale(1.142, 700, 560)'], ['look-ref200b', {}, 'm.setScale(1.142, 1180, 420)'], ['look-near', {}, 'm.setScale(2.4, 820, 420)'], ['look-fog', {}, 'm.setScale(0.9, 1350, 450)'],
  ],
  regions: [
    ['near-south', {}, 'm.setScale(m.maxScale() * 0.9, 560, 860)'],
    ['near-north', {}, 'm.setScale(m.maxScale() * 0.9, 900, 160)'],
    ['near-wild-ashspine', {}, 'm.setScale(m.maxScale() * 0.75, 560, 260)'],
    ['mid-fog-frontier', {}, 'm.setScale(1.0, 1250, 500)'],
    ['mid-south', {}, 'm.setScale(1.0, 800, 820)'],
  ],
};
(async () => {
  const set = process.argv[2] || 'core', b = await launch(), errors = [], pre = process.argv[3] || '', tagp = process.argv[4] || '';
  const groups = {}; for (const v of SETS[set]) { const k = JSON.stringify(v[1]); (groups[k] ??= []).push(v); }
  for (const [k, views] of Object.entries(groups)) {
    const o = JSON.parse(k), p = await open(b, PAGE, { errors, q: (o.q ?? '') + (process.env.Q || ''), w: o.w ?? 1440, h: o.h ?? 900, dpr: o.dpr ?? 1, settle: 1500, reducedMotion: process.env.RM ? 'reduce' : undefined });
    if (pre) { await p.evaluate((s) => { const m = window.__mock; return eval(s); }, pre); await p.waitForTimeout(600); }
    for (const [name, , src] of views) {
      if (src) { await p.evaluate((s) => { const m = window.__mock; return eval(s); }, src); }
      await p.waitForTimeout(900);
      await p.screenshot({ path: SHOTS + tagp + name + '.png' }); console.log('shot', tagp + name);
    }
    await p.context().close();
  }
  console.log('errors', JSON.stringify(realErrors(errors)));
  await b.close();
})();
