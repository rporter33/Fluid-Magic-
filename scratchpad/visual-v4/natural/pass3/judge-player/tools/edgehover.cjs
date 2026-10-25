// node edgehover.cjs <build>  at Near over the Ashspine: hover Halevale and Morholt just outside the line, and (army selected) just inside it
const { launch, open, ev, mev, ME } = require('./lib.cjs'); const fs = require('fs');
const build = process.argv[2];
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [] }; const p = await open(b, build, { log }); const out = [];
  await ev(p, 'm.setScale(m.maxScale() * 0.55, 560, 230)'); await p.waitForTimeout(2200);
  const pt = (nb, off) => mev(p, `(() => { const r = canvas.getBoundingClientRect(), w = WILDS.find((q) => q.id === 'ashspine'); let best = null; for (const e of rlWildOutline(w)) { if (names[e.j] !== '${nb}') continue; const L = Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1]); if (!best || L > best.L) best = { e, L }; }
    const { e } = best, [ax, ay] = e.a, [bx, by] = e.b, L = best.L; let nx = -(by - ay) / L, ny = (bx - ax) / L; if (provinceAt((ax + bx) / 2 + nx * 3, (ay + by) / 2 + ny * 3) !== e.j) { nx = -nx; ny = -ny; } const [sx, sy] = toScreen((ax + bx) / 2, (ay + by) / 2); return [r.left + sx + nx * ${off}, r.top + sy + ny * ${off}]; })()`);
  for (const [nm, nb, off, sel] of [['eh-halevale-out', 'Halevale', 14, false], ['eh-halevale-in-army', 'Halevale', -14, true], ['eh-morholt-out', 'Morholt', 14, false], ['eh-morholt-in-army', 'Morholt', -14, true]]) {
    if (sel) { await mev(p, "selectCmd('varo')"); await p.waitForTimeout(300); } else { await p.keyboard.press('Escape'); await p.waitForTimeout(200); }
    const [x, y] = await pt(nb, off); await p.mouse.move(720, 895); await p.waitForTimeout(200); await p.mouse.move(x, y, { steps: 5 }); await p.waitForTimeout(1300);
    const info = await mev(p, `({ hover: hoverProv >= 0 ? (isWild(hoverProv) ? 'WILD ' + wildOf[hoverProv].name : names[hoverProv] + ' · ' + terr[hoverProv]) : null, label: cursorLbl.classList.contains('show') ? cursorLbl.textContent : '', tip: tips.length ? tips[0].el.textContent.slice(0, 60) : '' })`);
    out.push({ nm, at: [Math.round(x), Math.round(y)], ...info }); await p.screenshot({ path: `${ME}shots/${build}-${nm}.png` });
  }
  fs.writeFileSync(`${ME}out/edgehover-${build}.json`, JSON.stringify(out, null, 1)); for (const o of out) console.log(build, JSON.stringify(o));
  console.log(build, 'pageErrors', log.pageErrors.length); await b.close();
})();
