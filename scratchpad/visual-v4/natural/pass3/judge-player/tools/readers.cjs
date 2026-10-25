// node readers.cjs <build...> : the page's own terrain readers (lightness / texture, patch / province) at the far zooms and the start view, with the provinces missed
const { launch, open, ev, ME } = require('./lib.cjs'); const fs = require('fs');
(async () => { const b = await launch(); const out = {};
  for (const build of process.argv.slice(2)) { const log = { pageErrors: [], console: [] }; const p = await open(b, build, { log }); await p.mouse.move(720, 896);
    for (const [v, src] of [['min', 'm.setScale(m.minScale(), 800, 500)'], ['far60', 'm.setScale(60 / m.ev("MED_DIAM"), 800, 500)'], ['start', 'm.ev("fit(); draw()")'], ['mid', 'm.setScale(1.0, 640, 480)']]) {
      await ev(p, src); await p.waitForTimeout(1800); const r = await ev(p, 'm.reliefNatural(true).readers');
      out[build + ' ' + v] = { pass: r.pass, light: [r.normal.lightness.patchAcc, r.normal.lightness.provinceAcc], tex: [r.normal.texture.patchAcc, r.normal.texture.provinceAcc], missed: r.normal.lightness.missed, deutan: r.deutan ? [r.deutan.lightness.patchAcc, r.deutan.lightness.provinceAcc] : null };
      console.log(build, v, JSON.stringify(out[build + ' ' + v])); }
    console.log(build, 'pageErrors', log.pageErrors.length); await p.context().close(); }
  fs.writeFileSync(ME + 'out/readers-' + process.argv.slice(2).join('-') + '.json', JSON.stringify(out, null, 1)); await b.close(); })();
