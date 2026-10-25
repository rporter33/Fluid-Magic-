const page = await open(1920, 1080, '?paused=1');
const out = [];
for (const k of ['a', 'c']) for (const z of [72]) out.push(await page.evaluate(async ([k, f]) => {
  const G = window.__battle.game; G.load(k); G.playing = false;
  const m = G.moments(); let t = m.clash - 0.5;
  const T = G.stage.T, gi = T.G.find((q) => !q.g.isCmd && q.g.size < 3 && q.g.side === G.stage.B.nearSide).idx;
  const h = G.stage.hull(T.G[gi], t);
  G.follow = false; G.user = { cx: h.X, cy: h.Y, z: f / 28 };
  const t0b = performance.now(); G.render(t); const firstH = performance.now() - t0b; // includes the tier H bake
  const gl = G.app.renderer.gl, px = new Uint8Array(4), up = [], rd = [], gp = [];
  for (let i = 0; i < 130; i++) {
    t += 1 / 60;
    const a = performance.now(); G.applyCamera(t); G.stage.frame(t, 1, G.view); G.hud.update(t);
    const b = performance.now(); G.app.renderer.render(G.app.stage); const c = performance.now();
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); const d = performance.now();
    if (i >= 10) { up.push(b - a); rd.push(c - b); gp.push(d - c); }
    if (i % 15 === 0) await new Promise((r) => setTimeout(r, 0));
  }
  const pct = (arr, q) => { const s = [...arr].sort((x, y) => x - y); return +s[Math.min(s.length - 1, Math.floor(q * s.length))].toFixed(2); };
  return { battle: k, manPx: f, tier: G.stage.paint.tier, firstFrameWithHBakeMs: +firstH.toFixed(1), updateP50: pct(up, 0.5), updateP95: pct(up, 0.95), renderCpuP50: pct(rd, 0.5), renderCpuP95: pct(rd, 0.95), gpuWaitP50: pct(gp, 0.5) };
}, [k, z]));
return out;
