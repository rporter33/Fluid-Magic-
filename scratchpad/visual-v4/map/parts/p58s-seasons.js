
// ------------------------------------------------------------------ pass 4 (natural/pass4/design-final.md §3): seasons on the land, in Natural only. Clear, the Terrain mode,
// the data modes' colours, Painted (v3) and the wilds' rock and snow never change. R11: the season a game opens in (spring, M1-3; every game opens at M3) is the natural
// bake pixel for pixel. Summer, autumn and winter are derived from it per texel (out = base + (target - base) * a, by cover class, weighted by the land's share of a wild
// texel so the land continued under a range turns with the land outside), made in idle slices (rlRunGen) and read through rlLkFor(look) by every reader of the natural bake.
// The next season's variant is made during the last month of the current one; a jump into an unmade season keeps the shown one ("Preparing winter…" in the legend). A change
// of the shown season cross-fades two cached static layers over 600 ms (no re-render while it runs; instant under reduced motion). In the game a season is a shader uniform.
const RL_SEASON = { // docs/09-balance rows (Map presentation): targets in sRGB, alphas, the limits the checks hold
  fadeMs: 600, dry: '#766E38', grassA: [0, 0.12, 0.30, 0], russet: '#6B4A26', russetA: 0.25, russetShare: 0.10, bark: '#5C5448', barkA: 0.18, strawL: 3, winterField: 0.35,
  winterGrass: { keep: 0.7, dL: 2 }, reedA: 0.30, nearCrown: [1, 1, 1, 0.6], limits: { coreDE: 6, farmAutumn: 9, farmWinter: 8, chroma: 0.10 },
  fields: [null, { 3: 'ripe', 1: 'straw' }, { 3: 'ripe', 7: 'ripe', 1: 'straw+', 6: 'straw+' }, { 1: 'ploughed', 6: 'ploughed', 2: 'fallow', 3: 'fallow', 7: 'fallow' }], // NAT.tones index -> the season's tone ('+': +3 L*)
  frost: { cand: '#929DA6', fS: -0.1, hiQ: 2 / 3, cover: 0.35, a: 0.55 },
};
const RL_SEAS = { shown: 0, gen: null, want: 0, fade: null, made: {}, frost: null, prep: null, n: 0 };
RB.S = {}; // the season variants, each the shape of a look: { img, mb1, mb2 (unwashed), canvas, mip1, mip2 (made when first shown), washKeys, ready }
const rlSeasonWant = () => (P4S.season != null ? P4S.season : p4SeasonOf(curMonth));
const rlSeasonKey = () => (p4('seasons') ? 's' + RL_SEAS.shown : ''); // joins the static, line, seat-ground and wild-edge keys
function rlLkFor(look) { // the shown look's bake: the season's variant in Natural, else the bake itself (spring, Clear, the Terrain mode)
  const L0 = RB.L[look]; if (look !== 'natural' || !p4('seasons') || !RL_SEAS.shown) return L0; const V = RB.S[RL_SEAS.shown]; if (!V || !V.ready) return L0;
  if (!V.canvas) for (const [c, im] of [['canvas', 'img'], ['mip1', 'mb1'], ['mip2', 'mb2']]) { V[c] = makeCanvas(V[im].width, V[im].height); V[c].getContext('2d').putImageData(V[im], 0, 0); }
  return V;
}
const rlLab2rgb = (lab) => { const o = [0, 0, 0]; rlLabTo(lab[0], lab[1], lab[2], o, 0); return o; };
function* rlSeasonGen(s) { // one variant from the natural bake's unwashed image, the cover classes (p58n), the wilds' land share and classes (p58y)
  const t0 = performance.now(), Lk = RB.L.natural, { BW, BH, TX, LT } = RB, { cls, ftone, cmar } = RB.nat, mw = RB.mw, src = Lk.img.data, out = new ImageData(BW, BH), d = out.data, M = RL_NAT.mat.farmland, SN = RL_SEASON;
  d.set(src); const tone = (t) => (t === 'straw+' ? rlLab2rgb([M.straw[0] + SN.strawL, M.straw[1], M.straw[2]]) : rlLab2rgb(M[t])), TN = RL_NAT.tones, FS = SN.fields[s], wf = s === 3 ? SN.winterField : 1;
  const SH = new Float32Array(9 * 3); for (let t = 1; t <= 8; t++) { const to = FS && FS[t]; if (!to) continue; const a = rlLab2rgb(M[TN[t - 1]]), b = tone(to); for (let c = 0; c < 3; c++) SH[t * 3 + c] = (b[c] - a[c]) * wf; }
  const dry = hex2rgb(SN.dry), rus = hex2rgb(SN.russet), bark = hex2rgb(SN.bark), straw = rlLab2rgb(RL_NAT.mat.swamp.reed).map((v, c) => v + (rlLab2rgb(M.straw)[c] - v) * 0.6), gA = SN.grassA[s];
  const Tco = rlNatT('conifer'), Tre = rlNatT('reed'), KU = 1 / RLK, NC = RL_NAT.crown, WG = SN.winterGrass, dV = (255 / 100) * 1.1 * WG.dL; let changed = 0;
  for (let ty = 0, k = 0; ty < BH; ty++) { const v = ((ty + 0.5) / TX) * KU;
    for (let tx = 0; tx < BW; tx++, k++) { const lt = LT[k]; if (lt === 255) continue; let land = 1, c = cls[k], al = cmar[k] / 255;
      if (lt >= 7) { if (!mw) continue; land = 1 - mw.lf8[k] / 255; if (land <= 0.02 || mw.cls[k] === 255) continue; c = mw.cls[k]; al = mw.cm[k] / 255; } // the land continued under a range
      const o = k * 4, r0 = src[o], g0 = src[o + 1], b0 = src[o + 2]; let r = r0, g = g0, b = b0; const u = ((tx + 0.5) / TX) * KU, ft = ftone[k], gw = (1 - al) * land;
      if (ft && FS && FS[ft]) { r += SH[ft * 3] * gw; g += SH[ft * 3 + 1] * gw; b += SH[ft * 3 + 2] * gw; }
      else if (c === 0 && gw > 0) { if (s === 3) { const Y = 0.3 * r + 0.59 * g + 0.11 * b, q = 1 - (1 - WG.keep) * gw; r = Y + (r - Y) * q + dV * gw; g = Y + (g - Y) * q + dV * gw; b = Y + (b - Y) * q + dV * gw; } else if (gA) { const a = gA * gw; r += (dry[0] - r) * a; g += (dry[1] - g) * a; b += (dry[2] - b) * a; } }
      else if (c === 5 && s === 3 && gw > 0 && r + g + b > 150) { const m = rlVN(Tre, u / 0.9, v / 4.5) * 0.6 + rlFbm(Tre, u / 12 + 7, v / 12, 2) - 0.25, a = SN.reedA * gw * (m <= 0 ? 0 : m >= 0.5 ? 1 : m * 2); r += (straw[0] - r) * a; g += (straw[1] - g) * a; b += (straw[2] - b) * a; } // the reeds toward straw (pools stay dark)
      if (al > 0 && (s === 2 || s === 3) && rlFbm(Tco, u / 22, v / 22, 2) <= 0.25) { // deciduous crowns (conifers stay)
        let a = 0, T = bark; if (s === 3) a = SN.barkA * al * land;
        else { const gu = u / NC, gv = v / NC, iu = Math.floor(gu), iv = Math.floor(gv); let best = 9, bi = 0, bj = 0; for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) { const h = rlH2(iu + ox, iv + oy, 37), rr = 0.55 + 0.35 * rlH2c(h), dx = (gu - (iu + ox + rlH2a(h))) / rr, dy = (gv - (iv + oy + rlH2b(h))) / rr, dd = Math.sqrt(dx * dx + dy * dy); if (dd < best) { best = dd; bi = iu + ox; bj = iv + oy; } }
          if (rlH2c(rlH2(bi, bj, 61)) < SN.russetShare) { a = SN.russetA * al * land; T = rus; } }
        if (a > 0) { r += (T[0] - r) * a; g += (T[1] - g) * a; b += (T[2] - b) * a; } }
      r = r < 0 ? 0 : r > 255 ? 255 : Math.round(r); g = g < 0 ? 0 : g > 255 ? 255 : Math.round(g); b = b < 0 ? 0 : b > 255 ? 255 : Math.round(b);
      if (r !== r0 || g !== g0 || b !== b0) { d[o] = r; d[o + 1] = g; d[o + 2] = b; changed++; } }
    if ((ty & 31) === 31) yield; }
  const mip = (base, F) => { const w = base.width, h = base.height, dst = new ImageData(w, h), dd = dst.data, bd = base.data; dd.set(bd); // the base mip plus the mean change of its F x F block (blocks that do not change keep the base's texels exactly)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let sr = 0, sg = 0, sb = 0, n = 0, any = false; for (let oy = 0; oy < F; oy++) { const row = ((y * F + oy) * BW + x * F) * 4; for (let ox = 0; ox < F; ox++) { const o = row + ox * 4; if (!src[o + 3]) continue; n++; const e0 = d[o] - src[o], e1 = d[o + 1] - src[o + 1], e2 = d[o + 2] - src[o + 2]; if (e0 || e1 || e2) { any = true; sr += e0; sg += e1; sb += e2; } } }
      if (!any || !n) continue; const q = (y * w + x) * 4, cl = (v) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v)); dd[q] = cl(bd[q] + sr / n); dd[q + 1] = cl(bd[q + 1] + sg / n); dd[q + 2] = cl(bd[q + 2] + sb / n); }
    return dst; };
  yield; const mb1 = mip(Lk.mb1, 2); yield; const mb2 = mip(Lk.mb2, 4);
  RB.S[s] = { look: 'natural', season: s, img: out, mb1, mb2, canvas: null, mip1: null, mip2: null, washKeys: null, coreKey: Lk.coreKey, coreHex: Lk.coreHex, ready: true, changed, ms: +(performance.now() - t0).toFixed(1) };
}
function rlSeasonStart(s) { if (RL_SEAS.gen != null || (RB.S[s] && RB.S[s].ready) || !s) return; RL_SEAS.gen = s; const acc = { total: 0, slices: 0, wall: 0 }; renderModes();
  rlRunGen(rlSeasonGen(s), acc, () => { RL_SEAS.made[s] = { cpu: Math.round(acc.total), wall: Math.round(acc.wall), slices: acc.slices }; RL_SEAS.gen = null; RL_SEAS.n++; rlSeasonSync(performance.now()); renderModes(); requestDraw(); }); }
// each draw (p59 rlDraw): shows the wanted season once its variant is ready, keeps at most two variants (the shown one and the next), prefetches the next in the last month
function rlSeasonSync(now) {
  if (!p4('seasons') || !RB.ready || !rlLookReady('natural')) { RL_SEAS.shown = 0; return; } const w = rlSeasonWant();
  if (w !== RL_SEAS.shown) { if (w && !(RB.S[w] && RB.S[w].ready)) { RL_SEAS.prep = w; rlSeasonStart(w); }
    else { if (!view.reduced && RCK && rlShownLook() === 'natural' && state.mode === 'ownership' && cw > 0) { const cv = RL_SEAS.fade && RL_SEAS.fade.cv.width === rlU.width && RL_SEAS.fade.cv.height === rlU.height ? RL_SEAS.fade.cv : makeCanvas(rlU.width, rlU.height); cv.getContext('2d').clearRect(0, 0, cv.width, cv.height); cv.getContext('2d').drawImage(rlU, 0, 0); RL_SEAS.fade = { cv, t0: now, s: RCK.s, ox: RCK.ox, oy: RCK.oy, from: RL_SEAS.shown, to: w, renders: RREB.n }; }
      RL_SEAS.shown = w; RL_SEAS.prep = null; renderModes(); } }
  const keep = new Set([RL_SEAS.shown, (RL_SEAS.shown + 1) % 4, w]); for (const k of Object.keys(RB.S)) if (!keep.has(+k)) delete RB.S[k];
  if (P4S.season == null && curMonth % 3 === 0 && RL_SEAS.gen == null) { const nx = (p4SeasonOf(curMonth) + 1) % 4; if (nx && !RB.S[nx]) rlSeasonStart(nx); } // the next season, in idle slices during the current one's last month
}
function rlSeasonFade(g, blit, now) { // over the new static layer, the old one fading out (the camera unchanged; a move or zoom ends the fade)
  const F = RL_SEAS.fade; if (!F) return; const t = (now - F.t0) / RL_SEASON.fadeMs; if (t >= 1 || !RCK || RCK.s !== F.s || RCK.ox !== F.ox || RCK.oy !== F.oy) { RL_SEAS.fade = null; return; }
  g.save(); g.globalAlpha = 1 - t; blit(F.cv); g.restore(); animating = true;
}
// ---- Winter frost (owner question 2, review only): Mountains provinces, at Mid and Near, on north faces and the upper third of their heights, at most 35% of each
function rlFrostColour() { // the calm candidate (OKLCH C <= 0.10) around #929DA6 that reaches 20 / 12 from every shade of pass 3's snow and from the massif's lit rock, or the best one found
  if (RL_SEAS.frostCol) return RL_SEAS.frostCol; const L = RB.L.natural.img.data, mw = RB.mw, snow = new Map(), rock = new Map(); if (!mw) return (RL_SEAS.frostCol = { hex: RL_SEASON.frost.cand, pass: null, minNormal: null, minCvd: null });
  for (let k = 0; k < mw.lf8.length; k += 3) { if (!mw.lf8[k]) continue; const o = k * 4, key = ((L[o] >> 3) << 10) | ((L[o + 1] >> 3) << 5) | (L[o + 2] >> 3); (mw.snow8[k] > 128 ? snow : rock).set(key, [L[o], L[o + 1], L[o + 2]]); }
  const test = [...snow.values(), ...[...rock.values()].filter((c) => rlLumOf(...c) > 0.06)], score = (c) => { let n = 99, v = 99; for (const q of test) { const e = rlPairDE(c, q); if (e.normal < n) n = e.normal; if (e.cvd < v) v = e.cvd; } return [n, v]; };
  const c0 = rgb2lab(hex2rgb(RL_SEASON.frost.cand)); let best = null;
  for (const dL of [0, -8, 8, -16, 16]) for (const da of [0, -6, 6]) for (const db of [0, -10, -20, 10]) { const c = rlLab2rgb([c0[0] + dL, c0[1] + da, c0[2] + db]); if (rlOk(...c) > RL_SEASON.limits.chroma) continue; const [n, v] = score(c), m = Math.min(n / 20, v / 12); if (!best || m > best.m) best = { hex: rgb2hex(c), minNormal: +n.toFixed(1), minCvd: +v.toFixed(1), m }; if (m >= 1) break; }
  return (RL_SEAS.frostCol = { ...best, pass: best.m >= 1, snowShades: snow.size, rockShades: rock.size, design: { hex: RL_SEASON.frost.cand, normal: score(hex2rgb(RL_SEASON.frost.cand))[0], cvd: score(hex2rgb(RL_SEASON.frost.cand))[1] } });
}
function rlFrostCanvas() { // the frost overlay at bake resolution (alpha), made once
  if (RL_SEAS.frost) return RL_SEAS.frost; const { BW, BH, TX, HW, LT, id, fS, hh } = RB, img = new ImageData(BW, BH), d = img.data, F = RL_SEASON.frost, col = hex2rgb(rlFrostColour().hex), hi = new Float32Array(N).fill(Infinity);
  { const V = new Map(); for (let k = 0; k < hh.length; k++) { const i = RB.hid[k]; if (i !== 255 && terr[i] === 'mountains') { let v = V.get(i); if (!v) V.set(i, (v = [])); v.push(hh[k]); } } for (const [i, v] of V) { v.sort((a, b) => a - b); hi[i] = v[Math.floor(v.length * F.hiQ)]; } } // the upper third of each Mountains province's heights
  const n = new Map(), f = new Map();
  for (let ty = 0, k = 0; ty < BH; ty++) for (let tx = 0; tx < BW; tx++, k++) { if (LT[k] !== 4) continue; const i = id[k]; if (i === 255 || terr[i] !== 'mountains') continue; n.set(i, (n.get(i) ?? 0) + 1); const q = (ty >> 1) * HW + (tx >> 1);
    if (fS[q] < F.fS && hh[q] >= hi[i]) { const o = k * 4; d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = Math.round(255 * F.a * Math.min(1, (F.fS - fS[q]) * 4)); f.set(i, (f.get(i) ?? 0) + 1); } }
  const cover = {}; for (const [i, c] of n) cover[names[i]] = +((f.get(i) ?? 0) / c).toFixed(3);
  const cv = makeCanvas(BW, BH); cv.getContext('2d').putImageData(img, 0, 0); return (RL_SEAS.frost = { cv, cover, colour: rlFrostColour() });
}
function rlDrawFrost(g, band, look) { // p59 rlRenderStatic, after the land: winter, the control on, Natural in Ownership, Mid and Near only (never Far or Lean-back, Hills, Clear or the Terrain mode)
  if (!p4('seasons') || !P4S.frost || RL_SEAS.shown !== 3 || look !== 'natural' || state.mode !== 'ownership' || (band !== 'mid' && band !== 'near')) return; const x0 = Math.max(0, VW[0]), y0 = Math.max(0, VW[1]), x1 = Math.min(W, VW[2]), y1 = Math.min(H, VW[3]); if (x1 <= x0 || y1 <= y0) return;
  const F = rlFrostCanvas(), k = F.cv.width / W; g.save(); modelPath(g); g.clip(); g.drawImage(F.cv, x0 * k, y0 * k, (x1 - x0) * k, (y1 - y0) * k, x0, y0, x1 - x0, y1 - y0); g.restore();
}
// ---- the clock (§3.1): a season glyph before the date, the word and the factors in its tooltip; the Supply mode's values take the season's factor
const p4SupplyK = () => (p4('seasons') ? 1 + P4_RULES.seasons.supply[P4S.season ?? p4SeasonOf(curMonth)] : 1); // the rule follows the date (or the forced season)
const SEASON_GLYPH = ['bud', 'sun', 'sheaf', 'snowflake'];
const rlSeasonText = (s) => { const R = P4_RULES.seasons, pc = (v) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.round(Math.abs(v) * 1000) / 10 + '%', parts = [];
  if (R.supply[s]) parts.push('supply ' + pc(R.supply[s])); if (R.growth[s]) parts.push('growth ' + pc(R.growth[s])); if (R.materials[s]) parts.push('materials ' + pc(R.materials[s])); if (s === 3) parts.push('marches +2 days on hills, mountains and forest, +1 elsewhere', 'unrest decays 1 less'); return parts.join(', '); };
if (P4S.base) { const de = document.getElementById('date'), sg = document.createElement('span'); sg.className = 'sglyph p4only'; sg.id = 'sglyph'; sg.setAttribute('aria-hidden', 'true'); de.parentNode.insertBefore(sg, de); }
function rlSeasonClock() { // p80d updateTop: the glyph, the Supply legend's factor
  const el = document.getElementById('sglyph'); if (!el) return; const s = p4('seasons') ? P4S.season ?? p4SeasonOf(curMonth) : 0; el.innerHTML = p4('seasons') ? svgIcon(SEASON_GLYPH[s], 15) : ''; el.title = P4_RULES.seasons.words[s];
  const m = MODES.find((x) => x[0] === 'supply'), base = 'Food given per day. Lighter is more.', f = P4_RULES.seasons.supply[s], txt = p4('seasons') && f ? `${base} ${P4_RULES.seasons.words[s]}: ${f > 0 ? '+' : '−'}${Math.round(Math.abs(f) * 100)}%.` : base;
  if (m && m[3] !== txt) { m[3] = txt; if (state.mode === 'supply') renderModes(); }
}
{ const tc0 = TIPS.clock; TIPS.clock = () => { const t = tc0(); if (!p4('seasons')) return t; const M = (state.year - 1) * 12 + state.month, s = P4S.season ?? p4SeasonOf(M), left = 3 - ((M - 1) % 3), W4 = P4_RULES.seasons.words;
  return { ...t, value: W4[s], meaning: `${W4[s]}: ${rlSeasonText(s)}. ${W4[(s + 1) % 4]} in ${left} month${left === 1 ? '' : 's'}. ` + t.meaning }; }; }
// ---- the review controls: Season (Clock | Spring | Summer | Autumn | Winter) and Winter frost (Off | On)
document.querySelectorAll('#mockctl [data-ctl="season"] button, #mockctl [data-ctl="frost"] button').forEach((b) => b.addEventListener('click', () => {
  const k = b.closest('.seg').dataset.ctl; b.closest('.seg').querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  if (k === 'season') P4S.season = b.dataset.v === 'clock' ? null : P4_RULES.seasons.names.indexOf(b.dataset.v); else P4S.frost = b.dataset.v === 'on';
  updateTop(); requestDraw();
}));
