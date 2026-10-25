// Painted (v3) against the original page, step by step (map canvas hash after a forced full redraw), then the v3 checks compared as JSON.
// node v3same.cjs <mode: q|switch|orig> <w> <h> [rm 0|1] [wait ms]
const { launch, open, PAGE, ORIG, HASH } = require('./vlib.cjs'); const fs = require('fs');
const [mode = 'q', w = 1440, h = 900, rm = '1', wait = '1500'] = process.argv.slice(2);
const ctl = (k, v) => `document.querySelector('#mockctl [data-ctl="${k}"] [data-v="${v}"]').click()`;
const steps = [['start', null], ['m40', 'setMonth(40)'], ['m70', 'setMonth(70)'], ['m3', 'setMonth(3)']];
for (const m of ['dominion', 'supply', 'unrest', 'population', 'springs', 'ownership']) steps.push(['mode-' + m, `document.querySelector('.modebtn[data-m="${m}"]').click()`]);
steps.push(['mid', `(() => { const i = prov.findIndex((p) => p.cap); const v = viewRect(); cam.s = 1.0; cam.x = (v.l + v.r) / 2 - cent[i][0] * cam.s; cam.y = (v.t + v.b) / 2 - cent[i][1] * cam.s; clampCam(); })()`]);
steps.push(['near', `(() => { const i = prov.findIndex((p) => p.cap); const v = viewRect(); cam.s = maxScale * 0.9; cam.x = (v.l + v.r) / 2 - cent[i][0] * cam.s; cam.y = (v.t + v.b) / 2 - cent[i][1] * cam.s; clampCam(); })()`]);
steps.push(['near-supply', `document.querySelector('.modebtn[data-m="supply"]').click()`], ['near-own', `document.querySelector('.modebtn[data-m="ownership"]').click()`]);
steps.push(['far', `(() => { cam.s = minScale; const v = viewRect(); cam.x = (v.l + v.r) / 2 - W / 2 * cam.s; cam.y = (v.t + v.b) / 2 - H / 2 * cam.s; clampCam(); })()`]);
steps.push(['fit', 'fitToCloth()']);
steps.push(['hoverSel', `hoverProv = names.indexOf('Tormere'); state.sel = { type: 'prov', id: names.indexOf('Ashfen') }`]);
steps.push(['clear', 'hoverProv = -1; state.sel = null']);
steps.push(['selVaro', `selectCmd('varo')`]);
steps.push(['path', `(() => { const i = names.indexOf(acrossTarget != null ? names[acrossTarget] : 'Tormere'); const [x, y] = toScreen(...cent[i]); const r = canvas.getBoundingClientRect(); orderMove(r.left + x, r.top + y); })()`]);
steps.push(['clear2', 'clearSel()']);
for (const [k, vals, back] of [['table', ['simple', 'off'], 'full'], ['detail', ['reduced'], 'full'], ['chrome', ['warm'], 'approved'], ['parch', ['on'], 'off'], ['hand', ['v2'], 'painted'], ['labels', ['approved'], 'ink'], ['borders', ['straight'], 'wobble'], ['bandCap', ['v2'], 'capped'], ['tracks', ['crossings'], 'full'], ['farm', ['deep'], 'approved'], ['palette', ['painted'], 'bright']]) {
  for (const v of vals) steps.push([`${k}=${v}`, ctl(k, v)]); steps.push([`${k}=${back}`, ctl(k, back)]);
}
steps.push(['palette-painted-mid', ctl('palette', 'painted') + `; (() => { const i = prov.findIndex((p) => p.cap); const v = viewRect(); cam.s = 1.0; cam.x = (v.l + v.r) / 2 - cent[i][0] * cam.s; cam.y = (v.t + v.b) / 2 - cent[i][1] * cam.s; clampCam(); })()`]);
steps.push(['palette-bright-fit', ctl('palette', 'bright') + '; fitToCloth()']);
steps.push(['m55', 'setMonth(55)'], ['m3b', 'setMonth(3)']);
(async () => {
  const b = await launch(), e1 = [], e2 = [], r1 = [], r2 = [];
  const opts = { w: +w, h: +h, v3: true, settle: 2500, reducedMotion: rm === '1' ? 'reduce' : undefined };
  const A = await open(b, ORIG, { ...opts, errors: e1, reqs: r1 });
  let B;
  if (mode === 'orig') B = await open(b, ORIG, { ...opts, errors: e2, reqs: r2 });
  else if (mode === 'q') B = await open(b, PAGE, { ...opts, q: '?look=v3', errors: e2, reqs: r2 });
  else { B = await open(b, PAGE, { ...opts, v3: false, errors: e2, reqs: r2 }); await B.evaluate(() => document.querySelector('#mockctl [data-ctl="look"] [data-v="v3"]').click()); await B.waitForTimeout(3000); }
  if (rm === '1') for (const P of [A, B]) await P.evaluate(() => window.__mock.ev('view.reduced = true; ANIM.clear(); draw()'));
  const rows = []; let diffs = 0;
  const shotDiff = async (name) => { const [a, bb] = [await A.screenshot(), await B.screenshot()]; if (!a.equals(bb)) { fs.writeFileSync(`${__dirname}/out/sd2-${mode}-${w}x${h}-${name}-orig.png`, a); fs.writeFileSync(`${__dirname}/out/sd2-${mode}-${w}x${h}-${name}-v4.png`, bb); } return a.equals(bb); };
  for (const [name, src] of steps) {
    const r = [];
    for (const P of [A, B]) {
      if (src) await P.evaluate((s) => window.__mock.ev(s), src);
      await P.waitForTimeout(+wait); let pend = true, it = 0; for (; it < 120 && pend; it++) { pend = await P.evaluate(() => window.__mock.ev('CK = null; draw(); !!(CK && CK.pending)')); if (pend) await P.waitForTimeout(60); } P.__it = Math.max(P.__it || 0, it);
      r.push(await P.evaluate((H) => ({ h: window.__mock.ev(H), s: +window.__mock.scale().toFixed(4), cw: window.__mock.ev('canvas.width + "x" + canvas.height') }), HASH));
    }
    let same = r[0].h === r[1].h, late = null;
    if (!same) { await Promise.all([A, B].map((P) => P.waitForTimeout(4000))); const hh = []; for (const P of [A, B]) { for (let it = 0; it < 120; it++) { const pend = await P.evaluate(() => window.__mock.ev('CK = null; draw(); !!(CK && CK.pending)')); if (!pend) break; await P.waitForTimeout(60); } hh.push(await P.evaluate((H) => window.__mock.ev(H), HASH)); } late = { a: hh[0], b: hh[1], same: hh[0] === hh[1] };
      if (!late.same) { let n = 0; for (const P of [A, B]) { const url = await P.evaluate(() => window.__mock.ev('canvas.toDataURL()')); fs.writeFileSync(`${__dirname}/out/v3diff-${mode}-${w}x${h}-${name}-${n++ ? 'v4' : 'orig'}.png`, Buffer.from(url.split(',')[1], 'base64')); } } }
    if (!same && !(late && late.same)) diffs++;
    const shot = ['start', 'near', 'fit', 'path', 'table=off', 'palette-painted-mid'].includes(name) ? await shotDiff(name) : null;
    rows.push({ name, same, late, shotSame: shot, a: r[0], b: r[1] });
  }
  const strip = () => { const out = {}; for (const k of ['checks', 'density', 'paintcheck', 'trackcheck', 'silhouettes', 'feats', 'info']) { try { const v = window.__mock[k](); if (v && typeof v === 'object') { delete v.bakes; delete v.ms; if (k === 'density') delete v.bake; if (k === 'feats') delete v.init; } out[k] = JSON.stringify(v); } catch (e) { out[k] = 'ERR ' + e.message; } } return out; };
  const c1 = await A.evaluate(strip), c2 = await B.evaluate(strip), cmp = {};
  for (const k of Object.keys(c1)) cmp[k] = c1[k] === c2[k] ? 'equal' : 'DIFF ' + c1[k].slice(0, 200) + ' || ' + c2[k].slice(0, 200);
  const full = {}; for (const k of Object.keys(c1)) if (c1[k] !== c2[k]) full[k] = [c1[k], c2[k]];
  const res = { full, mode, w, h, rm, wait, steps: rows.length, diffs, rows, checks: cmp, checksOrig: c1, errorsA: e1.filter((x) => !/software WebGL|willReadFrequently/.test(x)), errorsB: e2.filter((x) => !/software WebGL|willReadFrequently/.test(x)), failedReq: [...r1, ...r2].filter((x) => / failed /.test(x)) };
  fs.writeFileSync(`${__dirname}/out/v3same2-${mode}-${w}x${h}-rm${rm}.json`, JSON.stringify(res, null, 1));
  console.log('maxSettleIters', A.__it, B.__it); console.log(mode, w, h, 'rm', rm, 'steps', rows.length, 'diffs', diffs, rows.filter((r) => !r.same).map((r) => r.name + (r.late ? (r.late.same ? '(same after 4s)' : '(STILL DIFF)') : '')).join(','), '| shots', rows.filter((r) => r.shotSame !== null).map((r) => r.name + ':' + r.shotSame).join(' '), '| checks', JSON.stringify(Object.fromEntries(Object.entries(cmp).map(([k, v]) => [k, v.slice(0, 5)]))), '| errors', res.errorsA.length, res.errorsB.length, res.errorsA.concat(res.errorsB).slice(0, 3));
  await b.close();
})();
