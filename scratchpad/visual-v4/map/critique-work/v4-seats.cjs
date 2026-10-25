// critique pass J: counts at the start view (seat kinds, sizes), relief p90 on cores vs the design's third-of-cap test, town fill at Near
const { launch, open } = require('../tools/lib.cjs');
const FILE = process.argv[2] || __dirname + '/../game-screen-v4.html';
(async () => {
  const b = await launch(), errors = [];
  const page = await open(b, FILE, 1440, 900, '', errors);
  const r = await page.evaluate(() => window.__mock.ev(`(() => {
    const L = rlLayout(bandOf(cam.s)), kinds = {}; for (const [, st] of L.seats) { const k = st.kind || 'none'; kinds[k] = (kinds[k] || 0) + 1; }
    const sizes = {}; for (const [, st] of L.seats) if (st.kind) (sizes[st.kind] ??= []).push(+st.T.toFixed(1));
    const o = RB, q = (a, p) => { const s = Float64Array.from(a).sort(); return +s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(2); };
    const core = {}; for (let t = 0; t < 7; t++) core[RL_T[t]] = [];
    for (let k = 0; k < o.BW * o.BH; k += 5) { if (!o.pure[k]) continue; const t = o.LT[k]; const hx = ((k % o.BW) + 0.5) / 2, hy = (Math.floor(k / o.BW) + 0.5) / 2; core[RL_T[t]].push(Math.abs(RL_CAP[RL_T[t]] * rlBilin(o.fS, o.HW, o.HH, hx, hy))); }
    const test = {}; for (const t of RL_T) { const p90 = q(core[t], 0.9); test[t] = { coreReliefP90: p90, needThirdOfCap: +(RL_CAP[t] / 3).toFixed(2), pass: p90 >= RL_CAP[t] / 3 }; }
    return { Dpx: +L.Dpx.toFixed(1), Ba: +L.Ba.toFixed(1), kinds, sizes: Object.fromEntries(Object.entries(sizes).map(([k, v]) => [k, [Math.min(...v), Math.max(...v)]])), reliefTest: test };
  })()`));
  console.log(JSON.stringify(r, null, 1));
  // Near: town fill (houses vs base area)
  const t = await page.evaluate(() => { const m = window.__mock; m.setScale(m.maxScale(), ...m.ev('cent')[m.ev('names').indexOf('Elmwick')]); return m.ev(`(() => { const L = rlLayout(bandOf(cam.s)); const out = []; for (const [i, st] of L.seats) if (st.kind === 'town') { const n = settlementC(i).n, hs = Math.max(3, Math.min(RL_P.townHouseMax, st.T * RL_P.townHouseK)); out.push([names[i], +st.T.toFixed(0), n, +hs.toFixed(1), +((Math.min(16, n) * hs * hs * 0.9) / (Math.PI * (st.T / 2) * (st.T / 2) * 0.64)).toFixed(3)]); } return out; })()`); });
  console.log('Near towns [name, base px, houses, house px, house area / base top area]', JSON.stringify(t));
  console.log('ERRORS', JSON.stringify(errors)); await b.close();
})();
