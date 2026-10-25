const { launch, open, PAGE, realErrors } = require('../../build-tools/nlib.cjs');
const fs = require('fs');
const OUT = __dirname + '/../shots/';
const ev = (p, s) => p.evaluate((s) => { const m = window.__mock; return eval(s); }, s);
(async () => {
  const b = await launch(), errors = [];
  const res = {};
  for (const dpr of [1, 2]) {
    const p = await open(b, PAGE, { errors, settle: 1500, reducedMotion: 'reduce', dpr });
    await p.mouse.move(700, 880);
    await ev(p, `m.ev("window.__seg0 = rlSegStyles; window.__draw0 = rlDrawRails; 'ok'")`);
    await ev(p, 'm.ev(' + JSON.stringify(fs.readFileSync(__dirname + '/bevel-patch.js', 'utf8') + "; 'ok'") + ')');
    // the drawer: a bevelled segment draws its two halves (1.5 px each, the upper-left half on the -normal side)
    await ev(p, `m.ev(${JSON.stringify(`rlDrawRails = eval('(' + __draw0.toString().replace("const hw = sg.partner ? w.ph : w.h,", "if (sg.bevel) { stroke(sg, -0.75, 1.5, rgba(key(sg.bevel.ul.key), +sg.bevel.ul.a.toFixed(3))); stroke(sg, 0.75, 1.5, rgba(key(sg.bevel.lr.key), +sg.bevel.lr.a.toFixed(3))); RL_LINES.stats.maxWidthPx = Math.max(RL_LINES.stats.maxWidthPx, 3); run += Math.hypot(sg.x1 - sg.x0, sg.y1 - sg.y0); RL_LINES.stats.segs++; continue; } const hw = sg.partner ? w.ph : w.h,") + ')'); 'ok'`)})`);
    for (const [vn, bv] of [['build', null], ['bevel245', { T: 2.45, cov: 0.75, q: 0.1 }], ['bevel235', { T: 2.35, cov: 0.8, q: 0.08 }]]) {
      await ev(p, `m.ev(${JSON.stringify(`window.__BV = ${JSON.stringify(bv)}; rlSegStyles = ${bv ? '__bevelSeg' : '__seg0'}; RL_LINES.cache.clear(); RCK = null; draw(); 'ok'`)})`);
      for (const [view, src] of [['start', 'm.ev("fit(); draw()")'], ['ref', 'm.setScale(1.142, 700, 560)'], ['near', 'm.zoomTo(m.maxScale()*0.85, "Wyrford")']]) {
        await ev(p, src); await p.waitForTimeout(400);
        if (dpr === 1 || view === 'start') await p.screenshot({ path: `${OUT}B-${view}-${vn}-dpr${dpr}.png` });
        const r = await ev(p, 'm.reliefLines()');
        res[`${vn}/${view}/dpr${dpr}`] = { hair: r.hairline, int: r.internal.min, maxW: r.maxHairWidthPx, flips: r.keylineFlipsAlongEdges, pass: r.pass };
        console.log(vn, view, dpr, JSON.stringify(res[`${vn}/${view}/dpr${dpr}`]));
      }
    }
    await p.context().close();
  }
  fs.writeFileSync(__dirname + '/../bevel-results.json', JSON.stringify(res, null, 1));
  console.log('errors', JSON.stringify(realErrors(errors)));
  await b.close();
})();
