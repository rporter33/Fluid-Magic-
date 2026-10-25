'use strict';
// ---- BattleStage, part 4: the big bodies at t ----

Object.assign(BattleStage.prototype, {
  updateBig(bb, t, speed) {
    const { f, body, shadow, G } = bb;
    const T = this.T;
    const g = G.g;
    const p = figPos(T, f, t, { x: 0, y: 0, h: 0 });
    const vis = t >= G.appear;
    body.root.visible = vis; shadow.visible = vis;
    if (body.shadowSprite) body.shadowSprite.visible = vis;
    if (!vis) return;
    // action
    let act = null, k = 0;
    for (const s of f.shots) if (t >= s.t && t < s.t + (s.dur || 0.8)) { act = s.kind === 'breath' ? 'breath' : 'cast'; k = (t - s.t) / (s.dur || 0.8); }
    for (const s of f.strikes) {
      const a = s.t - s.wind, b = s.t + s.strike + s.rec;
      if (t >= a && t < b && shownAt(s.item, speed)) { act = g.unit === 'treant' ? 'slam' : 'bite'; k = (t - a) / (b - a); }
    }
    for (const r of f.reacts) if (t >= r.t && t < r.t + 0.18 && r.kind !== 'dodge') { if (!act) act = 'hit'; }
    let h = p.h;
    const flying = g.flying;
    // a landed flyer stands on the ground; so does a painted body, whose idle cutout is a standing pose (its flight
    // cutout comes with the stage D animation)
    const aloft = flying && !f.death && p.h > 12 && !body.painted;
    if (body.painted) { p.h = 0; h = 0; }
    if (aloft && act === 'bite' && h > 30) h = Math.max(10, h - 100 * Math.sin(Math.PI * clamp(k, 0, 1)));
    if (aloft) h += Math.sin(t * TAU * 0.5) * 6;
    bb.gx = p.x; bb.gy = p.y; bb.h = h;
    if (flying) { const want = h > 20 ? this.skyShadows : this.shadows; if (shadow.parent !== want) want.addChild(shadow); }
    // facing: toward the nearest enemy front (screen left or right)
    let face = G.s < 0 ? 1 : -1;
    const tgt = f.strikes.find((s) => t >= s.t - 1.2 && t < s.t + 0.6);
    if (tgt) { const q = figPos(T, T.F[tgt.tf], t, { x: 0, y: 0, h: 0 }); face = sx(q.x, q.y) >= sx(p.x, p.y) ? 1 : -1; }
    else {
      // its breath's targets too: the stream leaves the mouth toward the row it sweeps (stage C: a painted head shows
      // which way the body faces, so a breath out of the back of the head read wrong)
      const br = (bb.breaths || (bb.breaths = T.spellFx.filter((x) => x.spell === 'breath' && x.caster === f.id))).find((x) => t >= x.t0 - 0.6 && t < x.t1 + 0.3);
      if (br && br.hitFigs.length) {
        let X = 0;
        for (const fi of br.hitFigs) { const q = figPos(T, T.F[fi], br.release, this._brq || (this._brq = { x: 0, y: 0, h: 0 })); X += sx(q.x, q.y); }
        face = X / br.hitFigs.length >= sx(p.x, p.y) ? 1 : -1;
      }
    }
    body.root.scale.x = body.painted ? face * (body.view === 'back' ? 1 : -1) : face; // a painted view has its own native facing
    let x = p.x, y = p.y;
    const dead = f.death && t >= f.death.t;
    const deadK = dead ? clamp((t - f.death.t) / f.death.fall, 0, 1) : 0;
    body.pose({ t: dead ? f.death.t + f.phase * 10 : t + f.phase * 10, h, flying: aloft && !dead, act: dead ? null : act, k, moving: false, dead, deadK });
    body.root.position.set(sx(x, y), sy(x, y, h));
    body.root.zIndex = depthKey(x, y) + (flying && h > 30 ? 0.5 : 0);
    if (dead && body.painted) { // the painted cutout is not deformed (stage D animates it): it collapses (plan 6: tilt 8 to
      // 12 degrees, settle), sinking onto its belly about the ground anchor, and darkens (critique fix 10)
      const q = clamp((t - f.death.t) / f.death.fall, 0, 1), e = easeOut(q);
      body.root.rotation = face * 0.2 * e;
      body.root.scale.y = 1 - 0.16 * e;
      body.root.position.y += 3 * e;
      body.root.alpha = 1; body.root.tint = mix(0xffffff, 0x3a3430, q);
    } else if (dead) { // the corpse lies down: it tips, settles flat (squashed in y) and folds its wings (the pose)
      const q = clamp((t - f.death.t) / f.death.fall, 0, 1);
      body.root.rotation = face * 0.18 * q * (1 - q * 0.6);
      body.root.scale.y = lerp(1, 0.55, easeIn(q));
      body.root.alpha = 1;
      body.root.tint = bb.tint ? bb.tint(mix(0xffffff, 0x5a544e, q)) : mix(0xffffff, 0x5a544e, q);
    } else { body.root.rotation = 0; body.root.scale.y = 1; body.root.tint = bb.tint ? bb.tint(act === 'hit' ? 0xffd0c0 : 0xffffff) : act === 'hit' ? 0xffd0c0 : 0xffffff; }
    if (body.painted) { // the silhouette shadow (review change 13): the cutout, black, soft, 5 wu right and 4 wu down
      const ss = body.shadowSprite, k = body.k;
      ss.visible = true;
      ss.position.set(sx(x, y) + 5, sy(x, y, 0) + 4);
      ss.scale.set(body.root.scale.x * k, 0.9 * k * body.root.scale.y);
      ss.rotation = body.root.rotation;
      ss.alpha = dead ? 1 - 0.5 * clamp((t - f.death.t) / f.death.fall, 0, 1) : 1;
      shadow.visible = false;
      return;
    }
    // soft shadow on the ground, offset toward the lower right
    const H = LAYOUT.sizeH[g.size] || 64;
    shadow.position.set(sx(x, y) + 0.25 * H * 0.5 + h * 0.5, sy(x, y, 0) + 6 + h * 0.15);
    const sc = (LAYOUT.footR[g.size] * 1.4) / 50 * (g.unit === 'greatWyrm' ? 2.6 : 1.4) * (1 - h / 400);
    shadow.scale.set(sc * 1.2, sc * 0.9);
    shadow.alpha = flying ? 0.35 - h / 800 : 0.35;
  },
});
