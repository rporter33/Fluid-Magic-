// window.__battle.checks() (the mockup's checks, the painted checks of 95, the pilot's of 97, and the animation checks
// of 98 when present) in one mode, written to OUT.json with a short summary.
//   node run_checks.cjs PAGE_OR_URL OUT.json [--fig procedural] [--timing 0|1] [--frames 240]
const fs = require('fs');
const { launch, openPage } = require('./lib.cjs');
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
(async () => {
  const browser = await launch();
  const q = '?paused=1' + (opt('fig', '') === 'procedural' ? '&fig=procedural' : '');
  const { page, errors } = await openPage(browser, a[0], q);
  const t0 = Date.now();
  const r = await page.evaluate((o) => window.__battle.checks(o), { timing: opt('timing', '1') === '1', frames: +opt('frames', 240) });
  r.seconds = (Date.now() - t0) / 1000; r.consoleErrors = errors;
  fs.writeFileSync(a[1], JSON.stringify(r, null, 1));
  console.log('ok', r.ok, 'paintOk', r.paintOk, 'pilot', r.pilot && r.pilot.ok, 'anim', r.anim && r.anim.ok, 'errors', r.pageErrors.length, errors.length, 'seconds', r.seconds);
  for (const b of r.battles) console.log(b.key, 'fig', b.figureMismatches.length, 'card', b.cardMismatches.length, 'bodies', b.bodiesOk, 'win', b.winnerOk, 'det', b.deterministic, 'overlap', b.overlap.framesWithOverlap, 'pick', b.pick.wrong.length, 'colors', b.colors.ok,
    'paint', b.paint && b.paint.ok, 'faces', b.faces && b.faces.ok, 'var', b.variation && b.variation.ok, 'side', b.sideShare && b.sideShare.ok, 'dead', b.deadHandoff && b.deadHandoff.ok, 'crea', b.creatures && b.creatures.ok, 'heights', b.bigHeights && b.bigHeights.ok, 'wolf', b.wolfFront && b.wolfFront.ok);
  for (const x of r.frameTiming) console.log('timing', x.battle, x.speed + 'x', 'upd', x.updateP50, x.updateP95, 'render', x.renderCpuP50, x.renderCpuP95, 'cpu', x.cpuP50, x.cpuP95, 'gpu', x.gpuWaitP50);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
