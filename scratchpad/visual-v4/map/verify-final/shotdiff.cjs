const { launch, open, PAGE } = require('./vlib.cjs');
(async () => {
  const b = await launch();
  for (let n = 0; n < 2; n++) { const p = await open(b, PAGE, { settle: 3000, reducedMotion: process.argv[2] === 'rm' ? 'reduce' : undefined }); await p.evaluate(() => document.fonts.ready); await p.mouse.move(1, 1); await p.waitForTimeout(500); await p.screenshot({ path: `${__dirname}/out/sd-${n}.png` }); await p.context().close(); }
  await b.close();
})();
