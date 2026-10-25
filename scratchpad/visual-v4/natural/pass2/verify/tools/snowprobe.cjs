// where Clear's rendered mountain pixels come near the snow: the bake texel under the pixel, its fog, hover and selection
const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, PAGE, { log, settle: 1500, q: '?terrain=clear' }); await p.mouse.move(720, 894);
  for (const [v, src, pts] of [['start', null, [[1071, 80], [1075, 80]]], ['far', 'm.setScale(m.minScale(), 800, 500)', [[906, 217], [910, 217]]], ['mid', 'm.setScale(1.0, 640, 480)', [[39, 215], [39, 216]]]]) {
    if (src) await ev(p, src); await p.waitForTimeout(1500);
    const r = await mev(p, `(() => { const cr = canvas.getBoundingClientRect(); const o = { canvasRect: [cr.left, cr.top, cr.width, cr.height], hover: hoverProv, sel: state.sel, view: viewRect() }; const d = rlRedraw(['rails', 'pieces', 'labels', 'badges', 'arrows']); const { BW, TX, id } = RB, img = RB.L.clear.img.data;
      o.pts = ${JSON.stringify(pts)}.map(([X, Y]) => { const k = (Y * canvas.width + X) * 4, [x, y] = toWorld(X + 0.5, Y + 0.5), t = Math.floor(y * TX) * BW + Math.floor(x * TX); return { px: rgb2hex([d[k], d[k + 1], d[k + 2]]), texel: rgb2hex([img[t * 4], img[t * 4 + 1], img[t * 4 + 2]]), prov: names[id[t]], terr: terr[id[t]], fog: fogOf(id[t]), world: [+x.toFixed(1), +y.toFixed(1)], inModel: inModel(x, y) }; });
      let mx = 0, mk = ''; for (let t = 0; t < id.length; t++) { if (RB.LT[t] !== 4) continue; const r = img[t * 4], g = img[t * 4 + 1], bb = img[t * 4 + 2], L = rlL(r, g, bb); if (L > mx) { mx = L; mk = rgb2hex([r, g, bb]) + ' ' + names[id[t]]; } } o.bakeMountainMaxL = [+mx.toFixed(1), mk]; return o; })()`);
    console.log(v, JSON.stringify(r));
  }
  await b.close();
})();
