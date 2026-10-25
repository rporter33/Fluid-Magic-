// two pages, the same views, modes, hovers and selections: canvas hashes compared. node samepair.cjs <pageA> <pageB> [dpr]
const { launch, open, ev, mev, HASH } = require('./lib.cjs');
const A = process.argv[2], B = process.argv[3], dpr = Number(process.argv[4] || 1);
const STEPS = [['clear-start', 'clear', 'ownership', 'm.ev("fit(); draw()")', ''], ['clear-mid', 'clear', 'ownership', 'm.setScale(1.0, 640, 480)', ''], ['clear-mid-hov', 'clear', 'ownership', 'm.setScale(1.0, 640, 480)', 'hoverProv = names.indexOf("Ashmoor")'],
  ['clear-mid-sel', 'clear', 'ownership', 'm.setScale(1.0, 640, 480)', 'state.sel = { type: "prov", id: names.indexOf("Halebrook") }'], ['clear-near-springs', 'clear', 'springs', 'm.setScale(m.maxScale() * 0.8, 1180, 300)', ''],
  ['nat-terrain-near', 'natural', 'terrain', 'm.setScale(m.maxScale() * 0.8, 1180, 300)', ''], ['nat-mid-hov', 'natural', 'ownership', 'm.setScale(1.0, 640, 480)', 'hoverProv = names.indexOf("Ashstead")'], ['nat-start-dom', 'natural', 'dominion', 'm.ev("fit(); draw()")', ''], ['nat-start', 'natural', 'ownership', 'm.ev("fit(); draw()")', '']];
(async () => { const b = await launch(), out = {};
  for (const [nm, f] of [['A', A], ['B', B]]) { let p = null, cur = null; out[nm] = {};
    for (const [k, look, mode, cam, act] of STEPS) { if (cur !== look) { if (p) await p.context().close(); console.log('open', nm, look); p = await open(b, f, { dpr, settle: 1200, q: look === 'clear' ? '?terrain=clear' : '' }); await p.mouse.move(720, 895); cur = look; }
      await mev(p, `hoverProv = -1; state.sel = null; setMode('${mode}'); decoAlpha = decoFrom = decoTo;`); if (mode === 'terrain') await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 240000, polling: 300 });
      await ev(p, cam); await mev(p, `${act}; RCK = null; draw()`); out[nm][k] = await mev(p, HASH); console.log(nm, k, out[nm][k]); }
    await p.context().close(); }
  for (const [k] of STEPS) console.log(k, out.A[k], out.B[k], out.A[k] === out.B[k] ? 'SAME' : 'DIFF'); await b.close(); })();
