/* MNEMO — lógica da jornada: criação, salões, loja, pacotes, itens */
'use strict';
(function () {
  const G = M.game = {};

  G.rng = () => M.run._rng;
  G.save = () => { if (M.run) { M.run.rng = M.run._rng.s; M.save.saveRun(); } };

  M.relicCost = (r) => {
    const d = M.RELIC[r.id];
    return d.c + ({ foil: 2, holo: 3, poly: 5, neg: 5 }[r.ed] || 0);
  };
  M.sellValue = (r) => Math.max(1, Math.floor(M.relicCost(r) / 2) + (r.data && r.data.bonus || 0));
  G.has = (id) => M.run && M.run.relics.some(r => r.id === id);
  G.flag = (f) => M.run && M.run.relics.some(r => M.RELIC[r.id].flag === f);
  G.relicSlots = () => {
    const run = M.run;
    return run.slots + run.relics.filter(r => r.ed === 'neg').length;
  };
  G.hasV = (id) => M.run.vouchers.includes(id);

  /* ---------------- Nova jornada ---------------- */
  G.newRun = ({ deck = 'classico', stake = 1, daily = false } = {}) => {
    const seed = daily ? M.hashStr('mnemo-daily-' + M.todayKey()) : (Math.random() * 2 ** 32) >>> 0;
    const rng = new M.RNG(seed);
    const D = M.DECK[deck];
    const run = {
      v: 1, seed, rng: seed, daily, deck, stake,
      ante: 1, round: 0, phase: 'select',
      money: 4 + (D.money || 0), relics: [], scrolls: [], cards: [],
      suitLv: { chama: D.suitLv || 1, mare: D.suitLv || 1, folha: D.suitLv || 1, astro: D.suitLv || 1 },
      vouchers: [...(D.vouchers || [])], slots: 5 + (D.slots || 0), scrollSlots: 2,
      bossId: null, bossUsed: [], tags: [], pending: {},
      shop: null, voucherOffer: null, voucherAnte: 0,
      rs: null, endless: false, won: false,
      stats: { pairs: 0, bestCombo: 0, bestPair: 0, scrolls: 0, astros: 0, bosses: 0, mismatches: 0, rounds: 0, bestRound: 0, startT: Date.now(), maxMoney: 0 },
    };
    Object.defineProperty(run, '_rng', { value: rng, enumerable: false, writable: true });
    M.run = run;
    for (const c of D.cards(rng)) run.cards.push({ uid: M.uid(), suit: c.suit, rank: c.rank, enh: c.enh || null, ed: null });
    for (const id of (D.relics || [])) run.relics.push({ id, ed: null, data: {} });
    if (D.randomRelic) { const pool = M.RELICS.filter(r => M.save.isRelicUnlocked(r.id) && r.r <= 2); run.relics.push({ id: rng.pick(pool).id, ed: null, data: {} }); }
    for (let i = 0; i < (D.scrolls || 0); i++) run.scrolls.push({ id: G.rollScrollId() });
    G.setupAnte();
    M.profile.stats.runs++;
    M.save.saveProfile();
    if (M.profile.stats.runs >= 10) M.save.achieve('veterano');
    G.save();
  };

  G.restore = (data) => {
    const run = data;
    Object.defineProperty(run, '_rng', { value: new M.RNG(run.rng), enumerable: false, writable: true });
    M.run = run;
  };

  G.setupAnte = () => {
    const run = M.run, rng = G.rng();
    const isFinal = run.ante % 8 === 0;
    let pool = isFinal ? M.FINAL_BOSSES : M.BOSSES.filter(b => b.min <= run.ante && !run.bossUsed.includes(b.id));
    if (!pool.length) pool = M.BOSSES;
    const b = rng.pick(pool);
    run.bossId = b.id; run.bossUsed.push(b.id);
    run.tags = [rng.pick(M.TAGS).id, rng.pick(M.TAGS).id];
  };

  G.target = (round = M.run.round) => M.targetFor(M.run.ante, round, M.run.stake, M.run.bossId);
  G.reward = (round = M.run.round) => (M.run.stake >= 2 && round === 0) ? 0 : [3, 4, 5][round];

  /* ---------------- Recursos por salão ---------------- */
  G.calcRes = () => {
    const run = M.run, D = M.DECK[run.deck];
    let tent = 8 + (D.tent || 0), visl = 2 + (D.visl || 0), prev = 1.5 + (D.preview || 0);
    for (const r of run.relics) { const m = M.RELIC[r.id].mod; if (m) { tent += m.tent || 0; visl += m.visl || 0; prev += m.preview || 0; } }
    if (G.hasV('persistencia')) tent++;
    if (G.hasV('olhar')) visl++;
    if (G.hasV('lembranca')) prev += 0.75;
    if (run.stake >= 4) tent--;
    if (run.stake >= 5) prev *= 0.5;
    return { tent: Math.max(1, tent), visl: Math.max(0, visl), prev: Math.max(0, prev) };
  };

  /* ---------------- Seleção de salão ---------------- */
  G.skip = async () => {
    const run = M.run;
    if (run.round >= 2) return;
    const tag = run.tags[run.round];
    M.save.seen('tags', tag);
    run.round++;
    M.audio.play('use');
    await G.applyTag(tag);
    G.save();
    M.ui.show('select');
  };
  G.applyTag = async (tag) => {
    const run = M.run;
    M.fx.announce(M.TAG[tag].n, 'gold', 900);
    switch (tag) {
      case 'ouro': G.addMoney(8); break;
      case 'juros': G.addMoney(Math.min(15, Math.max(0, run.money))); break;
      case 'rara': run.pending.rara = 1; break;
      case 'mercador': run.pending.mercador = 1; break;
      case 'persist': run.pending.persist = (run.pending.persist || 0) + 3; break;
      case 'arcana': await M.ui.openPack(G.makePack('arcano'), true); break;
      case 'celeste': await M.ui.openPack(G.makePack('celeste'), true); break;
      case 'reliquia': await M.ui.openPack(G.makePack('reliq'), true); break;
    }
  };

  G.addMoney = (n) => {
    const run = M.run;
    run.money += n;
    if (run.money > run.stats.maxMoney) run.stats.maxMoney = run.money;
    if (run.money >= 40) M.save.achieve('rico');
    M.ui && M.ui.updateMoney(n);
  };

  /* ---------------- Fim de salão ---------------- */
  G.roundWon = () => {
    const run = M.run, rs = run.rs;
    const isBoss = run.round === 2;
    const lines = [];
    const base = G.reward();
    lines.push({ t: isBoss ? 'Chefe derrotado' : (run.round === 0 ? 'Salão Pequeno' : 'Salão Grande'), v: base });
    if (rs.tent > 0) lines.push({ t: `Vidas restantes (${rs.tent} ❤)`, v: rs.tent });
    const cap = 5 + (G.hasV('tesouro') ? 5 : 0);
    const interest = Math.min(cap, Math.floor(Math.max(0, run.money) / 5));
    if (interest > 0) lines.push({ t: `Juros ($1 a cada $5, máx. $${cap})`, v: interest });
    const ctx = G.ctxBasic(); ctx.isBoss = isBoss;
    for (const r of [...run.relics]) {
      const d = M.RELIC[r.id];
      if (d.roundEnd) { const v = d.roundEnd(ctx, r) || 0; if (v) lines.push({ t: d.n, v, icon: d.i }); }
    }
    run.relics = run.relics.filter(r => !r.data.dead);
    // estatísticas e conquistas
    const dt = (Date.now() - rs.startT) / 1000;
    run.stats.rounds++;
    run.stats.bestRound = Math.max(run.stats.bestRound, rs.score);
    if (rs.mismatches === 0) M.save.achieve('intocavel');
    if (dt < 25) M.save.achieve('veloz');
    if (rs.score >= 100000) M.save.achieve('milhao');
    if (isBoss) {
      run.stats.bosses++; M.profile.stats.bosses++;
      M.save.achieve('chefe1');
      if (M.profile.stats.bosses >= 10) M.save.achieve('chefe10');
    }
    run.cashout = lines;
    run.rs = null;
    run.phase = 'cashout';
    G.save();
  };

  G.collect = () => {
    const run = M.run;
    const tot = run.cashout.reduce((s, l) => s + l.v, 0);
    G.addMoney(tot);
    run.cashout = null;
    // avança
    const wasBoss = run.round === 2;
    if (wasBoss) {
      if (run.ante === 3) M.save.achieve('circ3');
      if (run.ante === 5) M.save.achieve('circ5');
      if (run.daily && run.ante >= 2) M.save.achieve('diario');
      if (run.ante === 8 && !run.endless) { run.won = true; run.phase = 'victory'; G.save(); return 'victory'; }
      run.ante++; run.round = 0;
      if (run.ante >= 10) M.save.achieve('infinito');
      if (run.ante >= 3 && run.daily) M.save.achieve('diario');
      G.setupAnte();
    } else run.round++;
    G.openShop();
    return 'shop';
  };

  G.continueEndless = () => {
    const run = M.run; run.endless = true; run.ante++; run.round = 0; G.setupAnte(); G.openShop(); G.save();
  };

  /* ---------------- Loja ---------------- */
  G.priceMul = () => (G.hasV('mercador') ? 0.75 : 1) * (M.run.pending.mercadorAtivo ? 0.5 : 1);
  G.price = (c) => Math.max(c === 0 ? 0 : 1, Math.floor(c * G.priceMul()));

  G.rollRarity = (rng, allowLeg) => {
    const x = rng.next();
    if (allowLeg && x < 0.03) return 4;
    if (x < 0.06) return 3;
    if (x < 0.32) return 2;
    return 1;
  };
  G.rollRelic = (rarity, exclude = []) => {
    const rng = G.rng(), run = M.run;
    const owned = run.relics.map(r => r.id);
    const ok = (r) => M.save.isRelicUnlocked(r.id) && !owned.includes(r.id) && !exclude.includes(r.id);
    let pool = M.RELICS.filter(r => r.r === rarity && ok(r));
    if (!pool.length) pool = M.RELICS.filter(ok);
    if (!pool.length) pool = M.RELICS.filter(r => r.r === 1);
    const d = rng.pick(pool);
    const e = rng.next();
    const ed = e < 0.006 ? 'neg' : e < 0.018 ? 'poly' : e < 0.043 ? 'holo' : e < 0.083 ? 'foil' : null;
    return { id: d.id, ed, data: {} };
  };
  G.rollScrollId = () => {
    const rng = G.rng();
    return rng.weighted(M.SCROLLS, s => s.rare ? 0.35 : 1).id;
  };
  G.rollAstroId = () => {
    const rng = G.rng();
    return rng.weighted(M.ASTROS, a => a.rare ? 0.15 : 1).id;
  };
  G.rollCard = () => {
    const rng = G.rng();
    const rank = rng.weighted([1, 2, 3, 4, 5, 6, 7, 8, 9], r => r <= 5 ? 1 : 0.75);
    const enh = rng.chance(0.35) ? rng.pick(Object.keys(M.ENH)) : null;
    const e = rng.next();
    const ed = e < 0.03 ? 'poly' : e < 0.07 ? 'holo' : e < 0.13 ? 'foil' : null;
    return { uid: M.uid(), suit: rng.pick(M.SUIT_KEYS), rank, enh, ed };
  };

  G.shopItem = (exclude) => {
    const rng = G.rng();
    const x = rng.next();
    if (x < 0.62) { const r = G.rollRelic(G.rollRarity(rng, false), exclude); return { kind: 'relic', relic: r, cost: M.relicCost(r) }; }
    let id, g = 0;
    if (x < 0.84) { do id = G.rollScrollId(); while (exclude.includes(id) && g++ < 10); return { kind: 'scroll', id, cost: 3 }; }
    do id = G.rollAstroId(); while (exclude.includes(id) && g++ < 10);
    return { kind: 'astro', id, cost: 3 };
  };
  G.PACKS = {
    arcano: { n: 'Pacote Arcano', i: '📜', size: 3, pick: 1, c: 4, kind: 'scroll', col: '#b46bff', d: 'Escolha 1 de 3 Pergaminhos' },
    arcano_g: { n: 'Pacote Arcano Grande', i: '📚', size: 5, pick: 2, c: 7, kind: 'scroll', col: '#9b4dff', d: 'Escolha 2 de 5 Pergaminhos' },
    celeste: { n: 'Pacote Celeste', i: '🌌', size: 3, pick: 1, c: 4, kind: 'astro', col: '#3cb4ff', d: 'Escolha 1 de 3 Astros' },
    celeste_g: { n: 'Pacote Celeste Grande', i: '🔭', size: 5, pick: 2, c: 7, kind: 'astro', col: '#2a8fff', d: 'Escolha 2 de 5 Astros' },
    cartas: { n: 'Pacote de Cartas', i: '🃏', size: 3, pick: 1, c: 4, kind: 'card', col: '#43e27a', d: 'Escolha 1 de 3 cartas para o baralho' },
    cartas_g: { n: 'Pacote de Cartas Grande', i: '🎴', size: 5, pick: 2, c: 6, kind: 'card', col: '#2fc566', d: 'Escolha 2 de 5 cartas para o baralho' },
    reliq: { n: 'Pacote de Relíquias', i: '🏺', size: 2, pick: 1, c: 7, kind: 'relic', col: '#ff4d6d', d: 'Escolha 1 de 2 Relíquias' },
  };
  G.makePack = (type) => {
    const P = G.PACKS[type], rng = G.rng();
    const opts = []; const ex = [];
    for (let i = 0; i < P.size; i++) {
      if (P.kind === 'scroll') opts.push({ kind: 'scroll', id: G.rollScrollId() });
      else if (P.kind === 'astro') opts.push({ kind: 'astro', id: G.rollAstroId() });
      else if (P.kind === 'card') opts.push({ kind: 'card', card: G.rollCard() });
      else { const r = G.rollRelic(G.rollRarity(rng, true), ex); ex.push(r.id); opts.push({ kind: 'relic', relic: r }); }
    }
    return { type, opts, picks: P.pick };
  };

  G.openShop = () => {
    const run = M.run, rng = G.rng();
    run.phase = 'shop';
    run.pending.mercadorAtivo = run.pending.mercador ? 1 : 0; run.pending.mercador = 0;
    const n = 2 + (G.hasV('abundancia') ? 1 : 0);
    const items = []; const ex = [];
    for (let i = 0; i < n; i++) { const it = G.shopItem(ex); ex.push(it.relic ? it.relic.id : it.id); items.push(it); }
    if (run.pending.rara) { const r = G.rollRelic(3, ex); items.unshift({ kind: 'relic', relic: r, cost: 0, free: 1 }); run.pending.rara = 0; }
    const ptypes = Object.keys(G.PACKS);
    const packs = [0, 1].map(() => {
      const t = rng.weighted(ptypes, t => t.endsWith('_g') ? 0.45 : t === 'reliq' ? 0.6 : 1);
      return { type: t, cost: G.PACKS[t].c };
    });
    if (run.voucherAnte !== run.ante) {
      const avail = M.VOUCHERS.filter(v => !run.vouchers.includes(v.id));
      run.voucherOffer = avail.length ? rng.pick(avail).id : null;
      run.voucherAnte = run.ante;
    }
    run.shop = { items, packs, rerolls: 0, quote: rng.pick(M.QUOTES) };
    G.save();
  };
  G.rerollCost = () => Math.max(0, 5 - (G.hasV('fortuna') ? 2 : 0) + M.run.shop.rerolls);
  G.reroll = () => {
    const run = M.run, c = G.rerollCost();
    if (run.money < c) return false;
    G.addMoney(-c); run.shop.rerolls++;
    const n = 2 + (G.hasV('abundancia') ? 1 : 0); const ex = [];
    run.shop.items = [];
    for (let i = 0; i < n; i++) { const it = G.shopItem(ex); ex.push(it.relic ? it.relic.id : it.id); run.shop.items.push(it); }
    G.save();
    return true;
  };

  G.canAdd = (it) => {
    const run = M.run;
    if (it.kind === 'relic') return it.relic.ed === 'neg' || run.relics.length < G.relicSlots();
    if (it.kind === 'scroll') return run.scrolls.length < run.scrollSlots + (G.hasV('escriba') ? 1 : 0);
    return true;
  };
  G.scrollCap = () => M.run.scrollSlots + (G.hasV('escriba') ? 1 : 0);

  // compra item da loja (índice)
  G.buy = (idx) => {
    const run = M.run, it = run.shop.items[idx];
    if (!it) return 'none';
    const cost = it.free ? 0 : G.price(it.cost);
    if (run.money < cost) return 'money';
    if (it.kind === 'astro') { G.addMoney(-cost); run.shop.items.splice(idx, 1); G.useAstro(it.id); G.save(); return 'ok'; }
    if (!G.canAdd(it)) return 'full';
    G.addMoney(-cost);
    run.shop.items.splice(idx, 1);
    G.addItem(it);
    G.save();
    return 'ok';
  };
  G.addItem = (it) => {
    const run = M.run;
    if (it.kind === 'relic') { run.relics.push(it.relic); M.save.seen('relics', it.relic.id); const st = M.profile.stats; st.maxRelics = Math.max(st.maxRelics || 0, run.relics.length); if (run.relics.length >= 5) M.save.achieve('colecao'); }
    else if (it.kind === 'scroll') { run.scrolls.push({ id: it.id }); M.save.seen('scrolls', it.id); }
    else if (it.kind === 'astro') G.useAstro(it.id);
    else if (it.kind === 'card') run.cards.push(it.card);
  };
  G.buyPack = (idx) => {
    const run = M.run, p = run.shop.packs[idx];
    if (!p || p.bought) return null;
    const cost = G.price(p.cost);
    if (run.money < cost) return null;
    G.addMoney(-cost);
    p.bought = 1;
    G.save();
    return G.makePack(p.type);
  };
  G.buyVoucher = () => {
    const run = M.run, id = run.voucherOffer;
    if (!id) return false;
    const cost = G.price(10);
    if (run.money < cost) return false;
    G.addMoney(-cost);
    run.vouchers.push(id); run.voucherOffer = null;
    M.save.seen('vouchers', id);
    if (id === 'expansao') run.slots++;
    G.save();
    return true;
  };
  G.sellRelic = (i) => {
    const run = M.run, r = run.relics[i];
    if (!r) return;
    G.addMoney(M.sellValue(r));
    run.relics.splice(i, 1);
    G.save();
  };
  G.useAstro = (id) => {
    const run = M.run, a = M.ASTRO[id];
    M.save.seen('astros', id);
    if (a.suit === 'all') M.SUIT_KEYS.forEach(s => run.suitLv[s]++);
    else run.suitLv[a.suit]++;
    run.stats.astros++; M.profile.stats.astros++;
    if (M.profile.stats.astros >= 10) M.save.achieve('astronomo');
    M.save.saveProfile();
  };

  G.leaveShop = () => {
    const run = M.run;
    run.pending.mercadorAtivo = 0;
    run.shop = null;
    run.phase = 'select';
    G.save();
  };

  /* contexto básico para ganchos fora do par */
  G.ctxBasic = () => {
    const run = M.run;
    return {
      run, rs: run.rs, rng: G.rng(),
      chance: (p) => G.rng().next() < p * (G.flag('dado') ? 2 : 1),
      msg: () => { },
      giveScroll: () => { if (run.scrolls.length < G.scrollCap()) { const id = G.rollScrollId(); run.scrolls.push({ id }); M.save.seen('scrolls', id); M.ui && M.ui.renderConsumables(); } },
      giveAstro: () => { const id = G.rollAstroId(); G.useAstro(id); M.fx.announce(`${M.ASTRO[id].i} ${M.ASTRO[id].n}!`, 'blue', 800); },
    };
  };

  /* ---------------- Fim da jornada ---------------- */
  G.endRun = (won) => {
    const run = M.run, P = M.profile, st = P.stats;
    const xp = Math.round(25 * run.ante + 2 * run.stats.pairs + 40 * run.stats.bosses + (won ? 250 : 0) + run.stats.bestCombo * 3);
    st.pairs += run.stats.pairs;
    st.bestAnte = Math.max(st.bestAnte, run.ante);
    st.bestCombo = Math.max(st.bestCombo, run.stats.bestCombo);
    st.bestPair = Math.max(st.bestPair, run.stats.bestPair);
    st.bestRound = Math.max(st.bestRound, run.stats.bestRound);
    st.maxMoney = Math.max(st.maxMoney, run.stats.maxMoney);
    st.mismatches += run.stats.mismatches;
    st.playTime += (Date.now() - run.stats.startT) / 1000;
    if (won) {
      st.wins++;
      P.deckWins[run.deck] = Math.max(P.deckWins[run.deck] || 0, run.stake);
      P.stakeWon = Math.max(P.stakeWon, run.stake);
      M.save.achieve('vitoria');
    }
    if (run.daily) {
      const d = P.daily;
      if (d.date !== M.todayKey()) { d.date = M.todayKey(); d.bestAnte = 0; }
      d.bestAnte = Math.max(d.bestAnte, run.ante); d.played = true;
    }
    const ups = M.save.addXP(xp);
    M.save.saveProfile();
    M.save.clearRun();
    return { xp, ups };
  };
})();
