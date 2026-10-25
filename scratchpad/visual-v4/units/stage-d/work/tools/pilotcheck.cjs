// Runs the pilot checks only: node pilotcheck.cjs PAGE OUT.json [--fig procedural] [--rm reduce]
const fs = require('fs');
const { launch, openPage } = require('./lib.cjs');
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
(async () => {
  const browser = await launch();
  const q = '?paused=1' + (opt('fig', '') === 'procedural' ? '&fig=procedural' : '');
  const { page, errors } = await openPage(browser, a[0], q, { reducedMotion: opt('rm', 'no-preference') });
  const t0 = Date.now();
  const r = await page.evaluate((sp) => { const G = window.__battle.game; if (sp) G.speed = sp; return { reducedAtInit: G.reduced, os: FX_MOTION.os, pilot: G.checkPilot(), speedAfter: G.speed, errors: window.__errors.slice() }; }, +opt('speed', 0));
  r.seconds = (Date.now() - t0) / 1000; r.consoleErrors = errors;
  fs.writeFileSync(a[1], JSON.stringify(r, null, 1));
  const p = r.pilot;
  console.log('ok', p.ok, 'limiter', JSON.stringify(p.limiter), 'os', JSON.stringify(p.osReducedMotion), 'reducedAtInit', r.reducedAtInit);
  console.log('concurrency', JSON.stringify(p.concurrency), 'durations', JSON.stringify(p.dataDurations), 'layers', JSON.stringify(p.layers));
  for (const b of p.battles) {
    console.log(b.key, 'ok', b.ok, 'decals', JSON.stringify(b.decals), 'gfx', b.graphicsInLayer, b.graphicsCallsInFrame);
    for (const c of b.casts) console.log('  ', c.spell, c.form, 'ok', c.ok, 'beats', c.beatsOk, JSON.stringify(c.beats), 'ext', c.travelExtended, 'drawn', c.drawnOk, JSON.stringify(c.drawn), 'particles', JSON.stringify(c.particles), 'fxMs', c.fxUpdateMsMax, 'draws', JSON.stringify(c.draws), 'sound', JSON.stringify(c.sound), 'grammar', JSON.stringify(c.grammar), 'fast', JSON.stringify(c.fast), 'det', c.deterministic, 'rm', JSON.stringify(c.reducedMotion));
  }
  console.log('errors', r.errors, errors, 'seconds', r.seconds);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
