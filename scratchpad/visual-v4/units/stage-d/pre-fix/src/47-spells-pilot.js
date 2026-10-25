'use strict';
// ---- the magic pilot's two spells (art plan 7.3, 7.5): Fireball and Entangle, each a pure function of story time ----
// Every position, size, alpha and frame below comes from the cast's beats (33-fx-timeline.js), its seed and t: there is
// no particle state, so a seek, a replay or a screenshot draws exactly the same frame (docs/12 S2.13 particleAt). The
// timings, counts and the colour grammar are data (45-fx-looks.js); the flicker is a hash of the particle and the story
// frame, never a random stream.

/** A stable random in [0, 1) for (seed, i, k), with no allocation. */
function fxRand(seed, i, k) {
  let h = (seed ^ Math.imul(i + 1, 0x9e3779b1) ^ Math.imul(k + 7, 0x85ebca6b)) >>> 0;
  h ^= h >>> 16; h = Math.imul(h, 0x7feb352d); h ^= h >>> 15; h = Math.imul(h, 0x846ca68b); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
/** docs/09's easings by name. */
const FX_EASE = { outFast: (u) => 1 - Math.pow(1 - clamp(u, 0, 1), 4), outSlow: (u) => 1 - Math.pow(1 - clamp(u, 0, 1), 2) };
/** The palette split (docs/09): primary for 70% of a colour's particles, accent for the rest, exact in every ten indices. */
function fxPrimary(i) { return ((i * 3) % 10) < Math.round(FX_GRAMMAR.split * 10); }
function fxHue(G, seed, i) { return fxPrimary(i) ? G.primary : G.accent; }
const _fp = { x: 0, y: 0, h: 0 };
/** Puts one particle (or pooled sprite) at screen (X, Y) with a world size W (wu across its frame's width). */
function fxPut(pool, name, X, Y, W, alpha, tint, rot) {
  const tex = FXLIB.t(name), p = pool.take(tex);
  if (!p) return null;
  const s = W / tex.frame.width;
  if (pool instanceof FxParticles) { p.x = X; p.y = Y; p.scaleX = s; p.scaleY = s; } else { p.position.set(X, Y); p.scale.set(s); }
  p.alpha = clamp(alpha, 0, 1); p.tint = tint === undefined ? 0xffffff : tint; p.rotation = rot || 0;
  return p;
}
/**
 * An Ember particle (docs/09): a round glowing dot about 3 px at play zoom with 50% size jitter, in the additive particle
 * layer, primary or accent by its hash, flickering in x and brightness by a hash of its index and the story frame.
 */
function fxEmber(L, seed, i, X, Y, sizeK, alpha, t) {
  const G = FX_GRAMMAR.R, fr = Math.floor(t * 60);
  const W = G.px / (FX_RULES.playManPx / 28) / G.core * (1 + G.jitter * (2 * fxRand(seed, i, 95) - 1)) * sizeK;
  const jx = (fxRand(seed, i, fr) - 0.5) * 2 * G.flicker.x, a = alpha * (1 - G.flicker.a * fxRand(seed, i + 977, fr));
  return fxPut(L.airPA, G.frame, X + jx, Y, W, a, fxHue(G, seed, i));
}
/** A painted fire frame twice: its body in normal blend and its glow added (one frame serves both, fx_pack.py). */
function fxFire(L, name, X, Y, W, alpha, glow, rot) {
  fxPut(L.airN, name, X, Y, W, alpha, 0xffffff, rot);
  if (glow > 0) fxPut(L.airA, name, X, Y, W, alpha * glow, 0xffffff, rot);
}
/** A ground ring (keylined, tinted) or a light pool, squashed to the camera's 0.643. */
function fxGroundSprite(pool, name, x, y, r, alpha, tint) {
  const tex = FXLIB.t(name), s = pool.take(tex);
  s.position.set(sx(x, y), sy(x, y, 0)); s.scale.set(2 * r / tex.frame.width, 2 * r * 0.643 / tex.frame.height);
  s.alpha = clamp(alpha, 0, 1); s.tint = tint === undefined ? 0xffffff : tint;
  return s;
}
/** A solid ground ring whose band stays 2 to 5 wu as it grows: the bold ring under 40 wu, the fine one over 80, crossed. */
function fxRing(pool, x, y, r, alpha, tint) {
  const k = clamp((r - 40) / 40, 0, 1);
  if (k < 1) fxGroundSprite(pool, 'ringBold', x, y, r, alpha * (1 - k), tint);
  if (k > 0) fxGroundSprite(pool, 'ring', x, y, r, alpha * k, tint);
}
/**
 * A footprint ring at a struck figure's feet. Inside a dense block the ground under him, and his feet, are hidden by the
 * ranks in front, so the ring is drawn over the figures (a particle in the air layer): the truth of who is hit (7.1).
 */
function fxFootprint(L, f, x, y, r, alpha, tint) {
  const tex = FXLIB.t('footRing'), p = L.airN.take(tex);
  if (!p) return null;
  p.x = sx(x, y); p.y = sy(x, y, 0); p.scaleX = 2 * r / tex.frame.width; p.scaleY = 2 * r * 0.643 / tex.frame.height;
  p.alpha = clamp(alpha, 0, 1); p.tint = tint;
  return p;
}
/** A painted fire frame sorted with the figures (its body; figures nearer the camera stand in front) and its glow added. */
function fxFireSorted(L, name, x, y, W, alpha, glow) {
  const tex = FXLIB.t(name), s = L.units.take(tex);
  s.position.set(sx(x, y), sy(x, y, 0)); s.scale.set(W / tex.frame.width); s.alpha = clamp(alpha, 0, 1); s.zIndex = depthKey(x, y) + 0.05;
  if (glow > 0) fxPut(L.airA, name, sx(x, y), sy(x, y, 0), W, alpha * glow);
}

/** Per-cast preparation (once, at stage build): positions, the light and trauma cues, flash cues, the effect's end. */
function fxPrepare(L, fx) {
  const T = L.T, b = fx.beats, look = FX_LOOKS[fx.spell];
  fx.seed = fx.key >>> 0;
  fx.casterF = T.F[fx.caster];
  fx.trace = { orb: 0, release: 0, trail: 0, lob: 0, burst: 0, ring: 0, smoke: 0, footprints: 0, cracks: 0, crack: 0, coil: 0, wither: 0, curse: 0, embers: 0, leaves: 0 };
  // above 2x (docs/09): the short form's charge and no linger; the release, travel and impact keep their times
  const sh = fxBeats(fx.spell, 'short', false);
  const c = Math.min(b.charge[1] - b.charge[0], sh.charge);
  fx.beatsFast = { charge: [b.charge[1] - c, b.charge[1]], release: b.release, travel: b.travel, impact: b.impact, linger: [b.impact[1], b.impact[1]], form: b.form + '/fast' };
  if (fx.spell === 'fireball') {
    fx.fxEnd = b.impact[0] + look.linger.smoke + 0.4;
    fx.trauma = { t: b.impact[0], k: look.trauma, life: look.traumaLife };
    fx.struck = fx.hitFigs.map((i) => T.F[i]);
    fx.kills = fx.struck.filter((f) => f.death && f.death.fire);
    for (const f of fx.kills) fx.fxEnd = Math.max(fx.fxEnd, f.death.t + look.burnOut.smoke);
    for (const k of fx.clusters || []) if (!k.main) fx.fxEnd = Math.max(fx.fxEnd, k.tLand + 2.0);
  }
  if (fx.spell === 'entangle') {
    L.flashes.add({ t: b.release[0], dur: look.flash.dur, color: look.flash.color, alpha: look.flash.alpha, area: 'scene', spell: 'entangle' });
    fx.held = fxHeld(L, fx);
    fx.fxEnd = Math.max(b.linger[1], ...fx.held.map((h) => Math.min(h.t1, T.duration) + look.wither + 0.1));
  }
  fx.sound = fxSoundCues(fx, look);
}
/** The beats this frame draws: the cast's own, or above 2x the fast form. */
function fxB(L, fx) { return L.fast ? fx.beatsFast : fx.beats; }
/** Lingering particles' fade above 2x: they end with the impact beat (docs/09 skips the linger there). */
function fxLingerK(L, b, t) { return L.fast ? clamp((b.impact[1] - t) / Math.max(0.02, b.impact[1] - b.impact[0]), 0, 1) : 1; }

/** The cast's sound hooks in story time (no audio in the mockup: the cues are data for the sound layer and the checks). */
function fxSoundCues(fx, look) {
  const b = fx.beats, out = [];
  for (const [id, beat, off, db] of look.sound || []) {
    if (beat === 'hit') {
      for (const f of fx.struck || []) {
        const c = (fx.clusters || []).find((k) => k.figs.includes(f.id));
        out.push({ t: (c && !c.main ? c.tLand : b.impact[0]) + off, id, db, fig: f.id });
      }
      continue;
    }
    if (beat === 'wither') { for (const h of fx.held || []) out.push({ t: h.t1 + off, id, db }); continue; }
    if (b[beat]) out.push({ t: b[beat][0] + off, id, db });
  }
  return out.sort((p, q) => p.t - q.t);
}

/** The staff head at the cast's release, in ground coordinates and height (the caster's charge pose, FX_STAFF_TIPS). */
function fxStaffTip(L, fx, out) {
  const T = L.T, f = fx.casterF, sp = L.st.sprites[f.id];
  figPos(T, f, fx.beats.release[0], out);
  const key = sp && sp.paint ? sp.paint.key : 'procedural';
  const tips = FX_STAFF_TIPS[key] || FX_STAFF_TIPS.procedural;
  const back = !sp || sp.curView !== 'se';
  const tip = back ? tips.back : tips.front;
  const sc = sp && sp.paint ? sp.paint.vary.scale : 1;
  const mir = sp && sp.scale.x < 0 ? -1 : 1;
  const ox = tip[0] * sc * mir, oy = tip[1] * sc;
  if (sp && sp.paint) { out.x += sp.paint.vary.jx; out.y += sp.paint.vary.jy; }
  out.x += ox * CY; out.y += ox * SY; out.h += -oy / CP; // a screen offset as a ground offset and a height
  return out;
}

// ------------------------------------------------------------------------------------------------------------ Fireball
const _tip = { x: 0, y: 0, h: 0 }, _fq = { x: 0, y: 0, h: 0 };
function fxFireball(L, fx, t) {
  const look = FX_LOOKS.fireball, b = fxB(L, fx), T = L.T, seed = fx.seed, ps = L.pscale, red = L.reduced, O = look.orb;
  const [c0, c1] = b.charge, r1 = b.release[1], [i0] = b.impact;
  const main = (fx.clusters || [])[0];
  if (!main) return;
  fxStaffTip(L, fx, _tip);
  const S = { x: _tip.x, y: _tip.y, h: _tip.h };
  const lightCol = look.light.color, FP = look.footprint;
  // footprints: the truth of who is hit, from the charge's last 250 ms (and always 250 ms before impact) to the impact
  const fp0 = Math.min(c1 - FP.lead, i0 - FP.lead);
  if (t >= fp0 && t < i0 + FP.out) {
    const a = smooth((t - fp0) / FP.out) * (t > i0 ? 1 - (t - i0) / FP.out : 1) * (0.8 + 0.2 * Math.sin((t - fp0) * TAU * 2));
    for (const f of fx.struck) {
      if (f.death && t >= f.death.t) continue;
      figPos(T, f, Math.min(t, i0), _fq);
      fxGroundSprite(L.groundA, 'disc', _fq.x, _fq.y, FP.r + 3, a * 0.55, lightCol); // the glow under him
      fxFootprint(L, f, _fq.x, _fq.y, FP.r, a * 0.95, lightCol);
      fx.trace.footprints++;
    }
  }
  // charge: the orb grows at the staff head, embers spiral in (Ember particles), the caster's warm light
  if (t >= c0 && t < c1 + 0.02) {
    const k = clamp((t - c0) / Math.max(0.05, c1 - c0), 0, 1);
    const r = lerp(O.r0, O.r1, easeIn(k)) * (1 + 0.06 * Math.sin(t * 41 + seed));
    const X = sx(S.x, S.y), Y = sy(S.x, S.y, S.h);
    fxFire(L, r < 9 ? 'orbM' : 'orbL', X, Y, r * 2.1, 1, 0.55, Math.PI / 4);
    fxPut(L.airA, 'glow', X, Y, r * 5, 0.35 * k, lightCol);
    L.light(S.x, S.y, look.light.charge, 0.5 + 0.5 * k, lightCol, 0);
    fx.trace.orb = r;
    const n = Math.round(O.embers * ps * Math.min(1, (c1 - c0) / 0.35));
    for (let i = 0; i < n; i++) {
      const born = c0 + (c1 - c0) * 0.8 * (i / Math.max(1, n)), life = lerp(O.emberLife[0], O.emberLife[1], fxRand(seed, i, 1));
      const u = (t - born) / life;
      if (u < 0 || u >= 1) continue;
      const R = lerp(O.spiral[0], O.spiral[1], fxRand(seed, i, 2)) * Math.pow(1 - u, 1.25);
      const th = fxRand(seed, i, 3) * TAU + u * 2.6 * Math.PI;
      fxEmber(L, seed, i, X + Math.cos(th) * R, Y + Math.sin(th) * R * 0.55 - 6 * (1 - u) * fxRand(seed, i, 4), 1, Math.min(1, u * 6) * (1 - u * u), t);
      fx.trace.embers++;
    }
  }
  // release: a 60 wu ring from the caster's feet (the 6 wu recoil is the caster's pose)
  const RL = look.release;
  if (t >= c1 && t < c1 + RL.ringLife) {
    const k = (t - c1) / RL.ringLife;
    figPos(T, fx.casterF, c1, _fq);
    fxRing(L.groundN, _fq.x, _fq.y, lerp(12, RL.ring, easeOut(Math.min(1, (t - c1) / RL.ringGrow))), 0.9 * (1 - k), lightCol);
    fx.trace.release = 1;
  }
  // travel: the lob, its trail rope and sparks, its shadow on the ground and the moving light pool under it
  const brief = b.form.startsWith('brief') || b.form.startsWith('rushed');
  const apex = brief ? O.apexBrief : O.apex;
  const E = { x: main.x, y: main.y, h: 6 };
  const path = (q, out) => { out.x = lerp(S.x, E.x, q); out.y = lerp(S.y, E.y, q); out.h = lerp(S.h, E.h, q) + 4 * apex * q * (1 - q); return out; };
  if (t >= c1 && t < i0) {
    const q = clamp((t - r1) / Math.max(0.05, i0 - r1), 0, 1);
    path(q, _fq);
    const X = sx(_fq.x, _fq.y), Y = sy(_fq.x, _fq.y, _fq.h);
    const len = Math.hypot(E.x - S.x, E.y - S.y) + apex;
    if (!red && q > 0) { // the trail: the last 90 wu of the arc, stretched over the painted trail strip (thin end first)
      const r = L.ropeA.rope(FXLIB.t('trail'), 12, 16), dq = Math.min(q, O.trail / Math.max(O.trail, len));
      for (let i = 0; i < 16; i++) { path(q - dq * (1 - i / 15), _fp); r.pts[i].set(sx(_fp.x, _fp.y), sy(_fp.x, _fp.y, _fp.h)); }
      fxRope(r, 0, 1); r.alpha = 0.95; fx.trace.trail = 1;
    }
    fx.trace.lob = q;
    path(Math.min(1, q + 0.02), _fp);
    const mov = Math.atan2(sy(_fp.x, _fp.y, _fp.h) - Y, sx(_fp.x, _fp.y) - X);
    fxFire(L, 'orbL', X, Y, O.r1 * 2.1, 1, 0.6, mov + Math.PI * 1.75);
    fxPut(L.airA, 'glow', X, Y, O.glow, 0.26, lightCol);
    const gx = _fq.x, gy = _fq.y, hh = _fq.h;
    const sh = L.groundN.take(FXLIB.t('disc'));
    sh.position.set(sx(gx, gy) + hh * 0.25, sy(gx, gy, 0) + hh * 0.1); sh.scale.set(14 / 64 * (1 - hh / 400), 14 * 0.643 / 64 * (1 - hh / 400)); sh.tint = 0x000000; sh.alpha = 0.32 * (1 - hh / 300);
    fxGroundSprite(L.groundA, 'glow', gx, gy, 40, 0.36 * (1 - hh / 260), lightCol);
    L.light(gx, gy, look.light.travel, 0.65 * (1 - hh / 240), lightCol, 0);
    const ns = Math.round(O.trailSparks * ps);
    for (let i = 0; i < ns; i++) { // sparks shed along the arc, each falling and fading
      const born = r1 + (i0 - r1) * (i / ns), u = (t - born) / O.sparkLife;
      if (u < 0 || u >= 1) continue;
      path(clamp((born - r1) / Math.max(0.05, i0 - r1), 0, 1), _fp);
      const X2 = sx(_fp.x, _fp.y) + (fxRand(seed, i, 7) - 0.5) * 10 * u, Y2 = sy(_fp.x, _fp.y, _fp.h - 30 * u * u) + 4 * u;
      fxPut(L.airPA, 'spark' + (1 + (i & 3)), X2, Y2, 5, 1 - u, fxHue(FX_GRAMMAR.R, seed, i + 500), fxRand(seed, i, 8) * TAU);
    }
  }
  // impact and linger: the burst at the struck troops' centre, and a fragment at each other group (fxClusters)
  for (const c of fx.clusters) fxBlast(L, fx, c, t, c.main ? look.impact : look.fragment, c.main ? i0 : c.tLand, b);
  for (const c of fx.clusters) if (!c.main) fxFragment(L, fx, c, t);
  // kills burn out: the figure darkens to char as it falls, embers rise from it and a wisp of smoke for 3 s
  const BO = look.burnOut;
  for (let j = 0; j < fx.kills.length; j++) {
    const f = fx.kills[j], d = f.death;
    if (t < d.t || t > d.t + BO.smoke) continue;
    const sp = L.st.sprites[f.id];
    if (sp && sp.visible && t < d.t + d.fall) sp.tint = mixTint(sp.tint, BO.char, clamp((t - d.t) / d.fall, 0, 1) * 0.85);
    const lk = fxLingerK(L, b, t);
    if (lk <= 0) continue;
    figPos(T, f, t, _fq);
    const X = sx(_fq.x, _fq.y), Y = sy(_fq.x, _fq.y, 0);
    const ne = Math.round(BO.embers * ps);
    for (let i = 0; i < ne; i++) {
      const born = d.t + BO.emberWindow * (i / ne), u = (t - born) / BO.emberLife;
      if (u < 0 || u >= 1) continue;
      fxEmber(L, seed, 300 + i + 40 * j, X + (fxRand(seed, i + 40 * j, 9) - 0.5) * 10, Y - 4 - 26 * FX_EASE.outFast(u), 0.8, (1 - u) * lk, t);
    }
    const u = (t - d.t - 0.2) / (BO.smoke - 0.2);
    if (u > 0 && u < 1) fxPut(L.airN, 'puff' + (1 + (j & 7)), X + 3 * u, Y - 8 - 22 * u, 7 + 10 * u, 0.42 * Math.sin(Math.PI * u) * lk, FX_COLORS.smoke);
  }
}

/** The burst (E3 flip-book), its white core, ground ring, embers, sparks, smoke and light, at cluster c from time ti. */
function fxBlast(L, fx, c, t, P, ti, b) {
  const look = FX_LOOKS.fireball, I = look.impact;
  if (t < ti || t > ti + look.linger.smoke + 0.3) return;
  const seed = (fx.seed ^ Math.imul(c.figs[0] + 1, 0x9e3779b1)) >>> 0, ps = L.pscale, red = L.reduced;
  const age = t - ti, x = c.x, y = c.y, X = sx(x, y), Y = sy(x, y, 0), lightCol = look.light.color;
  const big = c.main ? 1 : 0.55, lk = fxLingerK(L, b, t - (ti - b.impact[0]));
  const fl = P.flip || I.flip;
  // smoke first, so the fire draws over it (matter: its own char tint, not the palette)
  const nsm = Math.round(P.smoke * ps);
  for (let i = 0; i < nsm && lk > 0; i++) {
    const born = lerp(I.smokeBorn[0], I.smokeBorn[1], fxRand(seed, i, 11)), u = (age - born) / look.linger.smoke;
    if (u < 0 || u >= 1) continue;
    const ang = fxRand(seed, i, 12) * TAU, d0 = 30 * big * fxRand(seed, i, 13);
    const px = X + Math.cos(ang) * d0 + 6 * u * (fxRand(seed, i, 14) - 0.3), py = Y + Math.sin(ang) * d0 * 0.6 - 10 - (16 + 18 * fxRand(seed, i, 15)) * u * 2;
    fxPut(L.airN, 'puff' + (1 + (i & 7)), px, py, (14 + 22 * u) * big, 0.55 * Math.min(1, u * 5) * (1 - u) * lk, FX_COLORS.smoke, fxRand(seed, i, 16) * 0.6);
    fx.trace.smoke++;
  }
  // the burst: six painted frames over `fl` seconds, then out; its body sorted with the figures and its glow added
  if (age < fl + 0.12) {
    const fr = c.main ? Math.min(5, Math.floor(age / fl * 6)) : 1 + Math.min(4, Math.floor(age / fl * 5)); // a fragment lands already burning: no white ball
    const W = P.burst / FXLIB.t('burst3').frame.width * FXLIB.t('burst' + (fr + 1)).frame.width;
    const a = age < fl ? 1 : 1 - (age - fl) / 0.12;
    fxFireSorted(L, 'burst' + (fr + 1), x, y, W, a, red ? 0.25 : c.main ? 0.45 : 0.3);
    if (c.main) fx.trace.burst = fr + 1;
  }
  if (age < I.core + 0.001) fxPut(L.airA, 'dot1', X, Y - 8 * big, 28 * big, 0.8, 0xffffff); // the white core, two frames
  // the ground ring (the expanding ellipse, in place of High's shockwave) and the light pool
  if (age < I.ringLife) { // a pulse: strongest as it leaves the centre, gone as it reaches its radius
    const k = age / I.ringLife, r = lerp(18, P.ring, easeOut(k));
    fxRing(L.groundN, x, y, r, 0.9 * (1 - k) * (1 - k), lightCol);
    fxRing(L.groundA, x, y, r, 0.3 * (1 - k) * (1 - k), lightCol);
    if (c.main) fx.trace.ring = r;
  }
  if (age < I.poolLife) fxGroundSprite(L.groundA, 'glow', x, y, I.pool * big, 0.55 * (1 - age / I.poolLife), lightCol);
  // the scorch stays hot for 1.5 s: a low flickering glow (no displacement filter: heat shimmer is left out)
  if (age > I.glowAfter[0] && age < I.glowAfter[1] && lk > 0) {
    const u = (age - I.glowAfter[0]) / (I.glowAfter[1] - I.glowAfter[0]);
    fxGroundSprite(L.groundA, 'glow', x, y, 46 * big, 0.2 * (1 - u) * (0.78 + 0.22 * fxRand(seed, 7, Math.floor(t * 30))) * lk, lightCol);
  }
  L.light(x, y, c.main ? look.light.impact : 70, age < look.light.impactLife ? 1 - age / look.light.impactLife : 0, lightCol, age < look.light.shadow ? 1 - age / look.light.shadow : 0);
  // embers (Ember particles): burst out fast, then rise on the heat with an ease-out, flickering, for 1.0 to 1.5 s
  const ne = Math.round(P.embers * ps);
  for (let i = 0; i < ne && lk > 0; i++) {
    const life = lerp(I.emberLife[0], I.emberLife[1], fxRand(seed, i, 21)), u = age / life;
    if (u >= 1) continue;
    const ang = fxRand(seed, i, 22) * TAU, d = lerp(I.emberSpread[0], I.emberSpread[1], fxRand(seed, i, 23)) * big * FX_EASE.outFast(age / I.emberBurst);
    const h = 6 + lerp(I.emberRise[0], I.emberRise[1], fxRand(seed, i, 24)) * FX_EASE.outFast(u);
    const gx = Math.cos(ang) * d, gy = Math.sin(ang) * d;
    fxEmber(L, seed, i, X + sx(gx, gy), Y + sy(gx, gy, 0) - h * CP, 0.6 + 0.4 * big, (1 - u) * lk, t);
    fx.trace.embers++;
  }
  // sparks: fast streaks outward (Ember's palette split, added)
  const nsp = Math.round(P.sparks * ps);
  for (let i = 0; i < nsp; i++) {
    const life = lerp(I.sparkLife[0], I.sparkLife[1], fxRand(seed, i, 31)), u = age / life;
    if (u >= 1) continue;
    const ang = fxRand(seed, i, 32) * TAU, v = (90 + 140 * fxRand(seed, i, 33)) * big;
    const gx = Math.cos(ang) * v * age, gy = Math.sin(ang) * v * age;
    const dX = sx(Math.cos(ang), Math.sin(ang)), dY = sy(Math.cos(ang), Math.sin(ang), 0);
    fxPut(L.airPA, 'spark' + (1 + (i & 3)), X + sx(gx, gy), Y + sy(gx, gy, 0) - (10 + 30 * age) * CP, 7 * big, 1 - u, fxHue(FX_GRAMMAR.R, seed, i + 700), Math.atan2(dY, dX) - 0.5);
  }
}

/** A fragment flung from the burst to a group of struck troops standing apart (fxClusters). */
function fxFragment(L, fx, c, t) {
  if (t < c.tLaunch || t >= c.tLand) return;
  const look = FX_LOOKS.fireball, main = fx.clusters[0];
  const q = (t - c.tLaunch) / (c.tLand - c.tLaunch);
  const x = lerp(main.x, c.x, q), y = lerp(main.y, c.y, q), h = lerp(16, 4, q) + 4 * look.fragment.apex * q * (1 - q);
  const X = sx(x, y), Y = sy(x, y, h);
  fxFire(L, 'orbS', X, Y, 9, 1, 0.6, -0.4);
  fxPut(L.airA, 'glow', X, Y, 26, 0.3, look.light.color);
  const sh = L.groundN.take(FXLIB.t('disc'));
  sh.position.set(sx(x, y) + h * 0.25, sy(x, y, 0) + h * 0.1); sh.scale.set(8 / 64, 8 * 0.643 / 64); sh.tint = 0x000000; sh.alpha = 0.25;
  L.light(x, y, 40, 0.5, look.light.color, 0);
}
