'use strict';
// ---- painted figures, part 3: the motion layer of the troops, commanders, riders and small creatures ----

// ---------------------------------------------------------------- the motion layer: pose and transforms at t
const _rs0 = { x: 0, y: 0, h: 0 }, _rs1 = { x: 0, y: 0, h: 0 };
/** A figure's ground speed at t (wu/s), over the next 1/30 s. */
function routSpeed(T, f, t) {
  figPos(T, f, t, _rs0); figPos(T, f, t + 1 / 30, _rs1);
  return Math.hypot(_rs1.x - _rs0.x, _rs1.y - _rs0.y) * 30;
}
/** The seat cue sliding a figure at t (a slide of more than 4 wu), or null. */
function activeSeatCue(f, t) {
  const c = f.seatCues;
  if (!c) return null;
  for (let i = c.length - 1; i >= 0; i--) {
    const q = c[i];
    if (q.t <= t) return t < q.t + q.d && Math.hypot(q.u - q.u0, q.v - q.v0) > 4 ? q : null;
  }
  return null;
}
const _pp = { pose: 0, rot: 0, lift: 0, sx: 1, sy: 1, dx: 0, dy: 0 };
/**
 * The painted pose of a figure at t, read from the same timeline data as evalFigure (st holds its result:
 * position, view, flip, visibility). Returns a reused object: the pose id and closed-form transforms.
 */
/** The hit flash's window in story seconds: one frame at 60 fps, and one real frame at 2x and 4x (docs/12 S2.14). */
function hitFlashWin(speed) { return Math.max(1, speed || 1) / 60; }
/** Reduced motion (the OS setting or the menu's toggle): hit flashes become a red tint. */
function hitReduced() { return typeof GAME !== 'undefined' && !!GAME.reduced; }
function paintPose(T, f, G, t, speed, st, look, v, extra) {
  const o = _pp;
  o.pose = PP.stand; o.rot = 0; o.lift = 0; o.sx = 1; o.sy = 1; o.dx = 0; o.dy = 0; o.hurt = 0;
  const near = G.s < 0;
  const tempo = v.tempo;
  const fwd = st.flip ? -1 : 1; // the screen x direction the figure faces (both views: flip turns it left)
  // dead or falling: fall, then the dead pose the decal keeps
  if (f.death && t >= f.death.t) {
    const k = (t - f.death.t) / f.death.fall;
    o.pose = k < 0.5 ? PP.fall : (f.death.flip ? PP.deadB : PP.deadA); // the decal keeps this same pose (critique fix 4)
    // tipping over, then easing into the decal's own rotation (no jump at half the fall)
    o.rot = k < 0.5 ? -fwd * 0.22 * smooth(k * 2) : lerp(-fwd * 0.22, f.death.rot * 0.5, smooth((k - 0.5) * 2));
    return o;
  }
  // routing: one flee frame per 17 wu run, so the feet keep pace with the eased run; standing once it has arrived
  // (no jogging on the spot at the field edge: critique fix 5c)
  if (f.rout && t >= f.rout.t) {
    const r = f.rout, q = clamp((t - r.t) / r.dur, 0, 1);
    let d = r.D * easeOut(q);
    const leaving = r.tLeave !== null && t > r.tLeave;
    if (leaving) d += 40 * clamp((t - r.tLeave) / 0.5, 0, 1);
    // arrived, or slowed below a walk (15 wu/s, his ground speed as figPos moves him, block and seat included): he
    // stands, catching his breath, instead of running on the spot
    if (!leaving && (q >= 0.97 || routSpeed(T, f, t) < 15)) { o.pose = PP.stand; o.sy = 1 + 0.012 * Math.sin(t * 5 * tempo + v.phase * TAU); return o; }
    const u = d / 17 + v.phase * 2;
    o.pose = (Math.floor(u) & 1) ? PP.fleeB : PP.fleeA;
    o.lift = (u % 1) < 0.5 ? 1.2 : 0;
    o.rot = fwd * 0.08;
    return o;
  }
  // the victory cheer: the winner's standing figures in the outro, each on its own beat
  if (extra.cheerT !== null && t >= extra.cheerT && G.side === extra.winner && !activeSeatCue(f, t)) { // dressing ranks: shuffle first
    const u = (t - extra.cheerT) * 1.5 * tempo + v.phase;
    const up = (u % 1) < 0.5;
    o.pose = up ? PP.cheer : PP.stand;
    o.lift = up ? 3 * Math.sin(Math.PI * ((u % 1) * 2)) : 0;
    return o;
  }
  let pose = -1;
  // reactions first (as evalFigure): recoil, a white flash on a wound, knocked back and tilted away from the blow
  for (let i = f.reacts.length - 1; i >= 0; i--) {
    const rc = f.reacts[i];
    if (t < rc.t) continue;
    if (t > rc.t + 0.2) break;
    if (rc.item && !shownAt(rc.item, speed) && rc.kind !== 'kill') break;
    if (rc.kind === 'wound' || rc.kind === 'blocked') {
      const q = (t - rc.t) / 0.2;
      // the hit flash (docs/12 S2.9, S2.14): white at 90% for one frame (1/60 s of story; a real frame at 2x and 4x); a
      // fire wound flashes orange through the effects layer instead (critique fix 2); reduced motion: a red tint, no flash
      const phys = rc.kind === 'wound' && rc.element !== 'fire';
      pose = phys && t < rc.t + hitFlashWin(speed) && !hitReduced() ? PP['recoil.white'] : PP.recoil;
      if (phys && hitReduced() && t < rc.t + 0.15) o.hurt = 1 - (t - rc.t) / 0.15;
      o.rot = -fwd * 0.1 * (1 - q);
      o.dy = G.s * 2 * (1 - q);
    }
    break;
  }
  if (pose < 0) {
    // striking: windup, strike, follow-through, with the lunge evalFigure already applied
    for (let i = f.strikes.length - 1; i >= 0; i--) {
      const s = f.strikes[i];
      if (t >= s.t + s.strike + s.rec) break;
      if (t < s.t - s.wind) continue;
      if (!shownAt(s.item, speed)) continue;
      if (t < s.t) { pose = PP.windup; o.rot = -fwd * 0.08 * ((t - (s.t - s.wind)) / s.wind); o.sx = 0.98; }
      else if (t < s.t + s.strike) { pose = PP.strike; o.rot = fwd * 0.07; }
      else { pose = PP.follow; o.rot = fwd * 0.1 * (1 - (t - s.t - s.strike) / s.rec); }
      break;
    }
  }
  if (pose < 0) {
    // shooting and casting: nock, draw (held), loose; aim, throw, follow; a caster's actA (charge) and actB (release)
    for (let i = f.shots.length - 1; i >= 0; i--) {
      const s = f.shots[i];
      if (t < s.t) continue;
      if (t > s.tRel + 0.35) break;
      if (s.item && !shownAt(s.item, speed)) break;
      if (s.kind === 'cast') {
        pose = t < s.tRel ? PP.actA : PP.actB;
        if (t >= s.tRel) o.dy = -G.s * (s.recoil || 4) * Math.max(0, 1 - (t - s.tRel) / 0.25); // the release recoil (Fireball 6 wu: art plan 7.3)
        if (t < s.tRel) o.sy = 1 + 0.02 * Math.min(1, (t - s.t) / Math.max(0.1, s.tRel - s.t));
      } else if (look.layout === 'thrower') pose = t < s.tRel ? PP.aim : t < s.tRel + 0.14 ? PP.throw : PP.follow;
      else {
        pose = t < s.t + 0.1 ? PP.nock : t < s.tRel ? PP.draw : t < s.tRel + 0.14 ? PP.loose : PP.stand;
        if (pose === PP.draw) o.rot = -fwd * 0.02;
      }
      break;
    }
  }
  if (pose < 0 && extra.rally) {
    // a general rallies: the weapon raised, then pointed at the enemy (on holds and when his squads hold)
    for (const ra of extra.rally) {
      if (t < ra || t >= ra + 1.1) continue;
      pose = t < ra + 0.5 ? PP.actA : PP.actB;
      break;
    }
  }
  if (pose < 0) {
    const seg = activeSeg(G.path, t);
    const moving = seg && (Math.abs(seg.x1 - seg.x0) + Math.abs(seg.y1 - seg.y0) > 2);
    const cue = moving ? null : activeSeatCue(f, t);
    if (moving) {
      // the march: marchA, pass, marchB, pass at a cadence set by the block's speed (an 11 wu step, 1.7 to 5 steps a
      // second, critique fix 5a), a bob at the passing frames that grows with the pace, and a forward lean
      const spd = Math.hypot(seg.x1 - seg.x0, seg.y1 - seg.y0) / Math.max(1e-3, seg.t1 - seg.t0);
      const steps = clamp(spd / 11, 1.7, 5) * tempo;
      const u = (t - seg.t0) * steps * 2 + v.phase * 4;
      const k = Math.floor(u) & 3;
      pose = [PP.marchA, PP.stand, PP.marchB, PP.stand][k];
      o.lift = (k & 1) ? (1.5 + clamp((spd - 30) / 60, 0, 1)) * Math.sin(Math.PI * (u % 1)) : 0;
      o.rot = fwd * (0.06 + 0.06 * clamp((spd - 30) / 90, 0, 1) + 0.017 * Math.sin(u * Math.PI / 2));
    } else if (cue) {
      // closing ranks or dressing: short shuffle steps while the seat slides (critique fix 5b)
      const u = (t - cue.t) * 8 + v.phase * 4;
      pose = [PP.marchA, PP.stand, PP.marchB, PP.stand][Math.floor(u) & 3];
    } else if (G.inContactAt && G.inContactAt(t) && f.rank === 0 && look.kind === 'troop' && look.layout === 'melee') {
      pose = PP.brace; o.sy = 0.985; o.rot = fwd * 0.05;
    } else {
      // at rest: each figure's own rest frame, shuffling to the other now and then, breathing
      const swap = (Math.floor(t / v.swap + v.phase * 3) & 3) === 3;
      pose = v.rest === 'idle2' ? (swap ? PP.stand : PP.idle2) : (swap ? PP.idle2 : PP.stand);
      o.sy = 1 + 0.008 * Math.sin(t * 2.4 * tempo + v.phase * TAU);
    }
  }
  o.pose = pose;
  return o;
}
