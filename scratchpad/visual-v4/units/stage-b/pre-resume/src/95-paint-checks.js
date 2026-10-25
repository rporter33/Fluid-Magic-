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
