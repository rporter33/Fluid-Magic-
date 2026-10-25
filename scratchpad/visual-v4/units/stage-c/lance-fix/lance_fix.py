# Stage C lance fix (the owner's stage C verdict, 2026-10-24): the Ash Rider's lance and the Wolf Rider front's spear
# shown whole. Cause (per view and pose cell, see record.json and shots/lance/): our keyer, not the painting. Every
# shaft is painted whole and inside its cell, but cast through with the key (dark green on the Ash Rider's green
# sheets, navy on the Wolf Rider front's blue one), so the keyer made it part-transparent, its 1 px erosion took the
# rest and the slicer dropped the remains as specks; the pennon and the tip were left floating. Slicing, cell crops,
# ground anchors, the fringe passes, the packer and the bundle cut nothing. The fix is in code, at no generation cost:
#   1. the creature pipeline (cgrid.run: key, slice, rim fix, hue lock, checks) re-run on the affected sheets with the
#      keyer's new --shafts (key.py section 7: thin key-cast shafts found by shape and kept whole), into their own sheet
#      dirs: ashRider.front.cfix.r2, ashRider.back.fill, wolfRider.front.harness and wolfRider.front.kept (the page's
#      alternate front); the Wolf Rider back (wolfRider.back.paint.r2) has no key-cast shaft and is left as it is, as is
#      ashRider.back.paint (it only lends the back view its dropped frame: two swords). Each frame keeps its shipped
#      ground anchor in sheet px (a restored lance tip below the hooves must not move the figure);
#   2. cpost.py for the two figures (keycast, edge passes, the Wolf Rider front's cloth relock and coat match), its
#      picks.json merged into the shipped one (every other figure's entry kept as it was);
#   3. cpack.py for the two families with each view's shipped scale pinned (bodyHeightSrc per tier: a longer lance must
#      not shrink or grow the rider); index.json and pack-summary.json updated;
#   4. record.json beside this file (shafts kept per sheet, anchors, scale, gates before and after).
# Usage: python3 lance_fix.py            (writes the stage C files; backups in ../pre-lance/)
#        python3 lance_fix.py --dry DIR  (step 1 only, into DIR/<job>/, nothing shipped is touched)
import json, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SC = os.path.abspath(os.path.join(HERE, '..'))
CW = os.path.join(SC, 'work', 'creatures')
TOOLS = os.path.join(CW, 'sbx', 'tools')
PRE = os.path.join(SC, 'pre-lance', 'units', 'stage-c')
ATLAS = os.path.join(SC, 'atlas', 'creatures')
UNITS = os.path.abspath(os.path.join(SC, '..'))
FIGS = ('ashRider', 'wolfRider')
JOBS = [  # (job, raw sheet, figure, view)
    ('ashRider.front.cfix.r2', os.path.join(SC, 'raw', 'creatures', 'ashRider.front.cfix.r2.nb21.png'), 'ashRider', 'front'),
    ('ashRider.back.fill', os.path.join(SC, 'raw', 'creatures', 'ashRider.back.fill.nb21.png'), 'ashRider', 'back'),
    ('wolfRider.front.harness', os.path.join(SC, 'raw', 'creatures', 'wolfRider.front.harness.nb21.png'), 'wolfRider', 'front'),
    ('wolfRider.front.kept', os.path.join(UNITS, 'pilot', 'raw', 'ad', 'wr.front.blue.g3pro.png'), 'wolfRider', 'front'),
]
sys.path.insert(0, TOOLS)


def carry_anchors(fdir, fig, view, job):
    """The slicer's frames keep their shipped ground anchor: old (box origin + anchor) in sheet px, re-expressed in the
    new box; and a frame the shipped run had missing stays missing (the fix adds no frame: the Ash Rider back fill
    sheet's empty dropped cell would otherwise take the restored tip of the deadB lance that reaches into its window).
    Returns {frame: {shipped, slicer, carried, sheetShift}} for frames whose ground point the slicer moved."""
    mp = os.path.join(fdir, f'{fig}.{view}.json')
    meta = json.load(open(mp))
    sd = os.path.join(PRE, 'work', 'creatures', 'sheets', job)
    old = {f['name']: f for f in json.load(open(os.path.join(sd, 'frames0', f'{fig}.{view}.json')))['frames'] if not f.get('missing')}
    gone = set(json.load(open(os.path.join(sd, 'frames', f'{fig}.{view}.json')))['missing'])
    for f in meta['frames']:
        if f['name'] in gone and not f.get('missing'):
            f['missing'] = True
            f['missingFrom'] = 'missing in the shipped run (stage C lance fix: no frame added)'
    meta['missing'] = sorted(set(meta['missing']) | gone)
    moved = {}
    for f in meta['frames']:
        o = old.get(f['name'])
        if f.get('missing') or not o:
            continue
        sx, sy = o['box'][0] + o['anchor'][0], o['box'][1] + o['anchor'][1]
        new = [round(sx - f['box'][0], 1), round(sy - f['box'][1], 1)]
        if new != f['anchor']:
            moved[f['name']] = dict(shipped=o['anchor'], slicer=f['anchor'], carried=new,
                                    sheetShift=[round(f['box'][0] + f['anchor'][0] - sx, 1), round(f['box'][1] + f['anchor'][1] - sy, 1)])
            f['anchorSlicer'] = f['anchor']
            f['anchor'] = new
            f['anchorFrom'] = 'the shipped frame\'s ground point in sheet px (stage C lance fix)'
    json.dump(meta, open(mp, 'w'), indent=1)
    return moved


def step1(out_root=None):
    import cgrid  # noqa: E402  (chdirs to the tools dir)
    import tr_pipe  # noqa: E402
    orig_py = tr_pipe.py
    rec = {}
    for job, raw, fig, view in JOBS:
        d = os.path.join(out_root or os.path.join(CW, 'sheets'), job)
        moved = {}

        def py(*a, _fig=fig, _view=view, _job=job, _moved=moved):
            a = list(a)
            name = os.path.basename(a[0])
            if name == 'key.py':
                a.append('--shafts')
            out = orig_py(*a)
            if name == 'slice.py':
                _moved.update(carry_anchors(a[4], _fig, _view, _job))
            return out
        tr_pipe.py = py
        try:
            r = cgrid.run(raw, fig, view, d)
        finally:
            tr_pipe.py = orig_py
        old = json.load(open(os.path.join(PRE, 'work', 'creatures', 'sheets', job, 'checks.json')))
        key = json.load(open(os.path.join(d, 'key.json')))
        rec[job] = dict(figure=fig, view=view, shafts=key.get('shafts'), anchorsCarried=moved,
                        gatesBefore=old['gates'], gatesAfter=r['gates'], cameraBefore=old['cameraGate']['follow'], cameraAfter=r['cameraGate']['follow'],
                        fringe=dict(before={k: old['fringe'].get(k) for k in ('keyInUnitPct', 'edgeDevPct', 'spillEdgePct')},
                                    after={k: r['fringe'].get(k) for k in ('keyInUnitPct', 'edgeDevPct', 'spillEdgePct')}))
        print(cgrid.line(os.path.basename(raw), r), '| shafts', len(key.get('shafts') or []), '| anchors carried', sorted(moved), flush=True)
    return rec


def step2():
    import cpost  # noqa: E402
    keep = {f: v for f, v in cpost.PICKS.items() if f in FIGS}
    full = json.load(open(os.path.join(CW, 'picks.json')))
    saved = dict(cpost.PICKS)
    cpost.PICKS.clear(); cpost.PICKS.update(keep)
    try:
        cpost.main()  # writes picks.json with the two figures only (identity ticks read from the full file first)
    finally:
        cpost.PICKS.clear(); cpost.PICKS.update(saved)
    new = json.load(open(os.path.join(CW, 'picks.json')))
    for f in FIGS:
        full['figures'][f] = new['figures'][f]
    json.dump(full, open(os.path.join(CW, 'picks.json'), 'w'), indent=1)
    return {f: {v: dict(status=x['status'], failed=x['failed'], note=x['note']) for v, x in full['figures'][f].items()} for f in FIGS}


def step3():
    import cpack  # noqa: E402
    old = {f: json.load(open(os.path.join(PRE, 'atlas', 'creatures', 'figures', f + '.json'))) for f in FIGS}
    pins = {}
    orig_fo = cpack.frames_of

    def frames_of(sdir, fig, view, tier):
        shipped = old[fig]['views'][view]['atlas'][tier]['bodyHeightSrc']
        orig_mh = cpack.pack.mounted_height
        natural = []

        def mh(m):
            natural.append(int(orig_mh(m)))
            return shipped
        cpack.pack.mounted_height = mh
        try:
            out, info = orig_fo(sdir, fig, view, tier)
        finally:
            cpack.pack.mounted_height = orig_mh
        pins[f'{fig}.{view}.{tier}'] = dict(shipped=shipped, natural=natural[0] if natural else None, scale=info['scale'],
                                           scaleShipped=old[fig]['views'][view]['atlas'][tier]['scale'])
        return out, info
    cpack.frames_of = frames_of
    picks = json.load(open(os.path.join(CW, 'picks.json')))['figures']
    sp = os.path.join(ATLAS, 'pack-summary.json')
    summary = json.load(open(sp))
    try:
        for fam in FIGS:
            cpack.pack_grid(fam, [fam], picks, summary)
    finally:
        cpack.frames_of = orig_fo
    summary['_bytesPng'] = sum(os.path.getsize(os.path.join(ATLAS, f)) for f in os.listdir(ATLAS) if f.endswith('.png'))
    json.dump(summary, open(sp, 'w'), indent=1)
    cpack.write_index()
    return pins, {k: summary[k] for k in summary if k.split('.')[0] in FIGS}


def main():
    a = sys.argv[1:]
    if '--dry' in a:
        out = a[a.index('--dry') + 1]
        os.makedirs(out, exist_ok=True)
        rec = step1(out)
        json.dump(rec, open(os.path.join(out, 'dry-record.json'), 'w'), indent=1)
        return
    rec = dict(source='owner stage C verdict, 2026-10-24 (verdict.json: ashRider redo, wolfRider note)', generations=0)
    rec['sheets'] = step1()
    rec['picks'] = step2()
    rec['scalePinned'], rec['pack'] = step3()
    json.dump(rec, open(os.path.join(HERE, 'record.json'), 'w'), indent=1)
    print(json.dumps(rec['scalePinned'], indent=1))


if __name__ == '__main__':
    main()
