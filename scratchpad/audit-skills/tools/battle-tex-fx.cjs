// Battle mockup snapshot: texture sizes and GPU memory, and an effects-layer micro-benchmark for stage D.
//   node battle-tex-fx.cjs <out.json> [--w 1920 --h 1080 --dpr 1 --touch 0]
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const SNAP = path.join(__dirname, '..', 'snap', 'battle-mockup.html');
const PIXI = '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js';
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--js-flags=--expose-gc'] });
  const touch = opt('touch', '0') === '1';
  const ctx = await browser.newContext({ viewport: { width: +opt('w', 1920), height: +opt('h', 1080) }, deviceScaleFactor: +opt('dpr', 1), hasTouch: touch, isMobile: touch });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.route('https://cdn.jsdelivr.net/npm/pixi.js@8.22.0/dist/pixi.min.js', (r) => r.fulfill({ path: PIXI, contentType: 'application/javascript' }));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto('file://' + SNAP, { waitUntil: 'load', timeout: 180000 });
  await page.evaluate(() => window.__battle.ready);
  await page.evaluate(() => { const G = window.__battle.game; G.loop = () => {}; });
  const res = { errors };
  res.tex = await page.evaluate(async () => {
    const G = window.__battle.game; const out = {};
    for (const k of ['a', 'b', 'c']) {
      G.load(k); await new Promise((r) => setTimeout(r, 50)); // let tier H bake (setTimeout 0)
      const R = G.app.renderer, gl = R.gl, st = G.stage;
      const srcs = (R.texture.managedTextures || []).filter(Boolean);
      let bytes = 0, maxW = 0, maxH = 0; const big = [];
      for (const s of srcs) { const b = s.pixelWidth * s.pixelHeight * 4 * (s.autoGenerateMipmaps ? 1.333 : 1); bytes += b; maxW = Math.max(maxW, s.pixelWidth); maxH = Math.max(maxH, s.pixelHeight); if (s.pixelWidth > 2048 || s.pixelHeight > 2048) big.push([s.pixelWidth, s.pixelHeight, s.label || s.resource && s.resource.constructor && s.resource.constructor.name]); }
      out[k] = { managed: srcs.length, estMiB: +(bytes / 1048576).toFixed(1), maxW, maxH, over2048: big, ground: [st.ground.texture.source.pixelWidth, st.ground.texture.source.pixelHeight], maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE), maxTextureUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS), resolution: R.resolution, paintTier: st.paint ? st.paint.tier : null };
    }
    out.paintPages = PAINTLIB ? Object.fromEntries(['S', 'H'].map((t) => [t, PAINTLIB.src[t].map((s) => s.pixelWidth + 'x' + s.pixelHeight + ' ' + s.pkind)])) : null;
    return out;
  });
  // the effects micro-benchmark: N additive dots moving each frame, three ways (all on the battle's own app, the battle hidden)
  res.fx = await page.evaluate(async () => {
    const G = window.__battle.game, app = G.app, R = app.renderer, gl = R.gl, px = new Uint8Array(4);
    G.load('a'); G.stage.stage.visible = false;
    const tex = G.stage.texDot;
    const run = (N, mode, frames) => {
      const root = new PIXI.Container(); app.stage.addChild(root);
      let upd;
      if (mode === 'sprites') {
        const c = new PIXI.Container(); c.blendMode = 'add'; root.addChild(c); const arr = [];
        for (let i = 0; i < N; i++) { const s = new PIXI.Sprite(tex); s.anchor.set(0.5); c.addChild(s); arr.push(s); }
        upd = (t) => { for (let i = 0; i < N; i++) { const s = arr[i]; s.position.set(960 + Math.cos(i + t) * (i % 400), 540 + Math.sin(i * 1.3 + t) * (i % 300)); s.scale.set(0.3 + (i % 7) * 0.05); s.tint = i & 1 ? 0xff8a20 : 0xffd060; s.alpha = 0.5 + 0.5 * Math.sin(t + i); } };
      } else if (mode === 'particles') {
        const c = new PIXI.ParticleContainer({ dynamicProperties: { position: true, vertex: true, color: true, rotation: false, uvs: false } }); c.blendMode = 'add'; root.addChild(c); const arr = [];
        for (let i = 0; i < N; i++) { const p = new PIXI.Particle({ texture: tex, anchorX: 0.5, anchorY: 0.5 }); c.addParticle(p); arr.push(p); }
        upd = (t) => { for (let i = 0; i < N; i++) { const p = arr[i]; p.x = 960 + Math.cos(i + t) * (i % 400); p.y = 540 + Math.sin(i * 1.3 + t) * (i % 300); p.scaleX = p.scaleY = 0.3 + (i % 7) * 0.05; p.tint = i & 1 ? 0xff8a20 : 0xffd060; p.alpha = 0.5 + 0.5 * Math.sin(t + i); } c.update(); };
      } else {
        const g = new PIXI.Graphics(); g.blendMode = 'add'; root.addChild(g);
        upd = (t) => { g.clear(); for (let i = 0; i < N; i++) g.circle(960 + Math.cos(i + t) * (i % 400), 540 + Math.sin(i * 1.3 + t) * (i % 300), 1.2 + (i % 7) * 0.2).fill({ color: i & 1 ? 0xff8a20 : 0xffd060, alpha: 0.5 + 0.5 * Math.sin(t + i) }); };
      }
      const rows = [];
      for (let f = 0; f < frames + 5; f++) {
        const t = f / 60; const a0 = performance.now(); upd(t); const a1 = performance.now(); R.render(app.stage); const a2 = performance.now(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        if (f >= 5) rows.push([a1 - a0, a2 - a1]);
      }
      root.destroy({ children: true });
      const med = (j) => { const s = rows.map((r) => r[j]).sort((x, y) => x - y); return +s[s.length >> 1].toFixed(2); };
      return { N, mode, updateMs: med(0), renderCpuMs: med(1), totalMs: +(med(0) + med(1)).toFixed(2) };
    };
    const out = [];
    for (const N of [300, 1000, 3000]) for (const mode of ['sprites', 'particles', 'graphics']) { out.push(run(N, mode, 40)); await new Promise((r) => setTimeout(r, 0)); }
    G.stage.stage.visible = true;
    return out;
  });
  fs.writeFileSync(a[0], JSON.stringify(res, null, 1));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
