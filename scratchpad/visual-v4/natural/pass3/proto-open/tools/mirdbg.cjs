const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, PAGE, { log, settle: 800 }); await p.mouse.move(720, 895);
  await ev(p, 'm.setScale(m.maxScale() * 0.8, 920, 585)'); await p.waitForTimeout(1500);
  const r = await mev(p, `(() => { const w = WILDS.find((q) => q.kind === 'mere'), out = [], d = RB.L.natural.img.data, { BW, TX } = RB, fr = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const bake = (x, y) => { const k = (Math.floor(y * TX) * BW + Math.floor(x * TX)) * 4; return [d[k], d[k+1], d[k+2]]; }, scr = (x, y) => { const [sx, sy] = toScreen(x, y), k = (Math.floor(sy * dpr) * canvas.width + Math.floor(sx * dpr)) * 4; return [fr[k], fr[k+1], fr[k+2]]; };
    for (const e of rlWildOutline(w)) { const [ax, ay] = e.a, [bx, by] = e.b, L = Math.hypot(bx - ax, by - ay); let nx = -(by - ay) / L, ny = (bx - ax) / L; if (provinceAt((ax + bx) / 2 + nx * 3, (ay + by) / 2 + ny * 3) !== e.j) { nx = -nx; ny = -ny; }
      const mx = (ax + bx) / 2, my = (ay + by) / 2; for (const o of [4, 8, 14]) { const pi = [mx - nx * o, my - ny * o], po = [mx + nx * o, my + ny * o]; out.push([names[e.j], fogOf(e.j) || '-', prov[e.j].owner || '-', o, 'bakeIn', rgb2hex(bake(...pi)), 'bakeOut', rgb2hex(bake(...po)), 'scrIn', rgb2hex(scr(...pi)), 'scrOut', rgb2hex(scr(...po))].join(' ')); } }
    return out; })()`);
  for (const x of r) console.log(x); await b.close(); })();
