const { launch, open, ev, mev, PAGE, SHOTS } = require('./lib.cjs');
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, settle: 1200 }); await p.mouse.move(700, 895);
  await p.keyboard.down('Shift'); await p.keyboard.press('Digit7'); await p.keyboard.up('Shift'); await p.waitForTimeout(150);
  const prep = await p.evaluate(() => ({ tprep: document.querySelector('#modes .tprep')?.textContent ?? null, legend: [...document.querySelectorAll('#modes .tlegend .tl')].map((e) => e.textContent).join(','), useBtn: !!document.getElementById('useClear') }));
  await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 240000, polling: 300 }); await p.waitForTimeout(800);
  const after = await p.evaluate(() => ({ tprep: document.querySelector('#modes .tprep')?.textContent ?? null, shown: window.__mock.look().shown }));
  await p.screenshot({ path: SHOTS + 'terrain-mode-legend.png' });
  await p.click('#useClear'); await p.waitForTimeout(600); const t1 = await ev(p, '({ terrain: m.ev("view.terrain"), mode: m.ev("state.mode"), note: document.querySelector("#modes .tnote")?.textContent ?? null })');
  await mev(p, "setMode('ownership')"); await p.waitForTimeout(800); const t2 = await ev(p, '({ shown: m.look().shown, terrain: m.ev("view.terrain") })');
  await ev(p, 'm.setView("terrain", "natural")'); await p.waitForTimeout(800); const t3 = await ev(p, '({ shown: m.look().shown })');
  await ev(p, 'm.setScale(m.maxScale() * 0.9, 420, 520)'); await p.waitForTimeout(800); const nd1 = await ev(p, 'm.reliefNearDetail()'); await ev(p, 'm.setView("detail", "reduced")'); await p.waitForTimeout(800); const nd2 = await ev(p, 'm.reliefNearDetail()');
  console.log(JSON.stringify({ prep, after, t1, t2, t3, nearDetailFull: nd1, nearDetailReduced: nd2, pageErrors: log.pageErrors }));
  await b.close();
})();
