# Builds a variant of the mockup page with a palette hook inside its IIFE, without editing the mockup parts.
# The hook (window.__pal) swaps the terrain fills, the PAINT table and three paint functions between v3 and the
# proposed painted recipe, so the same page renders the A/B. Usage: python3 -I gen-hook.py <parts dir> <out html>
import re, sys, os
parts, out = sys.argv[1], sys.argv[2]

def func_src(text, name):
    m = re.search(r'\nfunction ' + re.escape(name) + r'\(', text)
    assert m, name
    i = text.index('{', m.end())
    depth, k = 0, i
    while True:
        c = text[k]
        if c == '{': depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0: break
        k += 1
    return text[m.start() + 1:k + 1]

def rep(src, a, b, count=1):
    n = src.count(a)
    assert n == count, (a, n)
    return src.replace(a, b)

p55 = open(os.path.join(parts, 'p55-paint.js')).read()
pg = func_src(p55, 'paintGround')
gp = func_src(p55, 'groundP')
pt = func_src(p55, 'paperTile')

# ---- paintGround: every strength from PC (the proposal's config)
pg = rep(pg, "g.globalAlpha = 0.5; g.fillStyle = worldPattern(g, paperTile(), band)", "g.globalAlpha = PC.paper.alpha[p.terrain]; g.fillStyle = worldPattern(g, paperTile(), band)")
pg = rep(pg, "n = Math.max(2, Math.round((6 * areaOf[i]) / MEAN_AREA))", "n = Math.max(PC.mottle.nMin, Math.round((PC.mottle.n * areaOf[i]) / MEAN_AREA))")
pg = rep(pg, "const r = (0.1 + 0.08 * R()) * D, a = pick(0), b = pick(0);\n    if (!a || !b || inBoxes(zs, a[0], a[1], r / 2) || inBoxes(zs, b[0], b[1], r / 2)) continue;",
         "const r = (PC.mottle.r0 + PC.mottle.r1 * R()) * D, clear = (m) => { for (let t = 0; t < PC.mottle.tries; t++) { const q = pick(0); if (q && !inBoxes(PC.mottle.zones === 'none' ? [] : PC.mottle.zones === 'token' ? [zs[2], zs[6]] : zs, q[0], q[1], m)) return q; } return null; }, a = clear(r * PC.mottle.keep), b = clear(r * PC.mottle.keep);\n    if (!a || !b) continue; PAL_STATS.pairs++;")
pg = rep(pg, "g.fillStyle = rgbaOf(shadeL(f, 4), 0.35); g.fill(); g.strokeStyle = rgbaOf(shadeL(f, -9), 0.3); g.lineWidth = 1.2 * PX;",
         "g.fillStyle = rgbaOf(shadeL(f, PC.bloom.dl), PC.bloom.a); g.fill(); g.strokeStyle = rgbaOf(shadeL(f, PC.bloom.rimDL), PC.bloom.rimA); g.lineWidth = PC.bloom.lw * PX;")
pg = rep(pg, "rg.addColorStop(0, rgbaOf(col, 0.55)); rg.addColorStop(1, rgbaOf(col, 0));", "rg.addColorStop(0, rgbaOf(col, 0.55)); rg.addColorStop(PC.mottle.plateau, rgbaOf(col, 0.5)); rg.addColorStop(1, rgbaOf(col, 0));")
pg = rep(pg, "r = (1 + 0.6 * nAt(d)) * 3 * PX", "r = (1 + 0.6 * nAt(d)) * PC.pool.rim * PX")
pg = rep(pg, "const blur = { far: 5, mid: 11, near: 14 }[band]", "const blur = PC.pool.blur[band]")
pg = rep(pg, "g.shadowColor = rgbaOf(shadeL(f, -28), 0.45)", "g.shadowColor = rgbaOf(shadeL(f, PC.pool.dl), PC.pool.a)")
pg = rep(pg, "g.strokeStyle = rgbaOf(shadeL(f, -14), 0.35); g.lineWidth = (owned ? 2 * B_U : 0) + 4.4 * PX;", "g.strokeStyle = rgbaOf(shadeL(f, PC.line.dl), PC.line.a); g.lineWidth = (owned ? 2 * B_U : 0) + 4.4 * PX;")
pg = pg.replace('function paintGround(', 'function (', 1)

# ---- groundP: every texture color is a lightness step of the fill (no hard-coded hue comes back on muted land)
gp = rep(gp, "g.fillStyle = rgba(shadeL(f, R() < 0.5 ? -8 : 8), 0.55)", "g.fillStyle = rgba(shadeL(f, R() < 0.5 ? -PC.g.stipple : PC.g.stipple), 0.55)")
gp = rep(gp, "dotLine(g, P, 3.5 * U, 1.2 * U, 'rgba(94,112,70,.6)')", "dotLine(g, P, 3.5 * U, 1.2 * U, rgba(shadeL(f, PC.g.hedge), 0.6))")
gp = rep(gp, "g.fillStyle = shadeL(f, (R() - 0.5) * 10)", "g.fillStyle = shadeL(f, (R() - 0.5) * PC.g.field)")
gp = rep(gp, "g.strokeStyle = rgba(shadeL(f, -12), 0.35); g.lineWidth = 0.9;", "g.strokeStyle = rgba(shadeL(f, PC.g.furrowDL), PC.g.furrowA); g.lineWidth = 0.9;")
gp = rep(gp, "g.strokeStyle = 'rgba(78,90,46,.35)'", "g.strokeStyle = rgba(shadeL(f, PC.g.farmHedge), 0.35)")
gp = rep(gp, "dotLine(g, P, 3 * U, 0.7 * U, 'rgba(78,90,46,.6)')", "dotLine(g, P, 3 * U, 0.7 * U, rgba(shadeL(f, PC.g.farmHedge), 0.6))")
gp = rep(gp, "g.strokeStyle = R() < 0.55 ? 'rgba(42,58,33,.4)' : 'rgba(75,99,57,.3)'", "g.strokeStyle = R() < 0.55 ? rgba(shadeL(f, -PC.g.scallop), 0.45) : rgba(shadeL(f, PC.g.scallop), 0.35)")
gp = rep(gp, "g.fillStyle = 'rgba(110,127,134,.4)'", "g.fillStyle = rgba(shadeL(f, PC.g.scree), 0.45)")
gp = rep(gp, "g.strokeStyle = 'rgba(44,140,148,.6)'", "g.strokeStyle = rgba(shadeL(f, PC.g.swampLine), 0.6)")
gp = rep(gp, "g.fillStyle = 'rgba(44,140,148,.45)'", "g.fillStyle = rgba(shadeL(f, PC.g.swampPool), 0.5)")
gp = rep(gp, "g.strokeStyle = 'rgba(159,208,212,.7)'", "g.strokeStyle = rgba(shadeL(f, PC.g.ripple), 0.7)")
gp = rep(gp, "g.strokeStyle = 'rgba(143,110,100,.45)'", "g.strokeStyle = rgba(shadeL(f, PC.g.crack), PC.g.crackA)")
gp = rep(gp, "g.strokeStyle = 'rgba(78,90,46,.45)'", "g.strokeStyle = rgba(shadeL(f, PC.g.farmHedge), 0.45)")
gp = gp.replace('function groundP(', 'function (', 1)

# ---- paperTile: amplitudes from PC; its own cache so v3's tile is kept
pt = rep(pt, "if (PAPER) return PAPER;", "if (PAL_PAPER) return PAL_PAPER;")
pt = rep(pt, "fine = vnoiseTile(S, R, 170, 12), coarse = vnoiseTile(S, R, 6, 8)", "fine = vnoiseTile(S, R, 170, PC.paper.fine), coarse = vnoiseTile(S, R, 6, PC.paper.coarse)")
pt = rep(pt, "PAPER = c; return c;", "PAL_PAPER = c; return c;")
pt = pt.replace('function paperTile(', 'function (', 1)

hook = f"""
// ------------------------------------------------------------------ palette-ab (texture angle) hook: NOT a mockup part. Built into a variant page only.
let PC = null, PAL_PAPER = null; const PAL_STATS = {{ pairs: 0 }};
const PAL_V3 = {{ fills: Object.fromEntries(Object.entries(TERRAIN).map(([t, d]) => [t, d.fill])), paint: JSON.parse(JSON.stringify(PAINT)), fns: {{ paintGround, groundP, paperTile }} }};
const PAL_PG = {pg};
const PAL_GP = {gp};
const PAL_PT = {pt};
window.__pal = {{
  apply(cfg) {{
    PC = cfg || null; PAL_PAPER = null;
    for (const t of Object.keys(TERRAIN)) TERRAIN[t].fill = cfg ? cfg.fills[t] : PAL_V3.fills[t];
    for (const t of Object.keys(PAINT)) {{ for (const k of Object.keys(PAINT[t])) delete PAINT[t][k]; Object.assign(PAINT[t], JSON.parse(JSON.stringify(PAL_V3.paint[t])), cfg ? cfg.paint[t] : {{}}); }}
    paintGround = cfg ? PAL_PG : PAL_V3.fns.paintGround; groundP = cfg ? PAL_GP : PAL_V3.fns.groundP; paperTile = cfg ? PAL_PT : PAL_V3.fns.paperTile;
    FILLMEMO.clear(); FACEMEMO.clear(); GREYMEMO.clear(); CLOTHB = null; resetGeometryCaches(false);
    return {{ fills: Object.fromEntries(Object.entries(TERRAIN).map(([t, d]) => [t, d.fill])), paint: PAINT, modeBase: MODE_BASE }};
  }},
  info() {{ return {{ s: cam.s, x: cam.x, y: cam.y, band: bandOf(cam.s), MED_DIAM, U, fit: fitScale, dpr, cw, ch, view: viewRect() }}; }},
  setCam(s, cx, cy) {{ const v = viewRect(); cam.s = s; cam.x = (v.l + v.r) / 2 - cx * s; cam.y = (v.t + v.b) / 2 - cy * s; clampCam(); requestDraw(); return this.info(); }},
  fit() {{ fit(); requestDraw(); return this.info(); }},
  provs() {{ const r = canvas.getBoundingClientRect(), T = (x, y) => {{ const q = toScreen(x, y); return [q[0] + r.left, q[1] + r.top]; }}; return provs.map((p) => ({{ i: p.i, name: names[p.i], terrain: p.terrain, owner: p.owner, fog: fogOf(p.i), cap: !!p.cap, poly: npoly[p.i].map(([x, y]) => T(x, y)), c: T(...cent[p.i]) }})); }},
  wilds() {{ const r = canvas.getBoundingClientRect(); return WILDS.map((w) => ({{ id: w.id, kind: w.kind, polys: w.cells.map((c) => npoly[c].map(([x, y]) => {{ const q = toScreen(x, y); return [q[0] + r.left, q[1] + r.top]; }})) }})); }},
  skip(list, on) {{ for (const k of list) on ? SKIP.add(k) : SKIP.delete(k); invalidateBakes(); requestDraw(); }},
  redraw() {{ requestDraw(); }},
  stats() {{ return PAL_STATS; }},
  bakeStats(i, band, opt) {{ // bake one province (paint only by default) and return L* mean and SD inside its polygon
    const G = geo(i), bb = [G.bb[0] - 2, G.bb[1] - 2, G.bb[2] + 2, G.bb[3] + 2], res = BAND_RES[band];
    const B = bakeWorld(bb, res, (g) => drawProvinceDeco(g, i, band, opt || {{ paintOnly: true }})), c = B.canvas, w = c.width, h = c.height;
    const m = makeCanvas(w, h), mg = m.getContext('2d'); mg.setTransform(res, 0, 0, res, -bb[0] * res, -bb[1] * res); pathPoly(mg, G.poly); mg.fillStyle = '#000'; mg.fill();
    const rd = makeCanvas(w, h), rg = rd.getContext('2d'); rg.drawImage(c, 0, 0);
    const md = mg.getImageData(0, 0, w, h).data, d = rg.getImageData(0, 0, w, h).data; let n = 0, s1 = 0, s2 = 0; const Ls = [];
    for (let k = 0; k < w * h; k++) {{ if (md[k * 4 + 3] < 255) continue; const L = rgb2lab([d[k * 4], d[k * 4 + 1], d[k * 4 + 2]])[0]; n++; s1 += L; s2 += L * L; Ls.push(L); }}
    Ls.sort((a, b) => a - b); const fL = rgb2lab(hex2rgb(TERRAIN[terr[i]].fill))[0];
    return {{ n, mean: s1 / n, sd: Math.sqrt(s2 / n - (s1 / n) ** 2), p01: Ls[Math.floor(n * 0.01)] - fL, p05: Ls[Math.floor(n * 0.05)] - fL, p99: Ls[Math.floor(n * 0.99)] - fL, w, h }};
  }},
  zoneCover() {{ // the share of each province covered by the union of its fixed zones (sampled on a grid)
    return provs.map((p) => {{ const G = geo(p.i), zs = zonesAll(p.i); let n = 0, k = 0; for (let x = G.bb[0]; x < G.bb[2]; x += 3) for (let y = G.bb[1]; y < G.bb[3]; y += 3) {{ if (!inPoly(G.poly, x, y)) continue; n++; if (inBoxes(zs, x, y, 0)) k++; }} return {{ i: p.i, terrain: p.terrain, cover: k / n }}; }});
  }},
  provsOf(t) {{ return provs.filter((p) => p.terrain === t).map((p) => p.i); }},
  pending() {{ return !!(CK && CK.pending) || bakesPending; }},
  mode(m) {{ setMode(m); }},
}};
"""
build = open(os.path.join(os.path.dirname(parts.rstrip('/')), 'build.sh')).read()
order = re.findall(r'parts/(p[\w-]+\.(?:html|css|js))', build)
html = []
for f in order:
    t = open(os.path.join(parts, f)).read()
    if f == 'p00a-head.html':
        html.append(t)
        css = open(os.path.join(parts, 'orig-css.txt')).read().split('\n')
        html.append('\n'.join(css[1:264]) + '\n')  # sed -n '2,264p'
        continue
    if f == 'p99-end.html':
        html.append(hook)
    html.append(t)
open(out, 'w').write(''.join(html))
print('wrote', out, sum(len(x) for x in html), 'bytes; parts', len(order))
