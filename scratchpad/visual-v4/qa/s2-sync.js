const page = await open(960, 540);
const out = await page.evaluate(() => {
  const G = window.__battle.game;
  const res = {};
  for (const key of ['a', 'b', 'c']) {
    G.load(key); G.playing = false;
    const st = G.stage, T = st.T;
    const r = { cardMis: [], domMis: [], minPairDiff: 0, overlapDiff: [], overlapSame: [], bigInside: [], seeThroughMax: 0, seeThroughFrames: 0, frames: 0, hpMis: [] };
    const FALL = new Set([FR.fall, FR.fall + 1]);
    for (const speed of [1, 4]) {
      G.speed = speed;
      for (let t = 0; t <= T.duration; t += 0.05) {
        st.frame(t, speed, G.view); G.applyCamera(t); G.hud.update(t);
        r.frames++;
        // figures standing per group vs the card's count
        const n = new Array(T.G.length).fill(0);
        const pts = [];
        for (let i = 0; i < T.F.length; i++) {
          const f = T.F[i], sp = st.sprites[i];
          if (!sp) continue;
          const tex = sp.texture;
          const fr = sp.frames[sp.curView] ? sp.frames[sp.curView].indexOf(tex) : -1;
          if (sp.visible && sp.alpha > 0.01 && !FALL.has(fr)) { n[f.g]++; const p = figPos(T, f, t, { x: 0, y: 0, h: 0 }); pts.push({ i, g: f.g, side: T.G[f.g].side, x: p.x, y: p.y, h: p.h, cmd: T.G[f.g].g.isCmd, rout: f.rout && t >= f.rout.t }); }
        }
        for (const bb of st.bigs) { const f = bb.f; if (bb.body.root.visible && !(f.death && t >= f.death.t)) n[f.g]++; }
        for (const Gq of T.G) {
          const gone = Gq.leaveT !== null && t >= Gq.leaveT - 0.6; // fading out
          if (gone || t < Gq.appear + 0.6) continue;
          const c = countAt(T, Gq.idx, t);
          if (c !== n[Gq.idx]) r.cardMis.push([speed, +t.toFixed(2), Gq.g.unit, 'card', c, 'drawn', n[Gq.idx]]);
          const el = G.hud.cardEls.get(Gq.idx) || G.hud.miniEls.get(Gq.idx);
          if (el && !Gq.g.isCmd) { const shown = +el.querySelector('.count, .cnt').textContent; if (shown !== c) r.domMis.push([speed, +t.toFixed(2), Gq.g.unit, shown, c]); }
        }
        // overlaps (every 0.25 s at 1x)
        if (speed === 1 && Math.abs(t * 4 - Math.round(t * 4)) < 1e-6) {
          let diff = 0, same = 0;
          const cell = 8, grid = new Map();
          for (const p of pts) { if (p.h > 20 && !T.wall) continue; const k = Math.floor(p.x / cell) + ',' + Math.floor(p.y / cell); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(p); }
          for (const p of pts) {
            const cx = Math.floor(p.x / cell), cy = Math.floor(p.y / cell);
            for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
              const arr = grid.get((cx + dx) + ',' + (cy + dy)); if (!arr) continue;
              for (const q of arr) { if (q.i <= p.i) continue; const d = Math.hypot(p.x - q.x, p.y - q.y); if (Math.abs(p.h - q.h) > 10) continue;
                if (p.side !== q.side && d < 7) diff++; else if (p.side === q.side && d < 5 && !p.rout && !q.rout) same++; }
            }
          }
          r.overlapDiff.push([+t.toFixed(2), diff]); r.overlapSame.push([+t.toFixed(2), same]);
          for (const bb of st.bigs) {
            const f = bb.f; if (!bb.body.root.visible || (f.death && t >= f.death.t)) continue;
            const p = figPos(T, f, t, { x: 0, y: 0, h: 0 });
            const R = LAYOUT.footR[bb.G.g.size];
            let own = 0, foe = 0;
            for (const q of pts) { if (Math.hypot(q.x - p.x, q.y - p.y) < R * 1.1) { if (q.side === bb.G.side) own++; else foe++; } }
            r.bigInside.push([+t.toFixed(2), bb.G.g.unit, +p.h.toFixed(0), own, foe, st.stats.seeThrough]);
          }
          r.seeThroughMax = Math.max(r.seeThroughMax, st.stats.seeThrough || 0);
          if (st.stats.seeThrough > 0) r.seeThroughFrames++;
        }
      }
    }
    // summaries
    const s = (arr) => arr.reduce((a, x) => Math.max(a, x[1]), 0);
    res[key] = { frames: r.frames, cardMis: r.cardMis.length, cardMisSample: r.cardMis.slice(0, 12), domMis: r.domMis.length, domMisSample: r.domMis.slice(0, 8),
      overlapDiffMax: s(r.overlapDiff), overlapDiffTop: r.overlapDiff.slice().sort((a, b) => b[1] - a[1]).slice(0, 6),
      overlapSameMax: s(r.overlapSame), overlapSameTop: r.overlapSame.slice().sort((a, b) => b[1] - a[1]).slice(0, 6),
      bigInsideTop: r.bigInside.slice().sort((a, b) => (b[3] + b[4]) - (a[3] + a[4])).slice(0, 8), bigInsideFramesWithOwn: r.bigInside.filter((x) => x[3] > 0).length, bigInsideFrames: r.bigInside.length,
      seeThroughMax: r.seeThroughMax, seeThroughFrames: r.seeThroughFrames, seamY: T.seamY };
  }
  return res;
});
return out;
