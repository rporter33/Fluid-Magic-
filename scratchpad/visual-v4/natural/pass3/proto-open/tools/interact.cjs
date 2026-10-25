// impassability without the frame: the real pointer over the spill (outside the cells: the neighbour province, no "Impassable"), just inside the cells (the cursor label, the
// card), right-click into the wild (refused) and into the spill (a path that never enters a wild); at the start view and Near: node interact.cjs
const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const fs = require('fs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, process.env.PAGEFILE || PAGE, { log, settle: 1500 }); const out = [];
  const pts = (off) => mev(p, `(() => { const r = canvas.getBoundingClientRect(), res = []; const w = WILDS.find((q) => q.id === 'ashspine');
    for (const e of rlWildOutline(w)) { if (!['Halevale', 'Karreach', 'Ashvale', 'Morholt', 'Stagmoor', 'Redbarrow'].includes(names[e.j])) continue; const [ax, ay] = e.a, [bx, by] = e.b, L = Math.hypot(bx - ax, by - ay); let nx = -(by - ay) / L, ny = (bx - ax) / L; if (provinceAt((ax + bx) / 2 + nx * 3, (ay + by) / 2 + ny * 3) !== e.j) { nx = -nx; ny = -ny; }
      const x = (ax + bx) / 2 + nx * ${off} * RLD, y = (ay + by) / 2 + ny * ${off} * RLD, [sx, sy] = toScreen(x, y); const k = Math.floor(y * RB.TX) * RB.BW + Math.floor(x * RB.TX); res.push({ nb: names[e.j], at: [r.left + sx, r.top + sy], world: [x, y], spill: RB.spill.mask[k] || 0 }); } return res; })()`);
  const tipText = () => mev(p, `(tips.length ? tips[0].el.textContent : '') + ' || label: ' + (cursorLbl.classList.contains('show') ? cursorLbl.textContent : '')`);
  for (const [zn, src] of [['start', null], ['near', 'm.setScale(m.maxScale() * 0.55, 560, 230)']]) { if (src) await ev(p, src); await p.waitForTimeout(1500);
    await mev(p, "selectCmd('varo')"); await p.waitForTimeout(300);
    for (const [kind, off] of [['spill', 0.06], ['inside', -0.06]]) for (const q of await pts(off)) {
      await p.mouse.move(720, 895); await p.waitForTimeout(150); await p.mouse.move(q.at[0], q.at[1], { steps: 4 }); await p.waitForTimeout(900);
      const hv = await mev(p, 'hoverProv >= 0 ? names[hoverProv] + ":" + terr[hoverProv] + (isWild(hoverProv) ? ":wild" : "") : null'), t = await tipText();
      out.push({ zn, kind, nb: q.nb, spillTexel: q.spill, hover: hv, card: /· Impassable/.test(t), cursorLabel: /label: ✕ Impassable/.test(t), tip: t.replace(/\s+/g, ' ').slice(0, 120) }); }
    // right-click into the wild (refused) and into the spill of Halevale (ordered; the path avoids every wild)
    const inW = (await pts(-0.08))[0], inS = (await pts(0.06)).find((q) => q.nb === 'Halevale');
    await p.mouse.click(inW.at[0], inW.at[1], { button: 'right' }); await p.waitForTimeout(500); const t1 = await mev(p, '[...document.querySelectorAll(".toast")].map((e) => e.textContent).slice(-1)[0]');
    const mv = []; for (const q of (await pts(0.06)).filter((q) => q.spill)) { await p.keyboard.press('Escape'); await mev(p, "selectCmd('varo')"); await p.waitForTimeout(200);
      mv.push(await mev(p, `(() => { const r = canvas.getBoundingClientRect(); orderMove(${q.at[0]}, ${q.at[1]}); return { into: '${q.nb}', ordered: !!moveLine, to: moveLine ? names[moveLine.path[moveLine.path.length - 1]] : null, days: moveLine ? moveLine.days : null, crossesWild: moveLine ? moveLine.path.some((i) => isWild(i)) : null, around: moveLine ? moveLine.around : null, toast: [...document.querySelectorAll('.toast')].map((e) => e.textContent).slice(-1)[0] }; })()`)); }
    out.push({ zn, rightClickWild: t1, rightClickSpill: mv }); await p.keyboard.press('Escape'); }
  for (const r of out) console.log(JSON.stringify(r)); fs.writeFileSync(OUT + 'interact.json', JSON.stringify(out, null, 1)); console.log('pageErrors', log.pageErrors.length); await b.close(); })();
