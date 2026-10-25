// the start view on two builds: camera, frame hash, reliefStartClear, per window: node startcmp.cjs
const { launch, open, ev, mev, PAGE, HASH } = require('./lib.cjs');
const A = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/fix/wip/fy/game-screen-v4.html';
(async () => {
  const b = await launch();
  for (const [w, h, dpr, q] of [[1440, 900, 1, ''], [1440, 900, 2, ''], [390, 844, 3, ''], [1280, 720, 1, ''], [1920, 1080, 1, ''], [1440, 900, 1, '?terrain=clear'], [390, 844, 3, '?terrain=clear']]) {
    const row = [];
    for (const [tag, f] of [['verified', A], ['final', PAGE]]) { const log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, f, { log, w, h, dpr, q, settle: 1500 }); await p.mouse.move(w / 2, h - 4); await p.waitForTimeout(800);
      const cam = await mev(p, '[+cam.x.toFixed(2), +cam.y.toFixed(2), +cam.s.toFixed(4)]'); const hs = await ev(p, 'm.ev(' + JSON.stringify(HASH) + ')'); const sc = await ev(p, 'm.reliefStartClear()');
      row.push({ tag, cam, hash: hs, startClear: sc.pass, under: [sc.wildSamplesUnderRibbon, sc.seatsUnderRibbon.length], pe: log.pageErrors.length }); await p.context().close(); }
    console.log(`${w}x${h} dpr${dpr}${q}`, JSON.stringify(row), 'sameCam', JSON.stringify(row[0].cam) === JSON.stringify(row[1].cam), 'sameHash', row[0].hash === row[1].hash);
  }
  await b.close();
})();
