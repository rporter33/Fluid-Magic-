// every check in window.__mock under Relief: start view, Far / Mid / Near, modes, dpr 2, other window sizes; plus the v3-only hooks (recorded, errors kept)
const { launch, open, PAGE } = require('./vlib.cjs'); const fs = require('fs');
const OUT = process.argv[2] || __dirname + '/out/checks-relief.json';
(async () => {
  const b = await launch(), errors = [], reqs = [], out = {};
  let p = await open(b, PAGE, { errors, reqs });
  const call = async (name, fn, arg) => { try { const t0 = Date.now(); const v = await p.evaluate(fn, arg); return { ok: true, ms: Date.now() - t0, v }; } catch (e) { return { ok: false, err: e.message.split('\n')[0] }; } };
  out.readyMs = p.__readyMs;
  out.start = await call('reliefChecks', () => window.__mock.reliefChecks());
  out.checksAlias = await call('checks', () => { const a = JSON.stringify(window.__mock.checks().layout), b = JSON.stringify(window.__mock.reliefLayout()); return a === b; });
  out.stableRebake = await call('stable', () => window.__mock.reliefStable(true));
  const at = (s, x, y) => ({ s, x, y });
  const bands = { far: at('min', 800, 520), midLow: at(0.7, 640, 480), mid: at(1.0, 640, 480), midHigh: at(1.6, 700, 500), near: at('max', 620, 470), nearEast: at('max', 1300, 420), nearWest: at('max', 250, 500), nearSouth: at('max', 700, 900) };
  out.bands = {};
  for (const [k, a] of Object.entries(bands)) {
    out.bands[k] = await call(k, (a) => { const m = window.__mock; m.setScale(a.s === 'min' ? m.minScale() : a.s === 'max' ? m.maxScale() * 0.9 : a.s, a.x, a.y); return { band: m.band(), scale: m.scale(), layout: m.reliefLayout(), rails: m.reliefRails(), means: m.reliefMeans(), hit: m.reliefHit(), stable: m.reliefStable(false) }; }, a);
  }
  out.maxZoom = await call('max', () => { const m = window.__mock; m.setScale(m.maxScale(), 620, 470); return { band: m.band(), layout: m.reliefLayout(), rails: m.reliefRails() }; });
  await p.evaluate(() => window.__mock.ev('fitToCloth(); RCK = null; draw()')); await p.waitForTimeout(500);
  out.modes = {};
  for (const m of ['dominion', 'supply', 'unrest', 'population', 'springs', 'ownership']) {
    await p.mouse.move(700, 120); await p.waitForTimeout(700); await p.click(`.modebtn[data-m="${m}"]`); await p.mouse.move(700, 120); await p.waitForTimeout(1200);
    out.modes[m] = await call(m, () => { const mm = window.__mock; return { mode: mm.ev('state.mode'), stable: mm.reliefStable(false), layout: mm.reliefLayout(), rails: mm.reliefRails() }; });
  }
  out.design = await call('design', () => window.__mock.reliefDesign());
  out.memory = await call('memory', () => window.__mock.reliefMemory());
  out.times = await call('times', () => window.__mock.reliefTimes());
  // the hooks written for Painted (v3), called under Relief
  out.v3hooks = {};
  for (const k of ['density', 'paintcheck', 'trackcheck', 'silhouettes', 'feats', 'info', 'sprInfo', 'reb', 'bakes'])
    out.v3hooks[k] = await call(k, (k) => { const v = window.__mock[k](); return JSON.stringify(v).slice(0, 400); }, k);
  out.perf = await call('perf', () => ({ prof: window.__mock.prof(3), perf: window.__mock.perf(3), pan: window.__mock.pan(3, 0, 5) }));
  out.panStats = await call('panStats', () => window.__mock.panStats(3, 60));
  await p.context().close();
  out.dpr2 = {};
  p = await open(b, PAGE, { errors, reqs, dpr: 2 });
  out.dpr2.start = await call('dpr2', () => ({ rails: window.__mock.reliefRails(), means: window.__mock.reliefMeans(), layout: window.__mock.reliefLayout() }));
  out.dpr2.mid = await call('dpr2mid', () => { window.__mock.setScale(1.0, 640, 480); return { rails: window.__mock.reliefRails(), layout: window.__mock.reliefLayout() }; });
  out.dpr2.near = await call('dpr2near', () => { const m = window.__mock; m.setScale(m.maxScale() * 0.9, 620, 470); return { rails: m.reliefRails(), layout: m.reliefLayout() }; });
  await p.context().close();
  out.sizes = {};
  for (const [w, h] of [[1280, 720], [1024, 768], [1920, 1080], [1366, 768]]) {
    p = await open(b, PAGE, { errors, reqs, w, h });
    out.sizes[`${w}x${h}`] = await call('size', () => ({ layout: window.__mock.reliefLayout(), rails: window.__mock.reliefRails(), means: window.__mock.reliefMeans(), hit: window.__mock.reliefHit(), stable: window.__mock.reliefStable(false) }));
    await p.context().close();
  }
  out.errors = errors; out.requestsFailed = reqs.filter((r) => / failed /.test(r));
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1)); console.log('written', OUT, 'errors', errors.length);
  await b.close();
})();
