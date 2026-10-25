// Stage B calibration, part 5 (owner note 1): troop variation without new painted sheets.
// One Pixi Mesh per block (one draw call), a custom shader that varies each figure inside its own limits:
//   - material tints, classified per pixel in OKLab from the painted colour itself (no extra atlas):
//     cloth (the side's hue window), skin, metal, leather and wood, each with its own small range;
//   - shared stencils on the side's cloth, reused by every troop type: shield faces (7 designs on the shield ellipse
//     found per frame), crest tips, belts, sashes and hems; they change only the cloth's lightness, never its hue;
//   - and per figure: scale, lean, a small place jitter, the rest frame, the motion phase and tempo.
// Columns: copy (one frame, no variation), ad (the art director's change 16: rest frame, scale, brightness, phase),
// tints (ad + material tints + lean/jitter), full (tints + stencils). window.__var drives views, time and stats.
(async function () {
  const D = JSON.parse(document.getElementById('var-data').textContent);
  const P = PIXI;
  const W = 1600, H = 900;
  const app = new P.Application();
  await app.init({ width: W, height: H, background: '#A8A784', antialias: false, preference: 'webgl', resolution: 1 });
  document.getElementById('stage').appendChild(app.canvas);
  const TEX = {};
  for (const t of ['S', 'H']) {
    const img = new Image(); img.src = D.tiers[t].page; await img.decode();
    TEX[t] = P.Texture.from(img);
    TEX[t].source.scaleMode = 'linear';
  }

  // ---------------------------------------------------------------- seeded randomness (deterministic per figure)
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const U = (r, lo, hi) => lo + (hi - lo) * r();

  // ---------------------------------------------------------------- the limits (recorded in calibration.md)
  // Cloth limits are per side and one-sided: each side's cloth only moves away from the other side's, so the protan and
  // deuteranopic contrast between the two cloths (11.9 and 23.6 CIEDE2000) does not drop (measured in calibration.md).
  const LIM = {
    cloth: { cinderHorde: { L: [0, 0.030], hueDeg: [0, 6], C: [1.0, 1.08], stencil: 'light' },
             thornwood: { L: [-0.035, 0], hueDeg: [0, 6], C: [0.92, 1.0], stencil: 'dark' } },
    skinL: [-0.07, 0.05], skinHueDeg: [-6, 6], metalL: [-0.06, 0.05], metalWarm: [-1, 1], leatherL: [-0.05, 0.05],
    bright: [0.92, 1.0], scale: [0.96, 1.04], leanDeg: [-1.5, 1.5], jitterWu: 1.2,
    stencilDark: -0.11, stencilLight: 0.07,
  };

  // ---------------------------------------------------------------- shader
  const vertex = `#version 300 es
in vec2 aPosition; in vec2 aUV; in vec4 aBox; in vec4 aShield; in vec4 aBody; in vec4 aT1; in vec4 aT2; in vec4 aT3;
out vec2 vUV; out vec2 vLocal; out vec4 vShield; out vec4 vBody; out vec4 vT1; out vec4 vT2; out vec4 vT3;
uniform mat3 uProjectionMatrix; uniform mat3 uWorldTransformMatrix; uniform mat3 uTransformMatrix;
void main() {
  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
  vUV = aUV; vLocal = (aUV - aBox.xy) / (aBox.zw - aBox.xy);
  vShield = aShield; vBody = aBody; vT1 = aT1; vT2 = aT2; vT3 = aT3;
}`;
  const fragment = `#version 300 es
precision highp float;
in vec2 vUV; in vec2 vLocal; in vec4 vShield; in vec4 vBody; in vec4 vT1; in vec4 vT2; in vec4 vT3;
uniform sampler2D uTexture;
uniform float uClothH; uniform float uClothCmin; uniform float uOn;
out vec4 finalColor;
float cbrt(float x) { return sign(x) * pow(abs(x), 1.0 / 3.0); }
vec3 s2l(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
vec3 l2s(vec3 c) { c = clamp(c, 0.0, 1.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
vec3 toLab(vec3 c) {
  float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
  float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
  float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;
  l = cbrt(l); m = cbrt(m); s = cbrt(s);
  return vec3(0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
              1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
              0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s);
}
vec3 toLin(vec3 L) {
  float l = L.x + 0.3963377774 * L.y + 0.2158037573 * L.z;
  float m = L.x - 0.1055613458 * L.y - 0.0638541728 * L.z;
  float s = L.x - 0.0894841775 * L.y - 1.2914855480 * L.z;
  l = l * l * l; m = m * m * m; s = s * s * s;
  return vec3(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
             -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
             -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
}
vec2 rot(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }
float stencilShield(float id, vec2 p) {
  float r = length(p);
  if (id < 0.5) return 0.0;
  if (id < 1.5) return step(0.70, r);                                   // rim
  if (id < 2.5) return step(0.42, r) * step(r, 0.60);                   // ring
  if (id < 3.5) return step(abs(p.x), 0.22);                             // pale (vertical band)
  if (id < 4.5) return step(abs(p.y), 0.22);                             // fess (horizontal band)
  if (id < 5.5) return step(0.0, p.x * p.y);                             // quartered
  if (id < 6.5) { float y0 = 0.15 - 0.9 * abs(p.x); return step(y0, p.y) * step(p.y, y0 + 0.36); } // chevron
  return step(0.0, p.x + p.y);                                           // per bend
}
void main() {
  vec4 t = texture(uTexture, vUV);
  if (t.a < 0.003) { finalColor = vec4(0.0); return; }
  vec3 c = t.rgb / t.a;
  if (uOn < 0.5) { finalColor = vec4(c * vT1.w, 1.0) * t.a; return; }
  vec3 lab = toLab(s2l(c));
  float C = length(lab.yz);
  float h = atan(lab.z, lab.y);
  float solid = smoothstep(0.86, 0.96, t.a);   // the side keyline (75% alpha) keeps its colour
  float dh = abs(mod(h - uClothH + 3.14159265, 6.2831853) - 3.14159265);
  float wC = solid * clamp((0.4538 - dh) / 0.1396, 0.0, 1.0) * clamp((C - uClothCmin) / 0.02, 0.0, 1.0);
  float hd = mod(degrees(h) + 360.0, 360.0);
  float warm = smoothstep(15.0, 30.0, hd) * (1.0 - smoothstep(90.0, 110.0, hd));
  float wM = solid * (1.0 - wC) * clamp((0.032 - C) / 0.012, 0.0, 1.0) * smoothstep(0.22, 0.32, lab.x);
  float chrom = clamp((C - 0.018) / 0.015, 0.0, 1.0);
  float lit = smoothstep(0.52, 0.62, lab.x);
  float wS = solid * (1.0 - wC) * (1.0 - wM) * warm * chrom * lit;
  float wL = solid * (1.0 - wC) * (1.0 - wM) * warm * chrom * (1.0 - lit);
  // cloth: lightness, hue and chroma inside the side's window; stencils change only its lightness
  vec2 ab = lab.yz;
  float st = 0.0;
  if (vShield.z > 0.0) {
    vec2 p = (vLocal - vShield.xy) / vShield.zw;
    if (length(p) < 1.0 && vT3.y != 0.0) st = stencilShield(abs(vT3.y) - 1.0, p);
  }
  float top = vBody.x, bot = vBody.y, hh = max(0.01, bot - top), fy = (vLocal.y - top) / hh;
  if (vT3.z > 0.5 && fy < 0.17) st = max(st, vT3.z < 1.5 ? step(fy, 0.07) : step(0.5, fract(vLocal.x * 7.0)));  // crest tip or stripes
  if (vT3.w > 0.5) {
    if (vT3.w < 1.5) st = max(st, step(abs(fy - 0.55), 0.03));                        // belt
    else if (vT3.w < 2.5) st = max(st, step(abs((fy - 0.30) - 0.75 * (vLocal.x - 0.35)), 0.045) * step(0.2, fy) * step(fy, 0.75)); // sash
    else st = max(st, step(0.80, fy));                                                // hem
  }
  float stShade = vT3.y < 0.0 ? ${LIM.stencilLight.toFixed(3)} : ${LIM.stencilDark.toFixed(3)};
  vec2 abC = rot(ab, vT1.y) * vT1.z;
  float LC = lab.x + vT1.x + st * stShade;
  // skin, leather and wood, metal
  vec2 abS = rot(ab, vT2.y);
  float LS = lab.x + vT2.x;
  float LM = lab.x + vT2.z;
  vec2 abM = ab + (vT2.w > 0.0 ? vec2(0.629, 0.777) * 0.012 : vec2(-0.342, -0.940) * 0.008) * abs(vT2.w);
  float LL = lab.x + vT3.x;
  float wO = 1.0 - wC - wS - wM - wL;
  vec3 o = vec3(wC * LC + wS * LS + wM * LM + wL * LL + wO * lab.x,
                wC * abC + wS * abS + wM * abM + wL * ab + wO * ab);
  vec3 rgb = l2s(toLin(o)) * vT1.w;
  finalColor = vec4(rgb, 1.0) * t.a;
}`;

  // ---------------------------------------------------------------- figures and blocks
  const FIG = {
    'cw.back': { tier: 'cw.back', nation: 'cinderHorde', view: 'back', move: 'march' },
    'cw.front': { tier: 'cw.front', nation: 'cinderHorde', view: 'front', move: 'strike' },
    'wd.front': { tier: 'wd.front', nation: 'thornwood', view: 'front', move: 'strike' },
  };
  const CLOTH = { cinderHorde: { h: 38.78, cmin: Math.max(0.04, 0.45 * 0.1543) }, thornwood: { h: 165.9, cmin: Math.max(0.04, 0.45 * 0.0845) } };
  const MODES = ['copy', 'ad', 'tints', 'full'];
  const deg = Math.PI / 180;

  function params(seed, mode, kind) {
    const r = rng(seed);
    const cl = LIM.cloth[FIG[kind].nation];
    const p = { rest: 'stand', scale: 1, bright: 1, phase: 0, tempo: 1, lean: 0, jx: 0, jy: 0,
                t1: [0, 0, 1, 1], t2: [0, 0, 0, 0], t3: [0, 0, 0, 0] };
    if (mode === 'copy') return p;
    p.rest = r() < 0.3 ? 'idle2' : 'stand';
    p.scale = U(r, ...LIM.scale); p.bright = U(r, ...LIM.bright); p.phase = r();
    p.t1[3] = p.bright;
    if (mode === 'ad') return p;
    p.tempo = U(r, 0.92, 1.08); p.lean = U(r, ...LIM.leanDeg) * deg;
    p.jx = U(r, -LIM.jitterWu, LIM.jitterWu); p.jy = U(r, -LIM.jitterWu, LIM.jitterWu);
    p.t1 = [U(r, ...cl.L), U(r, ...cl.hueDeg) * deg, U(r, ...cl.C), p.bright];
    p.t2 = [U(r, ...LIM.skinL), U(r, ...LIM.skinHueDeg) * deg, U(r, ...LIM.metalL), U(r, ...LIM.metalWarm)];
    p.t3 = [U(r, ...LIM.leatherL), 0, 0, 0];
    if (mode === 'full') {
      const light = cl.stencil === 'light';
      p.t3[1] = (light ? -1 : 1) * (1 + Math.floor(r() * 8));   // shield face design 0..7, its sign the side's shade
      p.t3[2] = r() < 0.5 ? 0 : 1 + Math.floor(r() * 2);           // crest: plain, dark tip, stripes
      p.t3[3] = Math.floor(r() * 4);                               // none, belt, sash, hem
    }
    return p;
  }

  const world = new P.Container();
  app.stage.addChild(world);
  const labels = new P.Container();
  app.stage.addChild(labels);
  const blocks = [];
  let state = { f: 28, tierOverride: null, t: 0, moving: false, layout: 'blocks', ground: '#A8A784' };

  function frameData(tier, name) { return D.tiers[tier].frames[name]; }

  function makeBlock(figKey, mode, bx, by, files, ranks, seed0, spacing) {
    const fig = FIG[figKey];
    const n = files * ranks;
    const nv = n * 4;
    const geo = new P.Geometry({
      attributes: {
        aPosition: { buffer: new Float32Array(nv * 2), format: 'float32x2' },
        aUV: { buffer: new Float32Array(nv * 2), format: 'float32x2' },
        aBox: { buffer: new Float32Array(nv * 4), format: 'float32x4' },
        aShield: { buffer: new Float32Array(nv * 4), format: 'float32x4' },
        aBody: { buffer: new Float32Array(nv * 4), format: 'float32x4' },
        aT1: { buffer: new Float32Array(nv * 4), format: 'float32x4' },
        aT2: { buffer: new Float32Array(nv * 4), format: 'float32x4' },
        aT3: { buffer: new Float32Array(nv * 4), format: 'float32x4' },
      },
      indexBuffer: new Uint32Array(Array.from({ length: n }, (_, i) => [0, 1, 2, 0, 2, 3].map((k) => k + 4 * i)).flat()),
    });
    const cl = CLOTH[fig.nation];
    const shader = P.Shader.from({
      gl: { vertex, fragment },
      resources: {
        uTexture: TEX.S.source,
        u: new P.UniformGroup({ uClothH: { value: cl.h * deg, type: 'f32' }, uClothCmin: { value: cl.cmin, type: 'f32' },
                                uOn: { value: mode === 'tints' || mode === 'full' ? 1 : 0, type: 'f32' } }),
      },
    });
    const mesh = new P.Mesh({ geometry: geo, shader });
    world.addChild(mesh);
    const figs = [];
    for (let j = 0; j < ranks; j++) for (let i = 0; i < files; i++) {
      const seed = seed0 * 1000 + j * 37 + i * 101 + 7;
      const p = params(seed, mode, figKey);
      // the near side (back view) advances up-right: its front rank is the far one (j = ranks - 1 has the largest y)
      figs.push({ i, j, x: bx + i * spacing[0] + p.jx, y: by + j * spacing[1] + p.jy, p, frontRank: fig.view === 'front' ? j === 0 : j === ranks - 1 });
    }
    const b = { figKey, fig, mode, mesh, geo, shader, figs, n, label: null };
    // static attributes
    const t1 = geo.getBuffer('aT1').data, t2 = geo.getBuffer('aT2').data, t3 = geo.getBuffer('aT3').data;
    figs.forEach((f, k) => { for (let v = 0; v < 4; v++) { t1.set(f.p.t1, (4 * k + v) * 4); t2.set(f.p.t2, (4 * k + v) * 4); t3.set(f.p.t3, (4 * k + v) * 4); } });
    ['aT1', 'aT2', 'aT3'].forEach((a) => geo.getBuffer(a).update());
    blocks.push(b);
    return b;
  }

  // ---------------------------------------------------------------- motion: which frame, and the transform, at time t
  function pose(f, fig, t, moving) {
    const p = f.p;
    if (!moving) return { name: p.rest, dx: 0, dy: 0, bob: 0 };
    const tt = t * p.tempo + p.phase * 4;
    if (fig.move === 'march') {
      const k = Math.floor(tt * 4) % 4;
      return { name: ['marchA', 'stand', 'marchB', 'stand'][k], dx: 0, dy: 0, bob: (k % 2 ? 1.5 : 0) };
    }
    if (f.frontRank) {
      const cyc = 0.13 + 0.06 + 0.15 + 0.5, u = (tt * 0.8) % cyc;
      if (u < 0.13) return { name: 'windup', dx: 0, dy: 0, bob: 0 };
      if (u < 0.19) return { name: 'strike', dx: -6, dy: -3, bob: 0 };
      if (u < 0.34) return { name: 'follow', dx: -4, dy: -2, bob: 0 };
      return { name: 'stand', dx: 0, dy: 0, bob: 0 };
    }
    return { name: (Math.floor(tt / 1.6) % 2) ? 'idle2' : p.rest, dx: 0, dy: 0, bob: 0 };
  }

  function tierFor() { return state.tierOverride || (state.f <= 48 ? 'S' : 'H'); }

  function screen(x, y, h) { return [0.866 * x + 0.5 * y, 0.321 * x - 0.557 * y - 0.766 * h]; }

  function updateBlock(b) {
    const tier = tierFor();
    const T = D.tiers[tier];
    const pxPerWu = state.f / 28;
    const k = state.f / T.manPx;
    const geo = b.geo;
    const pos = geo.getBuffer('aPosition').data, uv = geo.getBuffer('aUV').data, box = geo.getBuffer('aBox').data,
      shd = geo.getBuffer('aShield').data, body = geo.getBuffer('aBody').data;
    const order = b.figs.map((f) => {
      const ps = pose(f, b.fig, state.t, state.moving);
      const sx = screen(f.x + ps.dx, f.y + ps.dy, ps.bob);
      return { f, ps, sx };
    }).sort((a, c) => a.sx[1] - c.sx[1]);
    order.forEach(({ f, ps, sx }, q) => {
      const fd = frameData(tier, `${b.fig.tier}.${ps.name}`) || frameData(tier, `${b.fig.tier}.stand`);
      const fr = fd.frame, an = fd.anchor;
      const s = k * f.p.scale;
      const x0 = -an.x * fr.w * s, x1 = (1 - an.x) * fr.w * s, y0 = -an.y * fr.h * s, y1 = (1 - an.y) * fr.h * s;
      const c = Math.cos(f.p.lean), sn = Math.sin(f.p.lean);
      const ax = sx[0] * pxPerWu, ay = sx[1] * pxPerWu;
      const corners = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
      const u0 = fr.x / T.size[0], v0 = fr.y / T.size[1], u1 = (fr.x + fr.w) / T.size[0], v1 = (fr.y + fr.h) / T.size[1];
      const uvs = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
      const sh = fd.shield || [0, 0, -1, -1];
      for (let v = 0; v < 4; v++) {
        const [px, py] = corners[v];
        const idx = 4 * q + v;
        pos[idx * 2] = ax + c * px - sn * py; pos[idx * 2 + 1] = ay + sn * px + c * py;
        uv[idx * 2] = uvs[v][0]; uv[idx * 2 + 1] = uvs[v][1];
        box.set([u0, v0, u1, v1], idx * 4); shd.set(sh, idx * 4); body.set([fd.body[0], fd.body[1], 0, 0], idx * 4);
      }
      // the static per-figure attributes follow the draw order
      f._q = q;
    });
    // re-pack the static attributes in draw order
    const t1 = geo.getBuffer('aT1').data, t2 = geo.getBuffer('aT2').data, t3 = geo.getBuffer('aT3').data;
    order.forEach(({ f }, q) => { for (let v = 0; v < 4; v++) { t1.set(f.p.t1, (4 * q + v) * 4); t2.set(f.p.t2, (4 * q + v) * 4); t3.set(f.p.t3, (4 * q + v) * 4); } });
    ['aPosition', 'aUV', 'aBox', 'aShield', 'aBody', 'aT1', 'aT2', 'aT3'].forEach((a) => geo.getBuffer(a).update());
    b.shader.resources.uTexture = TEX[tier].source;
    b.order = order;
  }

  // ---------------------------------------------------------------- layouts
  const ROWS = ['cw.back', 'cw.front', 'wd.front'];
  const ROWNAME = { 'cw.back': 'Cinder Warrior, back view', 'cw.front': 'Cinder Warrior, front view (surcoat)', 'wd.front': 'Thornwood Warden, front view (hue-locked)' };
  const MODENAME = { copy: 'copies of one frame', ad: 'AD variation (frame, scale, brightness, phase)', tints: '+ material tints, lean, jitter', full: '+ shared stencils (full)' };

  function clear() {
    for (const b of blocks) { b.mesh.destroy(); }
    blocks.length = 0; labels.removeChildren();
  }

  function label(text, x, y) {
    const t = new P.Text({ text, style: { fontFamily: 'sans-serif', fontSize: 13, fill: '#F3EEE4' } });
    const bg = new P.Graphics().roundRect(-6, -3, t.width + 12, t.height + 6, 3).fill({ color: 0x1C1A17, alpha: 0.8 });
    const c = new P.Container(); c.addChild(bg, t); c.position.set(x, y); labels.addChild(c);
  }

  function build(layout) {
    clear(); state.layout = layout;
    if (layout === 'blocks') {
      const px = state.f / 28;
      const colW = W / 4, rowH = H / 3;
      ROWS.forEach((r, ri) => MODES.forEach((m, mi) => {
        // place the block's centre at the cell centre (screen) by inverting the projection for a point on the ground
        const cx = colW * (mi + 0.5) / px, cy = (rowH * (ri + 0.58)) / px;
        const files = 8, ranks = 4, sp = [13, 12];
        const mx = (files - 1) * sp[0] / 2, my = (ranks - 1) * sp[1] / 2;
        // solve 0.866x + 0.5y = cx, 0.321x - 0.557y = cy for the block centre
        const det = 0.866 * -0.557 - 0.5 * 0.321;
        const X = (cx * -0.557 - 0.5 * cy) / det, Y = (0.866 * cy - 0.321 * cx) / det;
        const b = makeBlock(r, m, X - mx, Y - my, files, ranks, 11 + ri * 10 + (m === 'copy' ? 0 : 1), sp);
        b.cell = [colW * mi, rowH * ri, colW, rowH];
      }));
      MODES.forEach((m, mi) => label(MODENAME[m], colW * mi + 10, 8));
      ROWS.forEach((r, ri) => label(ROWNAME[r], 10, rowH * ri + 30));
    } else if (layout === 'lineup') {
      const px = state.f / 28, n = 12, rowH = H / 12;
      ROWS.forEach((r, ri) => MODES.forEach((m, mi) => {
        const row = ri * 4 + mi;
        const cx0 = 560 / px, cy = (rowH * (row + 0.85)) / px;
        const det = 0.866 * -0.557 - 0.5 * 0.321;
        const X = (cx0 * -0.557 - 0.5 * cy) / det, Y = (0.866 * cy - 0.321 * cx0) / det;
        // one row of figures along the screen's x axis: step in world (dx, dy) with screen dy = 0
        const b = makeBlock(r, m, X, Y, n, 1, 11 + ri * 10 + (m === 'copy' ? 0 : 1), [0, 0]);
        const step = 85 / px;                         // 85 px apart on screen
        b.figs.forEach((f, k) => { const sx = k * step; const ddx = sx * 0.557 / (0.866 * 0.557 + 0.5 * 0.321), ddy = sx * 0.321 / (0.866 * 0.557 + 0.5 * 0.321); f.x = X + ddx + f.p.jx; f.y = Y + ddy + f.p.jy; });
        b.cell = [0, rowH * row, W, rowH];
        label(`${ROWNAME[r]}: ${MODENAME[m]}`, 8, rowH * row + 4);
      }));
    }
    for (const b of blocks) updateBlock(b);
  }

  function setGround(hex) { state.ground = hex; app.renderer.background.color = hex; }

  const VIEWS = {
    play: () => { state.f = 28; state.moving = false; state.tierOverride = null; build('blocks'); },
    play40: () => { state.f = 40; state.moving = false; state.tierOverride = null; build('blocks'); },
    close: () => { state.f = 72; state.moving = false; state.tierOverride = null; build('blocks'); },
    motion: () => { state.f = 48; state.moving = true; state.tierOverride = null; build('blocks'); },
    lineup: () => { state.f = 48; state.moving = false; state.tierOverride = 'H'; build('lineup'); },
  };

  app.ticker.autoStart = false; app.ticker.stop();
  function render() { for (const b of blocks) updateBlock(b); app.renderer.render(app.stage); }

  window.__var = {
    view(name, ground) { if (ground) setGround(ground); VIEWS[name](); render(); return name; },
    setTime(t) { state.t = t; render(); return t; },
    limits: LIM,
    layout() {
      const px = state.f / 28;
      return blocks.map((b) => ({ fig: b.figKey, mode: b.mode, cell: b.cell, figures: b.figs.map((f) => {
        const s = screen(f.x, f.y, 0); return { x: s[0] * px, y: s[1] * px, p: f.p };
      }) }));
    },
    perf(frames = 120) {
      state.moving = true; const t0 = performance.now();
      for (let i = 0; i < frames; i++) { state.t += 1 / 60; render(); }
      app.renderer.gl && app.renderer.gl.finish();
      return { figures: blocks.reduce((a, b) => a + b.n, 0), drawCalls: blocks.length, msPerFrame: (performance.now() - t0) / frames };
    },
    ready: true,
  };
  VIEWS.play(); render();
})().catch((e) => { document.title = 'ERROR ' + e; console.error(e); window.__varError = String(e && e.stack || e); });
