// the natural bake (RGBA), the texel province ids and land types, for the judge's footprint comparison against pass 2: node bake.cjs <page>  -> out/bake/<page>-{img,id,lt}.bin, .json
const { launch, open, ev, mev, page, OUT } = require('./lib.cjs'); const fs = require('fs');
const PN = process.argv[2]; const D = OUT + 'bake/'; fs.mkdirSync(D, { recursive: true });
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, page(PN), { log, settle: 800 });
  const cdp = await p.context().newCDPSession(p); await cdp.send('HeapProfiler.collectGarbage'); const heap = await cdp.send('Runtime.getHeapUsage');
  const r = await mev(p, `(() => { const b64 = (u8) => { let s = ''; const C = 0x8000; for (let k = 0; k < u8.length; k += C) s += String.fromCharCode.apply(null, u8.subarray(k, k + C)); return btoa(s); };
    const { BW, BH, TX, id, LT } = RB; const wild = [...Array(N).keys()].filter((i) => isWild(i)); const wildNames = Object.fromEntries(wild.map((i) => [i, names[i]]));
    const seen = new Set(), cv = [], ta = {}; let cvB = 0, taB = 0; const walk = (o, path, dep) => { if (!o || typeof o !== 'object' || seen.has(o) || dep > 5) return; seen.add(o);
      if (o.getContext && o.width) { cv.push([path, o.width, o.height]); cvB += o.width * o.height * 4; return; } if (o instanceof ImageData) { if (!seen.has(o.data.buffer)) { seen.add(o.data.buffer); taB += o.data.byteLength; ta[path] = o.data.byteLength; } return; }
      if (ArrayBuffer.isView(o)) { if (!seen.has(o.buffer)) { seen.add(o.buffer); taB += o.buffer.byteLength; if (o.buffer.byteLength > 500000) ta[path] = o.buffer.byteLength; } return; }
      if (o instanceof Map) { for (const [k, v] of o) walk(v, path + '[' + String(k).slice(0, 12) + ']', dep + 1); return; } if (Array.isArray(o) && o.length > 200) return; for (const k of Object.keys(o)) walk(o[k], path + '.' + k, dep + 1); };
    walk(RB, 'RB', 0); const cvBig = cv.filter((c) => c[1] * c[2] > 250000);
    return { BW, BH, TX, RLD, wild, wildNames, terr: terr.slice(), names: names.slice(), img: b64(new Uint8Array(RB.L.natural.img.data.buffer)), id: b64(new Uint8Array(id.buffer, id.byteOffset, id.byteLength)), lt: b64(new Uint8Array(LT.buffer, LT.byteOffset, LT.byteLength)), times: window.__mock.reliefTimes(), mem: window.__mock.reliefMemory(), canvases: cvBig, canvasMB: +(cvB / 1048576).toFixed(1), typedMB: +(taB / 1048576).toFixed(1), bigTyped: Object.fromEntries(Object.entries(ta).filter(([, b]) => b > 2000000).map(([k, b]) => [k, +(b / 1048576).toFixed(1)])) }; })()`);
  for (const k of ['img', 'id', 'lt']) { fs.writeFileSync(`${D}${PN}-${k}.bin`, Buffer.from(r[k], 'base64')); delete r[k]; }
  r.heapUsedMB = +(heap.usedSize / 1048576).toFixed(1); r.heapTotalMB = +(heap.totalSize / 1048576).toFixed(1); r.pageErrors = log.pageErrors.length;
  fs.writeFileSync(`${D}${PN}.json`, JSON.stringify(r)); console.log(PN, r.BW, r.BH, r.TX, 'heap', r.heapUsedMB, 'MB', 'RB canvases MB', r.canvasMB, 'RB typed MB', r.typedMB, JSON.stringify(r.bigTyped), 'big canvases', JSON.stringify(r.canvases).slice(0, 800)); await b.close();
})();
