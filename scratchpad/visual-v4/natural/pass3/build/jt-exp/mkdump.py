V = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass2/verify/tools/'
J = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/judge/tools/'
s = open(V + 'dump.cjs').read()
s = s.replace("const { launch, open, ev, mev, PAGE, OUT } = require('./lib.cjs');", "const { launch, open, ev, mev, PAGES, OUT } = require('./lib.cjs'); const KEY = process.env.KEY; const PAGE = PAGES[KEY];")
start = s.index('const VIEWS = {'); end = s.index('};', start) + 2
views = """const WI = JSON.parse(fs.readFileSync(OUT + 'wildinfo.json', 'utf8')); const C = Object.fromEntries(WI.wilds.map((w) => [w.id, w]));
const at = (k, id) => `m.setScale(m.maxScale() * ${k}, ${C[id].cx}, ${C[id].cy})`;
const VIEWS = { start: null, far: 'm.setScale(m.minScale(), 800, 500)', mid: 'm.setScale(1.0, 640, 480)', ref: 'm.setScale(1.142, 700, 560)', midAsh: `m.setScale(1.0, ${C.ashspine.cx}, ${C.ashspine.cy})`,
  nearAsh: at(0.55, 'ashspine'), nearGrey: at(0.6, 'greyteeth'), nearMere: at(0.6, 'stillmere'), maxAsh: at(1.0, 'ashspine'), maxGrey: at(1.0, 'greyteeth'), maxMere: at(1.0, 'stillmere') };"""
s = s[:start] + views + s[end:]
old = 'const tag = `${process.env.TAGP || ""}${look}-dpr${dpr}-${W}x${H}-${v}`;'
assert old in s; s = s.replace(old, 'const tag = `${KEY}-dpr${dpr}-${v}`;')
s = s.replace("const p = await open(b, process.env.PAGEFILE || PAGE,", "const p = await open(b, PAGE,")
open(J + 'dump.cjs', 'w').write(s)
