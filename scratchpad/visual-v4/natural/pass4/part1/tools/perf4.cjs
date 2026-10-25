// bake and frame costs on the real path (shared, noisy machine): node perf4.cjs <tag> <pagefile> [query] [w h dpr]
// bake: ready (load to the first natural frame), bake CPU / wall, the natural steps; static re-render with a pixel flush (RCK = null; draw(); getImageData) at the least zoom,
// the start view, Mid 140 px and Near 250 px (median of 5); a cached frame (a 1 px pan, flushed; median of 20); a hover frame at the start view (median of 12);
// zoom settles (the pass-3b perf sequence: wheel notches, Fit, least, Mid, max): RREB re-render ms per settle, median and max
const { launch, open, ev, mev, OUT } = require('./lib.cjs'); const fs = require('fs');
const [tag, file, q = '', w = '1440', h = '900', dpr = '1'] = process.argv.slice(2);
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, file, { log, q, w: +w, h: +h, dpr: +dpr, settle: 2500 }); await p.mouse.move(+w / 2, +h - 4);
  const t = await ev(p, 'm.reliefTimes()'), mem = await ev(p, 'm.reliefMemory()');
  const bake = { readyMs: p.__readyMs, rlReadyMs: await mev(p, 'Math.round(window.__rlReadyMs || 0)'), bakeCpu: t.bakeCpuMs, bakeWall: t.bakeWallMs, natural: t.naturalStepsMs, shared: t.sharedStepsMs, memory: mem };
  const frames = await mev(p, `(() => { const med = (a) => { const q = [...a].sort((x, y) => x - y); return +q[q.length >> 1].toFixed(2); }, out = {};
    const at = { least: () => window.__mock.setScale(minScale, 800, 500), start: () => { fit(); RCK = null; draw(); }, mid140: () => window.__mock.setScale(140 / MED_DIAM, 720, 450), near250: () => window.__mock.setScale(250 / MED_DIAM, 720, 450) };
    for (const [k, f] of Object.entries(at)) { f(); draw(); const st = []; for (let j = 0; j < 5; j++) { RCK = null; const t0 = performance.now(); draw(); ctx.getImageData(0, 0, 1, 1); st.push(performance.now() - t0); }
      const fr = []; for (let j = 0; j < 20; j++) { cam.x += j % 2 ? -1 : 1; const t0 = performance.now(); draw(); ctx.getImageData(0, 0, 1, 1); fr.push(performance.now() - t0); }
      out[k] = { Dpx: +(cam.s * MED_DIAM).toFixed(1), staticFlushMs: med(st), cachedFlushMs: med(fr) }; }
    at.start(); draw(); const pick = provList.filter((i) => { const [x, y] = toScreen(...cent[i]); return x > 200 && x < cw - 200 && y > 120 && y < ch - 120; }), hv = [];
    for (let k = 0; k < 12; k++) { hoverProv = pick[k % pick.length] ?? -1; const t0 = performance.now(); draw(); ctx.getImageData(0, 0, 1, 1); hv.push(performance.now() - t0); } hoverProv = -1; draw(); out.hoverFlushMs = med(hv); return out; })()`);
  const snap = () => mev(p, '({ n: RREB.n, ms: RREB.ms, Dpx: +(cam.s * MED_DIAM).toFixed(1) })'); const rows = [];
  const act = async (nm, f) => { await p.waitForTimeout(300); const a = await snap(); await f(); await p.waitForTimeout(900); const z = await snap(); rows.push({ nm, Dpx: z.Dpx, renders: z.n - a.n, renderMs: +(z.ms - a.ms).toFixed(1) }); await p.waitForTimeout(600); };
  const wheel = (dy, x = 700, y = 450) => async () => { await p.mouse.move(x, y); await p.mouse.wheel(0, dy); };
  await ev(p, 'm.ev("fit(); draw()")'); await p.waitForTimeout(800);
  for (let k = 0; k < 6; k++) await act('in' + (k + 1), wheel(-100)); for (let k = 0; k < 4; k++) await act('out' + (k + 1), wheel(100, 500, 300));
  await act('fit', () => ev(p, 'm.setScale(m.fitScale(), 720, 450)')); await act('least', () => ev(p, 'm.setScale(m.minScale(), 720, 450)')); await act('mid', () => ev(p, 'm.setScale(1.0, 640, 480)')); await act('max', () => ev(p, 'm.setScale(m.maxScale(), 600, 400)'));
  await p.mouse.move(+w / 2, +h - 4);
  const R = rows.filter((r) => r.renders > 0).map((r) => r.renderMs / r.renders).sort((a, b) => a - b), sum = { tag, q, view: [+w, +h, +dpr], bake, frames, settles: { n: R.length, medianMs: +R[R.length >> 1].toFixed(1), maxMs: +R[R.length - 1].toFixed(1) }, pageErrors: log.pageErrors.length };
  console.log(JSON.stringify(sum)); fs.writeFileSync(`${OUT}perf-${tag}.json`, JSON.stringify({ sum, rows }, null, 1)); await b.close(); })();
