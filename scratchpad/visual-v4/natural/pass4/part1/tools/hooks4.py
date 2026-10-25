# step 4 hooks (rivers, bridges, roads, the supply path)
D='/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/'
def rep(f, a, b):
    s=open(D+f).read(); n=s.count(a)
    assert n==1, (f, n, a[:90]); s=s.replace(a,b); open(D+f,'w').write(s)
# p59: the static waters after the streams; live roads under the over layer; the supply path after the arrows
rep('parts/p59-relief-draw.js', "  rlDrawWater(g, px, tmode ? 1 : decoAlpha); // the Terrain mode keeps its water (natural §6)\n", "  rlDrawWater(g, px, tmode ? 1 : decoAlpha); // the Terrain mode keeps its water (natural §6)\n  rlDrawWaters(g, px, band); // pass 4 (p65): roads by exception, the rivers, the bridges\n")
rep('parts/p59-relief-draw.js', "  blit(rlO);\n", "  rlDrawRoadsLive(g, px, [hp, sp]); // pass 4 (p65): the hovered or selected province's own roads, faint\n  blit(rlO);\n")
rep('parts/p59-relief-draw.js', "rlLiveLabels(g, band); }\n", "rlLiveLabels(g, band); }\n  rlDrawSupplyPath(g); // pass 4 (p65): the Supply mode's supply path for the selected army\n")
# p59b: the rails' inset clears the water; a river edge's lines are drawn along its banks (static and the live hover)
rep('parts/p59b-relief-lines.js', "    const p0 = [e0.a[0] + e0.nx * delta, e0.a[1] + e0.ny * delta], d0 = [e0.b[0] - e0.a[0], e0.b[1] - e0.a[1]], p1 = [e1.a[0] + e1.nx * delta, e1.a[1] + e1.ny * delta],",
    "    const r0 = delta + rlRiverInset(i, e0), r1 = delta + rlRiverInset(i, e1), p0 = [e0.a[0] + e0.nx * r0, e0.a[1] + e0.ny * r0], d0 = [e0.b[0] - e0.a[0], e0.b[1] - e0.a[1]], p1 = [e1.a[0] + e1.nx * r1, e1.a[1] + e1.ny * r1], /* pass 4 (p65): a river edge's inset clears the water */")
rep('parts/p59b-relief-lines.js', "Math.hypot(v[0] - e1.a[0], v[1] - e1.a[1]) > 6 * delta)", "Math.hypot(v[0] - e1.a[0], v[1] - e1.a[1]) > 6 * Math.max(r0, r1))")
rep('parts/p59b-relief-lines.js', "  for (const [, e] of EDGE) { // internal keylines and neutral hairlines, once per shared edge\n", "  for (const [, e] of EDGE) { // internal keylines and neutral hairlines, once per shared edge\n    if (rlRiverEdgeLines(g, e, ctx, px, faintOn ? 'rest' : 'floor', sp)) continue; // pass 4 (p65): a river edge's lines run along its banks\n")
rep('parts/p59b-relief-lines.js', "  for (const [, e] of EDGE) { if (e.i !== i && e.j !== i) continue; const kind", "  for (const [, e] of EDGE) { if (e.i !== i && e.j !== i) continue; if (rlRiverEdgeLines(g, e, ctx, px, 'side', i)) continue; const kind")
# p87: the rail check samples the rails where they are drawn (inset clear of the water on a river edge)
rep('parts/p87-relief-checks.js', "const at = (o) => px(sx + e.nx * o, sy + e.ny * o), K1 = at(offs.dark)", "const ri = rlRiverInset(i, e) * cam.s, at = (o) => px(sx + e.nx * (o + ri), sy + e.ny * (o + ri)), K1 = at(offs.dark)")
rep('parts/p87-relief-checks.js', "const gw = toWorld(sx + e.nx * offs.ground, sy + e.ny * offs.ground);", "const gw = toWorld(sx + e.nx * (offs.ground + ri), sy + e.ny * (offs.ground + ri));")
# p59a: a river mouth on the south edge falls down the cliff
rep('parts/p59a-relief-rim.js', "    if (RB.ready) for (const f of RB.water.falls) {", "    if (RB.ready) for (const f of [...RB.water.falls, ...rlRiverFalls()]) { // pass 4 (p65): and river mouths")
rep('parts/p59a-relief-rim.js', "':' + view.table + ':' + nat;", "':' + view.table + ':' + nat + ':' + rlRiverFalls().length;")
# p63: leg days, the bent line, the ford tick and the chip's "· ford +2"
rep('parts/p63-relief-labels.js', "g.strokeStyle = '#1C1A17'; g.lineWidth = 5; g.beginPath(); pts.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); g.strokeStyle = '#F4EEDF'; g.lineWidth = 3; g.stroke(); g.setLineDash([]);",
    "g.strokeStyle = '#1C1A17'; g.lineWidth = 5; g.beginPath(); rlThreadLine(ml, pts).forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); g.strokeStyle = '#F4EEDF'; g.lineWidth = 3; g.stroke(); g.setLineDash([]); ml.path.forEach((v, k) => rlFordTick(g, k ? ml.path[k - 1] : ml.from, v)); /* pass 4 (p65): river legs bend through their ford; a crossing draws a tick */")
rep('parts/p63-relief-labels.js', "    days += DAYS[prov[v].terrain]; const [x, y] = pts[k + 1], last = k === ml.path.length - 1;", "    const v0 = k ? ml.path[k - 1] : ml.from, ford = rlLegCross(v0, v) ? ' · ford +2' : ''; days += legDays(v0, v); const [x, y] = pts[k + 1], last = k === ml.path.length - 1; /* pass 4: leg days (p13), the crossing on the chip */")
rep('parts/p63-relief-labels.js', "const lbl = last ? `${days}d${ml.around ? ' · around ' + ml.around : ''}` : `${days}d`, lines1 = [lbl], lines2 = last && ml.around ? [`${days}d`, `around ${ml.around}`] : null;",
    "const lbl = last ? `${days}d${ford}${ml.around ? ' · around ' + ml.around : ''}` : `${days}d${ford}`, lines1 = [lbl], lines2 = last && ml.around ? [`${days}d${ford}`, `around ${ml.around}`] : null;")
# p30b: the projection's crossing (and supply) note; the province card's roads
rep('parts/p30b-provtip.js', "${prov[i].owner !== 'red' ? ', then fights for it' : ''}.`; }", "${prov[i].owner !== 'red' ? ', then fights for it' : ''}${rlCrossText(c.at, d.path)}.`; }")
rep('parts/p30b-provtip.js', "  if (p.owner === null && !hid) rows.push(['Defenders', strengthWord(p.indep)]);", "  if (p.owner === null && !hid) rows.push(['Defenders', strengthWord(p.indep)]); if (rlRoadsOf(i).length) rows.push(['Roads', 'to ' + rlRoadsOf(i).join(', ')]); // pass 4 (p65)")
# p80d: the toast; a river or a bridge under the pointer opens its card
rep('parts/p80d-rest.js', "toast(`${c.name} marches to ${prov[i].name}: ${d.days} days${bw ? ', around ' + theName(bw) : ''}.`);", "toast(`${c.name} marches to ${prov[i].name}: ${d.days} days${bw ? ', around ' + theName(bw) : ''}${rlCrossText(c.at, d.path)}.`);")
rep('parts/p80d-rest.js', "  const i = provinceAt(x, y);\n  const army = state.sel", "  if (rlWaterHover(x, y, e)) { hideCursorLbl(); return; } // pass 4 (p65): a river or a bridge opens its card\n  const i = provinceAt(x, y);\n  const army = state.sel")
# p62: the half wheat (tight supply) leads the status plaque
rep('parts/p62-relief-figures.js', "const RL_STATUS = (c) => (c.side === 'red' && c.order === 'Pillage'", "const RL_STATUS = (c) => (rlTight(c) ? 'halfWheat' : c.side === 'red' && c.order === 'Pillage'")
rep('parts/p62-relief-figures.js', "    else if (st === 'fire') {", "    else if (st === 'halfWheat') { g.beginPath(); g.moveTo(cx, cy + u); g.lineTo(cx, cy - u); g.stroke(); for (const k of [-0.55, 0, 0.55]) { g.beginPath(); g.ellipse(cx - u * 0.38, cy + k * u, u * 0.3, u * 0.16, -0.6, 0, Math.PI * 2); g.fill(); } g.globalAlpha = 0.35; for (const k of [-0.55, 0, 0.55]) { g.beginPath(); g.ellipse(cx + u * 0.38, cy + k * u, u * 0.3, u * 0.16, 0.6, 0, Math.PI * 2); g.fill(); } g.globalAlpha = 1; } // pass 4: tight supply\n    else if (st === 'fire') {")
s=open(D+'build.sh').read(); a="parts/p63-relief-labels.js parts/p66-memory.js"; assert s.count(a)==1; s=s.replace(a,"parts/p63-relief-labels.js parts/p65-waters.js parts/p66-memory.js"); open(D+'build.sh','w').write(s)
print('ok')
