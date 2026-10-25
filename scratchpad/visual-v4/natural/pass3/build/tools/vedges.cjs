// vedges.cjs <variant> <camera expr> <wild index>: the camera, the canvas offset and one wild's outline in screen (canvas CSS) coordinates
const { launch, open, ev, mev } = require('./lib.cjs');
(async () => { const [V0, camx, wi] = process.argv.slice(2), b = await launch(); const p = await open(b, `${__dirname}/../variants/${V0}/game-screen-v4.html`, { settle: 1500 }); await p.mouse.move(720, 896);
  await ev(p, camx); await p.waitForTimeout(1500);
  console.log(JSON.stringify(await mev(p, `(() => { const w = WILDS[${wi}], r = canvas.getBoundingClientRect(); return { cam: [cam.s, cam.x, cam.y], rect: [r.left, r.top], edges: rlWildOutline(w).map((e) => ({ j: names[e.j], t: terr[e.j], a: toScreen(...e.a).map(Math.round), b: toScreen(...e.b).map(Math.round) })) }; })()`))); await b.close(); })();
