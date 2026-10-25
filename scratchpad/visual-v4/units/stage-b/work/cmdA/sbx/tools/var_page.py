# Builds ../../page/variation.html: the troop-variation prototype (var_scene.js) with its data (cal_var_build.py) inline.
# Pixi comes from the CDN (pixi.js@8.22.0); the shoot script routes it to the repo's copy.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
CAL = os.path.abspath(os.path.join(HERE, '..', '..'))
data = open(os.path.join(CAL, 'page', 'var-data.json')).read().replace('</', '<\\/')
js = open(os.path.join(HERE, 'var_scene.js')).read()
html = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Troop variation prototype</title>
<style>:root{{--bg:#1C1A17;--fg:#F3EEE4}} body{{margin:0;background:var(--bg);color:var(--fg);font:14px sans-serif}}
#stage canvas{{display:block;max-width:100%;height:auto}}</style>
<script src="https://cdn.jsdelivr.net/npm/pixi.js@8.22.0/dist/pixi.min.js"></script></head>
<body><div id="stage"></div>
<script id="var-data" type="application/json">{data}</script>
<script>{js}</script></body></html>'''
out = os.path.join(CAL, 'page', 'variation.html')
open(out, 'w').write(html)
print(out, len(html))
