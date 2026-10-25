# Stage C lance fix: completes record.json with the cause per view, the checks, the page sizes, the shots and the files.
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
SC = os.path.abspath(os.path.join(HERE, '..'))
V4 = os.path.abspath(os.path.join(SC, '..', '..'))
rp = os.path.join(HERE, 'record.json')
rec = json.load(open(rp))
rec['cause'] = {
    'summary': ('Our keyer, in every affected cell; never the painting. Each shaft is painted whole and inside its cell, '
                'but cast through with the key (green sheets: a dark green shaft about (3, 122, 0); the Wolf Rider front\'s '
                'lighter blue sheet: a navy shaft about (14, 41, 118) with a steel tip). key.py read that as part key '
                '(alpha 0.2 to 0.6), its 1 px erosion took the rest, and slice.py (mask at alpha 0.35) dropped the remains '
                'as specks, so the pennon and the tip were left floating above the hand.'),
    'ruledOut': {
        'slicing / cell windows': 'no frame touches its slice window or the sheet edge, before or after (frames JSON overlaps, boxes)',
        'cell crop': 'cut() keeps the mask plus 2 px; the boxes simply ended where the keyed shaft did',
        'ground-anchor framing': 'nothing cropped; the restored lances would have moved some anchors (up to 16.6 px), so the shipped anchors are carried',
        'fringe and edge passes': 'ad_rimfix, the nogreen keycast and the blue edge pass change colour only, never alpha',
        'packer and bundle': 'cpack premul_resize and the bundle pages take every frame whole (frame rects are the full cutouts)',
        'painting': 'no shaft runs out of its cell in any of the four sheets; no generation needed',
    },
    'views': {
        'ashRider.front': 'ashRider.front.cfix.r2 (green key): lance shafts lost in stand, walkA, walkB, gallopA, gallopB, charge, recoil, fall, cheer and the dropped lance (stand: 5 parts and 7 specks before, 1 part after); the windup and strike sword blades were thinned the same way',
        'ashRider.back': 'ashRider.back.fill (green key): milder (olive shafts, less cast): the shaft below the pennon faint or gone in stand, walkA, walkB, gallopA, gallopB, charge, recoil, deadA, deadB; the cheer cell\'s pennon floated',
        'wolfRider.front': 'wolfRider.front.harness (light blue key #2E61EC, strength 0.54): navy shafts and steel tips lost in stand, lopeA, lopeB, leapA, charge, windup, strike, bite, recoil, fall, cheer',
        'wolfRider.frontKept': 'wolfRider.front.kept (the page\'s alternate front): the same, fixed the same way',
        'wolfRider.back': 'wolfRider.back.paint.r2 (pure blue key): its shafts are not cast; the detector finds no line; left as it was (frames byte-identical)',
    },
}
rec['fix'] = {
    'keyer': 'work/creatures/sbx/tools/key.py section 7, --shafts (opt in; without it the keyer\'s output is byte-identical to before)',
    'driver': 'lance-fix/lance_fix.py (pipeline re-run with --shafts, shipped anchors and missing frames carried, cpost for the two figures with picks.json merged, cpack for the two families with the shipped scale pinned)',
    'rerunNote': 'a later cgrid.py re-run of these four sheets must pass --shafts (run lance_fix.py), or the shafts are lost again',
    'colours': 'restored shafts: one colour per line, the cast core with the key hue taken out at 60% (Ash Rider about #33-3E grey, Wolf Rider about #28-2F); steel tips keep their own colour',
}
rec['notes'] = [
    'Ash Rider back: the variety gate now reads walkA~walkB IoU 0.865 against 0.86 (0.851 before): both walk cells hold the same whole lance; the bodies are unchanged. The view was already reported (fringe); it is now reported (variety, fringe).',
    'Wolf Rider front (harness): the camera gate now passes (14 of 16 cells follow their clay figure, 13 before: the strike cell with its whole spear); the view is now pass.',
    'Ash Rider front scale: its shipped bodyHeightSrc (147 px) was measured to the pennon top, not hood to hooves (126 px), so the front rider stands about 14% smaller than the 79/159 px rule; the fix kept the shipped scale (pinned) and leaves that for the owner or the art director.',
    'The sword blades of the Ash Rider front windup and strike cells are kept whole by the same rule (they were thinned the same way).',
]
rec['generations'] = dict(used=0, cap=6, stageCRemaining=19, note='no painting cut a shaft; nothing was generated')
for name in ('checks-after.json', 'checks-after-timing.json'):
    p = os.path.join(HERE, name)
    if not os.path.exists(p):
        continue
    r = json.load(open(p))
    rec.setdefault('checks', {})[name] = {m: dict(ok=x['ok'], paintOk=x.get('paintOk'), allPainted=x.get('allPainted'), pageErrors=len(x['pageErrors']),
                                                 consoleErrors=len(x['consoleErrors']), timing=x.get('timing'),
                                                 battles=[dict(key=b['key'], fig=b['fig'], card=b['card'], det=b['det'], rerun=b['rerun'], winner=b['winner'],
                                                               bodies=b['bodies'], overlap=b['overlap'], pickWrong=b['pickWrong'],
                                                               paint=(b.get('paint') or {}).get('ok'), creatures=(b.get('creatures') or {}).get('ok'),
                                                               wolfFront=(b.get('wolfFront') or {}).get('ok')) for b in x['battles']])
                                             for m, x in r['modes'].items()}
rec['checksNote'] = ('checks-after.json: stage-c/tools/checks.cjs, TIMING=0 (every check, no playback timing); checks-after-timing.json: '
                     'lance_checks.cjs, the same with the 1x and 4x playback timing on at 60 frames per speed (checks.cjs uses 240; that run '
                     'was stopped by the time limit on the shared machine: 4 cores at load 9 to 12 from other sessions). Both pass in Painted '
                     'and Procedural with 0 page and 0 console errors. The timing numbers are this loaded machine\'s (gpuWait is SwiftShader\'s '
                     'readPixels under load); the page\'s code is byte-identical to before, only its paint data changed.')
pre = os.path.join(SC, 'pre-lance')
rec['pages'] = {
    'battle-mockup.html': [os.path.getsize(os.path.join(pre, 'battle-mockup.html')), os.path.getsize(os.path.join(V4, 'battle-mockup.html'))],
    'stage-c/lineup.html': [os.path.getsize(os.path.join(pre, 'units', 'stage-c', 'lineup.html')), os.path.getsize(os.path.join(SC, 'lineup.html'))],
    'paint-data.json': [os.path.getsize(os.path.join(pre, 'units', 'stage-b', 'integrate', 'paint-data.json')),
                        os.path.getsize(os.path.join(V4, 'units', 'stage-b', 'integrate', 'paint-data.json'))],
    'note': 'bytes before, after; the mockup page is byte-identical apart from its paint data (code and performance work untouched)',
}
shots = os.path.join(SC, 'shots', 'lance')
rec['shots'] = sorted(os.path.relpath(os.path.join(d, f), SC) for d, _, fs in os.walk(shots) for f in fs)
rec['backup'] = 'stage-c/pre-lance/ (every file changed, as it was before the fix, paths relative to visual-v4)'
json.dump(rec, open(rp, 'w'), indent=1)
print('record', rp, len(rec['shots']), 'shots;', {k: v for k, v in rec['pages'].items() if k != 'note'})
