const { launch, open, ev, PAGE } = require('./lib.cjs');
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, p = await open(b, PAGE, { log, settle: 1200 }); await p.mouse.move(720, 894);
  const sum = (r) => ({ pass: r.pass, N: r.normal && r.normal.lightness ? { patch: r.normal.lightness.patchAcc, prov: r.normal.lightness.provinceAcc, missed: r.normal.lightness.missed, unexPatch: r.normal.unexplored.patchAcc, unexProv: r.normal.unexplored.provinceAcc, texPatch: r.normal.texture.patchAcc } : r });
  const out = {};
  await ev(p, 'm.setScale(m.minScale(), 800, 500)'); await p.waitForTimeout(800);
  out.farMin = sum(await ev(p, 'm.reliefNatural(true).readers'));
  await ev(p, 'm.skip("farRelief", true)'); out.farMinNoRelief = sum(await ev(p, 'm.reliefNatural(true).readers')); await ev(p, 'm.skip("farRelief", false)');
  await ev(p, 'm.setScale((m.minScale() + m.fitScale()) / 2, 800, 500)'); await p.waitForTimeout(800);
  out.far69 = sum(await ev(p, 'm.reliefNatural(true).readers'));
  console.log(JSON.stringify(out, null, 1)); console.log('errors', log.pageErrors.length); await b.close();
})();
