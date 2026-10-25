'use strict';
// ---- layout: bands, lateral slots, formations, seats (design sections 3.2 to 3.5) ----

const LAYOUT = {
  figureH: 28, figureW: 12,
  /** Height by size on the A.3 ladder, in wu, and footprint radius. */
  sizeH: { 1: 28, 2: 42, 3: 64, 4: 95, 5: 129, 6: 168 },
  footR: { 1: 6, 2: 10, 3: 16, 4: 24, 5: 32, 6: 44 },
  frontStart: 140, bandGap: 48, edgeZone: 160, lateralPad: 120,
  slotGap: 24, slotGapEngaged: 8, cmdBehind: 24, cmdMinGap: 40,
  contactGap: 14, push: 30, literalCap: 750,
  closingStep: { 1: 40, 2: 55, 3: 80 },
  contactDur: { 1: 0.9, 2: 0.7, 3: 0.5 },
};

const FORMATION_OF = {
  ashMilitia: 'line', thornMilitia: 'line', lightInfantry: 'line', swampFighter: 'line',
  heavyInfantry: 'heavy', cinderWarrior: 'heavy', warden: 'heavy', briarGuard: 'heavy', flamebrand: 'heavy', oakheart: 'heavy',
  berserker: 'shock', archer: 'archers', flameArcher: 'archers', longbowHunter: 'archers', emberSkirmisher: 'screen',
  ashRider: 'wedge', wolfRider: 'wedge', wolf: 'pack', fireSprite: 'cloud', hornetSwarm: 'cloud',
};
const FORM = {
  line: { ranks: (n) => clamp(Math.round(Math.sqrt(n / 3)), 2, 6), fs: 18, rs: 18, jit: 1 },
  heavy: { ranks: (n) => clamp(Math.round(Math.sqrt(n / 2)), 3, 8), fs: 18, rs: 17, jit: 1 },
  shock: { ranks: (n) => clamp(Math.round(Math.sqrt(n / 2.5)), 2, 5), fs: 22, rs: 22, jit: 4 },
  archers: { ranks: (n) => clamp(Math.round(Math.sqrt(n / 6)), 1, 3), fs: 24, rs: 22, jit: 2, stagger: true },
  screen: { ranks: (n) => clamp(Math.round(Math.sqrt(n / 8)), 1, 2), fs: 30, rs: 26, jit: 6 },
  wedge: { ranks: null, fs: 26, rs: 32, jit: 2 },
  pack: { ranks: (n) => clamp(Math.round(Math.sqrt(n / 2)), 2, 6), fs: 22, rs: 22, jit: 7 },
  cloud: { ranks: (n) => clamp(Math.round(Math.sqrt(n / 2)), 2, 6), fs: 24, rs: 24, jit: 6, fly: true },
  body: { ranks: () => 1, fs: 0, rs: 0, jit: 0 },
};
function formationKind(g) {
  if (g.size >= 3) return 'body';
  return FORMATION_OF[g.unit] || (g.ranged ? 'archers' : 'line');
}

/** Seats of a block, front rank first: {u (lateral), v (depth behind the front), file, rank}. */
function blockSeats(kind, n, rng) {
  const F = FORM[kind];
  const seats = [];
  if (kind === 'wedge') {
    if (n <= 4) {
      for (let i = 0; i < n; i++) seats.push({ u: (i - (n - 1) / 2) * F.fs, v: 0, file: i, rank: 0 });
    } else {
      let left = n, r = 0;
      while (left > 0) {
        const cap = 3 + 2 * r, k = Math.min(cap, left);
        for (let i = 0; i < k; i++) seats.push({ u: (i - (k - 1) / 2) * F.fs, v: r * F.rs, file: i + (cap - k) / 2 - r, rank: r });
        left -= k; r++;
      }
    }
  } else if (kind === 'body') {
    for (let i = 0; i < n; i++) seats.push({ u: (i - (n - 1) / 2) * 60, v: 0, file: i, rank: 0 });
  } else {
    let ranks = F.ranks(n);
    let files = Math.ceil(n / ranks);
    if (files > 48) { files = 48; ranks = Math.ceil(n / 48); }
    let left = n;
    for (let r = 0; r < ranks && left > 0; r++) {
      const k = Math.min(files, left);
      const off = F.stagger && r % 2 ? 0.5 : 0;
      for (let i = 0; i < k; i++) {
        const file = i + (files - k) / 2;
        seats.push({ u: (file - (files - 1) / 2 + off) * F.fs, v: r * F.rs, file: Math.round(file * 2) / 2, rank: r });
      }
      left -= k;
    }
  }
  for (const s of seats) {
    s.u = Math.round((s.u + (rng() * 2 - 1) * F.jit) * 2) / 2;
    s.v = Math.round((s.v + (rng() * 2 - 1) * F.jit) * 2) / 2;
    s.u0 = s.u; s.v0 = s.v;
  }
  return seats;
}
function blockExtent(seats) {
  let u0 = Infinity, u1 = -Infinity, v1 = 0;
  for (const s of seats) { u0 = Math.min(u0, s.u); u1 = Math.max(u1, s.u); v1 = Math.max(v1, s.v); }
  if (!seats.length) return { u0: 0, u1: 0, w: 0, d: 0 };
  return { u0, u1, w: u1 - u0, d: v1 };
}

/**
 * Lays out both sides. Returns per group: side sign (near -1, far +1), band row, lateral
 * centre, front y, seats; plus the bands and the field rect.
 */
function layoutBattle(S) {
  const { groups } = S;
  const nearSide = S.nearSide;
  const sgn = (side) => (side === nearSide ? -1 : 1);
  const rng = streamFor(S.B.id, 'layout');
  const L = { groups: [], bands: {}, field: null };
  for (const g of groups) {
    const kind = g.isCmd && g.size < 3 ? 'commander' : formationKind(g);
    const n = g.isCmd ? 1 : g.start;
    const seats = kind === 'commander' ? [{ u: 0, v: 0, file: 0, rank: 0, u0: 0, v0: 0 }] : blockSeats(kind, n, rng);
    L.groups[g.idx] = { g, kind, s: sgn(g.side), seats, ext: blockExtent(seats), row: g.row, x: 0, yFront: 0 };
  }
  for (const side of ['attacker', 'defender']) {
    const s = sgn(side);
    const rowsOf = (row) => groups.filter((g) => g.side === side && !g.summoned && g.row === row && (!g.isCmd || g.size >= 3));
    let y = LAYOUT.frontStart; // distance from the centre line
    const bands = {};
    for (const row of ['front', 'middle', 'rear']) {
      const members = rowsOf(row);
      const blocks = members.filter((g) => !g.big).sort((a, b) => b.start - a.start || a.idx - b.idx);
      const bodies = members.filter((g) => g.big);
      const depth = Math.max(0, ...blocks.map((g) => L.groups[g.idx].ext.d), ...bodies.map(() => 0));
      const hasAny = members.length > 0 || groups.some((g) => g.side === side && g.isCmd && g.size < 3 && g.row === row);
      bands[row] = { start: y, depth, end: y + depth, used: hasAny };
      // lateral slots, centre-out alternating +x, -x
      let right = 0, left = 0, first = true;
      blocks.forEach((g, k) => {
        const lg = L.groups[g.idx];
        const w = lg.ext.w + 12;
        if (first) { lg.x = 0; right = w / 2; left = -w / 2; first = false; }
        else if (k % 2 === 1) { lg.x = right + LAYOUT.slotGap + w / 2; right = lg.x + w / 2; }
        else { lg.x = left - LAYOUT.slotGap - w / 2; left = lg.x - w / 2; }
        lg.yFront = s * y;
        lg.bandRow = row;
      });
      bodies.forEach((g) => {
        const lg = L.groups[g.idx];
        lg.yFront = s * (y + LAYOUT.footR[g.size]);
        lg.bandRow = row;
      });
      bands[row].left = left; bands[row].right = right;
      if (hasAny) y = bands[row].end + LAYOUT.bandGap;
    }
    // big bodies stand outside the side's whole frontage (the -x end), so they do not stand among
    // another band's blocks; on the near side that end covers the fewest of its own figures
    let outer = Math.min(0, ...['front', 'middle', 'rear'].map((r) => bands[r].left || 0));
    for (const g of groups.filter((q) => q.side === side && !q.summoned && q.big)) {
      const lg = L.groups[g.idx];
      const r = LAYOUT.footR[g.size] * 2.2;
      lg.x = outer - LAYOUT.slotGap - r; outer = lg.x - r;
      bands[lg.bandRow].left = Math.min(bands[lg.bandRow].left, outer);
    }
    // commanders of size 1 and 2: behind their row band, at the mean x of their squads
    const cmds = groups.filter((g) => g.side === side && g.isCmd && g.size < 3);
    const placed = [];
    for (const c of cmds) {
      const lg = L.groups[c.idx];
      const own = groups.filter((q) => q.leader === c.ref && !q.isCmd);
      const xs = own.map((q) => L.groups[q.idx].x);
      let x = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
      const band = bands[c.row].used ? bands[c.row] : bands.rear;
      const yb = (band.depth > 0 ? band.end + LAYOUT.cmdBehind : band.start);
      for (let guard = 0; guard < 40 && placed.some((p) => Math.abs(p - x) < LAYOUT.cmdMinGap); guard++) x += (guard % 2 ? -1 : 1) * LAYOUT.cmdMinGap * (1 + guard / 2);
      placed.push(x);
      lg.x = x; lg.yFront = s * yb; lg.bandRow = c.row;
    }
    L.bands[side] = bands;
    L.bands[side].back = y; // beyond the last used band
  }
  // summons: next free outer slot of their row
  for (const g of groups.filter((q) => q.summoned)) {
    const lg = L.groups[g.idx];
    const band = L.bands[g.side][g.row];
    const w = lg.ext.w + 12;
    if (Math.abs(band.right) <= Math.abs(band.left)) { lg.x = band.right + LAYOUT.slotGap + w / 2; band.right = lg.x + w / 2; }
    else { lg.x = band.left - LAYOUT.slotGap - w / 2; band.left = lg.x - w / 2; }
    lg.yFront = lg.s * band.start; lg.bandRow = g.row;
  }
  // field rect
  let half = 0;
  for (const side of ['attacker', 'defender']) for (const row of ['front', 'middle', 'rear']) {
    const b = L.bands[side][row];
    half = Math.max(half, Math.abs(b.left || 0), Math.abs(b.right || 0));
  }
  half += LAYOUT.lateralPad;
  const nearBack = L.bands[nearSide].back + LAYOUT.edgeZone;
  const farSide = nearSide === 'attacker' ? 'defender' : 'attacker';
  const farBack = L.bands[farSide].back + LAYOUT.edgeZone;
  L.field = { x0: -half, x1: half, y0: -nearBack, y1: farBack };
  L.nearSide = nearSide; L.farSide = farSide;
  return L;
}
