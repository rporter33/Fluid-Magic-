const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  await p.route(/cdn\.jsdelivr\.net\/npm\/pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/, (r) => r.fulfill({ path: '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js', contentType: 'application/javascript' }));
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await p.goto('file://' + process.argv[2], { waitUntil: 'load', timeout: 120000 });
  const r = await p.evaluate(async () => { const P = await window.__pilot.ready; P.view('close-near'); await new Promise((ok) => setTimeout(ok, 300));
    const G = window.__battle.game, w = G.stage.world;
    const sp = G.stage.world.children.filter((c) => c.sortableChildren && c.visible)[0].children[0];
    const b = sp.getBounds();
    return { z: w.scale.x, user: G.user, follow: G.follow, res: G.app.renderer.resolution, canvas: [G.app.canvas.width, G.app.canvas.height], spriteH: b.height, spriteScale: sp.scale.y, tex: sp.texture.frame.height }; });
  console.log(JSON.stringify(r));
  await b.close();
})();
