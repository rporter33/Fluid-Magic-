const { launch, open, PAGE, realErrors } = require('../../build-tools/nlib.cjs');
const OUT = __dirname + '/../shots/';
const ev = (p, s) => p.evaluate((s) => { const m = window.__mock; return eval(s); }, s);
const mev = (p, src) => ev(p, 'm.ev(' + JSON.stringify(src) + ')');
(async () => {
  const b = await launch(), errors = [];
  const p = await open(b, PAGE, { errors, settle: 1200, reducedMotion: 'reduce', dpr: 2 });
  await p.mouse.move(700, 880);
  const sm = (n, a, b2) => `Math.max(0, Math.min(1, (${n} - ${a}) / (${b2} - ${a})))`;
  await mev(p, `window.__ng0 = rlNaturalGen; rlNaturalGen = eval('(' + __ng0.toString()
    .replace('if (rlVN(Tr, u / 1.6, v / 1.6) > 0.78) mixc(M.hills.rock, ph * 0.7);', 'mixc(M.hills.rock, ph * 0.35 * ${sm('rlVN(Tr, u / 1.6, v / 1.6)', 0.72, 0.9)});')
    .replace('if (rlVN(Tsc, u / 1.4, v / 1.4) > 0.78) mixc(M.wasteland.scrub, pw * 0.85);', 'mixc(M.wasteland.scrub, pw * 0.5 * ${sm('rlVN(Tsc, u / 1.4, v / 1.4)', 0.72, 0.9)});')
    .replace('if (rlVN(Tsc, u / 1.3 + 3, v / 1.3) > 0.72) mixc(M.swamp.shrub, ps * (1 - pool) * 0.8);', 'mixc(M.swamp.shrub, ps * (1 - pool) * 0.6 * ${sm('rlVN(Tsc, u / 1.3 + 3, v / 1.3)', 0.66, 0.84)});') + ')'); 'ok'`);
  for (const [vn, on] of [['build', false], ['soft', true]]) {
    if (on) { await mev(p, `(() => { for (const _ of rlLookGen(RB, 'natural')) void _; RB.lookVer++; rlAfterBake(); RCK = null; draw(); })(); 'ok'`); }
    for (const n of ['Halegate', 'Wyrford']) { await ev(p, `m.zoomTo(m.maxScale()*0.85, ${JSON.stringify(n)})`); await p.waitForTimeout(500); await p.screenshot({ path: `${OUT}S-${n}-${vn}.png`, clip: { x: 520, y: 380, width: 360, height: 220 } }); }
    if (!on) await mev(p, `'swap'`);
    if (!on) await mev(p, `rlNaturalGen = rlNaturalGen; 'ok'`);
    if (!on) { const r = await ev(p, 'm.ev("rlNaturalGen.toString().includes(\'0.35 *\')")'); console.log('patched gen ready', r); }
  }
  await ev(p, 'm.ev("fit(); draw()")');
  const nat = await ev(p, 'm.reliefNatural(true)'); console.log('readers pass', nat.readers.pass, nat.readers.normal.texture.patchAcc, nat.readers.normal.lightness.patchAcc, 'snow', nat.snow.pass);
  console.log('errors', JSON.stringify(realErrors(errors)));
  await b.close();
})();
