// Read-only audit harness for the game-screen map mockup (a snapshot copy). Usage:
//   node map-prof.cjs <out.json> [--w 1920 --h 1080 --dpr 1 --touch 0] [--ui-only 0]
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const SNAP = path.join(__dirname, '..', 'snap', 'map', 'game-screen-v4.html');
const D3 = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/vendor-d3/package/dist/d3.min.js';
const PIXI = '/home/user/Fluid-Magic-/node_modules/pixi.js/dist/pixi.min.js';
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const OUT = a[0];
let RESG = null;
const W = +opt('w', 1920), H = +opt('h', 1080), DPR = +opt('dpr', 1), touch = opt('touch', '0') === '1';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--enable-precise-memory-info'] });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, hasTouch: touch, isMobile: opt('mobile', touch ? '1' : '0') === '1' });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\//, (r) => r.fulfill({ path: D3, contentType: 'application/javascript' }));
  await page.route(/cdn\.jsdelivr\.net\/npm\/pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/, (r) => r.fulfill({ path: PIXI, contentType: 'application/javascript' }));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  // long tasks and rAF gaps from the first script on
  await page.addInitScript(() => {
    window.__lt = []; window.__raf = [];
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push([+e.startTime.toFixed(0), +e.duration.toFixed(0)]); }).observe({ type: 'longtask', buffered: true }); } catch (e) { window.__ltErr = String(e); }
    let last = 0; const f = (now) => { if (last) window.__raf.push([+now.toFixed(0), +(now - last).toFixed(1)]); last = now; if (window.__raf.length < 20000) requestAnimationFrame(f); }; requestAnimationFrame(f);
  });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable');
  const tNav = Date.now();
  await page.goto('file://' + SNAP, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => window.__mock && window.__mock.ev('RB.ready && (FIGS.ready || !!FIGS.err)'), null, { timeout: 180000, polling: 250 });
  await page.waitForTimeout(800);
  const res = { viewport: `${W}x${H}@${DPR}${touch ? ' touch' : ''} mobile=${opt('mobile', touch ? '1' : '0')}`, loadToReadyWallMs: Date.now() - tNav, errors };
  RESG = res;
  res.ready = await page.evaluate(() => {
    const ev = window.__mock.ev;
    const t = ev('rlTimes()');
    const readyAt = ev('window.__rlReadyMs + T_START');
    const lt = window.__lt.filter((x) => x[0] <= readyAt + 50);
    const gaps = window.__raf.filter((x) => x[0] <= readyAt + 50).map((x) => x[1]).sort((p, q) => p - q);
    const q = (arr, p) => arr.length ? arr[Math.min(arr.length - 1, Math.floor(p * arr.length))] : null;
    return { rlTimes: t, readyAtMs: Math.round(readyAt), provinces: ev('provs.length'), N: ev('N'), bakeTexels: ev('[RB.HW, RB.HH, RB.TX, W, H]'),
      longTasksBeforeReady: { n: lt.length, maxMs: lt.length ? Math.max(...lt.map((x) => x[1])) : 0, sumMs: lt.reduce((s, x) => s + x[1], 0), over50: lt.filter((x) => x[1] > 50).length, top: lt.sort((p, q2) => q2[1] - p[1]).slice(0, 8) },
      rafBeforeReady: { frames: gaps.length, p50: q(gaps, 0.5), p95: q(gaps, 0.95), max: gaps.length ? gaps[gaps.length - 1] : null, over33: gaps.filter((g) => g > 33.4).length },
      phone: ev("app.classList.contains('phone')"), innerWidth: window.innerWidth, band: ev('bandOf(cam.s)'), scale: ev('cam.s'), minScale: ev('minScale'), maxScale: ev('maxScale'), MED: ev('MED_DIAM') };
  });
  // the second look (Clear) baked while the map is interactive: long tasks and rAF gaps while it runs
  res.secondLook = await page.evaluate(async () => {
    const ev = window.__mock.ev; const t0 = performance.now(); const lt0 = window.__lt.length, r0 = window.__raf.length;
    window.__mock.setTerrain('clear');
    while (!ev("rlLookReady('clear')") && performance.now() - t0 < 60000) await new Promise((r) => setTimeout(r, 100));
    const t1 = performance.now();
    const lt = window.__lt.slice(lt0), gaps = window.__raf.slice(r0).filter((x) => x[0] <= t1).map((x) => x[1]).sort((p, q) => p - q);
    const out = { wallMs: Math.round(t1 - t0), cpu: ev("RB.L.clear && RB.L.clear.cpu"), longTasks: lt.length, longMax: lt.length ? Math.max(...lt.map((x) => x[1])) : 0, rafMax: gaps.length ? gaps[gaps.length - 1] : null, rafP50: gaps.length ? gaps[gaps.length >> 1] : null, framesOver33: gaps.filter((g) => g > 33.4).length, frames: gaps.length };
    window.__mock.setTerrain('natural'); await new Promise((r) => setTimeout(r, 400));
    return out;
  });
  // static re-render cost per zoom band, the pan blit, the settle, selection and hover
  res.bands = await page.evaluate(async () => {
    const ev = window.__mock.ev, M = window.__mock;
    const cap = ev('names[redCap]');
    const lo = M.minScale(), hi = M.maxScale(), out = [];
    // find band edges by scanning scales
    const scan = []; for (let k = 0; k <= 40; k++) { const s = lo * Math.pow(hi / lo, k / 40); M.zoomTo(s, cap); scan.push([+s.toFixed(4), M.band()]); }
    const bands = [...new Set(scan.map((x) => x[1]))];
    for (const b of bands) {
      const ss = scan.filter((x) => x[1] === b).map((x) => x[0]); const s = ss[Math.floor(ss.length / 2)];
      M.zoomTo(s, cap); await new Promise((r) => setTimeout(r, 50));
      // re-renders at this band: three nearby scales (each is a 'scale' re-render of the static cache)
      const rs = [];
      for (const f of [1.01, 1.02, 1.03]) { const n0 = ev('RREB.n'), m0 = ev('RREB.ms'); const t0 = performance.now(); M.zoomTo(s * f, cap); const dt = performance.now() - t0; rs.push({ drawMs: +dt.toFixed(1), staticMs: +(ev('RREB.ms') - m0).toFixed(1), rerenders: ev('RREB.n') - n0 }); }
      M.zoomTo(s, cap); await new Promise((r) => setTimeout(r, 30));
      const panIn = M.pan(2, 0, 20); // inside the cache: a blit
      const n0 = ev('RREB.n'), m0 = ev('RREB.ms');
      const panOut = M.pan(60, 0, 20); // leaves the 35% margin: re-renders
      const panOutRe = ev('RREB.n') - n0, panOutStaticMs = +(ev('RREB.ms') - m0).toFixed(1);
      M.zoomTo(s, cap);
      // a selection change re-renders the static cache (state.sel is in its signature)
      const n1 = ev('RREB.n'), m1 = ev('RREB.ms'); let t0 = performance.now(); ev('selectProv(redCap)'); ev('draw()'); const selMs = performance.now() - t0; const selRe = ev('RREB.n') - n1, selStatic = +(ev('RREB.ms') - m1).toFixed(1);
      t0 = performance.now(); ev('clearSel()'); ev('draw()'); const clrMs = performance.now() - t0;
      // hover a province: draw with a hovered province (no static re-render expected)
      const n2 = ev('RREB.n'); t0 = performance.now(); for (let k = 0; k < 10; k++) { ev('hoverProv = ' + (k + 3)); ev('draw()'); } const hovMs = (performance.now() - t0) / 10; const hovRe = ev('RREB.n') - n2; ev('hoverProv = -1');
      const sig = ev('(() => { const t = performance.now(); for (let k = 0; k < 200; k++) rlStaticSig(); return (performance.now() - t) / 200; })()');
      const clamp = ev('(() => { const t = performance.now(); for (let k = 0; k < 200; k++) clampCam(); return (performance.now() - t) / 200; })()');
      const presentMs = ev('(() => { const t = performance.now(); for (let k = 0; k < 30; k++) present(performance.now() + k * 33); return { ms: (performance.now() - t) / 30, live: ambienceOn() }; })()');
      out.push({ band: b, scale: s, dpx: +(s * ev('MED_DIAM')).toFixed(0), rerender: rs, panInsideMsPerFrame: +panIn.toFixed(2), panOutsideMsPerFrame: +panOut.toFixed(2), panOutsideRerenders: panOutRe, panOutsideStaticMs: panOutStaticMs,
        selectMs: +selMs.toFixed(1), selectRerenders: selRe, selectStaticMs: selStatic, clearSelMs: +clrMs.toFixed(1), hoverDrawMs: +hovMs.toFixed(2), hoverRerenders: hovRe, staticSigMs: +sig.toFixed(3), clampCamMs: +clamp.toFixed(3), ambiencePresentMs: +presentMs.ms.toFixed(2), ambienceLive: presentMs.live });
    }
    return { scan, bands: out };
  });
  // forced layouts during a pan inside the cache (60 frames on rAF): layout count and time from CDP
  const m0 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
  const pan = await page.evaluate(() => window.__mock.panStats ? window.__mock.panStats(3, 60) : window.__mock.panFps(3, 60));
  const m1 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
  res.panRaf = { result: pan, layoutCount: m1.LayoutCount - m0.LayoutCount, layoutMs: +((m1.LayoutDuration - m0.LayoutDuration) * 1000).toFixed(1), recalcStyleCount: m1.RecalcStyleCount - m0.RecalcStyleCount, recalcMs: +((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000).toFixed(1), scriptMs: +((m1.ScriptDuration - m0.ScriptDuration) * 1000).toFixed(0), taskMs: +((m1.TaskDuration - m0.TaskDuration) * 1000).toFixed(0) };
  // CPU profile of static re-renders at the start band
  await page.evaluate(() => { const M = window.__mock, ev = M.ev; M.zoomTo(ev('startScale()'), ev('names[redCap]')); });
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start');
  res.profiledRerenders = await page.evaluate(() => { const M = window.__mock, ev = M.ev, s = ev('cam.s'), cap = ev('names[redCap]'); const m0 = ev('RREB.ms'), n0 = ev('RREB.n'); for (let k = 1; k <= 6; k++) M.zoomTo(s * (1 + k * 0.004), cap); return { n: ev('RREB.n') - n0, msEach: +((ev('RREB.ms') - m0) / Math.max(1, ev('RREB.n') - n0)).toFixed(1), band: M.band() }; });
  const { profile } = await cdp.send('Profiler.stop');
  { const byId = new Map(profile.nodes.map((n) => [n.id, n])); const self = new Map(); let total = 0;
    for (let i = 0; i < profile.samples.length; i++) { const n = byId.get(profile.samples[i]); const d = profile.timeDeltas[i] || 0; total += d; const cf = n.callFrame; const k = (cf.functionName || '(anon)') + ':' + (cf.lineNumber + 1); self.set(k, (self.get(k) || 0) + d); }
    res.rerenderSelfTop = [...self.entries()].sort((x, y) => y[1] - x[1]).slice(0, 30).map(([k, v]) => [k, +(v / 1000).toFixed(1), +(100 * v / total).toFixed(1)]); }
  // a month change (an event): its cost
  res.month = await page.evaluate(() => { const ev = window.__mock.ev; const n0 = ev('RREB.n'), m0 = ev('RREB.ms'); const t0 = performance.now(); window.__mock.setMonth(4); ev('draw()'); return { ms: +(performance.now() - t0).toFixed(1), rerenders: ev('RREB.n') - n0, staticMs: +(ev('RREB.ms') - m0).toFixed(1) }; });
  // ---------------------------------------------------------------- UI checks
  res.ui = await page.evaluate(() => {
    const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth && !e.closest('[hidden]'); };
    const sel = 'button, a[href], input, select, textarea, summary, [tabindex], [role="button"], .hit';
    const els = [...document.querySelectorAll(sel)].filter(vis).filter((e) => !e.closest('header.page-head, #mockctl'));
    const desc = (e) => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '') + (e.getAttribute('aria-label') ? `[${e.getAttribute('aria-label').slice(0, 30)}]` : '');
    const small = els.map((e) => { const r = e.getBoundingClientRect(); return { d: desc(e), w: Math.round(r.width), h: Math.round(r.height) }; }).filter((x) => Math.min(x.w, x.h) < 44);
    const group = (arr) => { const m = new Map(); for (const x of arr) { const k = x.d.replace(/\[.*\]$/, '').replace(/#[\w-]+/, ''); const v = m.get(k) || { n: 0, w: x.w, h: x.h, ex: x.d }; v.n++; m.set(k, v); } return [...m.entries()].map(([k, v]) => ({ sel: k, n: v.n, size: v.w + 'x' + v.h, ex: v.ex })).sort((p, q) => p.size.localeCompare(q.size)); };
    // CSS rules that give :focus-visible the same look as :hover, or remove the outline
    const same = [], none = [];
    for (const ss of document.styleSheets) { let rules; try { rules = ss.cssRules; } catch { continue; } for (const r of rules) { if (!r.selectorText) continue; const s = r.selectorText; if (/:focus/.test(s) && /:hover/.test(s)) same.push(s.slice(0, 120) + ' { ' + r.style.cssText.slice(0, 90) + ' }'); if (/:focus/.test(s) && /outline:\s*none/.test(r.style.cssText)) none.push(s.slice(0, 120)); } }
    const sa = [...document.querySelectorAll('*')].filter((e) => { const cs = getComputedStyle(e); return /safe-area/.test(e.getAttribute('style') || ''); }).length;
    let saRules = []; for (const ss of document.styleSheets) { let rules; try { rules = ss.cssRules; } catch { continue; } for (const r of rules) { const t = r.cssText || ''; if (/safe-area-inset/.test(t)) saRules.push(t.slice(0, 160)); if (r.cssRules) for (const q of r.cssRules) if (/safe-area-inset/.test(q.cssText || '')) saRules.push((q.cssText || '').slice(0, 160)); } }
    const rm = []; for (const ss of document.styleSheets) { let rules; try { rules = ss.cssRules; } catch { continue; } for (const r of rules) if (r.media && /reduced-motion/.test(r.media.mediaText)) rm.push(r.cssText.slice(0, 200)); }
    let anims = 0; for (const ss of document.styleSheets) { let rules; try { rules = ss.cssRules; } catch { continue; } for (const r of rules) { const t = r.cssText || ''; if (/animation:|transition:/.test(t) && !/none/.test(t)) anims++; } }
    const speed = [...document.querySelectorAll('#speed button')].map((b) => ({ label: b.getAttribute('aria-label'), pressed: b.getAttribute('aria-pressed'), on: b.classList.contains('on'), w: Math.round(b.getBoundingClientRect().width), h: Math.round(b.getBoundingClientRect().height) }));
    const modes = [...document.querySelectorAll('.modebtn')].filter(vis).map((b) => ({ m: b.dataset.m, on: b.classList.contains('on'), pressed: b.getAttribute('aria-pressed'), label: b.getAttribute('aria-label') || b.title || b.textContent.trim().slice(0, 12) }));
    return { interactiveVisible: els.length, under44: small.length, under34: small.filter((x) => Math.min(x.w, x.h) < 34).length, under24: small.filter((x) => Math.min(x.w, x.h) < 24).length, smallGroups: group(small).slice(0, 40),
      focusSameAsHoverRules: same, focusOutlineNoneRules: none, safeAreaRules: saRules, reducedMotionRules: rm, animatedRules: anims, speed, modes, hasViewportMeta: !!document.querySelector('meta[name="viewport"]') };
  });
  // keyboard: tab order from the top, then the Codex modal (F): does Tab stay inside, do shortcuts leak, is focus restored on Escape
  await page.evaluate(() => { document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0); });
  const tabs = [];
  for (let k = 0; k < 40; k++) { await page.keyboard.press('Tab'); tabs.push(await page.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return 'body'; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return (e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.split(' ')[0] : '') + (e.getAttribute('aria-label') ? '[' + e.getAttribute('aria-label').slice(0, 24) + ']' : '')) + ` ${Math.round(r.width)}x${Math.round(r.height)} outline:${cs.outlineStyle}/${cs.outlineWidth} bg:${cs.backgroundColor}` + (e.closest('header.page-head') ? ' (mockup header)' : ''); })); }
  res.tabOrder = tabs;
  await page.evaluate(() => document.getElementById('btnF').focus());
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  const modal = { openedFocus: await page.evaluate(() => { const e = document.activeElement; return (e.tagName + (e.getAttribute('aria-label') ? '[' + e.getAttribute('aria-label') + ']' : '')) + ' insideModal=' + !!e.closest('#modal'); }) };
  let outside = 0; const seen = [];
  for (let k = 0; k < 30; k++) { await page.keyboard.press('Tab'); const r = await page.evaluate(() => { const e = document.activeElement; return [!!(e && e.closest('#modal')), e ? e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.split(' ')[0] : '') : 'none']; }); if (!r[0]) { outside++; if (seen.length < 6) seen.push(r[1]); } }
  modal.tabStopsOutsideModalOf30 = outside; modal.outsideExamples = seen;
  const paused0 = await page.evaluate(() => window.__mock.ev('state.paused'));
  await page.evaluate(() => document.querySelector('#modal [data-close]').focus());
  await page.keyboard.press('KeyM'); // cycle the map mode under the modal?
  await page.keyboard.press('Digit3');
  modal.shortcutsLeak = await page.evaluate((p0) => ({ mode: window.__mock.ev('state.mode'), speed: window.__mock.ev('state.speed'), pausedBefore: p0 }), paused0);
  await page.keyboard.press('Escape'); await page.waitForTimeout(100);
  modal.focusAfterEscape = await page.evaluate(() => { const e = document.activeElement; return e ? e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') : 'none'; });
  res.modal = modal;
  fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
  await browser.close();
})().catch((e) => { console.error(e); if (RESG) { RESG.fatal = String(e && e.message || e); fs.writeFileSync(OUT, JSON.stringify(RESG, null, 1)); } process.exit(1); });
