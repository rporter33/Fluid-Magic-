# Assembles battle-mockup.html: the page template, the modules in order, and the battle JSON.
import json, os, re, sys
here = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(here, 'src')
mods = sorted(f for f in os.listdir(src) if f.endswith('.js'))
code = '\n'.join(open(os.path.join(src, f)).read() for f in mods)
data = open(os.path.join(here, 'battle-data', 'battles.json')).read()
json.loads(data)
data = data.replace('</', '<\\/')
page = open(os.path.join(src, 'page.html')).read()
page = page.replace('/*DATA*/', data).replace('/*CODE*/', code)
out = os.path.join(here, 'battle-mockup.html')
open(out, 'w').write(page)
for bad in ['Math.random', 'Date.now', 'new Date']:
    if bad in code: print('WARNING: found', bad); sys.exit(1)
print(out, len(page), 'bytes;', len(mods), 'modules')
