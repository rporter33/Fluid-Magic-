// Critique shot 11 again: cast 6's first burning kill, close (a man about 112 px), at the same times from its death as the
// critique (k-0.05 to k+3.2), the camera on the thrown figure. node fix_shots_kill.cjs PAGE OUT.jpg
const path = require('path');
const { launch, openPage } = require(path.join(__dirname, 'lib.cjs'));
const { execFileSync } = require('child_process');
const fs = require('fs');
const [PAGE, OUT] = process.argv.slice(2);
(async () => {
  const b = await launch();
  const { page } = await openPage(b, PAGE, '?b=a&paused=1', { w: 1200, h: 800 });
  await page.addStyleTag({ content: '#hud > *:not(#ticker), #transport, #picker, #camctl, #menu, #loading { display: none !important; }' });
  const dir = path.join(path.dirname(OUT), 'k11'); fs.mkdirSync(dir, { recursive: true });
  const files = [];
  for (const rel of [-0.05, 0.05, 0.15, 0.3, 0.5, 0.7, 1.0, 1.5, 2.2, 3.2]) {
    const r = await page.evaluate((rel) => {
      const G = window.__battle.game; G.playing = false;
      const fx = G.stage.fx.spells.filter((x) => x.spell === 'fireball')[5], f = fx.kills[0], t = f.death.t + rel, p = { x: 0, y: 0, h: 0 };
      figPos(G.stage.T, f, Math.max(t, f.death.t + f.death.fall), p); // frame where it lands, so the camera holds still
      G.render(t); G.user = { cx: sx(p.x, p.y), cy: sy(p.x, p.y, 12), z: 4 }; G.follow = false; G.t = t; G.render(t);
      return { man: +(28 * G.stage.world.scale.x).toFixed(1) };
    }, rel);
    const file = path.join(dir, `k${rel.toFixed(2)}.png`);
    await page.screenshot({ path: file, clip: { x: 400, y: 250, width: 400, height: 300 } });
    files.push([file, `k${rel >= 0 ? '+' : ''}${rel.toFixed(2)}s  man ${r.man}px`]);
  }
  await b.close();
  execFileSync('python3', ['-I', '-c', `
import sys, json
from PIL import Image, ImageDraw
fs = json.loads(sys.argv[1]); ims = []
for f, lab in fs:
    im = Image.open(f).convert('RGB'); d = ImageDraw.Draw(im); d.rectangle([0, 0, 8 + 7 * len(lab), 16], fill=(20, 18, 15)); d.text((4, 2), lab, fill=(255, 240, 200)); ims.append(im)
w, h = ims[0].size; G = Image.new('RGB', (5 * w + 16, 2 * h + 4), (40, 36, 30))
for i, im in enumerate(ims): G.paste(im, ((i % 5) * (w + 4), (i // 5) * (h + 4)))
G.save(sys.argv[2], quality=88)
`, JSON.stringify(files), OUT]);
  for (const [f] of files) fs.unlinkSync(f);
  fs.rmdirSync(dir);
  console.log(OUT);
})().catch((e) => { console.error(e); process.exit(1); });
