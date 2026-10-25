'use strict';
// ---- the HUD (design section 13): edges only; DOM over the canvas ----

const ICON = {
  skull: '<svg viewBox="0 0 16 16"><path d="M8 1.5c-3.3 0-5.5 2.3-5.5 5.2 0 1.7.8 3 2 3.8V13h2v-1.5h1V13h1v-1.5h1V13h2v-2.5c1.2-.8 2-2.1 2-3.8C13.5 3.8 11.3 1.5 8 1.5z" fill="#cfc8bb"/><circle cx="5.8" cy="7" r="1.5" fill="#1c1a17"/><circle cx="10.2" cy="7" r="1.5" fill="#1c1a17"/></svg>',
  fled: '<svg viewBox="0 0 16 16"><path d="M3 2v12" stroke="#cfc8bb" stroke-width="1.6"/><path d="M3.5 2.5h7l-2 2.5 2 2.5h-7z" fill="#cfc8bb"/><path d="M9 12h6m-2-2 2 2-2 2" stroke="#cfc8bb" stroke-width="1.5" fill="none"/></svg>',
  rout: '<svg viewBox="0 0 16 16"><path d="M3 2v12" stroke="#D9543A" stroke-width="1.6"/><path d="M3.5 2.5h6l-1 1.6 1.6 1.2-1 1.2 1.4 1.5h-7z" fill="#D9543A"/><path d="M10 10l3 4M13 10l-3 4" stroke="#D9543A" stroke-width="1.4"/></svg>',
  shaken: '<svg viewBox="0 0 16 16"><path d="M8 1.5l5.5 2v4.2c0 3.1-2.3 5.6-5.5 6.8-3.2-1.2-5.5-3.7-5.5-6.8V3.5z" fill="#E3A33B"/><path d="M8.6 3.5 7 7.2l2 1.6-1.6 3.6" stroke="#1c1a17" stroke-width="1.2" fill="none"/></svg>',
  held: '<svg viewBox="0 0 16 16"><path d="M8 1.5l5.5 2v4.2c0 3.1-2.3 5.6-5.5 6.8-3.2-1.2-5.5-3.7-5.5-6.8V3.5z" fill="#9BD3A2"/><path d="M5 8l2 2 4-4.5" stroke="#1c1a17" stroke-width="1.6" fill="none"/></svg>',
  rage: '<svg viewBox="0 0 16 16"><path d="M4 7.5V5.5a1.2 1.2 0 0 1 2.4 0V5a1.2 1.2 0 0 1 2.4 0v.3a1.2 1.2 0 0 1 2.4 0v1a1.2 1.2 0 0 1 2.3.4V10c0 2.5-1.8 4-4.3 4H8.3C6 14 4 12.4 4 10z" fill="#D9543A"/></svg>',
  cast: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="5.2" stroke="#f0c070" stroke-width="1.6" fill="none"/><path d="M8 3.6l1 3.4 3.4 1-3.4 1-1 3.4-1-3.4-3.4-1 3.4-1z" fill="#fff0c0"/></svg>',
  engaged: '<svg viewBox="0 0 16 16"><path d="M2.5 2.5l9 9M13.5 2.5l-9 9" stroke="#E6E1D6" stroke-width="1.8"/><path d="M10 13l3-3M3 10l3 3" stroke="#E6E1D6" stroke-width="1.6"/></svg>',
  shoot: '<svg viewBox="0 0 16 16"><path d="M4 2c5 2 5 10 0 12" stroke="#E6E1D6" stroke-width="1.6" fill="none"/><path d="M4 2v12" stroke="#E6E1D6" stroke-width=".8"/><path d="M3 8h10m-2.5-2 2.5 2-2.5 2" stroke="#E6E1D6" stroke-width="1.3" fill="none"/></svg>',
  out: '<svg viewBox="0 0 16 16"><path d="M4 2c5 2 5 10 0 12" stroke="#8a8478" stroke-width="1.6" fill="none"/><path d="M9 9l5 5M14 9l-5 5" stroke="#cfc8bb" stroke-width="1.6"/></svg>',
  summon: '<svg viewBox="0 0 16 16"><rect x="1.5" y="5.5" width="7" height="5" rx="2.5" stroke="#d8c070" stroke-width="1.6" fill="none"/><rect x="7.5" y="5.5" width="7" height="5" rx="2.5" stroke="#d8c070" stroke-width="1.6" fill="none"/></svg>',
  crown: '<svg viewBox="0 0 16 16"><path d="M2 12l1-7 3 3 2-5 2 5 3-3 1 7z" fill="#D4B26A" stroke="#1c1a17" stroke-width=".8"/></svg>',
  pennant: (c) => `<svg viewBox="0 0 16 16"><path d="M4 2v12" stroke="#1c1a17" stroke-width="2.2"/><path d="M4 2v12" stroke="#e6dcc0" stroke-width="1"/><path d="M4.5 2.5h8l-2 2.5 2 2.5h-8z" fill="${c}" stroke="#1c1a17" stroke-width=".8"/></svg>`,
  attacker: (c) => `<svg viewBox="0 0 12 14"><path d="M1 1h10v5c0 3.5-2.4 5.8-5 7-2.6-1.2-5-3.5-5-7z" fill="${c}" stroke="#1c1a17" stroke-width="1"/></svg>`,
  defender: (c) => `<svg viewBox="0 0 12 14"><circle cx="6" cy="7" r="5.2" fill="${c}" stroke="#1c1a17" stroke-width="1"/><circle cx="6" cy="7" r="1.5" fill="#1c1a17" opacity=".5"/></svg>`,
  play: '<svg viewBox="0 0 16 16"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 16 16"><rect x="3.5" y="2.5" width="3" height="11" fill="currentColor"/><rect x="9.5" y="2.5" width="3" height="11" fill="currentColor"/></svg>',
  beats: '<svg viewBox="0 0 16 16"><path d="M8 2l5 6-5 6-5-6z" fill="currentColor"/></svg>',
  skip: '<svg viewBox="0 0 16 16"><path d="M2.5 3v10l7-5zM9.5 3v10l0 0" fill="currentColor"/><rect x="11" y="3" width="2.5" height="10" fill="currentColor"/></svg>',
  menu: '<svg viewBox="0 0 16 16"><path d="M2.5 4h11M2.5 8h11M2.5 12h11" stroke="currentColor" stroke-width="1.8"/></svg>',
  follow: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="5" stroke="currentColor" stroke-width="1.6" fill="none"/><circle cx="8" cy="8" r="1.8" fill="currentColor"/></svg>',
};
const STATUS_ICON = { dead: 'skull', fled: 'fled', rout: 'rout', held: 'held', cast: 'cast', engaged: 'engaged', shoot: 'shoot', out: 'out', summon: 'summon' };
const STATUS_COLOR = { dead: '#bdb6aa', fled: '#bdb6aa', rout: '#D9543A', held: '#9BD3A2', cast: '#f0c070', engaged: '#E6E1D6', shoot: '#E6E1D6', out: '#bdb6aa', summon: '#d8c070', wait: '#B7AD9A' };

function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
function fmtTime(s) { s = Math.max(0, s); return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0'); }

class Hud {
  constructor(game) {
    this.game = game;
    this.root = document.getElementById('hud');
    this.$ = (id) => document.getElementById(id);
    this.cardEls = new Map(); this.miniEls = new Map();
    this.last = {};
  }

  /** Card art: the approved portrait (commanders), the troop's own figure in a card pose, or a body's rig portrait. */
  cardArt(stage, g) {
    if (g.portrait) return g.portrait;
    const app = this.game.app;
    const B = stage.B;
    const c = new PIXI.Container();
    const bg = new PIXI.Graphics();
    const banner = hexToNum(B.sides[g.side].banner);
    bg.rect(0, 0, 128, 120).fill(grad(shade(banner, -0.35), shade(banner, -0.75)));
    c.addChild(bg);
    if (g.size >= 3) {
      const body = makeBigBody(g.unit, paletteFor(B, g.side));
      body.pose({ t: 0.6, h: 0, act: null, k: 0 });
      const H = body.H;
      const zoom = g.unit === 'greatWyrm' ? 1.25 : g.unit === 'treant' ? 1.3 : 1.7;
      body.root.scale.set(zoom * 120 / H);
      const hx = g.unit === 'greatWyrm' ? 128 + -150 * zoom * 120 / H : 64;
      body.root.position.set(g.unit === 'greatWyrm' ? hx : 58, g.unit === 'greatWyrm' ? 120 + 105 * zoom * 120 / H : 118);
      c.addChild(body.root);
    } else {
      const frames = stage.atlas.get(g.unit + '/' + g.side);
      const sp = new PIXI.Sprite(frames.se[FR.idle]);
      sp.anchor.set(FIG_ANCHOR.x, FIG_ANCHOR.y);
      sp.scale.set(1.9); sp.position.set(60, 118);
      c.addChild(sp);
    }
    const vg = new PIXI.Graphics();
    for (let i = 0; i < 8; i++) vg.rect(i * 2, i * 2, 128 - i * 4, 120 - i * 4).stroke({ width: 2, color: 0x000000, alpha: 0.1 });
    c.addChild(vg);
    const mask = new PIXI.Graphics(); mask.rect(0, 0, 128, 120).fill(0xffffff); c.addChild(mask); c.mask = mask;
    const cv = app.renderer.extract.canvas({ target: c, frame: new PIXI.Rectangle(0, 0, 128, 120), resolution: 1 });
    const url = cv.toDataURL('image/png');
    c.destroy({ children: true });
    return url;
  }

  build(stage) {
    this.stage = stage;
    const T = stage.T, B = stage.B, S = stage.S;
    const near = S.nearSide, far = near === 'attacker' ? 'defender' : 'attacker';
    this.near = near; this.far = far;
    this.art = S.groups.map((g) => this.cardArt(stage, g));
    // ---- enemy strip ----
    const en = this.$('enemy'); en.innerHTML = '';
    const ep = el('div', 'eplate');
    ep.innerHTML = `<span style="width:12px;height:14px;display:inline-block">${(far === 'attacker' ? ICON.attacker : ICON.defender)(B.sides[far].banner)}</span><span class="big num" id="eTroops">0</span><span class="lbl">${B.sides[far].name}</span>`;
    en.appendChild(ep);
    this.miniEls.clear();
    for (const g of this.ordered(far)) {
      const m = el('div', 'mini');
      m.innerHTML = `<img class="art" src="${this.art[g.idx]}" alt=""><div class="ico"></div><div class="cnt num"></div><div class="bar"></div>`;
      m.addEventListener('mouseenter', () => this.game.setHover(g.idx, m));
      m.addEventListener('mouseleave', () => this.game.setHover(null));
      m.addEventListener('click', () => this.game.select(g.idx));
      en.appendChild(m); this.miniEls.set(g.idx, m);
    }
    // ---- player's card bar ----
    const bar = this.$('bar'); bar.innerHTML = '';
    const pl = el('div', 'plate');
    pl.innerHTML = `<div class="who"><span class="chip" style="background:${B.sides[near].banner}"></span><span class="l">${near === 'attacker' ? 'Attacker' : 'Defender'}</span></div><div class="glyph">${(near === 'attacker' ? ICON.attacker : ICON.defender)(B.sides[near].banner)}</div><div class="troops num" id="pTroops">0</div><div class="loss num" id="pLoss"></div>`;
    bar.appendChild(pl);
    const cards = el('div', 'cards'); bar.appendChild(cards);
    this.cardEls.clear();
    for (const grp of this.groupsOf(near)) {
      const gw = el('div', 'grp');
      for (const g of grp) {
        const c = el('div', 'card');
        const corner = g.pretender ? ICON.crown : g.isCmd ? ICON.pennant(B.sides[g.side].banner) : '';
        c.innerHTML = `<img class="art" src="${this.art[g.idx]}" alt=""><div class="icons"></div><div class="corner">${corner}</div><div class="loss num"></div><div class="count num"></div><div class="fat"></div><div class="str"></div>`;
        c.title = displayName(g);
        c.addEventListener('mouseenter', () => this.game.setHover(g.idx, c));
        c.addEventListener('mouseleave', () => this.game.setHover(null));
        c.addEventListener('click', () => this.game.select(g.idx));
        c.addEventListener('dblclick', () => this.game.centerOn(g.idx));
        gw.appendChild(c); this.cardEls.set(g.idx, c);
      }
      cards.appendChild(gw);
    }
    // ---- scrubber beat icons and round ticks ----
    const sc = this.$('scrub');
    sc.querySelectorAll('.beat,.rt').forEach((e) => e.remove());
    for (const b of T.beats) {
      if (b.weight < 3) continue;
      const d = el('div', 'beat');
      d.style.left = (100 * b.t / T.duration) + '%';
      const s = 4 + b.weight * 0.35;
      d.style.width = d.style.height = s + 'px'; d.style.marginLeft = (-s / 2) + 'px';
      if (b.weight >= 10) d.style.background = 'var(--brass-hi)';
      sc.appendChild(d);
    }
    for (const r of T.rounds) { const d = el('div', 'rt'); d.style.left = (100 * r.t / T.duration) + '%'; sc.appendChild(d); }
    this.$('result').classList.remove('show');
    this.$('namecards').innerHTML = '';
    this.shownCards = new Set();
    this.last = {};
    this.lastT = undefined;
    this.buildLog();
  }

  ordered(side) { return this.groupsOf(side).flat(); }
  /** One group per commander: the commander first, its squads after, in roster order; provincial defense last. */
  groupsOf(side) {
    const gs = this.stage.S.groups.filter((g) => g.side === side);
    const out = [];
    for (const c of gs.filter((g) => g.isCmd)) out.push([c, ...gs.filter((g) => !g.isCmd && g.leader === c.ref)]);
    const rest = gs.filter((g) => !g.isCmd && !gs.some((c) => c.isCmd && c.ref === g.leader));
    if (rest.length) out.push(rest);
    return out;
  }

  buildLog() {
    const T = this.stage.T;
    const lg = this.$('log'); lg.innerHTML = '<div style="font-family:Marcellus SC,serif;font-size:16px;margin-bottom:6px">Log</div>';
    const lines = [...T.beats.map((b) => ({ t: b.t, text: b.text, b: b.weight >= 6 })), ...T.ticker.map((x) => ({ t: x.t, text: x.text, b: false }))].sort((a, b) => a.t - b.t);
    for (const l of lines) {
      const d = el('div', 'ln' + (l.b ? ' b' : ''), `<span class="tm num">${fmtTime(l.t)}</span>${l.text}`);
      d.addEventListener('click', () => this.game.seek(l.t - 0.5));
      lg.appendChild(d);
    }
  }

  statusList(gi, t) {
    const T = this.stage.T;
    const st = statusAt(T, gi, t);
    const out = [st];
    const G = T.G[gi];
    if (st.pri > 1 && G.g.tags && G.g.tags.includes('berserk') && T.F.some((f) => f.g === gi && f.wounds.length && f.wounds[0].t <= t)) out.unshift({ word: 'Raging', cls: 'rage', pri: 2 });
    return out.slice(0, 3);
  }

  update(t) {
    const st = this.stage; if (!st) return;
    // the "-n" flash belongs to playback; a seek (a jump in time) changes counts silently
    this.smooth = this.lastT !== undefined && t >= this.lastT && t - this.lastT < 0.5;
    this.lastT = t;
    const T = st.T, B = st.B, S = st.S;
    // side totals
    let pAct = 0, pStart = 0, eAct = 0;
    for (const g of S.groups) {
      if (g.isCmd) continue;
      const G = T.G[g.idx];
      const c = countAt(T, g.idx, t);
      const gone = G.leaveT !== null && t >= G.leaveT;
      if (g.side === this.near) { pStart += g.summoned ? 0 : g.start; if (!gone && !(G.routT !== null && t >= G.routT)) pAct += c; }
      else if (!gone && !(G.routT !== null && t >= G.routT)) eAct += c;
    }
    const set = (id, v) => { if (this.last[id] !== v) { this.last[id] = v; this.$(id).textContent = v; } };
    set('pTroops', pAct); set('eTroops', eAct);
    const lossTxt = pStart - pAct > 0 ? `−${pStart - pAct}` : '';
    if (this.last.pLoss !== lossTxt) { this.last.pLoss = lossTxt; this.$('pLoss').innerHTML = lossTxt ? `${lossTxt}<span class="l"> lost</span>` : ''; }
    for (const [gi, c] of this.cardEls) this.updateCard(c, gi, t, false);
    for (const [gi, m] of this.miniEls) this.updateCard(m, gi, t, true);
    // round chip
    const rr = T.rounds.filter((r) => r.t <= t);
    const r = rr.length ? rr[rr.length - 1] : null;
    const seg = T.segments.find((s) => t >= s.t0 && t < s.t1);
    const phase = seg && seg.kind ? ['scripts', 'ranged', 'melee', 'morale'].indexOf(seg.kind) : -1;
    const key = (r ? r.round : 0) + '/' + phase;
    if (this.last.round !== key) {
      this.last.round = key;
      const ch = this.$('round');
      if (ch) {
        ch.querySelector('.rn').textContent = r ? 'R' + r.round : 'R–';
        ch.querySelectorAll('.pip').forEach((p, i) => { p.className = 'pip' + (i === phase ? ' on' : i < phase ? ' done' : ''); });
        if (r && t - r.t < 0.5) { ch.classList.add('pulse'); setTimeout(() => ch.classList.remove('pulse'), 500); }
      }
    }
    // scrubber
    const sc = this.$('scrub');
    sc.querySelector('.fill').style.width = (100 * t / T.duration) + '%';
    sc.querySelector('.time').textContent = `${fmtTime(t)} / ${fmtTime(T.duration)}`;
    // ticker: beats only, one at a time, fading after 4 s
    let line = null;
    for (const b of T.beats) { if (b.t <= t && t - b.t < 4 && b.weight >= 3) line = b; }
    const tk = line ? `<span class="line${line.weight >= 10 ? ' bold' : ''}">${line.text}</span>` : '';
    if (this.last.ticker !== tk) { this.last.ticker = tk; this.$('ticker').innerHTML = tk; if (line) this.$('live').textContent = line.text; }
    // name cards
    for (const nc of T.nameCards) {
      const id = nc.g + '/' + nc.t0;
      const on = t >= nc.t0 && t < nc.t1;
      if (on && !this.shownCards.has(id)) {
        this.shownCards.add(id);
        const g = S.groups[nc.g];
        const card = el('div', 'namecard' + (nc.god ? ' god' : '') + (g.side !== this.near ? ' enemy' : ''));
        card.dataset.id = id;
        card.innerHTML = `<img src="${this.art[nc.g]}" alt=""><div><div class="t1">${nc.god ? 'THE GOD FALLS' : displayName(g)}</div><div class="t2">${nc.god ? displayName(g) + ', ' + g.unitName + ' · ' : g.unitName + ' · '}fell in round ${nc.round}${nc.text ? ', ' + nc.text : ''}</div></div>`;
        (g.side !== this.near ? this.root : this.$('namecards')).appendChild(card);
      }
      if (!on && this.shownCards.has(id)) {
        this.shownCards.delete(id);
        document.querySelectorAll(`.namecard[data-id="${id}"]`).forEach((e) => e.remove());
      }
    }
    // result card
    const res = this.$('result');
    if (t >= T.resultAt - 0.01) { if (!res.classList.contains('show')) { this.fillResult(); res.classList.add('show'); } }
    else if (res.classList.contains('show')) res.classList.remove('show');
    this.updateHover(t);
  }

  updateCard(c, gi, t, mini) {
    const T = this.stage.T;
    const G = T.G[gi], g = G.g;
    const n = countAt(T, gi, t);
    const st = this.statusList(gi, t);
    const key = n + '/' + st.map((s) => s.cls).join(',') + '/' + (g.isCmd ? hpAt(T, gi, t) : '') + '/' + (t < G.appear);
    if (c._key === key) return;
    const prev = c._n;
    c._key = key; c._n = n;
    const top = st[0];
    c.classList.toggle('dead', top.cls === 'dead'); c.classList.toggle('fled', top.cls === 'fled'); c.classList.toggle('routing', top.cls === 'rout');
    c.classList.toggle('unseen', t < G.appear);
    const cnt = c.querySelector(mini ? '.cnt' : '.count');
    const hp = g.isCmd ? hpAt(T, gi, t) : null;
    cnt.textContent = g.isCmd ? `${hp}` : `${n}`;
    const frac = g.isCmd ? hp / Math.max(1, g.maxHp) : n / Math.max(1, g.start);
    const bar = c.querySelector(mini ? '.bar' : '.str');
    bar.style.width = (100 * clamp(frac, 0, 1)) + '%';
    if (g.isCmd) bar.style.background = 'var(--hp)';
    const icons = st.filter((s) => STATUS_ICON[s.cls]).slice(0, mini ? 1 : 3).map((s) => ICON[STATUS_ICON[s.cls]]).join('');
    c.querySelector(mini ? '.ico' : '.icons').innerHTML = icons;
    if (!mini && !g.isCmd && prev !== undefined && n < prev && this.smooth) {
      const l = c.querySelector('.loss'); l.textContent = `−${prev - n}`; l.classList.add('show');
      clearTimeout(c._lt); c._lt = setTimeout(() => l.classList.remove('show'), 600);
    }
    if (!mini && g.isCmd) {
      const fat = this.fatigueAt(gi, t);
      c.querySelector('.fat').style.width = fat === null ? '0' : clamp(fat, 0, 100) + '%';
    }
  }

  fatigueAt(gi, t) {
    let f = null;
    for (const fx of this.stage.T.spellFx) if (fx.cg === gi && fx.spell !== 'breath' && fx.t0 <= t) f = fx.fatigue ?? f;
    return f;
  }

  updateHover(t) {
    const gi = this.game.view.hover ?? this.game.view.selected;
    const hv = this.$('hover');
    if (gi === null || gi === undefined) { hv.classList.remove('show'); return; }
    const T = this.stage.T, B = this.stage.B;
    const G = T.G[gi], g = G.g;
    const n = countAt(T, gi, t);
    const st = statusAt(T, gi, t);
    const glyph = (g.side === 'attacker' ? ICON.attacker : ICON.defender)(B.sides[g.side].banner);
    const sub = g.isCmd ? `${g.pretender ? g.unitName + ' · the god' : g.unitName} · ${B.sides[g.side].name}` : `${g.pd ? 'Provincial defense · ' : g.summoned ? 'Summoned · ' : ''}${B.sides[g.side].name} · ${g.row} row`;
    let rows = '';
    if (g.isCmd) {
      const hp = hpAt(T, gi, t);
      rows += `<div class="row"><span class="lbl">Hitpoints</span><div class="barw hp"><div class="b" style="width:${100 * clamp(hp / g.maxHp, 0, 1)}%"></div><span class="t num">${hp} / ${g.maxHp}</span></div></div>`;
      const fat = this.fatigueAt(gi, t);
      if (fat !== null) rows += `<div class="row"><span class="lbl">Fatigue</span><div class="barw mo"><div class="b" style="width:${clamp(fat, 0, 100)}%;background:#8fb7e0"></div><span class="t num">${fat >= 100 ? 'EXHAUSTED' : fat}</span></div></div>`;
      else rows += `<div class="note">${this.stage.S.groups.some((q) => q.leader === g.ref) && !g.tags.includes('berserk') && g.mor < 50 ? 'Routs with its squads' : 'Fights on'}</div>`;
    } else {
      const wounded = G.figs.map((i) => T.F[i]).filter((f) => (!f.death || f.death.t > t) && t >= G.appear && f.wounds.length && f.wounds[0].t <= t).length;
      rows += `<div class="row"><span class="lbl">Troops</span><div class="barw hp"><div class="b" style="width:${100 * n / g.start}%"></div><div class="w" style="left:${100 * (n - wounded) / g.start}%;width:${100 * wounded / g.start}%"></div><span class="t num">${n} / ${g.start}</span></div></div>`;
      if (wounded) rows += `<div class="note">${wounded} wounded</div>`;
      // morale: 1 - P(break) when tested, from the setup's morale and the buffs and pressure in force (S2.16)
      const R = B.rules.morale;
      const fearless = g.mor >= R.fearless || (g.tags || []).includes('berserk') || (g.tags || []).includes('mindless');
      if (fearless) rows += `<div class="row"><span class="lbl">Morale</span><div class="barw mo"><div class="b" style="width:100%"></div><span class="t">never breaks</span></div></div>`;
      else {
        let mor = g.mor;
        for (const rg of T.rings) if (rg.g === gi && rg.stat === 'mor' && t >= rg.t0 && t < rg.t1) mor += rg.delta;
        const pressure = this.halfLost(g.side, t) ? R.halfLostPressure : 0;
        const p = pBelow(R.base + pressure - mor);
        const col = p < 0.10 ? '#7fd08a' : p < 0.35 ? '#E3A33B' : '#ff7a5a';
        rows += `<div class="row"><span class="lbl">Morale</span><div class="barw mo"><div class="b" style="width:${100 * (1 - p)}%"></div><span class="t num">${Math.round(100 * (1 - p))}%</span></div></div><div class="note">breaks <b style="color:${col}">${Math.round(100 * p)}%</b> if tested${pressure ? ' · side half lost' : ''}</div>`;
      }
    }
    const mods = [];
    const terr = { forest: 'Forest +1 def', hills: 'Hills +1 def', mountains: 'Mountains +2 def' }[B.terrain];
    if (terr && g.side === 'defender') mods.push(terr);
    if (B.terrain === 'swamp' && g.side === 'attacker' && !(g.tags || []).includes('swampwalker')) mods.push('Swamp −1 att');
    if (B.storm && g.side === 'defender') mods.push(B.storm.wallsStanding ? `Behind walls +${B.rules.storm.wallsProt} prot, +${B.rules.storm.morale} mor` : `Breached walls +${B.rules.storm.breachedProt} prot`);
    const chips = T.rings.filter((rg) => rg.g === gi && t >= rg.t0 && t < rg.t1).map((rg) => `<span>${rg.stat} ${rg.delta > 0 ? '+' : ''}${rg.delta} · ${SPELL_NAMES[rg.source] || rg.source}</span>`).join('');
    const ic = STATUS_ICON[st.cls] ? ICON[STATUS_ICON[st.cls]] : '';
    const html = `<div class="name">${glyph}${displayName(g)}</div><div class="sub">${sub}</div>${rows}<div class="status" style="color:${STATUS_COLOR[st.cls] || '#E6E1D6'}">${ic}${st.word}</div>${mods.length ? `<div class="note">${mods.join(' · ')}</div>` : ''}${chips ? `<div class="chips">${chips}</div>` : ''}`;
    if (this.last.hover !== html) { this.last.hover = html; hv.innerHTML = html; }
    hv.classList.add('show');
    const a = this.game.view.hoverAt;
    if (a) {
      const W = window.innerWidth, H = window.innerHeight, w = 214, h = hv.offsetHeight || 110;
      let x = a.x + 16, y = a.y - h - 8;
      if (x + w > W - 8) x = a.x - w - 16;
      if (y < 60) y = a.y + 20;
      if (y + h > H - 8) y = H - h - 8;
      hv.style.left = x + 'px'; hv.style.top = y + 'px';
    }
  }

  halfLost(side, t) {
    const T = this.stage.T, S = this.stage.S;
    let start = 0, living = 0;
    for (const g of S.groups) {
      if (g.side !== side || g.isCmd || g.summoned) continue;
      start += g.start;
      const G = T.G[g.idx];
      if (!(G.routT !== null && t >= G.routT) && !(G.leaveT !== null && t >= G.leaveT)) living += countAt(T, g.idx, t);
    }
    return start - living > start * this.stage.B.rules.morale.halfLostShare;
  }

  fillResult() {
    const T = this.stage.T, B = this.stage.B, S = this.stage.S;
    const won = B.winner === this.near;
    const end = T.duration;
    const rows = ['attacker', 'defender'].map((side) => {
      let start = 0, killed = 0, fled = 0, survived = 0, cmdLost = 0;
      for (const g of S.groups) {
        if (g.side !== side) continue;
        const n0 = g.isCmd ? 1 : g.start;
        const n = countAt(T, g.idx, end);
        const gone = B.end[g.idx][3] === 1;
        if (!g.isCmd) { start += n0; killed += n0 - n; if (gone) fled += n; else survived += n; }
        else if (n === 0) cmdLost++;
      }
      return `<tr><td>${B.sides[side].name} <span style="color:var(--faint)">(${side})</span></td><td class="num">${start}</td><td class="num">${killed}</td><td class="num">${fled}</td><td class="num">${survived}</td><td class="num">${cmdLost}</td></tr>`;
    }).join('');
    const kills = new Map();
    for (const e of B.replay) if ((e.kind === 'melee' || e.kind === 'volley') && e.kills) kills.set(e.squad, (kills.get(e.squad) || 0) + e.kills);
    let best = null; for (const [gi, k] of kills) if (!best || k > best[1]) best = [gi, k];
    const casts = B.replay.filter((e) => e.kind === 'cast').length;
    this.$('result').innerHTML = `<h2 id="resultTitle" data-winner="${B.winner}">${won ? 'Victory' : 'Defeat'}</h2>
      <div class="sub">${B.sides[B.winner].name} ${B.winner === 'attacker' ? 'take' : 'hold'} ${B.province} · ${B.rounds} rounds · ${B.terrain}${B.storm ? ', a storm' : ''}</div>
      <table><tr><th></th><th>Start</th><th>Killed</th><th>Fled</th><th>Survived</th><th>Leaders lost</th></tr>${rows}</table>
      <div class="foot">Deadliest squad: ${best ? `${displayName(S.groups[best[0]])} (${best[1]} kills)` : '—'} · Spells cast: ${casts}</div>
      <div class="acts"><button id="rReplay">Watch again</button><button id="rLog">Log</button></div>`;
    this.$('rReplay').onclick = () => this.game.seek(0, true);
    this.$('rLog').onclick = () => this.$('log').classList.toggle('show');
  }
}
