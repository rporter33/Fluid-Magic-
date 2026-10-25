'use strict';
// ---- Hud, part 2: the hover card, half-lost and the result card (split from 80-hud.js for size; behaviour unchanged) ----

Object.assign(Hud.prototype, {
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
    const chips = buffChips(T, gi, t);
    const ic = STATUS_ICON[st.cls] ? ICON[STATUS_ICON[st.cls]] : '';
    const html = `<div class="name">${glyph}${displayName(g)}</div><div class="sub">${sub}</div>${rows}<div class="status" style="color:${STATUS_COLOR[st.cls] || '#E6E1D6'}">${ic}${st.word}</div>${mods.length ? `<div class="note">${mods.join(' · ')}</div>` : ''}${chips ? `<div class="chips">${chips}</div>` : ''}`;
    if (this.last.hover !== html) { this.last.hover = html; hv.innerHTML = html; }
    hv.classList.add('show');
    let a = this.game.view.hoverAt;
    if (!a) a = window.__battle && window.__battle.screenOf(gi); // a selection with no pointer: at the group
    if (a) {
      const W = window.innerWidth, H = window.innerHeight, w = hv.offsetWidth || 214, h = hv.offsetHeight || 110;
      let x = a.x + 16, y = a.y - h - 8;
      if (x + w > W - 8) x = a.x - w - 16;
      x = clamp(x, 8, Math.max(8, W - w - 8)); // never off the screen (a phone is narrower than two cards)
      if (y < 60) y = a.y + 20;
      if (y + h > H - 8) y = H - h - 8;
      hv.style.left = x + 'px'; hv.style.top = y + 'px';
    }
  },
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
  },
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
  },
});
