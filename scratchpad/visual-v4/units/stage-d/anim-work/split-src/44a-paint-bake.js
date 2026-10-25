'use strict';
// ---- painted figures, part 2: the variant bake (the calibration's shader), the side looks, each look's textures ----
// Split from 44-painted.js for size (stage D animation part); behaviour unchanged.

// ---------------------------------------------------------------- the variant bake (the calibration's shader)
const PAINT_VERT = `#version 300 es
in vec2 aPosition; in vec2 aUV; in vec4 aBox; in vec4 aShield; in vec2 aBody;
out vec2 vUV; out vec2 vLocal; out vec4 vShield; out vec2 vBody;
uniform mat3 uProjectionMatrix; uniform mat3 uWorldTransformMatrix; uniform mat3 uTransformMatrix;
void main() {
  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
  vUV = aUV; vLocal = (aUV - aBox.xy) / (aBox.zw - aBox.xy); vShield = aShield; vBody = aBody;
}`;
const PAINT_FRAG = `#version 300 es
precision highp float;
in vec2 vUV; in vec2 vLocal; in vec4 vShield; in vec2 vBody;
uniform sampler2D uTexture;
uniform float uClothH; uniform float uClothCmin; uniform vec4 uT1; uniform vec4 uT2; uniform vec4 uT3; uniform vec2 uSide; uniform float uSideCmin;
uniform float uStencilLight; uniform float uStencilDark;
out vec4 finalColor;
float cbrt(float x) { return sign(x) * pow(abs(x), 1.0 / 3.0); }
vec3 s2l(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
vec3 l2s(vec3 c) { c = clamp(c, 0.0, 1.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
vec3 toLab(vec3 c) {
  float l = cbrt(0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b);
  float m = cbrt(0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b);
  float s = cbrt(0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b);
  return vec3(0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s);
}
vec3 toLin(vec3 L) {
  float l = L.x + 0.3963377774 * L.y + 0.2158037573 * L.z, m = L.x - 0.1055613458 * L.y - 0.0638541728 * L.z, s = L.x - 0.0894841775 * L.y - 1.2914855480 * L.z;
  l = l * l * l; m = m * m * m; s = s * s * s;
  return vec3(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
}
vec2 rot(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }
float stencilShield(float id, vec2 p) {
  float r = length(p);
  if (id < 0.5) return 0.0;
  if (id < 1.5) return step(0.70, r);
  if (id < 2.5) return step(0.42, r) * step(r, 0.60);
  if (id < 3.5) return step(abs(p.x), 0.22);
  if (id < 4.5) return step(abs(p.y), 0.22);
  if (id < 5.5) return step(0.0, p.x * p.y);
  if (id < 6.5) { float y0 = 0.15 - 0.9 * abs(p.x); return step(y0, p.y) * step(p.y, y0 + 0.36); }
  return step(0.0, p.x + p.y);
}
void main() {
  vec4 t = texture(uTexture, vUV);
  if (t.a < 0.003) { finalColor = vec4(0.0); return; }
  vec3 c = t.rgb / t.a;
  vec3 lab = toLab(s2l(c));
  float C = length(lab.yz);
  float h = atan(lab.z, lab.y);
  float solid = smoothstep(0.86, 0.96, t.a);
  float dh = abs(mod(h - uClothH + 3.14159265, 6.2831853) - 3.14159265);
  float wC = solid * clamp((0.4538 - dh) / 0.1396, 0.0, 1.0) * clamp((C - uClothCmin) / 0.02, 0.0, 1.0);
  float hd = mod(degrees(h) + 360.0, 360.0);
  float warm = smoothstep(15.0, 30.0, hd) * (1.0 - smoothstep(90.0, 110.0, hd));
  float wM = solid * (1.0 - wC) * clamp((0.032 - C) / 0.012, 0.0, 1.0) * smoothstep(0.22, 0.32, lab.x);
  float chrom = clamp((C - 0.018) / 0.015, 0.0, 1.0);
  float lit = smoothstep(0.52, 0.62, lab.x);
  float wS = solid * (1.0 - wC) * (1.0 - wM) * warm * chrom * lit;
  float wL = solid * (1.0 - wC) * (1.0 - wM) * warm * chrom * (1.0 - lit);
  vec2 ab = lab.yz;
  float st = 0.0;
  if (vShield.z > 0.0 && uT3.y != 0.0) {
    vec2 p = (vLocal - vShield.xy) / vShield.zw;
    if (length(p) < 1.0) st = stencilShield(abs(uT3.y) - 1.0, p);
  }
  float top = vBody.x, bot = vBody.y, hh = max(0.01, bot - top), fy = (vLocal.y - top) / hh;
  if (uT3.z > 0.5 && fy < 0.17) st = max(st, uT3.z < 1.5 ? step(fy, 0.07) : step(0.5, fract(vLocal.x * 7.0)));
  if (uT3.w > 0.5) {
    if (uT3.w < 1.5) st = max(st, step(abs(fy - 0.55), 0.03));
    else if (uT3.w < 2.5) st = max(st, step(abs((fy - 0.30) - 0.75 * (vLocal.x - 0.35)), 0.045) * step(0.2, fy) * step(fy, 0.75));
    else st = max(st, step(0.80, fy));
  }
  float stShade = uT3.y < 0.0 ? uStencilLight : uStencilDark;
  vec2 abC = rot(ab, uT1.y) * uT1.z;
  float LC = lab.x + uT1.x + st * stShade;
  vec2 abS = rot(ab, uT2.y);
  float LS = lab.x + uT2.x;
  float LM = lab.x + uT2.z;
  vec2 abM = ab + (uT2.w > 0.0 ? vec2(0.629, 0.777) * 0.012 : vec2(-0.342, -0.940) * 0.008) * abs(uT2.w);
  float LL = lab.x + uT3.x;
  float wO = 1.0 - wC - wS - wM - wL;
  vec3 o = vec3(wC * LC + wS * LS + wM * LM + wL * LL + wO * lab.x, wC * abC + wS * abS + wM * abM + wL * ab + wO * ab);
  // the battle's side look (colour-blind separation, design revision 6): the side's cloth and its keyline moved in
  // lightness, with a wider chroma floor than the variation's so the dark painted Thornwood cloth is caught too
  float wSide = smoothstep(0.25, 0.5, t.a) * clamp((0.5236 - dh) / 0.1396, 0.0, 1.0) * clamp((C - uSideCmin) / 0.015, 0.0, 1.0); // the side keyline too
  o.x += wSide * uSide.x; o.yz *= mix(1.0, uSide.y, wSide);
  finalColor = vec4(l2s(toLin(o)), 1.0) * t.a;
}`;

/**
 * The painted side looks: the side's cloth moved in OKLab lightness (and chroma), one way per nation as the
 * calibration's variation limits (Cinder only lighter, Thornwood only darker), so the colour-blind contrast of the
 * two armies only grows. Chosen per battle by the lab (window.__battle.paintLab) into PAINT_SIDE_LOOK_TABLE.
 */
const PAINT_SIDE_SHIFT = {
  cinderHorde: { base: [0, 1], light: [0.05, 1.04], lighter: [0.1, 1.06], lightest: [0.15, 1.08], vivid: [0.15, 1.25] },
  // darkening alone clips the dark green's chroma (far side colour 23.5%): the C looks lift chroma too (critique fix 2)
  thornwood: { base: [0, 1], dark: [-0.05, 1], darker: [-0.09, 1], darkest: [-0.13, 1], darkC: [-0.05, 1.3], darkestC: [-0.12, 1.3] },
};
function paintSideShift(nation, which) {
  const t = PAINT_SIDE_SHIFT[nation];
  return (t && t[which]) || [0, 1];
}

/** The K material variants of one nation's troop page, for one tier and side look: K render textures. */
function bakePaintVariants(renderer, tier, nation, sideWhich) {
  const lib = PAINTLIB;
  const pages = lib.src[tier].map((s, i) => ({ s, i })).filter(({ s }) => s.pkind === 'troops:' + nation);
  const lim = PAINT.limits, cl = lim.cloth[nation];
  const clothHex = hexToNum(PAINT.cloth[nation]);
  const lch = oklchOf(clothHex);
  const side = paintSideShift(nation, sideWhich);
  const out = [];
  const t0 = performance.now();
  for (let k = 0; k < PAINT_K; k++) {
    const r = streamFor('paint-variants', nation + '/' + k);
    const q = (j) => ((((k * j) % PAINT_K) + 0.5) / PAINT_K); // evenly spread, decorrelated per dimension
    const t1 = [lerp(cl.L[0], cl.L[1], q(1)), lerp(cl.hueDeg[0], cl.hueDeg[1], q(3)) * Math.PI / 180, lerp(cl.C[0], cl.C[1], q(1) * 0.5 + r() * 0.5), 1];
    const t2 = [lerp(lim.skinL[0], lim.skinL[1], r()), lerp(lim.skinHueDeg[0], lim.skinHueDeg[1], r()) * Math.PI / 180, lerp(lim.metalL[0], lim.metalL[1], q(3)), lerp(lim.metalWarm[0], lim.metalWarm[1], r())];
    const light = cl.stencil === 'light';
    const t3 = [lerp(lim.leatherL[0], lim.leatherL[1], r()), 0, 0, 0];
    if (tier === lim.stencilsAtTier) { t3[1] = (light ? -1 : 1) * (1 + ((k * 3 + 1) % 8)); t3[2] = k % 3; t3[3] = (k + 1) % 4; }
    const vsrc = { pages: [], params: { t1, t2, t3 }, cache: null };
    for (const { s, i } of pages) {
      const names = [...lib.frames[tier].entries()].filter(([, v]) => v[0] === i);
      const n = names.length, nv = n * 4;
      const pos = new Float32Array(nv * 2), uv = new Float32Array(nv * 2), box = new Float32Array(nv * 4), shd = new Float32Array(nv * 4), body = new Float32Array(nv * 2);
      names.forEach(([, v], j) => {
        const [, x, y, w, h] = v, va = v[7] || {};
        const u0 = x / s.pw, v0 = y / s.ph, u1 = (x + w) / s.pw, v1 = (y + h) / s.ph;
        const cs = [[x, y, u0, v0], [x + w, y, u1, v0], [x + w, y + h, u1, v1], [x, y + h, u0, v1]];
        const sh = va.shield || [0, 0, -1, -1], bd = va.body || [0, 1];
        for (let c = 0; c < 4; c++) {
          const o = j * 4 + c;
          pos[o * 2] = cs[c][0]; pos[o * 2 + 1] = cs[c][1]; uv[o * 2] = cs[c][2]; uv[o * 2 + 1] = cs[c][3];
          box.set([u0, v0, u1, v1], o * 4); shd.set(sh, o * 4); body.set(bd, o * 2);
        }
      });
      const idx = new Uint32Array(n * 6);
      for (let j = 0; j < n; j++) idx.set([0, 1, 2, 0, 2, 3].map((q2) => q2 + 4 * j), j * 6);
      const geometry = new PIXI.Geometry({
        attributes: {
          aPosition: { buffer: pos, format: 'float32x2' }, aUV: { buffer: uv, format: 'float32x2' }, aBox: { buffer: box, format: 'float32x4' },
          aShield: { buffer: shd, format: 'float32x4' }, aBody: { buffer: body, format: 'float32x2' },
        },
        indexBuffer: idx,
      });
      const shader = PIXI.Shader.from({
        gl: { vertex: PAINT_VERT, fragment: PAINT_FRAG },
        resources: {
          uTexture: s,
          u: new PIXI.UniformGroup({
            uClothH: { value: lch.h * Math.PI / 180, type: 'f32' }, uClothCmin: { value: Math.max(0.04, 0.45 * lch.C), type: 'f32' },
            uT1: { value: new Float32Array(t1), type: 'vec4<f32>' }, uT2: { value: new Float32Array(t2), type: 'vec4<f32>' }, uT3: { value: new Float32Array(t3), type: 'vec4<f32>' },
            uSide: { value: new Float32Array(side), type: 'vec2<f32>' }, uSideCmin: { value: nation === 'thornwood' ? 0.02 : Math.max(0.04, 0.45 * lch.C), type: 'f32' },
            uStencilLight: { value: lim.stencilLight, type: 'f32' }, uStencilDark: { value: lim.stencilDark, type: 'f32' },
          }),
        },
      });
      const mesh = new PIXI.Mesh({ geometry, shader });
      const rt = PIXI.RenderTexture.create({ width: s.pw, height: s.ph, resolution: 1, autoGenerateMipmaps: true, scaleMode: 'linear' });
      renderer.render({ container: mesh, target: rt, clear: true, clearColor: [0, 0, 0, 0] });
      rt.source.updateMipmaps();
      vsrc.pages[i] = rt.source;
      vsrc.rts = vsrc.rts || []; vsrc.rts.push(rt);
      mesh.destroy(); geometry.destroy(); shader.destroy();
    }
    out.push(vsrc);
  }
  out.ms = performance.now() - t0;
  return out;
}

// ---------------------------------------------------------------- per look: frame textures per view and tier
/**
 * Resolves a look's poses to textures once: tex[tier][view][variant][poseId] (variants only for troops), with the
 * fallback chain for poses a layout lacks and, where a view is missing, the other view as a stand-in (flagged).
 */
function paintLookTextures(lib, key, tier, variants) {
  const L = lib.look(key);
  const out = {};
  const alias = PALIAS[L.layout] || null;
  for (const view of ['back', 'front']) {
    const have = L.views[view] ? view : L.views[view === 'back' ? 'front' : 'back'] ? (view === 'back' ? 'front' : 'back') : null;
    if (!have) continue;
    // a look's alternative frame set for this view (the Wolf Rider's front: the harness edit or the kept test)
    const sheet = L.alt && L.alt[have] ? L.alt[have][PAINT_ALT[key]] || have : have;
    const vs = variants && L.kind === 'troop' ? variants : L.clusters ? Array.from({ length: L.clusters }, (_, c) => ({ cluster: c })) : [null];
    out[view] = { standIn: have !== view && !L.oneView, view: have, sheet, v: vs.map((vsrc) => PPOSE.map((p) => {
      const tryName = (n) => {
        const nn = (alias && alias[n]) || n;
        const cl = vsrc && vsrc.cluster !== undefined;
        const name = cl ? `${L.prefix}.${sheet}.c${vsrc.cluster}.${nn}` : `${L.prefix}.${sheet}.${nn}`;
        const white = nn.endsWith('.white');
        return lib.frameTex(tier, name, white || cl ? null : vsrc);
      };
      let tx = tryName(p);
      if (!tx) for (const alt of PFALL[p] || []) { tx = tryName(alt); if (tx) break; }
      if (!tx && p !== 'dropped' && !p.endsWith('.white')) tx = tryName('stand');
      if (tx) lib.texLook.set(tx, key);
      return tx;
    })) };
  }
  return out;
}
