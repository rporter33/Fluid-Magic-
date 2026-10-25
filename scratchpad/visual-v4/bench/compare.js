// Side by side at battle scale: procedural vector figures vs keyed painted figures, and the two monsters,
// each monster on a deformed mesh (wings, tail, neck). Also times the mesh update.
import { PIXI, makeApp, done, stats } from './harness.js';
import { buildAtlas } from './figures.js';
import { buildMonster } from './monster.js';
const ctx = await makeApp({ width: 1600, height: 900, background: 0xcdb386 });
const { app, sync } = ctx;
const atlas = buildAtlas(app.renderer, { nations: ['cinder', 'thorn'] });
const ptex = await PIXI.Assets.load('painted-atlas-2.png');
const pf = (k, row = 0) => { const t = new PIXI.Texture({ source: ptex.source, frame: new PIXI.Rectangle(k * 64, row * 64, 64, 64) }); t.defaultAnchor = { x: 0.5, y: 58 / 64 }; return t; };
const painted = { walk: [0, 1, 2, 3].map((k) => pf(k)), attack: [4, 5, 6, 7].map((k) => pf(k)), die: [12, 13].map((k) => pf(k)) };
const paintedThorn = { walk: [0, 1, 2, 3].map((k) => pf(k, 1)), attack: [4, 5, 6, 7].map((k) => pf(k, 1)), die: [12, 13].map((k) => pf(k, 1)) };
const procThorn = atlas.frames.sword.thorn.se;
const proc = atlas.frames.axe.cinder.se;
const label = (t, x, y) => { const s = new PIXI.Text({ text: t, style: { fontFamily: 'sans-serif', fontSize: 15, fill: 0x2a2018 } }); s.position.set(x, y); app.stage.addChild(s); };
const formation = (set, x0, y0, z, flip = 1) => {
  const c = new PIXI.Container(); c.position.set(x0, y0); const list = [];
  for (let f = 0; f < 6; f++) for (let r = 0; r < 10; r++) {
    const pose = f >= 4 ? 'attack' : 'walk'; const arr = set[pose];
    const s = new PIXI.Sprite(arr[(f * 3 + r) % arr.length]); s.scale.set(0.5 * z * flip, 0.5 * z);
    s.position.set(r * 13 * z + (f % 2) * 3 * z, f * 9 * z); list.push(s);
  }
  // two bodies in front
  for (let k = 0; k < 2; k++) { const s = new PIXI.Sprite(set.die[1]); s.tint = 0xa0a0a0; s.scale.set(0.5 * z); s.position.set((30 + k * 50) * z, 64 * z); list.push(s); }
  list.sort((a, b) => a.y - b.y).forEach((s) => c.addChild(s)); app.stage.addChild(c);
};
label('Procedural vector figures (atlas, parts colored per nation): zoom 1, zoom 2, second nation at zoom 2', 20, 6);
formation(proc, 30, 100, 1); formation(proc, 230, 100, 2); formation(procThorn, 820, 100, 2, -1);
label('Generated painted figures (keyed, premultiplied downscale): zoom 1, zoom 2, second nation by hue recolor at zoom 2', 20, 236);
formation(painted, 30, 330, 1); formation(painted, 230, 330, 2); formation(paintedThorn, 820, 330, 2, -1);
// monsters
label('Monsters on a deformed mesh: procedural (left), painted cutout (right), at zoom 1, with soldiers for scale', 20, 500);
const m1 = buildMonster(app.renderer, {}); m1.node.position.set(250, 820); m1.node.scale.set(0.85, 0.85); app.stage.addChild(m1.node);
const wtex = await PIXI.Assets.load('wyrm-2x.png');
const m2 = buildMonster(app.renderer, { texture: wtex }); m2.node.position.set(820, 840); m2.node.scale.set(0.55, 0.55); app.stage.addChild(m2.node);
// a few soldiers next to the painted monster for scale
for (let k = 0; k < 8; k++) { const s = new PIXI.Sprite(painted.walk[k % 4]); s.scale.set(0.5); s.position.set(1060 + k * 14, 800 + (k % 2) * 8); app.stage.addChild(s); }
const times = [];
for (let f = 0; f < 120; f++) { const t0 = performance.now(); m1.update(f / 60); m2.update(f / 60); times.push(performance.now() - t0); }
m1.update(0.45); m2.update(0.45);
app.renderer.render(app.stage); sync();
window.__shots = [{ name: 'compare-figures', url: app.canvas.toDataURL('image/png') }];
done({ meshUpdateTwoMonsters: stats(times), meshVerts: m2.node.geometry.positions.length / 2 });
