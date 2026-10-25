// Shoots mockup moments: node shoot.cjs PAGE OUTDIR SPEC.json [--w 1920 --h 1080 --q "?..."]
// SPEC: [{ name, b, t, zoom: 1|2 (x the automatic camera), focus: 'spell'|null, crop: [x,y,w,h]|'auto', speed }]
// zoom 2 holds the automatic camera's centre at the spell (between caster and target) and doubles its zoom.
const fs = require('fs'), path = require('path');
const { launch, openPage } = require('./lib.cjs');
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
(async () => {
  const [PAGE, OUT, SPEC] = a;
  fs.mkdirSync(OUT, { recursive: true });
  const spec = JSON.parse(fs.readFileSync(SPEC, 'utf8'));
  const browser = await launch();
  const { page, errors } = await openPage(browser, PAGE, opt('q', '?paused=1'), { w: +opt('w', 1920), h: +opt('h', 1080) });
  const info = [];
  for (const s of spec) {
    const r = await page.evaluate((s) => {
      const G = window.__battle.game;
      if (G.key !== s.b) G.load(s.b);
      G.playing = false; G.speed = s.speed || 1;
      G.follow = true; G.user = null;
      G.seek(s.t); G.render(s.t);
      const c = { ...G.curCam };
      if (s.zoom && s.zoom !== 1 || s.center) {
        const z = c.z * (s.zoom || 1);
        let cx = c.cx, cy = c.cy;
        if (s.center) { cx = s.center[0]; cy = s.center[1]; }
        G.user = { cx, cy, z }; G.follow = false;
        G.render(s.t);
      }
      const w = G.stage.world;
      return { cam: G.curCam, wx: w.position.x, wy: w.position.y, ws: w.scale.x, manPx: 28 * w.scale.x };
    }, s);
    const file = path.join(OUT, s.name + '.png');
    const clip = Array.isArray(s.crop) ? { x: s.crop[0], y: s.crop[1], width: s.crop[2], height: s.crop[3] } : undefined;
    await page.screenshot({ path: file, clip });
    info.push({ name: s.name, ...r });
  }
  fs.writeFileSync(path.join(OUT, 'shots.json'), JSON.stringify({ info, errors }, null, 1));
  console.log(JSON.stringify({ n: info.length, errors }));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
