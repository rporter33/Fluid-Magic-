TIPS['cmd'] = (id) => {
  const c = cmd[id]; const troops = c.squads.reduce((n, s) => n + s[1], 0);
  const rows = c.squads.map((s) => [s[0], `${s[1]} · ${s[2]}% HP`]);
  rows.push([term('morale', 'Morale'), String(c.mor)], [term('leadership', 'Leadership'), `${troops} / ${c.lead}`]);
  const portrait = portraitOf(c, 48);
  const where = `In ${prov[c.at].name} (${TERRAIN[prov[c.at].terrain].name.toLowerCase()}).`; // natural §7: the army card's location line names the terrain
  if (c.side === 'green') return { portrait, title: `${cname(c)}`, value: `${troops} troops`, meaning: `Thornwood. ${where} ${term('inbound', 'Hostile')}: marching on ${prov[c.to].name}, arrives in ${c.eta} days.`, rows: rows.slice(0, 2), proj: 'Our estimate: about 1.1 times Varo\'s army. A guess, not a forecast.' };
  if (c.hp[0] / c.hp[1] <= 0.5) rows.unshift(['Wounded', `${c.hp[0]} / ${c.hp[1]} HP`]);
  return { portrait, title: c.name, value: c.unit, meaning: `${where} Order: ${c.order}.${c.pips ? ' Pips: ' + c.pips + '.' : ''}${c.prophet ? ' The prophet.' : ''}${c.gear ? ` Gear: ${c.gear.n} item (${['', 'common', 'rare', 'artifact'][c.gear.tier]}).` : ''}`, rows };
};

// ------------------------------------------------------------------ tooltips: L1 hover, L2 nested terms, lock
const tips = []; let hoverTimer = null, lockTimer = null, hoverTarget = null;
function resolveTip(key) {
  if (key.startsWith('cmd:')) return TIPS.cmd(key.slice(4));
  if (key.startsWith('prov:')) return provTip(Number(key.slice(5)));
  if (key.startsWith('concept:')) { const [t, m] = CONCEPTS[key.slice(8)]; return { title: t, meaning: m, foot: '<span>Click a term to go deeper</span><span>Ctrl+click Codex</span>' }; }
  if (key.startsWith('raw:')) return RAW[key.slice(4)];
  const f = TIPS[key]; return f ? f() : null;
}
const RAW = {};
function showTip(key, anchorRect, level) {
  const t = resolveTip(key); if (!t) return;
  while (tips.length > level) tips.pop().el.remove();
  const el = document.createElement('div'); el.className = 'tip'; el.innerHTML = tipHTML(t); el.dataset.key = key;
  app.appendChild(el);
  const ar = app.getBoundingClientRect();
  const w = el.offsetWidth, h = el.offsetHeight;
  let x, y;
  if (level === 0) { x = anchorRect.left - ar.left; y = anchorRect.bottom - ar.top + 8; if (y + h > ar.height - 6) y = anchorRect.top - ar.top - h - 8; }
  else { x = anchorRect.right - ar.left + 10; y = anchorRect.top - ar.top - 10; if (x + w > ar.width - 6) x = anchorRect.left - ar.left - w - 10; }
  x = Math.max(6, Math.min(x, ar.width - w - 6)); y = Math.max(46, Math.min(y, ar.height - h - 6));
  el.style.left = x + 'px'; el.style.top = y + 'px';
  tips.push({ el, key, locked: false });
  // lock after 0.8 s so the pointer can travel into the tooltip and reach its terms
  clearTimeout(lockTimer);
  requestAnimationFrame(() => el.classList.add('locking'));
  lockTimer = setTimeout(() => lockTop(), 800);
  el.addEventListener('mouseleave', (e) => { if (!tips.some((x) => x.el.contains(e.relatedTarget)) && !(hoverTarget && hoverTarget.contains(e.relatedTarget))) closeFrom(tips.findIndex((x) => x.el === el)); });
  el.querySelectorAll('[data-go]').forEach((l) => l.addEventListener('click', () => { closeAll(); selectProv(Number(l.dataset.go)); }));
  el.querySelectorAll('.term').forEach((tm) => {
    tm.addEventListener('mouseenter', () => { if (tips.length >= 3 && tips.findIndex((x) => x.el === el) >= 2) return; clearTimeout(hoverTimer); hoverTimer = setTimeout(() => showTip('concept:' + tm.dataset.concept, tm.getBoundingClientRect(), tips.findIndex((x) => x.el === el) + 1), 250); });
    tm.addEventListener('click', (e) => { if (e.ctrlKey || e.metaKey) openCodex(tm.dataset.concept); });
  });
}
function lockTop() { const t = tips.at(-1); if (t) { t.locked = true; t.el.classList.add('locked'); } }
function closeFrom(i) { if (i < 0) return; while (tips.length > i) tips.pop().el.remove(); }
function closeAll() { clearTimeout(hoverTimer); clearTimeout(lockTimer); closeFrom(0); }
function bindTips(root) {
  root.addEventListener('mouseover', (e) => {
    const t = e.target.closest('[data-tip]'); if (!t || t === hoverTarget || tips.some((x) => x.el.contains(t))) return;
    hoverTarget = t; clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => showTip(t.dataset.tip, t.getBoundingClientRect(), 0), 400);
  });
  root.addEventListener('mouseout', (e) => {
    const t = e.target.closest('[data-tip]'); if (!t || t.contains(e.relatedTarget)) return;
    if (tips.some((x) => x.el.contains(e.relatedTarget))) return;
    clearTimeout(hoverTimer); hoverTarget = null;
    if (!(tips[0] && tips[0].locked && tips[0].el.matches(':hover'))) closeAll();
  });
  root.addEventListener('focusin', (e) => { const t = e.target.closest('[data-tip]'); if (t) showTip(t.dataset.tip, t.getBoundingClientRect(), 0); });
  root.addEventListener('focusout', () => closeAll());
}
bindTips(app);

// ------------------------------------------------------------------ alerts ribbon
const TIER = {
  urgent: (c) => `<svg width="30" height="30" viewBox="0 0 30 30"><path d="M10 2h10l8 8v10l-8 8H10l-8-8V10z" fill="${c}" stroke="rgba(0,0,0,.5)"/>`,
  important: (c) => `<svg width="30" height="30" viewBox="0 0 30 30"><path d="M15 2l13 25H2z" fill="${c}" stroke="rgba(0,0,0,.5)"/>`,
  opportunity: (c) => `<svg width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="13" fill="${c}" stroke="rgba(0,0,0,.5)"/>`,
  hint: (c) => `<svg width="30" height="30" viewBox="0 0 30 30"><rect x="2" y="2" width="26" height="26" rx="7" fill="${c}" stroke="rgba(0,0,0,.5)"/>`,
};
const ALERTS = [
  { id: 'inbound', tier: 'urgent', color: 'var(--urgent)', glyph: 'sword', title: 'Hostile armies inbound', cases: [[`Ilsa Oakhand (52) → <b>Ashfen</b>, ${cmd.ilsa.eta} days`, () => selectCmd('ilsa')]], meaning: 'A visible enemy march ends where you have troops. Battles resolve the moment armies meet.' },
  { id: 'enemydom', tier: 'important', color: 'var(--important)', glyph: 'candle', title: 'Enemy dominion in your land', cases: [['<b>Ashfen</b>: Thornwood 2', () => selectProv(ashfen)]], meaning: 'Their scales apply here and unrest rises. Preach or build a temple to push back.' },
  { id: 'idle', tier: 'important', color: 'var(--important)', glyph: 'hold', title: 'Idle commanders', cases: [['<b>The Ashen Titan</b> in Kharnath, could lead an army', () => selectCmd('titan')], ['<b>Kesh</b> (scout), idle', () => selectCmd('kesh')]], meaning: 'Commanders without an order. Guard tells the game a wait is on purpose.' },
  { id: 'well', tier: 'opportunity', color: 'var(--opportunity)', glyph: 'well', title: 'Wellspring claimable', cases: [['<b>Sunmere</b> is yours and unclaimed. A priest claims it in 10 days.', () => selectProv(ownWell)]], meaning: 'Claim 2 of 3 Wellsprings to win.' },
  { id: 'hint', tier: 'hint', color: 'var(--hint)', glyph: 'codex', title: 'Moving armies', cases: [['Select an army, then right-click a province.', () => selectCmd('varo')]], meaning: 'The path and its arrival day show before you commit.' },
];
const ribbon = document.getElementById('ribbon');
function renderAlerts() {
  ribbon.innerHTML = '';
  ALERTS.forEach((a, k) => {
    if (a.dismissed) return;
    const b = document.createElement('button'); b.className = 'alert' + (a.tier === 'urgent' && !a.seen ? ' pulse' : ''); a.seen = true;
    b.innerHTML = TIER[a.tier](a.color) + `<g transform="translate(7 ${a.tier === 'important' ? 10 : 7}) scale(.67)" fill="none" stroke="#1C1A17" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${ICON[a.glyph]}</g></svg><span class="count">${a.cases.length}</span>`;
    b.setAttribute('aria-label', `${a.title}, ${a.cases.length}`);
    RAW['alert' + k] = { title: a.title, meaning: a.meaning, rows: a.cases.map((c) => [c[0], '']), foot: '<span>Click go · Right-click dismiss · Shift+right-click mute</span><span></span>' };
    b.dataset.tip = 'raw:alert' + k;
    let cycle = 0;
    b.addEventListener('click', () => { closeAll(); a.cases[cycle % a.cases.length][1](); cycle++; });
    b.addEventListener('contextmenu', (e) => { e.preventDefault(); closeAll(); a.dismissed = true; renderAlerts(); toast(`${a.title}: dismissed until it changes${e.shiftKey ? ' (muted for this game)' : ''}.`); });
    ribbon.appendChild(b);
  });
}
