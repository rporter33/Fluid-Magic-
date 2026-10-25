# Stage C carry-over 1 (zero generations), done in stage D: the Ash Rider front view's scale. The shipped front scale was
# measured to the pennon top (bodyHeightSrc 147 px) instead of hood to hooves (126 px: pack.mounted_height on the kept
# lance-fix frames), so the front rider stood about 14% under the 79/159 px rule and shrank when a block turned or routed.
# Fix: re-pack the ashRider family with cpack.pack_grid on the lance fix's frames (work/creatures/sheets/*, keyed with
# key.py --shafts; picks.json unchanged) and the body measure left to the packer for both views (back: 162 px, which is
# also its shipped value; front: 126 px), instead of lance_fix.py step 3's pin to the shipped values. index.json and
# pack-summary.json updated. The previous files are kept in stage-d/prod/ashrider/pre/. Nothing is re-bundled.
# Usage: python3 -I ashrider_scale.py
import json, os, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__))
UNITS = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
SC = os.path.join(UNITS, 'stage-c')
ATLAS = os.path.join(SC, 'atlas', 'creatures')
TOOLS = os.path.join(SC, 'work', 'creatures', 'sbx', 'tools')
PRE = os.path.join(HERE, '..', 'ashrider', 'pre')
sys.path.insert(0, TOOLS)
os.makedirs(PRE, exist_ok=True)
files = [f for f in os.listdir(ATLAS) if f.startswith('ashRider-')] + ['index.json', 'pack-summary.json']
for f in files:
    shutil.copy(os.path.join(ATLAS, f), os.path.join(PRE, f))
shutil.copy(os.path.join(ATLAS, 'figures', 'ashRider.json'), os.path.join(PRE, 'ashRider.figure.json'))
old = json.load(open(os.path.join(ATLAS, 'figures', 'ashRider.json')))
import cpack  # noqa: E402
picks = json.load(open(os.path.join(SC, 'work', 'creatures', 'picks.json')))['figures']
sp = os.path.join(ATLAS, 'pack-summary.json')
summary = json.load(open(sp))
measured = {}
orig = cpack.frames_of
def frames_of(sdir, fig, view, tier):
    out, info = orig(sdir, fig, view, tier)
    measured[f'{view}.{tier}'] = dict(info, scaleShipped=old['views'][view]['atlas'][tier]['scale'],
                                      bodyHeightSrcShipped=old['views'][view]['atlas'][tier].get('bodyHeightSrc'))
    return out, info
cpack.frames_of = frames_of
cpack.pack_grid('ashRider', ['ashRider'], picks, summary)
summary['_bytesPng'] = sum(os.path.getsize(os.path.join(ATLAS, f)) for f in os.listdir(ATLAS) if f.endswith('.png'))
json.dump(summary, open(sp, 'w'), indent=1)
cpack.write_index()
rec = dict(source='stage-c/carry-over.md item 1 (Ash Rider front scale), done in stage D rest, 2026-10-25', generations=0, measured=measured,
           files=sorted(files + ['figures/ashRider.json']), backups=os.path.relpath(PRE, UNITS), rebundled=False)
json.dump(rec, open(os.path.join(HERE, '..', 'ashrider', 'record.json'), 'w'), indent=1)
print(json.dumps(measured, indent=1))
