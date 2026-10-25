// node clear.cjs : Clear terrain colours at the start view and Mid in every build; hash of the canvas, to confirm the wilds there are unchanged
const { launch, open, ev, mev, ME } = require('./lib.cjs'); const fs = require('fs');
(async () => { const b = await launch(); const out = {};
  for (const build of ['p2', 'relief', 'massif', 'open']) { const log = { pageErrors: [], console: [] }; const p = await open(b, build, { log, q: '?terrain=clear' }); await p.mouse.move(720, 896);
    for (const [v, src] of [['clear-start', null], ['clear-mid', 'm.setScale(1.0, 640, 480)']]) { if (src) await ev(p, src); await p.waitForTimeout(2500);
      const h = await mev(p, `(() => { RCK = null; draw(); const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data; let h = 0x811c9dc5; for (let k = 0; k < d.length; k++) { h ^= d[k]; h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16); })()`);
      out[build + ' ' + v] = h; await p.screenshot({ path: `${ME}shots/${build}-${v}.png` }); }
    console.log(build, 'pageErrors', log.pageErrors.length); await p.context().close(); }
  console.log(JSON.stringify(out, null, 1)); fs.writeFileSync(ME + 'out/clear-hashes.json', JSON.stringify(out, null, 1)); await b.close(); })();
