// the decision's own model against the frame at a failing sample: node s5probe2.cjs <variant> <sweep index> <sx> <sy>
const { launch, open, ev, mev, ME } = require('./lib.cjs');
const V0 = process.argv[2] || 's5', K = Number(process.argv[3] || 15), SX = Number(process.argv[4]), SY = Number(process.argv[5]), PAGE = ME + 'variants/' + V0 + '/game-screen-v4.html';
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, settle: 1500 }); await p.mouse.move(720, 896);
  const r = await mev(p, `(() => { const V = rlWildSweepViews()[${K}]; window.__mock.setScale(V[1], V[2], V[3]); RL_DBG.focusAll = true; RL_WRIM.lru.clear(); RL_QE.hov.clear(); RL_DBG.qeSamples = []; RCK = null; draw();
    const [wx, wy] = toWorld(${SX}, ${SY}); let best = null, bd = Infinity; for (const q of RL_DBG.qeSamples) { const d = Math.hypot(q[0] - wx, q[1] - wy); if (d < bd) { bd = d; best = q; } }
    const d = rlRedraw(['pieces', 'labels', 'badges', 'arrows']), W2 = canvas.width, px = (x, y) => { const [sx, sy] = toScreen(x, y), k = (Math.floor(sy * dpr) * W2 + Math.floor(sx * dpr)) * 4; return [d[k], d[k + 1], d[k + 2]]; };
    const [x, y, nx, ny, Wg, G] = best, s0 = cam.s, inner = [5.5, 6, 7, 8, 9, 9.5].map((o) => px(x - nx * o / s0, y - ny * o / s0)), outer = [5.5, 6, 7, 8, 9, 9.5, 10].map((o) => px(x + nx * o / s0, y + ny * o / s0));
    const E = RL_WRIM.map && [...RL_WRIM.map.entries()].find(([k]) => k.split(':')[1] == names.indexOf('Haleford')); RL_DBG.qeSamples = null; RL_DBG.focusAll = false;
    return { dist: +bd.toFixed(2), s: +cam.s.toFixed(4), rung: +rlQeRung(cam.s).toFixed(4), src: rlMsSource(), bakeK: +rlMsBakeKAt(cam.s).toFixed(3), lvl: rlMipLevel(), modelW: rgb2lab(Wg).map(Math.round), modelG: rgb2lab(G).map(Math.round), frameInner: inner.map((c) => Math.round(rgb2lab(c)[0])), frameOuter: outer.map((c) => Math.round(rgb2lab(c)[0])), edge: E ? { key: E[0], N: E[1].N, fails: Array.from(E[1].fail).join('') } : null }; })()`);
  console.log(JSON.stringify(r)); console.log('pageErrors', log.pageErrors.length); await b.close(); })();
