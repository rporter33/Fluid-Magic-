
const SUPPLY = { plains: 60, farmland: 80, forest: 50, hills: 40, mountains: 20, swamp: 30, wasteland: 15 };
const ownerName = (o) => (o === 'red' ? 'Cinder Horde' : o === 'green' ? 'Thornwood' : 'Independent');
function moveProjection(c, i) {
  const d = pathTo(c.at, i);
  if (d) { const bw = barrierOnLine(c.at, i); return `Right-click: ${c.name} marches here in <b>${d.days} days</b>${bw ? `, around ${bw.name.replace('The ', 'the ')}` : ''}${prov[i].owner !== 'red' ? ', then fights for it' : ''}${rlCrossText(c.at, d.path)}.`; }
  return noPathText(c, i);
}
function noPathText(c, i) {
  const bw = barrierOnLine(c.at, i);
  if (bw) { const h = hostileAround(c.at, i); return `No path: ${bw.name.replace('The ', 'the ')} blocks the way${h != null ? `, and the way around crosses hostile ${names[h]}` : ''}.`; }
  return `${c.name} has no path here through your land.`;
}
function provTip(i) {
  if (isWild(i)) return wildTip(wildOf[i]);
  const p = prov[i], fog = fogOf(i), hid = fog === 'unexplored';
  const supply = Math.round(SUPPLY[p.terrain] + p.pop / 50);
  const eat = p.i === cmd.varo.at ? 50 : p.i === redCap ? 4 : 0;
  const rows = [['Owner', ownerName(p.owner)], ['Population', hid ? 'unknown' : fmt(p.pop)], [term('supply', 'Supply') + ' (eaten / given)', hid ? 'unknown' : `${eat} / ${supply}`], [term('unrest', 'Unrest'), hid ? 'unknown' : String(p.unrest)], [term('dominion', 'Dominion'), hid ? 'unknown' : p.dom.n ? `${ownerName(p.dom.n)} ${p.dom.s}` : 'none']];
  if (p.springs.length && !hid) rows.push(['Spring', p.springs.map((c) => MANA[c].name).join(', ')]);
  if (p.well) rows.push([term('wellspring', 'Wellspring'), p.i === ownWell ? (p.claim === 'red' ? 'yours, claimed' : p.claim ? 'claim under way' : 'yours, unclaimed') : 'unclaimed']);
  if (p.owner === null && !hid) rows.push(['Defenders', strengthWord(p.indep)]); if (rlRoadsOf(i).length) rows.push(['Roads', 'to ' + rlRoadsOf(i).join(', ')]); // pass 4 (p65)
  if (fog === 'outofsight' && !rlAsOf(i)) rows.push(['Seen', 'earlier; out of sight now', 'more']); if (rlMemArmies(i)) rows.push(['Last seen here', rlMemArmies(i)]); // pass 4 (p66): fog as memory
  const bw = wildsBordering(i);
  const meaning = [rlAsOf(i) ? `<span class="asof">${rlAsOf(i)}</span>` : '', hid ? (RELIEF() ? 'Unexplored: the land is known; what lives here is not.' : 'Unexplored: not yet painted. Terrain is public; what lives here is unknown.') : '', bw.length ? `Borders ${bw.map((w) => w.name.replace('The ', 'the ')).join(' and ')} (${term('impassable', 'impassable')}).` : ''].filter(Boolean).join(' ');
  const sel = state.sel && state.sel.type === 'cmd' && cmd[state.sel.id].side === 'red' ? cmd[state.sel.id] : null;
  const proj = sel && i !== sel.at ? moveProjection(sel, i) : null;
  // natural §7: the terrain is named on the title line, once, in every mode, fog state, zoom and look: the name, the terrain chip (swatch, glyph, word), then "capital".
  // The value slot keeps the active mode's value; in the Terrain mode that value is the terrain, and the chip is not repeated. (The separate Terrain row is gone.)
  const tmode = state.mode === 'terrain', cap = p.cap ? '<span class="tdot"> · </span>capital' : '', mv = !tmode && state.mode !== 'ownership' && !hid ? rlModeValue(p) : null;
  const title = tmode ? `${p.name}${cap}` : `${p.name}<span class="tdot"> · </span>${terrainChip(p.terrain)}${cap}`;
  return { title, value: tmode ? terrainChip(p.terrain) : mv != null ? `${MODES.find((m) => m[0] === state.mode)[2]} ${mv}` : '', meaning: meaning || null, rows, proj };
}
function wildTip(w) {
  const border = [...new Set(w.cells.flatMap((c) => NB[c]))].filter((x) => !isWild(x));
  return { title: w.name, value: (w.kind === 'peaks' ? 'Peaks' : 'Mere') + ' · Impassable',
    meaning: `A wild is not a province. No one owns, enters, crosses or targets it: movement, retreat, sight, dominion spread and ritual reach all go around it. ${term('impassable', 'Impassable terrain')}.`,
    proj: 'Borders: ' + border.map((b) => `<span class="link" data-go="${b}">${names[b]}</span>`).join(', '),
    foot: '<span>T lock, then click a name</span><span>Ctrl+click Codex</span>' };
}
