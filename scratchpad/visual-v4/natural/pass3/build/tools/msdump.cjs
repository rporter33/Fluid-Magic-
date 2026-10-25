// msdump.cjs <page> <tag>: the Greyteeth box's planes (hM, pk, s01, wd, colour) as PNGs in build/look/ms-<tag>-*.png
const { launch, open, ev, mev, ME } = require('./lib.cjs'); const fs = require('fs');
(async () => { const PAGE = process.argv[2], tag = process.argv[3], wi = +(process.argv[4] || 2), b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, PAGE, { log, settle: 500, q: '?keepms' });
  const r = await mev(p, `(() => { const B = RB.ms.boxes[${wi}]; const n = B.nw * B.nh, f = (A, lo, hi) => { const o = new Array(n); for (let q = 0; q < n; q++) o[q] = Math.max(0, Math.min(255, Math.round(((A[q] - lo) / (hi - lo)) * 255))); return o; };
    let wmax = 0; for (let q = 0; q < n; q++) if (B.wd[q] > wmax) wmax = B.wd[q];
    return { name: B.w.name, nw: B.nw, nh: B.nh, snowQ: B.snowQ, hMax: B.hMax, D: RLD, FT: RB.TX * RL_MS.F, wmax, hM: f(B.hM, 0, B.hMax), pk: f(B.pk, B.snowQ[0] * 0.8, B.snowQ[1]), s01: f(B.s01, 0, 1), wd: f(B.wd, 0, wmax), img: Array.from(B.img.data) }; })()`);
  console.log(r.name, r.nw, r.nh, 'snowQ', r.snowQ, 'hMax', r.hMax, 'D', r.D, 'FT', r.FT, 'D px fine', r.D * r.FT, 'wdmax/D', r.wmax / r.D);
  fs.writeFileSync(`${ME}look/ms-${tag}.json`, JSON.stringify(r)); console.log('errors', log.pageErrors.length); await b.close(); })();
