// which provinces the verifier-protocol reader misses at a Far camera (leave one province out, the frame as it is; the same provinces read in sight as the control):
// node readwho.cjs <pagefile|-> <tag> <w> <h> <cams: px@x,y;...> -> per camera, per unexplored province: patches, accuracy as is and in sight, the terrain it is taken for
const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const fs = require('fs');
const file = process.argv[2] && process.argv[2] !== '-' ? process.argv[2] : PAGE, tag = process.argv[3] || 'now', W = Number(process.argv[4] || 1440), H = Number(process.argv[5] || 900), cams = (process.argv[6] || '60@800,500').split(';');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, file, { log, w: W, h: H, settle: 1000 }); const rows = [];
  for (const c of cams) { const [px, xy] = c.split('@'); await ev(p, `m.setScale(${px} / m.ev("MED_DIAM"), ${xy})`); await p.waitForTimeout(1500);
    const r = await mev(p, `(() => { const A = rlVerifierPatches(undefined), S = rlVerifierPatches(null); draw();
      const lopo = (train, test) => { const pred = new Map(); for (const i of new Set(test.map((q) => q.i))) { const tr = train.filter((q) => q.i !== i); if (!tr.length) continue; const P = rlLDA(tr.map((q) => q.f), tr.map((q) => q.t), 7); for (const q of test) if (q.i === i) pred.set(q, P(q.f)); } return pred; };
      const uIds = new Set(A.patches.filter((q) => q.fog === 'unexplored').map((q) => q.i)), pa = lopo(A.patches, A.patches), ps = lopo(S.patches, S.patches.filter((q) => uIds.has(q.i)));
      const per = (pred) => { const o = {}; for (const [q, cl] of pred) { if (!uIds.has(q.i)) continue; const k = names[q.i] + ' (' + terr[q.i] + ')'; const v = o[k] ?? (o[k] = { n: 0, ok: 0, as: {} }); v.n++; if (cl === q.t) v.ok++; else v.as[RL_T[cl]] = (v.as[RL_T[cl]] || 0) + 1; } for (const v of Object.values(o)) v.acc = +(v.ok / v.n).toFixed(2); return o; };
      return { Dpx: +(cam.s * MED_DIAM).toFixed(1), asIs: per(pa), control: per(ps) }; })()`);
    rows.push({ cam: c, ...r }); console.log(tag, c, JSON.stringify(r)); }
  fs.writeFileSync(`${OUT}readwho-${tag}.json`, JSON.stringify(rows, null, 1)); console.log('pageErrors', log.pageErrors.length); await b.close(); })();
