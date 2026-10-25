'use strict';
// ---- Game, part 3: moments for screenshots and the battle checks (counts, bodies, winner, determinism, timing, overlap, ----
// picking, colours). Split from 90-main.js for size; behaviour unchanged.

Object.assign(Game.prototype, {
  // ---- moments for screenshots ----
  moments() {
    const T = this.stage.T;
    const first = (pred) => { const b = T.beats.find(pred); return b ? b.t : null; };
    const vol = T.projectiles.find((p) => p.kind !== 'breath');
    const contact = first((b) => b.kind === 'contact');
    // a monster's blow: the first big body's killing strike, else its first shown strike, else its breath
    const bigF = T.F.filter((f) => T.G[f.g].g.size >= 3);
    const kills = bigF.flatMap((f) => f.strikes.filter((s) => s.item && s.item.b.outcome === 'kill').map((s) => s.t));
    const hits = bigF.flatMap((f) => f.strikes.filter((s) => s.item && s.item.b.outcome !== 'miss').map((s) => s.t));
    const br = T.spellFx.filter((x) => x.spell === 'breath' && bigF.some((f) => f.id === x.caster)).map((x) => x.release + 0.3);
    const monster = kills.length ? Math.min(...kills) + 0.02 : hits.length ? Math.min(...hits) + 0.02 : br.length ? Math.min(...br) : null;
    return {
      deploy: 2.2,
      volley: vol ? vol.t0 + (vol.t1 - vol.t0) * 0.55 : null,
      clash: contact !== null ? contact + 0.9 : null,
      monster,
      breath: (() => { const fx = T.spellFx.find((x) => x.spell === 'breath'); return fx ? fx.release + 0.25 : null; })(),
      rout: first((b) => b.kind === 'rout') !== null ? first((b) => b.kind === 'rout') + 1.4 : null,
      death: first((b) => b.kind === 'death'),
      result: T.duration,
      duration: T.duration,
    };
  },
  // ---- checks (task step 4) ----
  countStanding(t, speed) {
    const st = this.stage, T = st.T;
    st.frame(t, speed, this.view);
    const n = new Array(T.G.length).fill(0);
    for (let i = 0; i < T.F.length; i++) {
      const f = T.F[i];
      const sp = st.sprites[i];
      const dead = f.death && t >= f.death.t;
      if (sp) { if (sp.visible && sp.alpha > 0 && !dead) n[f.g]++; }
      else { const bb = st.bigs.find((b) => b.f === f); if (bb && bb.body.root.visible && !dead) n[f.g]++; }
    }
    return n;
  },
  checkBattle(key) {
    this.load(key);
    this.playing = false;
    const T = this.stage.T, B = this.B;
    const out = { key, title: B.title, rerunMatches: B.rerunMatches, duration: +T.duration.toFixed(1), phaseEnds: 0, figureMismatches: [], cardMismatches: [], figures: T.F.length };
    for (const speed of [1, 4]) {
      for (const pe of T.phaseEnds) {
        if (!pe.fold) continue;
        const n = this.countStanding(pe.t, speed);
        this.hud.update(pe.t);
        if (speed === 1) out.phaseEnds++;
        for (const [gi, v] of Object.entries(pe.fold.units)) {
          const [count, , , gone] = v;
          const expectStanding = gone ? 0 : count;
          if (n[gi] !== expectStanding) out.figureMismatches.push({ speed, round: pe.round, phase: pe.phase, group: B.groups[gi].unit, standing: n[gi], record: expectStanding });
          const card = countAt(T, +gi, pe.t);
          const el2 = this.hud.cardEls.get(+gi) || this.hud.miniEls.get(+gi);
          const shown = el2 ? +(el2.querySelector('.count, .cnt').textContent) : null;
          const g = B.groups[gi];
          const shownCount = g.cmd ? (countAt(T, +gi, pe.t)) : shown;
          if (card !== count || (shownCount !== null && shownCount !== count)) out.cardMismatches.push({ speed, round: pe.round, phase: pe.phase, group: g.unit, card: shownCount, model: card, record: count });
        }
      }
    }
    // every death left a body (or a death mark)
    const end = T.duration;
    this.stage.frame(end, 1, this.view);
    let marks = 0;
    T.decals.forEach((d, i) => { if ((d.kind === 'body' || d.kind === 'scorch' || d.kind === 'specks') && this.stage.decalSprites[i].visible) marks++; });
    const deaths = B.groups.reduce((a, g, i) => a + (g.cmd ? 1 : g.start) - B.end[i][0], 0);
    out.deaths = deaths; out.bodiesAtEnd = marks;
    out.bodiesOk = marks === deaths;
    // the replay ends with the record's winner
    this.hud.update(end);
    const rt = document.getElementById('resultTitle');
    out.winnerShown = rt ? rt.dataset.winner : null;
    out.winnerOk = out.winnerShown === B.winner;
    // determinism: the timeline built twice is the same
    const digest = (TT) => hash32(JSON.stringify({ d: TT.duration, f: TT.F.map((f) => [f.death && f.death.t, f.strikes.length, f.seatCues.length]), p: TT.projectiles.map((p) => [p.t0, p.t1, p.from, p.to]) }));
    const S2 = buildScript(B), T2 = buildTimeline(S2, layoutBattle(S2));
    out.deterministic = digest(T2) === digest(T);
    out.build = this.buildMs;
    return out;
  },
  /**
   * Frame timing: frames run back to back at a 60 Hz story step, timing the JS update (figures,
   * effects, camera, HUD) and Pixi's render submit separately on the CPU, then the GPU wait
   * (a 1-pixel readPixels sync). In this container the GPU is SwiftShader on the CPU, so the GPU
   * wait does not transfer to real hardware; the CPU times do.
   */
  async measure(key, speed, frames, from) {
    this.load(key);
    this.speed = speed; this.playing = false;
    const gl = this.app.renderer.gl, px = new Uint8Array(4);
    const up = [], rd = [], gp = [];
    let t = from;
    for (let i = 0; i < frames + 10; i++) {
      t = Math.min(this.stage.T.duration, t + (1 / 60) * speed * storyRate(this.stage.T, t, speed));
      const a = performance.now();
      this.applyCamera(t); this.stage.frame(t, speed, this.view); this.hud.update(t);
      const b = performance.now();
      this.app.renderer.render(this.app.stage);
      const c = performance.now();
      if (gl) gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      const d = performance.now();
      if (i >= 10) { up.push(b - a); rd.push(c - b); gp.push(d - c); }
      if (i % 15 === 0) await new Promise((r) => setTimeout(r, 0));
    }
    this.t = t;
    const pct = (arr, q) => { const s = [...arr].sort((x, y) => x - y); return +s[Math.min(s.length - 1, Math.floor(q * s.length))].toFixed(2); };
    const sum = up.map((x, i) => x + rd[i]);
    return { speed, frames: up.length, storySpan: +(t - from).toFixed(1), updateP50: pct(up, 0.5), updateP95: pct(up, 0.95), renderCpuP50: pct(rd, 0.5), renderCpuP95: pct(rd, 0.95),
      cpuP50: pct(sum, 0.5), cpuP95: pct(sum, 0.95), gpuWaitP50: pct(gp, 0.5), figures: this.stage.T.F.length, viewport: `${window.innerWidth}x${window.innerHeight}` };
  },
  /** Same-side figures of different squads closer than 9 wu, every 0.25 s (critique fix 2; qa/s6). */
  checkOverlap() {
    const T = this.stage.T, p = { x: 0, y: 0, h: 0 };
    let frames = 0, maxPairs = 0, first = null;
    for (let t = 0; t <= T.duration; t += 0.25) {
      const grid = new Map(); let n = 0;
      for (const f of T.F) {
        const Q = T.G[f.g];
        if (t < Q.appear || (f.death && t >= f.death.t) || (Q.leaveT !== null && t >= Q.leaveT) || Q.g.size >= 3 || Q.kind === 'cloud') continue;
        if (f.rout && t >= f.rout.t) continue;
        figPos(T, f, t, p);
        const cx = Math.floor(p.x / 9), cy = Math.floor(p.y / 9);
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
          for (const q of grid.get((cx + dx) + ',' + (cy + dy)) || []) {
            if (q.g === f.g || q.side !== Q.side || Math.abs(q.h - p.h) > 10) continue;
            if (Math.hypot(q.x - p.x, q.y - p.y) < 9) { n++; if (!first) first = { t: +t.toFixed(2), a: T.G[q.g].g.unit, b: Q.g.unit }; }
          }
        }
        const k = cx + ',' + cy; if (!grid.has(k)) grid.set(k, []);
        grid.get(k).push({ g: f.g, side: Q.side, x: p.x, y: p.y, h: p.h });
      }
      if (n) frames++;
      maxPairs = Math.max(maxPairs, n);
    }
    return { framesWithOverlap: frames, maxPairs, first };
  },
  /** Picking at a leader or a block's middle finds that group, never a big body behind it (critique fix 5). */
  checkPick() {
    const st = this.stage, T = st.T, m = this.moments();
    const out = { tried: 0, wrong: [] };
    for (const t of [m.clash !== null ? m.clash + 1.5 : 10, m.monster !== null ? m.monster : 20]) {
      this.seek(t); this.follow = true; this.user = null; this.render(t);
      const w = st.world;
      for (const G of T.G) {
        if (G.g.size >= 3 || t < G.appear || countAt(T, G.idx, t) === 0 || (G.routT !== null && t >= G.routT)) continue;
        let X, Y;
        if (G.g.isCmd) { const sp = st.sprites[G.figs[0]]; if (!sp || !sp.visible) continue; X = sp.x; Y = sp.y - 14; }
        else { const h = st.hull(G, t); if (!h) continue; X = h.X; Y = h.Y; }
        const px = w.position.x + X * w.scale.x, py = w.position.y + Y * w.scale.y;
        if (px < 0 || py < 0 || px > window.innerWidth || py > window.innerHeight) continue;
        out.tried++;
        const got = this.pick(px, py);
        if (got === null || T.G[got].g.size >= 3 || (G.g.isCmd && got !== G.idx)) out.wrong.push({ t: +t.toFixed(1), want: G.g.unit, got: got === null ? null : T.G[got].g.unit });
      }
    }
    return out;
  },
  /**
   * The two armies as rendered at deploy (critique fix 6; design 3.8): the median color of the pixels
   * on every rank-and-file figure's torso, per side, read back from the canvas. They must part by at
   * least CVD_MIN under every vision, and each side must stay 15 L* below its ground.
   */
  checkColors(B) {
    const st = this.stage, T = st.T;
    this.follow = true; this.user = null; this.seek(2.2); this.render(2.2);
    const gl = this.app.renderer.gl, cv = this.app.canvas, W = cv.width, H = cv.height, res = this.app.renderer.resolution;
    const px = new Uint8Array(W * H * 4);
    gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const w = st.world, acc = { near: [[], [], []], far: [[], [], []] };
    st.sprites.forEach((sp, i) => {
      if (!sp || !sp.visible) return;
      const Q = T.G[T.F[i].g];
      if (Q.g.isCmd || Q.kind === 'cloud') return;
      const side = Q.side === B.nearSide ? 'near' : 'far';
      const x = Math.round((w.position.x + sp.x * w.scale.x) * res), y = Math.round((w.position.y + (sp.y - 14) * w.scale.y) * res);
      const r = Math.max(1, Math.round(3 * w.scale.x * res));
      for (let dx = -r; dx <= r; dx++) for (let dy = -2 * r; dy <= r; dy++) {
        const X = x + dx, Y = H - 1 - (y + dy);
        if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
        const k = (Y * W + X) * 4;
        acc[side][0].push(px[k]); acc[side][1].push(px[k + 1]); acc[side][2].push(px[k + 2]);
      }
    });
    const med = (ch) => { const m = ch.map((a) => a.sort((p, q) => p - q)[a.length >> 1] || 0); return (m[0] << 16) | (m[1] << 8) | m[2]; };
    const a = med(acc.near), b = med(acc.far);
    const d = deltaEBy(a, b), ground = lstar(groundColor(B));
    const below = [+(ground - lstar(a)).toFixed(1), +(ground - lstar(b)).toFixed(1)];
    return { variants: st.paint ? { ...st.paint.sideLooks, painted: true } : { near: st.sideLooks.near, far: st.sideLooks.far }, nearRendered: numToHex(a), farRendered: numToHex(b), deltaE: d, belowGround: below,
      ok: VISIONS.every((v) => d[v] >= CVD_MIN) && below.every((x) => x >= 15) };
  },
});
