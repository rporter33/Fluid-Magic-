
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
  clearTimeout(detentTimer); detentTimer = setTimeout(() => { const s0 = startScale(); if (Math.abs(cam.s / s0 - 1) <= 0.08 && cam.s !== s0) animateCam(s0, null); }, 150); // the detent: the start scale (relief), the fit (v3)
}, { passive: false });

// ------------------------------------------------------------------ map modes (the decoration fades out of data modes over 150 ms)
// natural §6: the seventh mode, Terrain (Shift+7; F7 is never bound: caret browsing), shows the Clear bake as baked. It is the relief map's: Painted (v3) shows its fills already.
const MODES = [['ownership', 'ownership', 'Ownership', 'Owner bands over the painted land.'], ['dominion', 'dominion', 'Dominion', 'Who dominates each province, and how strongly.'], ['supply', 'supply', 'Supply', 'Food given per day. Lighter is more.'], ['unrest', 'fist', 'Unrest', 'Lighter is more unrest. Above 50 recruiting stops.'], ['population', 'pop', 'Population', 'Lighter is more people.'], ['springs', 'springs', 'Mana springs', 'Springs by color, with their symbols.'], ['terrain', 'terrainMode', 'Terrain', 'The colour-blind-safe terrain colours, with their relief.']];
const modesFor = () => (RELIEF() ? MODES : MODES.filter((m) => m[0] !== 'terrain'));
const modesEl = document.getElementById('modes');
// AD fix 12: the Ownership caption is not a standing panel on the land: it shows for 4 s after a mode change and while the pointer is on the Ownership button
const RL_MODECAP = { until: 0, hover: false, t: 0 };
function setMode(m) {
  if (!modesFor().some((x) => x[0] === m)) m = 'ownership';
  if (m !== state.mode) { RL_MODECAP.until = performance.now() + 4000; clearTimeout(RL_MODECAP.t); RL_MODECAP.t = setTimeout(rlModeCapSync, 4050); }
  state.mode = m; if (m === 'terrain' && RB.ready) rlEnsureLook('clear'); updateDeco();
  renderModes(); requestDraw();
}
function rlModeCapSync() { const el = modesEl.querySelector('.legend'); if (!el) return; const tmp = RELIEF() && state.mode === 'ownership'; el.classList.toggle('captemp', tmp); el.classList.toggle('capshow', !tmp || RL_MODECAP.hover || performance.now() < RL_MODECAP.until); }
const cycleMode = () => { const L = modesFor(), k = L.findIndex((m) => m[0] === state.mode); setMode(L[(k + 1) % L.length][0]); };
// v3 readability guard (5.1, 5.2): decoration fades out of data modes and dims to 60% while commanders are selected (move targeting).
// Deviation: the mockup's preselected Varo at load is shown without the dim; selecting any army dims.
function updateDeco() {
  const to = state.mode !== 'ownership' ? 0 : state.sel && state.sel.type === 'cmd' && state.targeting && PAINTED() && !RELIEF() ? 0.6 : 1; // v4: the relief map keeps its land at full strength while targeting
  if (to !== decoTo) { decoFrom = decoAlpha; decoTo = to; decoT0 = performance.now(); }
  requestDraw();
}
const rlPreparing = () => RELIEF() && RB.ready && !rlLookReady('clear') && (state.mode === 'terrain' || view.terrain === 'clear');
function renderModes() {
  const L = modesFor(), cur = L.find((m) => m[0] === state.mode) ?? L[0], prep = rlPreparing();
  if (RELIEF()) { MODES[0][3] = 'Owner rails and a glow inside realm edges over the terrain model.'; } else MODES[0][3] = 'Owner bands over the painted land.';
  const tleg = cur[0] === 'terrain' ? `<div class="tlegend">${RL_T.map((t) => `<span class="tl">${terrainSwatch(t, 12)}<span>${TERRAIN[t].name}</span></span>`).join('')}</div>${prep ? '<div class="tprep" role="status">Preparing terrain colours…</div>' : ''}${view.terrain === 'clear' ? '<div class="tnote">Clear terrain colours are on everywhere.</div>' : '<button class="tuse" id="useClear">Use these colours everywhere</button>'}` : '';
  modesEl.classList.toggle('compact', RELIEF()); // pass 2: the relief look stacks the zoom band and Fit in the mode column
  modesEl.innerHTML = `<div class="fitrow"><span class="zoomchip" id="zoomChip" data-tip="raw:zoom" aria-label="Zoom: ${bandOf(cam.s)}">${RELIEF() ? '' : 'Zoom: '}${bandOf(cam.s)[0].toUpperCase() + bandOf(cam.s).slice(1)}</span><button class="fitbtn" id="fitBtn" data-tip="raw:fit">Fit <kbd>Z</kbd></button></div><div class="legend"><b style="color:var(--text)">${cur[2]}</b> · ${cur[3]}${cur[0] !== 'ownership' ? ' Wilds stay drawn: no data, no entry.' : ''}${tleg}</div>` + L.map((m, k) => { const p = m[0] === 'terrain' && prep; return `<button class="modebtn ${m[0] === state.mode ? 'on' : ''}${p ? ' prep' : ''}" data-m="${m[0]}" data-tip="raw:mode${k}" aria-label="${m[2]} map mode${p ? ' (preparing terrain colours…)' : ''}">${svgIcon(m[1], 18)}</button>`; }).join('');
  L.forEach((m, k) => { RAW['mode' + k] = { title: m[2] + ' map', meaning: m[3] + (m[0] === 'terrain' && prep ? ' Preparing terrain colours…' : ''), foot: `<span>Shift+${k + 1} · M cycles</span><span></span>` }; });
  RAW.fit = RELIEF() ? { title: 'Back to the start view', meaning: 'Returns to the start view: your capital at the start zoom, at least 96 px a province. Lean back with the wheel to see the whole terrain model on the oak. Home stays the capital.', foot: '<span>Key Z</span><span></span>' } : { title: 'Fit the cloth', meaning: 'Returns to the standard view: the whole map with a band of oak around it. Home stays the capital.', foot: '<span>Key Z</span><span></span>' };
  RAW.zoom = RELIEF() ? { title: 'Zoom band', meaning: 'Far: the whole model on the table; capitals, Wellsprings and wilds are named. Mid: names for what you point at, plan with or hover in a panel. Near: the towns too, and every name once you lean in close; hamlets, guards and spring stones. Information is one gesture away: hover, hold Shift, or ` for the numbers.' } : { title: 'Zoom band', meaning: 'Far shows masses and the table; Mid the full detail; Near adds yards, standees and scree. Information never thins, only decoration.' };
  modesEl.querySelectorAll('.modebtn').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.m)));
  const ob = modesEl.querySelector('.modebtn[data-m="ownership"]'); if (ob) { ob.addEventListener('mouseenter', () => { RL_MODECAP.hover = true; rlModeCapSync(); }); ob.addEventListener('mouseleave', () => { RL_MODECAP.hover = false; rlModeCapSync(); }); ob.addEventListener('focus', () => { RL_MODECAP.hover = true; rlModeCapSync(); }); ob.addEventListener('blur', () => { RL_MODECAP.hover = false; rlModeCapSync(); }); }
  rlModeCapSync();
  modesEl.querySelector('#fitBtn').addEventListener('click', fitToCloth);
  modesEl.querySelector('#useClear')?.addEventListener('click', () => setTerrainColours('clear'));
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

