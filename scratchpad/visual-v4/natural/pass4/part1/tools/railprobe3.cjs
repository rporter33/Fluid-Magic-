const { launch, open, ev, mev } = require('./lib.cjs');
(async () => { const b = await launch(); for (const [q, f] of [['', 'on'], ['?p4=off', 'off']]) { const log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, process.env.PAGEFILE, { log, q, settle: 1500 }); await p.mouse.move(720, 896);
  await ev(p, `m.ev("fit(); draw()"); m.setMonth(40)`); await p.waitForTimeout(1000);
  const c = await mev(p, `(() => { const a = names.indexOf('Morholt'), E = RL_EDGES[a].find((e) => e.j === names.indexOf('Ashfen')); return [(E.a[0] + E.b[0]) / 2, (E.a[1] + E.b[1]) / 2]; })()`);
  await ev(p, `m.setScale(${process.argv[2] || 1.6}, ${c[0]}, ${c[1]})`); await p.waitForTimeout(2500);
  const s = await mev(p, `toScreen(${c[0]}, ${c[1]})`);
  await p.screenshot({ path: process.argv[3] + '-' + f + '.png', clip: { x: s[0] - 200, y: s[1] - 160, width: 400, height: 320 } }); await p.context().close(); }
  await b.close(); })();
