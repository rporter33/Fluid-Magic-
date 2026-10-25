// the Near detail pass's time (RL_ND.ms, three redraws each) at the closest zoom on the Ashspine and the mere, this build and the build before this pass
const { launch, open, ev, mev, PAGE, BEFORE } = require('./lib.cjs');
const set = (expr) => `m.ev(${JSON.stringify(expr + '; clampCam(); RCK = null; draw()')})`;
const atWild = (kind) => set(`const w = WILDS.find(q => q.kind === '${kind}'); const c = wgeo(w).labelAt; const v = viewRect(); cam.s = maxScale; cam.x = (v.l+v.r)/2 - cent[c][0]*cam.s; cam.y = (v.t+v.b)/2 - cent[c][1]*cam.s`);
(async () => { const b = await launch();
  for (const [nm, f] of [['now', PAGE], ['before', BEFORE]]) { const log = { pageErrors: [], console: [], requests: [] }, p = await open(b, f, { log, settle: 800 }); await p.mouse.move(720, 894); const r = {};
    for (const k of ['peaks', 'mere']) { await ev(p, atWild(k)); await p.waitForTimeout(600); const ms = []; for (let i = 0; i < 8; i++) { await mev(p, "RL_ND.key = ''; RCK = null; draw()"); ms.push(await mev(p, 'RL_ND.ms')); } r[k] = ms; }
    console.log(nm, JSON.stringify(r), 'errors', log.pageErrors.length); await p.context().close(); }
  await b.close(); })();
