// runtime re-bakes of the natural look (private browser): mountain/hill relief caps and a low-passed mountain hillshade; readers re-run
const { launch, open, PAGE, realErrors } = require('../../build-tools/nlib.cjs');
const fs = require('fs');
const OUT = __dirname + '/../shots/';
const ev = (p, s) => p.evaluate((s) => { const m = window.__mock; return eval(s); }, s);
const mev = (p, src) => ev(p, 'm.ev(' + JSON.stringify(src) + ')');
(async () => {
  const b = await launch(), errors = [];
  const p = await open(b, PAGE, { errors, settle: 1200, reducedMotion: 'reduce' });
  await p.mouse.move(700, 880);
  await mev(p, `window.__ng0 = rlNaturalGen; window.__cap0 = RL_NAT.cap.slice(); SKIP.add('labels'); SKIP.add('pieces'); SKIP.add('rails'); rlHamlet = function () {}; 'ok'`);
  const lp = `rlNaturalGen = eval('(' + __ng0.toString()
    .replace('const { cls, ftone, fhedge, fph, wc8 } = out.nat,', 'const fSb = rlBoxBlur(fS, HW, HH, 2, 2), { cls, ftone, fhedge, fph, wc8 } = out.nat,')
    .replace('const fsV = fS[a00] * w00 + fS[a01] * w01 + fS[a10] * w10 + fS[a11] * w11,', 'const fsV0 = fS[a00] * w00 + fS[a01] * w01 + fS[a10] * w10 + fS[a11] * w11, fsV = fsV0 + (fSb[a00] * w00 + fSb[a01] * w01 + fSb[a10] * w10 + fSb[a11] * w11 - fsV0) * Math.min(1, w[4] * 1.5),') + ')');`;
  const V = { build: { cap: null, lp: false }, caps: { cap: { 3: 9, 4: 11 }, lp: false }, capsLP: { cap: { 3: 9, 4: 11 }, lp: true } };
  const res = {};
  for (const [vn, v] of Object.entries(V)) {
    await mev(p, `RL_NAT.cap.splice(0, 7, ...__cap0); ${v.cap ? Object.entries(v.cap).map(([k, x]) => `RL_NAT.cap[${k}] = ${x};`).join(' ') : ''} ${v.lp ? lp : 'rlNaturalGen = __ng0;'} 'ok'`);
    if (vn !== 'build') { const t = await mev(p, `(() => { const t0 = performance.now(); for (const _ of rlLookGen(RB, 'natural')) void _; RB.lookVer++; rlAfterBake(); RCK = null; draw(); return Math.round(performance.now() - t0); })()`); console.log(vn, 'rebake ms', t); }
    const pr = await ev(p, 'm.ev("RL_NAT.cap.join()") + (m.ev("rlNaturalGen.toString().includes(\'fSb\')") ? " lp" : "")'); console.log(vn, 'params', pr);
    for (const [view, src] of [['start', 'm.ev("fit(); draw()")'], ['refW', 'm.setScale(1.142, 400, 420)']]) { await ev(p, src); await p.waitForTimeout(400); await p.screenshot({ path: `${OUT}M-${view}-${vn}.png` }); }
    await ev(p, 'm.ev("fit(); draw()")');
    const nat = await ev(p, 'm.reliefNatural(true)');
    const r = nat.readers; res[vn] = { normal: r.normal, deutan: r.deutan, tritan: r.tritan, protan: r.protan, pass: r.pass, snow: nat.snow ? nat.snow.pass : null, chroma: nat.chroma.pass };
    console.log(vn, JSON.stringify({ pass: r.pass, light: r.normal.lightness.patchAcc + '/' + r.normal.lightness.provinceAcc, tex: r.normal.texture.patchAcc + '/' + r.normal.texture.provinceAcc, unex: r.normal.unexplored.patchAcc + '/' + r.normal.unexplored.provinceAcc, deutTex: r.deutan.texture.patchAcc + '/' + r.deutan.texture.provinceAcc, missed: [...r.normal.texture.missed, ...r.deutan.texture.missed] }));
  }
  fs.writeFileSync(__dirname + '/../mtn-results.json', JSON.stringify(res, null, 1));
  console.log('errors', JSON.stringify(realErrors(errors)));
  await b.close();
})();
