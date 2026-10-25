// node hitch.cjs <build...> : what a player feels on zoom and pan: wall time of a zoom change (m.setScale -> draw) and of a pan that leaves the cached frame, interleaved
const { launch, open, ev, mev, ME } = require('./lib.cjs'); const fs = require('fs');
(async () => { const b = await launch(); const pages = {}; const out = {};
  for (const build of process.argv.slice(2)) { const log = { pageErrors: [], console: [] }; pages[build] = await open(b, build, { log }); await pages[build].mouse.move(720, 896); out[build] = { zoom: [], pan: [] }; }
  const zooms = [[1.0, 640, 480], [1.142, 700, 560], ['m.maxScale() * 0.55', 560, 230], [0.75, 800, 500], ['m.maxScale() * 0.6', 900, 560], ['m.minScale()', 800, 500]];
  for (let rep = 0; rep < 2; rep++) for (const [s, x, y] of zooms) for (const build of Object.keys(pages)) { const p = pages[build];
    const ms = await ev(p, `(() => { const t = performance.now(); m.setScale(${s}, ${x}, ${y}); return performance.now() - t; })()`); await p.waitForTimeout(700);
    const pan = await mev(p, `(() => { const t = performance.now(); cam.x += 900; clampCam(); draw(); return performance.now() - t; })()`); await p.waitForTimeout(400);
    out[build].zoom.push(Math.round(ms)); out[build].pan.push(Math.round(pan)); }
  for (const [k, v] of Object.entries(out)) { const med = (a) => [...a].sort((x, y) => x - y)[a.length >> 1]; console.log(k, 'zoom ms', JSON.stringify(v.zoom), 'median', med(v.zoom), 'max', Math.max(...v.zoom), '| pan ms', JSON.stringify(v.pan), 'median', med(v.pan), 'max', Math.max(...v.pan)); }
  fs.writeFileSync(ME + 'out/hitch.json', JSON.stringify(out, null, 1)); await b.close(); })();
