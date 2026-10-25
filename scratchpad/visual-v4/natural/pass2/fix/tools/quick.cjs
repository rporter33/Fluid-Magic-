// quick probe for the fix pass: node quick.cjs [steps...]; prints JSON lines; shots to fix/out/q-*.png
const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const fs = require('fs');
const PR = fs.readFileSync(__dirname + '/ad-adprobe.js', 'utf8');
const want = new Set(process.argv.slice(2));
const set = (expr) => `m.ev(${JSON.stringify(expr + '; clampCam(); RCK = null; draw()')})`;
const atWild = (kind, s) => set(`const w = WILDS.find(q => q.kind === '${kind}'); const c = wgeo(w).labelAt; const v = viewRect(); cam.s = ${s}; cam.x = (v.l+v.r)/2 - cent[c][0]*cam.s; cam.y = (v.t+v.b)/2 - cent[c][1]*cam.s`);
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, settle: 1200, q: process.env.Q || '' });
  await mev(p, PR); await p.mouse.move(720, 894); const out = {};
  const put = (k, v) => { out[k] = v; console.log(k, JSON.stringify(v)); };
  if (want.has('look')) put('wildLook', await ev(p, 'm.reliefWildLook()'));
  const views = [['start', null], ['ref', 'm.zoomTo(1.142, "Ashmoor")'], ['min', 'm.setScale(m.minScale(), 800, 500)'], ['mid', 'm.setScale(1.0, 640, 480)'], ['ash', atWild('peaks', 1.142)], ['ashMax', atWild('peaks', 'maxScale')], ['mereMax', atWild('mere', 'maxScale')], ['mere', atWild('mere', 1.142)], ['near', 'm.setScale(m.maxScale() * 0.8, 600, 300)']];
  for (const [v, src] of views) {
    if (!want.has(v) && !want.has('all')) continue;
    if (src) await ev(p, src); else await ev(p, 'm.ev("fit(); draw()")'); await p.waitForTimeout(900);
    const r = { Dpx: await ev(p, '+(m.scale()*m.ev("MED_DIAM")).toFixed(1)') };
    if (want.has('edge')) { const e = await ev(p, 'm.reliefWildEdge()'); r.edge = { n: e.samples, fails: e.fails, direct: e.passDirect, ex: e.examples.slice(0, 3) }; r.rim = e.rim; }
    if (want.has('hf')) r.hf = await p.evaluate(() => window.__ad.hfCores());
    if (want.has('sharp')) r.sharp = await p.evaluate(() => window.__ad.wildSharp());
    if (want.has('readers') && (v === 'min' || v === 'mid' || v === 'start')) { const R = await ev(p, 'm.reliefNatural(true).readers'); r.readers = { pass: R.pass, patch: R.normal.lightness.patchAcc, prov: R.normal.lightness.provinceAcc, unexPatch: R.normal.unexplored.patchAcc, unexProv: R.normal.unexplored.provinceAcc, missed: R.normal.lightness.missed.concat(R.normal.unexplored.missed) }; }
    if (want.has('steps') && v === 'min') { r.steps = await p.evaluate(() => window.__ad.edgeSteps()); r.stepsNo = await p.evaluate(() => window.__ad.edgeSteps([...window.__ad.landSkip, 'farRelief'])); }
    if (want.has('shot')) await p.screenshot({ path: `${OUT}q-${v}.png` });
    put(v, r);
  }
  console.log('pageErrors', log.pageErrors.length, JSON.stringify(log.pageErrors.slice(0, 3))); await b.close();
})();
