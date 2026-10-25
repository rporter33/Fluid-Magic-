const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(); const p = await open(b, PAGE, { settle: 1200, q: '?terrain=clear' }); await p.mouse.move(720, 895); await ev(p, 'm.setScale(1.0, 640, 480)');
  const r = await mev(p, `(() => { const t = () => performance.now(), cold = () => { const a = []; for (let k = 0; k < 5; k++) { RL_LINES.cache.clear(); RCK = null; const t0 = t(); draw(); a.push(t() - t0); } a.sort((x, y) => x - y); return +a[2].toFixed(1); };
    const out = { base: cold() }; const L0 = rlLineCtx; rlLineCtx = function () { const c = L0(); c.states.hu = false; c.key += '|nohu'; return c; }; out.noHU = cold(); rlLineCtx = L0;
    const H0 = rlHairGuard; rlHairGuard = () => ({}); out.noHairGuard = cold(); rlHairGuard = H0;
    const P0 = rlPosExt; out.both = (() => { rlLineCtx = function () { const c = L0(); c.states.hu = false; c.key += '|nohu'; return c; }; rlHairGuard = () => ({}); const v = cold(); rlLineCtx = L0; rlHairGuard = H0; return v; })();
    RL_LINES.cache.clear(); RCK = null; draw(); return out; })()`);
  console.log(JSON.stringify(r)); await b.close(); })();
