// Stage B fix pass: the critique's motion targets, measured on the painted figures in the page (60 fps of story time):
//   march: the step length actually painted (distance over the marchA/marchB steps sampled), target <= 16 wu up to 80 wu/s;
//   seat slides: no slide in a stand frame: a run of stand/idle2 frames longer than one shuffle passing frame (0.15 s)
//     during which the figure slides more than 3 wu (the shuffle's own passing frames are reported apart);
//   rout: time in flee frames while running slower than 15 wu/s, target <= 0.1 s;
//   view flips per figure (back/front or mirror changes while alive), target p95 <= 4;
//   dead-pose handoff (the page's own checkDeadHandoff), target 0 mismatches.
const page = await open(1920, 1080, '?paused=1');
return await page.evaluate(() => {
  const G0 = window.__battle.game; const out = {};
  const pct = (a, p) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return +s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(2); };
  const DT = 1 / 60;
  for (const b of DATA) {
    G0.load(b.key); G0.playing = false;
    const st = G0.stage, T = st.T, P = st.paint, tmp = { x: 0, y: 0, h: 0 }, q0 = { x: 0, y: 0, h: 0 }, q1 = { x: 0, y: 0, h: 0 };
    const painted = (i) => st.sprites[i] && st.sprites[i].paint;
    const poseAt = (i, t) => { const f = T.F[i], G = T.G[f.g], s = evalFigure(T, f, G, t, 1, tmp); if (!s.vis) return null; const sp = st.sprites[i]; const pp = paintPose(T, f, G, t, 1, s, sp.paint.look, sp.paint.vary, sp.paint.extra); return { pose: pp.pose, view: s.view + (s.flip ? 'f' : '') }; };
    // ---- march: each painted troop group's moving segments, its first living figure's painted steps
    const march = [];
    for (const G of T.G) {
      if (!P.lookOf[G.idx] || G.g.isCmd || G.g.size >= 3) continue;
      for (const seg of G.path) {
        const d = Math.hypot(seg.x1 - seg.x0, seg.y1 - seg.y0), dt = seg.t1 - seg.t0;
        if (d <= 2 || dt <= 0 || seg.t0 < 0) continue;
        const fi = G.figs.find((i) => painted(i) && !(T.F[i].death && T.F[i].death.t < seg.t1) && !(T.F[i].rout && T.F[i].rout.t < seg.t1));
        if (fi === undefined) continue;
        let steps = 0, prev = -1, frames = 0, marching = 0;
        for (let t = seg.t0; t < seg.t1; t += DT) {
          const r = poseAt(fi, t); if (!r) continue; frames++;
          if (r.pose === PP.marchA || r.pose === PP.marchB) { marching++; if (r.pose !== prev) steps++; }
          prev = r.pose;
        }
        const spd = d / dt;
        const stepWu = steps ? (d * (marching / Math.max(1, frames) > 0 ? 1 : 0)) / steps : null;
        march.push({ speed: +spd.toFixed(1), dur: +dt.toFixed(2), steps, stepWu: stepWu === null ? null : +stepWu.toFixed(1) });
      }
    }
    const m80 = march.filter((m) => m.speed <= 80 && m.stepWu !== null && m.dur >= 0.5);
    // ---- seat slides in a stand frame, rout run-in-place, view flips: every painted figure through the battle
    let slides = 0, slideMax = 0, slideRuns = 0, passMax = 0;
    const routStill = [], flips = [];
    for (let i = 0; i < T.F.length; i++) {
      if (!painted(i)) continue;
      const f = T.F[i], G = T.G[f.g];
      if (f.seatCues) for (const c of f.seatCues) {
        if (Math.hypot(c.u - c.u0, c.v - c.v0) <= 4 || c.t < 0) continue;
        let run = 0, start = null;
        for (let t = c.t; t <= c.t + c.d + DT; t += DT) {
          const r = poseAt(i, t); if (!r) break;
          const seg = activeSeg(G.path, t); if (seg && (Math.abs(seg.x1 - seg.x0) + Math.abs(seg.y1 - seg.y0) > 2)) { start = null; continue; }
          if (f.rout && t >= f.rout.t) break;
          const stand = r.pose === PP.stand || r.pose === PP.idle2;
          if (stand) { if (start === null) { start = t; figPos(T, f, t, q0); } }
          if ((!stand || t + DT > c.t + c.d) && start !== null) {
            figPos(T, f, t, q1); const dd = Math.hypot(q1.x - q0.x, q1.y - q0.y);
            slideRuns++;
            if (t - start > 0.15) { if (dd > 3) slides++; slideMax = Math.max(slideMax, dd); } else passMax = Math.max(passMax, dd);
            start = null;
          }
        }
      }
      if (f.rout) {
        const r = f.rout, tEnd = Math.min(T.duration, r.tLeave !== null ? r.tLeave : T.duration, f.death ? f.death.t : Infinity);
        let still = 0;
        for (let t = r.t; t < tEnd - DT; t += DT) {
          const p = poseAt(i, t); if (!p) break;
          if (p.pose !== PP.fleeA && p.pose !== PP.fleeB) continue;
          figPos(T, f, t, q0); figPos(T, f, t + DT, q1);
          if (Math.hypot(q1.x - q0.x, q1.y - q0.y) / DT < 15) still += DT;
        }
        routStill.push(still);
      }
      let last = null, n = 0;
      for (let t = 0; t < T.duration; t += 1 / 30) {
        if (f.death && t >= f.death.t) break;
        const s = evalFigure(T, f, G, t, 1, tmp); if (!s.vis) continue;
        const v = s.view + (s.flip ? 'f' : '');
        if (last !== null && v !== last) n++;
        last = v;
      }
      flips.push(n);
    }
    const dh = G0.checkDeadHandoff ? G0.checkDeadHandoff() : 'n/a (no check in this page)';
    out[b.key] = {
      march: { segs: march.length, upTo80: m80.length, stepWuP50: pct(m80.map((m) => m.stepWu), 0.5), stepWuP95: pct(m80.map((m) => m.stepWu), 0.95), stepWuMaxUpTo80: m80.length ? Math.max(...m80.map((m) => m.stepWu)) : null, over16UpTo80: m80.filter((m) => m.stepWu > 16).length, fastest: march.slice().sort((x, y) => y.speed - x.speed).slice(0, 3) },
      seatSlides: { standRuns: slideRuns, slidesOver3wuInStand: slides, maxSlideInStandWu: +slideMax.toFixed(2), maxSlideInOnePassingFrameWu: +passMax.toFixed(2) },
      rout: { n: routStill.length, stillInFleeP50: pct(routStill, 0.5), stillInFleeP95: pct(routStill, 0.95), stillInFleeMax: routStill.length ? +Math.max(...routStill).toFixed(2) : 0 },
      viewFlips: { figs: flips.length, p50: pct(flips, 0.5), p95: pct(flips, 0.95), max: flips.length ? Math.max(...flips) : 0 },
      deadHandoff: dh,
    };
  }
  return out;
});
