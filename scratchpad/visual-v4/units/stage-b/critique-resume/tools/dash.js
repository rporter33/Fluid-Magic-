// every path segment faster than 150 wu/s, by group kind (commander / block / big), per battle
const page = await open(1200, 800, '?paused=1');
const out = {};
for (const k of ['a', 'b', 'c']) {
  out[k] = await page.evaluate((k) => {
    const G = window.__battle.game; G.load(k);
    const T = G.stage.T, res = { cmd: [], block: [], big: [] };
    for (const Gr of T.G) {
      const kind = Gr.g.size >= 3 ? 'big' : Gr.g.isCmd ? 'cmd' : 'block';
      for (const s of Gr.path) {
        if (s.t1 - s.t0 <= 0 || s.t0 < 0) continue;
        const d = Math.hypot(s.x1 - s.x0, s.y1 - s.y0), v = d / (s.t1 - s.t0);
        if (v > 150) res[kind].push({ unit: Gr.g.unit, t0: +s.t0.toFixed(2), dur: +(s.t1 - s.t0).toFixed(2), d: Math.round(d), v: Math.round(v) });
      }
    }
    for (const x of Object.values(res)) x.sort((a, b) => b.v - a.v);
    return { cmdN: res.cmd.length, blockN: res.block.length, bigN: res.big.length, cmd: res.cmd.slice(0, 8), block: res.block.slice(0, 4), big: res.big.slice(0, 3) };
  }, k);
}
return out;
