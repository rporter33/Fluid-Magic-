
// ------------------------------------------------------------------ leader portraits: layered SVG busts on one 256-unit grid
// Anchors: crown y 23, eyes y 100, chin y 169, collar y 200, face axis x 120, three-quarter view facing right.
// Every slot is seeded by rngFor('portrait:11:' + id + ':' + slot); state only adds overlays, badges and the frame.
const PTYPES = {
  ashChieftain: { side: 'red', rank: 2, head: 'hornedHelm', collar: 'scale', label: 'Ash Chieftain' },
  emberAdept: { side: 'red', rank: 1, head: 'emberCirclet', collar: 'robe', label: 'Ember Adept' },
  pyrePriest: { side: 'red', rank: 1, head: 'emberHood', collar: 'cowl', label: 'Pyre Priest' },
  cinderScout: { side: 'red', rank: 0, head: 'ashHood', collar: 'cowl', label: 'Cinder Scout' },
  cinderMagus: { side: 'red', rank: 2, head: 'tallCowl', collar: 'robe', label: 'Cinder Magus' },
  wardenCaptain: { side: 'green', rank: 2, head: 'barkHelm', collar: 'barkMail', label: 'Warden Captain' },
  thornScout: { side: 'green', rank: 0, head: 'leafHood', collar: 'leafCloak', label: 'Thorn Scout' },
  grovePriest: { side: 'green', rank: 1, head: 'wreath', collar: 'robe', label: 'Grove Priest' },
  saplingDruid: { side: 'green', rank: 1, head: 'twigCirclet', collar: 'leafCloak', label: 'Sapling Druid' },
  elderDruid: { side: 'green', rank: 2, head: 'antlerHood', collar: 'robe', label: 'Elder Druid' },
  indepCaptain: { side: 'indep', rank: 'indep', head: 'helm', collar: 'outfit', label: 'Independent Captain' },
  titan: { side: 'red', rank: 'god', head: 'crown', collar: 'mantle', label: 'Titan (pretender)' },
};
const FRAMES = { 0: ['#8C6A47', 'oak'], 1: ['#8C6A43', 'bronze'], 2: ['#B8914A', 'brass'], god: ['#B8914A', "god's brass"], indep: ['#91A092', 'pewter'] };
const SKINS = { red: [['#6E6A64', '#8F8C88', '#B9B6B1'], ['#625E59', '#86827D', '#AFABA5'], ['#76716A', '#97928B', '#C1BCB4'], ['#5E5B57', '#7E7B77', '#A6A39F']],
  green: [['#6B4A2B', '#A0785A', '#C9A585'], ['#5E4126', '#906A4E', '#BC987A'], ['#76533A', '#AC8566', '#D2B092'], ['#5A3E28', '#8C6448', '#B48E70']],
  indep: [['#8C6A4A', '#B08A6A', '#D2B293'], ['#6E5038', '#946E50', '#B8937A'], ['#9A7A5E', '#BE9C80', '#E0C2A6'], ['#5A402C', '#7E5C42', '#A27E62'], ['#A08068', '#C4A68C', '#E6CCB4']] };
const HAIRS = { red: ['#2B2A28', '#4A4744', '#7A3E22', '#D9D6D0', '#3A2E28', '#8F8C88'], green: ['#3E2E20', '#5E4630', '#8A6A3A', '#4E5A3A', '#A08A5A'], indep: ['#3A2E23', '#6B4A2B', '#A08050', '#8F8C88', '#7A3E22'] };
const BANNER_OF = { red: '#FD6533', green: '#00674B', indep: '#8C8A80' };
const keylineFor = (b) => (rgb2lab(hex2rgb(b))[0] > 55 ? '#1C1A17' : '#F4EEDF');
let PID = 0;
function portraitSVG(o, size) {
  const T = PTYPES[o.ptype], side = T.side, uid = 'pt' + PID++, px = 256 / size;
  const lod = size >= 96 ? 3 : size >= 48 ? 2 : size > 24 ? 1 : 0;
  const R = (slot) => rngFor('portrait:11:' + o.id + ':' + slot)();
  const pick = (slot, arr) => arr[Math.floor(R(slot) * arr.length)];
  const banner = o.banner ?? BANNER_OF[side], alleg = o.allegiance ?? (side === 'indep' ? 'independent' : side === 'red' ? 'own' : 'other');
  const rank = o.rank ?? T.rank, [fcol] = FRAMES[rank];
  const hp = o.hpFrac ?? 1, seen = o.seen ?? 'live';
  const pips = lod >= 1 ? (o.pips ?? '') : '';
  const ring = pips.length > 0;
  const vb = ring ? [-24, -24, 304, 304] : [0, 0, 256, 256], outPx = (size * vb[2]) / 256;
  const sk = o.ptype === 'titan' ? ['#3A3836', '#5E5953', '#8A857E'] : pick('skin', SKINS[side]);
  const hairC = pick('hairc', HAIRS[side]);
  const cx = 120, cy = 108;
  const HEADS = [[46, 58, 30, 0], [44, 60, 26, 2], [49, 56, 34, -2], [42, 57, 24, 0], [48, 59, 32, 3], [45, 55, 28, -1]];
  let [rx, ry, jw, cdy] = HEADS[Math.floor(R('head') * 6)];
  if (o.ptype === 'titan') { rx = 54; ry = 60; jw = 40; cdy = 2; }
  const fw = Math.max(8, 4 * px), bw = Math.max(3, 3 * px), shape = alleg === 'independent' ? 'square' : 'round';
  const inner = 124 - fw - bw;
  const S = [];
  const dark = (c, k) => mix(c, '#000000', k);
  // 1. backdrop: the banner darkened 35%, with a radial vignette (20% darker when badly wounded)
  const bd = dark(banner, 0.35 + (hp <= 0.25 ? 0.2 : 0));
  S.push(`<defs><radialGradient id="${uid}g" cx="50%" cy="42%" r="62%"><stop offset="0" stop-color="${mix(bd, '#ffffff', 0.06)}"/><stop offset="1" stop-color="${dark(bd, 0.55)}"/></radialGradient><clipPath id="${uid}c">${shape === 'round' ? `<circle cx="128" cy="128" r="${inner}"/>` : `<rect x="${4 + fw + bw}" y="${4 + fw + bw}" width="${248 - 2 * (fw + bw)}" height="${248 - 2 * (fw + bw)}" rx="${Math.max(4, 28 - fw)}"/>`}</clipPath><clipPath id="${uid}h"><path d="${''}HEAD"/></clipPath></defs>`);
  const headPath = `M${cx - rx} ${cy - 2}C${cx - rx} ${cy - ry * 0.9} ${cx + rx * 0.2} ${cy - ry * 1.05} ${cx + rx * 0.75} ${cy - ry * 0.72}C${cx + rx * 1.02} ${cy - ry * 0.45} ${cx + rx + 3} ${cy - 8} ${cx + rx + 1} ${cy + 10}C${cx + rx} ${cy + 30} ${cx + jw + 14} ${cy + 52 + cdy} ${cx + 12} ${169 + cdy}C${cx - 6} ${172 + cdy} ${cx - jw} ${cy + 50} ${cx - rx + 10} ${cy + 30}C${cx - rx + 2} ${cy + 20} ${cx - rx} ${cy + 10} ${cx - rx} ${cy - 2}Z`;
  S[0] = S[0].replace('HEAD', headPath.slice(0));
  const B = []; // everything inside the clip
  B.push(`<rect x="-10" y="-10" width="276" height="276" fill="url(#${uid}g)"/>`);
  // prophet halo behind the head, with a candle-flame rim
  if (o.prophet && lod >= 1) { B.push(`<circle cx="${cx + 6}" cy="92" r="74" fill="none" stroke="#FFE8C3" stroke-opacity=".85" stroke-width="${Math.max(5, 2.2 * px)}"/>`); if (lod >= 2) for (let k = 0; k < 9; k++) { const a = -Math.PI + (k / 8) * Math.PI; const x = cx + 6 + Math.cos(a) * 74, y = 92 + Math.sin(a) * 74; B.push(`<path d="M${x} ${y - 9}c4 5 4 9 0 9s-4-4 0-9z" fill="#FFA757"/>`); } }
  // 2. hair behind the head
  const hairStyles = side === 'red' ? ['bald', 'crop', 'long', 'swept', 'topknot', 'shaved'] : side === 'green' ? ['crop', 'long', 'swept', 'braids', 'braids', 'bald'] : ['bald', 'crop', 'long', 'swept'];
  const hair = o.ptype === 'titan' ? 'bald' : pick('hair', hairStyles);
  if ((hair === 'long' || hair === 'braids') && lod >= 1) B.push(`<path d="M${cx - rx - 4} ${cy - 20}C${cx - rx - 14} ${cy + 40} ${cx - rx - 6} ${cy + 82} ${cx - rx + 18} ${cy + 96}L${cx - 4} ${cy + 70}L${cx - rx + 8} ${cy}Z" fill="${hairC}"/>`);
  // 3. shoulders and clothes, with a tint zone in the banner color
  const sh = `M14 256C22 214 64 196 104 192L150 192C196 196 238 214 248 256Z`;
  const outfit = o.outfit ?? 'levy';
  const cloth = { scale: '#4A4744', robe: dark(banner, 0.45), cowl: '#3A2B22', barkMail: '#6B4A2B', leafCloak: '#3F5E2E', mantle: '#3A3836', outfit: { levy: '#8C7A5A', hunter: '#5E6A40', mountaineer: '#7A6A58', reedman: '#6E7A5A' }[outfit] }[T.collar];
  B.push(`<path d="${sh}" fill="${cloth}" stroke="#1C1A17" stroke-width="${1.5 * px}"/>`);
  if (lod >= 2) {
    if (T.collar === 'scale') for (let r = 0; r < 4; r++) for (let k = 0; k < 9; k++) B.push(`<path d="M${30 + k * 24 + (r % 2) * 12} ${214 + r * 12}a12 10 0 0 0 24 0" fill="none" stroke="#2B2A28" stroke-width="${1.2 * px}"/>`);
    if (T.collar === 'robe' || T.collar === 'cowl') B.push(`<path d="M60 256C70 230 80 214 96 204M196 256C188 232 178 214 166 204M128 256L130 214" stroke="${dark(cloth, 0.35)}" stroke-width="${2 * px}" fill="none"/>`);
    if (T.collar === 'barkMail') for (let k = 0; k < 7; k++) B.push(`<path d="M${40 + k * 28} 256L${50 + k * 24} 206" stroke="#4A3420" stroke-width="${2 * px}"/>`);
    if (T.collar === 'leafCloak') for (let k = 0; k < 10; k++) { const x = 34 + k * 20, y = 222 + (k % 3) * 9; B.push(`<ellipse cx="${x}" cy="${y}" rx="9" ry="4.5" transform="rotate(${-30 + k * 7} ${x} ${y})" fill="#5E7F45" stroke="#2F4A26" stroke-width="${px}"/>`); }
    if (T.collar === 'outfit') { if (outfit === 'levy') for (let k = 0; k < 6; k++) B.push(`<path d="M${36 + k * 32} 256L${46 + k * 28} 204" stroke="${dark(cloth, 0.3)}" stroke-width="${1.6 * px}"/>`); if (outfit === 'mountaineer') for (let k = 0; k < 14; k++) B.push(`<path d="M${70 + k * 9} 202l3 -8l3 8" fill="#A08A70" stroke="#5E4E3E" stroke-width="${px}"/>`); if (outfit === 'hunter') B.push(`<path d="M40 256C48 220 70 200 100 192L96 214C78 222 66 238 64 256Z" fill="#4A5432"/>`); if (outfit === 'reedman') for (let k = 0; k < 8; k++) B.push(`<path d="M${30 + k * 26} 210L${50 + k * 26} 256" stroke="#55603F" stroke-width="${2 * px}"/>`); }
    if (T.collar === 'mantle') B.push(`<path d="M50 256L80 214L104 230M180 256L168 216L150 236" stroke="#FFB347" stroke-width="${1.6 * px}" fill="none"/>`);
  }
  // the banner tint zone: a sash or collar band
  if (T.collar !== 'mantle') B.push(`<path d="M70 256L148 198L170 204L98 256Z" fill="${banner}" stroke="#1C1A17" stroke-width="${1.2 * px}"/>`);
  // 4. neck
  B.push(`<path d="M${cx - 18} 150L${cx - 22} 200L${cx + 22} 200L${cx + 20} 150Z" fill="${sk[0]}"/>`);
  // 5. head (three skin tones), 6. ear
  B.push(`<path d="${headPath}" fill="${sk[1]}" stroke="#1C1A17" stroke-width="${1.6 * px}"/>`);
  B.push(`<g clip-path="url(#${uid}h)"><ellipse cx="${cx + 18}" cy="${cy - 2}" rx="${rx * 0.66}" ry="${ry * 0.8}" fill="${sk[2]}" opacity=".75"/><path d="M${cx - rx - 4} ${cy - 30}C${cx - rx + 10} ${cy + 20} ${cx - 10} ${cy + 64} ${cx + 30} ${cy + 70}L${cx - rx} ${cy + 80}Z" fill="${sk[0]}" opacity=".7"/></g>`);
  if (lod >= 1) B.push(`<ellipse cx="${cx - rx + 13}" cy="${cy + 4}" rx="8" ry="13" fill="${sk[0]}" stroke="#1C1A17" stroke-width="${1.2 * px}"/>`);
  // 7. eyes and brows (a mage's eye glint), 8. nose and mouth
  const glint = (pips.replace(/[^R]/g, '').length >= 2 ? '#FFB347' : pips.replace(/[^G]/g, '').length >= 2 ? '#A6D96A' : null);
  const titanEyes = o.ptype === 'titan';
  if (lod >= 1) {
    const eyes = [[cx + 12, 100, 7.5], [cx + 37, 99, 5.5]];
    if (lod >= 3 && !titanEyes) B.push(`<ellipse cx="${cx + 22}" cy="101" rx="24" ry="9" fill="${sk[0]}" opacity=".35"/>`);
    if (lod >= 3) for (const [x, y, w] of eyes) { if (titanEyes) { B.push(`<path d="M${x - w} ${y}q${w} -4 ${w * 2} 0q${-w} 3 ${-w * 2} 0z" fill="#FFB347"/><ellipse cx="${x}" cy="${y}" rx="${w * 1.6}" ry="5" fill="#FFB347" opacity=".25"/>`); continue; } B.push(`<path d="M${x - w} ${y}q${w} -5 ${w * 2} 0q${-w} 4 ${-w * 2} 0z" fill="#EDE6D6"/><circle cx="${x + 1}" cy="${y}" r="${w * 0.42}" fill="${glint ?? '#2B2620'}"/><circle cx="${x + 1}" cy="${y}" r="${w * 0.18}" fill="#0E0905"/>`); }
    else for (const [x, y, w] of eyes) B.push(`<ellipse cx="${x + 1}" cy="${y}" rx="${w * 0.45}" ry="${w * 0.38}" fill="${titanEyes ? '#FFB347' : glint ?? '#1C1A17'}"/>`);
    const bt = 2.5 + R('brow') * 3.5, ba = (R('browa') - 0.5) * 6;
    if (!titanEyes) B.push(`<path d="M${cx + 2} ${90 + ba}L${cx + 22} ${87}M${cx + 30} ${88}L${cx + 45} ${89 - ba * 0.5}" stroke="${dark(hairC, 0.2)}" stroke-width="${bt * (lod >= 2 ? 1 : 1.4)}" stroke-linecap="round"/>`);
  }
  if (lod >= 2) {
    B.push(`<path d="M${cx + 40} 98L${cx + rx + 9} 126Q${cx + rx + 8} 133 ${cx + rx - 3} 132L${cx + 35} 131" fill="${sk[1]}" stroke="#1C1A17" stroke-width="${1.3 * px}" stroke-linejoin="round"/>`);
    B.push(`<path d="M${cx + 18} 148Q${cx + 30} 152 ${cx + 43} 146" fill="none" stroke="${dark(sk[0], 0.45)}" stroke-width="${2.2 * px}" stroke-linecap="round"/>`);
    if (lod >= 3) B.push(`<path d="M${cx + 22} 155Q${cx + 31} 158 ${cx + 39} 154" fill="none" stroke="${sk[2]}" stroke-width="2" opacity=".7"/><path d="M${cx + 4} 118Q${cx + 14} 134 ${cx + 10} 146" fill="none" stroke="${sk[0]}" stroke-width="3" opacity=".45"/>`);
  }
  // 9. marks, 10. scars
  const mark = side === 'indep' || o.ptype === 'titan' ? null : R('markp') < 0.55 ? pick('mark', side === 'red' ? ['soot', 'soot', 'cracks', 'cracks'] : ['bark', 'bark', 'moss', 'moss']) : null;
  if (o.ptype === 'titan' && lod >= 2) B.push(`<path d="M${cx - 20} 60l14 22l-6 16l12 14M${cx + 30} 130l-10 14l8 10M${cx - 30} 120l10 8" stroke="#FFB347" stroke-width="${2 * px}" fill="none"/>`);
  if (mark && lod >= 2) B.push({ soot: `<path d="M${cx + 6} 112l26 10M${cx + 2} 120l22 9" stroke="#2B2A28" stroke-opacity=".45" stroke-width="${Math.max(4, 2.6 * px)}" stroke-linecap="round"/>`, cracks: `<path d="M${cx + 28} 112l6 8l-4 8l6 6M${cx - 10} 72l8 6l-2 8" stroke="#FFB347" stroke-width="${1.4 * px}" fill="none"/>`, bark: `<path d="M${cx + 20} 120a8 6 0 1 0 14 0a4 3 0 1 0 -7 0M${cx - 18} 70a6 5 0 1 0 10 2" stroke="#5E4630" stroke-width="${1.6 * px}" fill="none"/>`, moss: `<ellipse cx="${cx - 20}" cy="132" rx="12" ry="7" fill="#5E7F45" opacity=".8"/><ellipse cx="${cx + 36}" cy="72" rx="8" ry="4" fill="#5E7F45" opacity=".8"/>` }[mark]);
  if (lod >= 2 && R('scarp') < 0.3) B.push(pick('scar', [`<path d="M${cx + 22} 108l14 18" stroke="${mix(sk[2], '#ffffff', 0.25)}" stroke-width="${2 * px}"/>`, `<path d="M${cx - 4} 84l10 12" stroke="${mix(sk[2], '#ffffff', 0.25)}" stroke-width="${2 * px}"/>`, `<path d="M${cx + 30} 136l10 -4" stroke="${mix(sk[2], '#ffffff', 0.25)}" stroke-width="${2 * px}"/>`]));
  // 11. beard
  const beards = side === 'red' ? ['none', 'stubble', 'goatee', 'full', 'braidRings', 'braidRings'] : side === 'green' ? ['none', 'stubble', 'full', 'long', 'moss', 'moss'] : ['none', 'stubble', 'goatee', 'full', 'long'];
  const beard = o.ptype === 'titan' || lod === 0 ? 'none' : pick('beard', beards);
  if (beard !== 'none') {
    const bc = dark(hairC, 0.05);
    if (beard === 'stubble') { if (lod >= 2) B.push(`<path d="M${cx - rx + 16} ${cy + 26}C${cx - 8} ${cy + 62} ${cx + 20} ${172 + cdy} ${cx + jw + 10} ${cy + 46}L${cx + jw + 4} ${cy + 36}C${cx + 10} ${cy + 56} ${cx - 10} ${cy + 46} ${cx - rx + 18} ${cy + 18}Z" fill="${bc}" opacity=".35"/>`); }
    else {
      const len = beard === 'goatee' ? 8 : beard === 'full' || beard === 'moss' ? 22 : 40;
      const wide = beard === 'goatee' ? 0.4 : 1;
      B.push(`<path d="M${cx - rx + 14 + (1 - wide) * 40} ${cy + 22}C${cx - 16} ${cy + 66 + len} ${cx + 22} ${172 + cdy + len} ${cx + jw + 14 - (1 - wide) * 20} ${cy + 40}L${cx + 36} ${cy + 44}Q${cx + 28} ${cy + 36} ${cx + 16} ${cy + 42}Q${cx - 10} ${cy + 40} ${cx - rx + 22 + (1 - wide) * 40} ${cy + 16}Z" fill="${bc}" stroke="#1C1A17" stroke-width="${1.2 * px}"/>`);
      if (beard === 'braidRings' && lod >= 1) { const by = 169 + cdy + len * 0.55; B.push(`<path d="M${cx + 6} ${by - 8}q-2 14 2 26M${cx + 24} ${by - 10}q2 12 0 24" stroke="${bc}" stroke-width="11" stroke-linecap="round" fill="none"/><path d="M${cx + 6} ${by - 8}q-2 14 2 26M${cx + 24} ${by - 10}q2 12 0 24" stroke="#1C1A17" stroke-opacity=".35" stroke-width="1.5" fill="none" stroke-dasharray="4 4"/><rect x="${cx + 1}" y="${by + 4}" width="12" height="6" rx="1" fill="#8F8C88" stroke="#1C1A17" stroke-width="${px}"/><rect x="${cx + 19}" y="${by + 2}" width="12" height="6" rx="1" fill="#8F8C88" stroke="#1C1A17" stroke-width="${px}"/>`); }
      if (beard === 'moss' && lod >= 2) B.push(`<ellipse cx="${cx + 8}" cy="${cy + 64}" rx="10" ry="5" fill="#5E7F45"/><ellipse cx="${cx + 26}" cy="${cy + 58}" rx="6" ry="4" fill="#6E8F4E"/>`);
    }
  }
  // 12. front hair (when the headgear leaves it showing)
  const openHead = ['emberCirclet', 'wreath', 'twigCirclet'].includes(T.head);
  if (openHead || T.head === 'helm' && R('helm') > 2) {
    if (hair === 'crop' || hair === 'swept' || hair === 'long' || hair === 'braids') B.push(`<path d="M${cx - rx} ${cy - 4}C${cx - rx - 2} ${cy - ry} ${cx + rx * 0.4} ${cy - ry * 1.1} ${cx + rx * 0.9} ${cy - ry * 0.62}C${cx + rx * 0.6} ${cy - ry * 0.7} ${cx + 10} ${cy - ry * 0.55} ${cx - 6} ${cy - ry * 0.42}C${cx - rx * 0.6} ${cy - ry * 0.3} ${cx - rx + 6} ${cy - 10} ${cx - rx + 4} ${cy + 6}Z" fill="${hairC}" stroke="#1C1A17" stroke-width="${1.2 * px}"/>`);
    if (hair === 'topknot') B.push(`<ellipse cx="${cx - 10}" cy="${cy - ry - 8}" rx="12" ry="10" fill="${hairC}" stroke="#1C1A17" stroke-width="${1.2 * px}"/>`);
    if (hair === 'braids' && lod >= 2) B.push(`<path d="M${cx - rx + 6} ${cy}l-4 70" stroke="${hairC}" stroke-width="9" stroke-linecap="round"/><ellipse cx="${cx - rx + 2}" cy="${cy + 72}" rx="7" ry="3.5" fill="#5E7F45"/>`);
  }
  // 13. headgear
  const HG = headgear(T.head, { cx, cy, rx, ry, px, R, banner, side, outfit, lod });
  B.push(HG);
  // 15. state overlays (never the face itself)
  if (hp <= 0.5 && lod >= 2 && o.ptype !== 'titan') B.push(`<path d="M${cx - rx + 4} ${cy - 30}L${cx + rx + 2} ${cy - 40}L${cx + rx + 3} ${cy - 29}L${cx - rx + 5} ${cy - 18}Z" fill="#E9E4D8" stroke="#8F8C88" stroke-width="${px}"/><ellipse cx="${cx + 20}" cy="${cy - 30}" rx="6" ry="4" fill="#7A2E22" opacity=".85"/>`);
  if (hp <= 0.25 && lod >= 2) B.push(`<path d="M${cx + 30} ${cy + 6}c4 10 2 22 -2 30c6 -6 10 -18 6 -30z" fill="#7A2E22"/>`);
  const bodySVG = `<g clip-path="url(#${uid}c)">${B.join('')}</g>`;
  // 16. the frame: shape by allegiance, material by rank, a banner band with its keyline; badges; the gear chip
  const Fr = [];
  const metal = (w, extra = '') => (shape === 'round' ? `<circle cx="128" cy="128" r="${124 - w / 2}" fill="none" stroke="${fcol}" stroke-width="${w}" ${extra}/>` : `<rect x="${4 + w / 2}" y="${4 + w / 2}" width="${248 - w}" height="${248 - w}" rx="${28 - w / 2}" fill="none" stroke="${fcol}" stroke-width="${w}" ${extra}/>`);
  const dotted = seen === 'lastSeen' ? `stroke-dasharray="${fw * 0.6} ${fw * 0.5}"` : '';
  Fr.push(metal(fw, dotted));
  Fr.push(shape === 'round' ? `<circle cx="128" cy="128" r="${124 - fw - bw / 2}" fill="none" stroke="${banner}" stroke-width="${bw}"/><circle cx="128" cy="128" r="${124 - fw - bw - px / 2}" fill="none" stroke="${keylineFor(banner)}" stroke-width="${px}" stroke-opacity=".8"/>` : `<rect x="${4 + fw + bw / 2}" y="${4 + fw + bw / 2}" width="${248 - 2 * fw - bw}" height="${248 - 2 * fw - bw}" rx="${Math.max(3, 28 - fw - bw / 2)}" fill="none" stroke="${banner}" stroke-width="${bw}"/>`);
  Fr.push(shape === 'round' ? `<circle cx="128" cy="128" r="124" fill="none" stroke="#1C1A17" stroke-width="${px}"/>` : `<rect x="4" y="4" width="248" height="248" rx="28" fill="none" stroke="#1C1A17" stroke-width="${px}"/>`);
  if (alleg === 'other') for (let k = 0; k < 8; k++) { const a = (k / 8) * 360 + 22.5; Fr.push(`<rect x="${128 - fw * 0.32}" y="${4 - 1}" width="${fw * 0.64}" height="${fw * 0.62 + 1}" fill="#1C1A17" transform="rotate(${a} 128 128)"/>`); }
  if (rank === 1 && lod >= 1) for (const a of [45, 135, 225, 315]) Fr.push(`<rect x="${128 - fw * 0.22}" y="${4 + fw * 0.28}" width="${fw * 0.44}" height="${fw * 0.44}" fill="#5E4630" stroke="#2B2A28" stroke-width="${px * 0.6}" transform="rotate(${a} 128 128)"/>`);
  if ((rank === 2 || rank === 'god') && lod >= 1) for (const a of [45, 135, 225, 315]) Fr.push(`<path d="M${128 - 16} ${4 - 1}h32" stroke="${rank === 'god' ? '#D4B26A' : '#B8914A'}" stroke-width="${fw * 0.55}" transform="rotate(${a} 128 128)" fill="none"/><path d="M${128 - 16} ${4 - 1}h32" stroke="#1C1A17" stroke-width="${px * 0.8}" transform="rotate(${a} 128 128) translate(0 ${-fw * 0.28})" fill="none"/>`);
  if (rank === 'god') { Fr.push(metal(px, `stroke="#D4B26A"`).replace(`stroke="${fcol}"`, '')); Fr.push(`<path d="M104 ${6 + fw * 0.2}L110 ${-10}L119 ${2}L128 ${-14}L137 ${2}L146 ${-10}L152 ${6 + fw * 0.2}Z" fill="#B8914A" stroke="#1C1A17" stroke-width="${px * 1.2}"/><path d="M110 -10L119 2L128 -14L137 2L146 -10" fill="none" stroke="#D4B26A" stroke-width="${px}"/>`); if (lod >= 2) Fr.push(`<g transform="translate(26 196)"><circle r="${16}" fill="#1C1A17" stroke="#B8914A" stroke-width="${px * 1.5}"/><path d="M0 9c-6 0-8-4-8-8 0-5 4-7 5-12 1 4 3 5 3 7 1-1 2-2 2-5 3 3 5 6 5 10 0 4-3 8-7 8z" fill="#FD6533" transform="scale(.9)"/></g>`); }
  if (rank === 'indep' && lod >= 1) Fr.push(`<path d="M8 40V8h32M216 8h32v32M248 216v32h-32M40 248H8v-32" fill="none" stroke="#6F7C70" stroke-width="${px * 1.5}"/>`);
  // badges: at most 3 (1 at 40 px and below), by priority: role, wound, supply or pay, holy, gear
  const badges = [];
  if (o.pretender) badges.push(['crown', '#B8914A']);
  if (o.prophet && lod <= 1) badges.push(['halo', '#FFE8C3']);
  if (hp <= 0.5 && lod <= 1) badges.push(['heart', hp <= 0.25 ? '#C55B4E' : '#E9E4D8']);
  if (o.starving) badges.push(['wheat', '#E2B843']);
  if (o.unpaid) badges.push(['coin', '#E2B843']);
  if (o.scout) badges.push(['eye', '#E9E4D8']);
  if (o.stealthy) badges.push(['hood', '#E9E4D8']);
  const maxB = lod <= 1 ? 1 : 3, bslots = [[30, 30], [10, 128], [30, 226]];
  const glyphs = { crown: '<path d="M-7 4l-2-9 5 4 4-7 4 7 5-4-2 9z" fill="#B8914A" stroke="#1C1A17" stroke-width="1"/>', halo: '<ellipse cx="0" cy="-2" rx="7" ry="3" fill="none" stroke="#FFE8C3" stroke-width="2"/>', heart: '<path d="M0 7c-9-6-9-12-5-13 3-1 5 2 5 2s2-3 5-2c4 1 4 7-5 13z" fill="currentColor"/><path d="M0 -4l-2 4 3 2-2 4" stroke="#1C1A17" stroke-width="1.2" fill="none"/>', wheat: '<path d="M-6 7L6-7M6 7L-6-7" stroke="currentColor" stroke-width="2"/><circle cx="-5" cy="-5" r="2" fill="currentColor"/><circle cx="5" cy="-5" r="2" fill="currentColor"/>', coin: '<circle r="5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M-7 7L7-7" stroke="currentColor" stroke-width="2"/>', eye: '<path d="M-7 0q7-7 14 0q-7 7-14 0z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle r="2.2" fill="currentColor"/>', hood: '<path d="M-6 7c0-9 2-13 6-13s6 4 6 13z" fill="none" stroke="currentColor" stroke-width="1.8"/>' };
  badges.slice(0, maxB).forEach(([g, col], k) => { const [x, y] = bslots[k], sc = Math.max(1.6, 1.25 * px); Fr.push(`<g transform="translate(${x} ${y}) scale(${sc})" color="${col}"><circle r="10" fill="#1C1A17" stroke="${fcol}" stroke-width="1.2"/>${glyphs[g]}</g>`); });
  if (o.holy && lod >= 1) Fr.push(`<g transform="translate(128 ${248 - fw / 2}) scale(${Math.max(1.4, px * 1.1)})"><rect x="-9" y="-6" width="18" height="12" rx="2" fill="#1C1A17" stroke="${fcol}" stroke-width="1"/><path d="M0 4c-3 0-4-2-4-4 0-3 2-4 3-7 1 2 1 3 1 4 1-1 1-1 1-3 2 2 3 4 3 6 0 2-2 4-4 4z" fill="#FFE8C3"/></g>`);
  if (o.gear && o.gear.n && lod >= 2) { const sym = ['', '○', '◆', '★'][o.gear.tier], sc = Math.max(1.5, px * 1.05); Fr.push(`<g transform="translate(206 214) scale(${sc})"><rect x="-15" y="-9" width="30" height="18" rx="4" fill="#1C1A17" stroke="${fcol}" stroke-width="1"/><text x="0" y="4.5" text-anchor="middle" font-family="IBM Plex Sans Condensed, sans-serif" font-weight="600" font-size="12" fill="#F4EEDF">${o.gear.n} ${sym}</text></g>`); }
  if (seen === 'dead') Fr.push(`<path d="M${shape === 'round' ? 150 : 170} 0H256V${shape === 'round' ? 106 : 86}Z" fill="#0E0905"/><path d="M${shape === 'round' ? 176 : 192} 0L256 80" stroke="#3A3836" stroke-width="${px * 2}"/>`);
  // 17. the pip ring on its separation ring
  if (ring) {
    Fr.push(`<circle cx="128" cy="128" r="${124 + px}" fill="none" stroke="#1C1A17" stroke-width="${2 * px}"/>`);
    const list = pips.length > 6 ? [pips[0], 'n'] : [...pips], pr = Math.max(17, 6 * px);
    list.forEach((c, k) => { const a = (-60 + k * (pr * 2.25 / (124 + pr)) * (180 / Math.PI)) * Math.PI / 180, x = 128 + Math.cos(a) * (124 + pr * 0.55), y = 128 + Math.sin(a) * (124 + pr * 0.55);
      if (c === 'n') { Fr.push(`<g transform="translate(${x} ${y})"><circle r="${pr + 2 * px}" fill="#1C1A17"/><text y="${pr * 0.35}" text-anchor="middle" font-size="${pr}" font-family="IBM Plex Sans Condensed" fill="#F4EEDF">${pips.length}</text></g>`); return; }
      const m = MANA[c]; Fr.push(`<g transform="translate(${x} ${y})"><circle r="${pr + 2 * px}" fill="#1C1A17"/><circle r="${pr}" fill="${m.fill}"/><g transform="translate(${-pr * 0.6} ${-pr * 0.6}) scale(${pr / 20})" fill="none" stroke="${m.ink}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${m.shape}</g></g>`); });
  }
  const filt = seen === 'dead' ? 'grayscale(1)' : seen === 'lastSeen' ? 'saturate(.3)' : '';
  return `<svg width="${outPx.toFixed(1)}" height="${outPx.toFixed(1)}" viewBox="${vb.join(' ')}" role="img" aria-label="${o.label ?? T.label}"${filt ? ` style="filter:${filt}"` : ''}>${S[0]}${bodySVG}${Fr.join('')}</svg>`;
}
function headgear(kind, q) {
  const { cx, cy, rx, ry, px, R, banner, side, outfit, lod } = q, ink = `stroke="#1C1A17" stroke-width="${1.4 * px}"`;
  const cap = (fill, low = 92) => `<path d="M${cx - rx - 4} ${low + 8}C${cx - rx - 6} ${cy - ry - 4} ${cx + rx * 0.3} ${cy - ry * 1.2} ${cx + rx + 6} ${low - 10}L${cx + rx + 6} ${low - 2}C${cx + 10} ${low - 10} ${cx - 20} ${low} ${cx - rx - 4} ${low + 14}Z" fill="${fill}" ${ink}/>`;
  const hood = (fill, trim) => `<path d="M${cx - rx - 18} 210C${cx - rx - 26} 120 ${cx - rx - 14} 36 ${cx + 6} 28C${cx + rx + 22} 30 ${cx + rx + 26} 86 ${cx + rx + 12} 104C${cx + rx - 2} 90 ${cx + rx - 26} 68 ${cx - 2} 68C${cx - rx + 4} 74 ${cx - rx + 2} 132 ${cx - rx + 16} 210Z" fill="${fill}" ${ink}/>` + (trim ? `<path d="M${cx + rx + 12} 104C${cx + rx - 2} 90 ${cx + rx - 26} 68 ${cx - 2} 68C${cx - rx + 4} 74 ${cx - rx + 2} 132 ${cx - rx + 16} 210" fill="none" stroke="${trim}" stroke-width="${Math.max(5, 2 * px)}"/>` : '');
  const v = Math.floor(R('hg') * 3);
  switch (kind) {
    case 'hornedHelm': {
      const horn = v === 0 ? '#CFC6B4' : v === 1 ? '#2B2A28' : '#8F8C88';
      const hornL = [`M${cx - rx + 8} 70C${cx - rx - 22} 64 ${cx - rx - 34} 40 ${cx - rx - 28} 14C${cx - rx - 18} 34 ${cx - rx - 4} 46 ${cx - rx + 16} 56Z`, `M${cx - rx + 8} 70C${cx - rx - 30} 70 ${cx - rx - 40} 50 ${cx - rx - 44} 30C${cx - rx - 26} 44 ${cx - rx - 8} 50 ${cx - rx + 16} 56Z`, `M${cx - rx + 8} 70C${cx - rx - 14} 56 ${cx - rx - 16} 34 ${cx - rx - 4} 18C${cx - rx + 2} 36 ${cx - rx + 8} 46 ${cx - rx + 18} 56Z`][v];
      const hornR = `M${cx + rx - 18} 58C${cx + rx} 46 ${cx + rx + 8} 30 ${cx + rx + 4} 12C${cx + rx + 16} 30 ${cx + rx + 14} 52 ${cx + rx - 6} 66Z`;
      const hv = Math.floor(R('helmv') * 3), capCol = ['#4A4744', '#3A3836', '#5E5953'][Math.floor(R('helmc') * 3)];
      const crest = hv === 1 ? `<path d="M${cx - 34} ${cy - ry + 8}${[0, 1, 2, 3, 4, 5].map((k) => `L${cx - 28 + k * 12} ${cy - ry - 12 - (k % 2) * 4}L${cx - 22 + k * 12} ${cy - ry + 2 - Math.abs(k - 2.5) * 1.5}`).join('')}L${cx + 40} ${cy - ry + 10}Z" fill="#2B2A28" ${ink}/>` : '';
      const cheek = hv === 2 ? `<path d="M${cx - rx + 4} 96L${cx - rx + 2} 142L${cx - rx + 22} 150L${cx - rx + 28} 102Z" fill="${capCol}" ${ink}/>` : '';
      return `<path d="${hornR}" fill="${horn}" ${ink}/>` + cap(capCol, 92) + crest + cheek + `<path d="M${cx - rx - 4} 100C${cx - 20} 86 ${cx + 10} 80 ${cx + rx + 6} 82L${cx + rx + 6} 92C${cx + 10} 90 ${cx - 20} 96 ${cx - rx - 4} 110Z" fill="#3A3836" ${ink}/>` + `<path d="M${cx + rx - 2} 84L${cx + rx + 4} 84L${cx + rx + 6} 118L${cx + rx} 120Z" fill="#4A4744" ${ink}/>` + (lod >= 2 ? [0, 1, 2, 3].map((k) => `<rect x="${cx - rx + 8 + k * 24}" y="${94 - k * 3.6}" width="5" height="5" fill="#6E6A64"/>`).join('') : '') + `<path d="${hornL}" fill="${horn}" ${ink}/>`;
    }
    case 'emberHood': return hood('#3A2B22', mix(banner, '#000000', 0.2)) + `<path d="M${cx + 4} 214c-9 0-12-6-12-12 0-8 6-11 8-18 2 6 4 7 4 10 2-2 3-3 3-7 4 4 7 9 7 14 0 7-4 13-10 13z" fill="#FFB347" stroke="#1C1A17" stroke-width="${px}"/>`;
    case 'emberCirclet': return `<path d="M${cx - rx + 2} 82C${cx - 10} 72 ${cx + 20} 70 ${cx + rx + 3} 78" fill="none" stroke="#6E6A64" stroke-width="${Math.max(6, 2.5 * px)}"/><path d="M${cx + 24} 66l7 8l-7 8l-7 -8z" fill="#FFB347" stroke="#1C1A17" stroke-width="${px}"/>`;
    case 'tallCowl': return `<path d="M${cx - rx - 14} 210C${cx - rx - 20} 110 ${cx - rx - 8} 40 ${cx + 2} 2C${cx + rx + 8} 40 ${cx + rx + 22} 90 ${cx + rx + 12} 106C${cx + rx - 4} 90 ${cx + rx - 28} 68 ${cx - 4} 68C${cx - rx + 8} 76 ${cx - rx + 6} 140 ${cx - rx + 12} 210Z" fill="#2B2A28" ${ink}/><path d="M${cx - 2} 68C${cx - rx + 8} 76 ${cx - rx + 6} 140 ${cx - rx + 12} 210" fill="none" stroke="${banner}" stroke-width="${Math.max(4, 1.6 * px)}"/>`;
    case 'ashHood': return hood('#6E6A64', '#4A4744') + `<path d="M${cx - 6} 70C${cx + 20} 70 ${cx + rx} 82 ${cx + rx + 10} 100C${cx + 20} 86 ${cx} 86 ${cx - 20} 92Z" fill="#1C1A17" opacity=".35"/>`;
    case 'barkHelm': return cap('#6B4A2B', 92) + (lod >= 2 ? [0, 1, 2, 3].map((k) => `<path d="M${cx - rx + 4 + k * 26} ${98 - k * 4}L${cx - rx + 14 + k * 24} ${cy - ry + 4 + Math.abs(k - 1.5) * 6}" stroke="#4A3420" stroke-width="${1.6 * px}"/>`).join('') : '') + `<path d="M${cx - 18} ${cy - ry - 2}l-8 -18l-6 6M${cx + 20} ${cy - ry - 4}l6 -16l8 4" stroke="#CFC6B4" stroke-width="${Math.max(6, 2.4 * px)}" stroke-linecap="round" fill="none"/>`;
    case 'leafHood': return hood('#4E6B3A', null) + (lod >= 2 ? Array.from({ length: 9 }, (_, k) => { const t = k / 8, x = cx + rx + 10 - t * (rx + 20), y = 104 - Math.sin(t * Math.PI) * 30 + t * 30; return `<ellipse cx="${x}" cy="${y}" rx="9" ry="5" transform="rotate(${-20 + k * 14} ${x} ${y})" fill="#6E8F4E" stroke="#2F4A26" stroke-width="${px}"/>`; }).join('') : '');
    case 'wreath': return Array.from({ length: 11 }, (_, k) => { const a = Math.PI * (1.05 + (k / 10) * 0.95), x = cx + 4 + Math.cos(a) * (rx + 4), y = cy - 22 + Math.sin(a) * 26; return `<ellipse cx="${x}" cy="${y}" rx="10" ry="5" transform="rotate(${(a * 180) / Math.PI + 90} ${x} ${y})" fill="${k % 2 ? '#5E7F45' : '#7FA05A'}" stroke="#2F4A26" stroke-width="${px}"/>`; }).join('');
    case 'twigCirclet': return `<path d="M${cx - rx + 2} 80C${cx - 10} 70 ${cx + 20} 68 ${cx + rx + 3} 76" fill="none" stroke="#5E4630" stroke-width="${Math.max(5, 2 * px)}"/><path d="M${cx - 20} 74l-6 -14M${cx + 4} 70l2 -16M${cx + 28} 70l8 -12" stroke="#5E4630" stroke-width="${Math.max(4, 1.6 * px)}" stroke-linecap="round"/><ellipse cx="${cx + 6}" cy="52" rx="6" ry="3" fill="#7FA05A"/>`;
    case 'antlerHood': return hood('#5E4630', '#3E2E20') + `<path d="M${cx - 22} ${cy - ry + 10}c-10 -20 -28 -30 -46 -40M${cx - 44} ${cy - ry - 12}l-6 -22M${cx + 22} ${cy - ry + 6}c8 -22 22 -34 40 -44M${cx + 44} ${cy - ry - 20}l12 -14" stroke="#1C1A17" stroke-width="${Math.max(10, 3.6 * px)}" stroke-linecap="round" fill="none"/><path d="M${cx - 22} ${cy - ry + 10}c-10 -20 -28 -30 -46 -40M${cx - 44} ${cy - ry - 12}l-6 -22M${cx + 22} ${cy - ry + 6}c8 -22 22 -34 40 -44M${cx + 44} ${cy - ry - 20}l12 -14" stroke="#CFC6B4" stroke-width="${Math.max(7, 2.6 * px)}" stroke-linecap="round" fill="none"/>`;
    case 'helm': {
      const kv = { levy: 0, hunter: 3, mountaineer: 2, reedman: 1 }[outfit] ?? v;
      if (kv === 0) return `<path d="M${cx - rx - 26} 90Q${cx + 4} 70 ${cx + rx + 26} 86L${cx + rx + 22} 94Q${cx + 4} 80 ${cx - rx - 22} 98Z" fill="#7A7670" ${ink}/>` + cap('#8F8C88', 90);
      if (kv === 1) return `<path d="M${cx - rx - 4} 100C${cx - rx} 40 ${cx + 4} 20 ${cx + 10} 18C${cx + 18} 24 ${cx + rx + 6} 50 ${cx + rx + 6} 86L${cx + rx + 6} 92C${cx} 88 ${cx - 30} 96 ${cx - rx - 4} 112Z" fill="#9A958C" ${ink}/><path d="M${cx + rx - 2} 84L${cx + rx + 4} 84L${cx + rx + 6} 120L${cx + rx} 122Z" fill="#9A958C" ${ink}/>`;
      if (kv === 2) return hood('#7A7670', null) + (lod >= 2 ? Array.from({ length: 40 }, (_, k) => `<circle cx="${cx - rx - 10 + (k % 8) * 12}" cy="${60 + Math.floor(k / 8) * 26 + (k % 2) * 6}" r="1.6" fill="#5E5953"/>`).join('') : '');
      return cap('#6B4A2B', 94) + `<path d="M${cx - rx - 4} 108C${cx - 20} 94 ${cx + 10} 88 ${cx + rx + 6} 90" fill="none" stroke="#4A3420" stroke-width="${Math.max(5, 2 * px)}"/>`;
    }
    case 'crown': return `<path d="M${cx - rx + 4} 64L${cx - rx + 2} 28L${cx - rx + 22} 46L${cx - 4} 14L${cx + 14} 42L${cx + 34} 18L${cx + 42} 50L${cx + rx + 2} 30L${cx + rx} 66C${cx + 20} 56 ${cx - 20} 56 ${cx - rx + 4} 64Z" fill="#B8914A" ${ink}/><path d="M${cx - rx + 6} 62C${cx - 20} 54 ${cx + 20} 54 ${cx + rx - 2} 64" fill="none" stroke="#D4B26A" stroke-width="${Math.max(3, 1.2 * px)}"/><circle cx="${cx + 4}" cy="52" r="5" fill="#FD6533" stroke="#1C1A17" stroke-width="${px}"/>`;
  }
  return '';
}
function portraitOf(c, size, extra = {}) {
  const T = PTYPES[c.ptype], side = T.side;
  return portraitSVG({ id: c.id, ptype: c.ptype, hpFrac: c.hp ? c.hp[0] / c.hp[1] : 1, pips: c.pips ?? '', holy: c.holy, prophet: !!c.prophet, pretender: !!c.crown, scout: !!c.scout, stealthy: !!c.stealthy, gear: c.gear, label: cname(c), allegiance: side === 'red' ? 'own' : side === 'green' ? 'other' : 'independent', ...extra }, size);
}
const pspan = (svg) => `<span class="pface">${svg}</span>`;
