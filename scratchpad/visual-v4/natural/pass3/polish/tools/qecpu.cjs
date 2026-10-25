// CPU profile of the wild edge decision (CDP Profiler), self time by function: node qecpu.cjs [scaleDpx] [warm]
const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
const Dpx = Number(process.argv[2] || 420), warm = process.argv[3] === 'warm';
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, process.env.PAGEFILE || PAGE, { log, settle: 1500 }); await p.mouse.move(720, 895);
  const wc = await mev(p, '(() => { const w = WILDS[0]; let x = 0, y = 0; for (const c of w.cells) { x += cent[c][0]; y += cent[c][1]; } return [x / w.cells.length, y / w.cells.length]; })()');
  await ev(p, `m.setScale(${Dpx} / m.ev('MED_DIAM'), ${wc[0]}, ${wc[1]})`);
  const cdp = await p.context().newCDPSession(p); await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 100 }); await cdp.send('Profiler.start');
  const t = await mev(p, `(() => { let tot = 0; for (let k = 0; k < 4; k++) { if (!${warm}) { RL_QE.memo = null; } RL_WRIM.lru.clear(); RL_WRIM.key = ''; const t0 = performance.now(); rlQuietEdgeMap(); tot += performance.now() - t0; } return tot / 4; })()`);
  const { profile } = await cdp.send('Profiler.stop'); const self = new Map(), byId = new Map(profile.nodes.map((n) => [n.id, n])); const dt = profile.timeDeltas; const cnt = new Map(); for (const s of profile.samples) cnt.set(s, (cnt.get(s) || 0) + 1);
  let total = 0; for (const [id, c] of cnt) { const n = byId.get(id), nm = (n.callFrame.functionName || '(anon)') + ':' + n.callFrame.lineNumber; self.set(nm, (self.get(nm) || 0) + c); total += c; }
  console.log('mean ms per decision', t.toFixed(1), 'samples', total); [...self].sort((a, b) => b[1] - a[1]).slice(0, 22).forEach(([k, v]) => console.log((100 * v / total).toFixed(1) + '%', k));
  await b.close(); })();
