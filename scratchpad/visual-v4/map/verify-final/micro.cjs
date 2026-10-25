// fix 10's rock micro-relief: does its lit side agree with the main hillshade? correlation, on mountain texels, between the micro term and the hillshade's slope term
const { launch, open, PAGE } = require('./vlib.cjs');
(async () => { const b = await launch(); const p = await open(b, PAGE, {});
  console.log(JSON.stringify(await p.evaluate(() => window.__mock.ev(`(() => { const L = RL_LIGHT; const TMR = rlGTable('micro:mountains'), mE = 0.7 * RLK, f = (u, v) => rlRidged(TMR, u / (7 * RLK), v / (7 * RLK), 2, 0.2); const micro = (x, y) => (f(x + mE, y + mE) - f(x - mE, y - mE)); 
    // the hillshade's own lighting of the micro field: the same ridged field as a height, shaded by the page's light vector
    let n = 0, sxy = 0, sxx = 0, syy = 0; for (let k = 0; k < 4000; k++) { const x = 200 + (k * 37.7) % (W - 400), y = 150 + (k * 53.3) % (H - 300); const e = 0.7 * RLK, gx = (f(x + e, y) - f(x - e, y)) / (2 * e), gy = (f(x, y + e) - f(x, y - e)) / (2 * e); const lit = -gx * L[0] - gy * L[1]; const m = micro(x, y); n++; sxy += lit * m; sxx += lit * lit; syy += m * m; }
    return { light: L.map((v) => +v.toFixed(3)), corr: +(sxy / Math.sqrt(sxx * syy)).toFixed(3) }; })()`))));
  await b.close(); })();
