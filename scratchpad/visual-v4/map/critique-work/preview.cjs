// critique preview: fixes 3-6 and 8 patched in memory (the page file is not touched), re-baked, shot and checked
const { launch, open } = require('../tools/lib.cjs');
const OUT = __dirname + '/shots';
const FILE = __dirname + '/../game-screen-v4.html';
const PATCH = String.raw`(() => {
  const rep = (fn, pairs) => { let s = window[fn] ? window[fn].toString() : eval(fn).toString(); for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error(fn + ': missing ' + a.slice(0, 60)); s = s.replace(a, b); } return s; };
  window.RL_SHG = [2.6, 3.6, 1.4, 1.0, 1.0, 2.2, 1.2];
  window.RL_HAIRA = { plains: 0.61, farmland: 0.48, forest: 0.33, hills: 0.46, mountains: 0.53, swamp: 0.48, wasteland: 0.65 };
  const bake = rep('rlBakeGen', [
    ['const hh = new Float32Array(HW * HH), hid', 'const HG = new Float32Array(HW * HH).fill(1), hh = new Float32Array(HW * HH), hid'],
    ['if (ws < 1e-4) { wv[lt] = 1; ws = 1; }', 'if (ws < 1e-4) { wv[lt] = 1; ws = 1; } { let gs = 0; for (let c = 0; c < 7; c++) gs += (wv[c] / ws) * RL_SHG[c]; HG[k] = gs; }'],
    ['let v = rlTanh(3.2 * (s - RL_SIN_EL));', 'let v = rlTanh(3.2 * HG[k] * (s - RL_SIN_EL));'],
    ['d += 3.5 * rlFbm(TD[0], x / (22 * RLK)', 'd += 1.8 * rlFbm(TD[0], x / (22 * RLK)'],
    ['d += [-3, -1, 1, 3][(bid >>> 20) & 3]', 'd += [-1.6, -0.5, 0.5, 1.6][(bid >>> 20) & 3]'],
    ['+ 2 * rlVN(TD[3], x / (2.6 * RLK)', '+ 1 * rlVN(TD[3], x / (2.6 * RLK)'],
  ]);
  const lay = rep('rlLayout', [
    ["if (fog === 'unexplored') { if (!far) { kind = 'hut';", "if (fog === 'unexplored') { if (Dpx >= 100) { kind = 'hut';"],
    ["else if (!far) { kind = 'hamlet';", "else if (Dpx >= 100) { kind = 'hamlet';"],
    ["kind = 'town'; T = rlTownPx(p, Dpx);", "kind = 'town'; T = Math.min(96, rlTownPx(p, Dpx));"],
    ['if (near && p.owner === null && p.indep) { const n = TENTS[strengthWord(p.indep)]', 'if (Dpx >= 300 && p.owner === null && p.indep) { const n = Math.min(2, TENTS[strengthWord(p.indep)])'],
  ]);
  const rails = rep('rlDrawRails', [['g.strokeStyle = rgba(key, RL_P.hairline)', 'g.strokeStyle = rgba(key, RL_HAIRA[terr[lr]])']]);
  const town = rep('rlTown', [
    ["g.fillStyle = 'rgba(78,70,56,.55)'; ellipse(g, x, y - 0.5, rx * 0.84, ry * 0.84); g.fill();", "g.fillStyle = mix(ground, '#7A6A52', 0.6); ellipse(g, x, y - 0.5, rx * 0.8, ry * 0.8); g.fill();"],
    ['hs = Math.max(3, Math.min(11, T * 0.11))', 'hs = Math.max(3, Math.min(16, T * 0.14))'],
  ]);
  const ham = rep('rlHamlet', [['rlHouse(g, x, y, hs * (k === 0 ? 1.1 : 1), p.kitOwner ?? p.owner, !near, ground,', 'rlHouse(g, x, y, hs * (k === 0 ? 1.1 : 1), p.kitOwner ?? p.owner, true, ground,']]);
  const mute = rep('rlMuted', [['<= 2.5) v = c; else', '<= (bandOf(cam.s) === "near" ? 4 : 2.5)) v = c; else'], ['> 2.5) lo = m;', '> (bandOf(cam.s) === "near" ? 4 : 2.5)) lo = m;'], ['const k = c + ground;', 'const k = c + ground + bandOf(cam.s);']]);
  rlBakeGen = eval('(' + bake + ')'); rlLayout = eval('(' + lay + ')'); rlDrawRails = eval('(' + rails + ')'); rlTown = eval('(' + town + ')'); rlHamlet = eval('(' + ham + ')'); rlMuted = eval('(' + mute + ')');
  RL_MUTE.clear(); RB.ready = false; RB.running = false; RB.total = 0; RB.slices = 0; RL_PIECE_CACHE.clear(); RCK = null; rlStartBake(); return 'patched';
})()`;
(async () => {
  const b = await launch(), errors = [];
  const page = await open(b, FILE, 1440, 900, '', errors);
  const mock = (s) => page.evaluate((x) => window.__mock.ev(x), s);
  console.log(await mock(PATCH));
  await page.waitForFunction(() => window.__mock.ev('RB.ready'), null, { timeout: 120000, polling: 250 });
  await mock('rlAfterBake(); RCK = null; draw()'); await page.mouse.move(5, 880); await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/p01-start-preview.png` });
  const fit = await mock('fitScale'), d0 = await mock('rlDpx()');
  for (const [nm, dpx] of [['Tormere', 200], ['Elmgate', 200], ['Kharnath', 420]]) {
    await page.evaluate(([nm, s]) => { const m = window.__mock; const c = m.ev('cent')[m.ev('names').indexOf(nm)]; m.setScale(s, c[0], c[1]); }, [nm, fit * dpx / d0]);
    await page.mouse.move(5, 880); await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/p-${nm}-${dpx}-preview.png`, clip: { x: 17, y: 202, width: 1356, height: 533 } });
  }
  await mock('fitToCloth(); RCK = null; draw()'); await page.waitForTimeout(600);
  const means = await page.evaluate(() => { const v = window.__mock.reliefMeans(); return { worst: v.worstDE, over: v.overBudget, pairs: v.pairs && v.pairs.under2012, keys: Object.keys(v) }; });
  console.log('means after patch', JSON.stringify(means));
  const lay = await page.evaluate(() => { const v = window.__mock.reliefLayout(); return { ll: v.labelOverlaps, lp: v.labelPieceOverlaps, pp: v.pieceOverlaps, out: v.armiesOutsideInset }; });
  console.log('layout after patch', JSON.stringify(lay));
  const rails = await page.evaluate(() => { const v = window.__mock.reliefRails(); return JSON.stringify(v).slice(0, 400); });
  console.log('rails after patch', rails);
  const des = await page.evaluate(() => { const v = window.__mock.reliefDesign(); return JSON.stringify({ esc: v.escarpment, own: v.ownShareMin ?? v.ownShare, glow: v.glow }).slice(0, 900); });
  console.log('design after patch', des);
  console.log('ERRORS', JSON.stringify(errors)); await b.close();
})();
