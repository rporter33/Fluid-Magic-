D='/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/'
def rep(f, a, b):
    s=open(D+f).read(); n=s.count(a)
    assert n==1, (f, n, a[:90]); s=s.replace(a,b); open(D+f,'w').write(s)
# a bank line runs one course segment past its edge at both ends, so two edges' lines meet at a joint without a gap
rep('parts/p65-waters.js', "function rlBankLine(g, e, k, side, st, px, fog) { // one bank's keyline along the course, beyond the water by the line's half width\n  const R = rlRiverGeo()[RL_WAT.edge.get(k).r], idx = RL_WAT.edge.get(k).idx,",
    "function rlBankLine(g, e, k, side, st, px, fog) { // one bank's keyline along the course, beyond the water by the line's half width (one course segment past the edge at each end: no gap at a joint)\n  const R = rlRiverGeo()[RL_WAT.edge.get(k).r], i0 = RL_WAT.edge.get(k).idx, idx = [...(i0[0] > 0 ? [i0[0] - 1] : []), ...i0, ...(i0[i0.length - 1] < R.S.length - 1 ? [i0[i0.length - 1] + 1] : [])],")
print('ok')
