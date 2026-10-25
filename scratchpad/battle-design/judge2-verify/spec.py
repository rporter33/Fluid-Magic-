import sys, wave, numpy as np
from PIL import Image, ImageDraw
def load(p):
    w = wave.open(p); n = w.getnframes(); sr = w.getframerate(); ch = w.getnchannels()
    x = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32)/32768
    if ch > 1: x = x.reshape(-1, ch).mean(1)
    return x, sr
names = sys.argv[1:]
tiles = []
for nm in names:
    x, sr = load(f'proto/wav/{nm}.wav')
    nfft = 1024; hop = 128
    win = np.hanning(nfft)
    frames = [x[i:i+nfft]*win for i in range(0, max(1,len(x)-nfft), hop)]
    S = np.abs(np.fft.rfft(np.array(frames), axis=1)).T
    S = 20*np.log10(S+1e-6); S = np.clip((S - S.max() + 80)/80, 0, 1)
    fmax = min(8000, sr/2); rows = int(fmax/(sr/2)*S.shape[0]); S = S[:rows][::-1]
    img = Image.fromarray((S*255).astype(np.uint8)).resize((600, 220))
    canvas = Image.new('L', (600, 240), 0); canvas.paste(img, (0, 20))
    d = ImageDraw.Draw(canvas); d.text((4, 4), f'{nm}  {len(x)/sr:.2f}s  sr {sr}  0-{int(fmax)} Hz', fill=255)
    tiles.append(canvas)
out = Image.new('L', (600, 240*len(tiles)))
for i, t in enumerate(tiles): out.paste(t, (0, 240*i))
out.save('spectrograms.png')
