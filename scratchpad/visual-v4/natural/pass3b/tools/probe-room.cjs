// the wilds' room (the spine's half-width profile, in D): node probe-room.cjs
const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, settle: 500 });
  console.log(JSON.stringify(await mev(p, '(() => RB.ms.boxes.map((B) => { const r = Array.from(B.G.r).filter((v) => v > 0).sort((a, b) => a - b); const D = RLD; return { w: B.w.name, kind: B.w.kind, n: r.length, p25: +(r[Math.floor(r.length * 0.25)] / D).toFixed(3), p50: +(r[r.length >> 1] / D).toFixed(3), p75: +(r[Math.floor(r.length * 0.75)] / D).toFixed(3), max: +(r[r.length - 1] / D).toFixed(3), len: +((B.G.p1 - B.G.p0) / D).toFixed(2) }; }))()')));
  console.log('pageErrors', log.pageErrors.length); await b.close(); })();
