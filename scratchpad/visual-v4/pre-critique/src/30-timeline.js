'use strict';
// ---- the timeline: one canonical story time in seconds at 1x (docs/12 point 5) ----
// Everything the renderer draws is a pure function of story time t, evaluated from the cues
// built here: group paths, figure seats, strikes, reactions, deaths, projectiles, bursts,
// decals, rings, glyphs, beats and camera keys.

const MOTIONS = {
  Spear: ['thrust', 0.10, 0.06, 0.14, 14], Lance: ['couched', 0.08, 0.05, 0.15, 18], Halberd: ['chopThrust', 0.18, 0.07, 0.20, 12],
  Axe: ['chop', 0.13, 0.06, 0.15, 10], 'Great Axe': ['greatChop', 0.18, 0.07, 0.20, 14], Sword: ['slash', 0.12, 0.06, 0.14, 10],
  'Burning Blade': ['slash', 0.12, 0.06, 0.14, 10], 'Great Sword': ['sweep', 0.35, 0.10, 0.35, 20], Club: ['smash', 0.35, 0.10, 0.35, 18],
  'Oak Maul': ['smash', 0.20, 0.08, 0.22, 12], 'Crushing Limbs': ['slam', 0.40, 0.10, 0.40, 16], Dagger: ['stab2', 0.06, 0.04, 0.08, 8],
  Knife: ['stab2', 0.06, 0.04, 0.08, 8], Staff: ['bonk', 0.10, 0.06, 0.12, 8], Bite: ['pounce', 0.12, 0.06, 0.16, 18],
  'Wolf Bite': ['pounce', 0.12, 0.06, 0.16, 18], Sting: ['darts', 0.05, 0.03, 0.05, 10], 'Flame Touch': ['dive', 0.10, 0.05, 0.15, 20],
  Unarmed: ['shove', 0.10, 0.05, 0.15, 6], 'Hero\'s Blade': ['slash', 0.12, 0.06, 0.14, 10], Claws: ['rake', 0.12, 0.05, 0.18, 24],
};
const WYRM_BITE = ['neckLunge', 0.30, 0.08, 0.35, 40];
const RANGED = {
  Shortbow: { flight: 0.65, apex: 110, kind: 'arrow' }, Longbow: { flight: 0.85, apex: 180, kind: 'arrow' },
  'Fire Arrows': { flight: 0.80, apex: 150, kind: 'fireArrow' }, Javelins: { flight: 0.50, apex: 60, kind: 'javelin' },
  Breath: { flight: 0.25, apex: 0, kind: 'breath' }, 'Fire Breath': { flight: 0.22, apex: 0, kind: 'breath' },
};
const BUDGET = { melee: { 1: 90, 2: 55, 4: 30 }, ranged: { 1: 400, 2: 240, 4: 120 } };
function budgetFor(kind, speed) { const b = BUDGET[kind]; return speed <= 1 ? b[1] : speed <= 2 ? b[2] : b[4]; }
/** docs/12 S2.6: a ranked item shows at speed s when r < max(B(s) - |mandatory|, s <= 1 ? coverage : 0). */
function shownAt(item, speed) {
  if (item.mand) return true;
  const ph = item.ph;
  const thr = Math.max(budgetFor(ph.kind, speed) - ph.nMand, speed <= 1 ? ph.coverage : 0);
  return item.rank < thr;
}

// ---- paths: piecewise motion of a group origin, closed form ----
function pathAt(path, t, out) {
  // path: [{t0,t1,x0,y0,h0,x1,y1,h1,e}] sorted by t0, contiguous in effect
  let seg = null;
  for (let i = path.length - 1; i >= 0; i--) if (path[i].t0 <= t) { seg = path[i]; break; }
  if (!seg) seg = path[0];
  if (t <= seg.t0) { out.x = seg.x0; out.y = seg.y0; out.h = seg.h0; return out; }
  if (t >= seg.t1) { out.x = seg.x1; out.y = seg.y1; out.h = seg.h1; return out; }
  let k = (t - seg.t0) / (seg.t1 - seg.t0);
  k = seg.e === 'lin' ? k : seg.e === 'out' ? easeOut(k) : seg.e === 'in' ? easeIn(k) : smooth(k);
  out.x = lerp(seg.x0, seg.x1, k); out.y = lerp(seg.y0, seg.y1, k); out.h = lerp(seg.h0, seg.h1, k);
  return out;
}
function pathEnd(path) { const s = path[path.length - 1]; return { x: s.x1, y: s.y1, h: s.h1, t: s.t1 }; }
/** Appends a move from wherever the path is at t0. Later segments are dropped (moves are appended in time order). */
function pathMove(path, t0, dur, x, y, h, e) {
  // The running segment is left untouched (times before t0 keep their positions); the new
  // segment starts where the old path is at t0 and governs from t0 on.
  const o = pathAt(path, t0, { x: 0, y: 0, h: 0 });
  while (path.length > 1 && path[path.length - 1].t0 >= t0) path.pop();
  path.push({ t0, t1: t0 + Math.max(dur, 1e-3), x0: o.x, y0: o.y, h0: o.h, x1: x, y1: y, h1: h === undefined ? o.h : h, e: e || 'smooth' });
}

// ---- seats: per figure, changes eased over 0.4 s ----
function seatAt(f, t, out) {
  const cues = f.seatCues;
  let i = cues.length - 1;
  while (i > 0 && cues[i].t > t) i--;
  const c = cues[i];
  if (t >= c.t + c.d) { out.u = c.u; out.v = c.v; return out; }
  const k = smooth((t - c.t) / c.d);
  out.u = lerp(c.u0, c.u, k); out.v = lerp(c.v0, c.v, k);
  return out;
}
/** A seat cue: closing ranks, dressing; starts from wherever the seat is at t. */
function addSeat(f, t, u, v, d) {
  const last = f.seatCues[f.seatCues.length - 1];
  if (t < last.t) t = last.t;
  const cur = seatAt(f, t, { u: 0, v: 0 });
  f.seatCues.push({ t, d: d || 0.4, u0: cur.u, v0: cur.v, u, v });
  f.u = u; f.v = v;
}

const _o = { x: 0, y: 0, h: 0 }, _s = { u: 0, v: 0 };
/** Ground position of a figure at story time t (no transient lunges): {x, y, h}. */
function figPos(T, f, t, out) {
  const G = T.G[f.g];
  pathAt(G.path, t, _o);
  seatAt(f, t, _s);
  let x = _o.x + _s.u, y = _o.y + G.s * _s.v, h = _o.h + (f.alt || 0);
  const r = f.rout;
  if (r && t > r.t) {
    const k = clamp((t - r.t) / r.dur, 0, 1);
    let d = r.D * easeOut(k);
    if (r.tLeave !== null && t > r.tLeave) d += 40 * clamp((t - r.tLeave) / 0.5, 0, 1);
    x += r.dx * d; y += r.dy * d;
    if (G.onWall) h *= 1 - smooth((t - r.t) / 0.9); // routers jump down from the walk
  }
  if (f.death && t >= f.death.t) { // frozen where it fell (flyers drop to the ground)
    const p = f.death.at;
    out.x = p.x; out.y = p.y;
    out.h = !f.death.drop ? p.h : t >= f.death.t + f.death.fall ? 0 : p.h * (1 - easeIn((t - f.death.t) / f.death.fall));
    return out;
  }
  out.x = x; out.y = y; out.h = h;
  return out;
}

function makeTimeline(S, L) {
  const T = {
    S, L, id: S.B.id, G: [], F: [], strikes: [], projectiles: [], bursts: [], decals: [], rings: [], glyphs: [],
    beats: [], ticker: [], camera: [], segments: [], phaseEnds: [], spellFx: [], slow: [], nameCards: [], deathsAll: [],
    duration: 0, seamY: null, seamPush: 0, wall: null, rounds: [], counts: [], cmdHp: [], summonsAt: [], charges: [],
  };
  // groups and figures
  for (const g of S.groups) {
    const lg = L.groups[g.idx];
    const G = {
      g, idx: g.idx, kind: lg.kind, s: lg.s, side: g.side, figs: [], memberFig: [], path: [],
      appear: g.summoned ? Infinity : -Infinity, routT: null, leaveT: null, inContact: false, everContact: false,
      ext: lg.ext, closing: closingRoundOf(S, g), steps: 0, lastX: lg.x,
    };
    const h0 = lg.kind === 'body' && g.flying ? 120 : 0;
    G.path.push({ t0: -1e9, t1: -1e9, x0: lg.x, y0: lg.yFront, h0, x1: lg.x, y1: lg.yFront, h1: h0, e: 'lin' });
    lg.seats.forEach((seat, m) => {
      const f = {
        id: T.F.length, g: g.idx, member: m, file: seat.file, rank: seat.rank, alive: true,
        seatCues: [{ t: -1e9, d: 0.4, u0: seat.u, v0: seat.v, u: seat.u, v: seat.v }], u: seat.u, v: seat.v,
        strikes: [], reacts: [], shots: [], death: null, wounds: [], rout: null, marked: false,
        phase: u01(S.B.id + '/idle/' + g.idx + '/' + m), alt: 0, hp: g.isCmd ? g.hp : g.maxHp,
        maxHp: g.isCmd ? g.maxHp : g.maxHp,
      };
      if (lg.kind === 'cloud') f.alt = 40 + 40 * u01(S.B.id + '/alt/' + g.idx + '/' + m);
      T.F.push(f); G.figs.push(f.id); G.memberFig[m] = f.id;
    });
    T.G[g.idx] = G;
  }
  return T;
}

function closingRoundOf(S, g) {
  const R = S.B.rules;
  const sp = g.flying ? R.flyingSpeed : g.speed;
  return R.closingRound[sp] ?? 4;
}
