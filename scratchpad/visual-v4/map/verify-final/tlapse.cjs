// the layout check through the whole time-lapse at the start view, Mid and Near, plus the event markers at the start view
const { launch, open, PAGE } = require('./vlib.cjs');
(async () => { const b = await launch(), errors = []; const p = await open(b, PAGE, { errors });
  for (const [n, s] of [['start', null], ['mid', 1.0], ['near', 'max'], ['far', 'min']]) {
    const r = await p.evaluate(([s]) => { const m = window.__mock, bad = [], ev = new Set(), evNoTown = new Set(); if (s) m.setScale(s === 'max' ? m.maxScale() * 0.9 : s === 'min' ? m.minScale() : s, 640, 480); else m.ev('fitToCloth()');
      for (let M = 3; M <= 70; M += 1) { m.setMonth(M); const v = m.reliefLayout(); if (v.labelOverlaps || v.labelPieceOverlaps || v.pieceOverlaps || v.armiesOutsideInset) bad.push({ M, ll: v.labelOverlaps, lp: v.labelPieceOverlaps, pp: v.pieceOverlaps, out: v.armiesOutsideInset });
        const L = m.ev('RL_PIECE_CACHE.get("L")'); for (const e of L.events) { const tag = m.ev('names')[e.p.i] + ':' + [e.p.siege ? 'siege' : '', e.p.pillage ? 'pillage' : '', e.p.scar || '', e.p.unrest >= 50 ? 'unrest' : ''].filter(Boolean).join('+'); ev.add(tag); if (!e.st.kind) evNoTown.add(tag); } }
      m.setMonth(3); return { bad, events: [...ev].slice(0, 30), eventsAtSeatsWithoutPiece: [...evNoTown].slice(0, 20) }; }, [s]);
    console.log(n, r.bad.length ? 'OVERLAPS ' + JSON.stringify(r.bad) : 'clean (months 3-70)', '| events', r.events.length, '| at hidden seats', JSON.stringify(r.eventsAtSeatsWithoutPiece));
  }
  console.log('errors', JSON.stringify(errors.filter((x) => !/software WebGL|willReadFrequently/.test(x)))); await b.close(); })();
