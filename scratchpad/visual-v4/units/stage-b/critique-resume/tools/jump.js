// positions of a few figures at fine steps around the probe's largest jumps
const page = await open(1200, 800, '?paused=1');
const cases = [['b', 186, 41.6, 42.6], ['b', 187, 41.6, 42.6], ['a', 241, 50.3, 51.3], ['a', 240, 50.3, 51.3], ['c', 108, 33.8, 34.6], ['a', 127, 20.2, 20.8]];
const out = [];
for (const [k, fi, t0, t1] of cases) {
  out.push(await page.evaluate(([k, fi, t0, t1]) => {
    const G = window.__battle.game; if (G.key !== k) G.load(k); G.speed = 1;
    const st = G.stage, T = st.T, f = T.F[fi], q = { x: 0, y: 0, h: 0 };
    const rows = [];
    let px = null, py = null;
    for (let t = t0; t <= t1; t += 1 / 60) {
      st.frame(t, 1, G.view);
      const sp = st.sprites[fi];
      const d = px === null ? 0 : Math.hypot(sp.x - px, sp.y - py);
      rows.push([+t.toFixed(3), +sp.x.toFixed(1), +sp.y.toFixed(1), +d.toFixed(1), sp.visible ? 1 : 0, Object.keys(PP).find((n) => PP[n] === sp.pPose)]);
      px = sp.x; py = sp.y;
    }
    const big = rows.filter((r) => r[3] > 4);
    return { k, fi, unit: T.G[f.g].g.unit, death: f.death ? +f.death.t.toFixed(2) : null, rout: f.rout ? { t: +f.rout.t.toFixed(2), dur: +f.rout.dur.toFixed(2), D: Math.round(f.rout.D), tLeave: f.rout.tLeave } : null, climb: f.climb ? { t: f.climb.t, dur: f.climb.dur } : null, maxStep: Math.max(...rows.map((r) => r[3])), big: big.slice(0, 12) };
  }, [k, fi, t0, t1]));
}
return out;
