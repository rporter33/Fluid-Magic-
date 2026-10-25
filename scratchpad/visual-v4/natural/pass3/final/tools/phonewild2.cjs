// the phone at its least zoom (Fit): each wild hovered and right-clicked with Varo selected; the card, the hover and the toast
const { launch, open, ev, mev, PAGE, SHOTS } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, w: 390, h: 844, dpr: 3, settle: 1500 }); await p.mouse.move(195, 840);
  await ev(p, 'm.setScale(m.minScale(), 800, 500)'); await p.waitForTimeout(1200);
  await p.evaluate(() => { window.__toasts = []; new MutationObserver(() => { const t = document.querySelector('#toasts'); if (t && t.firstElementChild) window.__toasts.push(t.firstElementChild.textContent.slice(0, 100)); }).observe(document.getElementById('toasts'), { childList: true }); });
  for (const id of await mev(p, 'WILDS.map((w) => w.id)')) { await p.keyboard.press('Escape'); await mev(p, "selectCmd('varo')"); const [x, y] = await p.evaluate((id) => window.__mock.wildAt(id), id);
    await p.mouse.move(x, y, { steps: 3 }); await p.waitForTimeout(700); const hv = await mev(p, 'hoverProv >= 0 ? [names[hoverProv], !!isWild(hoverProv)] : null'); const tip = await p.evaluate(() => document.querySelector('.tip')?.textContent?.slice(0, 80) ?? null);
    await p.mouse.click(x, y, { button: 'right' }); await p.waitForTimeout(600); const toast = await p.evaluate(() => window.__toasts.slice(-1)[0] ?? null); const ml = await mev(p, 'moveLine ? names[moveLine.path[moveLine.path.length - 1]] : null');
    console.log(id, JSON.stringify({ xy: [Math.round(x), Math.round(y)], hv, tip, toast, moveLine: ml })); }
  await p.screenshot({ path: `${SHOTS}V-phone-wilds-fit.png` }); console.log('pageErrors', log.pageErrors.length); await b.close(); })();
