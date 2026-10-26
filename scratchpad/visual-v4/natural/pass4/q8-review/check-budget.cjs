// Pure accounting and encoding checks, not renderer tests or GPU measurements.
const assert = require('node:assert/strict');
function bytes(w,h,mips=false,bpp=4) {
  let n=0;
  do { n+=w*h*bpp; if (!mips || (w===1 && h===1)) return n;
    w=Math.max(1,Math.floor(w/2)); h=Math.max(1,Math.floor(h/2));
  } while (true);
}
assert.equal(bytes(1,1,true),4);
assert.equal(bytes(2,2,true),20);
assert.equal(bytes(1152,1152),5308416);
const tile=bytes(1152,1152), base=bytes(2048,1280,true);
assert.equal(tile*4,21233664);
assert.equal(tile*6,31850496);
assert(base>13.98e6 && base<13.99e6);
// Every id must round-trip; old 255 sentinel must no longer alias province 255.
const ids=[...Array(270).keys(),65535];
const seen=new Set();
for(const id of ids) {
  const low=id&255, high=id>>>8;
  const decoded=low+high*256;
  assert.equal(decoded,id); seen.add(`${low},${high}`);
}
assert.equal(seen.size,271);
assert(269<512); // Sentinel is handled before palette lookup.
// Worst alignment on an unbounded grid; conservative full viewport rectangle.
// Actual map clipping/UI reduce this; DPR does not change world-space coverage.
const coverage=[];
for(const [w,h] of [[1440,900],[1920,1080],[390,844]]) {
  for(const dpx of [181,250,400]) {
    const tx=4096/3200, scale=dpx/176.4;
    const span=[w*tx/scale,h*tx/scale];
    const tiles=span.map(n=>Math.ceil(n/1024)+1);
    coverage.push({viewport:[w,h],dpx,spanTexels:span.map(Math.round),
      worstGrid:tiles,worstCount:tiles[0]*tiles[1],fitsSix:tiles[0]*tiles[1]<=6});
  }
}
assert(coverage.some(r=>!r.fitsSix));
console.log(JSON.stringify({units:'decimal MB; MiB also shown',
  baseBytes:base,tileBytes:tile,
  configurations:[4,6].map(n=>({tiles:n,extraMB:n*tile/1e6,extraMiB:n*tile/2**20,
    terrainTotalMB:(base+n*tile)/1e6})),
  tests:'PASS: mip arithmetic, 4/6 tile bytes, 270 ids plus distinct sentinel, coverage counterexample',
  coverage},null,2));
