// what the neutral hairlines (now the bevel) still add: the start view and ref-2's zoom with and without them (runtime switch in a private browser)
const { launch, open, PAGE, realErrors } = require('./nlib2.cjs');
const OUT = __dirname + '/../shots-dev/';
const ev = (p, s) => p.evaluate((s) => { const m = window.__mock; return eval(s); }, s);
(async () => {
  const b = await launch(), errors = [], tag = process.argv[2] || 'new', file = process.argv[3] || PAGE;
  const p = await open(b, file, { errors, settle: 1500, reducedMotion: 'reduce' }); await p.mouse.move(700, 880);
  await ev(p, `m.ev("window.__seg0 = rlSegStyles; window.__nohair = (e, kind, ctx) => { const r = __seg0(e, kind, ctx); if (kind !== 'hair') return r; return { ...r, segs: r.segs.map((s) => ({ ...s, alpha: 0, partner: null, bevel: s.bevel ? { ul: { ...s.bevel.ul, a: 0 }, lr: { ...s.bevel.lr, a: 0 } } : undefined })) }; }; 'ok'")`);
  for (const [vn, vs] of [['start', 'm.ev("fit(); draw()")'], ['refC', 'm.setScale(1.142, 700, 560)']]) {
    await ev(p, vs);
    await ev(p, `m.ev("rlSegStyles = __nohair; RL_LINES.cache.clear(); RCK = null; draw(); 'ok'")`); await p.waitForTimeout(400); await p.screenshot({ path: `${OUT}L-${tag}-${vn}-nohair.png` });
    await ev(p, `m.ev("rlSegStyles = __seg0; RL_LINES.cache.clear(); RCK = null; draw(); 'ok'")`); await p.waitForTimeout(300);
  }
  console.log('errors', JSON.stringify(realErrors(errors))); await b.close();
})();
