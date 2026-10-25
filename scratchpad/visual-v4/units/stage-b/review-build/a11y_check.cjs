// Accessibility checks on a stage-b review page. Usage: node a11y_check.cjs <page.html> <out.json>
// Real Tab walk from the top, target sizes, state-marker contrast under deutan/protan (Machado 2009 + CIEDE2000, as
// src/00-util.js and the repo's tests/content/colorMath.ts), the lightbox's focus handling, and sideways scroll.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const PAGE = process.argv[2], OUT = process.argv[3];

const CVD = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
};
const clamp = (v) => Math.min(1, Math.max(0, v));
function labAs([R, G, B], vision) {
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  let rgb = [lin(R), lin(G), lin(B)];
  if (vision !== 'normal') { const m = CVD[vision]; rgb = m.map((row) => clamp(row[0] * rgb[0] + row[1] * rgb[1] + row[2] * rgb[2])); }
  const [r, g, b] = rgb;
  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047, y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b, z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
  const f = (q) => (q > 216 / 24389 ? Math.cbrt(q) : ((24389 / 27) * q + 16) / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}
function dE([L1, a1, b1], [L2, a2, b2]) {
  const rad = Math.PI / 180, C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cbar = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cbar ** 7 / (Cbar ** 7 + 25 ** 7))), a1p = (1 + G) * a1, a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2), hue = (a, b) => (a === 0 && b === 0 ? 0 : (Math.atan2(b, a) / rad + 360) % 360);
  const h1p = hue(a1p, b1), h2p = hue(a2p, b2);
  let dhp = 0; if (C1p * C2p !== 0) { dhp = h2p - h1p; if (dhp > 180) dhp -= 360; else if (dhp < -180) dhp += 360; }
  const dLp = L2 - L1, dCp = C2p - C1p, dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * rad), Lbp = (L1 + L2) / 2, Cbp = (C1p + C2p) / 2;
  let hbp = h1p + h2p; if (C1p * C2p !== 0) { if (Math.abs(h1p - h2p) > 180) hbp += h1p + h2p < 360 ? 360 : -360; hbp /= 2; }
  const T = 1 - 0.17 * Math.cos((hbp - 30) * rad) + 0.24 * Math.cos(2 * hbp * rad) + 0.32 * Math.cos((3 * hbp + 6) * rad) - 0.2 * Math.cos((4 * hbp - 63) * rad);
  const dTh = 30 * Math.exp(-(((hbp - 275) / 25) ** 2)), Rc = 2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lbp - 50) ** 2) / Math.sqrt(20 + (Lbp - 50) ** 2), Sc = 1 + 0.045 * Cbp, Sh = 1 + 0.015 * Cbp * T, Rt = -Math.sin(2 * dTh * rad) * Rc;
  return Math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh));
}
const rgbOf = (s) => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
const dEby = (a, b) => Object.fromEntries(['normal', 'deutan', 'protan'].map((v) => [v, +dE(labAs(rgbOf(a), v), labAs(rgbOf(b), v)).toFixed(1)]));

const DESC = `(e) => { if (!e || e === document.body) return 'body'; const c = typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\\s+/).slice(0, 2).join('.') : '';
  const row = e.closest('.vrow'); return e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + c + (row ? '@' + row.dataset.key : '') + (e.dataset && e.dataset.v ? '=' + e.dataset.v : ''); }`;

async function tabWalk(page, max) {
  await page.reload({ waitUntil: 'load' }); // a fresh load: the focus start is the top of the document
  const seq = [];
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    const d = await page.evaluate(`(() => { const e = document.activeElement; if (!e || e === document.body) return 'body'; if (e.dataset.walked) return 'CYCLE'; e.dataset.walked = '1';
      return (${DESC})(e) + ' "' + (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 24) + '"' + (e.closest('.verdict') ? ' [verdict]' : ''); })()`);
    if (d === 'body' || d === 'CYCLE') break;
    seq.push(d);
  }
  await page.evaluate(() => { for (const e of document.querySelectorAll('[data-walked]')) delete e.dataset.walked; });
  const idx = (re) => { const i = seq.findIndex((s) => re.test(s)); return i < 0 ? null : i + 1; };
  return { stops: seq.length, firstPick: idx(/vbtn/), firstVerdict: idx(/\[verdict\]/), copy: idx(/#copy/), imgStops: seq.filter((s) => s.startsWith('img')).length, zbStops: seq.filter((s) => s.startsWith('button.zb')).length, head: seq.slice(0, 22) };
}

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const out = { page: PAGE };
  for (const [tag, vp, mobile] of [['w390', { width: 390, height: 844 }, true], ['w1440', { width: 1440, height: 900 }, false]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, hasTouch: mobile, isMobile: mobile });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await page.goto('file://' + PAGE, { waitUntil: 'load', timeout: 120000 });
    await page.evaluate(() => { try { localStorage.clear(); } catch { /* blocked */ } });
    await page.reload({ waitUntil: 'load' });
    const r = { errors };
    r.walk = await tabWalk(page, 700);
    // skip link: the first Tab, Enter, then Tabs to Copy verdict
    {
      await page.reload({ waitUntil: 'load' });
      await page.keyboard.press('Tab');
      const first = await page.evaluate(`(${DESC})(document.activeElement) + ' ' + (document.activeElement.textContent || '').trim().slice(0, 30)`);
      const skip = { first };
      if (/skip/i.test(first)) {
        skip.firstBox = await page.evaluate(() => { const b = document.activeElement.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)]; });
        await page.keyboard.press('Enter'); await page.waitForTimeout(150);
        skip.after = await page.evaluate(`(${DESC})(document.activeElement)`);
        skip.verdictTop = await page.evaluate(() => Math.round(document.getElementById('verdict').getBoundingClientRect().top));
        let n = 0, d = '';
        for (; n < 80; ) { await page.keyboard.press('Tab'); n++; d = await page.evaluate(`(${DESC})(document.activeElement)`); if (d.includes('#copy')) break; }
        skip.tabsToCopy = d.includes('#copy') ? n : null;
      }
      r.skip = skip;
    }
    // target sizes (hidden-until-focus controls are measured while focused)
    r.targets = await page.evaluate(() => {
      const sel = 'button, a[href], input, select, textarea, summary';
      const m = new Map();
      for (const e of document.querySelectorAll(sel)) {
        if (e.closest('#lb')) continue;
        const fold = e.closest('details'); if (fold && !fold.open && e.tagName !== 'SUMMARY') continue; // folded away: not reachable
        let b = e.getBoundingClientRect();
        if (!(b.width > 0 && b.height > 0)) continue;
        if (b.width <= 2 || b.height <= 2) { e.focus(); b = e.getBoundingClientRect(); e.blur(); }
        const k = e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/)[0] : '') + (e.closest('nav.toc') ? ' (toc)' : e.closest('.answers') ? ' (answers)' : e.closest('.mockline') ? ' (mockup)' : '');
        const v = m.get(k) || { n: 0, minH: 1e9, minW: 1e9 }; v.n++; v.minH = Math.min(v.minH, Math.round(b.height)); v.minW = Math.min(v.minW, Math.round(b.width)); m.set(k, v);
      }
      return [...m.entries()].map(([k, v]) => ({ sel: k, ...v })).sort((a, b) => a.minH - b.minH);
    });
    // state markers
    r.markers = await page.evaluate(() => {
      const pe = (el, p) => { const s = getComputedStyle(el, p); return { content: s.content, color: s.color, bg: s.backgroundColor, border: s.borderTopWidth + ' ' + s.borderTopStyle, radius: s.borderRadius, w: s.width, h: s.height }; };
      const ok = document.querySelector('ul.stat li.ok, ul.stat li:not(.flaw)'), flaw = document.querySelector('ul.stat li.flaw');
      const b = document.querySelector('.vrow[data-key="troops"] .vbtn[data-v="Keep"]');
      const un = { ...pe(b), before: pe(b, '::before').content, outline: getComputedStyle(b).boxShadow };
      b.setAttribute('aria-pressed', 'true');
      const pr = { ...pe(b), before: pe(b, '::before').content, outline: getComputedStyle(b).boxShadow, box: [Math.round(b.getBoundingClientRect().width), Math.round(b.getBoundingClientRect().height)] };
      b.setAttribute('aria-pressed', 'false');
      return { ok: pe(ok, '::before'), flaw: pe(flaw, '::before'), pickUnpressed: un, pickPressed: pr };
    });
    r.markers.okFlawDE = dEby(r.markers.ok.content.length > 2 || r.markers.ok.bg === 'rgba(0, 0, 0, 0)' ? r.markers.ok.color : r.markers.ok.bg, r.markers.flaw.content.length > 2 || r.markers.flaw.bg === 'rgba(0, 0, 0, 0)' ? r.markers.flaw.color : r.markers.flaw.bg);
    { // WCAG contrast of each marker against its row's background, normal and deutan (non-text contrast wants 3:1)
      const bg = await page.evaluate(() => getComputedStyle(document.querySelector('ul.stat').closest('.troop')).backgroundColor);
      const lum = (c, v) => { let rgb = rgbOf(c).map((x) => { x /= 255; return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); if (v !== 'normal') { const m = CVD[v]; rgb = m.map((row) => clamp(row[0] * rgb[0] + row[1] * rgb[1] + row[2] * rgb[2])); } return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]; };
      const cr = (a, b, v) => { const x = lum(a, v), y = lum(b, v); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2); };
      const col = (m) => (m.bg === 'rgba(0, 0, 0, 0)' ? m.color : m.bg);
      r.markers.vsBackground = { bg, ok: { normal: cr(col(r.markers.ok), bg, 'normal'), deutan: cr(col(r.markers.ok), bg, 'deutan') }, flaw: { normal: cr(col(r.markers.flaw), bg, 'normal'), deutan: cr(col(r.markers.flaw), bg, 'deutan') } };
    }
    r.markers.okFlawShapeDiffers = r.markers.ok.content !== r.markers.flaw.content || r.markers.ok.radius !== r.markers.flaw.radius || r.markers.ok.border !== r.markers.flaw.border;
    // lightbox, opened from the keyboard
    {
      const hasZb = await page.evaluate(() => !!document.querySelector('.zb'));
      const opener = hasZb ? '.subj .zb' : 'img.z';
      await page.evaluate((s) => { const e = document.querySelector(s); e.scrollIntoView({ block: 'center' }); e.focus(); }, opener);
      const openerDesc = await page.evaluate(`(${DESC})(document.activeElement)`);
      await page.keyboard.press('Enter'); await page.waitForTimeout(150);
      const lb = { opener: openerDesc, open: await page.evaluate(() => document.getElementById('lb').classList.contains('show')),
        focusOnOpen: await page.evaluate(`(${DESC})(document.activeElement) + (document.activeElement.closest('#lb') ? ' (inside)' : ' (outside)')`) };
      const src0 = await page.evaluate(() => document.querySelector('#lb img').src.slice(-40));
      let outside = 0; const seen = [];
      for (let k = 0; k < 8; k++) { await page.keyboard.press(k % 3 === 2 ? 'Shift+Tab' : 'Tab'); const d = await page.evaluate(`(document.activeElement.closest('#lb') ? '' : 'OUT ') + (${DESC})(document.activeElement)`); seen.push(d); if (d.startsWith('OUT')) outside++; }
      lb.tabsOutsideOf8 = outside; lb.tabSeen = [...new Set(seen)];
      await page.keyboard.press('ArrowRight'); await page.waitForTimeout(80);
      const src1 = await page.evaluate(() => document.querySelector('#lb img').src.slice(-40));
      lb.arrowSteps = src0 !== src1;
      lb.caption = await page.evaluate(() => { const c = document.querySelector('#lb .lbcap'); return c ? c.textContent : null; });
      lb.inert = await page.evaluate(() => document.querySelector('.wrap').inert === true);
      lb.buttons = await page.evaluate(() => [...document.querySelectorAll('#lb button')].filter((b) => b.offsetParent).map((b) => { const r = b.getBoundingClientRect(); return [b.className || b.textContent, Math.round(r.width), Math.round(r.height), Math.round(r.top), Math.round(innerWidth - r.right)]; }));
      await page.keyboard.press('Escape'); await page.waitForTimeout(100);
      lb.closedOnEscape = await page.evaluate(() => !document.getElementById('lb').classList.contains('show'));
      lb.focusAfter = await page.evaluate(`(${DESC})(document.activeElement)`);
      lb.focusReturned = lb.focusAfter === openerDesc;
      lb.inertAfter = await page.evaluate(() => document.querySelector('.wrap').inert === true);
      r.lightbox = lb;
    }
    r.scroll = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    r.focusables = await page.evaluate(() => ({ imgTabIndex0: [...document.querySelectorAll('img')].filter((i) => i.tabIndex >= 0).length, imgs: document.querySelectorAll('img.z').length, imgRoleButton: document.querySelectorAll('img[role="button"]').length, zb: document.querySelectorAll('.zb').length }));
    out[tag] = r;
    await ctx.close();
  }
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
