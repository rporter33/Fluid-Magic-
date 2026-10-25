'use strict';
// ---- the magic pilot's two spells (art plan 7.3, 7.5): Fireball and Entangle, each a pure function of story time ----
// Every position, size, alpha and frame below comes from the cast's beats (33-fx-timeline.js), its seed and t: there is
// no particle state, so a seek, a replay or a screenshot draws exactly the same frame (docs/12 S2.13 particleAt). The
// timings, counts and the colour grammar are data (45-fx-looks.js); the flicker is a hash of the particle and the story
// frame, never a random stream. The burst, its fragments, the burning kills, the fire wounds and the mana glyph are in
// 47b-fireball-burst.js.

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
function fxFootprint(L, f, x, y, r, alpha, tint, frame) {
  const tex = FXLIB.t(frame || 'footRing'), p = L.airN.take(tex);
  if (!p) return null;
  p.x = sx(x, y); p.y = sy(x, y, 0); p.scaleX = 2 * r / tex.frame.width; p.scaleY = 2 * r * 0.643 / tex.frame.height;
  p.alpha = clamp(alpha, 0, 1); p.tint = tint;
  return p;
}
/**
 * A painted fire frame sorted with the figures (its body; figures nearer the camera stand in front) and its glow added.
 * h lifts it off the ground (a burst on a big body's chest), z overrides its sort key (just in front of that body).
 */
function fxFireSorted(L, name, x, y, W, alpha, glow, h, z) {
  const tex = FXLIB.t(name), s = L.units.take(tex), Y = sy(x, y, h || 0);
  s.position.set(sx(x, y), Y); s.scale.set(W / tex.frame.width); s.alpha = clamp(alpha, 0, 1); s.zIndex = z === undefined ? depthKey(x, y) + 0.05 : z;
  if (glow > 0) fxPut(L.airA, name, sx(x, y), Y, W, alpha * glow);
}

/** Per-cast preparation (once, at stage build): positions, the light and trauma cues, flash cues, the effect's end. */
function fxPrepare(L, fx) {
  const T = L.T, b = fx.beats, look = FX_LOOKS[fx.spell];
  fx.seed = fx.key >>> 0;
  fx.casterF = T.F[fx.caster];
  fx.trace = { orb: 0, release: 0, trail: 0, lob: 0, burst: 0, burstBlend: 0, ring: 0, dust: 0, smoke: 0, footprints: 0, cracks: 0, crack: 0, coil: 0, wither: 0, curse: 0, embers: 0, leaves: 0, licks: 0, woundSparks: 0, glyph: 0, glyphRing: 0, tendrils: 0, clods: 0, smoulder: 0 };
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
    // the troops this burst wounds (critique fix 2): their orange flash (46-fx.js), sparks and smoke wisp (fxWounds)
    fx.wounds = [];
    for (const f of fx.struck) for (const rc of f.reacts || []) if (rc.kind === 'wound' && rc.element === 'fire' && rc.fx === fx.key) fx.wounds.push({ f, t: rc.t, fx });
    // a big body struck (critique fix 4): its own body's height and depth, from the stage
    for (const k of fx.clusters || []) if (k.big) {
      const bb = L.st.bigs.find((q) => q.f.id === k.big.fig);
      k.big.H = bb && bb.body && bb.body.H ? bb.body.H : LAYOUT.sizeH[k.big.size] || 64;
      k.big.bb = bb || null; // its height off the ground (a procedural flyer is aloft) and its sort key, read each frame
    }
  }
  if (fx.spell === 'entangle') {
    L.flashes.add({ t: b.release[0], dur: look.flash.dur, color: look.flash.color, alpha: look.flash.alpha, area: 'scene', spell: 'entangle' });
    fx.held = fxHeld(L, fx);
    fx.fxEnd = Math.max(b.linger[1], ...fx.held.map((h) => Math.min(h.t1, T.duration) + look.wither + 0.1));
  }
  fx.sound = fxSoundCues(fx, look);
}
/** A struck big body's height off the ground this frame (a procedural flyer is aloft; a painted body stands), 0 for troops. */
function fxBigH(c) { return c.big && c.big.bb && c.big.bb.h > 0 ? c.big.bb.h : 0; }
/** A struck big body's sort key this frame (a body high in the air sorts above the figures). */
function fxBigZ(c, x, y) { return c.big && c.big.bb ? c.big.bb.body.root.zIndex : depthKey(x, y); }
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
  out.side = Math.sign(ox) || 1; // the staff's side on screen (the glyph floats on the other)
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
  // footprints: the truth of who is hit, from the charge's last 250 ms (and always 250 ms before impact) to the impact; a
  // big body's ring is its own foot radius (critique fix 4)
  const fp0 = Math.min(c1 - FP.lead, i0 - FP.lead);
  if (t >= fp0 && t < i0 + FP.out) {
    const a = smooth((t - fp0) / FP.out) * (t > i0 ? 1 - (t - i0) / FP.out : 1) * (0.8 + 0.2 * Math.sin((t - fp0) * TAU * 2));
    for (const f of fx.struck) {
      if (f.death && t >= f.death.t) continue;
      figPos(T, f, Math.min(t, i0), _fq);
      const gg = T.G[f.g].g, big = gg && gg.size >= 3, r = big ? LAYOUT.footR[gg.size] : FP.r;
      if (!big) fxGroundSprite(L.groundA, 'disc', _fq.x, _fq.y, r + 3, a * 0.55, lightCol); // the glow under him
      fxFootprint(L, f, _fq.x, _fq.y, r, a * 0.95, lightCol, big ? 'ring' : 'footRing'); // a big body's: a fine ring at its foot radius
      fx.trace.footprints++;
    }
  }
  // charge: the orb grows at the staff head, embers spiral in (Ember particles), the caster's warm light, the flame glyph
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
  fxGlyph(L, fx, t, b, 'R'); // the mana glyph over the caster for the charge (critique fix 12)
  // release: a 60 wu ring from the caster's feet (keylined: it carries information), the glyph ring at its front; the 6 wu
  // recoil is the caster's pose
  const RL = look.release;
  if (t >= c1 && t < c1 + RL.ringLife) {
    const k = (t - c1) / RL.ringLife, rr = lerp(12, RL.ring, easeOut(Math.min(1, (t - c1) / RL.ringGrow)));
    figPos(T, fx.casterF, c1, _fq);
    fxRing(L.groundN, _fq.x, _fq.y, rr, 0.9 * (1 - k), lightCol);
    fxGlyphRing(L, fx, _fq.x, _fq.y, rr * 0.92, (1 - k) * (1 - k), 'R'); // bright as it leaves the caster, gone as it reaches its size
    fx.trace.release = 1;
  }
  // travel: the lob, its trail rope and sparks, its shadow on the ground and the moving light pool under it; the lob ends
  // at 0.45 of a big body's height (fix 4)
  const brief = b.form.startsWith('brief') || b.form.startsWith('rushed');
  const apex = brief ? O.apexBrief : O.apex;
  const E = { x: main.x, y: main.y, h: main.big ? look.big.lobH * main.big.H + fxBigH(main) : 6 };
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
    // its shadow: 20 wu wide and still there at the apex (critique fix 9)
    const sh = L.groundN.take(FXLIB.t('disc')), SH = O.shadow;
    sh.position.set(sx(gx, gy) + hh * 0.25, sy(gx, gy, 0) + hh * 0.1); sh.scale.set(SH.w / 64, SH.w * 0.643 / 64); sh.tint = 0x000000;
    sh.alpha = SH.alpha * (1 - SH.apexK * clamp(hh / Math.max(1, apex), 0, 1));
    // the light pool under it: a normal-blend warm pool under a half-size added core, so light ground does not wash to cream
    const PL = O.pool, fade = Math.pow(Math.max(0, 1 - hh / PL.fade), PL.falloff); // near an inverse square: gathers as it falls
    fxGroundSprite(L.groundN, 'glow', gx, gy, PL.r, PL.alpha * fade, PL.tint);
    fxGroundSprite(L.groundA, 'glow', gx, gy, PL.r * PL.core, PL.coreAlpha * fade, PL.coreTint);
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
  fxWounds(L, fx, t, b); // each wounded troop's sparks and smoke wisp (fix 2)
  fxBurnOut(L, fx, t, b); // the kills char and burn (fix 8)
}
