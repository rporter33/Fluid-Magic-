// dumps rendered layers (raw RGBA, device px) with geometry, for the verifier's own colour and texture measurements
// node dump.cjs <natural|clear|terrain> <dpr> <view,view,...>   ->  out/dump/<look>-dpr<d>-<view>-{land,lines,full,meta}.bin, .json, -shot.png
const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const fs = require('fs');
const look = process.argv[2] || 'natural', dpr = Number(process.argv[3] || 1), want = (process.argv[4] || 'start').split(','), W = Number(process.env.W || 1440), H = Number(process.env.H || 900);
const D = OUT + 'dump/'; fs.mkdirSync(D, { recursive: true });
const VIEWS = { start: null, mid: 'm.setScale(1.0, 640, 480)', midE: 'm.setScale(1.0, 1100, 500)', midSW: 'm.setScale(1.0, 420, 760)', midNE: 'm.setScale(1.0, 1200, 250)', midNW: 'm.setScale(1.0, 380, 260)', midSE: 'm.setScale(1.0, 1180, 760)', mid75: 'm.setScale(0.75, 800, 500)',
  ref: 'm.setScale(1.142, 700, 560)', refW: 'm.setScale(1.142, 300, 470)', nearW: 'm.setScale(m.maxScale() * 0.9, 300, 470)', nearC: 'm.setScale(m.maxScale() * 0.9, 260, 640)', nearE: 'm.setScale(m.maxScale() * 0.9, 1300, 400)', nearS: 'm.setScale(m.maxScale() * 0.8, 900, 800)', far: 'm.setScale(m.minScale(), 800, 500)', m40: 'm.ev("fit(); draw()"); m.setMonth(40)', m40mid: 'm.setScale(1.0, 900, 500)' };
const IN = String.raw`(() => {
  const b64 = (u8) => { let s = ''; const C = 0x8000; for (let k = 0; k < u8.length; k += C) s += String.fromCharCode.apply(null, u8.subarray(k, k + C)); return btoa(s); };
  const redraw = (skip) => { const was = new Set(SKIP); for (const k of skip) SKIP.add(k); RCK = null; draw(); const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data.slice(); SKIP.clear(); for (const k of was) SKIP.add(k); RCK = null; draw(); return d; };
  const W2 = canvas.width, H2 = canvas.height, { BW, BH, TX, id } = RB;
  const land = redraw(['rails', 'pieces', 'labels', 'badges', 'arrows']), lines = redraw(['pieces', 'labels', 'badges', 'arrows']), full = redraw([]);
  // meta: R province index (255 none), G flags (1 water, 2 in model, 4 wild), B terrain index (RL_T; 9 none)
  const wm = makeCanvas(W2, H2), wg = wm.getContext('2d', { willReadFrequently: true }); worldT(wg); wg.fillStyle = '#fff'; wg.strokeStyle = '#fff'; wg.lineCap = 'round';
  for (const L of [...RB.water.lakes, ...RB.water.ponds]) { wg.beginPath(); L.P.forEach(([x, y], k) => (k ? wg.lineTo(x, y) : wg.moveTo(x, y))); wg.closePath(); wg.fill(); wg.lineWidth = 6 * RLK; wg.stroke(); }
  for (const s of RB.water.streams) { wg.lineWidth = 2 * (s.w1 + 3 * RLK); wg.beginPath(); s.pts.forEach(([x, y], k) => (k ? wg.lineTo(x, y) : wg.moveTo(x, y))); wg.stroke(); }
  const wd = wg.getImageData(0, 0, W2, H2).data, meta = new Uint8Array(W2 * H2 * 4);
  for (let Y = 0; Y < H2; Y++) for (let X = 0; X < W2; X++) { const k = Y * W2 + X, [x, y] = toWorld((X + 0.5) / dpr, (Y + 0.5) / dpr); let i = 255, f = 0, t = 9; if (x >= 0 && y >= 0 && x < W && y < H && inModel(x, y)) { f |= 2; const tx = Math.floor(x * TX), ty = Math.floor(y * TX); if (tx < BW && ty < BH) i = id[ty * BW + tx]; if (i !== 255) { t = RL_TI[terr[i]] ?? 9; if (isWild(i)) f |= 4; } } if (wd[k * 4 + 3] > 0) f |= 1; meta[k * 4] = i; meta[k * 4 + 1] = f; meta[k * 4 + 2] = t; meta[k * 4 + 3] = 255; }
  const v = viewRect(), P = provList.map((i) => ({ i, name: names[i], terrain: terr[i], fog: fogOf(i) || '', owner: prov[i].owner || '', wild: !!isWild(i), c: toScreen(...cent[i]), bb: geo(i).bb.map((q, j) => (j % 2 ? q * cam.s + cam.y : q * cam.s + cam.x)) }));
  const wilds = [...Array(N).keys()].filter((i) => isWild(i));
  const E = []; for (const [, e] of EDGE) { const oi = prov[e.i] ? prov[e.i].owner : null, oj = prov[e.j] ? prov[e.j].owner : null; E.push({ i: e.i, j: e.j, a: toScreen(...e.a), b: toScreen(...e.b), wild: !!(isWild(e.i) || isWild(e.j)), type: isWild(e.i) || isWild(e.j) ? 'wild' : oi && oj && oi !== oj ? 'realm2' : (!!oi !== !!oj) ? 'realm1' : oi && oi === oj ? 'internal' : 'neutral', fogI: fogOf(e.i) || '', fogJ: fogOf(e.j) || '' }); }
  const RE = []; for (const i of provList) { if (!prov[i].owner) continue; for (const e of RL_EDGES[i]) { if (!isRealmEdge(i, e)) continue; RE.push({ i, j: e.j, a: toScreen(...e.a), b: toScreen(...e.b), nx: e.nx, ny: e.ny, len: e.len * cam.s, owner: prov[i].owner, fog: !!(fogOf(i) && fogOf(e.j)) }); } }
  const lay = RL_PIECE_CACHE.get('L'), kk = lay ? cam.s / lay.s : 1, seats = lay ? [...lay.seats].filter(([, st]) => st.kind && st.box).map(([i, st]) => ({ i, kind: st.kind, box: st.box.map((q, j) => q * kk + (j % 2 ? cam.y : cam.x)) })) : [];
  const cr = canvas.getBoundingClientRect(); return { info: { canvasRect: [cr.left, cr.top, cr.width, cr.height], W2, H2, dpr, s: cam.s, Dpx: cam.s * MED_DIAM, band: bandOf(cam.s), look: rlShownLook(), mode: state.mode, view: v, RT: RL_T, snow: RL_C.snow, rail: rlW(), month: typeof month !== 'undefined' ? month : null }, provs: P, wilds, edges: E, realmEdges: RE, seats,
    land: b64(new Uint8Array(land.buffer)), lines: b64(new Uint8Array(lines.buffer)), full: b64(new Uint8Array(full.buffer)), meta: b64(meta) };
})()`;
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, process.env.PAGEFILE || PAGE, { log, dpr, w: W, h: H, settle: 1500, q: look === 'clear' ? '?terrain=clear' : '' }); await p.mouse.move(W / 2, H - 6);
  if (look === 'terrain') { await mev(p, "setMode('terrain')"); await p.waitForFunction(() => window.__mock.look().clear, null, { timeout: 240000, polling: 300 }); await p.waitForTimeout(1500); }
  for (const v of want) {
    if (VIEWS[v]) await ev(p, VIEWS[v]); else if (v !== 'start') { await ev(p, 'm.ev("fit(); draw()")'); }
    await p.waitForTimeout(2200); const tag = `${process.env.TAGP || ""}${look}-dpr${dpr}-${W}x${H}-${v}`;
    await p.screenshot({ path: `${D}${tag}-shot.png` });
    const r = await mev(p, IN);
    for (const k of ['land', 'lines', 'full', 'meta']) { fs.writeFileSync(`${D}${tag}-${k}.bin`, Buffer.from(r[k], 'base64')); delete r[k]; }
    fs.writeFileSync(`${D}${tag}.json`, JSON.stringify(r)); console.log('dumped', tag, r.info.band, r.info.Dpx.toFixed(1), r.edges.length, r.realmEdges.length);
  }
  console.log('pageErrors', log.pageErrors.length); await b.close();
})();
