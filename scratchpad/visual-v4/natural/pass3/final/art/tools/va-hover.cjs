// hover and select beside the wilds, and the refused path: node hover.cjs
const { launch, open, ev, mev, PAGE, SHOTS } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [] }; const p = await open(b, PAGE, { log, settle: 2000 }); await p.mouse.move(720, 896);
  const shot = async (n) => { await p.waitForTimeout(1500); await p.screenshot({ path: `${SHOTS}p3-${n}.png` }); console.log('shot', n); };
  await ev(p, 'm.setScale(1.0, 491.96, 239.47)'); await shot('50-mid-ash-rest');
  for (const nm of ['Halevale', 'Ashmoor']) { const [x, y] = await ev(p, `m.at(${JSON.stringify(nm)})`); await p.mouse.move(x + 20, y + 30, { steps: 4 }); await shot('51-mid-ash-hover-' + nm); }
  await p.mouse.move(720, 896); const [hx, hy] = await ev(p, 'm.at("Halevale")'); await p.mouse.click(hx + 20, hy + 30); await p.mouse.move(720, 896); await shot('52-mid-ash-select-Halevale');
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  await ev(p, 'm.setScale(1.0, 780, 640)'); await shot('53-mid-grey-rest');
  const nb = await mev(p, 'names.filter((n, i) => EDGE && [...EDGE.values()].some((e) => (e.i === i && isWild(e.j)) || (e.j === i && isWild(e.i))))');
  console.log('wild neighbours', JSON.stringify(nb));
  for (const nm of nb.filter((n) => n).slice(0, 12)) { const [x, y] = await ev(p, `m.at(${JSON.stringify(nm)})`); if (x < 30 || y < 130 || x > 1300 || y > 720) continue; await p.mouse.move(x + 6, y + 26, { steps: 3 }); await shot('54-mid-grey-hover-' + nm); }
  console.log('pageErrors', log.pageErrors.length, JSON.stringify(log.pageErrors.slice(0, 2))); await b.close(); })();
