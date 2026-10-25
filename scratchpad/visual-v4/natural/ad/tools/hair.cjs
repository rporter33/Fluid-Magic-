// AD review: hairline variants at runtime (private browser; the mockup file is not edited), checked by the page's own rendered-pixel line check
const { launch, open, PAGE, realErrors } = require('../../build-tools/nlib.cjs');
const OUT = __dirname + '/../shots/';
const ev = (p, s) => p.evaluate((s) => { const m = window.__mock; return eval(s); }, s);
(async () => {
  const b = await launch(), errors = [];
  const p = await open(b, PAGE, { errors, settle: 1500, reducedMotion: 'reduce' });
  await p.mouse.move(700, 880);
  await ev(p, `m.ev("window.__seg0 = rlSegStyles; window.__L0 = { ...RL_P.line }; 'ok'")`);
  const variants = {
    build: { line: {}, nomax: false },
    design: { line: { q: 0.1, hairCov: 0.75 }, nomax: false },
    local: { line: { q: 0.1, hairCov: 0.75, segD: 0.04, hair: 2.36 }, nomax: true },
    local2: { line: { q: 0.15, hairCov: 0.8, segD: 0.03, hair: 2.32 }, nomax: true },
  };
  const res = {};
  for (const [vn, v] of Object.entries(variants)) {
    await ev(p, `m.ev(${JSON.stringify(`Object.assign(RL_P.line, __L0, ${JSON.stringify(v.line)});
      rlSegStyles = ${v.nomax ? "eval('(' + __seg0.toString().replace('Math.max(v[s].alpha0, s > 0 ? v[s - 1].alpha0 : 0, s < v.length - 1 ? v[s + 1].alpha0 : 0)', 'v[s].alpha0') + ')')" : '__seg0'};
      RL_LINES.cache.clear(); RCK = null; draw(); 'ok'`)})`);
    for (const [view, src] of [['start', 'm.ev("fit(); draw()")'], ['ref', 'm.setScale(1.142, 700, 560)']]) {
      await ev(p, src); await p.waitForTimeout(500);
      await p.screenshot({ path: `${OUT}H-${view}-${vn}.png` });
      const r = await ev(p, 'm.reliefLines()');
      res[vn + '/' + view] = { hair: r.hairline, int: r.internal, partners: r.partners, segs: r.segs, flips: r.keylineFlipsAlongEdges, maxW: r.maxHairWidthPx, pass: r.pass };
      console.log(vn, view, JSON.stringify(res[vn + '/' + view]));
    }
  }
  require('fs').writeFileSync(__dirname + '/../hair-variants.json', JSON.stringify(res, null, 1));
  console.log('errors', JSON.stringify(realErrors(errors)));
  await b.close();
})();
