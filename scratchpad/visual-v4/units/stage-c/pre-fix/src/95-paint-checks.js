'use strict';
// ---- painted-figure checks added by the stage B fix pass (kept apart: 90-main.js is already long) ----

/**
 * The dead-pose handoff (stage B critique fix 4): for every painted death with a body decal, the falling sprite's last
 * frame (at death.t + fall - 0.004) and the decal's first (at + 0.004) show the same texture (the same dead pose,
 * variant and tier), the same mirror, the same rotation and the same place. Target: 0 mismatches.
 */
Game.prototype.checkDeadHandoff = function checkDeadHandoff() {
  const st = this.stage, T = st.T;
  const out = { deaths: 0, texMismatch: 0, mirrorMismatch: 0, rotErr: 0, posErr: 0, first: null };
  if (!st.paint) return Object.assign(out, { ok: null });
  const decalOf = new Map();
  T.decals.forEach((d, i) => { if (d.kind === 'body') decalOf.set(d.f, i); });
  for (let i = 0; i < T.F.length; i++) {
    const f = T.F[i], sp = st.sprites[i];
    if (!f.death || !sp || !sp.paint || !decalOf.has(i)) continue;
    const t1 = f.death.t + f.death.fall - 0.004, t2 = f.death.t + f.death.fall + 0.004;
    st.frame(t1, 1, this.view);
    const a = { tex: sp.texture, mir: Math.sign(sp.scale.x), x: sp.x, y: sp.y, rot: sp.rotation };
    st.frame(t2, 1, this.view);
    const d = st.decalSprites[decalOf.get(i)];
    out.deaths++;
    const bad = [];
    if (a.tex !== d.texture) { out.texMismatch++; bad.push('texture'); }
    if (a.mir !== Math.sign(d.scale.x)) { out.mirrorMismatch++; bad.push('mirror'); }
    if (Math.abs(a.rot - d.rotation) > 0.01) { out.rotErr++; bad.push('rotation'); }
    if (Math.hypot(a.x - d.x, a.y - d.y) > 0.5) { out.posErr++; bad.push('place'); }
    if (bad.length && !out.first) out.first = { fig: i, unit: T.G[f.g].g.unit, t: +f.death.t.toFixed(2), bad };
  }
  this.render(this.t);
  out.ok = out.texMismatch + out.mirrorMismatch + out.rotErr + out.posErr === 0;
  return out;
};

// ---- stage C (owner review 2): creatures, mounts and gods standing in the game ----
/** The creature, mount and god units (key-pose looks of stage C, and every big body). */
const STAGE_C_UNITS = new Set(['fireSprite', 'hornetSwarm', 'wolf', 'oakheart', 'ashRider', 'wolfRider']);

/**
 * Every creature, mount and god in the battle uses its painted stage C art (the Salamander 01 cutout of the pilot
 * counts as painted): key-pose groups have a stage C look and their sprites show its frames at deploy, clash, rout and
 * the end; every big body is a painted cutout. Lists each with its look, the views it shows and their status.
 */
Game.prototype.checkCreatures = function checkCreatures() {
  const st = this.stage, T = st.T;
  const out = { groups: 0, painted: 0, notPainted: [], list: [], spriteChecks: 0, spritesNotPainted: 0 };
  if (!st.paint) return Object.assign(out, { ok: null });
  for (const g of st.S.groups) {
    if (g.size >= 3) {
      out.groups++;
      const bb = st.bigs.find((b) => b.G.idx === g.idx);
      if (bb && bb.body.painted) {
        out.painted++;
        const v = PAINT.bigs[bb.fig].views[bb.body.view];
        out.list.push({ unit: g.unit, figure: bb.fig, view: bb.body.view, status: v.status, failed: v.failed, heightWu: v.heightWu });
      } else out.notPainted.push({ unit: g.unit, why: st.paint.why[g.idx] });
      continue;
    }
    if (!STAGE_C_UNITS.has(g.unit) || g.isCmd) continue;
    out.groups++;
    const k = st.paint.lookOf[g.idx], L = k ? PAINT.looks[k] : null;
    if (L && L.stage === 'C') {
      out.painted++;
      const vs = Object.fromEntries(Object.entries(L.views).map(([v, x]) => [v, x.status + (x.failed.length ? ' (' + x.failed.join(', ') + ')' : '')]));
      out.list.push({ unit: g.unit, look: k, kind: L.kind, layout: L.layout, views: vs, front: L.alt ? PAINT_ALT[k] : undefined });
    } else out.notPainted.push({ unit: g.unit, why: st.paint.why[g.idx] });
  }
  const m = this.moments();
  for (const t of [m.deploy, m.clash, m.rout, m.result].filter((x) => x !== null)) {
    st.frame(t, 1, this.view);
    st.sprites.forEach((sp, i) => {
      if (!sp || !sp.visible || !sp.paint || !STAGE_C_UNITS.has(T.G[T.F[i].g].g.unit)) return;
      out.spriteChecks++;
      if (PAINTLIB.texLook.get(sp.texture) !== sp.paint.key) out.spritesNotPainted++;
    });
  }
  this.render(this.t);
  out.ok = out.groups === out.painted && out.spritesNotPainted === 0;
  return out;
};

/**
 * Each painted big body's height on screen is its metadata's true height (heightWu), at both tiers: the sprite's
 * bounds as drawn, in world units, less the keyline, standing at deploy. Target within 1 wu or 1%.
 */
Game.prototype.checkBigHeights = function checkBigHeights() {
  const st = this.stage, w = st.world;
  const out = { bodies: [], worstErrWu: 0 };
  if (!st.paint) return Object.assign(out, { ok: null });
  const keep = st.paint.tier;
  this.follow = true; this.user = null; this.seek(2.2); this.render(2.2);
  for (const bb of st.bigs) {
    if (!bb.body.painted) continue;
    const row = { figure: bb.fig, view: bb.body.view, heightWu: bb.body.heightWu };
    for (const tier of ['S', 'H']) {
      bb.body.setTier(tier);
      const b = bb.body.sprite.getBounds();
      const k = PAINT.wuPerPx[tier];
      const hWu = (b.maxY - b.minY) / w.scale.y - 2 * bb.body.pad * k;
      row[tier] = +hWu.toFixed(2);
      const err = Math.abs(hWu - bb.body.heightWu);
      row[tier + 'ok'] = err <= Math.max(1, 0.01 * bb.body.heightWu);
      out.worstErrWu = Math.max(out.worstErrWu, +err.toFixed(2));
    }
    bb.body.setTier(keep);
    out.bodies.push(row);
  }
  this.render(this.t);
  out.ok = out.bodies.every((r) => r.Sok && r.Hok);
  return out;
};

/**
 * The Wolf Rider front control swaps that frame set only: with the battle drawn at deploy and at the clash, switching
 * to the kept test changes exactly the Wolf Rider sprites that show a front frame (and no other sprite or body on the
 * ground), each to its kept-test frame, and switching back restores every texture. The default is the harness.
 */
Game.prototype.checkWolfFront = function checkWolfFront() {
  const st = this.stage, T = st.T;
  if (!st.paint || !st.S.groups.some((g) => st.paint.lookOf[g.idx] === 'wolfRider')) return { ok: null, why: 'no Wolf Riders in this battle' };
  const out = { defaultHarness: PAINT_ALT.wolfRider === 'harness', moments: [], changedOther: 0, unchangedFront: 0, notRestored: 0, frontShown: 0 };
  const saved = PAINT_ALT.wolfRider;
  const snap = () => ({ s: st.sprites.map((sp) => (sp && sp.visible ? sp.texture : null)), d: (st.paintDecals || []).map((d) => d.texture) });
  const m = this.moments();
  for (const t of [m.deploy, m.clash, m.rout].filter((x) => x !== null)) {
    this.setWolfFront('harness'); st.frame(t, 1, this.view); const A = snap();
    this.setWolfFront('kept'); st.frame(t, 1, this.view); const B = snap();
    this.setWolfFront('harness'); st.frame(t, 1, this.view); const C = snap();
    let front = 0;
    A.s.forEach((tx, i) => {
      if (!tx) return;
      const wr = st.sprites[i].paint && st.sprites[i].paint.key === 'wolfRider' && /^wolfRider\.front\./.test(tx.pname || '');
      if (wr) { front++; if (B.s[i] === tx || !/^wolfRider\.frontKept\./.test((B.s[i] && B.s[i].pname) || '')) out.unchangedFront++; }
      else if (B.s[i] !== tx) out.changedOther++;
      if (C.s[i] !== tx) out.notRestored++;
    });
    A.d.forEach((tx, i) => {
      const wrd = st.paintDecals[i].pdecal.sp.paint.key === 'wolfRider' && /^wolfRider\.front\./.test(tx.pname || '');
      if (!wrd && B.d[i] !== tx) out.changedOther++;
      if (C.d[i] !== tx) out.notRestored++;
    });
    out.frontShown += front;
    out.moments.push({ t: +t.toFixed(1), wolfRiderFrontSprites: front });
  }
  this.setWolfFront(saved);
  this.render(this.t);
  out.ok = out.defaultHarness && out.changedOther === 0 && out.unchangedFront === 0 && out.notRestored === 0;
  return out;
};
