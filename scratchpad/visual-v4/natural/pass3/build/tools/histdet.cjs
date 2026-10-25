// histdet.cjs: the start and Mid frames hashed fresh, then again after other zooms, hovers and selections have filled the decision's memos (history independence)
const { launch, open, ev, mev, PAGE, HASH } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, settle: 2500, reducedMotion: 'reduce' }); await p.mouse.move(720, 895);
  const shot = async (cam) => { await ev(p, cam); await p.waitForTimeout(2200); await mev(p, 'RL_WRIM.key = ""; RCK = null; draw()'); return mev(p, HASH); };
  const S0 = 'm.ev("fit(); draw()")', M0 = 'm.setScale(1.0, 640, 480)', a = [await shot(S0), await shot(M0)];
  for (const cam of ['m.setScale(m.maxScale(), 520, 230)', 'm.setScale(m.minScale(), 800, 500)', 'm.setScale(m.maxScale() * 0.55, 640, 673)', 'm.setScale(0.75, 900, 560)']) { await ev(p, cam); await p.waitForTimeout(800);
    await mev(p, '(() => { const set = new Set(); for (const w of WILDS) for (const e of rlWildOutline(w)) if (!isWild(e.j)) set.add(e.j); for (const j of set) { hoverProv = j; RCK = null; draw(); } hoverProv = -1; state.sel = { type: "prov", id: [...set][2] }; RCK = null; draw(); state.sel = null; RCK = null; draw(); })()'); }
  const b2 = [await shot(S0), await shot(M0)]; console.log('fresh', a, 'after', b2, 'same', a[0] === b2[0] && a[1] === b2[1], 'memo', await mev(p, 'RL_QE.memo.size + " / " + (RL_QE.smemo ? RL_QE.smemo.size : 0)'), 'pageErrors', log.pageErrors.length); await b.close(); })();
