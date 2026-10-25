'use strict';
// ---- the game and window.__battle (checks and screenshots): made last, once every module has added its methods ----

const GAME = new Game();
window.__battle = {
  ready: GAME.init().then(() => true).catch((e) => { window.__errors.push('init: ' + e.message); throw e; }),
  load: (k) => GAME.load(k),
  seek: (t) => { GAME.playing = false; GAME.seek(t); },
  play: () => { GAME.playing = true; },
  pause: () => { GAME.playing = false; },
  setSpeed: (s) => { GAME.speed = s; },
  moments: () => GAME.moments(),
  hover: (gi, x, y) => { GAME.view.hover = gi; GAME.view.hoverAt = { x, y }; GAME.render(GAME.t); },
  select: (gi) => GAME.select(gi),
  groups: () => GAME.stage.S.groups.map((g) => ({ idx: g.idx, unit: g.unit, side: g.side, start: g.start, big: g.big, cmd: g.isCmd })),
  screenOf: (gi) => { const h = GAME.stage.hull(GAME.stage.T.G[gi], GAME.t); if (!h) return null; const w = GAME.stage.world; return { x: w.position.x + h.X * w.scale.x, y: w.position.y + h.Y * w.scale.y }; },
  checks: (o) => GAME.checks(o),
  /** Re-derives the side cloth variants of a battle by measuring baked figures (slow on a software GPU). */
  lab: (k) => { const B = DATA.find((b) => b.key === k) || DATA[0]; const r = chooseSideLooks(GAME.app.renderer, B); return { key: sideLookKey(B), table: SIDE_LOOK_TABLE[sideLookKey(B)] || null, ...r }; },
  state: () => ({ key: GAME.key, t: GAME.t, duration: GAME.stage.T.duration, speed: GAME.speed, figures: GAME.stage.T.F.length, build: GAME.buildMs }),
  game: GAME,
};
