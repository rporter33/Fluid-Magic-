const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, p = await open(b, PAGE, { log, settle: 800 }); await p.mouse.move(720, 894);
  await ev(p, 'm.zoomTo(m.maxScale(), "Wyrford")'); await p.waitForTimeout(1500);
  console.log(JSON.stringify(await mev(p, `(() => { const lay = RL_PIECE_CACHE.get('L'), k = rlLayK(lay), v = viewRect(), out = []; for (const [i, st] of lay.seats) { const x = st.x * k + cam.x, y = st.y * k + cam.y; if (x < v.l || x > v.r || y < v.t || y > v.b) continue; out.push({ n: names[i], seat: [Math.round(x), Math.round(y)], named: lay.labels.some((l) => l.i === i) }); } return { v, cw, out }; })()`)));
  await p.screenshot({ path: '${F}/out/x-nearmax.png'.replace('${F}', require('path').resolve(__dirname, '..')) }); await b.close(); })();
