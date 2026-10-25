# Builds the shareable art gallery page from items.json (extract.py).
import json, re, html, os
G = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/gallery'
A = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-d/atlas/actions/figures'
items = json.load(open(f'{G}/items.json'))
esc = lambda s: html.escape(s, quote=True)
for i in items:
    if i['sec'] == 'troops':
        i['subj'] = re.split(r' (?:from behind|from the front|card)\b', i['subj'])[0]
SECTIONS = [
    ('gods', 'Gods', 'Every pretender god: the approved portrait beside its figure standing in battle, from the front and from behind. Thornwood’s shared gods are colour versions of the same paintings.'),
    ('creatures', 'Creatures and mounts', 'Summoned creatures, mounted troops and the big creatures, each beside its approved portrait.'),
    ('actions', 'Action poses', 'New in stage D: what each big creature and god does in battle. Each strip is one view at the same scale. The idle pose is shown with its portrait above.'),
    ('magic', 'Magic', 'The approved magic pilot: Fireball and Entangle, beat by beat, as they play in the battle mockup.'),
    ('troops', 'Troops', 'Every foot troop type of both nations: standing from behind and from the front, its card, and all its poses.'),
    ('commanders', 'Commanders', 'Every commander face: the leader’s portrait and the figure painted to match it, from the front, from behind and in its rally or cast pose.'),
]
def held_note(fig_json, view):
    try: held = json.load(open(fig_json)).get('heldBack') or {}
    except Exception: return ''
    rows = []
    for k, v in held.items():
        parts = k.split('.')
        if len(parts) >= 3 and parts[-2] == view:
            why = v.get('reason') if isinstance(v, dict) else str(v)
            rows.append(f'{parts[-1]}' + (f' ({why})' if why else ''))
    return ('Held back, drawn by code for now: ' + '; '.join(rows) + '.') if rows else ''
FIGS = {}
for f in os.listdir(A):
    if f.endswith('.json') and not f.endswith('.weights.json'): FIGS[f[:-5]] = os.path.join(A, f)
out = []; nav = []; n_img = 0
for key, title, blurb in SECTIONS:
    xs = [i for i in items if i['sec'] == key]
    if not xs: continue
    nav.append(f'<a href="#{key}">{esc(title)}</a>')
    out.append(f'<section id="{key}" aria-labelledby="h-{key}"><header class="sh"><h2 id="h-{key}">{esc(title)}</h2><p>{esc(blurb)}</p></header>')
    groups = []
    for i in xs:
        if not groups or groups[-1][0] != i['group']: groups.append((i['group'], []))
        groups[-1][1].append(i)
    for gname, gi in groups:
        if gname and key != 'actions': out.append(f'<h3>{esc(gname)}</h3>')
        subs = []
        for i in gi:
            if not subs or subs[-1][0] != i['subj']: subs.append((i['subj'], []))
            subs[-1][1].append(i)
        out.append(f'<div class="grid {"wide" if key in ("actions", "magic") else ""}">')
        for sname, si in subs:
            wide = key == 'actions' or any(i['w'] > 700 for i in si)
            figs = []
            for i in si:
                n_img += 1
                src = i['src']; w, h = i['w'] or 200, i['h'] or 200
                cls = 'fig'
                if 'portrait' in i['cap'] or (w == h and w >= 100): cls = 'por'
                if key == 'actions': cls = 'strip'
                cap = i['cap'][:1].upper() + i['cap'][1:] if i['cap'] else ''
                alt = f'{sname}, {i["cap"]}' if i['cap'] else sname
                extra = ''
                if key == 'actions':
                    fig = os.path.basename(src)[4:-5].rsplit('-', 1)[0]
                    view = os.path.basename(src)[4:-5].rsplit('-', 1)[1]
                    note = held_note(FIGS.get(fig, ''), view)
                    if note: extra = f'<span class="held">{esc(note)}</span>'
                figs.append(f'<figure class="{cls}"><button type="button" class="zoom" aria-label="Enlarge: {esc(alt)}">'
                            f'<img src="{src}" alt="{esc(alt)}" width="{w}" height="{h}" loading="lazy" decoding="async"></button>'
                            f'<figcaption>{esc(cap)}{extra}</figcaption></figure>')
            out.append(f'<article class="card{" span" if wide else ""}"><h4>{esc(sname)}</h4><div class="row">{"".join(figs)}</div></article>')
        out.append('</div>')
    out.append('</section>')
cnt = lambda k: len({(i['group'], i['subj']) for i in items if i['sec'] == k})
n_act = sum(1 for i in items if i['sec'] == 'actions')
PAGES = [('Battle mockup', 'The three painted battles, playing, with the approved magic.', 'https://claude.ai/artifact/9N3xAjDepZNfKB4KnrPs4D'),
         ('Game-screen map', 'The campaign map in its natural landscape look.', 'https://claude.ai/artifact/J9d2JrQYGEhYyfbZyq3uAV'),
         ('Magic pilot', 'Fireball and Entangle slowed down, frame by frame, with the storyboards.', 'https://claude.ai/artifact/47Psan2xdhkNw8CUZAbY4r'),
         ('Lineup by size', 'Every creature and god side by side on the field, to scale.', 'https://claude.ai/artifact/L5rNYaE838n8aTfNd9TjTU'),
         ('Troops and portraits review', 'Stage B as reviewed, with both portrait candidates.', 'https://claude.ai/artifact/5prV7k1rd8GbmDvcBmgnjb'),
         ('Standing in the game review', 'Stage C as reviewed.', 'https://claude.ai/artifact/UsNsy2gbBS7uiA6VA1YaXi')]
nav.append('<a href="#pages">Live pages</a>')
pages = ''.join(f'<li><a href="{u}" target="_blank" rel="noopener">{esc(t)}</a><span>{esc(d)}</span></li>' for t, d, u in PAGES)
css = open(f'{G}/page.css').read(); js = open(f'{G}/page.js').read()
doc = f'''<title>Fluid Magic Art</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alegreya+SC:wght@500;700&family=Alegreya+Sans:wght@400;500;700&display=swap">
<style>{css}</style>
<div class="wrap">
<header class="top"><p class="eyebrow">Fluid Magic · painted art · October 2026</p><h1>The painted armies</h1>
<p class="lede">Every piece of art the owner has approved so far, in one place: {cnt("gods")} gods, {cnt("creatures")} creatures and mounts,
{n_act} action strips, the magic pilot, the troops of both nations and {cnt("commanders")} commander faces. Tap any picture to see it larger.</p></header>
<nav class="chips" aria-label="Sections">{"".join(nav)}</nav>
<main>{"".join(out)}
<section id="pages" aria-labelledby="h-pages"><header class="sh"><h2 id="h-pages">Live pages</h2><p>The same art moving, in the mockups and the review pages it was approved on.</p></header><ul class="pages">{pages}</ul></section>
</main>
<footer class="foot">Painted for Fluid Magic in stages A to D (October 2026). Pictures marked “held back” are frames still to be redrawn; the game draws them by code until then.</footer>
</div>
<div class="lb" id="lb" hidden role="dialog" aria-modal="true" aria-label="Enlarged picture"><div class="lb-bar"><span id="lb-cap"></span>
<span class="lb-ctl"><button type="button" id="lb-prev" aria-label="Previous picture">‹</button><button type="button" id="lb-next" aria-label="Next picture">›</button><button type="button" id="lb-close" aria-label="Close">✕</button></span></div>
<div class="lb-stage" id="lb-stage"><img id="lb-img" alt=""></div></div>
<script>{js}</script>'''
open(f'{G}/index.html', 'w').write(doc)
print('images', n_img, 'page MB', round(len(doc) / 1e6, 2))
