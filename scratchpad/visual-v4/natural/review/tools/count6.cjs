const { launch, open, PAGE, injectNatural, view } = require('../../tools/natpage.cjs');
const fs = require('fs');
const Q = `(() => { const r = { edges: 0, segs: 0, partner: 0, light: 0, dark: 0, intEdges: 0, intSegs: 0, intPartner: 0, designFlipEdges: 0 };
  for (const [, e] of EDGE) { const i = e.i, j = e.j; if (isWild(i) || isWild(j)) continue; const oi = prov[i].owner, oj = prov[j].owner;
    if (!oi && !oj) { const v = NAT_LINES.segStyles3(e); r.edges++; r.segs += v.length; r.partner += v.filter((x) => x.partner).length; r[v[0].key]++; const d = NAT_LINES.segStyles(e, 'hair'); let f = 0; for (let s = 1; s < d.length; s++) if ((d[s].ok ? d[s].key : 'p') !== (d[s - 1].ok ? d[s - 1].key : 'p')) f++; if (f) r.designFlipEdges++; }
    else if (oi && oi === oj) { const v = NAT_LINES.intStyles(e); r.intEdges++; r.intSegs += v.length; r.intPartner += v.filter((x) => x.partner).length; } }
  return r; })()`;
(async () => { const b = await launch(), er = []; const p = await open(b, PAGE, 1440, 900, '', er, { settle: 1500 });
  await p.evaluate((s) => window.__mock.ev(s), fs.readFileSync(__dirname + '/patches6.js', 'utf8'));
  for (const look of ['clear', 'natural']) {
    if (look === 'natural') { await injectNatural(p); await p.evaluate(() => window.__mock.ev("window.__natLook = 'natural'; window.__fogAware = 1; RL_P.hemPeak = 0.12; NAT_LINES.cache.clear(); RCK = null; draw(); 0")); }
    for (const [tag, src] of [['start', 'm.ev("fitToCloth()")'], ['mid', 'm.setScale(1.0, 640, 480)']]) { await view(p, src, 1200); console.log(look, tag, JSON.stringify(await p.evaluate((s) => window.__mock.ev(s), Q))); }
  }
  await b.close(); })();
