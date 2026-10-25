'use strict';
// ---- the magic pilot in the timeline (stage D): storyboard beats, the struck troops' clusters, blast kills ----
// Pure functions of the record and the layout, called by buildTimeline (31-build.js). The effects layer only reads what
// they build, so seeking, Beats mode, replays and screenshots stay exact.

/**
 * A pilot spell's beat lengths for a form (FX_LOOKS), or null when the spell keeps the mockup's old drawing. The full and
 * short forms are scaled to the spell's fx.duration and fx.durationShort (ms) when those differ from the storyboard's
 * sums, so a duration changed in the data table re-times every beat.
 */
function fxBeats(spellId, form, rushed) {
  const L = FX_LOOKS[spellId];
  if (!L) return null;
  const key = rushed ? (L.beats.rushed ? 'rushed' : 'short') : (L.beats[form] ? form : L.beats.short ? 'short' : 'full');
  const b = L.beats[key], sum = b.reduce((s, x) => s + x, 0);
  const want = key === 'full' ? L.fx && L.fx.duration : key === 'short' ? L.fx && L.fx.durationShort : null;
  const k = want ? want / 1000 / sum : 1;
  return { charge: b[0] * k, release: b[1] * k, travel: b[2] * k, impact: b[3] * k, linger: b[4] * k, form: rushed ? 'rushed' : form };
}
/** A spell's effect family (docs/09): its fx record, else docs/09's defaults by what the spell does. */
function fxFamily(spellId, look) {
  const r = FX_SPELLS[spellId];
  if (r) return r.family;
  const kind = look && look.kind;
  return kind === 'meteors' || kind === 'burst' || kind === 'spray' ? 'burst' : kind === 'storm' || kind === 'field' ? 'field' : kind === 'aura' || kind === 'column' || kind === 'ripple' || kind === 'leaves' || kind === 'wave' ? 'aura' : kind === 'summon' ? 'summon' : 'strike';
}
/**
 * docs/09's concurrency rule: at most FX_RULES.maxConcurrent burst or field effects play at once; a cast that would be
 * one too many waits, in event order, until the earliest of them ends. Returns the cast's (possibly later) start.
 */
function fxQueueStart(T, family, start) {
  if (!FX_FAMILIES[family] || !FX_FAMILIES[family].concurrent) return start;
  let s = start;
  for (let guard = 0; guard < 16; guard++) {
    const on = T.spellFx.filter((e) => e.concurrent && e.t0 <= s && e.playEnd > s);
    if (on.length < FX_RULES.maxConcurrent) return s;
    s = Math.min(...on.map((e) => e.playEnd));
  }
  return s;
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
    const F = look.fragment;
    c.tLaunch = t + F.launch;
    c.tLand = c.tLaunch + clamp(c.dist / F.speed, F.fly[0], F.fly[1]);
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
