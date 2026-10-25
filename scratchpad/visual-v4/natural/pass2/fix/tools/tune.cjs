// in-page tuning: node tune.cjs '<json list of [tag, js-to-apply]>' ; rebakes the natural look after each, crops the Ashspine at start / ref, prints hf and L stats
const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const fs = require('fs');
const PR = fs.readFileSync(__dirname + '/ad-adprobe.js', 'utf8');
const sets = JSON.parse(process.argv[2]); const views = (process.env.VIEWS || 'start,ref').split(',');
const set = (expr) => `m.ev(${JSON.stringify(expr + '; clampCam(); RCK = null; draw()')})`;
const atWild = (kind, s) => set(`const w = WILDS.find(q => q.kind === '${kind}'); const c = wgeo(w).labelAt; const v = viewRect(); cam.s = ${s}; cam.x = (v.l+v.r)/2 - cent[c][0]*cam.s; cam.y = (v.t+v.b)/2 - cent[c][1]*cam.s`);
const V = { start: 'm.ev("fit(); draw()")', ref: atWild('peaks', 1.142), max: atWild('peaks', 'maxScale'), grey: atWild('peaks', 1.142).replace("q.kind === 'peaks'", "q.name === 'The Greyteeth'"), min: 'm.setScale(m.minScale(), 800, 500)', mere: atWild('mere', 1.142) };
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, settle: 800 }); await mev(p, PR); await p.mouse.move(720, 894);
  for (const [tag, js] of sets) {
    if (js) { await mev(p, js + `; for (const _ of rlLookGen(RB, 'natural')) void _; RB.lookVer++; RL_WRIM.key = ''; RCK = null; draw()`); }
    for (const v of views) { await ev(p, V[v]); await p.waitForTimeout(700);
      const hf = await p.evaluate(() => window.__ad.hfCores()), wl = await ev(p, 'm.reliefWildLook().peaks'), e = await ev(p, 'm.reliefWildEdge()'), rim = e.rim;
      const r = (a, b2) => (a && b2 ? +(a.hf / b2.hf).toFixed(2) : null);
      console.log(tag, v, JSON.stringify({ pk: hf.peaksWild && [hf.peaksWild.hf, hf.peaksWild.Lp5, hf.peaksWild.Lp50, hf.peaksWild.Lp95], vsLand: r(hf.peaksWild, hf.otherLand), vsMtn: r(hf.peaksWild, hf.mountains), bake: [wl.Lp5, wl.Lp50, wl.Lp95, wl.overCap], edge: [e.samples, e.passDirect, e.fails], rim }));
      await p.screenshot({ path: `${OUT}t-${tag}-${v}.png`, clip: v === 'start' ? { x: 230, y: 160, width: 720, height: 460 } : { x: 160, y: 200, width: 1100, height: 520 } }); }
  }
  console.log('pageErrors', log.pageErrors.length, JSON.stringify(log.pageErrors.slice(0, 2))); await b.close();
})();
