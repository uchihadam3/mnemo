/* MNEMO — o tabuleiro: distribuição, viradas, pares, pontuação e chefes */
'use strict';
(function () {
  const B = M.board = { lock: 0, first: null, upPair: null, hideTimer: null, peekMode: false };
  const G = M.game;

  /* ---------------- Face da carta (HTML) ---------------- */
  M.cardFaceHTML = (c, opts = {}) => {
    if (c.mimic) return `<div class="face mimic"><div class="mimic-mouth">${'▼'.repeat(5)}</div><div class="mimic-eyes">● ●</div><div class="face-label">MÍMICO</div></div>`;
    const S = M.SUITS[c.suit], R = M.RANKS[c.rank - 1];
    const ed = c.ed ? ` ed-${c.ed}` : '';
    if (c.enh === 'stone') return `<div class="face stone${ed}"><div class="stone-rune">ᛟ</div><div class="face-label">PEDRA</div>${c.ed ? '<div class="ed-layer"></div>' : ''}</div>`;
    const enh = c.enh ? ` enh-${c.enh}` : '';
    const badge = c.enh ? `<div class="enh-badge enh-b-${c.enh}">${{ bonus: '+30', mult: '+5', gold: '$', glass: '◇', lucky: '☘', steel: '⛨' }[c.enh] || ''}</div>` : '';
    return `<div class="face fz s-${c.suit}${enh}${ed}" style="--sc:${S.c};--sc2:${S.c2};--sd:${S.dark}">
      <div class="face-bg"></div>
      <div class="fz-frame"></div>
      <div class="fz-shine"></div>
      <div class="fz-art"><img src="${M.emoSrc(M.RANK_EMO[c.rank - 1])}" alt="" draggable="false"></div>
      <div class="fz-num">${c.rank}</div>
      <div class="fz-suit">${M.suitIcon(c.suit, 'corner-suit')}</div>
      ${opts.label !== false ? `<div class="face-name">${R.n}</div>` : ''}
      ${badge}
      ${c.enh === 'glass' ? '<div class="glass-cracks"></div>' : ''}
      ${c.ed ? '<div class="ed-layer"></div>' : ''}
    </div>`;
  };
  M.RANK_EMO = ['👁️', '🗝️', '🌀', '💖', '⚡', '⏳', '💎', '💀', '👑'];
  M.cardBackHTML = (style) => `<div class="back back-${style || 'mandala'}"><div class="back-art"></div>${(style || 'mandala') === 'mandala' ? `<img class="back-emb" src="${M.emoSrc('🔮')}" alt="" draggable="false">` : ''}</div>`;
  M.keyOf = (c) => c.mimic ? 'mimic' + c.id : (c.enh === 'stone' ? 'stone' : `${c.suit}|${c.rank}|${c.enh || ''}|${c.ed || ''}`);

  /* ---------------- Início do salão ---------------- */
  B.startRound = async () => {
    const run = M.run;
    const res = G.calcRes();
    const boss = run.round === 2 ? M.BOSS[run.bossId] : null;
    const rs = run.rs = {
      target: G.target(), score: 0, tent: res.tent, visl: res.visl, prev: res.prev,
      combo: 0, cards: [], cols: 4, rows: 3, boardNum: 0,
      pairsRound: 0, pairsBoard: 0, boardMiss: 0, lost: 0, mismatches: 0, missCount: 0, blind: 0,
      suitHist: [], boardSuits: [], lastMatchT: 0, flags: {}, pending: [], ambar: 0,
      startT: Date.now(), drawPile: [], boss: boss ? boss.id : null,
    };
    if (run.pending.persist) { rs.tent += run.pending.persist; run.pending.persist = 0; }
    if (boss) {
      M.save.seen('bosses', boss.id);
      if (boss.id === 'rachada' || boss.id === 'abismo') rs.tent = Math.max(1, rs.tent - 3);
      if (boss.setup) boss.setup(rs, G.rng());
    }
    run.phase = 'round';
    B.first = null; B.upPair = null; B.peekMode = false; B.lock = 0;
    M.ui.show('round');
    const ctx = G.ctxBasic();
    for (const r of run.relics) { const d = M.RELIC[r.id]; if (d.roundStart) { d.roundStart(ctx, r); M.ui.bumpRelic(run.relics.indexOf(r)); } }
    if (boss) { M.audio.play('boss'); M.fx.announce(`${boss.i} ${boss.n}`, 'boss', 1400); await M.sleep(1100); M.ui.coach('boss', '<b>Chefe!</b> Ele muda as regras deste salão. Leia o aviso acima do tabuleiro.'); }
    M.fx.announce(`🎯 META: ${M.fmt(rs.target)}`, 'gold', 1000);
    M.ui.coach('goal', `Objetivo: fazer <b>${M.fmt(rs.target)} pontos</b> formando pares, antes de perder todos os <b class="tent">❤</b>.`, 5000);
    if (run.ante === 1 && run.round === 1) M.ui.coach('peek', 'Dica: <b>👁 Espiar</b> mostra uma carta de graça. Toque no 👁 e depois na carta (ou botão direito).', 5500);
    await M.sleep(700);
    await B.deal();
  };

  /* ---------------- FEBRE: combo alto dobra os pontos ---------------- */
  B.FEVER_AT = 4;
  B.setFever = (on, quiet) => {
    const rs = M.run && M.run.rs;
    if (!rs || !!rs.fever === on) { if (!on) document.body.classList.remove('fever'); return; }
    rs.fever = on;
    document.body.classList.toggle('fever', on);
    if (quiet) return;
    if (on) {
      M.audio.play('fever'); M.audio.mood('fever');
      M.fx.announce('🔥 FEBRE! PONTOS x2 🔥', 'fire', 1200);
      M.fx.burst(innerWidth / 2, innerHeight / 2, { n: 120, colors: ['#ff9f1c', '#ffd166', '#ff4d5e', '#fff'], speed: 1000, size: 5 });
      M.ui.coach('fever', '<b>FEBRE!</b> Enquanto o combo estiver em 4 ou mais, <b>todos os pontos valem o dobro</b>. Não erre!');
    } else { M.audio.play('feverEnd'); M.audio.mood('round'); M.fx.announce('a febre passou...', 'blue', 700); }
  };

  B.resume = async () => {
    const rs = M.run.rs;
    rs.cards.forEach(c => { if (c.st === 'u') c.st = 'h'; });
    B.first = null; B.upPair = null; B.peekMode = false; B.lock = 0;
    M.ui.show('round');
    B.render(true);
    M.ui.updateHUD();
    B.startTimer();
  };

  /* ---------------- Distribuição ---------------- */
  B.layoutFor = (n) => {
    const area = M.ui.boardArea();
    const asp = area.w / Math.max(1, area.h);
    let best = null;
    for (let c = 2; c <= 10; c++) {
      const r = Math.ceil(n / c);
      const empty = c * r - n;
      if (empty >= c) continue;
      const cw = Math.min(area.w / c, (area.h / r) * 0.72);
      const score = cw - empty * 3;
      if (!best || score > best.s) best = { c, r, s: score };
    }
    return best;
  };

  B.deal = async () => {
    const run = M.run, rs = run.rs, rng = G.rng();
    let pairs = M.pairsFor(run.ante);
    if (rs.boss === 'labirinto') pairs += 3;
    if (rs.boss === 'abismo') pairs += 2;
    rs.boardNum++; rs.pairsBoard = 0; rs.boardMiss = 0; rs.boardSuits = [];
    const cards = [];
    let id = 0;
    for (let i = 0; i < pairs; i++) {
      if (!rs.drawPile.length) rs.drawPile = rng.shuffle(run.cards.map(c => c.uid));
      const uid = rs.drawPile.pop();
      const dc = run.cards.find(c => c.uid === uid) || run.cards[0];
      for (let k = 0; k < 2; k++) cards.push({ id: id++, uid: dc.uid, suit: dc.suit, rank: dc.rank, enh: dc.enh, ed: dc.ed, st: 'h', seen: false });
    }
    if (rs.boss === 'mimico') for (let k = 0; k < 2; k++) cards.push({ id: id++, mimic: true, st: 'h', seen: false, suit: 'chama', rank: 1 });
    rng.shuffle(cards);
    const L = B.layoutFor(cards.length);
    rs.cols = L.c; rs.rows = L.r;
    cards.forEach((c, i) => { c.x = i % L.c; c.y = Math.floor(i / L.c); });
    // centraliza a última linha incompleta
    const lastN = cards.length - (L.r - 1) * L.c;
    rs.offsetLast = (L.c - lastN) / 2;
    rs.cards = cards;
    B.first = null; B.upPair = null;
    B.lock++;
    B.render(false);
    M.ui.updateHUD();
    await B.dealAnim();
    const ctx = B.ctxRound();
    for (const r of run.relics) { const d = M.RELIC[r.id]; if (d.boardStart) { d.boardStart(ctx, r); M.ui.bumpRelic(run.relics.indexOf(r)); } }
    await B.preview();
    B.lock = Math.max(0, B.lock - 1);
    M.ui.coach('flip', 'Toque numa carta para virar. Depois ache a <b>igual</b>: mesmo símbolo <b>e</b> mesma cor.', 6000);
    G.save();
    B.startTimer();
  };

  B.dealAnim = async () => {
    const els = M.$$('#board .slot');
    els.forEach((el, i) => {
      setTimeout(() => { el.classList.add('dealt'); M.audio.play('deal', i); }, i * 35 / (M.speed || 1));
    });
    await M.sleep(els.length * 35 + 450);
  };

  B.preview = async () => {
    const rs = M.run.rs;
    let t = rs.prev;
    if (rs.boss === 'nevoa' || rs.boss === 'sombra') { t = 0; M.fx.announce('Sem pré-visualização!', 'boss', 900); }
    if (t <= 0) return;
    const hidden = rs.cards.filter(c => c.st === 'h' && !c.mimic);
    hidden.forEach(c => { c.seen = true; });
    const order = [...hidden].sort((a, b) => (a.x + a.y) - (b.x + b.y));
    order.forEach((c, i) => setTimeout(() => { B.setUp(c, true); }, i * 18));
    M.audio.play('peek');
    const bar = M.ui.previewBar(t);
    M.ui.coach('preview', '<b>Memorize!</b> As cartas vão virar em instantes. Guarde onde estão os pares.', Math.max(2500, t * 1000 + 600));
    B.previewSkip = false;
    const start = performance.now();
    while ((performance.now() - start) < t * 1000 + order.length * 18 && !B.previewSkip) await M.sleepRaw(30);
    bar.remove();
    order.forEach((c, i) => setTimeout(() => { if (c.st === 'h') B.setUp(c, false); }, i * 14));
    M.audio.play('flipDown');
    await M.sleepRaw(order.length * 14 + 300);
  };

  /* ---------------- Render ---------------- */
  B.render = (instant) => {
    const rs = M.run.rs, el = M.$('#board');
    if (!el) return;
    el.classList.toggle('gray', rs.boss === 'cinzento' || rs.boss === 'sombra');
    const back = M.profile.settings.back;
    el.innerHTML = rs.cards.map(c => `
      <div class="slot${instant ? ' dealt' : ''}${c.st === 'm' ? ' gone' : ''}" data-id="${c.id}">
        <div class="card${c.mark ? ' marked' : ''}">
          <div class="card-inner">
            ${M.cardBackHTML(back)}
            ${M.cardFaceHTML(c)}
          </div>
          <div class="card-shine"></div>
        </div>
      </div>`).join('');
    B.layout();
  };

  B.layout = () => {
    const rs = M.run && M.run.rs, el = M.$('#board');
    if (!rs || !el) return;
    const area = M.ui.boardArea();
    const portrait = area.h > area.w * 1.15 && rs.cols > rs.rows;
    const dc = portrait ? rs.rows : rs.cols, dr = portrait ? rs.cols : rs.rows;
    const gap = Math.max(6, Math.min(14, area.w * 0.012));
    const cw = Math.floor(Math.min((area.w - gap * (dc - 1)) / dc, ((area.h - gap * (dr - 1)) / dr) * 0.72));
    const ch = Math.floor(cw / 0.72);
    const W = dc * cw + (dc - 1) * gap, H = dr * ch + (dr - 1) * gap;
    el.style.width = W + 'px'; el.style.height = H + 'px';
    el.style.setProperty('--cw', cw + 'px'); el.style.setProperty('--ch', ch + 'px');
    const lastRowY = rs.rows - 1;
    const lastCount = rs.cards.filter(c => c.y === lastRowY).length;
    for (const c of rs.cards) {
      const s = el.querySelector(`.slot[data-id="${c.id}"]`);
      if (!s) continue;
      let x = c.x, y = c.y;
      let off = 0;
      if (y === lastRowY && lastCount < rs.cols) off = (rs.cols - lastCount) / 2;
      x += off;
      if (portrait) [x, y] = [y, x];
      s.style.setProperty('--tx', (x * (cw + gap)) + 'px');
      s.style.setProperty('--ty', (y * (ch + gap)) + 'px');
    }
  };

  B.slotEl = (c) => M.$(`#board .slot[data-id="${c.id}"]`);
  B.setUp = (c, up) => {
    const s = B.slotEl(c); if (!s) return;
    s.classList.toggle('up', up);
  };

  /* ---------------- Interação ---------------- */
  B.onClick = (id, alt = false) => {
    const rs = M.run && M.run.rs;
    if (!rs || B.lock) return;
    const c = rs.cards.find(c => c.id === id);
    if (!c || c.st !== 'h') return;
    if (B.upPair) B.hideUpPair();
    if (B.peekMode || alt) { B.peek(c); return; }
    B.flip(c);
  };

  B.hideUpPair = () => {
    if (!B.upPair) return;
    clearTimeout(B.hideTimer);
    for (const c of B.upPair) { if (c.st === 'u') { c.st = 'h'; B.setUp(c, false); } B.slotEl(c)?.classList.remove('wrong'); }
    B.upPair = null;
    M.audio.play('flipDown');
  };

  B.flip = async (c) => {
    const rs = M.run.rs;
    c.wasSeen = c.seen;
    c.seen = true; c.st = 'u';
    B.setUp(c, true);
    M.audio.play('flip');
    if (c.mimic) { await B.mimicBite(c); return; }
    if (!B.first) {
      B.first = c;
      if (G.flag('bussola') && B.chance(1 / 3)) {
        const partner = rs.cards.find(o => o !== c && o.st === 'h' && M.keyOf(o) === M.keyOf(c));
        if (partner) { const s = B.slotEl(partner); s.classList.add('compass'); setTimeout(() => s.classList.remove('compass'), 700); M.ui.bumpRelicId('bussola'); }
      }
      return;
    }
    const a = B.first, b = c; B.first = null;
    B.lock++;
    await M.sleep(260);
    if (M.keyOf(a) === M.keyOf(b)) await B.match(a, b);
    else await B.mismatch(a, b);
    B.lock = Math.max(0, B.lock - 1);
    B.turnStart();
    if (M.run && M.run.rs) G.save();
  };

  B.chance = (p) => G.rng().next() < p * (G.flag('dado') ? 2 : 1);

  B.peek = (c) => {
    const rs = M.run.rs;
    if (rs.visl <= 0) { M.fx.floatEl(B.slotEl(c), 'Sem Vislumbres', 'bad'); B.setPeek(false); return; }
    if (rs.boss === 'fantasma') { M.fx.floatEl(B.slotEl(c), 'Bloqueado!', 'bad'); B.setPeek(false); return; }
    rs.visl--;
    const list = [c];
    if (G.flag('lupa')) list.push(...B.neighbors(c));
    B.reveal(list, 1100);
    M.audio.play('peek');
    B.setPeek(false);
    M.ui.updateHUD();
    G.save();
  };
  B.setPeek = (on) => { B.peekMode = on; M.$('#stage')?.classList.toggle('peeking', on); M.ui.updateHUD(); };

  B.neighbors = (c) => M.run.rs.cards.filter(o => o.st === 'h' && Math.abs(o.x - c.x) + Math.abs(o.y - c.y) === 1);
  B.reveal = (list, ms) => {
    for (const o of list) {
      if (o.st !== 'h') continue;
      o.seen = true; B.setUp(o, true);
      B.slotEl(o)?.classList.add('peeked');
      setTimeout(() => { if (o.st === 'h') B.setUp(o, false); B.slotEl(o)?.classList.remove('peeked'); }, ms);
    }
  };

  /* ---------------- Mímico ---------------- */
  B.mimicBite = async (c) => {
    const rs = M.run.rs;
    B.lock++;
    const s = B.slotEl(c);
    s.classList.add('wrong');
    M.audio.play('mismatch'); M.fx.shake(10, 350);
    M.fx.floatEl(s, 'NHAC! -1 ❤', 'bad');
    rs.tent--; rs.lost++; rs.combo = 0; rs.mismatches++; M.run.stats.mismatches++;
    M.bg.tInt = 0; B.setFever(false);
    M.ui.updateHUD();
    await M.sleep(700);
    c.st = 'm'; s.classList.add('gone');
    if (B.first) { const f = B.first; B.first = null; f.st = 'h'; B.setUp(f, false); }
    B.lock = Math.max(0, B.lock - 1);
    if (rs.tent <= 0) { await B.checkLose(); return; }
    await B.checkClear();
    G.save();
  };

  /* ---------------- Par! ---------------- */
  B.match = async (a, b) => {
    const run = M.run, rs = run.rs;
    const kind = b.wasSeen ? 'memory' : (a.wasSeen ? 'luck' : 'blind');
    rs.combo = rs.combo === 0 && G.hasV('corrente') ? 2 : rs.combo + 1;
    if (kind === 'blind') { rs.blind++; if (rs.blind >= 3) M.save.achieve('sortegrande'); }
    run.stats.bestCombo = Math.max(run.stats.bestCombo, rs.combo);
    if (rs.combo >= 5) M.save.achieve('combo5');
    if (rs.combo >= 8) M.save.achieve('combo8');
    if (rs.combo >= 12) M.save.achieve('combo12');
    M.save.achieve('par1');
    if (rs.combo >= B.FEVER_AT) B.setFever(true);
    M.ui.coach('match', '<b>Par!</b> 🎉 Pares seguidos sobem o <b>🔥 Combo</b>, que multiplica seus pontos.');

    // efeitos "próximo par" que transformam a carta antes de pontuar
    const transform = { midas: ['enh', 'gold'], vidro: ['enh', 'glass'], fichas: ['enh', 'bonus'], furia: ['enh', 'mult'], amuleto: ['enh', 'lucky'], aco: ['enh', 'steel'], pedra: ['enh', 'stone'] };
    const after = [];
    let foco = false;
    for (const p of rs.pending) {
      if (transform[p]) B.mutateDeck([a, b], transform[p][1], null);
      else if (p === 'edicao') B.mutateDeck([a, b], null, G.rng().pick(['foil', 'holo', 'poly']));
      else if (p === 'foco') foco = true;
      else after.push(p);
    }
    rs.pending = [];
    if (a.enh !== b.enh || a.ed !== b.ed) { b.enh = a.enh; b.ed = a.ed; }

    const sa = B.slotEl(a), sb = B.slotEl(b);
    [sa, sb].forEach(s => { s.classList.add('matched'); s.querySelector('.face').outerHTML = M.cardFaceHTML(a); });
    const S = M.SUITS[a.suit];
    const col = a.enh === 'stone' ? '#bbb' : S.c;
    for (const s of [sa, sb]) { const [x, y] = M.fx.at(s); M.fx.burst(x, y, { n: 18 + rs.combo * 4, colors: [col, S.c2, '#fff'], speed: 300 + rs.combo * 40, size: 3.5 }); M.fx.ring(x, y, col, 90 + rs.combo * 8); }
    M.audio.play('match', rs.combo);
    M.bg.tInt = Math.min(1, rs.combo / 7);

    const kindTxt = { memory: 'Lembrança', luck: 'Sorte', blind: 'Sorte Cega!' }[kind];
    M.ui.showPairInfo(a, kindTxt, rs.combo);
    if (rs.combo >= 3) M.ui.comboPop(rs.combo);

    const res = B.computeScore(a, b, kind, foco);
    await M.ui.animateScore(res, sa, sb);

    rs.score += res.total;
    run.stats.bestPair = Math.max(run.stats.bestPair, res.total);
    if (res.total >= 5000) M.save.achieve('explosao');
    a.st = b.st = 'm';
    rs.pairsRound++; rs.pairsBoard++; run.stats.pairs++;
    rs.suitHist.push(a.enh === 'stone' ? 'pedra' : a.suit);
    if (!rs.boardSuits.includes(a.suit)) rs.boardSuits.push(a.suit);
    rs.lastMatchT = Date.now();

    // vidro
    if (a.enh === 'glass' && B.chance(0.25)) {
      run.cards = run.cards.filter(c => c.uid !== a.uid);
      M.profile.stats.glass++; if (M.profile.stats.glass >= 3) M.save.achieve('vidraceiro');
      M.audio.play('shatter');
      for (const s of [sa, sb]) { const [x, y] = M.fx.at(s); M.fx.burst(x, y, { n: 14, shape: 'shard', speed: 350, grav: 900, size: 9, life: 1.2 }); }
      M.fx.floatEl(sa, 'Quebrou!', 'bad');
    }
    for (const p of after) {
      if (p === 'exilio') { run.cards = run.cards.filter(c => c.uid !== a.uid); M.fx.floatEl(sa, 'Exilada!', 'hl'); }
      if (p === 'duplicar') { const dc = run.cards.find(c => c.uid === a.uid); if (dc) run.cards.push({ ...dc, uid: M.uid() }); M.fx.floatEl(sa, 'Duplicada!', 'hl'); }
    }
    if (run.cards.length === 0) run.cards.push({ uid: M.uid(), suit: 'chama', rank: 1, enh: null, ed: null });

    const tgt = M.ui.hAnchor('score');
    if (tgt) for (const sl of [sa, sb]) {
      const r1 = sl.getBoundingClientRect(), r2 = tgt.getBoundingClientRect();
      sl.style.setProperty('--fx', (r2.left + r2.width / 2 - (r1.left + r1.width / 2)) + 'px');
      sl.style.setProperty('--fy', (r2.top + r2.height / 2 - (r1.top + r1.height / 2)) + 'px');
    }
    sa.classList.add('gone', 'fly'); sb.classList.add('gone', 'fly');
    M.ui.updateHUD();

    if (G.flag('ima')) { const nb = [...new Set([...B.neighbors(a), ...B.neighbors(b)])]; if (nb.length) { B.reveal(nb, 800); M.ui.bumpRelicId('ima'); } }

    if (rs.score >= rs.target) { await B.win(); return; }
    await B.checkClear();
  };

  B.mutateDeck = (cards, enh, ed) => {
    const run = M.run;
    const uids = [...new Set(cards.map(c => c.uid))];
    for (const u of uids) { const dc = run.cards.find(c => c.uid === u); if (dc) { if (enh) dc.enh = enh; if (ed) dc.ed = ed; } }
    for (const c of cards) { if (enh) c.enh = enh; if (ed) c.ed = ed; }
  };

  /* ---------------- Cálculo da pontuação ---------------- */
  B.computeScore = (a, b, kind, foco) => {
    const run = M.run, rs = run.rs;
    const ev = [];
    let chips = 0, mult = 0, money = 0;
    const pair = { suit: a.suit, rank: a.rank, enh: a.enh, ed: a.ed };
    const push = (src, type, v, extra = {}) => ev.push({ src, type, v, chips, mult, ...extra });
    if (pair.enh === 'stone') { chips = 60; mult = 1; }
    else { const sb = M.suitBase(run.suitLv[pair.suit]); chips = sb.chips + 2 * M.RANKS[pair.rank - 1].chips; mult = sb.mult; }
    if (rs.boss === 'eclipse' && rs.flags.eclipse === pair.suit && pair.enh !== 'stone') {
      chips = 0; mult = 0; push('base', 'msg', 0, { text: 'Eclipsado!' });
      return { ev, total: 0, money: 0, reps: 0, chips, mult };
    }
    push('base', 'base', 0);
    const step = G.flag('combo2') ? 2 : 1;
    if (rs.combo > 1 && rs.boss !== 'vazio') { mult += (rs.combo - 1) * step; push('combo', 'mult', (rs.combo - 1) * step); }
    if (kind === 'blind') { const x = G.flag('venda') ? 4 : 2; mult *= x; push('blind', 'xmult', x, { text: 'Sorte Cega' }); if (G.flag('venda')) M.ui.bumpRelicId('venda'); }
    if (rs.fever) { mult *= 2; push('fever', 'xmult', 2, { text: 'Febre' }); }
    // encantamentos
    const e = pair.enh;
    if (e === 'bonus') { chips += 30; push('card', 'chips', 30); }
    if (e === 'mult') { mult += 5; push('card', 'mult', 5); }
    if (e === 'glass') { mult *= 2; push('card', 'xmult', 2); }
    if (e === 'steel') { mult *= 1.5; push('card', 'xmult', 1.5); }
    if (e === 'gold') { money += 2; push('card', 'money', 2); }
    if (e === 'lucky') {
      if (B.chance(1 / 5)) { mult += 20; push('card', 'mult', 20, { text: 'Sorte!' }); }
      if (B.chance(1 / 15)) { money += 20; push('card', 'money', 20); }
    }
    if (pair.ed === 'foil') { chips += 50; push('card', 'chips', 50); }
    if (pair.ed === 'holo') { mult += 10; push('card', 'mult', 10); }
    if (pair.ed === 'poly') { mult *= 1.5; push('card', 'xmult', 1.5); }
    if (foco) { mult *= 3; push('scroll', 'xmult', 3, { text: 'Foco' }); }
    // relíquias
    run.relics.forEach((r, i) => {
      const d = M.RELIC[r.id];
      if (d.match) {
        const ctx = {
          run, rs, pair, cards: [a, b], kind, combo: rs.combo, now: Date.now(),
          chance: B.chance,
          addChips: (n) => { chips += n; push('relic', 'chips', n, { i }); },
          addMult: (n) => { mult += n; push('relic', 'mult', n, { i }); },
          xMult: (n) => { if (n === 1) return; mult *= n; push('relic', 'xmult', n, { i }); },
          money: (n) => { money += n; push('relic', 'money', n, { i }); },
          msg: (t) => push('relic', 'msg', 0, { i, text: t }),
          stripEnh: () => { B.mutateDeck([a, b], null, null); const u = [a.uid, b.uid]; run.cards.forEach(c => { if (u.includes(c.uid)) c.enh = null; }); a.enh = b.enh = null; },
        };
        d.match(ctx, r);
      }
      if (r.ed === 'foil') { chips += 50; push('relic', 'chips', 50, { i }); }
      if (r.ed === 'holo') { mult += 10; push('relic', 'mult', 10, { i }); }
      if (r.ed === 'poly') { mult *= 1.5; push('relic', 'xmult', 1.5, { i }); }
    });
    let reps = 0;
    if (G.flag('espelho') && B.chance(0.25)) { reps++; M.ui.bumpRelicId('espelho'); }
    if (G.flag('hidra')) reps += Math.floor(rs.combo / 4);
    const one = Math.floor(chips * mult);
    return { ev, total: one * (1 + reps), one, money, reps, chips, mult };
  };

  /* ---------------- Erro ---------------- */
  B.mismatch = async (a, b) => {
    const run = M.run, rs = run.rs;
    const sa = B.slotEl(a), sb = B.slotEl(b);
    sa.classList.add('wrong'); sb.classList.add('wrong');
    M.audio.play('mismatch');
    rs.mismatches++; rs.boardMiss++; rs.missCount++; run.stats.mismatches++;
    let protect = false, save = false;
    if (rs.ambar) { rs.ambar--; protect = true; M.fx.floatEl(sb, 'Âmbar!', 'hl'); }
    if (!protect) {
      const ctx = {
        run, rs, chance: B.chance,
        protect: (t) => { protect = true; M.fx.floatEl(sb, t, 'hl'); },
        saveTent: (t) => { save = true; M.fx.floatEl(sb, t, 'hl'); },
      };
      for (const r of run.relics) { const d = M.RELIC[r.id]; if (d.mismatch && !protect) { const before = protect || save; d.mismatch(ctx, r); if ((protect || save) && !before) M.ui.bumpRelic(run.relics.indexOf(r)); } }
    }
    if (!protect && !save) {
      rs.tent--; rs.lost++;
      M.fx.shake(7, 280); M.vibrate(60);
      M.fx.floatEl(sb, '-1 ❤', 'bad');
      if (rs.boss === 'ladrao' && run.money > 0) { G.addMoney(-1); M.fx.floatEl(sa, '-$1', 'bad'); }
    }
    if (!protect) {
      if (G.flag('ouroboros')) rs.combo = Math.floor(rs.combo / 2);
      else rs.combo = 0;
    }
    M.bg.tInt = Math.min(1, rs.combo / 7);
    if (rs.combo < B.FEVER_AT) B.setFever(false);
    M.ui.updateHUD();
    M.ui.coach('miss', 'Errou: <b class="tent">-1 ❤</b>. Lembre onde essas cartas estão para formar os pares depois!');
    B.upPair = [a, b];
    const delay = rs.boss === 'fantasma' ? 280 : (M.profile.settings.fastHide ? 520 : 950);
    B.hideTimer = setTimeout(() => B.hideUpPair(), delay / (M.speed || 1));
    if (rs.tent <= 0) { await M.sleep(delay); B.hideUpPair(); await B.checkLose(); return; }
    // efeitos de chefe
    if (rs.boss === 'embaralhador') { await M.sleep(delay + 50); B.hideUpPair(); B.swapRandom(1); }
    if (rs.boss === 'espelho' && rs.missCount % 3 === 0) { await M.sleep(delay + 50); B.hideUpPair(); B.mirror(); }
    if (rs.boss === 'lete' && rs.missCount % 4 === 0) { await M.sleep(delay + 50); B.hideUpPair(); B.shuffleHidden(); }
  };

  B.swapRandom = (n) => {
    const rs = M.run.rs, rng = G.rng();
    const hid = rs.cards.filter(c => c.st === 'h');
    if (hid.length < 2) return;
    for (let k = 0; k < n; k++) {
      const a = rng.pick(hid); let b = rng.pick(hid); let g = 0;
      while (b === a && g++ < 10) b = rng.pick(hid);
      [a.x, b.x] = [b.x, a.x]; [a.y, b.y] = [b.y, a.y];
      B.slotEl(a)?.classList.add('swapping'); B.slotEl(b)?.classList.add('swapping');
      setTimeout(() => { B.slotEl(a)?.classList.remove('swapping'); B.slotEl(b)?.classList.remove('swapping'); }, 700);
    }
    M.audio.play('swap');
    B.layout();
  };
  B.mirror = () => {
    const rs = M.run.rs;
    const lastY = rs.rows - 1;
    rs.cards.forEach(c => { c.x = rs.cols - 1 - c.x; });
    // ajusta última linha (pode ficar com buracos à esquerda)
    const last = rs.cards.filter(c => c.y === lastY).sort((p, q) => p.x - q.x);
    last.forEach((c, i) => { c.x = i; });
    M.fx.announce('🪩 Espelhado!', 'boss', 700);
    M.audio.play('swap');
    B.layout();
  };
  B.shuffleHidden = () => {
    const rs = M.run.rs, rng = G.rng();
    const hid = rs.cards.filter(c => c.st === 'h');
    const pos = rng.shuffle(hid.map(c => [c.x, c.y]));
    hid.forEach((c, i) => { [c.x, c.y] = pos[i]; });
    M.fx.announce('🌊 O Lete apaga suas lembranças!', 'boss', 1100);
    M.audio.play('swap');
    B.layout();
  };

  /* ---------------- Fim de tabuleiro / salão ---------------- */
  B.checkClear = async () => {
    const run = M.run, rs = run.rs;
    if (!rs) return;
    if (rs.cards.some(c => c.st !== 'm' && !c.mimic)) return;
    B.lock++;
    M.audio.play('clear');
    M.fx.announce('TABULEIRO LIMPO!', 'gold', 1000);
    M.fx.confetti(60);
    rs.tent += 2;
    M.fx.float(innerWidth / 2, innerHeight / 2 + 60, '+2 ❤', 'tent big');
    if (rs.boardMiss === 0) M.save.achieve('perfeito');
    const ctx = B.ctxRound();
    for (const r of run.relics) { const d = M.RELIC[r.id]; if (d.boardClear) { d.boardClear(ctx, r); M.ui.bumpRelic(run.relics.indexOf(r)); } }
    M.ui.updateHUD();
    await M.sleep(1100);
    B.lock = Math.max(0, B.lock - 1);
    await B.deal();
  };

  B.ctxRound = () => {
    const run = M.run, rs = run.rs;
    const base = G.ctxBasic();
    return Object.assign(base, {
      addTent: (n) => { rs.tent += n; M.ui.updateHUD(); },
      msg: (t) => M.fx.announce(t, 'blue', 600),
      markPair: () => {
        const hid = rs.cards.filter(c => c.st === 'h' && !c.mimic && !c.mark);
        const rng = G.rng();
        for (let g = 0; g < 20 && hid.length; g++) {
          const c = rng.pick(hid);
          const p = hid.find(o => o !== c && M.keyOf(o) === M.keyOf(c));
          if (p) { c.mark = p.mark = true; B.slotEl(c).querySelector('.card').classList.add('marked'); B.slotEl(p).querySelector('.card').classList.add('marked'); return true; }
        }
        return false;
      },
    });
  };

  B.win = async () => {
    const run = M.run, rs = run.rs;
    B.stopTimer();
    B.lock++;
    M.audio.play('win');
    M.fx.announce('SALÃO VENCIDO!', 'win', 1300);
    M.fx.confetti(120);
    M.bg.tInt = 0; B.setFever(false, true); M.audio.mood('normal');
    // revela o resto do tabuleiro
    rs.cards.filter(c => c.st === 'h').forEach((c, i) => setTimeout(() => B.setUp(c, true), i * 30));
    await M.sleep(1600);
    B.lock = 0;
    G.roundWon();
    M.ui.show('cashout');
  };

  B.checkLose = async () => {
    const run = M.run, rs = run.rs;
    if (rs.tent > 0) return;
    const fi = run.relics.findIndex(r => r.id === 'fenix');
    if (fi >= 0) {
      run.relics.splice(fi, 1);
      rs.tent = 4;
      M.fx.announce('🪶 A FÊNIX RENASCE!', 'gold', 1300);
      M.audio.play('unlock');
      M.fx.burst(innerWidth / 2, innerHeight / 2, { n: 120, colors: ['#ff9f1c', '#ffd166', '#ff5a3c'], speed: 700, size: 5 });
      M.ui.renderRelics(); M.ui.updateHUD();
      G.save();
      return;
    }
    B.stopTimer();
    B.lock++;
    B.setFever(false, true); M.audio.music(null);
    M.audio.play('lose');
    M.bg.set('lose');
    M.fx.announce('SEM TENTATIVAS...', 'bad', 1500);
    rs.cards.filter(c => c.st === 'h').forEach((c, i) => setTimeout(() => B.setUp(c, true), i * 30));
    await M.sleep(2000);
    B.lock = 0;
    run.phase = 'over';
    M.ui.show('gameover');
  };

  /* ---------------- Chefe: Relógio ---------------- */
  B.startTimer = () => {
    B.stopTimer();
    const rs = M.run && M.run.rs;
    if (!rs || rs.boss !== 'relogio') return;
    B.turnStart();
    B.timer = setInterval(async () => {
      const rs = M.run && M.run.rs;
      if (!rs) return B.stopTimer();
      if (B.lock || document.hidden || M.ui.overlayOpen()) { B.deadline += 100; return; }
      const left = B.deadline - Date.now();
      M.ui.timerBar(Math.max(0, left / 8000));
      if (left <= 0) {
        B.lock++;
        if (B.first) { const f = B.first; B.first = null; f.st = 'h'; B.setUp(f, false); }
        rs.tent--; rs.lost++; rs.combo = 0; B.setFever(false);
        M.audio.play('mismatch'); M.fx.shake(8, 300);
        M.fx.announce('⏰ Tempo esgotado!', 'bad', 700);
        M.ui.updateHUD();
        B.turnStart();
        B.lock = Math.max(0, B.lock - 1);
        if (rs.tent <= 0) await B.checkLose();
      }
    }, 100);
  };
  B.turnStart = () => { B.deadline = Date.now() + 8000; };
  B.stopTimer = () => { clearInterval(B.timer); B.timer = null; M.ui.timerBar(-1); };

  /* ---------------- Pergaminhos ---------------- */
  B.useScroll = async (i) => {
    const run = M.run, s = run.scrolls[i];
    if (!s) return false;
    const d = M.SCROLL[s.id];
    const rs = run.rs;
    const inRound = run.phase === 'round' && rs && !B.lock;
    if (d.when === 'round' && !inRound) return 'round';
    const G_ = M.game;
    switch (s.id) {
      case 'revelar': { const h = G_.rng().shuffle(rs.cards.filter(c => c.st === 'h')).slice(0, 4); B.reveal(h, 1500); break; }
      case 'clarividencia': if (!B.ctxRound().markPair()) return 'none'; break;
      case 'raiox': B.reveal(rs.cards.filter(c => c.st === 'h'), 1000); break;
      case 'elixir': rs.tent += 2; break;
      case 'olhar': rs.visl += 2; break;
      case 'ambar': rs.ambar++; break;
      case 'ganancia': G_.addMoney(Math.min(20, Math.max(0, run.money))); break;
      case 'juizo': {
        if (run.relics.length >= G_.relicSlots()) return 'full';
        const r = G_.rollRelic(G_.rollRarity(G_.rng(), false)); run.relics.push(r); M.save.seen('relics', r.id);
        M.fx.announce(`${M.RELIC[r.id].i} ${M.RELIC[r.id].n}`, 'gold', 1000); break;
      }
      default:
        if (d.next) { rs.pending.push(s.id); M.fx.announce(d.n + ': próximo par!', 'blue', 800); }
    }
    run.scrolls.splice(i, 1);
    run.stats.scrolls++; M.profile.stats.scrolls++;
    if (M.profile.stats.scrolls >= 10) M.save.achieve('arcanista');
    M.save.saveProfile();
    M.audio.play('use');
    M.ui.renderConsumables(); M.ui.renderRelics(); M.ui.updateHUD();
    G_.save();
    return true;
  };
})();
