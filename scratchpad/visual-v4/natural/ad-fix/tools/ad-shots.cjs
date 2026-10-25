// the AD critique's views in the deliverable set (natural/shots, 44 to 49 and 52 to 57): the move's chip at Far and the minimum, Mid 0.75 under the alerts,
// hamlets and the Near detail, the cliff, the Ownership caption after a mode change and 4 s later, the fogged hover card, the bevel at ratio 2
const { launch, open, PAGE, SHOTS, realErrors } = require('./nlib2.cjs');
const ev = (p, s) => p.evaluate((s) => { const m = window.__mock; return eval(s); }, s);
(async () => {
  const b = await launch(), errors = [];
  let p = await open(b, PAGE, { errors, settle: 1800 });
  const shot = async (n, wait = 900, clip) => { await p.waitForTimeout(wait); await p.screenshot({ path: SHOTS + n + '.png', clip }); console.log('shot', n); };
  const pv = await ev(p, 'm.pieceAt("varo")'); await p.mouse.click(pv[0], pv[1]); await p.waitForTimeout(600);
  const tgt = await ev(p, 'm.across()'); let [x, y] = await ev(p, `m.at(${JSON.stringify(tgt)})`); await p.mouse.click(x, y, { button: 'right' }); await p.waitForTimeout(900);
  await p.mouse.move(720, 430); for (let k = 0; k < 12; k++) { await p.mouse.wheel(0, 240); await p.waitForTimeout(80); } await p.mouse.move(200, 880);
  await shot('44-far-after-move', 1500); await ev(p, 'm.setScale(m.minScale(), 800, 500)'); await shot('45-min-after-move');
  await ev(p, 'm.ev("clearSel(); closeAll(); draw()")'); await ev(p, 'm.setScale(0.75, 760, 480)'); await shot('46-mid075');
  await ev(p, 'm.zoomTo(m.maxScale() * 0.85, "Halegate")'); await shot('47-near-hamlets-halegate', 1200);
  await ev(p, 'm.zoomTo(m.maxScale(), "Oakmoor")'); await shot('48-near-max-forest', 1200);
  await ev(p, 'm.setScale(2.0, 500, 1000)'); await shot('49-cliff-near', 1000);
  await ev(p, 'm.ev("fit(); setMode(\'supply\'); draw()")'); await p.waitForTimeout(600); await p.mouse.move(700, 860);
  await p.keyboard.down('Shift'); await p.keyboard.press('Digit1'); await p.keyboard.up('Shift'); await shot('52-ownership-caption-after-mode-change', 500);
  await shot('53-ownership-caption-4s-later', 4300);
  [x, y] = await ev(p, 'm.ev("(() => { const i = provList.find((i) => fogOf(i) === \'unexplored\'); return toScreen(...cent[i]).map((v, k) => v + canvas.getBoundingClientRect()[k ? \'top\' : \'left\']); })()")'); await ev(p, 'm.setScale(0.9, 1350, 450)'); await p.waitForTimeout(600);
  [x, y] = await ev(p, 'm.ev("(() => { const r = canvas.getBoundingClientRect(), v = viewRect(); const i = provList.find((i) => { if (fogOf(i) !== \'unexplored\') return false; const [sx, sy] = toScreen(...cent[i]); return sx > v.l + 60 && sx < v.r - 300 && sy > v.t + 60 && sy < v.b - 60; }); const [sx, sy] = toScreen(...cent[i]); return [sx + r.left - 30, sy + r.top + 25]; })()")');
  await p.mouse.move(x, y); await shot('54-hover-unexplored-card', 1400);
  console.log('tip:', (await p.evaluate(() => [...document.querySelectorAll('.tip')].map((t) => t.innerText).join(' | '))).slice(0, 300));
  await p.context().close();
  p = await open(b, PAGE, { errors, settle: 1800, dpr: 2, reducedMotion: 'reduce' }); await p.mouse.move(700, 880);
  await shot('55-start-dpr2-bevel-crop', 600, { x: 600, y: 150, width: 480, height: 300 });
  await ev(p, 'm.zoomTo(m.maxScale() * 0.85, "Kharnath")'); await shot('56-near-dpr2-detail-crop', 1000, { x: 820, y: 250, width: 420, height: 300 });
  await ev(p, 'm.zoomTo(m.maxScale() * 0.85, "Halegate")'); await shot('57-near-dpr2-hamlet-crop', 1000, { x: 520, y: 360, width: 400, height: 240 });
  console.log('errors', JSON.stringify(realErrors(errors))); await b.close();
})();
