
// ------------------------------------------------------------------ v3 step 5: "Try your art". The owner drops a ChatGPT sheet (PNG) here; the mockup runs the
// intake's alpha, component and color checks, recolors it through luminance into the terrain's warm-cool faces (H9, 6.5) and redraws the
// map with it. Nothing leaves the browser; the sheet lives for this session only. Every entry has its procedural fallback.
const ART_ENTRIES = {
  paper: { label: 'H1 Paper tile', want: 0 },
  broadleaf: { label: 'H2 Broadleaf clumps', want: 16, terrain: 'forest' },
  conifer: { label: 'H3 Conifer clumps and single trees', want: 16, terrain: 'forest' },
  relief: { label: 'H4 Hills (top rows) and peaks (bottom rows)', want: 16 },
};
const lum = (r, g, b) => (0.2126 * s2l(r) + 0.7152 * s2l(g) + 0.0722 * s2l(b)); // relative luminance 0..1
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function recolorPixels(d, lit, shade) { // pure: pixels in, pixels out (the game's src/present/map/recolor.ts)
  const Lc = hex2rgb(lit), Sc = hex2rgb(shade), Ic = hex2rgb('#3E3428');
  for (let k = 0; k < d.length; k += 4) {
    if (!d[k + 3]) continue; const L = Math.pow(lum(d[k], d[k + 1], d[k + 2]), 1 / 2.2);
    if (L < 0.22) { d[k] = Ic[0]; d[k + 1] = Ic[1]; d[k + 2] = Ic[2]; continue; }
    const t = smooth(0.35, 0.8, L); for (let c = 0; c < 3; c++) d[k + c] = Sc[c] + (Lc[c] - Sc[c]) * t;
  }
  return d;
}
function intakeSheet(img, entry) { // returns { frames, raws, warnings, refusal, summary }
  const t0 = performance.now(), sc = Math.min(1, 1024 / Math.max(img.width, img.height)), w = Math.round(img.width * sc), h = Math.round(img.height * sc);
  const c = makeCanvas(w, h), g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, w, h);
  const id = g.getImageData(0, 0, w, h), d = id.data, n = w * h, warnings = [];
  if (entry === 'paper') { // H1: luminance, mean 128, contrast clamped to +-20, downscaled to 256 square; the wrapped-seam difference
    const S = 256, t = makeCanvas(S, S), tg = t.getContext('2d', { willReadFrequently: true }); tg.drawImage(c, 0, 0, S, S); const td = tg.getImageData(0, 0, S, S), q = td.data;
    let m = 0; const Ls = new Float32Array(S * S); for (let k = 0; k < S * S; k++) { Ls[k] = 0.2126 * q[k * 4] + 0.7152 * q[k * 4 + 1] + 0.0722 * q[k * 4 + 2]; m += Ls[k]; } m /= S * S;
    let sd = 0; for (let k = 0; k < S * S; k++) sd += (Ls[k] - m) ** 2; sd = Math.sqrt(sd / (S * S)); const kk = sd > 10 ? 10 / sd : 1; // about +-20 at two sigma
    for (let k = 0; k < S * S; k++) { const v = Math.max(108, Math.min(148, 128 + (Ls[k] - m) * kk)); q[k * 4] = q[k * 4 + 1] = q[k * 4 + 2] = v; q[k * 4 + 3] = 255; }
    tg.putImageData(td, 0, 0);
    let seam = 0; for (let y = 0; y < S; y++) seam += Math.abs(q[(y * S) * 4] - q[(y * S + S - 1) * 4]); for (let x = 0; x < S; x++) seam += Math.abs(q[x * 4] - q[((S - 1) * S + x) * 4]); seam /= 2 * S;
    if (seam > 6) warnings.push(`the wrapped seam differs by ${seam.toFixed(1)} grey levels (ask for a seamless tile)`);
    return { tile: t, frames: [], raws: [t], warnings, summary: `Paper tile: mean set to 128, contrast clamped, 256 square; seam ${seam.toFixed(1)}. ${(performance.now() - t0).toFixed(0)} ms.` };
  }
  // alpha: at least 40% fully transparent, else the white key-out; refuse a painted checkerboard
  let clear = 0; for (let k = 3; k < d.length; k += 4) if (d[k] === 0) clear++;
  if (clear < 0.4 * n) {
    const ck = checker(d, w, h); if (ck) return { refusal: `Fake transparency: a two-grey checker of ${ck} px tiles is painted into the image. Ask again: "Make the background truly transparent (an alpha channel), not a drawn checkerboard. Change nothing else."` };
    const key = new Uint8Array(n); for (let k = 0; k < n; k++) { const r = d[k * 4], gg = d[k * 4 + 1], b = d[k * 4 + 2], Lv = 0.2126 * r + 0.7152 * gg + 0.0722 * b, ch = Math.max(r, gg, b) - Math.min(r, gg, b); if (Lv > 250 && ch < 4) key[k] = 1; }
    for (let k = 0; k < n; k++) { if (key[k]) { d[k * 4 + 3] = 0; continue; } const x = k % w, y = (k / w) | 0; let near = 0; for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) { const xx = x + a, yy = y + b; if (xx >= 0 && yy >= 0 && xx < w && yy < h && key[yy * w + xx]) near++; } if (near) d[k * 4 + 3] = Math.round(d[k * 4 + 3] * (1 - near / 50)); }
    warnings.push('no alpha channel: white keyed out (2 px feather)');
    g.putImageData(id, 0, 0);
  }
  // components: 8-connected flood fill on a 256-square alpha mask, kept at 0.2% of the image or more
  const M = 256, mk = makeCanvas(M, M), mg = mk.getContext('2d', { willReadFrequently: true }); mg.drawImage(c, 0, 0, M, M); const md = mg.getImageData(0, 0, M, M).data;
  const lab = new Int32Array(M * M).fill(-1), comps = [];
  for (let s0 = 0; s0 < M * M; s0++) {
    if (lab[s0] >= 0 || md[s0 * 4 + 3] <= 127) continue; const stack = [s0], idc = comps.length; let x0 = M, y0 = M, x1 = 0, y1 = 0, cnt = 0, edge = false; lab[s0] = idc;
    while (stack.length) { const k = stack.pop(), x = k % M, y = (k / M) | 0; cnt++; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); if (!x || !y || x === M - 1 || y === M - 1) edge = true;
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const xx = x + a, yy = y + b; if (xx < 0 || yy < 0 || xx >= M || yy >= M) continue; const kk = yy * M + xx; if (lab[kk] < 0 && md[kk * 4 + 3] > 127) { lab[kk] = idc; stack.push(kk); } } }
    comps.push({ x0, y0, x1, y1, cnt, edge });
  }
  const keep = comps.filter((q) => q.cnt >= 0.002 * M * M), want = ART_ENTRIES[entry].want;
  if (Math.abs(keep.length - want) > 2) warnings.push(`${keep.length} items found, ${want} expected`);
  const edges = keep.filter((q) => q.edge).length; if (edges) warnings.push(`${edges} item(s) touch the edge of the image`);
  const kx = w / M, ky = h / M, frames = [], raws = [];
  let litOK = 0, inkOK = 0;
  for (const q of keep.sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0)) {
    const fx = Math.max(0, Math.floor(q.x0 * kx) - 2), fy = Math.max(0, Math.floor(q.y0 * ky) - 2), fw = Math.min(w - fx, Math.ceil((q.x1 - q.x0 + 1) * kx) + 4), fh = Math.min(h - fy, Math.ceil((q.y1 - q.y0 + 1) * ky) + 4);
    const raw = makeCanvas(fw, fh), rg = raw.getContext('2d', { willReadFrequently: true }); rg.drawImage(c, fx, fy, fw, fh, 0, 0, fw, fh); raws.push(raw);
    const px = rg.getImageData(0, 0, fw, fh).data; let lL = 0, nL = 0, lR = 0, nR = 0, ink = 0, tot = 0;
    for (let k = 0; k < fw * fh; k++) { if (px[k * 4 + 3] < 128) continue; const L = Math.pow(lum(px[k * 4], px[k * 4 + 1], px[k * 4 + 2]), 1 / 2.2); tot++; if (L < 0.22) ink++; if (k % fw < fw / 2) { lL += L; nL++; } else { lR += L; nR++; } }
    if (nL && nR && lL / nL >= lR / nR) litOK++; if (tot && ink / tot >= 0.02) inkOK++;
    frames.push({ raw, cy: (q.y0 + q.y1) / 2 / M });
  }
  if (litOK < keep.length / 2) warnings.push('light check: most items are not lit from the upper left');
  if (inkOK < keep.length / 2) warnings.push('ink check: most items have no dark ink outline');
  const recolor = (raw, t) => { const F = faces(TERRAIN[t].fill), out = makeCanvas(raw.width, raw.height), og = out.getContext('2d'); og.drawImage(raw, 0, 0); const im = og.getImageData(0, 0, raw.width, raw.height); recolorPixels(im.data, F.lit, F.shade); og.putImageData(im, 0, 0); return out; };
  const res = { warnings, raws, summary: '' };
  if (entry === 'relief') { const top = frames.filter((f) => f.cy < 0.5), bot = frames.filter((f) => f.cy >= 0.5); res.hills = { frames: top.map((f) => recolor(f.raw, 'hills')) }; res.peaks = { frames: bot.map((f) => recolor(f.raw, 'mountains')) }; res.frames = [...res.hills.frames, ...res.peaks.frames]; res.terrains = [...top.map(() => 'hills'), ...bot.map(() => 'mountains')]; }
  else { res.frames = frames.map((f) => recolor(f.raw, 'forest')); res.terrains = frames.map(() => 'forest'); }
  res.summary = `${keep.length} items, ${warnings.length} warning(s), 0 refusals. ${(performance.now() - t0).toFixed(0)} ms.`;
  return res;
}
function checker(d, w, h) { // a periodic two-grey checker of 8 to 16 px tiles over most of the image
  for (let p = 8; p <= 16; p++) {
    let a = 0, na = 0, b = 0, nb = 0, grey = 0, tot = 0;
    for (let y = 0; y < h; y += 3) for (let x = 0; x < w; x += 3) { const k = (y * w + x) * 4, r = d[k], gg = d[k + 1], bb = d[k + 2]; tot++; if (Math.max(r, gg, bb) - Math.min(r, gg, bb) > 6) continue; grey++; const L = (r + gg + bb) / 3; if (((Math.floor(x / p) + Math.floor(y / p)) & 1) === 0) { a += L; na++; } else { b += L; nb++; } }
    if (grey < 0.3 * tot || !na || !nb) continue;
    if (Math.abs(a / na - b / nb) > 12) return p;
  }
  return null;
}
function sampleSheet(entry) { // a seeded test sheet in neutral greys with ink outlines, for review without a ChatGPT image
  const S = 1024, c = makeCanvas(S, S), g = c.getContext('2d'), R = rngFor('sample:' + entry);
  if (entry === 'paper') { const im = g.createImageData(S, S); const n1 = vnoiseTile(S, R, 300, 30), n2 = vnoiseTile(S, R, 24, 20); for (let k = 0; k < S * S; k++) { const v = 205 + n1[k] + n2[k]; im.data[k * 4] = v; im.data[k * 4 + 1] = v * 0.97; im.data[k * 4 + 2] = v * 0.9; im.data[k * 4 + 3] = 255; } g.putImageData(im, 0, 0); return c; }
  const cell = S / 4;
  for (let r = 0; r < 4; r++) for (let q = 0; q < 4; q++) {
    const cx = q * cell + cell / 2, cy = r * cell + cell * 0.7;
    const grey = (L) => `rgb(${L},${L},${L})`;
    const shape = entry === 'relief' ? (r < 2 ? 'hill' : 'peak') : entry === 'conifer' ? (r < 2 ? 'fir' : 'single') : 'clump';
    g.save(); g.lineJoin = 'round'; g.lineWidth = 6; g.strokeStyle = grey(30);
    if (shape === 'clump') { const crowns = makeClump(cx, cy - 40, 4 + Math.floor(R() * 3), R, 0, [38, 52]).map((o) => ({ ...o, x: cx + (o.x - cx), y: cy - 10 + (o.y - cy) })); for (const o of crowns) { crownPath(g, o); g.stroke(); } for (const o of crowns) { crownPath(g, o); g.fillStyle = grey(110); g.fill(); const l = litFace(o); crownPath(g, l); g.fillStyle = grey(200); g.fill(); } }
    if (shape === 'fir' || shape === 'single') { const n2 = shape === 'fir' ? 3 : 1; for (let k = 0; k < n2; k++) { const o = { x: cx + (k - (n2 - 1) / 2) * 50, y: cy - 10 - (k % 2) * 10, r: 46, conifer: true }; crownPath(g, o); g.stroke(); g.save(); crownPath(g, o); g.clip(); g.fillStyle = grey(205); g.fillRect(o.x - 60, o.y - 90, 60, 100); g.fillStyle = grey(105); g.fillRect(o.x, o.y - 90, 60, 100); g.restore(); } }
    if (shape === 'hill') { const w = 170, hh = 80; g.beginPath(); g.ellipse(cx, cy, w / 2, hh, 0, Math.PI, 0); g.closePath(); g.fillStyle = grey(200); g.fill(); g.save(); g.clip(); g.fillStyle = grey(110); g.beginPath(); g.ellipse(cx + 40, cy + 8, 70, 86, 0, Math.PI, 0); g.fill(); g.restore(); g.beginPath(); g.ellipse(cx, cy, w / 2, hh, 0, Math.PI, 0); g.stroke(); }
    if (shape === 'peak') { const q2 = peakGeom(cx, cy, 130, 180, R, false); peakPaint(g, q2, { lit: '#C8C8C8', shade: '#6E6E6E', ink: '#1E1E1E', lw: 6 }, { lw: 6 }, null); }
    g.restore();
  }
  return c;
}
// ---- the panel
const artPanel = document.createElement('div'); artPanel.className = 'artpanel'; artPanel.hidden = true; artPanel.setAttribute('role', 'dialog'); artPanel.setAttribute('aria-label', 'Try your art');
artPanel.innerHTML = `<header><b>Try your art</b><span class="dimtxt">mockup only · nothing is uploaded</span><button class="iconbtn" id="artClose" aria-label="Close">✕</button></header>
  <div class="row"><select id="artEntry" aria-label="Sheet entry">${Object.entries(ART_ENTRIES).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')}</select></div>
  <div class="row"><label class="mbtn">Choose PNG… <input type="file" id="artFile" accept="image/png" hidden></label><button class="mbtn" id="artSample">Use a sample sheet</button><button class="mbtn" id="artBack">Back to procedural</button></div>
  <div class="artsum" id="artSum">Pick an entry and a PNG from ChatGPT. The sheet is checked, recolored into the palette and put on the map beside the procedural look.</div>
  <div class="artres" id="artRes"></div>`;
app.appendChild(artPanel);
const btnTryArt = document.getElementById('btnTryArt');
btnTryArt.addEventListener('click', () => { artPanel.hidden = !artPanel.hidden; btnTryArt.classList.toggle('on', !artPanel.hidden); btnTryArt.setAttribute('aria-expanded', String(!artPanel.hidden)); });
artPanel.querySelector('#artClose').addEventListener('click', () => { artPanel.hidden = true; btnTryArt.classList.remove('on'); });
function applyArt(entry, res) {
  const sum = artPanel.querySelector('#artSum'), out = artPanel.querySelector('#artRes');
  if (res.refusal) { sum.innerHTML = `<span class="bad">Refused.</span> ${res.refusal}`; out.innerHTML = ''; return; }
  if (entry === 'paper') { view.art.paper = { tile: res.tile }; }
  else if (entry === 'relief') view.art.relief = { hills: res.hills, peaks: res.peaks, frames: res.frames };
  else view.art[entry] = { frames: res.frames };
  sum.innerHTML = `<b>${ART_ENTRIES[entry].label}:</b> ${res.summary}${res.warnings.length ? '<br><span class="warn">Warnings: ' + res.warnings.join('; ') + '</span>' : ''}`;
  out.innerHTML = '';
  const frames = entry === 'paper' ? [res.tile] : res.frames;
  frames.slice(0, 24).forEach((f, k) => { // raw cut-out, recolored, and a swatch on its terrain's paint at Mid size
    const row = document.createElement('div'); row.className = 'artrow';
    const cell = (cv, bg) => { const x = makeCanvas(64, 64), xg = x.getContext('2d'); if (bg) { xg.fillStyle = bg; xg.fillRect(0, 0, 64, 64); } const s = Math.min(60 / cv.width, 60 / cv.height); xg.drawImage(cv, 32 - (cv.width * s) / 2, 32 - (cv.height * s) / 2, cv.width * s, cv.height * s); return x; };
    row.appendChild(cell(res.raws[k] ?? f, '#5A5246'));
    if (entry !== 'paper') { row.appendChild(cell(f, '#5A5246')); const t = res.terrains[k], sw = makeCanvas(64, 64), sg = sw.getContext('2d'); sg.fillStyle = TERRAIN[t].fill; sg.fillRect(0, 0, 64, 64); const wMid = (t === 'forest' ? 18 : t === 'hills' ? 22 : 20) * U * (180 / MED_DIAM); drawArtFrame(sg, { frames: [f] }, 32, 46, wMid, 0); row.appendChild(sw); }
    out.appendChild(row);
  });
  if (entry === 'paper') CLOTHB = null;
  invalidateBakes(); refreshKeys(); requestDraw();
}
async function tryArtFile(entry, blobOrCanvas) {
  const img = blobOrCanvas instanceof HTMLCanvasElement ? blobOrCanvas : await createImageBitmap(blobOrCanvas);
  const res = intakeSheet(img, entry); applyArt(entry, res); return res;
}
artPanel.querySelector('#artFile').addEventListener('change', (e) => { const f = e.target.files && e.target.files[0]; if (f) tryArtFile(artPanel.querySelector('#artEntry').value, f); e.target.value = ''; });
artPanel.querySelector('#artSample').addEventListener('click', () => { const en = artPanel.querySelector('#artEntry').value; tryArtFile(en, sampleSheet(en)); });
artPanel.querySelector('#artBack').addEventListener('click', () => { const en = artPanel.querySelector('#artEntry').value; delete view.art[en]; if (en === 'paper') CLOTHB = null; artPanel.querySelector('#artSum').textContent = `${ART_ENTRIES[en].label}: back to the procedural look.`; artPanel.querySelector('#artRes').innerHTML = ''; invalidateBakes(); refreshKeys(); requestDraw(); });
window.__mock.tryArt = (entry) => { artPanel.hidden = false; btnTryArt.classList.add('on'); artPanel.querySelector('#artEntry').value = entry; return tryArtFile(entry, sampleSheet(entry)).then((r) => r.summary); };
