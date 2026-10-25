// targeted checks of the fix claims, by my own measurement
const { launch, open, PAGE } = require('./vlib.cjs'); const fs = require('fs');
(async () => {
  const b = await launch(), errors = [], out = {};
  let p = await open(b, PAGE, { errors });
  const ev = (s) => p.evaluate((src) => window.__mock.ev(src), s), mk = (f, a) => p.evaluate(f, a);
  const arm = () => ev('(() => { const L = RL_PIECE_CACHE.get("L"); const r = canvas.getBoundingClientRect(), k = cam.s / L.s; return L.armies.map((a) => ({ key: a.key, kind: a.kind, ids: a.ids, x: r.left + a.x * k + cam.x, y: r.top + a.y * k + cam.y, figH: a.figH, B: a.B, rx: a.rx, ry: a.ry, prov: names[a.prov] })); })()');
  // fix 6: the controls start folded under Relief; the start view
  out.fold = await mk(() => ({ headMoreOpen: document.getElementById('headMore').open, tryListVisible: !!document.getElementById('tryListRelief').offsetParent, mapTop: Math.round(document.getElementById('map').getBoundingClientRect().top), Dpx: window.__mock.reliefLayout().Dpx, band: window.__mock.band() }));
  // fix 1: hit boxes against the piece's own base and figure; what the pointer finds over a piece's empty corners
  const A = await arm();
  out.hit = await mk((A) => A.map((a) => { const e = [...document.querySelectorAll('#layer .mini:not(.fanned)')].find((el) => el.querySelector('.hit') && Math.abs(el.querySelector('.hit').getBoundingClientRect().left + el.querySelector('.hit').getBoundingClientRect().width / 2 - a.x) < 3); if (!e) return { key: a.key, found: false }; const h = e.querySelector('.hit').getBoundingClientRect(), box = e.getBoundingClientRect(); const corner = document.elementFromPoint(box.left + 2, box.top + 2); return { prov: a.prov, kind: a.kind, base: +(2 * a.rx).toFixed(1), figH: +a.figH.toFixed(1), hit: [Math.round(h.width), Math.round(h.height)], el: [Math.round(box.width), Math.round(box.height)], cornerHits: corner ? corner.id || corner.className : null }; }), A);
  // fix 2: zoom drift, sampled inside the 140 ms wheel window
  const drift = async () => mk(() => { const m = window.__mock; const L = m.ev('RL_PIECE_CACHE.get("L")'); const res = []; for (const a of L.armies) { const ent = m.ev(`RL_PIECE_DOM.get(${JSON.stringify(a.key)})`); if (!ent || ent.el.style.display === 'none') continue; const cv = ent.cv, r = ent.el.getBoundingClientRect(); const elG = [r.left + Number(cv.dataset.ox), r.top + Number(cv.dataset.oy)]; const s = m.ev('cam.s'), cr = m.ev('canvas.getBoundingClientRect()'); const want = [cr.left + (a.x / L.s) * s + m.ev('cam.x'), cr.top + (a.y / L.s) * s + m.ev('cam.y')]; res.push(Math.hypot(elG[0] - want[0], elG[1] - want[1])); } return { s: +m.ev('cam.s').toFixed(3), sLay: +L.s.toFixed(3), n: res.length, maxOff: +Math.max(...res).toFixed(2) }; });
  out.drift = { rest: await drift(), during: [] };
  const v = A.find((a) => a.ids.includes('varo')); await p.mouse.move(v.x + 150, v.y + 80);
  for (let k = 0; k < 8; k++) { await p.mouse.wheel(0, -120); await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => r()))); out.drift.during.push(await drift()); }
  await p.waitForTimeout(700); out.drift.after = await drift();
  await ev('fitToCloth(); RCK = null; draw()'); await p.waitForTimeout(500);
  // a right-click at the lower left corner: what element is there
  out.lowerLeft = await mk(() => { const e = document.elementFromPoint(8, innerHeight - 8); return e ? (e.id || e.className || e.tagName) : null; });
  // link hover names the province on the land
  await mk(() => document.getElementById('railFeed').click()); await p.waitForTimeout(400);
  const links = await mk(() => [...document.querySelectorAll('#msgs .link')].map((e) => { const r = e.getBoundingClientRect(); return [r.left + 4, r.top + r.height / 2, e.textContent, r.width > 0]; }));
  out.linkHover = [];
  for (const [x, y, t, vis] of links.slice(0, 4)) { if (!vis) { out.linkHover.push([t, 'hidden']); continue; } await p.mouse.move(x, y); await p.waitForTimeout(300); out.linkHover.push([t, await ev('RL_LINK.prov >= 0 ? names[RL_LINK.prov] : null'), await mk(() => window.__mock.reliefLayout().names), await mk(() => window.__mock.ev('RL_PIECE_CACHE.get("L").labels.map((l) => names[l.i]).join(",")'))]); }
  await p.mouse.move(700, 108); await p.waitForTimeout(300); await mk(() => document.getElementById('railFeed').click()); await p.waitForTimeout(300);
  // fix 4: seats at the start view and the event markers that stay
  const seats = () => ev('(() => { const L = RL_PIECE_CACHE.get("L"); const c = {}; for (const [i, st] of L.seats) { const k = st.kind || "none"; c[k] = (c[k] || 0) + 1; } return { Dpx: +L.Dpx.toFixed(1), counts: c, events: L.events.map((e) => names[e.p.i] + ":" + [e.p.siege ? "siege" : "", e.p.pillage ? "pillage" : "", e.p.scar || "", e.p.unrest >= 50 ? "unrest" : "", (e.p.fx || []).length ? "fx" : ""].filter(Boolean).join("+")), guards: L.guards.length, guardsPerProv: Object.values(L.guards.reduce((o, g) => ((o[g.i] = (o[g.i] || 0) + 1), o), {})), towns: [...L.seats.values()].filter((s) => s.kind === "town").map((s) => +s.T.toFixed(1)) }; })()');
  out.seats = { start: await seats() };
  for (const [k, s] of [['far', 'min'], ['d100', 'D100'], ['d115', 'D115'], ['d135', 'D135'], ['mid1', 1.0], ['d290', 'D290'], ['d310', 'D310'], ['near', 'max09'], ['max', 'max']]) {
    await mk((s) => { const m = window.__mock; const D1 = m.ev('RL_PIECE_CACHE.get("L").Dpx') / m.scale(); const sc = s === 'min' ? m.minScale() : s === 'max' ? m.maxScale() : s === 'max09' ? m.maxScale() * 0.9 : typeof s === 'string' ? Number(s.slice(1)) / D1 : s; m.setScale(sc, 640, 480); }, s);
    out.seats[k] = await seats();
  }
  await ev('fitToCloth(); RCK = null; draw()'); await p.waitForTimeout(400);
  // fix 12: static re-render time at Near and the worst frame of a fast pan (noisy: shared machine, software raster)
  out.fix12 = await mk(async () => { const m = window.__mock; m.setScale(m.maxScale() * 0.9, 620, 470); const t = []; for (let k = 0; k < 5; k++) { const t0 = performance.now(); m.ev('RCK = null; draw()'); t.push(+(performance.now() - t0).toFixed(1)); } const pan = await new Promise((res) => { const fr = []; let k = 0, last = 0; const step = (now) => { if (last) fr.push(now - last); last = now; if (k++ > 90) { res({ worst: +Math.max(...fr).toFixed(1), p95: +[...fr].sort((a, b) => a - b)[Math.floor(fr.length * 0.95)].toFixed(1), p50: +[...fr].sort((a, b) => a - b)[Math.floor(fr.length * 0.5)].toFixed(1) }); return; } m.ev('cam.x -= 14; clampCam(); draw()'); requestAnimationFrame(step); }; requestAnimationFrame(step); }); return { rerenderNearMs: t, fastPan: pan, smoothing: m.ev('RREB.why') }; });
  await ev('fitToCloth(); RCK = null; draw()'); await p.waitForTimeout(400);
  await p.context().close();
  // fix 1, touch: a real long-press (CDP touch events) on Ilsa's piece with Varo selected; a touch pan that starts on a piece
  p = await open(b, PAGE, { errors, touch: true });
  const cdp = await p.context().newCDPSession(p);
  const A2 = await (async () => p.evaluate(() => window.__mock.ev('(() => { const L = RL_PIECE_CACHE.get("L"); const r = canvas.getBoundingClientRect(), k = cam.s / L.s; return L.armies.map((a) => ({ ids: a.ids, x: r.left + a.x * k + cam.x, y: r.top + a.y * k + cam.y - a.figH * 0.5 })); })()')))();
  const il = A2.find((a) => a.ids.includes('ilsa')); await p.evaluate(() => window.__mock.ev("selectCmd('varo'); moveLine = null; draw()"));
  out.touch = { target: await p.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e.className; }, [il.x, il.y]) };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: il.x, y: il.y, id: 1 }] }); await p.waitForTimeout(900);
  out.touch.longPress = await p.evaluate(() => window.__mock.ev('moveLine ? moveLine.path.map((i) => names[i]).join(">") : null'));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(300);
  const cx0 = await p.evaluate(() => window.__mock.ev('cam.x'));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: il.x, y: il.y, id: 2 }] });
  for (let k = 1; k <= 8; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: il.x - 12 * k, y: il.y, id: 2 }] }); await p.waitForTimeout(16); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(300);
  out.touch.panFromPiece = [cx0, await p.evaluate(() => window.__mock.ev('cam.x')), 'expect -96'];
  await p.context().close();
  // fix 11: the final day chip on the model and clear of the ribbon at several sizes, and 1920 resized to 1280
  out.chip = {};
  for (const [w, h, rw, rh] of [[1280, 720], [1440, 900], [1024, 768], [1366, 768], [1920, 1080], [1920, 1080, 1280, 720]]) {
    p = await open(b, PAGE, { errors, w, h });
    if (rw) { await p.setViewportSize({ width: rw, height: rh }); await p.waitForTimeout(1500); }
    await p.evaluate(() => window.__mock.ev("selectCmd('varo')")); const t = await p.evaluate(() => window.__mock.across()); const [x, y] = await p.evaluate((n) => window.__mock.at(n), t);
    await p.mouse.click(x, y + 6, { button: 'right' }); await p.mouse.move(5, (rh || h) - 10); await p.waitForTimeout(700);
    out.chip[`${w}x${h}${rw ? '->' + rw + 'x' + rh : ''}`] = await p.evaluate(() => { const m = window.__mock, cr = m.ev('canvas.getBoundingClientRect()'), [mx0, my0] = m.ev('toScreen(0, 0)'), [mx1, my1] = m.ev('toScreen(W, H)'), rb = document.getElementById('ribbon').getBoundingClientRect(), chips = m.ev('RL_THREAD_CHIPS.list'); if (!chips.length) return 'no chips'; const rib = [rb.left - cr.left, rb.top - cr.top, rb.right - cr.left, rb.bottom - cr.top]; const docks = [...document.querySelectorAll('#leftDock:not([hidden]), #strip, #modes, #topbar, #rail')].map((e) => { const r = e.getBoundingClientRect(); return [e.id, r.left - cr.left, r.top - cr.top, r.right - cr.left, r.bottom - cr.top, r.width > 0]; }); return chips.map((c) => { const q = c.box; return { text: c.text, box: q.map(Math.round), onModel: q[0] >= mx0 + 4 && q[1] >= my0 + 4 && q[2] <= mx1 - 4 && q[3] <= my1 - 4, clearOfRibbon: !(rb.width && q[2] > rib[0] && q[0] < rib[2] && q[3] > rib[1] && q[1] < rib[3]), underUI: docks.filter((d) => d[5] && q[2] > d[1] && q[0] < d[3] && q[3] > d[2] && q[1] < d[4]).map((d) => d[0]) }; }); });
    await p.screenshot({ path: `${__dirname}/shots/chip-${w}x${h}${rw ? '-to-' + rw : ''}.png` });
    await p.context().close();
  }
  out.errors = errors.filter((x) => !/software WebGL|willReadFrequently/.test(x));
  fs.writeFileSync(`${__dirname}/out/probes.json`, JSON.stringify(out, null, 1)); console.log(JSON.stringify(out, null, 1).slice(0, 12000));
  await b.close();
})();
