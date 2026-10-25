
// ------------------------------------------------------------------ map input
const cursorLbl = document.getElementById('cursorLbl');
function showCursorLbl(text, cx, cy) { const ar = app.getBoundingClientRect(); cursorLbl.textContent = text; cursorLbl.style.left = cx - ar.left + 16 + 'px'; cursorLbl.style.top = cy - ar.top - 30 + 'px'; cursorLbl.classList.add('show'); canvas.classList.add('nogo'); }
function hideCursorLbl() { cursorLbl.classList.remove('show'); canvas.classList.remove('nogo'); }
const inMap = (x, y) => (RELIEF() ? inModel(x, y) : x >= 0 && y >= 0 && x <= W && y <= H); // v4: the model's rounded corners
const theName = (w) => w.name.replace('The ', 'the ');
let drag = false, dragMoved = 0;
canvas.addEventListener('mousemove', (e) => {
  const r = canvas.getBoundingClientRect(); const [x, y] = toWorld(e.clientX - r.left, e.clientY - r.top);
  if (drag) { cam.x += e.movementX; cam.y += e.movementY; clampCam(); dragMoved += Math.abs(e.movementX) + Math.abs(e.movementY); hideCursorLbl(); requestDraw(); return; }
  if (!inMap(x, y)) { if (hoverProv !== -1) { hoverProv = -1; requestDraw(); closeAll(); } hideCursorLbl(); return; }
  const i = provinceAt(x, y);
  const army = state.sel && state.sel.type === 'cmd' && cmd[state.sel.id].side === 'red';
  if (isWild(i) && army) showCursorLbl('✕ Impassable: ' + theName(wildOf[i]), e.clientX, e.clientY); else hideCursorLbl();
  if (i !== hoverProv) {
    hoverProv = i; requestDraw(); closeAll(); clearTimeout(hoverTimer);
    const sx = e.clientX, sy = e.clientY;
    hoverTimer = setTimeout(() => { if (hoverProv === i) showTip('prov:' + i, { left: sx + 14, right: sx + 14, top: sy + 6, bottom: sy + 6 }, 0); }, 500);
  }
});
canvas.addEventListener('mouseleave', (e) => { // a province tooltip closes when the pointer leaves the map, unless it went into the tooltip
  const ontoPiece = !!(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.mini')); // v4: a drag keeps panning across the army pieces
  hoverProv = -1; if (!ontoPiece) drag = false; hideCursorLbl(); requestDraw();
  if (tips.length && tips[0].key.startsWith('prov:') && !tips.some((x) => x.el.contains(e.relatedTarget))) closeAll(); else if (!tips.length) clearTimeout(hoverTimer);
});
canvas.addEventListener('mousedown', (e) => { if (e.button === 0) { drag = true; dragMoved = 0; } });
window.addEventListener('mouseup', () => { drag = false; });
window.addEventListener('mousemove', (e) => { // v4: a drag that starts on, or passes over, an army piece pans the map like a drag on the land
  if (!drag || e.target === canvas) return;
  if (!(e.target.closest && e.target.closest('.mini'))) { drag = false; return; }
  cam.x += e.movementX; cam.y += e.movementY; clampCam(); dragMoved += Math.abs(e.movementX) + Math.abs(e.movementY); hideCursorLbl(); requestDraw();
});
canvas.addEventListener('click', (e) => {
  if (dragMoved > 6) return;
  const r = canvas.getBoundingClientRect(); const [x, y] = toWorld(e.clientX - r.left, e.clientY - r.top);
  if (!inMap(x, y)) { clearSel(); return; } // bare table and the props are inert: a click clears the selection
  closeAll(); const i = provinceAt(x, y); if (isWild(i)) { clearSel(); return; } selectProv(i);
});
canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); if (e.pointerType !== 'touch') orderMove(e.clientX, e.clientY); });
function orderMove(cx, cy, at) { // at: a province given directly (v4: a right-click or long-press on an army piece targets the piece's province)
  if (!state.sel || state.sel.type !== 'cmd') { toast(`Select one of your armies first, then ${app.classList.contains('phone') ? 'long-press' : 'right-click'} where it should go.`); return; }
  const c = cmd[state.sel.id]; if (c.side !== 'red') return;
  let i = at;
  if (i == null || i < 0) { const r = canvas.getBoundingClientRect(); const [x, y] = toWorld(cx - r.left, cy - r.top); if (!inMap(x, y)) return; i = provinceAt(x, y); }
  if (isWild(i)) { toast(`No path crosses ${theName(wildOf[i])}.`); return; }
  if (i === c.at) return;
  const d = pathTo(c.at, i);
  if (!d) { toast(noPathText(c, i)); return; }
  const bw = barrierOnLine(c.at, i);
  moveLine = { from: c.at, path: d.path, days: d.days, around: bw ? theName(bw) : null }; c.order = 'Move';
  closeAll(); draw(); toast(`${c.name} marches to ${prov[i].name}: ${d.days} days${bw ? ', around ' + theName(bw) : ''}.`);
}
// touch: one finger pans, two fingers pinch, a still long-press orders a march
const touches = new Map(); let pinch = null, pressTimer = null;
canvas.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'touch') return;
  touches.set(e.pointerId, { x: e.clientX, y: e.clientY }); dragMoved = 0; clearTimeout(pressTimer); const onPiece = RL_PRESS.prov; RL_PRESS.prov = -1; // v4: a touch that started on an army piece
  if (touches.size === 1) pressTimer = setTimeout(() => { if (dragMoved < 8) { dragMoved = 99; orderMove(e.clientX, e.clientY, onPiece); } }, 550);
  if (touches.size === 2) { const [a, b] = [...touches.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: cam.s }; }
});
canvas.addEventListener('pointermove', (e) => {
  const t = touches.get(e.pointerId); if (!t) return;
  const dx = e.clientX - t.x, dy = e.clientY - t.y; t.x = e.clientX; t.y = e.clientY;
  if (touches.size === 1) { cam.x += dx; cam.y += dy; clampCam(); dragMoved += Math.abs(dx) + Math.abs(dy); }
  else if (pinch) {
    const [a, b] = [...touches.values()], r = canvas.getBoundingClientRect();
    zoomAt((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, (pinch.s * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.d); dragMoved = 99;
  }
  if (dragMoved > 8) { clearTimeout(pressTimer); closeAll(); requestDraw(); }
});
const endTouch = (e) => { touches.delete(e.pointerId); if (touches.size < 2) pinch = null; clearTimeout(pressTimer); };
canvas.addEventListener('pointerup', endTouch); canvas.addEventListener('pointercancel', endTouch);
let detentTimer = null;
canvas.addEventListener('wheel', (e) => {
  e.preventDefault(); const r = canvas.getBoundingClientRect();
  zoomingUntil = performance.now() + 140; zoomAt(e.clientX - r.left, e.clientY - r.top, cam.s * Math.exp(-e.deltaY * 0.0012)); closeAll(); hideCursorLbl(); requestDraw();
  clearTimeout(detentTimer); detentTimer = setTimeout(() => { if (Math.abs(cam.s / fitScale - 1) <= 0.08 && cam.s !== fitScale) animateCam(fitScale, null); }, 150);
}, { passive: false });
function animateCam(s1, center) { // the detent and Fit: ease over 200 ms (instant under reduced motion)
  const v = viewRect(), mx = (v.l + v.r) / 2, my = (v.t + v.b) / 2;
  const s0 = cam.s, [wx0, wy0] = toWorld(mx, my), [wx1, wy1] = center ?? [wx0, wy0], t0 = performance.now(), ms = view.reduced ? 0 : 200;
  const step = (now) => {
    const t = ms ? Math.min(1, (now - t0) / ms) : 1, e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    cam.s = s0 + (s1 - s0) * e; const wx = wx0 + (wx1 - wx0) * e, wy = wy0 + (wy1 - wy0) * e; cam.x = mx - wx * cam.s; cam.y = my - wy * cam.s; clampCam(); draw();
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const fitToCloth = () => { const FB = RELIEF() ? MODEL_BOX : CLOTH; animateCam(fitScale, [(FB[0] + FB[2]) / 2, (FB[1] + FB[3]) / 2]); };

// ------------------------------------------------------------------ map modes (the decoration fades out of data modes over 150 ms)
const MODES = [['ownership', 'ownership', 'Ownership', 'Owner bands over the painted land.'], ['dominion', 'dominion', 'Dominion', 'Who dominates each province, and how strongly.'], ['supply', 'supply', 'Supply', 'Food given per day. Lighter is more.'], ['unrest', 'fist', 'Unrest', 'Lighter is more unrest. Above 50 recruiting stops.'], ['population', 'pop', 'Population', 'Lighter is more people.'], ['springs', 'springs', 'Mana springs', 'Springs by color, with their symbols.']];
const modesEl = document.getElementById('modes');
function setMode(m) {
  state.mode = m; updateDeco();
  renderModes(); requestDraw();
}
// v3 readability guard (5.1, 5.2): decoration fades out of data modes and dims to 60% while commanders are selected (move targeting).
// Deviation: the mockup's preselected Varo at load is shown without the dim; selecting any army dims.
function updateDeco() {
  const to = state.mode !== 'ownership' ? 0 : state.sel && state.sel.type === 'cmd' && state.targeting && PAINTED() && !RELIEF() ? 0.6 : 1; // v4: the relief map keeps its land at full strength while targeting
  if (to !== decoTo) { decoFrom = decoAlpha; decoTo = to; decoT0 = performance.now(); }
  requestDraw();
}
function renderModes() {
  const cur = MODES.find((m) => m[0] === state.mode);
  if (RELIEF()) { MODES[0][3] = 'Owner rails and a glow inside realm edges over the terrain model.'; } else MODES[0][3] = 'Owner bands over the painted land.';
  modesEl.innerHTML = `<div class="fitrow"><span class="zoomchip" id="zoomChip" data-tip="raw:zoom">Zoom: ${bandOf(cam.s)[0].toUpperCase() + bandOf(cam.s).slice(1)}</span><button class="fitbtn" id="fitBtn" data-tip="raw:fit">Fit <kbd>Z</kbd></button></div><div class="legend"><b style="color:var(--text)">${cur[2]}</b> · ${cur[3]}${cur[0] !== 'ownership' ? ' Wilds stay drawn: no data, no entry.' : ''}</div>` + MODES.map((m, k) => `<button class="modebtn ${m[0] === state.mode ? 'on' : ''}" data-m="${m[0]}" data-tip="raw:mode${k}" aria-label="${m[2]} map mode">${svgIcon(m[1], 18)}</button>`).join('');
  MODES.forEach((m, k) => { RAW['mode' + k] = { title: m[2] + ' map', meaning: m[3], foot: `<span>Shift+${k + 1} · M cycles</span><span></span>` }; });
  RAW.fit = RELIEF() ? { title: 'Fit the model', meaning: 'Returns to the standard view: the whole terrain model with a band of oak around it. Home stays the capital.', foot: '<span>Key Z</span><span></span>' } : { title: 'Fit the cloth', meaning: 'Returns to the standard view: the whole map with a band of oak around it. Home stays the capital.', foot: '<span>Key Z</span><span></span>' };
  RAW.zoom = RELIEF() ? { title: 'Zoom band', meaning: 'Far: the whole model on the table; capitals, Wellsprings and wilds are named. Mid: names for what you point at, plan with or hover in a panel. Near: every name, guards and spring stones. Information is one gesture away: hover, hold Shift, or ` for the numbers.' } : { title: 'Zoom band', meaning: 'Far shows masses and the table; Mid the full detail; Near adds yards, standees and scree. Information never thins, only decoration.' };
  modesEl.querySelectorAll('.modebtn').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.m)));
  modesEl.querySelector('#fitBtn').addEventListener('click', fitToCloth);
}

// ------------------------------------------------------------------ time, pause, toasts; the time-lapse
const clock = document.getElementById('clock'), pauseBtn = document.getElementById('pauseBtn'), pausechip = document.getElementById('pausechip');
function updateTop() {
  document.getElementById('date').textContent = `Y${state.year} M${state.month} D${state.day}`;
  document.getElementById('hair').style.width = (state.day / 30) * 100 + '%';
  document.getElementById('goldV').textContent = fmt(Math.round(state.gold));
  clock.classList.toggle('paused', state.paused); document.getElementById('pausedWord').style.visibility = state.paused ? 'visible' : 'hidden';
  pauseBtn.textContent = state.paused ? '▶' : '❚❚';
  document.querySelectorAll('#speed [data-s]').forEach((b) => b.classList.toggle('on', Number(b.dataset.s) <= state.speed));
  const claimed = wellClaimed(); document.getElementById('wellV').textContent = claimed ? '◆◇' : '◇◇'; document.getElementById('wellR').textContent = (claimed ? 1 : 0) + '/2';
}
function setPaused(p, reason) {
  state.paused = p; updateTop(); present(performance.now());
  if (reason) { pausechip.innerHTML = `<span style="color:#FFB4A9">Paused:</span> ${reason} <span class="dimtxt">▸</span>`; pausechip.classList.add('show'); }
  else if (!p) pausechip.classList.remove('show');
}
pausechip.addEventListener('click', () => { pausechip.classList.remove('show'); selectCmd('ilsa'); });
pauseBtn.addEventListener('click', () => setPaused(!state.paused));
document.querySelectorAll('#speed [data-s]').forEach((b) => b.addEventListener('click', () => { state.speed = Number(b.dataset.s); updateTop(); }));
const tl = document.getElementById('tl'), tlv = document.getElementById('tlv');
function setMonth(M) {
  M = Math.max(3, Math.min(70, M));
  const before = provList.map((i) => KEYS[i]);
  deriveMonth(M);
  state.year = Math.floor((M - 1) / 12) + 1; state.month = ((M - 1) % 12) + 1;
  refreshKeys();
  const [vx, vy] = toWorld(cw / 2, ch / 2);
  const changed = provList.filter((i, k) => KEYS[i] !== before[k]).sort((a, b) => Math.hypot(cent[a][0] - vx, cent[a][1] - vy) - Math.hypot(cent[b][0] - vx, cent[b][1] - vy));
  ANIM.clear();
  if (!view.reduced) changed.slice(0, 8).forEach((i) => { const p = prov[i], n = p.dom.n ?? p.owner ?? 'red', cap = n === 'green' ? greenCap : redCap; let dx = cent[i][0] - cent[cap][0], dy = cent[i][1] - cent[cap][1]; const L = Math.hypot(dx, dy) || 1; ANIM.set(i, { from: [dx / L, dy / L] }); });
  { const b = bandOf(cam.s), now = performance.now(); for (const i of changed) if (SPR.has(b + ':' + i)) provSprite(i, b, now, true); } // v3: a month change re-bakes once, at once
  tl.value = String(M); tlv.textContent = `Y${state.year} M${state.month}`;
  updateTop(); renderOutliner();
  if (state.sel && state.sel.type === 'cmd') { const keep = moveLine; selectCmd(state.sel.id); moveLine = keep; } else if (state.sel && state.sel.type === 'prov') renderProvince();
  requestDraw();
}
tl.addEventListener('input', () => setMonth(Number(tl.value)));
let acc = 0, last = performance.now(), lastAmb = 0;
function tick(now) {
  const dt = (now - last) / 1000; last = now;
  if (!state.paused && scrim.hidden) {
    acc += dt * [0, 1, 2, 4, 8][state.speed];
    while (acc >= 1) {
      acc -= 1; state.day++; state.gold += 38 / 30;
      if (state.day > 30) { state.day = 1; const M = (state.year - 1) * 12 + state.month + 1; toast('Month end: dominion spreads. Slow looks on the map change now, once a month.'); if (M <= 70) setMonth(M); else { state.month++; if (state.month > 12) { state.month = 1; state.year++; } } }
      if (cmd.ilsa.eta > 0) { cmd.ilsa.eta = Math.max(0, cmd.ilsa.eta - 1); if (cmd.ilsa.eta === 1 && !state.autoPaused) { state.autoPaused = true; setPaused(true, 'Ilsa Oakhand reaches Ashfen tomorrow'); toast('Auto-pause: a hostile army reaches your troops tomorrow. Set which events pause in Settings → Messages.'); } }
      updateTop(); placeBadges(bandOf(cam.s)); present(now);
      if (state.paused) break;
    }
  }
  if (now - lastAmb >= 33 && ambienceOn()) { lastAmb = now; present(now); }
  requestAnimationFrame(tick);
}
const toasts = document.getElementById('toasts');
function toast(text) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = text; toasts.prepend(t); setTimeout(() => t.remove(), 4200); while (toasts.children.length > 4) toasts.lastChild.remove(); }

// ------------------------------------------------------------------ modals: battle report, Codex, research, the portrait gallery
const scrim = document.getElementById('scrim'), modal = document.getElementById('modal');
function openModal(html, cls = '') { closeAll(); modal.className = 'modal ' + cls; modal.innerHTML = html; scrim.hidden = false; modal.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', closeModal)); modal.querySelector('[data-close]')?.focus(); }
function closeModal() { scrim.hidden = true; requestDraw(); }
scrim.addEventListener('click', (e) => { if (e.target === scrim) closeModal(); });
function openReport() {
  const place = names[morholt];
  const cap = { id: 'indep-captain-' + morholt, ptype: 'indepCaptain', outfit: ({ plains: 'levy', farmland: 'levy', wasteland: 'levy', forest: 'hunter', hills: 'mountaineer', mountains: 'mountaineer', swamp: 'reedman' })[prov[morholt].terrain], seen: 'dead', label: 'Brannoc, Captain of ' + place };
  openModal(`<header><span style="color:var(--opportunity);display:inline-flex">${svgIcon('sword', 22)}</span><h2>Victory at ${place}</h2><span class="dimtxt num">Y1 M3 D12 · 7 rounds</span><button class="iconbtn" data-close aria-label="Close">✕</button></header>
    <div class="mbody"><div class="sides"><div class="side"><h3><span class="banner"><svg width="16" height="20" viewBox="0 0 22 28"><path d="M1 1h20v20l-10 6-10-6z" fill="#FD6533"/></svg></span>Cinder Horde (you)</h3>
      <div class="fates"><div class="fate">${pspan(portraitOf(cmd.varo, 40, { hpFrac: 1 }))}<span><b style="font-weight:500">Varo, Ash Chieftain</b><br><span class="dimtxt num">14 → 14 HP · unhurt</span></span></div></div>
      <div class="cas"><span>Cinder Warriors</span><span>32 → 30</span><span>−2</span><span>Flame Archers</span><span>20 → 18</span><span>−2</span></div></div>
    <div class="side"><h3><span class="banner"><svg width="16" height="20" viewBox="0 0 22 28"><path d="M1 1h20v20l-10 6-10-6z" fill="#8C8A80"/></svg></span>Independents</h3>
      <div class="fates"><div class="fate">${pspan(portraitSVG(cap, 40))}<span><b style="font-weight:500">Brannoc, Captain of ${place}</b><br><span class="dimtxt num">12 → 0 HP · slain</span></span></div></div>
      <div class="cas"><span>Spearmen</span><span>14 → 3</span><span>routed</span><span>Bowmen</span><span>8 → 6</span><span>fled</span></div></div></div>
    <div><h3 style="font:600 11.5px var(--font-body);letter-spacing:.1em;text-transform:uppercase;color:var(--faint);margin:0 0 6px">Key moments</h3><ol class="moments"><li><b>Round 2</b>: the Flame Archers' volley drops 4 Spearmen.</li><li><b>Round 4</b>: the lines meet; Cinder Warriors cut down 6 more.</li><li><b>Round 5</b>: Brannoc, Captain of ${place}, falls to Varo's axe. The Spearmen break.</li><li><b>Round 7</b>: the last Bowmen flee into the marsh.</li></ol></div>
    <div class="row" style="justify-content:flex-end"><button class="btn nav" data-close>Close</button><button class="btn" id="watch">Watch replay ▸</button></div></div>`, 'report');
  modal.querySelector('#watch').addEventListener('click', () => openModal(`<header><h2>Replay · ${place}</h2><button class="iconbtn" data-close aria-label="Close">✕</button></header><div class="mbody"><p style="margin:0;max-width:62ch;line-height:1.5">The replay opens here on a full stage: the player's side on the left, three rows a side, every blow, every death, spells with their own effects and sound. Pause, 0.5× to 4×, Beats mode, and skip to the end. It is being built in the battle presentation track and lands in this modal in Phase 10; its docks and name cards use these portraits.</p><div class="row" style="justify-content:flex-end"><button class="btn" data-close>Back to the map</button></div></div>`));
}
const CODEX_UNITS = { cinderWarrior: ['Cinder Warrior', 'Heavy infantry of the Cinder Horde. hp 11, str 11, att 11, def 10, prot 3, morale 11, map speed 2. Hand axe 6. Costs 12 gold, 8 materials, 10 people; 10 recruit days per 10.'] };
function openCodex(key) {
  const entries = { ...Object.fromEntries(Object.entries(CONCEPTS).map(([k, v]) => [k, v])), ...CODEX_UNITS };
  let cur = key && entries[key] ? key : 'dominion', q = '';
  const render = () => {
    const list = Object.entries(entries).filter(([, v]) => v[0].toLowerCase().includes(q.toLowerCase()));
    modal.querySelector('.codex').innerHTML = `<nav><input id="cq" placeholder="Search the Codex" value="${q}" aria-label="Search the Codex"><div class="grp">Concepts</div>${list.filter(([k]) => CONCEPTS[k]).map(([k, v]) => `<button data-k="${k}" class="${k === cur ? 'on' : ''}">${v[0]}</button>`).join('')}<div class="grp">Units</div>${list.filter(([k]) => CODEX_UNITS[k]).map(([k, v]) => `<button data-k="${k}" class="${k === cur ? 'on' : ''}">${v[0]}</button>`).join('')}</nav><article><h3>${entries[cur][0]}</h3><p>${entries[cur][1]}</p><p class="dimtxt">Every Codex page is generated from the game's own rules and content, so it never disagrees with the game.</p></article>`;
    modal.querySelectorAll('.codex nav button').forEach((b) => b.addEventListener('click', () => { cur = b.dataset.k; render(); }));
    const inp = modal.querySelector('#cq'); inp.addEventListener('input', () => { q = inp.value; const pos = inp.selectionStart; render(); const n = modal.querySelector('#cq'); n.focus(); n.setSelectionRange(pos, pos); });
  };
  openModal(`<header><span style="display:inline-flex;color:var(--dim)">${svgIcon('codex', 22)}</span><h2>Codex</h2><button class="iconbtn" data-close aria-label="Close">✕</button></header><div class="codex"></div>`);
  render();
}
function openResearch() {
  openModal(`<header><span style="display:inline-flex;color:var(--dim)">${svgIcon('book', 22)}</span><h2>Research</h2><button class="iconbtn" data-close aria-label="Close">✕</button></header><div class="mbody"><div class="cards" style="grid-template-columns:repeat(auto-fit,minmax(120px,1fr))">${'WUBRG'.split('').map((c) => `<div class="side" style="gap:4px"><h3>${manaSym(c, 18)} ${MANA[c].name}</h3><span class="num dimtxt">${c === 'R' ? 'Level 2 · 47 days to L3' : c === 'G' ? 'Level 0' : 'Level 0 · no M1 spells'}</span>${c === 'R' ? '<span style="font-size:13.5px">Next: Fireball, Blood Fury</span><button class="btn" aria-disabled="true">Researching</button>' : c === 'G' ? '<button class="btn">Research this</button>' : ''}</div>`).join('')}</div></div>`);
}
function openGallery() {
  const cell = (svg, lbl) => `<div class="gcell">${pspan(svg)}<span>${lbl}</span></div>`;
  const row1 = Array.from({ length: 12 }, (_, k) => cell(portraitSVG({ id: 'gallery-ash-' + k, ptype: 'ashChieftain', allegiance: 'own' }, 64), ['Varo', 'Dravik', 'Ulrek', 'Karsk', 'Mordec', 'Thrain', 'Ashk', 'Vesh', 'Grall', 'Oskar', 'Brannt', 'Hesk'][k])).join('');
  const pips = { emberAdept: 'RR', cinderMagus: 'RRR', pyrePriest: 'R', saplingDruid: 'GG', elderDruid: 'GGG', grovePriest: 'G' };
  const row2 = ['ashChieftain', 'emberAdept', 'pyrePriest', 'cinderScout', 'cinderMagus', 'wardenCaptain', 'thornScout', 'grovePriest', 'saplingDruid', 'elderDruid'].map((t) => cell(portraitSVG({ id: 'type-' + t, ptype: t, allegiance: PTYPES[t].side === 'red' ? 'own' : 'other', pips: pips[t] ?? '', holy: /Priest/.test(PTYPES[t].label) ? 2 : 0 }, 128), PTYPES[t].label + (PTYPES[t].side === 'green' ? ' (Thornwood)' : ''))).join('')
    + ['levy', 'hunter', 'mountaineer', 'reedman'].map((o) => cell(portraitSVG({ id: 'indep-' + o, ptype: 'indepCaptain', outfit: o }, 128), 'Independent Captain · ' + o)).join('');
  const row3 = [256, 128, 96, 64, 48, 40, 24, 16].map((sz) => cell(portraitSVG({ id: 'gallery-ash-0', ptype: 'ashChieftain', allegiance: 'own', gear: { n: 1, tier: 2 } }, sz), sz + ' px')).join('');
  const st = [['healthy', {}], ['under 50%', { hpFrac: 0.43 }], ['under 25%', { hpFrac: 0.2 }], ['prophet', { prophet: true, ptype: 'pyrePriest', holy: 2, pips: 'R', id: 'ondra' }], ['pretender', { ptype: 'titan', pretender: true, pips: 'RRRR', id: 'titan' }], ['starving', { starving: true }], ['unpaid', { unpaid: true }], ['holy', { holy: 2, ptype: 'pyrePriest', id: 'ondra' }], ['gear 2 ★', { gear: { n: 2, tier: 3 } }], ['last seen', { seen: 'lastSeen', allegiance: 'other', ptype: 'wardenCaptain', id: 'ilsa' }], ['dead', { seen: 'dead', ptype: 'indepCaptain', outfit: 'levy', id: 'indep-captain-' + morholt }]];
  const row4 = st.map(([lbl, o]) => cell(portraitSVG({ id: 'varo', ptype: 'ashChieftain', allegiance: 'own', ...o }, 64), lbl)).join('');
  const row5 = [0, 1, 2, 'god', 'indep'].flatMap((rk) => ['own', 'other', 'independent'].map((al) => cell(portraitSVG({ id: 'frame-demo', ptype: rk === 'god' ? 'titan' : rk === 'indep' ? 'indepCaptain' : 'ashChieftain', allegiance: al, rank: rk, banner: al === 'other' ? '#00674B' : al === 'independent' ? '#8C8A80' : '#FD6533' }, 96), `${FRAMES[rk][1]} · ${al === 'own' ? 'own (round)' : al === 'other' ? 'other nation (notched)' : 'independent (square)'}`))).join('');
  openModal(`<header><span style="display:inline-flex;color:var(--dim)">${svgIcon('pop', 22)}</span><h2>Portraits · review gallery</h2><span class="dimtxt" style="font-size:12.5px">Mockup control, not game UI</span><button class="iconbtn" data-close aria-label="Close">✕</button></header><div class="mbody gallery">
    <div><h3>Twelve seeded Ash Chieftains (variety), 64 px</h3><div class="grow">${row1}</div></div>
    <div><h3>Every commander type, and an Independent Captain in each outfit, 128 px</h3><div class="grow">${row2}</div></div>
    <div><h3>One Ash Chieftain at every size (level of detail)</h3><div class="grow">${row3}</div></div>
    <div><h3>States are overlays, badges and frames only; the face never changes, 64 px</h3><div class="grow">${row4}</div></div>
    <div><h3>Frames: rank by material, allegiance by shape, 96 px</h3><div class="grow">${row5}</div></div></div>`, 'wide');
}
document.getElementById('btnF').addEventListener('click', () => openCodex());
document.getElementById('btnR').addEventListener('click', openResearch);
document.getElementById('btnL').addEventListener('click', () => toast('The Ledger: sortable tabs for provinces, commanders, magic, battles, and nations.'));

// ------------------------------------------------------------------ keys
window.addEventListener('keydown', (e) => {
  if (e.target.matches('input:not([type]), input[type=text], input[type=search], select, textarea')) return; // the slider and checkboxes keep the shortcuts
  if (e.key === 'Shift') app.classList.add('shift');
  if (RELIEF() && e.key === 'Shift' && !e.repeat && !state.sel && !tips.length && !RL_NUMBERS.shift) { RL_NUMBERS.shift = true; requestDraw(); } // v4: Shift held alone, nothing selected, no tooltip open: every name and the numbers
  if (RELIEF() && e.key === '`') { RL_NUMBERS.on = !RL_NUMBERS.on; requestDraw(); }
  if (e.key === 'Escape') { if (!scrim.hidden) closeModal(); else if (tips.length) closeAll(); else clearSel(); return; }
  if (e.code === 'Space') { e.preventDefault(); setPaused(!state.paused); }
  if (/^Digit[1-4]$/.test(e.code) && !e.shiftKey) { state.speed = Number(e.code.slice(5)); updateTop(); }
  if (/^Digit[1-6]$/.test(e.code) && e.shiftKey) setMode(MODES[Number(e.code.slice(5)) - 1][0]);
  if (e.key === 't' || e.key === 'T') lockTop();
  if (e.key === 'f' || e.key === 'F') openCodex();
  if (e.key === 'r' || e.key === 'R') openResearch();
  if (e.key === 'z' || e.key === 'Z') fitToCloth();
  if (e.key === 'h' || e.key === 'H') app.classList.toggle('hidden-ui');
  if (e.key === 'm' || e.key === 'M') { const k = MODES.findIndex((m) => m[0] === state.mode); setMode(MODES[(k + 1) % MODES.length][0]); }
  if (e.key === '[') leftDock.hidden = !leftDock.hidden;
  if (e.key === ']') document.getElementById('rightDock').hidden = !document.getElementById('rightDock').hidden;
});
window.addEventListener('keyup', (e) => { if (e.key === 'Shift') { app.classList.remove('shift'); if (RL_NUMBERS.shift) { RL_NUMBERS.shift = false; requestDraw(); } } });
window.addEventListener('blur', () => { if (RL_NUMBERS.shift) { RL_NUMBERS.shift = false; requestDraw(); } });
// v4: hovering a link to a province (feed, tooltips) gives it its hover look and its name on the land while hovered
document.addEventListener('mouseover', (e) => { if (!RELIEF()) return; const l = e.target.closest && e.target.closest('[data-go]'); const v = l ? Number(l.dataset.go) : -1; if (v !== RL_LINK.prov) { RL_LINK.prov = v; requestDraw(); } });

// ------------------------------------------------------------------ mockup controls (review aids outside the game window)
const warmNote = document.getElementById('warmNote');
warmNote.innerHTML = `<span class="sw"><i style="background:#1C1A17"></i><i style="background:#24211D"></i><i style="background:#2E2A25"></i></span>approved <span class="sw"><i style="background:#2E2219"></i><i style="background:#3A2B1F"></i><i style="background:#4A3727"></i></span>warm <span class="bad">Urgent alert 2.66:1, Tide symbol 2.66:1 on --chrome-2 (under 3:1)</span>`;
document.querySelectorAll('#mockctl .seg').forEach((seg) => seg.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
  seg.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
  const k = seg.dataset.ctl, v = b.dataset.v;
  if (k === 'table') { view.table = v; requestDraw(); }
  if (k === 'detail') { view.detail = v; refreshKeys(); requestDraw(); }
  if (k === 'chrome') { view.chrome = v; app.classList.toggle('warm', v === 'warm'); warmNote.hidden = v !== 'warm'; }
  if (k === 'parch') { view.parch = v === 'on'; app.classList.toggle('parch', view.parch); }
  if (k === 'hand') { view.hand = v; resetGeometryCaches(true); updateDeco(); }
  if (k === 'labels') { view.labels = v; resetGeometryCaches(false); }
  if (k === 'borders') { view.borders = v; npoly = v === 'straight' ? cells : NPOLY_W; resetGeometryCaches(true); }
  if (k === 'bandCap') { view.bandCap = v; requestDraw(); }
  if (k === 'tracks') { view.tracks = v; requestDraw(); }
  if (k === 'farm') { view.farm = v; if (PAINTED_PAL()) return; TERRAIN.farmland.fill = v === 'approved' ? '#EEBA3A' : '#EDB141'; MODE_BASE.farmland = desat(TERRAIN.farmland.fill, 0.8); FILLMEMO.clear(); resetGeometryCaches(false); }
  if (k === 'palette') setPalette(v);
  if (k === 'look') setLook(v);
  if (k === 'tint') { view.tint = v === 'on'; requestDraw(); }
})));
// v4: Map look. Relief is the relief map (map-design-final.md); Painted (v3) is the page exactly as before (?look=v3 opens on it).
function setLook(v) {
  v = v === 'v3' ? 'v3' : 'relief'; if (view.look === v) return; view.look = v;
  npoly = v === 'relief' || view.borders === 'straight' ? cells : NPOLY_W; resetGeometryCaches(true); TABLEB = null; CLOTHB = null; CK = null; RCK = null;
  layer.innerHTML = ''; badgeSig = ''; badgeEls = []; RL_PIECE_DOM.clear(); rlPieceSigLast = ''; RL_PIECE_CACHE.clear(); hoverProv = -1; RL_LINK.prov = -1;
  syncLookUI(); updateDeco(); renderModes(); if (!headMoreByHand) headMore.open = headMoreDefault(); layout();
}
function syncLookUI() {
  document.body.classList.toggle('look-relief', RELIEF()); document.body.classList.toggle('look-v3', !RELIEF()); app.classList.toggle('railed', RELIEF());
  document.querySelectorAll('#mockctl [data-ctl="look"] button').forEach((b) => b.classList.toggle('on', b.dataset.v === view.look));
  document.querySelectorAll('#mockctl [data-ctl="tint"] button').forEach((b) => b.classList.toggle('on', (b.dataset.v === 'on') === view.tint));
}
// ---- the Palette A/B (palette-ab/decision.md): Bright = the approved fills (default); Painted = the painted fills. Only the fills change;
// the marks that derive from a fill follow it (stamp and settlement faces, the pool, the ground marks under Painted, owner art recolored
// through the faces). Data-mode bases stay at the approved values; under Painted the Farmland A/B does not apply and its control is disabled.
function setPalette(v) {
  view.palette = v === 'painted' ? 'painted' : 'bright';
  for (const t of Object.keys(TERRAIN)) TERRAIN[t].fill = PALETTES[view.palette][t];
  if (!PAINTED_PAL()) TERRAIN.farmland.fill = view.farm === 'approved' ? '#EEBA3A' : '#EDB141'; // back on Bright, Farmland takes the Farmland control's value
  MODE_BASE.farmland = desat(PAINTED_PAL() ? PALETTES.bright.farmland : TERRAIN.farmland.fill, 0.8);
  FILLMEMO.clear(); FACEMEMO.clear(); GREYMEMO.clear(); CLOTHB = null; recolorArt(); syncPaletteUI(); resetGeometryCaches(false);
}
function syncPaletteUI() {
  document.querySelectorAll('#mockctl [data-ctl="palette"] button').forEach((b) => b.classList.toggle('on', b.dataset.v === view.palette));
  const farm = document.querySelector('#mockctl [data-ctl="farm"]');
  if (farm) { farm.classList.toggle('off', PAINTED_PAL()); farm.title = PAINTED_PAL() ? 'Palette: Painted sets Farmland to #CEA265; this A/B applies to Bright only' : ''; farm.querySelectorAll('button').forEach((b) => (b.disabled = PAINTED_PAL())); }
}
if (PAINTED_PAL()) syncPaletteUI(); // ?palette=painted: the fills were set before anything read them (p10b), so only the controls follow
function resetGeometryCaches(geom) { // v3 controls: Hand, Labels, Borders, Farmland and Palette join the bake keys
  if (geom) { GEO.clear(); RIBBON.clear(); LITE.clear(); resetFeats(); }
  WGEO.clear(); SPINES.clear(); ZCACHE.clear(); MIDPEAKS.clear(); STL.clear(); invalidateBakes(); refreshKeys(); requestDraw();
}
const visionSel = document.getElementById('vision');
visionSel.addEventListener('change', () => { const v = visionSel.value; view.vision = v; app.style.filter = v === 'normal' ? '' : `url(#cvd-${v})`; document.getElementById('visionNote').hidden = v === 'normal'; });
const rmotion = document.getElementById('rmotion'); rmotion.checked = view.reduced;
rmotion.addEventListener('change', () => { view.reduced = rmotion.checked; ANIM.clear(); requestDraw(); });
document.getElementById('btnPortraits').addEventListener('click', openGallery);
const btnPass = document.getElementById('btnPass');
btnPass.addEventListener('click', () => { view.pass = !view.pass; btnPass.classList.toggle('on', view.pass); btnPass.setAttribute('aria-pressed', String(view.pass)); document.getElementById('reviewChip').classList.toggle('show', view.pass); requestDraw(); });
document.getElementById('wipe').addEventListener('change', (e) => { view.wipe = e.target.checked; });

// ------------------------------------------------------------------ responsive frames
const rightDock = document.getElementById('rightDock');
document.getElementById('railOut').addEventListener('click', () => { rightDock.classList.toggle('fly'); });
document.getElementById('railFeed').addEventListener('click', () => { rightDock.classList.toggle('fly'); msgs.scrollIntoView({ block: 'nearest' }); });
document.getElementById('railMode').addEventListener('click', () => { const k = MODES.findIndex((m) => m[0] === state.mode); setMode(MODES[(k + 1) % MODES.length][0]); const m = MODES.find((x) => x[0] === state.mode); toast(`${m[2]} map: ${m[3]}`); });
RAW.railMode = { title: 'Map mode', meaning: 'Cycles ownership, dominion, supply, unrest, population and mana springs.', foot: '<span>Key M</span><span></span>' };
function layout() {
  const w = app.clientWidth;
  app.classList.toggle('mid', w < 1250 && w >= 720); app.classList.toggle('phone', w < 720);
  fit(); draw();
}
new ResizeObserver(layout).observe(app);
document.addEventListener('visibilitychange', () => { if (!document.hidden) requestDraw(); });

// ------------------------------------------------------------------ start
// small screens: the controls fold away. v4: under Relief they and the Try this list start folded at every size, so the first view is the model at its start zoom;
// Painted (v3) keeps its frame as it was (open from 800 px tall), also when it is reached by the Map look switch, unless the controls were folded or opened by hand.
const headMore = document.getElementById('headMore'), headMoreDefault = () => !(RELIEF() || window.innerWidth < 720 || window.innerHeight < 800); let headMoreByHand = false;
headMore.querySelector('summary').addEventListener('click', () => { headMoreByHand = true; });
if (!headMoreDefault()) headMore.open = false;
deriveMonth(3); refreshKeys();
document.getElementById('tryAcross').textContent = acrossTarget != null ? names[acrossTarget] : 'a province across the Ashspine';
document.querySelectorAll('.tryAcross').forEach((el) => (el.textContent = acrossTarget != null ? names[acrossTarget] : 'a province across the Ashspine'));
syncLookUI(); // v4: the controls, the Try this list and the right dock's rail follow the Map look
renderAlerts(); renderOutliner(); renderFeed(); renderModes(); updateTop();
// The label zones are measured in the web font, and brooks, ponds, landmarks and vignettes keep out of them: when the fonts arrive after
// the first paint, the features are laid out again once, so every load ends on the same map whatever the font timing.
function onFontsArrived() { TW_CACHE.clear(); ZCACHE.clear(); WGEO.clear(); SPINES.clear(); CLOTHB = null; if (FEATS && FEATS.fk !== true) resetFeats(); invalidateBakes(); firstPaint = true; }
for (const f of ["22px 'Marcellus SC'", '500 13px Alegreya', '600 13px Alegreya', '800 13px Alegreya', 'italic 500 13px Alegreya']) document.fonts?.load?.(f).then(() => requestDraw(), () => {}); // ask for every face the map letters in
document.fonts?.ready?.then(() => { if (checkFonts()) onFontsArrived(); draw(); });
document.fonts?.addEventListener?.('loadingdone', () => requestDraw());
layout();
selectCmd('varo'); state.targeting = false; decoTo = decoAlpha = decoFrom = 1; // the preselected army is shown without the targeting dim
layout();
requestAnimationFrame(tick);
// Review hooks for automated screenshots (read-only helpers; the game UI never calls them).
window.__mock = {
  at: (name) => { const i = names.indexOf(name); const [x, y] = toScreen(...cent[i]); const r = canvas.getBoundingClientRect(); return [r.left + x, r.top + y]; },
  wildAt: (id) => { const w = WILDS.find((q) => q.id === id) ?? WILDS[0]; const c = wgeo(w).labelAt; const [x, y] = toScreen(cent[c][0], cent[c][1] + 30); const r = canvas.getBoundingClientRect(); return [r.left + x, r.top + y]; },
  across: () => (acrossTarget != null ? names[acrossTarget] : null), closed: () => (closedTarget != null ? names[closedTarget] : null),
  setMonth: (m) => setMonth(m), band: () => bandOf(cam.s), scale: () => cam.s, fitScale: () => fitScale, minScale: () => minScale, maxScale: () => maxScale,
  zoomTo: (s, name) => { const i = names.indexOf(name), v = viewRect(); cam.s = s; cam.x = (v.l + v.r) / 2 - cent[i][0] * s; cam.y = (v.t + v.b) / 2 - cent[i][1] * s; clampCam(); draw(); },
  prof: (n = 10) => { for (const k in PROF) delete PROF[k]; for (let k = 0; k < n; k++) draw(); return Object.fromEntries(Object.entries(PROF).map(([k, v]) => [k, +(v / n).toFixed(2)])); },
  perf: (n = 20) => { const t0 = performance.now(); for (let k = 0; k < n; k++) draw(); return (performance.now() - t0) / n; },
  reb: () => ({ ...REB, bakes: BAKES.slice(-6) }),
  sprInfo: () => { const b = bandOf(cam.s); let ok = 0, stale = 0, miss = 0; for (const i of provList) { const sp = SPR.get(b + ':' + i); if (!sp) miss++; else if (sp.key !== KEYS[i]) stale++; else ok++; } return { b, ok, stale, miss, size: SPR.size }; },
  skip: (k, on) => { if (on) SKIP.add(k); else SKIP.delete(k); },
  panFps: (dx = 3, n = 60) => new Promise((res) => { let k = 0, t0 = 0; const step = (now) => { if (k === 1) t0 = now; if (k > n) { res((now - t0) / (n)); return; } cam.x += k % 40 < 20 ? dx : -dx; clampCam(); draw(); k++; requestAnimationFrame(step); }; requestAnimationFrame(step); }),
  pan: (dx, dy, n = 20) => { const t0 = performance.now(); for (let k = 0; k < n; k++) { cam.x += dx; cam.y += dy; clampCam(); draw(); } return (performance.now() - t0) / n; },
  ev: (src) => eval(src), // review only: read internal state
  paintcheck: () => paintCheck(), trackcheck: () => trackCheck(), feats: () => { const F = feats(); return { tracks: F.tracks.length, fallbacks: F.tracks.reduce((o, h) => ((o[h.fallback] = (o[h.fallback] ?? 0) + 1), o), {}), slid: F.tracks.filter((h) => h.slid).length / 2, brooks: [...F.water.values()].filter((w) => w.brook).length, ponds: [...F.water.values()].filter((w) => w.pond).length, bridges: [...F.bridges.values()].reduce((a, b) => a + b.length, 0), mines: [...F.land.values()].filter((l) => l.always && l.always.kind === 'mine').length, windmills: [...F.land.values()].filter((l) => l.always && l.always.kind === 'windmill').length, ruins: [...F.land.values()].filter((l) => l.ruin).length, heroes: [...F.heroes.values()].map((h) => h.kind + '@' + names[[...F.heroes.keys()].find((k) => F.heroes.get(k) === h)]), regions: F.regions.map((r) => r.name + ' (' + r.provs.length + ')'), vignettes: F.vig.size, init: PROF.init }; },
  setView: (k, v) => { const b = document.querySelector(`#mockctl [data-ctl="${k}"] [data-v="${v}"]`); if (b) b.click(); return view[k]; },
  info: () => ({ wilds: WILDS.map((w) => [w.id, w.cells.length]), provinces: provs.length, fog: FOG.filter(Boolean).length, captures: captureTargets.map((i) => names[i]), pillage: names[pillageProv], burn: names[burnProv], ashRain: names[ashRainProv], morholt: names[morholt], sunmere: names[ownWell] }),
};
// Notes for review (decisions where the brief left room):
// - The mockup's sheet has 66 cells, far fewer than a Medium map; with the 3-hop gap between ranges the generator placed all
//   three ranges on only a few seeds and none gave Varo a target across the Ashspine. The mockup uses a 2-hop gap between
//   ranges (3 hops from both capitals, as briefed) and map seed 12. Every other placement rule is as briefed.
// - Houses and their spiral are drawn 1.3x the briefed size so a town reads at the start zoom.
// - The pillaged province loses 8% at M14 and 25% in all by M15, so it drops a tier and reads as declining.
// v3, the painted map (handdrawn-design/final.md §9), decisions and deviations:
// - Fixed zones are sized at each band's design scale, not its widest: at the widest Mid scale the zones span a whole province.
//   The label zone is the name with its halo plus a two-chip second line; the token zone holds 1 stack (2 at Near).
// - Terrain stamps and water may stand in the empty token zone (tokens are opaque plates over them); labels, second lines and
//   seats stay clear. Without this, forests read sparse and only 2 brooks fit on this sheet.
// - Track dots are dropped in the fixed label zone (+2 px) and under the live names and tokens, not in an empty token zone, and
//   not in the seat zone, which the track has to cross to reach the settlement.
// - The features (brooks, ponds, landmarks, vignettes) keep out of the label zones measured in the web fonts. When the fonts
//   arrive after the first paint, the features are laid out again once, so every load ends on the same map; with the fonts
//   blocked (offline) the fallback serif gives a slightly different, equally stable layout. The game bundles its fonts.
// - Mid and Far sprites are drawn without createImageBitmap (rasterizing them cost more than it saved); the deco composite is
//   used at every Mid and Far frame, with the previous sprites cross-faded over it while a month change re-bakes.
// - The footpath stays behind ?footpath: tracks at the start zoom reach about 3.4:1 dot peak but about 1.7:1 line average on
//   Mountains, short of the 1.8:1 the brief asks before it is removed.
// - Region names are placed last and only where a whole name fits on its spine clear of every other label; on this 60-province
//   sheet they appear around Mid scale 0.5 to 0.6 and rarely at the start zoom.
// - Paint lifts, fleck coverage (plains 0.009), forest crown counts (x2 Mid, x1.5 Near) and the strength words (16/24/30) are
//   in PAINT, FLECK, stampSlotsFor and strengthWord; the paint check result is in ui-mockup/v3-paintcheck.txt.
// v3 critique (handdrawn-design/critique.md) applied; where the build departs from its letter:
// - Hill ranges: flankers stand 0.55-0.67 w out (a pair 0.62-0.72 w), 0.5-0.7 w wide and 0.07-0.14 w lower, not 0.35-0.5 w out, so every
//   range stays under the 0.70 silhouette limit against the beast den (40 seeds each for 2, 3 and 4 humps; worst 0.67).
// - Hump shade: a true crescent (the hump in the shade tone, the lit face an ellipse offset toward the light); the critique's literal ellipse
//   at x + 0.3 w split the asymmetric hump down a near-vertical line.
// - Ranges keep their whole box out of the label, second-line and seat zones and away from landmarks, ponds and vignettes; tracks and brooks
//   only have to miss the range's middle (dots are drawn over the bake). TSPEC stays the cap; slots run out before it on this sheet.
// - TSPEC's new counts drive the painted stamps only; v2's slot set and the Hand: v2 toggle keep v2's counts (TSPEC_V2), so landmarks,
//   water and motifs do not move.
// - Tracks: a half that would cross the name zone (Mid and Near name and second line, + 2 u) bows round it from the seat's east or west
//   point; where no bow fits it may run under the name only as one stretch at its town end ('under'), so no dot is dropped mid-run.
// - Brooks: ridge(0.2, 4) on each segment as specified gives about 1.1 sinuosity; seeded uneven bends (two sines) bring them to 1.25 or more
//   where the course stays valid. Bridge parapets take the track's ink (paper ink on dark land), not always feature ink.
// - Names: a crowded name steps down 1 px (never under 11) before it is culled, which keeps the start-zoom label test at 90%.
// - Fog line art keeps the single tuft and a low row of three reed clumps (the clusters' line art crossed the 0.60 limit).
// - The barrow is longer and lower (aspect 6): with the hand's ink its outline had reached 0.73 against the beast den.
