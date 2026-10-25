const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, settle: 300 });
  const r = await mev(p, `(() => { const w = WILDS.find(w => w.kind === 'mere'), T = rlNWT(), res = []; const pts = [[930, 520], [960, 510], [990, 540], [870, 640], [850, 600], [980, 600]];
    for (const [x, y] of pts) { const q = rlNatMereField(RB, w, x, y), u = x / RLK, v = y / RLK, fb = rlFbm(T.po, u / 9, v / 9, 3), c = rlNatMereColour(RB, w, RB.L.natural.img.data, x, y, u, v, null); res.push({ x, y, inside: isWild(provinceAt(x, y)), Lf: +(q.Lf / RLD).toFixed(3), wf: +q.wf.toFixed(2), fbm: +fb.toFixed(2), col: c.map(v => +v.toFixed(1)), bake: (() => { const k = (Math.floor(y * RB.TX) * RB.BW + Math.floor(x * RB.TX)) * 4, d = RB.L.natural.img.data; return rgb2lab([d[k], d[k+1], d[k+2]]).map(v => +v.toFixed(1)); })(), LT: RB.LT[Math.floor(y * RB.TX) * RB.BW + Math.floor(x * RB.TX)] }); }
    return res; })()`);
  console.log(JSON.stringify(r, null, 1)); console.log('errors', log.pageErrors); await b.close(); })();
