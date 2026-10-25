// node capture.cjs <build> <session>   sessions: desk (1440x900 views), phone (390x844 dpr2), modes (clear, terrain, supply at start)
// writes shots/<build>-<view>.png and out/dump/<build>-<view>-{land,lines,meta}.bin + .json (meta: R province idx (255 none), G flags 2 model 4 wild)
const { launch, open, ev, mev, ME } = require('./lib.cjs'); const fs = require('fs');
const build = process.argv[2], sess = process.argv[3] || 'desk';
const S = (s, x, y) => `m.setScale(${s}, ${x}, ${y})`, MAX = (k, x, y) => `m.setScale(m.maxScale() * ${k}, ${x}, ${y})`, FIT = 'm.ev("fit(); draw()")';
const SESS = {
  desk: { w: 1440, h: 900, dpr: 1, views: [['start', null], ['far', S('m.minScale()', 800, 500)], ['mid', S(1.0, 640, 480)], ['ref', S(1.142, 700, 560)], ['ash', MAX(0.55, 560, 230)], ['grey', MAX(0.6, 640, 640)], ['mere', MAX(0.6, 900, 560)], ['ashmax', MAX(1, 600, 240)], ['greymax', MAX(1, 640, 700)], ['meremax', MAX(1, 900, 600)]] },
  phone: { w: 390, h: 844, dpr: 2, views: [['phone-start', null], ['phone-fit', FIT], ['phone-mid-ash', S(1.0, 560, 260)], ['phone-mid-grey', S(1.0, 640, 600)], ['phone-near-ash', MAX(0.6, 560, 240)]] },
  modes: { w: 1440, h: 900, dpr: 1, views: [['supply', 'm.ev("setMode(\'supply\')")']], nodump: true },
};
const IN = String.raw`(() => {
  const b64 = (u8) => { let s = ''; const C = 0x8000; for (let k = 0; k < u8.length; k += C) s += String.fromCharCode.apply(null, u8.subarray(k, k + C)); return btoa(s); };
  const redraw = (skip) => { const was = new Set(SKIP); for (const k of skip) SKIP.add(k); RCK = null; draw(); const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data.slice(); SKIP.clear(); for (const k of was) SKIP.add(k); RCK = null; draw(); return d; };
  const W2 = canvas.width, H2 = canvas.height, { BW, TX, id } = RB;
  const land = redraw(['rails', 'pieces', 'labels', 'badges', 'arrows']), lines = redraw(['pieces', 'labels', 'badges', 'arrows']);
  const meta = new Uint8Array(W2 * H2 * 4);
  for (let Y = 0; Y < H2; Y++) for (let X = 0; X < W2; X++) { const k = Y * W2 + X, [x, y] = toWorld((X + 0.5) / dpr, (Y + 0.5) / dpr); let i = 255, f = 0; if (x >= 0 && y >= 0 && x < W && y < H && inModel(x, y)) { f |= 2; const tx = Math.floor(x * TX), ty = Math.floor(y * TX); i = id[ty * BW + tx]; if (i == null || i === 255) i = 255; else if (isWild(i)) f |= 4; } meta[k * 4] = i; meta[k * 4 + 1] = f; meta[k * 4 + 3] = 255; }
  const outl = WILDS.map((w) => ({ id: w.id, kind: w.kind, cells: w.cells, edges: rlWildOutline(w).map((e) => { const [ax, ay] = e.a, [bx, by] = e.b, L = Math.hypot(bx - ax, by - ay); let nx = -(by - ay) / L, ny = (bx - ax) / L; if (provinceAt((ax + bx) / 2 + nx * 3, (ay + by) / 2 + ny * 3) !== e.j) { nx = -nx; ny = -ny; } return { a: toScreen(ax, ay).map((v) => v * dpr), b: toScreen(bx, by).map((v) => v * dpr), n: [nx, ny], j: e.j, nb: e.j >= 0 ? names[e.j] : null, nbT: e.j >= 0 ? terr[e.j] : null, nbWild: e.j >= 0 && !!isWild(e.j) }; }) }));
  const P = provList.map((i) => ({ i, name: names[i], terrain: terr[i], wild: !!isWild(i), owner: prov[i].owner || '', fog: fogOf(i) || '' }));
  const cr = canvas.getBoundingClientRect();
  return { info: { canvasRect: [cr.left, cr.top, cr.width, cr.height], W2, H2, dpr, s: cam.s, Dpx: cam.s * MED_DIAM * dpr, D: MED_DIAM, band: bandOf(cam.s), look: rlShownLook() }, provs: P, wilds: outl, land: b64(new Uint8Array(land.buffer)), lines: b64(new Uint8Array(lines.buffer)), meta: b64(meta) };
})()`;
(async () => {
  const C = SESS[sess], b = await launch(), log = { pageErrors: [], console: [] }; const D = ME + 'out/dump/'; fs.mkdirSync(D, { recursive: true });
  const p = await open(b, build, { log, dpr: C.dpr, w: C.w, h: C.h }); console.log(build, sess, 'ready ms', p.__readyMs);
  await p.mouse.move(C.w / 2, C.h - 4);
  for (const [v, src] of C.views) {
    if (src === 'CLEAR') { await mev(p, "setMode('ownership')"); await ev(p, 'm.ev("view.terrain = \'clear\'; RCK = null; draw()")').catch(() => {}); }
    else if (src === 'TERRAIN') { await mev(p, "setMode('terrain')"); }
    else if (src) await ev(p, src);
    if (src === 'TERRAIN' || src === 'CLEAR') { await p.waitForTimeout(800); await p.waitForFunction(() => window.__mock.reliefReady(), null, { timeout: 300000, polling: 300 }); }
    await p.waitForTimeout(2500);
    await p.screenshot({ path: `${ME}shots/${build}-${v}.png` });
    if (!C.nodump) { const r = await mev(p, IN); const tag = `${build}-${v}`; for (const k of ['land', 'lines', 'meta']) { fs.writeFileSync(`${D}${tag}-${k}.bin`, Buffer.from(r[k], 'base64')); delete r[k]; } fs.writeFileSync(`${D}${tag}.json`, JSON.stringify(r)); console.log('dumped', tag, r.info.band, r.info.Dpx.toFixed(1)); }
    else console.log('shot', v);
  }
  console.log(build, sess, 'pageErrors', log.pageErrors.length, JSON.stringify(log.pageErrors.slice(0, 3)), 'consoleErrors', log.console.length);
  await b.close();
})();
