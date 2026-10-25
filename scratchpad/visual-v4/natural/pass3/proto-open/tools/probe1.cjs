const { launch, open, ev, mev, PAGE } = require('./lib.cjs');
(async () => { const b = await launch(), log = { pageErrors: [], console: [], requests: [] }; const p = await open(b, process.env.PAGEFILE || PAGE, { log, settle: 300 });
  const r = await mev(p, `(() => { const { HW, HH, hid, nw } = RB, out = {}; const byP = {}; for (let k = 0; k < HW * HH; k++) { const o = hid[k]; if (o === 255 || isWild(o)) continue; if (nw.F[k] > 0.001) { const n = names[o] + ':' + terr[o]; byP[n] = (byP[n] || 0) + 1; } }
    out.spillHalfTexelsByProv = byP; out.boxes = (RB.nwBox || []).map(B => ({ w: B.w.name, bw: B.bw, bh: B.bh, E: B.E ? [...B.E].filter(v => v > 0.5).length : null, SDin: B.SD ? [...B.SD].filter(v => v > 0).length : null })); out.nw2 = (RB.nw2||[]).map(q => [q.kind, q.cv.width, q.cv.height]); out.cap = RB.nwCap; return out; })()`);
  console.log(JSON.stringify(r, null, 1)); console.log('errors', log.pageErrors); await b.close(); })();
