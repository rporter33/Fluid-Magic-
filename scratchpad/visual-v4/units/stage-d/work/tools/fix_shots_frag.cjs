// Fix 11's fragment: cast 2's burning fragment to the group standing apart (the critique: a 9 wu orb with no trail, sent
// 445 wu), in flight and landing, the camera at 1.15x play zoom on its path. node fix_shots_frag.cjs PAGE OUT.jpg
const path = require('path'), fs = require('fs');
const { execFileSync } = require('child_process');
const { launch, openPage } = require(path.join(__dirname, 'lib.cjs'));
const [PAGE, OUT] = process.argv.slice(2);
(async () => {
  const b = await launch();
  const { page } = await openPage(b, PAGE, '?b=a&paused=1', { w: 1440, h: 900 });
  await page.addStyleTag({ content: '#hud > *:not(#ticker), #transport, #picker, #camctl, #menu, #loading { display: none !important; }' });
  const plan = await page.evaluate(() => {
    const G = window.__battle.game; G.playing = false;
    const fx = G.stage.fx.spells.filter((x) => x.spell === 'fireball')[1], fr = fx.clusters.find((k) => !k.main), m = fx.clusters.find((k) => k.main);
    G.follow = true; G.user = null; G.render(fr.tLaunch); // the automatic camera's zoom there, once
    return { tl: fr.tLaunch, td: fr.tLand, fx: fr.x, fy: fr.y, mx: m.x, my: m.y, z: G.curCam.z * 1.15, dist: Math.round(Math.hypot(fr.x - m.x, fr.y - m.y)) };
  });
  const dir = path.join(path.dirname(OUT), 'frag'); fs.mkdirSync(dir, { recursive: true });
  const files = [];
  const times = [0.15, 0.4, 0.65, 0.9].map((q) => ['flight ' + Math.round(q * 100) + '%', plan.tl + (plan.td - plan.tl) * q]).concat([['landed +0.08 s', plan.td + 0.08], ['landed +0.3 s', plan.td + 0.3]]);
  for (const [lab, t] of times) {
    const r = await page.evaluate(([t, p]) => {
      const G = window.__battle.game; G.render(t);
      const cx = (sx(p.fx, p.fy) + sx(p.mx, p.my)) / 2, cy = (sy(p.fx, p.fy, 0) + sy(p.mx, p.my, 0)) / 2 - 70;
      G.user = { cx, cy, z: p.z }; G.follow = false; G.t = t; G.render(t);
      return { man: +(28 * G.stage.world.scale.x).toFixed(1) };
    }, [t, plan]);
    const file = path.join(dir, files.length + '.png');
    await page.screenshot({ path: file, clip: { x: 220, y: 150, width: 1000, height: 600 } });
    files.push([file, `${lab}  man ${r.man}px  (fragment ${plan.dist} wu from the main burst)`]);
  }
  await b.close();
  execFileSync('python3', ['-I', '-c', `
import sys, json
from PIL import Image, ImageDraw
fs = json.loads(sys.argv[1]); ims = []
for f, lab in fs:
    im = Image.open(f).convert('RGB').resize((500, 300), Image.LANCZOS); d = ImageDraw.Draw(im); d.rectangle([0, 0, 8 + 6 * len(lab), 16], fill=(20, 18, 15)); d.text((4, 2), lab, fill=(255, 240, 200)); ims.append(im)
G = Image.new('RGB', (3 * 504 - 4, 2 * 304 - 4), (40, 36, 30))
for i, im in enumerate(ims): G.paste(im, ((i % 3) * 504, (i // 3) * 304))
G.save(sys.argv[2], quality=88)
`, JSON.stringify(files), OUT]);
  for (const [f] of files) fs.unlinkSync(f);
  fs.rmdirSync(dir);
  console.log(OUT, JSON.stringify(plan));
})().catch((e) => { console.error(e); process.exit(1); });
