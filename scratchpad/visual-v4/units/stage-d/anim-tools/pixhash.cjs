// Pixel hashes of the battle mockup at fixed story times (refactor guard: a pure split must not change one pixel).
//   node pixhash.cjs PAGE_OR_URL OUT.json [--step 1.25] [--w 1280 --h 720] [--fig procedural]
const fs = require('fs');
const { launch, openPage } = require('./lib.cjs');
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
(async () => {
  const browser = await launch();
  const q = '?paused=1' + (opt('fig', '') === 'procedural' ? '&fig=procedural' : '');
  const { page, errors } = await openPage(browser, a[0], q, { w: +opt('w', 1280), h: +opt('h', 720) });
  const r = await page.evaluate(async (step) => {
    const G = window.__battle.game, out = {};
    if (window.__battle.loaded) await window.__battle.loaded;
    const hashCanvas = () => {
      const gl = G.app.renderer.gl, W = G.app.canvas.width, H = G.app.canvas.height, px = new Uint8Array(W * H * 4);
      gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
      let h = 0x811c9dc5; for (let i = 0; i < px.length; i += 1) { h ^= px[i]; h = Math.imul(h, 0x01000193); }
      return (h >>> 0).toString(16);
    };
    for (const b of DATA) {
      G.load(b.key); G.playing = false;
      await new Promise((ok) => setTimeout(ok, 300)); // the deferred tier H bake
      const T = G.stage.T, list = [];
      for (const speed of [1, 4]) {
        G.speed = speed; G.camSpeed = speed; G.cam = G.camFor(speed); G.camFade = null;
        for (let t = 0.1; t < T.duration; t += step) { G.seek(t); list.push([speed, +t.toFixed(2), hashCanvas()]); }
      }
      G.speed = 1;
      out[b.key] = list;
    }
    return { out, errors: window.__errors.slice() };
  }, +opt('step', 1.25));
  r.consoleErrors = errors;
  fs.writeFileSync(a[1], JSON.stringify(r));
  const n = Object.values(r.out).reduce((s, l) => s + l.length, 0);
  console.log('frames', n, 'errors', r.errors.length, errors.length);
  if (opt('cmp', null)) {
    const o = JSON.parse(fs.readFileSync(opt('cmp'))).out;
    let diff = 0, tot = 0; const first = [];
    for (const k of Object.keys(r.out)) r.out[k].forEach((x, i) => { tot++; const y = (o[k] || [])[i]; if (!y || y[2] !== x[2]) { diff++; if (first.length < 12) first.push([k, ...x]); } });
    console.log('compared', tot, 'differ', diff, JSON.stringify(first));
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
