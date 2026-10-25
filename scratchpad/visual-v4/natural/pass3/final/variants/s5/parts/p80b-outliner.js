// ------------------------------------------------------------------ outliner and messages
const outliner = document.getElementById('outliner');
const SECTIONS = [
  { key: 'pinned', title: 'Pinned', open: true, rows: () => [['well', 'Sunmere', 'Wellspring', () => selectProv(ownWell)]] },
  { key: 'armies', title: 'Armies', open: true, rows: () => [['cmd:varo', `Varo · ${cmd.varo.order} · ${names[cmd.varo.at]}`, '48', () => selectCmd('varo')]].concat(cmd.dravik.hidden ? [] : [['cmd:dravik', `Dravik · ${cmd.dravik.order} · ${names[cmd.dravik.at]}`, '52', () => selectCmd('dravik')]]) },
  { key: 'pretender', title: 'Pretender', open: true, rows: () => [['cmd:titan', `The Ashen Titan · ${cmd.titan.order}`, 'Kharnath', () => selectCmd('titan')]] },
  { key: 'mages', title: 'Mages', open: true, rows: () => [['cmd:seren', 'Seren · Researching', 'L2', () => selectCmd('seren')]] },
  { key: 'priests', title: 'Priests', open: true, rows: () => [['cmd:ondra', `Ondra · ${cmd.ondra.prophet ? 'Prophet' : 'Preaching'}`, 'holy 2', () => selectCmd('ondra')]] },
  { key: 'scouts', title: 'Scouts', open: false, rows: () => [['cmd:kesh', 'Kesh · Idle', names[scoutAt], () => selectCmd('kesh')]] },
  { key: 'provinces', title: 'Provinces', open: true, rows: () => [['fist', `Ashfen · unrest ${prov[ashfen].unrest} · ${prov[ashfen].owner !== 'red' ? 'lost to Thornwood' : prov[ashfen].dom.n === 'green' ? 'enemy dominion' : 'faith restored'}`, '', () => selectProv(ashfen)]] },
  { key: 'acts', title: 'Activities', open: false, rows: () => [['fort', 'Kharnath recruits 10 Cinder Warriors', '6d', () => selectProv(redCap)], ['book', 'Research Ember L3', '47d', () => openResearch()]] },
  { key: 'wells', title: 'Wellsprings', open: true, rows: () => wells.map((w) => ['well', names[w] + ' · independent', '', () => selectProv(w)]).concat([['well', 'Sunmere · yours', wellClaimed() ? 'claimed' : prov[ownWell].claim ? 'claiming' : 'unclaimed', () => selectProv(ownWell)]]) },
];
function renderOutliner() {
  outliner.innerHTML = '';
  for (const s of SECTIONS) {
    const rows = s.rows();
    const sec = document.createElement('div'); sec.className = 'osec';
    sec.innerHTML = `<button aria-expanded="${s.open}"><span>${s.open ? '▾' : '▸'}</span>${s.title}<span class="cnt">${rows.length}</span></button>`;
    sec.firstChild.addEventListener('click', () => { s.open = !s.open; renderOutliner(); });
    if (s.open) for (const [ic, nm, meta, go] of rows) {
      const r = document.createElement('div'); r.className = 'orow'; r.tabIndex = 0;
      r.innerHTML = `${ic.startsWith('cmd:') ? `<span class="pdot">${portraitOf(cmd[ic.slice(4)], 24)}</span>` : `<span style="color:var(--dim);display:inline-flex;justify-content:center">${svgIcon(ic, 16)}</span>`}<span class="nm">${nm}</span><span class="meta">${meta}</span>`;
      r.addEventListener('click', go); r.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
      sec.appendChild(r);
    }
    outliner.appendChild(sec);
  }
}
const MSGS = [
  { cat: 'Battles', icon: 'sword', when: 'M3 D12', html: `Victory at <span class="link" data-go="${morholt}">${names[morholt]}</span>: Varo routs 22 independents. We lose 4.`, battle: true },
  { cat: 'Military', icon: 'shield', when: 'M3 D12', html: `<span class="link" data-go="${morholt}">${names[morholt]}</span> is ours.` },
  { cat: 'Military', icon: 'sword', when: 'M3 D11', html: `Thornwood army sighted at <span class="link" data-go="${greenFrom}">${names[greenFrom]}</span>.` },
  { cat: 'Dominion', icon: 'candle', when: 'M2 D30', html: `<span class="link" data-go="${ashfen}">Ashfen</span> is now under the dominion of Thornwood.` },
  { cat: 'Economy', icon: 'fort', when: 'M2 D24', html: '10 Flame Archers recruited in <span class="link" data-go="' + redCap + '">Kharnath</span>.' },
  { cat: 'Magic', icon: 'book', when: 'M2 D18', html: 'Ember research reaches level 2: Warcry.' },
  { cat: 'Economy', icon: 'fort', when: 'M2 D09', html: 'Temple completed in <span class="link" data-go="' + redCap + '">Kharnath</span>.' },
];
const chips = document.getElementById('chips'), msgs = document.getElementById('msgs');
function renderFeed() {
  chips.innerHTML = ['All', 'Battles', 'Military', 'Economy', 'Magic', 'Dominion'].map((c) => `<button class="chip ${state.filter === c ? 'on' : ''}" data-c="${c}">${c}</button>`).join('');
  chips.querySelectorAll('.chip').forEach((b) => b.addEventListener('click', () => { state.filter = b.dataset.c; renderFeed(); }));
  msgs.innerHTML = '';
  MSGS.filter((m) => state.filter === 'All' || m.cat === state.filter).forEach((m) => {
    const r = document.createElement('div'); r.className = 'msg';
    r.innerHTML = `<span style="color:var(--dim);display:inline-flex">${svgIcon(m.icon, 16)}</span><span class="when">${m.when}</span><span>${m.html}</span><span class="acts">${m.battle ? '<button data-a="report">Report</button><button data-a="watch">Watch ▸</button>' : ''}<button data-a="gear" aria-label="Message settings">⚙</button></span>`;
    r.querySelectorAll('[data-go]').forEach((l) => l.addEventListener('click', () => selectProv(Number(l.dataset.go))));
    r.querySelector('[data-a="gear"]').addEventListener('click', () => toast(`${m.cat} messages: Display = Feed, Pause = off. Change it here or in Settings → Messages.`));
    if (m.battle) { r.querySelector('[data-a="report"]').addEventListener('click', openReport); r.querySelector('[data-a="watch"]').addEventListener('click', openReport); }
    msgs.appendChild(r);
  });
}

