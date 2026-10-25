// Shoots crops of ../pilot/ad/formation-test-ad.html for the owner's review page (pilot-review.html), at
// devicePixelRatio 2, labels hidden: each block centred on its own, at play zoom (a man 28 px) and at the closest
// zoom (a man 72 px), plus the 'motion' rows as frame sequences for animated WebP.
// Usage: node review_shoot.cjs OUTDIR
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const fs = require('fs');
const PAGE = path.resolve(__dirname, '..', 'pilot', 'ad', 'formation-test-ad.html');
const PIXI = '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js';

// world offsets from ad_scene.js (relative to the battle's centre)
const COLX = [-540, -270, 0, 270, 540], TX = [-405, -135, 135, 405];
const ROWY = { wolves: -310, far: -160, near: 0, thorn: 135, sal: 305, mfar: -150, mnear: 40 };
const SX = { backOld: -470, backFix: -200, man: -75, frontFix: 90, proc: 400 };
const PLAY = 1, CLOSE = 72 / 28;
// [name, preset (tier and rows), X, Y (visual centre), zoom, crop w, crop h] in CSS px
const SHOTS = [];
const add = (n, p, X, Y, z, w, h) => SHOTS.push({ n, p, X, Y, z, w, h });
for (const [row, pre, ys] of [['near', 'close-near', ROWY.near], ['far', 'close-far', ROWY.far]]) {
  [0, 1, 2, 4].forEach((i) => add(`play-${row}-${i + 1}`, 'overview', COLX[i], ys - 20, PLAY, 230, 140));
  [0, 1, 4].forEach((i) => add(`close-${row}-${i + 1}`, pre, COLX[i] + (row === 'far' && i === 1 ? 30 : 0), ys - 20, CLOSE, 470, 290));
}
[0, 1, 2, 3].forEach((i) => add(`play-thorn-${i + 1}`, 'overview', TX[i], ROWY.thorn - 20, PLAY, 230, 140));
[0, 1, 3].forEach((i) => add(`close-thorn-${i + 1}`, 'close-thorn', TX[i], ROWY.thorn - 20, CLOSE, 470, 290));
[0, 1, 2, 3].forEach((i) => add(`play-wolves-${i + 1}`, 'overview', TX[i], ROWY.wolves - 28, PLAY, 230, 150));
[0, 1, 3].forEach((i) => add(`close-wolves-${i + 1}`, 'close-wolves', TX[i], ROWY.wolves - 28, CLOSE, 470, 320));
// the Ash Chieftain stands in front of the left end of the surcoat block
add('close-chief', 'close-far', COLX[1] - 80, ROWY.far + 20, CLOSE, 170, 170);
add('close-chief-ctx', 'close-far', COLX[1] - 20, ROWY.far, CLOSE, 520, 330);
// the Salamander row
add('play-sal', 'overview', -55, ROWY.sal - 40, PLAY, 500, 150);
add('play-sal-proc', 'overview', SX.proc, ROWY.sal - 20, PLAY, 250, 110);
add('close-sal-old', 'close-sal', SX.backOld, ROWY.sal - 50, CLOSE, 330, 360);
add('close-sal-fix', 'close-sal', SX.backFix + 40, ROWY.sal - 25, CLOSE, 520, 360);
add('close-sal-front', 'close-sal', SX.frontFix, ROWY.sal - 35, CLOSE, 340, 330);
add('close-sal-proc', 'close-sal', SX.proc, ROWY.sal - 25, CLOSE, 640, 260);

(async () => {
  const out = process.argv[2];
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.googleapis|ERR_FAILED/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.route(/cdn\.jsdelivr\.net\/npm\/pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/, (r) => r.fulfill({ path: PIXI, contentType: 'application/javascript' }));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto('file://' + PAGE, { waitUntil: 'load', timeout: 180000 });
  await page.evaluate(async () => { await window.__ad.ready; });
  const aim = (s, still) => page.evaluate(({ s, still }) => window.__ad.ready.then((P) => {
    P.view(s.p, still ? { still: true } : undefined);
    const G = window.__battle.game, b = G.stage.T.allBox, C = { X: (b.x0 + b.x1) / 2, Y: (b.y0 + b.y1) / 2 };
    G.follow = false; G.user = { cx: C.X + s.X, cy: C.Y + s.Y, z: s.z };
    G.render(G.t);
    for (const e of document.querySelectorAll('.plab, #ptitle, #pcard')) e.style.display = 'none';
    const w = G.stage.world;
    return { x: w.position.x + (C.X + s.X) * w.scale.x, y: w.position.y + (C.Y + s.Y) * w.scale.y };
  }), { s, still });
  const done = [];
  const only = process.argv[3] ? new Set(process.argv[3].split(',')) : null;
  for (const s of SHOTS) {
    if (only && !only.has(s.n)) continue;
    const c = await aim(s, false);
    await page.waitForTimeout(200);
    const f = path.join(out, s.n + '.png');
    await page.screenshot({ path: f, clip: { x: Math.round(c.x - s.w / 2), y: Math.round(c.y - s.h / 2), width: s.w, height: s.h } });
    done.push(f);
  }
  // motion: far block striking, near block marching; 36 frames over one 1.8 s loop
  if (!only) for (const [n, X, Y] of [['motion-far', 120, ROWY.mfar - 22], ['motion-near', -120, ROWY.mnear - 22]]) {
    const s = { n, p: 'motion', X, Y, z: CLOSE, w: 460, h: 290 };
    const c = await aim(s, true);
    fs.mkdirSync(path.join(out, n), { recursive: true });
    for (let i = 0; i < 36; i++) {
      await page.evaluate((t) => window.__ad.ready.then((P) => P.setTime(t)), i * 0.05);
      await page.waitForTimeout(60);
      await page.screenshot({ path: path.join(out, n, String(i).padStart(2, '0') + '.png'), clip: { x: Math.round(c.x - s.w / 2), y: Math.round(c.y - s.h / 2), width: s.w, height: s.h } });
    }
    done.push(n + '/ (36 frames)');
  }
  const errs = await page.evaluate(() => (window.__errors || []).slice());
  console.log(JSON.stringify({ shots: done.length, errors: errors.concat(errs) }, null, 1));
  await browser.close();
})();
