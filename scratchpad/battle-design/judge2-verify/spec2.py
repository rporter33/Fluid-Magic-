import sys, wave, numpy as np
from PIL import Image, ImageDraw
def load(p):
    w = wave.open(p); n = w.getnframes(); sr = w.getframerate(); ch = w.getnchannels()
    x = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32)/32768
    if ch > 1: x = x.reshape(-1, ch).mean(1)
    return x, sr
tiles=[]
for nm in sys.argv[1:]:
    x, sr = load(f'proto/wav/{nm}.wav')
    nfft = 4096; hop = 128; win = np.hanning(nfft)
    xp = np.concatenate([x, np.zeros(nfft)])
    frames = [xp[i:i+nfft]*win for i in range(0, len(x), hop)]
    S = np.abs(np.fft.rfft(np.array(frames), axis=1)).T
    S = 20*np.log10(S+1e-7); S = np.clip((S - S.max() + 50)/50, 0, 1)
    fmax = 3000; rows = int(fmax/(sr/2)*S.shape[0]); S = S[:rows][::-1]
    img = Image.fromarray((S*255).astype(np.uint8)).resize((600, 300))
    c = Image.new('L', (600, 320), 0); c.paste(img, (0, 20)); ImageDraw.Draw(c).text((4,4), f'{nm} 0-3000 Hz, 50 dB', fill=255); tiles.append(c)
    # crude harmonic-to-noise: autocorrelation peak per 40ms frame
    fr = int(0.04*sr); hn=[]; f0s=[]
    for i in range(0, len(x)-fr, fr):
        seg = x[i:i+fr]-x[i:i+fr].mean()
        if np.sum(seg**2) < 1e-6: continue
        ac = np.correlate(seg, seg, 'full')[fr-1:]; ac /= ac[0]
        lo, hi = int(sr/600), int(sr/60)
        k = lo + int(np.argmax(ac[lo:hi])); hn.append(ac[k]); f0s.append(sr/k)
    print(nm, 'f0 track', [int(f) for f in f0s], 'periodicity', [round(float(h),2) for h in hn])
out = Image.new('L', (600, 320*len(tiles)))
for i,t in enumerate(tiles): out.paste(t,(0,320*i))
out.save('spec_voice.png')
