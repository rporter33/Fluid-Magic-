// Battle snapshot follow-ups: per-frame allocations with the load excluded, late-battle decal experiments,
// the cost of the per-frame Graphics layers, paused rendering, and Pixi's pointermove walk with eventMode 'none'.
//   node battle-followup.cjs <out.json>
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const SNAP = path.join(__dirname, '..', 'snap', 'battle-mockup.html');
const PIXI = '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js';
const OUT = process.argv[2]; let RESG = null;
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--enable-precise-memory-info', '--js-flags=--expose-gc'] });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.route('https://cdn.jsdelivr.net/npm/pixi.js@8.22.0/dist/pixi.min.js', (r) => r.fulfill({ path: PIXI, contentType: 'application/javascript' }));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto('file://' + SNAP, { waitUntil: 'load', timeout: 180000 });
  await page.evaluate(() => window.__battle.ready);
  const res = { errors }; RESG = res;
  // paused rendering: the page's own loop, paused, for 2 s
  res.paused = await page.evaluate(async () => {
    const G = window.__battle.game; G.load('a'); G.playing = false;
    const times = []; const r0 = G.render.bind(G);
    G.render = (t) => { const a0 = performance.now(); r0(t); times.push(performance.now() - a0); };
    await new Promise((ok) => setTimeout(ok, 2000));
    G.render = r0;
    const s = times.slice().sort((x, y) => x - y);
    return { rendersIn2sPaused: times.length, cpuMsP50: +(s[s.length >> 1] || 0).toFixed(2), note: 'stage.frame + hud.update + renderer.render each rAF while nothing changes' };
  });
  await page.evaluate(() => { const G = window.__battle.game; G.loop = () => {}; });
  await page.waitForTimeout(100);
  // helpers: run frames on the loaded stage only
  await page.evaluate(() => {
    const G = window.__battle.game;
    window.__frames = (n, from, speed, opts = {}) => {
      const st = G.stage, T = st.T, gl = G.app.renderer.gl, px = new Uint8Array(4), rows = [];
      let t = from;
      for (let i = 0; i < n + 5; i++) {
        if (!opts.hold) t = Math.min(T.duration, t + (1 / 60) * speed * storyRate(T, t, speed));
        const a0 = performance.now(); G.applyCamera(t); st.frame(t, speed, G.view); G.hud.update(t); const a1 = performance.now();
        G.app.renderer.render(G.app.stage); const a2 = performance.now();
        if (opts.sync !== false) gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        if (i >= 5) rows.push([a1 - a0, a2 - a1]);
      }
      const med = (j) => { const s = rows.map((r) => r[j]).sort((x, y) => x - y); return +s[s.length >> 1].toFixed(2); };
      const p95 = (j) => { const s = rows.map((r) => r[j] + (j === 2 ? 0 : 0)).sort((x, y) => x - y); return +s[Math.floor(s.length * 0.95)].toFixed(2); };
      return { updateP50: med(0), renderP50: med(1), updateP95: p95(0), renderP95: p95(1), t: +t.toFixed(2) };
    };
  });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('HeapProfiler.enable'); await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 100 });
  // per-frame allocations and CPU self time, load excluded (painted, battle a, from the clash, 300 frames at 1x)
  const from = await page.evaluate(() => { const G = window.__battle.game; G.setFigures('painted'); G.load('a'); G.playing = false; const m = G.moments(); return m.clash - 1; });
  await page.evaluate((f) => window.__frames(30, f, 1), from); // warm
  await page.evaluate(() => window.gc && window.gc());
  const h0 = await page.evaluate(() => performance.memory.usedJSHeapSize);
  await cdp.send('HeapProfiler.startSampling', { samplingInterval: 256, includeObjectsCollectedByMajorGC: true, includeObjectsCollectedByMinorGC: true });
  await cdp.send('Profiler.start');
  const N = 300;
  const fr = await page.evaluate(([f, n]) => window.__frames(n, f, 1), [from, N]);
  const { profile } = await cdp.send('Profiler.stop');
  const { profile: hp } = await cdp.send('HeapProfiler.stopSampling');
  const tag = (cf) => { const file = cf.url.split('/').pop(); return (cf.functionName || '(anon)') + ' @' + (file.includes('pixi') ? 'pixi' : file ? 'page' : 'native') + ':' + (cf.lineNumber + 1); };
  { // self time excluding the GPU sync and idle
    const byId = new Map(profile.nodes.map((n) => [n.id, n])); const self = new Map(); let total = 0;
    for (let i = 0; i < profile.samples.length; i++) { const n = byId.get(profile.samples[i]); const d = profile.timeDeltas[i] || 0; const k = tag(n.callFrame); if (/readPixels|\(idle\)|\(program\)/.test(k)) continue; total += d; self.set(k, (self.get(k) || 0) + d); }
    // attribute pixi Graphics building (pixi.min.js line 348) separately
    let gfx = 0; for (const [k, v] of self) if (/@pixi:348$/.test(k)) gfx += v;
    res.cpuNoSync = { frames: N, cpuMsPerFrame: +(total / 1000 / (N + 5)).toFixed(2), pixiGraphicsModuleMsPerFrame: +(gfx / 1000 / (N + 5)).toFixed(2), gcMsPerFrame: +((self.get('(garbage collector) @native:0') || 0) / 1000 / (N + 5)).toFixed(2),
      top: [...self.entries()].sort((x, y) => y[1] - x[1]).slice(0, 30).map(([k, v]) => [k, +(v / 1000 / (N + 5)).toFixed(3), +(100 * v / total).toFixed(1)]) };
  }
  { const alloc = new Map(); let tot = 0; (function walk(n) { const k = tag(n.callFrame); alloc.set(k, (alloc.get(k) || 0) + n.selfSize); tot += n.selfSize; (n.children || []).forEach(walk); })(hp.head);
    let gfx = 0; for (const [k, v] of alloc) if (/@pixi:348$/.test(k)) gfx += v;
    res.alloc = { frames: N + 5, kibPerFrame: +(tot / 1024 / (N + 5)).toFixed(1), pixiGraphicsKibPerFrame: +(gfx / 1024 / (N + 5)).toFixed(1), top: [...alloc.entries()].sort((x, y) => y[1] - x[1]).slice(0, 30).map(([k, v]) => [k, +(v / 1024 / (N + 5)).toFixed(2)]) }; }
  res.framesAtClash = fr;
  fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
  // the per-frame Graphics layers: the same frames with drawGroundFx and drawGlyphs as no-ops (what moving them to sprites would save at most)
  res.graphicsLayers = await page.evaluate((f) => {
    const G = window.__battle.game, st = G.stage, P = Object.getPrototypeOf(st);
    const base = window.__frames(150, f, 1);
    const o1 = P.drawGroundFx, o2 = P.drawGlyphs;
    P.drawGroundFx = function () { this.groundFx.clear(); }; P.drawGlyphs = function () { this.glyphG.clear(); };
    const off = window.__frames(150, f, 1);
    P.drawGroundFx = o1; P.drawGlyphs = o2;
    return { base, groundFxAndGlyphsOff: off };
  }, from);
  fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
  // late battle: every body and pool on the field; then the decal layer cached as a texture, and as a render group
  res.late = await page.evaluate(() => {
    const G = window.__battle.game; G.load('a'); G.playing = false; const st = G.stage, T = st.T;
    const t = T.resultAt - 1.5; G.follow = true;
    const vis = () => st.decalSprites.filter((s) => s.visible).length + st.dropDecals.filter((s) => s.visible).length;
    const base = window.__frames(90, t, 1, { hold: true }); const shown = vis();
    st.decalLayer.cacheAsTexture(true); window.__frames(3, t, 1, { hold: true });
    const cached = window.__frames(90, t, 1, { hold: true });
    st.decalLayer.cacheAsTexture(false);
    st.decalLayer.enableRenderGroup();
    const group = window.__frames(90, t, 1, { hold: true });
    st.decalLayer.disableRenderGroup();
    return { storyT: +t.toFixed(1), decalsVisible: shown, decalsTotal: T.decals.length, baseline: base, decalLayerCacheAsTexture: cached, decalLayerRenderGroup: group, note: 'camera held at one story time (hold), so only the render cost differs' };
  });
  fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
  // Pixi's pointermove handling: the stage passive (default) and with eventMode 'none'
  res.events = await page.evaluate(() => {
    const G = window.__battle.game; G.load('a'); const t = G.moments().clash + 1.5; G.seek(t); G.render(t);
    const cv = G.app.canvas, N = 300, pts = [];
    for (const Gr of G.stage.T.G) { const h = G.stage.hull(Gr, t); if (h) { const w = G.stage.world; pts.push([w.position.x + h.X * w.scale.x, w.position.y + h.Y * w.scale.y]); } }
    const time = () => { const a0 = performance.now(); for (let i = 0; i < N; i++) { const p = pts[i % pts.length]; cv.dispatchEvent(new PointerEvent('pointermove', { clientX: p[0], clientY: p[1], bubbles: true, pointerType: 'mouse', pointerId: 1 })); } return +((performance.now() - a0) / N).toFixed(3); };
    const passive = time();
    G.app.stage.eventMode = 'none'; const none = time(); G.app.stage.eventMode = 'passive';
    const ev = G.app.renderer.events; const f0 = { ...ev.features }; ev.features.move = false; ev.features.globalMove = false; const noMove = time(); Object.assign(ev.features, f0);
    let nodes = 0; (function walk(o) { nodes++; (o.children || []).forEach(walk); })(G.app.stage);
    return { sceneNodes: nodes, pointermoveChainMs: { stagePassive: passive, stageEventModeNone: none, eventFeaturesMoveOff: noMove } };
  });
  fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
  await browser.close();
})().catch((e) => { console.error(e); if (RESG) { RESG.fatal = String(e && e.message || e); fs.writeFileSync(OUT, JSON.stringify(RESG, null, 1)); } process.exit(1); });
