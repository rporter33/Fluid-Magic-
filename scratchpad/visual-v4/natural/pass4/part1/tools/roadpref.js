(() => { const W4 = rlWorld4(), reach = 2, road = new Set();
  for (const f of W4.forts) { const o = owner[f], prev = new Map([[f, -1]]), d = new Map([[f, 0]]), q = [f];
    for (let h = 0; h < q.length; h++) { const v = q[h]; if (d.get(v) >= reach) continue; for (const w of nbrs(v).sort((a, b) => a - b)) { if (owner[w] !== o) continue;
      if (!d.has(w)) { d.set(w, d.get(v) + 1); prev.set(w, v); q.push(w); } else if (d.get(w) === d.get(v) + 1 && W4.riverOf.has(ekey(w, prev.get(w))) && !W4.riverOf.has(ekey(w, v))) prev.set(w, v); } }
    for (const [w, p] of prev) if (p >= 0) road.add(ekey(w, p)); }
  const br = [...road].filter((k) => W4.riverOf.has(k));
  return { prefRoads: road.size, prefBridges: br.map((k) => names[EDGE.get(k).i] + '/' + names[EDGE.get(k).j]), r2Roads: W4.road.size, r2Bridges: [...W4.bridges.keys()].map((k) => names[EDGE.get(k).i] + '/' + names[EDGE.get(k).j]), same: road.size === W4.road.size && [...road].every((k) => W4.road.has(k)) }; })()
