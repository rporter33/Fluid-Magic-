# step 3 hooks (fog as memory)
D='/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/'
def rep(f, a, b):
    s=open(D+f).read(); n=s.count(a)
    assert n==1, (f, n, a[:80]); s=s.replace(a,b); open(D+f,'w').write(s)
rep('parts/p30b-provtip.js', "  if (fog === 'outofsight') rows.push(['Seen', 'earlier; out of sight now', 'more']);", "  if (fog === 'outofsight' && !rlAsOf(i)) rows.push(['Seen', 'earlier; out of sight now', 'more']); if (rlMemArmies(i)) rows.push(['Last seen here', rlMemArmies(i)]); // pass 4 (p66): fog as memory")
rep('parts/p30b-provtip.js', "  const meaning = [hid ? (RELIEF()", "  const meaning = [rlAsOf(i) ? `<span class=\"asof\">${rlAsOf(i)}</span>` : '', hid ? (RELIEF()")
rep('parts/p80c-sel.js', "<div class=\"sub\">${terrainChip(p.terrain)} · ${ownerName}${p.cap ? ' · capital' : ''}</div>", "<div class=\"sub\">${terrainChip(p.terrain)} · ${ownerName}${p.cap ? ' · capital' : ''}${rlAsOf(p.i) ? ` · <span class=\"asof\">${rlAsOf(p.i)}</span>` : ''}</div>")
rep('parts/p80e-start.js', "P4S.on = P4S.base && v === 'relief'; // pass 4 (R1): Painted (v3) never runs pass-4 code", "P4S.on = P4S.base && v === 'relief'; if (P4S.memory && RL_MEM_OUT.length) { deriveMonth(curMonth); refreshKeys(); } // pass 4 (R1): Painted (v3) never runs pass-4 code, and shows live values")
rep('parts/p61-relief-pieces.js', "for (const c of Object.values(cmd)) { if (c.hidden) continue;", "for (const c of Object.values(cmd)) { if (c.hidden || (p4('memory') && c.side !== VIEWER && fogOf(c.at))) continue; // pass 4 (p66): no ghost pieces")
s=open(D+'build.sh').read(); a="parts/p63-relief-labels.js parts/p70-portraits.js"; assert s.count(a)==1; s=s.replace(a,"parts/p63-relief-labels.js parts/p66-memory.js parts/p70-portraits.js"); open(D+'build.sh','w').write(s)
print('ok')
