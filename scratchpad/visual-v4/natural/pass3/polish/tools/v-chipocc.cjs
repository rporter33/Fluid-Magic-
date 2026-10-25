// day chips hidden by army pieces, on the screen as shown: each chip's box screenshotted with the pieces layer (#layer) shown and hidden; the share of its
// pixels that differ is the share the pieces cover. node chipocc.cjs <w> <h>
const { launch, open, ev, mev, PAGE, OUT, SHOTS } = require('./lib.cjs'); const fs = require('fs'); const { PNG } = (() => { try { return require('/opt/node22/lib/node_modules/playwright-core/node_modules/pngjs'); } catch (e) { return { PNG: null }; } })();
const W = Number(process.argv[2] || 1440), H = Number(process.argv[3] || 900);
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, rows = [];
  const p = await open(b, PAGE, { log, w: W, h: H, settle: 1500 }); await p.mouse.move(W / 2, 10);
  const geo = await mev(p, '({ fit: fitScale, min: minScale, start: cam.s, phone: app.classList.contains("phone") })'); console.log(W + 'x' + H, JSON.stringify(geo));
  const measure = async (tag) => {
    await p.waitForTimeout(600); const cr = await p.evaluate(() => { const r = document.getElementById('map').getBoundingClientRect(); return [r.left, r.top]; });
    const chips = await mev(p, 'RL_CHIPS.map((c) => ({ t: c.text, b: c.box }))');
    for (const c of chips) {
      const clip = { x: Math.max(0, cr[0] + c.b[0]), y: Math.max(0, cr[1] + c.b[1]), width: Math.max(1, c.b[2] - c.b[0]), height: Math.max(1, c.b[3] - c.b[1]) };
      if (clip.x + clip.width > W || clip.y + clip.height > H) { rows.push({ tag, t: c.t, offscreen: true }); continue; }
      const a = await p.screenshot({ clip }); await p.evaluate(() => { document.getElementById('layer').style.visibility = 'hidden'; }); await p.waitForTimeout(80);
      const z = await p.screenshot({ clip }); await p.evaluate(() => { document.getElementById('layer').style.visibility = ''; }); await p.waitForTimeout(80);
      const nm = `${OUT}chipocc/${W}x${H}-${tag}-${rows.length}`; fs.mkdirSync(OUT + 'chipocc', { recursive: true }); fs.writeFileSync(nm + '-on.png', a); fs.writeFileSync(nm + '-off.png', z); let share = null; if (PNG) { const A = PNG.sync.read(a), Z = PNG.sync.read(z); let n = 0, d = 0; for (let k = 0; k < A.data.length; k += 4) { n++; if (Math.abs(A.data[k] - Z.data[k]) + Math.abs(A.data[k + 1] - Z.data[k + 1]) + Math.abs(A.data[k + 2] - Z.data[k + 2]) > 24) d++; } share = +(d / n).toFixed(3); } else share = a.equals(z) ? 0 : nm;
      rows.push({ tag, t: c.t, box: c.b.map((q) => Math.round(q)), coveredShare: share }); console.log(tag, 'chip', c.t, 'box', c.b.map((q) => Math.round(q)).join(','), 'covered by pieces', share);
    }
    const tl = await mev(p, 'RL_CHIPS.length ? RL_CHIPS.map((c) => c.box).reduce((a, q) => [Math.min(a[0], q[0]), Math.min(a[1], q[1]), Math.max(a[2], q[2]), Math.max(a[3], q[3])]) : null');
    if (tl) await p.screenshot({ path: `${SHOTS}chipocc-${W}x${H}-${tag}.png`, clip: { x: Math.max(0, cr[0] + tl[0] - 50), y: Math.max(0, cr[1] + tl[1] - 50), width: Math.min(W - Math.max(0, cr[0] + tl[0] - 50), tl[2] - tl[0] + 100), height: Math.min(H - Math.max(0, cr[1] + tl[1] - 50), tl[3] - tl[1] + 100) } });
  };
  for (const [z, s] of [['start', geo.start], ['fit', geo.fit], ['min', geo.min]]) { await ev(p, `m.ev("fit(); draw()"); m.setScale(${s}, m.ev("W") / 2, m.ev("H") / 2)`); await measure('existing-' + z); }
  await ev(p, 'm.ev("fit(); draw()")'); await mev(p, "selectCmd('varo')"); const t = await ev(p, 'm.across()'); const [x, y] = await ev(p, `m.at(${JSON.stringify(t)})`); await p.mouse.click(x, y + 8, { button: 'right' }); await p.waitForTimeout(700); await p.mouse.move(W / 2, 10);
  for (const [z, s] of [['start', geo.start], ['fit', geo.fit], ['min', geo.min]]) { await ev(p, `m.setScale(${s}, m.ev("W") / 2, m.ev("H") / 2)`); await measure('across-' + z); }
  fs.writeFileSync(`${OUT}chipocc-${W}x${H}.json`, JSON.stringify({ geo, rows }, null, 1)); console.log('pageErrors', log.pageErrors.length); await b.close();
})();
