// Motion metrics on the painted figures: march stride vs travel, seat slides at rest, rout run-in-place,
// dead-pose handoff (sprite -> decal), pose flicker, tier-switch pops. Deterministic stepping at 60 fps of story time.
const page = await open(1920, 1080, '?paused=1');
return await page.evaluate(() => {
  const G0 = window.__battle.game; const out = {};
  const pct = (a, p) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return +s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(2); };
  for (const b of DATA) {
    G0.load(b.key); G0.playing = false;
    const st = G0.stage, T = st.T, P = st.paint;
    const R = { march: [], seatSlides: [], rout: [], deadPose: { n: 0, poseMismatch: 0, texMismatch: 0, mirrorMismatch: 0, posErr: 0, rotErr: 0, viewMismatch: 0 }, flicker: [] };
    // ---- march: per painted troop group, its moving segments' speeds; step = speed / (2 * tempo)
    for (const G of T.G) {
      if (!P.lookOf[G.idx] || G.g.isCmd) continue;
      for (const s of G.path) {
        const d = Math.hypot(s.x1 - s.x0, s.y1 - s.y0), dt = s.t1 - s.t0;
        if (d > 2 && dt > 0) R.march.push({ unit: G.g.unit, t0: +s.t0.toFixed(2), dur: +dt.toFixed(2), speed: +(d / dt).toFixed(1), stepWu: +(d / dt / 2).toFixed(1) });
      }
    }
    // ---- seat cues: figures sliding to new seats while their block stands (no march pose)
    for (const f of T.F) {
      const G = T.G[f.g];
      if (!P.lookOf[G.idx] || !f.seatCues) continue;
      for (const c of f.seatCues) {
        const dist = Math.hypot(c.u - c.u0, c.v - c.v0);
        if (dist < 1) continue;
        const seg = activeSeg(G.path, c.t + c.d / 2);
        const moving = seg && (Math.abs(seg.x1 - seg.x0) + Math.abs(seg.y1 - seg.y0) > 2);
        if (!moving && !(f.death && f.death.t <= c.t) && !(f.rout && f.rout.t <= c.t)) R.seatSlides.push({ dist: +dist.toFixed(1), d: c.d, speed: +(dist / c.d).toFixed(1) });
      }
    }
    // ---- rout: time spent in flee frames while (nearly) standing still
    for (const f of T.F) {
      const G = T.G[f.g];
      if (!P.lookOf[G.idx] || !f.rout) continue;
      const r = f.rout; const tEnd = Math.min(T.duration, (r.tLeave !== null ? r.tLeave : T.duration), f.death ? f.death.t : Infinity);
      let still = 0, n = 0, peak = 0; const p0 = { x: 0, y: 0, h: 0 }, p1 = { x: 0, y: 0, h: 0 };
      for (let t = r.t; t < tEnd - 1 / 30; t += 1 / 30) {
        figPos(T, f, t, p0); figPos(T, f, t + 1 / 30, p1);
        const v = Math.hypot(p1.x - p0.x, p1.y - p0.y) * 30; peak = Math.max(peak, v);
        if (v < 15) still += 1 / 30; n++;
      }
      R.rout.push({ still, peak, D: r.D, dur: r.dur });
    }
    // ---- dead pose handoff: last sprite frame vs the decal's first
    const decalOf = new Map(); T.decals.forEach((d, i) => { if (d.kind === 'body') decalOf.set(d.f, i); });
    let checked = 0;
    for (let i = 0; i < T.F.length && checked < 400; i++) {
      const f = T.F[i], sp = st.sprites[i];
      if (!f.death || !sp || !sp.paint || !decalOf.has(i)) continue;
      checked++;
      const t1 = f.death.t + f.death.fall - 0.004, t2 = f.death.t + f.death.fall + 0.004;
      st.frame(t1, 1, G0.view); st.updateDecals(t1, 1);
      const a = { tex: sp.texture, pose: sp.pPose, mir: Math.sign(sp.scale.x), x: sp.x, y: sp.y, rot: sp.rotation };
      st.frame(t2, 1, G0.view); st.updateDecals(t2, 1);
      const dsp = st.decalSprites[decalOf.get(i)];
      const bb = { tex: dsp.texture, mir: Math.sign(dsp.scale.x), x: dsp.x, y: dsp.y, rot: dsp.rotation };
      R.deadPose.n++;
      if (a.pose !== sp.paint.deadPose) R.deadPose.poseMismatch++;
      if (a.tex !== bb.tex) R.deadPose.texMismatch++;
      if (a.mir !== bb.mir) R.deadPose.mirrorMismatch++;
      if (Math.hypot(a.x - bb.x, a.y - bb.y) > 0.5) R.deadPose.posErr++;
      if (Math.abs(a.rot - bb.rot) > 0.01) R.deadPose.rotErr++;
    }
    // ---- pose flicker: per painted figure, pose changes per second over the whole battle at 30 fps; runs of 1 frame
    const n = T.F.length, last = new Array(n).fill(-1), changes = new Array(n).fill(0), blips = new Array(n).fill(0), prev2 = new Array(n).fill(-1), lastView = new Array(n).fill(null), viewFlips = new Array(n).fill(0);
    const dtS = 1 / 30;
    const tmp = { x: 0, y: 0, h: 0 };
    for (let t = 0; t < T.duration; t += dtS) {
      for (let i = 0; i < n; i++) {
        const sp = st.sprites[i]; if (!sp || !sp.paint) continue;
        const f = T.F[i], G = T.G[f.g];
        const s = evalFigure(T, f, G, t, 1, tmp); if (!s.vis) continue;
        const pp = paintPose(T, f, G, t, 1, s, sp.paint.look, sp.paint.vary, sp.paint.extra);
        const pose = pp.pose;
        if (last[i] >= 0 && pose !== last[i]) { changes[i]++; if (prev2[i] === pose) blips[i]++; }
        prev2[i] = last[i]; last[i] = pose;
        const vw = s.view + (s.flip ? 'f' : '');
        if (lastView[i] !== null && vw !== lastView[i] && !(f.death && t >= f.death.t)) viewFlips[i]++;
        lastView[i] = vw;
      }
    }
    const blipArr = [], vfArr = [];
    for (let i = 0; i < n; i++) if (st.sprites[i] && st.sprites[i].paint) { blipArr.push(blips[i]); vfArr.push(viewFlips[i]); }
    R.flicker = { figs: blipArr.length, blipsP50: pct(blipArr, 0.5), blipsP95: pct(blipArr, 0.95), blipsMax: Math.max(...blipArr), viewFlipsP50: pct(vfArr, 0.5), viewFlipsP95: pct(vfArr, 0.95), viewFlipsMax: Math.max(...vfArr) };
    const sp = R.march.map((m) => m.speed);
    out[b.key] = {
      march: { segs: R.march.length, speedP50: pct(sp, 0.5), speedP95: pct(sp, 0.95), speedMax: Math.max(...sp), stepWuP50: pct(R.march.map((m) => m.stepWu), 0.5), stepWuMax: Math.max(...R.march.map((m) => m.stepWu)), sample: R.march.slice(0, 12) },
      seatSlides: { n: R.seatSlides.length, distP50: pct(R.seatSlides.map((s) => s.dist), 0.5), distP95: pct(R.seatSlides.map((s) => s.dist), 0.95), distMax: R.seatSlides.length ? Math.max(...R.seatSlides.map((s) => s.dist)) : 0, speedP50: pct(R.seatSlides.map((s) => s.speed), 0.5) },
      rout: { n: R.rout.length, stillP50: pct(R.rout.map((r) => r.still), 0.5), stillP95: pct(R.rout.map((r) => r.still), 0.95), stillMax: R.rout.length ? +Math.max(...R.rout.map((r) => r.still)).toFixed(1) : 0, peakP50: pct(R.rout.map((r) => r.peak), 0.5), DP50: pct(R.rout.map((r) => r.D), 0.5), durP50: pct(R.rout.map((r) => r.dur), 0.5) },
      deadPose: R.deadPose, flicker: R.flicker,
    };
  }
  return out;
});
