'use strict';
// ---- Game, part 4: the painted-figure checks (art use, faces, variation, side colour) and checks(), the whole suite ----
// Split from 90-main.js for size; behaviour unchanged.

Object.assign(Game.prototype, {
  // ---- painted figures (stage B): art use, face match, variation, side colour at play zoom ----
  /** Foot troops and commanders: which use painted frames (and that their sprites really show them), which cannot. */
  checkPaintUse() {
    const st = this.stage, T = st.T, B = this.B;
    const out = { troopGroups: 0, troopGroupsPainted: 0, commanders: 0, commandersPainted: 0, notPainted: [], spriteChecks: 0, spritesNotPainted: 0, standInMoments: 0, reported: [] };
    if (!st.paint) return { ...out, mode: 'procedural', ok: null };
    const track = new Set(['ashRider', 'wolfRider', 'wolf', 'fireSprite', 'hornetSwarm']); // mounts and creatures: their own review track
    for (const g of st.S.groups) {
      if (g.size >= 3 || (!g.isCmd && track.has(g.unit))) continue;
      const k = st.paint.lookOf[g.idx];
      if (g.isCmd) { out.commanders++; if (k) out.commandersPainted++; } else { out.troopGroups++; if (k) out.troopGroupsPainted++; }
      if (!k) out.notPainted.push({ unit: g.unit, cmd: !!g.isCmd, name: g.personal || null, why: st.paint.why[g.idx] });
      else for (const [v, vv] of Object.entries(PAINT.looks[k].views)) if (vv.status !== 'pass' && !(g.isCmd ? false : false)) out.reported.push({ look: k, view: v, status: vv.status, failed: vv.failed });
    }
    st.paint.standInMoments = 0;
    const m = this.moments();
    for (const t of [m.deploy, m.clash, m.rout, m.result].filter((x) => x !== null)) {
      st.frame(t, 1, this.view);
      st.sprites.forEach((sp, i) => {
        if (!sp || !sp.visible || !sp.paint) return;
        out.spriteChecks++;
        if (PAINTLIB.texLook.get(sp.texture) !== sp.paint.key) out.spritesNotPainted++;
      });
    }
    out.standInMoments = st.paint.standInMoments;
    const uniq = new Map(); for (const r of out.reported) uniq.set(r.look + '.' + r.view, r);
    out.reported = [...uniq.values()];
    out.allPainted = out.troopGroupsPainted === out.troopGroups && out.commandersPainted === out.commanders;
    // with the art that exists: every foot troop painted, every commander whose face has art painted, sprites honest
    out.ok = out.troopGroupsPainted === out.troopGroups && out.spritesNotPainted === 0
      && out.notPainted.every((n) => n.cmd && PAINT.missing.some((x) => x.unit === n.unit));
    return out;
  },
  /** Each commander's card portrait and field figure are the same face (read from the card's image and the sprite's texture). */
  checkFaceMatch() {
    const st = this.stage, T = st.T;
    const out = { commanders: 0, matched: 0, mismatches: [], noArt: [] };
    if (!st.paint) return { ...out, ok: null };
    const byHash = new Map(Object.entries(PAINT.looks).filter(([, L]) => L.kind === 'commander').map(([k, L]) => [L.portraitHash, k]));
    st.frame(2.2, 1, this.view);
    for (const g of st.S.groups) {
      if (!g.isCmd || g.size >= 3) continue;
      out.commanders++;
      const el2 = this.hud.cardEls.get(g.idx) || this.hud.miniEls.get(g.idx);
      const src = el2 ? el2.querySelector('img').getAttribute('src') : null;
      const fromCard = src ? byHash.get(hash32(src)) || null : null;
      const sp = st.sprites[T.G[g.idx].figs[0]];
      const fromFig = sp && sp.paint ? PAINTLIB.texLook.get(sp.texture) || null : null;
      if (!fromFig) { out.noArt.push({ unit: g.unit, name: g.personal, cardFace: fromCard, why: st.paint.why[g.idx] }); continue; }
      if (fromCard && fromCard === fromFig && PAINT.looks[fromFig].portraitHash === hash32(g.portrait)) out.matched++;
      else out.mismatches.push({ unit: g.unit, name: g.personal, card: fromCard, figure: fromFig });
    }
    // big bodies (stage C): the card the body shows is the portrait of the figure on the field
    out.bigs = { n: 0, matched: 0, mismatches: [] };
    for (const bb of st.bigs) {
      if (!bb.fig) continue;
      out.bigs.n++;
      const el2 = this.hud.cardEls.get(bb.G.idx) || this.hud.miniEls.get(bb.G.idx);
      const src = el2 ? el2.querySelector('img').getAttribute('src') : null;
      const want = PAINT.bigs[bb.fig].cardHash || PAINT.bigs[bb.fig].portraitHash; // the card shown: the 128 px crop where the body has one (fix 12)
      if (src && hash32(src) === want && bb.body.fig === bb.fig) out.bigs.matched++;
      else out.bigs.mismatches.push({ unit: bb.G.g.unit, figure: bb.fig, card: src ? hash32(src) : null });
    }
    out.ok = out.mismatches.length === 0 && out.bigs.mismatches.length === 0;
    return out;
  },
  /** No two neighbours in a block (deploy seats) identical in frame, tint and timing (owner note 1). */
  checkVariation() {
    const st = this.stage, T = st.T, L = st.L;
    const out = { blocks: 0, pairs: 0, identical: 0, differFrame: 0, differVariant: 0, differTint: 0, differTiming: 0, first: null };
    if (!st.paint) return { ...out, ok: null };
    st.frame(2.2, 1, this.view);
    for (const G of T.G) {
      const k = st.paint.lookOf[G.idx];
      if (!k || PAINT.looks[k].kind !== 'troop' || G.figs.length < 2) continue;
      out.blocks++;
      const seats = G.figs.map((fi) => { const f = T.F[fi]; const s = L.groups[G.idx].seats[f.member]; return { f, sp: st.sprites[fi], file: s.file, rank: s.rank }; });
      for (let a = 0; a < seats.length; a++) for (let b = a + 1; b < seats.length; b++) {
        const A = seats[a], Bq = seats[b];
        const dr = Math.abs(A.rank - Bq.rank), df = Math.abs(A.file - Bq.file);
        if (!((dr === 0 && df <= 1) || (dr === 1 && df <= 1))) continue;
        if (!A.sp.visible || !Bq.sp.visible) continue;
        out.pairs++;
        const va = A.sp.paint.vary, vb = Bq.sp.paint.vary;
        const sameFrame = A.sp.texture === Bq.sp.texture, sameVar = va.variant === vb.variant, sameTint = A.sp.tint === Bq.sp.tint;
        const sameTiming = Math.abs(va.phase - vb.phase) < 0.02 && Math.abs(va.tempo - vb.tempo) < 0.004;
        if (!sameFrame) out.differFrame++;
        if (!sameVar) out.differVariant++;
        if (!sameTint) out.differTint++;
        if (!sameTiming) out.differTiming++;
        if (sameFrame && sameTint && sameTiming) { out.identical++; if (!out.first) out.first = { unit: G.g.unit, a: [A.file, A.rank], b: [Bq.file, Bq.rank] }; }
      }
    }
    for (const k of ['differFrame', 'differVariant', 'differTint', 'differTiming']) out[k + 'Pct'] = out.pairs ? +(100 * out[k] / out.pairs).toFixed(1) : null;
    out.ok = out.identical === 0;
    return out;
  },
  /**
   * The side's colour at play zoom (art plan 1.4): the rank-and-file of each side rendered alone at a man = 28 px at
   * deploy (tier S, with the side keyline), and the share of visible pixels (weighted by coverage) within 20 degrees
   * of the side's base cloth hue with chroma >= max(0.04, 0.45 x the cloth's). Target 30% per side.
   */
  checkSideShare() {
    const st = this.stage, T = st.T, B = this.B, R = this.app.renderer;
    if (!st.paint) return { ok: null };
    this.follow = true; this.user = null; this.seek(2.2); this.render(2.2);
    const w = st.world, keep = { x: w.position.x, y: w.position.y, s: w.scale.x, tier: st.paint.tier };
    w.scale.set(1);
    st.applyPaintTier('S');
    st.frame(2.2, 1, this.view);
    const wallParts = st.wallLayer ? st.wallLayer.children.filter((c) => c !== st.walkUnits) : []; // keep the rampart's defenders
    const hide = [st.ground, st.decalLayer, st.groundFx, st.shadows, st.projShadow, ...wallParts, st.skyShadows, st.seeThrough, st.proj, st.fxNormal, st.fxAdd, st.spellG, st.spellAdd, st.glyphG, st.bannerLayer, ...(st.genBanners || []).map((b) => b.root), st.overlay].filter(Boolean);
    const hv = hide.map((o) => o.visible); hide.forEach((o) => (o.visible = false));
    const bigVis = st.bigs.map((bb) => bb.body.root.visible); st.bigs.forEach((bb) => (bb.body.root.visible = false));
    const vis = st.sprites.map((sp) => sp && sp.visible);
    const out = { tier: 'S', manPx: 28, sides: {} };
    const gl = R.gl;
    for (const side of ['attacker', 'defender']) {
      const nat = B.sides[side].def, cloth = PAINT.cloth[nat];
      if (!cloth) continue;
      const c = oklchOf(hexToNum(cloth)), cmin = Math.max(0.04, 0.45 * c.C);
      const acc = { visible: 0, side: 0, groups: [] };
      for (const G of T.G) {
        if (G.side !== side || G.g.isCmd || G.g.size >= 3 || G.kind === 'cloud' || !st.paint.lookOf[G.idx]) continue;
        let X0 = Infinity, Y0 = Infinity, X1 = -Infinity, Y1 = -Infinity;
        st.sprites.forEach((sp, i) => { if (!sp) return; const on = vis[i] && T.F[i].g === G.idx; sp.visible = on; if (on) { X0 = Math.min(X0, sp.x - 30); X1 = Math.max(X1, sp.x + 30); Y0 = Math.min(Y0, sp.y - 50); Y1 = Math.max(Y1, sp.y + 12); } });
        if (!isFinite(X0)) continue;
        const W = Math.min(2048, Math.ceil(X1 - X0)), H = Math.min(2048, Math.ceil(Y1 - Y0));
        w.position.set(-X0, -Y0);
        const rt = PIXI.RenderTexture.create({ width: W, height: H, resolution: 1 });
        R.render({ container: this.app.stage, target: rt, clear: true, clearColor: [0, 0, 0, 0] });
        const px = new Uint8Array(W * H * 4);
        R.renderTarget.bind(rt, false); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
        if (R.renderTarget.rootRenderTarget) R.renderTarget.bind(R.renderTarget.rootRenderTarget, false);
        rt.destroy(true);
        // coverage-weighted: a pixel counts by its alpha (the 1 px keyline is half covered at a man of 28 px)
        let nv = 0, ns = 0;
        for (let q = 0; q < px.length; q += 4) {
          const a = px[q + 3];
          if (a < 26) continue;
          nv += a / 255;
          const r = Math.min(255, Math.round(px[q] * 255 / a)), g2 = Math.min(255, Math.round(px[q + 1] * 255 / a)), b = Math.min(255, Math.round(px[q + 2] * 255 / a));
          const o = oklchOf((r << 16) | (g2 << 8) | b);
          const dh = Math.abs(((o.h - c.h + 540) % 360) - 180);
          if (dh <= 20 && o.C >= cmin) ns += a / 255;
        }
        acc.visible += nv; acc.side += ns;
        acc.groups.push({ unit: G.g.unit, share: nv ? +(100 * ns / nv).toFixed(1) : null });
      }
      out.sides[side] = { nation: nat, near: side === B.nearSide, sideLook: st.paint.sideWhich[side], sharePct: acc.visible ? +(100 * acc.side / acc.visible).toFixed(1) : null, groups: acc.groups };
    }
    st.sprites.forEach((sp, i) => { if (sp) sp.visible = vis[i]; });
    hide.forEach((o, i) => (o.visible = hv[i]));
    st.bigs.forEach((bb, i) => (bb.body.root.visible = bigVis[i]));
    w.scale.set(keep.s); w.position.set(keep.x, keep.y);
    st.applyPaintTier(keep.tier);
    this.render(this.t);
    out.ok = Object.values(out.sides).every((s) => s.sharePct !== null && s.sharePct >= 30);
    return out;
  },
  async checks(opts = {}) {
    const report = { figures: PAINT_MODE.on ? 'painted' : 'procedural', battles: [], frameTiming: [] };
    for (const b of DATA) {
      const r = this.checkBattle(b.key);
      r.overlap = this.checkOverlap();
      r.pick = this.checkPick();
      r.colors = this.checkColors(this.B);
      if (this.stage.paint) {
        r.paint = this.checkPaintUse();
        r.faces = this.checkFaceMatch();
        r.variation = this.checkVariation();
        r.sideShare = this.checkSideShare();
        r.deadHandoff = this.checkDeadHandoff ? this.checkDeadHandoff() : { ok: null };
        r.creatures = this.checkCreatures();
        r.bigHeights = this.checkBigHeights();
        r.wolfFront = this.checkWolfFront();
        r.paintBuild = { bakeMs: +this.stage.paint.bakeMs.toFixed(1), decodeMs: +PAINTLIB.loadMs.toFixed(1) };
      }
      report.battles.push(r);
    }
    // the clock: the first frames never ran story time below 0, and a stale timestamp cannot step it back
    {
      const saved = { t: this.t, lastNow: this.lastNow, playing: this.playing };
      this.playing = true; this.t = 1; const now = performance.now(); this.lastNow = now + 4000;
      this.advance(now);
      const stale = this.t;
      this.lastNow = null; this.advance(now); const firstStep = this.t;
      Object.assign(this, saved);
      report.clock = { firstFrames: this.firstFrames.slice(), staleStepT: +stale.toFixed(4), firstStepT: +firstStep.toFixed(4) };
      report.clock.ok = this.firstFrames.every((f) => f.t >= 0) && stale === 1 && firstStep === 1;
    }
    // GPU textures: loading the three battles again leaves the managed texture count where it was
    {
      const r = this.app.renderer, count = () => (r.texture && r.texture.managedTextures ? r.texture.managedTextures.filter(Boolean).length : -1);
      const counts = [];
      for (let round = 0; round < 3; round++) { for (const b of DATA) { this.load(b.key); this.render(1); } counts.push(count()); }
      report.textures = { afterEachRound: counts, ok: counts[1] === counts[0] && counts[2] === counts[0] };
    }
    if (opts.timing !== false) {
      for (const b of DATA) {
        const m0 = (() => { this.load(b.key); return this.moments(); })();
        for (const sp of [1, 4]) report.frameTiming.push({ battle: b.key, ...(await this.measure(b.key, sp, opts.frames || 240, Math.max(3, (m0.clash || 10) - 1))) });
      }
    }
    report.pageErrors = window.__errors.slice();
    report.ok = report.battles.every((x) => !x.figureMismatches.length && !x.cardMismatches.length && x.bodiesOk && x.winnerOk && x.rerunMatches && x.deterministic
      && x.overlap.framesWithOverlap === 0 && x.pick.wrong.length === 0 && x.colors.ok) && report.clock.ok && report.textures.ok && report.pageErrors.length === 0;
    if (PAINT_MODE.on) {
      // the painted checks: met with the art that exists; allPainted says whether every foot troop and commander has art
      report.paintOk = report.battles.every((x) => x.paint && x.paint.ok && x.faces.ok && x.variation.ok && x.sideShare.ok && x.deadHandoff.ok !== false
        && x.creatures.ok && x.bigHeights.ok && x.wolfFront.ok !== false);
      report.allPainted = report.battles.every((x) => x.paint && x.paint.allPainted);
    }
    return report;
  },
});
