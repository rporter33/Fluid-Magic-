// the verifier's own final shots: node finalshots.cjs
const { launch, open, ev, mev, PAGE, SHOTS } = require('./lib.cjs');
(async () => {
  const b = await launch(); const log = { pageErrors: [], console: [], requests: [] };
  const shoot = async (p, nm) => { await p.waitForTimeout(1200); await p.screenshot({ path: `${SHOTS}F-${nm}.png` }); };
  { const p = await open(b, PAGE, { log, settle: 1500 }); await p.mouse.move(720, 20);
    await shoot(p, '01-natural-start');
    await ev(p, 'm.setScale(m.minScale(), 800, 500)'); await shoot(p, '02-natural-least-zoom');
    await ev(p, 'm.setScale(1.0, 640, 480)'); await shoot(p, '03-natural-mid');
    await ev(p, 'm.setScale(1.142, 700, 560)'); await shoot(p, '04-natural-ref');
    await ev(p, 'm.zoomTo(m.maxScale() * 0.75, "Halevale")'); await shoot(p, '05-natural-near-ashspine');
    await ev(p, 'm.zoomTo(m.maxScale(), "Elmwick")'); await ev(p, 'm.setScale(m.maxScale(), ...m.ev("cent[39]"))'); await shoot(p, '06-natural-max-mere');
    await ev(p, 'm.setScale(m.maxScale() * 0.9, ...m.ev("cent[37]"))'); await shoot(p, '07-natural-near-greyteeth');
    await ev(p, 'm.ev("fit(); draw()")'); await p.waitForTimeout(800);
    const [x, y] = await ev(p, 'm.at("Ashmoor")'); await p.mouse.move(x, y + 14, { steps: 3 }); await shoot(p, '08-natural-hover-ashmoor');
    await ev(p, 'm.setScale(1.0, 640, 480)'); await p.waitForTimeout(600); const [x2, y2] = await ev(p, 'm.at("Ashmoor")'); await p.mouse.move(x2, y2 + 14, { steps: 3 }); await shoot(p, '09-natural-mid-hover-ashmoor');
    await p.mouse.move(720, 20); await ev(p, 'm.ev("fit(); draw()")'); await p.waitForTimeout(500); const [x3, y3] = await ev(p, 'm.at("Deepmoss")'); await p.mouse.click(x3 - 30, y3 + 30); await p.mouse.move(720, 20); await shoot(p, '10-natural-select-deepmoss');
    await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); await mev(p, "setMode('supply')"); await shoot(p, '11-mode-supply');
    await mev(p, "setMode('terrain')"); await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 240000, polling: 300 }); await shoot(p, '12-mode-terrain');
    await mev(p, "setMode('ownership')"); await p.context().close(); }
  { const p = await open(b, PAGE, { log, settle: 1500, q: '?terrain=clear' }); await p.mouse.move(720, 20); await shoot(p, '13-clear-start'); await ev(p, 'm.setScale(m.minScale(), 800, 500)'); await shoot(p, '14-clear-least-zoom'); await p.context().close(); }
  { const p = await open(b, PAGE, { log, settle: 3000, q: '?look=v3', wait: false }); await p.waitForFunction(() => window.__mock && !window.__mock.relief(), null, { timeout: 60000 }); await p.mouse.move(720, 20); await shoot(p, '15-painted-v3-start'); await p.context().close(); }
  { const p = await open(b, PAGE, { log, settle: 1500, w: 390, h: 844 }); await p.mouse.move(195, 10); await shoot(p, '16-phone-start'); await ev(p, 'm.ev("fit(); draw()")'); await shoot(p, '17-phone-fit'); await p.context().close(); }
  { const p = await open(b, PAGE, { log, settle: 1500, w: 1280, h: 720 }); await p.mouse.move(640, 10); await shoot(p, '18-1280x720-start'); await p.context().close(); }
  { const p = await open(b, PAGE, { log, settle: 1500, w: 1920, h: 1080 }); await p.mouse.move(960, 10); await shoot(p, '19-1920x1080-start'); await ev(p, 'm.setScale(m.minScale(), 800, 500)'); await shoot(p, '20-1920x1080-least-zoom'); await p.context().close(); }
  { const p = await open(b, PAGE, { log, settle: 1500, dpr: 2 }); await p.mouse.move(720, 20); await ev(p, 'm.zoomTo(1.142, "Halevale")'); await shoot(p, '21-dpr2-ref-ashspine'); await p.context().close(); }
  console.log('pageErrors', log.pageErrors.length, JSON.stringify(log.pageErrors.slice(0, 3))); await b.close();
})();
