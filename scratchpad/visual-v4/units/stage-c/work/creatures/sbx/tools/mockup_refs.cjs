// Camera references from the current battle mockup (art plan section 2): the procedural figure of
// each body type, idle, in its back view (the near side, 'ne', facing up-right) and its front view
// (the far side, 'se' flipped to face down-left, as the mockup draws it), on a flat key colour.
// Big bodies are the mockup's profile rigs, drawn as each side faces them on the field.
// Usage: node mockup_refs.cjs   (writes ../refs/mockup/*.png and refs.json)
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const V4 = path.resolve(__dirname, '..', '..');
const PAGE = path.join(V4, 'battle-mockup.html');
const PIXI_LOCAL = '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js';
const OUT = path.resolve(__dirname, '..', 'refs', 'mockup');
fs.mkdirSync(OUT, { recursive: true });
const UNITS = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'units.json'), 'utf8'));
const KEYS = UNITS.keys;

// body type -> a representative unit of the mockup and its nation palette
const FIGS = [
  ['infantry', 'cinderWarrior', 'cinderHorde'], ['infantry', 'warden', 'thornwood'],
  ['spear', 'ashMilitia', 'cinderHorde'], ['spear', 'thornMilitia', 'thornwood'],
  ['halberd', 'briarGuard', 'thornwood'], ['berserker', 'berserker', 'cinderHorde'],
  ['flamebrand', 'flamebrand', 'cinderHorde'], ['skirmisher', 'emberSkirmisher', 'cinderHorde'],
  ['archer', 'flameArcher', 'cinderHorde'], ['archer', 'longbowHunter', 'thornwood'],
  ['cavalry', 'ashRider', 'cinderHorde'], ['wolfrider', 'wolfRider', 'thornwood'],
  ['wolf', 'wolf', 'thornwood'], ['flier', 'fireSprite', 'cinderHorde'], ['flier', 'hornetSwarm', 'thornwood'],
  ['commander', 'ashChieftain', 'cinderHorde'], ['commander', 'wardenCaptain', 'thornwood'],
  ['mage', 'cinderMagus', 'cinderHorde'], ['mage', 'elderDruid', 'thornwood'],
  ['independent', 'heavyInfantry', 'independent'], ['independent', 'archer', 'independent'],
];
const BIG = [['monster', 'salamander', 'cinderHorde'], ['monster', 'treant', 'thornwood'], ['monster', 'greatWyrm', 'thornwood']];
const keyOf = (unit, nation) => {
  const u = UNITS.units.find((x) => x.unit === unit);
  if (u && u.key) return u.key;
  return nation === 'cinderHorde' ? 'green' : 'magenta';
};

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }).catch(() => chromium.launch());
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route(/cdn\.jsdelivr\.net\/npm\/pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/, (r) => r.fulfill({ path: PIXI_LOCAL, contentType: 'application/javascript' }));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto('file://' + PAGE, { waitUntil: 'load', timeout: 60000 });
  await page.evaluate(() => window.__battle.ready);
  const jobs = [];
  for (const [body, unit, nation] of FIGS) for (const view of ['back', 'front']) jobs.push({ kind: 'fig', body, unit, nation, view, key: KEYS[keyOf(unit, nation)] });
  for (const [body, unit, nation] of BIG) for (const view of ['back', 'front']) jobs.push({ kind: 'big', body, unit, nation, view, key: KEYS[keyOf(unit, nation)] });
  const meta = [];
  for (const j of jobs) {
    const res = await page.evaluate((j) => {
      const R = window.__battle.game.app.renderer;
      const pal = PALETTES[j.nation] || PALETTES.independent;
      const holder = new PIXI.Container();
      let scale;
      if (j.kind === 'fig') {
        const g = new PIXI.Graphics();
        // 'ne' is the near side seen from behind, facing up-right; the far side is 'se' flipped (down-left)
        drawFigure(g, j.unit, pal, j.view === 'back' ? 'ne' : 'se', FR.idle);
        const c = new PIXI.Container(); c.addChild(g);
        if (j.view === 'front') c.scale.x = -1;
        holder.addChild(c); scale = 9; // 50 art px -> 450 px tall
      } else {
        const b = makeBigBody(j.unit, pal);
        b.pose({ t: 0.6, h: 0, flying: false, act: null, k: 0, moving: false, dead: false, deadK: 0 });
        b.root.scale.x = j.view === 'back' ? 1 : -1; // near side faces screen right, far side screen left
        holder.addChild(b.root); scale = j.unit === 'greatWyrm' ? 2.2 : j.unit === 'treant' ? 5.4 : 6.5;
      }
      holder.scale.set(scale);
      const bounds = holder.getBounds();
      const pad = 40;
      const W = Math.ceil(bounds.width + 2 * pad), H = Math.ceil(bounds.height + 2 * pad);
      holder.position.set(pad - bounds.x, pad - bounds.y);
      const root = new PIXI.Container();
      const bg = new PIXI.Graphics(); bg.rect(0, 0, W, H).fill(Number('0x' + j.key.slice(1))); root.addChild(bg);
      root.addChild(holder);
      const rt = PIXI.RenderTexture.create({ width: W, height: H, resolution: 1, antialias: true });
      R.render({ container: root, target: rt, clear: true });
      const url = R.extract.base64({ target: rt, format: 'png' });
      // the foot point: the local origin of the figure (feet at 0,0) in the output image
      const foot = holder.toGlobal(new PIXI.Point(0, 0));
      rt.destroy(true); root.destroy({ children: true });
      return Promise.resolve(url).then((u) => ({ url: u, W, H, foot: [Math.round(foot.x), Math.round(foot.y)] }));
    }, j);
    const name = `${j.body}.${j.unit}.${j.view}.png`;
    fs.writeFileSync(path.join(OUT, name), Buffer.from(res.url.split(',')[1], 'base64'));
    meta.push({ file: name, body: j.body, unit: j.unit, nation: j.nation, view: j.view, key: j.key, size: [res.W, res.H], foot: res.foot,
      note: j.kind === 'big' ? 'mockup big body: a profile rig, not drawn for the 40-degree camera; use the maquette guides for the camera' : 'mockup rank-and-file figure, drawn for the 40-degree camera' });
  }
  fs.writeFileSync(path.join(OUT, 'refs.json'), JSON.stringify({ made: 'mockup_refs.cjs', page: 'battle-mockup.html', errors, refs: meta }, null, 1));
  console.log(JSON.stringify({ n: meta.length, errors }));
  await browser.close();
})();
