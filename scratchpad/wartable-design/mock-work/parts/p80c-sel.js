// ------------------------------------------------------------------ selection: province panel and commander strip
const leftDock = document.getElementById('leftDock'), strip = document.getElementById('strip');
let provTab = 'Overview';
function selectProv(i) {
  if (isWild(i)) { clearSel(); return; }
  state.sel = { type: 'prov', id: i }; state.targeting = false; app.classList.remove('strip-on'); moveLine = null; updateDeco();
  renderProvince(); draw(); renderOutlinerSel();
}
function renderOutlinerSel() {}
function statRow(icon, label, val, delta, tipKey, cls = '') {
  return `<div class="stat" ${tipKey ? `data-tip="${tipKey}"` : ''}><span style="color:var(--dim);display:inline-flex">${svgIcon(icon, 17)}</span><span class="lbl">${label}</span><span class="val">${val}</span><span class="dl ${cls}">${delta ?? ''}</span></div>`;
}
function renderProvince() {
  const p = prov[state.sel.id];
  const own = p.owner === 'red';
  leftDock.hidden = false;
  const ownerName = p.owner === 'red' ? 'Cinder Horde' : p.owner === 'green' ? 'Thornwood' : 'Independent';
  const supply = Math.round(({ plains: 60, farmland: 80, forest: 50, hills: 40, mountains: 20, swamp: 30, wasteland: 15 })[p.terrain] + p.pop / 50);
  const gold = Math.round(p.pop / 100 * (p.unrest ? 1 - p.unrest / 200 : 1));
  RAW.pGold = { title: `Gold from ${p.name}`, value: `+${gold} /mo`, rows: [['Population ÷ 100', String(Math.round(p.pop / 100))], [term('taxrate', 'Tax rate') + ' Normal', '×1.0'], ['Turmoil 2', '−4%'], [term('unrest', 'Unrest') + ` ${p.unrest}`, `−${Math.round(p.unrest / 2)}%`], ['Net', `+${gold} /mo`, 'total']] };
  RAW.pSupply = { title: `Supply in ${p.name}`, value: `${p.i === ashfen ? 50 : 0} / ${supply}`, meaning: `Food for armies standing here each day.`, rows: [[`${TERRAIN[p.terrain].name} base`, String(({ plains: 60, farmland: 80, forest: 50, hills: 40, mountains: 20, swamp: 30, wasteland: 15 })[p.terrain])], ['Population ÷ 50', String(Math.round(p.pop / 50))], ['Varo\'s army eats', p.i === ashfen ? '−50' : '0'], ['Left over', String(supply - (p.i === ashfen ? 50 : 0)), 'total']] };
  RAW.pUnrest = { title: `Unrest in ${p.name}`, value: String(p.unrest), meaning: CONCEPTS.unrest[1], rows: [['Enemy dominion (Thornwood 2)', '+0.7 /mo'], ['Garrison and priests', '−1.0 /mo'], ['Trend', '−0.3 /mo', 'total']], proj: p.unrest > 25 ? 'Above 50 recruiting stops here.' : null };
  RAW.pPop = { title: 'Population', value: fmt(p.pop), rows: [['Growth', '+0.4% /mo'], ['Recruits waiting', '0', 'more']] };
  RAW.taxLow = { title: 'Tax: Low', rows: [['Gold', `−${Math.round(gold * 0.5)} /mo`], [term('unrest', 'Unrest'), '−2 /mo']] };
  RAW.taxNormal = { title: 'Tax: Normal', meaning: 'The default rate.' };
  RAW.taxHigh = { title: 'Tax: High', rows: [['Gold', `+${Math.round(gold * 0.5)} /mo`], [term('unrest', 'Unrest'), '+4 /mo']], proj: `Unrest would reach 50 in about ${Math.max(1, Math.round((50 - p.unrest) / 4))} months.` };
  RAW.pd = { title: `${term('pd', 'Provincial defense')} ${p.pd}`, rows: [[`Level ${p.pd + 1}`, `${(p.pd + 1) * 15} gold`], ['Fields', `${(p.pd + 1) * 2} militia, ${Math.floor((p.pd + 1) / 5)} archers`]], foot: '<span>Shift+click buys 5 levels</span><span></span>' };
  RAW.temple = { title: 'Build a Temple', rows: [['Gold', '200'], ['Days', '30'], ['Builder', `Kesh (scout) walks here: 3 days`]], proj: '+1 dominion check a month; priests preach better here.' };
  RAW.claim = { title: 'Claim this Wellspring', why: 'No priest stands here. Ondra could walk from Kharnath in 9 days.' };
  const scale = (l, r, v) => `<div class="scale"><span>${l}</span><div class="bar"><i style="left:calc(${50 + v * 16.6}% - 2px)"></i></div><span>${r}</span></div>`;
  let body = '';
  if (provTab === 'Overview') {
    body += `<div class="section"><h3>Province</h3>${statRow('pop', 'Population', fogOf(p.i) === 'unexplored' ? 'unknown' : fmt(p.pop), fogOf(p.i) === 'unexplored' ? 'not yet painted' : '▲0.4%', 'raw:pPop', 'up')}${own ? statRow('gold', 'Gold', `+${gold}`, '/mo', 'raw:pGold') : ''}${statRow('supply', 'Supply', `${p.i === ashfen ? 50 : 0} / ${supply}`, 'eaten / given', 'raw:pSupply')}${statRow('fist', 'Unrest', String(p.unrest), p.unrest > 25 ? '▼0.3/mo' : '', 'raw:pUnrest', 'down')}${own && p.buildings.includes('fort') ? statRow('anvil', 'Materials', '212 / 360', '▲60/mo', 'materials', 'up') : ''}</div>`;
    if (own) {
      body += `<div class="section"><h3>Orders</h3><div class="row" style="justify-content:space-between"><span class="dimtxt">${term('taxrate', 'Tax rate')}</span><div class="seg" role="group" aria-label="Tax rate"><button data-tip="raw:taxLow">Low</button><button class="on" data-tip="raw:taxNormal">Normal</button><button data-tip="raw:taxHigh">High</button></div></div>
        <div class="row" style="justify-content:space-between;margin-top:8px"><span class="dimtxt">${term('pd', 'Defense')} level <b class="num" style="color:var(--text)">${p.pd}</b></span><button class="btn" data-tip="raw:pd" id="pdBtn">+1 PD <span class="cost">${(p.pd + 1) * 15}g</span></button></div></div>`;
      body += `<div class="section"><h3>Buildings</h3>${['fort', 'temple', 'lab'].map((b) => p.buildings.includes(b) ? `<div class="building"><span style="color:var(--dim);display:inline-flex">${svgIcon(b, 17)}</span><span>${b[0].toUpperCase() + b.slice(1)}</span><span class="dimtxt">built</span></div>` : b === 'fort' ? `<div class="building" style="opacity:.6"><span style="display:inline-flex;color:var(--dim)">${svgIcon('fort', 17)}</span><span>Fort</span><span class="dimtxt">capitals only</span></div>` : `<div class="building"><span style="color:var(--dim);display:inline-flex">${svgIcon(b, 17)}</span><span>${b[0].toUpperCase() + b.slice(1)}</span><button class="btn" data-tip="raw:${b === 'temple' ? 'temple' : 'temple'}">Build <span class="cost">${b === 'temple' ? '200g · 30d' : '300g · 30d'}</span></button></div>`).join('')}</div>`;
    }
    body += `<div class="section"><h3>${term('scales', 'Scales')} here <span style="text-transform:none;letter-spacing:0;font-weight:400">(${p.dom.n ? (p.dom.n === 'red' ? 'Cinder Horde' : 'Thornwood') + ' ' + p.dom.s : 'no dominion'})</span></h3>${p.dom.n === 'red' ? scale('Order', 'Turmoil', p.dom.s >= 4 ? 1 : 0) + scale('Lore', 'Fury', p.dom.s >= 2 ? 1 : 0) : p.dom.n === 'green' ? scale('Growth', 'Rot', -1) + scale('Wild', 'Artifice', -0) : ''}${scale('Sanctity', 'Dread', 0)}</div>`;
    const bwp = wildsBordering(p.i); if (bwp.length) body += `<div class="section"><h3>${term('impassable', 'Impassable')} neighbors</h3><p style="margin:0;color:var(--dim);font-size:13.5px">Borders ${bwp.map((w) => `<b style="color:var(--text);font-weight:500">${w.name.replace('The ', 'the ')}</b>`).join(' and ')}. Armies go around it.</p></div>`;
    if (p.well) body += `<div class="section"><h3>${term('wellspring', 'Wellspring')}</h3><div class="row" style="justify-content:space-between"><span>${p.i === ownWell ? 'Unclaimed. Claim 2 of 3 to win.' : 'Held by independents (strong).'}</span>${p.i === ownWell ? '<button class="btn" aria-disabled="true" data-tip="raw:claim">Claim</button>' : ''}</div></div>`;
  } else if (provTab === 'Recruit') {
    const units = [['Ash Militia', 8, 3, 8, [10, 10, 9, 9, 0], ''], ['Cinder Warrior', 12, 8, 10, [10, 11, 11, 10, 3], ''], ['Flame Archer', 13, 6, 10, [10, 10, 10, 9, 1], 'ranged'], ['Berserker', 18, 10, 12, [13, 13, 12, 7, 2], 'berserk'], ['Ash Rider', 28, 18, 14, [12, 11, 11, 11, 4], 'mounted'], ['Flamebrand', 32, 14, 16, [13, 13, 12, 11, 6], 'sacred']];
    body += `<div class="section"><h3>Recruit at Kharnath · batch <span class="seg" style="vertical-align:middle;text-transform:none"><button class="on">10</button><button>20</button></span></h3><div class="cards">${units.map(([n, g, m, d, s, tag], k) => { RAW['u' + k] = { title: n, value: tag || 'infantry', rows: [['HP', s[0]], ['Strength', s[1]], ['Attack', s[2]], ['Defense', s[3]], ['Protection', s[4]], [term('morale', 'Morale'), 10 + k % 3], [term('upkeep', 'Upkeep'), `${Math.round(g / 6)} /mo`]], proj: `10 cost ${g * 10} gold and ${m * 10} materials; ready in ${d} days.` }; return `<button class="ucard" data-tip="raw:u${k}"><div class="band"><span>${n}</span><span class="num">${tag ? '◆' : ''}</span></div><div class="body"><div class="stats"><span>HP<b>${s[0]}</b></span><span>Att<b>${s[2]}</b></span><span>Def<b>${s[3]}</b></span><span>Prot<b>${s[4]}</b></span></div><div class="costs"><span>${g * 10}g</span><span>${m * 10}m</span><span>${d}d</span></div></div></button>`; }).join('')}</div></div>
      <div class="section"><h3>Queue</h3><div class="queue"><div class="qitem"><span>10 Cinder Warriors</span><span class="num dimtxt">6d</span><div class="prog"><i style="width:40%"></i></div></div><div class="qitem"><span>Ember Adept</span><span class="num dimtxt">waits</span><div class="prog"><i style="width:0"></i></div></div></div></div>`;
  } else if (provTab === 'Forces') {
    const here = Object.values(cmd).filter((c) => c.at === p.i && !c.hidden);
    body += `<div class="section"><h3>Commanders here</h3>${here.length ? here.map((c) => `<div class="orow" data-c="${c.id}" style="padding-left:6px;grid-template-columns:52px 1fr auto;min-height:50px"><span class="pface">${portraitOf(c, 40)}</span><span class="nm">${cname(c)}</span><span class="meta">${c.squads.reduce((n, s) => n + s[1], 0)}</span></div>`).join('') : '<p class="dimtxt" style="margin:0">None.</p>'}</div>${p.buildings.includes('fort') ? '<div class="section"><h3>Garrison</h3><div class="orow" style="padding-left:6px"><span></span><span class="nm">20 Ash Militia</span><span class="meta">reserve</span></div></div>' : ''}`;
  } else {
    body += `<div class="section"><h3>History</h3>${MSGS.filter((m) => m.html.includes(p.name)).map((m) => `<div class="msg" style="padding-left:0"><span style="color:var(--dim);display:inline-flex">${svgIcon(m.icon, 16)}</span><span class="when">${m.when}</span><span>${m.html}</span></div>`).join('') || '<p class="dimtxt" style="margin:0">Nothing has happened here yet.</p>'}</div>`;
  }
  const tabs = own && p.buildings.includes('fort') ? ['Overview', 'Recruit', 'Forces', 'History'] : ['Overview', 'Forces', 'History'];
  if (!tabs.includes(provTab)) provTab = 'Overview';
  leftDock.innerHTML = `<div class="dockhead"><span class="banner">${p.owner ? `<svg width="20" height="26" viewBox="0 0 22 28"><path d="M1 1h20v20l-10 6-10-6z" fill="${BAN[p.owner]}"/></svg>` : ''}</span><div style="min-width:0;flex:1"><h2>${p.name}</h2><div class="sub">${TERRAIN[p.terrain].name} · ${ownerName}${p.cap ? ' · capital' : ''}</div></div><button class="iconbtn" aria-label="Pin" data-tip="raw:pin">⚲</button><button class="iconbtn" id="closeDock" aria-label="Close">✕</button></div>
    <div class="tabs" role="tablist">${tabs.map((t) => `<button class="tab" role="tab" aria-selected="${t === provTab}">${t}</button>`).join('')}</div><div class="dockbody">${body}</div>`;
  RAW.pin = { title: 'Pin to the outliner', foot: '<span>Key P</span><span></span>' };
  leftDock.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => { provTab = b.textContent; renderProvince(); }));
  leftDock.querySelector('#closeDock').addEventListener('click', clearSel);
  leftDock.querySelectorAll('[data-c]').forEach((r) => r.addEventListener('click', () => selectCmd(r.dataset.c)));
  const pdBtn = leftDock.querySelector('#pdBtn');
  if (pdBtn) pdBtn.addEventListener('click', (e) => { const n = e.shiftKey ? 5 : 1; let cost = 0; for (let k = 0; k < n; k++) cost += (p.pd + 1 + k) * 15; if (cost > state.gold) { toast('Not enough gold.'); return; } state.gold -= cost; p.pd += n; toast(`${p.name}: defense ${p.pd} (−${cost} gold).`); renderProvince(); updateTop(); });
  leftDock.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => { b.parentElement.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); }));
  leftDock.querySelectorAll('.ucard').forEach((b) => b.addEventListener('click', () => toast(`Queued 10 ${b.querySelector('.band span').textContent}s at Kharnath.`)));
}
function selectCmd(id) {
  const c = cmd[id]; state.sel = { type: 'cmd', id }; state.targeting = true; moveLine = null; updateDeco();
  leftDock.hidden = true; app.classList.add('strip-on');
  const troops = c.squads.reduce((n, s) => n + s[1], 0);
  const orders = c.side === 'red' ? [
    ['Idle', null], ['Guard', null], ['Pillage', c.squads.length ? null : 'Needs troops to pillage.'], ['Research', c.pips && !c.crown ? null : c.crown ? 'The Titan cannot research.' : 'Not a mage: no color pips.'],
    ['Preach', c.holy ? null : 'Not a priest: no holy pips.'], ['Claim', c.holy ? 'Stand in an owned Wellspring to claim it.' : 'Not a priest: no holy pips.'], ['Make Prophet', c.crown ? 'The pretender cannot be its own prophet.' : null],
  ] : [];
  orders.forEach(([o, why], k) => { RAW['ord' + k] = why ? { title: o, why } : { title: o, meaning: ({ Idle: 'Waits for orders.', Guard: 'Holds here on purpose; it stays out of the idle alert.', Pillage: 'Takes 2% of the people a day as gold. Unrest +5 a day.', Research: 'Earns research points in a lab.', Preach: 'Spreads dominion: one check per holy pip, +1 at a temple.', 'Make Prophet': 'Holy 3, +1 morale, your bless, one dominion check. One prophet at a time.' })[o] }; });
  const slot = (g) => `<span class="slot" style="color:${g === 'bolt' ? 'var(--red)' : 'var(--dim)'}">${svgIcon(g, 15)}</span>`;
  RAW.script = !c.script ? { title: `${term('script', 'Script')}`, meaning: 'Hidden. You learn an enemy commander\'s plan by fighting it.' } : { title: `${term('script', 'Script')}`, rows: c.script.map((g, k) => [`Round ${k + 1}`, ({ hold: 'Hold', sword: 'Attack', bolt: 'Cast (best spell)' })[g]]).concat([['Round 6 on', 'repeats round 5']]), proj: 'Click to open the Battle Plan.' };
  const psize = app.classList.contains('phone') ? 48 : 64;
  strip.innerHTML = `<div class="portrait" data-tip="cmd:${c.id}">${pspan(portraitOf(c, psize))}<div class="hp" style="width:${psize}px"><i style="width:${(c.hp[0] / c.hp[1]) * 100}%"></i></div><span class="num dimtxt" style="font-size:12px">${c.hp[0]}/${c.hp[1]} HP</span></div>
    <div class="sinfo"><div class="name">${c.name}<span class="dimtxt" style="font:14px var(--font-body)">${c.crown ? ' · ' + c.unit : ', ' + c.unit}${c.pips ? ' · ' + [...c.pips].map(() => manaSym('R', 14)).join('') : ''}</span></div>
      <div class="squads">${c.squads.length ? c.squads.map((s) => `<span class="sq"><b class="num">${s[1]}</b> ${s[0]} <span class="dimtxt num">${s[2]}%</span></span>`).join('') : '<span class="dimtxt" style="font-size:13.5px">Leads no troops.</span>'}</div>
      <div class="script" data-tip="raw:script" tabindex="0">${c.script ? c.script.map(slot).join('') + '<span class="dimtxt" style="font-size:12.5px;margin-left:4px">Battle plan ▸</span>' : '<span class="dimtxt" style="font-size:12.5px">Battle plan unknown</span>'}</div></div>
    <div class="orders">${orders.map(([o, why], k) => `<button class="btn" data-tip="raw:ord${k}" ${why ? 'aria-disabled="true"' : ''} style="${c.order === o ? 'background:#5A5146;' : ''}">${o}</button>`).join('')}${c.side === 'red' && (c.pips) ? '<button class="btn nav" data-tip="raw:cast">Cast ▸</button>' : ''}${c.side === 'green' ? `<span class="dimtxt">Thornwood's army. You see it because it marches next to your land.</span>` : ''}</div>
    <div class="eta">${c.eta ? `<span class="dimtxt" style="font-size:12.5px">arrives in</span><span class="big">${c.eta}d</span>` : c.side === 'red' ? `<span class="dimtxt" style="font-size:12.5px">${app.classList.contains('phone') ? 'Long-press' : 'Right-click'} a province to move</span>` : ''}</div>`;
  RAW.cast = { title: 'Rituals', meaning: 'Opens this mage\'s rituals with their costs and targets.', foot: '<span>Key C</span><span></span>' };
  strip.querySelectorAll('.orders .btn:not(.nav)').forEach((b) => b.addEventListener('click', () => { if (b.getAttribute('aria-disabled') === 'true') return; c.order = b.textContent; selectCmd(id); toast(`${c.name}: ${c.order}.`); renderOutliner(); }));
  if (c.script) strip.querySelector('.script').addEventListener('click', () => toast('The Battle Plan sheet opens over the map: rows, squads, five script slots, copy and paste to all.'));
  const castBtn = strip.querySelector('.nav'); if (castBtn) castBtn.addEventListener('click', () => toast('Rituals tab: castable rituals with mana costs; pick a target on the map.'));
  draw();
}
function clearSel() { state.sel = null; state.targeting = false; updateDeco(); moveLine = null; leftDock.hidden = true; app.classList.remove('strip-on'); draw(); }
