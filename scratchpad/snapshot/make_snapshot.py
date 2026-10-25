# Copies the scratchpad's keepable work into the art-workspace worktree (originals for generations, WebP for atlases).
import os, re, sys, csv, shutil, hashlib, collections
from PIL import Image
S = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad'
OUT = sys.argv[1]
DST = os.path.join(OUT, 'scratchpad')
U = 'visual-v4/units'
TEXT = {'.md', '.py', '.js', '.mjs', '.cjs', '.ts', '.sh', '.css', '.tsv', '.txt', '.json', '.html', '.csv', '.yaml', '.yml'}
SKIP_DIRS = {'node_modules', '__pycache__', '.git', 'tmp', 'frames-tmp'}
SHOTS = re.compile(r'(^|/)(shots[^/]*|critique-shots|anim-shots|clips[^/]*)(/|$)')
DUMP = re.compile(r'(dpr2\.json$|/colors-[^/]*\.json$|/lines/[^/]*\.json$|/out/[^/]*\.json$)')
ATLAS_DIRS = [f'{U}/stage-b/atlas', f'{U}/stage-c/atlas', f'{U}/stage-d/atlas']
BIN_DIRS = [f'{U}/refs', f'{U}/stage-d/prod/refs', f'{U}/stage-d/prod/guides', f'{U}/stage-d/prod/fixes', f'{U}/stage-d/prod/ashrider']
FORCE = ['visual-v4/battle-mockup.html', 'visual-v4/map/game-screen-v4.html', f'{U}/stage-d/pilot/pilot.html',
         f'{U}/stage-b/integrate/paint-data.json', f'{U}/stage-d/atlas/fx/fx-data.json', f'{U}/stage-d/atlas/fx2/fx2-data.json',
         'visual-v4/battle-data/battles.json', f'{U}/gen-log.tsv']
kept = {}; skipped = collections.Counter(); skipped_n = collections.Counter()

def put(rel, how='copy'):
    src = os.path.join(S, rel)
    if rel in kept or not os.path.isfile(src) or os.path.islink(src): return
    if how == 'webp':
        dst = os.path.join(DST, rel + '.webp'); os.makedirs(os.path.dirname(dst), exist_ok=True)
        im = Image.open(src); im.load()
        im.save(dst, 'WEBP', quality=95, alpha_quality=100, method=4)
        kept[rel] = ('webp', os.path.getsize(src), os.path.getsize(dst))
    else:
        dst = os.path.join(DST, rel); os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(src, dst); kept[rel] = ('copy', os.path.getsize(src), os.path.getsize(src))

# 1. every generated image (originals) and its sidecar, from the generation log
for r in csv.DictReader(open(os.path.join(S, U, 'gen-log.tsv')), delimiter='\t'):
    rel = os.path.normpath(os.path.join(U, r['file']))
    put(rel); side = os.path.splitext(rel)[0] + '.json'; put(side)
# 2. atlases: images as WebP q95 (alpha lossless), metadata as is
for d in ATLAS_DIRS:
    for dp, dn, fn in os.walk(os.path.join(S, d)):
        dn[:] = [x for x in dn if x not in SKIP_DIRS]
        for f in fn:
            rel = os.path.relpath(os.path.join(dp, f), S); e = os.path.splitext(f)[1].lower()
            if e == '.png': put(rel, 'webp')
            elif e in ('.json', '.webp', '.py', '.md', '.txt'): put(rel)
# 3. references and guides used by the re-roll and mesh-weight tools, as is
for d in BIN_DIRS:
    for dp, dn, fn in os.walk(os.path.join(S, d)):
        for f in fn: put(os.path.relpath(os.path.join(dp, f), S))
# 4. forced files (current builds and build inputs)
for rel in FORCE: put(rel)
# 5. every text file: sources, tools, plans, reports, notes, metadata
for dp, dn, fn in os.walk(S):
    dn[:] = [x for x in dn if x not in SKIP_DIRS and not (dp == S and x == 'snapshot-out')]
    for f in fn:
        p = os.path.join(dp, f); rel = os.path.relpath(p, S); e = os.path.splitext(f)[1].lower()
        if rel in kept or os.path.islink(p) or not os.path.isfile(p): continue
        sz = os.path.getsize(p)
        if e not in TEXT: skipped[e or '(none)'] += sz; skipped_n[e or '(none)'] += 1; continue
        lim = 300_000 if e in ('.json', '.html', '.txt', '.tsv', '.csv') else 2_000_000
        if SHOTS.search(rel) or DUMP.search(rel) or sz > lim: skipped['text:dump-or-large'] += sz; skipped_n['text:dump-or-large'] += 1; continue
        put(rel)
# manifest
with open(os.path.join(OUT, 'MANIFEST.tsv'), 'w') as m:
    m.write('path\thow\tsource_bytes\tstored_bytes\n')
    for rel in sorted(kept): how, a, b = kept[rel]; m.write(f'{rel}\t{how}\t{a}\t{b}\n')
with open(os.path.join(OUT, 'SKIPPED.tsv'), 'w') as m:
    m.write('kind\tfiles\tbytes\n')
    for k, v in skipped.most_common(): m.write(f'{k}\t{skipped_n[k]}\t{v}\n')
tot = sum(v[2] for v in kept.values())
print('kept', len(kept), 'files,', round(tot / 1e6, 1), 'MB stored; skipped', round(sum(skipped.values()) / 1e6), 'MB')
