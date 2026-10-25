'use strict';
// ---- the ground's painted props: trees, rocks, reeds, the bridge and buildings (split from 50-ground.js for size) ----

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
