// the critique's "done when" measures for fixes 1, 2, 4, 7 and 8 (fixes 3, 5, 6: checks.cjs, rimtune.cjs, labels.cjs)
const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs'); const fs = require('fs');
const PR = fs.readFileSync(__dirname + '/ad-adprobe.js', 'utf8');
const set = (expr) => `m.ev(${JSON.stringify(expr + '; clampCam(); RCK = null; draw()')})`;
const atWild = (kind, s) => set(`const w = WILDS.find(q => q.kind === '${kind}'); const c = wgeo(w).labelAt; const v = viewRect(); cam.s = ${s}; cam.x = (v.l+v.r)/2 - cent[c][0]*cam.s; cam.y = (v.t+v.b)/2 - cent[c][1]*cam.s`);
const STEP = String.raw`(() => { const cv = rlFarRaster(), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, { QW, QH } = RB, id4 = RL_FR.id4, steps = [];
  const at = (x, y) => { const qx = Math.floor(x * RB.TX / 4), qy = Math.floor(y * RB.TX / 4); if (qx < 0 || qy < 0 || qx >= QW || qy >= QH) return null; const k = qy * QW + qx; return id4[k] === 255 ? null : d[k * 4]; };
  for (const [, e] of EDGE) { if (isWild(e.i) || isWild(e.j)) continue; const L = Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1]), nx = -(e.b[1] - e.a[1]) / L, ny = (e.b[0] - e.a[0]) / L, o = 3 * 4 / RB.TX, S = [];
    for (const t of [0.25, 0.5, 0.75]) { const x = e.a[0] + (e.b[0] - e.a[0]) * t, y = e.a[1] + (e.b[1] - e.a[1]) * t, p = at(x + nx * o, y + ny * o), q = at(x - nx * o, y - ny * o), p2 = at(x + nx * 2 * o, y + ny * 2 * o), q2 = at(x - nx * 2 * o, y - ny * 2 * o); if (p == null || q == null || p2 == null || q2 == null) continue; S.push(Math.abs((p - q) - ((p2 - p) + (q - q2)) / 2)); }
    if (S.length) { S.sort((a, b) => a - b); steps.push(S[S.length >> 1]); } }
  steps.sort((a, b) => a - b); const q = (f) => steps[Math.min(steps.length - 1, Math.floor(f * steps.length))]; return { edges: steps.length, p50: q(0.5), p90: q(0.9), max: q(1), over8: steps.filter((x) => x > 8).length }; })()`;
const FACE = String.raw`(() => { const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data, W2 = canvas.width, Ls = []; const [x0] = toScreen(RL_RC * 1.2, H), [x1] = toScreen(W - RL_RC * 1.2, H), [, y0] = toScreen(0, H), [, y1] = toScreen(0, H + RL_FACE - RL_PLINTH);
  for (let y = Math.ceil((y0 + 1) * dpr); y < Math.floor((y1 - 1) * dpr); y++) for (let x = Math.ceil(x0 * dpr); x < Math.floor(x1 * dpr); x += 2) { const k = (y * W2 + x) * 4; Ls.push(rgb2lab([d[k], d[k + 1], d[k + 2]])[0]); }
  Ls.sort((a, b) => a - b); const q = (f) => +Ls[Math.min(Ls.length - 1, Math.floor(f * Ls.length))].toFixed(1); return { px: Ls.length, p5: q(0.05), p50: q(0.5), p95: q(0.95), spread: +(q(0.95) - q(0.05)).toFixed(1) }; })()`;
const LIP = String.raw`(() => { const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data, W2 = canvas.width, out = {}; // mean L* of the 1.5 px just inside each side's edge, against 4 to 6 px in
  const side = (name, pts) => { let a = 0, b = 0, n = 0; for (const [wx, wy, ix, iy] of pts) { const [sx, sy] = toScreen(wx, wy), p = (o) => { const X = Math.floor((sx + ix * o) * dpr), Y = Math.floor((sy + iy * o) * dpr), k = (Y * W2 + X) * 4; return rgb2lab([d[k], d[k + 1], d[k + 2]])[0]; }; a += p(0.8); b += (p(4) + p(5) + p(6)) / 3; n++; } out[name] = { lip: +(a / n).toFixed(1), inside: +(b / n).toFixed(1), dL: +((a - b) / n).toFixed(1) }; };
  const N = 40, xs = [...Array(N).keys()].map((k) => RL_RC + (W - 2 * RL_RC) * (k + 0.5) / N), ys = [...Array(N).keys()].map((k) => RL_RC + (H - 2 * RL_RC) * (k + 0.5) / N);
  side('north', xs.map((x) => [x, 0, 0, 1])); side('south', xs.map((x) => [x, H, 0, -1])); side('west', ys.map((y) => [0, y, 1, 0])); side('east', ys.map((y) => [W, y, -1, 0])); return out; })()`;
const MERE = String.raw`(() => { const w = WILDS.find((q) => q.kind === 'mere'), N = RB.nw, { HW, HH, TX } = RB, T2 = TX / 2; let n = 0, near = 0; // along the outline every 2 units: the first water (F > 0.5) inward within 0.02 D
  for (const e of rlWildOutline(w)) { const L = Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1]); let nx = -(e.b[1] - e.a[1]) / L, ny = (e.b[0] - e.a[0]) / L; const mx = (e.a[0] + e.b[0]) / 2, my = (e.a[1] + e.b[1]) / 2; if (!w.cells.includes(provinceAt(mx + nx * 3, my + ny * 3))) { nx = -nx; ny = -ny; }
    for (let t = 1; t < L - 1; t += 2) { const x = e.a[0] + (e.b[0] - e.a[0]) * t / L, y = e.a[1] + (e.b[1] - e.a[1]) * t / L; n++; for (let o = 0.5; o <= 0.02 * RLD; o += 0.5) if (rlBilin(N.F, HW, HH, (x + nx * o) * T2, (y + ny * o) * T2) > 0.5) { near++; break; } } }
  return { samples: n, waterWithin002D: +(near / n).toFixed(3) }; })()`;
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] }, p = await open(b, PAGE, { log, settle: 1000 }); await mev(p, PR); await p.mouse.move(720, 894); const out = {};
  const sum = (r) => ({ patch: r.normal.lightness.patchAcc, prov: r.normal.lightness.provinceAcc, unexPatch: r.normal.unexplored.patchAcc, unexProv: r.normal.unexplored.provinceAcc, missed: [...new Set([...r.normal.lightness.missed, ...r.normal.unexplored.missed])] });
  out.wildLook = await ev(p, 'm.reliefWildLook()');
  await ev(p, 'm.ev("fit(); draw()")'); await p.waitForTimeout(700); out.hfStart = await p.evaluate(() => window.__ad.hfCores());
  await ev(p, 'm.zoomTo(1.142, "Ashmoor")'); await p.waitForTimeout(700); out.hfRef = await p.evaluate(() => window.__ad.hfCores());
  await ev(p, 'm.setScale(m.minScale(), 800, 500)'); await p.waitForTimeout(800); out.min = { readers: sum(await ev(p, 'm.reliefNatural(true).readers')), steps: await p.evaluate(() => window.__ad.edgeSteps()), raster: await mev(p, STEP), face: await mev(p, FACE), lip: await mev(p, LIP) };
  await ev(p, 'm.skip("farRelief", true)'); out.minNoRelief = { readers: sum(await ev(p, 'm.reliefNatural(true).readers')), steps: await p.evaluate(() => window.__ad.edgeSteps()) }; await ev(p, 'm.skip("farRelief", false)');
  await ev(p, 'm.setScale((m.minScale() + m.fitScale()) / 2, 800, 500)'); await p.waitForTimeout(800); out.face69 = await mev(p, FACE);
  for (const [tag, src] of [['maxAsh', atWild('peaks', 'maxScale')], ['maxMere', atWild('mere', 'maxScale')]]) { await ev(p, src); await p.waitForTimeout(900); out[tag] = { sharp: await p.evaluate(() => window.__ad.wildSharp()), nd: await mev(p, '({ ms: RL_ND.ms, px: RL_ND.px })') }; }
  out.mere = await mev(p, MERE);
  out.pageErrors = log.pageErrors; console.log(JSON.stringify(out, null, 1)); fs.writeFileSync(OUT + 'final-' + (process.argv[2] || 'now') + '.json', JSON.stringify(out, null, 1)); await b.close();
})();
