
// ------------------------------------------------------------------ the war table and the tavern (world units; the map is [0, 0, W, H])
// Cloth margin m = 40, hem 6, table margin T = 0.35 (H + 2m), room margin R = 0.5 (H + 2m + 2T).
const CM = 40, HEM = 6, TM = 0.35 * (H + 2 * CM), RM = 0.5 * (H + 2 * CM + 2 * TM);
const CLOTH = [-CM, -CM, W + CM, H + CM];
const TABLE = [-CM - TM, -CM - TM, W + CM + TM, H + CM + TM];
const ROOM = [TABLE[0] - RM, TABLE[1] - RM, TABLE[2] + RM, TABLE[3] + RM];
const TW = TABLE[2] - TABLE[0], TH = TABLE[3] - TABLE[1];
const POFF = 0.06 * (H + 2 * CM);
const PROPS = {
  candle: [CLOTH[0] - POFF, CLOTH[1] - POFF], hourglass: [CLOTH[2] + POFF, CLOTH[1] - POFF],
  ink: [CLOTH[0] - POFF, CLOTH[3] + POFF], tankard: [CLOTH[2] + POFF, CLOTH[3] + POFF],
  bread: [W * 0.6, CLOTH[3] + POFF + 6], letter: [W * 0.32, CLOTH[1] - POFF - 4], tokens: [CLOTH[0] - POFF - 6, H * 0.52],
};
const HEARTH = [TABLE[0] - 330, H * 0.42], WINDOW = [TABLE[2] + 120, -260];
const view = { table: 'full', detail: 'full', chrome: 'approved', parch: false, vision: 'normal', reduced: !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches), pass: false, wipe: false };
const seasonOf = (m) => (m >= 11 || m <= 2 ? 'winter' : m <= 5 ? 'spring' : m <= 8 ? 'summer' : 'autumn');
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
function bakeWorld(rect, res, fn) { // a world-space bake; once drawn it becomes an ImageBitmap, so a blit never re-uploads it
  const [x0, y0, x1, y1] = rect; const c = makeCanvas((x1 - x0) * res, (y1 - y0) * res), g = c.getContext('2d'); g.setTransform(res, 0, 0, res, -x0 * res, -y0 * res); fn(g);
  const out = { canvas: c, src: c, x0, y0, w: x1 - x0, h: y1 - y0 };
  if (window.createImageBitmap) createImageBitmap(c).then((bm) => { out.src = bm; requestDraw(); }).catch(() => {});
  return out;
}
const sq = (g, x, y, s, fill, hi, edge) => { g.fillStyle = fill; g.fillRect(x - s / 2, y - s / 2, s, s); if (hi) { g.fillStyle = hi; g.fillRect(x - s / 2, y - s / 2, s, Math.max(0.8, s / 6)); g.fillRect(x - s / 2, y - s / 2, Math.max(0.8, s / 6), s); } if (edge) { g.strokeStyle = edge; g.lineWidth = Math.max(0.8, s / 10); g.strokeRect(x - s / 2, y - s / 2, s, s); } };
function ellipse(g, x, y, rx, ry, rot = 0) { g.beginPath(); g.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, Math.PI * 2); }

// ---- the oak tile (512 square, seamless; grain along x, ray fleck)
let OAK = null;
function oakTile() {
  if (OAK) return OAK;
  const S = 512, c = makeCanvas(S, S), g = c.getContext('2d'), img = g.createImageData(S, S), d = img.data;
  const base = hex2rgb('#8F7459'), grain = hex2rgb('#715636'), lit = hex2rgb('#B08A5E'), T = 2 * Math.PI / S;
  const R = rngFor('oak:tile');
  const noiseT = new Float32Array(64 * 64); for (let k = 0; k < noiseT.length; k++) noiseT[k] = R() * 2 - 1;
  const vn = (x, y) => { // periodic value noise on an 8 px lattice
    const gx = x / 8, gy = y / 8, ix = Math.floor(gx), iy = Math.floor(gy), fx = gx - ix, fy = gy - iy;
    const at = (a, b) => noiseT[((b & 63) * 64) + (a & 63)];
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    return (at(ix, iy) * (1 - sx) + at(ix + 1, iy) * sx) * (1 - sy) + (at(ix, iy + 1) * (1 - sx) + at(ix + 1, iy + 1) * sx) * sy;
  };
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const ax = x * T;
    const wob = 2.6 * Math.sin(ax + 1.7) + 1.1 * Math.sin(2 * ax + 0.4 + 2 * y * T) + 0.45 * Math.sin(5 * ax + 3 * y * T);
    const v = Math.sin(73 * y * T + wob), v2 = Math.sin(29 * y * T + 0.7 * wob + 1.3);
    const streak = 0.55 * Math.sin(5 * y * T + 0.8 * Math.sin(ax)) + 0.3 * Math.sin(11 * y * T + 2 * Math.sin(2 * ax + 1)) + 0.25 * vn(x / 6, y);
    let r = base[0] * (1 + 0.045 * streak), gg = base[1] * (1 + 0.045 * streak), b = base[2] * (1 + 0.045 * streak);
    const gl = v > 0.96 ? 0.85 : v > 0.82 ? 0.25 * (v - 0.82) / 0.14 : 0;
    const gl2 = v2 > 0.985 ? 0.45 : 0;
    const k = Math.max(gl, gl2); r += (grain[0] - r) * k; gg += (grain[1] - gg) * k; b += (grain[2] - b) * k;
    const sheen = Math.max(0, Math.sin(13 * y * T + wob * 0.5)) * 0.06; r += (lit[0] - r) * sheen; gg += (lit[1] - gg) * sheen; b += (lit[2] - b) * sheen;
    const n = (vn(x * 3, y * 3) * 0.02); const o = (y * S + x) * 4;
    d[o] = r * (1 + n); d[o + 1] = gg * (1 + n); d[o + 2] = b * (1 + n); d[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  for (let k = 0; k < 220; k++) { // ray fleck
    const x = R() * S, y = R() * S, w = 3 + R() * 4; g.fillStyle = 'rgba(187,158,124,.25)';
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { ellipse(g, x + ox, y + oy, w, 1 + R() * 0.6, (R() - 0.5) * 0.15); g.fill(); }
  }
  OAK = c; return c;
}

// ---- T0: the room, seen from above (baked once per settings change and per season)
let ROOMB = null, ROOMKEY = '';
function bakeRoom() {
  const sea = seasonOf(state.month), key = sea + ':' + dpr;
  if (ROOMB && ROOMKEY === key) return ROOMB;
  ROOMKEY = key;
  const res = 0.34 * Math.min(2, dpr);
  ROOMB = bakeWorld(ROOM, res, (g) => {
    const R = rngFor('room:11'), [x0, y0, x1, y1] = ROOM;
    g.fillStyle = '#2A2018'; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    for (let y = y0, k = 0; y < y1; y += 90, k++) { // wide oak floorboards
      g.fillStyle = k % 2 ? '#34281D' : '#3A2C20'; g.fillRect(x0, y, x1 - x0, 88);
      for (let s = 0; s < 26; s++) { g.fillStyle = R() < 0.5 ? 'rgba(255,236,210,.035)' : 'rgba(0,0,0,.05)'; g.fillRect(x0 + R() * (x1 - x0), y + 4 + R() * 80, 200 + R() * 900, 2 + R() * 4); }
      g.fillStyle = '#1E1712'; g.fillRect(x0, y + 88, x1 - x0, 2);
      let x = x0 - R() * 700; while (x < x1) { x += 600 + R() * 900; g.fillRect(x, y, 2.5, 88); }
    }
    // lit planks toward the window (east)
    const lg = g.createLinearGradient(TABLE[2] - 200, 0, ROOM[2], 0); lg.addColorStop(0, 'rgba(90,68,48,0)'); lg.addColorStop(1, 'rgba(90,68,48,.55)');
    g.fillStyle = lg; g.fillRect(TABLE[2] - 200, y0, ROOM[2] - TABLE[2] + 200, y1 - y0);
    // straw or rushes by the door; the door at the south edge
    const door = [W * 0.72, ROOM[3] - 70];
    g.fillStyle = '#2B2018'; g.fillRect(door[0] - 170, door[1], 340, 70); g.strokeStyle = '#1E1712'; g.lineWidth = 3; for (let k = 1; k < 5; k++) { g.beginPath(); g.moveTo(door[0] - 170 + k * 68, door[1]); g.lineTo(door[0] - 170 + k * 68, door[1] + 70); g.stroke(); }
    for (const hx of [door[0] - 120, door[0] + 120]) { sq(g, hx, door[1] + 22, 26, '#4A4744', '#6E6A64', '#2B2A28'); }
    g.lineCap = 'round';
    for (let k = 0; k < 30; k++) { const sx = door[0] - 420 + R() * 260, sy = door[1] - 30 - R() * 160, a = (R() - 0.5) * 1.4; g.strokeStyle = sea === 'spring' && k % 3 === 0 ? '#8E9A6E' : '#B89A5A'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.cos(a) * 40, sy + Math.sin(a) * 40); g.stroke(); }
    if (sea === 'spring') for (let k = 0; k < 40; k++) { const sx = TABLE[0] - 300 + R() * (TW + 600), sy = TABLE[1] - 260 - R() * 160, a = (R() - 0.5) * 0.8; g.strokeStyle = k % 2 ? '#7F8A5E' : '#A39465'; g.lineWidth = 2; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.cos(a) * 34, sy + Math.sin(a) * 34); g.stroke(); }
    if (sea === 'autumn') for (let k = 0; k < 14; k++) { const sx = door[0] - 380 + R() * 300, sy = door[1] - 40 - R() * 200; g.fillStyle = ['#8A5A2A', '#9B6B30', '#6E4A26'][k % 3]; ellipse(g, sx, sy, 9, 5, R() * 3); g.fill(); }
    // the wool rug under the table's south half
    const rug = [TABLE[0] - 0.14 * TW, (TABLE[1] + TABLE[3]) / 2, TABLE[2] + 0.14 * TW, TABLE[3] + 0.26 * TH];
    g.fillStyle = '#6B5A48'; g.fillRect(rug[0], rug[1], rug[2] - rug[0], rug[3] - rug[1]);
    for (let k = 0; k < 900; k++) { g.fillStyle = R() < 0.5 ? 'rgba(255,240,220,.05)' : 'rgba(0,0,0,.06)'; g.fillRect(rug[0] + R() * (rug[2] - rug[0]), rug[1] + R() * (rug[3] - rug[1]), 6 + R() * 10, 2); }
    g.strokeStyle = '#8A7560'; g.lineWidth = 24; g.strokeRect(rug[0] + 30, rug[1] + 30, rug[2] - rug[0] - 60, rug[3] - rug[1] - 60);
    g.strokeStyle = '#4A3A2E'; g.lineWidth = 3; g.strokeRect(rug[0] + 52, rug[1] + 52, rug[2] - rug[0] - 104, rug[3] - rug[1] - 104);
    for (let x = rug[0] + 10; x < rug[2]; x += 14) { g.strokeStyle = '#8A7560'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, rug[3]); g.lineTo(x + 2, rug[3] + 18); g.stroke(); } // fringe
    // the hound asleep on the rug (south-west), head tucked away
    const hd = [TABLE[0] + 40, TABLE[3] + 150];
    g.fillStyle = 'rgba(0,0,0,.25)'; ellipse(g, hd[0] + 8, hd[1] + 10, 80, 50); g.fill();
    g.fillStyle = '#7A6450'; ellipse(g, hd[0], hd[1], 75, 45, -0.15); g.fill();
    g.fillStyle = '#5A4636'; ellipse(g, hd[0] + 10, hd[1] + 18, 62, 22, -0.15); g.fill();
    g.fillStyle = '#7A6450'; ellipse(g, hd[0] - 58, hd[1] - 6, 30, 24, 0.4); g.fill(); // head tucked against the flank
    g.fillStyle = '#5A4636'; ellipse(g, hd[0] - 74, hd[1] - 18, 12, 8, 0.9); g.fill(); // ear
    g.strokeStyle = '#7A6450'; g.lineWidth = 12; g.beginPath(); g.moveTo(hd[0] + 66, hd[1] + 10); g.quadraticCurveTo(hd[0] + 92, hd[1] + 48, hd[0] + 40, hd[1] + 52); g.stroke(); // tail
    g.strokeStyle = 'rgba(28,26,23,.35)'; g.lineWidth = 2; ellipse(g, hd[0], hd[1], 75, 45, -0.15); g.stroke();
    // the bench along the north side, with a folded cloak
    const bn = [TABLE[0] + 0.22 * TW, TABLE[1] - 250, TABLE[0] + 0.72 * TW, TABLE[1] - 140];
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(bn[0] + 10, bn[1] + 12, bn[2] - bn[0], bn[3] - bn[1]);
    g.fillStyle = '#4E3A28'; g.fillRect(bn[0], bn[1], bn[2] - bn[0], bn[3] - bn[1]);
    g.strokeStyle = '#3A2B1E'; g.lineWidth = 3; for (const yy of [bn[1] + 36, bn[1] + 73]) { g.beginPath(); g.moveTo(bn[0], yy); g.lineTo(bn[2], yy); g.stroke(); }
    g.strokeStyle = '#2B2018'; g.strokeRect(bn[0], bn[1], bn[2] - bn[0], bn[3] - bn[1]);
    g.fillStyle = '#5A5148'; g.beginPath(); g.moveTo(bn[0] + 120, bn[1] + 8); g.lineTo(bn[0] + 330, bn[1] + 4); g.lineTo(bn[0] + 340, bn[3] - 8); g.lineTo(bn[0] + 110, bn[3] - 2); g.closePath(); g.fill();
    g.strokeStyle = '#463F38'; g.lineWidth = 3; g.beginPath(); g.moveTo(bn[0] + 116, bn[1] + 52); g.lineTo(bn[0] + 336, bn[1] + 50); g.stroke();
    // a barrel with iron hoops (east), a three-legged stool (west)
    const br = [TABLE[2] + 190, TABLE[3] - 260];
    g.fillStyle = 'rgba(0,0,0,.3)'; ellipse(g, br[0] + 8, br[1] + 10, 58, 58); g.fill();
    g.fillStyle = '#5E4630'; ellipse(g, br[0], br[1], 55, 55); g.fill();
    g.strokeStyle = '#3E2E20'; g.lineWidth = 2; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; g.beginPath(); g.moveTo(br[0] + Math.cos(a) * 18, br[1] + Math.sin(a) * 18); g.lineTo(br[0] + Math.cos(a) * 50, br[1] + Math.sin(a) * 50); g.stroke(); }
    g.strokeStyle = '#3A3836'; g.lineWidth = 6; for (const rr of [52, 34]) { ellipse(g, br[0], br[1], rr, rr); g.stroke(); }
    const st = [TABLE[0] - 150, TABLE[1] + 0.3 * TH];
    g.fillStyle = 'rgba(0,0,0,.3)'; ellipse(g, st[0] + 6, st[1] + 8, 32, 32); g.fill();
    g.fillStyle = '#5E4630'; ellipse(g, st[0], st[1], 30, 30); g.fill(); g.strokeStyle = '#3E2E20'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#3E2E20'; for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.5; ellipse(g, st[0] + Math.cos(a) * 19, st[1] + Math.sin(a) * 19, 4, 4); g.fill(); }
    // the hearth at the west: an arc of stones and the fire bed, its glow across the floor
    const [hx, hy] = HEARTH;
    const glow = g.createRadialGradient(hx, hy, 20, hx, hy, 700); const gm = sea === 'winter' ? 0.36 : 0.3;
    glow.addColorStop(0, `rgba(255,137,14,${gm})`); glow.addColorStop(0.45, `rgba(255,137,14,${gm * 0.35})`); glow.addColorStop(1, 'rgba(255,137,14,0)');
    g.globalCompositeOperation = 'lighter'; g.fillStyle = glow; g.fillRect(hx - 700, hy - 700, 1400, 1400); g.globalCompositeOperation = 'source-over';
    for (let k = 0; k <= 12; k++) { const a = Math.PI / 2 + (k / 12) * Math.PI; g.fillStyle = k % 2 ? '#4A4744' : '#5E5953'; ellipse(g, hx + Math.cos(a) * 120, hy + Math.sin(a) * 120, 26, 20, a); g.fill(); g.strokeStyle = '#2B2A28'; g.lineWidth = 2; g.stroke(); }
    g.fillStyle = '#1C1410'; ellipse(g, hx - 10, hy, 92, 92); g.fill();
    const fire = g.createRadialGradient(hx, hy, 4, hx, hy, 70); fire.addColorStop(0, '#FFC46B'); fire.addColorStop(0.35, '#FF890E'); fire.addColorStop(1, 'rgba(120,40,10,0)');
    g.fillStyle = fire; ellipse(g, hx, hy, 70, 60); g.fill();
    g.strokeStyle = '#2B1A10'; g.lineWidth = 9; for (const [a, b] of [[-40, 30], [-30, -32], [10, 40]]) { g.beginPath(); g.moveTo(hx + a, hy - b * 0.6); g.lineTo(hx - a * 0.8, hy + b * 0.7); g.stroke(); }
    // the window's daylight (east): a pale parallelogram with three lead bars
    const wc = sea === 'winter' ? '#CFE0EA' : sea === 'summer' ? '#FFF1D6' : '#F2EBDD', wa = sea === 'summer' ? 0.17 : 0.14;
    const [wx, wy] = WINDOW, wq = [[wx, wy], [wx + 380, wy - 40], [wx + 520, wy + 820], [wx + 140, wy + 860]];
    g.save(); g.filter = `blur(${Math.round(26 * res)}px)`; g.fillStyle = rgba(wc, wa); g.beginPath(); wq.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); g.restore();
    g.strokeStyle = 'rgba(30,23,18,.22)'; g.lineWidth = 10; g.save(); g.filter = `blur(${Math.round(6 * res)}px)`;
    for (let k = 1; k <= 3; k++) { const t = k / 4; g.beginPath(); g.moveTo(wq[0][0] + (wq[1][0] - wq[0][0]) * t, wq[0][1] + (wq[1][1] - wq[0][1]) * t); g.lineTo(wq[3][0] + (wq[2][0] - wq[3][0]) * t, wq[3][1] + (wq[2][1] - wq[3][1]) * t); g.stroke(); }
    g.beginPath(); g.moveTo((wq[0][0] + wq[3][0]) / 2, (wq[0][1] + wq[3][1]) / 2); g.lineTo((wq[1][0] + wq[2][0]) / 2, (wq[1][1] + wq[2][1]) / 2); g.stroke(); g.restore();
    if (sea === 'winter') { g.fillStyle = 'rgba(235,244,250,.18)'; for (const c of [wq[0], wq[1]]) { ellipse(g, c[0] + 40, c[1] + 50, 60, 40); g.fill(); } }
    if (sea === 'autumn') { g.strokeStyle = 'rgba(207,224,234,.18)'; g.lineWidth = 2; for (let k = 0; k < 24; k++) { const sx = wx + 60 + R() * 340, sy = wy + R() * 700; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + 8, sy + 60); g.stroke(); } }
    // the table's shadow on the floor
    g.save(); g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 30 * res; g.shadowOffsetX = 14 * res; g.shadowOffsetY = 14 * res;
    g.fillStyle = '#000'; g.fillRect(TABLE[0], TABLE[1], TW, TH); g.restore();
  });
  return ROOMB;
}

// ---- T1 to T4: the oak top, its hardware and wear, the table light, the props (baked)
let TABLEB = null, TABLEKEY = '';
function bakeTable() {
  const key = view.table + ':' + dpr;
  if (TABLEB && TABLEKEY === key) return TABLEB;
  TABLEKEY = key;
  const res = 0.75 * Math.min(2, dpr), full = view.table === 'full';
  TABLEB = bakeWorld(TABLE, res, (g) => {
    const R = rngFor('table:11:detail'), [x0, y0, x1, y1] = TABLE;
    const pat = g.createPattern(oakTile(), 'repeat');
    const plankH = TH / 3;
    for (let k = 0; k < 3; k++) {
      pat.setTransform(new DOMMatrix().translateSelf(R() * 512, R() * 512).scaleSelf(1.6, 1));
      g.fillStyle = pat; g.fillRect(x0, y0 + k * plankH, TW, plankH);
      g.fillStyle = k === 1 ? 'rgba(255,240,220,.03)' : 'rgba(30,20,10,.04)'; g.fillRect(x0, y0 + k * plankH, TW, plankH);
      // darker end grain on the short edges
      for (const ex of [x0, x1 - 70]) { const eg = g.createLinearGradient(ex, 0, ex + 70, 0); const left = ex === x0; eg.addColorStop(left ? 0 : 1, 'rgba(62,46,32,.35)'); eg.addColorStop(left ? 1 : 0, 'rgba(62,46,32,0)'); g.fillStyle = eg; g.fillRect(ex, y0 + k * plankH, 70, plankH); }
      for (const ex of [x0 + 44, x1 - 44]) for (const dy of [-plankH * 0.28, plankH * 0.28]) sq(g, ex, y0 + (k + 0.5) * plankH + dy, 6, '#2B2A28', '#6E6A64');
    }
    g.fillStyle = '#5E4630'; for (let k = 1; k < 3; k++) g.fillRect(x0, y0 + k * plankH - 1, TW, 2);
    // the rim: a 22-unit band shaded outward, and a worn lighter strip along the bottom edge
    const rim = 22;
    const edge = (ax, ay, bx, by, gx0, gy0, gx1, gy1, poly) => { const lg = g.createLinearGradient(gx0, gy0, gx1, gy1); lg.addColorStop(0, 'rgba(113,86,54,.55)'); lg.addColorStop(1, '#3E2E20'); g.fillStyle = lg; g.beginPath(); poly.forEach(([x, y], j) => (j ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); };
    edge(0, 0, 0, 0, 0, y0 + rim, 0, y0, [[x0, y0], [x1, y0], [x1 - rim, y0 + rim], [x0 + rim, y0 + rim]]);
    edge(0, 0, 0, 0, 0, y1 - rim, 0, y1, [[x0, y1], [x1, y1], [x1 - rim, y1 - rim], [x0 + rim, y1 - rim]]);
    edge(0, 0, 0, 0, x0 + rim, 0, x0, 0, [[x0, y0], [x0 + rim, y0 + rim], [x0 + rim, y1 - rim], [x0, y1]]);
    edge(0, 0, 0, 0, x1 - rim, 0, x1, 0, [[x1, y0], [x1 - rim, y0 + rim], [x1 - rim, y1 - rim], [x1, y1]]);
    g.fillStyle = 'rgba(176,138,94,.3)'; g.fillRect(x0 + 60, y1 - rim - 10, TW - 120, 9);
    // forged iron corner straps, three square nails per arm
    for (const [cx, cy, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) {
      g.fillStyle = '#4A4744'; g.strokeStyle = '#2B2A28'; g.lineWidth = 2.5;
      const armA = [cx + (sx < 0 ? -110 : 0), cy + (sy < 0 ? -26 : 0), 110, 26], armB = [cx + (sx < 0 ? -26 : 0), cy + (sy < 0 ? -110 : 0), 26, 110];
      for (const a of [armA, armB]) { g.fillRect(...a); g.strokeRect(...a); }
      for (let k = 0; k < 3; k++) { const d = 22 + k * 32; sq(g, cx + sx * d, cy + sy * 13, 7, '#2B2A28', '#6E6A64'); if (k) sq(g, cx + sx * 13, cy + sy * d, 7, '#2B2A28', '#6E6A64'); }
    }
    // knife marks beside the bread board's slot, a tankard ring beside the tankard's slot
    g.strokeStyle = 'rgba(94,70,48,.6)'; g.lineWidth = 1.4;
    for (let k = 0; k < 4; k++) { const bx = PROPS.bread[0] + 100 + R() * 120, by = PROPS.bread[1] - 40 + R() * 90, L = 30 + R() * 20, a = (R() - 0.5) * 0.7; g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + Math.cos(a) * L, by + Math.sin(a) * L); g.stroke(); }
    g.strokeStyle = 'rgba(94,70,48,.35)'; g.lineWidth = 1.5; const tr = [PROPS.tankard[0] - 110, PROPS.tankard[1] + 40];
    g.beginPath(); g.arc(tr[0], tr[1], 34, 0.3, 2.6); g.stroke(); g.beginPath(); g.arc(tr[0], tr[1], 34, 2.9, 5.9); g.stroke();
    // table light, masked off the cloth: the hearth on the west rim, the candle's pool, a rim vignette
    g.save(); g.beginPath(); g.rect(x0, y0, TW, TH); g.rect(CLOTH[0], CLOTH[1], CLOTH[2] - CLOTH[0], CLOTH[3] - CLOTH[1]); g.clip('evenodd');
    if (full) {
      const hg = g.createLinearGradient(x0, 0, x0 + 0.3 * TW, 0); hg.addColorStop(0, 'rgba(255,137,14,.2)'); hg.addColorStop(1, 'rgba(255,137,14,0)');
      g.globalCompositeOperation = 'lighter'; g.fillStyle = hg; g.fillRect(x0, y0, 0.3 * TW, TH);
      const cr = 0.12 * (H + 2 * CM), cp = g.createRadialGradient(PROPS.candle[0], PROPS.candle[1], 8, PROPS.candle[0], PROPS.candle[1], cr);
      cp.addColorStop(0, 'rgba(255,167,87,.25)'); cp.addColorStop(1, 'rgba(255,167,87,0)'); g.fillStyle = cp; g.fillRect(PROPS.candle[0] - cr, PROPS.candle[1] - cr, cr * 2, cr * 2);
      g.globalCompositeOperation = 'source-over';
    }
    for (const [ax, ay, bx, by, rx, ry, rw, rh] of [[x0, 0, x0 + 170, 0, x0, y0, 170, TH], [x1, 0, x1 - 170, 0, x1 - 170, y0, 170, TH], [0, y0, 0, y0 + 150, x0, y0, TW, 150], [0, y1, 0, y1 - 150, x0, y1 - 150, TW, 150]]) {
      const vg = g.createLinearGradient(ax, ay, bx, by); vg.addColorStop(0, 'rgba(20,12,6,.45)'); vg.addColorStop(1, 'rgba(20,12,6,0)'); g.fillStyle = vg; g.fillRect(rx, ry, rw, rh);
    }
    g.restore();
    // the cloth's contact shadow on the oak
    g.save(); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 8; g.shadowOffsetX = 3; g.shadowOffsetY = 3; g.fillStyle = '#3E2E20'; g.fillRect(CLOTH[0], CLOTH[1], CLOTH[2] - CLOTH[0], CLOTH[3] - CLOTH[1]); g.restore();
    if (full) drawStaticProps(g, R);
  });
  return TABLEB;
}
function drawStaticProps(g, R) {
  const ink = '#1C1A17';
  // inkpot, quill and brass dividers (lower left)
  const [ix, iy] = PROPS.ink;
  g.fillStyle = 'rgba(0,0,0,.3)'; ellipse(g, ix + 5, iy + 6, 24, 24); g.fill();
  g.fillStyle = '#1E2A2E'; ellipse(g, ix, iy, 22, 22); g.fill(); g.fillStyle = '#0E1416'; ellipse(g, ix, iy, 9, 9); g.fill();
  g.strokeStyle = 'rgba(207,224,234,.45)'; g.lineWidth = 2; g.beginPath(); g.arc(ix, iy, 16, 3.6, 4.6); g.stroke();
  g.save(); g.translate(ix + 8, iy - 6); g.rotate(-0.85);
  g.fillStyle = '#E9E4D8'; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(46, -16, 96, -4); g.quadraticCurveTo(50, 8, 0, 0); g.fill();
  g.strokeStyle = '#CFC6B4'; g.lineWidth = 1; for (let k = 1; k < 9; k++) { const x = k * 10; g.beginPath(); g.moveTo(x, -2); g.lineTo(x + 6, -9 + (k > 6 ? 3 : 0)); g.stroke(); g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 5, 5); g.stroke(); }
  g.strokeStyle = '#8C8578'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-14, 1); g.lineTo(98, -4); g.stroke(); g.restore();
  g.save(); g.translate(ix + 70, iy - 50); g.rotate(0.5); g.strokeStyle = '#B8914A'; g.lineWidth = 3; g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, 0); g.lineTo(-14, 74); g.moveTo(0, 0); g.lineTo(14, 74); g.stroke(); sq(g, 0, 0, 8, '#B8914A', '#D4B26A', '#5E4630'); g.restore();
  // pewter tankard and two bone dice (lower right)
  const [tx, ty] = PROPS.tankard;
  g.fillStyle = 'rgba(0,0,0,.3)'; ellipse(g, tx + 6, ty + 7, 36, 36); g.fill();
  g.strokeStyle = '#6F7C70'; g.lineWidth = 9; g.beginPath(); g.arc(tx + 38, ty, 16, -1.2, 1.2); g.stroke();
  g.fillStyle = '#91A092'; ellipse(g, tx, ty, 34, 34); g.fill(); g.strokeStyle = '#6F7C70'; g.lineWidth = 5; g.stroke();
  g.fillStyle = '#4A3420'; ellipse(g, tx, ty, 25, 25); g.fill(); g.fillStyle = 'rgba(233,223,194,.75)'; ellipse(g, tx - 2, ty - 2, 20, 19); g.fill(); g.fillStyle = 'rgba(200,180,140,.6)'; ellipse(g, tx + 3, ty + 3, 12, 10); g.fill();
  for (const [dx, dy, a, n] of [[tx - 70, ty + 34, 0.4, 5], [tx - 34, ty + 58, -0.3, 3]]) {
    g.save(); g.translate(dx, dy); g.rotate(a); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-9, -9, 22, 22); g.fillStyle = '#E9E4D8'; g.beginPath(); g.roundRect(-11, -11, 22, 22, 4); g.fill(); g.strokeStyle = '#B8B0A0'; g.lineWidth = 1; g.stroke();
    g.fillStyle = ink; const P = { 3: [[-5, -5], [0, 0], [5, 5]], 5: [[-5, -5], [5, -5], [0, 0], [-5, 5], [5, 5]] }[n]; for (const [px, py] of P) { ellipse(g, px, py, 1.8, 1.8); g.fill(); } g.restore();
  }
  // bread board, a heel of bread and a knife (bottom edge)
  const [bx, by] = PROPS.bread;
  g.save(); g.translate(bx, by); g.rotate(-0.06);
  g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-56, -30, 120, 70); g.fillStyle = '#8C6A47'; g.beginPath(); g.roundRect(-60, -35, 120, 70, 8); g.fill(); g.strokeStyle = '#5E4630'; g.lineWidth = 1.5; g.stroke();
  g.strokeStyle = 'rgba(94,70,48,.5)'; g.lineWidth = 1; for (let k = 0; k < 7; k++) { g.beginPath(); g.moveTo(-56, -26 + k * 9); g.bezierCurveTo(-20, -30 + k * 9 + R() * 6, 20, -22 + k * 9, 56, -26 + k * 9 + R() * 4); g.stroke(); }
  g.fillStyle = '#8A5A2A'; ellipse(g, -18, -2, 30, 20, 0.2); g.fill(); g.fillStyle = '#C9A06A'; ellipse(g, -10, 0, 20, 15, 0.2); g.fill();
  g.fillStyle = 'rgba(255,240,210,.3)'; for (let k = 0; k < 8; k++) { ellipse(g, -16 + R() * 14, -6 + R() * 12, 1.4, 1.4); g.fill(); }
  g.fillStyle = '#A8ADB3'; g.beginPath(); g.moveTo(10, 18); g.lineTo(62, 10); g.lineTo(66, 14); g.lineTo(12, 24); g.closePath(); g.fill(); g.fillStyle = '#4E3A28'; g.fillRect(-26, 20, 38, 8);
  g.restore();
  // a folded letter with a dark wax seal (top edge)
  const [lx, ly] = PROPS.letter;
  g.save(); g.translate(lx, ly); g.rotate(0.08); g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(-41, -26, 90, 60); g.fillStyle = '#E9DFC2'; g.fillRect(-45, -30, 90, 60);
  g.strokeStyle = 'rgba(28,26,23,.25)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-45, -30); g.lineTo(0, 4); g.lineTo(45, -30); g.stroke(); g.strokeRect(-45, -30, 90, 60);
  g.fillStyle = '#4A2A1C'; ellipse(g, 0, 4, 10, 10); g.fill(); g.strokeStyle = 'rgba(0,0,0,.4)'; g.stroke(); g.restore();
  // six spare unpainted shield tokens (left edge)
  const [kx, ky] = PROPS.tokens;
  for (let k = 0; k < 6; k++) {
    const x = kx + (k % 2) * 26 - 13 + (R() - 0.5) * 6, y = ky - 75 + Math.floor(k / 2) * 52 + (R() - 0.5) * 6;
    g.save(); g.translate(x, y); g.rotate((R() - 0.5) * 0.5); g.scale(0.8, 0.8);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.moveTo(3, -10); g.lineTo(17, -5); g.lineTo(17, 6); g.quadraticCurveTo(17, 20, 3, 26); g.quadraticCurveTo(-11, 20, -11, 6); g.lineTo(-11, -5); g.closePath(); g.fill();
    g.fillStyle = '#B08A5E'; g.beginPath(); g.moveTo(0, -13); g.lineTo(14, -8); g.lineTo(14, 3); g.quadraticCurveTo(14, 17, 0, 23); g.quadraticCurveTo(-14, 17, -14, 3); g.lineTo(-14, -8); g.closePath(); g.fill(); g.strokeStyle = '#715636'; g.lineWidth = 2; g.stroke();
    g.restore();
  }
}

// ---- T5: the painted linen cloth: hem, square brass tacks, cartouche, compass rose (baked; never lit)
let CLOTHB = null, CLOTHKEY = '', fontsReady = false;
function bakeCloth() {
  if (!fontsReady && document.fonts && document.fonts.check) fontsReady = document.fonts.check("22px 'Marcellus SC'");
  const key = dpr + ':' + fontsReady;
  if (CLOTHB && CLOTHKEY === key) return CLOTHB;
  CLOTHKEY = key;
  const res = 1.25 * Math.min(2, dpr);
  CLOTHB = bakeWorld(CLOTH, res, (g) => {
    const R = rngFor('cloth:11'), [x0, y0, x1, y1] = CLOTH;
    g.fillStyle = '#E8DCC2'; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    const fl = [shadeL('#E8DCC2', -3), shadeL('#E8DCC2', 3), shadeL('#E8DCC2', -2)];
    g.lineWidth = 0.7; g.lineCap = 'round';
    for (let k = 0; k < 7000; k++) { // fiber flecks, in the margin only (the map covers the rest)
      let x, y; const side = R(); const t = R();
      if (side < 0.35) { x = x0 + t * (x1 - x0); y = y0 + R() * CM; } else if (side < 0.7) { x = x0 + t * (x1 - x0); y = y1 - R() * CM; } else if (side < 0.85) { x = x0 + R() * CM; y = y0 + t * (y1 - y0); } else { x = x1 - R() * CM; y = y0 + t * (y1 - y0); }
      const a = R() * Math.PI, L = 1.5 + R() * 4; g.strokeStyle = fl[k % 3]; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke();
    }
    g.strokeStyle = '#3E2E20'; g.lineWidth = HEM; g.strokeRect(x0 + HEM / 2, y0 + HEM / 2, x1 - x0 - HEM, y1 - y0 - HEM);
    g.strokeStyle = 'rgba(232,220,194,.35)'; g.lineWidth = 0.6; g.setLineDash([3, 3]); g.strokeRect(x0 + HEM + 1.5, y0 + HEM + 1.5, x1 - x0 - 2 * HEM - 3, y1 - y0 - 2 * HEM - 3); g.setLineDash([]);
    for (const [cx, cy] of [[x0 + 12, y0 + 12], [x1 - 12, y0 + 12], [x0 + 12, y1 - 12], [x1 - 12, y1 - 12]]) {
      g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(cx - 5, cy - 5, 12, 12); sq(g, cx, cy, 12, '#B8914A', '#D4B26A', '#1C1A17');
    }
    // the cartouche: a scroll frame in ink with the map's name
    const title = 'The Ember Marches', cx = W / 2, cy = -CM / 2 + 1;
    g.font = "22px 'Marcellus SC', Georgia, serif"; const tw = g.measureText(title).width + 36;
    g.fillStyle = 'rgba(232,220,194,1)'; g.fillRect(cx - tw / 2, cy - 14, tw, 28);
    g.strokeStyle = '#1C1A17'; g.lineWidth = 1.3; g.strokeRect(cx - tw / 2, cy - 14, tw, 28); g.lineWidth = 0.6; g.strokeRect(cx - tw / 2 + 3, cy - 11, tw - 6, 22);
    for (const s of [-1, 1]) { const ex = cx + s * tw / 2; g.lineWidth = 1.3; g.beginPath(); g.moveTo(ex, cy - 14); g.bezierCurveTo(ex + s * 16, cy - 16, ex + s * 16, cy + 2, ex + s * 6, cy + 2); g.bezierCurveTo(ex + s * 1, cy + 2, ex + s * 2, cy - 6, ex + s * 7, cy - 5); g.stroke(); g.beginPath(); g.moveTo(ex, cy + 14); g.bezierCurveTo(ex + s * 12, cy + 14, ex + s * 14, cy + 6, ex + s * 9, cy + 4); g.stroke(); }
    g.fillStyle = '#1C1A17'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(title, cx, cy + 1.5);
    // the compass rose in the upper-right corner of the margin
    const rx = W + CM / 2 - 2, ry = -CM / 2 + 3, rr = 15;
    g.strokeStyle = '#1C1A17'; g.lineWidth = 0.8; g.beginPath(); g.arc(rx, ry, rr * 0.62, 0, Math.PI * 2); g.stroke();
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 - Math.PI / 2, L = k % 2 ? rr * 0.6 : rr, w = k % 2 ? 2 : 3.2; const tip = [rx + Math.cos(a) * L, ry + Math.sin(a) * L], l = [rx + Math.cos(a - Math.PI / 2) * w, ry + Math.sin(a - Math.PI / 2) * w], r2 = [rx + Math.cos(a + Math.PI / 2) * w, ry + Math.sin(a + Math.PI / 2) * w];
      g.fillStyle = k === 0 ? '#1C1A17' : '#E8DCC2'; g.beginPath(); g.moveTo(...l); g.lineTo(...tip); g.lineTo(...r2); g.closePath(); g.fill(); g.stroke(); }
    g.font = "8px 'Marcellus SC', Georgia, serif"; g.fillStyle = '#1C1A17'; g.fillText('N', rx - rr - 5, ry - rr + 4);
    g.strokeStyle = '#1C1A17'; g.lineWidth = 3; g.strokeRect(-1.5, -1.5, W + 3, H + 3); // the map's outline
  });
  return CLOTHB;
}

// ---- the two mirror props, drawn live: the month candle (wax height = 1 - day / 30) and the hourglass (on its side while paused)
function flick(t, ph) { return 0.6 * Math.sin(2 * Math.PI * 0.7 * t + ph) + 0.4 * Math.sin(2 * Math.PI * 1.3 * t + ph * 1.7); }
function drawCandle(g, t, live) {
  const [x, y] = PROPS.candle; const day = state.day;
  g.fillStyle = 'rgba(0,0,0,.3)'; ellipse(g, x + 5, y + 6, 28, 28); g.fill();
  g.strokeStyle = '#4A4744'; g.lineWidth = 4; g.beginPath(); g.arc(x + 30, y + 8, 9, 0, Math.PI * 2); g.stroke(); // ring handle
  g.fillStyle = '#4A4744'; ellipse(g, x, y, 26, 26); g.fill(); g.strokeStyle = '#2B2A28'; g.lineWidth = 2; g.stroke();
  g.fillStyle = '#3A3836'; ellipse(g, x, y, 15, 15); g.fill();
  const hgt = 50 * (1 - day / 30) + 3, top = y - hgt;
  g.fillStyle = '#CFC0A0'; g.fillRect(x - 9, top, 18, hgt); g.fillStyle = '#E9DFC2'; g.fillRect(x - 9, top, 7, hgt);
  g.fillStyle = '#E9DFC2'; ellipse(g, x, top, 9, 4.5); g.fill(); g.strokeStyle = 'rgba(28,26,23,.35)'; g.lineWidth = 0.8; g.stroke();
  g.strokeStyle = '#2B2A28'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, top); g.lineTo(x, top - 4); g.stroke();
  const fl = live ? flick(t, 1.1) : 0, fh = 15 * (1 + 0.02 * fl), fb = 1 + 0.03 * fl;
  const fy = top - 4;
  const glow = g.createRadialGradient(x, fy - fh * 0.5, 1, x, fy - fh * 0.5, 30); glow.addColorStop(0, `rgba(255,200,120,${0.35 * fb})`); glow.addColorStop(1, 'rgba(255,167,87,0)');
  g.fillStyle = glow; g.fillRect(x - 30, fy - fh * 0.5 - 30, 60, 60);
  const fg = g.createRadialGradient(x, fy - fh * 0.35, 0.5, x, fy - fh * 0.4, fh * 0.6); fg.addColorStop(0, '#FFE8C3'); fg.addColorStop(1, '#FF8400');
  g.globalAlpha = Math.min(1, 0.95 * fb); g.fillStyle = fg; g.beginPath(); g.moveTo(x, fy - fh); g.bezierCurveTo(x + 6, fy - fh * 0.5, x + 5, fy, x, fy); g.bezierCurveTo(x - 5, fy, x - 6, fy - fh * 0.5, x, fy - fh); g.fill(); g.globalAlpha = 1;
}
function drawHourglass(g, t, live) {
  const [x, y] = PROPS.hourglass, frac = state.day / 30;
  g.save(); g.translate(x, y); if (state.paused) g.rotate(Math.PI / 2);
  g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(-22, -36, 50, 80);
  g.fillStyle = 'rgba(207,224,234,.3)'; g.beginPath(); g.moveTo(-16, -30); g.lineTo(16, -30); g.lineTo(2, 0); g.lineTo(16, 30); g.lineTo(-16, 30); g.lineTo(-2, 0); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(28,26,23,.5)'; g.lineWidth = 1; g.stroke();
  g.fillStyle = '#C9A86A';
  const up = 1 - frac; if (up > 0.02) { const hh = 26 * up; g.beginPath(); g.moveTo(-14 * up - 2, -hh); g.lineTo(14 * up + 2, -hh); g.lineTo(1.5, -2); g.lineTo(-1.5, -2); g.closePath(); g.fill(); }
  const lo = frac; if (lo > 0.02) { const hh = 26 * lo; g.beginPath(); g.moveTo(-15, 29); g.lineTo(15, 29); g.lineTo(15 - 13 * lo, 29 - hh); g.lineTo(-15 + 13 * lo, 29 - hh); g.closePath(); g.fill(); }
  if (live && !state.paused && !view.reduced) { g.strokeStyle = '#C9A86A'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -1); g.lineTo(0, 29 - 26 * lo); g.stroke(); }
  g.fillStyle = '#5E4630'; g.strokeStyle = '#3E2E20'; g.lineWidth = 1.5;
  for (const cy of [-36, 30]) { g.beginPath(); g.roundRect(-20, cy, 40, 7, 2); g.fill(); g.stroke(); }
  g.fillStyle = '#715636'; for (const px of [-17, 17]) g.fillRect(px - 1.5, -30, 3, 60);
  g.restore();
}
