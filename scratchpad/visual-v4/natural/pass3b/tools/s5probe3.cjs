// raw mip1 and the frame along the normal at a failing sample: node s5probe3.cjs <variant> <sweep index> <sx> <sy>
const { launch, open, ev, mev, ME } = require('./lib.cjs');
const V0 = process.argv[2] || 's5', K = Number(process.argv[3] || 15), SX = Number(process.argv[4]), SY = Number(process.argv[5]), PAGE = ME + 'variants/' + V0 + '/game-screen-v4.html';
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, settle: 1500 }); await p.mouse.move(720, 896);
  const r = await mev(p, `(() => { const V = rlWildSweepViews()[${K}]; window.__mock.setScale(V[1], V[2], V[3]); RL_DBG.focusAll = true; RL_WRIM.lru.clear(); RL_QE.hov.clear(); RL_DBG.qeSamples = []; RCK = null; draw();
    const [wx, wy] = toWorld(${SX}, ${SY}); let best = null, bd = Infinity; for (const q of RL_DBG.qeSamples) { const d = Math.hypot(q[0] - wx, q[1] - wy); if (d < bd) { bd = d; best = q; } } RL_DBG.qeSamples = null;
    const d = rlRedraw(['pieces', 'labels', 'badges', 'arrows', 'wildEdge']), W2 = canvas.width, px = (x, y) => { const [sx, sy] = toScreen(x, y), k = (Math.floor(sy * dpr) * W2 + Math.floor(sx * dpr)) * 4; return [d[k], d[k + 1], d[k + 2]]; };
    const Lk = RB.L.natural, M1 = rlQeSrc(Lk.mb1, (RB.TX * Lk.mb1.width) / RB.BW), IMG = rlQeSrc(Lk.img, RB.TX); const [x, y, nx, ny] = best, s0 = cam.s, rows = [];
    for (let o = 4; o <= 12; o += 0.5) { const qx = x + nx * o / s0, qy = y + ny * o / s0; rows.push([o, Math.round(rgb2lab(px(qx, qy))[0]), Math.round(rgb2lab(rlQeAt(M1, qx, qy))[0]), Math.round(rgb2lab(rlQeAt(IMG, qx, qy))[0])]); }
    const cr = canvas.getBoundingClientRect(); RL_DBG.focusAll = false; return { prov: names[provinceAt(x + nx * 8 / s0, y + ny * 8 / s0)], owner: (prov[provinceAt(x + nx * 8 / s0, y + ny * 8 / s0)] || {}).owner, rows }; })()`);
  console.log(JSON.stringify(r)); console.log('pageErrors', log.pageErrors.length); await b.close(); })();
