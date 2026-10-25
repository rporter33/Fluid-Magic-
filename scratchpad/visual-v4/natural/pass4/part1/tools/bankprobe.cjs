// failing bank samples of the p90 rest plan: node bankprobe.cjs <query> <shot-prefix>
const { launch, open, ev, mev } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, process.env.PAGEFILE, { log, q: process.argv[2] || '', settle: 1500 }); await p.mouse.move(720, 896);
  const r = await mev(p, `(() => { const band = bandOf(cam.s), P = rlFloorPlan(rlFloorEdgesOf(null, band)); rlFrame(RL_LF.LAND, true); const land = rlReadPlan(P); rlFrame(RL_LF.LINES, true); const lines = rlReadPlan(P); SKIP.clear(); RCK = null; draw();
    const bad = []; for (const q of P.pts) { let bst = 0, row = []; for (let k = q.k0; k < q.k1; k += 2) { const o = (k / 2) * 3, A = [lines[o], lines[o + 1], lines[o + 2]], B = [land[o], land[o + 1], land[o + 2]], c = rlWcag(A, B); row.push([rgb2hex(B), rgb2hex(A), +c.toFixed(2)]); if (c > bst) bst = c; }
      if (bst < RL_LF[q.kind]) bad.push({ e: names[q.e.i] + '/' + names[q.e.j], at: q.at, best: +bst.toFixed(2), xy: [P.idx[q.k0] / dpr, P.idx[q.k0 + 1] / dpr], row }); }
    const k = bad.length ? ekey(names.indexOf(bad[0].e.split('/')[0]), names.indexOf(bad[0].e.split('/')[1])) : null, e = k && EDGE.get(k), ctx = rlLineCtx();
    return { n: P.pts.length, bad: bad.length, ex: bad.slice(0, 4), styles: e ? [e.i, e.j].map((s) => ({ side: names[s], st: rlBankStyle(e, k, s, ctx) })) : null, water: rlWaterCol(), keys: RL_KEYS, lw: rlW().h }; })()`);
  console.log(JSON.stringify(r, null, 1).slice(0, 6000));
  if (r.ex.length) { const [x, y] = r.ex[0].xy; await p.screenshot({ path: process.argv[3] + '.png', clip: { x: Math.max(0, x - 60), y: Math.max(0, y - 45), width: 120, height: 90 } }); }
  await b.close(); })();
