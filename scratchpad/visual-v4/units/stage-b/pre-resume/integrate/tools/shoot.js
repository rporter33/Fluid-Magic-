// Stage B integration shots (run by drv.cjs): each battle at deploy, volley, clash, rout and result; close zooms of
// each nation's blocks; every commander beside its card portrait; hover cards; a motion strip; phone width.
// Writes into units/stage-b/shots/. Set ONLY=<substring> in the environment to shoot a subset.
const DIR = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/shots/';
const REPO = '/home/user/Fluid-Magic-/src/assets/raster/portraits';
fs.mkdirSync(DIR, { recursive: true });
const ONLY = process.env.ONLY || '';
const want = (n) => !ONLY || ONLY.split(',').some((o) => n.includes(o));
const log = [];
const page = await open(1600, 900, '?paused=1');
const seekAuto = (k, t) => page.evaluate(([k, t]) => { const G = window.__battle.game; if (G.key !== k) G.load(k); G.playing = false; G.follow = true; G.user = null; G.seek(t); G.render(t); G.render(t); }, [k, t]);
const closeOn = (k, t, gis, f, dy) => page.evaluate(([k, t, gis, f, dy]) => {
  const G = window.__battle.game; if (G.key !== k) G.load(k); G.playing = false; G.seek(t);
  let X0 = Infinity, X1 = -Infinity, Y0 = Infinity, Y1 = -Infinity;
  for (const gi of gis) { const h = G.stage.hull(G.stage.T.G[gi], t); if (!h) continue; X0 = Math.min(X0, h.X - h.rx); X1 = Math.max(X1, h.X + h.rx); Y0 = Math.min(Y0, h.Y - h.ry); Y1 = Math.max(Y1, h.Y + h.ry); }
  if (!isFinite(X0)) return false;
  G.follow = false; G.user = { cx: (X0 + X1) / 2, cy: (Y0 + Y1) / 2 - (dy || 12), z: f / 28 * Math.max(window.innerWidth / 1920, 0.5) };
  G.render(t); G.render(t); return true;
}, [k, t, gis, f, dy]);
const snap = async (name, opts) => { if (!want(name)) return; await page.screenshot({ path: DIR + name + '.png', ...(opts || {}) }); log.push(name); };

const info = await page.evaluate(() => DATA.map((b) => ({ key: b.key, title: b.title })));
for (const { key } of info) {
  const meta = await page.evaluate((k) => {
    const G = window.__battle.game; G.load(k); G.playing = false;
    const st = G.stage, T = st.T, m = G.moments();
    const groups = st.S.groups.map((g) => ({ idx: g.idx, unit: g.unit, side: g.side, cmd: !!g.isCmd, size: g.size, name: g.personal, painted: st.paint ? st.paint.lookOf[g.idx] : null, why: st.paint ? st.paint.why[g.idx] : null, near: g.side === st.B.nearSide, nation: st.B.sides[g.side].def, appear: T.G[g.idx].appear }));
    return { m, groups };
  }, key);
  const m = meta.m;
  // ---- the five moments, automatic camera
  for (const [n, t] of [['1-deploy', m.deploy], ['2-volley', m.volley], ['3-clash', m.clash], ['4-rout', m.rout], ['5-result', m.result]]) {
    if (t === null || !want(`${key}-${n}`)) continue;
    await seekAuto(key, t);
    await snap(`${key}-${n}`);
  }
  // the same clash in Procedural, for comparison
  if (want(`${key}-3-clash-procedural`)) {
    await page.evaluate(() => window.__battle.game.setFigures('procedural'));
    await seekAuto(key, m.clash); await snap(`${key}-3-clash-procedural`);
    await page.evaluate(() => window.__battle.game.setFigures('painted'));
  }
  // ---- close zooms (a man 72 px, tier H) of each nation's blocks, at deploy and at the clash
  for (const nat of ['cinderHorde', 'thornwood']) {
    const gis = meta.groups.filter((g) => g.nation === nat && !g.cmd && g.size < 3 && g.appear === -Infinity).map((g) => g.idx);
    for (const [n, t] of [['deploy', 2.2], ['clash', m.clash + 1.2]]) {
      const name = `${key}-close-${nat}-${n}`;
      if (!want(name)) continue;
      // frame two or three blocks at a time so a man stays 72 px
      const chunks = [];
      for (let i = 0; i < gis.length; i += 2) chunks.push(gis.slice(i, i + 2));
      let j = 0;
      for (const ch of n === 'deploy' ? chunks : [gis]) {
        const ok = await closeOn(key, t, ch, 72);
        if (ok) await snap(`${name}${n === 'deploy' ? '-' + (++j) : ''}`);
      }
    }
  }
  // ---- every commander beside its card portrait (the approved portrait at 256 px; the card shows its 64 px copy)
  for (const g of meta.groups.filter((q) => q.cmd && q.size < 3)) {
    const name = `${key}-cmd-${g.unit}-${g.name || g.idx}`;
    if (!want(name)) continue;
    const face = await page.evaluate((gi) => { const st = window.__battle.game.stage; const k = st.paint && st.paint.lookOf[gi]; return k ? PAINT.looks[k].face : null; }, g.idx);
    // the face from the card portrait itself (the bundle's group table)
    const fromData = await page.evaluate(([k, gi]) => (PAINT.groups.find((x) => x.battle === k && x.group === gi) || {}).face || null, [key, g.idx]);
    const nat = g.nation;
    const file = `${REPO}/${nat}/${g.unit}/${fromData}.webp`;
    const url = fs.existsSync(file) ? 'data:image/webp;base64,' + fs.readFileSync(file).toString('base64') : null;
    const ok = await page.evaluate(([k, gi]) => {
      const G = window.__battle.game; if (G.key !== k) G.load(k); G.playing = false;
      const T = G.stage.T, f = T.F[T.G[gi].figs[0]];
      const t = 2.2;
      G.seek(t);
      const p = figPos(T, f, t, { x: 0, y: 0, h: 0 });
      G.follow = false; G.user = { cx: sx(p.x, p.y) + 40, cy: sy(p.x, p.y, p.h) - 22, z: 72 / 28 * Math.max(window.innerWidth / 1920, 0.5) * 1.6 };
      G.render(t); G.render(t);
      return true;
    }, [key, g.idx]);
    if (!ok) continue;
    await page.evaluate(([url, label, sub, face]) => {
      let d = document.getElementById('cmpcard');
      if (!d) { d = document.createElement('div'); d.id = 'cmpcard'; document.body.appendChild(d); }
      d.style.cssText = 'position:fixed;left:calc(50% + 120px);top:calc(50% - 170px);width:276px;background:#1c1a17;border:1px solid #5a5248;border-radius:8px;padding:10px;z-index:50;font:600 14px/1.3 system-ui,sans-serif;color:#e8e2d6';
      d.innerHTML = (url ? `<img src="${url}" style="display:block;width:256px;height:256px;border-radius:4px">` : '<div style="width:256px;height:256px;display:grid;place-items:center;color:#8a8070">no portrait</div>') +
        `<div style="margin-top:8px">${label}</div><div style="font-weight:400;color:#b9b0a2;font-size:12.5px">${sub}</div>`;
    }, [url, `${g.unit} · face ${fromData}${g.name ? ' · ' + g.name : ''}`, g.painted ? `its card portrait (approved) · field figure: ${g.painted} (face ${face})` : `its card portrait (approved) · field figure: PROCEDURAL — ${g.why}`, face]);
    await snap(name);
    await page.evaluate(() => { const d = document.getElementById('cmpcard'); if (d) d.remove(); });
  }
  // ---- hover cards at the clash: a block of each side and a commander
  if (want(`${key}-hover`)) {
    await seekAuto(key, m.clash + 1.0);
    const picks = await page.evaluate(() => {
      const G = window.__battle.game, st = G.stage, T = st.T, t = G.t, w = st.world;
      const out = [];
      for (const side of [st.B.nearSide, st.B.nearSide === 'attacker' ? 'defender' : 'attacker']) {
        const G2 = T.G.filter((q) => q.side === side && !q.g.isCmd && q.g.size < 3 && countAt(T, q.idx, t) > 0).sort((a, b) => countAt(T, b.idx, t) - countAt(T, a.idx, t))[0];
        if (!G2) continue;
        const h = st.hull(G2, t); if (!h) continue;
        out.push({ gi: G2.idx, x: w.position.x + h.X * w.scale.x, y: w.position.y + h.Y * w.scale.y });
      }
      const C = T.G.find((q) => q.g.isCmd && q.g.size < 3 && countAt(T, q.idx, t) > 0 && st.sprites[q.figs[0]] && st.sprites[q.figs[0]].visible);
      if (C) { const sp = st.sprites[C.figs[0]]; out.push({ gi: C.idx, x: w.position.x + sp.x * w.scale.x, y: w.position.y + (sp.y - 14) * w.scale.y }); }
      return out;
    });
    let j = 0;
    for (const p of picks) {
      if (p.x < 0 || p.y < 0 || p.x > 1600 || p.y > 900) continue;
      await page.mouse.move(p.x, p.y);
      await page.evaluate(() => window.__battle.game.render(window.__battle.game.t));
      await snap(`${key}-hover-${++j}`);
    }
    await page.mouse.move(5, 450);
  }
}
// ---- a motion strip: battle c's clash at closest zoom, 8 frames 0.1 s apart (each figure on its own beat)
if (want('motion')) {
  const m = await page.evaluate(() => { const G = window.__battle.game; G.load('c'); return G.moments(); });
  for (let i = 0; i < 8; i++) {
    const t = m.clash + 0.6 + i * 0.1;
    await page.evaluate(([t]) => {
      const G = window.__battle.game; G.playing = false; G.seek(t);
      const st = G.stage, T = st.T;
      const gi = T.G.find((q) => q.g.unit === 'cinderWarrior').idx;
      const h = st.hull(T.G[gi], t);
      G.follow = false; G.user = { cx: h.X + 30, cy: h.Y - 30, z: 72 / 28 * Math.max(window.innerWidth / 1920, 0.5) };
      G.render(t); G.render(t);
    }, [t]);
    await snap(`c-motion-${i}`, { clip: { x: 400, y: 150, width: 800, height: 520 } });
  }
}
// ---- phone width: portrait and landscape
if (want('phone')) {
  for (const [w, h, tag] of [[390, 844, 'portrait'], [844, 390, 'landscape']]) {
    const p2 = await open(w, h, '?b=c&paused=1', { dpr: 3, touch: true, mobile: true });
    const m = await p2.evaluate(() => window.__battle.moments());
    for (const [n, t] of [['deploy', m.deploy], ['clash', m.clash]]) {
      await p2.evaluate(([t]) => { const G = window.__battle.game; G.playing = false; G.seek(t); G.render(t); G.render(t); }, [t]);
      await p2.screenshot({ path: DIR + `phone-${tag}-c-${n}.png` }); log.push(`phone-${tag}-c-${n}`);
    }
    const tier = await p2.evaluate(() => window.__battle.game.stage.paint.tier);
    log.push(`phone-${tag} tier ${tier}`);
    await p2.close();
  }
}
return log;
