
// ------------------------------------------------------------------ pass 4 (natural/pass4/design-final.md §4): fog as memory (owner question 3, default yes)
// An explored province out of sight shows its last-seen state; public things stay current (R6: terrain, ownership, rivers, roads, bridges as structures, regions, Workings,
// the season). Memory is a pure function of the month: lastSeen(i, M) is the latest month <= M in which the viewer saw i, and the snapshot is that month's derived state
// for i (dm0(lastSeen), memoised by month), so scrubbing the time-lapse in any order gives the same picture. Armies are not remembered on the map (no ghost pieces); the
// card names the last army seen there. The mock adds events the viewer cannot see, so the remembered and live looks visibly differ. deriveMonth (p20) is re-bound here.
const RL_MEM = { snaps: new Map(), n: 0, ms: 0, extra: [] }; // extra: review only, live events added by the fog-guard check
const RL_MEM_FIELDS = ['pop', 'unrest', 'dom', 'pd', 'buildings', 'kitOwner', 'fx', 'scar', 'siege', 'pillage', 'claim', 'build', 'indep', 'springs'];
const RL_MEM_OUT = provList.filter((i) => FOG[i] === 'outofsight'); // the explored provinces that can be out of sight (fog never forgets: unexplored land stays as it is)
const RL_MEM_EVENTS = (() => { const rc = RL_MEM_OUT.find((i) => i !== greenCap); // §4.2: Deepmoss's walls rise at M24 and M44 and it grows at M36 (it already has a temple); the other out-of-sight province's walls rise at M28
  return [{ i: greenCap, from: 24, pd: 15 }, { i: greenCap, from: 36, popK: 1.3 }, { i: greenCap, from: 44, pd: 25 }, ...(rc != null ? [{ i: rc, from: 28, pd: 5 }] : [])]; })();
const p4FogAt = (i, M) => (i === greenCap && M >= 60 ? null : FOG[i]); // the sight table by month (fogOf at month M: a besieging army sees Deepmoss from M60)
function rlLastSeen(i, M) { // the latest month <= M in which the viewer saw i (the mock's out-of-sight provinces were seen at Y1 M3, where the game opens); null: never seen
  if (FOG[i] === 'unexplored') return null; for (let m = M; m >= 3; m--) if (!p4FogAt(i, m)) return m; return 3;
}
function rlMemEvents(M) { // the mock's hidden events on the live state (cumulative by month)
  for (const e of [...RL_MEM_EVENTS, ...RL_MEM.extra]) { if (M < e.from) continue; const p = prov[e.i]; if (e.pd != null) p.pd = Math.max(p.pd, e.pd); if (e.popK) p.pop = Math.round((p.pop * e.popK) / 10) * 10; }
}
const rlLive = (M) => { dm0(M); rlMemEvents(M); }; // the live derivation of month M
function rlMemSnap(L) { // the derived state of month L for the remembered provinces, with the armies seen there (memoised; the caller re-derives the live month after)
  let S = RL_MEM.snaps.get(L); if (S) return S; const t0 = performance.now(); rlLive(L); S = new Map();
  for (const i of RL_MEM_OUT) { const p = prov[i], o = {}; for (const k of RL_MEM_FIELDS) o[k] = p[k] == null || typeof p[k] !== 'object' ? p[k] : JSON.parse(JSON.stringify(p[k])); o.armies = Object.values(cmd).filter((c) => c.at === i && !c.hidden && c.side !== VIEWER0 && c.squads.length).map((c) => ({ name: cname(c), troops: c.squads.reduce((n, s) => n + s[1], 0) })); S.set(i, o); }
  RL_MEM.snaps.set(L, S); RL_MEM.n++; RL_MEM.ms += performance.now() - t0; return S;
}
function rlMemApply(M) { // after the live derivation of M: each remembered province drawn from its snapshot (public things stay current)
  const need = new Map(); for (const i of RL_MEM_OUT) { const L = rlLastSeen(i, M); prov[i].memo = null; if (L != null && p4FogAt(i, M)) need.set(i, L); } if (!need.size) return;
  const Ls = [...new Set(need.values())].filter((L) => L !== M && !RL_MEM.snaps.has(L)); if (Ls.length) { for (const L of Ls) rlMemSnap(L); rlLive(M); } // derive the missing snapshots, then the live month again
  for (const [i, L] of need) { const p = prov[i]; if (L !== M) { const o = RL_MEM.snaps.get(L).get(i); for (const k of RL_MEM_FIELDS) p[k] = o[k] == null || typeof o[k] !== 'object' ? o[k] : JSON.parse(JSON.stringify(o[k])); } p.memo = { L, armies: L !== M ? RL_MEM.snaps.get(L).get(i).armies : Object.values(cmd).filter((c) => c.at === i && !c.hidden && c.side !== VIEWER0 && c.squads.length).map((c) => ({ name: cname(c), troops: c.squads.reduce((n, s) => n + s[1], 0) })) }; }
}
const dm0 = deriveMonth;
deriveMonth = function (M) { if (!p4('memory')) { dm0(M); for (const i of RL_MEM_OUT) prov[i].memo = null; return; } rlLive(M); rlMemApply(M); };
const rlAsOf = (i) => { const m = prov[i] && prov[i].memo; return m ? `Out of sight · as of Y${Math.floor((m.L - 1) / 12) + 1} M${((m.L - 1) % 12) + 1}` : null; }; // the card's line (p30b) and the province panel's chip (p80c)
const rlMemArmies = (i) => { const m = prov[i] && prov[i].memo; if (!m || !m.armies.length) return null; const w = `Y${Math.floor((m.L - 1) / 12) + 1} M${((m.L - 1) % 12) + 1}`; return m.armies.map((a) => `${a.name}, ${a.troops} troops, ${w}`).join('; '); };
