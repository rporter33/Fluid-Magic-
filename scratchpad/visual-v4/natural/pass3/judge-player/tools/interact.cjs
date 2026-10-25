// node interact.cjs <build>   real pointer: hover across each wild's edge (where does the hover flip vs the drawn line), the tooltip and cursor label,
// a neighbour's hover tint against the wild, and marching orders whose path goes around a wild (does the drawn thread cross the drawn wild?)
const { launch, open, ev, mev, ME } = require('./lib.cjs'); const fs = require('fs');
const build = process.argv[2];
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [] }; const p = await open(b, build, { log }); const out = { build, cross: [], tips: [], orders: [] };
  const shot = (n) => p.screenshot({ path: `${ME}shots/${build}-${n}.png` });
  const edges = (k) => mev(p, `(() => { const r = canvas.getBoundingClientRect(), res = []; for (const w of WILDS) { const seen = new Set(); const E = rlWildOutline(w).filter((e) => e.j >= 0 && !isWild(e.j)).map((e) => ({ e, L: Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1]) })).sort((a, b) => b.L - a.L);
    for (const { e, L } of E) { if (seen.has(e.j) || seen.size >= ${k}) continue; seen.add(e.j); const [ax, ay] = e.a, [bx, by] = e.b; let nx = -(by - ay) / L, ny = (bx - ax) / L; if (provinceAt((ax + bx) / 2 + nx * 3, (ay + by) / 2 + ny * 3) !== e.j) { nx = -nx; ny = -ny; }
      const [sx, sy] = toScreen((ax + bx) / 2, (ay + by) / 2); res.push({ wild: w.id, nb: names[e.j], nbT: terr[e.j], at: [r.left + sx, r.top + sy], n: [nx, ny], Dpx: cam.s * MED_DIAM }); } } return res; })()`);
  const hov = () => mev(p, 'hoverProv >= 0 ? (isWild(hoverProv) ? "WILD" : names[hoverProv]) : null');
  const tipText = () => mev(p, `(tips.length ? tips[0].el.textContent : '') + ' || label: ' + (cursorLbl.classList.contains('show') ? cursorLbl.textContent : '')`);
  for (const [zn, src] of [['start', null], ['mid', 'm.setScale(1.0, 640, 480)'], ['near', 'm.setScale(m.maxScale() * 0.55, 560, 230)']]) {
    if (src) await ev(p, src); await p.waitForTimeout(2000);
    for (const q of await edges(4)) {
      const inV = await p.evaluate(([x, y]) => x > 20 && y > 120 && x < 1330 && y < 730, q.at); if (!inV) continue;
      await p.mouse.move(720, 895); await p.waitForTimeout(120); const seq = [];
      for (let o = -10; o <= 10; o++) { await p.mouse.move(q.at[0] + q.n[0] * o, q.at[1] + q.n[1] * o); await p.waitForTimeout(25); seq.push([o, await hov()]); }
      const flip = seq.find(([o, h], k) => k > 0 && h !== seq[k - 1][1]); out.cross.push({ zn, wild: q.wild, nb: q.nb, nbT: q.nbT, flipAtPx: flip ? flip[0] : null, firstInside: seq[0][1], lastOutside: seq[seq.length - 1][1] });
    }
    // tooltip just inside each wild, no selection, then with the army selected (cursor label)
    for (const sel of [false, true]) {
      if (sel) { await mev(p, "selectCmd('varo')"); await p.waitForTimeout(300); }
      const done = new Set();
      for (const q of await edges(1)) { if (done.has(q.wild)) continue; done.add(q.wild); const x = q.at[0] - q.n[0] * 8, y = q.at[1] - q.n[1] * 8; const inV = x > 20 && y > 120 && x < 1330 && y < 730; if (!inV) continue;
        await p.mouse.move(720, 895); await p.waitForTimeout(200); await p.mouse.move(x, y, { steps: 4 }); await p.waitForTimeout(1000); const t = await tipText(); out.tips.push({ zn, sel, wild: q.wild, hover: await hov(), tip: t.replace(/\s+/g, ' ').slice(0, 110) });
        if (zn !== 'mid') await shot(`hover-${zn}-${q.wild}${sel ? '-army' : ''}`); }
      if (sel) { await p.keyboard.press('Escape'); await p.waitForTimeout(200); }
    }
    // a neighbour hovered just outside the wild's longest edge (its tint should stop at the line)
    const nq = (await edges(1)); for (const q of nq) { const x = q.at[0] + q.n[0] * 10, y = q.at[1] + q.n[1] * 10; if (!(x > 20 && y > 120 && x < 1330 && y < 730)) continue; await p.mouse.move(720, 895); await p.waitForTimeout(150); await p.mouse.move(x, y, { steps: 4 }); await p.waitForTimeout(1100); if (zn !== 'mid') await shot(`hovnb-${zn}-${q.wild}-${q.nb}`); }
  }
  // orders whose path goes around a wild, at the start view and Mid: is the drawn thread over the wild?
  await mev(p, 'fit(); draw()'); await p.waitForTimeout(1500);
  const cands = await mev(p, `(() => { const c = cmd.varo, res = []; for (const i of provList) { if (isWild(i) || i === c.at) continue; const d = pathTo(c.at, i); if (!d) continue; const bw = barrierOnLine(c.at, i); if (bw) res.push({ i, name: names[i], wild: bw.id, days: d.days, hops: d.path.length }); } return res.sort((a, b) => a.hops - b.hops); })()`);
  const picks = []; for (const w of ['ashspine', 'greyteeth', 'stillmere']) { const c = cands.filter((q) => q.wild === w).slice(0, 2); picks.push(...c); }
  for (const [zn, src] of [['start', null], ['mid', 'm.setScale(1.0, 640, 420)']]) {
    if (src) await ev(p, src); else await mev(p, 'fit(); draw()'); await p.waitForTimeout(1500);
    for (const q of picks) {
      await p.keyboard.press('Escape'); await mev(p, 'moveLine = null; RCK = null; draw()'); await mev(p, "selectCmd('varo')"); await p.waitForTimeout(400);
      await mev(p, `(() => { RCK = null; draw(); window.__jb = ctx.getImageData(0, 0, canvas.width, canvas.height).data.slice(); return 1; })()`);
      const r = await mev(p, `(() => { const c = cmd.varo; const d = pathTo(c.at, ${q.i}); const bw = barrierOnLine(c.at, ${q.i}); moveLine = { from: c.at, path: d.path, days: d.days, around: bw ? theName(bw) : null }; RCK = null; draw();
        const W2 = canvas.width, H2 = canvas.height, a = ctx.getImageData(0, 0, W2, H2).data, B = window.__jb; let n = 0, w = 0;
        for (let k = 0; k < W2 * H2; k++) { const o = k * 4; if (Math.abs(a[o] - B[o]) + Math.abs(a[o + 1] - B[o + 1]) + Math.abs(a[o + 2] - B[o + 2]) < 40) continue; const X = k % W2, Y = Math.floor(k / W2); const [x, y] = toWorld((X + 0.5) / dpr, (Y + 0.5) / dpr); if (!inModel(x, y)) continue; const i = provinceAt(x, y); n++; if (isWild(i)) w++; }
        return { path: d.path.map((v) => names[v]), crossesWild: d.path.some((v) => isWild(v)), n, w }; })()`);
      const res = { n: r.n, w: r.w };
      out.orders.push({ zn, to: q.name, around: q.wild, path: r.path, crossesWildInSim: r.crossesWild, threadPx: res.n, threadPxOverWild: res.w });
      await shot(`order-${zn}-${q.name}`);
    }
  }
  await p.keyboard.press('Escape');
  fs.writeFileSync(`${ME}out/interact-${build}.json`, JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out.cross.filter((c) => c.flipAtPx !== 0 && c.flipAtPx !== 1 && c.flipAtPx !== -1).slice(0, 8)));
  console.log(build, 'cross', out.cross.length, 'tips', out.tips.length, 'orders', out.orders.length, 'pageErrors', log.pageErrors.length, JSON.stringify(log.pageErrors.slice(0, 2)));
  await b.close();
})();
