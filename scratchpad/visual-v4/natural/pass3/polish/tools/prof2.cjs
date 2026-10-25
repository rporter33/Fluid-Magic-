const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(); const p = await open(b, process.env.PAGEFILE || PAGE, { settle: 1200, q: '?terrain=clear' }); await p.mouse.move(720, 895); await ev(p, 'm.setScale(1.0, 640, 480)');
  const r = await mev(p, `(() => { const T = {}, wrap = (name) => { const f = eval(name); T[name] = 0; const g = function (...a) { const t0 = performance.now(); try { return f.apply(this, a); } finally { T[name] += performance.now() - t0; } }; eval(name + ' = g'); return f; };
    const names2 = ['rlGroundSides', 'rlHairGuard', 'rlIntStyles', 'rlSegStyles', 'rlDrawRails', 'rlPosExt', 'rlAlphaFor'].filter((n) => { try { return typeof eval(n) === 'function'; } catch (e) { return false; } });
    const orig = names2.map((n) => [n, wrap(n)]); const res = []; for (let k = 0; k < 3; k++) { for (const n of names2) T[n] = 0; RL_LINES.cache.clear(); RCK = null; const t0 = performance.now(); draw(); res.push({ total: +(performance.now() - t0).toFixed(0), ...Object.fromEntries(names2.map((n) => [n, +T[n].toFixed(0)])) }); }
    for (const [n, f] of orig) eval(n + ' = f'); return res; })()`);
  console.log(JSON.stringify(r)); await b.close(); })();
