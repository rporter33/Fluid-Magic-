const page = await open(1200, 800, '?paused=1');
const out = {};
for (const k of ['a', 'b', 'c']) {
  out[k] = await page.evaluate((k) => {
    const G = window.__battle.game; G.load(k); const T = G.stage.T;
    const fx = T.spellFx.map((f) => ({ spell: f.spell, kind: f.look && f.look.kind, t0: +f.t0.toFixed(2), rel: +(f.release || 0).toFixed(2), imp: +(f.impact || 0).toFixed(2), caster: f.caster, unit: T.G[T.F[f.caster].g].g.unit }));
    const wr = T.G.filter((q) => q.g.unit === 'wolfRider').map((q) => ({ idx: q.idx, fig: q.figs[0], s: q.s, routT: q.routT, appear: q.appear, look: G.stage.paint.lookOf[q.idx] }));
    const wc = T.G.filter((q) => q.g.unit === 'wardenCaptain').map((q) => ({ fig: q.figs[0], face: q.g.face, look: G.stage.paint.lookOf[q.idx], s: q.s }));
    let wound = null;
    for (const f of T.F) { const g = T.G[f.g]; if (g.g.size >= 3 || !G.stage.paint.lookOf[g.idx]) continue; const rc = (f.reacts || []).find((r) => r.kind === 'wound' && (!f.death || f.death.t > r.t + 1)); if (rc) { wound = { fig: f.id, t: +rc.t.toFixed(3), unit: g.g.unit }; break; } }
    return { fx, wr, wc, wound, moments: G.moments() };
  }, k);
}
return out;
