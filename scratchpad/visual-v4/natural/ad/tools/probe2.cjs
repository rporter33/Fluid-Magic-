const { launch, open, PAGE } = require('../../build-tools/nlib.cjs');
(async () => {
  const b = await launch();
  const p = await open(b, PAGE, { settle: 500 });
  const r = await p.evaluate(() => window.__mock.ev('names.map((n,i)=>i+":"+n+":"+terr[i]+":"+(typeof ownerOf==="function"?ownerOf(i):(state.owner?state.owner[i]:""))).join("\\n")'));
  console.log(r);
  await b.close();
})();
