// node shot1.cjs <html> <out.png> [w] [h] [query] [js...]: one screenshot after the bake, optional page scripts (each evaluated, then 600 ms)
const { launch, open } = require('./lib.cjs');
const [file, out, w = 1440, h = 900, q = '', ...js] = process.argv.slice(2);
(async () => {
  const b = await launch(), errors = [];
  const page = await open(b, file, +w, +h, q === '-' ? '' : q, errors);
  for (const s of js) { const r = await page.evaluate(s); if (r !== undefined) console.log('=>', JSON.stringify(r).slice(0, 2000)); await page.waitForTimeout(700); }
  await page.screenshot({ path: out });
  console.log('ERRORS', JSON.stringify(errors));
  await b.close();
})();
