const out = {};
for (const [w, h, name] of [[390, 844, 'portrait'], [844, 390, 'landscape']]) {
  const page = await open(w, h, '', { dpr: 2, touch: true, mobile: true });
  for (const k of ['a', 'b', 'c']) {
    await page.evaluate((k) => window.__battle.load(k), k);
    const m = await page.evaluate(() => window.__battle.moments());
    for (const [mn, t] of [['clash', m.clash + 1], ['monster', m.monster], ['result', m.result]]) {
      await page.evaluate((t) => window.__battle.seek(t), t);
      await page.waitForTimeout(80);
      await page.screenshot({ path: `shots/p-${name}-${k}-${mn}.png` });
    }
    // HUD element rects and overlaps
    out[name + '-' + k] = await page.evaluate(() => {
      const ids = ['enemy', 'picker', 'transport', 'ticker', 'camctl', 'scrub', 'bar', 'namecards', 'result'];
      const R = {}; for (const id of ids) { const e = document.getElementById(id); const r = e.getBoundingClientRect(); if (r.width && r.height && getComputedStyle(e).display !== 'none') R[id] = [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]; }
      const ov = []; const keys = Object.keys(R);
      for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) { const a = R[keys[i]], b = R[keys[j]]; const ix = Math.min(a[2], b[2]) - Math.max(a[0], b[0]), iy = Math.min(a[3], b[3]) - Math.max(a[1], b[1]); if (ix > 2 && iy > 2) ov.push(keys[i] + '/' + keys[j] + ' ' + ix + 'x' + iy); }
      const bar = document.querySelector('#bar .cards'); const cardsOverflow = bar ? bar.scrollWidth - bar.clientWidth : 0;
      const tr = document.getElementById('transport').getBoundingClientRect(), en = document.getElementById('enemy').getBoundingClientRect();
      const res = document.getElementById('result'); const rr = res.getBoundingClientRect();
      const hScroll = document.documentElement.scrollWidth - window.innerWidth;
      const minFont = Math.min(...[...document.querySelectorAll('#hud *')].filter((e) => e.childNodes.length && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && e.getBoundingClientRect().width > 0).map((e) => parseFloat(getComputedStyle(e).fontSize)));
      const G = window.__battle.game; const z = G.curCam.z;
      return { rects: R, overlaps: ov, cardsOverflowPx: cardsOverflow, hScroll, minFont, figurePx: +(28 * z).toFixed(1), resultRect: [Math.round(rr.left), Math.round(rr.top), Math.round(rr.width), Math.round(rr.height)] };
    });
  }
  // tap a figure (touch): hover card on touch?
  await page.evaluate((t) => window.__battle.seek(t), 15);
  const pt = await page.evaluate(() => window.__battle.screenOf(5));
  if (pt) { await page.touchscreen.tap(pt.x, pt.y); await page.waitForTimeout(200); }
  out[name + '-tap'] = await page.evaluate(() => ({ selected: window.__battle.game.view.selected, hover: window.__battle.game.view.hover, card: document.getElementById('hover').classList.contains('show'), rect: (() => { const r = document.getElementById('hover').getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]; })() }));
  await page.screenshot({ path: `shots/p-${name}-tap.png` });
}
return out;
