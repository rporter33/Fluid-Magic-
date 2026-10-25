// Colour checks for pass 4's new colours, with the page's own CIEDE2000 and Machado matrices (rlPairDE): normal / protan / deutan / tritan
(() => {
  const r1 = (v) => +v.toFixed(1), lab2hex = (L) => { const o = [0, 0, 0]; rlLabTo(L[0], L[1], L[2], o, 0); return rgb2hex(o); };
  const P = (a, b) => { const e = rlPairDE(hex2rgb(a), hex2rgb(b)); return { normal: r1(e.normal), protan: r1(e.protan), deutan: r1(e.deutan), tritan: r1(e.tritan), cvd: r1(e.cvd) }; };
  const lum = (h) => rlLumOf(...hex2rgb(h)), cr = (a, b) => +rlCR(lum(a), lum(b)).toFixed(2), Lof = (h) => +rgb2lab(hex2rgb(h))[0].toFixed(1);
  const mixH = (a, b, t) => rgb2hex(hex2rgb(a).map((v, j) => v + (hex2rgb(b)[j] - v) * t));
  const out = {};
  const frost = '#929DA6', snow = RL_C.snow;
  out.frost = { L: Lof(frost), vsSnow: P(frost, snow), vsGraniteLit: P(frost, RL_C.graniteLit), vsSnowShade: P(frost, '#CFCAC1') };
  const M = RL_NAT.mat, mats = {}; for (const [t, m] of Object.entries(M)) for (const [k, L] of Object.entries(m)) mats[t + '.' + k] = lab2hex(L);
  // frost at its 0.55 cap over the passable rock and hill grounds, against the snow and against the wasteland grounds (the value code)
  out.frostOver = {}; for (const k of ['mountains.ground', 'mountains.scree', 'hills.ground', 'hills.rock', 'hills.turf']) { const c = mixH(mats[k], frost, 0.55); out.frostOver[k] = { hex: c, L: Lof(c), vsSnow: P(c, snow), vsWasteGround: P(c, mats['wasteland.ground']), vsWastePale: P(c, mats['wasteland.pale']), vsGraniteLit: P(c, RL_C.graniteLit) }; }
  out.unfrosted = { 'mountains.scree_vs_graniteLit': P(mats['mountains.scree'], RL_C.graniteLit), 'mountains.ground_vs_graniteLit': P(mats['mountains.ground'], RL_C.graniteLit) };
  // natural water (the river) against each natural material: the river-pixel rule wants 20 / 12 or a 2.3:1 bank
  out.riverNatural = {}; for (const [k, h] of Object.entries(mats)) { const e = P(RL_C.waterNat, h); if (e.normal < 20 || e.cvd < 12) out.riverNatural[k] = { ...e, lumCR: cr(RL_C.waterNat, h) }; }
  out.riverClear = {}; for (const [t, h] of Object.entries(RL_ALB)) { const e = P(RL_C.water, h); out.riverClear[t] = { ...e, lumCR: cr(RL_C.water, h) }; }
  // the realm banners against the natural river (a river along a realm edge runs under the rail)
  out.bannerVsRiver = { green: P(BAN.green, RL_C.waterNat), red: P(BAN.red, RL_C.waterNat), greenVsClearWater: P(BAN.green, RL_C.water) };
  // the realm washes at 0.28: the two banners over the same ground, and each washed ground against the unwashed one
  out.wash028 = {}; for (const k of ['plains.ground', 'forest.canopy', 'hills.ground', 'swamp.ground', 'wasteland.ground', 'farmland.ground', 'mountains.ground']) { const r = mixH(mats[k], BAN.red, 0.28), g = mixH(mats[k], BAN.green, 0.28); out.wash028[k] = { redVsGreen: P(r, g), redVsBare: P(r, mats[k]), greenVsBare: P(g, mats[k]) }; }
  // the supply beads #E6C46A against the Supply mode's heat ramp (with no halo), every 0.1
  out.beadVsHeat = []; for (let t = 0; t <= 1.0001; t += 0.1) { const hh = heat(t), e = P('#E6C46A', hh); out.beadVsHeat.push({ t: +t.toFixed(1), heat: hh, normal: e.normal, cvd: e.cvd, lumCR: cr('#E6C46A', hh) }); }
  // region names (#E9E4D8 at 0.92 over ground) and province names (#F4EEDF): plain fill against the lightest grounds, no halo
  out.nameFill = {}; for (const k of ['wasteland.pale', 'wasteland.ground', 'farmland.straw', 'mountains.scree']) out.nameFill[k] = { regionFill: cr('#E9E4D8', mats[k]), provinceFill: cr('#F4EEDF', mats[k]) };
  out.nameFill.frostedCrest = { regionFill: cr('#E9E4D8', frost) };
  // the road #B6A27C at 0.55 against the light hairline key and the grounds (it must not read as a province line)
  out.road = { vsKeyLight: P(mixH(mats['plains.ground'], '#B6A27C', 0.55), RL_C.keyLight) };
  out.banners = { red: BAN.red, green: BAN.green, redVsGreen: P(BAN.red, BAN.green) };
  return JSON.stringify(out);
})()
