import { labAs, deltaE2000 } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
const warm: Record<string, string> = { 'Candle Glow': '#FFE8C3', 'Candle Flame': '#FFF4A1', 'Carolling Candlelight': '#FFB850', 'Mead': '#FFC878', 'Firelight': '#F9D97B', '1900K': '#FF8400', '2700K': '#FFA757', 'Brass': '#B5A642', 'Brass Buttons': '#DFAC4C', 'Brass Nail': '#DBBD76', 'Bronzed Brass': '#9B7E4E', 'Light Oak': '#D2B183', 'Golden Oak': '#A96A28', 'Pewter': '#91A092', 'warm token #E8A15A': '#E8A15A' };
const mana: Record<string, string> = { 'W prim #F3E6B8': '#F3E6B8', 'W sec #D9B85C': '#D9B85C', 'R prim #FD6533': '#FD6533', 'R acc #FFB347': '#FFB347', 'G acc #A6D96A': '#A6D96A', 'Indep #8C8A80': '#8C8A80', 'Indep acc #C9C4B0': '#C9C4B0' };
for (const [wn, wh] of Object.entries(warm)) {
  const near = Object.entries(mana).map(([mn, mh]) => [mn, deltaE2000(labAs(wh, 'normal'), labAs(mh, 'normal'))] as const).sort((a, b) => a[1] - b[1]).slice(0, 2);
  console.log(`${wn.padEnd(22)} ${wh}  nearest: ${near.map(([n, d]) => `${n} dE ${d.toFixed(1)}`).join(', ')}`);
}
