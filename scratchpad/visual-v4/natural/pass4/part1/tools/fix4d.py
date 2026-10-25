D='/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/'
def rep(f, a, b):
    s=open(D+f).read(); n=s.count(a)
    assert n==1, (f, n, a[:90]); s=s.replace(a,b); open(D+f,'w').write(s)
# the course may run against the edge's a -> b: the bank's side is taken along the course's own direction
rep('parts/p65-waters.js', "const idx = own.map((kk, q) => (kk === k ? q : -1)).filter((q) => q >= 0), e = EDGE.get(k); EG.set(k, { r: G.length - 1, idx });",
    "const idx = own.map((kk, q) => (kk === k ? q : -1)).filter((q) => q >= 0), e = EDGE.get(k), s0 = S[idx[0]], s1 = S[idx[idx.length - 1]], dir = idx.length > 1 && (s1[0] - s0[0]) * (e.b[0] - e.a[0]) + (s1[1] - s0[1]) * (e.b[1] - e.a[1]) < 0 ? -1 : 1; EG.set(k, { r: G.length - 1, idx, dir });")
rep('parts/p65-waters.js', "const rlBankSign = (e, side) => { const cx = cent[side][0], cy = cent[side][1], ex = e.b[0] - e.a[0], ey = e.b[1] - e.a[1]; return (cx - e.a[0]) * -ey + (cy - e.a[1]) * ex > 0 ? 1 : -1; }; // +1: side lies on the left normal (-ey, ex) of a -> b",
    "const rlBankSign = (e, side) => { const cx = cent[side][0], cy = cent[side][1], ex = e.b[0] - e.a[0], ey = e.b[1] - e.a[1], ent = RL_WAT.edge && RL_WAT.edge.get(ekey(e.i, e.j)); return ((cx - e.a[0]) * -ey + (cy - e.a[1]) * ex > 0 ? 1 : -1) * (ent ? ent.dir : 1); }; // +1: side lies on the left normal of the course's own direction along the edge")
# the scan counts a line pixel on the water only where it shows (a channel moved by 3 or more; the erase leaves 1-unit antialiasing)
rep('parts/p90b-pass4-checks.js', "if (mask[p] && (lw[p * 4] !== nl[p * 4] || lw[p * 4 + 1] !== nl[p * 4 + 1] || lw[p * 4 + 2] !== nl[p * 4 + 2])) {", "if (mask[p] && Math.max(Math.abs(lw[p * 4] - nl[p * 4]), Math.abs(lw[p * 4 + 1] - nl[p * 4 + 1]), Math.abs(lw[p * 4 + 2] - nl[p * 4 + 2])) >= 3) {")
print('ok')
