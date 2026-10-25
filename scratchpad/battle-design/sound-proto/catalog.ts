// The proposed sound bank as data. Each row: id, bus, sample rate (kHz), mean length (s),
// variants, need tags (any match bakes it), recipe in the proposal's notation. All recipes are
// mono; stereo width comes from the mixer (dual-play of two variants, panning, reverb).
// Used to generate the proposal's tables and to compute memory and bake time.
export interface Row {
  id: string;
  bus: string;
  khz: number;
  len: number;
  v: number;
  tags: string;
  recipe: string;
  family: string;
}

const rows: Row[] = [];
let family = '';
const fam = (name: string) => (family = name);
const r = (id: string, bus: string, khz: number, len: number, v: number, tags: string, recipe: string) =>
  rows.push({ id, bus, khz, len, v, tags, recipe, family });

fam('Swings and attack motions');
r('swing.light', 'swing', 32, 0.16, 8, 'w:light', 'W > BP 900>[2800,3400]>1400 Q2, bell(0.4) + edge whistle W > BP [3800,5200] Q14 @-14; len [0.13,0.19]');
r('swing.blade', 'swing', 32, 0.22, 8, 'w:blade', 'P > BP [500,650]>[2000,2600]>800 Q1.6, bell(0.45) + whistle W > BP [2600,3600] Q12 @-12; len [0.19,0.25]');
r('swing.blade.heavy', 'swing', 32, 0.34, 6, 'w:bladeHeavy', 'P > BP 350>1600>500 Q1.3, bell(0.5) + S 90 swell @-14 + whistle BP 2200 Q10 @-16; len [0.30,0.38]');
r('swing.axe', 'swing', 32, 0.28, 8, 'w:axe', 'P > BP [300,380]>[1200,1500]>450 Q1.2, bell(0.5) + head whirr W > BP [700,900] Q6, AM [14,20] Hz depth 0.6 @-10; len [0.25,0.31]');
r('swing.axe.heavy', 'swing', 32, 0.4, 6, 'w:axeHeavy', '(B+P) > BP 220>1000>300 Q1, bell(0.55) + head whirr BP 550 Q5, AM [9,12] Hz @-9 + S 70 swell @-12; len [0.36,0.44]');
r('swing.blunt', 'swing', 32, 0.3, 6, 'w:staff', 'P > BP 250>900>350 Q1.1, bell(0.5) + wood rattle G(60/s, 2-5 ms, 600-1400 Hz, Q4) @-20; len [0.26,0.33]');
r('swing.blunt.heavy', 'swing', 32, 0.45, 6, 'w:bluntHeavy', 'B > LP 300>1100>350, bell(0.55) + S 60 swell @-8; len [0.40,0.50]');
r('swing.huge', 'swing', 32, 0.6, 4, 'w:bluntHuge', 'B > LP 160>650>200, bell(0.6) + S [38,48] swell @-4 (air pushed) + debris G(30/s, 3-8 ms, 300-900 Hz) @-24; len [0.5,0.7]');
r('thrust', 'swing', 32, 0.13, 8, 'w:thrust', 'W > BP 1000>[2600,3000] Q2.4, a/d 0.02/0.10 + cloth flap P > BP 400 Q1 a/d 0.005/0.05 @-12; len [0.11,0.15]');
r('thrust.heavy', 'swing', 32, 0.2, 6, 'w:lance', 'P > BP 600>1800 Q1.6, a/d 0.04/0.16 + shaft rattle G(80/s, 2-4 ms, 800-1600 Hz, Q5) @-18; len [0.18,0.22]');
r('swipe.claw', 'swing', 32, 0.22, 6, 'w:claw', 'three strokes at 0, [0.05,0.07], [0.10,0.14] s: W > BP [1500,2200]>[3500,4500] Q2.5, bell(0.3) over 0.06 s, + fur P > LP 1200 @-12');
r('snap.jaws', 'swing', 32, 0.2, 8, 'w:bite', 'growl onset V(f0 [70,100], u>a, rough 30 Hz 0.6, 80 ms) @-6, then at [0.07,0.10] s two teeth clicks (W > HP 2500, 3 ms, 8 ms apart) + M([1800,2400]; 1/0.02/1, 1.7/0.015/0.5)');
r('dart.sting', 'swing', 32, 0.12, 6, 'w:sting', 'SAW [220,260]>[420,520] > LP 1800, AM 120 Hz (wings) depth 0.4, a/d 0.01/0.08 + end click W > HP 4000, 2 ms');
r('whoosh.flame', 'swing', 32, 0.3, 6, 'e:fire', 'P > LP 600>2400>900, bell(0.4) + crackle G(150/s, 0.3-1.5 ms, 1.5-6 kHz, law 2.5) @-10 + hiss W > HP 3000 @-22; len [0.26,0.34]; layered @-8 on burning weapons');
r('swing.punch', 'swing', 32, 0.12, 4, 'w:unarmed', 'P > BP 400>1200 Q1, a/d 0.01/0.08 + cloth P > BP 1500 @-14');

fam('Flesh impacts and kill layers');
r('hit.cut', 'impact', 32, 0.18, 10, 'core', 'slice W > HP [3500,4500]>[1800,2400], a/d 0.001/0.05 @-4 + thump S [130,160]>[70,85]/0.03, d 0.07 @-6 + squelch W > BP [1300,1700]>[500,700] over [0.06,0.09] s Q3.5, AM [35,55] Hz 0.4 @-3; len [0.15,0.20]');
r('hit.chop', 'impact', 32, 0.24, 10, 'core', 'thump S [100,140]>[55,70]/0.03, d 0.09 + smack B > LP [900,1400], d 0.07 @-2 + bite M([600,850]; 1/0.03/1, 2.1/0.02/0.4) @-8 + squelch BP [1300,1700]>[350,550] Q3.5 over [0.07,0.12] s, AM 45 Hz @-3 + crunch G(160/s over 5-80 ms, 1-4 ms, 1.5-3.8 kHz, Q2, law 1.5) @-6; len [0.22,0.26]');
r('hit.blunt', 'impact', 32, 0.24, 10, 'core', 'thump S [80,110]>[45,55]/0.04, d 0.12 + smack B > LP [600,900], d 0.09 @-1 + crunch G(220/s over 60 ms) @-4 + body W > BP 250 Q2, d 0.08 @-8 + soft squelch BP 900>400 @-9; len [0.22,0.27]');
r('hit.pierce', 'impact', 32, 0.15, 10, 'core', 'thuk B > LP [1100,1500], a/d 0.0005/0.03 + S [150,190]>[90,110]/0.02, d 0.04 @-4 + puncture W > BP [1800,2200]>[700,900] Q4 over 0.05 s @-6; len [0.13,0.17]');
r('hit.tear', 'impact', 32, 0.22, 8, 'w:bite|w:claw', 'rip W > BP [1600,2400] Q2 gated by a pulse train [90,180] Hz duty 0.4 over [0.08,0.12] s, decaying + squelch @-4 + thump S 120>70 @-8; len [0.20,0.24]');
r('hit.burn', 'impact', 32, 0.35, 6, 'e:fire', 'sizzle W > HP [2500,3500], random AM 50-120 Hz, a/d 0.005/0.3 @-4 + thump S 120>70 @-6 + fwump P > LP 1500>400, d 0.12 @-3 + crackle G(200>20/s, law 2.5) @-6; len [0.30,0.40]');
r('hit.sting', 'impact', 32, 0.1, 4, 'w:sting', 'W > BP 2500 Q3, d 0.02 + S 300>200, d 0.03 @-6 + venom hiss W > HP 4000, d 0.06 @-14');
r('kill.crunch', 'impact', 32, 0.2, 8, 'core', 'one crack (1 ms impulse > BP [1800,2600] Q3, d 0.03) + 18-30 bone grains over [0.05,0.10] s (1-4 ms, 1.2-4.5 kHz, law 1.3), decaying + thump S [70,90], d 0.12 @-4; len [0.18,0.22]');
r('kill.thud.heavy', 'impact', 24, 0.3, 6, 'core', 'S [55,70]>[35,40]/0.06, d 0.25 + B > LP 500, d 0.18 @-2 + crunch grains @-8; len [0.28,0.32]; heavy and huge killing blows');
r('gore.squelch', 'gore', 32, 0.2, 8, 'gore', 'W > BP [700,1100] Q2.5, a/d 0.002/0.08 + 3-5 bubbles BUB([250,600], rise x1.6, t60 [0.02,0.06]) + smear P > LP 900 @-8; len [0.18,0.22]');
r('gore.spatter', 'gore', 32, 0.4, 8, 'gore', 'gush W > BP 900>500 Q1.5, d 0.12 + 6-14 droplets (W > BP [1200,3200] Q2, 4-12 ms) over [0.05,0.35] s, falling + 2-4 bubbles @-6; len [0.36,0.44]');
r('gore.tear', 'gore', 32, 0.45, 6, 'brutal', 'W gated by a pulse train 60>180 Hz > BP 600>2400 Q2 over 0.2 s + tendon snap KS([180,260], t60 0.04, bright 0.9) at [0.15,0.25] s + bone crack @-4 + gush @-6; len [0.40,0.50]');
r('gore.gurgle', 'gore', 24, 0.8, 6, 'gore', 'V(f0 [70,95], uh>o, breath 0.7, rough 12 Hz 0.7) + 6-10 bubbles BUB([180,400]) spread over the length > LP 1500; len [0.7,0.9]; tail after a death cry');

fam('Armor, shields, parries');
r('arm.plate', 'impact', 32, 0.45, 8, 'a:plate', 'M([320,560]; 1/0.30/1, 1.59/0.22/0.8, 2.14/0.16/0.6, 2.92/0.11/0.45, 3.5/0.08/0.3, 4.2/0.06/0.2) with pairs detuned 0.4% (beating) + click W > HP 4000, 3 ms @-4 + body thud S 140>90, d 0.05 @-10; 2 of 8 variants are helmet bongs: f0 [600,800], decays x1.4');
r('arm.mail', 'impact', 32, 0.25, 8, 'a:mail', '14-26 link pings over [0.06,0.12] s, each M([3000,8500]; 1/[0.01,0.03]/1, 2.4/0.008/0.4), decaying + thud B > LP 700, d 0.05 @-6 + click W > HP 3000, 2 ms @-8; len [0.22,0.28]');
r('arm.scale', 'impact', 32, 0.28, 8, 'a:scale', '8-14 plate clacks over 0.08 s, M([1500,4000]; 1/[0.015,0.04]/1, 2.2/0.01/0.4) + one plate partial set M([700,950]; arm.plate ratios, decays x0.4) @-8 + thud @-6; len [0.25,0.30]; Cinder Horde armor');
r('arm.soft', 'impact', 32, 0.12, 6, 'core', 'thwap B > LP [800,1200], a/d 0.001/0.04 + S [120,150]>80, d 0.06 @-3 + leather creak SS([180,260] Hz, 40 ms) @-18; len 0.12');
r('arm.bark', 'impact', 32, 0.28, 8, 'a:bark', 'tok M([260,420]; 1/0.06/1, 2.6/0.035/0.5, 4.1/0.02/0.3) + W > BP [900,1300] Q5, d 0.03 @-4 + splinters G(90/s over 80 ms, 1-3 ms, 1.5-4 kHz, Q2) @-10 + creak SS @-18; len [0.25,0.31]; Thornwood armor');
r('arm.wood', 'impact', 32, 0.45, 6, 'a:wood', 'bole M([140,220]; 1/0.12/1, 2.3/0.07/0.6, 3.9/0.04/0.35) + thump S 90>60, d 0.12 @-3 + splinters @-8 + creak SS([70,120] Hz, 0.25 s) @-10; len [0.40,0.50]; Oakheart, Treant');
r('arm.hide', 'impact', 32, 0.14, 6, 'a:hide', 'B > LP 600, d 0.05 + S 110>70, d 0.07 @-2 + fur rustle P > HP 2000, d 0.06 @-14');
r('arm.stone', 'impact', 32, 0.5, 6, 'a:stone', 'clack M([900,1500]; 1/0.05/1, 1.9/0.04/0.6, 3.1/0.025/0.4) + grit G(300/s over 0.15 s, 0.5-2 ms, 2-7 kHz) @-6 + debris trickle G(40/s over 0.4 s, 2-6 ms, 0.8-3 kHz) @-14 + S 180, d 0.15 @-8; len [0.45,0.55]');
r('arm.ember', 'impact', 32, 0.4, 6, 'a:ember', 'molten slap B > LP 400, d 0.06 + sizzle W > HP 3000, random AM 80 Hz, d 0.3 @-2 + thump S 110>70 @-4 + ember pops G(40/s, 0.5-2 ms, 1-4 kHz, law 2) @-8; len [0.35,0.45]');
r('arm.tick', 'impact', 32, 0.06, 4, 'a:none', 'W > BP [2500,4000] Q3, d 0.015 + S 400, d 0.02 @-8; insects, sprites');
r('glance.scrape', 'impact', 32, 0.3, 6, 'core', 'W through three BP Q25 at a plate f0 [400,700] x (2.92, 4.2, 5.4), AM by 40 Hz smoothed noise, over [0.15,0.30] s, falling; layered on metal deflections');
r('glance.ping', 'impact', 32, 0.35, 6, 'core', 'ricochet: one partial [1800,3200] Hz, t60 [0.20,0.35], gliding -1.5% + a second at x2.76 @-8');
r('shield.wood', 'impact', 32, 0.3, 8, 'shield', 'hollow thunk M([150,230]; 1/0.08/1, 1.8/0.06/0.6, 3.1/0.04/0.4) + plank slap W > BP [650,850] Q6, d 0.03, through a comb (delay [3,5] ms, feedback 0.5) @-3 + rim rattle G(60/s over 50 ms, 2-5 ms, 1-2.5 kHz) @-12 + thud S 90, d 0.08 @-6; len [0.27,0.33]');
r('shield.boss', 'impact', 32, 0.35, 4, 'shield', 'metal boss M([700,1100]; 1/0.12/1, 2.3/0.08/0.6, 3.9/0.05/0.4) + click; layered @-4 on 30% of shield blocks');
r('parry.blade', 'impact', 32, 0.7, 10, 'core', 'M([700,1300]; 1/0.6/1, 2.756/0.4/0.7, 5.404/0.22/0.45, 8.933/0.12/0.25) twice, the second detuned +0.6% @-3 (shimmer) + click W > HP 4000, 4 ms + scrape W > BP [3000,4500] Q4, jittered AM, over [0.06,0.15] s @-8; len [0.6,0.75]');
r('parry.haft', 'impact', 32, 0.25, 6, 'core', 'clack M([500,800]; 1/0.04/1, 2.7/0.025/0.5) + W > BP 1500 Q4, d 0.02 + rattle @-12; spear, halberd, staff parries');

fam('Missiles');
r('bow.short', 'missile', 32, 0.35, 6, 'w:bowShort', 'KS([110,170], t60 [0.08,0.12], bright 0.55) + bracer slap W > BP 2500 Q3, 5 ms @-4 + limb whoosh W > BP 600 Q1.5, bell over 0.06 s @-8 + nock scrape W > HP 5000, 10 ms @-16; len [0.32,0.38]');
r('bow.long', 'missile', 32, 0.45, 6, 'w:bowLong', 'KS([70,110], t60 [0.10,0.14], bright 0.6) + slap @-3 + whoosh BP 450 @-6 + stave creak SS(120 Hz, 30 ms) @-16; len [0.42,0.48]');
r('bow.ignite', 'missile', 32, 0.6, 4, 'w:bowFire', 'fwoosh P > LP 400>2000, a/d 0.03/0.3 + crackle G(120>30/s) @-6 + pitch sizzle W > HP 3000 @-14; layered on fire-arrow releases');
r('throw.javelin', 'missile', 32, 0.35, 6, 'w:javelin', 'P > BP 400>1100 Q1.4, bell(0.4) over 0.3 s + shaft wobble AM [8,12] Hz @-6; a vox.effort layer is added at play time');
r('arrow.flyby', 'missile', 32, 0.7, 8, 'missile', 'W > BP [2600,4200] Q11, center x1.06>x0.94 (logistic around the pass at [0.4,0.6] of the length: Doppler), bell(pass) + fletching flutter AM [70,110] Hz depth 0.2; len [0.55,0.80]');
r('arrow.flyby.fire', 'missile', 32, 0.75, 4, 'w:bowFire', 'arrow.flyby + crackle G(80/s) @-6 + roar P > LP 900, bell @-8; len [0.60,0.85]');
r('javelin.flyby', 'missile', 32, 0.6, 4, 'w:javelin', 'P > BP 500>900>600 Q2, spin AM [6,10] Hz depth 0.5, bell; len [0.5,0.7]');
r('volley.cloud', 'missile', 32, 1.4, 4, 'missile', '20-30 whistles (W > BP [2200,4800] Q9, pass times spread over the first 0.9 s, Doppler 6-14%, gains +-6 dB) + mass hiss P > BP 2500 Q0.8, bell(0.5) @-10; played as two variants panned apart');
r('arrow.flesh', 'impact', 32, 0.12, 8, 'missile', 'thwack B > LP 1600, a/d 0.0005/0.025 + S [150,180]>100, d 0.04 @-4 + shaft quiver S [180,260], AM [22,30] Hz, d 0.12 @-16 + wet W > BP 1800>800, d 0.04 @-8');
r('arrow.shield', 'impact', 32, 0.35, 6, 'missile', 'thock M([180,240]; 1/0.07/1, 2/0.05/0.5) + W > BP 900 Q5, d 0.02 @-2 + shaft boing S [200,320], AM [18,26] Hz, a/d 0.005/0.25 @-8; len [0.32,0.38]');
r('arrow.armor', 'impact', 32, 0.2, 8, 'missile', 'tink M([3000,4500]; 1/0.04/1, 1.9/0.02/0.5) + W > HP 5000, 2 ms; 3 of 8 variants add a ricochet whistle BP 3500 Q8 gliding down 20% over 0.12 s @-10; len [0.15,0.25]');
r('arrow.wood', 'impact', 32, 0.18, 6, 'missile', 'M([400,650]; 1/0.03/1) + snap W > BP 2200 Q2, d 0.01 + splinters G @-10; arrows into bark or wood');
r('arrow.ground.soil', 'impact', 24, 0.12, 6, 't:plains|t:farmland|t:hills', 'thup B > LP [500,800], d 0.03 + S [90,110], d 0.04 @-3 + soil G(150/s over 50 ms, 1-3 ms, 0.3-1.2 kHz) @-10');
r('arrow.ground.leaf', 'impact', 32, 0.14, 4, 't:forest', 'thup @-3 + leaf crunch G(250/s over 80 ms, 1-4 ms, 1.5-6 kHz, law 1.2)');
r('arrow.ground.rock', 'impact', 32, 0.22, 6, 't:mountains|t:wasteland|storm', 'clack M([1200,2200]; 1/0.03/1, 2.3/0.02/0.5) + skitter: 2-4 smaller pings over 0.15 s, intervals x0.65, levels x0.6 + grit @-10; len [0.18,0.26]');
r('arrow.ground.mud', 'impact', 32, 0.25, 6, 't:swamp', 'plop B > LP 400, d 0.05 + 3-6 bubbles BUB([300,900], t60 0.03-0.08) over 0.15 s + splash W > BP 1100 Q2, d 0.06 @-4; len [0.22,0.28]');
r('breath.fire', 'missile', 32, 1.2, 4, 'w:breathFire', 'inhale W > BP 800>2000 Q1 over 0.15 s @-10; jet (P+B) > LP [1000,1500], flutter AM [6,9] Hz depth 0.4, a 0.08, release 0.4 + rumble S [45,60] + B > LP 150 @-4 + crackle G(180/s, law 2.5) @-6; len [1.1,1.3]');
r('breath.gust', 'missile', 32, 1.2, 3, 'w:breathGust', 'roaring blast P > BP 300>900>400 Q0.8, bell(0.3) + debris G(80/s, 3-10 ms, 0.5-3 kHz) @-8 + S 40 @-6; the Great Wyrm');
r('draw.blade', 'swing', 32, 0.35, 4, 'core', 'shing W > BP 3000>5500 Q6 over [0.15,0.25] s + ring M([1200,1800]; parry.blade ratios) at the end @-6; intro, and archers drawing knives when out of ammunition');

fam('Movement and cavalry');
r('step.march.soft', 'loop', 24, 2, 2, 'core', 'loop: 10 marchers at [1.7,2.0] steps/s, +-40 ms jitter; each step S [80,100], d 0.03 + B > LP 600, d 0.02 @-4 + soil G @-14; gear rustle P > HP 1500, random swells @-16');
r('step.march.armored', 'loop', 24, 2, 2, 'core', 'loop: step.march.soft + 3-6 mail pings per step (4-8 kHz) @-8 + scale clacks @-12');
r('step.giant', 'body', 24, 0.7, 6, 'size4', 'S [38,48]>[26,30]/0.12, d 0.35 + B > LP 200, d 0.4 @-3 + debris G(60/s over 0.4 s, 2-8 ms, 0.4-2.5 kHz) @-12 + heel thud B > LP 900, d 0.05 @-6; len [0.6,0.8]');
r('hoof.gallop', 'loop', 24, 1.6, 3, 'mount:horse', 'loop, one horse, four-beat gallop: stride [0.36,0.42] s, beats at 0, 0.06, 0.15, 0.21 (accents 1, 0.7, 0.9, 0.6); each hoof S [70,85], d 0.03 + click W > BP [1800,2600] Q3, 2 ms @-6 + dirt @-12; tack jingle per stride @-14');
r('charge.rumble', 'loop', 24, 4, 2, 'mount:horse|mount:wolf', 'loop: B > LP [140,180] with three AM layers at stride rates [2.4,2.8] Hz, random phases, depth 0.5 + thump cloud G(40/s, S-based) @-4 + dust P > BP 300 @-12');
r('paws.run', 'loop', 24, 1.2, 3, 'mount:wolf|v:wolf', 'loop: stride [0.28,0.32] s, four soft paws (B > LP 900, d 0.015 + S 120, d 0.015 @-6) + claw clicks W > HP 3000, 1 ms @-12 + panting (breath-only V, a>uh, 3 Hz) @-10');
r('charge.crash', 'impact', 32, 1.4, 4, 'charge', '6 body thumps (S 60-100) within 0.25 s + 4 plate hits M(random f0) + 2 lance cracks + B > LP 400, a/d 0.002/0.5 + dust tail G(100>0/s over 1 s); the horse cries are separate layers');
r('lance.break', 'impact', 32, 0.4, 6, 'w:lance', 'crack 1 ms impulse > BP [900,1400] Q3, d 0.03 + M([300,500]; 1/0.05/1, 2.4/0.03/0.5) @-6 + splinters G(400/s over 0.12 s, 0.5-3 ms, 2-6 kHz, law 1.5) @-3 + shaft clatter G(30/s over 0.3 s, wood pings 0.6-1.2 kHz) @-12');
r('wings.flap', 'loop', 24, 0.5, 4, 'flying', 'whoomp P > LP 250>600>200, bell(0.3) over 0.25 s, twice + feather rustle P > HP 2000 @-14');
r('wings.huge', 'loop', 24, 1, 3, 'v:wyrm', 'B > LP 120>400>100, bell(0.35) over 0.9 s + S 30 @-6 + membrane P > BP 500 Q2, AM 12 Hz @-8');
r('buzz.swarm', 'loop', 32, 3, 2, 'v:swarm', 'loop: 8 SAW at [150,200] Hz +-8%, each with its own 0.5-2 Hz wobble of +-5% > LP 1600, AM at [110,140] Hz (wingbeat) depth 0.3');
r('crackle.sprite', 'loop', 32, 2, 2, 'v:sprite', 'loop: crackle G(60/s, law 2.5) + hiss W > HP 4000 @-18 + flutter P > LP 600, AM 4 Hz @-10');
r('horse.whinny', 'voice', 32, 1.2, 6, 'mount:horse', 'V(f0 [600,800]>[900,1100]>[350,450], warble [18,26] Hz depth 6%, F1 700 F2 1500 F3 2600, tract 0.8, breath 0.25, drive 2.5) + closing snort W > BP 600 Q1, d 0.15; len [1.0,1.4]');
r('horse.snort', 'voice', 32, 0.5, 4, 'mount:horse', 'W > BP [500,700] Q1.2, flutter AM 30 Hz, d 0.3 + lip flap');

fam('Human voices');
r('vox.effort', 'voice', 24, 0.18, 12, 'v:human', 'V(f0 [110,160]>x0.85 over 0.15 s, ae>uh (harsh) or o>uh (breathy), 25% closed m, glottal onset a 0.008, breath 0.25, drive [2,4], rough [30,60] Hz 0.2); len [0.14,0.22]');
r('vox.pain', 'voice', 24, 0.28, 12, 'v:human', 'V(f0 [140,220]: x1.15 at 0.2, x0.7 at end; a>uh or ae>o; breath 0.2>0.5; rough [40,70] Hz 0.35; drive 3); len [0.22,0.34]');
r('vox.death.scream', 'voice', 24, 0.95, 12, 'v:human', 'V(f0 [150,260]: x1.35 at 0.15, x0.9 at 0.6, x0.55 at end; vowels ae>a>o, a>a>uh or e>a>o; breath 0.1>0.15>0.6; rough [40,80] Hz [0.2,0.5]; jitter 2%, shimmer 8%; vibrato [5,7] Hz 2.5%; drive [2,4]); len [0.7,1.1]');
r('vox.death.groan', 'voice', 24, 1.2, 8, 'v:human', 'V(f0 [90,130]: x1.1 then x0.6; o>u>m; breath 0.3>0.8; rough 25 Hz 0.3; drive 1.5); len [1.0,1.4]');
r('vox.death.short', 'voice', 24, 0.45, 10, 'v:human', 'V(f0 [160,240] x1.2, cut by a glottal catch (15 ms) at [0.25,0.40] s) + exhale W > BP 1200 Q0.7 tail 0.1 s; used at 2x and above and for crowded moments');
r('vox.death.commander', 'voice', 24, 1.8, 6, 'core', 'V(f0 [85,120]: x1.25 then x0.5 over [1.5,2.0] s; a>o>u; breath to 0.8 at the end (last breath); rough 30 Hz 0.3; drive 2.5; tract [1.05,1.15])');
r('vox.panic', 'voice', 24, 0.6, 10, 'v:human', '2-3 bursts V(f0 [280,420], 0.15-0.25 s, gaps 0.06-0.10 s, a or ae, rough [60,100] Hz 0.4, breath 0.3, drive 3.5); len [0.5,0.7]');
r('vox.shout', 'voice', 24, 0.8, 8, 'core', 'V(f0 [110,150]: x1.3 then x1.1; a held > uh; drive 3.5; rough 50 Hz 0.25); a commander advancing, a squad holding');
r('vox.roar.berserk', 'voice', 24, 1, 6, 'v:berserk', 'V(f0 [90,120] with a 30% subharmonic at f0/2 (period doubling); a>o; drive 6; rough [35,45] Hz 0.6; breath 0.25); len [0.8,1.2]');
r('vox.breath.exhausted', 'loop', 24, 2, 2, 'caster', 'loop: breath-only V (a>uh) in inhale and exhale pairs at 1.4 Hz; a caster at fatigue 100');

fam('Beasts and monsters');
r('wolf.growl', 'voice', 24, 0.6, 6, 'v:wolf', 'V(f0 [60,90], u>o, rough [25,35] Hz 0.7, breath 0.4, drive 3, tract 0.7); len [0.5,0.7]');
r('wolf.yelp', 'voice', 24, 0.3, 6, 'v:wolf', 'V(f0 [700,1100]>[400,600] over 0.15 s, i>a, tract 0.6, breath 0.2); len [0.25,0.35]');
r('wolf.death', 'voice', 24, 0.9, 6, 'v:wolf', 'a yelp, then 2-3 falling whines V(f0 [500,800]>x0.6, breath rising); len [0.8,1.0]');
r('wolf.howl', 'voice', 24, 1.8, 4, 'v:wolf', 'V(f0 [380,450]>[560,650] over 0.4 s, hold with vibrato 5 Hz 2%, fall to [300,380]; u>o>u; tract 0.65; breath 0.15); len [1.6,2.0]');
r('giant.bellow', 'voice', 24, 1.6, 4, 'v:giant', 'V(f0 [55,75] x1.2 then x0.8, a>o, tract [1.5,1.7], drive 4, rough 30 Hz 0.4) + chest S f0/2 @-8; len [1.4,1.8]; the Titan plays it at rate 0.9');
r('giant.death', 'voice', 24, 2.2, 3, 'v:giant', 'V(f0 [60,70] rising x1.3, then a long fall to x0.4; breath to 0.9) + gore.gurgle-like tail @-8; len [2.0,2.4]');
r('salamander.hiss', 'voice', 32, 0.8, 4, 'v:salamander', 'W > BP [2500,4000] Q1.5, swell a/d 0.1/0.5 + sizzle + throat rattle W > BP 600, AM 40 Hz @-8; len [0.7,0.9]');
r('salamander.shriek', 'voice', 32, 1.4, 3, 'v:salamander', 'FM carrier [800,1100]>[300,400], ratio 1.5, index 2>6 + hiss @-4 > drive 3; len [1.2,1.6]');
r('treant.groan', 'voice', 24, 1.2, 4, 'v:treant', 'SS(slip rate [30,50]>[70,110]>[40,60] Hz, jitter 15%) > BP [400,900] Q5 + BP 1600 Q8 @-8 + wood M([70,110]) excited by each slip @-6; len [1.0,1.4]');
r('treant.death', 'voice', 32, 2.6, 2, 'v:treant', 'creak with rising tension SS(30>140 Hz) for 1.2 s, then the split (impulse burst > BP 600-2000 + splinters G(600/s over 0.3 s)) at [1.2,1.5] s, then the crash S 35, d 0.8 + B > LP 300, d 1.0 + debris; len [2.4,2.8]');
r('sprite.pop', 'voice', 32, 0.5, 6, 'v:sprite', 'pop W > BP 1500 Q1, a/d 0.001/0.02 + fwump P > LP 1200>300, d 0.15 @-3 + fizzle W > HP 3000, random AM, d 0.35 @-6 + sparks G(150>0/s) @-8');
r('swarm.die', 'voice', 32, 0.6, 4, 'v:swarm', '6 SAW buzz falling x1>x0.4 over 0.5 s, AM rate slowing, LP 1600>400');
r('stone.grind', 'voice', 32, 1.2, 3, 'v:stone', 'B > BP 250 Q1.5, random AM 18 Hz + grit G(400/s, 0.5-2 ms, 1-5 kHz) @-6 + S 50 @-10; the Living Monolith acting or struck hard');
r('stone.shatter', 'voice', 32, 2, 2, 'v:stone', 'crack M([700,1100]; arm.stone ratios) + burst G(1000/s over 0.2 s, then 80/s falling over 1.8 s) + rumble B > LP 200, d 1.2 @-4 + S 40, d 1.0 @-6');
r('wyrm.roar', 'voice', 24, 2, 3, 'v:wyrm', 'V(f0 [40,55] with subharmonics, a>o>u, tract 2.0, drive 6, rough 25 Hz 0.6) + breath gust P > BP 300>700 @-6; len [1.8,2.2]');
r('wyrm.death', 'voice', 24, 3, 2, 'v:wyrm', 'wyrm.roar rising to a choke (breath 0.9, rough 15 Hz 0.8), fading; fall.huge is layered at play time; len [2.8,3.2]');
r('spirit.howl', 'voice', 32, 1.2, 3, 'v:spirit', 'P > BP Q12 riding [300,500]>[700,900]>[350,450], vibrato 4 Hz + a second BP at x1.5 @-6; breath-only, ghostly');
r('colossus.roar', 'voice', 24, 1.8, 2, 'v:colossus', 'giant.bellow at tract 1.9 + fire roar P > LP 800, AM 6 Hz @-4 + crackle @-8');
r('colossus.death', 'voice', 32, 2.5, 2, 'v:colossus', 'roar > crumble: debris G + sizzle + chunks M(stone, low) + thump S 40; len [2.3,2.7]');

fam('Crowds and din');
r('chant.cinder', 'crowd', 32, 2.4, 2, 'n:cinder', '12 voices bark three times (0, 0.7, 1.4 s, +-60 ms per voice): V(f0 [90,150] x1.25>x0.8, ae>a>uh, drive 3, rough 60 Hz 0.25) + weapons beaten on shields after each bark M([160,220]; 1/0.12/1, 2.3/0.08/0.5, 3.6/0.05/0.3)');
r('chant.thorn', 'crowd', 32, 2.4, 2, 'n:thorn', '12 voices, one long rising "ohh-HAA": V(f0 [100,140] x0.9>x1.3 at 0.75 s, o>o>a, breath 0.2, drive 1.5) + spear shafts clacked twice (wood pings 500-900 Hz)');
r('chant.indep', 'crowd', 32, 2, 2, 'n:indep', '10 voices, hurrah: V(f0 [100,150], u>a, drive 2)');
r('crowd.cheer', 'crowd', 32, 3, 2, 'core', '16 voices, random onsets over 2.5 s, short exclamations V(f0 [140,260], a, e or o) + weapon clatter G(metal pings) @-10');
r('crowd.gasp', 'crowd', 32, 1.4, 2, 'core', '12 voices "ohh" V(f0 [120,180] x1.1>x0.7 over 1.0 s, o>u, breath 0.4), staggered 0-0.15 s; a side watching its commander fall');
r('crowd.panic', 'crowd', 32, 3, 2, 'core', '10 voices of vox.panic bursts over 2.5 s + 6 runners (6 steps/s, jittered) + dropped gear pings, all through LP 8000>3000 (running away)');
r('crowd.murmur', 'crowd', 24, 1, 4, 'core', '8 voices muttering V(f0 [100,140], m and uh syllables 0.10-0.25 s, breath 0.3), low; a shaken squad');
r('crowd.wounded', 'loop', 24, 8, 1, 'gore', 'loop: 6 sparse slow groaning voices + coughs (W > BP 800 bursts) + distant cries > LP 1200; the aftermath');
r('din.clash.small', 'loop', 16, 8, 1, 'core', 'loop: 40-80 mini impacts in 8 s (metal pings M 0.6-3 kHz, wood clacks, thumps), random levels; a skirmish');
r('din.clash.mass.a', 'loop', 16, 8, 1, 'big', 'loop: 400-600 mini impacts in 8 s, compressed + body rumble B > LP 200, random AM @-8');
r('din.clash.mass.b', 'loop', 16, 11, 1, 'big', 'as .a with another seed and 11 s, so the two loops realign only every 88 s');
r('din.voices', 'loop', 16, 9, 1, 'core', 'loop: 24 voices shouting and grunting short syllables V(f0 [100,220]) > LP 3500 (distance)');
r('army.idle', 'loop', 16, 10, 1, 'core', 'loop: 8 murmuring voices, very low + sparse armor jingle + coughs; before contact');

fam('Bodies and dropped gear');
r('fall.light', 'body', 24, 0.35, 8, 'core', 'B > LP [300,450], a/d 0.002/0.12 + S [70,90], d 0.1 @-4 + cloth P > BP 1500, d 0.15 @-12 + limbs (second hit at [0.08,0.15] s) @-6; len [0.30,0.40]');
r('fall.mail', 'body', 32, 0.45, 6, 'a:mail|a:scale', 'fall.light + 20-30 mail pings (3-8 kHz) over 0.15 s @-4');
r('fall.plate', 'body', 32, 0.55, 6, 'a:plate', 'fall.light + clank M([350,600]; arm.plate ratios) @-3 + a second limb clank @-8');
r('fall.large', 'body', 24, 0.9, 4, 'size3', 'S [45,60], d 0.3 + B > LP 250, d 0.35 + debris @-10 + a second impact');
r('fall.huge', 'body', 24, 1.8, 3, 'size4', 'S [30,40]>25, d 0.9 + B > LP 180, d 1.2 (the ground shakes) + debris G(100>0/s over 1.5 s, 2-10 ms, 0.3-2.5 kHz) @-8 + snap W > BP 1200 @-12; len [1.6,2.0]');
r('fall.rider', 'body', 32, 1.2, 3, 'mount:horse|mount:wolf', 'fall.large + tack rattle + the mount groaning V(f0 [180,260] falling, tract 1.3) @-6 + rider fall.light at [0.20,0.35] s @-3');
r('drop.metal', 'body', 32, 0.5, 8, 'core', '3-4 bounces at 0, 0.12, 0.20, 0.25 s (intervals x0.65, levels x0.6), each M([900,1600]; parry.blade ratios, decays 0.15>0.05) + scrape on the last @-10');
r('drop.wood', 'body', 32, 0.4, 6, 'core', '3 bounces M([400,700]; wood, d 0.04) + roll rattle');
r('drop.shield', 'body', 32, 0.5, 4, 'shield', '2-3 thunks (shield.wood, lower) + settling wobble: thunk rate 6>20 Hz over 0.3 s');
r('fall.splash', 'body', 32, 0.6, 4, 't:swamp', 'B > LP 500, d 0.08 + splash W > BP 800>1600 Q1.5, d 0.2 + 8-14 bubbles BUB([200,800]) over 0.4 s + droplets W > HP 2000 @-8; layered on falls in swamp');
r('fall.leaves', 'body', 32, 0.4, 3, 't:forest', 'leaf crunch G(500/s over 0.15 s, 1-4 ms, 1.5-7 kHz) + 2-3 twig snaps (impulse > BP 2500 Q3); layered on falls in forest');

fam('Command, morale, stingers');
const NATION = {
  cinder: { call: 'war horn, A2 0.5 s > D3 1.0 s, LP 250+1400*env Q1.3 (nasal), drive 2.5 (rasp), lip buzz AM 55 Hz 0.15', retreat: 'A2 1.0 s > E2 1.15 s (a falling fifth), wobble 15 cents at 0.5 Hz', drum: 'taiko-like: two hits 0.18 s apart (the second x0.6), each S [85,95]>[52,60]/0.04, d 0.35 + skin slap W > BP 300 Q1.2, d 0.04 @-6 + B > LP 200, d 0.4 @-10', victory: 'A2, D3, A3 rising with rasp + 5 accelerating drum hits', khz: 24 },
  thorn: { call: 'hunting horn, D3 0.3, D3 0.3, A3 0.9 s, mostly sine-like: SAW > LP 200+900*env Q0.8 + S f0 @-4, no drive', retreat: 'A3 0.8 s > D3 1.1 s (a falling fourth)', drum: 'frame drum S [130,150]>90, d 0.2 + W > BP 600 Q2, d 0.05 @-4 + rim clack M(wood 900 Hz) at 0.18 s @-6', victory: 'D3, F#3, A3 round + frame drum roll', khz: 32 },
  indep: { call: 'bugle, G3 0.25, C4 0.25, E4 0.8 s, SAW > LP 400+3000*env (bright)', retreat: 'E4 > C4 > G3 descending', drum: 'field drum S 180, d 0.1 + snare W > BP 3000 Q0.7, d 0.15 @-3, two hits', victory: 'G3, B3, D4 bright + field drum roll', khz: 24 },
} as const;
for (const [n, d] of Object.entries(NATION)) {
  r(`horn.call.${n}`, 'stinger', 32, 1.6, 2, `n:${n}`, `${d.call}; brass model: SAW f0 + SAW 2.003 f0 @-8, brightness follows loudness, onset scoop -3% over 60 ms, vibrato 5 Hz 0.6%, breath W > HP 1500 @-24`);
  r(`horn.retreat.${n}`, 'stinger', 32, 2.1, 2, `n:${n}`, `${d.retreat}; same brass model`);
  r(`horn.retreat.${n}.short`, 'stinger', 32, 1, 2, `n:${n}`, `the same call in 1.0 s, for 2x and 4x`);
  r(`drum.${n}`, 'stinger', d.khz, 0.8, 4, `n:${n}`, d.drum);
  r(`stinger.victory.${n}`, 'stinger', 32, 4, 1, `n:${n}`, `${d.victory}; the cheer is a separate crowd layer`);
}
r('banner.fall', 'stinger', 32, 1.2, 3, 'core', 'cloth P > BP 700 Q1, flapping AM [9,14] Hz rising while it falls (0.6 s) + pole lands M([250,400]; wood) + B > LP 400 thud at [0.6,0.9] s + bounce @-8');
r('boom.sub', 'stinger', 24, 2, 2, 'core', 'S 60>30/0.3, d 1.6 + B > LP 120, d 1.2 @-4; the commander-death and god-death hit');
r('heartbeat', 'stinger', 24, 0.9, 1, 'core', 'lub S 55, d 0.07 + B > LP 200 @-8; dub at 0.18 s S 48, d 0.08 x0.7; repeated at 60-70 bpm during slow motion');
r('bell.toll', 'stinger', 32, 4, 2, 'core', 'bell M(f [98,110]; partials 0.5/4.0/0.6, 1/3.0/1, 1.2/2.5/0.7, 1.5/2.0/0.5, 2/1.6/0.8, 2.5/1.2/0.4, 3/1.0/0.3, 4/0.7/0.2) + strike W > BP 1500, 5 ms; a commander fallen');
r('bell.toll.god', 'stinger', 32, 6, 1, 'pretender', 'pre-roll: the bell tail reversed for 0.8 s, then the bell at f [52,58] with decays x1.5; scheduled 0.8 s before the god dies');
r('choir.god', 'stinger', 32, 5, 1, 'pretender', '16 voices on a cluster (D3, Eb3, A3, Bb3), a and o, swell 1.5 s then decay, breath 0.3, vibrato 5 Hz 1.5%');
r('whoosh.card', 'stinger', 32, 0.5, 2, 'core', 'W > BP 800>3000 Q1, bell(0.6) over 0.4 s; the name card');
r('stinger.defeat', 'stinger', 32, 4.5, 1, 'core', 'low horn E2 for 3.0 s bending down a semitone at the end, LP 200+500*env, over wind P > BP 400, AM 0.3 Hz @-10 + one distant drum @-12');
r('stinger.withdraw', 'stinger', 32, 3, 1, 'core', 'calm horn D3 > A2, no wobble, moderate; the round-50 withdrawal');

fam('Spell beats by color');
const COLOR: Record<string, { tag: string; charge: string; release: string; travel: string; impact: string; burst: string; linger: string; extra: [string, number, number, string][] }> = {
  R: {
    tag: 'c:R',
    charge: 'riser: crackle G(20>300/s, law 2.5) @-4 + roar P > LP 300>3000 (exponential), level rising as t^2 + S 50>80 @-10',
    release: 'fwoomp: P burst > LP 4000>600, d 0.25 + S 80>240, a/d 0.002/0.15 @-6 + air W > BP 600>2000 @-6',
    travel: 'loop: flutter roar P > LP 1200, AM [12,18] Hz depth 0.5 + crackle G(120/s) @-6 + hiss W > HP 3000 @-18',
    impact: 'blast: noise > LP 3000>300, d 0.4 + S 70>40, d 0.3 @-3 + crackle tail G(200>0/s over 0.6 s) @-6',
    burst: 'explosion: W > LP 3800>180 (tau 0.25), a/d 0.002/1.2 + S [45,55] gliding x0.6 (tau 0.3), d 0.6 @-4 + crackle tail G(220 e^(-t/0.7)/s, law 2) @-6 + debris G(60/s over 1 s, 2-6 ms, 0.4-2 kHz) @-12',
    linger: 'loop: burning ground: hiss W > HP 2500 @-20 + lapping B > LP 400, random AM @0 + crackle G(70/s, law 2.5) @-2',
    extra: [['buff', 1.2, 3, 'heat swell P > LP 200>1500>400, bell(0.5) + crackle burst @-8 + roar S 60, AM 30 Hz @-10']],
  },
  G: {
    tag: 'c:G',
    charge: 'rustle swell: leaf G(50>600/s, 1-4 ms, 1.5-7 kHz) @-4 + earth rumble B > LP 120, rising + creak SS(40>90 Hz) @-10 + hum S 65 and 66.5 (beating) @-12',
    release: 'crack and thud: impulse > BP 1200 Q2 + S 70, d 0.25 + leaf burst G(800/s over 0.15 s) @-4 + soil crumble G(LP) @-8',
    travel: 'loop: a crack running along the ground: G(300/s, 0.5-2 ms, 1-4 kHz) + B > LP 150 + leaf rustle @-8',
    impact: 'thorns: 3-5 spikes (W > BP 1500>3000 Q2, 40 ms each, staggered 20-40 ms) + wood cracks M([500,900]; wood)',
    burst: 'eruption: rumble B > LP 150, swell + debris G + root cracks SS + leaf burst',
    linger: 'loop: leaves settling, sparse creaks',
    extra: [
      ['buff', 1.2, 2, 'growth: SS(60>140 Hz) + bark crackle G(200/s, 1.5-4 kHz) + rustle'],
      ['curse', 1.2, 3, 'roots: B rumble + 2-3 SS creaks + 3-4 whip snaps (impulse > BP 2000-3000, pitch-down tails) + soil crumble'],
      ['heal', 1.6, 2, 'bloom: S chord G3 B3 D4 G4, a/d 0.4/1.2, slow tremolo, FM index 0>1.5 + rustle swell @-8 + 3-5 FM chirps 2-5 kHz @-12'],
      ['summon', 2, 2, 'the earth splits: rumble riser 0.8 s + crack + rustle burst; the summoned unit adds its own sound'],
    ],
  },
  W: {
    tag: 'm2',
    charge: 'shimmer: 6-10 high S (1.5-4 kHz), tremolo 8-12 Hz, crescendo + choir 6 V(f0 220-330, a, tract 0.85) @-8',
    release: 'bell strike M(nominal [880,1320]; bell.toll ratios, short) + shing W > HP 5000, d 0.3 @-6',
    travel: 'loop: humming ray S 520, 780, 1040 with FM shimmer (ratio 1.003) + sparkle W > HP 6000 @-18',
    impact: 'holy flare: W > BP 3000 Q0.7, a/d 0.002/0.4 + bell M([700,900]), d 0.8 @-4 + S 80, d 0.15 @-6 + inner burn W > HP 4000, d 0.6 @-10',
    burst: 'radiant blast: noise > LP 8000>1000 + bell cluster + choir swell',
    linger: 'loop: a pad on fifths, slow beating',
    extra: [['buff', 1.2, 2, 'rising chime arpeggio (bell partials on C5, E5, G5) + short choir a'], ['heal', 1.6, 2, 'warm major pad + chimes'], ['summon', 2, 2, 'choir swell + armored steps + bell'], ['shock', 1.5, 2, 'dissonant bell cluster + S 70>35']],
  },
  U: {
    tag: 'm2',
    charge: 'water swirl: P > BP 500>2000 through a moving four-notch sweep + bubbles BUB(rising density) + wind W > HP @-12',
    release: 'splash: W > BP 800>2500 Q1, d 0.3 + 20 bubbles + droplets W > HP 3000',
    travel: 'loop: icy whistle W > BP [2500,3500] Q15 + tinkle G(pings 4-8 kHz, 30/s) @-10',
    impact: 'cold shatter: crack (impulse > HP 2000) + 40-80 ice shards M([2000,9000]; 1, 2.1, 3.3; d 0.01-0.08) falling over 0.4 s + crunch G(LP 3000) + S 120 @-8',
    burst: 'tidal crash: P > LP 300>3000>600, bell(0.3) over 1.8 s + B rumble + spray G',
    linger: 'loop: creaking ice SS(200-400 Hz, sparse) + drips',
    extra: [['curse', 1.2, 2, 'mist swell W > BP 1000 Q0.5 + reversed whisper'], ['drain', 1, 2, 'reversed whoosh + tinkle + low gurgle (the fatigue drain)'], ['summon', 2, 2, 'phasing chorus of detuned SAW through moving notches + glassy S']],
  },
  B: {
    tag: 'm2',
    charge: 'sub drone S 41 and 43.5 (beating), rising + reversed whisper chorus (6 breath-only V, reversed) + hiss @-14',
    release: 'dark whoosh B > LP 1200>200, d 0.5 + sigh (breath-only V, a>u, falling) @-4',
    travel: 'loop: wailing whisper, breath-only V morphing a-o-u through resonant BP sweeps',
    impact: 'decay hiss: W > HP 2000-6000, slow AM, a/d 0.01/0.7 + acid bubbles BUB([150,500], 40/s) @-6 + sizzle @-10 + flies (2 SAW 250-300 Hz, AM) @-18',
    burst: 'plague wind: P > BP 300>600 Q2, bell + hiss + flies @-12',
    linger: 'loop: bubbling rot + flies',
    extra: [['curse', 1.2, 2, 'withering: falling hiss + low moan'], ['shock', 1.5, 2, 'S 70>35 + whisper chorus + an uneven heartbeat'], ['summon', 2, 2, 'earth crumble + bone rattles (wood-like pings 1-2.5 kHz, 60/s) + low choir moan']],
  },
};
for (const [c, d] of Object.entries(COLOR)) {
  const t = d.tag;
  r(`spell.${c}.charge`, 'spell', 32, 1.4, 3, t, `${d.charge}; played from an offset so its climax lands on the release`);
  r(`spell.${c}.release`, 'spell', 32, 0.6, 3, t, d.release);
  r(`spell.${c}.travel`, 'spell', 32, 1, 2, t === 'm2' ? t : `${t}:travel`, `${d.travel}; Doppler by a playback-rate ramp`);
  r(`spell.${c}.impact`, 'spell', 32, 0.7, 4, t === 'm2' ? t : `${t}:damage`, d.impact);
  r(`spell.${c}.burst`, 'spell', 32, 2, 3, t === 'm2' ? t : `${t}:area`, d.burst);
  r(`spell.${c}.linger`, 'loop', 24, 4, 1, t === 'm2' ? t : `${t}:area`, d.linger);
  for (const [beat, len, v, recipe] of d.extra) r(`spell.${c}.${beat}`, 'spell', 32, len, v, t === 'm2' ? t : `${t}:${beat}`, recipe);
}

fam('M1 spell specifics and elements');
r('dart.flame.fly', 'spell', 32, 0.5, 3, 's:emberDart', 'W > BP 2500>1800 Q6 + crackle G(100/s) @-8 + hiss; Ember Dart in flight');
r('meteor.whistle', 'spell', 32, 0.8, 4, 's:pyreStorm', 'falling whistle W > BP 1800>900 Q8 over 0.6 s, rising level + roar P > LP 600 @-6; starts 0.25 s before each Pyre Storm meteor lands');
r('explosion.small', 'spell', 32, 1, 6, 's:pyreStorm', 'spell.R.burst at 0.4x the length and -6 dB of sub; one per meteor');
r('fury.swell', 'spell', 32, 1.4, 2, 's:bloodFury', '6 roars (vox.roar.berserk-like) > drive 5 > LP 600>3000 + S 55, AM 2 Hz (pulse)');
r('thorns.erupt', 'spell', 32, 0.5, 4, 's:thornSpray', '5-8 cracks within 80 ms (impulse > BP 1500-3000) + spike thrusts W > BP 1500>3000 Q2 + rustle tail @-6');
r('roots.burst', 'spell', 32, 1.2, 3, 's:entangle', 'spell.G.curse with louder whip snaps and a ground split at the start (impulse > BP 300 + debris)');
r('bark.grow', 'spell', 32, 1.2, 3, 's:barkSkin', 'SS(60>140 Hz) rising, three layers detuned + bark crackle G(200/s, 1.5-4 kHz) + leaf rustle @-10');
r('swarm.erupt', 'spell', 32, 1.6, 2, 's:swarm', 'earth crack (impulse > BP 400 + debris) + buzz.swarm swelling from 1 to 8 voices over 1.2 s, pitch rising 10%');
r('bless.chime', 'spell', 32, 1.2, 3, 's:bless', 'bell M(nominal [860,920]; bell.toll ratios, decays x0.4) + 3 high voices V(f0 [440,520], a, tract 0.8, breath 0.3) @-10; short form: the bell alone @-3');
r('elem.fire.sizzle', 'impact', 32, 0.4, 6, 'e:fire', 'W > HP [2500,3500], sputter AM (random 50-120 Hz), a/d 0.005/0.35 + crackle @-8; fire weapons on a wound');
r('elem.fire.ignite', 'impact', 32, 1.5, 4, 'e:fire', 'whoosh P > LP 300>2000, a 0.05 + crackle G(250>40/s) + roar P > LP 500, AM 5 Hz @-4; a troop catching fire, burning out');
r('elem.cold.shatter', 'impact', 32, 0.8, 6, 'm2', 'as spell.U.impact, smaller; cold weapons');
r('elem.holy.flare', 'impact', 32, 0.9, 4, 'm2', 'as spell.W.impact, smaller; holy weapons');
r('elem.decay.hiss', 'impact', 32, 0.9, 4, 'm2', 'as spell.B.impact, smaller; decay weapons');
r('drain.life', 'spell', 32, 0.8, 3, 'lifeDrain', 'sucking whoosh W > BP 500>2500 with a swell-then-cut envelope + gulp S 90>60 + heartbeat @-8; Umbra-blessed strikers healing');
r('regen.tick', 'spell', 32, 0.8, 3, 'regen', 'soft creak SS(80>120 Hz) + 3-5 sparkles S 2-4 kHz, d 0.2 @-12; regeneration at the end of a round, -20 dB');
r('expire.soft', 'spell', 32, 0.6, 3, 'core', 'a short bell partial set with a reversed envelope; an aura ends');
r('fire.shield', 'impact', 32, 0.6, 3, 'fireShield', 'whoosh.flame + sizzle + a lick of roar; the Ash Colossus burning those who strike it');

fam('Field effects');
r('field.storm.rain', 'loop', 32, 8, 1, 'f:storm', 'loop: 2000 drops/s (S chirps 2-6 kHz, d 0.005-0.02, random levels) + wash P > BP 3000 Q0.5 @-6 + ground roar B > LP 400 @-12');
r('field.storm.wind', 'loop', 16, 9, 1, 'f:storm', 'loop: P > BP 200-900 Q2 swept at random 0.1-0.3 Hz + whistle BP Q15 swept @-12');
r('thunder.far', 'stinger', 24, 3.5, 4, 'f:storm', '3-6 rumbles B > LP 300>120 at random onsets over 0.5-2 s, each a/d 0.02/[1.5,2.5] + S 35 @-8');
r('thunder.near', 'stinger', 32, 2.5, 3, 'f:storm', 'crack: 20 ms burst > HP 1000 + tearing crackle G(3000/s over 0.15 s), then a far rumble @-3');
r('field.fog.onset', 'spell', 24, 2, 1, 'f:fog', 'P > LP 2000>400, slow swell 1.5 s + the drone fading in');
r('field.fog.drone', 'loop', 16, 8, 1, 'f:fog', 'loop: S 110, 111.3, 164.8, 166 (beating) > LP, slow tremolo + wind P > BP 300 @-12');
r('fog.drip', 'ambience', 32, 0.3, 6, 'f:fog', 'BUB([900,1600], rise x1.8, t60 0.03) + tiny splash W > HP 3000, 3 ms @-10');
r('field.wall.rise', 'spell', 24, 2, 2, 'f:wall', 'grinding B > BP 200 Q1, random AM 18 Hz + debris G(150/s, 2-10 ms, 0.4-3 kHz) + S 35 @-4 + 4 cracks @-8; the caster color\'s impact is layered on top');
r('field.wall.crumble', 'spell', 32, 2, 2, 'f:wall', 'crack + debris falling G(500>0/s over 1.5 s) + three thuds S 50');

fam('Ambience');
const AMB: Record<string, string> = {
  plains: 'wind through grass: P > BP [350,700] Q1.5, random AM 0.05-0.2 Hz + grass rustle P > HP 2000 gated by gusts @-12 + low wind B > LP 200 @-10',
  farmland: 'wind over crops: P > BP [500,1000] steadier + denser crop rustle @-9',
  forest: 'canopy rustle P > HP 1500, gusty AM 0.1-0.4 Hz + low wind B > LP 300 @-10',
  hills: 'gusty wind P > BP 300-1200 swept slowly, gusts (attack 2 s, decay 3 s) + whistle BP Q10 @-18',
  mountains: 'howling wind: P through two BP Q8-14 sweeping 400-1200 Hz at 0.05-0.15 Hz + low roar B > LP 150 @-6',
  swamp: 'water lapping B > LP 400, AM 0.3-0.8 Hz + sparse bubbles (2/s) @-8 + low wind @-14',
  wasteland: 'dry wind P > BP 800 Q1 + sand hiss G(1000/s, 0.2-1 ms, 3-7 kHz, law 1.5) @-10 + far rumble B > LP 80, AM 0.05 Hz @-12',
};
for (const [t, d] of Object.entries(AMB)) {
  r(`amb.${t}.a`, 'loop', 16, 12, 1, `t:${t}`, `loop: ${d}`);
  r(`amb.${t}.b`, 'loop', 16, 17, 1, `t:${t}`, 'loop: the same recipe, another seed, 17 s (12 and 17 realign every 204 s)');
}
r('amb.bird.lark', 'ambience', 32, 0.8, 4, 't:plains|t:farmland', 'FM chirps: carrier 3-6 kHz, FM 20-40 Hz index 2-4, 6-14 notes and trills');
r('amb.bird.forest', 'ambience', 32, 1, 6, 't:forest', 'phrases of 3-8 notes, each a sine glide 2-5 kHz, 40-120 ms, warbles');
r('amb.crow', 'ambience', 24, 0.8, 4, 't:farmland|t:wasteland|aftermath', 'V(f0 [450,650], a, tract 0.55, drive 5, rough 70 Hz 0.5), 1-3 caws');
r('amb.hawk', 'ambience', 32, 1.5, 3, 't:hills|t:mountains', 'S 2800>2200 descending cry, vibrato 30 Hz small, 0.6 s, once or twice');
r('amb.frog', 'ambience', 24, 0.6, 6, 't:swamp', 'croak: [18,30] pulses at [40,80] Hz > BP [500,900] Q3 + BP 1500');
r('amb.insects', 'loop', 32, 6, 1, 't:swamp', 'loop: chirp trains W > HP 4000-6000 at 15-30 Hz rhythm, slow swells');
r('amb.creak.tree', 'ambience', 24, 1.2, 4, 't:forest', 'SS(40-90 Hz, slow) > BP 300 and 900 + wood M, low');
r('amb.gust', 'ambience', 16, 3, 3, 'core', 'P > BP 300>900>400 Q1, bell(0.4) over 3 s + rustle following');
r('amb.rockfall', 'ambience', 32, 1.5, 3, 't:mountains', '10-30 stone pings (M stone 1-3 kHz, d 0.02) accelerating, then slowing + dust hiss @-14');
r('amb.flag', 'loop', 24, 4, 1, 'core', 'loop: banners: P > BP 400-900, AM 6-12 Hz (flutter) in gusts + pole creak @-18');
r('amb.siege.fire', 'loop', 24, 6, 1, 'storm', 'loop: distant burning (crackle + roar) + an occasional collapse thud; a fort being stormed');

export const BANK = rows;

export const IR: Record<string, { pre: number; rt60: [number, number, number]; echoes: [number, number][]; wetDb: number; note: string }> = {
  plains: { pre: 8, rt60: [0.6, 0.5, 0.25], echoes: [[6, -6]], wetDb: -22, note: 'open and dry: the ground reflection and little else' },
  farmland: { pre: 8, rt60: [0.7, 0.6, 0.3], echoes: [[6, -6], [120, -24]], wetDb: -22, note: 'a soft far reflection from farm buildings' },
  forest: { pre: 5, rt60: [1.2, 0.9, 0.5], echoes: [[10, -12], [18, -14], [27, -15], [41, -18], [60, -22]], wetDb: -16, note: 'dense early scatter from trunks; leaves eat the highs (LP 4 kHz)' },
  hills: { pre: 10, rt60: [1.4, 1.2, 0.7], echoes: [[8, -6], [220, -14], [410, -20]], wetDb: -18, note: 'slope echoes: horns come back across the valley' },
  mountains: { pre: 12, rt60: [2.6, 2.2, 1.6], echoes: [[180, -10], [360, -14], [610, -18]], wetDb: -14, note: 'valley walls, alternating left and right; bright' },
  swamp: { pre: 6, rt60: [0.9, 0.7, 0.35], echoes: [[6, -8]], wetDb: -20, note: 'damp and dark (LP 3 kHz)' },
  wasteland: { pre: 8, rt60: [0.8, 0.7, 0.4], echoes: [[180, -14]], wetDb: -20, note: 'a slapback from a rock face' },
  walls: { pre: 4, rt60: [1.6, 1.4, 0.9], echoes: [[40, -8], [95, -12], [150, -16]], wetDb: -14, note: 'a fort being stormed: stone slaps' },
};

export function bytesOf(list: Row[]): number {
  return list.reduce((s, x) => s + x.khz * 1000 * x.len * x.v * 4, 0);
}
export function secondsOf(list: Row[]): number {
  return list.reduce((s, x) => s + x.len * x.v, 0);
}
export function select(have: Set<string>): Row[] {
  return BANK.filter((x) => x.tags.split('|').some((t) => have.has(t)));
}
