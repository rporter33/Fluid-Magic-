// the verifier's own shots: node vshots.cjs  ->  verify-rules/V-*.png
const { launch, open, ev, mev, PAGE, SHOTS } = require('./lib.cjs'); const fs = require('fs');
(async () => {
  const b = await launch(); const log = { pageErrors: [], console: [], requests: [] }, meta = {};
  const shoot = async (p, nm, wait = 1400) => { await p.waitForTimeout(wait); await p.screenshot({ path: `${SHOTS}V-${nm}.png` }); meta[nm] = await ev(p, '({ band: m.band(), Dpx: +(m.scale() * m.ev("MED_DIAM")).toFixed(1), look: m.look().shown, mode: m.ev("state.mode"), hover: m.ev("hoverProv >= 0 ? names[hoverProv] : null"), sel: m.ev("state.sel ? JSON.stringify(state.sel) : null") })').catch(() => null); };
  const wildsOf = (p) => mev(p, 'WILDS.map((w) => { let x = 0, y = 0; for (const c of w.cells) { x += cent[c][0]; y += cent[c][1]; } return [w.name.replace("The ", "").replace(" ", ""), x / w.cells.length, y / w.cells.length, w.cells]; })');
  const spotBeside = (p, wi) => mev(p, `(() => { const w = WILDS[${wi}], r = canvas.getBoundingClientRect(), vv = viewRect(); let best = null; for (const e of rlWildOutline(w)) { if (isWild(e.j)) continue; const [ax, ay] = toScreen(...e.a), [bx, by] = toScreen(...e.b), Lg = Math.hypot(bx - ax, by - ay); if (Lg < 30) continue; let nx = -(by - ay) / Lg, ny = (bx - ax) / Lg; const mx = (ax + bx) / 2, my = (ay + by) / 2; if (provinceAt(...toWorld(mx + nx * 8, my + ny * 8)) !== e.j) { nx = -nx; ny = -ny; } const x = mx + nx * 22, y = my + ny * 22; if (x < vv.l + 40 || x > vv.r - 40 || y < vv.t + 40 || y > vv.b - 40) continue; const el = document.elementFromPoint(r.left + x, r.top + y); if (el && el.id === 'map' && provinceAt(...toWorld(x, y)) === e.j && (!best || Lg > best[3])) best = [r.left + x, r.top + y, names[e.j], Lg]; } return best; })()`);
  { const p = await open(b, PAGE, { log, settle: 1500 }); await p.mouse.move(720, 897); const Wd = await wildsOf(p); meta.wilds = Wd;
    await shoot(p, '01-nat-start');
    await ev(p, 'm.setScale(m.minScale(), 800, 500)'); await shoot(p, '02-nat-least');
    await ev(p, `m.setScale(60 / m.ev('MED_DIAM'), 800, 500)`); await shoot(p, '03-nat-far60');
    for (const [nm, x, y] of Wd) { await ev(p, `m.setScale(1.0, ${x}, ${y})`); await shoot(p, `04-nat-mid-${nm}`); }
    for (const [nm, x, y] of Wd) { await ev(p, `m.setScale(m.maxScale() * 0.55, ${x}, ${y})`); await shoot(p, `05-nat-near-${nm}`); }
    for (const [nm, x, y] of Wd) { await ev(p, `m.setScale(m.maxScale(), ${x}, ${y})`); await shoot(p, `06-nat-max-${nm}`); }
    for (const [k, [nm, x, y]] of Wd.entries()) { await ev(p, `m.setScale(1.0, ${x}, ${y})`); await p.waitForTimeout(900); const s = await spotBeside(p, k); if (!s) continue; await p.mouse.move(s[0], s[1], { steps: 3 }); await shoot(p, `07-nat-hover-beside-${nm}-${s[2]}`, 900);
      await p.mouse.click(s[0], s[1]); await p.mouse.move(720, 897); await shoot(p, `08-nat-select-beside-${nm}-${s[2]}`, 900); await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); await p.mouse.move(720, 897); }
    await ev(p, 'm.ev("fit(); RCK = null; draw()")'); await p.waitForTimeout(800); await mev(p, "selectCmd('varo')"); await p.waitForTimeout(500); const xy = await p.evaluate(() => window.__mock.wildAt('ashspine')); await p.mouse.move(xy[0], xy[1], { steps: 3 }); await p.waitForTimeout(700); await p.mouse.click(xy[0], xy[1], { button: 'right' }); await shoot(p, '09-nat-path-refused-ashspine', 500);
    meta.toast = await p.evaluate(() => document.querySelector('#toasts') ? document.querySelector('#toasts').textContent.slice(0, 200) : null); meta.tip = await p.evaluate(() => document.querySelector('.tip') ? document.querySelector('.tip').textContent.slice(0, 200) : null);
    await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); await p.mouse.move(720, 897);
    await ev(p, 'm.ev("fit(); RCK = null; draw()"); m.setMonth(70)'); await shoot(p, '10-nat-m70-start');
    await ev(p, 'm.setMonth(3)'); await mev(p, "setMode('supply')"); await shoot(p, '11-mode-supply-start');
    await ev(p, `m.setScale(1.0, ${Wd[0][1]}, ${Wd[0][2]})`); await shoot(p, '12-mode-supply-mid-Ashspine');
    await mev(p, "setMode('terrain')"); await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 300000, polling: 300 }); await ev(p, 'm.ev("fit(); RCK = null; draw()")'); await shoot(p, '13-mode-terrain-start');
    await ev(p, `m.setScale(m.maxScale() * 0.55, ${Wd[2][1]}, ${Wd[2][2]})`); await shoot(p, '14-mode-terrain-near-Greyteeth');
    await p.context().close(); }
  { const p = await open(b, PAGE, { log, settle: 1500, q: '?terrain=clear' }); await p.mouse.move(720, 897); const Wd = await wildsOf(p); await shoot(p, '15-clear-start'); await ev(p, `m.setScale(1.0, ${Wd[0][1]}, ${Wd[0][2]})`); await shoot(p, '16-clear-mid-Ashspine');
    await ev(p, `m.setScale(m.maxScale() * 0.55, ${Wd[1][1]}, ${Wd[1][2]})`); await shoot(p, '17-clear-near-StillMere'); const s = await spotBeside(p, 1); if (s) { await p.mouse.move(s[0], s[1], { steps: 3 }); await shoot(p, '18-clear-hover-beside-StillMere-' + s[2], 900); } await p.context().close(); }
  { const p = await open(b, PAGE, { log, settle: 1500, dpr: 2 }); await p.mouse.move(720, 897); const Wd = await wildsOf(p); await shoot(p, '19-dpr2-start'); await ev(p, `m.setScale(1.0, ${Wd[0][1]}, ${Wd[0][2]})`); await shoot(p, '20-dpr2-mid-Ashspine');
    await ev(p, `m.setScale(m.maxScale(), ${Wd[2][1]}, ${Wd[2][2]})`); await shoot(p, '21-dpr2-max-Greyteeth'); await ev(p, `m.setScale(m.maxScale() * 0.55, ${Wd[1][1]}, ${Wd[1][2]})`); await shoot(p, '22-dpr2-near-StillMere'); await p.context().close(); }
  { const p = await open(b, PAGE, { log, settle: 1500, w: 390, h: 844, dpr: 3 }); await p.mouse.move(195, 840); await shoot(p, '23-phone-start'); await ev(p, 'm.ev("fit(); RCK = null; draw()")'); await shoot(p, '24-phone-fit'); await p.context().close(); }
  { const p = await open(b, PAGE, { log, settle: 1500, w: 1280, h: 720 }); await p.mouse.move(640, 717); await shoot(p, '25-1280-start'); await p.context().close(); }
  { const p = await open(b, PAGE, { log, settle: 3500, q: '?look=v3', wait: false }); await p.waitForFunction(() => window.__mock && !window.__mock.relief(), null, { timeout: 60000 }); await p.mouse.move(720, 897); await shoot(p, '26-v3-start', 3000); await p.context().close(); }
  fs.writeFileSync(SHOTS + 'V-meta.json', JSON.stringify(meta, null, 1)); console.log(JSON.stringify(meta).slice(0, 2000));
  console.log('pageErrors', log.pageErrors.length, JSON.stringify(log.pageErrors.slice(0, 3))); await b.close();
})();
