// step 2 look: each forced season at the start view and Near, shots in part1/wip: node seasonlook.cjs [tag]
const { launch, open, ev, mev, PAGE, ME, HASH } = require('./lib.cjs');
const tag = process.argv[2] || 's2';
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, settle: 2000, reducedMotion: 'reduce' }); await p.mouse.move(720, 896);
  const out = { start: await mev(p, HASH), state0: await mev(p, '({ shown: RL_SEAS.shown, S: Object.keys(RB.S), made: RL_SEAS.made, gen: RL_SEAS.gen })') };
  for (const s of [1, 2, 3, 0]) {
    await mev(p, `P4S.season = ${s}; fit(); RCK = null; draw()`); await p.waitForFunction((s) => window.__mock.ev(`RL_SEAS.shown === ${s}`), s, { timeout: 60000, polling: 200 }); await p.waitForTimeout(400); await mev(p, 'draw()');
    out['s' + s] = { hash: await mev(p, HASH), variant: await mev(p, `RB.S[${s}] ? { ms: RB.S[${s}].ms, changed: RB.S[${s}].changed } : null`), made: await mev(p, `RL_SEAS.made[${s}] || null`), chroma: await mev(p, 'JSON.stringify(rlNatChroma()).slice(0, 300)') };
    await p.screenshot({ path: `${ME}wip/${tag}-season${s}-start.png` });
    await ev(p, 'm.setScale(m.maxScale() * 0.6, 700, 520)'); await p.waitForTimeout(600); await p.screenshot({ path: `${ME}wip/${tag}-season${s}-near.png` });
  }
  console.log(JSON.stringify(out, null, 1), 'perr', JSON.stringify(log.pageErrors)); await b.close(); })();
