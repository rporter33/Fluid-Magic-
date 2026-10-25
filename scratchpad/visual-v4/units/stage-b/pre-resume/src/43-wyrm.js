'use strict';
// ---- the Great Wyrm: a procedural rig in curves (profile, facing right, feet at the origin) ----

function cubicPts(p0, p1, p2, p3, n) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]);
  }
  return out;
}
/** A tapered ribbon along a centerline; returns the polygon and the two edges. */
function ribbonPoly(pts, w0, w1) {
  const L = [], R = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    const w = lerp(w0, w1, i / (n - 1)) / 2;
    L.push([pts[i][0] - ty * w, pts[i][1] + tx * w]); R.push([pts[i][0] + ty * w, pts[i][1] - tx * w]);
  }
  return { poly: [...L.flat(), ...R.slice().reverse().flat()], L, R };
}

function makeWyrm() {
  const C = {
    hi: 0x6fae52, body: 0x3f8043, lo: 0x1f4826, belly: 0xdcc684, bellyLo: 0xa38a50,
    mem: 0x7c9a3e, memLo: 0x4c6a2c, memFar: 0x3c5628, bone: 0x2c3c22, spine: 0xebd79e, horn: 0xf0e4c4, hornLo: 0xb3a27c, eye: 0xffc23a,
  };
  const root = new PIXI.Container();
  const body = new PIXI.Container(); root.addChild(body);
  const mk = (parent, x, y) => { const c = new PIXI.Container(); c.position.set(x, y); parent.addChild(c); return c; };
  const vgrad = (a, b) => grad(a, b, true);

  // far wing (behind everything)
  const farWing = mk(body, 30, -100);
  farWing.addChild(wyrmWing(C, true));
  // tail: redrawn each frame from a swaying centerline
  const tail = new PIXI.Graphics(); body.addChild(tail);
  // far legs
  const farHind = mk(body, -42, -58), farFore = mk(body, 48, -60);
  farHind.addChild(wyrmLeg(C, true, true)); farFore.addChild(wyrmLeg(C, false, true));
  // torso
  const tor = new PIXI.Graphics();
  tor.moveTo(-78, -62).bezierCurveTo(-72, -102, -12, -116, 40, -106).bezierCurveTo(74, -100, 92, -80, 84, -58)
    .bezierCurveTo(76, -36, 22, -32, -22, -36).bezierCurveTo(-58, -40, -82, -46, -78, -62).closePath();
  tor.fill(vgrad(C.hi, C.lo)); outline(tor, 2.2, 0.7);
  // belly plates
  const belly = cubicPts([-60, -42], [-20, -30], [40, -30], [80, -56], 14);
  const bp = ribbonPoly(belly, 12, 9);
  tor.poly(bp.poly).fill(vgrad(C.belly, C.bellyLo));
  for (let i = 1; i < belly.length - 1; i++) tor.moveTo(bp.L[i][0], bp.L[i][1]).lineTo(bp.R[i][0], bp.R[i][1]).stroke({ width: 1.2, color: C.bellyLo, alpha: 0.9 });
  // scale rows: soft arcs, lighter on top (light from the upper left)
  for (let r = 0; r < 4; r++) for (let i = 0; i < 10; i++) {
    const x = -62 + i * 15 + (r % 2) * 7, y = -92 + r * 12 + Math.abs(i - 5) * 1.6;
    if (x > 78) continue;
    tor.moveTo(x - 6, y).quadraticCurveTo(x, y + 5, x + 6, y).stroke({ width: 1.1, color: r < 1 ? C.hi : C.lo, alpha: 0.55 });
  }
  tor.moveTo(-60, -84).bezierCurveTo(-30, -104, 20, -108, 60, -96).stroke({ width: 3, color: shade(C.hi, 0.2), alpha: 0.35 });
  for (let i = 0; i < 7; i++) {
    const x = -64 + i * 20, y = -104 + Math.abs(i - 3.2) * 2.6 + (i < 2 ? 6 : 0);
    tor.poly([x - 6, y + 4, x - 1, y - 13, x + 6, y + 4]).fill(C.spine); outline(tor, 1, 0.5);
  }
  body.addChild(tor);
  // near legs
  const nearHind = mk(body, -40, -54), nearFore = mk(body, 52, -56);
  nearHind.addChild(wyrmLeg(C, true, false)); nearFore.addChild(wyrmLeg(C, false, false));
  // neck: an S-curve ribbon from the chest
  const neck = mk(body, 62, -88);
  const ng = new PIXI.Graphics();
  const npts = cubicPts([0, 0], [30, -10], [26, -44], [58, -66], 12);
  const nr = ribbonPoly(npts, 40, 22);
  ng.poly(nr.poly).fill(vgrad(C.hi, C.lo)); outline(ng, 2, 0.7);
  const nb = ribbonPoly(npts.map(([x, y]) => [x + 6, y + 9]), 12, 7);
  ng.poly(nb.poly).fill({ color: C.belly, alpha: 0.95 });
  for (let i = 1; i < 12; i += 2) { const p = nr.L[i]; ng.poly([p[0] - 4, p[1] + 2, p[0] - 2, p[1] - 10, p[0] + 4, p[1] + 1]).fill(C.spine); }
  neck.addChild(ng);
  const head = mk(neck, 58, -66);
  const hg = new PIXI.Graphics();
  // horns sweeping back
  hg.moveTo(-2, -12).bezierCurveTo(-14, -26, -30, -30, -44, -26).bezierCurveTo(-30, -24, -16, -16, -6, -4).closePath().fill(vgrad(C.horn, C.hornLo)); outline(hg, 1.2, 0.6);
  hg.moveTo(6, -14).bezierCurveTo(-2, -32, -16, -42, -30, -44).bezierCurveTo(-16, -36, -6, -24, 2, -8).closePath().fill(vgrad(C.horn, C.hornLo)); outline(hg, 1.2, 0.6);
  // skull
  hg.moveTo(-10, -10).bezierCurveTo(4, -22, 30, -22, 46, -12).lineTo(64, -6).bezierCurveTo(68, -2, 64, 3, 56, 3).lineTo(8, 7)
    .bezierCurveTo(-4, 8, -12, 2, -10, -10).closePath();
  hg.fill(vgrad(C.hi, C.body)); outline(hg, 1.8, 0.75);
  hg.moveTo(2, -14).bezierCurveTo(14, -20, 28, -19, 38, -13).stroke({ width: 3.5, color: C.lo, alpha: 0.6 });
  hg.circle(24, -10, 7).fill({ color: C.eye, alpha: 0.18 });
  hg.ellipse(24, -10, 3.8, 2.8).fill(C.eye); hg.ellipse(24.6, -10, 1.2, 2.4).fill(0x1c1a17);
  hg.circle(58, -4, 1.4).fill(0x1c1a17);
  for (let i = 0; i < 4; i++) hg.poly([-6 - i * 3, 2 + i * 2, -16 - i * 4, 4 + i * 3, -8 - i * 3, 6 + i * 2]).fill(C.spine);
  head.addChild(hg);
  const jaw = mk(head, 4, 5);
  const jg = new PIXI.Graphics();
  jg.moveTo(-6, -1).lineTo(54, -1).bezierCurveTo(58, 1, 56, 7, 50, 7).lineTo(4, 9).bezierCurveTo(-4, 9, -8, 4, -6, -1).closePath();
  jg.fill(vgrad(C.body, C.lo)); outline(jg, 1.6, 0.7);
  for (let i = 0; i < 7; i++) jg.poly([8 + i * 6.5, -1, 10 + i * 6.5, -5.5, 12 + i * 6.5, -1]).fill(0xf4ecda);
  jaw.addChild(jg);
  head.addChildAt(jaw, 0);
  // near wing (in front)
  const nearWing = mk(body, 24, -98);
  nearWing.addChild(wyrmWing(C, false));
  const drawTail = (t, fly) => {
    tail.clear();
    const s1 = Math.sin(t * 1.3) * 14, s2 = Math.sin(t * 1.3 - 1.1) * 22;
    const lift = fly ? -18 : 0;
    const pts = cubicPts([-70, -64], [-140, -60 + s1 * 0.4 + lift * 0.3], [-190, -22 + s1 + lift], [-262, -40 + s2 + lift], 18);
    const r = ribbonPoly(pts, 40, 5);
    tail.poly(r.poly).fill(grad(C.hi, C.lo, true)); outline(tail, 2, 0.7);
    const rb = ribbonPoly(pts.map(([x, y], i) => [x, y + lerp(12, 2, i / 18)]), 10, 2);
    tail.poly(rb.poly).fill({ color: C.belly, alpha: 0.9 });
    for (let i = 2; i < 17; i += 2) { const p = r.L[i]; const s = lerp(10, 3, i / 18); tail.poly([p[0] - s * 0.5, p[1] + 1, p[0] - s * 0.1, p[1] - s, p[0] + s * 0.5, p[1] + 1]).fill(C.spine); }
    const tip = pts[pts.length - 1], pre = pts[pts.length - 3];
    const a = Math.atan2(tip[1] - pre[1], tip[0] - pre[0]);
    const ca = Math.cos(a), sa = Math.sin(a);
    const P = (u, v) => [tip[0] + ca * u - sa * v, tip[1] + sa * u + ca * v];
    tail.poly([...P(-4, 0), ...P(10, -12), ...P(26, 0), ...P(10, 12)]).fill(C.spine); outline(tail, 1.2, 0.6);
  };
  drawTail(0, false);
  return {
    root, kind: 'wyrm', H: 168, footR: 44,
    pose(st) {
      const t = st.t, fly = st.h > 12 || st.flying;
      const flap = fly ? Math.sin(t * TAU * 0.9) : Math.sin(t * TAU * 0.2) * 0.12;
      nearWing.rotation = -0.1 + flap * 0.42; farWing.rotation = 0.02 + flap * 0.38;
      nearWing.scale.y = 1 - Math.max(0, flap) * 0.3; farWing.scale.y = 0.9 - Math.max(0, flap) * 0.25;
      drawTail(t, fly);
      const tuck = fly ? 1 : 0;
      nearHind.rotation = tuck * 0.9; farHind.rotation = tuck * 0.75; nearFore.rotation = tuck * 0.8; farFore.rotation = tuck * 0.65;
      body.y = fly ? Math.sin(t * TAU * 0.9 + 1.2) * 4 : Math.sin(t * 1.6) * 1.2;
      body.rotation = fly ? -0.04 : 0;
      let nk = Math.sin(t * 1.1) * 0.05, hk = 0, jw = 0.06;
      if (st.act === 'breath') { const k = st.k; nk = -0.3 + 0.38 * smooth(k * 3) - 0.08 * k; hk = 0.28 * smooth(k * 3); jw = k > 0.25 ? 0.55 : 0.12; }
      if (st.act === 'bite') { const k = st.k; nk = k < 0.45 ? -0.38 * smooth(k / 0.45) : -0.38 + 0.78 * smooth((k - 0.45) / 0.2); hk = k > 0.45 && k < 0.8 ? 0.35 : 0; jw = k > 0.35 && k < 0.6 ? 0.62 : 0.08; }
      if (st.act === 'hit') { nk -= 0.12; body.x = -4; } else body.x = 0;
      if (st.dead) { // folded wings, the neck down, the legs splayed
        const q = st.deadK;
        nearWing.rotation = lerp(nearWing.rotation, -0.62, q); farWing.rotation = lerp(farWing.rotation, -0.5, q);
        nearWing.scale.y = lerp(nearWing.scale.y, 0.5, q); farWing.scale.y = lerp(farWing.scale.y, 0.45, q);
        nk = lerp(nk, 0.75, q); hk = lerp(hk, 0.35, q); jw = lerp(jw, 0.25, q);
        nearHind.rotation = lerp(nearHind.rotation, -0.6, q); nearFore.rotation = lerp(nearFore.rotation, -0.9, q);
        body.y = lerp(body.y, 22, q);
      }
      neck.rotation = nk; head.rotation = hk; jaw.rotation = jw;
    },
    mouth() { const p = head.toGlobal(new PIXI.Point(62, 2)); return root.toLocal(p); },
  };
}

function wyrmWing(C, far) {
  const g = new PIXI.Graphics();
  // arm bones: shoulder (0,0) -> elbow -> wrist; fingers fan from the wrist to the tips
  const elbow = [-18, -52], wrist = [-58, -96];
  const tips = [[-168, -112], [-196, -64], [-178, -18], [-132, 6]];
  const root2 = [-58, 18];
  const mem = far ? C.memFar : C.mem;
  // membrane: wrist -> tips with scalloped edges -> back to the body
  g.moveTo(0, 0).lineTo(elbow[0], elbow[1]).lineTo(wrist[0], wrist[1]).lineTo(tips[0][0], tips[0][1]);
  for (let i = 1; i < tips.length; i++) {
    const a = tips[i - 1], b = tips[i];
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    g.quadraticCurveTo(lerp(mx, wrist[0], 0.28), lerp(my, wrist[1], 0.28), b[0], b[1]);
  }
  g.quadraticCurveTo(-96, 2, root2[0], root2[1]).lineTo(0, 0).closePath();
  g.fill(grad(far ? shade(mem, -0.1) : shade(mem, 0.15), far ? shade(mem, -0.3) : shade(mem, -0.25), true));
  outline(g, 1.8, 0.65);
  // veins / finger bones
  for (const tp of tips) g.moveTo(wrist[0], wrist[1]).lineTo(tp[0], tp[1]).stroke({ width: 2.6, color: C.bone, alpha: 0.95 });
  g.moveTo(0, 0).lineTo(elbow[0], elbow[1]).lineTo(wrist[0], wrist[1]).stroke({ width: 7, color: far ? shade(C.lo, -0.2) : C.lo });
  g.moveTo(0, 0).lineTo(elbow[0], elbow[1]).lineTo(wrist[0], wrist[1]).stroke({ width: 3, color: far ? C.lo : C.body, alpha: 0.9 });
  g.poly([wrist[0], wrist[1] - 2, wrist[0] - 4, wrist[1] - 14, wrist[0] + 3, wrist[1] - 4]).fill(C.horn);
  // a lit band near the arm (light from the upper left)
  if (!far) g.moveTo(-6, -8).quadraticCurveTo(-40, -60, -100, -100).stroke({ width: 10, color: 0xffffff, alpha: 0.06 });
  return g;
}

function wyrmLeg(C, hind, far) {
  const g = new PIXI.Graphics();
  const col = far ? shade(C.lo, -0.1) : C.body;
  const colHi = far ? C.lo : C.hi;
  if (hind) {
    g.ellipse(0, 4, 24, 30).fill(grad(colHi, col, true)); outline(g, 1.6, 0.6);
    const sh = cubicPts([6, 22], [14, 34], [4, 44], [12, 56], 6);
    const r = ribbonPoly(sh, 16, 10);
    g.poly(r.poly).fill(col); outline(g, 1.4, 0.6);
    g.ellipse(14, 56, 12, 5).fill(col); outline(g, 1.2, 0.6);
  } else {
    g.ellipse(0, 2, 16, 22).fill(grad(colHi, col, true)); outline(g, 1.6, 0.6);
    const sh = cubicPts([2, 16], [10, 30], [0, 42], [6, 54], 6);
    const r = ribbonPoly(sh, 13, 9);
    g.poly(r.poly).fill(col); outline(g, 1.4, 0.6);
    g.ellipse(8, 55, 10, 4.5).fill(col); outline(g, 1.2, 0.6);
  }
  for (let i = 0; i < 3; i++) g.poly([14 + i * 6 + (hind ? 4 : -2), 54, 22 + i * 6 + (hind ? 4 : -2), 59, 14 + i * 6 + (hind ? 4 : -2), 59]).fill(C.horn);
  return g;
}
