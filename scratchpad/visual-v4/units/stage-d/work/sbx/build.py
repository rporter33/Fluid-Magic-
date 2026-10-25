# Sandbox copy of visual-v4/build.py for the stage D magic pilot: assembles battle-mockup.html from this folder's
# src/ (page template, modules in order), battle-data/battles.json, the painted figures (paint-data.json, a copy of
# units/stage-b/integrate/paint-data.json) and, new here, the effects atlas (fx-data.json, written by
# units/stage-d/work/tools/fx_bundle.py) in place of /*FX*/.
import json, os, sys
here = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(here, 'src')
mods = sorted(f for f in os.listdir(src) if f.endswith('.js'))
code = '\n'.join(open(os.path.join(src, f)).read() for f in mods)
data = open(os.path.join(here, 'battle-data', 'battles.json')).read()
json.loads(data)
data = data.replace('</', '<\\/')
page = open(os.path.join(src, 'page.html')).read()
paint_path = os.path.join(here, 'paint-data.json')
paint = open(paint_path).read() if os.path.exists(paint_path) else 'null'
json.loads(paint)
paint = paint.replace('</', '<\\/')
fx_path = os.path.join(here, 'fx-data.json')
fx = open(fx_path).read() if os.path.exists(fx_path) else 'null'
json.loads(fx)
fx = fx.replace('</', '<\\/')
page = page.replace('/*DATA*/', data).replace('/*PAINT*/', paint).replace('/*FX*/', fx).replace('/*CODE*/', code)
out = os.path.join(here, sys.argv[1] if len(sys.argv) > 1 else 'battle-mockup.html')
open(out, 'w').write(page)
for bad in ['Math.random', 'Date.now', 'new Date']:
    if bad in code: print('WARNING: found', bad); sys.exit(1)
print(out, len(page), 'bytes;', len(mods), 'modules')
