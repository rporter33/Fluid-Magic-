// Motion strips at close zoom (fixed camera, deterministic seeks): skating march, run-in-place rout, the dead-pose
// handoff, a seat slide, the tier switch, the Salamander's breath and death, the Wolf Riders' rout.
const DIR = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/critique/shots/strip-';
const W = 1600, H = 900;
const page = await open(W, H, '?paused=1');
const log = {};
const at = (k, t, X, Y, z) => page.evaluate(([k, t, X, Y, z]) => {
  const G = window.__battle.game; if (G.key !== k) G.load(k); G.playing = false; G.seek(t);
  G.follow = false; G.user = { cx: X, cy: Y, z }; G.render(t); G.render(t);
  const st = G.stage; return { tier: st.paint && st.paint.tier, z: st.world.scale.x, res: st.app.renderer.resolution };
}, [k, t, X, Y, z]);
const shot = (name, cw, ch) => page.screenshot({ path: DIR + name + '.png', clip: { x: (W - cw) / 2, y: (H - ch) / 2, width: cw, height: ch } });
const hullC = (k, gi, t) => page.evaluate(([k, gi, t]) => { const G = window.__battle.game; if (G.key !== k) G.load(k); G.seek(t); const h = G.stage.hull(G.stage.T.G[gi], t); return h ? { X: h.X, Y: h.Y } : null; }, [k, gi, t]);
const figC = (k, fi, t) => page.evaluate(([k, fi, t]) => { const G = window.__battle.game; if (G.key !== k) G.load(k); const T = G.stage.T; const p = figPos(T, T.F[fi], t, { x: 0, y: 0, h: 0 }); return { X: sx(p.x, p.y), Y: sy(p.x, p.y, p.h) }; }, [k, fi, t]);
const Z72 = 72 / 28;
// D1: battle a, the Cinder Warriors' fast move (236 wu/s), fixed camera at its middle; and the 55 wu/s advance
for (const [tag, k, gi, t0, t1, n] of [['a-skate236', 'a', 5, 19.75, 20.55, 9], ['a-march55', 'a', 5, 3.1, 4.1, 9], ['c-march19', 'c', 4, 0.6, 2.0, 8]]) {
  const c0 = await hullC(k, gi, t0), c1 = await hullC(k, gi, t1);
  const X = (c0.X + c1.X) / 2, Y = (c0.Y + c1.Y) / 2;
  for (let i = 0; i < n; i++) { const t = t0 + (t1 - t0) * i / (n - 1); await at(k, t, X, Y - 10, Z72 * 0.8); await shot(`${tag}-${i}`, 1000, 640); }
  log[tag] = { X, Y };
}
// D3: the routed figure with the longest stand-still in flee frames (battle c), 8 frames 0.12 s apart
const rr = await page.evaluate(() => {
  const G = window.__battle.game; G.load('c'); const st = G.stage, T = st.T;
  let best = null;
  for (const f of T.F) {
    const sp = st.sprites[f.id]; if (!sp || !sp.paint || !f.rout) continue;
    const r = f.rout, tEnd = Math.min(T.duration, r.tLeave !== null ? r.tLeave : T.duration, f.death ? f.death.t : Infinity);
    let still = 0, first = null; const a = { x: 0, y: 0, h: 0 }, b = { x: 0, y: 0, h: 0 };
    for (let t = r.t; t < tEnd - 0.05; t += 0.05) { figPos(T, f, t, a); figPos(T, f, t + 0.05, b); if (Math.hypot(b.x - a.x, b.y - a.y) / 0.05 < 15) { still += 0.05; if (first === null) first = t; } }
    if (!best || still > best.still) best = { fi: f.id, still, first, unit: T.G[f.g].g.unit };
  }
  return best;
});
log.rout = rr;
{ const c = await figC('c', rr.fi, rr.first + 0.3); for (let i = 0; i < 8; i++) { const t = rr.first + 0.3 + i * 0.12; await at('c', t, c.X, c.Y - 20, Z72 * 1.6); await shot(`c-runinplace-${i}`, 360, 300); } }
// D4: dead-pose handoffs (battle a): the first 3 painted figures whose falling pose differs from the body's
const dd = await page.evaluate(() => {
  const G = window.__battle.game; G.load('a'); const st = G.stage, T = st.T, out = [];
  for (const f of T.F) { const sp = st.sprites[f.id]; if (!sp || !sp.paint || !f.death) continue; const fallPose = f.death.flip ? PP.deadB : PP.deadA; if (fallPose !== sp.paint.deadPose && st.T.G[f.g].g.size < 3) out.push({ fi: f.id, t: f.death.t, fall: f.death.fall, unit: T.G[f.g].g.unit }); if (out.length >= 3) break; }
  return out;
});
log.dead = dd;
for (const [j, d] of dd.entries()) { const c = await figC('a', d.fi, d.t); let i = 0; for (const t of [d.t + d.fall * 0.3, d.t + d.fall * 0.75, d.t + d.fall - 0.005, d.t + d.fall + 0.005, d.t + d.fall + 0.5]) { await at('a', t, c.X, c.Y - 6, Z72 * 2.2); await shot(`a-deadhandoff-${j}-${i++}`, 300, 240); } }
// D5: the longest seat slide at rest (battle a)
const ss = await page.evaluate(() => {
  const G = window.__battle.game; G.load('a'); const st = G.stage, T = st.T; let best = null;
  for (const f of T.F) { const sp = st.sprites[f.id]; if (!sp || !sp.paint || !f.seatCues) continue; const Gr = T.G[f.g];
    for (const c of f.seatCues) { const dist = Math.hypot(c.u - c.u0, c.v - c.v0); const seg = activeSeg(Gr.path, c.t + c.d / 2); const moving = seg && (Math.abs(seg.x1 - seg.x0) + Math.abs(seg.y1 - seg.y0) > 2);
      if (moving || (f.death && f.death.t <= c.t + c.d) || (f.rout && f.rout.t <= c.t + c.d)) continue; if (!best || dist > best.dist) best = { fi: f.id, t: c.t, d: c.d, dist, unit: Gr.g.unit }; } }
  return best;
});
log.seat = ss;
{ const c = await figC('a', ss.fi, ss.t + ss.d / 2); for (let i = 0; i < 6; i++) { const t = ss.t - 0.05 + (ss.d + 0.1) * i / 5; await at('a', t, c.X, c.Y - 20, Z72 * 1.6); await shot(`a-seatslide-${i}`, 400, 320); } }
// D6: the tier switch: one view at a man of 49 and 51 device px (S then H)
{ const c = await hullC('c', 4, 2.2); for (const [i, px] of [[0, 47], [1, 53]]) { const r = await at('c', 2.2, c.X, c.Y, px / 28); log['tier' + i] = r; await shot(`c-tier-${px}`, 360, 240); } }
// D7: the Salamander: breath (c 6.85) and its death
const sal = await page.evaluate(() => { const G = window.__battle.game; G.load('c'); const T = G.stage.T; const f = T.F[T.G[0].figs[0]]; return { fi: f.id, death: f.death ? f.death.t : null, fall: f.death ? f.death.fall : null }; });
log.sal = sal;
{ let i = 0; for (const t of [6.5, 6.85, 7.2, 7.6]) { const c = await figC('c', sal.fi, t); await at('c', t, c.X + 60, c.Y - 30, Z72 * 0.9); await shot(`c-salbreath-${i++}`, 700, 500); } }
if (sal.death) { let i = 0; for (const t of [sal.death - 0.2, sal.death + sal.fall * 0.5, sal.death + sal.fall + 0.2, sal.death + 3]) { const c = await figC('c', sal.fi, t); await at('c', t, c.X, c.Y - 30, Z72 * 0.9); await shot(`c-saldeath-${i++}`, 600, 460); } }
// D8: the Wolf Riders (battle c): standing at deploy beside men, and routing
{ const c = await hullC('c', 14, 2.2); await at('c', 2.2, c.X, c.Y, Z72); await shot('c-wolves-deploy', 900, 560); }
const wr = await page.evaluate(() => { const G = window.__battle.game; G.load('c'); const T = G.stage.T; const G14 = T.G[14]; const f = G14.figs.map((i) => T.F[i]).find((q) => q.rout && !(q.death && q.death.t < q.rout.t + 1.5)); return f ? { fi: f.id, t: f.rout.t } : null; });
log.wolfRout = wr;
if (wr) { let i = 0; for (const dt of [0.2, 0.6, 1.0]) { const c = await figC('c', wr.fi, wr.t + dt); await at('c', wr.t + dt, c.X, c.Y - 20, Z72 * 1.2); await shot(`c-wolfrout-${i++}`, 600, 420); } }
return log;
