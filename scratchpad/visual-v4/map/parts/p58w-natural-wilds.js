// ------------------------------------------------------------------ the natural wilds' shared rows, and the data modes' wild layer
// Pass 3: the natural wilds are p58x (heights), p58y (colour, the bake's wild texels, the draw) and p59x (the outline). Pass 2's generator, texel, apron, mirror and
// canvas sculpture that lived here are removed (rules judge graft 3); the mere's reeds and ripples are in its own raster (p58y). What stays here: the cap's margin (the
// passable mountains' brightest lit rock, p99.9, plus RL_NW.margin L*: no rock texel of a wild over it, p58m measures it) and the data modes' v4 wild layer.
const RL_NW = { margin: 2.5 };
// the data modes keep the v4 wild grounds in both looks (natural §9: the mode raster is identical in Natural and Clear, so R16, every mode colour 20 / 12 from the
// granite and the mere, holds unchanged): a half-resolution layer of the v4 massif and mere with their sculpture, drawn with the mode raster over the natural wilds
let RL_WML = null;
function rlWildModeLayer() {
  if (RL_WML && RL_WML.ver === RB.ver) return RL_WML.cv; const { HW, HH, hid, hLT } = RB, img = new ImageData(HW, HH), d = img.data;
  for (let y = 0, k = 0; y < HH; y++) for (let x = 0; x < HW; x++, k++) { const lt = hLT[k]; if (hid[k] === 255 || (lt !== 7 && lt !== 8)) continue; rlWildTexel(RB, lt, x * 2, y * 2, d, k * 4); }
  const cv = makeCanvas(HW, HH), g = cv.getContext('2d'); g.putImageData(img, 0, 0); g.setTransform(HW / W, 0, 0, HH / H, 0, 0); rlSculptWilds(g); g.setTransform(1, 0, 0, 1, 0, 0);
  RL_WML = { cv, ver: RB.ver }; return cv;
}
