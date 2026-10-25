// vpix.cjs <variant> <camera expr> <ax> <ay> <bx> <by> <sx> <sy>: across one edge at one sample, the bake's colour (as the decision reads it) against the drawn pixel, with the province under each
const { launch, open, ev, mev } = require('./lib.cjs');
(async () => { const [V0, camx, ax, ay, bx, by, sx, sy] = process.argv.slice(2), b = await launch(); const p = await open(b, `${__dirname}/../variants/${V0}/game-screen-v4.html`, { settle: 1500 }); await p.mouse.move(720, 896);
  await ev(p, camx); await p.waitForTimeout(1500);
  console.log(JSON.stringify(await mev(p, `(() => { const d = rlRedraw(['pieces', 'labels', 'badges', 'arrows']), W2 = canvas.width, S = rlQeSrc(RB.L.natural.img, RB.TX), lvl = rlMipLevel();
    const px = (x, y) => { const k = (Math.floor(y * dpr) * W2 + Math.floor(x * dpr)) * 4; return [d[k], d[k + 1], d[k + 2]]; }, L = (c) => c ? +rgb2lab(c)[0].toFixed(1) : null;
    const Lg = Math.hypot(${bx} - ${ax}, ${by} - ${ay}); let nx = -(${by} - ${ay}) / Lg, ny = (${bx} - ${ax}) / Lg; const e = { a: [${ax}, ${ay}], b: [${bx}, ${by}] };
    if (provinceAt(...toWorld((${ax} + ${bx}) / 2 + nx * 8, (${ay} + ${by}) / 2 + ny * 8)) === -1 || isWild(provinceAt(...toWorld((${ax} + ${bx}) / 2 + nx * 8, (${ay} + ${by}) / 2 + ny * 8)))) { nx = -nx; ny = -ny; }
    const rows = []; for (const o of [-9, -8, -7, -6, -3, -2, 6, 7, 8, 9, 9.5, 12, 15]) { const X = ${sx} + nx * o, Y = ${sy} + ny * o, [wx, wy] = toWorld(X, Y), i = provinceAt(wx, wy); rows.push([o, i >= 0 ? names[i] : '-', L(rlQeAt(S, wx, wy)), L(px(X, Y))]); }
    return { lvl, src: rlMsSource(), nearK: +rlNearK().toFixed(3), farK: +rlFarK().toFixed(3), rows }; })()`))); await b.close(); })();
