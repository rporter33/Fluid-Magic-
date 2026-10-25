D='/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/'
def rep(f, a, b):
    s=open(D+f).read(); n=s.count(a)
    assert n==1, (f, n, a[:90]); s=s.replace(a,b); open(D+f,'w').write(s)
rep('parts/p90b-pass4-checks.js', "if (best < out.min) { out.min = best; out.worst = `${names[side]} bank of ${R.name} (${names[e.i]}/${names[e.j]})`; }",
    "if (best < out.min) { out.min = best; out.worst = `${names[side]} bank of ${R.name} (${names[e.i]}/${names[e.j]})`; out.worstAt = { px: [Math.round(sx), Math.round(sy)], water: wpx, ground: gpx, dE: [+d.normal.toFixed(1), +d.cvd.toFixed(1)], style: rlBankStyle(e, k, side, rlLineCtx()) }; }")
rep('parts/p90b-pass4-checks.js', "let onWater = 0; for (let p = 0; p < mask.length; p++) if (mask[p] && (lw[p * 4] !== nl[p * 4] || lw[p * 4 + 1] !== nl[p * 4 + 1] || lw[p * 4 + 2] !== nl[p * 4 + 2])) onWater++;",
    "let onWater = 0; const owAt = []; for (let p = 0; p < mask.length; p++) if (mask[p] && (lw[p * 4] !== nl[p * 4] || lw[p * 4 + 1] !== nl[p * 4 + 1] || lw[p * 4 + 2] !== nl[p * 4 + 2])) { onWater++; if (owAt.length < 6) { const x = (p % canvas.width) / dpr, y = Math.floor(p / canvas.width) / dpr; owAt.push([Math.round(x), Math.round(y), [lw[p * 4], lw[p * 4 + 1], lw[p * 4 + 2]], [nl[p * 4], nl[p * 4 + 1], nl[p * 4 + 2]]]); } }")
rep('parts/p90b-pass4-checks.js', "linePixelsOnWater: onWater,", "linePixelsOnWater: onWater, onWaterAt: owAt,")
print('ok')
