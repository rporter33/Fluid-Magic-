// determinism across loads (the bake and a from-scratch frame hashed in two fresh pages) and the start zoom at each window size (fix 6)
const { launch, open } = require('../tools/lib.cjs');
const FILE = process.argv[2] || __dirname + '/../game-screen-v4.html';
(async () => {
  const b = await launch(), errors = [], H = [];
  for (let k = 0; k < 2; k++) { const p = await open(b, FILE, 1440, 900, '', errors); H.push(await p.evaluate(() => window.__mock.ev('[rlHashPx(RB.img.data), (() => { RCK = null; draw(); return rlHashPx(rlReadCanvas()); })()]'))); await p.close(); }
  console.log('bake and frame hashes, two loads', JSON.stringify(H), H[0][0] === H[1][0] && H[0][1] === H[1][1] ? 'identical' : 'DIFFERENT');
  for (const [w, h] of [[1920, 1080], [1440, 900], [1280, 720], [1024, 768]]) { const p = await open(b, FILE, w, h, '', errors); console.log(w + 'x' + h, JSON.stringify(await p.evaluate(() => ({ Dpx: +window.__mock.ev('rlDpx()').toFixed(1), band: window.__mock.ev('bandOf(cam.s)'), controlsOpen: document.getElementById('headMore').open, varoSelected: window.__mock.ev("state.sel ? state.sel.id : null") })))); await p.close(); }
  console.log('ERRORS', JSON.stringify(errors)); await b.close();
})();
