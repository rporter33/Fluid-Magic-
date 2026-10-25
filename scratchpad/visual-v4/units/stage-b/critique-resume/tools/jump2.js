const page = await open(1200, 800, '?paused=1');
const out = [];
for (const [k, fi, ts] of [['b', 186, [41.9, 42.0, 42.1, 42.2, 42.3]], ['a', 241, [50.6, 50.7, 50.8, 50.9, 51.0]]]) {
  out.push(await page.evaluate(([k, fi, ts]) => {
    const G = window.__battle.game; if (G.key !== k) G.load(k);
    const T = G.stage.T, f = T.F[fi], Gr = T.G[f.g], o = { x: 0, y: 0, h: 0 }, s = { u: 0, v: 0 };
    const rows = ts.map((t) => { pathAt(Gr.path, t, o); seatAt(f, t, s); const seg = activeSeg(Gr.path, t); return { t, px: +o.x.toFixed(1), py: +o.y.toFixed(1), su: +s.u.toFixed(1), sv: +s.v.toFixed(1), seg: seg ? { t0: +seg.t0.toFixed(2), t1: +seg.t1.toFixed(2), dx: +(seg.x1 - seg.x0).toFixed(0), dy: +(seg.y1 - seg.y0).toFixed(0), e: seg.e } : null }; });
    const cues = (f.seatCues || []).filter((q) => q.t > ts[0] - 2 && q.t < ts[ts.length - 1] + 1).map((q) => ({ t: +q.t.toFixed(2), d: +q.d.toFixed(2), du: +(q.u - q.u0).toFixed(0), dv: +(q.v - q.v0).toFixed(0), why: q.why || q.kind || null }));
    const segs = Gr.path.filter((p) => p.t1 > ts[0] - 1 && p.t0 < ts[ts.length - 1] + 1).map((p) => ({ t0: +p.t0.toFixed(2), t1: +p.t1.toFixed(2), dx: +(p.x1 - p.x0).toFixed(0), dy: +(p.y1 - p.y0).toFixed(0), e: p.e, why: p.why || p.kind || null }));
    return { k, fi, unit: Gr.g.unit, isCmd: Gr.g.isCmd, rows, cues, segs, strikes: f.strikes.filter((x) => x.t > ts[0] - 1 && x.t < ts[ts.length - 1] + 1).map((x) => ({ t: +x.t.toFixed(2), lunge: x.lunge || null })) };
  }, [k, fi, ts]));
}
return out;
