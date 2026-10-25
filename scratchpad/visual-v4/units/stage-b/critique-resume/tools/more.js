// Critique-resume: (1) every painted troop block at a man of 72 px at deploy and at the clash; (2) hover cards at the
// clash; (3) motion strips (march, strike, death, rout) at 1x and 4x with a fixed camera; (4) a pop/slide probe.
const DIR = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/critique-resume/shots/';
const out = { blocks: [], hover: [], strips: [], probe: {} };
const page = await open(1600, 900, '?paused=1');
await page.mouse.move(800, 10);
const setSpeed = (s) => page.evaluate((s) => { const G = window.__battle.game; G.speed = s; G.camSpeed = s; G.cam = G.camFor(s); G.camFade = null; }, s);
for (const k of ['a', 'b', 'c']) {
  await setSpeed(1);
  const meta = await page.evaluate((k) => {
    const G = window.__battle.game; G.load(k); G.playing = false; G.camSpeed = G.speed; G.cam = G.camFor(G.speed);
    const st = G.stage, T = st.T, m = G.moments();
    const groups = T.G.filter((q) => !q.g.isCmd && q.g.size < 3).map((q) => ({ gi: q.idx, unit: q.g.unit, near: q.side === st.B.nearSide, look: st.paint ? st.paint.lookOf[q.idx] : null, appear: q.appear }));
    return { m, groups };
  }, k);
  const m = meta.m;
  // (1) blocks
  for (const g of meta.groups) {
    for (const [tag, t] of [['deploy', 2.4], ['clash', m.clash + 1.2]]) {
      const r = await page.evaluate(([t, gi]) => {
        const G = window.__battle.game; G.playing = false; G.seek(t);
        const h = G.stage.hull(G.stage.T.G[gi], t); if (!h) return null;
        G.follow = false; G.user = { cx: h.X, cy: h.Y - 14, z: 72 / 28 }; G.render(t); G.render(t);
        return { tier: G.stage.paint ? G.stage.paint.tier : null };
      }, [t, g.gi]);
      if (!r) continue;
      const name = `blk-${k}-${g.look || g.unit}-${g.gi}-${tag}`;
      await page.screenshot({ path: DIR + name + '.png', clip: { x: 350, y: 140, width: 900, height: 560 } });
      out.blocks.push({ name, ...g, ...r });
    }
  }
  // (2) hover cards at the clash on the automatic camera
  {
    const t = m.clash + 1.0;
    const picks = await page.evaluate(([t]) => {
      const G = window.__battle.game; G.playing = false; G.follow = true; G.user = null; G.seek(t); G.render(t);
      const st = G.stage, T = st.T, w = st.world, res = [];
      for (const near of [true, false]) {
        const side = near ? st.B.nearSide : (st.B.nearSide === 'attacker' ? 'defender' : 'attacker');
        const B = T.G.filter((q) => q.side === side && !q.g.isCmd && q.g.size < 3 && countAt(T, q.idx, t) > 0).sort((a, b) => countAt(T, b.idx, t) - countAt(T, a.idx, t))[0];
        if (B) { const h = st.hull(B, t); if (h) res.push({ kind: (near ? 'near' : 'far') + '-block', gi: B.idx, x: w.position.x + h.X * w.scale.x, y: w.position.y + h.Y * w.scale.y }); }
        const C = T.G.find((q) => q.side === side && q.g.isCmd && q.g.size < 3 && countAt(T, q.idx, t) > 0 && st.sprites[q.figs[0]] && st.sprites[q.figs[0]].visible);
        if (C) { const sp = st.sprites[C.figs[0]]; res.push({ kind: (near ? 'near' : 'far') + '-cmd', gi: C.idx, x: w.position.x + sp.x * w.scale.x, y: w.position.y + (sp.y - 14) * w.scale.y }); }
      }
      return res;
    }, [t]);
    for (const p of picks) {
      if (p.x < 0 || p.y < 0 || p.x > 1600 || p.y > 900) continue;
      await page.mouse.move(p.x, p.y);
      await page.evaluate(() => window.__battle.game.render(window.__battle.game.t));
      const name = `hov-${k}-${p.kind}`;
      await page.screenshot({ path: DIR + name + '.png' });
      out.hover.push({ name, ...p });
    }
    await page.mouse.move(800, 10);
  }
  // (3) motion strips
  const picks = await page.evaluate(([k]) => {
    const G = window.__battle.game, st = G.stage, T = st.T, m = G.moments(), q = { x: 0, y: 0, h: 0 }, q2 = { x: 0, y: 0, h: 0 };
    const isTroop = (fi) => { const sp = st.sprites[fi]; return !!(sp && sp.paint && sp.paint.look && sp.paint.look.kind === 'troop'); };
    const res = [];
    for (const near of [true, false]) {
      const side = near ? st.B.nearSide : (st.B.nearSide === 'attacker' ? 'defender' : 'attacker');
      let found = null;
      for (let t = 3; t < m.clash && !found; t += 0.5) {
        for (let i = 0; i < T.F.length; i++) {
          const f = T.F[i]; if (!isTroop(i) || T.G[f.g].side !== side || (f.death && f.death.t < t + 1.5)) continue;
          figPos(T, f, t, q); figPos(T, f, t + 1, q2);
          if (Math.hypot(q2.x - q.x, q2.y - q.y) > 22) { found = { kind: 'march-' + (near ? 'near' : 'far'), fi: i, t0: t }; break; }
        }
      }
      if (found) res.push(found);
    }
    const st1 = T.F.findIndex((f, i) => isTroop(i) && f.strikes && f.strikes.some((s) => s.t > m.clash));
    if (st1 >= 0) { const s = T.F[st1].strikes.find((s) => s.t > m.clash); res.push({ kind: 'strike', fi: st1, t0: s.t - 0.25 }); }
    const d1 = T.F.findIndex((f, i) => isTroop(i) && f.death && f.death.t > m.clash + 1);
    if (d1 >= 0) res.push({ kind: 'death', fi: d1, t0: T.F[d1].death.t - 0.15 });
    const r1 = T.F.findIndex((f, i) => isTroop(i) && f.rout && !(f.death && f.death.t < f.rout.t + 2));
    if (r1 >= 0) res.push({ kind: 'rout', fi: r1, t0: T.F[r1].rout.t - 0.1 });
    return res;
  }, [k]);
  for (const p of picks) {
    for (const s of [1, 4]) {
      const N = 10, dt = s / 15;
      const cam = await page.evaluate(([fi, tm, s]) => {
        const G = window.__battle.game; G.speed = s; const T = G.stage.T, q = figPos(T, T.F[fi], tm, { x: 0, y: 0, h: 0 });
        return { cx: sx(q.x, q.y), cy: sy(q.x, q.y, q.h) - 24 };
      }, [p.fi, p.t0 + dt * N / 2, s]);
      const frames = [];
      for (let i = 0; i < N; i++) {
        const t = p.t0 + i * dt;
        const r = await page.evaluate(([t, fi, cam]) => {
          const G = window.__battle.game; G.playing = false; G.seek(t);
          G.follow = false; G.user = { cx: cam.cx, cy: cam.cy, z: 72 / 28 }; G.render(t); G.render(t);
          const sp = G.stage.sprites[fi]; return { pose: Object.keys(PP).find((n) => PP[n] === sp.pPose), x: +sp.x.toFixed(1), y: +sp.y.toFixed(1), vis: sp.visible, view: sp.curView };
        }, [t, p.fi, cam]);
        const name = `str-${k}-${p.kind}-${s}x-${i}`;
        await page.screenshot({ path: DIR + name + '.png', clip: { x: 600, y: 250, width: 400, height: 330 } });
        frames.push({ name, t: +t.toFixed(3), ...r });
      }
      out.strips.push({ k, ...p, s, frames });
    }
  }
  await page.evaluate(() => { const G = window.__battle.game; G.speed = 1; });
  // (4) pop / slide probe on the automatic camera, 1x and 4x, 30 frames a second of real time over 10 s of the battle
  for (const s of [1, 4]) {
    out.probe[k + '-' + s] = await page.evaluate(([s]) => {
      const G = window.__battle.game; G.speed = s; G.camSpeed = s; G.cam = G.camFor(s); G.camFade = null; G.follow = true; G.user = null;
      const st = G.stage, T = st.T, m = G.moments();
      const prev = new Map(); let pops = 0, hides = 0, jumps = [], texSwaps = 0, samples = 0;
      const t0 = Math.max(1, m.clash - 2), frames = 300;
      let t = t0;
      for (let i = 0; i < frames; i++) {
        G.applyCamera(t); st.frame(t, s, G.view);
        for (let fi = 0; fi < T.F.length; fi++) {
          const sp = st.sprites[fi]; if (!sp || !sp.paint) continue;
          const f = T.F[fi];
          const cur = { vis: sp.visible, x: sp.x, y: sp.y, tex: sp.texture, a: sp.alpha };
          const p = prev.get(fi);
          if (p) {
            const dying = f.death && t >= f.death.t - 0.05 && t <= f.death.t + f.death.fall + 0.1;
            if (!p.vis && cur.vis && !(T.G[f.g].appear > t - 0.1)) pops++;
            if (p.vis && !cur.vis && !(f.death && t >= f.death.t) && !(f.rout)) hides++;
            if (p.vis && cur.vis) {
              const d = Math.hypot(cur.x - p.x, cur.y - p.y);
              if (d > 8 * s && !dying) jumps.push({ fi, unit: T.G[f.g].g.unit, t: +t.toFixed(2), d: +d.toFixed(1) });
              if (cur.tex !== p.tex) texSwaps++;
              samples++;
            }
          }
          prev.set(fi, cur);
        }
        t += (1 / 30) * s * storyRate(T, t, s);
      }
      jumps.sort((a, b) => b.d - a.d);
      return { t0, t1: +t.toFixed(2), pops, hides, jumps: jumps.length, top: jumps.slice(0, 8), texSwapsPerFigSec: +(texSwaps / Math.max(1, samples) * 30).toFixed(2) };
    }, [s]);
  }
}
return out;
