'use strict';
// ---- the magic pilot in the timeline (stage D): storyboard beats, the struck troops' clusters, blast kills ----
// Pure functions of the record and the layout, called by buildTimeline (31-build.js). The effects layer only reads what
// they build, so seeking, Beats mode, replays and screenshots stay exact.

/** A pilot spell's beat lengths for a form (FX_LOOKS), or null when the spell keeps the mockup's old drawing. */
function fxBeats(spellId, form, rushed) {
  const L = FX_LOOKS[spellId];
  if (!L) return null;
  const b = rushed ? (L.beats.rushed || L.beats.short) : (L.beats[form] || L.beats.short || L.beats.full);
  return { charge: b[0], release: b[1], travel: b[2], impact: b[3], linger: b[4], form: rushed ? 'rushed' : form };
}
/** The five beats as story-time spans [t0, t1], from the cast's start, its release and its (possibly delayed) impact. */
function fxBeatTimes(start, release, impact, b) {
  const r1 = release + b.release, i1 = impact + b.impact;
  return { charge: [start, release], release: [release, r1], travel: [r1, impact], impact: [impact, i1], linger: [i1, i1 + b.linger], form: b.form };
}

/**
 * The struck troops of a blast, grouped by where they stand at impact (single linkage within look.link wu): the largest
 * group takes the burst; every other group is struck by a burning fragment flung from it (the sim's area pick is not
 * spatial, so its troops can stand in two blocks), landing later by its distance. Returns the groups and, per figure,
 * its group and its hit time.
 */
function fxClusters(T, figs, t, look) {
  const p = { x: 0, y: 0, h: 0 };
  const seen = new Set(), pts = [];
  for (const f of figs) { if (seen.has(f.id)) continue; seen.add(f.id); figPos(T, f, t, p); pts.push({ f, x: p.x, y: p.y }); }
  const parent = pts.map((_, i) => i);
  const find = (i) => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
    if (Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y) <= look.link) parent[find(i)] = find(j);
  }
  const byRoot = new Map();
  pts.forEach((q, i) => { const r = find(i); if (!byRoot.has(r)) byRoot.set(r, []); byRoot.get(r).push(q); });
  const list = [...byRoot.values()].map((g) => {
    const x = g.reduce((s, q) => s + q.x, 0) / g.length, y = g.reduce((s, q) => s + q.y, 0) / g.length;
    return { figs: g.map((q) => q.f.id), x, y, r: Math.max(12, ...g.map((q) => Math.hypot(q.x - x, q.y - y))) };
  });
  list.sort((a, b) => b.figs.length - a.figs.length || a.figs[0] - b.figs[0]);
  const of = new Map();
  if (!list.length) return { list, of };
  const main = list[0];
  main.main = true; main.tLaunch = t; main.tLand = t; main.dist = 0;
  for (const c of list.slice(1)) {
    c.dist = Math.hypot(c.x - main.x, c.y - main.y);
    c.tLaunch = t + 0.03;
    c.tLand = c.tLaunch + clamp(c.dist / 1100, 0.18, 0.42);
  }
  list.forEach((c, ci) => c.figs.forEach((id, i) => of.set(id, { t: c.tLand + (c.main ? 0.025 * (i % 4) : 0.02 * (i % 3)), ci, cluster: c })));
  return { list, of };
}

/**
 * A blast kill (docs/12 S2.9 'thrown', art plan 6: 16 to 40 wu along the ground for fireball kills): the death starts
 * where the figure stood and ends out along the line from the blast's centre; it burns out (no blood pool; a charred body).
 * Fills f.death.from / hop / fire; figPos interpolates the throw (30-timeline.js).
 */
function fxThrow(T, f, t, at, centre, look) {
  const dx = at.x - centre.x, dy = at.y - centre.y, d = Math.hypot(dx, dy);
  const u = u01(T.id + '/thrown/' + f.id);
  const ang = d > 2 ? Math.atan2(dy, dx) : u * TAU;
  const dist = lerp(look.thrown[0], look.thrown[1], u01(T.id + '/thrownD/' + f.id));
  return { from: { x: at.x, y: at.y, h: at.h }, to: { x: at.x + Math.cos(ang) * dist, y: at.y + Math.sin(ang) * dist, h: 0 }, fall: look.thrownFall, hop: 6 + 6 * u };
}
