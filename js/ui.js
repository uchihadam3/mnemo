/* MNEMO — interface: telas, HUD, loja, pacotes, menus */
'use strict';
(function () {
  const U = M.ui = {};
  const G = M.game, B = M.board;
  const $ = M.$, $$ = M.$$;
  let screen = null;

  /* ============ util de render ============ */
  const rarityBadge = (r) => `<span class="rar" style="--rc:${M.RARITY[r].c}">${M.RARITY[r].n}</span>`;
  const edBadge = (ed) => ed ? `<span class="edb ed-${ed}">${M.EDITIONS[ed].n}</span>` : '';

  U.relicHTML = (r, opts = {}) => {
    const d = M.RELIC[r.id];
    return `<div class="relic r${d.r}${r.ed ? ' ed-' + r.ed : ''}${opts.cls || ''}" style="--rc:${M.RARITY[d.r].c}" ${opts.attr || ''}>
      <div class="relic-in"><div class="relic-ico">${d.i}</div>${r.ed ? '<div class="ed-layer"></div>' : ''}</div></div>`;
  };
  U.relicTip = (r) => {
    const d = M.RELIC[r.id];
    const desc = d.desc ? d.desc(r, M.run) : d.d;
    return `<div class="tip-title">${d.i} ${d.n}</div><div class="tip-desc">${desc}</div>
      <div class="tip-tags">${rarityBadge(d.r)}${edBadge(r.ed)}${r.ed ? `<span class="tip-ed">${M.EDITIONS[r.ed].d}</span>` : ''}</div>`;
  };
  U.scrollHTML = (id, opts = {}) => {
    const d = M.SCROLL[id];
    return `<div class="consum scroll${opts.cls || ''}" ${opts.attr || ''}><div class="consum-in"><div class="consum-ico">${d.i}</div></div></div>`;
  };
  U.scrollTip = (id) => { const d = M.SCROLL[id]; return `<div class="tip-title">${d.i} ${d.n}</div><div class="tip-desc">${d.d}</div><div class="tip-tags"><span class="rar" style="--rc:#b46bff">Pergaminho</span>${d.when === 'round' ? '<span class="tip-ed">Use durante um salão</span>' : '<span class="tip-ed">Use a qualquer momento</span>'}</div>`; };
  U.astroHTML = (id, opts = {}) => {
    const d = M.ASTRO[id];
    const col = d.suit === 'all' ? '#888' : M.SUITS[d.suit].c;
    return `<div class="consum astro${opts.cls || ''}" style="--ac:${col}" ${opts.attr || ''}><div class="consum-in"><div class="consum-ico">${d.i}</div></div></div>`;
  };
  U.astroTip = (id) => {
    const d = M.ASTRO[id];
    let lv = '';
    if (M.run && d.suit !== 'all') { const l = M.run.suitLv[d.suit]; lv = `<div class="tip-lv">Nível ${l} → <b>${l + 1}</b></div>`; }
    return `<div class="tip-title">${d.i} ${d.n}</div><div class="tip-desc">${M.astroDesc(d)}</div>${lv}<div class="tip-tags"><span class="rar" style="--rc:#3cb4ff">Planeta</span></div>`;
  };
  U.cardHTML = (c, cls = '') => `<div class="mini-card${cls}"><div class="card"><div class="card-inner static">${M.cardFaceHTML(c)}</div></div></div>`;
  U.cardTip = (c) => {
    const R = M.RANKS[c.rank - 1];
    let t;
    if (c.enh === 'stone') t = `<div class="tip-title">🪨 Carta de Pedra</div><div class="tip-desc">Par de Pedras = <b class="chips">60 Fichas</b></div>`;
    else {
      const lv = M.run ? M.run.suitLv[c.suit] : 1, b = M.suitBase(lv), tot = b.chips + R.chips * 2;
      t = `<div class="tip-title">${R.n} · cor ${M.SUIT_COLOR[c.suit].replace(/s$/, '')}</div>
        <div class="tip-desc">Quanto vale um par desta carta:</div>
        <div class="calc-explain"><span><b class="chips">${b.chips}</b> Fichas da cor <small>(nível ${lv})</small></span><span>+ <b class="chips">${R.chips * 2}</b> Fichas das 2 cartas</span><span class="ce-tot">= <b class="chips">${tot} Fichas</b></span><span>× <b class="mult">${b.mult}+ Mult</b> <small>(sobe com o Combo e as Relíquias)</small></span></div>`;
    }
    if (c.enh) t += `<div class="tip-desc"><b class="hl">${M.ENH[c.enh].n}:</b> ${M.ENH[c.enh].d}</div>`;
    if (c.ed) t += `<div class="tip-desc"><b class="hl">${M.EDITIONS[c.ed].n}:</b> ${M.EDITIONS[c.ed].d}</div>`;
    return t;
  };
  U.itemHTML = (it, attr = '') => {
    if (it.kind === 'relic') return U.relicHTML(it.relic, { attr });
    if (it.kind === 'scroll') return U.scrollHTML(it.id, { attr });
    if (it.kind === 'astro') return U.astroHTML(it.id, { attr });
    if (it.kind === 'card') return `<div ${attr}>${U.cardHTML(it.card)}</div>`;
  };
  U.itemTip = (it) => it.kind === 'relic' ? U.relicTip(it.relic) : it.kind === 'scroll' ? U.scrollTip(it.id) : it.kind === 'astro' ? U.astroTip(it.id) : U.cardTip(it.card);
  U.itemName = (it) => it.kind === 'relic' ? M.RELIC[it.relic.id].n : it.kind === 'scroll' ? M.SCROLL[it.id].n : it.kind === 'astro' ? M.ASTRO[it.id].n : `${M.RANKS[it.card.rank - 1].n}`;

  /* ============ tooltip ============ */
  const tip = () => $('#tip');
  U.showTip = (el, html) => {
    const t = tip(); t.innerHTML = html; t.classList.add('on');
    const r = el.getBoundingClientRect();
    const tw = t.offsetWidth, th = t.offsetHeight;
    let x = r.left + r.width / 2 - tw / 2, y = r.bottom + 10;
    if (y + th > innerHeight - 8) y = r.top - th - 10;
    x = M.clamp(x, 8, innerWidth - tw - 8); y = M.clamp(y, 8, innerHeight - th - 8);
    t.style.left = x + 'px'; t.style.top = y + 'px';
  };
  U.hideTip = () => tip().classList.remove('on');
  // delegação: elementos com data-tip="tipo:arg"
  U.tipFor = (el) => {
    const k = el.dataset.tip; if (!k) return null;
    const [type, arg] = k.split(':');
    const run = M.run;
    switch (type) {
      case 'relic': return run && run.relics[arg] && U.relicTip(run.relics[arg]);
      case 'scroll': return run && run.scrolls[arg] && U.scrollTip(run.scrolls[arg].id);
      case 'shop': return run && run.shop && run.shop.items[arg] && U.itemTip(run.shop.items[arg]);
      case 'pack': { const p = run.shop.packs[arg]; const P = G.PACKS[p.type]; return `<div class="tip-title">${P.i} ${P.n}</div><div class="tip-desc">${P.d}</div>`; }
      case 'voucher': { const v = M.VOUCHER[arg]; return `<div class="tip-title">${v.i} ${v.n}</div><div class="tip-desc">${v.d}</div><div class="tip-tags"><span class="rar" style="--rc:#ffd166">Runa · permanente</span></div>`; }
      case 'opt': return U._packOpts && U.itemTip(U._packOpts[arg]);
      case 'deckc': return run && U.cardTip(run.cards.find(c => c.uid === arg));
      case 'col-relic': { const d = M.RELIC[arg]; return U.relicTip({ id: arg, data: {} }); }
      case 'col-scroll': return U.scrollTip(arg);
      case 'col-astro': return U.astroTip(arg);
      case 'col-boss': { const b = M.BOSS[arg]; return `<div class="tip-title">${b.i} ${b.n}</div><div class="tip-desc">${b.d}</div>`; }
      case 'col-tag': { const t = M.TAG[arg]; return `<div class="tip-title">${t.i} ${t.n}</div><div class="tip-desc">${t.d}</div>`; }
      case 'col-voucher': { const v = M.VOUCHER[arg]; return `<div class="tip-title">${v.i} ${v.n}</div><div class="tip-desc">${v.d}</div>`; }
      case 'txt': return decodeURIComponent(arg);
    }
    return null;
  };

  /* ============ telas ============ */
  U.show = (name) => {
    screen = name;
    U.hideTip(); U.closePop(); U.hideCoach();
    const run = M.run;
    const runScreens = ['select', 'round', 'cashout', 'shop'];
    if (runScreens.includes(name)) {
      if (!$('#side')) U.renderRunLayout();
      if (name === 'shop') M.bg.set('shop'); else if (run.round === 2 && name !== 'cashout') M.bg.set('boss'); else M.bg.setPal(M.realm(run.ante).pal);
      if (name === 'shop') M.audio.music('shop');
      else if (name === 'round' || name === 'select') M.audio.music(run.round === 2 ? 'boss' : 'round');
      M.audio.mood(name === 'round' ? 'round' : 'normal');
      $('#stage').dataset.screen = name;
      U.renderSide(); U.renderRelics(); U.renderConsumables();
      const C = $('#center'); C.className = 'center-' + name;
      ({ select: U.renderSelect, round: U.renderRound, cashout: U.renderCashout, shop: U.renderShop })[name]();
    } else {
      $('#screen').innerHTML = '';
      $('#stage').dataset.screen = name;
      document.body.classList.remove('fever');
      M.bg.tInt = 0;
      if (name !== 'gameover') M.audio.music('menu');
      else M.audio.music(null);
      M.audio.mood('normal');
      ({ menu: U.renderMenu, newrun: U.renderNewRun, gameover: U.renderGameOver, victory: U.renderVictory, collection: U.renderCollection, achievements: U.renderAch, stats: U.renderStats, rewards: U.renderRewards })[name]();
    }
  };
  U.current = () => screen;

  U.renderRunLayout = () => {
    $('#screen').innerHTML = `
      <div class="run-layout">
        <aside id="side"></aside>
        <main class="run-main">
          <div id="mhud" class="mhud"></div>
          <div class="topbar">
            <div class="relic-bar"><div id="relics"></div><div class="slot-count" id="relic-count"></div></div>
            <div class="consum-bar"><div id="consum"></div><div class="slot-count" id="consum-count"></div></div>
          </div>
          <div id="center"></div>
        </main>
      </div>`;
  };

  /* ============ HUD (computador: painel lateral · celular: barra no topo) ============ */
  const HEART = '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-10-9.3C.3 8.4 2 4.5 5.8 4.1 8.2 3.9 10 5.3 12 7.4c2-2.1 3.8-3.5 6.2-3.3C22 4.5 23.7 8.4 22 11.7 19.5 16.4 12 21 12 21z"/></svg>';
  U.h = (k) => $$(`[data-h="${k}"]`);
  U.hAnchor = (k) => U.h(k).find(e => e.offsetParent !== null) || U.h(k)[0];
  U.hSet = (k, v, pop = true) => U.h(k).forEach(e => { if (e.textContent !== String(v)) { e.textContent = v; if (pop) { e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); } } });
  U.hearts = (n, max) => {
    max = Math.max(n, max || n);
    if (max > 10) return `<span class="hearts big">${HEART}<b>${n}</b></span>`;
    let h = '';
    for (let i = 0; i < max; i++) h += `<i class="${i < n ? 'on' : 'off'}">${HEART}</i>`;
    return `<span class="hearts">${h}</span>`;
  };
  U.blindInfo = (round) => {
    const run = M.run;
    if (round === 2) { const b = M.BOSS[run.bossId]; return { n: b.n, i: b.i, c: b.c, boss: b }; }
    return round === 0 ? { n: 'Salão Pequeno', i: '◆', c: '#3c7cff' } : { n: 'Salão Grande', i: '◆◆', c: '#ff9f1c' };
  };
  U.renderSide = () => {
    const run = M.run, rs = run.rs, side = $('#side');
    const bi = U.blindInfo(run.round);
    const inRound = screen === 'round' && rs;
    const res = G.calcRes();
    const tent = inRound ? rs.tent : res.tent, visl = inRound ? rs.visl : res.visl;
    side.innerHTML = `
      <div class="side-blind" style="--bc:${bi.c}">
        <div class="sb-name">${bi.i} ${bi.n}</div>
        ${inRound ? `<div class="sb-target"><span>Meta</span><b data-h="target">${M.fmt(rs.target)}</b></div>`
        : `<div class="sb-sub">${screen === 'shop' ? 'Loja' : screen === 'cashout' ? 'Vitória!' : 'Escolha seu salão'}</div>`}
      </div>
      <div class="side-score${inRound ? '' : ' dim'}" data-h="scorebox">
        <label>Seus pontos</label>
        <div class="score-num" data-h="score">${inRound ? M.fmt(rs.score) : '—'}</div>
        <div class="progress"><i data-h="prog"></i></div>
      </div>
      <div class="side-calc${inRound ? '' : ' dim'}">
        <div class="calc-box chips" data-h="chips">0</div><div class="calc-x">×</div><div class="calc-box mult" data-h="mult">0</div>
      </div>
      <div class="side-pair" data-h="pair">${inRound ? 'Encontre os pares!' : ''}</div>
      <div class="side-hearts${inRound ? '' : ' dim'}"><label>Vidas</label><div data-h="hearts">${U.hearts(tent, inRound ? rs.tentMax : tent)}</div></div>
      <div class="side-res">
        <button class="res visl${inRound ? '' : ' dim'}" data-h="peekbtn" ${inRound ? '' : 'disabled'} data-tip="txt:${encodeURIComponent('<div class=tip-title>👁 Vislumbre</div><div class=tip-desc>Espia uma carta <b>de graça</b>, sem perder vida. Clique aqui e depois na carta (ou botão direito / Espaço).</div>')}"><label>👁 Espiar</label><b data-h="visl">${visl}</b></button>
        <div class="res combo${inRound ? '' : ' dim'}" data-h="combobox"><label>🔥 Combo</label><b data-h="combo">x${inRound ? rs.combo : 0}</b></div>
      </div>
      <div class="side-row two">
        <div class="side-money"><label>Dinheiro</label><b data-h="money">$${run.money}</b></div>
        <div class="side-stat"><label>Reino</label><b>${M.emoImg(M.realm(run.ante).i)} ${run.ante}<small>/8</small></b><small class="sub">salão ${run.round + 1}/3</small></div>
      </div>
      <div class="side-btns">
        <button class="btn small" data-act2="deck">🂠 Baralho</button>
        <button class="btn small" data-act2="info">ℹ Naipes</button>
        <button class="btn small" data-act2="pause">☰ Menu</button>
      </div>
      <div class="timer-bar" data-h="timer"><i></i></div>`;
    // HUD do celular
    $('#mhud').innerHTML = `
      <div class="mh-row1">
        <div class="mh-blind" style="--bc:${bi.c}"><span class="mh-bn">${bi.i} ${bi.n}</span>${inRound ? `<span class="mh-goal">Meta <b data-h="target">${M.fmt(rs.target)}</b></span>` : `<span class="mh-goal">${M.emoImg(M.realm(run.ante).i)} Reino ${run.ante}/8 · salão ${run.round + 1}/3</span>`}</div>
        <div class="mh-score${inRound ? '' : ' dim'}" data-h="scorebox"><b data-h="score">${inRound ? M.fmt(rs.score) : '—'}</b><div class="progress"><i data-h="prog"></i></div></div>
        <button class="mh-menu" data-act2="pause" aria-label="Menu">☰</button>
      </div>
      <div class="mh-row2">
        <div class="mh-hearts${inRound ? '' : ' dim'}" data-h="hearts">${U.hearts(tent, inRound ? rs.tentMax : tent)}</div>
        <button class="mh-chip visl${inRound ? '' : ' dim'}" data-h="peekbtn" ${inRound ? '' : 'disabled'}>👁 <b data-h="visl">${visl}</b></button>
        <div class="mh-chip combo${inRound ? '' : ' dim'}" data-h="combobox">🔥 <b data-h="combo">x${inRound ? rs.combo : 0}</b></div>
        <div class="mh-chip money"><b data-h="money">$${run.money}</b></div>
        <button class="mh-chip" data-act2="deck" aria-label="Baralho">🂠</button>
      </div>
      <div class="timer-bar" data-h="timer"><i></i></div>`;
    U.updateHUD();
  };

  U.updateHUD = () => {
    const run = M.run; if (!run) return;
    const rs = run.rs;
    U.h('money').forEach(e => e.textContent = '$' + run.money);
    if (!rs || screen !== 'round') return;
    rs.tentMax = Math.max(rs.tentMax || 0, rs.tent);
    U.hSet('visl', rs.visl);
    U.hSet('combo', 'x' + rs.combo);
    const hh = U.hearts(rs.tent, rs.tentMax);
    U.h('hearts').forEach(e => { if (e._t !== rs.tent + '/' + rs.tentMax) { const lost = e._n != null && rs.tent < e._n; e.innerHTML = hh; e._t = rs.tent + '/' + rs.tentMax; if (lost) { e.classList.remove('hurt'); void e.offsetWidth; e.classList.add('hurt'); } e._n = rs.tent; } e.classList.toggle('danger', rs.tent <= 2); });
    U.h('combobox').forEach(e => { e.classList.toggle('warm', rs.combo >= 3); e.classList.toggle('hot', rs.combo >= 5); });
    $('#board-area')?.classList.toggle('warm', rs.combo >= 3 && rs.combo < 5);
    $('#board-area')?.classList.toggle('hot', rs.combo >= 5);
    U.h('prog').forEach(p => { p.style.width = Math.min(100, rs.score / rs.target * 100) + '%'; p.parentElement.classList.toggle('near', rs.score / rs.target >= 0.75); });
    if (!U._animScore) U.h('score').forEach(e => e.textContent = M.fmt(rs.score));
    U.h('peekbtn').forEach(e => { e.classList.toggle('active', B.peekMode); e.classList.toggle('empty', rs.visl <= 0); });
    const pend = $('#pending');
    if (pend) pend.innerHTML = [...rs.pending.map(p => `<span class="pend">${M.SCROLL[p].i} ${M.SCROLL[p].n}</span>`), rs.ambar ? `<span class="pend">🟠 Âmbar x${rs.ambar}</span>` : ''].join('');
  };
  U.updateMoney = (delta) => {
    U.h('money').forEach(m => { m.textContent = '$' + M.run.money; m.classList.remove('pop'); void m.offsetWidth; m.classList.add('pop'); });
    const m = U.hAnchor('money');
    if (delta && m) M.fx.floatEl(m, (delta > 0 ? '+$' : '-$') + Math.abs(delta), delta > 0 ? 'money' : 'bad');
    if (screen === 'shop') U.refreshShopAfford();
  };
  U.timerBar = (k) => {
    U.h('timer').forEach(t => {
      t.classList.toggle('on', k >= 0);
      if (k >= 0) { t.firstElementChild.style.width = (k * 100) + '%'; t.classList.toggle('urgent', k < 0.3); }
    });
  };

  /* ============ dicas guiadas (aparecem uma vez) ============ */
  U.coach = (key, html, ms = 4200) => {
    const P = M.profile; P.tips = P.tips || {};
    if (P.tips[key]) return;
    P.tips[key] = 1; M.save.saveProfile();
    U.hideCoach();
    const d = document.createElement('div'); d.className = 'coach'; d.id = 'coach';
    d.innerHTML = `<div class="coach-owl">🦉</div><div class="coach-txt">${html}</div>`;
    document.body.appendChild(d);
    d.onclick = U.hideCoach;
    clearTimeout(U._coachT); U._coachT = setTimeout(U.hideCoach, ms);
  };
  U.hideCoach = () => { const c = $('#coach'); if (c) { c.classList.add('out'); setTimeout(() => c.remove(), 300); } };

  /* ============ relíquias e consumíveis ============ */
  U.renderRelics = () => {
    const run = M.run, el = $('#relics'); if (!el) return;
    el.innerHTML = run.relics.map((r, i) => U.relicHTML(r, { attr: `data-tip="relic:${i}" data-act="relic:${i}" data-i="${i}"` })).join('')
      || '<div class="empty-slot">Relíquias aparecem aqui</div>';
    $('#relic-count').textContent = `${run.relics.length}/${G.relicSlots()}`;
  };
  U.renderConsumables = () => {
    const run = M.run, el = $('#consum'); if (!el) return;
    el.innerHTML = run.scrolls.map((s, i) => U.scrollHTML(s.id, { attr: `data-tip="scroll:${i}" data-act="scroll:${i}"` })).join('')
      || '<div class="empty-slot">Pergaminhos</div>';
    $('#consum-count').textContent = `${run.scrolls.length}/${G.scrollCap()}`;
  };
  U.bumpRelic = (i) => {
    const el = $(`#relics .relic[data-i="${i}"]`); if (!el) return;
    el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
  };
  U.bumpRelicId = (id) => { const i = M.run.relics.findIndex(r => r.id === id); if (i >= 0) U.bumpRelic(i); };

  // popover de ação (vender/usar)
  U.closePop = () => { $('#pop')?.remove(); $$('.selected').forEach(e => e.classList.remove('selected')); };
  U.openPop = (el, html, actions) => {
    U.closePop(); U.hideTip();
    el.classList.add('selected');
    const p = document.createElement('div'); p.id = 'pop'; p.className = 'popover';
    p.innerHTML = html + (actions.length ? '' : '') + `<div class="pop-actions">${actions.map((a, i) => `<button class="btn ${a.cls || ''}" data-pa="${i}" ${a.disabled ? 'disabled' : ''}>${a.t}</button>`).join('')}</div>`;
    document.body.appendChild(p);
    const r = el.getBoundingClientRect();
    let x = r.left + r.width / 2 - p.offsetWidth / 2, y = r.bottom + 10;
    if (y + p.offsetHeight > innerHeight - 8) y = r.top - p.offsetHeight - 10;
    p.style.left = M.clamp(x, 8, innerWidth - p.offsetWidth - 8) + 'px'; p.style.top = M.clamp(y, 8, innerHeight - p.offsetHeight - 8) + 'px';
    p.addEventListener('click', (e) => { const b = e.target.closest('[data-pa]'); if (!b) return; e.stopPropagation(); const a = actions[+b.dataset.pa]; U.closePop(); a.fn(); });
  };

  U.relicAction = (i, el) => {
    const run = M.run, r = run.relics[i];
    U.openPop(el, U.relicTip(r), [{ t: `Vender <b class="money">$${M.sellValue(r)}</b>`, cls: 'red', fn: () => {
      const [x, y] = M.fx.at(el); M.fx.burst(x, y, { n: 20, colors: ['#ffd166', '#fff'] });
      G.sellRelic(i); M.audio.play('sell'); U.renderRelics(); U.updateHUD();
      if (screen === 'shop') U.refreshShopAfford();
    } }]);
  };
  U.scrollAction = (i, el) => {
    const run = M.run, s = run.scrolls[i]; const d = M.SCROLL[s.id];
    const inRound = screen === 'round';
    const can = d.when === 'any' || inRound;
    U.openPop(el, U.scrollTip(s.id), [
      { t: 'Usar', cls: 'green', disabled: !can, fn: async () => {
        const r = await B.useScroll(i);
        if (r === true) { const [x, y] = M.fx.at(el); M.fx.burst(x, y, { n: 30, colors: ['#b46bff', '#ff8af0', '#fff'] }); }
        else if (r === 'full') M.fx.floatEl(el, 'Sem espaço!', 'bad');
        else if (r === 'none') M.fx.floatEl(el, 'Nenhum par disponível', 'bad');
        else if (r === 'round') M.fx.floatEl(el, 'Só durante um salão', 'bad');
      } },
      { t: `Vender <b class="money">$1</b>`, cls: 'red', fn: () => { run.scrolls.splice(i, 1); G.addMoney(1); M.audio.play('sell'); U.renderConsumables(); G.save(); } },
    ]);
  };

  /* ============ seleção de salão ============ */
  U.renderSelect = () => {
    const run = M.run, C = $('#center');
    const cards = [0, 1, 2].map(round => {
      const bi = U.blindInfo(round);
      const state = round < run.round ? 'done' : round === run.round ? 'cur' : 'next';
      const tgt = G.target(round);
      const tag = round < 2 ? M.TAG[run.tags[round]] : null;
      const rw = G.reward(round);
      return `<div class="blind-card ${state}${round === 2 ? ' boss' : ''}" style="--bc:${bi.c}">
        <div class="bc-top">${state === 'done' ? '✓ Vencido' : state === 'cur' ? 'Próximo desafio' : round === 2 ? 'Chefe do Reino' : 'Depois'}</div>
        <div class="bc-head"><div class="bc-chip"><span>${bi.i}</span></div>
          <div class="bc-titles"><div class="bc-name">${bi.n}</div><div class="bc-mini">Meta <b>${M.fmt(tgt)}</b> · <b class="money">$${rw}</b></div></div></div>
        ${bi.boss ? `<div class="bc-boss">⚠ ${bi.boss.d}</div>` : ''}
        <div class="bc-goal">Faça <b>${M.fmt(tgt)}</b> pontos encontrando pares</div>
        <div class="bc-reward">Prêmio <b class="money">${rw ? '$' + rw : '—'}</b></div>
        ${state === 'cur' ? `<button class="btn big orange bc-play" id="btn-play">▶ Jogar</button>` : ''}
        ${tag && state === 'cur' ? `<div class="bc-skip"><button class="btn small" id="btn-skip">Pular e ganhar:</button><div class="bc-tag" data-tip="col-tag:${tag.id}">${tag.i} <span>${tag.n}</span></div></div>` : ''}
      </div>`;
    }).join('');
    C.innerHTML = `<div class="select-wrap">${U.journeyHTML(run)}<div class="blinds">${cards}</div></div>`;
    $('.journey')?.addEventListener('click', () => U.showStory(true));
    $('#btn-play').onclick = (e) => { e.currentTarget.disabled = true; M.audio.play('click'); B.startRound(); };
    const sk = $('#btn-skip'); if (sk) sk.onclick = () => G.skip();
  };

  /* ============ mapa da jornada (objetivo do jogo) ============ */
  U.journeyHTML = (run) => {
    const R = M.realm(run.ante), endless = run.ante > 8;
    const nodes = M.REALMS.map((r, i) => {
      const n = i + 1, st = endless || n < run.ante ? 'done' : n === run.ante ? 'cur' : 'next';
      return `<div class="jn ${st}" title="${r.n}"><div class="jn-orb">${M.emoImg(r.i)}</div>${st === 'done' ? '<span class="jn-mem">✨</span>' : ''}</div>`;
    }).join('<div class="jl"></div>');
    const left = Math.max(0, 8 - run.ante + 1);
    return `<div class="journey">
      <div class="jr-head"><div class="jr-icon">${M.emoImg(R.i)}</div><div><div class="jr-kicker">${endless ? 'Modo sem fim' : `Reino ${run.ante} de 8`}</div><div class="jr-name">${R.n}</div></div></div>
      <div class="jr-path">${nodes}<div class="jl"></div><div class="jn goal"><div class="jn-orb">${M.emoImg('👸')}</div></div></div>
      <div class="jr-goal">🎯 ${endless ? 'Vá o mais longe que conseguir!' : `Vença o chefe deste reino para recuperar <b>${R.mem}</b>. Faltam <b>${left}</b> ${left === 1 ? 'memória' : 'memórias'} para salvar Mnemósine.`}</div>
    </div>`;
  };
  U.showStory = (again) => {
    const o = U.overlay(`<div class="story">
      <div class="st-hero">${M.emoImg('👸', 'st-queen')}</div>
      <div class="panel-title">A Memória de Mnemósine</div>
      <div class="st-text">${M.STORY}</div>
      <div class="st-realms">${M.REALMS.map((r, i) => `<div class="st-r"><div>${M.emoImg(r.i)}</div><small>${i + 1}. ${r.n}</small></div>`).join('')}</div>
      <div class="st-how"><b>Como avançar:</b> cada reino tem <b>3 salões</b>. Faça os pontos pedidos formando pares. O 3º salão é o <b>chefe</b>: venceu, a memória volta! ✨</div>
      <button class="btn huge orange" id="st-go">${again ? 'Entendi!' : 'Começar a jornada ✦'}</button>
    </div>`, { noClose: !again });
    o.querySelector('#st-go').onclick = () => { M.audio.play('click'); U.closeOverlay(); };
  };

  /* ============ salão (tabuleiro) ============ */
  U.renderRound = () => {
    const C = $('#center'); const rs = M.run.rs;
    const boss = rs && rs.boss ? M.BOSS[rs.boss] : null;
    let bossTxt = boss ? boss.d : '';
    if (rs && rs.boss === 'eclipse') bossTxt = `Cartas de <b class="s-${rs.flags.eclipse}">${M.SUITS[rs.flags.eclipse].n}</b> não pontuam`;
    C.innerHTML = `
      ${boss ? `<div class="boss-banner" style="--bc:${boss.c}">${boss.i} <b>${boss.n}</b> — ${bossTxt}</div>` : ''}
      <div class="mcalc"><div class="calc-box chips" data-h="chips">0</div><div class="calc-x">×</div><div class="calc-box mult" data-h="mult">0</div><div class="mpair" data-h="pair"></div></div>
      <div id="pending" class="pending"></div>
      <div id="board-area"><div id="board"></div><div class="fever-frame"></div></div>
      <div class="round-hint" id="round-hint">Vire 2 cartas iguais · <b>Botão direito</b> ou <b>Espaço</b> = espiar</div>`;
    if (rs && rs.cards.length) { B.render(true); }
    U.updateHUD();
  };
  U.boardArea = () => {
    const a = $('#board-area');
    if (!a) return { w: innerWidth * 0.6, h: innerHeight * 0.6 };
    const r = a.getBoundingClientRect();
    const pad = innerWidth < 900 ? 20 : 48;
    return { w: Math.max(160, r.width - pad), h: Math.max(160, r.height - pad) };
  };
  U.previewBar = (t) => {
    const d = document.createElement('div'); d.className = 'preview-bar';
    d.innerHTML = `<div class="pv-label">MEMORIZE!</div><div class="pv-track"><i style="animation-duration:${t}s"></i></div><div class="pv-skip">toque para começar</div>`;
    $('#center').appendChild(d);
    return d;
  };

  U.showPairInfo = (c, kindTxt) => {
    const name = c.enh === 'stone' ? 'Pedra' : `${M.RANKS[c.rank - 1].n} de ${M.SUITS[c.suit].n}`;
    U.h('pair').forEach(el => {
      el.innerHTML = `<span class="pi-name">${name}</span><span class="pi-kind k-${kindTxt === 'Lembrança' ? 'mem' : 'luck'}">${kindTxt}</span>`;
      el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    });
    $('.mcalc')?.classList.add('on');
  };
  U.comboPop = (combo) => {
    const txt = combo >= 12 ? 'TRANSCENDENTE' : combo >= 9 ? 'LENDÁRIO' : combo >= 7 ? 'IMPARÁVEL' : combo >= 5 ? 'EM CHAMAS' : 'COMBO';
    M.fx.announce(`${txt} x${combo}`, combo >= 5 ? 'fire' : 'blue', 750);
  };

  /* animação da pontuação estilo cassino */
  U.animateScore = async (res, sa, sb) => {
    const run = M.run, rs = run.rs;
    const setBox = (k, v) => U.h(k).forEach(el => { el.textContent = typeof v === 'number' && v % 1 ? M.fmtX(v) : M.fmt(v); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); });
    const fast = M.speed >= 3;
    const dl = fast ? 70 : 140;
    let i = 0;
    for (const e of res.ev) {
      i++;
      if (e.type === 'base') { setBox('chips', e.chips); setBox('mult', e.mult); M.fx.floatEl(sa, `+${e.chips}`, 'chips'); M.audio.play('chips', 0); await M.sleep(dl + 60); continue; }
      let anchor = sa;
      if (e.src === 'relic') { anchor = $(`#relics .relic[data-i="${e.i}"]`) || sa; U.bumpRelic(e.i); }
      else if (e.src === 'combo') anchor = U.hAnchor('combobox') || sa;
      else if (e.src === 'blind' || e.src === 'scroll' || e.src === 'fever') anchor = U.hAnchor('mult') || sa;
      if (e.type === 'chips') { setBox('chips', e.chips); M.fx.floatEl(anchor, `+${M.fmt(e.v)}`, 'chips'); M.audio.play('chips', i); }
      else if (e.type === 'mult') { setBox('mult', e.mult); M.fx.floatEl(anchor, `+${M.fmt(e.v)} Mult`, 'mult'); M.audio.play('mult', i); }
      else if (e.type === 'xmult') { setBox('mult', e.mult); M.fx.floatEl(anchor, `${e.text ? e.text + ' ' : ''}x${M.fmtX(e.v)}`, 'xmult'); M.audio.play('xmult'); M.fx.shake(4, 160); }
      else if (e.type === 'money') { G.addMoney(e.v); M.fx.floatEl(anchor, `+$${e.v}`, 'money'); M.audio.play('coin'); }
      else if (e.type === 'msg') { M.fx.floatEl(anchor, e.text, 'hl'); }
      await M.sleep(dl);
    }
    U.h('pair').forEach(pi => pi.insertAdjacentHTML('beforeend', `<span class="pi-total">= ${M.fmt(res.one)}${res.reps ? ` <em>x${res.reps + 1}</em>` : ''}</span>`));
    if (res.reps) { M.fx.announce(`DE NOVO! x${res.reps + 1}`, 'fire', 700); }
    const frac = res.total / rs.target;
    const big = frac >= 0.5;
    M.audio.play('score', big);
    const [x1, y1] = M.fx.at(sa), [x2, y2] = M.fx.at(sb);
    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
    M.fx.float(cx, cy - 20, M.fmt(res.total), 'total' + (big ? ' huge' : ''));
    M.fx.shake(Math.min(18, 3 + Math.log10(Math.max(10, res.total)) * (big ? 3 : 1.4)), big ? 520 : 260);
    if (big) {
      U.h('scorebox').forEach(sbx => { sbx.classList.add('burn'); setTimeout(() => sbx.classList.remove('burn'), 2500); });
      M.fx.announce(frac >= 1 ? 'ABSURDO!!' : 'ENORME!', 'fire', 700); M.vibrate([30, 40, 60]);
      const ba = $('#board-area'); if (ba) { ba.classList.remove('punch'); void ba.offsetWidth; ba.classList.add('punch'); }
      M.fx.burst(cx, cy, { n: 90, colors: ['#ffd166', '#ff9f1c', '#ff4d5e', '#fff'], speed: 900, size: 5 });
    }
    // contagem do placar
    const from = rs.score, to = rs.score + res.total;
    U._animScore = true;
    const t0 = performance.now(), dur = fast ? 250 : 560;
    let lastTick = 0;
    await new Promise(done => {
      const f = (now) => {
        const k = Math.min(1, (now - t0) / dur);
        const v = from + (to - from) * (1 - Math.pow(1 - k, 3));
        U.h('score').forEach(sc => sc.textContent = M.fmt(v));
        U.h('prog').forEach(p => p.style.width = Math.min(100, v / rs.target * 100) + '%');
        if (now - lastTick > 55 && k < 1) { lastTick = now; M.audio.play('tick'); }
        if (k < 1) requestAnimationFrame(f); else done();
      };
      requestAnimationFrame(f);
    });
    U._animScore = false;
    U.h('score').forEach(sc => { sc.classList.remove('pop'); void sc.offsetWidth; sc.classList.add('pop'); });
    await M.sleep(fast ? 60 : 150);
    U.h('chips').forEach(e => e.textContent = '0'); U.h('mult').forEach(e => e.textContent = '0');
    $('.mcalc')?.classList.remove('on');
  };

  /* ============ recompensa ============ */
  U.renderCashout = () => {
    const run = M.run, C = $('#center');
    const lines = run.cashout || [];
    const tot = lines.reduce((s, l) => s + l.v, 0);
    const boss = run.round === 2, R = M.realm(run.ante);
    C.innerHTML = `<div class="panel cashout">
      <div class="panel-title gold">${boss ? 'Chefe derrotado!' : 'Salão vencido!'}</div>
      ${boss ? `<div class="memory-get"><div class="mg-orb">${M.emoImg(R.i)}</div><div><small>✨ Memória recuperada ${Math.min(run.ante, 8)}/8</small><b>${R.mem[0].toUpperCase() + R.mem.slice(1)}</b></div></div>` : ''}
      <div class="co-lines">${lines.map((l, i) => `<div class="co-line" style="animation-delay:${i * 0.18}s"><span>${l.icon ? l.icon + ' ' : ''}${l.t}</span><b class="money">${'$'.repeat(Math.min(8, l.v))}${l.v > 8 ? '+' : ''} $${l.v}</b></div>`).join('')}</div>
      <button class="btn big gold" id="btn-collect" style="animation-delay:${lines.length * 0.18 + 0.1}s">Receber <b>$${tot}</b></button>
    </div>`;
    lines.forEach((l, i) => setTimeout(() => M.audio.play('coin'), i * 180 / (M.speed || 1)));
    if (boss) { M.audio.play('unlock'); M.fx.confetti(140); }
    $('#btn-collect').onclick = () => {
      const el = $('#btn-collect'); const [x, y] = M.fx.at(el);
      M.fx.burst(x, y, { n: 40, colors: ['#ffd166', '#fff3b0', '#fff'], speed: 500 });
      M.audio.play('buy');
      const r = G.collect();
      if (r === 'victory') { U.show('victory'); return; }
      U.show('shop');
    };
  };

  /* ============ loja ============ */
  U.renderShop = () => {
    const run = M.run, sh = run.shop, C = $('#center');
    const disc = run.pending.mercadorAtivo ? '<span class="sale">50% OFF!</span>' : '';
    const items = sh.items.map((it, i) => {
      const cost = it.free ? 0 : G.price(it.cost);
      return `<div class="shop-item" data-si="${i}">
        <div class="price-tag ${cost === 0 ? 'free' : ''}">${cost === 0 ? 'GRÁTIS' : '$' + cost}</div>
        ${U.itemHTML(it, `data-tip="shop:${i}"`)}
        <div class="si-name">${U.itemName(it)}</div>
        <button class="btn small green buy" data-buy="${i}">${it.kind === 'astro' ? 'Usar' : 'Comprar'}</button>
      </div>`;
    }).join('') || '<div class="sold-out">Esgotado!</div>';
    const packs = sh.packs.map((p, i) => {
      const P = G.PACKS[p.type];
      return `<div class="shop-item pack-item${p.bought ? ' bought' : ''}" data-pi="${i}">
        <div class="price-tag">$${G.price(p.cost)}</div>
        <div class="pack" style="--pc:${P.col}" data-tip="pack:${i}"><div class="pack-in"><div class="pack-ico">${P.i}</div><div class="pack-name">${P.n}</div></div></div>
        <button class="btn small blue buy" data-pack="${i}" ${p.bought ? 'disabled' : ''}>${p.bought ? 'Aberto' : 'Abrir'}</button>
      </div>`;
    }).join('');
    const v = run.voucherOffer ? M.VOUCHER[run.voucherOffer] : null;
    const voucher = v ? `<div class="shop-item" data-vi="1">
        <div class="price-tag">$${G.price(10)}</div>
        <div class="voucher" data-tip="voucher:${v.id}"><div class="voucher-in"><div class="v-rune">${v.i}</div></div></div>
        <div class="si-name">${v.n}</div>
        <button class="btn small gold buy" id="buy-voucher">Gravar</button></div>` : '<div class="sold-out small">Runa gravada.<br>Volte no próximo Reino.</div>';
    C.innerHTML = `<div class="shop">
      <div class="shop-head"><div class="shop-sign">LOJA ${disc}</div><div class="merchant"><span class="owl">🦉</span><div class="bubble">${sh.quote}</div></div></div>
      <div class="shop-body">
        <div class="shop-section main"><div class="sec-label">Relíquias & Itens</div><div class="shop-row" id="shop-items">${items}</div></div>
        <div class="shop-lower">
          <div class="shop-section"><div class="sec-label">Pacotes</div><div class="shop-row">${packs}</div></div>
          <div class="shop-section"><div class="sec-label">Runa do Reino</div><div class="shop-row">${voucher}</div></div>
        </div>
      </div>
      <div class="shop-actions">
        <button class="btn big red" id="btn-next">Próximo salão ➜</button>
        <button class="btn big green" id="btn-reroll">Rerrolar <b>$${G.rerollCost()}</b></button>
      </div>
    </div>`;
    $('#btn-next').onclick = () => { M.audio.play('click'); G.leaveShop(); U.show('select'); };
    $('#btn-reroll').onclick = () => {
      if (!G.reroll()) { M.fx.floatEl($('#btn-reroll'), 'Sem dinheiro!', 'bad'); M.audio.play('mismatch'); return; }
      M.audio.play('reroll'); U.renderShop();
      $$('#shop-items .shop-item').forEach((e, i) => { e.style.animationDelay = (i * 0.07) + 's'; e.classList.add('reroll-in'); });
    };
    $$('[data-buy]').forEach(b => b.onclick = (e) => {
      e.stopPropagation();
      const i = +b.dataset.buy; const el = b.closest('.shop-item');
      const it = run.shop.items[i];
      const r = G.buy(i);
      if (r === 'money') { M.fx.floatEl(el, 'Sem dinheiro!', 'bad'); M.audio.play('mismatch'); return; }
      if (r === 'full') { M.fx.floatEl(el, 'Sem espaço!', 'bad'); M.audio.play('mismatch'); return; }
      const [x, y] = M.fx.at(el);
      M.fx.burst(x, y, { n: 40, colors: ['#ffd166', '#43e27a', '#fff'], speed: 520 });
      M.audio.play('buy');
      if (it.kind === 'astro') M.fx.announce(`${M.ASTRO[it.id].i} ${M.ASTRO[it.id].n}: nível ${it.id === 'buraco' ? '+1 em tudo' : M.run.suitLv[M.ASTRO[it.id].suit]}!`, 'blue', 900);
      U.renderShop(); U.renderRelics(); U.renderConsumables();
    });
    $$('[data-pack]').forEach(b => b.onclick = async (e) => {
      e.stopPropagation();
      const pk = G.buyPack(+b.dataset.pack);
      if (!pk) { M.fx.floatEl(b, 'Sem dinheiro!', 'bad'); M.audio.play('mismatch'); return; }
      await U.openPack(pk);
      U.renderShop(); U.renderRelics(); U.renderConsumables();
    });
    const bv = $('#buy-voucher');
    if (bv) bv.onclick = () => {
      if (!G.buyVoucher()) { M.fx.floatEl(bv, 'Sem dinheiro!', 'bad'); M.audio.play('mismatch'); return; }
      const [x, y] = M.fx.at(bv); M.fx.burst(x, y, { n: 60, colors: ['#ffd166', '#fff'], speed: 600 }); M.fx.ring(x, y, '#ffd166', 160);
      M.audio.play('unlock'); U.renderShop(); U.renderRelics(); U.renderConsumables(); U.renderSide();
    };
    U.refreshShopAfford();
    U.coach('shop', 'Bem-vindo à loja! <b>Relíquias</b> dão poderes permanentes. Toque/passe o mouse num item para ver o que ele faz.', 6000);
  };
  U.refreshShopAfford = () => {
    const run = M.run; if (!run.shop) return;
    $$('[data-buy]').forEach(b => { const it = run.shop.items[+b.dataset.buy]; if (it) b.classList.toggle('poor', run.money < (it.free ? 0 : G.price(it.cost))); });
    const rr = $('#btn-reroll'); if (rr) { rr.classList.toggle('poor', run.money < G.rerollCost()); rr.querySelector('b').textContent = '$' + G.rerollCost(); }
  };

  /* ============ abertura de pacote ============ */
  U.openPack = (pk, free = false) => new Promise((resolve) => {
    const P = G.PACKS[pk.type];
    M.audio.play('pack');
    U._packOpts = pk.opts;
    let left = pk.picks;
    const ov = U.overlay(`<div class="pack-open" style="--pc:${P.col}">
      <div class="po-title">${P.i} ${P.n}</div>
      <div class="po-sub" id="po-sub">Escolha ${left}</div>
      <div class="po-opts">${pk.opts.map((o, i) => `<div class="po-opt" data-o="${i}" style="animation-delay:${0.15 + i * 0.1}s">
        ${U.itemHTML(o, `data-tip="opt:${i}"`)}<div class="si-name">${U.itemName(o)}</div>
        <div class="po-desc">${o.kind === 'card' ? U.cardTip(o.card) : U.itemTip(o)}</div>
        <button class="btn small green" data-take="${i}">${o.kind === 'astro' ? 'Usar' : o.kind === 'card' ? 'Adicionar' : 'Pegar'}</button></div>`).join('')}</div>
      <button class="btn" id="po-skip">Pular</button>
    </div>`, { noClose: true });
    const [cx, cy] = [innerWidth / 2, innerHeight / 2];
    M.fx.burst(cx, cy, { n: 80, colors: [P.col, '#fff', '#ffd166'], speed: 800, size: 4 });
    M.fx.ring(cx, cy, P.col, 300, 0.8, 14);
    const finish = () => { U.closeOverlay(); U._packOpts = null; resolve(); };
    ov.querySelector('#po-skip').onclick = () => { M.audio.play('click'); finish(); };
    ov.querySelectorAll('[data-take]').forEach(b => b.onclick = () => {
      const i = +b.dataset.take, o = pk.opts[i];
      if (!G.canAdd(o)) { M.fx.floatEl(b, 'Sem espaço!', 'bad'); M.audio.play('mismatch'); return; }
      G.addItem(o);
      if (o.kind === 'astro') M.fx.announce(`${M.ASTRO[o.id].i} ${M.ASTRO[o.id].n}!`, 'blue', 800);
      const el = b.closest('.po-opt'); const [x, y] = M.fx.at(el);
      M.fx.burst(x, y, { n: 50, colors: [P.col, '#fff'], speed: 600 });
      el.classList.add('taken'); b.disabled = true;
      M.audio.play('buy');
      G.save();
      U.renderRelics(); U.renderConsumables();
      left--;
      if (left <= 0) setTimeout(finish, 450);
      else ov.querySelector('#po-sub').textContent = `Escolha mais ${left}`;
    });
  });

  /* ============ overlay/modal ============ */
  U.overlay = (html, opts = {}) => {
    const o = $('#overlay');
    o.innerHTML = `<div class="ov-back"></div><div class="ov-box">${html}${opts.noClose ? '' : '<button class="ov-close" aria-label="Fechar">✕</button>'}</div>`;
    o.classList.add('on');
    if (!opts.noClose) {
      o.querySelector('.ov-back').onclick = U.closeOverlay;
      o.querySelector('.ov-close').onclick = U.closeOverlay;
    }
    U._ovOnClose = opts.onClose;
    return o;
  };
  U.closeOverlay = () => { const o = $('#overlay'); o.classList.remove('on'); o.innerHTML = ''; U.hideTip(); if (U._ovOnClose) { const f = U._ovOnClose; U._ovOnClose = null; f(); } };
  U.overlayOpen = () => $('#overlay').classList.contains('on');

  U.confirm = (msg, yes = 'Sim', no = 'Cancelar') => new Promise(res => {
    const o = U.overlay(`<div class="confirm"><div class="cf-msg">${msg}</div><div class="cf-btns"><button class="btn red" id="cf-y">${yes}</button><button class="btn" id="cf-n">${no}</button></div></div>`, { onClose: () => res(false) });
    o.querySelector('#cf-y').onclick = () => { U._ovOnClose = null; U.closeOverlay(); res(true); };
    o.querySelector('#cf-n').onclick = () => U.closeOverlay();
  });

  U.showDeck = () => {
    const run = M.run;
    const bySuit = {}; M.SUIT_KEYS.forEach(s => bySuit[s] = []);
    run.cards.forEach(c => bySuit[c.suit].push(c));
    const html = M.SUIT_KEYS.map(s => {
      const list = bySuit[s].sort((a, b) => a.rank - b.rank);
      const lv = run.suitLv[s], b = M.suitBase(lv);
      return `<div class="deck-row"><div class="deck-suit" style="--sc:${M.SUITS[s].c}">${M.suitIcon(s)}<b>${M.SUITS[s].n}</b><small>${list.length} cartas · nível ${lv}</small></div>
        <div class="deck-cards">${list.map(c => `<div class="dc-cell" data-tip="deckc:${c.uid}">${U.cardHTML(c)}<span class="dc-val">${c.enh === 'stone' ? 60 : b.chips + M.RANKS[c.rank - 1].chips * 2}</span></div>`).join('') || '<i class="muted">vazio</i>'}</div></div>`;
    }).join('');
    U.overlay(`<div class="deck-view"><div class="panel-title">Seu baralho <small>${run.cards.length} cartas</small></div>
      <div class="deck-explain">💡 O número embaixo de cada carta é quantas <b class="chips">Fichas</b> o par dela vale. Os pontos do par são <b class="chips">Fichas</b> × <b class="mult">Mult</b>. Cartas com número maior e cores com <b>nível</b> alto (suba com Planetas) valem mais. Toque numa carta para ver a conta.</div>
      ${html}</div>`);
  };
  U.showRunInfo = () => {
    const run = M.run;
    const rows = M.SUIT_KEYS.map(s => { const lv = run.suitLv[s], b = M.suitBase(lv); return `<div class="lv-row" style="--sc:${M.SUITS[s].c}">${M.suitIcon(s)}<b>${M.SUITS[s].n}</b><span class="lv">Nv. ${lv}</span><span class="chips">${b.chips} Fichas</span><span class="mult">${b.mult} Mult</span></div>`; }).join('');
    const vs = run.vouchers.map(v => `<span class="vchip" data-tip="col-voucher:${v}">${M.VOUCHER[v].i} ${M.VOUCHER[v].n}</span>`).join('') || '<i class="muted">Nenhuma ainda</i>';
    const res = G.calcRes();
    U.overlay(`<div class="run-info"><div class="panel-title">Níveis dos naipes</div><div class="lv-list">${rows}</div>
      <div class="ri-help">Cada par pontua: <b class="chips">Fichas do naipe + Fichas das 2 cartas</b> × <b class="mult">Mult do naipe + Combo</b>. Planetas sobem o nível dos naipes.</div>
      <div class="panel-title small">Runas gravadas</div><div class="vchips">${vs}</div>
      <div class="panel-title small">Por salão</div><div class="ri-res"><span class="tent">${res.tent} Vidas</span><span class="visl">${res.visl} Vislumbres</span><span class="hl">${M.fmtX(res.prev)}s de pré-visualização</span></div>
      <div class="ri-seed">${M.DECK[run.deck].n} · ${M.STAKES[run.stake - 1].n}${run.daily ? ' · Desafio Diário' : ''}</div></div>`);
  };

  U.showPause = () => {
    const o = U.overlay(`<div class="pause"><div class="panel-title">Pausa</div>
      <button class="btn big green" id="pz-resume">Continuar</button>
      <button class="btn" id="pz-opts">⚙ Opções</button>
      <button class="btn" id="pz-help">❔ Como jogar</button>
      <button class="btn" id="pz-menu">⌂ Menu principal <small>(progresso salvo)</small></button>
      <button class="btn red" id="pz-quit">Desistir da jornada</button></div>`);
    o.querySelector('#pz-resume').onclick = U.closeOverlay;
    o.querySelector('#pz-opts').onclick = () => U.showOptions();
    o.querySelector('#pz-help').onclick = () => U.showHelp();
    o.querySelector('#pz-menu').onclick = () => { G.save(); U.closeOverlay(); B.stopTimer(); U.show('menu'); };
    o.querySelector('#pz-quit').onclick = async () => {
      if (await U.confirm('Desistir desta jornada? Você ainda ganha a XP do que conquistou.', 'Desistir')) { B.stopTimer(); M.run.phase = 'over'; U.show('gameover'); }
    };
  };

  U.showHelp = () => {
    U.overlay(`<div class="help"><div class="panel-title">Como jogar</div>
      <div class="help-grid">
      <div><b class="hl">🃏 O básico</b><p>Vire duas cartas. Se forem iguais, é um <b>par</b> e você pontua. Se não, você perde uma <b class="tent">Vida</b>. Fique sem Vidas e a jornada acaba.</p></div>
      <div><b class="hl">🎯 O objetivo</b><p>Alcance a <b>pontuação mínima</b> de cada salão. São 3 salões por Reino e 8 Reinos. O terceiro salão é sempre um <b>Chefe</b> com regras malvadas.</p></div>
      <div><b class="hl">✖ Pontuação</b><p>Cada par vale <b class="chips">Fichas</b> × <b class="mult">Mult</b>. Pares seguidos sem errar aumentam o <b>Combo</b>, que soma Mult. Errar zera o Combo.</p></div>
      <div><b class="hl">🧠 Lembrança x Sorte</b><p>Se a segunda carta já tinha sido vista, é <b>Lembrança</b>. Se nenhuma das duas tinha sido vista, é <b>Sorte Cega</b> (x2 Mult!).</p></div>
      <div><b class="hl">👁 Vislumbres</b><p>Espiam uma carta sem gastar Vida. Botão direito numa carta, ou clique no contador.</p></div>
      <div><b class="hl">🧹 Tabuleiro limpo</b><p>Limpar todas as cartas dá <b class="tent">+2 Vidas</b> e um novo tabuleiro aparece.</p></div>
      <div><b class="hl">🏺 Relíquias</b><p>Compre na loja. Dão efeitos passivos poderosos. Combine-as para builds absurdas!</p></div>
      <div><b class="hl">📜 Pergaminhos & 🪐 Planetas</b><p>Pergaminhos são de uso único. Planetas sobem o nível de um naipe para sempre.</p></div>
      <div><b class="hl">💰 Dinheiro</b><p>Ganhe por vitória, por Vidas restantes e juros ($1 a cada $5 guardados).</p></div>
      <div><b class="hl">⌨ Atalhos</b><p><b>Espaço</b>: Vislumbre · <b>1-5</b>: usar pergaminho · <b>Esc</b>: menu</p></div>
      </div></div>`);
  };

  /* ============ opções ============ */
  U.showOptions = () => {
    const S = M.profile.settings;
    const o = U.overlay(`<div class="options"><div class="panel-title">Opções</div>
      <label class="opt"><span>🎵 Música</span><input type="range" min="0" max="1" step="0.05" value="${S.music}" id="o-mus"></label>
      <label class="opt"><span>🔊 Efeitos</span><input type="range" min="0" max="1" step="0.05" value="${S.sfx}" id="o-sfx"></label>
      <div class="opt"><span>⏩ Velocidade</span><div class="seg" id="o-speed">${[1, 2, 3].map(v => `<button class="${S.speed === v ? 'on' : ''}" data-v="${v}">${v}x</button>`).join('')}</div></div>
      <label class="opt"><span>📳 Tremor de tela</span><input type="checkbox" id="o-shake" ${S.shake ? 'checked' : ''}></label>
      <label class="opt"><span>📺 Efeito CRT</span><input type="checkbox" id="o-crt" ${S.crt ? 'checked' : ''}></label>
      <label class="opt"><span>⚡ Esconder erros rápido</span><input type="checkbox" id="o-fast" ${S.fastHide ? 'checked' : ''}></label>
      <label class="opt"><span>🧘 Reduzir movimento</span><input type="checkbox" id="o-rm" ${S.reduceMotion ? 'checked' : ''}></label>
      <div class="opt"><span>🎴 Verso das cartas</span><button class="btn small" id="o-back">Escolher</button></div>
      <div class="opt-row"><button class="btn small" id="o-full">⛶ Tela cheia</button><button class="btn small" id="o-exp">⬇ Exportar save</button><button class="btn small" id="o-imp">⬆ Importar save</button></div>
      <div class="opt-row"><button class="btn small red" id="o-reset">Apagar todo o progresso</button></div>
      <div class="credits"><b>Créditos</b><br>Músicas: "Chillwave Nightdrive" — Bogart VGM (CC BY 3.0) · "Electro" e "Look Trippy" — Pro Sensory (CC0) · "Deep Haze" — Kevin MacLeod, incompetech.com (CC BY 4.0)<br>Efeitos sonoros: Kenney (kenney.nl) e Juhani Junkala (CC0)<br>Figuras 3D: Microsoft Fluent Emoji (MIT)</div>
      <div class="ver">MNEMO v${M.VERSION}</div></div>`);
    const save = () => { M.save.saveProfile(); M.applySettings(); };
    o.querySelector('#o-mus').oninput = (e) => { S.music = +e.target.value; save(); };
    o.querySelector('#o-sfx').oninput = (e) => { S.sfx = +e.target.value; save(); };
    o.querySelector('#o-sfx').onchange = () => M.audio.play('coin');
    o.querySelectorAll('#o-speed button').forEach(b => b.onclick = () => { S.speed = +b.dataset.v; save(); o.querySelectorAll('#o-speed button').forEach(x => x.classList.toggle('on', x === b)); });
    o.querySelector('#o-shake').onchange = (e) => { S.shake = e.target.checked; save(); };
    o.querySelector('#o-crt').onchange = (e) => { S.crt = e.target.checked; save(); };
    o.querySelector('#o-fast').onchange = (e) => { S.fastHide = e.target.checked; save(); };
    o.querySelector('#o-rm').onchange = (e) => { S.reduceMotion = e.target.checked; save(); };
    o.querySelector('#o-back').onclick = () => U.showBacks();
    o.querySelector('#o-full').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.(); };
    o.querySelector('#o-exp').onclick = () => {
      const s = M.save.exportAll();
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([s], { type: 'text/plain' })); a.download = `mnemo-save-${M.todayKey()}.txt`; a.click();
      try { navigator.clipboard.writeText(s); } catch (e) { }
      U.toast('💾', 'Save exportado', 'Arquivo baixado e copiado.');
    };
    o.querySelector('#o-imp').onclick = () => {
      const oo = U.overlay(`<div class="options"><div class="panel-title">Importar save</div><textarea id="imp-t" placeholder="Cole aqui o código do save ou escolha o arquivo"></textarea><input type="file" id="imp-f" accept=".txt"><div class="opt-row"><button class="btn green" id="imp-ok">Importar</button></div></div>`);
      oo.querySelector('#imp-f').onchange = async (e) => { const f = e.target.files[0]; if (f) oo.querySelector('#imp-t').value = await f.text(); };
      oo.querySelector('#imp-ok').onclick = () => {
        try { M.save.importAll(oo.querySelector('#imp-t').value); U.closeOverlay(); M.run = null; M.applySettings(); U.show('menu'); U.toast('✅', 'Save importado!', ''); }
        catch (e) { U.toast('⚠️', 'Save inválido', 'Verifique o código.'); }
      };
    };
    o.querySelector('#o-reset').onclick = async () => {
      if (await U.confirm('Apagar <b>TODO</b> o progresso? Isso não pode ser desfeito.', 'Apagar tudo')) {
        M.save.resetAll(); M.run = null; M.applySettings(); U.show('menu');
      }
    };
  };
  U.showBacks = () => {
    const S = M.profile.settings;
    const o = U.overlay(`<div class="backs"><div class="panel-title">Verso das cartas</div><div class="back-grid">${M.BACKS.map(b => {
      const ok = M.save.isBackUnlocked(b.id);
      return `<div class="back-opt${ok ? '' : ' locked'}${S.back === b.id ? ' on' : ''}" data-b="${b.id}"><div class="mini-card"><div class="card">${M.cardBackHTML(b.id)}</div></div><div class="si-name">${ok ? b.n : '🔒 ' + b.lock}</div></div>`;
    }).join('')}</div></div>`);
    o.querySelectorAll('.back-opt:not(.locked)').forEach(e => e.onclick = () => { S.back = e.dataset.b; M.save.saveProfile(); M.audio.play('click'); U.showBacks(); });
  };

  /* ============ toasts ============ */
  U.toast = (icon, title, sub, cls = '') => {
    const t = document.createElement('div'); t.className = 'toast ' + cls;
    t.innerHTML = `<div class="t-ico">${icon}</div><div><div class="t-title">${title}</div><div class="t-sub">${sub}</div></div>`;
    $('#toasts').appendChild(t);
    setTimeout(() => t.classList.add('out'), 4200);
    setTimeout(() => t.remove(), 4800);
  };
  U.toastAch = (a, got) => {
    M.audio.play('unlock');
    U.toast(a.i, `Conquista: ${a.n}`, got.length ? `Desbloqueado: <b>${got.map(g => g.name).join(', ')}</b>` : a.d, 'ach');
  };

  /* ============ menu principal ============ */
  U.renderMenu = () => {
    M.bg.set('menu');
    const P = M.profile, has = M.save.hasRun();
    const letters = 'MNEMO'.split('');
    const need = M.xpForLevel(P.level);
    const daily = P.daily.date === M.todayKey() ? P.daily : { bestAnte: 0 };
    $('#screen').innerHTML = `<div class="menu">
      <div class="logo">${letters.map((l, i) => `<div class="logo-card" style="--i:${i}"><div class="lc-inner"><div class="lc-back">${M.cardBackHTML(P.settings.back)}</div><div class="lc-face s-${M.SUIT_KEYS[i % 4]}"><span>${l}</span></div></div></div>`).join('')}</div>
      <div class="tagline">o roguelike da memória</div>
      <div class="menu-btns">
        ${has ? `<button class="btn huge orange" id="m-cont">▶ Continuar jornada</button>` : ''}
        <button class="btn huge ${has ? 'blue' : 'orange'}" id="m-new">✦ Nova jornada</button>
        <button class="btn big purple" id="m-daily">📅 Desafio diário ${daily.bestAnte ? `<small>(melhor: Reino ${daily.bestAnte})</small>` : ''}</button>
        <div class="menu-row">
          <button class="btn" id="m-col">📖 Compêndio</button>
          <button class="btn" id="m-ach">🏆 Conquistas <small>${Object.keys(P.ach).length}/${M.ACHS.length}</small></button>
          <button class="btn" id="m-stats">📊 Estatísticas</button>
        </div>
        <div class="menu-row">
          <button class="btn small" id="m-help">❔ Como jogar</button>
          <button class="btn small" id="m-opt">⚙ Opções</button>
          <button class="btn small hidden" id="m-install">⬇ Instalar</button>
        </div>
      </div>
      <div class="profile-bar"><div class="pb-lv">Nv. ${P.level}</div><div class="pb-track"><i style="width:${P.xp / need * 100}%"></i><span>${P.xp} / ${need} XP</span></div>
        <div class="pb-next">${M.LEVEL_REWARDS[P.level + 1] ? 'Próximo nível desbloqueia algo novo!' : ''}</div></div>
      <div class="menu-foot">v${M.VERSION}</div>
    </div>`;
    const cont = $('#m-cont');
    if (cont) cont.onclick = () => { M.audio.play('click'); M.continueRun(); };
    $('#m-new').onclick = async () => {
      M.audio.play('click');
      if (has && !(await U.confirm('Começar uma nova jornada vai <b>abandonar</b> a jornada salva. Continuar?', 'Nova jornada'))) return;
      U.show('newrun');
    };
    $('#m-daily').onclick = async () => {
      M.audio.play('click');
      if (has && !(await U.confirm('O desafio diário vai <b>abandonar</b> a jornada salva. Continuar?', 'Jogar'))) return;
      G.newRun({ deck: 'classico', stake: 1, daily: true });
      U.show('select');
      U.toast('📅', 'Desafio Diário', 'Mesma semente para todos hoje. Até onde você chega?');
    };
    $('#m-col').onclick = () => { M.audio.play('click'); U.show('collection'); };
    $('#m-ach').onclick = () => { M.audio.play('click'); U.show('achievements'); };
    $('#m-stats').onclick = () => { M.audio.play('click'); U.show('stats'); };
    $('#m-help').onclick = () => { M.audio.play('click'); U.showHelp(); };
    $('#m-opt').onclick = () => { M.audio.play('click'); U.showOptions(); };
    const ib = $('#m-install');
    if (M.installPrompt) { ib.classList.remove('hidden'); ib.onclick = async () => { M.installPrompt.prompt(); await M.installPrompt.userChoice; M.installPrompt = null; ib.classList.add('hidden'); }; }
    // virar letras do logo
    clearInterval(U._logoT);
    U._logoT = setInterval(() => {
      if (screen !== 'menu') return clearInterval(U._logoT);
      const cs = $$('.logo-card'); const c = cs[Math.floor(Math.random() * cs.length)];
      c && c.classList.toggle('flipped');
    }, 1400);
  };

  /* ============ nova jornada ============ */
  U.renderNewRun = () => {
    M.bg.set('menu');
    const P = M.profile;
    let idx = M.DECKS.findIndex(d => d.id === (U._lastDeck || 'classico')); if (idx < 0) idx = 0;
    let stake = Math.min(U._lastStake || 1, P.stakeWon + 1);
    const draw = () => {
      const d = M.DECKS[idx]; const ok = M.save.isDeckUnlocked(d.id);
      const won = P.deckWins[d.id] || 0;
      $('#screen').innerHTML = `<div class="newrun">
        <div class="panel-title big">Nova jornada</div>
        <div class="deck-pick">
          <button class="arrow" id="d-prev">◀</button>
          <div class="deck-show${ok ? '' : ' locked'}" style="--dc:${d.c}">
            <div class="deck-stack">${[3, 2, 1, 0].map(k => `<div class="ds-card" style="--k:${k}">${M.cardBackHTML(P.settings.back)}</div>`).join('')}</div>
            <div class="deck-info">
              <div class="deck-name">${ok ? d.n : '🔒 ' + d.n}</div>
              <div class="deck-desc">${ok ? d.d : `<b>Para desbloquear:</b> ${d.lock}`}</div>
              <div class="deck-won">${won ? `Vencido até: <b style="color:${M.STAKES[won - 1].c}">${M.STAKES[won - 1].n}</b>` : ''}</div>
              <div class="deck-dots">${M.DECKS.map((x, i) => `<i class="${i === idx ? 'on' : ''}${M.save.isDeckUnlocked(x.id) ? '' : ' lk'}"></i>`).join('')}</div>
            </div>
          </div>
          <button class="arrow" id="d-next">▶</button>
        </div>
        <div class="stakes">${M.STAKES.map(s => { const sok = s.id <= P.stakeWon + 1; return `<button class="stake${s.id === stake ? ' on' : ''}${sok ? '' : ' locked'}" data-s="${s.id}" style="--sc:${s.c}" data-tip="txt:${encodeURIComponent(`<div class=tip-title>${s.n}</div><div class=tip-desc>${sok ? s.d + (s.id > 1 ? ' <i>(inclui os selos anteriores)</i>' : '') : 'Vença uma jornada no selo anterior'}</div>`)}"><i></i><span>${s.n.replace('Selo ', '')}</span></button>`; }).join('')}</div>
        <div class="nr-btns"><button class="btn big" id="nr-back">Voltar</button><button class="btn huge orange" id="nr-go" ${ok ? '' : 'disabled'}>Começar ✦</button></div>
      </div>`;
      $('#d-prev').onclick = () => { idx = (idx + M.DECKS.length - 1) % M.DECKS.length; M.audio.play('flip'); draw(); };
      $('#d-next').onclick = () => { idx = (idx + 1) % M.DECKS.length; M.audio.play('flip'); draw(); };
      $$('.stake:not(.locked)').forEach(b => b.onclick = () => { stake = +b.dataset.s; M.audio.play('click'); draw(); });
      $('#nr-back').onclick = () => { M.audio.play('click'); U.show('menu'); };
      $('#nr-go').onclick = () => {
        M.audio.play('buy');
        U._lastDeck = d.id; U._lastStake = stake;
        G.newRun({ deck: d.id, stake });
        M.profile.tutorial = true; M.save.saveProfile(); U.show('select');
        M.profile.tips = M.profile.tips || {};
        if (!M.profile.tips.story) { M.profile.tips.story = 1; M.save.saveProfile(); U.showStory(false); }
      };
    };
    draw();
  };

  /* ============ fim de jogo ============ */
  const endStats = (run) => `<div class="end-stats">
    <div><label>Reino</label><b>${run.ante}</b></div>
    <div><label>Pares</label><b>${run.stats.pairs}</b></div>
    <div><label>Maior combo</label><b>x${run.stats.bestCombo}</b></div>
    <div><label>Melhor par</label><b>${M.fmt(run.stats.bestPair)}</b></div>
    <div><label>Melhor salão</label><b>${M.fmt(run.stats.bestRound)}</b></div>
    <div><label>Chefes</label><b>${run.stats.bosses}</b></div>
  </div>`;
  const xpBlock = (res) => {
    const P = M.profile;
    const unl = res.ups.flatMap(u => u.got);
    return `<div class="xp-gain"><div class="xg-title">+${res.xp} XP</div>
      <div class="pb-track"><i style="width:${P.xp / M.xpForLevel(P.level) * 100}%"></i><span>Nível ${P.level} · ${P.xp}/${M.xpForLevel(P.level)}</span></div>
      ${res.ups.length ? `<div class="lvup">⬆ NÍVEL ${P.level}!</div>` : ''}
      ${unl.length ? `<div class="unlocks">${unl.map(g => `<div class="unl"><span>${g.icon}</span><div><small>${g.kind} desbloqueado</small><b>${g.name}</b></div></div>`).join('')}</div>` : ''}</div>`;
  };
  U.renderGameOver = () => {
    const run = M.run;
    M.bg.set('lose');
    const res = G.endRun(false);
    $('#screen').innerHTML = `<div class="endscreen lose"><div class="panel">
      <div class="panel-title big red">Fim da jornada</div>
      <div class="end-sub">Sua memória falhou no Reino ${run.ante}... mas ela fica mais forte a cada tentativa.</div>
      ${endStats(run)}${xpBlock(res)}
      <div class="nr-btns"><button class="btn big" id="go-menu">Menu</button><button class="btn huge orange" id="go-new">Nova jornada ✦</button></div></div></div>`;
    M.run = null;
    if (res.ups.length) { M.audio.play('unlock'); M.fx.confetti(80); }
    $('#go-menu').onclick = () => U.show('menu');
    $('#go-new').onclick = () => U.show('newrun');
  };
  U.renderVictory = () => {
    const run = M.run;
    M.bg.set('win');
    M.audio.play('win'); M.fx.confetti(260);
    $('#screen').innerHTML = `<div class="endscreen win"><div class="panel">
      <div class="panel-title big gold">VITÓRIA!</div>
      <div class="victory-queen">${M.emoImg('👸')}</div>
      <div class="end-sub">Você devolveu as <b>8 memórias</b> a Mnemósine com o ${M.DECK[run.deck].n}! Ela se lembra de tudo — e de você. ✨</div>
      ${endStats(run)}
      <div class="nr-btns"><button class="btn big" id="v-end">Encerrar e receber XP</button><button class="btn huge purple" id="v-endless">Continuar (modo sem fim) ∞</button></div></div></div>`;
    $('#v-endless').onclick = () => { G.continueEndless(); U.show('shop'); };
    $('#v-end').onclick = () => {
      const res = G.endRun(true);
      M.run = null;
      $('#screen').innerHTML = `<div class="endscreen win"><div class="panel"><div class="panel-title big gold">Lenda da Memória</div>${xpBlock(res)}<div class="nr-btns"><button class="btn huge orange" id="v-menu">Menu</button></div></div></div>`;
      $('#v-menu').onclick = () => U.show('menu');
    };
  };

  /* ============ compêndio ============ */
  U.renderCollection = (tab = U._colTab || 'relics') => {
    U._colTab = tab;
    M.bg.set('menu');
    const P = M.profile;
    const tabs = { relics: 'Relíquias', scrolls: 'Pergaminhos', astros: 'Planetas', bosses: 'Chefes', decks: 'Baralhos', tags: 'Bênçãos', vouchers: 'Runas', cards: 'Cartas' };
    let body = '';
    if (tab === 'relics') body = [1, 2, 3, 4].map(r => `<div class="col-sec"><div class="col-h" style="color:${M.RARITY[r].c}">${M.RARITY[r].n}</div><div class="col-grid">${M.RELICS.filter(x => x.r === r).map(d => {
      const unl = M.save.isRelicUnlocked(d.id), seen = P.seen.relics[d.id];
      if (!unl) return `<div class="col-item locked" data-tip="txt:${encodeURIComponent('<div class=tip-title>🔒 Bloqueada</div><div class=tip-desc>' + U.unlockHint('relic', d.id) + '</div>')}">${U.relicHTML({ id: d.id, data: {} }, { cls: ' silhouette' })}</div>`;
      return `<div class="col-item${seen ? '' : ' unseen'}" data-tip="col-relic:${d.id}">${U.relicHTML({ id: d.id, data: {} })}</div>`;
    }).join('')}</div></div>`).join('');
    if (tab === 'scrolls') body = `<div class="col-grid">${M.SCROLLS.map(s => `<div class="col-item${P.seen.scrolls[s.id] ? '' : ' unseen'}" data-tip="col-scroll:${s.id}">${U.scrollHTML(s.id)}</div>`).join('')}</div>`;
    if (tab === 'astros') body = `<div class="col-grid">${M.ASTROS.map(s => `<div class="col-item${P.seen.astros[s.id] ? '' : ' unseen'}" data-tip="col-astro:${s.id}">${U.astroHTML(s.id)}</div>`).join('')}</div>`;
    if (tab === 'bosses') body = `<div class="boss-list">${[...M.BOSSES, ...M.FINAL_BOSSES].map(b => { const s = P.seen.bosses[b.id]; return `<div class="boss-item${s ? '' : ' unseen'}" style="--bc:${b.c}"><div class="bi-chip">${s ? b.i : '?'}</div><div><b>${s ? b.n : '???'}</b>${b.final ? ' <span class="rar" style="--rc:#ff4d6d">Final</span>' : ''}<div class="bi-d">${s ? b.d : 'Ainda não enfrentado'}</div></div></div>`; }).join('')}</div>`;
    if (tab === 'decks') body = `<div class="boss-list">${M.DECKS.map(d => { const ok = M.save.isDeckUnlocked(d.id); return `<div class="boss-item${ok ? '' : ' unseen'}" style="--bc:${d.c}"><div class="bi-chip">🂠</div><div><b>${d.n}</b><div class="bi-d">${ok ? d.d : '🔒 ' + d.lock}</div></div></div>`; }).join('')}</div>`;
    if (tab === 'tags') body = `<div class="boss-list">${M.TAGS.map(t => `<div class="boss-item" style="--bc:#ffd166"><div class="bi-chip">${t.i}</div><div><b>${t.n}</b><div class="bi-d">${t.d}</div></div></div>`).join('')}</div>`;
    if (tab === 'vouchers') body = `<div class="boss-list">${M.VOUCHERS.map(t => `<div class="boss-item" style="--bc:#ffd166"><div class="bi-chip rune">${t.i}</div><div><b>${t.n}</b><div class="bi-d">${t.d}</div></div></div>`).join('')}</div>`;
    if (tab === 'cards') body = `<div class="col-sec"><div class="col-h">Símbolos</div><div class="col-grid cards">${M.RANKS.map((r, i) => U.cardHTML({ suit: M.SUIT_KEYS[i % 4], rank: i + 1 })).join('')}</div></div>
      <div class="col-sec"><div class="col-h">Encantamentos</div><div class="col-grid cards">${Object.keys(M.ENH).map((e, i) => `<div data-tip="txt:${encodeURIComponent(`<div class=tip-title>${M.ENH[e].n}</div><div class=tip-desc>${M.ENH[e].d}</div>`)}">${U.cardHTML({ suit: M.SUIT_KEYS[i % 4], rank: (i % 9) + 1, enh: e })}</div>`).join('')}</div></div>
      <div class="col-sec"><div class="col-h">Edições</div><div class="col-grid cards">${['foil', 'holo', 'poly'].map((e, i) => `<div data-tip="txt:${encodeURIComponent(`<div class=tip-title>${M.EDITIONS[e].n}</div><div class=tip-desc>${M.EDITIONS[e].d}</div>`)}">${U.cardHTML({ suit: M.SUIT_KEYS[i], rank: 7 + i, ed: e })}</div>`).join('')}</div></div>`;
    const relicSeen = Object.keys(P.seen.relics).length;
    $('#screen').innerHTML = `<div class="page"><div class="page-head"><button class="btn" id="pg-back">◀ Voltar</button><div class="panel-title big">Compêndio</div><div class="pg-count">${relicSeen}/${M.RELICS.length} relíquias descobertas</div></div>
      <div class="tabs">${Object.entries(tabs).map(([k, v]) => `<button class="tab${k === tab ? ' on' : ''}" data-t="${k}">${v}</button>`).join('')}</div>
      <div class="page-body">${body}</div></div>`;
    $('#pg-back').onclick = () => U.show('menu');
    $$('.tab').forEach(b => b.onclick = () => { M.audio.play('click'); U.renderCollection(b.dataset.t); });
  };
  U.unlockHint = (kind, id) => {
    for (const a of M.ACHS) if (a.unlock && a.unlock[kind] === id) return `Conquista: <b>${a.n}</b> — ${a.d}`;
    for (const [lv, rw] of Object.entries(M.LEVEL_REWARDS)) if (rw[kind] === id) return `Alcance o <b>Nível ${lv}</b> de perfil`;
    return '???';
  };

  U.renderAch = () => {
    M.bg.set('menu');
    const P = M.profile;
    $('#screen').innerHTML = `<div class="page"><div class="page-head"><button class="btn" id="pg-back">◀ Voltar</button><div class="panel-title big">Conquistas</div><div class="pg-count">${Object.keys(P.ach).length}/${M.ACHS.length}</div></div>
      <div class="page-body"><div class="ach-list">${M.ACHS.map(a => {
      const done = P.ach[a.id];
      const rw = a.unlock ? Object.entries(a.unlock).map(([k, v]) => k === 'relic' ? `🏺 ${M.RELIC[v].n}` : k === 'deck' ? `🂠 ${M.DECK[v].n}` : `🎴 ${M.BACKS.find(b => b.id === v).n}`).join(' · ') : '';
      return `<div class="ach${done ? ' done' : ''}"><div class="ach-ico">${done ? a.i : '🔒'}</div><div><b>${a.n}</b><div class="ach-d">${a.d}</div>${rw ? `<div class="ach-r">Recompensa: ${rw}</div>` : ''}</div></div>`;
    }).join('')}</div>
      <div class="col-h" style="margin-top:24px">Recompensas de nível</div>
      <div class="ach-list">${Object.entries(M.LEVEL_REWARDS).map(([lv, rw]) => { const ok = P.level >= lv; const n = rw.relic ? `🏺 ${M.RELIC[rw.relic].n}` : rw.deck ? `🂠 ${M.DECK[rw.deck].n}` : `🎴 ${M.BACKS.find(b => b.id === rw.back).n}`; return `<div class="ach${ok ? ' done' : ''}"><div class="ach-ico">${ok ? '⭐' : lv}</div><div><b>Nível ${lv}</b><div class="ach-d">${n}</div></div></div>`; }).join('')}</div></div></div>`;
    $('#pg-back').onclick = () => U.show('menu');
  };

  U.renderStats = () => {
    M.bg.set('menu');
    const s = M.profile.stats, P = M.profile;
    const h = Math.floor(s.playTime / 3600), m = Math.floor((s.playTime % 3600) / 60);
    const rows = [['Jornadas', s.runs], ['Vitórias', s.wins], ['Melhor Reino', s.bestAnte], ['Maior combo', 'x' + s.bestCombo], ['Pares formados', M.fmt(s.pairs)], ['Melhor par', M.fmt(s.bestPair)], ['Melhor salão', M.fmt(s.bestRound)], ['Chefes derrotados', s.bosses], ['Pergaminhos usados', s.scrolls], ['Planetas usados', s.astros], ['Vidros quebrados', s.glass], ['Erros', M.fmt(s.mismatches)], ['Mais dinheiro', '$' + s.maxMoney], ['Tempo de jogo', `${h}h ${m}min`], ['Nível de perfil', P.level]];
    $('#screen').innerHTML = `<div class="page"><div class="page-head"><button class="btn" id="pg-back">◀ Voltar</button><div class="panel-title big">Estatísticas</div><div></div></div>
      <div class="page-body"><div class="stats-grid">${rows.map(([k, v]) => `<div class="stat"><label>${k}</label><b>${v}</b></div>`).join('')}</div></div></div>`;
    $('#pg-back').onclick = () => U.show('menu');
  };
})();
