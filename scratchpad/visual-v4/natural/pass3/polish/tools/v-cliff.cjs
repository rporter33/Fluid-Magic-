// the model's edge at the least zoom and at Fit (pass-2 fix 7): the cliff face's L* p5 / p50 / p95 and spread (face rows below the south edge, waterfalls
// and the plaque left out), and the lip: mean L* of the 0.5-2.5 px band inside each side's edge minus the band 6-10 px inside (positive = a light lip)
// node cliff.cjs [look]
const { launch, open, ev, mev, PAGE, OUT, SHOTS } = require('./lib.cjs'); const fs = require('fs');
const look = process.argv[2] || 'natural', CFGS = process.env.CFGS ? JSON.parse(process.env.CFGS) : [['as built', '']];
const IN = String.raw`(() => {
  const was = new Set(SKIP); for (const k of ['rails', 'pieces', 'labels', 'badges', 'arrows']) SKIP.add(k); RCK = null; draw(); const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data.slice(); SKIP.clear(); for (const k of was) SKIP.add(k); RCK = null; draw();
  const W2 = canvas.width, H2 = canvas.height, Lp = (X, Y) => { X = Math.floor(X * dpr); Y = Math.floor(Y * dpr); if (X < 0 || Y < 0 || X >= W2 || Y >= H2) return null; const k = (Y * W2 + X) * 4; return rlL(d[k], d[k + 1], d[k + 2]); };
  const pct = (a, q) => { const s = [...a].sort((x, y) => x - y); return +s[Math.min(s.length - 1, Math.floor(q * s.length))].toFixed(1); };
  const [x0, yE] = toScreen(RL_RC + 4, H), [x1] = toScreen(W - RL_RC - 4, H), fh = (RL_FACE - RL_PLINTH) * cam.s, pw = W / 2, [qx0] = toScreen(pw - (RL_P.plaqueD * RLD) / 2 - 4, H), [qx1] = toScreen(pw + (RL_P.plaqueD * RLD) / 2 + 4, H);
  const fall = (x) => RB.water.falls.some((f) => Math.abs(x - toScreen(f.x, H)[0]) < f.w * cam.s * 1.6 + 3) || (x > qx0 && x < qx1);
  const face = []; for (let x = Math.max(0, x0); x < Math.min(cw, x1); x += 0.5) { if (fall(x)) continue; for (let y = yE + 2; y <= yE + fh - 2; y += 0.5) { const l = Lp(x, y); if (l != null) face.push(l); } }
  const side = (nm, pt, inward) => { const lip = [], inner = []; for (let t = 0.12; t <= 0.88; t += 0.004) { const [sx, sy] = pt(t); const [ix, iy] = inward; for (let o = 0.5; o <= 2.5; o += 0.5) { const l = Lp(sx + ix * o, sy + iy * o); if (l != null) lip.push(l); } for (let o = 6; o <= 10; o += 1) { const l = Lp(sx + ix * o, sy + iy * o); if (l != null) inner.push(l); } } const m = (a) => a.reduce((p, q) => p + q, 0) / Math.max(1, a.length); return [nm, +(m(lip) - m(inner)).toFixed(1), +m(lip).toFixed(1), lip.length]; };
  const lip = [side('N', (t) => toScreen(W * t, 0), [0, 1]), side('S', (t) => toScreen(W * t, H), [0, -1]), side('W', (t) => toScreen(0, H * t), [1, 0]), side('E', (t) => toScreen(W, H * t), [-1, 0])];
  return { band: bandOf(cam.s), Dpx: +(cam.s * MED_DIAM).toFixed(1), facePx: +fh.toFixed(1), face: face.length ? { n: face.length, p5: pct(face, 0.05), p50: pct(face, 0.5), p95: pct(face, 0.95), spread: +(pct(face, 0.95) - pct(face, 0.05)).toFixed(1) } : null, lipMinusInner: lip };
})()`;
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, out = {};
  const p = await open(b, PAGE, { log, settle: 1500, q: look === 'clear' ? '?terrain=clear' : '' }); await p.mouse.move(720, 20);
  for (const [cn, cj] of CFGS) { if (cj) await mev(p, cj + '; RIM = null; RCK = null; draw(); 0'); out[cn] = {};
  for (const [v, src] of [['least', 'm.setScale(m.minScale(), 800, 500)'], ['fit', 'm.setScale(m.fitScale(), 800, 500)'], ['start', 'm.ev("fit(); draw()"); m.setScale(0.5478775892930478, 800, 500)'], ['mid', 'm.setScale(1.0, 720, 1050)'], ['near', 'm.setScale(m.maxScale() * 0.8, 600, 1060)']]) { await ev(p, src); await p.waitForTimeout(900); const r = await mev(p, IN); r.check = await ev(p, 'm.reliefCliff()'); out[cn][v] = r; console.log(look, cn, v, r.Dpx, 'face', JSON.stringify(r.face), 'stripe', r.check.stripeIndex, 'streaks', r.check.lightStreaksPer100px, 'lip', JSON.stringify(r.lipMinusInner.map((q) => q[1]))); } }
  out.pageErrors = log.pageErrors; fs.writeFileSync(`${OUT}cliff-${look}.json`, JSON.stringify(out, null, 1)); await b.close();
})();
