'use strict';
// ---- after the build: sorting, the panel's counts, camera boxes, the time map ----

function finishTimeline(T) {
  const byT = (a, b) => a.t - b.t;
  for (const f of T.F) { f.strikes.sort(byT); f.reacts.sort(byT); f.shots.sort(byT); f.wounds.sort(byT); }
  T.bursts.sort(byT); T.decals.sort(byT); T.beats.sort(byT); T.ticker.sort(byT); T.camera.sort(byT);
  T.projectiles.sort((a, b) => a.t0 - b.t0);
  T.spellFx.sort((a, b) => a.t0 - b.t0);
  // panel counts: a group's count changes at the death cue that shows it (S2.15)
  T.deathTimes = T.G.map((G) => G.figs.map((i) => T.F[i]).filter((f) => f.death).map((f) => f.death.t).sort((a, b) => a - b));
  // camera boxes in the screen plane: the union of the figures at the key's time
  const p = { x: 0, y: 0, h: 0 };
  for (const k of T.camera) {
    let X0 = Infinity, X1 = -Infinity, Y0 = Infinity, Y1 = -Infinity;
    for (const fi of k.figs) {
      const f = T.F[fi];
      figPos(T, f, k.t + 0.5, p);
      const g = T.G[f.g].g;
      const H = (LAYOUT.sizeH[g.size] || 28) * (g.isCmd && g.size < 3 ? 1.15 : 1);
      const X = sx(p.x, p.y), Y = sy(p.x, p.y, p.h);
      const wide = g.size >= 3 ? H * 1.2 : 8;
      X0 = Math.min(X0, X - wide); X1 = Math.max(X1, X + wide);
      Y0 = Math.min(Y0, Y - H * CP); Y1 = Math.max(Y1, Y + 4);
    }
    if (!isFinite(X0)) { k.box = null; continue; }
    const pw = (X1 - X0) * k.pad, ph = (Y1 - Y0) * k.pad;
    k.box = { x0: X0 - pw, x1: X1 + pw, y0: Y0 - ph, y1: Y1 + ph };
  }
  T.camera = T.camera.filter((k) => k.box);
  // the whole-field box (t = 0): every block, commander and body of both sides plus 10%
  {
    let X0 = Infinity, X1 = -Infinity, Y0 = Infinity, Y1 = -Infinity;
    for (const f of T.F) {
      if (T.G[f.g].appear !== -Infinity) continue;
      figPos(T, f, 2.5, p);
      const g = T.G[f.g].g;
      const H = LAYOUT.sizeH[g.size] || 28;
      const X = sx(p.x, p.y), Y = sy(p.x, p.y, p.h);
      X0 = Math.min(X0, X - (g.size >= 3 ? H : 8)); X1 = Math.max(X1, X + (g.size >= 3 ? H : 8));
      Y0 = Math.min(Y0, Y - H * CP); Y1 = Math.max(Y1, Y + 4);
    }
    const pw = (X1 - X0) * 0.1, ph = (Y1 - Y0) * 0.1;
    T.allBox = { x0: X0 - pw, x1: X1 + pw, y0: Y0 - ph, y1: Y1 + ph };
    // the opening frame also holds the scene's set pieces (critique fix 9)
    T.setPieces = setPiecesFor(T.S.B, T.L.field);
    if (T.wall && T.wall.gate) { // the gatehouse, the storm's focal piece
      const g = T.wall.gate, s = T.wall.defSign;
      const pts = [[g.x - 60, -s * 40, 0], [g.x + 60, -s * 40, 0], [g.x - 60, s * 30, T.wall.h + 60], [g.x + 60, s * 30, T.wall.h + 60]];
      const Xs = pts.map(([x, y]) => sx(x, y)), Ys = pts.map(([x, y, h]) => sy(x, y, h));
      T.setPieces.boxes.push({ x0: Math.min(...Xs), x1: Math.max(...Xs), y0: Math.min(...Ys), y1: Math.max(...Ys) });
    }
    for (const b of T.setPieces.boxes) {
      T.allBox = { x0: Math.min(T.allBox.x0, b.x0), x1: Math.max(T.allBox.x1, b.x1), y0: Math.min(T.allBox.y0, b.y0), y1: Math.max(T.allBox.y1, b.y1) };
    }
  }
  // slow motion windows -> a monotone story-to-real map (applied at 2x and below)
  T.slow.sort((a, b) => a.t0 - b.t0);
}

/** Story-time rate at t: slow motion around commander deaths. */
function storyRate(T, t, speed) {
  if (speed > 2) return 1;
  for (const s of T.slow) if (t >= s.t0 && t < s.t1) return s.rate;
  return 1;
}

function countAt(T, gi, t) {
  const G = T.G[gi];
  if (t < G.appear) return 0;
  const dt = T.deathTimes[gi];
  const dead = upperBound(dt, t, (x) => x);
  return G.figs.length - dead;
}
function hpAt(T, gi, t) {
  const arr = T.cmdHp[gi];
  if (!arr) return null;
  let hp = arr[0].hp;
  for (const e of arr) if (e.t <= t) hp = e.hp; else break;
  return hp;
}
/** The status word of a group at t (design 13.4). */
function statusAt(T, gi, t) {
  const G = T.G[gi];
  const n = countAt(T, gi, t);
  if (t < G.appear) return { word: 'Not yet summoned', cls: 'wait', pri: 9 };
  if (n === 0) return G.g.isCmd ? { word: 'Dead', cls: 'dead', pri: 1 } : { word: 'Wiped out', cls: 'dead', pri: 1 };
  if (G.leaveT !== null && t >= G.leaveT) return { word: 'Fled', cls: 'fled', pri: 1 };
  if (G.routT !== null && t >= G.routT) return { word: 'Routing', cls: 'rout', pri: 1 };
  for (const gl of T.glyphs) if (gl.g === gi && t >= gl.t0 && t < gl.t1) {
    if (gl.kind === 'held') return { word: `Held (${gl.roll.morale}+${gl.roll.moraleDrn} vs ${gl.roll.target}+${gl.roll.targetDrn}${gl.roll.pressure ? '+' + gl.roll.pressure : ''})`, cls: 'held', pri: 2 };
  }
  for (const fx of T.spellFx) if (fx.cg === gi && t >= fx.t0 && t < fx.impact + 0.3 && fx.spell !== 'breath') return { word: 'Casting ' + (SPELL_NAMES[fx.spell] || fx.spell), cls: 'cast', pri: 3 };
  const g = G.g;
  if (G.inContactAt && G.inContactAt(t)) return { word: 'Engaged', cls: 'engaged', pri: 3 };
  if (g.ranged) {
    const ammo = Math.max(0, ...g.weapons.filter((w) => w.range > 0).map((w) => w.ammo));
    const used = G.volleyTimes ? upperBound(G.volleyTimes, t, (x) => x) : 0;
    if (used >= ammo) return { word: 'Out of arrows', cls: 'out', pri: 3 };
    return { word: `Shooting · ${ammo - used} left`, cls: 'shoot', pri: 3 };
  }
  if (g.summoned) return { word: 'Summoned', cls: 'summon', pri: 4 };
  return { word: 'Waiting', cls: 'wait', pri: 5 };
}
