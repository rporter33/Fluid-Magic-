
// ------------------------------------------------------------------ v4 relief: the rim (the model's shadow on the oak, its cliff face, the plinth, waterfalls, the brass plaque)
// natural §10 defect 5: the face is strata-led (it read as vertical stripes): horizontal strata 6 to 13 units deep, each with its own value, a lit ledge on each top and a
// shadow below, gentle bends and fault steps every 80 to 200 units, short joints inside one stratum only, low-frequency weathering; no full-height facets.
let RIM = null, RIMKEY = '';
function rlOutlineSouth(n) { // the south half of the rounded outline, west to east: [x, y, nx, ny] with the outward normal
  const out = [], rc = RL_RC;
  for (let k = 0; k <= n; k++) { const t = Math.PI - (k / n) * (Math.PI / 2); out.push([rc + rc * Math.cos(t), H - rc + rc * Math.sin(t), Math.cos(t), Math.sin(t)]); }
  const m = Math.max(8, Math.round((W - 2 * rc) / (6 * RLK))); for (let k = 1; k < m; k++) out.push([rc + ((W - 2 * rc) * k) / m, H, 0, 1]);
  for (let k = 0; k <= n; k++) { const t = Math.PI / 2 - (k / n) * (Math.PI / 2); out.push([W - rc + rc * Math.cos(t), H - rc + rc * Math.sin(t), Math.cos(t), Math.sin(t)]); }
  return out;
}
function rlRim() {
  const key = dpr + ':' + fontsReady + ':' + RB.ver + ':' + view.table;
  if (RIM && RIMKEY === key) return RIM;
  RIMKEY = key; const res = 0.9 * Math.min(2, dpr), hs = RL_FACE, pl = RL_PLINTH;
  RIM = bakeWorld([-70, -60, W + 80, H + hs + 70], res, (g) => {
    const S = rlOutlineSouth(14);
    const silhouette = () => { g.beginPath(); g.moveTo(0, RL_RC); g.lineTo(0, H - RL_RC); for (const [x, y] of S) g.lineTo(x, y + hs); g.lineTo(W, RL_RC); g.arcTo(W, 0, W - RL_RC, 0, RL_RC); g.lineTo(RL_RC, 0); g.arcTo(0, 0, 0, RL_RC, RL_RC); g.closePath(); };
    // the shadow on the oak: offset 0.05 D to the lower right, blurred 0.06 D, #000 from 55% at the plinth
    g.save(); g.filter = `blur(${Math.max(1, RL_P.shadowBlurD * RLD * res).toFixed(1)}px)`; g.translate(RL_P.shadowD * RLD, RL_P.shadowD * RLD); g.fillStyle = `rgba(0,0,0,${RL_P.shadowA})`; silhouette(); g.fill(); g.restore();
    // the face, per pixel of this bake (proto/cliff.py): the approved #3A3436 to #221E20 from top to foot
    { const fh = hs - pl, top = rgb2lab(hex2rgb(RL_C.cliffTop)), foot = rgb2lab(hex2rgb(RL_C.cliffFoot)), TV = rlTable('cliff'), K = 1 / RLK, Hu = fh * K;
      const edges = [0]; for (let k = 0; k < 14; k++) edges.push(edges[k] + 6 + 7 * rlH2c(rlH2(k, 0, 9))); // stratum boundaries 6 to 13 units apart
      const X0 = -70, Y0 = -60, fx0 = Math.floor(0 * res), fx1 = Math.ceil(W * res), fy0 = Math.floor((H - RL_RC - Y0) * res), fy1 = Math.ceil((H + fh - Y0) * res), fw = fx1 - fx0 + 1, fhp = fy1 - fy0 + 1;
      const fc = makeCanvas(fw, fhp), fg = fc.getContext('2d'), im = fg.createImageData(fw, fhp), d = im.data;
      const yTop = (x) => { if (x <= S[0][0]) return S[0][1]; for (let k = 0; k < S.length - 1; k++) { const p = S[k], q = S[k + 1]; if (x <= q[0]) { const f = (x - p[0]) / Math.max(1e-6, q[0] - p[0]); return p[1] + (q[1] - p[1]) * f; } } return S[S.length - 1][1]; };
      const turnAt = (x) => (x < RL_RC ? (RL_RC - x) / RL_RC : x > W - RL_RC ? -(x - (W - RL_RC)) / RL_RC : 0); // the face turns west (toward the light) at the west corner
      for (let px = 0; px < fw; px++) {
        const x = (fx0 + px + 0.5) / res + X0; if (x < 0 || x > W) continue; const yt = yTop(x), X = x * K, turn = turnAt(x);
        const fault = Math.floor((X + 40 * rlVN(TV, X / 140, 3.3)) / 130), fo = rlH2c(rlH2(fault, 0, 5)), bend = 1.6 * rlVN(TV, X / 60, 7.1) + (fo - 0.5) * 5;
        for (let py = 0; py < fhp; py++) {
          const y = (fy0 + py + 0.5) / res + Y0; if (y < yt || y > yt + fh) continue; const Y = (y - yt) * K, t = Y / Hu, yb = Y + bend;
          let band = 0; while (band < edges.length - 2 && yb >= edges[band + 1]) band++; const rel = yb - edges[band];
          let Lv = top[0] + (foot[0] - top[0]) * t + (rlH2c(rlH2(band, 0, 13)) - 0.5) * 7; // each stratum its own value (+-3.5 L*)
          if (rel >= 0) Lv += 7 * Math.exp(-rel / 0.5); if (band > 0 || yb > 1) Lv -= 3 * Math.exp(-Math.abs(rel - 1) / 0.6); // the lit ledge on each top, its shadow below
          const js = rlH2c(rlH2(band, 1, 17)), sp = 18 + 30 * js, jx = (X + 97 * js + 14 * rlVN(TV, X / 23 + band * 3.1, 11)) / sp, jf = jx - Math.floor(jx); // joints inside one stratum, 18 to 48 units apart
          if (Math.abs(jf - 0.5) > 0.5 - 0.35 / sp && rlH2c(rlH2(Math.floor(jx), band, 19)) > 0.55 && rel > 0.8) Lv -= 6;
          Lv += 2.5 * rlFbm(TV, X / 30, Y / 12 + 40, 3) - 3 * t * t + 3.5 * turn; // low-frequency weathering, darker toward the foot, the corners' turn to the light
          const o4 = (py * fw + px) * 4; rlLabTo(Lv, top[1] + (foot[1] - top[1]) * t, top[2] + (foot[2] - top[2]) * t, d, o4); d[o4 + 3] = 255;
        }
      }
      fg.putImageData(im, 0, 0); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(fc, fx0, fy0); g.restore();
      // the strata's antialiased top edge under the land: a 0.6 px dark line along the outline
      g.strokeStyle = 'rgba(10,8,9,.35)'; g.lineWidth = 0.6; g.beginPath(); S.forEach(([x, y], k) => (k ? g.lineTo(x, y + 0.3) : g.moveTo(x, y + 0.3))); g.stroke(); }
    // the plinth: the board the model is built on (dark oak), its lit top edge, and the contact line on the table
    g.fillStyle = RL_C.plinth; g.beginPath(); S.forEach(([x, y], k) => (k ? g.lineTo(x, y + hs - pl) : g.moveTo(x, y + hs - pl))); for (let k = S.length - 1; k >= 0; k--) g.lineTo(S[k][0], S[k][1] + hs); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(176,138,94,.55)'; g.lineWidth = 0.8; g.beginPath(); S.forEach(([x, y], k) => (k ? g.lineTo(x, y + hs - pl + 0.4) : g.moveTo(x, y + hs - pl + 0.4))); g.stroke();
    g.strokeStyle = 'rgba(28,26,23,.6)'; g.lineWidth = 2.2; g.beginPath(); S.forEach(([x, y], k) => (k ? g.lineTo(x, y + hs + 0.6) : g.moveTo(x, y + hs + 0.6))); g.stroke();
    // waterfalls: a stream that reaches the south edge falls down the face as a pale streak and ends at the plinth
    if (RB.ready) for (const f of RB.water.falls) {
      const gr = g.createLinearGradient(0, H, 0, H + hs - pl); gr.addColorStop(0, 'rgba(185,211,207,.95)'); gr.addColorStop(0.7, 'rgba(185,211,207,.55)'); gr.addColorStop(1, 'rgba(185,211,207,.2)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(f.x - f.w * 0.55, H); g.lineTo(f.x + f.w * 0.55, H); g.lineTo(f.x + f.w * 0.9, H + hs - pl); g.lineTo(f.x - f.w * 0.9, H + hs - pl); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(240,248,246,.55)'; g.lineWidth = 0.5; for (const dx of [-0.3, 0.1, 0.4]) { g.beginPath(); g.moveTo(f.x + dx * f.w, H + 0.5); g.lineTo(f.x + dx * f.w * 1.5, H + hs - pl - 1); g.stroke(); }
      g.fillStyle = 'rgba(214,232,228,.6)'; ellipse(g, f.x, H + hs - pl - 0.6, f.w * 1.3, 1.1); g.fill();
    }
    // the brass plaque, set on the plinth at the middle of the south face: the map's seeded name
    const pw = RL_P.plaqueD * RLD, ph = Math.min((hs - pl) * 0.72, RL_P.plaqueH * RLK), px0 = W / 2 - pw / 2, py1 = H + hs - pl, py0 = py1 - ph;
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(px0 + 1.2, py0 + 1.2, pw, ph);
    const bg = g.createLinearGradient(0, py0, 0, py1); bg.addColorStop(0, '#CDA862'); bg.addColorStop(0.5, RL_C.brass); bg.addColorStop(1, '#8E6E36'); g.fillStyle = bg; g.fillRect(px0, py0, pw, ph);
    g.strokeStyle = '#D9BC7A'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(px0 + 0.5, py1 - 0.5); g.lineTo(px0 + 0.5, py0 + 0.5); g.lineTo(px0 + pw - 0.5, py0 + 0.5); g.stroke();
    g.strokeStyle = '#6E5428'; g.beginPath(); g.moveTo(px0 + pw - 0.5, py0 + 0.5); g.lineTo(px0 + pw - 0.5, py1 - 0.5); g.lineTo(px0 + 0.5, py1 - 0.5); g.stroke();
    for (const [rx, ry] of [[px0 + 3.2, py0 + 3.2], [px0 + pw - 3.2, py0 + 3.2], [px0 + 3.2, py1 - 3.2], [px0 + pw - 3.2, py1 - 3.2]]) { g.fillStyle = '#7A5F2E'; g.fillRect(rx - 1, ry - 1, 2, 2); g.fillStyle = '#E2C98E'; g.fillRect(rx - 1, ry - 1, 1, 1); }
    const fs = Math.min(ph * 0.62, pw / 12.5); g.font = `${fs.toFixed(2)}px 'Marcellus SC', Georgia, serif`; g.fillStyle = '#1C1A17'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('The Ember Marches', W / 2, (py0 + py1) / 2 + fs * 0.06);
  }, true);
  return RIM;
}
