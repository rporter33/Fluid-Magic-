'use strict';
// ---- Entangle (art plan 7.3; pretender-and-magic C.3): Loam matter, normal blend, no light ----
// Charge: earth cracks spread from the caster, the leaf glyph over him. Release: the full-scene flash (through the
// limiter), a ground ring and the leaf ring with its glyph at the front. Travel: a heaved furrow runs along the ground to
// the target, its head throwing clods and dust and leaving clods behind. Impact: thorny roots erupt under every held
// figure and open coils grow to its hips in three stages over 200 ms (a back half behind him, a front half before him),
// four anchor tendrils radiate from his feet, runners join a block's men to the crack, dirt and leaves fly. Linger: the
// vines hold, with a dashed curse ring that takes the place of his commander ring, until the curse ends (its expire round,
// or the figure leaving, routing or dying first), then they brown and fall in 600 ms and root scars stay. All a pure
// function of story time. Critique fix 3 (units/stage-d/critique.md) and the L2 and L3 re-rolls.

/** Each held figure's window: from the impact to the first of its curse's expiry, its rout, its leaving or its death. */
function fxHeld(L, fx) {
  const T = L.T, i0 = fx.beats.impact[0], out = [], p = { x: 0, y: 0, h: 0 };
  for (const gi of fx.targets) {
    const G = T.G[gi];
    if (!G) continue;
    const ring = T.rings.find((r) => r.g === gi && r.source === fx.spell && r.fx);
    let expire = Infinity;
    if (ring && ring.until !== null && ring.until !== undefined) { const rd = T.rounds.find((r) => r.round === ring.until); if (rd) expire = rd.t; }
    for (const fi of G.figs) {
      const f = T.F[fi];
      if (f.death && f.death.t <= i0) continue;
      let t1 = expire, why = Number.isFinite(expire) ? 'expire' : 'battle end';
      const r = f.rout;
      if (r && r.t >= i0) { if (r.t < t1) { t1 = r.t; why = 'rout'; } } // routs while held: he tears free when he runs
      else if (r && r.t + r.dur > i0 + 0.05) { t1 = i0 + 0.4; why = 'running'; } // caught mid-flight: the roots only snatch at him
      else if (r && r.tLeave !== null && r.tLeave < t1) { t1 = r.tLeave; why = 'leave'; } // stopped at the field's edge: held till he runs off
      if (G.leaveT !== null && G.leaveT - 0.6 < t1) { t1 = G.leaveT - 0.6; why = 'leave'; }
      if (f.death && f.death.t < t1) { t1 = f.death.t; why = 'death'; }
      t1 = Math.max(t1, i0 + 0.4);
      figPos(T, f, i0, p);
      out.push({ f, gi, x: p.x, y: p.y, t1, why });
    }
    // the stance (docs/12 S2.10): the block's lunges are halved while it is held (evalFigure reads G.fxHold)
    const w = out.filter((h) => h.gi === gi);
    for (const h of w) h.space = Math.min(Infinity, ...w.filter((o) => o !== h).map((o) => Math.hypot(o.x - h.x, o.y - h.y))); // room round him in the block
    if (w.length) G.fxHold = { t0: i0, t1: Math.max(...w.map((h) => h.t1)) };
  }
  return out;
}

const _ep = { x: 0, y: 0, h: 0 };
function fxEntangle(L, fx, t) {
  const look = FX_LOOKS.entangle, b = fxB(L, fx), T = L.T, seed = fx.seed, ps = L.pscale, red = L.reduced, IM = look.impact;
  const [c0, c1] = b.charge, r1 = b.release[1], [i0, i1] = b.impact;
  const held = fx.held;
  if (!held.length) return;
  figPos(T, fx.casterF, c0, _ep);
  const cx = _ep.x, cy = _ep.y;
  const tx = held.reduce((s, h) => s + h.x, 0) / held.length, ty = held.reduce((s, h) => s + h.y, 0) / held.length;
  const crackTex = FXLIB.t('crackWide'), thinTex = FXLIB.t('crackThin');
  fxGlyph(L, fx, t, b, 'G'); // the leaf glyph over the druid for the charge (critique fix 12)
  // charge: the ground splits under the caster and short cracks run out from it
  if (t >= c0 && t < i1) {
    const k = smooth((t - c0) / Math.max(0.05, c1 - c0));
    const fade = t > i0 ? 1 - (t - i0) / (i1 - i0) : 1;
    const s = L.groundN.take(FXLIB.t('splitGround'));
    s.position.set(sx(cx, cy), sy(cx, cy, 0)); s.scale.set(look.charge.split * (0.35 + 0.65 * k) / s.texture.frame.width); s.alpha = 0.9 * fade;
    for (let i = 0; i < look.charge.cracks; i++) {
      const ang = (i / look.charge.cracks) * TAU + fxRand(seed, i, 1) * 0.9, len = lerp(look.charge.len[0], look.charge.len[1], fxRand(seed, i, 2)) * k;
      if (len < 2) continue;
      const r = L.groundN.rope(thinTex, 4, 8);
      for (let j = 0; j < 8; j++) {
        const q = j / 7, wob = (fxRand(seed, i * 8 + j, 3) - 0.5) * 6 * q;
        const x = cx + Math.cos(ang) * len * q - Math.sin(ang) * wob, y = cy + Math.sin(ang) * len * q + Math.cos(ang) * wob;
        r.pts[j].set(sx(x, y), sy(x, y, 0));
      }
      fxRope(r, 0, 0.18 + 0.2 * fxRand(seed, i, 4)); r.alpha = 0.9 * fade;
      fx.trace.cracks++;
    }
  }
  // footprints under the held figures, 250 ms before the roots reach them
  const FP = look.footprint;
  if (t >= i0 - FP.lead && t < i0 + FP.out) {
    const a = smooth((t - i0 + FP.lead) / FP.out) * (t > i0 ? 1 - (t - i0) / FP.out : 1);
    for (const h of held) { fxFootprint(L, h.f, h.x, h.y, look.footprint.r, a, FX_COLORS.loamLight); fx.trace.footprints++; }
  }
  // release: a Loam ring from the caster (the flash is a cue, FxFlashes)
  const RL = look.release;
  if (t >= c1 && t < c1 + RL.ringLife) {
    const k = (t - c1) / RL.ringLife;
    const rr = lerp(10, RL.ring, easeOut(Math.min(1, (t - c1) / RL.ringGrow)));
    fxRing(L.groundN, cx, cy, rr, 0.9 * (1 - k), FX_COLORS.loamLight);
    fxGlyphRing(L, fx, cx, cy, rr * 0.92, (1 - k) * (1 - k), 'G');
    fx.trace.release = 1;
  }
  // travel: the crack runs from the caster to the block, its head kicking up dust; it stays until the roots have grown
  if (t >= r1 && t < i1 + 0.25) {
    const run = red ? 1 : smooth((t - r1) / Math.max(0.05, i0 - r1));
    const fade = t > i1 ? 1 - (t - i1) / 0.25 : 1;
    const n = 24, r = L.groundN.rope(crackTex, look.crack.width, n);
    const dx = tx - cx, dy = ty - cy, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
    for (let j = 0; j < n; j++) {
      const q = (j / (n - 1)) * run, wob = Math.sin(q * 9 + seed % 7) * len * look.crack.wobble * Math.sin(Math.PI * q);
      const x = cx + dx * q + nx * wob, y = cy + dy * q + ny * wob;
      r.pts[j].set(sx(x, y), sy(x, y, 0));
    }
    fxRope(r, 0, Math.max(0.02, run)); r.alpha = (red ? smooth((t - r1) / 0.2) : 1) * fade;
    fx.trace.crack = run;
    const CR = look.crack, ux = dx / len, uy = dy / len, at = (q, out) => { const wob = Math.sin(q * 9 + seed % 7) * len * CR.wobble * Math.sin(Math.PI * q); out.x = cx + dx * q + nx * wob; out.y = cy + dy * q + ny * wob; return out; };
    // the running head (fix 3d, the L3 re-roll): the painted head throws clods and dust up and forward, 8 clods fly on
    // their own arcs and 2 puffs of dust rise
    if (t < i0 && !red) {
      at(run, _ep);
      const hx = _ep.x, hy = _ep.y, dir = sx(dx, dy) >= 0 ? 1 : -1, hasClods = !!FXLIB.frames.clod1;
      if (FXLIB.frames.crackHead) {
        const hn = (Math.floor(t * 20) & 1) ? 'crackHead2' : 'crackHead', hp = fxPut(L.airN, hn, sx(hx, hy), sy(hx, hy, 0) - CR.head * 0.18, CR.head, Math.min(1, (t - r1) / 0.06));
        if (hp) hp.scaleX *= dir;
      }
      for (let i = 0; i < Math.round(CR.clods * ps); i++) {
        const u = ((t - r1) * 5 + i / CR.clods) % 1, tl = t - u * 0.2, rl = smooth((tl - r1) / Math.max(0.05, i0 - r1));
        at(rl, _fp);
        const fwd = (6 + 12 * fxRand(seed, i, 91)) * u, side = (fxRand(seed, i, 92) - 0.5) * 12 * u;
        const px = _fp.x + ux * fwd + nx * side, py = _fp.y + uy * fwd + ny * side, hh = Math.max(0, 46 * u - 110 * u * u) * (0.6 + 0.6 * fxRand(seed, i, 93));
        fxPut(L.airN, hasClods ? 'clod' + (1 + (i % 6)) : 'ember' + (1 + (i & 3)), sx(px, py), sy(px, py, hh), 2.4 + 1.8 * fxRand(seed, i, 94), 1 - u * u, hasClods ? 0xffffff : FX_COLORS.dirt, u * 5 + i);
        fx.trace.clods++;
      }
      for (let i = 0; i < CR.puffs; i++) {
        const u = ((t - r1) * 4 + i / CR.puffs) % 1;
        fxPut(L.airN, 'puff' + (1 + i * 3), sx(hx, hy) + (fxRand(seed, i, 5) - 0.5) * 8 - dir * 4 * u, sy(hx, hy, 0) - 3 - 10 * u, lerp(CR.puffSize[0], CR.puffSize[1], u), 0.38 * (1 - u), 0x8a7a62);
      }
    }
    // clods left along the furrow as the head passes; they stay as long as the crack
    if (FXLIB.frames.clod1) for (let i = 0; i < CR.trail; i++) {
      const q = (i + 0.5) / CR.trail * 0.9 + 0.05 * fxRand(seed, i, 95);
      if (q > run) continue;
      at(q, _fp);
      const side = (fxRand(seed, i, 96) < 0.5 ? -1 : 1) * (CR.width * 0.5 + 1 + 3 * fxRand(seed, i, 97)), px = _fp.x + nx * side, py = _fp.y + ny * side;
      fxPut(L.groundN, 'clod' + (1 + ((i + 3) % 6)), sx(px, py), sy(px, py, 0), 2.6 + 1.4 * fxRand(seed, i, 98), fade * (red ? 1 : Math.min(1, (run - q) * 12)), 0xffffff, fxRand(seed, i, 99) * TAU);
    }
  }
  // impact, hold and wither, per held figure
  const grow = IM.grow, wt = look.witherTint, HO = look.hold, halves = !!FXLIB.frames.coil3B;
  const coilRef = FXLIB.t(halves ? 'coil3B' : 'coil3'), coilS = HO.coil / coilRef.frame.height; // the grown coil is 20 wu tall (to the hips)
  for (let k = 0; k < held.length; k++) {
    const h = held[k], f = h.f, sp = L.st.sprites[f.id];
    if (t < i0 || t > h.t1 + look.wither + 0.05) continue;
    const holding = t < h.t1, w = holding ? 0 : (t - h.t1) / look.wither;
    const at = holding ? figPos(T, f, t, _ep) : figPos(T, f, h.t1, _ep);
    const vx = sp && sp.paint ? sp.paint.vary.jx : 0, vy = sp && sp.paint ? sp.paint.vary.jy : 0;
    const gx = at.x + vx, gy = at.y + vy, X = sx(gx, gy), Y = sy(gx, gy, 0);
    const zf = sp && sp.visible ? sp.zIndex : depthKey(at.x, at.y); // the halves sort just behind and just in front of him
    const age = t - i0;
    // the ground splits under him as the roots come through (Loam's signature: the eruption from a ground crack)
    {
      const s = L.groundN.take(FXLIB.t('splitGround')), k2 = smooth(age / IM.splitGrow), room = clamp(2 * h.space, 20, IM.split);
      s.position.set(X, Y); s.scale.set(room * (0.5 + 0.5 * k2) / s.texture.frame.width);
      s.alpha = 0.85 * k2 * (holding ? 1 : Math.max(0, 1 - w));
    }
    // four anchor tendrils radiate from his feet (fix 3b): lines read at play zoom and say rooted; they sway while he is
    // held and brown with the wither. They lie over the torn earth of the thorns (sorted just under him), so the thorn ring
    // does not hide them
    {
      const qg = smooth(age / IM.runnerGrow), al = holding ? 1 : Math.max(0, 1 - w), ti = holding ? 0xffffff : mix(0xffffff, wt, Math.min(1, w * 1.6));
      for (let i = 0; i < HO.tendrils && al > 0.01; i++) {
        const ang = (i / HO.tendrils) * TAU + (fxRand(seed, f.id * 5 + i, 81) - 0.5) * 1.2, len = lerp(HO.tendrilLen[0], HO.tendrilLen[1], fxRand(seed, f.id * 5 + i, 82)) * qg;
        if (len < 1) continue;
        const r = L.units.rope(FXLIB.t('vineStrip'), HO.tendrilW, 8), ca = Math.cos(ang), sa = Math.sin(ang);
        r.zIndex = zf - 0.0055;
        for (let j = 0; j < 8; j++) {
          const u = j / 7, off = Math.sin(u * 3 + i) * 2.5 * u + (holding && !red ? Math.sin(t * 2.1 + i * 1.7 + k) * 1.2 * u : 0);
          const px = gx + ca * (3 + len * u) - sa * off, py = gy + sa * (3 + len * u) + ca * off;
          r.pts[j].set(sx(px, py), sy(px, py, 0));
        }
        fxRope(r, 0, 0.3 * len / 20); r.alpha = al; r.tint = ti;
        fx.trace.tendrils++;
      }
    }
    // the eruption: a ring of thorny roots shoots up with overshoot, settles (stage 4) and stays round his feet; a block's
    // men take all three painted variants by figure, a lone man the ring round an empty middle (fix 3e)
    {
      const q = clamp(age / IM.erupt, 0, 1), st = Math.min(3, Math.floor(q * 4)), vr = held.length === 1 ? 'B' : 'ABC'[f.id % 3];
      const over = red ? 1 : 1 + 0.25 * Math.sin(Math.PI * clamp(age / (IM.erupt * 1.5), 0, 1));
      const fit = clamp(1.5 * h.space / HO.thorns, 0.55, 1); // a block's thorns shrink to the room between its men
      const W = lerp(IM.thorns, HO.thorns, smooth((age - IM.erupt) / IM.settle)) * fit;
      const s = L.units.take(FXLIB.t('thorn' + vr + (st + 1)));
      s.position.set(X, Y); s.zIndex = zf - 0.006;
      s.scale.set(W / FXLIB.t('thorn' + vr + '3').frame.width * over);
      if (!holding) { s.alpha = red ? 1 - w : Math.max(0, 1 - w * w); s.tint = mix(0xffffff, wt, Math.min(1, w * 1.6)); s.scale.y *= 1 - 0.35 * w; }
    }
    // the coil: three growth stages over 200 ms, held, then dried, sagging, collapsing and fallen over 600 ms (a fade under
    // reduced motion); with the L2 re-roll each stage is an open back half behind him and a front half before him
    let name = 'coil3', a = 1, tint = 0xffffff;
    if (age < grow) name = 'coil' + (1 + Math.min(2, Math.floor((age / grow) * 3)));
    if (!holding) {
      if (red) a = 1 - w;
      else if (halves) { name = w < 0.25 ? 'dry3' : w < 0.5 ? 'wither1' : w < 0.75 ? 'wither2' : 'wither3'; a = w < 0.85 ? 1 : (1 - w) / 0.15; tint = mix(0xffffff, wt, Math.min(1, w * 1.2)); }
      else { name = w < 0.34 ? 'wither1' : w < 0.67 ? 'wither2' : 'wither3'; a = w < 0.85 ? 1 : (1 - w) / 0.15; tint = mix(0xffffff, wt, Math.min(1, w * 1.5)); }
    }
    if (a > 0.01) {
      const fitC = clamp(1.7 * h.space / (coilRef.frame.width * coilS), 0.6, 1), sk = holding && !red && age > grow ? 0.025 * Math.sin(t * 1.3 + k) : 0;
      for (const half of halves ? ['B', 'F'] : ['']) {
        const s = L.units.take(FXLIB.t(name + half));
        s.position.set(X, Y); s.zIndex = half === 'B' ? zf - 0.004 : zf + 0.004; s.scale.set(coilS * fitC); s.alpha = a; s.tint = tint;
        if (sk) s.skew.set(sk, 0);
      }
      fx.trace.coil = name; if (!holding) fx.trace.wither = 1;
    }
    // runners: a vine from the crack's end to each man of a held block, grown with the eruption, withered with the coil
    if (Math.hypot(gx - tx, gy - ty) > 6) {
      const r = L.groundN.rope(FXLIB.t('vineStrip'), 3.2, 8), q = smooth(age / IM.runnerGrow);
      for (let j = 0; j < 8; j++) { const u = (j / 7) * q, x = lerp(tx, gx, u), y = lerp(ty, gy, u) + Math.sin(u * 6 + k) * 2; r.pts[j].set(sx(x, y), sy(x, y, 0)); }
      fxRope(r, 0, 0.25 * q);
      r.alpha = holding ? 1 : Math.max(0, 1 - w); r.tint = holding ? 0xffffff : wt;
    }
    // the dashed curse ring under a lone held figure, at his commander ring's radius (which dims while he is held: fix
    // 3c); sorted over the thorns' torn earth and under him, so the bigger thorns do not hide it. A block's ring is drawn
    // once, round the block, below
    if (held.length === 1 && holding && age > IM.ringIn) {
      const ring = fxGroundSprite(L.units, 'ringDashB', gx, gy, HO.ringR, 0.95 * smooth((age - IM.ringIn) / IM.ringIn), HO.ring);
      ring.zIndex = zf - 0.005; fx.trace.curse = 1;
    }
  }
  if (held.length > 1 && t >= i0 + IM.ringIn) { // the block's dashed curse ring, round all its held men while any is held
    const on = held.filter((h) => t < h.t1);
    if (on.length) {
      const mx = on.reduce((q, h) => q + h.x, 0) / on.length, my = on.reduce((q, h) => q + h.y, 0) / on.length;
      const r = Math.min(110, Math.max(...on.map((h) => Math.hypot(h.x - mx, h.y - my))) + look.hold.ringR * 0.7);
      fxGroundSprite(L.groundN, r > 32 ? 'ringDash' : 'ringDashB', mx, my, r, 0.92 * smooth((t - i0 - IM.ringIn) / IM.ringIn), look.hold.ring); fx.trace.curse = 1;
    }
  }
  // dirt (matter, its own tint) and leaves (Loam particles, docs/09: small leaf shapes spreading outward along the ground,
  // hugging the row line, easing out slowly, normal blend, primary 70% and accent 30%); at most 40
  const lk = fxLingerK(L, b, t);
  if (t >= i0 && t < i0 + IM.leafLife[1] && lk > 0) {
    const G = FX_GRAMMAR.G, age = t - i0, nd = Math.round(IM.dirt * ps), nl = Math.round(IM.leaves * ps);
    const dx = tx - cx, dy = ty - cy, dl = Math.hypot(dx, dy) || 1, fxd = dx / dl, fyd = dy / dl, rx = -fyd, ry = fxd; // the row line
    const W0 = G.px / (FX_RULES.playManPx / 28);
    for (let i = 0; i < nd + nl; i++) {
      const h = held[i % held.length], leaf = i >= nd;
      const life = leaf ? lerp(IM.leafLife[0], IM.leafLife[1], fxRand(seed, i, 6)) : lerp(IM.dirtLife[0], IM.dirtLife[1], fxRand(seed, i, 6)), u = age / life;
      if (u >= 1) continue;
      if (leaf) {
        const e = FX_EASE.outSlow(u), side = fxRand(seed, i, 7) < 0.5 ? -1 : 1;
        const along = side * lerp(IM.leafSpread[0], IM.leafSpread[1], fxRand(seed, i, 8)) * e, across = (fxRand(seed, i, 10) - 0.5) * G.across * e;
        const x = h.x + rx * along + fxd * across, y = h.y + ry * along + fyd * across, hh = G.hug * (1 - u) * (0.6 + 0.4 * Math.sin(age * 9 + i));
        const prim = fxPrimary(i - nd), set = prim ? G.leavesPrimary : G.leavesAccent;
        const name = 'leaf' + set[Math.floor(fxRand(seed, i, 11) * set.length)];
        fxPut(L.airN, name, sx(x, y), sy(x, y, hh), W0 * (1 + G.jitter * (2 * fxRand(seed, i, 12) - 1)), (1 - u * u) * lk, mix(0xffffff, prim ? G.primary : G.accent, G.tint), side * e * 2.2 + fxRand(seed, i, 9) * TAU);
        fx.trace.leaves++;
      } else {
        const ang = fxRand(seed, i, 7) * TAU, v = 18 + 30 * fxRand(seed, i, 8), dxg = Math.cos(ang) * v * age, dyg = Math.sin(ang) * v * age;
        const hh = Math.max(0, 90 * age - 220 * age * age);
        fxPut(L.airN, 'ember' + (1 + (i & 3)), sx(h.x + dxg, h.y + dyg), sy(h.x + dxg, h.y + dyg, hh), 2.2 + 1.6 * fxRand(seed, i, 9), (1 - u) * lk, FX_COLORS.dirt, ang);
      }
    }
  }
}
