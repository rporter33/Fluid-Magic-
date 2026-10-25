'use strict';
// ---- Fireball's burst and what follows it, and the mana glyphs (stage D pilot; units/stage-d/critique.md) ----
// The burst cross-fades its six painted frames (fix 5), fits the struck troops (fix 11) and sits on a big body's chest
// when it strikes one (fix 4); the shockwave is painted dust (fix 10); the scorch smoulders with ember chunks (fix 9);
// fragments carry a trail (fix 11); each wounded troop sheds sparks and a wisp (fix 2); burning kills char in 0.3 s and
// carry flame licks for 1.5 s (fix 8); the colour's glyph floats over the caster for the charge and stands at the front of
// the release ring (fix 12). All pure functions of story time, like 47-spells-pilot.js.

/** The main burst's width (fix 11): clamp(2.2 x the struck troops' radius, 120, 180) wu; a fragment's is its own. */
function fxBurstW(c, P) {
  if (!c.main) return P.burst;
  const F = FX_LOOKS.fireball.impact.burstFit;
  return clamp(F[0] * c.r, F[1], F[2]);
}
/** The burst (E3 flip-book), its white core, the dust shockwave, embers, sparks, smoke, light and smouldering scorch, at cluster c from time ti. */
function fxBlast(L, fx, c, t, P, ti, b) {
  const look = FX_LOOKS.fireball, I = look.impact;
  if (t < ti || t > ti + look.linger.smoke + 0.3) return;
  const seed = (fx.seed ^ Math.imul(c.figs[0] + 1, 0x9e3779b1)) >>> 0, ps = L.pscale, red = L.reduced;
  const age = t - ti, x = c.x, y = c.y, lightCol = look.light.color;
  // on a big body's chest, just in front of it (fix 4); the fire slides down the body as it burns out, so the last frames
  // (a ring of flames, embers) lie at its feet, not in the air
  const hb = c.big ? fxBigH(c) + c.big.H * lerp(look.big.lobH, look.big.endH, smooth(age / (P.flip || I.flip))) : 0, z = c.big ? fxBigZ(c, x, y) + look.big.z : undefined;
  const X = sx(x, y), Y = sy(x, y, hb);
  const big = c.main ? 1 : 0.55, lk = fxLingerK(L, b, t - (ti - b.impact[0]));
  const fl = P.flip || I.flip, Wb = fxBurstW(c, P);
  // smoke first, so the fire draws over it (matter: its own char tint, not the palette)
  const nsm = Math.round(P.smoke * ps);
  for (let i = 0; i < nsm && lk > 0; i++) {
    const born = lerp(I.smokeBorn[0], I.smokeBorn[1], fxRand(seed, i, 11)), u = (age - born) / look.linger.smoke;
    if (u < 0 || u >= 1) continue;
    const ang = fxRand(seed, i, 12) * TAU, d0 = 30 * big * fxRand(seed, i, 13) * Wb / 120;
    const px = X + Math.cos(ang) * d0 + 6 * u * (fxRand(seed, i, 14) - 0.3), py = Y + Math.sin(ang) * d0 * 0.6 - 10 - (16 + 18 * fxRand(seed, i, 15)) * u * 2;
    fxPut(L.airN, 'puff' + (1 + (i & 7)), px, py, (14 + 22 * u) * big, 0.55 * Math.min(1, u * 5) * (1 - u) * lk, FX_COLORS.smoke, fxRand(seed, i, 16) * 0.6);
    fx.trace.smoke++;
  }
  // the burst: its painted frames over `fl` seconds, then out. Each frame scales 0.95 to 1.05 across its hold and
  // cross-fades into the next over the hold's last 40% (fix 5), so the fire never stands still; both frames are sorted
  // with the figures and both glow
  if (age < fl + 0.12) {
    const nF = c.main ? 6 : 5, f0 = c.main ? 0 : 1; // a fragment lands already burning: no white ball
    const u = Math.min(age, fl - 1e-6) / fl * nF, k = Math.min(nF - 1, Math.floor(u)), f = u - k;
    const out = age < fl ? 1 : 1 - (age - fl) / 0.12, SC = I.flipScale;
    const bf = age < fl && k < nF - 1 ? clamp((f - (1 - I.flipBlend)) / I.flipBlend, 0, 1) : 0;
    const ref = FXLIB.t('burst3').frame.width, glow = red ? 0.25 : c.main ? 0.45 : 0.3;
    const draw = (fr, a, sc) => {
      const name = 'burst' + (f0 + fr + 1), tex = FXLIB.t(name), w = Wb / ref * tex.frame.width * sc;
      fxFireSorted(L, name, x, y, w, a * out, glow, hb, z);
      if (f0 + fr < 4 && a * out > 0.5) { const h = w * tex.frame.height / tex.frame.width; L.dome(X + (0.5 - tex.fax) * w, Y + (0.5 - tex.fay) * h, 0.4 * w, 0.4 * h, z === undefined ? depthKey(x, y) + 0.05 : z); }
    };
    draw(k, 1 - bf, lerp(SC[0], SC[1], age < fl ? f : 1));
    if (bf > 0) draw(k + 1, bf, SC[0]);
    if (c.main) { fx.trace.burst = f0 + k + 1; fx.trace.burstBlend = bf; }
  }
  if (age < I.core + 0.001) fxPut(L.airA, 'dot1', X, Y - 8 * big, 28 * big, 0.8, 0xffffff); // the white core, two frames
  // the shockwave (fix 10): E5 puffs in the ground's dust on the expanding ellipse, the added ring as its leading edge
  if (age < I.ringLife) {
    const k = age / I.ringLife, r = lerp(18, P.ring, easeOut(k)), D = I.dust;
    fxRing(L.groundA, x, y, r, D.edge * (1 - k) * (1 - k), lightCol);
    const nd = Math.max(6, Math.round(D.puffs * (c.main ? 1 : 0.5) * ps));
    for (let i = 0; i < nd; i++) {
      const a = (i / nd) * TAU + (fxRand(seed, i, 41) - 0.5) * 0.3, rr = r * (0.9 + 0.14 * fxRand(seed, i, 42));
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr, W = lerp(D.size[0], D.size[1], k) * (0.8 + 0.4 * fxRand(seed, i, 43)) * (c.main ? 1 : 0.7);
      fxPut(L.groundN, 'puff' + (1 + (i & 7)), sx(px, py), sy(px, py, 0) - W * 0.15, W, D.alpha * (1 - k), D.tint, fxRand(seed, i, 44) * TAU);
    }
    if (c.main) { fx.trace.ring = r; fx.trace.dust = nd; }
  }
  // the light pool: a warm normal-blend pool under an added core (light ground does not wash to cream: fix 9)
  if (age < I.poolLife) {
    const k = 1 - age / I.poolLife, PL = look.orb.pool;
    fxGroundSprite(L.groundN, 'glow', x, y, I.pool * big, 0.24 * k, PL.tint);
    fxGroundSprite(L.groundA, 'glow', x, y, I.pool * big * 0.6, 0.55 * k, lightCol);
  }
  // the scorch smoulders for 1.5 s (fix 9): E4 ember chunks on the scorch ring, flickering
  const SM = I.smoulder;
  if (age > SM.at && age < SM.at + SM.life && lk > 0) {
    const u = (age - SM.at) / SM.life, n = Math.max(2, Math.round(SM.n * (c.main ? 1 : 0.4) * Math.max(ps, 0.3)));
    const R = (c.main ? look.linger.scorch : look.fragment.scorch) / 2 * SM.ring;
    for (let i = 0; i < n; i++) {
      const a = fxRand(seed, i, 51) * TAU, rr = R * (0.75 + 0.35 * fxRand(seed, i, 52));
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      const flick = red ? 0.85 : 0.55 + 0.45 * fxRand(seed, i, Math.floor(t * 20) + 300);
      const fade = Math.min(1, (1 - u) * 3) * Math.min(1, u * 8);
      fxPut(L.groundA, 'ember' + (1 + (i & 3)), sx(px, py), sy(px, py, 0) - 1, lerp(SM.size[0], SM.size[1], fxRand(seed, i, 53)), fade * flick * lk, fxHue(FX_GRAMMAR.R, seed, i + 900), fxRand(seed, i, 54) * TAU);
      if (c.main) fx.trace.smoulder++;
    }
  }
  L.light(x, y, c.main ? look.light.impact : 70, age < look.light.impactLife ? 1 - age / look.light.impactLife : 0, lightCol, age < look.light.shadow ? 1 - age / look.light.shadow : 0);
  // embers (Ember particles): burst out fast, then rise on the heat with an ease-out, flickering, for 1.0 to 1.5 s
  const ne = Math.round(P.embers * ps), spread = Wb / 120;
  for (let i = 0; i < ne && lk > 0; i++) {
    const life = lerp(I.emberLife[0], I.emberLife[1], fxRand(seed, i, 21)), u = age / life;
    if (u >= 1) continue;
    const ang = fxRand(seed, i, 22) * TAU, d = lerp(I.emberSpread[0], I.emberSpread[1], fxRand(seed, i, 23)) * big * spread * FX_EASE.outFast(age / I.emberBurst);
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

/** A fragment flung from the burst to a group of struck troops standing apart (fxClusters): a 24 wu orb with a 40 wu glow and a 40 wu trail (fix 11). */
function fxFragment(L, fx, c, t) {
  if (t < c.tLaunch || t >= c.tLand) return;
  const look = FX_LOOKS.fireball, F = look.fragment, main = fx.clusters[0];
  const q = (t - c.tLaunch) / (c.tLand - c.tLaunch);
  const hEnd = c.big ? look.big.lobH * c.big.H + fxBigH(c) : 4; // a fragment that strikes a big body lands on its chest, where its burst opens (fix 4)
  const pos = (qq, out) => { out.x = lerp(main.x, c.x, qq); out.y = lerp(main.y, c.y, qq); out.h = lerp(16, hEnd, qq) + 4 * F.apex * qq * (1 - qq); return out; };
  pos(q, _fq);
  const X = sx(_fq.x, _fq.y), Y = sy(_fq.x, _fq.y, _fq.h);
  if (!L.reduced && q > 0) {
    const len = Math.hypot(c.x - main.x, c.y - main.y) + F.apex, dq = Math.min(q, F.trail / Math.max(F.trail, len));
    const r = L.ropeA.rope(FXLIB.t('trail'), 8, 16);
    for (let i = 0; i < 16; i++) { pos(q - dq * (1 - i / 15), _fp); r.pts[i].set(sx(_fp.x, _fp.y), sy(_fp.x, _fp.y, _fp.h)); }
    fxRope(r, 0, 1); r.alpha = 0.9;
  }
  pos(Math.min(1, q + 0.03), _fp);
  const mov = Math.atan2(sy(_fp.x, _fp.y, _fp.h) - Y, sx(_fp.x, _fp.y) - X);
  fxFire(L, 'orbM', X, Y, F.orb, 1, 0.6, mov + Math.PI * 1.75);
  fxPut(L.airA, 'glow', X, Y, F.glow, 0.3, look.light.color);
  const sh = L.groundN.take(FXLIB.t('disc'));
  sh.position.set(sx(_fq.x, _fq.y) + _fq.h * 0.25, sy(_fq.x, _fq.y, 0) + _fq.h * 0.1); sh.scale.set(12 / 64, 12 * 0.643 / 64); sh.tint = 0x000000; sh.alpha = 0.3;
  L.light(_fq.x, _fq.y, 40, 0.5, look.light.color, 0);
}

/** Each wounded troop (fix 2, docs/12 S2.9): 4 E4 sparks for 0.2 s and an E5 wisp of smoke for 0.8 s from his chest. */
function fxWounds(L, fx, t, b) {
  const WD = FX_LOOKS.fireball.wound, lk = fxLingerK(L, b, t);
  for (let j = 0; j < fx.wounds.length; j++) {
    const w = fx.wounds[j], age = t - w.t, f = w.f;
    if (age < 0 || age > WD.wisp || (f.death && t >= f.death.t)) continue;
    const sp = L.st.sprites[f.id], v = sp && sp.paint ? sp.paint.vary : null;
    figPos(L.T, f, t, _fq);
    const gx = _fq.x + (v ? v.jx : 0), gy = _fq.y + (v ? v.jy : 0), X = sx(gx, gy), Y = sy(gx, gy, _fq.h + 13);
    const seed = (fx.seed ^ Math.imul(f.id + 11, 0x85ebca6b)) >>> 0;
    if (age < WD.sparkLife) {
      const ns = Math.max(1, Math.round(WD.sparks * L.pscale)), u = age / WD.sparkLife;
      for (let i = 0; i < ns; i++) {
        const ang = fxRand(seed, i, 61) * TAU, sp2 = 40 + 50 * fxRand(seed, i, 62), dx = Math.cos(ang) * sp2 * age, dy = Math.sin(ang) * sp2 * age * 0.6 - 30 * age;
        fxPut(L.airPA, 'spark' + (1 + (i & 3)), X + dx, Y + dy, 5, 1 - u, fxHue(FX_GRAMMAR.R, seed, i + 1100), Math.atan2(Math.sin(ang) * 0.6 - 0.5, Math.cos(ang)));
        fx.trace.woundSparks++;
      }
    }
    const u = age / WD.wisp;
    if (lk > 0) fxPut(L.airN, 'puff' + (1 + (j & 7)), X + 3 * u, Y - 4 - 18 * u, 5 + 8 * u, 0.42 * Math.sin(Math.PI * u) * lk, WD.wispTint, fxRand(seed, 1, 63) * TAU);
  }
}

/**
 * Burning kills (fix 8, docs/12 S2.9 "blackens over 0.3 s and collapses; flames 1.5 s"): the figure chars over 0.3 s as it
 * is thrown, 2 or 3 E4 flame licks ride the body for 1.5 s (lick1 to lick4 cycling every 4 frames, 8 to 12 wu tall, a
 * normal body and an added glow, as fxFire), embers rise from it and a wisp of smoke stays for 3 s.
 */
function fxBurnOut(L, fx, t, b) {
  const look = FX_LOOKS.fireball, BO = look.burnOut, T = L.T, seed = fx.seed, ps = L.pscale;
  for (let j = 0; j < fx.kills.length; j++) {
    const f = fx.kills[j], d = f.death;
    if (t < d.t || t > d.t + BO.smoke) continue;
    const sp = L.st.sprites[f.id], v = sp && sp.paint ? sp.paint.vary : null, age = t - d.t;
    if (sp && sp.visible && t < d.t + d.fall) sp.tint = mixTint(sp.tint, BO.char, clamp(age / BO.charT, 0, 1) * 0.85);
    const lk = fxLingerK(L, b, t);
    if (lk <= 0) continue;
    figPos(T, f, t, _fq);
    const gx = _fq.x + (v ? v.jx : 0), gy = _fq.y + (v ? v.jy : 0), X = sx(gx, gy), Y = sy(gx, gy, _fq.h);
    if (age < BO.lickLife) {
      const nl = fxRand(seed, f.id, 71) < 0.5 ? BO.licks[0] : BO.licks[1];
      const fade = Math.min(1, age / 0.08) * Math.min(1, (BO.lickLife - age) / 0.4), k = clamp(age / d.fall, 0, 1);
      for (let i = 0; i < nl; i++) {
        const name = 'lick' + (1 + ((Math.floor(t * 60 / BO.lickEvery) + i + f.id) & 3)), tex = FXLIB.t(name);
        const H = lerp(BO.lickH[0], BO.lickH[1], fxRand(seed, f.id * 7 + i, 72)) * (0.88 + 0.12 * fxRand(seed, f.id + i, Math.floor(t * 15)));
        // spread over the body, each its own height and phase: upright at first, lying along the ground at the end
        const off = (i - (nl - 1) / 2) * lerp(3.5, 7, k) * (0.7 + 0.6 * fxRand(seed, f.id + i, 73)), base = lerp(13, 3, k) + (fxRand(seed, f.id + i, 74) - 0.5) * 4;
        fxFire(L, name, X + off, Y - base - H * 0.42, H * tex.frame.width / tex.frame.height * (i === 1 ? 1.15 : 1), fade * lk * (0.8 + 0.2 * fxRand(seed, f.id + i, Math.floor(t * 12))), BO.lickGlow);
        fx.trace.licks++;
      }
    }
    const ne = Math.round(BO.embers * ps);
    for (let i = 0; i < ne; i++) {
      const born = d.t + BO.emberWindow * (i / ne), u = (t - born) / BO.emberLife;
      if (u < 0 || u >= 1) continue;
      fxEmber(L, seed, 300 + i + 40 * j, X + (fxRand(seed, i + 40 * j, 9) - 0.5) * 10, Y - 4 - 26 * FX_EASE.outFast(u), 0.8, (1 - u) * lk, t);
    }
    const u = (age - 0.2) / (BO.smoke - 0.2);
    if (u > 0 && u < 1) fxPut(L.airN, 'puff' + (1 + (j & 7)), X + 3 * u, Y - 8 - 22 * u, 7 + 10 * u, 0.42 * Math.sin(Math.PI * u) * lk, FX_COLORS.smoke);
  }
}

/**
 * The colour's mana glyph over the caster for the charge (fix 12, docs/12 S2.10: "the staff rises, the color's mana symbol
 * shows"): the flame (G1, painted fire: a normal body and an added glow, rising and flickering) or the leaf (matter, normal
 * blend, swaying). It floats at head height on the side away from the staff, so the orb never covers it.
 */
function fxGlyph(L, fx, t, b, color) {
  const G = FX_GRAMMAR[color], look = FX_LOOKS[fx.spell].glyph, name = G.glyph;
  if (!look || !FXLIB.frames[name]) return;
  const [c0, c1] = b.charge;
  if (t < c0 || t >= c1 + 0.08) return;
  const k = clamp((t - c0) / Math.max(0.05, c1 - c0), 0, 1), a = Math.min(1, (t - c0) / 0.12) * (t < c1 ? 1 : 1 - (t - c1) / 0.08);
  const f = fx.casterF, sp = L.st.sprites[f.id], v = sp && sp.paint ? sp.paint.vary : null;
  figPos(L.T, f, t, _fq);
  const gx = _fq.x + (v ? v.jx : 0), gy = _fq.y + (v ? v.jy : 0), tex = FXLIB.t(name), H = look.h, W = H * tex.frame.width / tex.frame.height;
  const side = color === 'R' ? fxStaffTip(L, fx, _tip).side : 0;
  const X = sx(gx, gy) - side * 11, Y = sy(gx, gy, _fq.h + look.lift + (color === 'R' ? 4 * k : 2 * Math.sin(t * 5)));
  if (color === 'R') fxFire(L, name, X, Y, W * (0.85 + 0.15 * k), a * (0.88 + 0.12 * fxRand(fx.seed, 3, Math.floor(t * 30))), L.reduced ? 0.3 : 0.6);
  else fxPut(L.airN, name, X, Y, W * (0.85 + 0.15 * k), a, 0xffffff, 0.08 * Math.sin(t * 4));
  fx.trace.glyph = 1;
}
/**
 * The painted glyph ring at the release (fix 12): the colour's ring with its glyph standing at the front, the size of the
 * release ring, sorted just in front of the caster (Ember adds its glow). The keylined ring under it carries the information.
 */
function fxGlyphRing(L, fx, x, y, rr, alpha, color) {
  const G = FX_GRAMMAR[color], name = G.glyphRing, look = FX_LOOKS[fx.spell].glyph;
  if (!look || !look.ring || !FXLIB.frames[name] || alpha <= 0.01) return;
  const tex = FXLIB.t(name), W = 2 * rr * (tex.fk || 1), s = L.units.take(tex);
  s.position.set(sx(x, y), sy(x, y, 0)); s.scale.set(W / tex.frame.width); s.alpha = clamp(alpha, 0, 1); s.zIndex = depthKey(x, y) + 0.03;
  if (color === 'R') fxPut(L.airA, name, sx(x, y), sy(x, y, 0), W, alpha * 0.5);
  fx.trace.glyphRing = 1;
}
