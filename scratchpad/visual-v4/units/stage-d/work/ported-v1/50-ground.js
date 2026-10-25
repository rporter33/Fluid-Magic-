'use strict';
// ---- the ground (design 3.7): one muted, light surface; scenery only outside the field ----
// Painted once per battle into a canvas in the screen plane (ground coordinates through the
// projection matrix), from streamFor(battle, 'scene').

const GROUNDS = {
  plains: { c: 0xa8a784, name: 'dry grass' }, farmland: { c: 0xb4a27e, name: 'stubble' }, forest: { c: 0x938e70, name: 'leaf litter' },
  hills: { c: 0xa39276, name: 'short turf' }, mountains: { c: 0xa2a6aa, name: 'scree' }, swamp: { c: 0x8e8e78, name: 'mud' },
  wasteland: { c: 0xb0a6a2, name: 'ash and cracked earth' },
};
const SNOW = 0xb9bdcb, ICE = 0xa9aeb4, STORM_GROUND = 0x958b7f, PUDDLE = 0x66706f;

function seasonOf(month) { return month >= 11 || month <= 2 ? 'winter' : month === 9 || month === 10 ? 'autumn' : 'summer'; }
function groundColor(B) {
  const season = seasonOf(B.month);
  if (season === 'winter') return B.terrain === 'swamp' ? ICE : SNOW;
  return GROUNDS[B.terrain].c;
}

function paintGround(B, L, T) {
  const rng = streamFor(B.id, 'scene');
  const season = seasonOf(B.month);
  const winter = season === 'winter';
  const base = groundColor(B);
  const F = L.field;
  const M = 900; // scenery margin beyond the field rect
  const gx0 = F.x0 - M, gx1 = F.x1 + M, gy0 = F.y0 - M, gy1 = F.y1 + M;
  // screen-plane bounds of the ground rect
  const corners = [[gx0, gy0], [gx1, gy0], [gx0, gy1], [gx1, gy1]];
  const Xs = corners.map(([x, y]) => sx(x, y)), Ys = corners.map(([x, y]) => sy(x, y, 0));
  const X0 = Math.min(...Xs), X1 = Math.max(...Xs), Y0 = Math.min(...Ys) - 260, Y1 = Math.max(...Ys);
  const RES = 0.8; // canvas px per screen-plane unit
  const W = Math.ceil((X1 - X0) * RES), H = Math.ceil((Y1 - Y0) * RES);
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  const toCanvas = () => ctx.setTransform(RES, 0, 0, RES, -X0 * RES, -Y0 * RES);
  const groundT = () => ctx.setTransform(GROUND_MATRIX[0] * RES, GROUND_MATRIX[1] * RES, GROUND_MATRIX[2] * RES, GROUND_MATRIX[3] * RES, -X0 * RES, -Y0 * RES);
  // the void beyond the ground
  ctx.fillStyle = '#1a1814'; ctx.fillRect(0, 0, W, H);
  groundT();
  ctx.fillStyle = numToHex(base);
  ctx.fillRect(gx0, gy0, gx1 - gx0, gy1 - gy0);
  // low-frequency mottling, within a few L* of the base
  const blob = (x, y, r, color, a) => {
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, rgba(color, a)); gr.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  };
  for (let i = 0; i < 420; i++) {
    const x = lerp(gx0, gx1, rng()), y = lerp(gy0, gy1, rng()), r = 60 + rng() * 260;
    blob(x, y, r, rng() < 0.5 ? shade(base, -0.12) : shade(base, 0.1), 0.10 + rng() * 0.08);
  }
  // terrain detail
  const inField = (x, y) => x > F.x0 && x < F.x1 && y > F.y0 && y < F.y1;
  const outside = (x, y, m) => x < F.x0 - m || x > F.x1 + m || y < F.y0 - m || y > F.y1 + m;
  const t = B.terrain;
  if (!winter && (t === 'wasteland')) {
    for (let i = 0; i < 160; i++) blob(lerp(gx0, gx1, rng()), lerp(gy0, gy1, rng()), 30 + rng() * 90, 0xd6cec8, 0.10); // ash drifts
    ctx.lineCap = 'round';
    for (let i = 0; i < 260; i++) { // cracked earth
      let x = lerp(gx0, gx1, rng()), y = lerp(gy0, gy1, rng());
      ctx.strokeStyle = rgba(shade(base, -0.32), 0.35); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let k = 0; k < 5; k++) { x += (rng() - 0.5) * 26; y += (rng() - 0.5) * 26; ctx.lineTo(x, y); }
      ctx.stroke();
    }
  }
  if (!winter && (t === 'plains' || t === 'farmland' || t === 'hills')) {
    for (let i = 0; i < 1600; i++) { // tufts
      const x = lerp(gx0, gx1, rng()), y = lerp(gy0, gy1, rng());
      ctx.strokeStyle = rgba(rng() < 0.5 ? shade(base, -0.22) : shade(base, 0.12), 0.5); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (rng() - 0.5) * 6, y + 5 + rng() * 4); ctx.stroke();
    }
  }
  if (winter) {
    for (let i = 0; i < 200; i++) blob(lerp(gx0, gx1, rng()), lerp(gy0, gy1, rng()), 40 + rng() * 140, 0xe4e7ee, 0.16); // drifts
    for (let i = 0; i < 220; i++) blob(lerp(gx0, gx1, rng()), lerp(gy0, gy1, rng()), 20 + rng() * 80, 0x9298aa, 0.10); // blue shadow hollows
    ctx.lineCap = 'round';
    for (let i = 0; i < 260; i++) { // wind ripples in the snow
      const x = lerp(gx0, gx1, rng()), y = lerp(gy0, gy1, rng()), L = 20 + rng() * 50;
      ctx.strokeStyle = rgba(0x8f95a6, 0.12); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + L * 0.5, y + 6, x + L, y); ctx.stroke();
    }
  }
  if (t === 'swamp' && !winter) {
    for (let i = 0; i < 260; i++) blob(lerp(gx0, gx1, rng()), lerp(gy0, gy1, rng()), 30 + rng() * 90, rng() < 0.5 ? 0x6e6a52 : 0x9a9478, 0.16); // wet and dry mud
    for (let i = 0; i < 700; i++) blob(lerp(gx0, gx1, rng()), lerp(gy0, gy1, rng()), 5 + rng() * 12, rng() < 0.5 ? 0x5f6a3e : 0x77704e, 0.3); // moss and sedge clumps
    // puddles: <= 24 wu across, <= 6% cover, spread evenly (min spacing), so no corridor and no favoured half.
    // Each is 2 or 3 overlapping ellipses of 4 to 14 wu in a wet rim within 8 L* of the mud, no sky sheen
    // (critique fix 9), so they read as standing water, not holes.
    const pts = [];
    for (let tries = 0; tries < 5000 && pts.length < 260; tries++) {
      const x = lerp(gx0, gx1, rng()), y = lerp(gy0, gy1, rng());
      if (pts.some((p) => (p.x - x) ** 2 + (p.y - y) ** 2 < 64 * 64)) continue;
      pts.push({ x, y });
    }
    const rim = shade(base, -0.09), water = mix(PUDDLE, base, 0.3);
    for (const p of pts) {
      if (rng() < 0.45) continue; // fewer, calmer
      const lobes = [];
      const k = 2 + Math.floor(rng() * 2);
      const big = 0.5 + rng() * 0.5; // sizes vary, so they do not read as a pattern
      for (let j = 0; j < k; j++) lobes.push({ x: p.x + (rng() - 0.5) * 22 * big, y: p.y + (rng() - 0.5) * 12 * big, rx: (4 + rng() * 10) * big + 2, ry: 0, rot: (rng() - 0.5) * 0.9 });
      for (const l of lobes) l.ry = l.rx * (0.4 + rng() * 0.25);
      ctx.fillStyle = rgba(rim, 0.45);
      for (const l of lobes) { ctx.beginPath(); ctx.ellipse(l.x, l.y, l.rx + 3, l.ry + 2.2, l.rot, 0, TAU); ctx.fill(); }
      ctx.fillStyle = rgba(water, 0.62);
      for (const l of lobes) { ctx.beginPath(); ctx.ellipse(l.x, l.y, l.rx, l.ry, l.rot, 0, TAU); ctx.fill(); }
    }
  }
  if (!winter && t === 'plains') {
    for (let i = 0; i < 260; i++) blob(lerp(gx0, gx1, rng()), lerp(gy0, gy1, rng()), 40 + rng() * 120, rng() < 0.55 ? 0xc4bc8e : 0x8e9466, 0.13); // straw and grass patches
  }
  if (t === 'mountains' || winter) {
    for (let i = 0; i < 500; i++) { // scree flecks / stones
      const x = lerp(gx0, gx1, rng()), y = lerp(gy0, gy1, rng());
      ctx.fillStyle = rgba(rng() < 0.6 ? 0x8a8e94 : 0x6f7378, 0.45);
      ctx.beginPath(); ctx.ellipse(x, y, 1.5 + rng() * 2.5, 1 + rng() * 1.6, rng() * 3, 0, TAU); ctx.fill();
    }
  }
  // storm: trampled approach and courtyard
  if (T.wall) {
    for (let i = 0; i < 90; i++) blob(lerp(F.x0, F.x1, rng()), lerp(-260, -20, rng()), 40 + rng() * 60, winter ? 0x9a9ea8 : STORM_GROUND, 0.16);
  }
  // footprint tracks in snow toward the front
  if (winter) {
    ctx.fillStyle = rgba(0x8f95a3, 0.25);
    for (let k = 0; k < 40; k++) {
      let x = lerp(F.x0, F.x1, rng()), y = F.y0 + 40;
      for (let s = 0; s < 30; s++) { ctx.beginPath(); ctx.ellipse(x + (s % 2) * 4, y, 1.6, 2.4, 0, 0, TAU); ctx.fill(); y += 14; x += (rng() - 0.5) * 4; if (y > -40) break; }
    }
  }
  // ---- scenery outside the field rect plus 80 wu ----
  const sceneryTrees = [];
  const scen = sceneryFor(B, F, rng, winter, T);
  // roads: worn earth with wheel ruts (a lane fades out where it meets the field margin)
  for (const rd of scen.roads) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const path = () => { ctx.beginPath(); ctx.moveTo(rd.pts[0][0], rd.pts[0][1]); for (let i = 1; i < rd.pts.length; i++) ctx.lineTo(rd.pts[i][0], rd.pts[i][1]); };
    const a0 = rd.pts[0], a1 = rd.pts[rd.pts.length - 1];
    const strokeOf = (col, a) => { if (!rd.fade) return rgba(col, a); const gr = ctx.createLinearGradient(a0[0], a0[1], a1[0], a1[1]); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0)); return gr; };
    path(); ctx.strokeStyle = strokeOf(shade(base, -0.16), 0.55); ctx.lineWidth = rd.w + 6; ctx.stroke();
    path(); ctx.strokeStyle = strokeOf(winter ? 0xc9ccd4 : shade(mix(base, 0xb59a74, 0.6), 0.04), 0.9); ctx.lineWidth = rd.w; ctx.stroke();
    const L = Math.hypot(a1[0] - a0[0], a1[1] - a0[1]) || 1, px = -(a1[1] - a0[1]) / L, py = (a1[0] - a0[0]) / L;
    for (const o of [-0.22, 0.22]) { // wheel ruts
      ctx.beginPath(); ctx.moveTo(rd.pts[0][0] + px * o * rd.w, rd.pts[0][1] + py * o * rd.w);
      for (let i = 1; i < rd.pts.length; i++) ctx.lineTo(rd.pts[i][0] + px * o * rd.w, rd.pts[i][1] + py * o * rd.w);
      ctx.strokeStyle = strokeOf(shade(base, -0.28), 0.35); ctx.lineWidth = 1.6; ctx.stroke();
    }
  }
  // rivers / channels (ground-space ribbons)
  for (const rv of scen.rivers) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const path = () => { ctx.beginPath(); ctx.moveTo(rv.pts[0][0], rv.pts[0][1]); for (let i = 1; i < rv.pts.length; i++) { const [x, y] = rv.pts[i]; const [px, py] = rv.pts[i - 1]; ctx.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2); } ctx.lineTo(...rv.pts[rv.pts.length - 1]); };
    path(); ctx.strokeStyle = rgba(shade(base, -0.3), 0.7); ctx.lineWidth = rv.w + 26; ctx.stroke(); // banks
    path(); ctx.strokeStyle = rgba(winter ? 0xc9d2de : 0x54686a, 1); ctx.lineWidth = rv.w; ctx.stroke();
    path(); ctx.strokeStyle = rgba(winter ? 0xe6ecf4 : 0x6f8486, 0.8); ctx.lineWidth = rv.w * 0.45; ctx.stroke();
    path(); ctx.setLineDash([18, 26]); ctx.strokeStyle = rgba(winter ? 0xffffff : 0x9fb0ac, 0.35); ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
  }
  // grass clumps (6 wu or less) on the near side
  ctx.lineCap = 'round';
  for (const gq of scen.grass) {
    for (let j = 0; j < 6; j++) {
      const dx = (rng() - 0.5) * 8 * gq.s;
      ctx.strokeStyle = rgba(j % 2 ? shade(base, -0.26) : shade(base, -0.12), 0.6); ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(gq.x + dx, gq.y); ctx.lineTo(gq.x + dx + (rng() - 0.5) * 3, gq.y + (3 + rng() * 3) * gq.s); ctx.stroke();
    }
  }
  // scattered ground stones and stumps outside the field
  for (const s of scen.stones) { ctx.fillStyle = rgba(0x6e6a64, 0.7); ctx.beginPath(); ctx.ellipse(s.x, s.y, s.r * 1.3, s.r, 0.4, 0, TAU); ctx.fill(); ctx.fillStyle = rgba(0xb6b0a6, 0.6); ctx.beginPath(); ctx.ellipse(s.x - s.r * 0.3, s.y + s.r * 0.3, s.r * 0.6, s.r * 0.4, 0.4, 0, TAU); ctx.fill(); }
  // upright scenery in the screen plane, nearest last
  toCanvas();
  const ups = [...scen.trees.map((o) => ({ ...o, k: 'tree' })), ...scen.bridges.map((o) => ({ ...o, k: 'bridge' })),
    ...scen.rocks.map((o) => ({ ...o, k: 'rock' })), ...scen.buildings.map((o) => ({ ...o, k: 'building' })), ...scen.reeds.map((o) => ({ ...o, k: 'reed' }))];
  ups.sort((a, b) => depthKey(a.x, a.y) - depthKey(b.x, b.y));
  for (const o of ups) {
    const X = sx(o.x, o.y), Y = sy(o.x, o.y, 0);
    if (o.k === 'tree') drawTree(ctx, X, Y, o, winter, rng);
    else if (o.k === 'rock') drawRock(ctx, X, Y, o, winter);
    else if (o.k === 'bridge') drawBridge(ctx, o, winter);
    else if (o.k === 'building') drawBuilding(ctx, X, Y, o, winter);
    else if (o.k === 'reed') drawReeds(ctx, X, Y, o, rng);
    void sceneryTrees;
  }
  // a soft darkening toward the edge of the painted ground
  toCanvas();
  const cxm = (X0 + X1) / 2, cym = (Y0 + Y1) / 2;
  const vg = ctx.createRadialGradient(cxm, cym, Math.min(X1 - X0, Y1 - Y0) * 0.38, cxm, cym, Math.max(X1 - X0, Y1 - Y0) * 0.62);
  vg.addColorStop(0, 'rgba(20,18,15,0)'); vg.addColorStop(1, 'rgba(20,18,15,0.55)');
  ctx.fillStyle = vg; ctx.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
  // fine grain
  const grain = document.createElement('canvas'); grain.width = grain.height = 128;
  const gctx = grain.getContext('2d'); const img = gctx.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (rng() - 0.5) * 60; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  gctx.putImageData(img, 0, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 0.07; ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(grain, 'repeat'); ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  return { canvas: cv, X0, Y0, RES, base, season, scen };
}

function sceneryFor(B, F, rng, winter, T) {
  const out = { trees: [], rocks: [], rivers: [], bridges: [], buildings: [], stones: [], reeds: [], roads: [], grass: [] };
  const t = B.terrain;
  const m = 110; // field rect plus 80 wu, and a little more
  const place = (n, fn) => { for (let i = 0; i < n * 6 && fn.count < n; i++) fn(); };
  // tall scenery stands left, right or far (critique fix 9); the near side, between the camera and the
  // battle, gets only stones and grass of 6 wu or less (nearScatter below)
  const ring = (n, kind, make) => {
    let c = 0;
    for (let i = 0; i < n * 8 && c < n; i++) {
      const side = Math.floor(rng() * 3);
      let x, y;
      const yBack = lerp(F.y0, F.y1, 0.4); // the near part of the flanks is low ground too
      if (side === 0) { x = F.x0 - m - rng() * 420; y = lerp(yBack, F.y1 + 300, rng()); }
      else if (side === 1) { x = F.x1 + m + rng() * 420; y = lerp(yBack, F.y1 + 300, rng()); }
      else { y = F.y1 + m + rng() * 380; x = lerp(F.x0 - 300, F.x1 + 300, rng()); }
      out[kind].push(make(x, y)); c++;
    }
  };
  const nearScatter = (n) => {
    for (let i = 0; i < n; i++) {
      const flank = rng() < 0.3;
      const x = flank ? (rng() < 0.5 ? F.x0 - m - rng() * 400 : F.x1 + m + rng() * 400) : lerp(F.x0 - 400, F.x1 + 400, rng());
      const y = flank ? lerp(F.y0, lerp(F.y0, F.y1, 0.4), rng()) : F.y0 - m * 0.4 - rng() * 420;
      if (rng() < 0.4) out.stones.push({ x, y, r: 2 + rng() * 4 });
      else out.grass.push({ x, y, s: 0.6 + rng() * 0.4 });
    }
  };
  void place;
  if (t === 'wasteland') {
    ring(14, 'trees', (x, y) => ({ x, y, dead: true, s: 0.8 + rng() * 0.6 }));
    ring(18, 'rocks', (x, y) => ({ x, y, s: 0.6 + rng() * 1.2 }));
    ring(40, 'stones', (x, y) => ({ x, y, r: 3 + rng() * 6 }));
  } else if (t === 'mountains') {
    ring(26, 'rocks', (x, y) => ({ x, y, s: 1.0 + rng() * 0.6, peak: true })); // peaks capped at s 1.6
    ring(16, 'trees', (x, y) => ({ x, y, conifer: true, s: 0.9 + rng() * 0.6 }));
    ring(30, 'stones', (x, y) => ({ x, y, r: 3 + rng() * 6 }));
  } else if (t === 'swamp') {
    ring(18, 'trees', (x, y) => ({ x, y, dead: rng() < 0.6, willow: true, s: 0.8 + rng() * 0.5 }));
    ring(46, 'reeds', (x, y) => ({ x, y, s: 0.7 + rng() * 0.6 }));
    // and a second channel across the near-left corner
    const pts2 = [];
    for (let k = 0; k <= 10; k++) pts2.push([F.x0 - 120 - k * 26, F.y0 + 260 - k * 70]);
    out.rivers.push({ pts: pts2, w: 30 });
  } else {
    ring(16, 'trees', (x, y) => ({ x, y, s: 0.8 + rng() * 0.6 }));
    ring(10, 'rocks', (x, y) => ({ x, y, s: 0.6 + rng() }));
  }
  nearScatter(70);
  // the set pieces (channel, brook, road, bridge) come from setPiecesFor, shared with the camera
  const sp = (T && T.setPieces) || setPiecesFor(B, F);
  out.rivers.push(...sp.rivers); out.bridges.push(...sp.bridges); out.roads.push(...sp.roads);
  if (T && T.wall) {
    const w = T.wall;
    // towers beyond the wall's lateral ends; the keep and roofs behind the courtyard
    out.buildings.push({ x: w.x0 - 30, y: 40, kind: 'tower' }, { x: w.x1 + 30, y: 40, kind: 'tower' });
    out.buildings.push({ x: lerp(F.x0, F.x1, 0.35), y: F.y1 + 170, kind: 'keep' });
    for (let i = 0; i < 6; i++) out.buildings.push({ x: lerp(F.x0 - 100, F.x1 + 100, rng()), y: F.y1 + 110 + rng() * 160, kind: 'roof' });
    out.rocks = out.rocks.filter((r) => r.y < -120 || Math.abs(r.x) > (w.x1 + 120));
    out.trees = out.trees.filter((r) => r.y < -120 || Math.abs(r.x) > (w.x1 + 120));
  }
  // nothing taller than 6 wu inside the field rect plus 80 wu (design 3.7 rule 1-2)
  const keep = (o) => o.x < F.x0 - 80 || o.x > F.x1 + 80 || o.y < F.y0 - 80 || o.y > F.y1 + 80;
  for (const k of ['trees', 'rocks', 'reeds', 'bridges']) out[k] = out[k].filter(keep);
  // and nothing tall may stand in front of the field on screen: scenery is painted into the ground,
  // so a troop behind it would be drawn over it (critique fix 9)
  const fieldPts = [];
  for (let x = F.x0; x <= F.x1; x += 30) for (let y = F.y0; y <= F.y1; y += 30) fieldPts.push([sx(x, y), sy(x, y, 0), depthKey(x, y)]);
  const inFront = (o, w, hgt) => {
    const X = sx(o.x, o.y), Y = sy(o.x, o.y, 0), k = depthKey(o.x, o.y);
    return fieldPts.some(([px, py, pk]) => pk < k && px > X - w && px < X + w && py > Y - hgt && py < Y + 6);
  };
  out.trees = out.trees.filter((o) => !inFront(o, 26 * (o.s || 1), 62 * (o.s || 1)));
  out.rocks = out.rocks.filter((o) => !inFront(o, (o.peak ? 34 : 14) * (o.s || 1) * 1.1, (o.peak ? 34 * 1.9 : 14 * 0.9) * (o.s || 1)));
  out.reeds = out.reeds.filter((o) => !inFront(o, 10 * o.s, 26 * o.s));
  out.dropped = { note: 'tall scenery dropped for standing in front of the field' };
  return out;
}

/**
 * The scene's set pieces (critique fix 9; design 3.7 rule 2): water and roads parallel to the seam
 * beyond the far side's edge zone and the 80 wu margin, with a stone bridge on the water, placed so the
 * opening frame shows them. Swamp: a channel. Plains and farmland: a brook with a bridge, and a road
 * behind it with a lane over the bridge that fades out at the margin.
 */
function setPiecesFor(B, F) {
  const rng = streamFor(B.id, 'setpiece');
  const out = { rivers: [], bridges: [], roads: [], boxes: [] };
  const t = B.terrain;
  if (!(t === 'swamp' || t === 'plains' || t === 'farmland')) return out;
  const w = t === 'swamp' ? 40 : 26;
  const yR = F.y1 + 84 + w / 2; // the water's near edge on the margin
  const wob = (x) => 6 * Math.sin(x / 160 + 1.3) + 3 * Math.sin(x / 61);
  const pts = [];
  for (let x = F.x0 - 800; x <= F.x1 + 800; x += 60) pts.push([x, yR + Math.abs(wob(x)) + (rng() - 0.5) * 2]);
  out.rivers.push({ pts, w });
  const bx = lerp(F.x0, F.x1, 0.3 + rng() * 0.4);
  const by = yR + Math.abs(wob(bx));
  out.bridges.push({ x: bx, y: by, len: w + 52, w: 26 });
  if (t !== 'swamp') {
    const yRoad = yR + 90;
    const rp = [];
    for (let x = F.x0 - 800; x <= F.x1 + 800; x += 80) rp.push([x, yRoad + 10 * Math.sin(x / 230) + (rng() - 0.5) * 4]);
    out.roads.push({ pts: rp, w: 20 });
    out.roads.push({ pts: [[bx, yRoad + 10 * Math.sin(bx / 230)], [bx, by + w / 2 + 6]], w: 18 });
    out.roads.push({ pts: [[bx, by - w / 2 - 6], [bx + 4, F.y1 + 80]], w: 18, fade: true });
  }
  // the box the opening frame must hold: the bridge and the water 120 wu either side of it
  const corners = [[bx - 140, by - w - 20], [bx + 140, by - w - 20], [bx - 140, by + w + 40], [bx + 140, by + w + 40]];
  const Xs = corners.map(([x, y]) => sx(x, y)), Ys = corners.map(([x, y]) => sy(x, y, 0));
  out.boxes.push({ x0: Math.min(...Xs), x1: Math.max(...Xs), y0: Math.min(...Ys) - 20, y1: Math.max(...Ys) });
  return out;
}

function drawTree(ctx, X, Y, o, winter, rng) {
  const s = (o.s || 1) * 1.0;
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(X + 14 * s, Y + 4, 26 * s, 9 * s, 0, 0, TAU); ctx.fill();
  if (o.dead) {
    ctx.strokeStyle = '#4a3c30'; ctx.lineCap = 'round';
    ctx.lineWidth = 5 * s; ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X + 2 * s, Y - 46 * s); ctx.stroke();
    ctx.lineWidth = 2.5 * s;
    for (let i = 0; i < 4; i++) { const yy = Y - (20 + i * 7) * s; ctx.beginPath(); ctx.moveTo(X + s, yy); ctx.lineTo(X + (i % 2 ? 16 : -14) * s, yy - 12 * s); ctx.stroke(); }
    return;
  }
  if (o.conifer) {
    ctx.fillStyle = '#3e3328'; ctx.fillRect(X - 2 * s, Y - 10 * s, 4 * s, 10 * s);
    for (let i = 0; i < 4; i++) {
      const w = (24 - i * 5) * s, y0 = Y - (8 + i * 13) * s;
      ctx.fillStyle = i % 2 ? '#2f4a36' : '#36533c';
      ctx.beginPath(); ctx.moveTo(X - w, y0); ctx.lineTo(X, y0 - 22 * s); ctx.lineTo(X + w, y0); ctx.closePath(); ctx.fill();
      if (winter) { ctx.fillStyle = 'rgba(240,244,250,0.85)'; ctx.beginPath(); ctx.moveTo(X - w * 0.6, y0 - 8 * s); ctx.lineTo(X, y0 - 22 * s); ctx.lineTo(X + w * 0.3, y0 - 12 * s); ctx.closePath(); ctx.fill(); }
    }
    return;
  }
  ctx.fillStyle = '#4a3a2c'; ctx.fillRect(X - 2.5 * s, Y - 22 * s, 5 * s, 22 * s);
  const cols = o.willow ? ['#4f5a3a', '#5f6a44', '#6f7a4c'] : ['#3f5a34', '#4f6e3e', '#6a8a4c'];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU, r = 12 * s;
    ctx.fillStyle = cols[i % 3];
    ctx.beginPath(); ctx.arc(X + Math.cos(a) * r, Y - 34 * s + Math.sin(a) * r * 0.7, 12 * s, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = cols[2]; ctx.beginPath(); ctx.arc(X - 5 * s, Y - 40 * s, 10 * s, 0, TAU); ctx.fill();
  if (winter) { ctx.fillStyle = 'rgba(240,244,250,0.75)'; ctx.beginPath(); ctx.arc(X - 4 * s, Y - 44 * s, 9 * s, Math.PI, TAU); ctx.fill(); }
  void rng;
}
function drawRock(ctx, X, Y, o, winter) {
  const s = (o.s || 1) * (o.peak ? 34 : 14);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(X + s * 0.5, Y + 2, s * 1.3, s * 0.4, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#6f6b66';
  ctx.beginPath(); ctx.moveTo(X - s, Y); ctx.lineTo(X - s * 0.5, Y - s * (o.peak ? 1.4 : 0.7)); ctx.lineTo(X + s * 0.2, Y - s * (o.peak ? 1.9 : 0.9)); ctx.lineTo(X + s, Y - s * 0.4); ctx.lineTo(X + s * 1.1, Y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#8f8a83';
  ctx.beginPath(); ctx.moveTo(X - s, Y); ctx.lineTo(X - s * 0.5, Y - s * (o.peak ? 1.4 : 0.7)); ctx.lineTo(X + s * 0.2, Y - s * (o.peak ? 1.9 : 0.9)); ctx.lineTo(X - s * 0.1, Y); ctx.closePath(); ctx.fill();
  if (winter || o.peak) { ctx.fillStyle = 'rgba(240,244,250,0.92)'; ctx.beginPath(); ctx.moveTo(X - s * 0.62, Y - s * (o.peak ? 1.2 : 0.6)); ctx.lineTo(X + s * 0.2, Y - s * (o.peak ? 1.9 : 0.9)); ctx.lineTo(X + s * 0.55, Y - s * (o.peak ? 1.2 : 0.62)); ctx.lineTo(X, Y - s * (o.peak ? 1.35 : 0.68)); ctx.closePath(); ctx.fill(); }
}
function drawReeds(ctx, X, Y, o, rng) {
  ctx.strokeStyle = '#6a6a3e'; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
  for (let i = 0; i < 9; i++) { const dx = (rng() - 0.5) * 16 * o.s; ctx.beginPath(); ctx.moveTo(X + dx, Y); ctx.lineTo(X + dx + (rng() - 0.5) * 6, Y - (10 + rng() * 14) * o.s); ctx.stroke(); }
  ctx.fillStyle = '#5a4630'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(X + (rng() - 0.5) * 10, Y - (16 + rng() * 6) * o.s, 1.6, 4, 0, 0, TAU); ctx.fill(); }
}
function drawBridge(ctx, o, winter) {
  // a stone bridge across the channel (ground deck + parapets, upright face)
  const hw = o.w / 2, hl = o.len / 2;
  const P = (x, y, h) => [sx(x, y), sy(x, y, h || 0)];
  const deck = [P(o.x - hw, o.y - hl, 8), P(o.x + hw, o.y - hl, 8), P(o.x + hw, o.y + hl, 8), P(o.x - hw, o.y + hl, 8)];
  ctx.fillStyle = '#7d756a';
  const face = [P(o.x + hw, o.y - hl, 0), P(o.x + hw, o.y + hl, 0), P(o.x + hw, o.y + hl, 8), P(o.x + hw, o.y - hl, 8)];
  ctx.beginPath(); face.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill();
  ctx.fillStyle = winter ? '#cfd3dc' : '#a39a8c';
  ctx.beginPath(); deck.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill();
  // arch under the near face
  const [ax, ay] = P(o.x + hw, o.y, 0);
  ctx.fillStyle = '#2f3a3a'; ctx.beginPath(); ctx.ellipse(ax, ay - 2, 12, 7, 0, Math.PI, TAU); ctx.fill();
  ctx.strokeStyle = '#5e574e'; ctx.lineWidth = 3;
  for (const sxn of [-1, 1]) { ctx.beginPath(); const a = P(o.x + sxn * hw, o.y - hl, 8), b = P(o.x + sxn * hw, o.y + hl, 8); ctx.moveTo(a[0], a[1] - 5); ctx.lineTo(b[0], b[1] - 5); ctx.stroke(); }
}
function drawBuilding(ctx, X, Y, o, winter) {
  if (o.kind === 'tower') {
    const w = 44, h = 110;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(X + 30, Y + 6, 46, 14, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#7a7066'; ctx.fillRect(X - w / 2, Y - h, w, h);
    ctx.fillStyle = '#5e554c'; ctx.fillRect(X + w * 0.15, Y - h, w * 0.35, h);
    ctx.fillStyle = '#857a6e'; for (let i = 0; i < 4; i++) ctx.fillRect(X - w / 2 - 3 + i * 13, Y - h - 9, 8, 9);
    ctx.fillStyle = '#2a2420'; ctx.fillRect(X - 4, Y - h + 30, 6, 12);
    if (winter) { ctx.fillStyle = 'rgba(240,244,250,0.9)'; ctx.fillRect(X - w / 2 - 3, Y - h - 2, w + 6, 3); }
  } else if (o.kind === 'keep') {
    const w = 120, h = 150;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(X + 50, Y + 8, 100, 24, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#7d7368'; ctx.fillRect(X - w / 2, Y - h, w, h);
    ctx.fillStyle = '#5f564c'; ctx.fillRect(X + w * 0.12, Y - h, w * 0.38, h);
    ctx.fillStyle = '#8a8075'; for (let i = 0; i < 8; i++) ctx.fillRect(X - w / 2 - 2 + i * 16, Y - h - 11, 10, 11);
    ctx.fillStyle = '#2a2420'; for (let i = 0; i < 3; i++) ctx.fillRect(X - 40 + i * 30, Y - h + 40, 6, 14);
    ctx.fillStyle = '#c4532c'; ctx.beginPath(); ctx.moveTo(X, Y - h - 40); ctx.lineTo(X + 22, Y - h - 34); ctx.lineTo(X, Y - h - 28); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#3a2e24'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X, Y - h - 10); ctx.lineTo(X, Y - h - 42); ctx.stroke();
    if (winter) { ctx.fillStyle = 'rgba(240,244,250,0.9)'; ctx.fillRect(X - w / 2 - 2, Y - h - 2, w + 4, 3); }
  } else {
    const w = 46, h = 26;
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(X + 18, Y + 4, 36, 10, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#8a7e70'; ctx.fillRect(X - w / 2, Y - h, w, h);
    ctx.fillStyle = winter ? '#e8ecf2' : '#6a4a38'; ctx.beginPath(); ctx.moveTo(X - w / 2 - 4, Y - h); ctx.lineTo(X, Y - h - 22); ctx.lineTo(X + w / 2 + 4, Y - h); ctx.closePath(); ctx.fill();
  }
}
