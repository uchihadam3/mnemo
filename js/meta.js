/* MNEMO — telas fora da partida: menu, Compêndio, Conquistas, Trilha de Recompensas e Estatísticas */
'use strict';
(function () {
  const U = M.ui, G = M.game;
  const $ = M.$, $$ = M.$$;
  const P = () => M.profile;
  const click = () => M.audio.play('click');

  /* ---------------- progresso das conquistas ---------------- */
  const ACH_PROG = {
    par1: (s) => [Math.min(1, s.pairs), 1],
    chefe1: (s) => [Math.min(1, s.bosses), 1],
    combo5: (s) => [Math.min(5, s.bestCombo), 5],
    combo8: (s) => [Math.min(8, s.bestCombo), 8],
    combo12: (s) => [Math.min(12, s.bestCombo), 12],
    circ3: (s) => [Math.min(3, s.bestAnte), 3],
    circ5: (s) => [Math.min(5, s.bestAnte), 5],
    vitoria: (s) => [Math.min(1, s.wins), 1],
    rico: (s) => [Math.min(40, s.maxMoney), 40],
    arcanista: (s) => [Math.min(10, s.scrolls), 10],
    astronomo: (s) => [Math.min(10, s.astros), 10],
    colecao: (s) => [Math.min(5, s.maxRelics || 0), 5],
    explosao: (s) => [Math.min(5000, s.bestPair), 5000],
    veterano: (s) => [Math.min(10, s.runs), 10],
    vidraceiro: (s) => [Math.min(3, s.glass), 3],
    diario: () => [Math.min(3, P().daily.bestAnte || 0), 3],
    infinito: (s) => [Math.min(10, s.bestAnte), 10],
    milhao: (s) => [Math.min(100000, s.bestRound), 100000],
    chefe10: (s) => [Math.min(10, s.bosses), 10],
  };
  U.achProgress = (id) => {
    if (P().ach[id]) return [1, 1];
    const f = ACH_PROG[id];
    return f ? f(P().stats) : [0, 1];
  };
  const fmtProg = ([c, g]) => g >= 1000 ? `${M.fmt(c)} / ${M.fmt(g)}` : `${c} / ${g}`;
  const bar = (k, cls = '') => `<div class="mbar ${cls}"><i style="width:${Math.round(Math.min(1, k) * 100)}%"></i></div>`;

  // de onde vem um desbloqueio (conquista ou nível) + progresso
  U.unlockInfo = (kind, id) => {
    for (const a of M.ACHS) if (a.unlock && a.unlock[kind] === id) {
      const p = U.achProgress(a.id);
      return { how: `Conquista <b>${a.i} ${a.n}</b>: ${a.d}`, prog: p, done: !!P().ach[a.id] };
    }
    for (const [lv, rw] of Object.entries(M.LEVEL_REWARDS)) if (rw[kind] === id)
      return { how: `Chegue ao <b>Nível ${lv}</b> de perfil`, prog: [Math.min(+lv, P().level), +lv], done: P().level >= +lv };
    return { how: 'Continue jogando para descobrir!', prog: [0, 1] };
  };
  U.unlockHint = (kind, id) => U.unlockInfo(kind, id).how;

  /* ---------------- novidades (selo NOVO) ---------------- */
  const freshKey = (kind, id) => `${kind}:${id}`;
  U.isFresh = (kind, id) => (P().fresh || []).includes(freshKey(kind, id));
  U.clearFresh = (kind, id) => { const f = P().fresh || []; const i = f.indexOf(freshKey(kind, id)); if (i >= 0) { f.splice(i, 1); M.save.saveProfile(); } };
  U.freshCount = (kinds) => (P().fresh || []).filter(k => !kinds || kinds.includes(k.split(':')[0])).length;

  /* ---------------- modal de detalhe ---------------- */
  U.detail = ({ visual, title, sub = '', chips = '', body = '', status = '', color = '#8e4dff', actions = [] }) => {
    const o = U.overlay(`<div class="detail" style="--dc:${color}">
      <div class="dt-glow"></div>
      <div class="dt-visual">${visual}</div>
      <div class="dt-title">${title}</div>
      ${sub ? `<div class="dt-sub">${sub}</div>` : ''}
      ${chips ? `<div class="dt-chips">${chips}</div>` : ''}
      ${body ? `<div class="dt-body">${body}</div>` : ''}
      ${status}
      <div class="dt-actions">${actions.map((a, i) => `<button class="btn ${a.cls || ''}" data-dta="${i}">${a.t}</button>`).join('')}<button class="btn" data-dtx>Fechar</button></div>
    </div>`);
    o.querySelector('[data-dtx]').onclick = () => { click(); U.closeOverlay(); };
    o.querySelectorAll('[data-dta]').forEach(b => b.onclick = () => { click(); actions[+b.dataset.dta].fn(); });
    M.audio.play('take');
    return o;
  };
  const statusBox = (state, text, prog) => {
    const ico = { found: '✅', open: '🔍', locked: '🔒', done: '🏆' }[state];
    return `<div class="dt-status st-${state}"><span class="dt-st-ico">${ico}</span><div class="dt-st-txt">${text}${prog ? `<div class="dt-prog">${bar(prog[0] / prog[1])}<span>${fmtProg(prog)}</span></div>` : ''}</div></div>`;
  };

  /* ================= MENU PRINCIPAL ================= */
  U.renderMenu = () => {
    M.bg.set('menu');
    const p = P(), has = M.save.hasRun();
    const need = M.xpForLevel(p.level);
    const daily = p.daily.date === M.todayKey() ? p.daily : { bestAnte: 0 };
    const relSeen = Object.keys(p.seen.relics).length;
    const achN = Object.keys(p.ach).length;
    const nextRw = Object.keys(M.LEVEL_REWARDS).map(Number).filter(l => l > p.level).sort((a, b) => a - b)[0];
    const nextRwName = nextRw ? rewardName(M.LEVEL_REWARDS[nextRw]) : null;
    const fresh = U.freshCount();
    const tiles = [
      { id: 'collection', i: '📖', n: 'Compêndio', d: `${relSeen}/${M.RELICS.length} relíquias`, k: relSeen / M.RELICS.length, badge: U.freshCount(['relic', 'deck', 'back']), c: '#3cb4ff' },
      { id: 'achievements', i: '🏆', n: 'Conquistas', d: `${achN}/${M.ACHS.length} concluídas`, k: achN / M.ACHS.length, c: '#ffc93c' },
      { id: 'rewards', i: '🎁', n: 'Recompensas', d: nextRwName ? `Nv. ${nextRw}: ${nextRwName}` : 'Todas liberadas!', k: p.xp / need, c: '#ff8af0' },
      { id: 'stats', i: '📊', n: 'Estatísticas', d: p.stats.bestAnte ? `Recorde: Reino ${p.stats.bestAnte}` : 'Jogue para criar recordes', k: Math.min(1, p.stats.bestAnte / 8), c: '#43e27a' },
    ];
    $('#screen').innerHTML = `<div class="menu menu2">
      <div class="logo">${'MNEMO'.split('').map((l, i) => `<div class="logo-card" style="--i:${i}"><div class="lc-inner"><div class="lc-back">${M.cardBackHTML(p.settings.back)}</div><div class="lc-face s-${M.SUIT_KEYS[i % 4]}"><span>${l}</span></div></div></div>`).join('')}</div>
      <div class="tagline">o roguelike da memória</div>
      <div class="menu-btns">
        ${has ? `<button class="btn huge orange" id="m-cont">▶ Continuar jornada</button>` : ''}
        <button class="btn huge ${has ? 'blue' : 'orange'}" id="m-new">✦ Nova jornada</button>
        <button class="daily-card" id="m-daily"><span class="dc-ico">📅</span><span class="dc-txt"><b>Desafio diário</b><small>${daily.bestAnte ? `Seu melhor hoje: Reino ${daily.bestAnte}` : 'Mesma partida para todo mundo hoje'}</small></span><span class="dc-go">▶</span></button>
      </div>
      <div class="hub">${tiles.map(t => `<button class="hub-tile" data-go="${t.id}" style="--tc:${t.c}">
          ${t.badge ? `<span class="hub-badge">${t.badge} NOVO</span>` : ''}
          <span class="ht-ico">${t.i}</span><span class="ht-n">${t.n}</span><span class="ht-d">${t.d}</span>${bar(t.k)}
        </button>`).join('')}</div>
      <div class="menu-row small-row">
        <button class="btn small" id="m-help">❔ Como jogar</button>
        <button class="btn small" id="m-opt">⚙ Opções</button>
        <button class="btn small hidden" id="m-install">⬇ Instalar</button>
      </div>
      <button class="profile-bar" data-go="rewards"><div class="pb-lv">Nv. ${p.level}</div><div class="pb-track"><i style="width:${p.xp / need * 100}%"></i><span>${p.xp} / ${need} XP</span></div>
        ${fresh ? `<div class="pb-new">${fresh} novidade${fresh > 1 ? 's' : ''}!</div>` : ''}</button>
      <div class="menu-foot">v${M.VERSION}</div>
    </div>`;
    const cont = $('#m-cont');
    if (cont) cont.onclick = () => { click(); M.continueRun(); };
    $('#m-new').onclick = async () => {
      click();
      if (has && !(await U.confirm('Começar uma nova jornada vai <b>abandonar</b> a jornada salva. Continuar?', 'Nova jornada'))) return;
      U.show('newrun');
    };
    $('#m-daily').onclick = async () => {
      click();
      if (has && !(await U.confirm('O desafio diário vai <b>abandonar</b> a jornada salva. Continuar?', 'Jogar'))) return;
      G.newRun({ deck: 'classico', stake: 1, daily: true });
      U.show('select');
      U.toast('📅', 'Desafio Diário', 'Mesma semente para todos hoje. Até onde você chega?');
    };
    $$('[data-go]').forEach(b => b.onclick = () => { click(); U.show(b.dataset.go); });
    $('#m-help').onclick = () => { click(); U.showHelp(); };
    $('#m-opt').onclick = () => { click(); U.showOptions(); };
    const ib = $('#m-install');
    if (M.installPrompt) { ib.classList.remove('hidden'); ib.onclick = async () => { M.installPrompt.prompt(); await M.installPrompt.userChoice; M.installPrompt = null; ib.classList.add('hidden'); }; }
    clearInterval(U._logoT);
    U._logoT = setInterval(() => {
      if (U.current() !== 'menu') return clearInterval(U._logoT);
      const cs = $$('.logo-card'); const c = cs[Math.floor(Math.random() * cs.length)];
      c && c.classList.toggle('flipped');
    }, 1400);
  };

  /* ---------------- cabeçalho comum das páginas ---------------- */
  const pageHead = (title, icon, k, label) => `<div class="page-head2">
      <button class="btn btn-back" data-back>◀</button>
      <div class="ph-title"><span class="ph-ico">${icon}</span>${title}</div>
      <div class="ph-ring" style="--k:${Math.round(k * 100)}"><span>${Math.round(k * 100)}%</span></div>
    </div>${label ? `<div class="ph-label">${label}</div>` : ''}`;
  const wireBack = () => $$('[data-back]').forEach(b => b.onclick = () => { click(); U.show('menu'); });

  /* ================= COMPÊNDIO ================= */
  const TABS = [
    { k: 'relics', n: 'Relíquias', i: '🏺' }, { k: 'scrolls', n: 'Pergaminhos', i: '📜' }, { k: 'astros', n: 'Astros', i: '🪐' },
    { k: 'bosses', n: 'Chefes', i: '👹' }, { k: 'decks', n: 'Baralhos', i: '🂠' }, { k: 'backs', n: 'Versos', i: '🎴' },
    { k: 'vouchers', n: 'Runas', i: '🔮' }, { k: 'tags', n: 'Bênçãos', i: '✨' }, { k: 'cards', n: 'Cartas', i: '🃏' },
  ];
  const tabCount = (k) => {
    const p = P();
    switch (k) {
      case 'relics': return [Object.keys(p.seen.relics).length, M.RELICS.length];
      case 'scrolls': return [Object.keys(p.seen.scrolls).length, M.SCROLLS.length];
      case 'astros': return [Object.keys(p.seen.astros).length, M.ASTROS.length];
      case 'bosses': return [Object.keys(p.seen.bosses).length, M.BOSSES.length + M.FINAL_BOSSES.length];
      case 'decks': return [p.unlocked.decks.length, M.DECKS.length];
      case 'backs': return [p.unlocked.backs.length, M.BACKS.length];
      case 'vouchers': return [Object.keys(p.seen.vouchers).length, M.VOUCHERS.length];
      case 'tags': return [Object.keys(p.seen.tags).length, M.TAGS.length];
      case 'cards': return [M.RANKS.length, M.RANKS.length];
    }
  };
  U.renderCollection = (tab = U._colTab || 'relics') => {
    U._colTab = tab;
    M.bg.set('menu');
    const p = P();
    let tot = 0, got = 0; TABS.forEach(t => { const [a, b] = tabCount(t.k); got += a; tot += b; });
    const [ca, cb] = tabCount(tab);
    const T = TABS.find(t => t.k === tab);
    $('#screen').innerHTML = `<div class="page2">
      ${pageHead('Compêndio', '📖', got / tot, `Toque em qualquer item para ver o que ele faz`)}
      <div class="tabs2">${TABS.map(t => { const [a, b] = tabCount(t.k); const fr = t.k === 'relics' ? U.freshCount(['relic']) : t.k === 'decks' ? U.freshCount(['deck']) : t.k === 'backs' ? U.freshCount(['back']) : 0; return `<button class="tab2${t.k === tab ? ' on' : ''}" data-t="${t.k}"><span class="tb-i">${t.i}</span><span class="tb-n">${t.n}</span><span class="tb-c">${a}/${b}</span>${fr ? '<span class="tb-dot"></span>' : ''}</button>`; }).join('')}</div>
      <div class="page-body2">
        <div class="col-progress"><b>${T.i} ${T.n}</b><span>${ca} de ${cb} descobertos</span>${bar(ca / cb)}</div>
        ${collectionBody(tab)}
        <div class="col-legend"><span><i class="lg found"></i>Descoberto</span><span><i class="lg open"></i>Ainda não encontrado</span><span><i class="lg locked"></i>Bloqueado</span></div>
      </div>
    </div>`;
    wireBack();
    $$('.tab2').forEach(b => b.onclick = () => { click(); U.renderCollection(b.dataset.t); $('.page-body2').scrollTop = 0; });
    $$('[data-cd]').forEach(el => el.onclick = () => { const [k, id] = el.dataset.cd.split(':'); showItem(k, id); });
  };
  const cell = (k, id, html, state, label) => `<button class="cell st-${state}" data-cd="${k}:${id}">
      ${U.isFresh(k, id) ? '<span class="cell-new">NOVO</span>' : ''}
      <div class="cell-vis">${html}${state === 'locked' ? '<span class="cell-lock">🔒</span>' : ''}</div>
      <div class="cell-n">${label}</div></button>`;
  function collectionBody(tab) {
    const p = P();
    if (tab === 'relics') return [1, 2, 3, 4].map(r => `<div class="col-sec"><div class="col-h" style="color:${M.RARITY[r].c}">${M.RARITY[r].n}</div><div class="cells">${M.RELICS.filter(x => x.r === r).map(d => {
      const unl = M.save.isRelicUnlocked(d.id), seen = p.seen.relics[d.id];
      const st = !unl ? 'locked' : seen ? 'found' : 'open';
      return cell('relic', d.id, U.relicHTML({ id: d.id, data: {} }, { cls: st === 'locked' ? ' silhouette' : '' }), st, st === 'locked' ? '???' : d.n);
    }).join('')}</div></div>`).join('');
    if (tab === 'scrolls') return `<div class="cells">${M.SCROLLS.map(s => cell('scroll', s.id, U.scrollHTML(s.id), p.seen.scrolls[s.id] ? 'found' : 'open', s.n)).join('')}</div>`;
    if (tab === 'astros') return `<div class="cells">${M.ASTROS.map(s => cell('astro', s.id, U.astroHTML(s.id), p.seen.astros[s.id] ? 'found' : 'open', s.n)).join('')}</div>`;
    if (tab === 'bosses') return [['Chefes', M.BOSSES], ['Chefes finais (Reino 8)', M.FINAL_BOSSES]].map(([h, L]) => `<div class="col-sec"><div class="col-h">${h}</div><div class="cells">${L.map(b => {
      const s = p.seen.bosses[b.id];
      return cell('boss', b.id, `<div class="boss-chip" style="--bc:${b.c}">${s ? b.i : '?'}</div>`, s ? 'found' : 'open', s ? b.n : '???');
    }).join('')}</div></div>`).join('');
    if (tab === 'decks') return `<div class="cells">${M.DECKS.map(d => { const ok = M.save.isDeckUnlocked(d.id); return cell('deck', d.id, `<div class="deck-mini" style="--dc:${d.c}">${M.cardBackHTML(p.settings.back)}</div>`, ok ? 'found' : 'locked', d.n.replace('Baralho ', '')); }).join('')}</div>`;
    if (tab === 'backs') return `<div class="cells">${M.BACKS.map(b => { const ok = M.save.isBackUnlocked(b.id); return cell('back', b.id, `<div class="mini-card" style="--cw:58px"><div class="card">${M.cardBackHTML(b.id)}</div></div>`, ok ? 'found' : 'locked', b.n); }).join('')}</div>`;
    if (tab === 'vouchers') return `<div class="cells">${M.VOUCHERS.map(v => cell('voucher', v.id, `<div class="voucher sm"><div class="voucher-in"><div class="v-rune">${v.i}</div></div></div>`, p.seen.vouchers[v.id] ? 'found' : 'open', v.n.replace('Runa d', 'D'))).join('')}</div>`;
    if (tab === 'tags') return `<div class="cells">${M.TAGS.map(t => cell('tag', t.id, `<div class="boss-chip" style="--bc:#ffc93c">${t.i}</div>`, p.seen.tags[t.id] ? 'found' : 'open', t.n.replace('Bênção d', 'D'))).join('')}</div>`;
    if (tab === 'cards') return `<div class="col-sec"><div class="col-h">Símbolos (do mais fraco ao mais forte)</div><div class="cells">${M.RANKS.map((r, i) => cell('rank', i + 1, U.cardHTML({ suit: M.SUIT_KEYS[i % 4], rank: i + 1 }), 'found', r.n)).join('')}</div></div>
      <div class="col-sec"><div class="col-h">Naipes</div><div class="cells">${M.SUIT_KEYS.map(s => cell('suit', s, `<div class="suit-big" style="--sc:${M.SUITS[s].c}">${M.suitIcon(s)}</div>`, 'found', M.SUITS[s].n)).join('')}</div></div>
      <div class="col-sec"><div class="col-h">Encantamentos</div><div class="cells">${Object.keys(M.ENH).map((e, i) => cell('enh', e, U.cardHTML({ suit: M.SUIT_KEYS[i % 4], rank: (i % 9) + 1, enh: e }), 'found', M.ENH[e].n)).join('')}</div></div>
      <div class="col-sec"><div class="col-h">Edições</div><div class="cells">${['foil', 'holo', 'poly'].map((e, i) => cell('ed', e, U.cardHTML({ suit: M.SUIT_KEYS[i], rank: 7 + i, ed: e }), 'found', M.EDITIONS[e].n)).join('')}</div></div>`;
    return '';
  }

  function showItem(k, id) {
    const p = P();
    U.clearFresh(k, id);
    if (k === 'relic') {
      const d = M.RELIC[id], unl = M.save.isRelicUnlocked(id), seen = p.seen.relics[id];
      const ui = U.unlockInfo('relic', id);
      U.detail({
        visual: U.relicHTML({ id, data: {} }, { cls: ' big' + (unl ? '' : ' silhouette') }), color: M.RARITY[d.r].c,
        title: unl ? d.n : 'Relíquia bloqueada', chips: `<span class="rar" style="--rc:${M.RARITY[d.r].c}">${M.RARITY[d.r].n}</span>${unl ? `<span class="rar" style="--rc:#2a2350">💰 $${d.c} na loja</span>` : ''}`,
        body: unl ? d.d : '<i>O que será que ela faz?</i>',
        status: !unl ? statusBox('locked', `Como liberar: ${ui.how}`, ui.prog) : seen ? statusBox('found', 'Você já encontrou esta relíquia numa jornada.') : statusBox('open', 'Liberada! Pode aparecer na <b>loja</b> e nos <b>Pacotes de Relíquias</b>.'),
      });
    } else if (k === 'scroll') {
      const d = M.SCROLL[id];
      U.detail({ visual: U.scrollHTML(id, { cls: ' big' }), color: '#b46bff', title: d.n, chips: `<span class="rar" style="--rc:#b46bff">Pergaminho · uso único</span>`, body: d.d + `<div class="dt-note">${d.when === 'round' ? 'Use durante um salão.' : 'Pode usar a qualquer momento.'}</div>`, status: p.seen.scrolls[id] ? statusBox('found', 'Já encontrado.') : statusBox('open', 'Aparece na loja e nos Pacotes Arcanos.') });
    } else if (k === 'astro') {
      const d = M.ASTRO[id];
      U.detail({ visual: U.astroHTML(id, { cls: ' big' }), color: d.suit === 'all' ? '#888' : M.SUITS[d.suit].c, title: d.n, chips: `<span class="rar" style="--rc:#3cb4ff">Astro · melhora permanente</span>`, body: M.astroDesc(d), status: p.seen.astros[id] ? statusBox('found', 'Já usado.') : statusBox('open', 'Aparece na loja e nos Pacotes Celestes.') });
    } else if (k === 'boss') {
      const b = M.BOSS[id], s = p.seen.bosses[id];
      U.detail({ visual: `<div class="boss-chip big" style="--bc:${b.c}">${s ? b.i : '?'}</div>`, color: b.c, title: s ? b.n : 'Chefe desconhecido', chips: `<span class="rar" style="--rc:#f2464f">${b.final ? 'Chefe final · Reino 8' : 'Chefe'}</span>`, body: s ? `<b>Regra:</b> ${b.d}` : '<i>Você ainda não enfrentou este chefe.</i>', status: s ? statusBox('found', 'Já enfrentado.') : statusBox('open', 'Aparece como terceiro salão de algum Reino.') });
    } else if (k === 'deck') {
      const d = M.DECK[id], ok = M.save.isDeckUnlocked(id), ui = U.unlockInfo('deck', id), won = p.deckWins[id];
      U.detail({ visual: `<div class="deck-mini big" style="--dc:${d.c}">${M.cardBackHTML(p.settings.back)}</div>`, color: d.c, title: d.n, chips: won ? `<span class="rar" style="--rc:${M.STAKES[won - 1].c};color:#111">Vencido até ${M.STAKES[won - 1].n}</span>` : '', body: d.d,
        status: ok ? statusBox('found', 'Liberado! Escolha ao começar uma Nova jornada.') : statusBox('locked', `Como liberar: ${ui.how}`, ui.prog),
        actions: ok ? [{ t: '▶ Jogar com ele', cls: 'orange', fn: () => { U.closeOverlay(); U._lastDeck = id; U.show('newrun'); } }] : [] });
    } else if (k === 'back') {
      const b = M.BACKS.find(x => x.id === id), ok = M.save.isBackUnlocked(id), ui = U.unlockInfo('back', id), on = p.settings.back === id;
      U.detail({ visual: `<div class="mini-card" style="--cw:120px"><div class="card">${M.cardBackHTML(id)}</div></div>`, color: '#ffc93c', title: b.n, chips: `<span class="rar" style="--rc:#2a2350">Verso de carta · visual</span>`, body: 'Muda a aparência das costas das cartas no tabuleiro.',
        status: ok ? statusBox(on ? 'done' : 'found', on ? 'Em uso agora.' : 'Liberado!') : statusBox('locked', `Como liberar: ${ui.how}`, ui.prog),
        actions: ok && !on ? [{ t: 'Usar este verso', cls: 'green', fn: () => { p.settings.back = id; M.save.saveProfile(); U.closeOverlay(); U.renderCollection('backs'); U.toast('🎴', 'Verso equipado', b.n); } }] : [] });
    } else if (k === 'voucher') {
      const v = M.VOUCHER[id];
      U.detail({ visual: `<div class="voucher big"><div class="voucher-in"><div class="v-rune">${v.i}</div></div></div>`, color: '#ffc93c', title: v.n, chips: `<span class="rar" style="--rc:#a87900">Runa · dura a jornada inteira · $10</span>`, body: v.d, status: p.seen.vouchers[id] ? statusBox('found', 'Já gravada numa jornada.') : statusBox('open', 'Uma Runa aparece na loja a cada Reino.') });
    } else if (k === 'tag') {
      const t = M.TAG[id];
      U.detail({ visual: `<div class="boss-chip big" style="--bc:#ffc93c">${t.i}</div>`, color: '#ffc93c', title: t.n, chips: `<span class="rar" style="--rc:#a87900">Bênção</span>`, body: t.d + '<div class="dt-note">Ganhe ao <b>pular</b> um Salão Pequeno ou Grande.</div>', status: p.seen.tags[id] ? statusBox('found', 'Já recebida.') : statusBox('open', 'Pule um salão para ganhar.') });
    } else if (k === 'rank') {
      const r = M.RANKS[id - 1];
      U.detail({ visual: `<div style="--cw:120px" class="mini-card"><div class="card"><div class="card-inner static">${M.cardFaceHTML({ suit: M.SUIT_KEYS[(id - 1) % 4], rank: +id })}</div></div></div>`, color: '#8e4dff', title: r.n, chips: r.fig ? '<span class="rar" style="--rc:#c77dff">Figura</span>' : '', body: `Cada par de <b>${r.n}</b> vale <b class="chips">+${r.chips * 2} Fichas</b>.${r.fig ? ' Figuras aparecem nos Pacotes de Cartas.' : ''}` });
    } else if (k === 'suit') {
      const s = M.SUITS[id], lv = M.suitBase(1);
      U.detail({ visual: `<div class="suit-big big" style="--sc:${s.c}">${M.suitIcon(id)}</div>`, color: s.c, title: s.n, chips: '<span class="rar" style="--rc:#2a2350">Naipe</span>', body: `No nível 1, cada par de ${s.n} começa com <b class="chips">${lv.chips} Fichas</b> e <b class="mult">${lv.mult} Mult</b>. Use <b>Astros</b> para subir o nível. <div class="dt-note">Cuidado: o mesmo símbolo em naipes diferentes <b>não</b> forma par!</div>` });
    } else if (k === 'enh') {
      U.detail({ visual: `<div style="--cw:120px" class="mini-card"><div class="card"><div class="card-inner static">${M.cardFaceHTML({ suit: 'astro', rank: 5, enh: id })}</div></div></div>`, color: '#3cb4ff', title: M.ENH[id].n, chips: '<span class="rar" style="--rc:#2a2350">Encantamento de carta</span>', body: M.ENH[id].d + '<div class="dt-note">Consiga com Pergaminhos ("o próximo par vira…") ou nos Pacotes de Cartas.</div>' });
    } else if (k === 'ed') {
      U.detail({ visual: `<div style="--cw:120px" class="mini-card"><div class="card"><div class="card-inner static">${M.cardFaceHTML({ suit: 'mare', rank: 7, ed: id })}</div></div></div>`, color: '#ff8af0', title: M.EDITIONS[id].n, chips: '<span class="rar" style="--rc:#2a2350">Edição rara</span>', body: M.EDITIONS[id].d });
    }
    if (U.current() === 'collection') setTimeout(() => { const c = $(`[data-cd="${k}:${id}"] .cell-new`); c && c.remove(); }, 50);
  }
  U.showItem = showItem;

  /* ================= CONQUISTAS ================= */
  function rewardName(rw) {
    if (!rw) return '';
    if (rw.relic) return M.RELIC[rw.relic].n;
    if (rw.deck) return M.DECK[rw.deck].n;
    if (rw.back) return M.BACKS.find(b => b.id === rw.back).n;
    return '';
  }
  const rewardIcon = (rw) => rw.relic ? M.RELIC[rw.relic].i : rw.deck ? '🂠' : '🎴';
  const rewardKind = (rw) => rw.relic ? 'relic' : rw.deck ? 'deck' : 'back';
  const rewardId = (rw) => rw.relic || rw.deck || rw.back;

  U.renderAch = (filter = U._achF || 'all') => {
    U._achF = filter;
    M.bg.set('menu');
    const p = P();
    const done = M.ACHS.filter(a => p.ach[a.id]);
    let list = M.ACHS.map(a => ({ a, done: !!p.ach[a.id], pr: U.achProgress(a.id) }));
    if (filter === 'todo') list = list.filter(x => !x.done).sort((x, y) => (y.pr[0] / y.pr[1]) - (x.pr[0] / x.pr[1]));
    if (filter === 'done') list = list.filter(x => x.done);
    $('#screen').innerHTML = `<div class="page2">
      ${pageHead('Conquistas', '🏆', done.length / M.ACHS.length, `Complete desafios para liberar relíquias, baralhos e versos`)}
      <div class="tabs2 seg3">
        <button class="tab2${filter === 'all' ? ' on' : ''}" data-f="all"><span class="tb-n">Todas</span><span class="tb-c">${M.ACHS.length}</span></button>
        <button class="tab2${filter === 'todo' ? ' on' : ''}" data-f="todo"><span class="tb-n">Em progresso</span><span class="tb-c">${M.ACHS.length - done.length}</span></button>
        <button class="tab2${filter === 'done' ? ' on' : ''}" data-f="done"><span class="tb-n">Concluídas</span><span class="tb-c">${done.length}</span></button>
      </div>
      <div class="page-body2"><div class="ach-grid">${list.map(({ a, done, pr }) => {
        const rw = a.unlock;
        return `<button class="ach2${done ? ' done' : ''}" data-ach="${a.id}">
          <div class="a2-ico">${done ? a.i : `<span class="a2-gray">${a.i}</span>`}</div>
          <div class="a2-main"><div class="a2-n">${a.n}${done ? ' <span class="a2-ok">✓</span>' : ''}</div><div class="a2-d">${a.d}</div>
            ${done ? '' : `<div class="a2-prog">${bar(pr[0] / pr[1])}<span>${fmtProg(pr)}</span></div>`}</div>
          ${rw ? `<div class="a2-rw${done ? ' got' : ''}"><span>${rewardIcon(rw)}</span><small>${done ? 'Ganhou' : 'Prêmio'}</small></div>` : `<div class="a2-rw xp"><span>⭐</span><small>Glória</small></div>`}
        </button>`;
      }).join('') || '<div class="empty-msg">Nada aqui ainda — bora jogar!</div>'}</div></div>
    </div>`;
    wireBack();
    $$('[data-f]').forEach(b => b.onclick = () => { click(); U.renderAch(b.dataset.f); });
    $$('[data-ach]').forEach(b => b.onclick = () => {
      const a = M.ACH[b.dataset.ach], done = !!p.ach[a.id], pr = U.achProgress(a.id), rw = a.unlock;
      const rwHtml = rw ? Object.entries(rw).map(([k, v]) => `<button class="rw-chip" data-rk="${k === 'relic' ? 'relic' : k}:${v}">${rewardIcon({ [k]: v })} <b>${rewardName({ [k]: v })}</b><small>${k === 'relic' ? 'Relíquia' : k === 'deck' ? 'Baralho' : 'Verso de carta'} — toque para ver</small></button>`).join('') : '<div class="dt-note">Esta conquista é só pela glória! ⭐</div>';
      const o = U.detail({ visual: `<div class="ach-medal${done ? ' done' : ''}">${a.i}</div>`, color: done ? '#ffc93c' : '#6b6290', title: a.n, body: `${a.d}<div class="dt-rw-title">Recompensa</div>${rwHtml}`,
        status: done ? statusBox('done', `Concluída em ${new Date(p.ach[a.id]).toLocaleDateString('pt-BR')}!`) : statusBox('open', 'Em progresso', pr) });
      o.querySelectorAll('[data-rk]').forEach(c => c.onclick = () => { const [k, id] = c.dataset.rk.split(':'); showItem(k, id); });
    });
  };

  /* ================= TRILHA DE RECOMPENSAS ================= */
  U.renderRewards = () => {
    M.bg.set('menu');
    const p = P(), need = M.xpForLevel(p.level);
    const levels = Object.keys(M.LEVEL_REWARDS).map(Number).sort((a, b) => a - b);
    const maxLv = levels[levels.length - 1];
    $('#screen').innerHTML = `<div class="page2">
      ${pageHead('Recompensas', '🎁', Math.min(1, (p.level - 1) / (maxLv - 1)), 'Ganhe XP em cada jornada para subir de nível e liberar prêmios')}
      <div class="page-body2">
        <div class="lvl-hero"><div class="lh-badge"><small>Nível</small><b>${p.level}</b></div>
          <div class="lh-main"><div class="lh-t">${p.xp} / ${need} XP para o nível ${p.level + 1}</div>${bar(p.xp / need, 'xp')}
          <div class="lh-tip">💡 XP vem de: Reinos alcançados, pares formados, chefes derrotados, maior combo e vitórias.</div></div></div>
        <div class="track">${levels.map((lv, i) => {
          const rw = M.LEVEL_REWARDS[lv], got = p.level >= lv, next = !got && (i === 0 || p.level >= levels[i - 1]);
          return `<button class="tnode${got ? ' got' : ''}${next ? ' next' : ''}" data-lv="${lv}">
            <div class="tn-lv">Nv. ${lv}</div>
            <div class="tn-orb">${got ? rewardIcon(rw) : next ? rewardIcon(rw) : '🔒'}</div>
            <div class="tn-n">${got || next ? rewardName(rw) : '???'}</div>
            <div class="tn-st">${got ? '✓ Liberado' : next ? 'Próximo!' : `Nível ${lv}`}</div>
          </button>`;
        }).join('<div class="tline"></div>')}</div>
      </div>
    </div>`;
    wireBack();
    $$('[data-lv]').forEach(b => b.onclick = () => {
      const lv = +b.dataset.lv, rw = M.LEVEL_REWARDS[lv];
      if (p.level >= lv || b.classList.contains('next')) showItem(rewardKind(rw), rewardId(rw));
      else U.detail({ visual: '<div class="ach-medal">🔒</div>', color: '#6b6290', title: `Prêmio do Nível ${lv}`, body: 'Surpresa! Chegue mais perto para descobrir o que é.', status: statusBox('locked', `Seu nível: ${p.level}`, [p.level, lv]) });
    });
  };

  /* ================= ESTATÍSTICAS ================= */
  U.renderStats = () => {
    M.bg.set('menu');
    const s = P().stats, p = P();
    const h = Math.floor(s.playTime / 3600), mi = Math.floor((s.playTime % 3600) / 60);
    const rec = [
      ['🌀', 'Melhor Reino', s.bestAnte || '—', 'c'], ['🔥', 'Maior combo', s.bestCombo ? 'x' + s.bestCombo : '—', 'f'],
      ['💥', 'Melhor par', M.fmt(s.bestPair), 'r'], ['🏛️', 'Melhor salão', M.fmt(s.bestRound), 'g'],
    ];
    const rows = [['🎮', 'Jornadas', s.runs], ['🏆', 'Vitórias', s.wins], ['🃏', 'Pares formados', M.fmt(s.pairs)], ['👹', 'Chefes derrotados', s.bosses],
      ['📜', 'Pergaminhos usados', s.scrolls], ['🪐', 'Astros usados', s.astros], ['🥃', 'Vidros quebrados', s.glass], ['❌', 'Erros', M.fmt(s.mismatches)],
      ['💰', 'Mais dinheiro', '$' + s.maxMoney], ['⏱️', 'Tempo de jogo', `${h}h ${mi}min`], ['⭐', 'Nível', p.level], ['📅', 'Melhor diário', p.daily.bestAnte ? 'Reino ' + p.daily.bestAnte : '—']];
    const acc = s.pairs + s.mismatches ? Math.round(s.pairs / (s.pairs + s.mismatches) * 100) : 0;
    $('#screen').innerHTML = `<div class="page2">
      ${pageHead('Estatísticas', '📊', Math.min(1, (s.bestAnte || 0) / 8), 'Seus recordes e números de todas as jornadas')}
      <div class="page-body2">
        <div class="rec-grid">${rec.map(([i, n, v, c]) => `<div class="rec rc-${c}"><span class="rec-i">${i}</span><small>RECORDE</small><b>${v}</b><span class="rec-n">${n}</span></div>`).join('')}</div>
        <div class="acc"><div class="acc-ring" style="--k:${acc}"><span>${acc}%</span></div><div><b>Precisão da memória</b><small>Pares certos em relação a todas as tentativas. Quanto mais alto, melhor sua memória!</small></div></div>
        <div class="stat-list">${rows.map(([i, n, v]) => `<div class="srow"><span class="sr-i">${i}</span><span class="sr-n">${n}</span><b>${v}</b></div>`).join('')}</div>
      </div>
    </div>`;
    wireBack();
  };
})();
