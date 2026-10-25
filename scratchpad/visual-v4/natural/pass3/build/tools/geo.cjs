// geometry and bake timing probe: node geo.cjs [base]
const { launch, open, ev, mev, PAGE, BEFORE } = require('./lib.cjs');
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, process.argv[2] === 'base' ? BEFORE : PAGE, { log, settle: 800 });
  const r = await mev(p, `({ W, H, D: MED_DIAM, RLK, TX: RB.TX, max: maxScale, min: minScale, fit: fitScale, s: cam.s, ready: p.__readyMs,
    wilds: WILDS.map((w) => { let bb = [1e9, 1e9, -1e9, -1e9]; for (const c of w.cells) { const q = bboxOf(cells[c]); bb = [Math.min(bb[0], q[0]), Math.min(bb[1], q[1]), Math.max(bb[2], q[2]), Math.max(bb[3], q[3])]; } return { id: w.id, kind: w.kind, cells: w.cells, bb: bb.map((v) => +v.toFixed(1)), nbs: [...new Set(w.cells.flatMap((c) => NB[c]).filter((j) => !w.cells.includes(j)))].map((j) => names[j] + ':' + terr[j]) }; }),
    times: RB.t, natT: RB.L.natural && RB.L.natural.t, cpu: RB.L.natural && RB.L.natural.cpu, total: Math.round(RB.total), wall: Math.round(RB.wall) })`.replace('p.__readyMs', '0'));
  r.readyMs = p.__readyMs; console.log(JSON.stringify(r, null, 1)); console.log('pageErrors', log.pageErrors.length, log.pageErrors.slice(0, 3));
  await b.close();
})();
