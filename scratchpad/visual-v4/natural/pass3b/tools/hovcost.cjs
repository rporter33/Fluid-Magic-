// where a hover frame's time goes: node hovcost.cjs ; at Mid on the Ashspine, each wild hovered twice: draw() time, the live focus layer's time, decisions made
const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, settle: 2500 }); await p.mouse.move(720, 896);
  await ev(p, 'm.setScale(1.0, ...m.ev("[cent[WILDS[0].cells[0]][0], cent[WILDS[0].cells[0]][1]]"))'); await p.waitForTimeout(2500);
  const r = await mev(p, `(() => { const out = []; const orig = rlDrawWildFocusLive; let live = 0; rlDrawWildFocusLive = (g, px) => { const t = performance.now(); const n = orig(g, px); live = performance.now() - t; return n; };
    for (const i of [WILDS[0].cells[0], WILDS[1].cells[0], WILDS[2].cells[0], names.indexOf('Halevale'), names.indexOf('Ashmoor')]) for (let rep = 0; rep < 2; rep++) { const q0 = RL_QE.n, h0 = RL_QE.hov.size; hoverProv = i; const t = performance.now(); draw(); out.push({ i: names[i] || ('wild ' + i), rep, drawMs: +(performance.now() - t).toFixed(1), liveMs: +live.toFixed(1), decided: RL_QE.n - q0, hovMaps: RL_QE.hov.size - h0, lastDecisionMs: RL_QE.ms }); }
    hoverProv = -1; rlDrawWildFocusLive = orig; draw(); return out; })()`);
  for (const x of r) console.log(JSON.stringify(x)); console.log('pageErrors', log.pageErrors.length); await b.close(); })();
