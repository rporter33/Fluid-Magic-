const { launch, open, PAGE, realErrors } = require('../../build-tools/nlib.cjs');
(async () => {
  const b = await launch(), errors = [];
  const p = await open(b, PAGE, { errors, settle: 1500 });
  console.log('ready ms', p.__readyMs);
  const r = await p.evaluate(() => { const m = window.__mock; return { info: m.info(), scale: m.scale(), band: m.band(), fit: m.fitScale(), min: m.minScale(), max: m.maxScale(), names: m.ev('names'), terr: m.ev('names.map((n,i)=>n+":"+(provs[i]&&provs[i].terrain)+":"+(owner? owner[i]:""))'), look: m.look(), times: m.reliefTimes() }; }).catch(e => ({ err: e.message }));
  console.log(JSON.stringify(r, null, 1).slice(0, 6000));
  console.log('errors', JSON.stringify(realErrors(errors)));
  await b.close();
})();
