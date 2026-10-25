// Review: the anchored hairline rule (review/tools/patches3.js) against the design's per-segment rule (tools/patches.js), on rendered pixels
// with the independent verifier's own dump (map/verify-final/dump-colors.cjs). Also counts keyline flips along edges and shoots crops.
const { launch, open, PAGE, injectNatural, view } = require('../../tools/natpage.cjs');
const fs = require('fs');
const IN_PAGE = fs.readFileSync(__dirname + '/../../../map/verify-final/dump-colors.cjs', 'utf8').match(/String\.raw`([\s\S]*?)`;\n\(async/)[1];
const OUT = __dirname + '/../lines/', SH = __dirname + '/../renders/';
const VIEWS = [['start', 'm.ev("fitToCloth()")'], ['mid', 'm.setScale(1.0, 640, 480)'], ['nearW', 'm.setScale(m.maxScale() * 0.9, 300, 470)'], ['nearC', 'm.setScale(m.maxScale() * 0.9, 260, 640)'], ['fog', 'm.setScale(0.9, 1350, 450)']];
const COUNT = `(() => { let edges = 0, flipEdges = 0, flips = 0, multi = 0, segs = 0, unreach = 0;
  for (const [, e] of EDGE) { const i = e.i, j = e.j; if (isWild(i) || isWild(j)) continue; const oi = prov[i].owner, oj = prov[j].owner; if (!(!oi && !oj) && !(oi && oi === oj && bandOf(cam.s) === 'far')) continue;
    const [ax, ay] = e.a, [bx, by] = e.b; const [sx0, sy0] = rlToScr ? [0, 0] : [0, 0]; const v = NAT_LINES.segStyles(e, 'hair'); edges++; segs += v.length; unreach += v.filter((x) => !x.ok).length;
    let f = 0; for (let s = 1; s < v.length; s++) { const a = v[s - 1].ok ? v[s - 1].key : 'pair', b = v[s].ok ? v[s].key : 'pair'; if (a !== b) f++; } if (f) flipEdges++; if (f >= 2) multi++; flips += f; }
  return { edges, segs, unreach, flipEdges, multiFlipEdges: multi, flips, segPx: +(NAT_LINES.segD * RLD * cam.s).toFixed(1) }; })()`;
(async () => {
  const b = await launch(), errors = []; const rule = process.argv[2] || 'fixed3';
  const PATCH = fs.readFileSync(rule === 'fixed3' ? __dirname + '/patches3.js' : __dirname + '/../../tools/patches.js', 'utf8');
  for (const dpr of [1, 2]) {
    const p = await open(b, PAGE, 1440, 900, '', errors, { settle: 1500, dpr });
    console.log(await p.evaluate((s) => window.__mock.ev(s), PATCH));
    for (const look of ['clear', 'natural']) {
      if (look === 'natural') { await injectNatural(p); await p.evaluate(() => window.__mock.ev("window.__natLook = 'natural'; NAT_LINES.cache.clear(); NAT_SEAT.clear(); RL_P.haze = 0.10; RL_P.outSat = 0.25; RL_P.hemPeak = 0.20; const rs = rlRenderStatic.toString().replace(\"if (fogOf(p.i) !== 'outofsight') continue;\", \"if (!fogOf(p.i)) continue;\"); rlRenderStatic = eval('(' + rs + ')'); GLOW = null; RCK = null; draw(); 0")); }
      for (const [tag, src] of VIEWS) {
        if (dpr === 2 && !['start', 'nearW'].includes(tag)) continue;
        await view(p, src, 1500); if (tag === 'start' || tag === 'mid') await view(p, 'm.setMonth(3)', 600);
        if (dpr === 1) { const c = await p.evaluate((s) => window.__mock.ev(s), COUNT); console.log(look, tag, 'design rule flips:', JSON.stringify(c)); await p.screenshot({ path: `${SH}${look}-${rule}-${tag}.png` }); }
        if (tag === 'fog') continue;
        const data = await p.evaluate((s) => window.__mock.ev(s), IN_PAGE);
        const name = `${look}-${rule}-${tag}-dpr${dpr}`; fs.writeFileSync(OUT + name + '.json', JSON.stringify(data));
        const st = await p.evaluate(() => window.__mock.ev('JSON.stringify([NAT_LINES.stats, NAT_LINES.stats3])'));
        console.log(name, 'edges', data.edges.length, 'Dpx', data.Dpx.toFixed(1), data.band, st);
      }
    }
    await p.context().close();
  }
  console.log('errors', JSON.stringify(errors.filter((x) => !/software WebGL|willReadFrequently/.test(x))));
  await b.close();
})();
