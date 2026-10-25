const { launch, open, ev, mev, page } = require('./lib.cjs');
(async () => { const b = await launch(); const p = await open(b, page('p2'), { settle: 800, reducedMotion: 'reduce' });
  console.log(JSON.stringify(await mev(p, `(() => { const r = canvas.getBoundingClientRect(); const w = WILDS.find((w) => w.kind === 'mere'); let x = 0, y = 0; for (const c of w.cells) { x += cent[c][0]; y += cent[c][1]; } x /= w.cells.length; y /= w.cells.length; return { r: [r.left, r.top, r.width, r.height], cw: canvas.width, ch: canvas.height, W, H, dpr, mere: toScreen(x, y), cam: [cam.x, cam.y, cam.s] }; })()`)));
  await b.close(); })();
