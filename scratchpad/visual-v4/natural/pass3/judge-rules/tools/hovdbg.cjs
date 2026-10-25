// where a hover-induced wild edge failure sits: node hovdbg.cjs <page> <view: start|mid> "<Wild/Neighbour>"  -> shots/hovdbg-<page>-<view>-{rest,hover}.png + failing sample positions
const { launch, open, ev, mev, page, SHOTS } = require('./lib.cjs');
const PN = process.argv[2], V = process.argv[3], KEY = process.argv[4], PRE = process.argv[5] || '';
const WC = `(() => { const o = {}; for (const w of WILDS) { let x = 0, y = 0; for (const c of w.cells) { x += cent[c][0]; y += cent[c][1]; } o[w.kind === 'mere' ? 'mere' : w.name.includes('Ash') ? 'ash' : 'grey'] = [x / w.cells.length, y / w.cells.length]; } return o; })()`;
const FAILS = `(() => { const d = rlRedraw(['pieces', 'labels', 'badges', 'arrows']), W2 = canvas.width, H2 = canvas.height, v = viewRect(), ok = (q) => q.normal >= 20 && q.cvd >= 12;
  const px = (sx, sy) => { const X = Math.floor(sx * dpr), Y = Math.floor(sy * dpr); if (X < 0 || Y < 0 || X >= W2 || Y >= H2) return null; const k = (Y * W2 + X) * 4; return [d[k], d[k + 1], d[k + 2]]; };
  const med = (a) => { const s2 = a.filter(Boolean).sort((p, q) => rlL(...p) - rlL(...q)); return s2[s2.length >> 1]; }; const out = []; let n = 0;
  for (const w of WILDS) for (const e of rlWildOutline(w)) { const [ax, ay] = toScreen(...e.a), [bx, by] = toScreen(...e.b), Lg = Math.hypot(bx - ax, by - ay); if (Lg < 12) continue; let nx = -(by - ay) / Lg, ny = (bx - ax) / Lg;
    const [mx, my] = [(ax + bx) / 2, (ay + by) / 2]; if (provinceAt(...toWorld(mx + nx * 8, my + ny * 8)) !== e.j) { nx = -nx; ny = -ny; }
    for (let s = 6; s < Lg - 6; s += 4) { const sx = ax + ((bx - ax) * s) / Lg, sy = ay + ((by - ay) * s) / Lg; if (sx < v.l + 12 || sx > v.r - 12 || sy < v.t + 12 || sy > v.b - 12) continue;
      if (!inModel(...toWorld(sx + nx * 10, sy + ny * 10)) || provinceAt(...toWorld(sx + nx * 8, sy + ny * 8)) !== e.j) continue;
      const Wg = med([6, 7, 8, 9].map((o) => px(sx - nx * o, sy - ny * o))), G = med([6, 7, 8, 9, 9.5].map((o) => px(sx + nx * o, sy + ny * o))); if (!Wg || !G) continue; n++;
      let pass = ok(rlPairDE(Wg, G)); const K = []; for (let o = -4; o <= 4; o += 0.5) { const c = px(sx + nx * o, sy + ny * o); if (c) K.push(rgb2hex(c)); if (!pass && c) { const a = rlPairDE(c, Wg), b = rlPairDE(c, G); if (ok(a) && ok(b)) pass = true; } }
      if (!pass) out.push({ at: w.name + '/' + names[e.j], sx: +sx.toFixed(1), sy: +sy.toFixed(1), W: rgb2hex(Wg), G: rgb2hex(G), line: K.join(' ') }); } }
  return { n, fails: out, hover: hoverProv, rimKey: (typeof RL_WRIM !== 'undefined' ? String(RL_WRIM.key).slice(0, 60) : null), rck: typeof RCK !== 'undefined' && RCK ? String(RCK.key || '').slice(0, 80) : null }; })()`;
(async () => {
  const b = await launch(), log = { pageErrors: [], console: [], requests: [] };
  const p = await open(b, page(PN), { log, settle: 1500, reducedMotion: 'reduce' }); await p.mouse.move(720, 896);
  const wc = await mev(p, WC);
  await ev(p, V === 'mid' ? `m.setScale(1.0, ${(wc.grey[0] + wc.mere[0]) / 2}, ${(wc.grey[1] + wc.mere[1]) / 2 - 40})` : 'm.ev("fit(); draw()")'); await p.waitForTimeout(1800);
  const rest = await mev(p, FAILS); console.log('rest', JSON.stringify(rest).slice(0, 900)); await p.screenshot({ path: `${SHOTS}hovdbg-${PN}-${V}-rest.png` });
  const ptOf = (key) => mev(p, `(() => { const r = canvas.getBoundingClientRect(); for (const w of WILDS) for (const e of rlWildOutline(w)) { if (w.name + '/' + names[e.j] !== ${JSON.stringify(key)}) continue; const [ax, ay] = toScreen(...e.a), [bx, by] = toScreen(...e.b), L = Math.hypot(bx - ax, by - ay); if (L < 30) continue;
    let nx = -(by - ay) / L, ny = (bx - ax) / L; const mx = (ax + bx) / 2, my = (ay + by) / 2; if (provinceAt(...toWorld(mx + nx * 8, my + ny * 8)) !== e.j) { nx = -nx; ny = -ny; } const x = mx + nx * 14, y = my + ny * 14; return { x, y, cx: r.left + x * r.width / W, cy: r.top + y * r.height / H }; } return null; })()`);
  if (PRE) { const q0 = await ptOf(PRE); await p.mouse.move(q0.cx, q0.cy); await p.waitForTimeout(450); await p.mouse.click(q0.cx, q0.cy); await p.waitForTimeout(700); console.log('pre-selected', await mev(p, 'state.sel && state.sel.id')); await mev(p, 'state.sel = null; draw()'); await p.mouse.move(720, 896); await p.waitForTimeout(300); const mid = await mev(p, FAILS); console.log('after deselect', JSON.stringify(mid).slice(0, 600)); }
  const q = await ptOf(KEY);
  await p.mouse.move(q.cx, q.cy); await p.waitForTimeout(600);
  const hov = await mev(p, FAILS); console.log('hover', JSON.stringify(hov).slice(0, 1500)); await p.screenshot({ path: `${SHOTS}hovdbg-${PN}-${V}-hover.png` });
  console.log('pageErrors', log.pageErrors.length); await b.close();
})();
