// ------------------------------------------------------------------ sample economy and tooltips
const fmt = (n) => n.toLocaleString('en-US');
const state = { day: 14, month: 3, year: 1, gold: 1240, speed: 1, paused: true, mode: 'ownership', sel: null, filter: 'All', pauseReason: null, autoPaused: false };
const CONCEPTS = {
  upkeep: ['Upkeep', 'Every troop and commander costs gold each month. Unpaid troops lose morale, one point per 10 unpaid days.'],
  taxrate: ['Tax rate', 'Low, Normal, or High per province. High collects 50% more gold and adds 4 unrest a month.'],
  unrest: ['Unrest', 'From 0 to 100. It lowers gold by its share. Above 50 the province cannot recruit.'],
  supply: ['Supply', 'Food a province gives armies each day: terrain base plus population ÷ 50. Armies that eat more than it gives start to starve.'],
  dominion: ['Dominion', 'Your god\'s presence in a province, 0 to 10. It spreads from your capital, temples, pretender, prophet, and preaching priests, and it carries your scales.'],
  scales: ['Scales', 'Five two-pole axes your pretender sets the world toward, such as Order against Turmoil. They apply where your dominion holds, scaled by its strength.'],
  pip: ['Pip', 'One point of a color on a commander. Pips decide which spells it can cast and how cheaply.'],
  materials: ['Materials', 'Built up in each fort from its own and its neighbors\' land, up to six months of production. Troops and buildings spend them.'],
  fort: ['Fort', 'The only place troops are recruited. In this milestone every capital has one.'],
  research: ['Research', 'Mages in a lab earn points toward the next level of your active color. Levels unlock spells.'],
  wellspring: ['Wellspring', 'A source of all five colors. A priest claims an owned one in 10 uninterrupted days. Claim 2 of 3 to win.'],
  godless: ['Godless', 'When neither your capital nor any temple you own is under your own dominion: no rituals, and your pretender leaves the map.'],
  morale: ['Morale', 'How long a squad holds. Losses, fear, and hunger test it each round; a squad that fails routs.'],
  leadership: ['Leadership', 'How many troops a commander can lead into battle.'],
  pd: ['Provincial defense', 'Militia and archers that defend the province, from 0 to 30. Each level costs more than the last.'],
  script: ['Script', 'Five orders a commander follows in the first five rounds of a battle: cast a spell, attack, hold, or retreat.'],
  growth: ['Growth', 'Population change each month: about 1% plus the Growth scale, minus losses to pillage and battle.'],
  impassable: ['Impassable terrain', 'Some of the map is wild: named mountain massifs (peaks) and dark lakes (meres). A wild is not a province. No one owns, enters, crosses or targets it, so movement, retreat, sight, dominion spread and ritual reach all go around it. Every province can still reach every other.'],
  inbound: ['Hostile inbound', 'A visible enemy army whose march ends where you have troops, a fort, or your capital. Battles resolve the moment armies meet, so you are warned before.'],
};
const term = (k, text) => `<span class="term" data-concept="${k}">${text ?? CONCEPTS[k][0].toLowerCase()}</span>`;
const FOOT = '<span>Shift more · T lock · Click open</span><span>Ctrl+click Codex</span>';
function tipHTML(t) {
  let h = `<h4><span class="tt">${t.portrait ? `<span class="tport">${t.portrait}</span>` : ''}<span>${t.title}</span></span>${t.value ? `<span class="num">${t.value}</span>` : ''}</h4>`;
  if (t.meaning) h += `<p class="meaning">${t.meaning}</p>`;
  if (t.rows) {
    h += '<table>';
    for (const r of t.rows) h += `<tr class="${r[2] ?? ''}"><td>${r[0]}</td><td>${r[1]}</td></tr>`;
    h += '</table>';
  }
  if (t.why) h += `<p class="why">${t.why}</p>`;
  if (t.proj) h += `<p class="proj">${t.proj}</p>`;
  return h + `<div class="foot">${t.foot ?? FOOT}</div><div class="lockbar"></div>`;
}
const TIPS = {
  nation: () => ({ title: 'Cinder Horde', meaning: `Red. Pretender: <b>The Ashen Titan</b>, awake in Kharnath. Not ${term('godless', 'godless')}.`, rows: [['Order ◀ ▶ Turmoil', 'Turmoil 2'], ['Lore ◀ ▶ Fury', 'Fury 3'], ['Growth ◀ ▶ Rot', '0'], ['Wild ◀ ▶ Artifice', '0'], ['Sanctity ◀ ▶ Dread', '0']], proj: `Your ${term('scales')} apply where your dominion holds.` }),
  pop: () => ({ title: 'Population', value: '84.2k', meaning: `People under your rule. They pay tax, give ${term('supply')}, and fill your ranks.`, rows: [['Kharnath', '25,000'], ['Ashfen', '7,400'], ['Six others', '51,800'], ['Growth per month', '+0.3k'], ['Recruits waiting for people', '0', 'more']], proj: `${term('growth', 'Growth')}: +0.4% a month.` }),
  gold: () => ({ title: 'Gold', value: fmt(Math.round(state.gold)), meaning: 'Treasury and its net monthly change.', rows: [['Kharnath (tax Normal)', '+250'], ['Ashfen', '+52'], ['Six other provinces', '+188'], ['Troop and commander ' + term('upkeep'), '−452'], ['Varo\'s army', '−192', 'more'], ['Garrison of Kharnath', '−164', 'more'], ['Pretender and mages', '−96', 'more'], ['Net', '+38 /mo', 'total']], proj: `At this rate: ${fmt(Math.round(state.gold) + 38)} in 30 days.` }),
  materials: () => ({ title: 'Materials at Kharnath', value: '212 / 360', meaning: `The capital ${term('fort')}'s ${term('materials')} pool. Troops spend it when queued.`, rows: [['Kharnath\'s own land', '+38'], ['Neighbors (half each)', '+22'], ['Net', '+60 /mo', 'total'], ['Cap (6 months)', '360']], proj: 'Full in 2.5 months.' }),
  research: () => ({ title: 'Research: Ember', value: 'L2 ▸ 47 days', meaning: `${term('research', 'Research')} goes to Red. Level 3 unlocks Fireball and Blood Fury.`, rows: [['Seren (Ember Adept, R1, in Kharnath\'s lab)', '+5.6 /mo'], ['Fury 3 on research', '−30%'], ['Total', '+3.9 /mo', 'total'], ['Points to level 3', '61']] }),
  dominion: () => ({ title: 'Dominion score', value: '5', meaning: `How far and how strongly your ${term('dominion')} spreads. Each check rolls d10; at or below 5 it pushes.`, rows: [['Pretender', '5'], ['Claimed Wellsprings', '+0'], ['Checks per month', '9', 'total'], ['Capital', '3', 'more'], ['Temple', '1', 'more'], ['Pretender', '2', 'more'], ['Preaching priest (Ondra, holy 2, temple)', '3', 'more']], proj: 'Next spread on the last day of the month (16 days).' }),
  wells: () => ({ title: 'Wellsprings', value: '0 / 2', meaning: `Claim 2 of the 3 ${term('wellspring', 'Wellsprings')} to win.`, rows: [['Sunmere', 'yours, unclaimed'], [names[wells[0]], 'independent'], [names[wells[1]], 'independent'], ['Thornwood', '0 claimed']], proj: 'Click to center the map on the next one.' }),
  clock: () => ({ title: `Y${state.year} M${state.month} D${state.day}`, meaning: 'Dominion spreads and Godless is checked on the last day of each month. Every other rate is paid daily.', rows: [['Today', '+1.3 gold, +0.1 R']], foot: '<span>Space pause · 1–4 speed · + / − step</span><span></span>' }),
  btnR: () => ({ title: 'Research', meaning: 'Levels per color, unlocks, and who researches.', foot: '<span>Key R</span><span></span>' }),
  btnL: () => ({ title: 'Ledger', meaning: 'Sortable tables of provinces, commanders, magic, battles, and nations.', foot: '<span>Key L</span><span></span>' }),
  btnF: () => ({ title: 'Codex', meaning: 'Every unit, spell, building, and rule, linked from every tooltip.', foot: '<span>Key F</span><span></span>' }),
  railOut: () => ({ title: 'Outliner', meaning: 'Everything you own or are doing.' }),
  railFeed: () => ({ title: 'Messages', meaning: 'Events as they happen; battles open their report.' }),
};
for (const c of 'WUBRG') {
  const stock = { W: 0, U: 0, B: 0, R: 14, G: 2 }[c], rate = { W: 0, U: 0, B: 0, R: 3, G: 1 }[c];
  TIPS['mana' + c] = () => ({ title: `${MANA[c].name} mana (${c})`, value: String(stock), meaning: stock || rate ? `Spent on rituals and carried into battle by mages.` : `You have no source of ${MANA[c].name} yet. Springs and Wellsprings give it.`, rows: rate ? (c === 'R' ? [['Springs: Kharnath, ' + names[redBorder[2] ?? redCap]], ['Dominion tint (Red)', '+1'], ['Springs', '+2'], ['Net', '+3 /mo', 'total']] : [['Spring: ' + names[redBorder[3] ?? redCap], '+1'], ['Net', '+1 /mo', 'total']]).map((r) => (r.length === 1 ? [r[0], ''] : r)) : null });
}
const manaEl = document.getElementById('mana');
for (const c of 'WUBRG') {
  const stock = { W: 0, U: 0, B: 0, R: 14, G: 2 }[c], rate = { W: 0, U: 0, B: 0, R: 3, G: 1 }[c];
  manaEl.insertAdjacentHTML('beforeend', `<div class="readout ${stock || rate ? '' : 'zero'}" tabindex="0" data-tip="mana${c}">${manaSym(c, 18)}<span class="v">${stock}</span>${rate ? `<span class="r up hidephone">▲${rate}</span>` : ''}</div>`);
}

