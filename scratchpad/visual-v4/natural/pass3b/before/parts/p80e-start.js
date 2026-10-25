
// ------------------------------------------------------------------ keys
window.addEventListener('keydown', (e) => {
  if (e.target.matches('input:not([type]), input[type=text], input[type=search], select, textarea')) return; // the slider and checkboxes keep the shortcuts
  if (e.key === 'Shift') app.classList.add('shift');
  if (RELIEF() && e.key === 'Shift' && !e.repeat && !state.sel && !tips.length && !RL_NUMBERS.shift) { RL_NUMBERS.shift = true; requestDraw(); } // v4: Shift held alone, nothing selected, no tooltip open: every name and the numbers
  if (RELIEF() && e.key === '`') { RL_NUMBERS.on = !RL_NUMBERS.on; requestDraw(); }
  if (e.key === 'Escape') { if (!scrim.hidden) closeModal(); else if (tips.length) closeAll(); else clearSel(); return; }
  if (e.code === 'Space') { e.preventDefault(); setPaused(!state.paused); }
  if (/^Digit[1-4]$/.test(e.code) && !e.shiftKey) { state.speed = Number(e.code.slice(5)); updateTop(); }
  if (/^Digit[1-7]$/.test(e.code) && e.shiftKey) { const m = modesFor()[Number(e.code.slice(5)) - 1]; if (m) setMode(m[0]); } // Shift+7: the Terrain mode (F7 is never bound)
  if (e.key === 't' || e.key === 'T') lockTop();
  if (e.key === 'f' || e.key === 'F') openCodex();
  if (e.key === 'r' || e.key === 'R') openResearch();
  if (e.key === 'z' || e.key === 'Z') fitToCloth();
  if (e.key === 'h' || e.key === 'H') app.classList.toggle('hidden-ui');
  if (e.key === 'm' || e.key === 'M') cycleMode();
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
  if (k === 'terrain') setTerrainColours(v);
})));
// v4: Map look. Relief is the relief map (map-design-final.md); Painted (v3) is the page exactly as before (?look=v3 opens on it).
function setLook(v) {
  v = v === 'v3' ? 'v3' : 'relief'; if (view.look === v) return; view.look = v;
  npoly = v === 'relief' || view.borders === 'straight' ? cells : NPOLY_W; resetGeometryCaches(true); TABLEB = null; CLOTHB = null; CK = null; RCK = null;
  layer.innerHTML = ''; badgeSig = ''; badgeEls = []; RL_PIECE_DOM.clear(); rlPieceSigLast = ''; RL_PIECE_CACHE.clear(); hoverProv = -1; RL_LINK.prov = -1;
  if (!modesFor().some((m) => m[0] === state.mode)) state.mode = 'ownership'; // the Terrain mode is the relief map's
  syncLookUI(); updateDeco(); renderModes(); if (!headMoreByHand) headMore.open = headMoreDefault(); layout();
}
function syncLookUI() {
  document.body.classList.toggle('look-relief', RELIEF()); document.body.classList.toggle('look-v3', !RELIEF()); app.classList.toggle('railed', RELIEF());
  document.querySelectorAll('#mockctl [data-ctl="look"] button').forEach((b) => b.classList.toggle('on', b.dataset.v === view.look));
  document.querySelectorAll('#mockctl [data-ctl="tint"] button').forEach((b) => b.classList.toggle('on', (b.dataset.v === 'on') === view.tint));
  document.querySelectorAll('#mockctl [data-ctl="terrain"] button').forEach((b) => { b.classList.toggle('on', b.dataset.v === view.terrain); b.setAttribute('aria-pressed', String(b.dataset.v === view.terrain)); });
}
// natural §6: Settings → Accessibility → Terrain colours: Natural (default) | Clear (?terrain=clear). Clear shows the colour-blind-safe fills in Ownership mode
function setTerrainColours(v) { view.terrain = v === 'clear' ? 'clear' : 'natural'; syncLookUI(); if (RB.ready) rlEnsureLook(rlLandLook()); renderModes(); requestDraw(); }
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

// natural §7: every link to a province carries its accessible name with the terrain: "Tormere, forest, Cinder Horde"
const provAria = (i) => `${names[i]}, ${TERRAIN[terr[i]].name.toLowerCase()}, ${ownerName(prov[i].owner)}`;
const labelLinks = (root) => root.querySelectorAll('[data-go]').forEach((l) => { const i = Number(l.dataset.go); if (i >= 0 && prov[i] && !isWild(i)) l.setAttribute('aria-label', provAria(i)); });
new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) { if (n.matches && n.matches('[data-go]')) labelLinks(n.parentNode ?? n); else labelLinks(n); } }).observe(document.body, { childList: true, subtree: true });
// ------------------------------------------------------------------ responsive frames
const rightDock = document.getElementById('rightDock');
document.getElementById('railOut').addEventListener('click', () => { rightDock.classList.toggle('fly'); });
document.getElementById('railFeed').addEventListener('click', () => { rightDock.classList.toggle('fly'); msgs.scrollIntoView({ block: 'nearest' }); });
document.getElementById('railMode').addEventListener('click', () => { cycleMode(); const m = MODES.find((x) => x[0] === state.mode); toast(`${m[2]} map: ${m[3]}`); });
RAW.railMode = { title: 'Map mode', meaning: 'Cycles ownership, dominion, supply, unrest, population, mana springs and (on the relief map) terrain.', foot: '<span>Key M</span><span></span>' };
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
syncLookUI(); labelLinks(document); // v4: the controls, the Try this list and the right dock's rail follow the Map look
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
  setTerrain: (v) => { setTerrainColours(v); return view.terrain; }, look: () => ({ want: rlLandLook(), shown: rlShownLook(), natural: rlLookReady('natural'), clear: rlLookReady('clear'), preparing: RB.lookRunning }),
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
// The natural view (natural/design-final.md), where the build departs from its letter:
// - Hairlines below device pixel ratio 1.5 are 2 px when alone (a 1.5 px line leaves no fully covered pixel at 45 deg and fell under
//   2.3:1); a partnered segment is 1.5 + 1.5 px at every ratio (RL_P.line.pairW1), so none is wider than 3 px, and the narrowed anchor
//   keeps its weight (alpha x 2 / 1.5, at most 1). The partner is drawn at alpha 1, not 0.8 (0.8 left Clear partner segments under).
// - The hairline solve uses coverage 0.8 and the p5 / p95 of the ground (RL_P.line), not 0.75 and p10 / p90, and counts the ground
//   right under the line (a hedge or shore on the border), so rendered pixels hold 2.3:1 in every view of both looks at ratios 1 and 2.
// - Partners: a partner that came and went per 0.1 D segment read as dashes, and one that swapped sides as a twisted line. A solved
//   partner keeps the side its anchor fails on; where the anchor fails on both sides it takes the edge's majority side. That side is
//   extended over the whole edge where a third of it needs a partner, otherwise by a segment either side with gaps of up to two closed.
// - Data modes: the lines are solved against the mode raster on screen (the design is silent; solving them on the bake left light
//   lines over pale fills and partners in pieces).
// - Seats in unexplored land are muted against the interior haze, not the hem's peak.
// - Snow (Clear): the S6 clamp as designed, plus a per-colour L* cap in the colour pass on land over L* 60 (21 / 13 from the snow
//   raw, 20.6 / 12.6 under the hem's 12% haze; margins for 8-bit rounding), since the S6 clamp alone left lit rock near the snow;
//   four gamut passes instead of two keep every province mean within 0.5 (the mean-neutral residual stays 0).
// - The natural pass costs about 3.4 to 4.6 s of CPU here (materials 2.4 to 3.0 s under load), not the 1.0 to 1.3 s of the review
//   bench; the shared rasters are as designed. In the game both are GPU passes.
