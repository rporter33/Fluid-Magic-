// step 4 look: the start view, Near on the river, a march across it, the Supply mode path: node waterlook.cjs [tag]
const { launch, open, ev, mev, PAGE, ME, HASH } = require('./lib.cjs');
const tag = process.argv[2] || 's4';
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, settle: 2000, reducedMotion: 'reduce' }); await p.mouse.move(720, 896);
  await p.screenshot({ path: `${ME}wip/${tag}-start.png` });
  const info = await mev(p, `(() => { const G = rlRiverGeo(), R = G[0]; return { river: R.name, pts: R.S.length, bb: R.bb.map(Math.round), hw: [R.hw[0], R.hw[R.hw.length - 1]].map((v) => +v.toFixed(2)), bridges: [...rlWorld4().bridges.keys()].map((k) => { const X = rlCrossPt(k); return [k, Math.round(X.x), Math.round(X.y)]; }), stats: RL_WAT.stats, ins: [...RL_WAT.ins.entries()].filter(([, v]) => v > 0).slice(0, 6) }; })()`); console.log(JSON.stringify(info));
  const k0 = info.bridges[1][0]; await mev(p, `(() => { const k = '${k0}', e = EDGE.get(k), X = rlCrossPt(k); window.__mock.setScale(250 / MED_DIAM, X.x, X.y); })()`); await p.waitForTimeout(800); await p.screenshot({ path: `${ME}wip/${tag}-near250.png` });
  // a march across the river: Varo to a province reached across the Stagflow without a bridge
  const tgt = await mev(p, `(() => { fit(); RCK = null; draw(); const W4 = rlWorld4(); const c = provList.filter((i) => i !== cmd.varo.at).map((i) => [i, pathTo(cmd.varo.at, i)]).filter(([, d]) => d && d.path.some((v, k) => p4Crossing(ekey(k ? d.path[k - 1] : cmd.varo.at, v)))); return c.map(([i, d]) => [names[i], d.days, d.path.map((v) => names[v]).join('>')]); })()`); console.log('crossing targets', JSON.stringify(tgt));
  const name = tgt[0][0]; const [x, y] = await ev(p, `m.at(${JSON.stringify(name)})`); await p.mouse.click(x, y, { button: 'right' }); await p.waitForTimeout(700); await p.mouse.move(720, 896); await p.waitForTimeout(500);
  console.log('chips', JSON.stringify(await mev(p, 'RL_THREAD_CHIPS.list')), 'proj', JSON.stringify(await mev(p, `moveProjection(cmd.varo, names.indexOf(${JSON.stringify(name)})).replace(/<[^>]+>/g, '')`)));
  await p.screenshot({ path: `${ME}wip/${tag}-march.png` });
  await mev(p, "moveLine = null; setMode('supply'); draw()"); await p.waitForTimeout(900); await p.screenshot({ path: `${ME}wip/${tag}-supply.png` }); console.log('supply chip', JSON.stringify(await mev(p, 'RL_WAT.chip && { text: RL_WAT.chip.text, box: RL_WAT.chip.box, bars: RL_WAT.chip.bars }')));
  console.log('perr', JSON.stringify(log.pageErrors)); await b.close(); })();
