const page = await open(1920, 1080);
const res = {};
for (const key of ['a', 'b', 'c']) {
  for (const speed of [1, 4]) {
    res[key + speed] = await page.evaluate(async ([key, speed]) => {
      const G = window.__battle.game; G.load(key); G.speed = speed; G.playing = false;
      const T = G.stage.T; let t = 0; const up = []; let worst = [];
      let i = 0;
      while (t < T.duration) {
        t = Math.min(T.duration, t + (1 / 60) * speed * storyRate(T, t, speed));
        const a = performance.now();
        G.stage.frame(t, speed, G.view); G.applyCamera(t); G.hud.update(t);
        const b = performance.now();
        up.push(b - a); if (b - a > 12) worst.push([+t.toFixed(2), +(b - a).toFixed(1)]);
        if (++i % 60 === 0) await new Promise((r) => setTimeout(r, 0));
      }
      const s = [...up].sort((x, y) => x - y); const q = (p) => +s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(2);
      return { frames: up.length, p50: q(0.5), p95: q(0.95), p99: q(0.99), max: +s[s.length - 1].toFixed(1), over12ms: worst.length, worst: worst.sort((x, y) => y[1] - x[1]).slice(0, 6) };
    }, [key, speed]);
  }
}
return res;
