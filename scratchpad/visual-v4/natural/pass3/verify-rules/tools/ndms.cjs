// the Near detail pass's time (RL_ND.ms) at the closest zoom on the Ashspine and the mere, this build and the page before the fix pass, interleaved rounds
const { launch, open, ev, mev, PAGE, BEFORE, OUT } = require('./lib.cjs'); const fs = require('fs');
const set = (expr) => `m.ev(${JSON.stringify(expr + '; clampCam(); RCK = null; draw()')})`;
const atWild = (kind) => set(`const w = WILDS.find(q => q.kind === '${kind}'); const c = wgeo(w).labelAt; const v = viewRect(); cam.s = maxScale; cam.x = (v.l+v.r)/2 - cent[c][0]*cam.s; cam.y = (v.t+v.b)/2 - cent[c][1]*cam.s`);
(async () => { const b = await launch(); const P = {}; for (const [nm, f] of [['now', PAGE], ['before', BEFORE]]) { P[nm] = await open(b, f, { settle: 800 }); await P[nm].mouse.move(720, 894); }
  const R = { now: { peaks: [], mere: [] }, before: { peaks: [], mere: [] } };
  for (let round = 0; round < 6; round++) for (const nm of (round % 2 ? ['before', 'now'] : ['now', 'before'])) { const p = P[nm]; for (const k of ['peaks', 'mere']) { await ev(p, atWild(k)); await p.waitForTimeout(300); for (let i = 0; i < 5; i++) { await mev(p, "RL_ND.key = ''; RCK = null; draw()"); R[nm][k].push(await mev(p, 'RL_ND.ms')); } } }
  const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
  for (const nm of ['now', 'before']) console.log(nm, 'peaks median', med(R[nm].peaks), 'mere median', med(R[nm].mere), 'n', R[nm].peaks.length);
  console.log('ratio peaks', (med(R.now.peaks) / med(R.before.peaks)).toFixed(3), 'mere', (med(R.now.mere) / med(R.before.mere)).toFixed(3));
  fs.writeFileSync(OUT + 'ndms.json', JSON.stringify(R)); await b.close(); })();
