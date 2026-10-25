
// ------------------------------------------------------------------ v4 relief: bases, figures, towns, hamlets, huts, wells, motifs, events (screen px; the light from the upper left), and the army pieces
// ---- drawing bases, towns, houses (screen px; the light from the upper left; shadows to the lower right)
function rlBasePath(g, x, y, rx, ry, notched) {
  g.beginPath();
  if (!notched) { g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); return; }
  const depth = Math.max(2, 0.12 * 2 * rx), nArc = (0.3 * 2 * Math.PI) / 8; // 8 notches, 30% of the circumference
  for (let m = 0; m <= 96; m++) { const a = (m / 96) * Math.PI * 2, ph = ((a + Math.PI / 8) % (Math.PI / 4)) - Math.PI / 8, inN = Math.abs(ph) < nArc / 2, r = inN ? 1 - depth / rx : 1; const px = x + Math.cos(a) * rx * r, py = y + Math.sin(a) * ry * r; m ? g.lineTo(px, py) : g.moveTo(px, py); }
  g.closePath();
}
function rlBase(g, x, y, rx, ry, rim, opts = {}) { // a dark round base: shadow, side band, top, rim (banner or pewter), worn lip on its upper-left quarter
  const band = Math.max(1.5, 0.12 * 2 * rx * (opts.bandK ?? 1)), lift = opts.lift ?? 0;
  g.fillStyle = `rgba(0,0,0,${opts.shadowA ?? 0.25})`; rlBasePath(g, x + 0.15 * 2 * rx * 0.5 + lift, y + band + 0.15 * rx * 0.64 + lift, rx * (1 + lift * 0.03), ry * (1 + lift * 0.03), false); g.fill();
  y -= lift;
  for (let t = band; t > 0; t -= 1) { g.fillStyle = t > band * 0.5 ? '#0F0D0B' : '#16130F'; rlBasePath(g, x, y + t, rx, ry, opts.notched); g.fill(); }
  const sg = g.createLinearGradient(x - rx, 0, x + rx, 0); sg.addColorStop(0, 'rgba(120,108,92,.35)'); sg.addColorStop(0.45, 'rgba(0,0,0,0)'); g.fillStyle = sg; g.save(); g.beginPath(); g.rect(x - rx - 1, y, 2 * rx + 2, band + ry + 1); g.clip(); rlBasePath(g, x, y + band * 0.5, rx, ry, opts.notched); g.fill(); g.restore();
  g.fillStyle = opts.top ?? RL_C.base; rlBasePath(g, x, y, rx, ry, opts.notched); g.fill();
  if (opts.brass) { g.strokeStyle = RL_C.brass; g.lineWidth = Math.max(1.2, rx * 0.12); rlBasePath(g, x, y, rx + g.lineWidth * 0.2, ry + g.lineWidth * 0.12, opts.notched); g.stroke(); }
  if (rim) { g.strokeStyle = rim; g.lineWidth = opts.rimW ?? 2.4; rlBasePath(g, x, y, rx - g.lineWidth / 2, ry - g.lineWidth * 0.32, opts.notched); g.stroke(); }
  g.strokeStyle = RL_C.baseLip; g.lineWidth = 1; g.beginPath(); g.ellipse(x, y, Math.max(1, rx - (opts.rimW ?? 2.4) - 0.6), Math.max(1, ry - (opts.rimW ?? 2.4) * 0.32 - 0.4), 0, Math.PI * 1.05, Math.PI * 1.45); g.stroke();
  return y;
}
function rlHouse(g, x, y, s, kitK, muted, ground, flags = {}) { // one house seen from 40 degrees: a south wall in shade, the roof's south slope, its lit west end
  const K = rlKitOf(kitK), hw = 0.42 * s, hr = 0.42 * s;
  if (muted && flags.i != null) ground = rlHouseGround(flags.i, x - s / 2 - 0.16 * s, y - hw - hr, x + s / 2 + 0.06 * s, y + 0.06 * s); // the darkest texel under this house (natural §10 defect 3)
  const mu = (c) => (muted ? rlMuted(c, ground) : c);
  g.fillStyle = 'rgba(0,0,0,.25)'; ellipse(g, x + 0.28 * s, y + 0.06 * s, 0.62 * s, 0.17 * s); g.fill();
  if (kitK === 'green') { // a round timber hut under a living roof
    g.fillStyle = mu(shadeL(K.wall, -8)); ellipse(g, x, y - 0.18 * s, 0.46 * s, 0.24 * s); g.fill(); g.fillRect(x - 0.46 * s, y - 0.5 * s, 0.92 * s, 0.32 * s);
    if (flags.ruin) return; const rg = g.createLinearGradient(x - 0.5 * s, y - s, x + 0.5 * s, y); rg.addColorStop(0, mu(flags.fresh ? '#E3CF8F' : K.roofHi)); rg.addColorStop(1, mu(flags.fresh ? '#B89A5A' : K.roof));
    g.fillStyle = rg; g.beginPath(); g.ellipse(x, y - 0.5 * s, 0.56 * s, 0.5 * s, 0, Math.PI, 0); g.closePath(); g.fill();
    if (!flags.shut && !muted) { g.fillStyle = K.win; g.fillRect(x - 0.06 * s, y - 0.36 * s, 0.12 * s, 0.14 * s); } else if (flags.shut) { g.fillStyle = '#2B2A28'; g.fillRect(x - 0.08 * s, y - 0.38 * s, 0.16 * s, 0.16 * s); }
    return;
  }
  g.fillStyle = mu(shadeL(K.wall, -10)); g.fillRect(x - s / 2, y - hw, s, hw); // the south wall, in shade
  g.fillStyle = mu(shadeL(K.wall, 6)); g.beginPath(); g.moveTo(x - s / 2, y); g.lineTo(x - s / 2, y - hw); g.lineTo(x - s / 2 - 0.12 * s, y - hw - 0.1 * s); g.lineTo(x - s / 2 - 0.12 * s, y - 0.1 * s); g.closePath(); g.fill(); // the lit west end
  if (flags.ruin) return;
  const rg = g.createLinearGradient(x - s / 2, 0, x + s / 2, 0); rg.addColorStop(0, mu(shadeL(flags.fresh ? '#E3CF8F' : K.roof, 10))); rg.addColorStop(1, mu(flags.fresh ? '#B89A5A' : K.roof));
  g.fillStyle = rg; g.beginPath(); g.moveTo(x - s / 2 - 0.1 * s, y - hw); g.lineTo(x + s / 2 + 0.06 * s, y - hw); g.lineTo(x + s / 2 - 0.04 * s, y - hw - hr); g.lineTo(x - s / 2 - 0.16 * s, y - hw - hr); g.closePath(); g.fill();
  g.strokeStyle = mu(kitK === 'red' ? '#5E5953' : shadeL(K.roof, 14)); g.lineWidth = Math.max(0.5, 0.06 * s); g.beginPath(); g.moveTo(x - s / 2 - 0.16 * s, y - hw - hr); g.lineTo(x + s / 2 - 0.04 * s, y - hw - hr); g.stroke();
  if (s >= 5) { if (flags.shut) { g.fillStyle = '#2B2A28'; g.fillRect(x - 0.3 * s, y - hw * 0.72, 0.18 * s, 0.26 * s); g.fillRect(x + 0.1 * s, y - hw * 0.72, 0.18 * s, 0.26 * s); } else if (!muted || kitK === 'red') { g.fillStyle = mu(K.win); g.fillRect(x - 0.26 * s, y - hw * 0.66, 0.12 * s, 0.18 * s); g.fillRect(x + 0.14 * s, y - hw * 0.66, 0.12 * s, 0.18 * s); } } // every house tone, windows too, passes through the muting
}
const RL_MUTE = new Map();
function rlMuted(c, ground) { // the color moved toward the ground until it is within 2.3:1 of it (3.6:1 at Near; WCAG luminance; natural §10 defect 3, checked at 2.5 and 4)
  const lim = bandOf(cam.s) === 'near' ? RL_P.seatMute.near : RL_P.seatMute.mid, k = c + ground + lim; let v = RL_MUTE.get(k); if (v) return v; const G = hex2rgb(ground); // within 4:1 at Near (fix 7)
  if (rlWcag(hex2rgb(c), G) <= lim) v = c; else { let lo = 0, hi = 1; for (let it = 0; it < 14; it++) { const m = (lo + hi) / 2; if (rlWcag(hex2rgb(mix(c, ground, m)), G) > lim) lo = m; else hi = m; } v = mix(c, ground, hi); }
  RL_MUTE.set(k, v); return v;
}
function rlPennant(g, x, y, h, col) { g.strokeStyle = '#2B2A28'; g.lineWidth = Math.max(0.8, h * 0.06); g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - h); g.stroke(); g.fillStyle = col; g.beginPath(); g.moveTo(x, y - h); g.lineTo(x + h * 0.55, y - h * 0.84); g.lineTo(x, y - h * 0.66); g.closePath(); g.fill(); g.strokeStyle = 'rgba(28,26,23,.6)'; g.lineWidth = 0.6; g.stroke(); }
function rlTower(g, x, y, w, h, stone, hi) { g.fillStyle = shadeL(stone, -12); g.fillRect(x - w / 2, y - h, w, h); g.fillStyle = hi; g.fillRect(x - w / 2, y - h, w * 0.32, h); g.fillStyle = shadeL(stone, 8); ellipse(g, x, y - h, w / 2, w * 0.24); g.fill(); g.fillStyle = shadeL(stone, -22); for (let k = 0; k < 3; k++) g.fillRect(x - w / 2 + (k * w) / 3 + w * 0.04, y - h - w * 0.2, w * 0.18, w * 0.16); }
function rlTown(g, st, p, band, ground) {
  const { x, T } = st, far = band === 'far', kitK = p.kitOwner ?? p.owner, K = rlKitOf(kitK), rim = p.owner ? BAN[p.owner] : RL_C.pewter, rx = T / 2, ry = rx * 0.64;
  const y = rlBase(g, x, st.y, rx, ry, rim, { rimW: Math.max(1.6, Math.min(3, 0.03 * T)) });
  g.fillStyle = mix(ground, '#7A6A52', 0.6); ellipse(g, x, y - 0.5, rx * 0.8, ry * 0.8); g.fill(); // the yard: opaque packed earth inside the dark ring that carries the rim (fix 8)
  const ws = rlWallStage(p.pd), wr = rx * 0.8, wry = wr * 0.64, wallH = T * (ws === 'palisade' ? 0.07 : 0.085), stone = K.stone;
  const wallArc = (a0, a1) => { // the wall as a band of height wallH along the ring, from angle a0 to a1
    if (!ws || ws === 'watch') return; const n = 28; g.beginPath(); for (let m = 0; m <= n; m++) { const a = a0 + ((a1 - a0) * m) / n; g.lineTo(x + Math.cos(a) * wr, y + Math.sin(a) * wry - wallH); } for (let m = n; m >= 0; m--) { const a = a0 + ((a1 - a0) * m) / n; g.lineTo(x + Math.cos(a) * wr, y + Math.sin(a) * wry); } g.closePath();
    if (ws === 'palisade') { g.fillStyle = '#6B4A2B'; g.fill(); g.strokeStyle = '#3E2A18'; g.lineWidth = Math.max(0.5, T * 0.008); for (let m = 0; m <= Math.round(T * 0.5); m++) { const a = a0 + ((a1 - a0) * m) / Math.round(T * 0.5); const px = x + Math.cos(a) * wr, py = y + Math.sin(a) * wry; g.beginPath(); g.moveTo(px, py); g.lineTo(px, py - wallH * 1.15); g.stroke(); } }
    else { const gr = g.createLinearGradient(x - wr, 0, x + wr, 0); gr.addColorStop(0, K.stoneHi); gr.addColorStop(1, shadeL(stone, -14)); g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(28,26,23,.55)'; g.lineWidth = 0.6; g.stroke(); }
    if (p.siege && p.siege !== 'intact' && a0 > 0) { g.strokeStyle = '#1C1A17'; g.lineWidth = Math.max(0.8, T * 0.012); for (const a of [0.7, 1.9]) { const px = x + Math.cos(a) * wr, py = y + Math.sin(a) * wry - wallH * 0.5; g.beginPath(); g.moveTo(px - 1.5, py - 2); g.lineTo(px + 0.5, py); g.lineTo(px - 0.6, py + 2); g.stroke(); } }
  };
  wallArc(Math.PI, Math.PI * 2); // the back half first
  if (ws === 'towers') for (const a of [Math.PI * 1.25, Math.PI * 1.75]) rlTower(g, x + Math.cos(a) * wr, y + Math.sin(a) * wry, T * 0.1, T * 0.17, stone, K.stoneHi);
  if (ws === 'watch') rlTower(g, x + Math.cos(Math.PI * 1.7) * wr, y + Math.sin(Math.PI * 1.7) * wry, T * 0.08, T * 0.2, '#6B4A2B', '#8C6A47');
  // houses on the spiral, the keep at the center with a fort, the temple and the lab as landmarks on the ring, scaffolding while building
  const items = [], st2 = settlementC(p.i), n = far ? Math.min(3, st2.n) : Math.min(16, st2.n), hs = Math.max(3, Math.min(RL_P.townHouseMax, T * RL_P.townHouseK)), unrestShut = p.unrest >= 50;
  for (let k = 0; k < n; k++) { const a = (k * 137.508 * Math.PI) / 180, r = Math.min(0.62, 0.17 * Math.sqrt(k + 0.6)) * rx; items.push({ y: y + Math.sin(a) * r * 0.64, draw: () => rlHouse(g, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.64, hs, kitK, false, ground, { fresh: st2.houses[k]?.fresh, ruin: st2.houses[k]?.ruin, shut: unrestShut }) }); }
  if (p.buildings.includes('fort')) items.push({ y: y + 0.01, draw: () => { rlTower(g, x, y + 2, T * 0.17, T * 0.3, stone, K.stoneHi); rlPennant(g, x, y + 2 - T * 0.3 - T * 0.04, T * 0.16, p.owner ? BAN[p.owner] : RL_C.pewter); } });
  const lm = (a, fn) => { const lx = x + Math.cos(a) * wr * 0.72, ly = y + Math.sin(a) * wry * 0.72; items.push({ y: ly, draw: () => fn(lx, ly) }); };
  if (!far && (p.buildings.includes('temple') || (p.build && p.build.kind === 'temple'))) lm(-Math.PI * 0.2, (lx, ly) => {
    const w = T * 0.2, h = T * 0.16;
    if (p.build && !p.buildings.includes('temple')) { g.strokeStyle = '#8C6A47'; g.lineWidth = Math.max(0.7, T * 0.012); g.strokeRect(lx - w / 2, ly - h, w, h); g.beginPath(); g.moveTo(lx - w / 2, ly); g.lineTo(lx + w / 2, ly - h); g.moveTo(lx - w / 2, ly - h); g.lineTo(lx + w / 2, ly); g.stroke(); return; }
    if (kitK === 'green') { g.fillStyle = shadeL(K.wall, -10); g.fillRect(lx - w / 2, ly - h * 0.6, w, h * 0.6); g.fillStyle = K.roof; g.beginPath(); g.ellipse(lx, ly - h * 0.6, w * 0.62, h * 0.6, 0, Math.PI, 0); g.closePath(); g.fill(); g.fillStyle = K.roofHi; ellipse(g, lx - w * 0.15, ly - h * 0.95, w * 0.2, h * 0.14); g.fill(); return; }
    g.fillStyle = shadeL(stone, -6); g.fillRect(lx - w / 2, ly - h * 0.5, w, h * 0.5); g.fillStyle = K.stoneHi; g.fillRect(lx - w * 0.36, ly - h * 0.85, w * 0.72, h * 0.35); g.fillStyle = shadeL(stone, -20); g.fillRect(lx - w * 0.2, ly - h * 0.5, w * 0.4, h * 0.3);
    const unlit = p.dom.n && p.dom.n !== (p.kitOwner ?? p.owner); if (!unlit) { g.fillStyle = '#FFB347'; ellipse(g, lx, ly - h * 0.98, w * 0.12, h * 0.16); g.fill(); g.fillStyle = 'rgba(255,179,71,.25)'; ellipse(g, lx, ly - h * 0.98, w * 0.28, h * 0.3); g.fill(); } else { g.fillStyle = '#3A3836'; ellipse(g, lx, ly - h * 0.9, w * 0.12, h * 0.07); g.fill(); }
  });
  if (!far && p.buildings.includes('lab')) lm(-Math.PI * 0.8, (lx, ly) => { const w = T * 0.11, h = T * 0.26; rlTower(g, lx, ly, w, h, kitK === 'green' ? '#8C6A47' : '#6E6A64', kitK === 'green' ? '#A88A64' : '#8E8A84'); g.fillStyle = '#2B2A28'; g.fillRect(lx + w * 0.15, ly - h - w * 0.5, w * 0.22, w * 0.5); if (!far) smokeWisp(g, lx + w * 0.26, ly - h - w * 0.5, 0.8, h * 0.6); });
  items.sort((a, b) => a.y - b.y); for (const it of items) it.draw();
  wallArc(0, Math.PI); // the front half over the houses
  if (ws === 'towers') { for (const a of [Math.PI * 0.25, Math.PI * 0.75]) rlTower(g, x + Math.cos(a) * wr, y + Math.sin(a) * wry, T * 0.1, T * 0.17, stone, K.stoneHi); const gx = x, gy = y + wry; g.fillStyle = shadeL(stone, -10); g.fillRect(gx - T * 0.09, gy - T * 0.15, T * 0.18, T * 0.15); g.fillStyle = '#1C1A17'; g.beginPath(); g.moveTo(gx - T * 0.035, gy); g.lineTo(gx - T * 0.035, gy - T * 0.06); g.arc(gx, gy - T * 0.06, T * 0.035, Math.PI, 0); g.lineTo(gx + T * 0.035, gy); g.closePath(); g.fill(); }
  if (!p.buildings.includes('fort') && n > 0 && !far) { const a = 0, r = 0.17 * Math.sqrt(0.6) * rx; rlPennant(g, x + Math.cos(a) * r - hs * 0.3, y - hs * 0.84, hs * 1.3, p.owner ? BAN[p.owner] : RL_C.pewter); }
  return y;
}
function rlHamlet(g, st, p, band, ground) { // houses on the land, no base; muted at every band (within 2.5:1 of the ground at Mid, 4:1 at Near; fix 7)
  const near = band === 'near', s2 = settlementC(p.i), n = near ? s2.n : Math.min(4, s2.n), hs = st.T, shut = p.unrest >= 50, list = []; // a cluster of at most 4 at Mid
  for (let k = 0; k < n; k++) { const a = (k * 137.508 * Math.PI) / 180, r = hs * 0.62 * Math.sqrt(k + 0.35); list.push([st.x + Math.cos(a) * r * 1.25, st.y + Math.sin(a) * r * 0.72, k]); }
  list.sort((a, b) => a[1] - b[1]); for (const [x, y, k] of list) rlHouse(g, x, y, hs * (k === 0 ? 1.1 : 1), p.kitOwner ?? p.owner, true, ground, { fresh: s2.houses[k]?.fresh, ruin: s2.houses[k]?.ruin, shut, i: p.i });
}
// the gesso hut at an unexplored seat: its walls and roof muted toward the ground like a hamlet's (fix 4; #C9C1B1 was 9.5:1 on forest)
function rlHut(g, st, ground) { const s = st.T, x = st.x, y = st.y; ground = rlHouseGround(st.i, x - 0.6 * s, y - 0.86 * s, x + 0.56 * s, y + 0.05 * s); g.fillStyle = 'rgba(0,0,0,.2)'; ellipse(g, x + 0.25 * s, y + 0.05 * s, 0.6 * s, 0.16 * s); g.fill(); g.fillStyle = rlMuted('#C9C1B1', ground); g.fillRect(x - s / 2, y - 0.42 * s, s, 0.42 * s); g.fillStyle = rlMuted(RL_C.gesso, ground); g.beginPath(); g.moveTo(x - 0.6 * s, y - 0.42 * s); g.lineTo(x + 0.56 * s, y - 0.42 * s); g.lineTo(x + 0.44 * s, y - 0.86 * s); g.lineTo(x - 0.5 * s, y - 0.86 * s); g.closePath(); g.fill(); g.strokeStyle = 'rgba(28,26,23,.35)'; g.lineWidth = 0.6; g.stroke(); }
function rlWell(g, wl, p) { // the Wellspring: a basin with five drops in the five colors on its own base; a static glow while unclaimed; claim stones
  const rx = wl.B / 2, ry = rx * 0.64, claimed = p.claim === 'red', rim = claimed ? BAN.red : RL_C.lip;
  if (!claimed) { const gr = g.createRadialGradient(wl.x, wl.y - ry, 0, wl.x, wl.y - ry, rx * 2); gr.addColorStop(0, 'rgba(244,238,223,.28)'); gr.addColorStop(1, 'rgba(244,238,223,0)'); g.fillStyle = gr; g.fillRect(wl.x - rx * 2, wl.y - ry - rx * 2, rx * 4, rx * 4); }
  const y = rlBase(g, wl.x, wl.y, rx, ry, rim, { rimW: Math.max(1.6, rx * 0.12) });
  g.fillStyle = '#9A9286'; ellipse(g, wl.x, y - ry * 0.25, rx * 0.62, ry * 0.62); g.fill(); g.fillStyle = '#CFC6B4'; ellipse(g, wl.x, y - ry * 0.45, rx * 0.6, ry * 0.58); g.fill();
  g.fillStyle = '#7FA9BA'; ellipse(g, wl.x, y - ry * 0.48, rx * 0.42, ry * 0.36); g.fill(); g.fillStyle = 'rgba(232,246,240,.5)'; ellipse(g, wl.x - rx * 0.12, y - ry * 0.55, rx * 0.16, ry * 0.08); g.fill();
  const cols = ['#F3E6B8', '#3A7BD5', '#3D2B4F', '#FD6533', '#00674B'];
  for (let k = 0; k < 5; k++) { const a = Math.PI + 0.25 + k * 0.66, px = wl.x + Math.cos(a) * rx * 0.64, py = y - ry * 0.45 + Math.sin(a) * ry * 0.6, h = rx * 0.34; g.fillStyle = claimed ? '#CFC6B4' : cols[k]; g.beginPath(); g.moveTo(px - h * 0.22, py); g.quadraticCurveTo(px - h * 0.24, py - h * 0.6, px, py - h); g.quadraticCurveTo(px + h * 0.24, py - h * 0.6, px + h * 0.22, py); g.closePath(); g.fill(); g.strokeStyle = 'rgba(28,26,23,.6)'; g.lineWidth = 0.6; g.stroke(); }
  if (claimed) for (let k = 0; k < 4; k++) { const a = Math.PI * 0.15 + (k / 3) * Math.PI * 0.7, px = wl.x + Math.cos(a) * rx * 0.86, py = y + Math.sin(a) * ry * 0.86; g.fillStyle = BAN.red; g.fillRect(px - rx * 0.06, py - rx * 0.22, rx * 0.12, rx * 0.22); }
  if (p.claim === 'running') { g.strokeStyle = '#E9E4D8'; g.lineWidth = Math.max(1, rx * 0.08); g.beginPath(); g.ellipse(wl.x, y, rx * 1.15, ry * 1.15, 0, -Math.PI / 2, Math.PI / 2); g.stroke(); }
}
const RL_LOOKKINDS = { red: (lvl) => ['cairn', ...(lvl >= 2 ? ['scorch', 'shard', 'brazier'] : [])], green: (lvl) => ['blossom', 'ivy', ...(lvl >= 2 ? ['sapling', 'moss', 'blossom'] : []), ...(lvl >= 3 ? ['bramble'] : [])] };
const RL_POLEKINDS = { Fury: ['warCairn', 'tornBanner'], Turmoil: ['brokenFence', 'toppledCart', 'smoke'], Growth: ['fruitTree', 'cropClump'], Wild: ['briar', 'fern', 'beastDen'] };
function rlMotif(g, kind, x, y, k, R) { // one scenery piece standing on the land at (x, y); k scales a 10 px design; lit from the upper left
  const sh = (rx, ry) => { g.fillStyle = 'rgba(0,0,0,.22)'; ellipse(g, x + 0.3 * rx, y + 0.15 * ry, rx, ry); g.fill(); };
  const stone = (sx, sy, w, h, c) => { g.fillStyle = shadeL(c, -14); g.beginPath(); g.moveTo(sx - w / 2, sy); g.lineTo(sx - w * 0.4, sy - h); g.lineTo(sx + w * 0.35, sy - h * 1.05); g.lineTo(sx + w / 2, sy); g.closePath(); g.fill(); g.fillStyle = shadeL(c, 6); g.beginPath(); g.moveTo(sx - w / 2, sy); g.lineTo(sx - w * 0.4, sy - h); g.lineTo(sx - w * 0.02, sy - h * 1.02); g.lineTo(sx - w * 0.08, sy); g.closePath(); g.fill(); };
  switch (kind) {
    case 'cairn': sh(4 * k, 1.3 * k); for (let m = 0; m < 3; m++) { const r = (3 - m * 0.7) * k, yy = y - m * 1.9 * k; g.fillStyle = '#6E6A64'; ellipse(g, x, yy, r, r * 0.55); g.fill(); g.fillStyle = '#8E8A84'; ellipse(g, x - r * 0.25, yy - r * 0.15, r * 0.55, r * 0.3); g.fill(); } g.fillStyle = '#FFB347'; ellipse(g, x + 0.7 * k, y - 2.4 * k, 0.6 * k, 0.6 * k); g.fill(); return;
    case 'scorch': g.fillStyle = 'rgba(52,48,44,.45)'; ellipse(g, x, y, 6 * k, 2.6 * k, (R() - 0.5) * 0.5); g.fill(); g.fillStyle = '#FF9A3A'; for (let m = 0; m < 4; m++) { ellipse(g, x + (R() - 0.5) * 7 * k, y + (R() - 0.5) * 2.4 * k, 0.45 * k, 0.45 * k); g.fill(); } return;
    case 'shard': sh(4 * k, 1.2 * k); for (const [dx, h] of [[-1.6, 5], [1.3, 7]]) { g.fillStyle = '#26232A'; g.beginPath(); g.moveTo(x + (dx - 1.2) * k, y); g.lineTo(x + dx * k, y - h * k); g.lineTo(x + (dx + 1.2) * k, y); g.closePath(); g.fill(); g.fillStyle = '#5A5560'; g.beginPath(); g.moveTo(x + (dx - 1.2) * k, y); g.lineTo(x + dx * k, y - h * k); g.lineTo(x + (dx - 0.2) * k, y); g.closePath(); g.fill(); } return;
    case 'brazier': sh(3 * k, 1 * k); g.strokeStyle = '#2B2A28'; g.lineWidth = 0.9 * k; g.beginPath(); g.moveTo(x - 2 * k, y); g.lineTo(x, y - 3.4 * k); g.lineTo(x + 2 * k, y); g.stroke(); g.fillStyle = '#3A3836'; g.beginPath(); g.ellipse(x, y - 3.6 * k, 2.6 * k, 1.2 * k, 0, 0, Math.PI); g.fill(); g.fillStyle = '#FF8A2A'; ellipse(g, x, y - 4.4 * k, 1.5 * k, 1.1 * k); g.fill(); g.fillStyle = '#FFD27A'; ellipse(g, x - 0.2 * k, y - 4.8 * k, 0.7 * k, 0.6 * k); g.fill(); return;
    case 'blossom': sh(4 * k, 1.3 * k); for (const [dx, dy, r] of [[-1.8, -1.6, 2.2], [1.8, -1.8, 2.3], [0, -3.3, 2.1]]) { g.fillStyle = '#3F5E2E'; ellipse(g, x + dx * k, y + dy * k, r * k, r * 0.85 * k); g.fill(); g.fillStyle = '#5E8044'; ellipse(g, x + (dx - 0.5) * k, y + (dy - 0.5) * k, r * 0.55 * k, r * 0.45 * k); g.fill(); } g.fillStyle = '#EAD2DA'; for (let m = 0; m < 7; m++) { const a = m * 2.4; ellipse(g, x + Math.cos(a) * 2.5 * k, y - 2.3 * k + Math.sin(a) * 1.7 * k, 0.55 * k, 0.55 * k); g.fill(); } return;
    case 'ivy': case 'moss': sh(3 * k, 1 * k); stone(x, y, 3.4 * k, 6.2 * k, '#9A958C'); g.fillStyle = '#4E6B3A'; g.fillRect(x - 1.4 * k, y - 6.3 * k, 2.6 * k, 1.5 * k); if (kind === 'ivy') { g.strokeStyle = '#5E8044'; g.lineWidth = 0.8 * k; g.beginPath(); g.moveTo(x - 1.6 * k, y); g.quadraticCurveTo(x - 0.6 * k, y - 2.5 * k, x + 0.4 * k, y - 4.5 * k); g.stroke(); } return;
    case 'sapling': sh(2.4 * k, 0.8 * k); g.strokeStyle = '#5E4630'; g.lineWidth = 0.8 * k; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 4.5 * k); g.stroke(); g.fillStyle = '#4E6B3A'; ellipse(g, x, y - 5.6 * k, 2 * k, 1.8 * k); g.fill(); g.fillStyle = '#6E8F4E'; ellipse(g, x - 0.6 * k, y - 6.1 * k, 1 * k, 0.8 * k); g.fill(); return;
    case 'bramble': case 'briar': g.strokeStyle = kind === 'bramble' ? '#5A3A28' : '#3F4A2A'; g.lineWidth = 0.9 * k; for (let m = 0; m < 3; m++) { g.beginPath(); g.arc(x + (m - 1) * 2.6 * k, y, 2.2 * k, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); } return;
    case 'warCairn': rlMotif(g, 'cairn', x, y, k, R); g.strokeStyle = '#5E4630'; g.lineWidth = 0.8 * k; for (const dx of [-1, 1.2]) { g.beginPath(); g.moveTo(x + dx * k, y - 4 * k); g.lineTo(x + dx * 1.6 * k, y - 11 * k); g.stroke(); } g.fillStyle = '#A8ADB3'; for (const dx of [-1, 1.2]) { g.beginPath(); g.moveTo(x + (dx * 1.6 - 0.7) * k, y - 10.6 * k); g.lineTo(x + dx * 1.6 * k, y - 13 * k); g.lineTo(x + (dx * 1.6 + 0.7) * k, y - 10.6 * k); g.closePath(); g.fill(); } return;
    case 'tornBanner': sh(2 * k, 0.7 * k); g.strokeStyle = '#3E2E20'; g.lineWidth = 0.8 * k; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 0.6 * k, y - 10 * k); g.stroke(); g.fillStyle = '#7A1E12'; g.beginPath(); g.moveTo(x + 0.6 * k, y - 10 * k); g.lineTo(x + 5 * k, y - 9.2 * k); g.lineTo(x + 3.4 * k, y - 8 * k); g.lineTo(x + 5.2 * k, y - 6.8 * k); g.lineTo(x + 2.6 * k, y - 6.4 * k); g.lineTo(x + 0.5 * k, y - 6 * k); g.closePath(); g.fill(); return;
    case 'brokenFence': g.strokeStyle = '#6B4A2B'; g.lineWidth = 0.9 * k; for (const dx of [-4.5, -1.5, 1.8, 4.6]) { g.beginPath(); g.moveTo(x + dx * k, y); g.lineTo(x + (dx + (dx > 4 ? 1.2 : 0)) * k, y - 3.2 * k); g.stroke(); } g.beginPath(); g.moveTo(x - 4.5 * k, y - 2.2 * k); g.lineTo(x - 1.5 * k, y - 2.4 * k); g.moveTo(x + 1.8 * k, y - 2 * k); g.lineTo(x + 5.2 * k, y - 0.8 * k); g.stroke(); return;
    case 'toppledCart': sh(4 * k, 1.2 * k); g.save(); g.translate(x, y); g.rotate(0.45); g.fillStyle = '#8C6A47'; g.fillRect(-3.6 * k, -2.6 * k, 7.2 * k, 2.6 * k); g.restore(); g.strokeStyle = '#3E2E20'; g.lineWidth = 0.9 * k; ellipse(g, x + 2.6 * k, y + 0.4 * k, 1.4 * k, 1.4 * k); g.stroke(); return;
    case 'smoke': g.strokeStyle = 'rgba(110,106,100,.5)'; g.lineWidth = 1.6 * k; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 2.5 * k, y - 4 * k, x - 2.5 * k, y - 8 * k, x + 1.5 * k, y - 12 * k); g.stroke(); g.lineCap = 'butt'; return;
    case 'fruitTree': sh(4 * k, 1.3 * k); g.strokeStyle = '#5E4630'; g.lineWidth = 0.9 * k; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 4 * k); g.stroke(); g.fillStyle = '#3F5E2E'; ellipse(g, x, y - 6.4 * k, 3.6 * k, 3 * k); g.fill(); g.fillStyle = '#6E8F4E'; ellipse(g, x - 1.2 * k, y - 7.4 * k, 1.8 * k, 1.3 * k); g.fill(); g.fillStyle = '#D9874A'; for (let m = 0; m < 5; m++) { const a = m * 1.3 + 0.4; ellipse(g, x + Math.cos(a) * 2.2 * k, y - 6.4 * k + Math.sin(a) * 1.7 * k, 0.5 * k, 0.5 * k); g.fill(); } return;
    case 'cropClump': g.strokeStyle = '#4E7A32'; g.lineWidth = 0.8 * k; for (let m = 0; m < 6; m++) { g.beginPath(); g.moveTo(x + (-3 + m * 1.2) * k, y); g.lineTo(x + (-3.4 + m * 1.3) * k, y - (3.5 + (m % 2)) * k); g.stroke(); } return;
    case 'fern': g.strokeStyle = '#5E8A3A'; g.lineWidth = 0.8 * k; for (const a of [-0.7, 0, 0.7]) { g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.sin(a) * 3 * k, y - 3 * k, x + Math.sin(a) * 5 * k, y - 4.5 * k); g.stroke(); } return;
    case 'beastDen': g.fillStyle = '#5E4630'; g.beginPath(); g.ellipse(x, y, 4.6 * k, 2.8 * k, 0, Math.PI, 0); g.closePath(); g.fill(); g.fillStyle = '#1C1A17'; g.beginPath(); g.ellipse(x, y, 1.9 * k, 1.5 * k, 0, Math.PI, 0); g.fill(); g.strokeStyle = '#E9E4D8'; g.lineWidth = 0.8 * k; g.beginPath(); g.moveTo(x + 3.2 * k, y + 0.5 * k); g.lineTo(x + 5.5 * k, y - 0.2 * k); g.stroke(); return;
  }
}
function rlDrawPieces(g, band, lay) { // review only: SKIP 'nonseats' draws the seats alone (the seat-muting check)
  const only = SKIP.has('nonseats');
  // decals on the land first: churned ground after a battle, burnt patches, ash, fresh growth
  if (!only) for (const { p, st, scar } of lay.events) {
    const R = rngFor(`relief:${MAP_SEED}:decal:${p.i}`), [sx, sy] = rlToScr(st.x, st.y), k = Math.max(0.7, Math.min(2.4, 0.012 * lay.Dpx));
    if ((p.scar === 'churned' || p.scar === 'cairns') && scar) { g.save(); g.globalAlpha = p.scar === 'churned' ? 0.45 : 0.25; const [cx, cy] = rlToScr(scar[0], scar[1]); for (let m = 0; m < 14; m++) { const x = cx + (R() - 0.5) * 0.16 * lay.Dpx, y = cy + (R() - 0.5) * 0.07 * lay.Dpx; g.fillStyle = m % 2 ? '#3A2E22' : '#5A4632'; ellipse(g, x, y, (1.2 + R() * 2.2) * k, (0.5 + R() * 0.8) * k, R() * 0.6); g.fill(); } g.restore(); }
    for (const fx of p.fx ?? []) {
      if (fx.kind === 'burn') { for (let m = 0; m < 6; m++) { const x = sx + (R() - 0.5) * 0.6 * lay.Dpx, y = sy + (R() - 0.5) * 0.45 * lay.Dpx; g.fillStyle = 'rgba(36,32,28,.55)'; ellipse(g, x, y, (6 + R() * 7) * k, (3 + R() * 3) * k, R()); g.fill(); smokeWisp(g, x, y, 1.2, 14 * k); } }
      if (fx.kind === 'ashrain') { for (let m = 0; m < 60 * fx.step; m++) { const x = sx + (R() - 0.5) * 0.7 * lay.Dpx, y = sy + (R() - 0.5) * 0.5 * lay.Dpx; g.fillStyle = m % 3 ? 'rgba(74,71,68,.75)' : 'rgba(233,228,216,.8)'; g.fillRect(x, y, 1.6 * k, 0.9 * k); } }
      if (fx.kind === 'fertile') { g.strokeStyle = '#7FB04A'; g.lineWidth = Math.max(0.8, 0.8 * k); for (let m = 0; m < 14; m++) { const x = sx + (R() - 0.5) * 0.55 * lay.Dpx, y = sy + (R() - 0.5) * 0.4 * lay.Dpx; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - 2 * k, y - 3 * k, x - 3 * k, y - 4 * k); g.moveTo(x, y); g.quadraticCurveTo(x + 2 * k, y - 3 * k, x + 3 * k, y - 4.5 * k); g.stroke(); } }
    }
  }
  const items = [];
  for (const [i, st] of lay.seats) {
    if (!st.kind) continue; const p = prov[i], [x, y] = rlToScr(st.x, st.y), s2 = { ...st, x, y }, k = rlLayK(lay), ground = rlHouseGround(i, x - st.r * k, y - st.r * 0.64 * k, x + st.r * k, y + st.r * 0.64 * k, true); // the seat's ground: the bake under it (the town yard; houses take their own)
    if (st.kind === 'town') items.push({ y, f: () => rlTown(g, s2, p, band, ground) });
    else { const fade = rlSmooth(RL_P.hamletDpx, RL_P.hamletFadePx, lay.Dpx), f = st.kind === 'hamlet' ? () => rlHamlet(g, s2, p, band, ground) : () => rlHut(g, s2, ground); if (fade > 0.001) items.push({ y, f: () => { g.save(); g.globalAlpha = fade; f(); g.restore(); } }); } // hamlets and huts fade in from 100 to 130 px a province (fix 4)
  }
  if (!only) for (const wl of lay.wells) { const [x, y] = rlToScr(wl.x, wl.y); items.push({ y, f: () => rlWell(g, { ...wl, x, y }, prov[wl.i]) }); }
  if (!only) for (const q of lay.scen) { const [x, y] = rlToScr(q.x, q.y); items.push({ y, f: () => { const R = rngFor(`relief:motif:${q.i}:${q.j}`); if (q.kind === 'pole') { const ks = RL_POLEKINDS[q.pole]; rlMotif(g, ks[q.j % ks.length], x, y, q.k, R); } else { const ks = RL_LOOKKINDS[q.look](q.lvl); rlMotif(g, ks[q.j % ks.length], x, y, q.k, R); } } }); }
  if (!only) for (const q of lay.stones) { const [x, y] = rlToScr(q.x, q.y); items.push({ y, f: () => { g.fillStyle = 'rgba(0,0,0,.25)'; ellipse(g, x + 2, y + 1, 4, 1.4); g.fill(); g.fillStyle = '#9A958C'; g.beginPath(); g.moveTo(x - 2.6, y); g.lineTo(x - 2, y - 9); g.lineTo(x + 2, y - 10); g.lineTo(x + 2.6, y); g.closePath(); g.fill(); g.fillStyle = MANA[q.c] ? MANA[q.c].fill : '#E9E4D8'; g.fillRect(x - 1.6, y - 7, 3.2, 2.6); g.strokeStyle = 'rgba(28,26,23,.6)'; g.lineWidth = 0.7; g.strokeRect(x - 1.6, y - 7, 3.2, 2.6); } }); }
  if (!only) for (const q of lay.guards) { const [x, y] = rlToScr(q.x, q.y); items.push({ y, f: () => rlFigure(g, q.bow ? 'guardBow' : 'guard', x, y, q.h, null) }); }
  if (!only) for (const { p, st, scar } of lay.events) {
    const [x, y] = rlToScr(st.x, st.y), r = st.r, k = Math.max(0.8, Math.min(2.4, 0.014 * lay.Dpx)), [mx, my] = scar ? rlToScr(scar[0], scar[1]) : [x - 0.2 * lay.Dpx, y + 0.16 * lay.Dpx];
    if (p.siege) { const R = rngFor('siege:' + p.i); for (let m = 0; m < 5; m++) { const a = Math.PI * (0.1 + m * 0.2) + R() * 0.08, tx = x + Math.cos(a) * (r + 7 * k), ty = y + Math.sin(a) * (r + 7 * k) * 0.64; items.push({ y: ty, f: () => { g.fillStyle = 'rgba(0,0,0,.25)'; ellipse(g, tx + 2 * k, ty + 0.6 * k, 4 * k, 1.2 * k); g.fill(); g.fillStyle = BAN.red; g.beginPath(); g.moveTo(tx - 3.6 * k, ty); g.lineTo(tx, ty - 5.5 * k); g.lineTo(tx + 3.6 * k, ty); g.closePath(); g.fill(); g.fillStyle = shadeL(BAN.red, -25); g.beginPath(); g.moveTo(tx, ty - 5.5 * k); g.lineTo(tx + 3.6 * k, ty); g.lineTo(tx + 1.2 * k, ty); g.closePath(); g.fill(); } }); }
      items.push({ y: y + r * 0.64 + 6 * k, f: () => { const gx = x + 2 * k, gy = y + r * 0.64 + 6 * k; g.fillStyle = '#8C6A47'; g.fillRect(gx - 5 * k, gy - 2 * k, 10 * k, 2.4 * k); g.fillStyle = '#4A4744'; g.fillRect(gx + 4 * k, gy - 1.6 * k, 2.4 * k, 1.6 * k); g.strokeStyle = '#3E2E20'; g.lineWidth = k; ellipse(g, gx - 3 * k, gy + 0.6 * k, 1.4 * k, 1.4 * k); g.stroke(); ellipse(g, gx + 3 * k, gy + 0.6 * k, 1.4 * k, 1.4 * k); g.stroke(); } }); }
    if (p.pillage) items.push({ y: y + 1, f: () => { for (const dx of [-0.3, 0.25]) { g.strokeStyle = 'rgba(70,66,63,.6)'; g.lineWidth = 3 * k; g.lineCap = 'round'; const sx = x + dx * Math.max(r, 8), sy = y - r * 0.3; g.beginPath(); g.moveTo(sx, sy); g.bezierCurveTo(sx + 5 * k, sy - 10 * k, sx - 5 * k, sy - 20 * k, sx + 3 * k, sy - 32 * k); g.stroke(); g.lineCap = 'butt'; g.fillStyle = '#FF8A3A'; ellipse(g, sx, sy + 1, 2.4 * k, 1.4 * k); g.fill(); } } });
    if (p.unrest >= 50 && !p.pillage) items.push({ y: y + r * 0.64 + 3, f: () => { const bx = x - r - 4 * k, by = y + r * 0.4; g.strokeStyle = '#6B4A2B'; g.lineWidth = 1.4 * k; g.beginPath(); g.moveTo(bx - 4 * k, by); g.lineTo(bx + 4 * k, by - 5 * k); g.moveTo(bx - 4 * k, by - 5 * k); g.lineTo(bx + 4 * k, by); g.moveTo(bx - 5 * k, by - 2.5 * k); g.lineTo(bx + 5 * k, by - 2.5 * k); g.stroke(); } });
    if (p.scar === 'churned') items.push({ y: my, f: () => { const bx = mx, by = my, h = 9 * k; g.strokeStyle = '#2B2A28'; g.lineWidth = 2 * k; g.beginPath(); g.moveTo(bx - h * 0.45, by); g.lineTo(bx + h * 0.35, by - h); g.moveTo(bx + h * 0.45, by); g.lineTo(bx - h * 0.35, by - h); g.stroke(); g.strokeStyle = '#C8C2B6'; g.lineWidth = 1.1 * k; g.beginPath(); g.moveTo(bx - h * 0.3, by - h * 0.25); g.lineTo(bx + h * 0.35, by - h); g.moveTo(bx + h * 0.3, by - h * 0.25); g.lineTo(bx - h * 0.35, by - h); g.stroke(); g.fillStyle = '#5E4630'; g.fillRect(bx - h * 0.62, by - h * 0.32, h * 0.3, 1.4 * k); g.fillRect(bx + h * 0.32, by - h * 0.32, h * 0.3, 1.4 * k); } });
    if (p.scar === 'cairns') for (let m = 0; m < 3; m++) { const cx = mx - 0.04 * lay.Dpx + m * 7 * k, cy = my + (m % 2) * 2 * k; items.push({ y: cy, f: () => { g.save(); g.translate(cx, cy); g.scale(k, k); cairn(g, 0, 0, 1, 1 / k, false); g.restore(); } }); }
  }
  items.sort((a, b) => a.y - b.y); for (const it of items) it.f();
}
function rlFigure(g, key, x, y, h, side) { // the atlas figure with its feet at (x, y), h px tall
  const F = FIGS.fig[key]; if (!F) { rlFallbackFigure(g, x, y, h, side ?? (key.startsWith('guard') ? null : 'red')); return; }
  const k = h / F.h; g.drawImage(F.canvas, x - F.fx * k, y - F.fy * k, F.canvas.width * k, F.canvas.height * k);
}
// ---- army pieces: DOM elements in the layer (click selects, the tooltip is the army card, focusable); stacks fan out on hover.
// Only a piece's own silhouette (its .hit: base plus figure) takes the pointer; the map's wheel, drag, right-click and touch pass through it to the canvas.
const RL_PIECE_DOM = new Map(); let rlPieceSigLast = ''; const RL_LAYER_TOP = 44; // .layer { inset: 44px 0 0 0 }
const RL_PRESS = { prov: -1 }; // a touch that starts on a piece: a long-press there marches to the piece's province
const RL_STATUS = (c) => (c.side === 'red' && c.order === 'Pillage' && c.squads.length ? 'fire' : c.order === 'Besiege' ? 'blades' : c.crown ? 'crown' : c.prophet ? 'halo' : null);
function rlDrawPiece(cv, pc, hovered, fanK) { // one piece into its own canvas; the ground point at (ox, oy) in the canvas
  const c0 = cmd[pc.ids[0]], sel = state.sel && state.sel.type === 'cmd' && pc.ids.includes(state.sel.id), lift = sel || hovered ? 2 : 0, notched = c0.side !== VIEWER && c0.side !== 'indep', rim = c0.side === 'indep' ? RL_C.pewter : BAN[c0.side];
  const w = Math.ceil(pc.rx * 2 + pc.B * 1.6 + 16), h = Math.ceil(pc.figH + pc.B * 1.4 + 22), d = Math.min(2, dpr), g = cv.getContext('2d');
  if (cv.width !== Math.round(w * d) || cv.height !== Math.round(h * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); cv.style.width = w + 'px'; cv.style.height = h + 'px'; }
  g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, w, h);
  const ox = w / 2, oy = h - pc.ry - 0.12 * pc.B * 2 - 8; cv.dataset.ox = ox; cv.dataset.oy = oy;
  if (sel) { g.strokeStyle = '#F4EEDF'; g.lineWidth = 2; g.beginPath(); g.ellipse(ox, oy + 0.06 * pc.B, pc.rx + 4, pc.ry + 3, 0, 0, Math.PI * 2); g.stroke(); }
  const top = rlBase(g, ox, oy, pc.rx, pc.ry, rim, { notched, lift, shadowA: lift ? 0.34 : 0.25, brass: pc.kind === 'pretender', rimW: 2.4 });
  const figs = pc.kind === 'stack' ? pc.ids.slice(0, 3) : [pc.ids[0]];
  if (pc.kind === 'army') rlPennant(g, ox - pc.rx * 0.55, top - pc.ry * 0.5, pc.B * 1.25, rim); // the pennant at the base's rear
  figs.forEach((id, k) => { const c = cmd[id], fx = ox + (figs.length > 1 ? (k - (figs.length - 1) / 2) * pc.rx * 0.62 : 0), fy = top - (figs.length > 1 ? (k % 2 ? 0.5 : -0.5) * pc.ry * 0.3 : 0.1 * pc.ry), fh = pc.kind === 'stack' ? (c.crown ? 1.3 : 1) * pc.B * 0.92 : pc.figH;
    rlFigure(g, c.crown ? 'titan' : c.ptype in RL_FIGLOOK ? c.ptype : 'ashChieftain', fx, fy, fh, c.side); });
  const st = pc.kind === 'stack' ? null : RL_STATUS(c0); // one plaque on the front of the base, by exception
  if (st) { const ps = pc.B < 20 ? 10 : 12, px0 = ox - ps / 2, py0 = top + pc.ry * 0.55 - ps * 0.2; g.fillStyle = '#2B2620'; roundRect(g, px0, py0, ps, ps * 0.8, 2); g.fill(); g.strokeStyle = RL_C.brass; g.lineWidth = 1; g.stroke();
    g.strokeStyle = '#F4EEDF'; g.fillStyle = st === 'fire' ? '#FF8A3A' : '#F4EEDF'; g.lineWidth = 1; const cx = ox, cy = py0 + ps * 0.4, u = ps * 0.28;
    if (st === 'crown') { g.fillStyle = '#E2C98E'; g.beginPath(); g.moveTo(cx - u, cy + u * 0.6); g.lineTo(cx - u, cy - u * 0.4); g.lineTo(cx - u * 0.5, cy); g.lineTo(cx, cy - u * 0.7); g.lineTo(cx + u * 0.5, cy); g.lineTo(cx + u, cy - u * 0.4); g.lineTo(cx + u, cy + u * 0.6); g.closePath(); g.fill(); }
    else if (st === 'halo') { g.strokeStyle = '#F3E6B8'; g.beginPath(); g.ellipse(cx, cy, u, u * 0.55, 0, 0, Math.PI * 2); g.stroke(); }
    else if (st === 'fire') { g.beginPath(); g.moveTo(cx, cy - u); g.quadraticCurveTo(cx + u, cy, cx, cy + u * 0.8); g.quadraticCurveTo(cx - u, cy, cx, cy - u); g.fill(); }
    else { g.beginPath(); g.moveTo(cx - u, cy - u); g.lineTo(cx + u, cy + u); g.moveTo(cx + u, cy - u); g.lineTo(cx - u, cy + u); g.stroke(); } }
  if (fanK != null && pc.kind === 'stack') { g.font = "600 11px 'IBM Plex Sans Condensed', sans-serif"; g.textAlign = 'center'; g.fillStyle = 'rgba(20,18,15,.9)'; roundRect(g, ox + pc.rx - 4, top - pc.figH - 2, 18, 14, 3); g.fill(); g.fillStyle = '#F4EEDF'; g.fillText('×' + pc.ids.length, ox + pc.rx + 5, top - pc.figH + 5.5); }
}
// the hit box: the union of the piece's silhouettes (rlArmySh: the base swept down by its side band, and the upright figure with its pennant), plus the 2 px lift
function rlSizeHit(hit, cv, pc) {
  const ox = Number(cv.dataset.ox), oy = Number(cv.dataset.oy), top = oy - pc.figH - (pc.kind === 'army' ? 0.25 * pc.B : 0) - 3, bot = oy + pc.ry + 0.24 * pc.B + 1;
  hit.style.left = (ox - pc.rx - 2).toFixed(1) + 'px'; hit.style.top = top.toFixed(1) + 'px'; hit.style.width = (2 * pc.rx + 4).toFixed(1) + 'px'; hit.style.height = (bot - top).toFixed(1) + 'px';
}
// the map's gestures through a piece: the wheel zooms, a drag pans, a right-click orders the selected army to the piece's province (an attack on an enemy), touch pans, pinches and long-presses.
// provOf() null: a fanned piece stands off its ground, so a right-click or long-press on it aims at the land under the pointer
function rlWireHit(hit, provOf, onClick) {
  hit.addEventListener('wheel', (e) => { e.preventDefault(); canvas.dispatchEvent(new WheelEvent('wheel', e)); }, { passive: false });
  hit.addEventListener('contextmenu', (e) => { e.preventDefault(); if (e.pointerType === 'touch') return; orderMove(e.clientX, e.clientY, provOf()); });
  hit.addEventListener('mousedown', (e) => { if (e.button === 0) { drag = true; dragMoved = 0; } });
  for (const t of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) hit.addEventListener(t, (e) => { if (e.pointerType !== 'touch') return; if (t === 'pointerdown') RL_PRESS.prov = provOf(); canvas.dispatchEvent(new PointerEvent(t, e)); });
  hit.addEventListener('click', (e) => { e.stopPropagation(); if (dragMoved > 6) return; onClick(); });
  hit.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onClick(); } }); // Space selects the piece and must not also reach the window's pause shortcut
}
function rlPlacePieces(band) {
  const lay = RL_PIECE_CACHE.get('L'); if (!lay) return;
  const sigNow = lay.key + '|' + FIGS.ver + '|' + (state.sel ? state.sel.id : '') + '|' + RL_NUMBERS.on + RL_NUMBERS.shift;
  if (sigNow !== rlPieceSigLast) {
    rlPieceSigLast = sigNow; const keep = new Set();
    for (const pc of lay.armies) {
      keep.add(pc.key); let ent = RL_PIECE_DOM.get(pc.key);
      if (!ent) {
        const el = document.createElement('div'); el.className = 'mini'; const cv = document.createElement('canvas'); el.appendChild(cv); const hit = document.createElement('div'); hit.className = 'hit'; el.appendChild(hit); layer.appendChild(el);
        ent = { el, cv, hit, hovered: false, subOver: 0, fan: [], fanT: 0 }; RL_PIECE_DOM.set(pc.key, ent);
        hit.addEventListener('mouseenter', () => { ent.hovered = true; clearTimeout(ent.fanT); if (ent.pc.kind === 'stack') { if (!ent.fanned) rlFan(ent, true); } else rlDrawPiece(ent.cv, ent.pc, true); });
        hit.addEventListener('mouseleave', () => { ent.hovered = false; if (ent.pc.kind === 'stack') rlFanRelease(ent); else rlDrawPiece(ent.cv, ent.pc, false); });
        rlWireHit(hit, () => ent.pc.prov, () => { if (ent.pc.kind !== 'stack') selectCmd(ent.pc.ids[0]); else if (!ent.fanned) rlFan(ent, true); });
      }
      ent.pc = pc; const c0 = cmd[pc.ids[0]], troops = pc.ids.reduce((n, id) => n + cmd[id].squads.reduce((m, q) => m + q[1], 0), 0), hit = ent.hit;
      if (pc.kind === 'stack') delete hit.dataset.tip; else hit.dataset.tip = 'cmd:' + c0.id;
      hit.tabIndex = 0; hit.setAttribute('role', 'button'); hit.setAttribute('aria-label', pc.kind === 'stack' ? `${pc.ids.length} commanders of ${ownerName(pc.side)} in ${names[pc.prov]}` : `${cname(c0)}, ${troops} troops`);
      ent.el.classList.toggle('sel', !!(state.sel && pc.ids.includes(state.sel.id)));
      rlDrawPiece(ent.cv, pc, ent.hovered); rlSizeHit(hit, ent.cv, pc); if (ent.fanned) rlFan(ent, true, true);
      // the numbers layer's count plate under the piece (troops; the strength word where the view is fogged)
      let plate = ent.el.querySelector('.cplate'); if (RL_NUMBERS.on || RL_NUMBERS.shift) { if (!plate) { plate = document.createElement('span'); plate.className = 'cplate'; ent.el.appendChild(plate); } plate.textContent = pc.kind === 'stack' ? '×' + pc.ids.length : String(troops || (c0.crown ? '♛' : '1')); } else if (plate) plate.remove();
    }
    for (const [k, ent] of RL_PIECE_DOM) if (!keep.has(k)) { clearTimeout(ent.fanT); ent.el.remove(); RL_PIECE_DOM.delete(k); }
  }
  for (const [, ent] of RL_PIECE_DOM) {
    const pc = ent.pc, [sx, sy] = rlToScr(pc.x, pc.y, lay.s), off = sx < -60 || sx > cw + 60 || sy < -60 || sy > ch + 80; ent.el.style.display = off ? 'none' : '';
    if (!off) { ent.el.style.left = sx - Number(ent.cv.dataset.ox) + 'px'; ent.el.style.top = sy - RL_LAYER_TOP - Number(ent.cv.dataset.oy) + 'px'; } // the layer starts under the top bar
  }
}
// a fanned stack closes a moment after the pointer has left both the stack and its fanned pieces (the gap between them is crossed in time)
function rlFanRelease(ent) { clearTimeout(ent.fanT); ent.fanT = setTimeout(() => { if (!ent.hovered && ent.subOver <= 0 && ent.fanned) rlFan(ent, false); }, 160); }
function rlFan(ent, on, keepOpen) { // a stack fans out into its pieces on hover; each is clickable with its own card
  ent.fanned = on; for (const f of ent.fan) f.remove(); ent.fan = []; ent.subOver = 0;
  ent.cv.style.opacity = on ? '0.35' : '1';
  if (!on) return; const pc = ent.pc, n = pc.ids.length, Ba = rlBa(rlDpx());
  pc.ids.forEach((id, k) => {
    const c = cmd[id], kind = c.crown ? 'pretender' : c.squads.length ? 'army' : 'lone', B = kind === 'pretender' ? 1.15 * Ba : kind === 'lone' ? 0.8 * Ba : Ba;
    const sub = { ...pc, ids: [id], kind, B, rx: B / 2, ry: (B / 2) * 0.64, figH: B * 1.15 * (kind === 'pretender' ? 1.3 : 1) };
    const el = document.createElement('div'); el.className = 'mini fanned'; const cv = document.createElement('canvas'); el.appendChild(cv); const hit = document.createElement('div'); hit.className = 'hit'; el.appendChild(hit); ent.el.appendChild(el); rlDrawPiece(cv, sub, false); rlSizeHit(hit, cv, sub);
    const a = Math.PI + (Math.PI * (k + 1)) / (n + 1), dx = Math.cos(a) * Ba * 1.15, dy = Math.sin(a) * Ba * 0.95 - Ba * 0.25;
    el.style.left = Number(ent.cv.dataset.ox) + dx - Number(cv.dataset.ox) + 'px'; el.style.top = Number(ent.cv.dataset.oy) + dy - Number(cv.dataset.oy) + 'px';
    hit.dataset.tip = 'cmd:' + id; hit.tabIndex = 0; hit.setAttribute('role', 'button'); hit.setAttribute('aria-label', cname(c));
    rlWireHit(hit, () => null, () => selectCmd(id));
    hit.addEventListener('mouseenter', () => { ent.subOver++; clearTimeout(ent.fanT); rlDrawPiece(cv, sub, true); });
    hit.addEventListener('mouseleave', () => { ent.subOver = Math.max(0, ent.subOver - 1); rlDrawPiece(cv, sub, false); rlFanRelease(ent); });
    ent.fan.push(el);
  });
  void keepOpen;
}
