// mereshot.cjs <page> <tag>: the mere at the start view and Near (crops in build/look/mere-<tag>-*.png)
const { launch, open, ev, ME } = require('./lib.cjs');
(async () => { const PAGE = process.argv[2], tag = process.argv[3], b = await launch(); const p = await open(b, PAGE, { settle: 1500 }); await p.mouse.move(720, 896);
  await ev(p, 'm.ev("fit(); draw()")'); await p.waitForTimeout(1200); await p.screenshot({ path: `${ME}look/mere-${tag}-start.png`, clip: { x: 650, y: 380, width: 200, height: 160 } });
  await ev(p, 'm.setScale(m.maxScale() * 0.6, 920, 585)'); await p.waitForTimeout(1500); await p.screenshot({ path: `${ME}look/mere-${tag}-near.png`, clip: { x: 900, y: 150, width: 420, height: 330 } }); await b.close(); })();
