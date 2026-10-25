// the ridge term's input range: -lap * VS / dxh over the range's rock texels (percentiles), to set crestK
const { launch, open, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, settle: 300, q: '?keepms' });
  console.log(await mev(p, `(() => { const B = RB.ms.boxes[0], { h, nw, nh, hM } = B, VS = RL_P.vScale * RLK, dxh = 1 / (RB.TX * RL_MS.F), v = []; for (let j = 1; j < nh - 1; j += 2) for (let i = 1; i < nw - 1; i += 2) { const q = j * nw + i; if (!(hM[q] > 0.2)) continue; v.push(-((h[q - nw] + h[q - 1] + h[q + 1] + h[q + nw] - 4 * h[q]) * VS) / dxh); } v.sort((a, b2) => a - b2); return JSON.stringify([0.5, 0.75, 0.9, 0.95, 0.98].map((f) => +v[Math.floor(f * v.length)].toFixed(3))); })()`));
  await b.close(); })();
