const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, settle: 1500 }); await p.mouse.move(700, 895);
  for (const [cx, cy] of [[800, 520], [400, 400], [1200, 600]]) for (const dpx of [150, 181, 200, 250, 300, 319, 321]) { await ev(p, `m.setScale(${dpx} / m.ev('MED_DIAM'), ${cx}, ${cy})`); await p.waitForTimeout(400);
    console.log(JSON.stringify(await mev(p, `(() => { RCK = null; draw(); const lay = RL_PIECE_CACHE.get('L'); const v = viewRect(); const inView = provList.filter((i) => { const [x, y] = toScreen(...cent[i]); return x > v.l + 20 && x < v.r - 20 && y > v.t + 20 && y < v.b - 20; }); const named = new Set(lay.labels.map((l) => l.i)); const want = inView.filter((i) => prov[i].cap || prov[i].well || rlIsTown(prov[i]));
      return { at: [${cx}, ${cy}], Dpx: ${dpx}, inView: inView.length, named: inView.filter((i) => named.has(i)).length, wantCapsWellsTowns: want.length, unnamedWanted: want.filter((i) => !named.has(i)).map((i) => names[i]), namedOther: inView.filter((i) => named.has(i) && !want.includes(i)).map((i) => names[i]) }; })()`))); }
  console.log('pageErrors', log.pageErrors.length); await b.close();
})();
