// runtime re-bakes (private browser): the hills' identity under the unexplored state with the AD caps; variants of the hills cap and the rock speck
const { launch, open, PAGE, realErrors } = require('./nlib2.cjs');
const ev = (p, s) => p.evaluate((s) => { const m = window.__mock; return eval(s); }, s);
const mev = (p, src) => ev(p, 'm.ev(' + JSON.stringify(src) + ')');
(async () => {
  const b = await launch(), errors = []; const p = await open(b, PAGE, { errors, settle: 1200, reducedMotion: 'reduce', dpr: Number(process.env.DPR || 1) }); await p.mouse.move(700, 880);
  await mev(p, `window.__ng0 = rlNaturalGen; 'ok'`);
  for (const [vn, cap, speck, pre] of (process.env.VARS ? JSON.parse(process.env.VARS) : [['base', 9, 0.35, '']])) { await mev(p, (pre || '') + "; 'ok'");
    await mev(p, `RL_NAT.cap[3] = ${cap}; rlNaturalGen = eval('(' + __ng0.toString().replace('mixc(M.hills.rock, ph * 0.35 *', 'mixc(M.hills.rock, ph * ${speck} *') + ')'); (() => { for (const _ of rlLookGen(RB, 'natural')) void _; RB.lookVer++; rlAfterBake(); RCK = null; draw(); })(); 'ok'`);
    await ev(p, 'm.ev("fit(); draw()")');
    const r = await ev(p, 'm.reliefNatural(true).readers');
    console.log(vn, JSON.stringify({ light: [r.normal.lightness.patchAcc, r.normal.lightness.provinceAcc], unex: [r.normal.unexplored.patchAcc, r.normal.unexplored.provinceAcc], tex: [r.normal.texture.patchAcc, r.normal.texture.provinceAcc], missed: r.normal.unexplored.missed, pass: r.pass }));
  }
  console.log('errors', JSON.stringify(realErrors(errors))); await b.close();
})();
