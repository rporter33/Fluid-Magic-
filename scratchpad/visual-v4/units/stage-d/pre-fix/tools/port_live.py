# Ports the magic pilot from the sandbox into the live mockup (visual-v4), once units/stage-c/lance-fix/DONE exists.
# 1. backs up the live src/ (with page.html), build.py, paint-data.json and battle-mockup.html to units/stage-d/pre-pilot/
# 2. copies the pilot's new modules and merges its edits into the live modules (a three-way merge against the base the
#    sandbox started from, work/base-src, so edits made live since then are kept)
# 3. teaches the live build.py the effects atlas (/*FX*/ from units/stage-d/atlas/fx/fx-data.json) and rebuilds
# Usage: python3 -I port_live.py [--dry]
import hashlib, os, shutil, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
WORK = os.path.abspath(os.path.join(HERE, '..'))
STAGE = os.path.abspath(os.path.join(WORK, '..'))
UNITS = os.path.abspath(os.path.join(STAGE, '..'))
V4 = os.path.abspath(os.path.join(UNITS, '..'))
LIVE, SBX, BASE = os.path.join(V4, 'src'), os.path.join(WORK, 'sbx', 'src'), os.path.join(WORK, 'base-src')
DRY = '--dry' in sys.argv


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest() if os.path.exists(p) else None


def main():
    done = os.path.join(UNITS, 'stage-c', 'lance-fix', 'DONE')
    if not os.path.exists(done):
        print('NOT YET: no', done); sys.exit(2)
    bk = os.path.join(STAGE, 'pre-pilot')
    if not DRY:
        if os.path.exists(bk): shutil.rmtree(bk)
        os.makedirs(bk)
        shutil.copytree(LIVE, os.path.join(bk, 'src'))
        for f in ['build.py', 'battle-mockup.html']: shutil.copy2(os.path.join(V4, f), os.path.join(bk, f))
        shutil.copy2(os.path.join(UNITS, 'stage-b', 'integrate', 'paint-data.json'), os.path.join(bk, 'paint-data.json'))
        with open(os.path.join(bk, 'SHA256SUMS'), 'w') as o:
            for root, _, files in os.walk(bk):
                for f in sorted(files):
                    if f != 'SHA256SUMS': p = os.path.join(root, f); o.write(f'{sha(p)}  {os.path.relpath(p, bk)}\n')
    report = []
    for f in sorted(os.listdir(SBX)):
        s, b, l = os.path.join(SBX, f), os.path.join(BASE, f), os.path.join(LIVE, f)
        if not os.path.exists(b):
            report.append(('new', f)); DRY or shutil.copy2(s, l); continue
        if sha(s) == sha(b): continue  # the pilot did not touch it
        if sha(l) == sha(b):
            report.append(('pilot edit', f)); DRY or shutil.copy2(s, l); continue
        # edited live since the sandbox began: three-way merge (live, base, sandbox)
        r = subprocess.run(['git', 'merge-file', '-p', '-L', 'live', '-L', 'base', '-L', 'pilot', l, b, s], capture_output=True, text=True)
        report.append(('merged' if r.returncode == 0 else f'CONFLICTS {r.returncode}', f))
        if not DRY and r.returncode == 0: open(l, 'w').write(r.stdout)
    for k, f in report: print(f'{k:>14}  {f}')
    if any(k.startswith('CONFLICTS') for k, _ in report): print('stop: resolve the conflicts by hand'); sys.exit(3)
    # the effects atlas for the live build
    fxd = os.path.join(STAGE, 'atlas', 'fx', 'fx-data.json')
    if not DRY: shutil.copy2(os.path.join(WORK, 'sbx', 'fx-data.json'), fxd)
    bp = os.path.join(V4, 'build.py'); src = open(bp).read()
    if '/*FX*/' not in src:
        old = "page = page.replace('/*DATA*/', data).replace('/*PAINT*/', paint).replace('/*CODE*/', code)"
        new = ("# the effects atlas of the stage D magic pilot (units/stage-d/work/tools/fx_pack.py), a WebP data URI and its frames\n"
               "fx_path = os.path.join(here, 'units', 'stage-d', 'atlas', 'fx', 'fx-data.json')\n"
               "fx = open(fx_path).read() if os.path.exists(fx_path) else 'null'\n"
               "json.loads(fx)\n"
               "fx = fx.replace('</', '<\\\\/')\n"
               "page = page.replace('/*DATA*/', data).replace('/*PAINT*/', paint).replace('/*FX*/', fx).replace('/*CODE*/', code)")
        assert src.count(old) == 1, 'build.py changed: add the /*FX*/ step by hand'
        if not DRY: open(bp, 'w').write(src.replace(old, new))
        print('build.py: /*FX*/ added')
    if not DRY:
        r = subprocess.run([sys.executable, '-I', bp], capture_output=True, text=True, cwd=V4)
        print(r.stdout.strip(), r.stderr.strip())


if __name__ == '__main__':
    main()
