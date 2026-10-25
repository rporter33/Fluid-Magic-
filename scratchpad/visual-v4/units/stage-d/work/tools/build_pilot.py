# Builds units/stage-d/pilot/pilot.html: the magic pilot's review page (art plan 7.5). Self-contained: the clips, the
# beat stills and the sheet thumbnails are embedded; fonts come from Google Fonts when online (system fonts otherwise).
# Usage: python3 -I build_pilot.py   (reads work/clips, work/pilot-assets, the check and perf JSON in work/)
import base64, html, io, json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from pilot_data import SPELLS, CLIPS, QUESTIONS, PLACEHOLDERS  # noqa: E402
WORK = os.path.abspath(os.path.join(HERE, '..'))
STAGE = os.path.abspath(os.path.join(WORK, '..'))
OUT = os.path.join(STAGE, 'pilot', 'pilot.html')
E = html.escape
MINUS = '−'


def b64(path):
    with open(path, 'rb') as f:
        return base64.b64encode(f.read()).decode('ascii')


def jload(name, default=None):
    p = os.path.join(WORK, name)
    try:
        return json.load(open(p))
    except Exception:
        return default


def beat_rows(spell, meta):
    """Beats of a clip in ms from the cast's charge start, from the clip's own timeline (exact, chain rule included)."""
    b = meta['plan']['beats']
    t0 = meta['plan']['t0']
    ms = lambda t: round((t - t0) * 1000)
    rows = []
    if spell == 'entangle' and meta['from'] > 3:  # the wither clip
        h = (meta['plan'].get('held') or [{}])[0]
        t1 = h.get('t1', t0 + 6.65)
        rows.append({'name': 'Hold', 'a': ms(meta['tStart']), 'b': ms(t1), 'text': SPELLS[spell]['board']['hold']})
        rows.append({'name': 'Wither', 'a': ms(t1), 'b': ms(t1 + 0.6), 'text': SPELLS[spell]['board']['wither']})
        rows.append({'name': 'Root scar', 'a': ms(t1 + 0.6), 'b': ms(meta['tStart'] + meta['to'] - meta['from']), 'text': 'The root scar stays in the field.'})
        return rows
    for k in ['charge', 'release', 'travel', 'impact', 'linger']:
        rows.append({'name': k.capitalize(), 'a': ms(b[k][0]), 'b': ms(b[k][1]), 'text': SPELLS[spell]['board'][k]})
    if spell == 'fireball':
        rows.append({'name': 'After', 'a': ms(b['linger'][1]), 'b': ms(t0 + meta['to']), 'text': 'Smoke and embers run on under the next cues; the scorch stays.'})
    else:
        rows.append({'name': 'Hold', 'a': ms(b['linger'][1]), 'b': ms(t0 + meta['to']), 'text': SPELLS[spell]['board']['hold']})
    return rows


def main():
    clips_dir = os.environ.get('CLIPS') or os.path.join(WORK, 'clips')
    assets = os.path.join(WORK, 'pilot-assets')
    clip_js, blobs = {}, []
    for cid, c in CLIPS.items():
        m1 = json.load(open(os.path.join(clips_dir, f'{cid}-1.json')))
        rows = beat_rows(c['spell'], m1)
        ent = {'spell': c['spell'], 'label': c['label'], 'note': c['note'], 'fps': m1['fps'], 'frames': m1['frames'], 'from': m1['from'], 'to': m1['to'],
               't0': m1['plan']['t0'], 'form': m1['plan']['beats'].get('form', ''), 'beats': rows, 'man': {}, 'size': m1.get('size') or [1120, 630]}
        for z in (1, 2):
            m = json.load(open(os.path.join(clips_dir, f'{cid}-{z}.json')))
            ent['man'][z] = m['info'][len(m['info']) // 2]['manPx'] if m.get('info') else None
            blobs.append((f'v-{cid}-{z}', 'video/webm', b64(os.path.join(clips_dir, f'{cid}-{z}.webm'))))
            if os.path.exists(os.path.join(clips_dir, f'{cid}-{z}.jpg')):
                blobs.append((f'p-{cid}-{z}', 'image/jpeg', b64(os.path.join(clips_dir, f'{cid}-{z}.jpg'))))
        clip_js[cid] = ent
    # stills and sheet thumbnails (made by pilot_assets.py)
    stills = json.load(open(os.path.join(assets, 'stills.json')))
    sheets = json.load(open(os.path.join(assets, 'sheets.json')))
    pc = jload('pilot-checks-fix.json') or {}
    full = jload('checks-live-fix.json') or {}
    perf = jload('perf-moments-fix.json') or {}
    hitch = jload('hitch-fix.json') or {}
    V4 = os.path.abspath(os.path.join(STAGE, '..', '..'))
    mb = lambda p: f'{os.path.getsize(p) / 1e6:.2f} MB' if os.path.exists(p) else 'missing'
    atlas = json.load(open(os.path.join(STAGE, 'atlas', 'fx', 'fx-atlas.json')))
    gen = gen_count()
    sizes = {'The mockup page with the pilot (battle-mockup.html)': mb(os.path.join(V4, 'battle-mockup.html')) + ' (before the art director\'s fixes ' + mb(os.path.join(STAGE, 'pre-fix', 'battle-mockup.html')) + ', before the pilot ' + mb(os.path.join(STAGE, 'pre-pilot', 'battle-mockup.html')) + '; the limit is 15 MB)',
             f"The effects atlas (one {atlas['meta']['size']['w']} x {atlas['meta']['size']['h']} page, {len(atlas['frames'])} frames)": 'WebP ' + mb(os.path.join(STAGE, 'atlas', 'fx', 'fx-atlas.webp')) + ' inlined in the page; PNG master ' + mb(os.path.join(STAGE, 'atlas', 'fx', 'fx-atlas.png')) + '; frames the pilot never draws (meteor, smoke columns, burnt ground, flowers, petals) are left out of it',
             'Generations': f"{gen['used']} of the stage D budget of {gen['budget']}: 19 for the pilot, {gen['fix']} re-rolls for the art director's critique (of the 13 allowed); {gen['budget'] - gen['used']} left"}
    page = TEMPLATE
    page = page.replace('/*CLIPS*/', json.dumps(clip_js))
    page = page.replace('<!--SPELLS-->', ''.join(spell_section(i + 1, sid, clip_js, stills) for i, sid in enumerate(['fireball', 'entangle'])))
    page = page.replace('<!--SHEETS-->', sheets_section(sheets))
    page = page.replace('<!--QUESTIONS-->', questions_section(json.load(open(os.path.join(assets, 'qstills.json'))) if os.path.exists(os.path.join(assets, 'qstills.json')) else {}))
    page = page.replace('<!--BUILT-->', built_section(pc, full, perf, hitch, sizes, sheets))
    page = page.replace('<!--PLACEHOLDERS-->', E(PLACEHOLDERS))
    gfigs = open(os.path.join(assets, 'gallery-figs.json')).read().replace('</', '<\\/')
    page = page.replace('/*GFIGS*/', gfigs)
    page = page.replace('<!--BLOBS-->', ''.join(f'<script type="text/plain" id="{k}" data-type="{t}">{d}</script>\n' for k, t, d in blobs))
    # the gallery: the effects atlas and the mockup's own effects modules (from the live src), then the harness
    src = os.path.join(V4, 'src')
    fxdata = open(os.path.join(STAGE, 'atlas', 'fx', 'fx-data.json')).read().replace('</', '<\\/')
    code = '\n'.join(open(os.path.join(src, f)).read() for f in ['00-util.js', '33-fx-timeline.js', '45-fx-looks.js', '46-fx.js', '47-spells-pilot.js', '47b-fireball-burst.js', '48-entangle.js', '49-fx-decals.js'])
    code += '\n' + open(os.path.join(HERE, 'gallery.js')).read()
    assert '</script' not in code
    page = page.replace('/*FXDATA*/', fxdata).replace('/*FXCODE*/', code)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    open(OUT, 'w').write(page)
    print(OUT, len(page.encode('utf-8')), 'bytes')


def spell_section(n, sid, clip_js, stills):
    S = SPELLS[sid]
    ids = [k for k, c in CLIPS.items() if c['spell'] == sid]
    tabs = ''.join(f'<button type="button" class="seg" data-clip="{k}" aria-pressed="{"true" if i == 0 else "false"}">{E(CLIPS[k]["label"])}</button>' for i, k in enumerate(ids))
    st = ''.join(f'<figure style="--w:{s["w"]}px"><img src="data:image/webp;base64,{s["b64"]}" alt="{E(s["alt"])}" width="{s["w"]}" height="{s["h"]}"><figcaption><b>{E(s["beat"])}</b> {E(s["t"])}</figcaption></figure>'
                 for s in stills.get(sid, []))
    built = ''.join(f'<li>{E(x)}</li>' for x in S['built'])
    dev = ''.join(f'<li class="flaw">{E(x)}</li>' for x in S['deviations'])
    tags = ''.join(f'<span class="tag">{E(x)}</span>' for x in S['tags'])
    return f'''
<section class="piece" id="{sid}" aria-labelledby="{sid}-h">
  <div class="phead"><span class="num" aria-hidden="true">{n}</span><h2 id="{sid}-h">{E(S["title"])}</h2><div class="tags">{tags}</div></div>
  <p class="what">{E(S["what"])}</p>
  <div class="player" data-spell="{sid}" data-clips="{",".join(ids)}">
    <div class="cliptabs" role="group" aria-label="{E(S["title"])}: which moment">{tabs}</div>
    <div class="pgrid">
      <div class="screen">
        <div class="vbox"><div class="vscroll"><video muted playsinline preload="auto" loop aria-label="{E(S["title"])} in its battle moment"></video></div>
          <p class="maghint" hidden>Magnified 2x: drag or scroll to look around</p>
          <p class="vnote" hidden>This browser cannot play the clip (VP9 WebM). The stills below show every beat.</p></div>
        <div class="readout"><span class="tm" aria-hidden="true">0 ms</span><span class="bt" aria-live="polite"></span><span class="zm"></span></div>
        <div class="ctl">
          <button type="button" class="btn pp" aria-label="Play">Play</button>
          <div class="segs" role="group" aria-label="Speed"><button type="button" class="seg" data-rate="1" aria-pressed="true">1x</button><button type="button" class="seg" data-rate="0.25" aria-pressed="false">0.25x</button></div>
          <div class="segs" role="group" aria-label="Step one frame"><button type="button" class="btn fbk" aria-label="Back one frame (comma)">&#9664; Frame</button><button type="button" class="btn ffw" aria-label="Forward one frame (full stop)">Frame &#9654;</button></div>
          <div class="segs" role="group" aria-label="Camera"><button type="button" class="seg" data-zoom="1" aria-pressed="true">Play zoom</button><button type="button" class="seg" data-zoom="2" aria-pressed="false">2x camera</button></div>
          <button type="button" class="seg magb" aria-pressed="false" aria-label="Magnify the clip 2x (M)">Magnify</button>
        </div>
        <label class="scrubl"><span class="sr">Story time</span><input type="range" class="scrub" min="0" max="1000" step="1" value="0"></label>
        <p class="note cnote"></p>
      </div>
      <div class="boardw"><h3 class="bh">Storyboard <span class="note">(story ms from the charge)</span></h3><ol class="board"></ol></div>
    </div>
  </div>
  <details class="stills"><summary>Every beat at 2x, as stills</summary><div class="pics">{st}</div></details>
  <div class="cols">
    <div><h3 class="grp">What it draws</h3><ul class="stat">{built}</ul></div>
    <div><h3 class="grp">Where it differs from the storyboard</h3><ul class="stat">{dev}</ul></div>
  </div>
  <div class="vrow" data-key="s:{sid}" data-short="{E(S["title"])}" data-rec="{E(S["rec"])}"><span class="vq">Your call on {E(S["title"])}</span>
    {vbtns(S["opts"], S["rec"])}<button type="button" class="vclr" aria-label="Clear your call on {E(S["title"])}">Clear</button>
    <input type="text" aria-label="Note on {E(S["title"])}" placeholder="What to change (optional)"></div>
</section>'''


def vbtns(opts, rec):
    return ''.join(f'<button type="button" class="vbtn" data-v="{E(o)}" aria-pressed="false">{E(o)}' + (' <span class="rec">recommended</span>' if o == rec else '') + '</button>' for o in opts)


def gen_count():
    log = os.path.abspath(os.path.join(STAGE, '..', 'gen-log.tsv'))
    rows = [ln.split('\t') for ln in open(log).read().splitlines()[1:] if ln.strip()]
    d = [r for r in rows if len(r) > 5 and r[4] == 'D']
    return {'used': len(d), 'budget': 40, 'fix': sum(1 for r in d if r[5].startswith('D pilot fix:'))}


def sheets_section(sheets):
    rows = []
    for sh in sheets:
        cands = ''.join(
            f'<figure class="cand{" picked" if c["picked"] else ""}" style="--w:{c["w"]}px"><img src="data:image/webp;base64,{c["b64"]}" alt="{E(sh["sheet"] + " candidate " + c["cand"])}" width="{c["w"]}" height="{c["h"]}">'
            f'<figcaption><b>{E(sh["sheet"])}.{E(c["cand"])}</b> {E(c["model"])}{" · <span class=pk>Picked</span>" if c["picked"] else ""}<br>{E(" · ".join(c["checks"]))}</figcaption></figure>'
            for c in sh['cands'])
        rows.append(f'<div class="sheet"><h3 class="grp">{E(sh["sheet"])} {E(sh["title"])} <span class="tag">{E(sh["bg"])}, {E(sh["blend"])}</span></h3><p class="note">{E(sh["why"])}</p><div class="pics">{cands}</div></div>')
    return ''.join(rows)


def questions_section(qstills):
    out = []
    for i, q in enumerate(QUESTIONS):
        pics = ''
        if q.get('stills') and qstills.get(q['stills']):
            pics = '<div class="qstills">' + ''.join(f'<figure><img src="data:image/webp;base64,{x["b64"]}" alt="{E(x["alt"])}" width="{x["w"]}" height="{x["h"]}"><figcaption>{E(x["cap"])}</figcaption></figure>' for x in qstills[q['stills']]) + '</div>'
        out.append(f'<article class="q" id="{q["key"].replace(":", "-")}"><h3><span class="qn">Q{i + 1}</span>{E(q["q"])}</h3><p>{E(q["p"])}</p>{pics}'
                   f'<div class="vrow" data-key="{q["key"]}" data-short="{E(q["short"])}" data-rec="{E(q["rec"])}"><span class="vq">Your answer</span>{vbtns(q["opts"], q["rec"])}'
                   f'<button type="button" class="vclr" aria-label="Clear the answer: {E(q["short"])}">Clear</button><input type="text" aria-label="Note: {E(q["short"])}" placeholder="Note (optional)"></div></article>')
    return ''.join(out)


def built_section(pc, full, perf, hitch, sizes, sheets):
    li = []
    p = pc.get('pilot') if pc else None
    if p:
        for b in p['battles']:
            for c in b['casts']:
                fx = c.get('fixes') or {}
                extra = ''
                if c['spell'] == 'fireball' and fx:
                    extra = (f"; light copies {fx.get('litImpact')} figures at the impact (alpha at most {fx.get('litMax')}), none before or after; "
                             f"cross-fade {fx.get('crossFade')}; dust {fx.get('dust')} puffs; smouldering {fx.get('smoulder')} chunks"
                             + (f"; fire wounds flash orange for one frame ({fx['wound']['flash']} of {fx['wound'].get('n', 1)}"
                                + (f", {fx['wound']['hidden']} hidden behind the burst's dome" if fx['wound'].get('hidden') else '') + "), never white" if fx.get('wound') else '')
                             + (f"; {fx['licks']} flames on the burning kills" if fx.get('licks') else '')
                             + ('; the fragment has its trail' if fx.get('fragTrail') else '')
                             + ('; the burst opens on the Great Wyrm, in front of it' if fx.get('big') and fx['big'].get('lifted') else ''))
                elif fx:
                    extra = (f"; {fx.get('clods')} clods at the furrow's head; {fx.get('tendrils')} anchor tendrils; the coil's halves round the man: {'yes' if fx.get('halves') else 'no'}; "
                             f"his commander ring at {fx.get('cmdRingAlpha')} while held; no light copies")
                li.append(f"<li>{'' if c['ok'] else '<b>FAIL</b> '}battle {b['key']}, {c['spell']} {c['form']}: beats {', '.join(f'{k} {int(round(v * 1000))}' for k, v in c['beats'].items())} ms"
                          f"{' (travel +' + str(int(round(c['travelExtended'] * 1000))) + ' ms, the chain rule)' if c.get('travelExtended') else ''}; particles {c['particles']['peak']} of {c['particles']['budget']};"
                          f" extra draws {max(d['extra'] for d in c['draws'].values())}; deterministic {'yes' if c['deterministic'] else 'no'}; reduced motion {'ok' if c['reducedMotion']['ok'] else 'FAIL'}; sound cues {c.get('sound', {}).get('cues', 0)}{E(extra)}</li>")
        li.append(f"<li>Flash limiter: at 1x and 4x at most {p['limiter']['at1x']['worstPerRealSecond']} flashes in any real second, alpha at most {p['limiter']['alphaFull']} (Soft {p['limiter']['alphaSoft']}); none under reduced motion.</li>")
        li.append(f"<li>Decals under the 8,000 cap: battle a {p['battles'][0]['decals']['field']} + {p['battles'][0]['decals']['fx']}, battle c {p['battles'][1]['decals']['field']} + {p['battles'][1]['decals']['fx']}. No Graphics in the effects layer and no Graphics call during its frame.</li>")
        if p.get('warm'): li.append(f"<li>The effects layer pays its first frame while the battle loads (the atlas upload and the shaders): {p['warm']['ms']} ms when the checks reload a battle, the atlas already on the GPU; on a fresh page, see the first-frame lines below.</li>")
    if full.get('modes'):
        for mode, r in full['modes'].items():
            li.append(f"<li>window.__battle.checks() in {mode}: {'all pass' if r['ok'] else 'FAIL'}, the pilot checks included (1x and 4x, page errors {len(r.get('pageErrors', []))}).</li>")
    if perf.get('summary'):
        li.append("<li>CPU per frame at the spell moments, before the art director's fixes (units/stage-d/pre-fix) and after, the audit harness's method (camera, stage frame and HUD, plus the render submit; the GPU synced outside the timed part), median of interleaved rounds. SwiftShader software GL on a shared machine running other jobs: noisy, and GPU time is not representative.</li>")
        for row in perf['summary']:
            li.append(f"<li>{E(row)}</li>")
    for row in hitch.get('summary', []):
        li.append(f"<li>{E(row)}</li>")
    for k, v in (sizes or {}).items():
        li.append(f"<li>{E(k)}: {E(v)}</li>")
    return '<ul class="stat">' + ''.join(li) + '</ul>'


TEMPLATE = open(os.path.join(HERE, 'pilot_template.html')).read()

if __name__ == '__main__':
    main()
