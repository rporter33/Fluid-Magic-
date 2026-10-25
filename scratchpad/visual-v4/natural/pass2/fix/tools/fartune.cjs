// the Far relief at the least zoom: readers, the raster's step across shared edges (grey levels), the same-terrain step on screen with and without it; node fartune.cjs '<json [[tag, js], ...]>'
const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const fs = require('fs');
const PR = fs.readFileSync(__dirname + '/ad-adprobe.js', 'utf8'), sets = JSON.parse(process.argv[2]);
const STEP = String.raw`(() => { const cv = rlFarRaster(), g = cv.getContext('2d'), d = g.getImageData(0, 0, cv.width, cv.height).data, { QW, QH } = RB, id4 = RL_FR.id4, steps = [];
  // across each shared passable edge: the raster's grey 3 quarter texels either side of the edge's midpoint and quarter points, median per edge
  const at = (x, y) => { const qx = Math.floor(x * RB.TX / 4), qy = Math.floor(y * RB.TX / 4); if (qx < 0 || qy < 0 || qx >= QW || qy >= QH) return null; const k = qy * QW + qx; return id4[k] === 255 ? null : d[k * 4]; };
  for (const [, e] of EDGE) { if (isWild(e.i) || isWild(e.j)) continue; const L = Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1]), nx = -(e.b[1] - e.a[1]) / L, ny = (e.b[0] - e.a[0]) / L, o = 3 * 4 / RB.TX, S = [];
    for (const t of [0.25, 0.5, 0.75]) { const x = e.a[0] + (e.b[0] - e.a[0]) * t, y = e.a[1] + (e.b[1] - e.a[1]) * t, p = at(x + nx * o, y + ny * o), q = at(x - nx * o, y - ny * o), p2 = at(x + nx * 2 * o, y + ny * 2 * o), q2 = at(x - nx * 2 * o, y - ny * 2 * o); if (p == null || q == null || p2 == null || q2 == null) continue; S.push(Math.abs((p - q) - ((p2 - p) + (q - q2)) / 2)); } // the step net of the local slope
    if (S.length) { S.sort((a, b) => a - b); steps.push(S[S.length >> 1]); } }
  steps.sort((a, b) => a - b); const q = (f) => steps[Math.min(steps.length - 1, Math.floor(f * steps.length))]; return { edges: steps.length, p50: q(0.5), p90: q(0.9), max: q(1) }; })()`;
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, p = await open(b, PAGE, { log, settle: 800 }); await mev(p, PR); await p.mouse.move(720, 894);
  await ev(p, 'm.setScale(m.minScale(), 800, 500)'); await p.waitForTimeout(800);
  const sum = (r) => ({ pass: r.pass, patch: r.normal.lightness.patchAcc, prov: r.normal.lightness.provinceAcc, unexPatch: r.normal.unexplored.patchAcc, unexProv: r.normal.unexplored.provinceAcc, missed: [...new Set([...r.normal.lightness.missed, ...r.normal.unexplored.missed])] });
  await ev(p, 'm.skip("farRelief", true)'); const no = sum(await ev(p, 'm.reliefNatural(true).readers')); const stNo = await p.evaluate(() => window.__ad.edgeSteps()); await ev(p, 'm.skip("farRelief", false)');
  console.log('noRelief', JSON.stringify(no), 'same', JSON.stringify(stNo.sameTerrain), 'diff', JSON.stringify(stNo.diffTerrain));
  for (const [tag, js] of sets) { if (js) await mev(p, js); await mev(p, 'RL_FR.cv = null; RL_FR.ver = -1; RCK = null; draw()'); await p.waitForTimeout(600);
    const r = sum(await ev(p, 'm.reliefNatural(true).readers')), st = await p.evaluate(() => window.__ad.edgeSteps()), rs = await mev(p, STEP);
    console.log(tag, JSON.stringify(r), 'same', JSON.stringify(st.sameTerrain), 'diff', JSON.stringify(st.diffTerrain), 'rasterStep', JSON.stringify(rs));
    await p.screenshot({ path: `${OUT}far-${tag}.png` }); }
  console.log('pageErrors', log.pageErrors.length); await b.close();
})();
