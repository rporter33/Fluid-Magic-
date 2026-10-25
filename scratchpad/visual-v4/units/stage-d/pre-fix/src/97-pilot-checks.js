'use strict';
// ---- the magic pilot's checks (stage D), added to window.__battle.checks() ----
// Beats at their storyboard times (and the elements drawn in each), footprints before impact, the particle and draw
// budgets, no Graphics drawn by the effects layer, the flash limiter, reduced motion (the OS setting and its rules),
// decals under the cap, the same frame by a seek as by playing forward, and docs/09's rules (commit 8056fa7): the colour
// grammar (Ember added, Loam normal, primary 70% and accent 30%), no glow on the units, effects under the standards and
// glyphs, at most 3 burst or field effects at once, the short form above 2x, durations driven by the data table.

/** What the pilot layer drew at story time t for a cast (its trace), after a full frame at that time. */
Game.prototype.pilotTrace = function pilotTrace(fx, t, speed) {
  this.t = t; this.applyCamera(t); this.stage.frame(t, speed || 1, this.view); // the CPU side of a frame is all the trace needs (at 1x unless asked)
  return Object.assign({}, fx.trace || {});
};
/** GL draw calls of one render at t, with the pilot layer shown and then hidden. */
Game.prototype.pilotDraws = function pilotDraws(t) {
  const st = this.stage, gl = this.app.renderer.gl, L = st.fx;
  let n = 0;
  const de = gl.drawElements, da = gl.drawArrays;
  gl.drawElements = function (...a) { n++; return de.apply(gl, a); };
  gl.drawArrays = function (...a) { n++; return da.apply(gl, a); };
  const count = () => { n = 0; this.app.renderer.render(this.app.stage); return n; };
  this.seek(t); this.render(t);
  const on = count();
  const conts = [...L.containers(), L.decals.layer, L.flash];
  const vis = conts.map((c) => c.visible);
  const unitsFx = L.units.list.map((s) => s.visible);
  conts.forEach((c) => (c.visible = false)); L.units.list.forEach((s) => (s.visible = false));
  const off = count();
  conts.forEach((c, i) => (c.visible = vis[i])); L.units.list.forEach((s, i) => (s.visible = unitsFx[i]));
  gl.drawElements = de; gl.drawArrays = da;
  return { on, off, extra: on - off };
};
/** A hash of every particle and sprite the layer drew this frame (position, alpha, frame). */
Game.prototype.pilotHash = function pilotHash() {
  const L = this.stage.fx;
  let h = 0x811c9dc5;
  const mixIn = (v) => { h = Math.imul(h ^ (Math.round(v * 100) | 0), 0x01000193) >>> 0; };
  for (const P of L.pools()) for (let i = 0; i < P.used; i++) {
    const p = P.list[i];
    if (P instanceof FxParticles) { mixIn(p.x); mixIn(p.y); mixIn(p.alpha); mixIn(p.scaleX); mixIn(p.tint); } else { mixIn(p.x); mixIn(p.y); mixIn(p.alpha); mixIn(p.scale.x); }
  }
  return h;
};

Game.prototype.checkPilot = function checkPilot() {
  const out = { battles: [], limiter: null, ok: false };
  const keyOk = [];
  // ---- the flash limiter, on synthetic cues (docs/12 S2.14: at most 3 per real second, alpha <= 0.35) ----
  {
    const Tm = { slow: [] };
    const F = new FxFlashes(Tm);
    for (let i = 0; i < 10; i++) F.add({ t: 10 + i * 0.1, dur: 0.06, color: 0xa6d96a, alpha: 0.6, area: 'scene' });
    const perSec = (speed) => { const ok = [...F.admitted(speed)].map((i) => F.cues[i].t / speed).sort((a, b) => a - b); let worst = 0; for (const r of ok) worst = Math.max(worst, ok.filter((x) => x > r - 1 && x <= r).length); return { admitted: ok.length, worstPerRealSecond: worst }; };
    const s1 = perSec(1), s4 = perSec(4);
    const keep = FX_SETTINGS.flashes;
    const a1 = F.at(10.0, 1, false); FX_SETTINGS.flashes = 'soft'; const aSoft = F.at(10.0, 1, false); FX_SETTINGS.flashes = 'off'; const aOff = F.at(10.0, 1, false); FX_SETTINGS.flashes = keep;
    const aRed = F.at(10.0, 1, true);
    out.limiter = { at1x: s1, at4x: s4, alphaFull: a1 && +a1.alpha.toFixed(3), alphaSoft: aSoft && +aSoft.alpha.toFixed(3), off: aOff, reduced: aRed };
    out.limiter.ok = s1.worstPerRealSecond <= 3 && s4.worstPerRealSecond <= 3 && a1 && a1.alpha <= 0.35 && aSoft && aSoft.alpha <= 0.07 && !aOff && !aRed;
    keyOk.push(out.limiter.ok);
  }
  const savedReduced = this.reduced, savedSpeed = this.speed;
  this.reduced = false; this.speed = 1; // the storyboard checks run at 1x (above 2x the short form plays: checked on its own below)
  for (const key of ['a', 'c']) {
    this.load(key); this.playing = false;
    const st = this.stage, T = st.T, L = st.fx;
    const B = { key, casts: [], decals: { field: T.decals.length, fx: L ? L.decals.count : 0 }, graphicsInLayer: 0, graphicsCallsInFrame: 0 };
    out.battles.push(B);
    if (!L) { B.ok = false; keyOk.push(false); continue; }
    B.decals.ok = B.decals.field + B.decals.fx <= FX_BUDGET.decals;
    // no Graphics in the effects layer, and no Graphics geometry built while it draws a frame
    const walk = (o) => { if (o instanceof PIXI.Graphics) B.graphicsInLayer++; (o.children || []).forEach(walk); };
    [...L.containers(), L.decals.layer].forEach(walk);
    const GC = PIXI.GraphicsContext.prototype, names = ['clear', 'ellipse', 'circle', 'poly', 'rect', 'moveTo', 'lineTo', 'fill', 'stroke', 'arc'];
    const orig = {}; let inFx = false;
    for (const m of names) { orig[m] = GC[m]; GC[m] = function (...a) { if (inFx) B.graphicsCallsInFrame++; return orig[m].apply(this, a); }; }
    const fr = L.frame.bind(L);
    L.frame = (t, speed) => { inFx = true; try { fr(t, speed); } finally { inFx = false; } };
    for (const fx of L.spells) {
      const b = fx.beats, look = FX_LOOKS[fx.spell], want = look.beats[b.form] || look.beats.short;
      const C = { spell: fx.spell, form: b.form, t0: +fx.t0.toFixed(3) };
      const dur = (k) => +(b[k][1] - b[k][0]).toFixed(3);
      C.beats = { charge: dur('charge'), release: dur('release'), travel: dur('travel'), impact: dur('impact'), linger: dur('linger') };
      C.storyboard = { charge: want[0], release: want[1], travel: want[2], impact: want[3], linger: want[4] };
      C.travelExtended = +(C.beats.travel - want[2]).toFixed(3); // the chain rule: an impact never lands before the previous cast's
      C.beatsOk = Math.abs(C.beats.charge - want[0]) < 0.002 && Math.abs(C.beats.release - want[1]) < 0.002 && C.beats.travel >= want[2] - 0.002
        && Math.abs(C.beats.impact - want[3]) < 0.002 && Math.abs(C.beats.linger - want[4]) < 0.002;
      const mid = (k) => (b[k][0] + b[k][1]) / 2;
      // what each beat draws
      const tr = {};
      if (fx.spell === 'fireball') {
        tr.charge = this.pilotTrace(fx, mid('charge')); tr.release = this.pilotTrace(fx, b.release[0] + 0.03);
        tr.travel = this.pilotTrace(fx, mid('travel')); tr.impact = this.pilotTrace(fx, mid('impact')); tr.linger = this.pilotTrace(fx, b.impact[0] + 0.6);
        tr.foot = this.pilotTrace(fx, b.impact[0] - 0.24);
        const alive = fx.struck.filter((f) => !f.death || f.death.t > b.impact[0] - 0.24).length;
        C.drawn = { orb: tr.charge.orb > 0, releaseRing: !!tr.release.release, lob: tr.travel.lob > 0 && tr.travel.lob < 1, trail: !!tr.travel.trail, burst: tr.impact.burst >= 1 && tr.impact.burst <= 4,
          ring: tr.impact.ring > 0, smoke: tr.linger.smoke > 0, footprints: [tr.foot.footprints, alive] };
        C.drawnOk = C.drawn.orb && C.drawn.releaseRing && C.drawn.lob && C.drawn.trail && C.drawn.burst && C.drawn.ring && C.drawn.smoke && tr.foot.footprints === alive;
      } else {
        tr.charge = this.pilotTrace(fx, mid('charge'));
        st.frame(b.release[0] + 0.01, 1, this.view);
        const flash = { visible: L.flash.visible, alpha: +L.flash.alpha.toFixed(3), color: L.flash.tint };
        tr.release = Object.assign({}, fx.trace);
        tr.travel = this.pilotTrace(fx, mid('travel')); tr.impact = this.pilotTrace(fx, mid('impact')); tr.linger = this.pilotTrace(fx, b.linger[0] + 0.1);
        tr.foot = this.pilotTrace(fx, b.impact[0] - 0.24);
        const h0 = fx.held[0];
        tr.wither = h0 && h0.t1 < T.duration ? this.pilotTrace(fx, h0.t1 + 0.3) : null;
        C.held = fx.held.map((h) => ({ fig: h.f.id, until: +h.t1.toFixed(2), why: h.why }));
        C.drawn = { cracks: tr.charge.cracks > 0, flash, releaseRing: !!tr.release.release, crack: tr.travel.crack > 0 && tr.travel.crack < 1, coil: String(tr.impact.coil), hold: tr.linger.coil === 'coil3' && !!tr.linger.curse,
          wither: tr.wither ? !!tr.wither.wither : null, footprints: [tr.foot.footprints, fx.held.length] };
        C.drawnOk = C.drawn.cracks && flash.visible && Math.abs(flash.alpha - look.flash.alpha) < 0.03 && C.drawn.releaseRing && C.drawn.crack && /^coil[123]$/.test(C.drawn.coil) && C.drawn.hold
          && C.drawn.wither !== false && tr.foot.footprints === fx.held.length;
      }
      // sound hooks: the charge cue at the charge, the burst (or the roots) at the impact
      const cue = (id) => (fx.sound || []).find((c) => c.id === id);
      const want2 = fx.spell === 'fireball' ? [['spell.R.charge', b.charge[0]], ['spell.R.burst', b.impact[0]]] : [['spell.G.charge', b.charge[0]], ['roots.burst', b.impact[0]]];
      C.sound = { cues: (fx.sound || []).length, ok: want2.every(([id, t]) => cue(id) && Math.abs(cue(id).t - t) < 0.002) };
      // docs/09's colour grammar at the busiest moment: the colour particles' blend and palette split
      {
        const G = FX_GRAMMAR[look.color], tAt = fx.spell === 'fireball' ? b.impact[0] + 0.1 : b.impact[0] + 0.25;
        st.frame(tAt, 1, this.view);
        const P = L.sets.get(fx.spell)[fx.spell === 'fireball' ? 'airPA' : 'airN'], n = { primary: 0, accent: 0, other: 0 };
        const prim = fx.spell === 'fireball' ? G.primary : mix(0xffffff, G.primary, G.tint), acc = fx.spell === 'fireball' ? G.accent : mix(0xffffff, G.accent, G.tint);
        for (let i = 0; i < P.used; i++) { const p = P.list[i], tn = p.tint; if (fx.spell === 'entangle' && !/^leaf/.test(p.texture.fname)) continue; if (/^spark/.test(p.texture.fname)) continue; if (tn === prim) n.primary++; else if (tn === acc) n.accent++; else n.other++; }
        const tot = n.primary + n.accent;
        C.grammar = { blend: P.pc.blendMode, wantBlend: G.blend, split: tot ? +(n.primary / tot).toFixed(2) : null, n, ok: P.pc.blendMode === G.blend && tot >= 5 && n.other === 0 && Math.abs(n.primary / tot - FX_GRAMMAR.split) <= 0.25 };
      }
      // above 2x: the short form's charge (the orb or the cracks start later) and no linger (no smoke or leaves after the impact)
      {
        const lastLand = Math.max(0, ...(fx.clusters || []).map((k) => (k.tLand || b.impact[0]) - b.impact[0])); // fragments land later
        const fb = fx.beatsFast, early = b.charge[0] + 0.02, late = fx.beats.impact[1] + 0.3 + lastLand;
        const trE = this.pilotTrace(fx, early, 4), trL = this.pilotTrace(fx, late, 4), trN = this.pilotTrace(fx, late, 1);
        const drewEarly = fx.spell === 'fireball' ? trE.orb > 0 : trE.cracks > 0;
        const lingerFast = fx.spell === 'fireball' ? trL.smoke + trL.embers : trL.leaves, lingerNormal = fx.spell === 'fireball' ? trN.smoke + trN.embers : trN.leaves;
        C.fast = { charge: +(fb.charge[1] - fb.charge[0]).toFixed(3), drewAtFullChargeStart: drewEarly, lingerFast, lingerNormal, ok: (fb.charge[1] - fb.charge[0] < b.charge[1] - b.charge[0] - 0.01 ? !drewEarly : true) && lingerFast === 0 && lingerNormal > 0 };
        this.pilotTrace(fx, late, 1);
      }
      // the particle budget over the whole cast, at 30 frames a second of story
      let peak = 0, maxMs = 0;
      for (let t = fx.t0 - 0.05; t <= fx.fxEnd; t += 1 / 30) {
        st.frame(t, 1, this.view);
        let n = 0; // this cast's own particles: the frame's total less the other active casts' is not needed while one is active
        n = L.particles();
        peak = Math.max(peak, n); maxMs = Math.max(maxMs, L.stats.updateMs);
      }
      C.particles = { peak, budget: look.budget, ok: peak <= look.budget };
      C.fxUpdateMsMax = +maxMs.toFixed(2);
      // draws at the busiest beats
      C.draws = fx.spell === 'fireball' ? { travel: this.pilotDraws(mid('travel')), impact: this.pilotDraws(b.impact[0] + 0.05) } : { release: this.pilotDraws(b.release[0] + 0.01), impact: this.pilotDraws(mid('impact')), hold: this.pilotDraws(b.linger[0] + 0.1) };
      C.drawsOk = Object.values(C.draws).every((d) => d.extra <= FX_BUDGET.extraDraws); // the layer's own draws (the rest are the scene's)
      // the same frame by a seek and by playing forward (16 ms steps from 0.5 s before)
      const tt = fx.spell === 'fireball' ? b.impact[0] + 0.21 : b.impact[0] + 0.15;
      st.frame(tt, 1, this.view); const hSeek = this.pilotHash();
      for (let t = tt - 0.5; t < tt; t += 0.016) st.frame(t, 1, this.view);
      st.frame(tt, 1, this.view); const hPlay = this.pilotHash();
      C.deterministic = hSeek === hPlay;
      // reduced motion: no shake, no full-scene flash, particles x0.3, no trail; the orb still lobs
      this.reduced = true;
      const rm = {};
      if (fx.spell === 'fireball') {
        rm.shake = L.shakeAt(b.impact[0] + 0.05);
        const trv = this.pilotTrace(fx, mid('travel'));
        rm.trail = !!trv.trail; rm.lob = trv.lob > 0;
        st.frame(b.impact[0] + 0.05, 1, this.view); rm.particles = L.particles();
        this.reduced = false; st.frame(b.impact[0] + 0.05, 1, this.view); rm.particlesFull = L.particles();
        rm.ok = rm.shake === null && !rm.trail && rm.lob && rm.particles <= Math.round(rm.particlesFull * 0.3) + 8; // + the unscaled bodies (orb, burst, core)
      } else {
        st.frame(b.release[0] + 0.01, 1, this.view); rm.flash = L.flash.visible;
        this.reduced = false;
        rm.ok = !rm.flash;
      }
      this.reduced = false;
      C.reducedMotion = rm;
      C.ok = C.beatsOk && C.drawnOk && C.sound.ok && C.grammar.ok && C.fast.ok && C.particles.ok && C.drawsOk && C.deterministic && rm.ok;
      B.casts.push(C);
    }
    L.frame = fr;
    for (const m of names) GC[m] = orig[m];
    B.ok = B.casts.every((c) => c.ok) && B.decals.ok && B.graphicsInLayer === 0 && B.graphicsCallsInFrame === 0;
    keyOk.push(B.ok);
  }
  // docs/09: at most 3 burst or field effects at once, in every battle (later casts queue in event order)
  {
    const conc = [];
    for (const key of DATA.map((d) => d.key)) {
      this.load(key);
      const E = this.stage.T.spellFx.filter((e) => e.concurrent);
      let worst = 0;
      for (const e of E) worst = Math.max(worst, E.filter((o) => o.t0 <= e.t0 && o.playEnd > e.t0).length);
      conc.push({ key, effects: E.length, worstAtOnce: worst, queued: this.stage.T.spellFx.filter((e) => e.queued > 0).length });
    }
    // and the queue itself, on five overlapping bursts: the fourth and fifth wait for the earliest ones to end
    const Tq = { spellFx: [] }, starts = [];
    for (let i = 0; i < 5; i++) { const s0 = fxQueueStart(Tq, 'burst', 10 + i * 0.1); Tq.spellFx.push({ concurrent: true, t0: s0, playEnd: s0 + 1.5 }); starts.push(+s0.toFixed(3)); }
    const queueOk = starts[2] < 10.3 && starts[3] >= 11.5 - 1e-6 && starts[4] >= 11.6 - 1e-6 && fxQueueStart(Tq, 'aura', 10.5) === 10.5;
    out.concurrency = { battles: conc, max: FX_RULES.maxConcurrent, synthetic: starts, ok: queueOk && conc.every((c) => c.worstAtOnce <= FX_RULES.maxConcurrent) };
    keyOk.push(out.concurrency.ok);
  }
  // durations come from the data table: fx.duration re-times the storyboard's beats
  {
    const rec = FX_SPELLS.fireball, keep = rec.duration, sum = (b) => +(b.charge + b.release + b.travel + b.impact + b.linger).toFixed(3);
    const full = sum(fxBeats('fireball', 'full')); rec.duration = 900; const at900 = sum(fxBeats('fireball', 'full')); rec.duration = keep;
    out.dataDurations = { fireballFull: full, fireballAt900: at900, entangleFull: sum(fxBeats('entangle', 'full')), fireballShort: sum(fxBeats('fireball', 'short')), ok: Math.abs(full - 1.9) < 0.002 && Math.abs(at900 - 0.9) < 0.002 };
    keyOk.push(out.dataDurations.ok);
  }
  // the effects sit under the standards and the block glyphs, and draw only effects-atlas textures (units carry no glow)
  {
    this.load('a');
    const st = this.stage, W = st.world, L = st.fx, top = [...L.sets.values()][0].airN.pc.parent;
    const under = !st.bannerLayer || W.getChildIndex(top) < W.getChildIndex(st.bannerLayer);
    const b = L.spells[0].beats; this.pilotTrace(L.spells[0], b.impact[0] + 0.05);
    let foreign = 0;
    for (const S of L.pools()) if (!(S instanceof FxParticles)) for (let i = 0; i < S.used; i++) if (S.list[i].texture.source !== FXLIB.source) foreign++;
    const own = [...L.sets.entries()].map(([k, S]) => ({ spell: k, containers: FX_POOL_KEYS.filter((q) => S[q]).map((q) => q + ':' + (S[q].pc || S[q].c).blendMode) }));
    this.load('c'); const Lc = this.stage.fx, loam = Lc.sets.get('entangle'), loamAdd = FX_POOL_KEYS.some((q) => loam[q] && (loam[q].pc || loam[q].c).blendMode === 'add');
    out.layers = { underStandardsAndGlyphs: under, foreignTextures: foreign, perEffect: own.concat([{ spell: 'entangle', containers: FX_POOL_KEYS.filter((q) => loam[q]).map((q) => q + ':' + (loam[q].pc || loam[q].c).blendMode) }]), loamAdditive: loamAdd, ok: under && foreign === 0 && !loamAdd };
    keyOk.push(out.layers.ok);
  }
  this.reduced = savedReduced; this.speed = savedSpeed;
  out.osReducedMotion = { matches: FX_MOTION.os, followed: this.reducedSet ? null : this.reduced === FX_MOTION.os };
  out.ok = keyOk.every(Boolean) && out.osReducedMotion.followed !== false;
  return out;
};

{
  const base = Game.prototype.checks;
  Game.prototype.checks = async function checksWithPilot(opts = {}) {
    const report = await base.call(this, opts);
    if (FXLIB.ready && opts.pilot !== false) {
      report.pilot = this.checkPilot();
      report.pageErrors = window.__errors.slice();
      report.ok = report.ok && report.pilot.ok && report.pageErrors.length === 0;
    }
    return report;
  };
}
