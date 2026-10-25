// A monster as one cutout texture on a deformable mesh: wings flap, tail sways, neck and head bob,
// all by moving the mesh's vertices (no cut parts, no bones file). The texture here is a procedural
// stand-in for a painted cutout (a generated painting with its background keyed out would drop in).
import { PIXI } from './harness.js';

export function wyrmGraphics(pal = { body: 0x8a2a1e, belly: 0xc8783a, wing: 0x6a1e18, wingHi: 0xa8442c, ink: 0x1c1a17 }) {
  const g = new PIXI.Graphics();
  const ink = { width: 2, color: pal.ink, alpha: 0.7 };
  g.ellipse(180, 228, 120, 26).fill({ color: 0, alpha: 0.28 }); // ground shadow
  // tail (left), body, neck, head (right); wings spread up
  g.moveTo(150, 190).bezierCurveTo(90, 210, 40, 200, 8, 170).bezierCurveTo(40, 188, 90, 192, 140, 172).fill(pal.body).stroke(ink);
  const wing = (dir) => {
    const bx = 175 + dir * 6, by = 150;
    const pts = [bx, by, bx + dir * 30, by - 80, bx + dir * 70, by - 120, bx + dir * 95, by - 100, bx + dir * 80, by - 70, bx + dir * 100, by - 55, bx + dir * 70, by - 35, bx + dir * 75, by - 15, bx + dir * 40, by - 10];
    g.poly(pts).fill(dir < 0 ? pal.wing : pal.wingHi).stroke(ink);
    for (const k of [[30, -80], [70, -120], [80, -70], [70, -35]]) g.moveTo(bx, by).lineTo(bx + dir * k[0], by + k[1]).stroke({ width: 2.5, color: pal.ink, alpha: 0.5 });
  };
  wing(-1);
  g.ellipse(180, 170, 62, 34).fill(pal.body).stroke(ink);
  g.ellipse(186, 182, 44, 16).fill(pal.belly);
  for (const [x, o] of [[140, 0], [215, 4]]) g.roundRect(x, 185 + o, 16, 34, 6).fill(pal.body).stroke(ink);
  g.moveTo(225, 160).bezierCurveTo(255, 140, 270, 110, 290, 95).lineTo(305, 108).bezierCurveTo(285, 125, 270, 160, 238, 182).fill(pal.body).stroke(ink);
  g.poly([288, 90, 330, 96, 344, 110, 318, 118, 300, 114]).fill(pal.body).stroke(ink);
  g.poly([296, 92, 300, 74, 308, 90]).fill(pal.belly); g.circle(318, 102, 3).fill(0xffd34a);
  wing(1);
  return g;
}

export function buildMonster(renderer, { side = 0, verticesX = 24, verticesY = 16, texture = null } = {}) {
  const tex = texture ?? renderer.generateTexture({ target: wyrmGraphics(side ? { body: 0x2e5a6a, belly: 0x9cc0b0, wing: 0x1e3e4a, wingHi: 0x3e7a8a, ink: 0x1c1a17 } : undefined), resolution: 1 });
  const mesh = new PIXI.MeshPlane({ texture: tex, verticesX, verticesY });
  mesh.pivot.set(tex.width * 0.5, tex.height * 0.9);
  if (side) mesh.scale.x = -1;
  const geo = mesh.geometry, pos = geo.positions, base = Float32Array.from(pos), uvs = geo.uvs;
  const buf = geo.getBuffer('aPosition');
  const update = (t) => {
    const flap = Math.sin(t * 3.2), sway = Math.sin(t * 1.7), bob = Math.sin(t * 2.4 + 1);
    for (let i = 0; i < pos.length; i += 2) {
      const u = uvs[i], v = uvs[i + 1];
      let dx = 0, dy = 0;
      if (v < 0.62 && u > 0.22 && u < 0.86) { const w = (0.62 - v) / 0.62; dy += flap * 40 * w * w; dx += flap * 6 * w * (u - 0.52); } // wings
      if (u < 0.42 && v > 0.55) { const w = (0.42 - u) / 0.42; dy += sway * 14 * w * w; dx += sway * 4 * w; } // tail
      if (u > 0.7 && v < 0.6) { const w = (u - 0.7) / 0.3; dy += bob * 8 * w; dx += bob * 3 * w; } // neck and head
      pos[i] = base[i] + dx; pos[i + 1] = base[i + 1] + dy;
    }
    buf.update();
  };
  return { node: mesh, update, texture: tex };
}
