// Read-only audit harness for the battle mockup (a snapshot copy). Usage:
//   node battle-prof.cjs <out.json> [--w 1920 --h 1080 --dpr 1 --touch 0] [--frames 300]
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const SNAP = path.join(__dirname, '..', 'snap', 'battle-mockup.html');
const PIXI = '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js';
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const OUT = a[0];
let RESG = null;
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--enable-precise-memory-info', '--js-flags=--expose-gc'] });
  const touch = opt('touch', '0') === '1';
  const ctx = await browser.newContext({ viewport: { width: +opt('w', 1920), height: +opt('h', 1080) }, deviceScaleFactor: +opt('dpr', 1), hasTouch: touch, isMobile: touch });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.route('https://cdn.jsdelivr.net/npm/pixi.js@8.22.0/dist/pixi.min.js', (r) => r.fulfill({ path: PIXI, contentType: 'application/javascript' }));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto('file://' + SNAP, { waitUntil: 'load', timeout: 180000 });
  await page.evaluate(() => window.__battle.ready);
  // stop the page's own rAF loop so only our frames run
  await page.evaluate(() => { window.__idle = []; const G = window.__battle.game; G._loop = G.loop; G.loop = () => {}; });
  const cdp = await ctx.newCDPSession(page);
  const frames = +opt('frames', 300);
  const res = { viewport: opt('w', 1920) + 'x' + opt('h', 1080) + '@' + opt('dpr', 1) + (touch ? ' touch' : ''), runs: [], errors };
  RESG = res;

  // in-page helper: run N frames from a story time, timing the phases and counting GL calls
  await page.evaluate(() => {
    const G = window.__battle.game;
    window.__run = (key, painted, n, from, speed) => {
      G.setFigures(painted ? 'painted' : 'procedural');
      G.load(key); G.playing = false; G.speed = speed;
      const gl = G.app.renderer.gl;
      const cnt = { draw: 0, tex: 0, prog: 0, fbo: 0, buf: 0 };
      if (!gl.__wrapped) {
        gl.__wrapped = true;
        for (const [fn, k] of [['drawElements', 'draw'], ['drawArrays', 'draw'], ['bindTexture', 'tex'], ['useProgram', 'prog'], ['bindFramebuffer', 'fbo'], ['bufferSubData', 'buf'], ['bufferData', 'buf']]) {
          const o = gl[fn].bind(gl); gl[fn] = (...x) => { if (window.__cnt) window.__cnt[k]++; return o(...x); };
        }
      }
      const st = G.stage;
      const T = st.T;
      // phase timers on the stage's methods
      const P = Object.getPrototypeOf(st), acc = {};
      const names = ['paintSprite', 'updateGenBanners', 'updateBig', 'seeThroughPass', 'updateDecals', 'drawGroundFx', 'drawSpells', 'drawGlyphs'];
      const orig = {};
      for (const m of names) { orig[m] = P[m]; acc[m] = 0; P[m] = function (...x) { const a0 = performance.now(); const r = orig[m].apply(this, x); acc[m] += performance.now() - a0; return r; }; }
      const hudU = G.hud.update.bind(G.hud);
      const rows = [], gl0 = [], px1 = new Uint8Array(4);
      let t = from;
      for (let i = 0; i < n + 10; i++) {
        t = Math.min(T.duration, t + (1 / 60) * speed * storyRate(T, t, speed));
        window.__cnt = { draw: 0, tex: 0, prog: 0, fbo: 0, buf: 0 };
        const a0 = performance.now();
        G.applyCamera(t);
        st.frame(t, speed, G.view);
        const a1 = performance.now();
        hudU(t);
        const a2 = performance.now();
        G.app.renderer.render(G.app.stage);
        const a3 = performance.now();
        const c0 = window.__cnt; window.__cnt = null;
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px1); // untimed GPU sync (SwiftShader), as the page's measure()
        if (i >= 10) { rows.push([a1 - a0, a2 - a1, a3 - a2]); gl0.push(c0); }
        if (i === 9) for (const m of names) acc[m] = 0;
      }
      window.__cnt = null;
      for (const m of names) P[m] = orig[m];
      const pct = (arr, q) => { const s = [...arr].sort((x, y) => x - y); return +s[Math.min(s.length - 1, Math.floor(q * s.length))].toFixed(2); };
      const col = (j) => rows.map((r) => r[j]);
      const sumR = rows.map((r) => r[0] + r[1] + r[2]);
      const avg = (k) => +(gl0.reduce((s, c) => s + c[k], 0) / gl0.length).toFixed(1);
      const mx = (k) => Math.max(...gl0.map((c) => c[k]));
      // texture sources visible this frame under world
      const srcs = new Set(); let sprites = 0, gfx = 0, meshes = 0, filtered = 0;
      st.world.children.forEach(function walk(o) { if (!o.visible) return; if (o.filters && o.filters.length) filtered++; if (o.texture && o.texture.source) { srcs.add(o.texture.source.uid); sprites++; } if (o.context) gfx++; if (o.geometry && !o.texture) meshes++; (o.children || []).forEach(walk); });
      return {
        key, painted, speed, frames: rows.length, storyFrom: from, storyTo: +t.toFixed(2), figures: T.F.length, bigs: st.bigs.length,
        stageP50: pct(col(0), 0.5), stageP95: pct(col(0), 0.95), hudP50: pct(col(1), 0.5), hudP95: pct(col(1), 0.95), renderP50: pct(col(2), 0.5), renderP95: pct(col(2), 0.95),
        cpuP50: pct(sumR, 0.5), cpuP95: pct(sumR, 0.95), cpuMax: +Math.max(...sumR).toFixed(2),
        methodsMsPerFrame: Object.fromEntries(names.map((m) => [m, +(acc[m] / rows.length).toFixed(3)])),
        gl: { drawAvg: avg('draw'), drawMax: mx('draw'), texBindAvg: avg('tex'), progAvg: avg('prog'), fboAvg: avg('fbo'), bufUploadsAvg: avg('buf') },
        lastFrame: { textureSources: srcs.size, sprites, graphics: gfx, filteredNodes: filtered, standInFilters: st.standInFilters || 0, decals: T.decals.length, bursts: T.bursts.length, projectiles: T.projectiles.length, spellFx: T.spellFx.length },
      };
    };
  });
  const scenes = [];
  for (const key of ['a', 'b', 'c']) {
    const m = await page.evaluate((k) => { const G = window.__battle.game; G.load(k); return G.moments(); }, key);
    scenes.push({ key, from: Math.max(3, (m.clash || 10) - 1), m });
  }
  res.moments = scenes;
  for (const sc of scenes) for (const painted of [true, false]) for (const speed of [1, 4]) {
    await page.evaluate(() => window.gc && window.gc());
    const r = await page.evaluate(([k, p, n, f, s]) => window.__run(k, p, n, f, s), [sc.key, painted, frames, sc.from, speed]);
    res.runs.push(r);
    process.stderr.write(JSON.stringify([r.key, r.painted, r.speed, r.cpuP50, r.cpuP95, r.gl.drawAvg]) + '\n');
    fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
  }
  // CPU profile and heap sampling over one representative run (painted, battle a, 1x, from clash)
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 100 });
  await cdp.send('HeapProfiler.enable');
  const prof = {};
  for (const key of ['a', 'c']) {
    const sc = scenes.find((s) => s.key === key);
    await page.evaluate(() => window.gc && window.gc());
    await page.evaluate(([k]) => { const G = window.__battle.game; G.setFigures('painted'); G.load(k); }, [key]);
    await cdp.send('HeapProfiler.startSampling', { samplingInterval: 512, includeObjectsCollectedByMajorGC: true, includeObjectsCollectedByMinorGC: true });
    await cdp.send('Profiler.start');
    const heap0 = await page.evaluate(() => performance.memory.usedJSHeapSize);
    await page.evaluate(([k, n, f]) => window.__run(k, true, n, f, 1), [key, frames, sc.from]);
    const { profile } = await cdp.send('Profiler.stop');
    const { profile: hp } = await cdp.send('HeapProfiler.stopSampling');
    // self time by function
    const byId = new Map(profile.nodes.map((n) => [n.id, n]));
    const self = new Map();
    const dt = profile.timeDeltas; let total = 0;
    for (let i = 0; i < profile.samples.length; i++) {
      const n = byId.get(profile.samples[i]); const d = dt[i] || 0; total += d;
      const cf = n.callFrame; const file = cf.url.split('/').pop();
      const k = (cf.functionName || '(anon)') + ' @' + (file.includes('pixi') ? 'pixi' : file.slice(0, 20)) + ':' + (cf.lineNumber + 1);
      self.set(k, (self.get(k) || 0) + d);
    }
    const top = [...self.entries()].sort((x, y) => y[1] - x[1]).slice(0, 45).map(([k, v]) => [k, +(v / 1000).toFixed(1), +(100 * v / total).toFixed(1)]);
    // allocations by function (bytes over the run)
    const alloc = new Map(); let allocTotal = 0;
    (function walk(n) { const cf = n.callFrame; const file = cf.url.split('/').pop(); const k = (cf.functionName || '(anon)') + ' @' + (file.includes('pixi') ? 'pixi' : file.slice(0, 20)) + ':' + (cf.lineNumber + 1); alloc.set(k, (alloc.get(k) || 0) + n.selfSize); allocTotal += n.selfSize; (n.children || []).forEach(walk); })(hp.head);
    const topA = [...alloc.entries()].sort((x, y) => y[1] - x[1]).slice(0, 35).map(([k, v]) => [k, +(v / 1024).toFixed(0) + ' KiB', +(v / (frames + 10) / 1024).toFixed(2) + ' KiB/frame']);
    prof[key] = { totalMs: +(total / 1000).toFixed(0), selfTop: top, allocTotalKiB: +(allocTotal / 1024).toFixed(0), allocPerFrameKiB: +(allocTotal / (frames + 10) / 1024).toFixed(1), allocTop: topA };
  }
  res.profile = prof; fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
  // picking cost: Pixi's own hit test (the stage is 'passive' by default) and the mockup's pick, at a busy point
  res.picking = await page.evaluate(async () => {
    const G = window.__battle.game; G.setFigures('painted'); G.load('a');
    const m = G.moments(); const t = m.clash + 1.5; G.seek(t); G.render(t);
    const pts = []; for (const Gr of G.stage.T.G) { const h = G.stage.hull(Gr, t); if (h) { const w = G.stage.world; pts.push([w.position.x + h.X * w.scale.x, w.position.y + h.Y * w.scale.y]); } }
    const ev = G.app.renderer.events, rb = ev.rootBoundary; rb.rootTarget = G.app.stage;
    const N = 200; let a0 = performance.now();
    for (let i = 0; i < N; i++) { const p = pts[i % pts.length]; rb.hitTest(p[0], p[1]); }
    const pixiHit = (performance.now() - a0) / N;
    a0 = performance.now();
    for (let i = 0; i < N; i++) { const p = pts[i % pts.length]; G.pick(p[0], p[1]); }
    const ownPick = (performance.now() - a0) / N;
    // a real pointermove on the canvas: the whole handler chain (Pixi's document listener and the page's window listeners)
    const cv = G.app.canvas; a0 = performance.now();
    for (let i = 0; i < N; i++) { const p = pts[i % pts.length]; cv.dispatchEvent(new PointerEvent('pointermove', { clientX: p[0], clientY: p[1], bubbles: true, pointerType: 'mouse', pointerId: 1 })); }
    const moveChain = (performance.now() - a0) / N;
    let nodes = 0; (function walk(o) { nodes++; (o.children || []).forEach(walk); })(G.app.stage);
    return { points: pts.length, sceneNodes: nodes, stageEventMode: G.app.stage.eventMode, pixiHitTestMs: +pixiHit.toFixed(3), pagePickMs: +ownPick.toFixed(3), pointermoveChainMs: +moveChain.toFixed(3), eventFeatures: ev.features };
  });
  fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
  // paused cost: the page's loop renders every rAF even when paused (restore the loop and sample rAF work)
  res.paused = await page.evaluate(async () => {
    const G = window.__battle.game; G.loop = G._loop; G.playing = false;
    const times = []; const r0 = G.render.bind(G);
    G.render = (t) => { const a0 = performance.now(); r0(t); times.push(performance.now() - a0); };
    await new Promise((ok) => setTimeout(ok, 2000));
    G.render = r0;
    const s = times.slice().sort((x, y) => x - y);
    return { framesRenderedIn2sWhilePaused: times.length, p50: +(s[s.length >> 1] || 0).toFixed(2) };
  });
  fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
  await browser.close();
})().catch((e) => { console.error(e); if (RESG) { RESG.fatal = String(e && e.message || e); fs.writeFileSync(OUT, JSON.stringify(RESG, null, 1)); } process.exit(1); });
