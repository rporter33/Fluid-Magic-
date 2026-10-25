# step 2 hooks (seasons): each replacement must match exactly once
import sys
D='/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/parts/'
def rep(f, a, b):
    s=open(D+f).read(); n=s.count(a)
    assert n==1, (f, n, a[:80]); s=s.replace(a,b); open(D+f,'w').write(s)
# p59: the sync and fade, the static sig, blitLook / rlWashSync through rlLkFor, frost
rep('p59-relief-draw.js', "  const now = performance.now(); animating = false;\n", "  const now = performance.now(); animating = false; rlSeasonSync(now); // pass 4 (p58s): the shown season\n")
rep('p59-relief-draw.js', "  worldT(g); blit(rlU);\n", "  worldT(g); blit(rlU); rlSeasonFade(g, blit, now); // pass 4: a season change cross-fades the cached land (600 ms)\n")
rep('p59-relief-draw.js', "RL_NUMBERS.on, RL_NUMBERS.shift, FIGS.ver].join('|');", "RL_NUMBERS.on, RL_NUMBERS.shift, FIGS.ver, rlSeasonKey(), P4S.frost].join('|');")
rep('p59-relief-draw.js', "function rlWashSync(look) {\n  const Lk = RB.L[look];", "function rlWashSync(look) {\n  const Lk = rlLkFor(look);")
rep('p59-relief-draw.js', "const blitLook = (look, a) => { const Lk = RB.L[look];", "const blitLook = (look, a) => { const Lk = rlLkFor(look);")
rep('p59-relief-draw.js', "    rlFarRelief(g, xf < 1 && RL_XF.from ? 0 : decoAlpha); // pass 2: the Far relief on the Natural land (p59c), so the model reads sculpted when zoomed out\n",
    "    rlFarRelief(g, xf < 1 && RL_XF.from ? 0 : decoAlpha); // pass 2: the Far relief on the Natural land (p59c), so the model reads sculpted when zoomed out\n    rlDrawFrost(g, band, RL_XF.to ?? rlShownLook()); // pass 4: the Winter frost review control (p58s; off by default)\n")
# p59b: the line ground through rlLkFor; the line key gains the season
rep('p59b-relief-lines.js', "  const Lk = RB.L[look], src = lvl === 2 ? Lk.mb2", "  const Lk = rlLkFor(look), src = lvl === 2 ? Lk.mb2")
rep('p59b-relief-lines.js', "view.tint && state.mode === 'ownership', dpr < 1.5 ? 1 : 2].join('|')", "view.tint && state.mode === 'ownership', dpr < 1.5 ? 1 : 2, rlSeasonKey()].join('|')")
# p59x: the wild-edge decision reads the shown season's ground
rep('p59x-quiet-edge.js', "  const Lk = RB.L.natural; if (!Lk || !Lk.mb1 || !RB.ms) return null;", "  const Lk = rlLkFor('natural'); if (!Lk || !Lk.mb1 || !RB.ms) return null;")
rep('p59x-quiet-edge.js', "const key = [RB.ver, RB.lookVer, view.tint, sp,", "const key = [RB.ver, RB.lookVer, rlSeasonKey(), view.tint, sp,")
# p61: the seat ground and its key; the numbers layer's Supply
rep('p61-relief-pieces.js', "const look = rlShownLook(), Lk = RB.L[look], lvl = rlMipLevel(); if (!Lk) return RL_ALB[prov[i].terrain];", "const look = rlShownLook(), Lk = rlLkFor(look), lvl = rlMipLevel(); if (!Lk) return RL_ALB[prov[i].terrain];")
rep('p61-relief-pieces.js', "const key = [look, lvl, Math.round(wx0 * 8),", "const key = [look + rlSeasonKey(), lvl, Math.round(wx0 * 8),")
rep('p61-relief-pieces.js', "case 'supply': return Math.round(SUPPLY[p.terrain] + p.pop / 50);", "case 'supply': return Math.round((SUPPLY[p.terrain] + p.pop / 50) * p4SupplyK());")
# p59c: winter crowns x 0.6 at Near
rep('p59c-relief-detail.js', "s.toFixed(5), RB.ver, RB.lookVer].join('|');", "s.toFixed(5), RB.ver, RB.lookVer, rlSeasonKey()].join('|'), CK = p4('seasons') ? RL_SEASON.nearCrown[RL_SEAS.shown] : 1;")
rep('p59c-relief-detail.js', "const a = c0 === 255 ? 0 : wl ? RB.mw.cm[t] : cmar[t],", "const a = (c0 === 255 ? 0 : wl ? RB.mw.cm[t] : cmar[t]) * CK,")
# p60b: the Supply mode takes the season's factor
rep('p60b-modes.js', "case 'supply': return hid ? base : heat((SUPPLY[p.terrain] + p.pop / 50) / 320);", "case 'supply': return hid ? base : heat(((SUPPLY[p.terrain] + p.pop / 50) * p4SupplyK()) / 320); // pass 4: the season's factor (p58s)")
# p80d: the clock's glyph
rep('p80d-rest.js', "function updateTop() {\n", "function updateTop() {\n  rlSeasonClock(); // pass 4 (p58s): the season glyph before the date\n")
# p88: the natural checks read the shown season
rep('p88-natural-checks.js', "function rlNatChroma() {\n  const Lk = RB.L.natural;", "function rlNatChroma(Lk = rlLkFor('natural')) {\n  ")
rep('p88-natural-checks.js', "function rlSnowCheck(look = rlShownLook()) {\n  const Lk = RB.L[look];", "function rlSnowCheck(look = rlShownLook()) {\n  const Lk = rlLkFor(look);")
print('ok')
