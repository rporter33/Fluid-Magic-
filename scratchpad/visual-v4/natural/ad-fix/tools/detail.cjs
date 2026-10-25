// the Near detail pass: mean and spread of L* per cover class with and without it, its build time, pan stats
const { launch, open, PAGE, realErrors } = require('../../build-tools/nlib.cjs');
const ev = (p, s) => p.evaluate((s) => { const m = window.__mock; return eval(s); }, s);
const OUT = __dirname + '/../shots-dev/';
(async () => {
  const b = await launch(), errors = []; const dpr = Number(process.env.DPR || 1);
  const p = await open(b, PAGE, { errors, settle: 1500, reducedMotion: 'reduce', dpr });
  await p.mouse.move(700, 880);
  for (const [vn, src] of [['kh', 'm.zoomTo(m.maxScale()*0.85, "Kharnath")'], ['wy', 'm.zoomTo(m.maxScale(), "Wyrford")'], ['ref', 'm.setScale(1.142, 700, 560)'], ['n240', 'm.setScale(240 / m.ev("MED_DIAM"), 700, 560)']]) {
    await ev(p, src); await p.waitForTimeout(500);
    const r = await ev(p, `m.ev(${JSON.stringify(`(() => { const st = (on) => { if (on) SKIP.delete('detail'); else SKIP.add('detail'); RCK = null; draw(); const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data, acc = {}; const sk = new Set(SKIP); 
      for (let py = 120 * dpr; py < 720 * dpr; py += 3) for (let px = 20 * dpr; px < 1360 * dpr; px += 3) { const [x, y] = toWorld(px / dpr, py / dpr); if (!inModel(x, y)) continue; const t = Math.floor(y * RB.TX) * RB.BW + Math.floor(x * RB.TX), c = RB.nat.cls[t]; if (c === 255) continue; const k = (py * canvas.width + px) * 4, L = rlL(d[k], d[k + 1], d[k + 2]); const a = (acc[c] ??= [0, 0, 0]); a[0]++; a[1] += L; a[2] += L * L; }
      SKIP.delete('detail'); return Object.fromEntries(Object.entries(acc).filter(([, a]) => a[0] > 200).map(([c, a]) => [c, [a[0], +(a[1] / a[0]).toFixed(2), +Math.sqrt(a[2] / a[0] - (a[1] / a[0]) ** 2).toFixed(2)]])); };
      SKIP.add('pieces'); SKIP.add('labels'); SKIP.add('rails'); const off = st(false), on = st(true); SKIP.delete('pieces'); SKIP.delete('labels'); SKIP.delete('rails'); RCK = null; draw(); return { k: rlNearK(), off, on, nd: { ms: RL_ND.ms, px: RL_ND.px } }; })()`)})`);
    console.log(vn, JSON.stringify(r));
    await p.screenshot({ path: OUT + `nd-${vn}-dpr${dpr}.png` });
    const t = await ev(p, `m.ev("(() => { const t = []; for (let k = 0; k < 3; k++) { RCK = null; const t0 = performance.now(); draw(); t.push(+(performance.now() - t0).toFixed(1)); } return t; })()")`);
    console.log(vn, 'renders', JSON.stringify(t), 'pan', JSON.stringify(await ev(p, 'm.panStats(6, 90)')));
  }
  console.log('errors', JSON.stringify(realErrors(errors))); await b.close();
})();
