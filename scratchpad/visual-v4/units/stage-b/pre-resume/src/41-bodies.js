'use strict';
// ---- big bodies (design 12.2): procedural rigs drawn once, animated by part transforms ----
// Drawn in world units, in profile facing screen right; the feet (or the hover point) at the
// origin. Big bodies are the only figures allowed full chroma.

const GRAD_CACHE = new Map(); // gradients are shared and kept: each one owns a texture (critique fix 4, leak)
function grad(c0, c1, vertical) {
  const key = c0 + '/' + c1 + '/' + (vertical === false ? 'h' : 'v');
  let g = GRAD_CACHE.get(key);
  if (!g) {
    g = new PIXI.FillGradient({ type: 'linear', start: { x: 0, y: 0 }, end: vertical === false ? { x: 1, y: 0 } : { x: 0, y: 1 },
      colorStops: [{ offset: 0, color: c0 }, { offset: 1, color: c1 }], textureSpace: 'local' });
    GRAD_CACHE.set(key, g);
  }
  return g;
}
function outline(g, w, a) { return g.stroke({ width: w || 1.6, color: INK, alpha: a ?? 0.75, join: 'round' }); }

// the Great Wyrm is in 43-wyrm.js
// ---------------------------------------------------------------------------------------
function makeTreant() {
  const C = { bark: 0x5b4632, barkHi: 0x8a6e4e, barkLo: 0x33261a, moss: 0x6f8a3a, leaf: 0x3f7a36, leafHi: 0x6aa04a, leafLo: 0x24502a };
  const root = new PIXI.Container();
  const body = new PIXI.Container(); root.addChild(body);
  const mk = (parent, x, y) => { const c = new PIXI.Container(); c.position.set(x, y); parent.addChild(c); return c; };
  const legL = mk(body, -8, -30), legR = mk(body, 10, -30);
  for (const [lg, far] of [[legL, true], [legR, false]]) {
    const g = new PIXI.Graphics();
    g.poly([-7, 0, 7, 0, 9, 22, 16, 30, 4, 31, -2, 26, -12, 30, -9, 20]).fill(far ? C.barkLo : C.bark); outline(g, 1.4);
    lg.addChild(g);
  }
  const armFar = mk(body, -14, -70);
  const trunk = new PIXI.Graphics();
  trunk.poly([-18, -28, -14, -76, -6, -88, 10, -90, 18, -74, 20, -28, 8, -22, -8, -22]).fill(grad(C.barkHi, C.barkLo, false)); outline(trunk, 2);
  for (let i = 0; i < 6; i++) trunk.moveTo(-12 + i * 5, -30).quadraticCurveTo(-14 + i * 6, -55, -10 + i * 4.5, -84).stroke({ width: 1.3, color: C.barkLo, alpha: 0.7 });
  // a face in the bark: a heavy brow, two hollow knots, a crooked split for a mouth
  trunk.poly([-8, -67, 16, -67, 14, -63, -6, -63]).fill(C.barkLo);
  trunk.ellipse(-1, -60.5, 2.6, 2.2).fill(0x14100c); trunk.ellipse(10, -60, 2.4, 2).fill(0x14100c);
  trunk.ellipse(4.5, -55, 2.2, 3).fill(C.barkHi);
  trunk.moveTo(-3, -47.5).lineTo(3, -46.5).lineTo(6, -48).lineTo(11, -47).stroke({ width: 2, color: 0x14100c });
  trunk.poly([-16, -40, -6, -44, -14, -32]).fill({ color: C.moss, alpha: 0.9 });
  trunk.poly([12, -80, 20, -70, 18, -84]).fill({ color: C.moss, alpha: 0.9 });
  body.addChild(trunk);
  const armNear = mk(body, 14, -72);
  for (const [arm, far] of [[armFar, true], [armNear, false]]) {
    const g = new PIXI.Graphics();
    g.poly([-4, -4, 4, -4, 12, 18, 18, 34, 12, 36, 4, 20, -4, 6]).fill(far ? C.barkLo : C.bark); outline(g, 1.4);
    g.moveTo(16, 34).lineTo(24, 40).stroke({ width: 3, color: far ? C.barkLo : C.bark, cap: 'round' });
    g.moveTo(14, 35).lineTo(16, 44).stroke({ width: 3, color: far ? C.barkLo : C.bark, cap: 'round' });
    g.moveTo(12, 34).lineTo(6, 42).stroke({ width: 2.6, color: far ? C.barkLo : C.bark, cap: 'round' });
    for (let i = 0; i < 3; i++) g.ellipse(8 + i * 4, 14 + i * 7, 5, 3).fill({ color: far ? C.leafLo : C.leaf, alpha: 0.9 });
    arm.addChild(g);
  }
  const crown = mk(body, 2, -92);
  const cg = new PIXI.Graphics();
  const rng = mulberry(1234);
  for (let i = 0; i < 34; i++) {
    const a = rng() * Math.PI - Math.PI, r = 8 + rng() * 22;
    const x = Math.cos(a) * r * 1.3, y = Math.sin(a) * r * 0.7 - 2;
    cg.circle(x, y, 7 + rng() * 6).fill(i < 12 ? C.leafLo : i < 26 ? C.leaf : C.leafHi);
  }
  for (let i = 0; i < 5; i++) cg.moveTo(-10 + i * 5, 8).lineTo(-20 + i * 10, -14).stroke({ width: 2.4, color: C.bark, cap: 'round' });
  crown.addChild(cg);
  return {
    root, kind: 'treant', H: 95, footR: 24,
    pose(st) {
      const t = st.t;
      const walk = st.moving ? Math.sin(t * 5) : 0;
      legL.rotation = walk * 0.25; legR.rotation = -walk * 0.25;
      body.y = -Math.abs(walk) * 2;
      crown.rotation = Math.sin(t * 0.9) * 0.04;
      let a = Math.sin(t * 0.8) * 0.06;
      if (st.act === 'slam') { const k = st.k; a = k < 0.45 ? -1.3 * smooth(k / 0.45) : -1.3 + 2.1 * smooth((k - 0.45) / 0.15); }
      armNear.rotation = a; armFar.rotation = a * 0.6 + 0.1;
      body.x = st.act === 'hit' ? -3 : 0;
    },
  };
}

// ---------------------------------------------------------------------------------------
function makeSalamander() {
  const C = { body: 0xc4461c, hi: 0xf08a3a, lo: 0x6a1e0c, belly: 0xffb04a, flame: 0xffa020, core: 0xfff0a0 };
  const root = new PIXI.Container();
  const body = new PIXI.Container(); root.addChild(body);
  const mk = (parent, x, y) => { const c = new PIXI.Container(); c.position.set(x, y); parent.addChild(c); return c; };
  const tail = mk(body, -26, -16);
  const tl = new PIXI.Graphics();
  tl.poly([0, -7, -38, -4, -60, 4, -38, 4, 0, 7]).fill(grad(C.hi, C.lo)); outline(tl, 1.4);
  tail.addChild(tl);
  const legs = new PIXI.Graphics();
  for (const [x, far] of [[-18, true], [16, true], [-14, false], [20, false]]) legs.poly([x - 4, -14, x + 4, -14, x + 7, 0, x - 1, 0]).fill(far ? C.lo : C.body);
  outline(legs, 1.2);
  body.addChild(legs);
  const tor = new PIXI.Graphics();
  tor.ellipse(0, -18, 32, 11).fill(grad(C.hi, C.lo)); outline(tor, 1.6);
  tor.ellipse(2, -11, 26, 4).fill({ color: C.belly, alpha: 0.9 });
  for (let i = 0; i < 7; i++) tor.ellipse(-22 + i * 7, -24 + Math.abs(i - 3) * 0.6, 3, 2).fill({ color: C.lo, alpha: 0.6 });
  body.addChild(tor);
  const flames = new PIXI.Graphics(); body.addChild(flames);
  const neck = mk(body, 26, -22);
  const hd = new PIXI.Graphics();
  hd.poly([-4, -8, 12, -14, 30, -10, 36, -4, 30, 2, 8, 6, -6, 4]).fill(grad(C.hi, C.body)); outline(hd, 1.5);
  hd.circle(18, -8, 2.2).fill(0xfff070); hd.circle(18.4, -8, 0.9).fill(0x1c1a17);
  hd.poly([30, -2, 36, -4, 30, 1]).fill(C.lo);
  neck.addChild(hd);
  body.scale.set(1.5); // 42 to 63 wu tall: a beast of size 3 (critique fix 1)
  return {
    root, kind: 'salamander', H: 64, footR: 16,
    pose(st) {
      const t = st.t;
      tail.rotation = Math.sin(t * 2.2) * 0.25;
      body.y = Math.sin(t * 3) * 0.8;
      neck.rotation = st.act === 'breath' ? -0.4 : st.act === 'bite' ? (st.k < 0.5 ? -0.55 : 0.05) : -0.25 + Math.sin(t * 1.4) * 0.06; // the head held up
      flames.clear();
      for (let i = 0; i < 6; i++) {
        const x = -20 + i * 8, hgt = 10 + 6 * Math.sin(t * 9 + i * 1.7);
        flames.poly([x - 4, -26, x, -26 - hgt, x + 4, -26]).fill({ color: C.flame, alpha: 0.85 });
        flames.poly([x - 2, -26, x, -26 - hgt * 0.6, x + 2, -26]).fill({ color: C.core, alpha: 0.9 });
      }
      body.x = st.act === 'hit' ? -2 : 0;
    },
    mouth() { const p = neck.toGlobal(new PIXI.Point(34, -3)); return root.toLocal(p); },
  };
}

function makeBigBody(unit, pal) {
  if (unit === 'greatWyrm') return makeWyrm(pal);
  if (unit === 'treant') return makeTreant(pal);
  if (unit === 'salamander') return makeSalamander(pal);
  return makeTreant(pal);
}
