'use strict';
// ---- the procedural side looks (palettes, cloth variants, the lab), the Painted mode stand-in tone, baked textures ----
// Split from 60-render.js for size (stage D animation part); behaviour unchanged.

function basePalette(B, side) {
  const n = B.sides[side];
  return PALETTES[n.def || 'independent'] || PALETTES.independent;
}
/**
 * Cloth variants a side may wear. The armies must part by CIEDE2000 >= CVD_MIN under protan and
 * deutan vision as rendered (critique fix 6), and each must stay 15 L* below its ground (design 3.8).
 */
const PAL_VARIANTS = {
  base: (p) => p,
  mid: (p) => ({ ...p, cloth: mix(p.cloth, p.clothLight, 0.55), clothDark: mix(p.clothDark, p.cloth, 0.5) }),
  light: (p) => ({ ...p, cloth: p.clothLight, clothDark: p.cloth, clothLight: shade(p.clothLight, 0.2) }),
  dark: (p) => ({ ...p, cloth: p.clothDark, clothLight: p.cloth, clothDark: shade(p.clothDark, -0.3) }),
};
/** Least change first: the far side lightens before the near side darkens. */
const LOOK_ORDER = [['base', 'base'], ['base', 'mid'], ['base', 'light'], ['dark', 'base'], ['dark', 'mid'], ['dark', 'light']];
const SIDE_LOOKS = new Map(); // battle id -> { near, far, tried }, from a lab run in this page
/**
 * The lab's choices (chooseSideLooks, run with window.__battle.lab()), per near nation, far nation and
 * ground. The game would ship such a table; measuring at load costs seconds on a software GPU.
 */
const SIDE_LOOK_TABLE = {
  'cinderHorde>thornwood@a8a784': { near: 'base', far: 'mid' },
  'thornwood>cinderHorde@b9bdcb': { near: 'base', far: 'light' },
  'cinderHorde>thornwood@8e8e78': { near: 'dark', far: 'base' },
};
function sideLookKey(B) {
  const far = B.nearSide === 'attacker' ? 'defender' : 'attacker';
  return B.sides[B.nearSide].def + '>' + B.sides[far].def + '@' + numToHex(groundColor(B)).slice(1);
}
function sideLooksOf(B) { return SIDE_LOOKS.get(B.id) || SIDE_LOOK_TABLE[sideLookKey(B)] || { near: 'base', far: 'base' }; }
function paletteFor(B, side) {
  const v = sideLooksOf(B);
  const which = v ? (side === B.nearSide ? v.near : v.far) : 'base';
  return which === 'base' ? basePalette(B, side) : { ...PAL_VARIANTS[which](basePalette(B, side)), variant: which };
}
/** Median sRGB of a baked frame's opaque pixels. */
function frameMedian(renderer, tex) {
  // render the frame into a small target and read it back directly (extract.pixels takes seconds on a
  // software GPU; this takes milliseconds)
  const w = Math.round(tex.frame.width), h = Math.round(tex.frame.height);
  const rt = PIXI.RenderTexture.create({ width: w, height: h, resolution: 1 });
  const sp = new PIXI.Sprite(tex);
  renderer.render({ container: sp, target: rt, clear: true });
  const gl = renderer.gl, pixels = new Uint8Array(w * h * 4);
  renderer.renderTarget.bind(rt, false);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  if (renderer.renderTarget.rootRenderTarget) renderer.renderTarget.bind(renderer.renderTarget.rootRenderTarget, false);
  sp.destroy(); rt.destroy(true);
  const ch = [[], [], []];
  for (let i = 0; i < pixels.length; i += 4) if (pixels[i + 3] >= 250) { ch[0].push(pixels[i]); ch[1].push(pixels[i + 1]); ch[2].push(pixels[i + 2]); }
  const m = ch.map((a) => a.sort((x, y) => x - y)[a.length >> 1] || 0);
  return (m[0] << 16) | (m[1] << 8) | m[2];
}
/**
 * Chooses the two sides' cloth variants once per battle by measuring baked figures of each side's
 * largest block: the first pair in LOOK_ORDER that parts under every vision and keeps the value rule.
 * (The game would do this in the lab, per pair of nations and ground; the mockup measures at load.)
 */
function chooseSideLooks(renderer, B) {
  const far = B.nearSide === 'attacker' ? 'defender' : 'attacker';
  const rep = (side) => B.groups.filter((g) => g.side === side && !g.cmd && g.size < 3 && !['fireSprite', 'hornetSwarm'].includes(g.unit)).sort((a, b) => b.start - a.start)[0];
  const ground = lstar(groundColor(B));
  const med = new Map();
  const measure = (side, which) => {
    const g = rep(side);
    if (!g) return null;
    const key = g.unit + '/' + side + '/' + which;
    if (!med.has(key)) {
      if (!ATLAS_CACHE.has(key)) {
        const pal = which === 'base' ? basePalette(B, side) : { ...PAL_VARIANTS[which](basePalette(B, side)), variant: which };
        for (const [k, v] of bakeFigures(renderer, [{ key, unit: g.unit, pal }])) ATLAS_CACHE.set(k, v);
      }
      med.set(key, frameMedian(renderer, ATLAS_CACHE.get(key)[side === B.nearSide ? 'ne' : 'se'][FR.idle]));
    }
    return med.get(key);
  };
  const tried = [];
  let pick = null, best = null;
  for (const [n, f] of LOOK_ORDER) {
    const a = measure(B.nearSide, n), b = measure(far, f);
    if (a === null || b === null) { pick = { near: 'base', far: 'base' }; break; }
    const d = deltaEBy(a, b);
    const cvd = Math.min(...VISIONS.map((v) => d[v]));
    const value = ground - Math.max(lstar(a), lstar(b));
    tried.push({ near: n, far: f, nearColor: numToHex(a), farColor: numToHex(b), deltaE: d, belowGround: +value.toFixed(1) });
    if (!best || cvd > best.cvd) best = { near: n, far: f, cvd };
    if (cvd >= CVD_MIN + 1 && value >= 15) { pick = { near: n, far: f }; break; } // 1 point of margin for antialiasing
  }
  const out = { ...(pick || best), tried };

  return out;
}
/** The baked look's key: unit, side and palette variant (the atlas cache outlives a battle). */
function lookKey(B, g) { return g.unit + '/' + g.side + '/' + (paletteFor(B, g.side).variant || 'base'); }

/**
 * The Painted mode stand-in tone as a colour function: the matrix of a ColorMatrixFilter after saturate(-0.4) and
 * brightness(0.88), the filter the stand-ins wore before. Its shader maps straight (unpremultiplied) colour through the
 * matrix with no offset, so it is linear and commutes with alpha blending: grading each colour the rig draws gives the
 * filtered pixels, up to 8-bit rounding.
 */
let STAND_IN_TONE = null;
function standInTone() {
  if (STAND_IN_TONE) return STAND_IN_TONE;
  const cm = new PIXI.ColorMatrixFilter(); cm.saturate(-0.4, false); cm.brightness(0.88, true);
  const m = Array.from(cm.matrix); cm.destroy();
  const ch = (r, g, b, i) => Math.round(255 * clamp(m[i] * r + m[i + 1] * g + m[i + 2] * b + m[i + 3] + m[i + 4], 0, 1));
  STAND_IN_TONE = (c) => { const r = ((c >> 16) & 255) / 255, g = ((c >> 8) & 255) / 255, b = (c & 255) / 255; return (ch(r, g, b, 0) << 16) | (ch(r, g, b, 5) << 8) | ch(r, g, b, 10); };
  STAND_IN_TONE.matrix = m;
  // the body's tint (hit flash, death darkening) was graded by the filter too: as a tint on graded colours it is
  // M(t) / M(white) per channel, exact for grey colours and within a level for the rigs' own
  const w = [0, 5, 10].map((i) => m[i] + m[i + 1] + m[i + 2]);
  const tch = (r, g, b, i, k) => Math.round(255 * clamp((m[i] * r + m[i + 1] * g + m[i + 2] * b) / w[k], 0, 1));
  STAND_IN_TONE.tint = (c) => { const r = ((c >> 16) & 255) / 255, g = ((c >> 8) & 255) / 255, b = (c & 255) / 255; return (tch(r, g, b, 0, 0) << 16) | (tch(r, g, b, 5, 1) << 8) | tch(r, g, b, 10, 2); };
  return STAND_IN_TONE;
}

function makeTex(app, draw, w, h) {
  const g = new PIXI.Graphics();
  draw(g);
  return app.renderer.generateTexture({ target: g, resolution: 2, antialias: true });
}
