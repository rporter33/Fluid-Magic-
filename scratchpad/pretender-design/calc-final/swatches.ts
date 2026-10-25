// Swatch tables for B.4, checked by the rules the looks test will run:
// rule 2: every material and metal swatch reaches 3:1 against keylineFor(swatch);
// rule 3: every accent differs from every NATION_BANNERS entry by CIEDE2000 >= 15 normally and >= 10 under each simulated deficiency;
// extra: swatches within one table differ by >= 8 normally (so choices are visibly different).
import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath';
import { NATION_BANNERS, keylineFor, contrastRatio } from '/home/user/Fluid-Magic-/src/content/colors';
const T: Record<string, Record<string, string>> = {
  skin: { ash: '#8F8C88', tan: '#A0785A', umber: '#6B4A35', pale: '#D9C3A5', ochre: '#B8874A', slate: '#6F7A80', ivory: '#EDE3CF', soot: '#3E3A36' },
  stone: { granite: '#7D7A75', basalt: '#3F3D3B', sandstone: '#C2A37A', marble: '#E6E1D6', slate: '#56616A', ochre: '#A88450', moss: '#6E7A5A', obsidian: '#26232A' },
  bark: { oak: '#6B4A2B', birch: '#D8D2C2', ash: '#8C8274', ebony: '#3A2E26', cedar: '#8A5A3C', mossy: '#5F6B45', silver: '#A8A49A', lichen: '#8E9A78' },
  wood: { oak: '#7A5A3A', pale: '#C8AE86', dark: '#4A3424', red: '#8A4E36', grey: '#8E8676', green: '#5E6B47', gold: '#B08A4E', black: '#2F2822' },
  scale: { bronze: '#8A6A3E', jade: '#3F6E58', slate: '#4E5A66', bone: '#CFC4AA', rust: '#8E4F33', violet: '#5A4A6E', gold: '#B8933E', black: '#2A2628' },
  hide: { brown: '#7A5638', grey: '#8A8781', black: '#2E2A27', tawny: '#B08A55', white: '#E4DED2', russet: '#A8623E', dun: '#A39274', dark: '#4A3A2E' },
  ember: { coal: '#3A2A24', cinder: '#5A4A44', ash: '#9A928A', bronze: '#8A5E34', gilt: '#B8904A', bone: '#D2C6B0' },
  metal: { gold: '#C9A23E', silver: '#B9BEC4', bronze: '#9A6B3A', iron: '#6C6E70', bone: '#D8CDB4', obsidian: '#2B2830' },
  accent: { lichen: '#909080', heather: '#807080', seaGrey: '#708080', sage: '#709070', sand: '#B0A090', duskPlum: '#906080', oxblood: '#402020', paleAsh: '#D0D0D0' },
};
const banners = Object.values(NATION_BANNERS).flat();
let fail = 0;
for (const [table, sw] of Object.entries(T)) {
  for (const [name, hex] of Object.entries(sw)) {
    const k = keylineFor(hex); const c = contrastRatio(k, hex);
    if (table !== 'accent' && c < 3) { console.log(`FAIL rule 2 ${table}.${name} ${hex} ${c.toFixed(2)}`); fail++; }
    if (table === 'accent') for (const b of banners) for (const v of VISIONS) {
      const d = deltaE2000(labAs(hex, v), labAs(b, v)); const need = v === 'normal' ? 15 : 10;
      if (d < need) { console.log(`FAIL rule 3 accent.${name} ${hex} vs ${b} (${v}) ${d.toFixed(1)}`); fail++; }
    }
  }
  const e = Object.entries(sw);
  for (let i = 0; i < e.length; i++) for (let j = i + 1; j < e.length; j++) {
    const d = deltaE2000(labAs(e[i]![1], 'normal'), labAs(e[j]![1], 'normal'));
    if (d < 8) { console.log(`FAIL distinct ${table}: ${e[i]![0]} ${e[j]![0]} ${d.toFixed(1)}`); fail++; }
  }
}
console.log(fail ? `${fail} failures` : 'all swatch rules pass');
for (const [table, sw] of Object.entries(T)) console.log(`| ${table} | ${Object.entries(sw).map(([n, h]) => `${n} \`${h}\``).join(', ')} |`);
