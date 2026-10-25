'use strict';
// ---- the procedural figure's state at t (pure): position, view, frame, tint (split from 60-render.js for size) ----

// ---- figure state at t (pure) ----
const _st = { vis: true, x: 0, y: 0, h: 0, view: 'ne', flip: false, frame: 0, tint: 0xffffff, alpha: 1, key: 0 };
const _q = { x: 0, y: 0, h: 0 };
/** The returned object is reused: read it before the next call (no garbage per figure per frame). */
function evalFigure(T, f, G, t, speed, tmp) {
  const st = _st;
  st.vis = true; st.x = 0; st.y = 0; st.h = 0; st.view = 'ne'; st.flip = false; st.frame = 0; st.tint = 0xffffff; st.alpha = 1; st.key = 0;
  if (t < G.appear) { st.vis = false; return st; }
  const p = figPos(T, f, t, tmp);
  st.x = p.x; st.y = p.y; st.h = p.h;
  const near = G.s < 0;
  let hurt = 0;
  st.view = near ? 'ne' : 'se'; st.flip = !near;
  // leaving the field
  if (G.leaveT !== null && t >= G.leaveT) { st.vis = false; return st; }
  if (G.leaveT !== null && t >= G.leaveT - 0.6) st.alpha = clamp((G.leaveT - t) / 0.6, 0, 1);
  if (G.appear > 0 && t < G.appear + 0.6) st.alpha *= clamp((t - G.appear) / 0.6, 0, 1);
  if (G.kind === 'cloud') st.h += 6 * Math.sin(TAU * 0.8 * t + f.phase * TAU);
  // dead or falling
  if (f.death && t >= f.death.t) {
    const k = (t - f.death.t) / f.death.fall;
    if (k >= 1) { st.vis = false; return st; }
    st.frame = k < 0.5 ? FR.fall : FR.fall + 1;
    st.key = depthKey(st.x, st.y);
    st.flip = st.flip !== f.death.flip ? !st.flip : st.flip;
    return st;
  }
  // routing: away from the enemy, running
  const r = f.rout;
  if (r && t >= r.t) {
    st.view = near ? 'se' : 'ne'; st.flip = near;
    const run = t * 9 + f.phase * 4;
    st.frame = FR.walk + (Math.floor(run) & 3);
  } else {
    // moving with the block
    const seg = activeSeg(G.path, t);
    const moving = seg && (Math.abs(seg.x1 - seg.x0) + Math.abs(seg.y1 - seg.y0) > 2);
    let frame;
    if (moving) {
      // a short side-step (under a man's height) keeps the facing: men side-step a pace or two without turning
      const sideways = Math.abs(seg.x1 - seg.x0) > Math.abs(seg.y1 - seg.y0) * 1.5 && Math.abs(seg.x1 - seg.x0) > 28;
      // a sideways move turns the figure to its heading by the mirror alone: the side keeps its view (back for the near
      // side, front for the far side), so no move spins a man between his back and his front (stage B fix pass, 5d)
      if (sideways) { const right = seg.x1 > seg.x0; st.flip = !right; }
      frame = FR.walk + (Math.floor(t * 6 + f.phase * 4) & 3);
    } else frame = (Math.floor(t / (1.2 + 0.8 * f.phase) + f.phase * 3) & 1) ? FR.idle1 : FR.idle;
    // shooting or casting
    for (let i = f.shots.length - 1; i >= 0; i--) {
      const s = f.shots[i];
      if (t < s.t) continue;
      if (t > s.tRel + 0.3) break;
      if (s.item && !shownAt(s.item, speed)) break;
      frame = t < s.tRel ? FR.shoot : t < s.tRel + 0.12 ? FR.shoot + 1 : FR.shoot + 2;
      break;
    }
    // striking (duels only; lunge toward the real target)
    for (let i = f.strikes.length - 1; i >= 0; i--) {
      const s = f.strikes[i];
      if (t >= s.t + s.strike + s.rec) break;
      if (t < s.t - s.wind) continue;
      if (!shownAt(s.item, speed)) continue;
      const q = figPos(T, T.F[s.tf], s.t, _q);
      let dx = q.x - st.x, dy = q.y - st.y; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
      let lk;
      if (t < s.t) { frame = FR.atk; lk = -0.25 * ((t - (s.t - s.wind)) / s.wind); }
      else if (t < s.t + s.strike) { frame = (s.t * 7) % 2 > 1 ? FR.atk + 3 : FR.atk + 1; lk = 1; }
      else { frame = FR.atk + 2; lk = 1 - (t - s.t - s.strike) / s.rec; }
      const lunge = Math.min(s.lunge, dl * 0.6) * 0.5 * (G.fxHold && s.t >= G.fxHold.t0 && s.t < G.fxHold.t1 ? 0.5 : 1); // entangled: lunges halved (stage D pilot)
      st.x += dx * lunge * lk; st.y += dy * lunge * lk;
      // face the target (screen right or left)
      // turn to the camera (or away) only when the target is clearly behind: a target a little lower on screen spun
      // a near-side man 180 degrees per blow (critique fix 5d)
      // and he turns to the other side only when the target is clearly there (more than 30 degrees past square), not for each blow
      // at a target straight ahead
      const sl = Math.hypot(sx(dx, dy), sy(dx, dy, 0)) || 1, sh = sx(dx, dy) / sl, sv = sy(dx, dy, 0) / sl;
      const right = st.flip ? sh > 0.5 : sh >= -0.5;
      st.view = near ? (sv > 0.34 ? 'se' : 'ne') : (sv < -0.34 ? 'ne' : 'se');
      st.flip = !right;
      break;
    }
    // reactions: flash, flinch, dodge
    for (let i = f.reacts.length - 1; i >= 0; i--) {
      const rc = f.reacts[i];
      if (t < rc.t) continue;
      if (t > rc.t + 0.2) break;
      if (rc.item && !shownAt(rc.item, speed) && rc.kind !== 'kill') break;
      if (rc.kind === 'wound' || rc.kind === 'blocked') {
        // the hit flash: white at 90% for one frame, none for fire (the effects layer flashes it orange: critique fix 2),
        // a red tint under reduced motion (docs/12 S2.9, S2.14)
        const phys = rc.kind === 'wound' && rc.element !== 'fire';
        frame = phys && t < rc.t + hitFlashWin(speed) && !hitReduced() ? FR.whiteFlinch : FR.flinch;
        if (phys && hitReduced() && t < rc.t + 0.15) hurt = 1 - (t - rc.t) / 0.15;
        st.y += G.s * 2.5 * (1 - (t - rc.t) / 0.2);
      } else if (rc.kind === 'dodge') st.x += 3 * Math.sin(Math.PI * (t - rc.t) / 0.2) * (f.phase < 0.5 ? 1 : -1);
      break;
    }
    st.frame = frame;
  }
  // wound tint (detailed mode): (1, 1 - 0.35w, 1 - 0.35w)
  let w = 0;
  for (const wd of f.wounds) { if (wd.t <= t) w = wd.w; else break; }
  if (w > 0 && st.frame !== FR.whiteFlinch) { const gb = Math.round(255 * (1 - 0.35 * w)); st.tint = (255 << 16) | (gb << 8) | gb; }
  if (hurt > 0) st.tint = mix(st.tint, 0xd0605a, hurt); // reduced motion: the hit's red tint fading over 0.15 s
  st.key = depthKey(st.x, st.y) + (G.onWall ? 0.0 : 0);
  if ((G.onWall || (f.climb && t >= f.climb.t + f.climb.dur * 0.6)) && T.wall) st.key = depthKey(st.x, 0) + 0.02 + (Math.abs(st.y) / 1000);
  return st;
}
function activeSeg(path, t) {
  for (let i = path.length - 1; i >= 0; i--) { const s = path[i]; if (s.t0 <= t) return t < s.t1 ? s : null; }
  return null;
}
