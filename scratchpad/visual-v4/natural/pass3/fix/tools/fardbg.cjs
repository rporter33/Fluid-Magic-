const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, process.argv[2] || PAGE, { log, settle: 1000 });
  await ev(p, 'm.setScale(60 / m.ev("MED_DIAM"), 720, 450)'); await p.waitForTimeout(1500);
  const meas = `(() => { RCK = null; draw(); const d = ctx.getImageData(400 * dpr, 300 * dpr, 600 * dpr, 300 * dpr).data; let s = 0, n = 0; for (let k = 0; k < d.length; k += 16) { s += rgb2lab([d[k], d[k + 1], d[k + 2]])[0]; n++; } return +(s / n).toFixed(2); })()`;
  console.log('far meanL', await mev(p, meas), 'FR built at', await mev(p, 'RL_FR.ver'), 'fk', await mev(p, 'rlFarK()'));
  console.log('rebuild FR', await mev(p, `(() => { RL_FR.cv = null; RL_FR.ver = -1; return ${meas}; })()`));
  console.log('skip far relief', await mev(p, `(() => { SKIP.add('farRelief'); const v = ${meas}; SKIP.delete('farRelief'); return v; })()`));
  console.log('FR stats', await mev(p, `(() => { const d = RL_FR.img.data; let s = 0, n = 0, lo = 0; for (let k = 0; k < d.length; k += 4) if (d[k + 3]) { s += d[k]; n++; if (d[k] < 100) lo++; } return [+(s / n).toFixed(1), +(lo / n).toFixed(3)]; })()`));
  await b.close(); })();
