// bevel guard instrument: node dbg3.cjs <A/B> <seg> <view> [hoverName]
const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
const [A0, B0] = process.argv[2].split('/'), SEG = +process.argv[3], VIEW = process.argv[4] || 'mid', HOV = process.argv[5] || '';
(async () => { const b = await launch(); const p = await open(b, PAGE, { settle: 1500 }); await p.mouse.move(720, 895);
  if (VIEW === 'mid') await ev(p, 'm.setScale(1.0, 640, 480)'); await p.waitForTimeout(1200);
  const r = await mev(p, String.raw`(() => { const A = names.indexOf('${A0}'), B = names.indexOf('${B0}'), e = [...EDGE.values()].find((q) => (q.i === A && q.j === B) || (q.i === B && q.j === A));
    const H = names.indexOf('${HOV}'), ctx0 = H >= 0 ? rlCtxTinted(rlLineCtx(), H, false) : rlLineCtx(), log = []; const orig = rlBevelGuard, BV = RL_P.bevel;
    rlBevelGuard = function (S, U, Lr, soft, up, wUL, o) { const s = ${SEG}, cm = rlCovM(o.nx, o.ny), cv = (wpx) => rlCovBest(wpx * dpr, o.nx, o.ny);
      const snap = (tag) => { const wu = wUL(s), gr = (side, wpx, key) => rlPosExt(S[s][side + 'A'], cm, wpx - cm)[key], cr = (side, key, a, wpx) => gr(side, wpx, key).map((q) => (q == null ? 'n' : rlWorst([q], RL_KEYS[key], a, cv(wpx)).toFixed(2) + '/' + q[0].toFixed(3) + '@' + q[4]));
        log.push({ tag, soft, up: up[s], wo: o.wo[s], cov: o.cov, cm, wu, U: [U.key, U.al[s]], L: [Lr.key, Lr.al[s]], ul: cr('ul', U.key, U.al[s], wu).join(' '), lr: cr('lr', Lr.key, Lr.al[s], 2 * BV.w - wu).join(' ') }); };
      snap('before'); const g = orig(S, U, Lr, soft, up, wUL, o); snap('after'); log.push(g); return g; };
    RL_LINES.cache.clear(); rlSegStyles(e, 'hair', ctx0); rlBevelGuard = orig; RL_LINES.cache.clear(); return log; })()`);
  console.log(JSON.stringify(r, null, 1)); await b.close(); })();
