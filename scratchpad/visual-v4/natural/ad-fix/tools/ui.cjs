// interaction shots: hover card, province card, Terrain mode, legend, numbers chips, Shift swatches, link hover, army card
const { launch, open, PAGE, SHOTS, realErrors } = require('./nlib2.cjs');
(async () => {
  const b = await launch(), errors = []; const p = await open(b, PAGE, { errors, settle: 1500 }); const m = (s) => p.evaluate((s) => { const m = window.__mock; return eval(s); }, s);
  const clip = { x: 16, y: 112, width: 1360, height: 625 };
  // 1. hover a province: the card names the terrain on its title line
  await m('m.setScale(1.0, 640, 480)'); await p.waitForTimeout(700);
  let [x, y] = await m(`m.at("Redholt")`); x -= 40; y -= 34; await p.mouse.move(x, y); await p.waitForTimeout(1300); await p.screenshot({ path: SHOTS + 'ui-hover-card.png' });
  const tipText = await p.evaluate(() => [...document.querySelectorAll('.tip')].map((t) => t.innerText).join(' | ')); console.log('tip:', tipText.slice(0, 300));
  // 2. the province card (click a province)
  await p.mouse.click(x, y); await p.waitForTimeout(900); await p.screenshot({ path: SHOTS + 'ui-province-card.png' });
  console.log('card:', await p.evaluate(() => document.querySelector('#leftDock .dockhead') ? document.querySelector('#leftDock .dockhead').innerText : '-'));
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  // 3. the Terrain mode: Shift+7, preparing, then ready
  await p.mouse.move(700, 800); await p.keyboard.down('Shift'); await p.keyboard.press('Digit7'); await p.keyboard.up('Shift'); await p.waitForTimeout(400);
  await p.screenshot({ path: SHOTS + 'ui-terrain-preparing.png' }); console.log('look while preparing', JSON.stringify(await m('m.look()')));
  await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 120000, polling: 300 }); await p.waitForTimeout(900);
  await p.screenshot({ path: SHOTS + 'mode-terrain.png' }); console.log('mode', await m('m.ev("state.mode")'), JSON.stringify(await m('m.look()')));
  // 4. the numbers layer in the Terrain mode: glyph chips
  await p.keyboard.press('Backquote'); await p.waitForTimeout(700); await p.screenshot({ path: SHOTS + 'mode-terrain-numbers.png' }); await p.keyboard.press('Backquote');
  // 5. hover in the Terrain mode
  [x, y] = await m(`m.at("Briardale")`); await p.mouse.move(x - 40, y - 34); await p.waitForTimeout(1300); await p.screenshot({ path: SHOTS + 'ui-hover-terrain-mode.png' });
  console.log('tip in terrain mode:', (await p.evaluate(() => [...document.querySelectorAll('.tip')].map((t) => t.innerText).join(' | '))).slice(0, 200));
  await p.mouse.move(700, 850); await p.keyboard.press('Escape');
  // 6. back to Ownership; Shift held with nothing selected: names with swatches (Natural)
  await m('m.ev("setMode(\'ownership\'); clearSel(); closeAll()")'); await p.mouse.move(700, 60); await p.waitForTimeout(600); await p.keyboard.down('Shift'); await p.waitForTimeout(700); await p.screenshot({ path: SHOTS + 'ui-shift-names.png' }); await p.keyboard.up('Shift');
  // 7. a link in the feed: the province lights up with its name and terrain
  await p.click('#railFeed'); await p.waitForTimeout(500); const link = await p.$('#msgs [data-go]'); if (link) { await link.hover(); await p.waitForTimeout(700); await p.screenshot({ path: SHOTS + 'ui-link-hover.png' }); console.log('link aria:', await link.getAttribute('aria-label')); }
  await p.click('#railFeed'); await p.waitForTimeout(300);
  // 8. the army card names its location's terrain
  await m('m.ev("selectCmd(\'varo\')")'); await p.waitForTimeout(500); const pa = await m('m.pieceAt("varo")'); if (pa) { await p.mouse.move(pa[0], pa[1]); await p.waitForTimeout(1300); await p.screenshot({ path: SHOTS + 'ui-army-card.png' }); console.log('army:', (await p.evaluate(() => [...document.querySelectorAll('.tip')].map((t) => t.innerText).join(' | '))).slice(0, 200)); }
  // 9. the Clear setting from the Terrain mode's legend link
  await p.mouse.move(700, 850); await m('m.ev("setMode(\'terrain\')")'); await p.waitForTimeout(500); await p.screenshot({ path: SHOTS + 'ui-terrain-legend.png', clip: { x: 1100, y: 300, width: 330, height: 440 } });
  const use = await p.$('#useClear'); if (use) { await use.click(); await p.waitForTimeout(400); } await m('m.ev("setMode(\'ownership\')")'); await p.waitForTimeout(900); await p.screenshot({ path: SHOTS + 'clear-after-use-link.png' }); console.log('after link', await m('m.ev("view.terrain")'));
  console.log('errors', JSON.stringify(realErrors(errors))); await b.close();
})();
