'use strict';
// ---- the magic pilot's decals (art plan 7.1: stamped into the field under the 8,000 cap) ----
// The fireball's 120 wu scorch ring, a scorch mark where a fragment lands and under each burnt body, and the root scars
// Entangle leaves. They are Sprites of the effects atlas in the decal render group, under the bodies (index 0), drawn
// in normal blend from the multiply form of the painted white-ground sheets (fx_pack.py), so they batch with the bodies.
// A decal appears at its time and settles over its growth; it is a pure function of story time, like everything here.

class FxDecals {
  constructor(L) {
    this.L = L;
    const st = L.st, T = L.T;
    this.layer = new PIXI.Container();
    st.decalLayer.addChildAt(this.layer, 0);
    this.list = [];
    const add = (name, x, y, W, t, grow, alpha, rot) => {
      const tex = FXLIB.t(name), s = new PIXI.Sprite(tex);
      s.anchor.set(0.5); s.position.set(sx(x, y), sy(x, y, 0)); s.rotation = rot || 0; s.visible = false;
      s.full = W / tex.frame.width; s.scale.set(s.full);
      this.layer.addChild(s);
      this.list.push({ s, t, grow, alpha });
    };
    for (const fx of L.spells) {
      const seed = fx.seed >>> 0;
      if (fx.spell === 'fireball') {
        const look = FX_LOOKS.fireball;
        for (const c of fx.clusters || []) {
          if (c.main) add('scorchRing', c.x, c.y, look.linger.scorch, fx.beats.impact[0] + 0.03, 0.25, 0.8, (fxRand(seed, 1, 1) - 0.5) * 0.3);
          else add('scorchDot', c.x, c.y, look.fragment.scorch, c.tLand + 0.02, 0.2, 0.85, fxRand(seed, 2, c.figs[0]) * TAU);
        }
        for (const f of fx.kills) add('scorchDot', f.death.at.x, f.death.at.y, 14, f.death.t + f.death.fall * 0.8, 0.3, 0.7, fxRand(seed, 3, f.id) * TAU);
      } else if (fx.spell === 'entangle') {
        const look = FX_LOOKS.entangle;
        for (const h of fx.held) if (h.t1 < T.duration) add('rootScar' + (1 + (h.f.id % 3)), h.x, h.y, look.scar, h.t1 + 0.3, 0.3, 0.85, 0);
      }
    }
    // the bodies of blast kills are charred: their painted dead pose, darker than the plain bodies' 0xb0a8a0
    this.charred = 0;
    T.decals.forEach((d, i) => { if (d.char && st.decalSprites[i]) { st.decalSprites[i].tint = 0x5e5249; this.charred++; } });
    this.layer.visible = this.list.length > 0;
  }
  get count() { return this.list.length; }
  update(t) {
    for (const d of this.list) {
      const on = t >= d.t;
      d.s.visible = on;
      if (!on) continue;
      const k = d.grow > 0 ? clamp((t - d.t) / d.grow, 0, 1) : 1;
      d.s.alpha = d.alpha * k;
      d.s.scale.set(d.s.full * (0.6 + 0.4 * easeOut(k)));
    }
  }
  dispose() { this.list.length = 0; }
}
