#!/usr/bin/env python3
"""Stage B calibration copy of tools/art/gemini_gen.py with an optional --size (imageConfig.imageSize).
Generate one image with the Gemini API (the key is added by the environment's network secret).
Usage: gemini_gen.py MODEL OUT.png PROMPT_FILE [REF_IMAGE ...] [--aspect 1:1]"""
import base64, json, sys, time, urllib.request, urllib.error, hashlib, datetime, os
args = sys.argv[1:]
aspect = '1:1'
if '--aspect' in args:
    i = args.index('--aspect'); aspect = args[i + 1]; del args[i:i + 2]
size = None  # stage B calibration (review change 8): optional imageConfig.imageSize ('1K', '2K', '4K')
if '--size' in args:
    i = args.index('--size'); size = args[i + 1]; del args[i:i + 2]
model, out, prompt_file, refs = args[0], args[1], args[2], args[3:]
prompt = open(prompt_file).read()
parts = []
for r in refs:
    mime = 'image/png' if r.endswith('.png') else 'image/webp' if r.endswith('.webp') else 'image/jpeg'
    parts.append({'inline_data': {'mime_type': mime, 'data': base64.b64encode(open(r, 'rb').read()).decode()}})
parts.append({'text': prompt})
body = {'contents': [{'role': 'user', 'parts': parts}],
        'generationConfig': {'responseModalities': ['IMAGE'], 'imageConfig': dict({'aspectRatio': aspect}, **({'imageSize': size} if size else {}))}}
url = f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent'
t0 = time.time()
for attempt in range(3):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={'Content-Type': 'application/json'})
    try:
        resp = json.load(urllib.request.urlopen(req, timeout=180)); break
    except urllib.error.HTTPError as e:
        msg = e.read().decode()[:400]
        if e.code in (429, 500, 503) and attempt < 2: time.sleep(10 * (attempt + 1)); continue
        print('HTTP', e.code, msg); sys.exit(1)
img = None; text = []
for c in resp.get('candidates', []):
    for p in c.get('content', {}).get('parts', []):
        d = p.get('inlineData') or p.get('inline_data')
        if d: img = base64.b64decode(d['data'])
        elif 'text' in p: text.append(p['text'])
if not img:
    print('NO IMAGE', json.dumps(resp)[:600]); sys.exit(2)
open(out, 'wb').write(img)
usage = resp.get('usageMetadata', {})
meta = {'file': os.path.basename(out), 'sha256': hashlib.sha256(img).hexdigest(), 'tool': 'Gemini API (network secret)',
        'model': model, 'date': datetime.date.today().isoformat(), 'prompt': prompt,
        'references': [os.path.basename(r) for r in refs], 'aspect': aspect, 'imageSize': size, 'usage': usage,
        'seconds': round(time.time() - t0, 1), 'modelText': text, 'approved': None}
json.dump(meta, open(out.rsplit('.', 1)[0] + '.json', 'w'), indent=2)
print('ok', out, len(img), 'bytes', usage.get('totalTokenCount'), 'tokens', meta['seconds'], 's')
