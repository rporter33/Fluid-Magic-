const page = await open(960, 540);
return await page.evaluate(() => {
  const G = window.__battle.game; const res = {};
  for (const key of ['a', 'b', 'c']) {
    G.load(key); const S = G.stage.S, T = G.stage.T;
    const rows = [];
    for (const r of S.rounds) for (const p of r.phases) if (p.kind === 'melee') {
      const att = new Map();
      for (const b of p.blows.filter((b) => b.phase === 'melee')) att.set(b.att, (att.get(b.att) || 0) + 1);
      rows.push({ round: r.round, contact: p.engage ? p.engage.contact.map((gi) => S.groups[gi].unit) : null,
        strikersNotInContact: [...att.keys()].filter((gi) => !(p.engage && p.engage.contact.includes(gi))).map((gi) => S.groups[gi].unit + ':' + att.get(gi)) });
    }
    // status 'Waiting' while the group has a strike shown within +-1 s
    const waitingButStriking = [];
    for (const Gq of T.G) {
      const figs = Gq.figs.map((i) => T.F[i]);
      const times = figs.flatMap((f) => f.strikes.map((s) => s.t)).sort((a, b) => a - b);
      for (let t = 0; t < T.duration; t += 0.5) {
        const st = statusAt(T, Gq.idx, t);
        if (st.cls === 'wait' && times.some((x) => Math.abs(x - t) < 0.5)) { waitingButStriking.push([Gq.g.unit, +t.toFixed(1)]); }
      }
    }
    const byUnit = {}; for (const [u, t] of waitingButStriking) (byUnit[u] = byUnit[u] || []).push(t);
    res[key] = { rows, waitingButStriking: Object.fromEntries(Object.entries(byUnit).map(([u, ts]) => [u, ts.length + ' samples, first ' + ts[0]])) };
  }
  return res;
});
