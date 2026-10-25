(async () => { const H = () => { const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data; let v = 0x811c9dc5; for (let k = 0; k < d.length; k++) { v ^= d[k]; v = Math.imul(v, 0x01000193); } return (v >>> 0).toString(16); };
  view.reduced = true; const st = () => { hoverProv = -1; RL_LINK.prov = -1; fit(); RCK = null; draw(); return H(); }; const out = {};
  setMonth(3); setMonth(40); out.fresh = st(); out.fresh2 = st(); setMonth(64); setMonth(40); out.scrub = st(); setMonth(3); setMonth(40); out.fresh3 = st();
  out.p4 = typeof P4S !== 'undefined' ? JSON.stringify(P4S) : 'none'; return out; })()
