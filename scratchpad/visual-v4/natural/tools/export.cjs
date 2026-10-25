// Export the mockup's map and the relief bake's rasters for the offline natural-view prototype (read-only: nothing on the page changes)
const { launch, open } = require('../../map/tools/lib.cjs');
const fs = require('fs');
const PAGE = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/game-screen-v4.html';
const OUT = __dirname + '/../proto/data/';
(async () => {
  const b = await launch(), errors = [];
  const p = await open(b, PAGE, 1440, 900, '', errors, { settle: 1500 });
  const meta = await p.evaluate(() => window.__mock.ev(`(() => ({
    W, H, N, MED_DIAM, RLK, MAP_SEED, BW: RB.BW, BH: RB.BH, TX: RB.TX, HW: RB.HW, HH: RB.HH, QW: RB.QW, QH: RB.QH,
    cells, cent, terr, names, provList, wild: [...Array(N).keys()].map((i) => (isWild(i) ? wildOf[i].kind : null)),
    owner: [...Array(N).keys()].map((i) => (isWild(i) ? null : prov[i].owner)), fog: [...Array(N).keys()].map((i) => (isWild(i) ? null : fogOf(i) || null)),
    dom: [...Array(N).keys()].map((i) => (isWild(i) ? null : prov[i].dom)), cap: [...Array(N).keys()].map((i) => (isWild(i) ? false : !!prov[i].cap)),
    BAN, NB, wilds: WILDS.map((w) => ({ id: w.id, kind: w.kind, name: w.name, cells: w.cells })),
    water: { lakes: RB.water.lakes.map((l) => ({ i: l.i, P: l.P, x: l.x, y: l.y })), ponds: RB.water.ponds.map((l) => ({ i: l.i, P: l.P, x: l.x, y: l.y })), streams: RB.water.streams.map((s) => ({ i: s.i, pts: s.pts, w0: s.w0, w1: s.w1, sink: s.sink })), falls: RB.water.falls },
    cam: { s: cam.s, x: cam.x, y: cam.y }, cw, ch, dpr, band: bandOf(cam.s), Dpx: MED_DIAM * cam.s,
    edges: [...EDGE.values()].map((e) => ({ i: e.i, j: e.j, a: e.a, b: e.b })),
  }))()`));
  fs.writeFileSync(OUT + 'meta.json', JSON.stringify(meta));
  console.log('meta', meta.W, meta.H, meta.N, 'MED_DIAM', meta.MED_DIAM.toFixed(2), 'RLK', meta.RLK.toFixed(3), 'bake', meta.BW, meta.BH, 'TX', meta.TX, 'start Dpx', meta.Dpx.toFixed(1), meta.band);
  const arrays = ['id', 'LT', 'LP', 'pure', 'hid', 'hLT', 'hh', 'fS', 'sS', 'shd', 'ao', 'snow', 'DL', 'hq', 'modeRelief'];
  for (const k of arrays) {
    const s = await p.evaluate((k) => window.__mock.ev(`(() => { const a = RB['${k}']; const u = new Uint8Array(a.buffer, a.byteOffset, a.byteLength); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return [a.constructor.name, a.length, btoa(s)]; })()`), k);
    fs.writeFileSync(OUT + k + '.bin', Buffer.from(s[2], 'base64')); console.log(k, s[0], s[1]);
  }
  for (const k of ['img']) { // the clear bake as drawn (unwashed, wilds sculpted)
    const s = await p.evaluate(() => window.__mock.ev(`(() => { const u = RB.img.data; let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); })()`));
    fs.writeFileSync(OUT + 'clear-img.rgba', Buffer.from(s, 'base64'));
  }
  console.log('errors', JSON.stringify(errors.filter((x) => !/software WebGL|willReadFrequently/.test(x))));
  await b.close();
})();
