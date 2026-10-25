'use strict';
// ---- painted figures, part 4: the painted banners and the big bodies' standing cutouts ----

// ---------------------------------------------------------------- painted banners (critique fix 6)
/**
 * A nation's painted banner: a pole and the cloth on a 9 x 3 MeshPlane whose column 0 stays on the pole, waved by a
 * travelling sine (the banner JSON's strip mesh). Block standards and the generals carry it.
 */
function makePaintBanner(nation) {
  const root = new PIXI.Container();
  const pole = new PIXI.Sprite(PIXI.Texture.WHITE); pole.tint = 0x3b2d20; pole.anchor.set(0.5, 1);
  const mesh = new PIXI.MeshPlane({ texture: PAINTLIB.banner[nation].S, verticesX: 9, verticesY: 3 });
  mesh.autoResize = false;
  root.addChild(pole, mesh);
  return { root, pole, mesh, nation, tier: 'S' };
}
/**
 * Places a banner in world screen units: the pole from (X, Yfoot) up to Ytop, the cloth w x h hanging from the pole
 * top and flying toward dir (+1 screen right, -1 left), its free end waving by amp.
 */
function placePaintBanner(b, tier, X, Yfoot, Ytop, w, h, dir, t, ph, amp) {
  if (b.tier !== tier) { b.mesh.texture = PAINTLIB.banner[b.nation][tier]; b.tier = tier; }
  b.pole.position.set(X, Yfoot); b.pole.width = 1.5; b.pole.height = Math.max(1, Yfoot - Ytop + 1.5);
  const buf = b.mesh.geometry.getBuffer('aPosition'), pos = buf.data;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++) {
    const i = (r * 9 + c) * 2, u = c / 8;
    pos[i] = X + dir * (u * w - 0.3 * u * u * Math.abs(amp));
    pos[i + 1] = Ytop + 0.5 + (r / 2) * h + Math.sin(t * 3 + ph - c * 0.7) * amp * u + 0.6 * u * u;
  }
  buf.update();
}

// ---------------------------------------------------------------- big bodies: their approved idle cutouts
/**
 * A painted big body (the Salamander 01 of the pilot; the stage C Salamander faces, Treants, Giants and gods): its idle
 * cutout in one view, scaled so its true height on screen is its metadata's heightWu, the ground anchor at the origin,
 * its silhouette shadow, and its mouth point where it breathes. Standing, unanimated until the owner's stage D review.
 */
function makePaintedBig(fig, view) {
  const b = PAINT.bigs[fig];
  const root = new PIXI.Container();
  const sp = new PIXI.Sprite(); root.addChild(sp);
  const shadow = new PIXI.Sprite();
  const body = {
    root, kind: b.unit, fig, H: b.views[view].heightWu, heightWu: b.views[view].heightWu, painted: true, sprite: sp, shadowSprite: shadow, view, tier: null, k: 0.5, pad: 1,
    setTier(tier) {
      if (this.tier === tier) return;
      this.tier = tier;
      const s = PAINTLIB.big[fig][view + tier];
      sp.texture = s.tex; sp.anchor.set(s.ax, s.ay);
      this.k = PAINT.wuPerPx[tier]; sp.scale.set(this.k); this.pad = s.pad;
      shadow.texture = s.shadow; shadow.anchor.set(s.sax, s.say);
      this.mouthPt = s.mouth ? { x: s.mouth[0], y: s.mouth[1] } : null;
    },
    pose() { /* standing, unanimated until the owner's stage D review (art plan 4) */ },
  };
  if (b.views[view].S.mouth) body.mouth = function mouth() { return this.mouthPt; };
  body.setTier('S');
  return body;
}
