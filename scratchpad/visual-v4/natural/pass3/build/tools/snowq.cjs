// the Greyteeth at Near 0.6: which source draws the wild and does the rectangular snow come from the bake, the fine raster or the Near detail
const { launch, open, ev, mev, ME } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, require('./lib.cjs').PAGE, { log, settle: 1500 });
  await p.mouse.move(720, 896);
  const go = async (tag, pre) => { await mev(p, pre); await ev(p, 'm.setScale(m.maxScale() * 0.6, 640, 673)'); await p.waitForTimeout(1500);
    const info = await mev(p, '({ src: rlMsSource(), tpp: +(RB.TX / (cam.s * dpr)).toFixed(3), mip: rlMipLevel(), s: cam.s })'); console.log(tag, JSON.stringify(info));
    await p.screenshot({ path: `${ME}look/snow-${tag}.png`, clip: { x: 560, y: 230, width: 240, height: 330 } }); };
  await go('default', 'RL_DBG.msFine = false; SKIP.delete("nearDetail"); RCK = null');
  await go('fine', 'RL_DBG.msFine = true; RCK = null');
  await go('nodetail', 'RL_DBG.msFine = false; SKIP.add("nearDetail"); RCK = null');
  console.log('skipkeys', await mev(p, '[...SKIP].join(",")'), 'errors', log.pageErrors.length); await b.close(); })();
