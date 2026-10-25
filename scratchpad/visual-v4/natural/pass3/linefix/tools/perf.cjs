// the line solver's cost, this page against the page before the line pass, interleaved (shared machine): node perf.cjs <natural|clear> [dpr]
// cold: a full static render with the line cache emptied; warm: the same render again; hover: the first live frame for each of 12 provinces (cache emptied first)
const { launch, open, ev, mev, PAGE, BEFORE } = require('./lib.cjs');
const look = process.argv[2] || 'clear', dpr = Number(process.argv[3] || 1);
(async () => {
  const b = await launch(), pages = {};
  for (const [nm, f] of [['now', PAGE], ['before', BEFORE]]) { pages[nm] = await open(b, f, { dpr, settle: 1500, q: look === 'clear' ? '?terrain=clear' : '' }); await pages[nm].mouse.move(720, 895); }
  const res = { now: [], before: [] };
  for (let rep = 0; rep < 5; rep++) for (const nm of ['now', 'before']) {
    const p = pages[nm];
    for (const [v, src] of [['start', 'm.ev("fit(); draw()")'], ['mid', 'm.setScale(1.0, 640, 480)'], ['near', 'm.setScale(m.maxScale() * 0.8, 1180, 300)']]) {
      await ev(p, src); await p.waitForTimeout(300);
      const r = await mev(p, `(() => { const t = () => performance.now(); RL_LINES.cache.clear(); RCK = null; let t0 = t(); draw(); const cold = t() - t0; RCK = null; t0 = t(); draw(); const warm = t() - t0;
        const list = provList.filter((i) => !isWild(i)).filter((i) => { const [x, y] = toScreen(...cent[i]), v = viewRect(); return x > v.l && x < v.r && y > v.t && y < v.b; }).slice(0, 12); RL_LINES.cache.clear(); RCK = null; draw();
        let hov = 0; for (const i of list) { hoverProv = i; t0 = t(); draw(); hov += t() - t0; } hoverProv = -1; draw(); return { cold: +cold.toFixed(1), warm: +warm.toFixed(1), hover: +(hov / Math.max(1, list.length)).toFixed(1) }; })()`);
      res[nm].push({ v, ...r });
    }
  }
  const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
  for (const v of ['start', 'mid', 'near']) { const row = {}; for (const nm of ['now', 'before']) { const R = res[nm].filter((r) => r.v === v); row[nm] = { cold: med(R.map((r) => r.cold)), warm: med(R.map((r) => r.warm)), hover: med(R.map((r) => r.hover)) }; } console.log(look, 'dpr' + dpr, v, JSON.stringify(row)); }
  await b.close();
})();
